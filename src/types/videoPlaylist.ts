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
