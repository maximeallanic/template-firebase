import * as functionsLogger from 'firebase-functions/logger';

/**
 * Production-enabled logger for Firebase Functions
 * Uses structured logging via firebase-functions/logger in production
 * Falls back to console in development for better local debugging
 */

const isProduction = process.env.NODE_ENV === 'production' || process.env.K_SERVICE;

export const logger = {
  debug: (...args: unknown[]) => {
    if (isProduction) {
      functionsLogger.debug(...args);
    } else {
      console.debug('[DEBUG]', ...args);
    }
  },

  info: (...args: unknown[]) => {
    if (isProduction) {
      functionsLogger.info(...args);
    } else {
      console.info('[INFO]', ...args);
    }
  },

  log: (...args: unknown[]) => {
    if (isProduction) {
      functionsLogger.log(...args);
    } else {
      console.log('[LOG]', ...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (isProduction) {
      functionsLogger.warn(...args);
    } else {
      console.warn('[WARN]', ...args);
    }
  },

  error: (...args: unknown[]) => {
    if (isProduction) {
      functionsLogger.error(...args);
    } else {
      console.error('[ERROR]', ...args);
    }
  },

  /**
   * Write structured log with custom severity and labels
   * Only available in production (Cloud Logging)
   */
  write: (entry: functionsLogger.LogEntry) => {
    if (isProduction) {
      functionsLogger.write(entry);
    } else {
      console.log(`[${entry.severity || 'INFO'}]`, entry.message, entry);
    }
  },
};

export default logger;
