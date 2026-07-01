// Utility for fetching the Stage 7 non-mutating content-mapping preview.
// The preview endpoint is read-only and admin-only. It identifies candidate
// relationships and content mappings without writing any graph records.

import type {
  ContentMappingPreviewReport,
  ContentMappingQuarantineReport,
} from "../types/contentMappingPreview";
import { apiCall } from "./api";

export type {
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
export async function triggerContentMappingQuarantine(): Promise<
  ContentMappingQuarantineReport & { success: boolean }
> {
  return apiCall("/graph/content-mappings/quarantine", {
    method: "POST",
    body: JSON.stringify({ confirmation: "quarantine content-mapping issues" }),
  }) as Promise<ContentMappingQuarantineReport & { success: boolean }>;
}
