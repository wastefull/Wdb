import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Check,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import * as api from "../../utils/api";
import type {
  CreateManualMaterialRelationshipResponse,
  ManualMaterialRelationshipOptionsResponse,
  MaterialRelationshipReviewItem,
  MaterialRelationshipReviewStatus,
} from "../../types/manualMaterialRelationship";

const PAGE_SIZE = 25;

const EMPTY_OPTIONS: ManualMaterialRelationshipOptionsResponse = {
  materials: [],
  relationship_types: [],
};

const STATUS_LABELS: Record<MaterialRelationshipReviewStatus, string> = {
  pending_review: "Pending review",
  active: "Approved",
  archived: "Archived",
};

function formatLabel(value: string): string {
  return value.replaceAll("_", " ");
}

export function MaterialRelationshipPanel() {
  const [options, setOptions] =
    useState<ManualMaterialRelationshipOptionsResponse>(EMPTY_OPTIONS);
  const [sourceEntityId, setSourceEntityId] = useState("");
  const [targetEntityId, setTargetEntityId] = useState("");
  const [relationshipType, setRelationshipType] = useState("related_to");
  const [materialSearch, setMaterialSearch] = useState("");
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [createResult, setCreateResult] =
    useState<CreateManualMaterialRelationshipResponse | null>(null);

  const [items, setItems] = useState<MaterialRelationshipReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<
    "all" | MaterialRelationshipReviewStatus
  >("pending_review");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [isReviewLoading, setIsReviewLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredMaterials = useMemo(
    () =>
      options.materials.filter((candidate) =>
        candidate.name
          .toLocaleLowerCase()
          .includes(materialSearch.trim().toLocaleLowerCase()),
      ),
    [materialSearch, options.materials],
  );

  const loadOptions = async () => {
    setIsOptionsLoading(true);
    setError(null);
    try {
      const response = await api.getManualMaterialRelationshipOptions();
      setOptions(response);
      setRelationshipType((current) =>
        response.relationship_types.some(
          (candidate) => candidate.slug === current,
        )
          ? current
          : (response.relationship_types[0]?.slug ?? ""),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsOptionsLoading(false);
    }
  };

  const loadRelationships = async () => {
    setIsReviewLoading(true);
    setError(null);
    try {
      const response = await api.listMaterialRelationshipsForReview({
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
      setIsReviewLoading(false);
    }
  };

  useEffect(() => {
    void loadOptions();
  }, []);

  useEffect(() => {
    void loadRelationships();
  }, [status, search, offset]);

  const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sourceEntityId || !targetEntityId || !relationshipType) {
      setError("Source, target, and relationship type are required.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setCreateResult(null);
    try {
      const response = await api.createManualMaterialRelationship({
        source_entity_id: sourceEntityId,
        target_entity_id: targetEntityId,
        relationship_type: relationshipType,
      });
      setCreateResult(response);
      await loadRelationships();
    } catch (caught) {
      const baseMessage =
        caught instanceof Error ? caught.message : String(caught);
      setError(
        [
          baseMessage,
          `Attempted mapping: ${sourceMaterial?.name ?? sourceEntityId} -> ${targetMaterial?.name ?? targetEntityId}`,
          `Relationship type: ${relationshipType}`,
        ].join(" | "),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const reviewRelationship = async (
    item: MaterialRelationshipReviewItem,
    decision: "approve" | "reject",
  ) => {
    const actionLabel = decision === "approve" ? "approve" : "archive";
    if (
      !window.confirm(
        `${actionLabel[0].toUpperCase()}${actionLabel.slice(1)} ${item.source_name} -> ${item.target_name}?`,
      )
    ) {
      return;
    }

    setReviewingId(item.id);
    setError(null);
    try {
      await api.reviewMaterialRelationship(item.id, decision);
      await loadRelationships();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setReviewingId(null);
    }
  };

  const deleteRelationship = async (item: MaterialRelationshipReviewItem) => {
    if (
      !window.confirm(
        `Delete relationship ${item.source_name} -> ${item.target_name}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingId(item.id);
    setError(null);
    try {
      await api.deleteMaterialRelationship(item.id);
      await loadRelationships();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setDeletingId(null);
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOffset(0);
    setSearch(searchInput.trim());
  };

  const sourceMaterial = options.materials.find(
    (candidate) => candidate.id === sourceEntityId,
  );
  const targetMaterial = options.materials.find(
    (candidate) => candidate.id === targetEntityId,
  );

  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + PAGE_SIZE, total);

  return (
    <section
      id="material-relationship-management"
      className="retro-card space-y-5 p-6"
      aria-labelledby="material-relationship-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <GitBranch className="mt-0.5 size-5 shrink-0" />
          <div>
            <h3
              id="material-relationship-title"
              className="font-sniglet text-[16px] normal"
            >
              Material Relationship Management
            </h3>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-black/70 dark:text-white/70">
              Create pending material-to-material links, review them to active
              or archived, and remove incorrect records with transactional audit
              and outbox compatibility.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void loadOptions();
              void loadRelationships();
            }}
            disabled={isOptionsLoading || isReviewLoading}
            className="flex items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-[12px] disabled:opacity-50 dark:border-white/15"
          >
            <RefreshCw
              className={`size-3.5 ${
                isOptionsLoading || isReviewLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/25 bg-red-500/5 p-3 text-[12px] text-red-700 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <form
        onSubmit={submitCreate}
        className="space-y-4 rounded-xl border border-black/10 p-4 dark:border-white/10"
      >
        <h4 className="font-sniglet text-[14px] normal">Create relationship</h4>

        <label
          className="block text-[11px] font-medium"
          htmlFor="material-relationship-search"
        >
          Filter materials
        </label>
        <input
          id="material-relationship-search"
          type="search"
          value={materialSearch}
          onChange={(event) => setMaterialSearch(event.target.value)}
          placeholder="Search material names..."
          className="w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-[11px] text-black/60 dark:text-white/60">
            Source material
            <select
              value={sourceEntityId}
              onChange={(event) => setSourceEntityId(event.target.value)}
              disabled={isOptionsLoading}
              className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-[13px] text-black dark:border-white/15 dark:text-white"
            >
              <option value="">Choose source...</option>
              {filteredMaterials.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-[11px] text-black/60 dark:text-white/60">
            Target material
            <select
              value={targetEntityId}
              onChange={(event) => setTargetEntityId(event.target.value)}
              disabled={isOptionsLoading}
              className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-[13px] text-black dark:border-white/15 dark:text-white"
            >
              <option value="">Choose target...</option>
              {filteredMaterials.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-[11px] text-black/60 dark:text-white/60">
            Relationship type
            <select
              value={relationshipType}
              onChange={(event) => setRelationshipType(event.target.value)}
              disabled={isOptionsLoading}
              className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-[13px] text-black dark:border-white/15 dark:text-white"
            >
              {options.relationship_types.map((candidate) => (
                <option key={candidate.slug} value={candidate.slug}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={
            isSaving || !sourceEntityId || !targetEntityId || !relationshipType
          }
          className="retro-btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <GitBranch className="size-4" />
          )}
          Create pending relationship
        </button>

        {createResult && (
          <p className="text-[12px] text-black/65 dark:text-white/65">
            {createResult.created
              ? `Created pending relationship: ${sourceMaterial?.name ?? "Source"} -> ${targetMaterial?.name ?? "Target"}.`
              : `Relationship already exists with status ${formatLabel(createResult.status)}.`}
          </p>
        )}
      </form>

      <div className="space-y-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h4 className="font-sniglet text-[14px] normal">
          Review relationships
        </h4>

        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-[11px] text-black/60 dark:text-white/60">
            Status
            <select
              value={status}
              onChange={(event) => {
                setStatus(
                  event.target.value as
                    | "all"
                    | MaterialRelationshipReviewStatus,
                );
                setOffset(0);
              }}
              className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-[13px] text-black dark:border-white/15 dark:text-white"
            >
              <option value="pending_review">Pending review</option>
              <option value="active">Approved</option>
              <option value="archived">Archived</option>
              <option value="all">All statuses</option>
            </select>
          </label>

          <form
            onSubmit={submitSearch}
            className="flex min-w-64 flex-1 items-end gap-2"
          >
            <label className="flex flex-1 flex-col gap-1 text-[11px] text-black/60 dark:text-white/60">
              Filter relationships
              <span className="flex rounded-lg border border-black/15 dark:border-white/15">
                <Search className="ml-3 mt-2.5 size-3.5 shrink-0" />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Material or relationship type..."
                  maxLength={100}
                  className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[13px] outline-none"
                />
              </span>
            </label>
            <button
              type="submit"
              className="rounded-lg border border-black/15 px-3 py-2 text-[12px] dark:border-white/15"
            >
              Filter
            </button>
          </form>
        </div>

        {isReviewLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-black/55 dark:text-white/55">
            <Loader2 className="size-4 animate-spin" /> Loading relationships
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-black/15 px-4 py-10 text-center text-[13px] text-black/55 dark:border-white/15 dark:text-white/55">
            No relationships match this view.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-black/10 p-4 dark:border-white/10"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-black/45 dark:text-white/45">
                      <span>{formatLabel(item.relationship_type)}</span>
                      <span aria-hidden="true">/</span>
                      <span>{STATUS_LABELS[item.status]}</span>
                    </div>
                    <p className="mt-1 text-[13px]">
                      <strong>{item.source_name}</strong> maps to{" "}
                      <strong>{item.target_name}</strong>
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {item.status === "pending_review" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            void reviewRelationship(item, "reject")
                          }
                          disabled={reviewingId !== null || deletingId !== null}
                          className="flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-[12px] disabled:opacity-50 dark:border-white/15"
                        >
                          <Archive className="size-3.5" /> Archive
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void reviewRelationship(item, "approve")
                          }
                          disabled={reviewingId !== null || deletingId !== null}
                          className="flex items-center gap-1.5 rounded-lg bg-waste-science px-3 py-2 text-[12px] text-white disabled:opacity-50"
                        >
                          {reviewingId === item.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Check className="size-3.5" />
                          )}
                          Approve
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => void deleteRelationship(item)}
                      disabled={reviewingId !== null || deletingId !== null}
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-[12px] text-red-700 disabled:opacity-50 dark:text-red-300"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-black/55 dark:text-white/55">
          <span>
            {pageStart}-{pageEnd} of {total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0 || isReviewLoading}
              aria-label="Previous page"
              className="rounded-lg border border-black/10 p-2 disabled:opacity-30 dark:border-white/10"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total || isReviewLoading}
              aria-label="Next page"
              className="rounded-lg border border-black/10 p-2 disabled:opacity-30 dark:border-white/10"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
