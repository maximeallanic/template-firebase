/**
 * App Lifecycle Hook
 * Handles background/foreground transitions for Firebase connection management.
 */
import { useEffect, useCallback, useRef } from 'react';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { isNative } from '../services/platformService';

interface UseAppLifecycleOptions {
  onResume?: () => void;
  onPause?: () => void;
}

export function useAppLifecycle(options: UseAppLifecycleOptions = {}): void {
  const { onResume, onPause } = options;
  const listenerRef = useRef<PluginListenerHandle | null>(null);

  const handleResume = useCallback(() => {
    onResume?.();
  }, [onResume]);

  const handlePause = useCallback(() => {
    onPause?.();
  }, [onPause]);

  useEffect(() => {
    if (!isNative()) return;

    let isMounted = true;

    // Set up the listener asynchronously
    const setupListener = async () => {
      try {
        const handle = await App.addListener('appStateChange', ({ isActive }) => {
          // Wrap callbacks in try-catch to prevent unhandled rejections
          try {
            if (isActive) {
              handleResume();
            } else {
              handlePause();
            }
          } catch (callbackError) {
            console.warn('App lifecycle callback error:', callbackError);
          }
        });

        // Only store handle if component is still mounted
        if (isMounted) {
          listenerRef.current = handle;
        } else {
          // Component unmounted while we were setting up - clean up immediately
          handle.remove();
        }
      } catch (error) {
        console.debug('Failed to add app state listener:', error);
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      // Clean up listener on unmount
      listenerRef.current?.remove();
    };
  }, [handleResume, handlePause]);
}
