import type {
  VideoEditorialTarget,
  VideoPlaylistCandidateClassification,
  VideoTriageCsvIssue,
  VideoTriageCsvPreview,
  VideoTriageCsvRow,
  VideoTriageDisposition,
} from "../types/videoPlaylist";
import { VIDEO_TRIAGE_CSV_COLUMNS } from "./videoPlaylistCsv";

const MAX_WORKSHEET_BYTES = 10 * 1024 * 1024;
const MAX_WORKSHEET_ROWS = 1000;
const CONTRACT_VERSION = "stage-7-youtube-playlist-preview-v1";
const CLASSIFICATIONS = new Set<VideoPlaylistCandidateClassification>([
  "new",
  "existing",
  "private",
  "deleted",
  "unavailable",
  "malformed",
]);
const DISPOSITIONS = new Set<VideoTriageDisposition>([
  "material_video",
  "editorial_lead",
  "both",
  "ignore",
]);
const EDITORIAL_TARGETS = new Set<VideoEditorialTarget>([
  "article",
  "blog_post",
  "guide",
]);

function parseCsvRecords(input: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index++) {
    const character = input[index];
    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ",") {
      record.push(cell);
      cell = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      record.push(cell);
      if (record.some((value) => value.length > 0)) records.push(record);
      record = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error("CSV contains an unterminated quoted field.");
  record.push(cell);
  if (record.some((value) => value.length > 0)) records.push(record);
  return records;
}

