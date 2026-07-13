export type VideoPlaylistCandidateClassification =
  | "new"
  | "existing"
  | "private"
  | "deleted"
  | "unavailable"
  | "malformed";

export interface VideoPlaylistCandidate {
  candidate_key: string;
  youtube_id: string | null;
  youtube_url: string | null;
  playlist_item_ids: string[];
  playlist_positions: number[];
  duplicate_in_playlist: boolean;
  classification: VideoPlaylistCandidateClassification;
  title: string | null;
  description: string | null;
  channel_name: string | null;
  published_at: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  privacy_status: string | null;
  embeddable: boolean | null;
  existing_video: {
    id: string;
    title: string;
    status: string;
  } | null;
  issues: string[];
}

export interface VideoPlaylistPreview {
  contract_version: "stage-7-youtube-playlist-preview-v1";
  mode: "preview";
  mutation_performed: false;
  mutation_detected: boolean;
  fetched_at: string;
  source: {
    playlist_id: string;
    title: string;
    description: string | null;
    channel_name: string | null;
    privacy_status: string | null;
    provider_item_count: number | null;
  };
  provider_request_count: number;
  counts: {
    playlist_items: number;
    unique_candidates: number;
    unique_video_ids: number;
    duplicate_playlist_items: number;
    available: number;
    new_videos: number;
    existing_videos: number;
    private: number;
    deleted: number;
    unavailable: number;
    malformed: number;
    non_embeddable: number;
  };
  database_snapshot_before: {
    video_count: number;
    video_entity_count: number;
    video_binding_count: number;
  };
  database_snapshot_after: {
    video_count: number;
    video_entity_count: number;
    video_binding_count: number;
  };
  candidates: VideoPlaylistCandidate[];
  preview_checksum: string;
}

export interface VideoPlaylistPreviewResponse {
  success: boolean;
  ready_for_triage: boolean;
  preview: VideoPlaylistPreview;
  error?: string;
  code?: string;
}

export interface VideoPlaylistCapabilities {
  contract_version: string;
  provider: "youtube";
  youtube_api_configured: boolean;
  preview_enabled: boolean;
  maximum_playlist_items: number;
  draft_apply_enabled: boolean;
  triage_persistence_enabled: boolean;
  triage_review_enabled: boolean;
  graph_reads_enabled: boolean;
}

export type VideoTriageDisposition =
  | "material_video"
  | "editorial_lead"
  | "both"
  | "ignore";

export type VideoEditorialTarget = "article" | "blog_post" | "guide";

export interface VideoTriageCsvRow {
  sourceRowNumber: number;
  contractVersion: string;
  previewChecksum: string;
  playlistId: string;
  playlistPositions: number[];
  youtubeId: string | null;
  youtubeUrl: string | null;
  title: string | null;
  channelName: string | null;
  durationSeconds: number | null;
  classification: VideoPlaylistCandidateClassification;
  privacyStatus: string | null;
  embeddable: boolean | null;
  externalPlaybackOnly: boolean;
  eligibleForVideoDraft: boolean;
  issues: string[];
  suggestedTopicTags: string[];
  disposition: VideoTriageDisposition | null;
  materialIdentifiers: string[];
  reviewedTopicTags: string[];
  editorialTargets: VideoEditorialTarget[];
  reviewNotes: string | null;
  originalPayload: Record<string, string>;
}

export interface VideoTriageCsvIssue {
  severity: "error" | "warning";
  row: number | null;
  column?: string;
  message: string;
}

export interface VideoTriageCsvPreview {
  validForStaging: boolean;
  readyForDraftApply: boolean;
  worksheetChecksum: string;
  sourcePreviewChecksum: string | null;
  playlistId: string | null;
  rows: VideoTriageCsvRow[];
  issues: VideoTriageCsvIssue[];
  counts: {
    rows: number;
    errors: number;
    warnings: number;
    available: number;
    unavailable: number;
    reviewed: number;
    unreviewedAvailable: number;
    materialVideo: number;
    editorialLead: number;
    both: number;
    ignored: number;
    suggested3dPrinting: number;
    reviewed3dPrinting: number;
  };
}

