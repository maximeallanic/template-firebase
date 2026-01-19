/**
 * Platform Detection Service
 * Provides utilities to detect if running in native app or web browser.
 */
import { Capacitor } from '@capacitor/core';

export type Platform = 'ios' | 'android' | 'web';

/**
 * Check if running as a native app (iOS or Android)
 */
export const isNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Get current platform
 */
export const getPlatform = (): Platform => {
  return Capacitor.getPlatform() as Platform;
};

/**
 * Check if running on iOS
 */
export const isIOS = (): boolean => {
  return getPlatform() === 'ios';
};

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => {
  return getPlatform() === 'android';
};

/**
 * Check if running in web browser
 */
export const isWeb = (): boolean => {
  return getPlatform() === 'web';
};
