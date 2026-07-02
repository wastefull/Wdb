// Types for the Stage 7 non-mutating content-mapping preview.
// These mirror the server types in content-mapping-preview.ts without
// importing from the Edge Function module.

export const CONTENT_MAPPING_PREVIEW_VERSION =
  "stage-7-content-mapping-preview-v1";

export type PreviewResolution =
  | "resolved"
  | "awaiting_review"
  | "already_mapped";

export interface MaterialRef {
  legacy_kv_id: string;
  material_uuid: string | null;
  entity_id: string | null;
  name: string | null;
}

export interface ContentRef {
  type: "article" | "guide";
  domain_id: string;
  entity_id: string | null;
  name: string | null;
}

export interface RelationshipCandidate {
  candidate_key: string;
  provenance: "material_links" | "linked_material_ids";
  source: MaterialRef;
  target: MaterialRef;
  suggested_relationship_type: "related_to";
  resolution: PreviewResolution;
  resolution_notes: string | null;
}

export interface ContentMappingCandidate {
  candidate_key: string;
  provenance: "articles.legacy_material_kv_id" | "guides.material_id";
  content: ContentRef;
  subject: MaterialRef;
  suggested_role: "discusses";
  resolution: PreviewResolution;
  resolution_notes: string | null;
}

export interface PreviewSummary {
  total: number;
  resolved: number;
  awaiting_review: number;
  already_mapped: number;
}

export interface ContentMappingPreviewReport {
  contract_version: string;
  generated_at: string;
  is_read_only: true;
  mutation_proof: {
    entity_relationships_before: number;
    content_entities_before: number;
    entity_relationships_after: number;
    content_entities_after: number;
  };
  summary: {
    relationship_candidates: PreviewSummary;
    content_mapping_candidates: PreviewSummary;
  };
  relationship_candidates: RelationshipCandidate[];
  content_mapping_candidates: ContentMappingCandidate[];
  sample_limit: number;
  /** SHA-256 over the complete candidate analysis and resolution state. */
  analysis_checksum: string;
}

export const CONTENT_MAPPING_QUARANTINE_VERSION =
  "stage-7-content-mapping-quarantine-v2";

export interface ContentMappingQuarantineReport {
  contract_version: string;
  run_id: string;
  generated_at: string;
  analysis_checksum: string;
  relationship_issues_written: number;
  content_mapping_issues_written: number;
  total_issues_written: number;
  already_quarantined: boolean;
}

export const CONTENT_MAPPING_APPLY_VERSION = "stage-7-content-mapping-apply-v2";

export interface ContentMappingApplyReport {
  contract_version: string;
  run_id: string;
  generated_at: string;
  analysis_checksum: string;
  manifest_checksum: string;
  approved_candidate_count: number;
  relationships_inserted: number;
  relationships_skipped: number;
  content_mappings_inserted: number;
  content_mappings_skipped: number;
  outbox_events_written: number;
  outbox_events_skipped: number;
  already_applied: boolean;
}

export interface ContentMappingCapabilities {
  apply_enabled: boolean;
  apply_version: string;
  apply_confirmation: string;
  requires_explicit_selection: boolean;
}
