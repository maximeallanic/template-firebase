import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UseAppInstallResult {
  /** True if the app is running as an installed PWA */
  isInstalled: boolean;
  /** True if we can prompt the user to install (browser supports it and not already installed) */
  canInstall: boolean;
  /** Call this to trigger the native install prompt */
  promptInstall: () => Promise<boolean>;
  /** True if the user has dismissed our install banner */
  isDismissed: boolean;
  /** Call this to dismiss the install banner */
  dismiss: () => void;
}

const DISMISS_KEY = 'spicy_install_dismissed';

export function useAppInstall(): UseAppInstallResult {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Check if already running as installed PWA
    const checkInstalled = () => {
      // Check display-mode for Android/Desktop PWA
      const standaloneQuery = window.matchMedia('(display-mode: standalone)');
      // Check iOS Safari standalone
      const isIOSStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

      return standaloneQuery.matches || isIOSStandalone;
    };

    setIsInstalled(checkInstalled());

    // Listen for display-mode changes
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    standaloneQuery.addEventListener('change', handleChange);

    // Capture the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevent the mini-infobar from appearing on mobile
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      standaloneQuery.removeEventListener('change', handleChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to prompt install:', error);
      return false;
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // Ignore storage errors
    }
  }, []);

  return {
    isInstalled,
    canInstall: !isInstalled && deferredPrompt !== null,
    promptInstall,
    isDismissed,
    dismiss,
  };
}
