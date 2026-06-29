import type {
  VideoPlaylistCandidate,
  VideoPlaylistPreview,
} from "../types/videoPlaylist";

const THREE_D_PRINTING_PATTERNS = [
  /\b3[\s-]?d\s+print(?:er|ers|ing|ed|s)?\b/i,
  /\badditive manufacturing\b/i,
  /\bfused deposition model(?:ing)?\b/i,
  /\bstereolithograph(?:y|ic)\b/i,
  /\bselective laser sinter(?:ing|ed)?\b/i,
  /\b(?:fdm|sla|sls)\s+(?:print|printer|printing)\b/i,
  /\bfilament (?:printing|printer|extrusion|recycling)\b/i,
] as const;

export const VIDEO_TRIAGE_CSV_COLUMNS = [
  "contract_version",
  "preview_checksum",
  "playlist_id",
  "playlist_positions",
  "youtube_id",
  "youtube_url",
  "title",
  "channel_name",
  "duration_seconds",
  "classification",
  "privacy_status",
  "embeddable",
  "external_playback_only",
  "eligible_for_video_draft",
  "issues",
  "suggested_topic_tags",
  "disposition",
  "material_ids_or_slugs",
  "reviewed_topic_tags",
  "editorial_targets",
  "review_notes",
] as const;

function candidateSearchText(candidate: VideoPlaylistCandidate): string {
  return [candidate.title, candidate.description, candidate.channel_name]
    .filter(Boolean)
    .join("\n");
}

export function isSuggested3dPrintingVideo(
  candidate: VideoPlaylistCandidate,
): boolean {
  const text = candidateSearchText(candidate);
  return THREE_D_PRINTING_PATTERNS.some((pattern) => pattern.test(text));
}

function protectSpreadsheetCell(value: string): string {
  return /^\s*[=+\-@]/.test(value) ? `'${value}` : value;
}

function csvCell(value: unknown): string {
  const text = protectSpreadsheetCell(
    value === null || value === undefined ? "" : String(value),
  );
  return `"${text.split('"').join('""')}"`;
}

export function buildVideoTriageCsv(preview: VideoPlaylistPreview): string {
  const rows = preview.candidates.map((candidate) => {
    const suggestedTopics = isSuggested3dPrintingVideo(candidate)
      ? "3d_printing"
      : "";
    const values: Record<(typeof VIDEO_TRIAGE_CSV_COLUMNS)[number], unknown> = {
      contract_version: preview.contract_version,
      preview_checksum: preview.preview_checksum,
      playlist_id: preview.source.playlist_id,
      playlist_positions: candidate.playlist_positions.join(";"),
      youtube_id: candidate.youtube_id,
      youtube_url: candidate.youtube_url,
      title: candidate.title,
      channel_name: candidate.channel_name,
      duration_seconds: candidate.duration_seconds,
      classification: candidate.classification,
      privacy_status: candidate.privacy_status,
      embeddable: candidate.embeddable,
      external_playback_only: candidate.embeddable === false,
      eligible_for_video_draft:
        candidate.classification === "new" && candidate.youtube_id !== null,
      issues: candidate.issues.join(";"),
      suggested_topic_tags: suggestedTopics,
      disposition: "",
      material_ids_or_slugs: "",
      reviewed_topic_tags: "",
      editorial_targets: "",
      review_notes: "",
    };
    return VIDEO_TRIAGE_CSV_COLUMNS.map((column) =>
      csvCell(values[column]),
    ).join(",");
  });

  return `\uFEFF${VIDEO_TRIAGE_CSV_COLUMNS.map(csvCell).join(",")}\r\n${rows.join("\r\n")}\r\n`;
}

export function videoTriageCsvFilename(fetchedAt: string): string {
  const date = /^\d{4}-\d{2}-\d{2}/.exec(fetchedAt)?.[0] ?? "undated";
  return `wastedb-video-triage-${date}.csv`;
}
