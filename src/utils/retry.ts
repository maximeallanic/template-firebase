/**
 * Retry utility with exponential backoff for network operations.
 *
 * This utility wraps async functions and automatically retries them on failure
 * with increasing delays between attempts (1s, 2s, 3s by default).
 *
 * @example
 * ```typescript
 * // Basic usage
 * await withRetry(() => submitAnswer(roomCode, playerId, answerIndex));
 *
 * // With custom options
 * await withRetry(
 *   () => submitAnswer(roomCode, playerId, answerIndex),
 *   { maxRetries: 5, baseDelay: 500 }
 * );
 * ```
 */

export interface RetryOptions {
    /**
     * Maximum number of retry attempts before throwing.
     * @default 3
     */
    maxRetries?: number;

    /**
     * Base delay in milliseconds for exponential backoff.
     * The actual delay is: baseDelay * (attempt number)
     * So for baseDelay=1000: 1s, 2s, 3s, etc.
     * @default 1000
     */
    baseDelay?: number;

    /**
     * Optional callback invoked on each retry attempt.
     * Useful for logging or updating UI state.
     */
    onRetry?: (attempt: number, error: unknown) => void;

    /**
     * Optional predicate to determine if an error should be retried.
     * Returns true to retry, false to throw immediately.
     * By default, all errors are retried.
     */
    shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'shouldRetry'>> = {
    maxRetries: 3,
    baseDelay: 1000,
};

/**
 * Executes an async function with automatic retry and exponential backoff.
 *
 * @param fn - The async function to execute and potentially retry
 * @param options - Configuration options for retry behavior
 * @returns The result of the successful function execution
 * @throws The last error if all retry attempts fail
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = DEFAULT_OPTIONS.maxRetries,
        baseDelay = DEFAULT_OPTIONS.baseDelay,
        onRetry,
        shouldRetry,
    } = options;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if we should retry this error
            if (shouldRetry && !shouldRetry(error)) {
                throw error;
            }

            // If this was the last attempt, throw
            if (attempt === maxRetries) {
                throw error;
            }

            // Call retry callback if provided
            if (onRetry) {
                onRetry(attempt, error);
            }

            // Log the retry attempt in development
            if (import.meta.env.DEV) {
                console.warn(
                    `[withRetry] Attempt ${attempt}/${maxRetries} failed, retrying in ${baseDelay * attempt}ms...`,
                    error
                );
            }

            // Wait with exponential backoff before next attempt
            await new Promise(resolve => setTimeout(resolve, baseDelay * attempt));
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError;
}

/**
 * Checks if an error is likely a network error that should be retried.
 * Useful as a shouldRetry predicate.
 */
export function isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (
            message.includes('network') ||
            message.includes('fetch') ||
            message.includes('timeout') ||
            message.includes('connection') ||
            message.includes('offline') ||
            message.includes('unavailable') ||
            message.includes('failed to fetch')
        );
    }
    return false;
}

/**
 * Checks if an error is a Firebase error that should be retried.
 * Retries on transient errors, not on permission/auth errors.
 */
export function isRetryableFirebaseError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        // Don't retry permission or authentication errors
        if (
            message.includes('permission') ||
            message.includes('unauthorized') ||
            message.includes('unauthenticated') ||
            message.includes('forbidden')
        ) {
            return false;
        }

        // Retry network and transient errors
        return (
            isNetworkError(error) ||
            message.includes('internal') ||
            message.includes('temporarily') ||
            message.includes('retry')
        );
    }
    return true; // Default to retrying unknown errors
}
