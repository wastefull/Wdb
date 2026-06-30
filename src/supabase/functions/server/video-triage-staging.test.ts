import assert from "node:assert/strict";
import test from "node:test";
import type {
  VideoPlaylistCandidate,
  VideoPlaylistPreview,
} from "../../../types/videoPlaylist";
import { buildVideoTriageCsv } from "../../../utils/videoPlaylistCsv";
import { previewVideoTriageCsv } from "../../../utils/videoTriageCsvImport";
import {
  prepareVideoTriageWorksheet,
  VideoTriageStagingError,
} from "./video-triage-staging";

const USER_ID = "00000000-0000-0000-0000-000000000073";

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
    title: "Fixture video",
    description: "Fixture description",
    channel_name: "Fixture channel",
    published_at: "2026-01-01T00:00:00Z",
    thumbnail_url: null,
    duration_seconds: 120,
    privacy_status: "public",
    embeddable: true,
    existing_video: null,
    issues: [],
    ...overrides,
  };
}

function playlistPreview(item: VideoPlaylistCandidate): VideoPlaylistPreview {
  return {
    contract_version: "stage-7-youtube-playlist-preview-v1",
    mode: "preview",
    mutation_performed: false,
    mutation_detected: false,
    fetched_at: "2026-06-30T12:00:00Z",
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
      non_embeddable: 0,
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

async function request(item = candidate()) {
  const preview = playlistPreview(item);
  const worksheetCsv = buildVideoTriageCsv(preview);
  const worksheet = await previewVideoTriageCsv(worksheetCsv);
  return {
    worksheetCsv,
    worksheet,
    body: {
      source_filename: "fixture.csv",
      source_playlist_title: preview.source.title,
      worksheet_csv: worksheetCsv,
      worksheet,
    },
  };
}

test("prepares a validated worksheet for transactional database staging", async () => {
  const fixture = await request();
  const prepared = await prepareVideoTriageWorksheet(fixture.body, USER_ID);
  assert.equal(prepared.p_source_playlist_id, "PL_stage7_fixture_12345");
  assert.equal(prepared.p_items.length, 1);
  assert.equal(prepared.p_items[0].candidate_key, "abc123DEF_0");
  assert.equal(prepared.p_items[0].disposition, null);
  assert.deepEqual(prepared.p_items[0].playlist_positions, [1]);
});

test("rejects worksheet bytes changed after local validation", async () => {
  const fixture = await request();
  fixture.body.worksheet_csv += "\n";
  await assert.rejects(
    prepareVideoTriageWorksheet(fixture.body, USER_ID),
    (error: unknown) =>
      error instanceof VideoTriageStagingError &&
      error.code === "worksheet_checksum_mismatch",
  );
});

test("rejects normalized rows with mixed preview provenance", async () => {
  const fixture = await request();
  fixture.worksheet.rows[0].playlistId = "different-playlist";
  await assert.rejects(
    prepareVideoTriageWorksheet(fixture.body, USER_ID),
    (error: unknown) =>
      error instanceof VideoTriageStagingError &&
      error.code === "worksheet_provenance_mismatch",
  );
});

test("rejects unavailable candidates assigned a publishing disposition", async () => {
  const fixture = await request(
    candidate({
      youtube_id: null,
      youtube_url: null,
      classification: "private",
      privacy_status: "private",
    }),
  );
  fixture.worksheet.rows[0].disposition = "material_video";
  await assert.rejects(
    prepareVideoTriageWorksheet(fixture.body, USER_ID),
    (error: unknown) =>
      error instanceof VideoTriageStagingError &&
      error.code === "invalid_staging_payload",
  );
});
