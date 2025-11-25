/**
 * Context-Specific Logger Factories for WasteDB
 *
 * Provides scoped loggers for different domains in the application.
 * All loggers respect the TEST_MODE setting in the core logger.
 *
 * Usage:
 * import { materialsLogger } from '../utils/loggerFactories';
 * materialsLogger.info('Loading materials...');
 *
 * Console output: [Materials] Loading materials...
 */

import { logger } from "./logger";

/**
 * Creates a scoped logger with a prefix for all log messages
 * @param scope - The scope/domain name (e.g., 'Materials', 'Auth')
 * @returns Logger object with scoped methods
 */
export const createScopedLogger = (scope: string) => ({
  log: (...args: any[]) => logger.log(`[${scope}]`, ...args),
  error: (...args: any[]) => logger.error(`[${scope}]`, ...args),
  warn: (...args: any[]) => logger.warn(`[${scope}]`, ...args),
  info: (...args: any[]) => logger.info(`[${scope}]`, ...args),
  debug: (...args: any[]) => logger.debug(`[${scope}]`, ...args),
  group: (label: string) => logger.group(`[${scope}] ${label}`),
  groupCollapsed: (label: string) =>
    logger.groupCollapsed(`[${scope}] ${label}`),
  groupEnd: () => logger.groupEnd(),
  time: (label: string) => logger.time(`[${scope}] ${label}`),
  timeEnd: (label: string) => logger.timeEnd(`[${scope}] ${label}`),
  table: (data: any, columns?: string[]) => logger.table(data, columns),
});

/**
 * Pre-configured loggers for major application domains
 */

// Materials domain - CRUD operations, data loading, sync
export const materialsLogger = createScopedLogger("Materials");

// Authentication domain - sign in, sign out, session management
export const authLogger = createScopedLogger("Auth");

// Sync domain - localStorage ↔ Supabase sync operations
export const syncLogger = createScopedLogger("Sync");

// API domain - HTTP requests to backend
export const apiLogger = createScopedLogger("API");

// Navigation domain - view changes, routing
export const navigationLogger = createScopedLogger("Navigation");

// Articles domain - article CRUD, management
export const articlesLogger = createScopedLogger("Articles");

// Sources domain - source library operations
export const sourcesLogger = createScopedLogger("Sources");

// Submissions domain - material/article submissions, reviews
export const submissionsLogger = createScopedLogger("Submissions");

// User management domain - roles, permissions
export const userLogger = createScopedLogger("User");

// Scientific data domain - calculations, scientific editor
export const scientificLogger = createScopedLogger("Scientific");

// Whitepapers domain - whitepaper loading, sync
export const whitepaperLogger = createScopedLogger("Whitepaper");

// Accessibility domain - accessibility controls
export const a11yLogger = createScopedLogger("A11y");

// Email domain - email notifications, sending
export const emailLogger = createScopedLogger("Email");

/**
 * Export all loggers as a namespace for convenience
 */
export const scopedLoggers = {
  materials: materialsLogger,
  auth: authLogger,
  sync: syncLogger,
  api: apiLogger,
  navigation: navigationLogger,
  articles: articlesLogger,
  sources: sourcesLogger,
  submissions: submissionsLogger,
  user: userLogger,
  scientific: scientificLogger,
  whitepaper: whitepaperLogger,
  a11y: a11yLogger,
  email: emailLogger,
};
