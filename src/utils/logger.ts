/**
 * Centralized Logging System for WasteDB
 * 
 * Suppresses console logging unless in TEST mode.
 * TEST mode defaults to TRUE in figma-make environment, FALSE in production.
 * Can be explicitly overridden by setting TEST_MODE.
 */

import { isFigmaMake } from './environment';

/**
 * TEST_MODE configuration
 * - Set to true to enable all logging
 * - Set to false to suppress all logging
 * - Set to null to use environment-based default (figma-make = true, production = false)
 * 
 * @example
 * // Enable logging for debugging session
 * import { setTestMode } from './utils/logger';
 * setTestMode(true);
 * 
 * // Disable logging in production
 * import { setTestMode } from './utils/logger';
 * setTestMode(false);
 */
let TEST_MODE: boolean | null = null;

/**
 * Get the current TEST_MODE value
 * If not explicitly set, defaults based on environment
 */
function isTestMode(): boolean {
  if (TEST_MODE !== null) {
    return TEST_MODE;
  }
  // Default: TRUE in figma-make, FALSE in production
  return isFigmaMake();
}

/**
 * Explicitly set TEST_MODE to enable or disable logging
 * 
 * @param mode - true to enable, false to disable, null to use environment default
 */
export function setTestMode(mode: boolean | null): void {
  TEST_MODE = mode;
  if (mode !== null) {
    console.log(`🔧 Logger: TEST_MODE explicitly set to ${mode}`);
  } else {
    console.log(`🔧 Logger: TEST_MODE reset to environment default (${isFigmaMake()})`);
  }
}

/**
 * Get current TEST_MODE status
 */
export function getTestMode(): boolean {
  return isTestMode();
}

/**
 * Standard console.log wrapper
 * Only logs if TEST_MODE is enabled
 */
export function log(...args: any[]): void {
  if (isTestMode()) {
    console.log(...args);
  }
}

/**
 * Error logging - always logs regardless of TEST_MODE
 * Errors should always be visible for debugging
 */
export function error(...args: any[]): void {
  console.error(...args);
}

/**
 * Warning logging - only logs if TEST_MODE is enabled
 */
export function warn(...args: any[]): void {
  if (isTestMode()) {
    console.warn(...args);
  }
}

/**
 * Info logging - only logs if TEST_MODE is enabled
 */
export function info(...args: any[]): void {
  if (isTestMode()) {
    console.info(...args);
  }
}

/**
 * Debug logging - only logs if TEST_MODE is enabled
 */
export function debug(...args: any[]): void {
  if (isTestMode()) {
    console.debug(...args);
  }
}

/**
 * Table logging - only logs if TEST_MODE is enabled
 */
export function table(data: any, columns?: string[]): void {
  if (isTestMode()) {
    console.table(data, columns);
  }
}

/**
 * Group logging - only logs if TEST_MODE is enabled
 */
export function group(label: string): void {
  if (isTestMode()) {
    console.group(label);
  }
}

/**
 * Grouped collapsed logging - only logs if TEST_MODE is enabled
 */
export function groupCollapsed(label: string): void {
  if (isTestMode()) {
    console.groupCollapsed(label);
  }
}

/**
 * End group logging - only logs if TEST_MODE is enabled
 */
export function groupEnd(): void {
  if (isTestMode()) {
    console.groupEnd();
  }
}

/**
 * Time tracking - only logs if TEST_MODE is enabled
 */
export function time(label: string): void {
  if (isTestMode()) {
    console.time(label);
  }
}

/**
 * Time tracking end - only logs if TEST_MODE is enabled
 */
export function timeEnd(label: string): void {
  if (isTestMode()) {
    console.timeEnd(label);
  }
}

/**
 * Trace logging - only logs if TEST_MODE is enabled
 */
export function trace(...args: any[]): void {
  if (isTestMode()) {
    console.trace(...args);
  }
}

/**
 * Display current logger configuration
 */
export function loggerInfo(): void {
  console.log('🔍 Logger Configuration:', {
    TEST_MODE: TEST_MODE === null ? 'auto (environment-based)' : TEST_MODE,
    effectiveMode: isTestMode(),
    environment: isFigmaMake() ? 'figma-make' : 'production',
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
  });
}

// Export a namespace for easier imports
export const logger = {
  log,
  error,
  warn,
  info,
  debug,
  table,
  group,
  groupCollapsed,
  groupEnd,
  time,
  timeEnd,
  trace,
  setTestMode,
  getTestMode,
  loggerInfo,
};

// Auto-log configuration on first import (only in TEST_MODE)
if (isTestMode() && typeof window !== 'undefined') {
  console.log(
    `%c🔧 WasteDB Logger Initialized`,
    'background: #e6beb5; color: #211f1c; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
  );
  console.log(`   TEST_MODE: ${isTestMode()} (${TEST_MODE === null ? 'auto' : 'explicit'})`);
  console.log(`   Environment: ${isFigmaMake() ? 'figma-make' : 'production'}`);
  console.log(`   To change: import { setTestMode } from './utils/logger'; setTestMode(true/false);`);
  console.log('');
}
