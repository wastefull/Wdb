/**
 * Parameter Aggregations Data Layer
 * Phase 9.1 - NEW infrastructure built on Phase 9.0 foundation
 * 
 * Aggregations compute weighted means from validated evidence points (MIUs)
 * and maintain version history with policy snapshots
 */

import * as kv from './kv_store.tsx';
import * as evidence from './evidence.ts';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Parameter Aggregation - computed from evidence points
 * Stores weighted mean, confidence intervals, and traceability metadata
 */
export interface ParameterAggregation {
  id: string;
  material_id: string;
  parameter: string;              // e.g., "Y", "D", "C"
  dimension: evidence.Dimension;  // Derived from parameter
  
  // Aggregation results
  mean: number;                   // Weighted mean
  se: number | null;              // Standard error
  ci95_lower: number | null;      // 95% CI lower bound
  ci95_upper: number | null;      // 95% CI upper bound
  
  // Traceability
  n_mius: number;                 // Number of evidence points used
  miu_ids: string[];              // IDs of evidence points
  weights_used: Record<string, number>; // Source weights applied (miu_id -> weight)
  
  // Versioning
  transform_version: string;      // Transform version used
  ontology_version: string;       // Units ontology version
  codebook_version: string;       // Codebook version
  
  // Policy snapshot
  quality_threshold: number;      // Minimum quality score to include MIU
  min_sources: number;            // Minimum number of sources required
  
  // Audit trail
  calculated_by: string;          // User who triggered calculation
  calculated_at: string;          // Timestamp
  is_current: boolean;            // Only one current per material+parameter
  superseded_at: string | null;   // When this version was replaced
  superseded_by: string | null;   // ID of newer aggregation
}

/**
 * Input for creating aggregation
 */
export interface CreateAggregationInput {
  material_id: string;
  parameter: string;
  miu_ids: string[];              // Evidence point IDs to aggregate
  calculated_by: string;          // User ID
  quality_threshold?: number;     // Default: 0.0
  min_sources?: number;           // Default: 1
}

/**
 * Aggregation statistics for a material
 */
