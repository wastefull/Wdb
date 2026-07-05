import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Link2,
  Loader2,
  RefreshCw,
  WandSparkles,
} from "lucide-react";
import * as api from "../../utils/api";
import type {
  CreateManualContentMappingResponse,
  ManualContentEntityType,
  ManualContentMappingEntityOption,
  ManualContentMappingOptionsResponse,
  ReviewedVideoMappingReport,
} from "../../types/manualContentMapping";

const CONTENT_TYPE_LABELS: Record<ManualContentEntityType, string> = {
  article: "Article",
  guide: "Guide",
  blog_post: "Blog post",
  video: "Video",
};

const EMPTY_OPTIONS: ManualContentMappingOptionsResponse = {
  content: [],
  materials: [],
  roles: [],
  lifecycle_focuses: [],
  evidence_uses: [],
  existing_mappings: [],
};

function includesSearch(
  option: ManualContentMappingEntityOption,
  search: string,
): boolean {
  return option.name.toLocaleLowerCase().includes(search.toLocaleLowerCase());
}

export function ManualContentMappingPanel() {
  const [options, setOptions] =
    useState<ManualContentMappingOptionsResponse>(EMPTY_OPTIONS);
  const [contentType, setContentType] = useState<"all" | ManualContentEntityType>(
    "video",
  );
  const [contentSearch, setContentSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [contentEntityId, setContentEntityId] = useState("");
  const [subjectEntityId, setSubjectEntityId] = useState("");
  const [role, setRole] = useState("primary_subject");
  const [lifecycleFocus, setLifecycleFocus] = useState("");
  const [evidenceUse, setEvidenceUse] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] =
    useState<CreateManualContentMappingResponse | null>(null);
  const [videoReport, setVideoReport] =
    useState<ReviewedVideoMappingReport | null>(null);
  const [isPreviewingVideos, setIsPreviewingVideos] = useState(false);
  const [isApplyingVideos, setIsApplyingVideos] = useState(false);

  const loadOptions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getManualContentMappingOptions();
      setOptions(response);
      setRole((current) =>
        response.roles.some((candidate) => candidate.slug === current)
          ? current
          : (response.roles[0]?.slug ?? ""),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOptions();
  }, []);

  const filteredContent = options.content.filter(
    (candidate) =>
      (contentType === "all" || candidate.entity_type === contentType) &&
      includesSearch(candidate, contentSearch),
  );
  const filteredMaterials = options.materials.filter((candidate) =>
    includesSearch(candidate, materialSearch),
  );
  const selectedContent = options.content.find(
    (candidate) => candidate.id === contentEntityId,
  );
  const selectedMaterial = options.materials.find(
    (candidate) => candidate.id === subjectEntityId,
  );
  const selectedRole = options.roles.find((candidate) => candidate.slug === role);
  const selectedMappings = options.existing_mappings.filter(
    (mapping) => mapping.content_entity_id === contentEntityId,
  );
  const isEvidence = role === "evidence";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contentEntityId) {
      setError("Choose one content item from the results list.");
      return;
    }
    if (!subjectEntityId) {
      setError("Choose one material from the results list.");
      return;
    }
    if (!role) {
      setError("Choose a governed connection.");
      return;
    }
    if (isEvidence && !evidenceUse) {
      setError("Choose the specific verified evidence use.");
      return;
    }
    setIsSaving(true);
    setError(null);
    setResult(null);
    try {
      const response = await api.createManualContentMapping({
        content_entity_id: contentEntityId,
        subject_entity_id: subjectEntityId,
        role,
        lifecycle_focus: lifecycleFocus || null,
        evidence_use: isEvidence ? evidenceUse : null,
      });
      setResult(response);
      await loadOptions();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsSaving(false);
    }
  };

  const previewVideoMappings = async () => {
    setIsPreviewingVideos(true);
    setError(null);
    try {
      setVideoReport(await api.previewReviewedVideoMappings());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsPreviewingVideos(false);
    }
  };

  const applyVideoMappings = async () => {
    if (!videoReport || videoReport.creatable_count < 1) return;
    const confirmed = window.confirm(
      `Create ${videoReport.creatable_count} missing primary-subject mapping(s) from the material links you reviewed during video triage? All mappings will remain pending review.`,
    );
    if (!confirmed) return;
    setIsApplyingVideos(true);
    setError(null);
    try {
      const report = await api.applyReviewedVideoMappings();
      setVideoReport(report);
      await loadOptions();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsApplyingVideos(false);
    }
  };

  return (
    <section
      id="manual-content-mapping"
      className="retro-card space-y-5 p-6"
      aria-labelledby="manual-content-mapping-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link2 className="mt-0.5 size-5 shrink-0" />
          <div>
            <h3
              id="manual-content-mapping-title"
              className="font-sniglet text-[16px] normal"
            >
              Create Content Mapping
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-black/70 dark:text-white/70">
              Choose content, choose a material, and describe the connection.
              New mappings stay pending review and do not publish anything.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadOptions()}
          disabled={isLoading}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-[12px] disabled:opacity-50 dark:border-white/15"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="rounded-lg border border-waste-science/25 bg-waste-science/5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-sniglet text-[13px]">Reviewed video links</p>
            <p className="mt-1 max-w-xl text-[11px] text-black/60 dark:text-white/60">
              Reuse the material links already reviewed during video triage as
              initial primary-subject mappings. Existing mappings are skipped;
              ambiguous identifiers are reported instead of guessed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void previewVideoMappings()}
            disabled={isPreviewingVideos || isApplyingVideos}
            className="flex items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-[12px] disabled:opacity-50 dark:border-white/15"
          >
            {isPreviewingVideos ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Preview reviewed links
          </button>
        </div>

        {videoReport && (
          <div className="mt-3 space-y-3 border-t border-black/10 pt-3 dark:border-white/10">
            <p className="text-[12px]">
              {videoReport.resolved_count} resolved · {videoReport.existing_count}{" "}
              already mapped · {videoReport.creatable_count} ready to create ·{" "}
              {videoReport.unresolved_count} unresolved
            </p>
            {videoReport.unresolved.length > 0 && (
              <div className="max-h-28 overflow-y-auto rounded-md bg-amber-50 p-2 text-[10px] text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                {videoReport.unresolved.map((candidate) => (
                  <p key={`${candidate.import_item_id}:${candidate.material_identifier}`}>
                    {candidate.material_identifier} · {candidate.match_count === 0 ? "no material match" : "ambiguous match"}
                  </p>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => void applyVideoMappings()}
              disabled={
                videoReport.creatable_count < 1 ||
                isApplyingVideos ||
                videoReport.mode === "apply"
              }
              className="retro-btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isApplyingVideos ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <WandSparkles className="size-4" />
              )}
              {videoReport.mode === "apply"
                ? `${videoReport.created_count} mapping(s) created`
                : `Create ${videoReport.creatable_count} primary-subject mapping(s)`}
            </button>
          </div>
        )}
      </div>

      {isLoading && options.content.length === 0 ? (
        <div className="flex items-center gap-2 py-6 text-[12px] text-black/60 dark:text-white/60">
          <Loader2 className="size-4 animate-spin" />
          Loading canonical content and materials…
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-[11px] font-medium" htmlFor="mapping-content-type">
                Content type
              </label>
              <select
                id="mapping-content-type"
                value={contentType}
                onChange={(event) => {
                  setContentType(event.target.value as typeof contentType);
                  setContentEntityId("");
                }}
                className="w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
              >
                <option value="all">All content</option>
                {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <label className="block text-[11px] font-medium" htmlFor="mapping-content-search">
                Find content
              </label>
              <input
                id="mapping-content-search"
                type="search"
                value={contentSearch}
                onChange={(event) => {
                  setContentSearch(event.target.value);
                  setContentEntityId("");
                  setResult(null);
                }}
                placeholder="Search titles…"
                className="w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
              />
              <div
                role="listbox"
                aria-label="Content"
                className="h-36 w-full overflow-y-auto rounded-lg border border-black/15 bg-background p-1 text-[12px] dark:border-white/15"
              >
                {filteredContent.length === 0 ? (
                  <p className="px-2 py-3 text-black/45 dark:text-white/45">
                    No matching content.
                  </p>
                ) : (
                  filteredContent.map((candidate) => {
                    const selected = candidate.id === contentEntityId;
                    return (
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        key={candidate.id}
                        onClick={() => {
                          setContentEntityId(candidate.id);
                          setResult(null);
                          setError(null);
                        }}
                        className={`block w-full rounded-md px-2 py-1.5 text-left ${
                          selected
                            ? "bg-waste-science/20 font-medium ring-1 ring-waste-science/50"
                            : "hover:bg-black/5 dark:hover:bg-white/5"
                        }`}
                      >
                        {CONTENT_TYPE_LABELS[
                          candidate.entity_type as ManualContentEntityType
                        ]}{" "}
                        · {candidate.name}
                      </button>
                    );
                  })
                )}
              </div>
              <p className="text-[10px] text-black/50 dark:text-white/50">
                {filteredContent.length} matching canonical item(s)
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-medium" htmlFor="mapping-material-search">
                Find material
              </label>
              <input
                id="mapping-material-search"
                type="search"
                value={materialSearch}
                onChange={(event) => {
                  setMaterialSearch(event.target.value);
                  setSubjectEntityId("");
                  setResult(null);
                }}
                placeholder="Search materials…"
                className="w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
              />
              <div
                role="listbox"
                aria-label="Material"
                className="h-36 w-full overflow-y-auto rounded-lg border border-black/15 bg-background p-1 text-[12px] dark:border-white/15"
              >
                {filteredMaterials.length === 0 ? (
                  <p className="px-2 py-3 text-black/45 dark:text-white/45">
                    No matching materials.
                  </p>
                ) : (
                  filteredMaterials.map((candidate) => {
                    const selected = candidate.id === subjectEntityId;
                    return (
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        key={candidate.id}
                        onClick={() => {
                          setSubjectEntityId(candidate.id);
                          setResult(null);
                          setError(null);
                        }}
                        className={`block w-full rounded-md px-2 py-1.5 text-left ${
                          selected
                            ? "bg-waste-compost/20 font-medium ring-1 ring-waste-compost/50"
                            : "hover:bg-black/5 dark:hover:bg-white/5"
                        }`}
                      >
                        {candidate.name}
                      </button>
                    );
                  })
                )}
              </div>
              <p className="text-[10px] text-black/50 dark:text-white/50">
                {filteredMaterials.length} matching canonical material(s)
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-[11px] font-medium">
              Connection
              <select
                value={role}
                onChange={(event) => {
                  setRole(event.target.value);
                  if (event.target.value !== "evidence") setEvidenceUse("");
                }}
                className="mt-1 w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
              >
                {options.roles.map((candidate) => (
                  <option key={candidate.slug} value={candidate.slug}>
                    {candidate.label}
                  </option>
                ))}
              </select>
              {selectedRole && (
                <span className="mt-1 block text-[10px] font-normal text-black/55 dark:text-white/55">
                  {selectedRole.description}
                </span>
              )}
            </label>

            <label className="text-[11px] font-medium">
              Lifecycle focus <span className="font-normal text-black/45 dark:text-white/45">(optional)</span>
              <select
                value={lifecycleFocus}
                onChange={(event) => setLifecycleFocus(event.target.value)}
                className="mt-1 w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
              >
                <option value="">None</option>
                {options.lifecycle_focuses.map((candidate) => (
                  <option key={candidate.slug} value={candidate.slug}>
                    {candidate.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isEvidence && (
            <label className="block text-[11px] font-medium">
              Verified evidence use
              <select
                value={evidenceUse}
                onChange={(event) => setEvidenceUse(event.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-amber-400/50 bg-background px-3 py-2 text-[12px] dark:border-amber-500/50"
              >
                <option value="">Choose the verified use…</option>
                {options.evidence_uses.map((candidate) => (
                  <option key={candidate.slug} value={candidate.slug}>
                    {candidate.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[10px] font-normal text-amber-700 dark:text-amber-300">
                Evidence means an editor has verified this specific evidentiary use.
              </span>
            </label>
          )}

          {selectedMappings.length > 0 && (
            <div className="rounded-lg border border-black/10 bg-black/[0.025] p-3 dark:border-white/10 dark:bg-white/[0.025]">
              <p className="mb-2 text-[11px] font-medium">
                Existing mappings for {selectedContent?.name}
              </p>
              <div className="space-y-1">
                {selectedMappings.map((mapping) => {
                  const material = options.materials.find(
                    (candidate) => candidate.id === mapping.subject_entity_id,
                  );
                  return (
                    <p key={mapping.id} className="text-[11px] text-black/65 dark:text-white/65">
                      {material?.name ?? mapping.subject_entity_id} · {mapping.role.replaceAll("_", " ")} · {mapping.status.replaceAll("_", " ")}
                    </p>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-black/10 pt-4 dark:border-white/10">
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="retro-btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              {isSaving ? "Creating mapping…" : "Create pending mapping"}
            </button>
            <span className="text-[11px] text-black/55 dark:text-white/55">
              Content: {selectedContent?.name ?? "not selected"} · Material:{" "}
              {selectedMaterial?.name ?? "not selected"} · Connection:{" "}
              {selectedRole?.label ?? "not selected"}
            </span>
          </div>
        </form>
      )}

      <div aria-live="polite">
        {error && (
          <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}
        {result && (
          <p className="flex items-start gap-2 rounded-lg border border-waste-compost/30 bg-waste-compost/5 p-3 text-[12px]">
            <CheckCircle className="mt-0.5 size-4 shrink-0 text-waste-compost" />
            {result.created
              ? "Mapping created and queued for review."
              : "That mapping already exists; no duplicate was created."}
          </p>
        )}
      </div>
    </section>
  );
}
