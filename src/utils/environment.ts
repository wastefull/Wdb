/**
 * Environment Detection Utilities
 *
 * Detects whether the app is running in development (localhost)
 * or in production (Cloudflare deployment).
 *
 * Stack: Cloudflare Pages + Supabase + GitHub Actions
 */

/**
 * Checks if the app is running in development environment
 *
 * @returns true if running locally, false otherwise
 */
export function isDevelopment(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const hostname = window.location.hostname;

  // Development runs on localhost
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * @deprecated Use isDevelopment() instead. Kept for backward compatibility.
 */
export function isFigmaMake(): boolean {
  return isDevelopment();
}

/**
 * Checks if the app is running in production
 *
 * @returns true if running in production (Cloudflare), false otherwise
 */
export function isProduction(): boolean {
  return !isDevelopment();
}

/**
 * Gets the current environment name
 *
 * @returns 'development' or 'production'
 */
export function getEnvironment(): "development" | "production" {
  return isDevelopment() ? "development" : "production";
}

/**
 * Log environment info to console (useful for debugging)
 */
export function logEnvironmentInfo(): void {
  if (typeof window === "undefined") return;

  console.log("🌍 Environment Detection:", {
    environment: getEnvironment(),
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    hostname: window.location.hostname,
    origin: window.location.origin,
  });
}
