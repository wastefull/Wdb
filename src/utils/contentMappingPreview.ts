// Utility for fetching the Stage 7 non-mutating content-mapping preview.
// The preview endpoint is read-only and admin-only. It identifies candidate
// relationships and content mappings without writing any graph records.

import type {
  ContentMappingApplyReport,
  ContentMappingCapabilities,
  ContentMappingPreviewReport,
  ContentMappingQuarantineReport,
} from "../types/contentMappingPreview";
import { apiCall } from "./api";

export type {
  ContentMappingApplyReport,
  ContentMappingCapabilities,
  ContentMappingPreviewReport,
  ContentMappingQuarantineReport,
} from "../types/contentMappingPreview";

/**
 * Fetch a non-mutating preview of candidate relationship and content-mapping
 * candidates from existing authoritative data.
 *
 * - Does not create entity_relationships, content_entities, or any graph record.
 * - Unresolvable candidates are returned as `awaiting_review`, never silently
 *   dropped or treated as "no relationship exists."
 * - Only conservative semantics are suggested: `related_to` for
 *   material→material pairs, `discusses` for content→material pairs.
 *
 * @param options.sampleLimit Number of sample candidates per category (1–200, default 50).
 */
export async function fetchContentMappingPreview(
  options: { sampleLimit?: number } = {},
): Promise<ContentMappingPreviewReport> {
  const params = new URLSearchParams();
  if (options.sampleLimit !== undefined) {
    params.set("sample_limit", String(options.sampleLimit));
  }
  const qs = params.toString();
  const path = `/graph/content-mappings/preview${qs ? `?${qs}` : ""}`;
  return apiCall(path, {
    method: "GET",
  }) as Promise<ContentMappingPreviewReport>;
}

/**
 * Write all awaiting_review content-mapping candidates as immutable
 * graph_migration_issues records for human review.
 *
 * Creates one graph_migration_runs row per invocation; old runs remain
 * as audit history. Does NOT write entity_relationships or content_entities.
 *
 * Requires the exact confirmation string "quarantine content-mapping issues"
 * to prevent accidental invocation.
 */
export async function triggerContentMappingQuarantine(
  analysisChecksum: string,
): Promise<
  ContentMappingQuarantineReport & { success: boolean }
> {
  return apiCall("/graph/content-mappings/quarantine", {
    method: "POST",
    body: JSON.stringify({
      confirmation: "quarantine content-mapping issues",
      expected_analysis_checksum: analysisChecksum,
    }),
  }) as Promise<ContentMappingQuarantineReport & { success: boolean }>;
}

/** Fetch whether the content-mapping apply gate is enabled. */
export async function fetchContentMappingCapabilities(): Promise<ContentMappingCapabilities> {
  return apiCall("/graph/content-mappings/capabilities", {
    method: "GET",
  }) as Promise<ContentMappingCapabilities>;
}

/**
 * Apply only explicitly selected resolved candidates. Graph records, outbox
 * events, migration reconciliation, and audit summary commit atomically.
 *
 * Requires:
 * - CONTENT_MAPPING_APPLY_ENABLED=true on the server
 * - The `analysis_checksum` from the most recent preview report
 * - One or more candidate keys explicitly selected by the reviewer
 */
export async function triggerContentMappingApply(
  analysisChecksum: string,
  approvedCandidateKeys: string[],
): Promise<ContentMappingApplyReport & { success: boolean }> {
  return apiCall("/graph/content-mappings/apply", {
    method: "POST",
    body: JSON.stringify({
      confirmation: "apply content-mapping relationships",
      expected_analysis_checksum: analysisChecksum,
      approved_candidate_keys: approvedCandidateKeys,
    }),
  }) as Promise<ContentMappingApplyReport & { success: boolean }>;
}
