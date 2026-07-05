import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Video,
  WandSparkles,
} from "lucide-react";
import * as api from "../../utils/api";
import type {
  VideoPlaylistCapabilities,
  VideoTriageApplyResponse,
  VideoEditorialTarget,
  VideoTriageBatch,
  VideoTriageDisposition,
  VideoTriageItem,
} from "../../types/videoPlaylist";

const PAGE_SIZE = 20;

function splitList(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function ReviewEditor({
  item,
  onSaved,
}: {
  item: VideoTriageItem;
  onSaved: () => Promise<void>;
}) {
  const [disposition, setDisposition] = useState<VideoTriageDisposition | "">(
    item.disposition ?? "",
  );
  const [materials, setMaterials] = useState(
    item.material_identifiers.join("; "),
  );
  const [topics, setTopics] = useState(item.reviewed_topic_tags.join("; "));
  const [targets, setTargets] = useState<VideoEditorialTarget[]>(
    item.editorial_targets,
  );
  const [notes, setNotes] = useState(item.review_notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const unavailable = !["new", "existing"].includes(
    item.provider_classification,
  );
  const toggleTarget = (target: VideoEditorialTarget) => {
    setTargets((current) =>
      current.includes(target)
        ? current.filter((value) => value !== target)
        : [...current, target],
    );
  };

  const save = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await api.reviewVideoTriageItem(item.id, {
        disposition: disposition || null,
        material_identifiers: splitList(materials),
        reviewed_topic_tags: splitList(topics),
        editorial_targets: targets,
        review_notes: notes.trim() || null,
      });
      setMessage(disposition ? "Review saved." : "Review cleared.");
      await onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="rounded-lg border border-black/10 p-4 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium">
            {item.title ?? "Untitled playlist item"}
          </p>
          <p className="mt-1 text-[11px] text-black/50 dark:text-white/50">
            Position {item.playlist_positions.join(", ")} ·{" "}
            {item.channel_name ?? "Unknown channel"} ·{" "}
            {item.provider_classification}
          </p>
          {item.provider_url && (
            <a
              href={item.provider_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[11px] underline underline-offset-2"
            >
              Open on YouTube <ExternalLink className="size-3" />
            </a>
          )}
        </div>
        <span className="rounded-full border border-black/15 px-2 py-1 text-[10px] dark:border-white/15">
          {item.review_status}
        </span>
      </div>

      {(item.provider_issues.length > 0 ||
        item.suggested_topic_tags.length > 0) && (
        <p className="mt-3 text-[11px] text-black/60 dark:text-white/60">
          {item.provider_issues.length > 0 &&
            `Provider: ${item.provider_issues.join(", ")}. `}
          {item.suggested_topic_tags.length > 0 &&
            `Suggested topics: ${item.suggested_topic_tags.join(", ")}.`}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-[11px] font-medium">
          Disposition
          <select
            value={disposition}
            onChange={(event) =>
              setDisposition(event.target.value as VideoTriageDisposition | "")
            }
            className="mt-1 w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
          >
            <option value="">Unreviewed</option>
            {!unavailable && (
              <option value="material_video">Material video</option>
            )}
            {!unavailable && (
              <option value="editorial_lead">Editorial lead</option>
            )}
            {!unavailable && <option value="both">Both</option>}
            <option value="ignore">Ignore</option>
          </select>
        </label>

        <label className="text-[11px] font-medium">
          Material IDs or slugs
          <input
            value={materials}
            onChange={(event) => setMaterials(event.target.value)}
            placeholder="aluminum; pet"
            disabled={!disposition || disposition === "ignore"}
            className="mt-1 w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] disabled:opacity-50 dark:border-white/15"
          />
        </label>

        <label className="text-[11px] font-medium">
          Reviewed topic tags
          <input
            value={topics}
            onChange={(event) => setTopics(event.target.value)}
            placeholder="3d_printing"
            disabled={!disposition || disposition === "ignore"}
            className="mt-1 w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] disabled:opacity-50 dark:border-white/15"
          />
        </label>

        <fieldset
          disabled={!disposition || disposition === "ignore"}
          className="text-[11px]"
        >
          <legend className="font-medium">Editorial targets</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {(["article", "blog_post", "guide"] as const).map((target) => (
              <label key={target} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={targets.includes(target)}
                  onChange={() => toggleTarget(target)}
                />
                {target.replace("_", " ")}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <label className="mt-3 block text-[11px] font-medium">
        Review notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
        />
      </label>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isSaving}
          className="retro-btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isSaving ? "Saving…" : "Save review"}
        </button>
        {message && (
          <span
            className="text-[11px] text-black/60 dark:text-white/60"
            aria-live="polite"
          >
            {message}
          </span>
        )}
      </div>
    </article>
  );
}

export function VideoTriageReviewPanel() {
  const [batches, setBatches] = useState<VideoTriageBatch[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [items, setItems] = useState<VideoTriageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [reviewStatus, setReviewStatus] = useState("unreviewed");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [capabilities, setCapabilities] =
    useState<VideoPlaylistCapabilities | null>(null);
  const [applyResult, setApplyResult] =
    useState<VideoTriageApplyResponse | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBatches = useCallback(async () => {
    const response = await api.listVideoTriageBatches();
    setBatches(response.batches);
    setBatchId((current) => current ?? response.batches[0]?.id ?? null);
  }, []);

  const loadItems = useCallback(async () => {
    if (!batchId) {
      setItems([]);
      setTotal(0);
      return;
    }
    const response = await api.listVideoTriageItems(batchId, {
      offset,
      limit: PAGE_SIZE,
      reviewStatus,
      search: searchQuery,
    });
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
    if (normalizedSearch && response.search !== normalizedSearch) {
      throw new Error(
        "The deployed Edge Function does not support video triage search yet. Redeploy make-server-17cae920 and try again.",
      );
    }
    setItems(response.items);
    setTotal(response.total);
  }, [batchId, offset, reviewStatus, searchQuery]);

  const loadCapabilities = useCallback(async () => {
    const response = await api.getVideoPlaylistCapabilities();
    setCapabilities(response);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([loadBatches(), loadItems(), loadCapabilities()]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsLoading(false);
    }
  }, [loadBatches, loadItems, loadCapabilities]);

  useEffect(() => {
    void Promise.all([loadBatches(), loadCapabilities()])
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => setIsLoading(false));
  }, [loadBatches, loadCapabilities]);

  useEffect(() => {
    setIsLoading(true);
    void loadItems()
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : String(caught)),
      )
      .finally(() => setIsLoading(false));
  }, [loadItems]);

  const batch = batches.find((candidate) => candidate.id === batchId) ?? null;
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + PAGE_SIZE, total);
  const canApplyDrafts = Boolean(
    batch &&
    capabilities?.draft_apply_enabled &&
    ["ready", "failed", "completed"].includes(batch.status),
  );

  const applyDrafts = async () => {
    if (!batchId || !canApplyDrafts || isApplying) return;
    const confirmation = window.prompt(
      'Type "apply video triage drafts" to continue draft apply.',
    );
    if (confirmation !== "apply video triage drafts") return;

    setIsApplying(true);
    setError(null);
    setApplyResult(null);
    try {
      const result = await api.applyVideoTriageBatch(batchId, {
        confirmation: "apply video triage drafts",
        include_editorial_leads: true,
      });
      setApplyResult(result);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <section
      id="video-triage-review"
      className="retro-card space-y-4 p-6"
      aria-labelledby="video-triage-review-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Video className="mt-0.5 size-5 shrink-0" />
          <div>
            <h3
              id="video-triage-review-title"
              className="font-sniglet text-[16px]"
            >
              Private Video Triage
            </h3>
            <p className="mt-1 text-[12px] text-black/60 dark:text-white/60">
              Record human review decisions without creating drafts or public
              graph content.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-[12px] disabled:opacity-50 dark:border-white/15"
        >
          <RefreshCw
            className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      {batches.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[11px] font-medium">
            Import batch
            <select
              value={batchId ?? ""}
              onChange={(event) => {
                setBatchId(event.target.value);
                setOffset(0);
              }}
              className="mt-1 w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
            >
              {batches.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.source_playlist_title ?? entry.source_playlist_id} ·{" "}
                  {entry.status}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-medium">
            Review state
            <select
              value={reviewStatus}
              onChange={(event) => {
                setReviewStatus(event.target.value);
                setOffset(0);
              }}
              className="mt-1 w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
            >
              <option value="unreviewed">Unreviewed</option>
              <option value="reviewed">Reviewed</option>
              <option value="all">All</option>
            </select>
          </label>
          <form
            className="sm:col-span-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSearchQuery(searchInput.trim());
              setOffset(0);
            }}
          >
            <label className="text-[11px] font-medium" htmlFor="video-triage-search">
              Filter candidates
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="video-triage-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Title, YouTube ID, material, topic, or notes…"
                className="min-w-0 flex-1 rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-[12px] disabled:opacity-50 dark:border-white/15"
              >
                <Search className="size-3.5" /> Filter
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                    setOffset(0);
                  }}
                  className="rounded-lg border border-black/15 px-3 py-2 text-[12px] dark:border-white/15"
                >
                  Clear
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-1 text-[10px] text-black/50 dark:text-white/50">
                Filtering the complete batch for “{searchQuery}”
              </p>
            )}
          </form>
        </div>
      )}

      {batch && (
        <div className="space-y-2">
          <p className="text-[11px] text-black/60 dark:text-white/60">
            Batch {batch.id} · {batch.row_count} candidates · status{" "}
            {batch.status}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void applyDrafts()}
              disabled={!canApplyDrafts || isApplying}
              className="retro-btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isApplying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <WandSparkles className="size-4" />
              )}
              {isApplying ? "Applying drafts…" : "Apply reviewed drafts"}
            </button>
            {!capabilities?.draft_apply_enabled && (
              <span className="text-[11px] text-black/50 dark:text-white/50">
                Draft apply gate is closed.
              </span>
            )}
          </div>
        </div>
      )}

      {applyResult && (
        <p className="rounded-lg border border-waste-compost/30 bg-waste-compost/5 p-3 text-[12px]">
          Applied batch {applyResult.batch_id}: {applyResult.videos_inserted}{" "}
          new draft videos, {applyResult.videos_reused} reused videos,{" "}
          {applyResult.entities_inserted} new video entities, and{" "}
          {applyResult.editorial_leads_inserted} editorial leads.
          {applyResult.already_applied ? " (Idempotent rerun.)" : ""}
        </p>
      )}

      {isLoading && items.length === 0 ? (
        <p className="flex items-center gap-2 text-[12px]">
          <Loader2 className="size-4 animate-spin" /> Loading private triage…
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-black/10 p-4 text-[12px] dark:border-white/10">
          No candidates match this review filter.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ReviewEditor key={item.id} item={item} onSaved={refresh} />
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span>
            Showing {pageStart}–{pageEnd} of {total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0 || isLoading}
              className="rounded-lg border border-black/15 px-3 py-1.5 disabled:opacity-40 dark:border-white/15"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total || isLoading}
              className="rounded-lg border border-black/15 px-3 py-1.5 disabled:opacity-40 dark:border-white/15"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
