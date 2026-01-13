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

    // Set up the listener asynchronously
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        handleResume();
      } else {
        handlePause();
      }
    }).then((handle) => {
      listenerRef.current = handle;
    });

    return () => {
      // Clean up listener on unmount
      listenerRef.current?.remove();
    };
  }, [handleResume, handlePause]);
}
