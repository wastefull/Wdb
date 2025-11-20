/**
 * Evidence Points Data Layer
 * Phase 9.1 - EXTENDS Phase 9.0 Evidence Infrastructure
 * 
 * Base: Phase 9.0 already provides evidence CRUD endpoints (Day 4)
 * This module ADDS: validation workflow, source references, dimension mapping
 */

import * as kv from './kv_store.tsx';

// ============================================================================
// Type Definitions - EXTENDS Phase 9.0 Schema
// ============================================================================

/**
 * Evidence Point (MIU) - EXTENDS Phase 9.0 schema
 * Phase 9.0 fields: id, material_id, parameter_code, raw_value, raw_unit,
 *                   transformed_value, transform_version, snippet, source_type,
 *                   citation, confidence_level, notes, page_number, figure_number,
 *                   table_number, created_by, created_at, updated_at
 * 
 * Phase 9.1 ADDS: source_ref, source_weight, validation_status, validated_by,
 *                 validated_at, restricted_content, conflict_of_interest, dimension
 */
export interface EvidencePoint {
  // Phase 9.0 fields (from Day 4)
  id: string;
  material_id: string;
  parameter_code: string;        // e.g., "Y", "D", "C"
  raw_value: number;
  raw_unit: string;
  transformed_value: number | null;
  transform_version: string;
  snippet: string;
  source_type: 'whitepaper' | 'article' | 'external' | 'manual';
  citation: string;
  confidence_level: 'high' | 'medium' | 'low';
  notes: string | null;
  page_number: number | null;
  figure_number: string | null;
  table_number: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Phase 9.1 additions
  source_ref: string;              // Reference to source (whitepaper/article ID)
  source_weight: number;           // 0.0-1.0 weight for aggregation
  validation_status: ValidationStatus;
  validated_by: string | null;
  validated_at: string | null;
  restricted_content: boolean;     // True if proprietary data
  conflict_of_interest: string | null;
  dimension: Dimension;            // Derived from parameter_code
}

export type ValidationStatus = 'pending' | 'validated' | 'flagged' | 'duplicate';
export type Dimension = 'CR' | 'CC' | 'RU'; // Compostability, Recyclability, Reusability

/**
 * Input for creating evidence point - EXTENDS Phase 9.0
 */
export interface CreateEvidencePointInput {
  material_id: string;
  parameter_code: string;
  raw_value: number;
  raw_unit: string;
  snippet: string;
  source_type: 'whitepaper' | 'article' | 'external' | 'manual';
  citation: string;
  confidence_level: 'high' | 'medium' | 'low';
  notes?: string;
  page_number?: number;
  figure_number?: string;
  table_number?: string;
  curator_id: string;              // Added in request, mapped to created_by
  
