export const YOUTUBE_PLAYLIST_PREVIEW_VERSION =
  "stage-7-youtube-playlist-preview-v1";
export const YOUTUBE_PLAYLIST_MAX_ITEMS = 1000;

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_PAGE_SIZE = 50;
const DATABASE_PAGE_SIZE = 1000;
const PROVIDER_TIMEOUT_MS = 20_000;

type JsonRecord = Record<string, unknown>;

export interface VideoDatabaseSnapshot {
  video_count: number;
  video_entity_count: number;
  video_binding_count: number;
}

export interface ExistingVideoRecord {
  id: string;
  youtube_id: string | null;
  youtube_url: string;
  title: string;
  status: string;
}

export interface YouTubePlaylistSource {
  playlist_id: string;
  title: string;
  description: string | null;
  channel_name: string | null;
  privacy_status: string | null;
  provider_item_count: number | null;
}

export interface YouTubePlaylistItem {
  playlist_item_id: string | null;
  position: number;
  youtube_id: string | null;
  title: string | null;
  description: string | null;
  channel_name: string | null;
  published_at: string | null;
  thumbnail_url: string | null;
  playlist_item_privacy_status: string | null;
}

export interface YouTubeVideoDetail {
  youtube_id: string;
  title: string | null;
  description: string | null;
  channel_name: string | null;
  published_at: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  privacy_status: string | null;
  upload_status: string | null;
  embeddable: boolean | null;
}

export interface YouTubePlaylistProviderData {
  source: YouTubePlaylistSource;
  items: YouTubePlaylistItem[];
  video_details: Map<string, YouTubeVideoDetail>;
  provider_request_count: number;
}

export type YouTubeCandidateClassification =
  | "new"
  | "existing"
  | "private"
  | "deleted"
  | "unavailable"
  | "malformed";

export interface YouTubePlaylistCandidate {
  candidate_key: string;
  youtube_id: string | null;
  youtube_url: string | null;
  playlist_item_ids: string[];
  playlist_positions: number[];
  duplicate_in_playlist: boolean;
  classification: YouTubeCandidateClassification;
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

export interface YouTubePlaylistPreview {
  contract_version: typeof YOUTUBE_PLAYLIST_PREVIEW_VERSION;
  mode: "preview";
  mutation_performed: false;
  mutation_detected: boolean;
  fetched_at: string;
  source: YouTubePlaylistSource;
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
  database_snapshot_before: VideoDatabaseSnapshot;
  database_snapshot_after: VideoDatabaseSnapshot;
  candidates: YouTubePlaylistCandidate[];
  preview_checksum: string;
}

export class YouTubePlaylistPreviewError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "YouTubePlaylistPreviewError";
    this.status = status;
    this.code = code;
  }
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function cleanInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

function isYouTubeHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^www\./, "");
  return normalized === "youtube.com" || normalized.endsWith(".youtube.com");
}

function isPlaylistId(value: string): boolean {
  return /^[A-Za-z0-9_-]{10,80}$/.test(value);
}

function isVideoId(value: string): boolean {
  return /^[A-Za-z0-9_-]{11}$/.test(value);
}

export function parseYouTubePlaylistId(value: unknown): string {
  const input = cleanText(value);
  if (!input) {
    throw new YouTubePlaylistPreviewError(
      400,
      "playlist_url_required",
      "A YouTube playlist URL or playlist ID is required.",
    );
  }

  if (isPlaylistId(input) && !input.includes(".")) return input;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new YouTubePlaylistPreviewError(
      400,
      "invalid_playlist_url",
      "The playlist value is not a valid YouTube playlist URL or ID.",
    );
  }

  if (!isYouTubeHost(url.hostname) && url.hostname !== "youtu.be") {
    throw new YouTubePlaylistPreviewError(
      400,
      "invalid_playlist_host",
      "The playlist URL must use a YouTube host.",
    );
  }

  const playlistId = cleanText(url.searchParams.get("list"));
  if (!playlistId || !isPlaylistId(playlistId)) {
    throw new YouTubePlaylistPreviewError(
      400,
      "invalid_playlist_id",
      "The YouTube URL does not contain a valid playlist ID.",
    );
  }
  return playlistId;
}

