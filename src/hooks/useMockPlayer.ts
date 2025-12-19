/**
 * Hooks for Mock Player Context
 * Separated from context file to satisfy react-refresh/only-export-components rule
 */

import { useContext } from 'react';
import { MockPlayerContext, type MockPlayerContextValue } from '../contexts/mockPlayerContextDef';

/**
 * Hook to access mock player context
 * Must be used within a MockPlayerProvider
 */
export function useMockPlayer(): MockPlayerContextValue {
    const context = useContext(MockPlayerContext);
    if (!context) {
        throw new Error('useMockPlayer must be used within a MockPlayerProvider');
    }
    return context;
}

/**
 * Optional hook that returns null if not in provider
 * Useful for components that might be outside the provider
 */
export function useMockPlayerOptional(): MockPlayerContextValue | null {
    return useContext(MockPlayerContext);
}
