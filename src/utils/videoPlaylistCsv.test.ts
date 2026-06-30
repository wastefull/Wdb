import assert from "node:assert/strict";
import test from "node:test";
import type {
  VideoPlaylistCandidate,
  VideoPlaylistPreview,
} from "../types/videoPlaylist";
import {
  buildVideoTriageCsv,
  isSuggested3dPrintingVideo,
  videoTriageCsvFilename,
} from "./videoPlaylistCsv";
import { previewVideoTriageCsv } from "./videoTriageCsvImport";

function candidate(
  overrides: Partial<VideoPlaylistCandidate> = {},
): VideoPlaylistCandidate {
  return {
    candidate_key: "abc123DEF_0",
    youtube_id: "abc123DEF_0",
    youtube_url: "https://www.youtube.com/watch?v=abc123DEF_0",
    playlist_item_ids: ["item-1"],
    playlist_positions: [1],
    duplicate_in_playlist: false,
    classification: "new",
    title: "Recycling filament for 3D printing",
    description: "A practical additive manufacturing example.",
    channel_name: "Fixture channel",
    published_at: "2026-01-01T00:00:00Z",
    thumbnail_url: null,
    duration_seconds: 120,
    privacy_status: "public",
    embeddable: false,
    existing_video: null,
    issues: ["embedding_disabled"],
    ...overrides,
  };
}

function preview(item: VideoPlaylistCandidate): VideoPlaylistPreview {
  return {
    contract_version: "stage-7-youtube-playlist-preview-v1",
    mode: "preview",
    mutation_performed: false,
    mutation_detected: false,
    fetched_at: "2026-06-29T12:00:00Z",
    source: {
      playlist_id: "PL_stage7_fixture_12345",
      title: "Fixture playlist",
      description: null,
      channel_name: "Fixture channel",
      privacy_status: "unlisted",
      provider_item_count: 1,
    },
    provider_request_count: 3,
    counts: {
      playlist_items: 1,
      unique_candidates: 1,
      unique_video_ids: 1,
      duplicate_playlist_items: 0,
      available: 1,
      new_videos: 1,
      existing_videos: 0,
      private: 0,
      deleted: 0,
      unavailable: 0,
      malformed: 0,
      non_embeddable: 1,
    },
    database_snapshot_before: {
      video_count: 0,
      video_entity_count: 0,
      video_binding_count: 0,
    },
    database_snapshot_after: {
      video_count: 0,
      video_entity_count: 0,
      video_binding_count: 0,
    },
    candidates: [item],
    preview_checksum:
      "d196045f0427a5e8a33144f096d48aec6e331628b5087f54719362a97c8f3512",
  };
}

test("suggests the governed 3D printing topic from substantive metadata", () => {
  assert.equal(isSuggested3dPrintingVideo(candidate()), true);
  assert.equal(
    isSuggested3dPrintingVideo(
      candidate({
        title: "Community education",
        description: "How nonprofits build educational programs.",
      }),
    ),
    false,
  );
});

test("exports review fields, topic suggestions, and external playback state", () => {
  const csv = buildVideoTriageCsv(preview(candidate()));
  assert.equal(csv.startsWith("\uFEFF"), true);
  assert.match(csv, /"suggested_topic_tags"/);
  assert.match(csv, /"disposition"/);
  assert.match(csv, /"material_ids_or_slugs"/);
  assert.match(csv, /"editorial_targets"/);
  assert.match(csv, /"3d_printing"/);
  assert.match(csv, /"embedding_disabled"/);
  assert.match(csv, /"true","true"/);
});

test("protects provider text from spreadsheet formula execution", () => {
  const csv = buildVideoTriageCsv(
    preview(candidate({ title: '=HYPERLINK("https://example.com")' })),
  );
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/example\.com""\)"/);
});

test("round-trips spreadsheet-protected YouTube IDs beginning with a hyphen", async () => {
  const youtubeId = "-GeC1OuJuvY";
  const csv = buildVideoTriageCsv(
    preview(
      candidate({
        candidate_key: youtubeId,
        youtube_id: youtubeId,
        youtube_url: `https://www.youtube.com/watch?v=${youtubeId}`,
      }),
    ),
  );
  assert.match(csv, /"'-GeC1OuJuvY"/);
  const result = await previewVideoTriageCsv(csv);
  assert.equal(result.validForStaging, true);
  assert.equal(result.rows[0].youtubeId, youtubeId);
});

test("uses the preview date in the export filename", () => {
  assert.equal(
    videoTriageCsvFilename("2026-06-29T12:00:00Z"),
    "wastedb-video-triage-2026-06-29.csv",
  );
});

test("validates an untouched worksheet for staging but not draft apply", async () => {
  const result = await previewVideoTriageCsv(
    buildVideoTriageCsv(preview(candidate())),
  );
  assert.equal(result.validForStaging, true);
  assert.equal(result.readyForDraftApply, false);
  assert.equal(result.counts.rows, 1);
  assert.equal(result.counts.unreviewedAvailable, 1);
  assert.equal(result.counts.suggested3dPrinting, 1);
  assert.equal(result.counts.reviewed3dPrinting, 0);
});

test("keeps rejected suggestions separate from reviewed editorial triage", async () => {
  const csv = buildVideoTriageCsv(preview(candidate())).replace(
    '"3d_printing","","","","",""\r\n',
    '"3d_printing","editorial_lead","","","article","False positive suggestion."\r\n',
  );
  const result = await previewVideoTriageCsv(csv);
  assert.equal(result.validForStaging, true);
  assert.equal(result.readyForDraftApply, true);
  assert.equal(result.counts.editorialLead, 1);
  assert.equal(result.counts.suggested3dPrinting, 1);
  assert.equal(result.counts.reviewed3dPrinting, 0);
  assert.deepEqual(result.rows[0].editorialTargets, ["article"]);
});

test("rejects unknown dispositions without staging partial rows", async () => {
  const csv = buildVideoTriageCsv(preview(candidate())).replace(
    '"3d_printing","","","","",""\r\n',
    '"3d_printing","publish_now","","","",""\r\n',
  );
  const result = await previewVideoTriageCsv(csv);
  assert.equal(result.validForStaging, false);
  assert.equal(result.readyForDraftApply, false);
  assert.equal(result.counts.errors, 1);
  assert.equal(result.rows.length, 0);
});
