/**
 * Transform Loader Utility
 * Provides access to transform definitions
 */

import { transformsData, type Transform, type TransformsData } from '../data/transforms';

/**
 * Get transforms synchronously
 * No async needed since we're using a TypeScript module
 */
export function getTransforms(): TransformsData {
  return transformsData;
}

/**
 * Load transforms (kept for backwards compatibility)
 * Returns a resolved promise with transforms data
 */
export async function loadTransforms(): Promise<TransformsData> {
  return Promise.resolve(transformsData);
}

// Re-export types
export type { Transform, TransformsData };
