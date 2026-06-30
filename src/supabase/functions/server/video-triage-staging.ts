const TRIAGE_CONTRACT_VERSION = "stage-7-youtube-playlist-preview-v1";
const MAX_WORKSHEET_BYTES = 10 * 1024 * 1024;
const MAX_WORKSHEET_ROWS = 1000;

const CLASSIFICATIONS = new Set([
  "new",
  "existing",
  "private",
  "deleted",
  "unavailable",
  "malformed",
]);
const DISPOSITIONS = new Set([
  "material_video",
  "editorial_lead",
  "both",
  "ignore",
]);
const EDITORIAL_TARGETS = new Set(["article", "blog_post", "guide"]);

type UnknownRecord = Record<string, unknown>;

export class VideoTriageStagingError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

function record(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new VideoTriageStagingError(
      `${label} must be an object.`,
      "invalid_staging_payload",
    );
  }
  return value as UnknownRecord;
}

function string(value: unknown, label: string, allowBlank = false): string {
  if (typeof value !== "string" || (!allowBlank && !value.trim())) {
    throw new VideoTriageStagingError(
      `${label} must be ${allowBlank ? "a string" : "a non-empty string"}.`,
      "invalid_staging_payload",
    );
  }
  return value.trim();
}

function nullableString(value: unknown, label: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new VideoTriageStagingError(
      `${label} must be a string or null.`,
      "invalid_staging_payload",
    );
  }
  return value.trim() || null;
}

function stringList(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new VideoTriageStagingError(
      `${label} must be a string array.`,
      "invalid_staging_payload",
    );
  }
  return Array.from(new Set(value.map((item) => item.trim()).filter(Boolean)));
}

function integerList(value: unknown, label: string): number[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((item) => !Number.isInteger(item) || Number(item) <= 0)
  ) {
    throw new VideoTriageStagingError(
      `${label} must contain positive integers.`,
      "invalid_staging_payload",
    );
  }
  return Array.from(new Set(value as number[]));
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

export interface PreparedVideoTriageWorksheet {
  p_source_playlist_id: string;
  p_source_playlist_title: string | null;
  p_preview_contract_version: string;
  p_source_preview_checksum: string;
  p_worksheet_checksum: string;
  p_source_filename: string | null;
  p_created_by: string;
  p_validation_summary: UnknownRecord;
  p_items: UnknownRecord[];
}

