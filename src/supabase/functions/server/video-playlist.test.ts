import assert from "node:assert/strict";
import test from "node:test";
import {
  buildYouTubePlaylistPreview,
  inferYouTubeVideoFormat,
  normalizeYouTubeVideoId,
  parseYouTubeDurationSeconds,
  parseYouTubePlaylistId,
  YouTubePlaylistPreviewError,
  type YouTubePlaylistProviderData,
  type VideoDatabaseSnapshot,
} from "./video-playlist.ts";

const EMPTY_SNAPSHOT: VideoDatabaseSnapshot = {
  video_count: 0,
  video_entity_count: 0,
  video_binding_count: 0,
};

function providerFixture(): YouTubePlaylistProviderData {
  return {
    source: {
      playlist_id: "PL_stage7_fixture_12345",
      title: "Stage 7 fixture",
      description: null,
      channel_name: "WasteDB test",
      privacy_status: "unlisted",
      provider_item_count: 4,
    },
    items: [
      {
        playlist_item_id: "item-a-1",
        position: 0,
        youtube_id: "abc123DEF_0",
        title: "Material recovery",
        description: "A fixture video.",
        channel_name: "Fixture channel",
        published_at: "2026-01-01T00:00:00Z",
        thumbnail_url: "https://example.com/a.jpg",
        playlist_item_privacy_status: "public",
      },
      {
        playlist_item_id: "item-a-2",
        position: 1,
        youtube_id: "abc123DEF_0",
        title: "Material recovery",
        description: "A duplicate playlist item.",
        channel_name: "Fixture channel",
        published_at: "2026-01-01T00:00:00Z",
        thumbnail_url: "https://example.com/a.jpg",
        playlist_item_privacy_status: "public",
      },
      {
        playlist_item_id: "item-private",
        position: 2,
        youtube_id: "xyz987ABC_1",
        title: "Private video",
        description: null,
        channel_name: null,
        published_at: null,
        thumbnail_url: null,
        playlist_item_privacy_status: "private",
      },
      {
        playlist_item_id: "item-malformed",
        position: 3,
        youtube_id: null,
        title: "Malformed item",
        description: null,
        channel_name: null,
        published_at: null,
        thumbnail_url: null,
        playlist_item_privacy_status: null,
      },
    ],
    video_details: new Map([
      [
        "abc123DEF_0",
        {
          youtube_id: "abc123DEF_0",
          title: "Material recovery",
          description: "A fixture video.",
          channel_name: "Fixture channel",
          published_at: "2026-01-01T00:00:00Z",
          thumbnail_url: "https://example.com/a.jpg",
          duration_seconds: 3723,
          privacy_status: "public",
          upload_status: "processed",
          embeddable: true,
        },
      ],
    ]),
    provider_request_count: 4,
  };
}

test("parses a YouTube playlist URL and ignores tracking parameters", () => {
  assert.equal(
    parseYouTubePlaylistId(
      "https://youtube.com/playlist?list=PL_stage7_fixture_12345&si=tracking",
    ),
    "PL_stage7_fixture_12345",
  );
});

test("rejects non-YouTube playlist hosts", () => {
  assert.throws(
    () =>
      parseYouTubePlaylistId(
        "https://example.com/playlist?list=PL_stage7_fixture_12345",
      ),
    (error: unknown) =>
      error instanceof YouTubePlaylistPreviewError &&
      error.code === "invalid_playlist_host",
  );
});

test("normalizes common YouTube video URL forms", () => {
  assert.equal(
    normalizeYouTubeVideoId("https://www.youtube.com/watch?v=abc123DEF_0"),
    "abc123DEF_0",
  );
  assert.equal(
    normalizeYouTubeVideoId("https://youtu.be/abc123DEF_0?t=20"),
    "abc123DEF_0",
  );
  assert.equal(
    normalizeYouTubeVideoId("https://youtube.com/shorts/abc123DEF_0"),
    "abc123DEF_0",
  );
  assert.equal(normalizeYouTubeVideoId("https://example.com/video"), null);
});

test("infers the Shorts presentation hint from shorts URLs", () => {
  assert.equal(
    inferYouTubeVideoFormat("https://www.youtube.com/shorts/abc123DEF_0"),
    "shorts",
  );
  assert.equal(
    inferYouTubeVideoFormat("https://www.youtube.com/watch?v=abc123DEF_0"),
    "standard",
  );
  assert.equal(inferYouTubeVideoFormat("abc123DEF_0"), null);
});

test("converts YouTube ISO durations to seconds", () => {
  assert.equal(parseYouTubeDurationSeconds("PT1H2M3S"), 3723);
  assert.equal(parseYouTubeDurationSeconds("PT45S"), 45);
  assert.equal(parseYouTubeDurationSeconds("not-a-duration"), null);
});

test("builds a deduplicated, non-mutating playlist preview", async () => {
  const preview = await buildYouTubePlaylistPreview({
    provider_data: providerFixture(),
    existing_videos: [],
    database_snapshot_before: EMPTY_SNAPSHOT,
    database_snapshot_after: EMPTY_SNAPSHOT,
    fetched_at: "2026-06-29T00:00:00Z",
  });

  assert.equal(preview.mode, "preview");
  assert.equal(preview.mutation_performed, false);
  assert.equal(preview.mutation_detected, false);
  assert.deepEqual(preview.counts, {
    playlist_items: 4,
    unique_candidates: 3,
    unique_video_ids: 2,
    duplicate_playlist_items: 1,
    available: 1,
    new_videos: 1,
    existing_videos: 0,
    private: 1,
    deleted: 0,
    unavailable: 0,
    malformed: 1,
    non_embeddable: 0,
  });
  assert.equal(preview.candidates[0].duplicate_in_playlist, true);
  assert.deepEqual(preview.candidates[0].playlist_positions, [1, 2]);
  assert.match(preview.preview_checksum, /^[a-f0-9]{64}$/);
});

test("keeps the checksum stable across fetch timestamps and request counts", async () => {
  const firstProvider = providerFixture();
  const secondProvider = providerFixture();
  secondProvider.provider_request_count = 99;
  const first = await buildYouTubePlaylistPreview({
    provider_data: firstProvider,
    existing_videos: [],
    database_snapshot_before: EMPTY_SNAPSHOT,
    database_snapshot_after: EMPTY_SNAPSHOT,
    fetched_at: "2026-06-29T00:00:00Z",
  });
  const second = await buildYouTubePlaylistPreview({
    provider_data: secondProvider,
    existing_videos: [],
    database_snapshot_before: EMPTY_SNAPSHOT,
    database_snapshot_after: EMPTY_SNAPSHOT,
    fetched_at: "2026-06-30T00:00:00Z",
  });
  assert.equal(first.preview_checksum, second.preview_checksum);
});

test("classifies existing videos and detects a concurrent database change", async () => {
  const preview = await buildYouTubePlaylistPreview({
    provider_data: providerFixture(),
    existing_videos: [
      {
        id: "00000000-0000-0000-0000-000000000001",
        youtube_id: "abc123DEF_0",
        youtube_url: "https://www.youtube.com/watch?v=abc123DEF_0",
        title: "Existing fixture",
        status: "draft",
      },
    ],
    database_snapshot_before: EMPTY_SNAPSHOT,
    database_snapshot_after: { ...EMPTY_SNAPSHOT, video_count: 1 },
  });

  assert.equal(preview.candidates[0].classification, "existing");
  assert.equal(preview.counts.existing_videos, 1);
  assert.equal(preview.mutation_detected, true);
});