export interface VideoTriageStageRequest {
  source_filename: string;
  source_playlist_title: string;
  worksheet_csv: string;
  worksheet: VideoTriageCsvPreview;
}

export interface VideoTriageStageResponse {
  success: boolean;
  created: boolean;
  batch_id: string;
  status: "needs_review" | "ready";
  row_count: number;
  reviewed_count: number;
  unreviewed_available_count?: number;
  message: string;
}

export interface VideoTriageBatch {
  id: string;
  source_playlist_id: string;
  source_playlist_title: string | null;
  source_preview_checksum: string;
  worksheet_checksum: string;
  row_count: number;
  status:
    | "needs_review"
    | "ready"
    | "applying"
    | "completed"
    | "failed"
    | "archived";
  validation_summary: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface VideoTriageItem {
  id: string;
  batch_id: string;
  source_row_number: number;
  provider_video_id: string | null;
  provider_url: string | null;
  playlist_positions: number[];
  title: string | null;
  channel_name: string | null;
  duration_seconds: number | null;
  provider_classification: VideoPlaylistCandidateClassification;
  privacy_status: string | null;
  embeddable: boolean | null;
  external_playback_only: boolean;
  provider_issues: string[];
  suggested_topic_tags: string[];
  disposition: VideoTriageDisposition | null;
  material_identifiers: string[];
  reviewed_topic_tags: string[];
  editorial_targets: VideoEditorialTarget[];
  review_notes: string | null;
  review_status: "unreviewed" | "reviewed" | "blocked";
  reviewed_at: string | null;
  updated_at: string;
}

export interface VideoTriageBatchListResponse {
  success: boolean;
  batches: VideoTriageBatch[];
}

export interface VideoTriageItemListResponse {
  success: boolean;
  items: VideoTriageItem[];
  total: number;
  offset: number;
  limit: number;
  search?: string;
}

export interface VideoTriageReviewRequest {
  disposition: VideoTriageDisposition | null;
  material_identifiers: string[];
  reviewed_topic_tags: string[];
  editorial_targets: VideoEditorialTarget[];
  review_notes: string | null;
}

export interface CreateVideoFromUrlRequest {
  youtube_url: string;
  title?: string;
  material_id?: string | null;
  role?: string | null;
  lifecycle_focus?: string | null;
  evidence_use?: string | null;
}

export interface CreateVideoFromUrlResponse {
  success: boolean;
  created: boolean;
  existing: boolean;
  video_id: string;
  entity_id: string;
  youtube_id: string | null;
  youtube_url: string;
  title: string;
  material_mapping_created: boolean;
  material_mapping_id?: string | null;
  material_id?: string | null;
}

export interface VideoTriageReviewResponse {
  success: boolean;
  item_id: string;
  batch_id: string;
  disposition: VideoTriageDisposition | null;
  review_status: "unreviewed" | "reviewed";
  reviewed_at: string | null;
  batch_status: "needs_review" | "ready";
  available_count: number;
  reviewed_available_count: number;
  unreviewed_available_count: number;
  reviewed_count: number;
}

export interface VideoTriageApplyRequest {
  confirmation: "apply video triage drafts";
  include_editorial_leads?: boolean;
}

export interface VideoTriageApplyResponse {
  success: boolean;
  batch_id: string;
  status: "completed" | "failed";
  already_applied: boolean;
  videos_inserted: number;
  videos_reused: number;
  entities_inserted: number;
  bindings_inserted: number;
  triage_items_applied: number;
  editorial_leads_inserted: number;
  pending_draft_items_before_apply: number;
  target_draft_items: number;
  target_editorial_items: number;
}
