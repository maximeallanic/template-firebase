import { useState, useCallback, useEffect } from 'react';
import { audioService } from '../services/audioService';

const STORAGE_KEY = 'spicy_sound_enabled';
const VOLUME_STORAGE_KEY = 'spicy_sound_volume';
const DEFAULT_VOLUME = 0.7;

interface UseSoundSettingsResult {
  /** Whether sound is currently enabled */
  soundEnabled: boolean;
  /** Current volume level (0-1) */
  volume: number;
  /** Toggle sound on/off */
  toggleSound: () => void;
  /** Explicitly set sound state */
  setSound: (enabled: boolean) => void;
  /** Set volume level (0-1) */
  setVolume: (volume: number) => void;
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

  const [volume, setVolumeState] = useState(() => {
    try {
      const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
      if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          return parsed;
        }
      }
      return DEFAULT_VOLUME;
    } catch {
      return DEFAULT_VOLUME;
    }
  });

  // Sync with audioService on mount and state change
  useEffect(() => {
    audioService.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    audioService.setMasterVolume(volume);
  }, [volume]);

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

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(clampedVolume));
    } catch {
      // Ignore storage errors
    }
    audioService.setMasterVolume(clampedVolume);
  }, []);

  return {
    soundEnabled,
    volume,
    toggleSound,
    setSound,
    setVolume,
  };
}
