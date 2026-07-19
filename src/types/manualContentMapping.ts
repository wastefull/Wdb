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
  auto_publish?: boolean;
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
  governed_topic_count: number;
  existing_vocabulary_count: number;
  new_topic_count: number;
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

export type ContentMappingReviewStatus =
  | "pending_review"
  | "active"
  | "archived";

export interface ContentMappingReviewItem extends ExistingManualContentMapping {
  status: ContentMappingReviewStatus;
  content_name: string;
  content_type: ManualContentEntityType;
  subject_name: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface ContentMappingReviewListResponse {
  success: true;
  items: ContentMappingReviewItem[];
  total: number;
  offset: number;
  limit: number;
}

export interface ReviewContentMappingResponse {
  success: true;
  mapping_id: string;
  status: "active" | "archived";
  changed: boolean;
  already_reviewed: boolean;
  outbox_event_written: boolean;
}

export interface DeleteContentMappingResponse {
  success: true;
  mapping_id: string;
  deleted: boolean;
  outbox_event_written: boolean;
}

export interface ReviewedVideoTopicReport {
  success: true;
  mode: "preview" | "apply";
  candidate_count: number;
  resolved_count: number;
  unresolved_count: number;
  existing_count: number;
  creatable_count: number;
  created_count: number;
  outbox_count: number;
  status: "active";
  unresolved: Array<{
    import_item_id: string;
    video_entity_id: string;
    topic_slug: string;
  }>;
}
