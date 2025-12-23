import { useState, useCallback, useEffect } from 'react';
import { audioService } from '../services/audioService';

const STORAGE_KEY = 'spicy_sound_enabled';

interface UseSoundSettingsResult {
  /** Whether sound is currently enabled */
  soundEnabled: boolean;
  /** Toggle sound on/off */
  toggleSound: () => void;
  /** Explicitly set sound state */
  setSound: (enabled: boolean) => void;
}

/**
 * Hook to manage sound settings with localStorage persistence.
 * Syncs with audioService for actual sound control.
 */
export function useSoundSettings(): UseSoundSettingsResult {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Default to true if not set
      return stored !== 'false';
    } catch {
      return true;
    }
  });

  // Sync with audioService on mount and state change
  useEffect(() => {
    audioService.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const setSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // Ignore storage errors
    }
    audioService.setEnabled(enabled);
  }, []);

  const toggleSound = useCallback(() => {
    setSound(!soundEnabled);
  }, [soundEnabled, setSound]);

  return {
    soundEnabled,
    toggleSound,
    setSound,
  };
}
