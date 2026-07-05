export type ManualContentEntityType =
  | "article"
  | "guide"
  | "blog_post"
  | "video";

export interface ManualContentMappingEntityOption {
  id: string;
  entity_type: ManualContentEntityType | "material";
  name: string;
  status: string;
}

export interface GovernedMappingOption {
  slug: string;
  label: string;
  description: string;
}

export interface ExistingManualContentMapping {
  id: string;
  content_entity_id: string;
  subject_entity_id: string;
  role: string;
  lifecycle_focus: string | null;
  evidence_use: string | null;
  status: string;
  created_at: string;
}

export interface ManualContentMappingOptionsResponse {
  content: ManualContentMappingEntityOption[];
  materials: ManualContentMappingEntityOption[];
  roles: GovernedMappingOption[];
  lifecycle_focuses: GovernedMappingOption[];
  evidence_uses: GovernedMappingOption[];
  existing_mappings: ExistingManualContentMapping[];
}

export interface CreateManualContentMappingRequest {
  content_entity_id: string;
  subject_entity_id: string;
  role: string;
  lifecycle_focus?: string | null;
  evidence_use?: string | null;
}

export interface CreateManualContentMappingResponse {
  success: true;
  mapping_id: string;
  content_entity_id: string;
  subject_entity_id: string;
  role: string;
  lifecycle_focus: string | null;
  evidence_use: string | null;
  status: "pending_review" | "active" | "archived";
  created: boolean;
  already_exists: boolean;
  outbox_event_written: boolean;
}

export interface ReviewedVideoMappingReport {
  success: true;
  mode: "preview" | "apply";
  candidate_count: number;
  resolved_count: number;
  unresolved_count: number;
  existing_count: number;
  creatable_count: number;
  created_count: number;
  outbox_count: number;
  role: "primary_subject";
  status: "pending_review";
  unresolved: Array<{
    video_id: string;
    video_entity_id: string;
    import_item_id: string;
    material_identifier: string;
    match_count: number;
  }>;
}
