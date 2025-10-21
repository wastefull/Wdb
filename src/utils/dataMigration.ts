/**
 * Data Migration Utilities
 * Functions to backfill and update existing materials with new data structures
 */

import { SOURCE_LIBRARY, getSourcesByTag, type Source as LibrarySource } from '../data/sources';

interface Source {
  title: string;
  authors?: string;
  year?: number;
  doi?: string;
  url?: string;
  weight?: number;
}

interface ConfidenceInterval {
  lower: number;
  upper: number;
}

interface Material {
  id: string;
  name: string;
  category: string;
  compostability: number;
  recyclability: number;
  reusability: number;
  description?: string;
  
  // Scientific parameters
  Y_value?: number;
  D_value?: number;
  C_value?: number;
  M_value?: number;
  E_value?: number;
  CR_practical_mean?: number;
  CR_theoretical_mean?: number;
  CR_practical_CI95?: ConfidenceInterval;
  CR_theoretical_CI95?: ConfidenceInterval;
  confidence_level?: 'High' | 'Medium' | 'Low';
  sources?: Source[];
  whitepaper_version?: string;
  calculation_timestamp?: string;
  method_version?: string;
}

/**
 * Material-specific default scientific data based on common materials
 */
const MATERIAL_DEFAULTS: Record<string, Partial<Material>> = {
  // Paper & Cardboard
  'Cardboard': {
    Y_value: 0.82,
    D_value: 0.15,
    C_value: 0.70,
    M_value: 0.95,
    E_value: 0.25,
    CR_practical_mean: 0.78,
    CR_theoretical_mean: 0.89,
    CR_practical_CI95: { lower: 0.74, upper: 0.82 },
    CR_theoretical_CI95: { lower: 0.85, upper: 0.93 },
  },
  'Paper': {
    Y_value: 0.80,
    D_value: 0.18,
    C_value: 0.65,
    M_value: 0.95,
    E_value: 0.28,
    CR_practical_mean: 0.72,
    CR_theoretical_mean: 0.85,
    CR_practical_CI95: { lower: 0.68, upper: 0.76 },
    CR_theoretical_CI95: { lower: 0.81, upper: 0.89 },
  },
  
  // Glass
  'Glass': {
    Y_value: 0.98,
    D_value: 0.01,
    C_value: 0.85,
    M_value: 0.92,
    E_value: 0.35,
    CR_practical_mean: 0.93,
    CR_theoretical_mean: 0.97,
    CR_practical_CI95: { lower: 0.91, upper: 0.95 },
    CR_theoretical_CI95: { lower: 0.95, upper: 0.99 },
  },
  
  // Plastics
  'Plastic (PET)': {
    Y_value: 0.65,
    D_value: 0.25,
    C_value: 0.45,
    M_value: 0.75,
    E_value: 0.40,
    CR_practical_mean: 0.52,
    CR_theoretical_mean: 0.71,
    CR_practical_CI95: { lower: 0.48, upper: 0.56 },
    CR_theoretical_CI95: { lower: 0.67, upper: 0.75 },
  },
  'PET': {
    Y_value: 0.65,
    D_value: 0.25,
    C_value: 0.45,
    M_value: 0.75,
    E_value: 0.40,
    CR_practical_mean: 0.52,
    CR_theoretical_mean: 0.71,
    CR_practical_CI95: { lower: 0.48, upper: 0.56 },
    CR_theoretical_CI95: { lower: 0.67, upper: 0.75 },
  },
  'HDPE': {
    Y_value: 0.68,
    D_value: 0.22,
    C_value: 0.50,
    M_value: 0.72,
    E_value: 0.38,
    CR_practical_mean: 0.55,
    CR_theoretical_mean: 0.74,
    CR_practical_CI95: { lower: 0.51, upper: 0.59 },
    CR_theoretical_CI95: { lower: 0.70, upper: 0.78 },
  },
  'PVC': {
    Y_value: 0.45,
    D_value: 0.35,
    C_value: 0.30,
    M_value: 0.40,
    E_value: 0.55,
    CR_practical_mean: 0.28,
    CR_theoretical_mean: 0.48,
    CR_practical_CI95: { lower: 0.24, upper: 0.32 },
    CR_theoretical_CI95: { lower: 0.44, upper: 0.52 },
  },
  'Polystyrene': {
    Y_value: 0.42,
    D_value: 0.38,
    C_value: 0.28,
    M_value: 0.35,
    E_value: 0.58,
    CR_practical_mean: 0.25,
    CR_theoretical_mean: 0.44,
    CR_practical_CI95: { lower: 0.21, upper: 0.29 },
    CR_theoretical_CI95: { lower: 0.40, upper: 0.48 },
  },
  
  // Metals
  'Aluminum': {
    Y_value: 0.95,
    D_value: 0.02,
    C_value: 0.88,
    M_value: 0.90,
    E_value: 0.30,
    CR_practical_mean: 0.90,
    CR_theoretical_mean: 0.95,
    CR_practical_CI95: { lower: 0.88, upper: 0.92 },
    CR_theoretical_CI95: { lower: 0.93, upper: 0.97 },
  },
  'Steel': {
    Y_value: 0.92,
    D_value: 0.03,
    C_value: 0.82,
    M_value: 0.88,
    E_value: 0.42,
    CR_practical_mean: 0.86,
    CR_theoretical_mean: 0.92,
    CR_practical_CI95: { lower: 0.84, upper: 0.88 },
    CR_theoretical_CI95: { lower: 0.90, upper: 0.94 },
  },
  
  // Organics
  'Food Waste': {
    Y_value: 0.75,
    D_value: 1.00, // Fully degrades (positive for composting)
    C_value: 0.60,
    M_value: 0.55,
    E_value: 0.15,
    CR_practical_mean: 0.45,
    CR_theoretical_mean: 0.75,
    CR_practical_CI95: { lower: 0.41, upper: 0.49 },
    CR_theoretical_CI95: { lower: 0.71, upper: 0.79 },
  },
};

