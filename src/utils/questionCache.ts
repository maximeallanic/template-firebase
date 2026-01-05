/**
 * LRU (Least Recently Used) Cache for Firestore questions.
 * Reduces Firestore reads by caching frequently accessed questions.
 *
 * Features:
 * - Maximum size limit with automatic eviction
 * - TTL (Time To Live) for cache entries
 * - Type-safe generic implementation
 */

interface CacheEntry<T> {
    value: T;
    timestamp: number;
}

/**
 * Generic LRU Cache implementation.
 * Uses Map's insertion order to track access recency.
 */
export class LRUCache<K, V> {
    private cache: Map<K, CacheEntry<V>>;
    private readonly maxSize: number;
    private readonly ttlMs: number;

    /**
     * Creates a new LRU cache.
     * @param maxSize - Maximum number of entries (default: 100)
     * @param ttlMs - Time to live in milliseconds (default: 1 hour)
     */
    constructor(maxSize = 100, ttlMs = 3600000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
    }

    /**
     * Gets a value from the cache.
     * Returns undefined if not found or expired.
     * Moves the entry to the end (most recently used) on access.
     */
    get(key: K): V | undefined {
        const entry = this.cache.get(key);

        if (!entry) {
            return undefined;
        }

        // Check if entry has expired
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return undefined;
        }

        // Move to end (most recently used) by re-inserting
        this.cache.delete(key);
        this.cache.set(key, entry);

        return entry.value;
    }

    /**
     * Sets a value in the cache.
     * Evicts the least recently used entry if at capacity.
     */
    set(key: K, value: V): void {
        // If key already exists, delete it first to update position
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        // Evict oldest entry if at capacity
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now(),
        });
    }

    /**
     * Checks if a key exists in the cache and is not expired.
     */
    has(key: K): boolean {
        const entry = this.cache.get(key);

        if (!entry) {
            return false;
        }

        // Check if entry has expired
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Removes a specific key from the cache.
     */
    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    /**
     * Clears all entries from the cache.
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Returns the current number of entries in the cache.
     */
    get size(): number {
        return this.cache.size;
    }

    /**
     * Removes all expired entries from the cache.
     * Useful for periodic cleanup.
     */
    purgeExpired(): number {
        const now = Date.now();
        let purgedCount = 0;

        // Use Array.from to avoid iterator issues
        const entries = Array.from(this.cache.entries());
        for (const [key, entry] of entries) {
            if (now - entry.timestamp > this.ttlMs) {
                this.cache.delete(key);
                purgedCount++;
            }
        }

        return purgedCount;
    }

    /**
     * Gets cache statistics for debugging/monitoring.
     */
    getStats(): { size: number; maxSize: number; ttlMs: number } {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            ttlMs: this.ttlMs,
        };
    }
}

/**
 * Cache key generator for questions.
 * Creates a unique key based on phase and seen question IDs.
 */
export function generateQuestionCacheKey(
    phase: string,
    seenQuestionIds: Set<string>,
    count: number
): string {
    // Sort seen IDs for consistent key generation
    const seenArray = Array.from(seenQuestionIds).sort();
    const seenHash = seenArray.length > 0
        ? seenArray.slice(0, 10).join(',') // Use first 10 for key (performance)
        : 'none';

    return `${phase}:${count}:${seenHash}`;
}

/**
 * Creates a typed question cache instance.
 * Used to avoid circular dependencies with questionStorageService.
 */
export function createQuestionCache<T>(): LRUCache<string, T[]> {
    return new LRUCache<string, T[]>(100, 3600000); // 100 entries, 1 hour TTL
}

/**
 * Creates a typed cache for individual questions by ID.
 */
export function createQuestionByIdCache<T>(): LRUCache<string, T> {
    return new LRUCache<string, T>(200, 3600000); // 200 entries, 1 hour TTL
}
