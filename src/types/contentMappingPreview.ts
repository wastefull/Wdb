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
  provenance: "material_links" | "linked_material_ids";
  source: MaterialRef;
  target: MaterialRef;
  suggested_relationship_type: "related_to";
  resolution: PreviewResolution;
  resolution_notes: string | null;
}

export interface ContentMappingCandidate {
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
}