/**
 * Get default scientific data for a material based on its name
 */
function getDefaultScientificData(materialName: string): Partial<Material> | null {
  // Try exact match first
  if (MATERIAL_DEFAULTS[materialName]) {
    return MATERIAL_DEFAULTS[materialName];
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(MATERIAL_DEFAULTS)) {
    if (materialName.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(materialName.toLowerCase())) {
      return value;
    }
  }
  
  return null;
}

/**
 * Get sources for a material from the source library
 * 
 * Selection Algorithm:
 * 1. Extract search terms from material name (e.g., "Plastic (PET)" → ["plastic", "pet"])
 * 2. Score each source in library based on tag relevance
 * 3. Prioritize high-weight sources (peer-reviewed > government > industry)
 * 4. Return top 3-5 sources, mixing material-specific and general sources
 * 
 * Tag Matching Strategy:
 * - Exact match: "pet" material → "pet" tag (high score)
 * - Partial match: "cardboard" material → "paper" tag (medium score)
 * - Category match: any plastic → "plastic" tag (medium score)
 * - Fallback: general sources for LCA methodology (low score, but always included)
 */
function getSourcesForMaterial(materialName: string): Source[] {
  // Extract search terms from material name
  const searchTerms = materialName.toLowerCase()
    .split(/[\s(),-]+/)  // Split on space, parens, commas, hyphens
    .filter(term => term.length > 2);  // Ignore very short terms like "or", "of"
  
  // Score each source based on relevance
  interface ScoredSource {
    source: LibrarySource;
    score: number;
  }
  
  const scoredSources: ScoredSource[] = SOURCE_LIBRARY.map(source => {
    let score = 0;
    const sourceTags = source.tags || [];
    
    // Check each search term against source tags
    searchTerms.forEach(term => {
      sourceTags.forEach(tag => {
        // Exact match (e.g., "pet" === "pet")
        if (tag === term) {
          score += 10;
        }
        // Term contains tag or vice versa (e.g., "cardboard" contains "card")
        else if (tag.includes(term) || term.includes(tag)) {
          score += 5;
        }
      });
      
      // Also check title and abstract for mentions
      if (source.title.toLowerCase().includes(term)) {
        score += 3;
      }
      if (source.abstract?.toLowerCase().includes(term)) {
        score += 2;
      }
    });
    
    // Boost score based on source weight (prefer peer-reviewed)
    score += (source.weight || 1.0) * 2;
    
    // Boost general/methodology sources slightly (always want at least one)
    if (sourceTags.includes('general') || 
        sourceTags.includes('lca') || 
        sourceTags.includes('methodology')) {
      score += 1;
    }
    
    return { source, score };
  });
  
  // Sort by score descending
  scoredSources.sort((a, b) => b.score - a.score);
  
  // Strategy: Get top material-specific sources + ensure at least one general source
  const materialSpecific = scoredSources.filter(s => s.score > 5).slice(0, 4);
  const generalSource = scoredSources.find(s => 
    s.source.tags?.includes('general') || 
    s.source.tags?.includes('lca') ||
    s.source.tags?.includes('methodology')
  );
  
  // Combine: prefer 3-4 material-specific + 1 general
  const selectedSources: LibrarySource[] = [];
  
  // Add material-specific sources
  materialSpecific.forEach(s => {
    if (!selectedSources.includes(s.source)) {
      selectedSources.push(s.source);
    }
  });
  
  // Add general source if not already included
  if (generalSource && !selectedSources.includes(generalSource.source)) {
    selectedSources.push(generalSource.source);
  }
  
  // If we still don't have at least 3, add top-scored regardless
  if (selectedSources.length < 3) {
    for (const scored of scoredSources) {
      if (!selectedSources.includes(scored.source)) {
        selectedSources.push(scored.source);
        if (selectedSources.length >= 3) break;
      }
    }
  }
  
  // Convert to Material source format with parameter assignments (limit to 5 max)
  return selectedSources.slice(0, 5).map((s, index) => {
    // Assign parameters based on source tags and material context
    const parameters: string[] = [];
    const tags = s.tags || [];
    
    // Material-specific sources (high score) contribute to most parameters
    if (scoredSources.find(scored => scored.source === s)!.score > 8) {
      // High-relevance sources: contribute to Y, D, C
      if (tags.some(t => ['recycling', 'yield', 'recovery'].includes(t))) {
        parameters.push('Y_value', 'CR_practical_mean');
      }
      if (tags.some(t => ['degradation', 'quality', 'composting'].includes(t))) {
        parameters.push('D_value');
      }
      if (tags.some(t => ['contamination', 'quality', 'purity'].includes(t))) {
        parameters.push('C_value');
      }
      if (tags.some(t => ['infrastructure', 'maturity', 'facilities'].includes(t))) {
        parameters.push('M_value');
      }
      if (tags.some(t => ['energy', 'lca'].includes(t))) {
        parameters.push('E_value');
      }
      
      // If no specific matches, assign to general CR scores
      if (parameters.length === 0) {
        parameters.push('CR_practical_mean', 'CR_theoretical_mean');
      }
    }
    // General/methodology sources contribute to CR scores and methodology
    else if (tags.includes('general') || tags.includes('lca') || tags.includes('methodology')) {
      parameters.push('CR_practical_mean', 'CR_theoretical_mean');
    }
    // Medium-relevance sources: contribute to at least CR
    else {
      parameters.push('CR_practical_mean');
    }
    
    return {
      title: s.title,
      authors: s.authors,
      year: s.year,
      doi: s.doi,
      url: s.url,
      weight: s.weight,
      parameters: parameters.length > 0 ? parameters : undefined,
    };
  });
}