  // Phase 9.1 new fields
  source_ref: string;
  source_weight?: number;          // Default: 0.5
  restricted_content?: boolean;    // Default: false
  conflict_of_interest?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map parameter to dimension
 * CR (Compostability): Y, D, C, M, E
 * CC (Recyclability): B, N, T
 * RU (Reusability): H, L, R, U, C_RU
 */
export function getParameterDimension(parameter: string): Dimension {
  const CR_PARAMS = ['Y', 'D', 'C', 'M', 'E'];
  const CC_PARAMS = ['B', 'N', 'T'];
  const RU_PARAMS = ['H', 'L', 'R', 'U', 'C_RU'];
  
  if (CR_PARAMS.includes(parameter)) return 'CR';
  if (CC_PARAMS.includes(parameter)) return 'CC';
  if (RU_PARAMS.includes(parameter)) return 'RU';
  
  throw new Error(`Unknown parameter: ${parameter}`);
}

/**
 * Generate evidence point ID
 */
function generateEvidenceId(): string {
  return `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// CRUD Operations - EXTENDS Phase 9.0 Endpoints
// ============================================================================

/**
 * Create evidence point - EXTENDS Phase 9.0 POST /evidence
 * Adds Phase 9.1 fields: source_ref, source_weight, validation_status, dimension
 */
export async function createEvidencePoint(input: CreateEvidencePointInput): Promise<EvidencePoint> {
  const evidenceId = generateEvidenceId();
  const now = new Date().toISOString();
  
  // Validate source_weight
  const source_weight = input.source_weight ?? 0.5;
  if (source_weight < 0 || source_weight > 1) {
    throw new Error('source_weight must be between 0.0 and 1.0');
  }
  
  // Determine dimension from parameter
  const dimension = getParameterDimension(input.parameter_code);
  
  const evidencePoint: EvidencePoint = {
    // Phase 9.0 fields
    id: evidenceId,
    material_id: input.material_id,
    parameter_code: input.parameter_code,
    raw_value: input.raw_value,
    raw_unit: input.raw_unit,
    transformed_value: null,  // Computed by transform system
    transform_version: '1.0', // TODO: Get from transforms ontology
    snippet: input.snippet,
    source_type: input.source_type,
    citation: input.citation,
    confidence_level: input.confidence_level,
    notes: input.notes || null,
    page_number: input.page_number || null,
    figure_number: input.figure_number || null,
    table_number: input.table_number || null,
    created_by: input.curator_id,
    created_at: now,
    updated_at: now,
    
    // Phase 9.1 additions
    source_ref: input.source_ref,
    source_weight,
    validation_status: 'pending',
    validated_by: null,
    validated_at: null,
    restricted_content: input.restricted_content ?? false,
    conflict_of_interest: input.conflict_of_interest || null,
    dimension,
  };
  
  // Store using Phase 9.0 pattern
  await kv.set(`evidence:${evidenceId}`, evidencePoint);
  
  // Also store under material_id for easy retrieval (Phase 9.0 pattern)
  const materialEvidenceKey = `evidence_by_material:${input.material_id}:${input.parameter_code}:${evidenceId}`;
  await kv.set(materialEvidenceKey, evidenceId);
  
  // Phase 9.1: Add source index for referential integrity checks
  const sourceEvidenceKey = `evidence_by_source:${input.source_ref}:${evidenceId}`;
  await kv.set(sourceEvidenceKey, evidenceId);
  
  // Phase 9.1: Add validation queue index for curation workflows
  const validationKey = `evidence_by_validation:${evidencePoint.validation_status}:${evidenceId}`;
  await kv.set(validationKey, evidenceId);
  
  return evidencePoint;
}

/**
 * Get evidence point by ID
 */
export async function getEvidencePoint(id: string): Promise<EvidencePoint | null> {
  const evidence = await kv.get(`evidence:${id}`);
  return evidence as EvidencePoint | null;
}

/**
 * Get all evidence points for a material
 * Optional filters: parameter, dimension
 */
export async function getEvidencePointsByMaterial(
  materialId: string,
  options?: { parameter?: string; dimension?: Dimension }
): Promise<EvidencePoint[]> {
  // Get all evidence IDs for this material (Phase 9.0 pattern)
  const prefix = options?.parameter
    ? `evidence_by_material:${materialId}:${options.parameter}:`
    : `evidence_by_material:${materialId}:`;
  
  const evidenceRefs = await kv.getByPrefix(prefix);
  
  if (!evidenceRefs || evidenceRefs.length === 0) {
    return [];
  }
  
  // Fetch full evidence objects
  const evidencePromises = evidenceRefs.map(async (ref: any) => {
    const evidenceId = ref.value;
    const evidence = await kv.get(`evidence:${evidenceId}`);
    return evidence as EvidencePoint;
  });
  
  let evidence = await Promise.all(evidencePromises);
  evidence = evidence.filter(e => e !== null);
  
  // Filter by dimension if specified
  if (options?.dimension) {
    evidence = evidence.filter(e => e.dimension === options.dimension);
  }
  
  return evidence;
}

/**
 * Get all evidence points for a source
 * Used for data guards (checking if source can be deleted)
 * Phase 9.1: Now uses source index for O(1) lookup instead of O(n) scan
 */
export async function getEvidencePointsBySource(sourceRef: string): Promise<EvidencePoint[]> {
  // Use source index (Phase 9.1 optimization)
  const evidenceRefs = await kv.getByPrefix(`evidence_by_source:${sourceRef}:`);
  
  if (!evidenceRefs || evidenceRefs.length === 0) {
    return [];
  }
  
  // Fetch full evidence objects
  const evidencePromises = evidenceRefs.map(async (ref: any) => {
    const evidenceId = ref.value;
    const evidence = await kv.get(`evidence:${evidenceId}`);
    return evidence as EvidencePoint;
  });
  
  const evidence = await Promise.all(evidencePromises);
  return evidence.filter(e => e !== null);
}

/**
 * Update evidence validation status
 * Admin only
 */
export async function updateEvidenceValidation(
  id: string,
  status: ValidationStatus,
  validatedBy: string
): Promise<EvidencePoint | null> {
  const evidence = await getEvidencePoint(id);
  
  if (!evidence) {
    return null;
  }
  
  // Remove old validation index entry
  await kv.del(`evidence_by_validation:${evidence.validation_status}:${id}`);
  
  const updated: EvidencePoint = {
    ...evidence,
    validation_status: status,
    validated_by: validatedBy,
    validated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  await kv.set(`evidence:${id}`, updated);
  
  // Add new validation index entry
  await kv.set(`evidence_by_validation:${status}:${id}`, id);
  
  return updated;
}

/**
 * Data guard: Check if source can be deleted
 * Returns false if any evidence points reference this source
 */
export async function canDeleteSource(sourceRef: string): Promise<{ canDelete: boolean; evidenceCount: number; evidenceIds: string[] }> {
  const evidencePoints = await getEvidencePointsBySource(sourceRef);
  
  return {
    canDelete: evidencePoints.length === 0,
    evidenceCount: evidencePoints.length,
    evidenceIds: evidencePoints.map(ep => ep.id),
  };
}

// ============================================================================
// View Helpers (Simulated Database Views)
// ============================================================================

/**
 * Evidence Summary by Material
 * Simulates: CREATE VIEW evidence_summary_by_material AS ...
 */
export interface EvidenceSummary {
  material_id: string;
  dimension: Dimension;
  total_evidence: number;
  parameters_covered: number;
  unique_sources: number;
  avg_source_weight: number;
  validated_count: number;
  pending_count: number;
  flagged_count: number;
  first_evidence_date: string;
  last_evidence_date: string;
}

export async function getEvidenceStatsByMaterial(
  materialId: string,
  options?: { dimension?: Dimension }
): Promise<EvidenceSummary[]> {
  const evidence = await getEvidencePointsByMaterial(materialId, options);
  
  if (evidence.length === 0) {
    return [];
  }
  
  // Group by dimension
  const byDimension = new Map<Dimension, EvidencePoint[]>();
  evidence.forEach(ep => {
    if (!byDimension.has(ep.dimension)) {
      byDimension.set(ep.dimension, []);
    }
    byDimension.get(ep.dimension)!.push(ep);
  });
  
  // Compute stats for each dimension
  const summaries: EvidenceSummary[] = [];
  byDimension.forEach((eps, dimension) => {
    const uniqueParameters = new Set(eps.map(ep => ep.parameter_code)).size;
    const uniqueSources = new Set(eps.map(ep => ep.source_ref)).size;
    const avgSourceWeight = eps.reduce((sum, ep) => sum + ep.source_weight, 0) / eps.length;
    
    const validatedCount = eps.filter(ep => ep.validation_status === 'validated').length;
    const pendingCount = eps.filter(ep => ep.validation_status === 'pending').length;
    const flaggedCount = eps.filter(ep => ep.validation_status === 'flagged').length;
    
    const dates = eps.map(ep => new Date(ep.created_at).getTime());
    const firstDate = new Date(Math.min(...dates)).toISOString();
    const lastDate = new Date(Math.max(...dates)).toISOString();
    
    summaries.push({
      material_id: materialId,
      dimension,
      total_evidence: eps.length,
      parameters_covered: uniqueParameters,
      unique_sources: uniqueSources,
      avg_source_weight: avgSourceWeight,
      validated_count: validatedCount,
      pending_count: pendingCount,
      flagged_count: flaggedCount,
      first_evidence_date: firstDate,
      last_evidence_date: lastDate,
    });
  });
  
  return summaries;
}

/**
 * Get evidence by validation status
 * Useful for curation workflows
 */
export async function getEvidenceByValidationStatus(
  status: ValidationStatus,
  options?: { limit?: number; offset?: number }
): Promise<EvidencePoint[]> {
  const evidenceRefs = await kv.getByPrefix(`evidence_by_validation:${status}:`);
  
  if (!evidenceRefs || evidenceRefs.length === 0) {
    return [];
  }
  
  // Apply pagination if specified
  let refs = evidenceRefs;
  if (options?.offset) {
    refs = refs.slice(options.offset);
  }
  if (options?.limit) {
    refs = refs.slice(0, options.limit);
  }
  
  // Fetch full evidence objects
  const evidencePromises = refs.map(async (ref: any) => {
    const evidenceId = ref.value;
    const evidence = await kv.get(`evidence:${evidenceId}`);
    return evidence as EvidencePoint;
  });
  
  const evidence = await Promise.all(evidencePromises);
  return evidence.filter(e => e !== null);
}