export interface AggregationStats {
  material_id: string;
  total_parameters: number;
  parameters_with_aggregations: string[];
  total_mius_used: number;
  last_calculated_at: string | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate aggregation ID
 */
function generateAggregationId(): string {
  return `agg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Compute weighted mean from evidence points
 */
function computeWeightedMean(evidencePoints: evidence.EvidencePoint[]): {
  mean: number;
  se: number | null;
  ci95_lower: number | null;
  ci95_upper: number | null;
} {
  if (evidencePoints.length === 0) {
    throw new Error('Cannot compute mean from zero evidence points');
  }
  
  // Use transformed_value if available, else raw_value
  const values = evidencePoints.map(ep => ep.transformed_value ?? ep.raw_value);
  const weights = evidencePoints.map(ep => ep.source_weight);
  
  // Weighted mean
  const sumWeightedValues = values.reduce((sum, val, i) => sum + val * weights[i], 0);
  const sumWeights = weights.reduce((sum, w) => sum + w, 0);
  const mean = sumWeightedValues / sumWeights;
  
  // Standard error (simplified - assumes independence)
  let se: number | null = null;
  let ci95_lower: number | null = null;
  let ci95_upper: number | null = null;
  
  if (evidencePoints.length >= 2) {
    const variance = values.reduce((sum, val, i) => {
      return sum + weights[i] * Math.pow(val - mean, 2);
    }, 0) / sumWeights;
    
    se = Math.sqrt(variance / evidencePoints.length);
    
    // 95% CI (1.96 * SE)
    const margin = 1.96 * se;
    ci95_lower = mean - margin;
    ci95_upper = mean + margin;
  }
  
  return { mean, se, ci95_lower, ci95_upper };
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create parameter aggregation
 * Supersedes any existing current aggregation for this material+parameter
 */
export async function createAggregation(input: CreateAggregationInput): Promise<ParameterAggregation> {
  const aggregationId = generateAggregationId();
  const now = new Date().toISOString();
  
  // Fetch all evidence points
  const evidencePoints = await Promise.all(
    input.miu_ids.map(id => evidence.getEvidencePoint(id))
  );
  
  // Filter out nulls
  const validEvidence = evidencePoints.filter((ep): ep is evidence.EvidencePoint => ep !== null);
  
  if (validEvidence.length === 0) {
    throw new Error('No valid evidence points found');
  }
  
  // Verify all evidence points are for the same material and parameter
  const firstEp = validEvidence[0];
  for (const ep of validEvidence) {
    if (ep.material_id !== input.material_id) {
      throw new Error(`Evidence point ${ep.id} is for different material`);
    }
    if (ep.parameter_code !== input.parameter) {
      throw new Error(`Evidence point ${ep.id} is for different parameter`);
    }
  }
  
  // Compute aggregation
  const { mean, se, ci95_lower, ci95_upper } = computeWeightedMean(validEvidence);
  
  // Build weights_used map
  const weights_used: Record<string, number> = {};
  for (const ep of validEvidence) {
    weights_used[ep.id] = ep.source_weight;
  }
  
  // Determine dimension
  const dimension = evidence.getParameterDimension(input.parameter);
  
  // Create aggregation
  const aggregation: ParameterAggregation = {
    id: aggregationId,
    material_id: input.material_id,
    parameter: input.parameter,
    dimension,
    mean,
    se,
    ci95_lower,
    ci95_upper,
    n_mius: validEvidence.length,
    miu_ids: input.miu_ids,
    weights_used,
    transform_version: firstEp.transform_version,
    ontology_version: '1.0', // TODO: Get from ontology
    codebook_version: '1.0', // TODO: Get from codebook
    quality_threshold: input.quality_threshold ?? 0.0,
    min_sources: input.min_sources ?? 1,
    calculated_by: input.calculated_by,
    calculated_at: now,
    is_current: true,
    superseded_at: null,
    superseded_by: null,
  };
  
  // Store aggregation
  await kv.set(`aggregation:${aggregationId}`, aggregation);
  
  // Check if there's a current aggregation for this material+parameter
  const currentKey = `aggregation_current:${input.material_id}:${input.parameter}`;
  const existingCurrentId = await kv.get(currentKey);
  
  if (existingCurrentId) {
    // Supersede the existing current aggregation
    const existingCurrent = await kv.get(`aggregation:${existingCurrentId}`) as ParameterAggregation | null;
    if (existingCurrent) {
      const superseded: ParameterAggregation = {
        ...existingCurrent,
        is_current: false,
        superseded_at: now,
        superseded_by: aggregationId,
      };
      await kv.set(`aggregation:${existingCurrentId}`, superseded);
    }
  }
  
  // Set this as current
  await kv.set(currentKey, aggregationId);
  
  // Store in history
  const historyKey = `aggregation_history:${input.material_id}:${input.parameter}:${aggregationId}`;
  await kv.set(historyKey, aggregationId);
  
  return aggregation;
}

/**
 * Get aggregation by ID
 */
export async function getAggregation(id: string): Promise<ParameterAggregation | null> {
  const aggregation = await kv.get(`aggregation:${id}`);
  return aggregation as ParameterAggregation | null;
}

/**
 * Get current aggregations for a material
 * Optional filter by parameter
 */
export async function getCurrentAggregationsByMaterial(
  materialId: string,
  options?: { parameter?: string }
): Promise<ParameterAggregation[]> {
  const prefix = options?.parameter
    ? `aggregation_current:${materialId}:${options.parameter}`
    : `aggregation_current:${materialId}:`;
  
  const currentRefs = await kv.getByPrefix(prefix);
  
  if (!currentRefs || currentRefs.length === 0) {
    return [];
  }
  
  // Fetch full aggregation objects
  const aggregationPromises = currentRefs.map(async (ref: any) => {
    const aggregationId = ref.value;
    const aggregation = await kv.get(`aggregation:${aggregationId}`);
    return aggregation as ParameterAggregation;
  });
  
  const aggregations = await Promise.all(aggregationPromises);
  return aggregations.filter(a => a !== null);
}

/**
 * Get aggregation history for a material+parameter
 * Returns all aggregations (current and superseded) in reverse chronological order
 */
export async function getAggregationHistory(
  materialId: string,
  parameter: string
): Promise<ParameterAggregation[]> {
  const prefix = `aggregation_history:${materialId}:${parameter}:`;
  const historyRefs = await kv.getByPrefix(prefix);
  
  if (!historyRefs || historyRefs.length === 0) {
    return [];
  }
  
  // Fetch full aggregation objects
  const aggregationPromises = historyRefs.map(async (ref: any) => {
    const aggregationId = ref.value;
    const aggregation = await kv.get(`aggregation:${aggregationId}`);
    return aggregation as ParameterAggregation;
  });
  
  let aggregations = await Promise.all(aggregationPromises);
  aggregations = aggregations.filter(a => a !== null);
  
  // Sort by calculated_at (newest first)
  aggregations.sort((a, b) => 
    new Date(b.calculated_at).getTime() - new Date(a.calculated_at).getTime()
  );
  
  return aggregations;
}

/**
 * Get aggregation statistics for a material
 */
export async function getAggregationStats(materialId: string): Promise<AggregationStats> {
  const currentAggregations = await getCurrentAggregationsByMaterial(materialId);
  
  const totalMius = currentAggregations.reduce((sum, agg) => sum + agg.n_mius, 0);
  const parameters = currentAggregations.map(agg => agg.parameter);
  
  let lastCalculatedAt: string | null = null;
  if (currentAggregations.length > 0) {
    const sorted = [...currentAggregations].sort((a, b) => 
      new Date(b.calculated_at).getTime() - new Date(a.calculated_at).getTime()
    );
    lastCalculatedAt = sorted[0].calculated_at;
  }
  
  return {
    material_id: materialId,
    total_parameters: currentAggregations.length,
    parameters_with_aggregations: parameters,
    total_mius_used: totalMius,
    last_calculated_at: lastCalculatedAt,
  };
}

// ============================================================================
// View Helpers (Simulated Database Views)
// ============================================================================

/**
 * Aggregation Coverage Status
 */
export type CoverageStatus = 'good' | 'sufficient' | 'insufficient';

/**
 * Coverage Matrix Entry
 * Simulates: CREATE VIEW aggregation_coverage_matrix AS ...
 */
export interface CoverageMatrixEntry {
  material_id: string;
  parameter: string;
  num_mius: number;
  num_sources: number;
  quality_score: number | null;
  confidence_interval_width: number | null;
  calculated_at: string;
  coverage_status: CoverageStatus;
}

/**
 * Get aggregation coverage matrix
 * Shows which material+parameter combinations have aggregations and their quality
 */
export async function getAggregationCoverageMatrix(
  materialId?: string
): Promise<CoverageMatrixEntry[]> {
  let aggregations: ParameterAggregation[];
  
  if (materialId) {
    // Get aggregations for specific material
    aggregations = await getCurrentAggregationsByMaterial(materialId);
  } else {
    // Get all current aggregations (expensive - scan all aggregation_current: keys)
    const currentRefs = await kv.getByPrefix('aggregation_current:');
    const aggregationIds = currentRefs.map((ref: any) => ref.value);
    
    const aggregationPromises = aggregationIds.map(async (id: string) => {
      const agg = await kv.get(`aggregation:${id}`);
      return agg as ParameterAggregation | null;
    });
    
    aggregations = (await Promise.all(aggregationPromises)).filter(a => a !== null) as ParameterAggregation[];
  }
  
  // Map to coverage matrix entries
  return aggregations.map(agg => {
    let coverage_status: CoverageStatus;
    if (agg.n_mius >= 3) {
      coverage_status = 'good';
    } else if (agg.n_mius >= 1) {
      coverage_status = 'sufficient';
    } else {
      coverage_status = 'insufficient';
    }
    
    const ci_width = agg.ci95_lower !== null && agg.ci95_upper !== null
      ? agg.ci95_upper - agg.ci95_lower
      : null;
    
    // Quality score: combination of number of MIUs and CI width
    let quality_score: number | null = null;
    if (ci_width !== null) {
      // Score from 0-1: higher is better
      // Good: >= 3 MIUs and narrow CI (< 0.2) = 1.0
      // Sufficient: 1-2 MIUs or wide CI (>= 0.2) = 0.5
      // Insufficient: 0 MIUs = 0.0
      const miuScore = Math.min(agg.n_mius / 3, 1.0);
      const ciScore = Math.max(0, 1 - (ci_width / 0.4)); // Normalize: 0.4 CI = 0 score
      quality_score = (miuScore + ciScore) / 2;
    }
    
    return {
      material_id: agg.material_id,
      parameter: agg.parameter,
      num_mius: agg.n_mius,
      num_sources: Object.keys(agg.weights_used).length,
      quality_score,
      confidence_interval_width: ci_width,
      calculated_at: agg.calculated_at,
      coverage_status,
    };
  });
}