function list(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function nullable(value: string): string | null {
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function youtubeIdentifier(value: string): string | null {
  const cleaned = value.trim();
  if (!cleaned) return null;
  const spreadsheetUnprotected = cleaned.startsWith("'")
    ? cleaned.slice(1)
    : cleaned;
  return /^[A-Za-z0-9_-]{11}$/.test(spreadsheetUnprotected)
    ? spreadsheetUnprotected
    : cleaned;
}

function parseBoolean(value: string): boolean | null | undefined {
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) return null;
  if (cleaned === "true") return true;
  if (cleaned === "false") return false;
  return undefined;
}

function parseInteger(value: string): number | null | undefined {
  const cleaned = value.trim();
  if (!cleaned) return null;
  if (!/^\d+$/.test(cleaned)) return undefined;
  return Number(cleaned);
}

function parsePositions(value: string): number[] | null {
  const positions = list(value).map(Number);
  return positions.length > 0 &&
    positions.every((position) => Number.isInteger(position) && position > 0)
    ? positions
    : null;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function emptyPreview(
  worksheetChecksum: string,
  issues: VideoTriageCsvIssue[],
): VideoTriageCsvPreview {
  return {
    validForStaging: false,
    readyForDraftApply: false,
    worksheetChecksum,
    sourcePreviewChecksum: null,
    playlistId: null,
    rows: [],
    issues,
    counts: {
      rows: 0,
      errors: issues.filter((issue) => issue.severity === "error").length,
      warnings: issues.filter((issue) => issue.severity === "warning").length,
      available: 0,
      unavailable: 0,
      reviewed: 0,
      unreviewedAvailable: 0,
      materialVideo: 0,
      editorialLead: 0,
      both: 0,
      ignored: 0,
      suggested3dPrinting: 0,
      reviewed3dPrinting: 0,
    },
  };
}

export async function previewVideoTriageCsv(
  input: string,
): Promise<VideoTriageCsvPreview> {
  const worksheetChecksum = await sha256(input);
  const issues: VideoTriageCsvIssue[] = [];
  if (new TextEncoder().encode(input).length > MAX_WORKSHEET_BYTES) {
    return emptyPreview(worksheetChecksum, [
      {
        severity: "error",
        row: null,
        message: "Triage worksheet exceeds the 10 MB validation limit.",
      },
    ]);
  }

  let records: string[][];
  try {
    records = parseCsvRecords(input.replace(/^\uFEFF/, ""));
  } catch (error) {
    return emptyPreview(worksheetChecksum, [
      {
        severity: "error",
        row: null,
        message: error instanceof Error ? error.message : String(error),
      },
    ]);
  }
  if (records.length === 0) {
    return emptyPreview(worksheetChecksum, [
      { severity: "error", row: null, message: "Triage worksheet is empty." },
    ]);
  }
  if (records.length - 1 > MAX_WORKSHEET_ROWS) {
    return emptyPreview(worksheetChecksum, [
      {
        severity: "error",
        row: null,
        message: `Triage worksheet exceeds ${MAX_WORKSHEET_ROWS} data rows.`,
      },
    ]);
  }

  const header = records[0].map((column) => column.trim());
  const headerIndexes = new Map<string, number>();
  for (const [index, column] of header.entries()) {
    if (headerIndexes.has(column)) {
      issues.push({
        severity: "error",
        row: 1,
        column,
        message: `Duplicate CSV column '${column}'.`,
      });
    } else {
      headerIndexes.set(column, index);
    }
  }
  for (const column of VIDEO_TRIAGE_CSV_COLUMNS) {
    if (!headerIndexes.has(column)) {
      issues.push({
        severity: "error",
        row: 1,
        column,
        message: `Required CSV column '${column}' is missing.`,
      });
    }
  }
  for (const column of header) {
    if (
      column &&
      !VIDEO_TRIAGE_CSV_COLUMNS.includes(
        column as (typeof VIDEO_TRIAGE_CSV_COLUMNS)[number],
      )
    ) {
      issues.push({
        severity: "warning",
        row: 1,
        column,
        message: `Unknown CSV column '${column}' will be ignored.`,
      });
    }
  }
  if (issues.some((issue) => issue.severity === "error")) {
    return emptyPreview(worksheetChecksum, issues);
  }

  const rows: VideoTriageCsvRow[] = [];
  const get = (record: string[], column: string) =>
    record[headerIndexes.get(column) ?? -1] ?? "";

  for (const [recordIndex, record] of records.slice(1).entries()) {
    const sourceRowNumber = recordIndex + 2;
    const payload = Object.fromEntries(
      header.map((column, index) => [column, record[index] ?? ""]),
    );
    const rowIssues: VideoTriageCsvIssue[] = [];
    const addError = (column: string, message: string) =>
      rowIssues.push({
        severity: "error",
        row: sourceRowNumber,
        column,
        message,
      });
    const addWarning = (column: string, message: string) =>
      rowIssues.push({
        severity: "warning",
        row: sourceRowNumber,
        column,
        message,
      });

    const contractVersion = get(record, "contract_version").trim();
    if (contractVersion !== CONTRACT_VERSION) {
      addError("contract_version", "Unsupported playlist preview contract.");
    }
    const previewChecksum = get(record, "preview_checksum").trim();
    if (!/^[0-9a-f]{64}$/.test(previewChecksum)) {
      addError("preview_checksum", "Preview checksum must be 64 lowercase hex characters.");
    }
    const playlistId = get(record, "playlist_id").trim();
    if (!playlistId) addError("playlist_id", "Playlist ID is required.");
    const playlistPositions = parsePositions(
      get(record, "playlist_positions"),
    );
    if (!playlistPositions) {
      addError("playlist_positions", "At least one positive playlist position is required.");
    }

    const classificationValue = get(record, "classification").trim();
    const classification = CLASSIFICATIONS.has(
      classificationValue as VideoPlaylistCandidateClassification,
    )
      ? (classificationValue as VideoPlaylistCandidateClassification)
      : null;
    if (!classification) {
      addError("classification", `Unknown classification '${classificationValue}'.`);
    }

    const youtubeId = youtubeIdentifier(get(record, "youtube_id"));
    if (
      classification &&
      ["new", "existing"].includes(classification) &&
      (!youtubeId || !/^[A-Za-z0-9_-]{11}$/.test(youtubeId))
    ) {
      addError("youtube_id", "Available candidates require a valid 11-character YouTube ID.");
    }
    const durationSeconds = parseInteger(get(record, "duration_seconds"));
    if (durationSeconds === undefined) {
      addError("duration_seconds", "Duration must be a non-negative integer or blank.");
    }
    const embeddable = parseBoolean(get(record, "embeddable"));
    if (embeddable === undefined) {
      addError("embeddable", "Embeddable must be true, false, or blank.");
    }
    const externalPlaybackOnly = parseBoolean(
      get(record, "external_playback_only"),
    );
    if (externalPlaybackOnly === undefined) {
      addError(
        "external_playback_only",
        "External-playback-only must be true or false.",
      );
    }
    if (
      typeof embeddable === "boolean" &&
      typeof externalPlaybackOnly === "boolean" &&
      externalPlaybackOnly !== (embeddable === false)
    ) {
      addError(
        "external_playback_only",
        "External playback must match the provider embeddable value.",
      );
    }
    const eligibleForVideoDraft = parseBoolean(
      get(record, "eligible_for_video_draft"),
    );
    if (eligibleForVideoDraft === undefined) {
      addError(
        "eligible_for_video_draft",
        "Draft eligibility must be true or false.",
      );
    }

    const dispositionValue = get(record, "disposition").trim();
    const disposition = dispositionValue
      ? DISPOSITIONS.has(dispositionValue as VideoTriageDisposition)
        ? (dispositionValue as VideoTriageDisposition)
        : null
      : null;
    if (dispositionValue && !disposition) {
      addError("disposition", `Unknown disposition '${dispositionValue}'.`);
    }
    if (
      classification &&
      !["new", "existing"].includes(classification) &&
      disposition &&
      disposition !== "ignore"
    ) {
      addError(
        "disposition",
        "Unavailable candidates may only remain blank or be ignored.",
      );
    }

    const editorialTargetValues = list(get(record, "editorial_targets"));
    const invalidEditorialTargets = editorialTargetValues.filter(
      (target) => !EDITORIAL_TARGETS.has(target as VideoEditorialTarget),
    );
    if (invalidEditorialTargets.length > 0) {
      addError(
        "editorial_targets",
        `Unknown editorial target(s): ${invalidEditorialTargets.join(", ")}.`,
      );
    }
    const editorialTargets = editorialTargetValues.filter((target) =>
      EDITORIAL_TARGETS.has(target as VideoEditorialTarget),
    ) as VideoEditorialTarget[];
    const materialIdentifiers = list(get(record, "material_ids_or_slugs"));
    const reviewedTopicTags = list(get(record, "reviewed_topic_tags"));
    if (
      disposition === "ignore" &&
      (materialIdentifiers.length > 0 ||
        reviewedTopicTags.length > 0 ||
        editorialTargets.length > 0)
    ) {
      addWarning(
        "disposition",
        "Ignored rows contain review metadata that will not be applied.",
      );
    }

    issues.push(...rowIssues);
    if (rowIssues.some((issue) => issue.severity === "error") || !classification) {
      continue;
    }
    rows.push({
      sourceRowNumber,
      contractVersion,
      previewChecksum,
      playlistId,
      playlistPositions: playlistPositions ?? [],
      youtubeId,
      youtubeUrl: nullable(get(record, "youtube_url")),
      title: nullable(get(record, "title")),
      channelName: nullable(get(record, "channel_name")),
      durationSeconds: durationSeconds ?? null,
      classification,
      privacyStatus: nullable(get(record, "privacy_status")),
      embeddable: embeddable ?? null,
      externalPlaybackOnly: externalPlaybackOnly === true,
      eligibleForVideoDraft: eligibleForVideoDraft === true,
      issues: list(get(record, "issues")),
      suggestedTopicTags: list(get(record, "suggested_topic_tags")),
      disposition,
      materialIdentifiers,
      reviewedTopicTags,
      editorialTargets,
      reviewNotes: nullable(get(record, "review_notes")),
      originalPayload: payload,
    });
  }

  const previewChecksums = new Set(rows.map((row) => row.previewChecksum));
  const playlistIds = new Set(rows.map((row) => row.playlistId));
  if (previewChecksums.size > 1) {
    issues.push({
      severity: "error",
      row: null,
      column: "preview_checksum",
      message: "All worksheet rows must originate from the same preview checksum.",
    });
  }
  if (playlistIds.size > 1) {
    issues.push({
      severity: "error",
      row: null,
      column: "playlist_id",
      message: "All worksheet rows must originate from the same playlist.",
    });
  }

  const availableRows = rows.filter((row) =>
    ["new", "existing"].includes(row.classification),
  );
  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.length - errors;
  const reviewed = rows.filter((row) => row.disposition !== null).length;
  const unreviewedAvailable = availableRows.filter(
    (row) => row.disposition === null,
  ).length;
  const dispositionCount = (disposition: VideoTriageDisposition) =>
    rows.filter((row) => row.disposition === disposition).length;

  return {
    validForStaging: errors === 0 && rows.length === records.length - 1,
    readyForDraftApply: errors === 0 && unreviewedAvailable === 0,
    worksheetChecksum,
    sourcePreviewChecksum: rows[0]?.previewChecksum ?? null,
    playlistId: rows[0]?.playlistId ?? null,
    rows,
    issues,
    counts: {
      rows: rows.length,
      errors,
      warnings,
      available: availableRows.length,
      unavailable: rows.length - availableRows.length,
      reviewed,
      unreviewedAvailable,
      materialVideo: dispositionCount("material_video"),
      editorialLead: dispositionCount("editorial_lead"),
      both: dispositionCount("both"),
      ignored: dispositionCount("ignore"),
      suggested3dPrinting: rows.filter((row) =>
        row.suggestedTopicTags.includes("3d_printing"),
      ).length,
      reviewed3dPrinting: rows.filter((row) =>
        row.reviewedTopicTags.includes("3d_printing"),
      ).length,
    },
  };
}
