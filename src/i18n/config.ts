/**
 * i18next Configuration
 * Internationalization setup for the application
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, LANGUAGE_STORAGE_KEY } from './types';

i18n
  // Load translation files from public/locales
  .use(HttpBackend)
  // Detect user language from:
  // 1. localStorage (persisted choice)
  // 2. Browser navigator.language
  // 3. Fallback to default (en)
  .use(LanguageDetector)
  // React bindings
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Default language
    lng: DEFAULT_LANGUAGE,

    // Fallback language if translation is missing
    fallbackLng: DEFAULT_LANGUAGE,

    // Supported languages
    supportedLngs: SUPPORTED_LANGUAGES.map(lang => lang.code),

    // Namespace configuration
    ns: ['translation', 'common', 'analysis', 'errors'],
    defaultNS: 'translation',

    // Debug mode (disabled in production)
    debug: import.meta.env.DEV,

    // Detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],

      // Cache user selection in localStorage
      caches: ['localStorage'],

      // localStorage key
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },

    // Backend options (loading translations)
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Interpolation options
    interpolation: {
      // React already escapes values to prevent XSS
      escapeValue: false,
    },

    // React-specific options
    react: {
      // Suspense mode for lazy loading translations
      useSuspense: true,
    },
  });

export default i18n;
