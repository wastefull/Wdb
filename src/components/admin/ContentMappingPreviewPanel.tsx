import { useEffect, useState } from "react";
import {
  Archive,
  CheckCircle,
  GitMerge,
  Loader2,
  RefreshCw,
  Zap,
  XCircle,
} from "lucide-react";
import {
  fetchContentMappingPreview,
  fetchContentMappingCapabilities,
  triggerContentMappingQuarantine,
  triggerContentMappingApply,
} from "../../utils/contentMappingPreview";
import type {
  ContentMappingApplyReport,
  ContentMappingCandidate,
  ContentMappingCapabilities,
  ContentMappingPreviewReport,
  ContentMappingQuarantineReport,
  PreviewResolution,
  RelationshipCandidate,
} from "../../types/contentMappingPreview";

// ---------------------------------------------------------------------------
// Resolution badge
// ---------------------------------------------------------------------------

const RESOLUTION_LABELS: Record<PreviewResolution, string> = {
  resolved: "Resolved",
  awaiting_review: "Awaiting review",
  already_mapped: "Already mapped",
};

function ResolutionBadge({ resolution }: { resolution: PreviewResolution }) {
  const cls =
    resolution === "resolved"
      ? "border-waste-compost/40 bg-waste-compost/10 text-waste-compost"
      : resolution === "awaiting_review"
        ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
        : "border-waste-science/30 bg-waste-science/10 text-waste-science";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${cls}`}
    >
      {RESOLUTION_LABELS[resolution]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Summary grid
// ---------------------------------------------------------------------------

function SummaryGrid({
  label,
  summary,
}: {
  label: string;
  summary: ContentMappingPreviewReport["summary"]["relationship_candidates"];
}) {
  const stats = [
    ["Total", summary.total],
    ["Resolved", summary.resolved],
    ["Awaiting review", summary.awaiting_review],
    ["Already mapped", summary.already_mapped],
  ] as const;

  return (
    <div>
      <p className="mb-2 text-[12px] font-medium text-black/60 dark:text-white/60">
        {label}
      </p>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map(([name, value]) => (
          <div
            key={name}
            className="rounded-lg border border-black/10 p-2.5 dark:border-white/10"
          >
            <dt className="text-[10px] text-black/50 dark:text-white/50">
              {name}
            </dt>
            <dd className="mt-0.5 font-mono text-[16px]">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Relationship candidates table
// ---------------------------------------------------------------------------

function RelationshipTable({
  candidates,
}: {
  candidates: RelationshipCandidate[];
}) {
  return (
    <details className="rounded-lg border border-black/10 dark:border-white/10">
      <summary className="cursor-pointer px-4 py-3 text-[13px] font-medium">
        Relationship candidates ({candidates.length} sampled)
      </summary>
      <div className="max-h-[28rem] overflow-auto border-t border-black/10 dark:border-white/10">
        <table className="w-full min-w-[640px] text-left text-[11px]">
          <thead className="sticky top-0 bg-background">
            <tr className="border-b border-black/10 dark:border-white/10">
              <th scope="col" className="px-3 py-2 font-medium">
                Provenance
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Source
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Target
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Resolution
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, i) => (
              <tr
                key={i}
                className="border-b border-black/5 align-top last:border-b-0 dark:border-white/5"
              >
                <td className="px-3 py-2.5 font-mono text-[10px] text-black/60 dark:text-white/60">
                  {c.provenance}
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-medium">{c.source.name ?? "—"}</div>
                  <div className="text-[10px] text-black/50 dark:text-white/50">
                    {c.source.legacy_kv_id}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-medium">{c.target.name ?? "—"}</div>
                  <div className="text-[10px] text-black/50 dark:text-white/50">
                    {c.target.legacy_kv_id}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <ResolutionBadge resolution={c.resolution} />
                </td>
                <td className="px-3 py-2.5 text-black/60 dark:text-white/60">
                  {c.resolution_notes ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Content mapping candidates table
// ---------------------------------------------------------------------------

function ContentMappingTable({
  candidates,
}: {
  candidates: ContentMappingCandidate[];
}) {
  return (
    <details className="rounded-lg border border-black/10 dark:border-white/10">
      <summary className="cursor-pointer px-4 py-3 text-[13px] font-medium">
        Content mapping candidates ({candidates.length} sampled)
      </summary>
      <div className="max-h-[28rem] overflow-auto border-t border-black/10 dark:border-white/10">
        <table className="w-full min-w-[640px] text-left text-[11px]">
          <thead className="sticky top-0 bg-background">
            <tr className="border-b border-black/10 dark:border-white/10">
              <th scope="col" className="px-3 py-2 font-medium">
                Provenance
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Content
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Subject material
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Resolution
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, i) => (
              <tr
                key={i}
                className="border-b border-black/5 align-top last:border-b-0 dark:border-white/5"
              >
                <td className="px-3 py-2.5 font-mono text-[10px] text-black/60 dark:text-white/60">
                  {c.provenance}
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-medium">{c.content.name ?? "—"}</div>
                  <div className="text-[10px] capitalize text-black/50 dark:text-white/50">
                    {c.content.type} · {c.content.domain_id}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-medium">{c.subject.name ?? "—"}</div>
                  <div className="text-[10px] text-black/50 dark:text-white/50">
                    {c.subject.legacy_kv_id}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <ResolutionBadge resolution={c.resolution} />
                </td>
                <td className="px-3 py-2.5 text-black/60 dark:text-white/60">
                  {c.resolution_notes ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Report display
// ---------------------------------------------------------------------------

function ReportDisplay({ report }: { report: ContentMappingPreviewReport }) {
  const proof = report.mutation_proof;
  const unchanged =
    proof.entity_relationships_before === proof.entity_relationships_after &&
    proof.content_entities_before === proof.content_entities_after;

  return (
    <div className="space-y-4">
      {/* Read-only confirmation */}
      <div
        className={`rounded-lg border p-4 ${
          unchanged
            ? "border-waste-compost/30 bg-waste-compost/5"
            : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
        }`}
      >
        <div className="flex items-start gap-2">
          {unchanged ? (
            <CheckCircle className="mt-0.5 size-4 shrink-0 text-waste-compost" />
          ) : (
            <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
          )}
          <div>
            <p className="text-[13px] font-medium">
              {unchanged
                ? "Read-only preview complete"
                : "Contract violation: record counts changed"}
            </p>
            <p className="mt-1 text-[11px] text-black/60 dark:text-white/60">
              {unchanged
                ? `${proof.entity_relationships_before} relationships and ${proof.content_entities_before} content mappings — unchanged before and after preview.`
                : `Relationships: ${proof.entity_relationships_before} → ${proof.entity_relationships_after} · Content mappings: ${proof.content_entities_before} → ${proof.content_entities_after}`}
            </p>
          </div>
        </div>
      </div>

      {/* Summary grids */}
      <SummaryGrid
        label="Relationship candidates (material_links + linked_material_ids)"
        summary={report.summary.relationship_candidates}
      />
      <SummaryGrid
        label="Content mapping candidates (articles + guides)"
        summary={report.summary.content_mapping_candidates}
      />

      {/* Candidate tables */}
      {report.relationship_candidates.length > 0 && (
        <RelationshipTable candidates={report.relationship_candidates} />
      )}
      {report.content_mapping_candidates.length > 0 && (
        <ContentMappingTable candidates={report.content_mapping_candidates} />
      )}

      {/* Footer */}
      <p className="text-[10px] text-black/40 dark:text-white/40">
        Generated at {new Date(report.generated_at).toLocaleString()} ·
        sample_limit {report.sample_limit} · {report.contract_version}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

const SAMPLE_LIMIT_OPTIONS = [10, 25, 50, 100, 200] as const;

export function ContentMappingPreviewPanel() {
  const [sampleLimit, setSampleLimit] = useState<number>(50);
  const [report, setReport] = useState<ContentMappingPreviewReport | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [quarantineResult, setQuarantineResult] = useState<
    (ContentMappingQuarantineReport & { success: boolean }) | null
  >(null);
  const [quarantineError, setQuarantineError] = useState<string | null>(null);
  const [isQuarantining, setIsQuarantining] = useState(false);

  const [capabilities, setCapabilities] =
    useState<ContentMappingCapabilities | null>(null);
  const [applyResult, setApplyResult] = useState<
    (ContentMappingApplyReport & { success: boolean }) | null
  >(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    let active = true;
    fetchContentMappingCapabilities()
      .then((caps) => {
        if (active) setCapabilities(caps);
      })
      .catch(() => {
        if (active) setCapabilities(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const runPreview = async () => {
    setIsLoading(true);
    setError(null);
    setReport(null);
    try {
      setReport(await fetchContentMappingPreview({ sampleLimit }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsLoading(false);
    }
  };

  const awaitingCount =
    (report?.summary.relationship_candidates.awaiting_review ?? 0) +
    (report?.summary.content_mapping_candidates.awaiting_review ?? 0);

  const runQuarantine = async () => {
    if (awaitingCount === 0) return;
    const confirmed = window.confirm(
      `Write ${awaitingCount} awaiting-review candidate(s) as immutable migration issues? This creates a new graph_migration_runs record but does not modify the graph.`,
    );
    if (!confirmed) return;
    setIsQuarantining(true);
    setQuarantineError(null);
    setQuarantineResult(null);
    try {
      setQuarantineResult(await triggerContentMappingQuarantine());
    } catch (caught) {
      setQuarantineError(
        caught instanceof Error ? caught.message : String(caught),
      );
    } finally {
      setIsQuarantining(false);
    }
  };

  const resolvedCount =
    (report?.summary.relationship_candidates.resolved ?? 0) +
    (report?.summary.content_mapping_candidates.resolved ?? 0);

  const runApply = async () => {
    if (!report?.analysis_checksum || resolvedCount === 0) return;
    const confirmed = window.confirm(
      `Create ${resolvedCount} pending-review graph record(s)? Records start as pending_review and require separate activation. This action cannot be undone without a manual delete.`,
    );
    if (!confirmed) return;
    setIsApplying(true);
    setApplyError(null);
    setApplyResult(null);
    try {
      setApplyResult(
        await triggerContentMappingApply(report.analysis_checksum),
      );
    } catch (caught) {
      setApplyError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <section
      id="content-mapping-preview"
      className="retro-card space-y-5 p-6"
      aria-labelledby="content-mapping-preview-title"
    >
      <div className="flex items-start gap-3">
        <GitMerge className="mt-0.5 size-5 shrink-0" />
        <div>
          <h3
            id="content-mapping-preview-title"
            className="font-sniglet text-[16px] normal"
          >
            Content Mapping Preview
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-black/70 dark:text-white/70">
            Read-only preview of candidate material relationships (related_to)
            and content mappings (discusses) inferred from existing
            authoritative data. No graph records are created. Conservative
            semantics only; stronger semantics require separate human review.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor="content-mapping-sample-limit"
            className="mb-1 block text-[11px] font-medium text-black/60 dark:text-white/60"
          >
            Sample limit
          </label>
          <select
            id="content-mapping-sample-limit"
            value={sampleLimit}
            onChange={(e) => setSampleLimit(Number(e.target.value))}
            disabled={isLoading}
            className="rounded-lg border border-black/15 bg-black/5 px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-waste-science disabled:opacity-60 dark:border-white/15 dark:bg-white/5"
          >
            {SAMPLE_LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} candidates
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={runPreview}
          disabled={isLoading}
          className="retro-btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {isLoading
            ? "Running preview…"
            : report
              ? "Re-run preview"
              : "Run preview"}
        </button>
      </div>

      <div aria-live="polite">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-[12px] text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
            <XCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {report && <ReportDisplay report={report} />}
      </div>

      {/* Quarantine action — only shown after a preview has run */}
      {report && awaitingCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800/50 dark:bg-amber-950/10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Archive className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-[13px] font-medium">Write to quarantine</p>
                <p className="mt-1 max-w-xl text-[11px] text-black/60 dark:text-white/60">
                  Preserve all {awaitingCount} awaiting-review candidate
                  {awaitingCount !== 1 ? "s" : ""} as immutable migration-issue
                  records for human review. Does not modify entity_relationships
                  or content_entities.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={runQuarantine}
              disabled={isQuarantining}
              className="retro-btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isQuarantining ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Archive className="size-4" />
              )}
              {isQuarantining ? "Writing issues…" : "Write to quarantine"}
            </button>
          </div>

          <div className="mt-3" aria-live="polite">
            {quarantineError && (
              <p className="text-[12px] text-red-600 dark:text-red-300">
                {quarantineError}
              </p>
            )}
            {quarantineResult && quarantineResult.success && (
              <div className="flex items-start gap-2 rounded-lg border border-waste-compost/30 bg-waste-compost/5 p-3 text-[12px]">
                <CheckCircle className="mt-0.5 size-4 shrink-0 text-waste-compost" />
                <div>
                  <p className="font-medium">
                    {quarantineResult.total_issues_written} issue
                    {quarantineResult.total_issues_written !== 1
                      ? "s"
                      : ""}{" "}
                    written
                  </p>
                  <p className="mt-0.5 text-[11px] text-black/60 dark:text-white/60">
                    {quarantineResult.relationship_issues_written} relationship
                    · {quarantineResult.content_mapping_issues_written} content
                    mapping · run{" "}
                    <code className="font-mono">{quarantineResult.run_id}</code>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apply action — shown after preview when resolved > 0 */}
      {report && resolvedCount > 0 && (
        <div className="rounded-lg border border-waste-science/30 bg-waste-science/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Zap className="mt-0.5 size-4 shrink-0 text-waste-science" />
              <div>
                <p className="text-[13px] font-medium">Apply to graph</p>
                <p className="mt-1 max-w-xl text-[11px] text-black/60 dark:text-white/60">
                  Create {resolvedCount} pending-review graph record
                  {resolvedCount !== 1 ? "s" : ""} (entity_relationships +
                  content_entities). Records remain pending_review until
                  separately activated. Idempotent — re-runs skip existing
                  records.
                  {!capabilities?.apply_enabled && (
                    <span className="ml-1 font-medium text-amber-600 dark:text-amber-400">
                      Gate currently disabled (CONTENT_MAPPING_APPLY_ENABLED).
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={runApply}
              disabled={isApplying || !capabilities?.apply_enabled}
              className="retro-btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isApplying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Zap className="size-4" />
              )}
              {isApplying ? "Applying…" : "Apply to graph"}
            </button>
          </div>

          <div className="mt-3" aria-live="polite">
            {applyError && (
              <p className="text-[12px] text-red-600 dark:text-red-300">
                {applyError}
              </p>
            )}
            {applyResult && applyResult.success && (
              <div className="flex items-start gap-2 rounded-lg border border-waste-compost/30 bg-waste-compost/5 p-3 text-[12px]">
                <CheckCircle className="mt-0.5 size-4 shrink-0 text-waste-compost" />
                <div>
                  <p className="font-medium">Graph records created</p>
                  <p className="mt-0.5 text-[11px] text-black/60 dark:text-white/60">
                    {applyResult.relationships_inserted} rel inserted ·{" "}
                    {applyResult.relationships_skipped} skipped ·{" "}
                    {applyResult.content_mappings_inserted} CE inserted ·{" "}
                    {applyResult.content_mappings_skipped} skipped ·{" "}
                    {applyResult.outbox_events_written} outbox events · run{" "}
                    <code className="font-mono">{applyResult.run_id}</code>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