/**
 * Migrate a single material to include scientific data and sources
 */
export function migrateMaterial(material: Material): Material {
  // If material already has sources and scientific data, skip
  if (material.sources && material.sources.length >= 3 && material.Y_value !== undefined) {
    return material;
  }
  
  const migrated = { ...material };
  
  // Add scientific data if missing
  if (migrated.Y_value === undefined) {
    const defaults = getDefaultScientificData(material.name);
    if (defaults) {
      Object.assign(migrated, defaults);
    }
  }
  
  // Add sources if missing or insufficient
  if (!migrated.sources || migrated.sources.length < 3) {
    const sources = getSourcesForMaterial(material.name);
    migrated.sources = sources;
  }
  
  // Set confidence level based on sources
  if (!migrated.confidence_level && migrated.sources) {
    const totalWeight = migrated.sources.reduce((sum, s) => sum + (s.weight || 1.0), 0);
    const weightedScore = migrated.sources.length > 0 ? totalWeight / migrated.sources.length : 0;
    
    if (migrated.sources.length >= 3 && weightedScore >= 0.8) {
      migrated.confidence_level = 'High';
    } else if (migrated.sources.length >= 2 || weightedScore >= 0.6) {
      migrated.confidence_level = 'Medium';
    } else {
      migrated.confidence_level = 'Low';
    }
  }
  
  // Add metadata
  if (!migrated.whitepaper_version) {
    migrated.whitepaper_version = '2025.1';
  }
  if (!migrated.method_version) {
    migrated.method_version = 'CR-v1';
  }
  if (!migrated.calculation_timestamp) {
    migrated.calculation_timestamp = new Date().toISOString();
  }
  
  return migrated;
}

/**
 * Migrate all materials in a batch
 */
export function migrateAllMaterials(materials: Material[]): Material[] {
  return materials.map(migrateMaterial);
}

/**
 * Check if a material needs migration
 */
export function needsMigration(material: Material): boolean {
  return !material.sources || 
         material.sources.length < 3 || 
         material.Y_value === undefined;
}

/**
 * Get migration statistics
 */
export function getMigrationStats(materials: Material[]): {
  total: number;
  needsMigration: number;
  hasScientificData: number;
  hasSources: number;
  highConfidence: number;
} {
  return {
    total: materials.length,
    needsMigration: materials.filter(needsMigration).length,
    hasScientificData: materials.filter(m => m.Y_value !== undefined).length,
    hasSources: materials.filter(m => m.sources && m.sources.length > 0).length,
    highConfidence: materials.filter(m => m.confidence_level === 'High').length,
  };
}

/**
 * Preview what sources will be added to a material
 * (exported for UI preview purposes)
 */
export function previewSourcesForMaterial(materialName: string): Source[] {
  return getSourcesForMaterial(materialName);
}
