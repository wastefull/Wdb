/**
 * Environment Detection Utilities
 * 
 * Detects whether the app is running in Figma Make (development/testing)
 * or in production (deployed environment).
 */

/**
 * Checks if the app is running in Figma Make environment
 * 
 * @returns true if running in Figma Make, false otherwise
 */
export function isFigmaMake(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const hostname = window.location.hostname;
  
  // Figma Make typically runs on:
  // - make.figma.com
  // - *.figma.io
  // - *.figma.site (iframe previews)
  // - localhost (during local development)
  return (
    hostname.includes('figma.com') ||
    hostname.includes('figma.io') ||
    hostname.includes('figma.site') ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  );
}

/**
 * Checks if the app is running in production
 * 
 * @returns true if running in production, false otherwise
 */
export function isProduction(): boolean {
  return !isFigmaMake();
}

/**
 * Gets the current environment name
 * 
 * @returns 'figma-make' or 'production'
 */
export function getEnvironment(): 'figma-make' | 'production' {
  return isFigmaMake() ? 'figma-make' : 'production';
}

/**
 * Log environment info to console (useful for debugging)
 */
export function logEnvironmentInfo(): void {
  if (typeof window === 'undefined') return;
  
  console.log('🌍 Environment Detection:', {
    environment: getEnvironment(),
    isFigmaMake: isFigmaMake(),
    isProduction: isProduction(),
    hostname: window.location.hostname,
    origin: window.location.origin,
  });
}