export async function prepareVideoTriageWorksheet(
  input: unknown,
  createdBy: string,
): Promise<PreparedVideoTriageWorksheet> {
  const body = record(input, "Request body");
  if (typeof body.worksheet_csv !== "string") {
    throw new VideoTriageStagingError(
      "Worksheet CSV must be a string.",
      "invalid_staging_payload",
    );
  }
  const worksheetCsv = body.worksheet_csv;
  const worksheetBytes = new TextEncoder().encode(worksheetCsv).length;
  if (worksheetBytes === 0 || worksheetBytes > MAX_WORKSHEET_BYTES) {
    throw new VideoTriageStagingError(
      "Worksheet CSV must be between 1 byte and 10 MB.",
      "invalid_worksheet_size",
      413,
    );
  }

  const worksheet = record(body.worksheet, "Validated worksheet");
  if (worksheet.validForStaging !== true) {
    throw new VideoTriageStagingError(
      "The worksheet must pass local validation before staging.",
      "worksheet_not_valid_for_staging",
    );
  }

  const worksheetChecksum = string(
    worksheet.worksheetChecksum,
    "Worksheet checksum",
  );
  if (!/^[a-f0-9]{64}$/.test(worksheetChecksum)) {
    throw new VideoTriageStagingError(
      "Worksheet checksum must be lowercase SHA-256.",
      "invalid_worksheet_checksum",
    );
  }
  if ((await sha256(worksheetCsv)) !== worksheetChecksum) {
    throw new VideoTriageStagingError(
      "Worksheet bytes changed after local validation.",
      "worksheet_checksum_mismatch",
      409,
    );
  }

  const playlistId = string(worksheet.playlistId, "Playlist ID");
  const sourcePreviewChecksum = string(
    worksheet.sourcePreviewChecksum,
    "Source preview checksum",
  );
  if (!/^[a-f0-9]{64}$/.test(sourcePreviewChecksum)) {
    throw new VideoTriageStagingError(
      "Source preview checksum must be lowercase SHA-256.",
      "invalid_preview_checksum",
    );
  }

  if (!Array.isArray(worksheet.rows)) {
    throw new VideoTriageStagingError(
      "Validated worksheet rows must be an array.",
      "invalid_staging_payload",
    );
  }
  if (worksheet.rows.length < 1 || worksheet.rows.length > MAX_WORKSHEET_ROWS) {
    throw new VideoTriageStagingError(
      `Validated worksheet must contain between 1 and ${MAX_WORKSHEET_ROWS} rows.`,
      "invalid_worksheet_rows",
    );
  }

  const seenRows = new Set<number>();
  const seenCandidates = new Set<string>();
  const items = worksheet.rows.map((value, index) => {
    const row = record(value, `Worksheet row ${index + 1}`);
    if (!Number.isInteger(row.sourceRowNumber) || Number(row.sourceRowNumber) < 2) {
      throw new VideoTriageStagingError(
        `Worksheet row ${index + 1} has an invalid source row number.`,
        "invalid_staging_payload",
      );
    }
    const sourceRowNumber = Number(row.sourceRowNumber);
    if (seenRows.has(sourceRowNumber)) {
      throw new VideoTriageStagingError(
        `Worksheet source row ${sourceRowNumber} is duplicated.`,
        "duplicate_worksheet_row",
      );
    }
    seenRows.add(sourceRowNumber);

    if (row.contractVersion !== TRIAGE_CONTRACT_VERSION) {
      throw new VideoTriageStagingError(
        `Worksheet row ${sourceRowNumber} has an unsupported contract.`,
        "worksheet_provenance_mismatch",
      );
    }
    if (row.previewChecksum !== sourcePreviewChecksum || row.playlistId !== playlistId) {
      throw new VideoTriageStagingError(
        `Worksheet row ${sourceRowNumber} has mixed preview provenance.`,
        "worksheet_provenance_mismatch",
      );
    }

    const classification = string(
      row.classification,
      `Worksheet row ${sourceRowNumber} classification`,
    );
    if (!CLASSIFICATIONS.has(classification)) {
      throw new VideoTriageStagingError(
        `Worksheet row ${sourceRowNumber} has an unsupported classification.`,
        "invalid_staging_payload",
      );
    }

    const youtubeId = nullableString(
      row.youtubeId,
      `Worksheet row ${sourceRowNumber} YouTube ID`,
    );
    if (
      (classification === "new" || classification === "existing") &&
      (!youtubeId || !/^[A-Za-z0-9_-]{11}$/.test(youtubeId))
    ) {
      throw new VideoTriageStagingError(
        `Available worksheet row ${sourceRowNumber} requires a valid YouTube ID.`,
        "invalid_staging_payload",
      );
    }

    const positions = integerList(
      row.playlistPositions,
      `Worksheet row ${sourceRowNumber} positions`,
    );
    const candidateKey = youtubeId ?? `${classification}:${positions.join("-")}`;
    if (seenCandidates.has(candidateKey)) {
      throw new VideoTriageStagingError(
        `Worksheet candidate '${candidateKey}' is duplicated.`,
        "duplicate_worksheet_candidate",
      );
    }
    seenCandidates.add(candidateKey);

    const disposition = nullableString(
      row.disposition,
      `Worksheet row ${sourceRowNumber} disposition`,
    );
    if (disposition && !DISPOSITIONS.has(disposition)) {
      throw new VideoTriageStagingError(
        `Worksheet row ${sourceRowNumber} has an unsupported disposition.`,
        "invalid_staging_payload",
      );
    }
    if (
      classification !== "new" &&
      classification !== "existing" &&
      disposition &&
      disposition !== "ignore"
    ) {
      throw new VideoTriageStagingError(
        `Unavailable worksheet row ${sourceRowNumber} may only be ignored.`,
        "invalid_staging_payload",
      );
    }

    const editorialTargets = stringList(
      row.editorialTargets,
      `Worksheet row ${sourceRowNumber} editorial targets`,
    );
    if (editorialTargets.some((target) => !EDITORIAL_TARGETS.has(target))) {
      throw new VideoTriageStagingError(
        `Worksheet row ${sourceRowNumber} has an unsupported editorial target.`,
        "invalid_staging_payload",
      );
    }

    const durationSeconds = row.durationSeconds;
    if (
      durationSeconds !== null &&
      (!Number.isInteger(durationSeconds) || Number(durationSeconds) < 0)
    ) {
      throw new VideoTriageStagingError(
        `Worksheet row ${sourceRowNumber} has an invalid duration.`,
        "invalid_staging_payload",
      );
    }
    if (row.embeddable !== null && typeof row.embeddable !== "boolean") {
      throw new VideoTriageStagingError(
        `Worksheet row ${sourceRowNumber} has an invalid embeddable value.`,
        "invalid_staging_payload",
      );
    }

    const originalPayload = record(
      row.originalPayload,
      `Worksheet row ${sourceRowNumber} original payload`,
    );
    if (
      originalPayload.contract_version !== TRIAGE_CONTRACT_VERSION ||
      originalPayload.preview_checksum !== sourcePreviewChecksum ||
      originalPayload.playlist_id !== playlistId
    ) {
      throw new VideoTriageStagingError(
        `Worksheet row ${sourceRowNumber} original payload does not match its provenance.`,
        "worksheet_provenance_mismatch",
      );
    }

    return {
      source_row_number: sourceRowNumber,
      candidate_key: candidateKey,
      provider_video_id: youtubeId,
      provider_url: nullableString(
        row.youtubeUrl,
        `Worksheet row ${sourceRowNumber} URL`,
      ),
      playlist_positions: positions,
      title: nullableString(row.title, `Worksheet row ${sourceRowNumber} title`),
      description: null,
      channel_name: nullableString(
        row.channelName,
        `Worksheet row ${sourceRowNumber} channel`,
      ),
      duration_seconds: durationSeconds,
      provider_classification: classification,
      privacy_status: nullableString(
        row.privacyStatus,
        `Worksheet row ${sourceRowNumber} privacy status`,
      ),
      embeddable: row.embeddable,
      provider_issues: stringList(
        row.issues,
        `Worksheet row ${sourceRowNumber} issues`,
      ),
      suggested_topic_tags: stringList(
        row.suggestedTopicTags,
        `Worksheet row ${sourceRowNumber} suggested topics`,
      ),
      disposition,
      material_identifiers: stringList(
        row.materialIdentifiers,
        `Worksheet row ${sourceRowNumber} material identifiers`,
      ),
      reviewed_topic_tags: stringList(
        row.reviewedTopicTags,
        `Worksheet row ${sourceRowNumber} reviewed topics`,
      ),
      editorial_targets: editorialTargets,
      review_notes: nullableString(
        row.reviewNotes,
        `Worksheet row ${sourceRowNumber} review notes`,
      ),
      original_payload: originalPayload,
    };
  });

  const issueRows = Array.isArray(worksheet.issues) ? worksheet.issues : [];
  if (
    issueRows.some(
      (issue) =>
        issue &&
        typeof issue === "object" &&
        !Array.isArray(issue) &&
        (issue as UnknownRecord).severity === "error",
    )
  ) {
    throw new VideoTriageStagingError(
      "A worksheet with validation errors cannot be staged.",
      "worksheet_not_valid_for_staging",
    );
  }

  return {
    p_source_playlist_id: playlistId,
    p_source_playlist_title: nullableString(
      body.source_playlist_title,
      "Source playlist title",
    ),
    p_preview_contract_version: TRIAGE_CONTRACT_VERSION,
    p_source_preview_checksum: sourcePreviewChecksum,
    p_worksheet_checksum: worksheetChecksum,
    p_source_filename: nullableString(body.source_filename, "Source filename"),
    p_created_by: createdBy,
    p_validation_summary: {
      valid_for_staging: true,
      ready_for_draft_apply: worksheet.readyForDraftApply === true,
      counts: record(worksheet.counts, "Worksheet counts"),
      warnings: issueRows.filter(
        (issue) =>
          issue &&
          typeof issue === "object" &&
          !Array.isArray(issue) &&
          (issue as UnknownRecord).severity === "warning",
      ).length,
      validated_at: new Date().toISOString(),
      validation_layers: ["browser_csv", "edge_payload", "database_constraints"],
    },
    p_items: items,
  };
}
