/**
 * Test Type Definitions
 *
 * Shared type definitions for the test suite.
 */

import { publicAnonKey } from "../../utils/supabase/info";

export interface Test {
  id: string;
  name: string;
  description: string;
  phase: string;
  category: string;
  testFn: () => Promise<{ success: boolean; message: string }>;
}

/**
 * Get headers for authenticated API requests in tests.
 * Uses the dual-header pattern: Authorization with anon key, X-Session-Token with user token.
 */
export function getAuthHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${publicAnonKey}`,
    "X-Session-Token": accessToken,
    "Content-Type": "application/json",
  };
}

/**
 * Get headers for public API requests (no auth required).
 */
export function getPublicHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${publicAnonKey}`,
    "Content-Type": "application/json",
  };
}
