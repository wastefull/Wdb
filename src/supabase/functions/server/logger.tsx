/**
 * Simple logger for Supabase Edge Functions
 *
 * This is a standalone logger that doesn't depend on frontend utilities.
 * Edge Functions run in Deno and can't access the frontend environment module.
 */

export const logger = {
  log: (...args: unknown[]) => console.log("[WDB]", ...args),
  info: (...args: unknown[]) => console.info("[WDB]", ...args),
  warn: (...args: unknown[]) => console.warn("[WDB]", ...args),
  error: (...args: unknown[]) => console.error("[WDB]", ...args),
  debug: (...args: unknown[]) => console.debug("[WDB]", ...args),
};

export default logger;
