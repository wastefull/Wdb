export type MaterialRelationshipReviewStatus =
  | "pending_review"
  | "active"
  | "archived";

export interface MaterialRelationshipEntityOption {
  id: string;
  name: string;
  status: string;
}

export interface MaterialRelationshipTypeOption {
  slug: string;
  label: string;
  description: string;
}

export interface ManualMaterialRelationshipOptionsResponse {
  materials: MaterialRelationshipEntityOption[];
  relationship_types: MaterialRelationshipTypeOption[];
}

export interface CreateManualMaterialRelationshipRequest {
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
}

export interface CreateManualMaterialRelationshipResponse {
  success: true;
  relationship_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  status: MaterialRelationshipReviewStatus;
  created: boolean;
  already_exists: boolean;
  outbox_event_written: boolean;
}

export interface MaterialRelationshipReviewItem {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  status: MaterialRelationshipReviewStatus;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  source_name: string;
  target_name: string;
}

export interface MaterialRelationshipReviewListResponse {
  success: true;
  items: MaterialRelationshipReviewItem[];
  total: number;
  offset: number;
  limit: number;
}

export interface ReviewMaterialRelationshipResponse {
  success: true;
  relationship_id: string;
  status: "active" | "archived";
  changed: boolean;
  already_reviewed: boolean;
  outbox_event_written: boolean;
}

export interface DeleteMaterialRelationshipResponse {
  success: true;
  relationship_id: string;
  deleted: boolean;
  outbox_event_written: boolean;
}

export interface PublicMaterialRelationshipResource {
  id: string;
  relationshipType: string;
  direction: "inbound" | "outbound";
  materialId: string;
  materialName: string;
  materialSlug?: string | null;
  materialLegacyKvId?: string | null;
}