export function normalizeYouTubeVideoId(value: unknown): string | null {
  const input = cleanText(value);
  if (!input) return null;
  if (isVideoId(input)) return input;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "youtu.be") {
    const candidate = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return isVideoId(candidate) ? candidate : null;
  }
  if (!isYouTubeHost(host)) return null;

  const queryId = cleanText(url.searchParams.get("v"));
  if (queryId && isVideoId(queryId)) return queryId;

  const segments = url.pathname.split("/").filter(Boolean);
  if (
    segments.length >= 2 &&
    ["embed", "shorts", "live"].includes(segments[0]) &&
    isVideoId(segments[1])
  ) {
    return segments[1];
  }
  return null;
}

export function parseYouTubeDurationSeconds(value: unknown): number | null {
  const duration = cleanText(value);
  if (!duration) return null;
  const match = duration.match(
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/,
  );
  if (!match) return null;
  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

function thumbnailUrl(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const thumbnails = value as JsonRecord;
  for (const key of ["maxres", "standard", "high", "medium", "default"]) {
    const candidate = thumbnails[key];
    if (candidate && typeof candidate === "object") {
      const url = cleanText((candidate as JsonRecord).url);
      if (url) return url;
    }
  }
  return null;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as JsonRecord;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchProviderJson(
  resource: "playlists" | "playlistItems" | "videos",
  parameters: Record<string, string>,
  apiKey: string,
  fetchImpl: typeof fetch,
): Promise<JsonRecord> {
  const url = new URL(`${YOUTUBE_API_BASE}/${resource}`);
  for (const [key, value] of Object.entries(parameters)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("key", apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === "AbortError"
        ? "The YouTube API request timed out."
        : "The YouTube API request could not be completed.";
    throw new YouTubePlaylistPreviewError(502, "youtube_unavailable", message);
  } finally {
    clearTimeout(timeout);
  }

  let payload: JsonRecord = {};
  try {
    payload = (await response.json()) as JsonRecord;
  } catch {
    if (!response.ok) {
      throw new YouTubePlaylistPreviewError(
        502,
        "youtube_invalid_response",
        `YouTube returned HTTP ${response.status} without a valid response.`,
      );
    }
  }

  if (!response.ok) {
    const providerError =
      payload.error && typeof payload.error === "object"
        ? (payload.error as JsonRecord)
        : null;
    const providerMessage = cleanText(providerError?.message);
    const safeMessage = providerMessage?.replaceAll(apiKey, "[redacted]");
    throw new YouTubePlaylistPreviewError(
      response.status === 404 ? 404 : 502,
      "youtube_api_error",
      safeMessage
        ? `YouTube API request failed: ${safeMessage}`
        : `YouTube API request failed with HTTP ${response.status}.`,
    );
  }
  return payload;
}

function providerItems(payload: JsonRecord): JsonRecord[] {
  return Array.isArray(payload.items)
    ? payload.items.filter(
        (item): item is JsonRecord => Boolean(item && typeof item === "object"),
      )
    : [];
}

function mapPlaylistSource(
  playlistId: string,
  payload: JsonRecord,
): YouTubePlaylistSource {
  const item = providerItems(payload)[0];
  if (!item) {
    throw new YouTubePlaylistPreviewError(
      404,
      "playlist_not_found",
      "The playlist was not found or is not accessible with this credential.",
    );
  }
  const snippet =
    item.snippet && typeof item.snippet === "object"
      ? (item.snippet as JsonRecord)
      : {};
  const status =
    item.status && typeof item.status === "object"
      ? (item.status as JsonRecord)
      : {};
  const contentDetails =
    item.contentDetails && typeof item.contentDetails === "object"
      ? (item.contentDetails as JsonRecord)
      : {};
  return {
    playlist_id: playlistId,
    title: cleanText(snippet.title) ?? "Untitled YouTube playlist",
    description: cleanText(snippet.description),
    channel_name: cleanText(snippet.channelTitle),
    privacy_status: cleanText(status.privacyStatus),
    provider_item_count: cleanInteger(contentDetails.itemCount),
  };
}

function mapPlaylistItem(item: JsonRecord, fallbackPosition: number) {
  const snippet =
    item.snippet && typeof item.snippet === "object"
      ? (item.snippet as JsonRecord)
      : {};
  const contentDetails =
    item.contentDetails && typeof item.contentDetails === "object"
      ? (item.contentDetails as JsonRecord)
      : {};
  const status =
    item.status && typeof item.status === "object"
      ? (item.status as JsonRecord)
      : {};
  const resourceId =
    snippet.resourceId && typeof snippet.resourceId === "object"
      ? (snippet.resourceId as JsonRecord)
      : {};
  const position = cleanInteger(snippet.position) ?? fallbackPosition;
  return {
    playlist_item_id: cleanText(item.id),
    position,
    youtube_id: normalizeYouTubeVideoId(
      contentDetails.videoId ?? resourceId.videoId,
    ),
    title: cleanText(snippet.title),
    description: cleanText(snippet.description),
    channel_name: cleanText(snippet.videoOwnerChannelTitle ?? snippet.channelTitle),
    published_at: cleanText(snippet.publishedAt),
    thumbnail_url: thumbnailUrl(snippet.thumbnails),
    playlist_item_privacy_status: cleanText(status.privacyStatus),
  } satisfies YouTubePlaylistItem;
}

function mapVideoDetail(item: JsonRecord): YouTubeVideoDetail | null {
  const youtubeId = normalizeYouTubeVideoId(item.id);
  if (!youtubeId) return null;
  const snippet =
    item.snippet && typeof item.snippet === "object"
      ? (item.snippet as JsonRecord)
      : {};
  const contentDetails =
    item.contentDetails && typeof item.contentDetails === "object"
      ? (item.contentDetails as JsonRecord)
      : {};
  const status =
    item.status && typeof item.status === "object"
      ? (item.status as JsonRecord)
      : {};
  return {
    youtube_id: youtubeId,
    title: cleanText(snippet.title),
    description: cleanText(snippet.description),
    channel_name: cleanText(snippet.channelTitle),
    published_at: cleanText(snippet.publishedAt),
    thumbnail_url: thumbnailUrl(snippet.thumbnails),
    duration_seconds: parseYouTubeDurationSeconds(contentDetails.duration),
    privacy_status: cleanText(status.privacyStatus),
    upload_status: cleanText(status.uploadStatus),
    embeddable:
      typeof status.embeddable === "boolean" ? status.embeddable : null,
  };
}

function chunks<T>(values: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

export async function fetchYouTubePlaylistProviderData(
  playlistId: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<YouTubePlaylistProviderData> {
  let providerRequestCount = 0;
  const sourcePayload = await fetchProviderJson(
    "playlists",
    { part: "snippet,contentDetails,status", id: playlistId },
    apiKey,
    fetchImpl,
  );
  providerRequestCount += 1;
  const source = mapPlaylistSource(playlistId, sourcePayload);

  const items: YouTubePlaylistItem[] = [];
  const visitedPageTokens = new Set<string>();
  let pageToken: string | null = null;
  do {
    const parameters: Record<string, string> = {
      part: "snippet,contentDetails,status",
      playlistId,
      maxResults: String(YOUTUBE_PAGE_SIZE),
    };
    if (pageToken) parameters.pageToken = pageToken;
    const payload = await fetchProviderJson(
      "playlistItems",
      parameters,
      apiKey,
      fetchImpl,
    );
    providerRequestCount += 1;
    const pageItems = providerItems(payload);
    for (const item of pageItems) {
      items.push(mapPlaylistItem(item, items.length));
      if (items.length > YOUTUBE_PLAYLIST_MAX_ITEMS) {
        throw new YouTubePlaylistPreviewError(
          422,
          "playlist_too_large",
          `Playlist preview supports at most ${YOUTUBE_PLAYLIST_MAX_ITEMS} items.`,
        );
      }
    }

    const nextPageToken = cleanText(payload.nextPageToken);
    if (nextPageToken && visitedPageTokens.has(nextPageToken)) {
      throw new YouTubePlaylistPreviewError(
        502,
        "youtube_pagination_loop",
        "YouTube returned a repeated playlist page token.",
      );
    }
    if (nextPageToken) visitedPageTokens.add(nextPageToken);
    pageToken = nextPageToken;
  } while (pageToken);

  const uniqueIds = Array.from(
    new Set(items.map((item) => item.youtube_id).filter(Boolean) as string[]),
  );
  const videoDetails = new Map<string, YouTubeVideoDetail>();
  for (const idChunk of chunks(uniqueIds, YOUTUBE_PAGE_SIZE)) {
    const payload = await fetchProviderJson(
      "videos",
      {
        part: "snippet,contentDetails,status",
        id: idChunk.join(","),
        maxResults: String(YOUTUBE_PAGE_SIZE),
      },
      apiKey,
      fetchImpl,
    );
    providerRequestCount += 1;
    for (const item of providerItems(payload)) {
      const detail = mapVideoDetail(item);
      if (detail) videoDetails.set(detail.youtube_id, detail);
    }
  }

  return {
    source,
    items,
    video_details: videoDetails,
    provider_request_count: providerRequestCount,
  };
}

function classifyUnavailableTitle(title: string | null) {
  const normalized = title?.toLowerCase() ?? "";
  if (normalized.includes("private video")) return "private" as const;
  if (normalized.includes("deleted video")) return "deleted" as const;
  return "unavailable" as const;
}

function buildExistingVideoMap(existingVideos: ExistingVideoRecord[]) {
  const result = new Map<string, ExistingVideoRecord>();
  for (const video of existingVideos) {
    const youtubeId =
      normalizeYouTubeVideoId(video.youtube_id) ??
      normalizeYouTubeVideoId(video.youtube_url);
    if (youtubeId && !result.has(youtubeId)) result.set(youtubeId, video);
  }
  return result;
}

export async function buildYouTubePlaylistPreview(input: {
  provider_data: YouTubePlaylistProviderData;
  existing_videos: ExistingVideoRecord[];
  database_snapshot_before: VideoDatabaseSnapshot;
  database_snapshot_after: VideoDatabaseSnapshot;
  fetched_at?: string;
}): Promise<YouTubePlaylistPreview> {
  const existingByYouTubeId = buildExistingVideoMap(input.existing_videos);
  const grouped = new Map<string, YouTubePlaylistItem[]>();
  for (const [index, item] of input.provider_data.items.entries()) {
    const key =
      item.youtube_id ?? item.playlist_item_id ?? `malformed-position-${index}`;
    const group = grouped.get(key) ?? [];
    group.push(item);
    grouped.set(key, group);
  }

  const candidates: YouTubePlaylistCandidate[] = [];
  for (const [candidateKey, group] of grouped) {
    const first = group[0];
    const youtubeId = first.youtube_id;
    const detail = youtubeId
      ? input.provider_data.video_details.get(youtubeId) ?? null
      : null;
    const existingVideo = youtubeId
      ? existingByYouTubeId.get(youtubeId) ?? null
      : null;

    let classification: YouTubeCandidateClassification;
    if (!youtubeId) {
      classification = "malformed";
    } else if (!detail) {
      classification = classifyUnavailableTitle(first.title);
    } else if (detail.privacy_status === "private") {
      classification = "private";
    } else if (detail.upload_status === "deleted") {
      classification = "deleted";
    } else if (
      detail.upload_status &&
      !["processed", "uploaded"].includes(detail.upload_status)
    ) {
      classification = "unavailable";
    } else {
      classification = existingVideo ? "existing" : "new";
    }

    const issues: string[] = [];
    if (group.length > 1) issues.push("duplicate_in_playlist");
    if (classification === "existing") issues.push("already_in_wastedb");
    if (["private", "deleted", "unavailable", "malformed"].includes(classification)) {
      issues.push(classification);
    }
    if (detail?.embeddable === false) issues.push("embedding_disabled");

    candidates.push({
      candidate_key: candidateKey,
      youtube_id: youtubeId,
      youtube_url: youtubeId
        ? `https://www.youtube.com/watch?v=${youtubeId}`
        : null,
      playlist_item_ids: group
        .map((item) => item.playlist_item_id)
        .filter(Boolean) as string[],
      playlist_positions: group
        .map((item) => item.position + 1)
        .sort((a, b) => a - b),
      duplicate_in_playlist: group.length > 1,
      classification,
      title: detail?.title ?? first.title,
      description: detail?.description ?? first.description,
      channel_name: detail?.channel_name ?? first.channel_name,
      published_at: detail?.published_at ?? first.published_at,
      thumbnail_url: detail?.thumbnail_url ?? first.thumbnail_url,
      duration_seconds: detail?.duration_seconds ?? null,
      privacy_status:
        detail?.privacy_status ?? first.playlist_item_privacy_status,
      embeddable: detail?.embeddable ?? null,
      existing_video: existingVideo
        ? {
            id: existingVideo.id,
            title: existingVideo.title,
            status: existingVideo.status,
          }
        : null,
      issues,
    });
  }

  candidates.sort((left, right) => {
    const leftPosition = left.playlist_positions[0] ?? Number.MAX_SAFE_INTEGER;
    const rightPosition = right.playlist_positions[0] ?? Number.MAX_SAFE_INTEGER;
    return leftPosition - rightPosition ||
      left.candidate_key.localeCompare(right.candidate_key);
  });

  const duplicatePlaylistItems = candidates.reduce(
    (total, candidate) =>
      total + Math.max(0, candidate.playlist_positions.length - 1),
    0,
  );
  const count = (classification: YouTubeCandidateClassification) =>
    candidates.filter((candidate) => candidate.classification === classification)
      .length;
  const counts = {
    playlist_items: input.provider_data.items.length,
    unique_candidates: candidates.length,
    unique_video_ids: candidates.filter((candidate) => candidate.youtube_id).length,
    duplicate_playlist_items: duplicatePlaylistItems,
    available: count("new") + count("existing"),
    new_videos: count("new"),
    existing_videos: count("existing"),
    private: count("private"),
    deleted: count("deleted"),
    unavailable: count("unavailable"),
    malformed: count("malformed"),
    non_embeddable: candidates.filter(
      (candidate) => candidate.embeddable === false,
    ).length,
  };
  const mutationDetected =
    canonicalJson(input.database_snapshot_before) !==
    canonicalJson(input.database_snapshot_after);
  const checksumPayload = {
    contract_version: YOUTUBE_PLAYLIST_PREVIEW_VERSION,
    source: input.provider_data.source,
    counts,
    database_snapshot_before: input.database_snapshot_before,
    database_snapshot_after: input.database_snapshot_after,
    candidates,
  };

  return {
    contract_version: YOUTUBE_PLAYLIST_PREVIEW_VERSION,
    mode: "preview",
    mutation_performed: false,
    mutation_detected: mutationDetected,
    fetched_at: input.fetched_at ?? new Date().toISOString(),
    source: input.provider_data.source,
    provider_request_count: input.provider_data.provider_request_count,
    counts,
    database_snapshot_before: input.database_snapshot_before,
    database_snapshot_after: input.database_snapshot_after,
    candidates,
    preview_checksum: await sha256(checksumPayload),
  };
}

export async function loadExistingVideos(
  client: any,
): Promise<ExistingVideoRecord[]> {
  const rows: ExistingVideoRecord[] = [];
  for (let from = 0; ; from += DATABASE_PAGE_SIZE) {
    const { data, error } = await client
      .from("videos")
      .select("id,youtube_id,youtube_url,title,status")
      .order("id", { ascending: true })
      .range(from, from + DATABASE_PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as ExistingVideoRecord[];
    rows.push(...page);
    if (page.length < DATABASE_PAGE_SIZE) return rows;
  }
}

export async function loadVideoDatabaseSnapshot(
  client: any,
): Promise<VideoDatabaseSnapshot> {
  const [videos, entities, bindings] = await Promise.all([
    client.from("videos").select("id", { count: "exact", head: true }),
    client
      .from("entities")
      .select("id", { count: "exact", head: true })
      .eq("entity_type", "video"),
    client
      .from("entity_canonical_bindings")
      .select("entity_id", { count: "exact", head: true })
      .not("video_id", "is", null),
  ]);
  if (videos.error) throw videos.error;
  if (entities.error) throw entities.error;
  if (bindings.error) throw bindings.error;
  return {
    video_count: videos.count ?? 0,
    video_entity_count: entities.count ?? 0,
    video_binding_count: bindings.count ?? 0,
  };
}
