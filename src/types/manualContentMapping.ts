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
