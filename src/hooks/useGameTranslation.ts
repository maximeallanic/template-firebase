/**
 * Game Translation Hook
 * Provides easy access to game-specific translations with proper namespace handling
 */

import { useTranslation } from 'react-i18next';
import type { PhaseStatus, PhaseInfo } from '../types/gameTypes';

/**
 * Hook for accessing game translations with commonly used namespaces
 */
export function useGameTranslation() {
  const { t, i18n } = useTranslation(['game-ui', 'game-phases', 'common', 'game-loading']);

  return {
    t,
    i18n,
    currentLanguage: i18n.language,
    changeLanguage: i18n.changeLanguage,
  };
}

/**
 * Hook specifically for phase-related translations
 */
export function usePhaseTranslation() {
  const { t, i18n } = useTranslation('game-phases');

  /**
   * Get translated phase info for a specific phase
   */
  const getPhaseInfo = (phase: PhaseStatus): PhaseInfo => ({
    name: t(`phases.${phase}.name`),
    subtitle: t(`phases.${phase}.subtitle`),
    shortName: t(`phases.${phase}.shortName`),
  });

  /**
   * Get all translated phase names
   */
  const getAllPhaseNames = (): Record<PhaseStatus, PhaseInfo> => ({
    lobby: getPhaseInfo('lobby'),
    phase1: getPhaseInfo('phase1'),
    phase2: getPhaseInfo('phase2'),
    phase3: getPhaseInfo('phase3'),
    phase4: getPhaseInfo('phase4'),
    phase5: getPhaseInfo('phase5'),
    victory: getPhaseInfo('victory'),
  });

  return {
    t,
    i18n,
    getPhaseInfo,
    getAllPhaseNames,
    currentLanguage: i18n.language,
  };
}

/**
 * Hook for loading message translations
 */
export function useLoadingMessages() {
  const { t, i18n } = useTranslation('game-loading');

  /**
   * Get all loading messages as an array
   */
  const getMessages = (): string[] => {
    const messages = t('messages', { returnObjects: true });
    if (Array.isArray(messages)) {
      return messages.filter((m): m is string => typeof m === 'string');
    }
    return [];
  };

  return {
    t,
    i18n,
    getMessages,
    generationTitle: t('generation.title'),
    errorTitle: t('generation.error.title'),
    retryButton: t('generation.error.retry'),
  };
}

/**
 * Hook for lobby translations
 */
export function useLobbyTranslation() {
  const { t, i18n } = useTranslation(['lobby', 'common']);

  return {
    t,
    i18n,
    currentLanguage: i18n.language,
  };
}

/**
 * Hook for home page translations
 */
export function useHomeTranslation() {
  const { t, i18n } = useTranslation(['home', 'common']);

  return {
    t,
    i18n,
    currentLanguage: i18n.language,
  };
}
