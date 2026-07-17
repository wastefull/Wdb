import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  WandSparkles,
} from "lucide-react";
import * as api from "../../utils/api";
import type {
  CreateManualContentMappingResponse,
  ManualContentMappingEntityOption,
  ManualContentMappingOptionsResponse,
  ReviewedVideoMappingReport,
} from "../../types/manualContentMapping";
import type { CreateVideoFromUrlResponse } from "../../types/videoPlaylist";

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

function formatLabel(value: string | null): string {
  return value ? value.replaceAll("_", " ") : "None";
}

export function VideoMaterialLinkPanel() {
  const [options, setOptions] =
    useState<ManualContentMappingOptionsResponse>(EMPTY_OPTIONS);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoMaterialSearch, setNewVideoMaterialSearch] = useState("");
  const [newVideoMaterialId, setNewVideoMaterialId] = useState("");
  const [newVideoRole, setNewVideoRole] = useState("primary_subject");
  const [newVideoLifecycleFocus, setNewVideoLifecycleFocus] = useState("");
  const [newVideoEvidenceUse, setNewVideoEvidenceUse] = useState("");
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);
  const [createVideoResult, setCreateVideoResult] =
    useState<CreateVideoFromUrlResponse | null>(null);
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
  const [previewReport, setPreviewReport] =
    useState<ReviewedVideoMappingReport | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

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

  const videoOptions = useMemo(
    () =>
      options.content.filter(
        (candidate) =>
          candidate.entity_type === "video" && includesSearch(candidate, contentSearch),
      ),
    [contentSearch, options.content],
  );

  const materialOptions = useMemo(
    () =>
      options.materials.filter((candidate) =>
        includesSearch(candidate, materialSearch),
      ),
    [materialSearch, options.materials],
  );
  const newVideoMaterialOptions = useMemo(
    () =>
      options.materials.filter((candidate) =>
        includesSearch(candidate, newVideoMaterialSearch),
      ),
    [newVideoMaterialSearch, options.materials],
  );

  const selectedVideo = options.content.find(
    (candidate) => candidate.id === contentEntityId,
  );
  const selectedMaterial = options.materials.find(
    (candidate) => candidate.id === subjectEntityId,
  );
  const selectedNewVideoMaterial = options.materials.find(
    (candidate) => candidate.id === newVideoMaterialId,
  );
  const selectedRole = options.roles.find((candidate) => candidate.slug === role);
  const selectedNewVideoRole = options.roles.find(
    (candidate) => candidate.slug === newVideoRole,
  );
  const selectedMappings = options.existing_mappings.filter(
    (mapping) => mapping.content_entity_id === contentEntityId,
  );
  const isEvidence = role === "evidence";
  const isNewVideoEvidence = newVideoRole === "evidence";

  const unresolvedVideoGroups = useMemo(
    () =>
      Array.from(
        (previewReport?.unresolved ?? []).reduce(
          (groups, candidate) => {
            const key = candidate.material_identifier.trim().toLocaleLowerCase();
            const existing = groups.get(key);
            if (existing) {
              existing.videoLinkCount += 1;
              existing.matchCount = Math.max(
                existing.matchCount,
                candidate.match_count,
              );
            } else {
              groups.set(key, {
                identifier: candidate.material_identifier,
                matchCount: candidate.match_count,
                videoLinkCount: 1,
              });
            }
            return groups;
          },
          new Map<
            string,
            { identifier: string; matchCount: number; videoLinkCount: number }
          >(),
        ).values(),
      ).sort(
        (left, right) =>
          right.videoLinkCount - left.videoLinkCount ||
          left.identifier.localeCompare(right.identifier),
      ),
    [previewReport?.unresolved],
  );

  const previewReviewedLinks = async () => {
    setIsPreviewing(true);
    setError(null);
    try {
      setPreviewReport(await api.previewReviewedVideoMappings());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsPreviewing(false);
    }
  };

  const applyReviewedLinks = async () => {
    if (!previewReport || previewReport.creatable_count < 1) return;
    const confirmed = window.confirm(
      `Create ${previewReport.creatable_count} missing primary-subject mapping(s) from reviewed video links?`,
    );
    if (!confirmed) return;

    setIsApplying(true);
    setError(null);
    try {
      const report = await api.applyReviewedVideoMappings();
      setPreviewReport(report);
      await loadOptions();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsApplying(false);
    }
  };

  const submitCreateVideo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newVideoUrl.trim()) {
      setError("Paste a YouTube video or Shorts URL first.");
      return;
    }
    if (isNewVideoEvidence && !newVideoEvidenceUse) {
      setError("Choose the specific verified evidence use.");
      return;
    }

    setIsCreatingVideo(true);
    setError(null);
    setCreateVideoResult(null);
    try {
      const response = await api.createVideoFromUrl({
        youtube_url: newVideoUrl.trim(),
        title: newVideoTitle.trim() || undefined,
        material_id: newVideoMaterialId || null,
        role: newVideoMaterialId ? newVideoRole : null,
        lifecycle_focus: newVideoMaterialId ? newVideoLifecycleFocus || null : null,
        evidence_use: newVideoMaterialId && isNewVideoEvidence ? newVideoEvidenceUse : null,
      });
      setCreateVideoResult(response);
      setNewVideoUrl("");
      setNewVideoTitle("");
      setNewVideoMaterialId("");
      setNewVideoMaterialSearch("");
      setNewVideoRole("primary_subject");
      setNewVideoLifecycleFocus("");
      setNewVideoEvidenceUse("");
      await loadOptions();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsCreatingVideo(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contentEntityId) {
      setError("Choose one video from the results list.");
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

  return (
    <section
      id="video-link-management"
      className="retro-card space-y-5 p-6"
      aria-labelledby="video-link-management-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <VideoIcon />
          <div>
            <h3
              id="video-link-management-title"
              className="font-sniglet text-[16px] normal"
            >
              Video Link Management
            </h3>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-black/70 dark:text-white/70">
              Promote reviewed video links into governed material mappings or
              create new video-to-material links manually. This section is
              dedicated to learning-resource links and keeps video workflow in
              one place.
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
              Reuse material links already reviewed during video triage as
              initial primary-subject mappings. Existing mappings are skipped;
              ambiguous identifiers are reported instead of guessed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void previewReviewedLinks()}
            disabled={isPreviewing || isApplying}
            className="flex items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-[12px] disabled:opacity-50 dark:border-white/15"
          >
            {isPreviewing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Preview reviewed links
          </button>
        </div>

        {previewReport && (
          <div className="mt-3 space-y-3 border-t border-black/10 pt-3 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <CheckCircle className="size-4 text-waste-science" />
              <span>
                {previewReport.resolved_count} resolved ·{" "}
                {previewReport.existing_count} already mapped ·{" "}
                {previewReport.creatable_count} ready to create ·{" "}
                {previewReport.unresolved_count} unresolved
              </span>
            </div>

            {previewReport.unresolved.length > 0 && (
              <div className="max-h-28 overflow-y-auto rounded-md bg-amber-50 p-2 text-[10px] text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                {unresolvedVideoGroups.map((group) => (
                  <p key={group.identifier.toLocaleLowerCase()}>
                    {group.identifier} ·{" "}
                    {group.matchCount === 0
                      ? "no material match"
                      : "ambiguous match"}{" "}
                    · {group.videoLinkCount} video link(s)
                  </p>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => void applyReviewedLinks()}
              disabled={
                previewReport.creatable_count < 1 ||
                isApplying ||
                previewReport.mode === "apply"
              }
              className="retro-btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isApplying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <WandSparkles className="size-4" />
              )}
              {previewReport.mode === "apply"
                ? `${previewReport.created_count} mapping(s) created`
                : `Create ${previewReport.creatable_count} primary-subject mapping(s)`}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-sniglet text-[13px]">Add video by URL</p>
            <p className="mt-1 max-w-xl text-[11px] text-black/60 dark:text-white/60">
              Paste a YouTube video or Shorts link to create a draft video. If
              you choose a material, the new video can be linked to it in the
              same step.
            </p>
          </div>
        </div>

        <form onSubmit={submitCreateVideo} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-[11px] font-medium">
              YouTube video or Shorts URL
              <input
                value={newVideoUrl}
                onChange={(event) => {
                  setNewVideoUrl(event.target.value);
                  setCreateVideoResult(null);
                }}
                placeholder="https://www.youtube.com/shorts/dQw4w9WgXcQ"
                className="w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
              />
            </label>
            <label className="space-y-2 text-[11px] font-medium">
              Optional title override
              <input
                value={newVideoTitle}
                onChange={(event) => setNewVideoTitle(event.target.value)}
                placeholder="Leave blank to use the YouTube title"
                className="w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                className="block text-[11px] font-medium"
                htmlFor="new-video-material-search"
              >
                Link to material
              </label>
              <input
                id="new-video-material-search"
                type="search"
                value={newVideoMaterialSearch}
                onChange={(event) => setNewVideoMaterialSearch(event.target.value)}
                placeholder="Search materials…"
                className="w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
              />
              <div className="h-32 overflow-y-auto rounded-lg border border-black/15 bg-background p-1 text-[12px] dark:border-white/15">
                {newVideoMaterialOptions.length === 0 ? (
                  <p className="px-2 py-3 text-black/45 dark:text-white/45">
                    No matching materials.
                  </p>
                ) : (
                  newVideoMaterialOptions.map((candidate) => {
                    const selected = candidate.id === newVideoMaterialId;
                    return (
                      <button
                        type="button"
                        key={candidate.id}
                        onClick={() => {
                          setNewVideoMaterialId(candidate.id);
                          setCreateVideoResult(null);
                        }}
                        className={`block w-full rounded-md px-2 py-1.5 text-left ${
                          selected
                            ? "bg-waste-science/20 font-medium ring-1 ring-waste-science/50"
                            : "hover:bg-black/5 dark:hover:bg-white/5"
                        }`}
                      >
                        {candidate.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  className="block text-[11px] font-medium"
                  htmlFor="new-video-role"
                >
                  Governing role
                </label>
                <select
                  id="new-video-role"
                  value={newVideoRole}
                  onChange={(event) => setNewVideoRole(event.target.value)}
                  className="w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
                >
                  {options.roles.map((candidate) => (
                    <option key={candidate.slug} value={candidate.slug}>
                      {candidate.label}
                    </option>
                  ))}
                </select>
                {selectedNewVideoRole && (
                  <p className="text-[10px] text-black/50 dark:text-white/50">
                    {selectedNewVideoRole.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  className="block text-[11px] font-medium"
                  htmlFor="new-video-lifecycle"
                >
                  Lifecycle focus
                </label>
                <select
                  id="new-video-lifecycle"
                  value={newVideoLifecycleFocus}
                  onChange={(event) =>
                    setNewVideoLifecycleFocus(event.target.value)
                  }
                  className="w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
                >
                  <option value="">None</option>
                  {options.lifecycle_focuses.map((candidate) => (
                    <option key={candidate.slug} value={candidate.slug}>
                      {candidate.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  className="block text-[11px] font-medium"
                  htmlFor="new-video-evidence-use"
                >
                  Evidence use
                </label>
                <select
                  id="new-video-evidence-use"
                  value={newVideoEvidenceUse}
                  onChange={(event) => setNewVideoEvidenceUse(event.target.value)}
                  className="w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
                  disabled={!newVideoMaterialId || !isNewVideoEvidence}
                >
                  <option value="">Choose evidence use</option>
                  {options.evidence_uses.map((candidate) => (
                    <option key={candidate.slug} value={candidate.slug}>
                      {candidate.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isCreatingVideo || !newVideoUrl.trim()}
              className="retro-btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreatingVideo ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ExternalLink className="size-4" />
              )}
              Create draft video
            </button>
            {createVideoResult && (
              <p className="text-[12px] text-black/60 dark:text-white/60">
                {createVideoResult.created ? "Created" : "Used existing"}{" "}
                video: <strong>{createVideoResult.title}</strong>
                {createVideoResult.material_mapping_created
                  ? " with a new material link."
                  : createVideoResult.material_id
                    ? " with an existing material link."
                    : "."}
              </p>
            )}
          </div>
        </form>
      </div>

      {isLoading && options.content.length === 0 ? (
        <div className="flex items-center gap-2 py-6 text-[12px] text-black/60 dark:text-white/60">
          <Loader2 className="size-4 animate-spin" />
          Loading canonical videos and materials…
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                className="block text-[11px] font-medium"
                htmlFor="video-link-content-search"
              >
                Find video
              </label>
              <input
                id="video-link-content-search"
                type="search"
                value={contentSearch}
                onChange={(event) => {
                  setContentSearch(event.target.value);
                  setContentEntityId("");
                  setResult(null);
                }}
                placeholder="Search video titles…"
                className="w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
              />
              <div
                role="listbox"
                aria-label="Videos"
                className="h-40 w-full overflow-y-auto rounded-lg border border-black/15 bg-background p-1 text-[12px] dark:border-white/15"
              >
                {videoOptions.length === 0 ? (
                  <p className="px-2 py-3 text-black/45 dark:text-white/45">
                    No matching videos.
                  </p>
                ) : (
                  videoOptions.map((candidate) => {
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
                        Video · {candidate.name}
                      </button>
                    );
                  })
                )}
              </div>
              <p className="text-[10px] text-black/50 dark:text-white/50">
                {videoOptions.length} matching video item(s)
              </p>
            </div>

            <div className="space-y-2">
              <label
                className="block text-[11px] font-medium"
                htmlFor="video-link-material-search"
              >
                Find material
              </label>
              <input
                id="video-link-material-search"
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
                aria-label="Materials"
                className="h-40 w-full overflow-y-auto rounded-lg border border-black/15 bg-background p-1 text-[12px] dark:border-white/15"
              >
                {materialOptions.length === 0 ? (
                  <p className="px-2 py-3 text-black/45 dark:text-white/45">
                    No matching materials.
                  </p>
                ) : (
                  materialOptions.map((candidate) => {
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
                            ? "bg-waste-science/20 font-medium ring-1 ring-waste-science/50"
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
                {materialOptions.length} matching material(s)
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                className="block text-[11px] font-medium"
                htmlFor="video-link-role"
              >
                Governed connection
              </label>
              <select
                id="video-link-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
              >
                {options.roles.map((candidate) => (
                  <option key={candidate.slug} value={candidate.slug}>
                    {candidate.label}
                  </option>
                ))}
              </select>
              {selectedRole && (
                <p className="text-[10px] text-black/50 dark:text-white/50">
                  {selectedRole.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                className="block text-[11px] font-medium"
                htmlFor="video-link-lifecycle"
              >
                Lifecycle focus
              </label>
              <select
                id="video-link-lifecycle"
                value={lifecycleFocus}
                onChange={(event) => setLifecycleFocus(event.target.value)}
                className="w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
              >
                <option value="">None</option>
                {options.lifecycle_focuses.map((candidate) => (
                  <option key={candidate.slug} value={candidate.slug}>
                    {candidate.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isEvidence && (
            <div className="space-y-2">
              <label
                className="block text-[11px] font-medium"
                htmlFor="video-link-evidence-use"
              >
                Verified evidence use
              </label>
              <select
                id="video-link-evidence-use"
                value={evidenceUse}
                onChange={(event) => setEvidenceUse(event.target.value)}
                className="w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-[12px] dark:border-white/15"
              >
                <option value="">Choose evidence use</option>
                {options.evidence_uses.map((candidate) => (
                  <option key={candidate.slug} value={candidate.slug}>
                    {candidate.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSaving || !contentEntityId || !subjectEntityId}
              className="retro-btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ExternalLink className="size-4" />
              )}
              Create video link
            </button>
            {selectedVideo && selectedMaterial && (
              <p className="text-[12px] text-black/60 dark:text-white/60">
                Linking <strong>{selectedVideo.name}</strong> to{" "}
                <strong>{selectedMaterial.name}</strong>
              </p>
            )}
          </div>
        </form>
      )}

      {contentEntityId && selectedMappings.length > 0 && (
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-[13px] font-medium">Existing mappings for selected video</p>
          <div className="mt-3 space-y-2">
            {selectedMappings.map((mapping) => (
              <div
                key={mapping.id}
                className="rounded-md border border-black/10 px-3 py-2 text-[12px] dark:border-white/10"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{formatLabel(mapping.role)}</span>
                  <span className="text-black/50 dark:text-white/50">
                    {formatLabel(mapping.status)}
                  </span>
                </div>
                <p className="mt-1 text-black/60 dark:text-white/60">
                  Material ID: {mapping.subject_entity_id}
                  {mapping.lifecycle_focus ? ` · ${formatLabel(mapping.lifecycle_focus)}` : ""}
                  {mapping.evidence_use ? ` · ${formatLabel(mapping.evidence_use)}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-[12px] text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-waste-compost/30 bg-waste-compost/5 p-3 text-[12px]">
          Mapping {result.already_exists ? "already existed" : "created"} for{" "}
          {result.role.replaceAll("_", " ")}.
        </div>
      )}
    </section>
  );
}

function VideoIcon() {
  return (
    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-black/15 bg-black/5 dark:border-white/15 dark:bg-white/5">
      <Search className="size-3.5" />
    </div>
  );
}
