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
