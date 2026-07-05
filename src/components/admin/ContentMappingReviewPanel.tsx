import { FormEvent, useEffect, useState } from "react";
import {
  Archive,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import type {
  ContentMappingReviewItem,
  ContentMappingReviewStatus,
} from "../../types/manualContentMapping";
import * as api from "../../utils/api";

const PAGE_SIZE = 50;

const STATUS_LABELS: Record<ContentMappingReviewStatus, string> = {
  pending_review: "Pending review",
  active: "Approved",
  archived: "Rejected",
};

function formatLabel(value: string | null): string {
  return value ? value.replaceAll("_", " ") : "None";
}

export function ContentMappingReviewPanel() {
  const [items, setItems] = useState<ContentMappingReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"all" | ContentMappingReviewStatus>(
    "pending_review",
  );
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.listContentMappingsForReview({
        status,
        search,
        offset,
        limit: PAGE_SIZE,
      });
      setItems(response.items);
      setTotal(response.total);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [status, search, offset]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOffset(0);
    setSearch(searchInput.trim());
  };

  const review = async (
    item: ContentMappingReviewItem,
    decision: "approve" | "reject",
  ) => {
    const verb = decision === "approve" ? "approve" : "reject";
    const consequence =
      decision === "approve"
        ? "This makes the mapping eligible for governed graph reads."
        : "Rejected mappings are archived. Recreate the mapping if its relationship needs correction.";
    if (!window.confirm(`${verb[0].toUpperCase()}${verb.slice(1)} ${item.content_name} -> ${item.subject_name}?\n\n${consequence}`)) {
      return;
    }
    setReviewingId(item.id);
    setError(null);
    try {
      await api.reviewContentMapping(item.id, decision);
      await loadItems();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setReviewingId(null);
    }
  };

  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + PAGE_SIZE, total);

  return (
    <section
      id="content-mapping-review"
      className="retro-card space-y-5 p-6"
      aria-labelledby="content-mapping-review-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0" />
          <div>
            <h3 id="content-mapping-review-title" className="font-sniglet text-[16px] normal">
              Content Mapping Review
            </h3>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-black/70 dark:text-white/70">
              Approve deliberate content-to-material claims or reject incorrect
              ones. Every decision records reviewer metadata, audit history,
              and a compatibility event in one transaction.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadItems()}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-[12px] disabled:opacity-50 dark:border-white/15"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-[11px] text-black/60 dark:text-white/60">
          Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as "all" | ContentMappingReviewStatus);
              setOffset(0);
            }}
            className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-[13px] text-black dark:border-white/15 dark:text-white"
          >
            <option value="pending_review">Pending review</option>
            <option value="active">Approved</option>
            <option value="archived">Rejected</option>
            <option value="all">All statuses</option>
          </select>
        </label>
        <form onSubmit={submitSearch} className="flex min-w-64 flex-1 items-end gap-2">
          <label className="flex flex-1 flex-col gap-1 text-[11px] text-black/60 dark:text-white/60">
            Filter mappings
            <span className="flex rounded-lg border border-black/15 dark:border-white/15">
              <Search className="ml-3 mt-2.5 size-3.5 shrink-0" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Content, material, role..."
                maxLength={100}
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[13px] outline-none"
              />
            </span>
          </label>
          <button type="submit" className="rounded-lg border border-black/15 px-3 py-2 text-[12px] dark:border-white/15">
            Filter
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setOffset(0);
              }}
              className="px-2 py-2 text-[12px] text-black/60 dark:text-white/60"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/5 p-3 text-[12px] text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-black/55 dark:text-white/55">
          <Loader2 className="size-4 animate-spin" /> Loading mappings
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/15 px-4 py-10 text-center text-[13px] text-black/55 dark:border-white/15 dark:text-white/55">
          No mappings match this view.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-black/10 p-4 dark:border-white/10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-black/45 dark:text-white/45">
                    <span>{formatLabel(item.content_type)}</span>
                    <span aria-hidden="true">/</span>
                    <span>{STATUS_LABELS[item.status]}</span>
                  </div>
                  <p className="mt-1 font-sniglet text-[14px]">{item.content_name}</p>
                  <p className="mt-1 text-[13px]">
                    <span className="text-black/50 dark:text-white/50">maps to</span>{" "}
                    <strong>{item.subject_name}</strong>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full bg-black/5 px-2.5 py-1 dark:bg-white/10">{formatLabel(item.role)}</span>
                    {item.lifecycle_focus && <span className="rounded-full bg-black/5 px-2.5 py-1 dark:bg-white/10">Lifecycle: {formatLabel(item.lifecycle_focus)}</span>}
                    {item.evidence_use && <span className="rounded-full bg-black/5 px-2.5 py-1 dark:bg-white/10">Evidence: {formatLabel(item.evidence_use)}</span>}
                  </div>
                </div>
                {item.status === "pending_review" && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => void review(item, "reject")}
                      disabled={reviewingId !== null}
                      className="flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-[12px] disabled:opacity-50 dark:border-white/15"
                    >
                      <Archive className="size-3.5" /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => void review(item, "approve")}
                      disabled={reviewingId !== null}
                      className="flex items-center gap-1.5 rounded-lg bg-waste-science px-3 py-2 text-[12px] text-white disabled:opacity-50"
                    >
                      {reviewingId === item.id ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-black/55 dark:text-white/55">
        <span>{pageStart}-{pageEnd} of {total}</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0 || isLoading} aria-label="Previous page" className="rounded-lg border border-black/10 p-2 disabled:opacity-30 dark:border-white/10">
            <ChevronLeft className="size-3.5" />
          </button>
          <button type="button" onClick={() => setOffset(offset + PAGE_SIZE)} disabled={offset + PAGE_SIZE >= total || isLoading} aria-label="Next page" className="rounded-lg border border-black/10 p-2 disabled:opacity-30 dark:border-white/10">
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
