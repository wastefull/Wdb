/**
 * WasteDB Source Library
 *
 * Central repository of academic papers, reports, and datasets used for
 * scientific parameter validation. Each source includes metadata for proper
 * citation and weighted confidence calculations.
 *
 * Source weights per methodology whitepaper:
 * - Peer-reviewed: 1.0
 * - Government/International: 0.9
 * - Industrial/LCA: 0.7
 * - NGO/Nonprofit: 0.6
 * - Internal/Unpublished: 0.3
 *
 * NOTE: This library has been cleared of sample/placeholder data.
 * All sources should be added with verified DOIs and accurate metadata.
 */

export interface Source {
  id: string;
  title: string;
  authors?: string;
  year?: number;
  doi?: string;
  url?: string;
  weight?: number;
  type: "peer-reviewed" | "government" | "industrial" | "ngo" | "internal";
  abstract?: string;
  tags?: string[]; // e.g., ['cardboard', 'paper', 'recyclability', 'composting']
  pdfFileName?: string; // Filename of uploaded PDF in Supabase Storage
  is_open_access?: boolean; // Open Access status (from Unpaywall API or manual override)
  oa_status?: string | null; // OA status: 'gold', 'green', 'hybrid', 'bronze', 'closed'
  best_oa_url?: string | null; // Best OA location URL (if available)
  manual_oa_override?: boolean; // True if is_open_access was manually set by admin (not from Unpaywall)
  citation_count?: number; // Number of citations at entry time (from CrossRef is-referenced-by-count)
}

// Empty source library - add verified sources only
export const SOURCE_LIBRARY: Source[] = [];

/**
 * Helper function to get sources by tag
 */
export function getSourcesByTag(tag: string): Source[] {
  return SOURCE_LIBRARY.filter((source) =>
    source.tags?.includes(tag.toLowerCase())
  );
}

/**
 * Helper function to get source by ID
 */
export function getSourceById(id: string): Source | undefined {
  return SOURCE_LIBRARY.find((source) => source.id === id);
}

/**
 * Helper function to get sources by material
 */
export function getSourcesByMaterial(materialName: string): Source[] {
  const searchTerm = materialName.toLowerCase();
  return SOURCE_LIBRARY.filter((source) =>
    source.tags?.some(
      (tag) => tag.includes(searchTerm) || searchTerm.includes(tag)
    )
  );
}

/**
 * Get weighted average for source weights
 */
export function calculateWeightedMean(
  values: number[],
  sources: Source[]
): number {
  if (values.length !== sources.length) {
    throw new Error("Values and sources arrays must have the same length");
  }

  const weights = sources.map((s) => s.weight || 1.0);
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  const weightedSum = values.reduce((sum, val, i) => sum + val * weights[i], 0);

  return weightedSum / weightSum;
}
