import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  CheckCircle,
  Download,
  ExternalLink,
  ListVideo,
  Loader2,
  Search,
  Upload,
  XCircle,
} from "lucide-react";
import * as api from "../../utils/api";
import type {
  VideoPlaylistCandidateClassification,
  VideoPlaylistCapabilities,
  VideoPlaylistPreview,
  VideoTriageCsvPreview,
  VideoTriageStageResponse,
} from "../../types/videoPlaylist";
import {
  buildVideoTriageCsv,
  isSuggested3dPrintingVideo,
  videoTriageCsvFilename,
} from "../../utils/videoPlaylistCsv";
import { previewVideoTriageCsv } from "../../utils/videoTriageCsvImport";

const CLASSIFICATION_LABELS: Record<
  VideoPlaylistCandidateClassification,
  string
> = {
  new: "New",
  existing: "Existing",
  private: "Private",
  deleted: "Deleted",
  unavailable: "Unavailable",
  malformed: "Malformed",
};

const DEFAULT_YOUTUBE_PLAYLIST_URL =
  "https://youtube.com/playlist?list=PL4ln_sfE3QCLplcay8knoxMnbm1mpaJek&si=I8Y0FrAaj2ZROvKd";

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function PreviewSummary({ preview }: { preview: VideoPlaylistPreview }) {
  const suggested3dPrintingCount = preview.candidates.filter(
    isSuggested3dPrintingVideo,
  ).length;
  const summary = [
    ["Playlist items", preview.counts.playlist_items],
    ["Unique candidates", preview.counts.unique_candidates],
    ["New videos", preview.counts.new_videos],
    ["Already in WasteDB", preview.counts.existing_videos],
    ["Unavailable", preview.counts.unavailable],
    ["Private", preview.counts.private],
    ["Deleted", preview.counts.deleted],
    ["Duplicates", preview.counts.duplicate_playlist_items],
    ["3D printing suggestions", suggested3dPrintingCount],
  ] as const;

  const downloadTriageCsv = () => {
    const blob = new Blob([buildVideoTriageCsv(preview)], {
      type: "text/csv;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = videoTriageCsvFilename(preview.fetched_at);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-waste-compost/30 bg-waste-compost/5 p-4">
        <div className="flex items-start gap-2">
          <CheckCircle className="mt-0.5 size-4 shrink-0 text-waste-compost" />
          <div>
            <p className="text-[13px] font-medium">Read-only preview complete</p>
            <p className="mt-1 text-[12px] text-black/60 dark:text-white/60">
              No videos, entities, bindings, mappings, or triage decisions were
              created.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-sniglet text-[15px]">{preview.source.title}</h4>
        <p className="text-[12px] text-black/60 dark:text-white/60">
          {preview.source.channel_name ?? "Unknown channel"} ·{" "}
          {preview.source.privacy_status ?? "Unknown visibility"}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-black/10 p-3 dark:border-white/10"
          >
            <dt className="text-[11px] text-black/50 dark:text-white/50">
              {label}
            </dt>
            <dd className="mt-1 font-mono text-[18px]">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-lg bg-black/5 p-3 text-[11px] dark:bg-white/5">
        <div className="font-medium">Preview checksum</div>
        <code className="mt-1 block break-all text-black/60 dark:text-white/60">
          {preview.preview_checksum}
        </code>
      </div>

      <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium">Triage worksheet</p>
            <p className="mt-1 max-w-xl text-[11px] text-black/60 dark:text-white/60">
              Export all candidates with provider status, issues, suggested 3D
              printing tags, and blank columns for disposition, materials,
              reviewed topics, editorial targets, and notes.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadTriageCsv}
            className="retro-btn-primary flex items-center gap-2"
          >
            <Download className="size-4" />
            Download triage CSV
          </button>
        </div>
      </div>

      <details className="rounded-lg border border-black/10 dark:border-white/10">
        <summary className="cursor-pointer px-4 py-3 text-[13px] font-medium">
          Inspect {preview.candidates.length} candidates
        </summary>
        <div className="max-h-[34rem] overflow-auto border-t border-black/10 dark:border-white/10">
          <table className="w-full min-w-[760px] text-left text-[12px]">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-black/10 dark:border-white/10">
                <th scope="col" className="px-3 py-2 font-medium">
                  Position
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Status
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Video
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Duration
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Issues
                </th>
              </tr>
            </thead>
            <tbody>
              {preview.candidates.map((candidate) => (
                <tr
                  key={candidate.candidate_key}
                  className="border-b border-black/5 align-top last:border-b-0 dark:border-white/5"
                >
                  <td className="px-3 py-3 font-mono">
                    {candidate.playlist_positions.join(", ") || "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-full border border-black/15 px-2 py-1 text-[10px] dark:border-white/15">
                      {CLASSIFICATION_LABELS[candidate.classification]}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">
                      {candidate.title ?? "Untitled playlist item"}
                    </div>
                    <div className="mt-1 text-[11px] text-black/50 dark:text-white/50">
                      {candidate.channel_name ?? "Unknown channel"}
                    </div>
                    {candidate.youtube_url && (
                      <a
                        href={candidate.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[11px] underline underline-offset-2"
                      >
                        Open on YouTube <ExternalLink className="size-3" />
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono">
                    {formatDuration(candidate.duration_seconds)}
                  </td>
                  <td className="px-3 py-3 text-[11px]">
                    {candidate.issues.length > 0
                      ? candidate.issues.join(", ")
                      : "None"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function TriageCsvValidationPanel({
  currentPreview,
}: {
  currentPreview: VideoPlaylistPreview | null;
}) {
  const [filename, setFilename] = useState<string | null>(null);
  const [validation, setValidation] =
    useState<VideoTriageCsvPreview | null>(null);
  const [worksheetCsv, setWorksheetCsv] = useState<string | null>(null);
  const [capabilities, setCapabilities] =
    useState<VideoPlaylistCapabilities | null>(null);
  const [stageResult, setStageResult] =
    useState<VideoTriageStageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isStaging, setIsStaging] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .getVideoPlaylistCapabilities()
      .then((result) => {
        if (active) setCapabilities(result);
      })
      .catch(() => {
        if (active) setCapabilities(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const validateFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    setValidation(null);
    setWorksheetCsv(null);
    setStageResult(null);
    setError(null);
    setIsReading(true);
    try {
      const csv = await file.text();
      setWorksheetCsv(csv);
      setValidation(await previewVideoTriageCsv(csv));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsReading(false);
    }
  };

  const matchesCurrentPreview =
    !currentPreview ||
    !validation ||
    (validation.sourcePreviewChecksum === currentPreview.preview_checksum &&
      validation.playlistId === currentPreview.source.playlist_id);

  const canStage = Boolean(
    capabilities?.triage_persistence_enabled &&
      currentPreview &&
      validation?.validForStaging &&
      matchesCurrentPreview &&
      worksheetCsv &&
      filename,
  );

  const stageWorksheet = async () => {
    if (
      !canStage ||
      !currentPreview ||
      !validation ||
      !worksheetCsv ||
      !filename
    ) {
      return;
    }
    const confirmed = window.confirm(
      `Stage ${validation.counts.rows} private triage records? This will not create or publish videos.`,
    );
    if (!confirmed) return;

    setIsStaging(true);
    setError(null);
    setStageResult(null);
    try {
      setStageResult(
        await api.stageVideoTriageWorksheet({
          source_filename: filename,
          source_playlist_title: currentPreview.source.title,
          worksheet_csv: worksheetCsv,
          worksheet: validation,
        }),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsStaging(false);
    }
  };

  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
      <div className="flex items-start gap-3">
        <Upload className="mt-0.5 size-4 shrink-0" />
        <div className="flex-1">
          <p className="text-[13px] font-medium">Validate reviewed worksheet</p>
          <p className="mt-1 text-[11px] text-black/60 dark:text-white/60">
            Select an exported CSV to check its structure and review state in
            this browser. The file is not uploaded or saved to WasteDB.
          </p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-[12px] hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5">
            <Upload className="size-3.5" />
            {isReading ? "Reading…" : "Choose triage CSV"}
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={validateFile}
              disabled={isReading}
              className="sr-only"
            />
          </label>
          {filename && (
            <span className="ml-3 text-[11px] text-black/50 dark:text-white/50">
              {filename}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4" aria-live="polite">
        {error && (
          <p className="text-[12px] text-red-600 dark:text-red-300">{error}</p>
        )}
        {validation && (
          <div className="space-y-3">
            <div
              className={`rounded-lg border p-3 text-[12px] ${
                validation.validForStaging && matchesCurrentPreview
                  ? "border-waste-compost/30 bg-waste-compost/5"
                  : "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
              }`}
            >
              <p className="font-medium">
                {validation.validForStaging && matchesCurrentPreview
                  ? "Worksheet is structurally valid"
                  : "Worksheet needs attention"}
              </p>
              <p className="mt-1 text-[11px] text-black/60 dark:text-white/60">
                {validation.counts.rows} rows · {validation.counts.errors} errors
                · {validation.counts.warnings} warnings ·{" "}
                {validation.counts.reviewed} reviewed ·{" "}
                {validation.counts.unreviewedAvailable} available rows still
                unreviewed
              </p>
              {!matchesCurrentPreview && (
                <p className="mt-2 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  This worksheet does not match the currently displayed playlist
                  preview and must not be staged from this screen.
                </p>
              )}
              <p className="mt-2 text-[11px]">
                Draft apply readiness: {validation.readyForDraftApply ? "yes" : "no"}
              </p>
            </div>

            {validation.issues.length > 0 && (
              <details className="rounded-lg border border-black/10 dark:border-white/10">
                <summary className="cursor-pointer px-3 py-2 text-[12px] font-medium">
                  Inspect validation findings ({validation.issues.length})
                </summary>
                <ul className="max-h-64 space-y-2 overflow-auto border-t border-black/10 p-3 text-[11px] dark:border-white/10">
                  {validation.issues.slice(0, 100).map((issue, index) => (
                    <li key={`${issue.row}-${issue.column}-${index}`}>
                      <span className="font-medium uppercase">
                        {issue.severity}
                      </span>{" "}
                      {issue.row ? `row ${issue.row}` : "worksheet"}
                      {issue.column ? ` · ${issue.column}` : ""}: {issue.message}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
              <p className="text-[11px] text-black/60 dark:text-white/60">
                Staging saves private triage records only. It does not create
                videos, graph relationships, tags, mappings, or public content.
              </p>
              {!currentPreview && (
                <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300">
                  Run the matching playlist preview before staging this worksheet.
                </p>
              )}
              {capabilities && !capabilities.triage_persistence_enabled && (
                <p className="mt-2 text-[11px] text-black/50 dark:text-white/50">
                  Worksheet staging is currently disabled by the server safety gate.
                </p>
              )}
              <button
                type="button"
                onClick={stageWorksheet}
                disabled={!canStage || isStaging}
                className="retro-btn-primary mt-3 flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isStaging ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {isStaging ? "Staging worksheet…" : "Stage private triage records"}
              </button>
            </div>

            {stageResult && (
              <div className="rounded-lg border border-waste-compost/30 bg-waste-compost/5 p-3 text-[12px]">
                <p className="font-medium">
                  {stageResult.created
                    ? "Worksheet staged"
                    : "Worksheet was already staged"}
                </p>
                <p className="mt-1 text-[11px] text-black/60 dark:text-white/60">
                  {stageResult.row_count} private records · status {stageResult.status}
                  {" · batch "}
                  <code>{stageResult.batch_id}</code>
                </p>
                <p className="mt-1 text-[11px]">{stageResult.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function VideoPlaylistPreviewPanel() {
  const [playlistUrl, setPlaylistUrl] = useState(DEFAULT_YOUTUBE_PLAYLIST_URL);
  const [preview, setPreview] = useState<VideoPlaylistPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runPreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedUrl = playlistUrl.trim();
    if (!normalizedUrl) {
      setError("Enter a YouTube playlist URL.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setPreview(null);
    try {
      const response = await api.previewYouTubePlaylist(normalizedUrl);
      if (!response.success || !response.ready_for_triage) {
        throw new Error(response.error ?? "Playlist preview was not ready.");
      }
      setPreview(response.preview);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      id="video-playlist-preview"
      className="retro-card space-y-5 p-6"
      aria-labelledby="video-playlist-preview-title"
    >
      <div className="flex items-start gap-3">
        <ListVideo className="mt-0.5 size-5 shrink-0" />
        <div>
          <h3
            id="video-playlist-preview-title"
            className="font-sniglet text-[16px] normal"
          >
            YouTube Playlist Preview
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-black/70 dark:text-white/70">
            Enumerate, normalize, and compare a playlist without creating or
            changing WasteDB records. A separately gated action can preserve a
            validated worksheet as private triage records.
          </p>
        </div>
      </div>

      <form onSubmit={runPreview} className="space-y-3">
        <div>
          <label
            htmlFor="youtube-playlist-url"
            className="mb-1 block text-[11px] font-medium text-black/60 dark:text-white/60"
          >
            YouTube playlist URL
          </label>
          <input
            id="youtube-playlist-url"
            type="url"
            value={playlistUrl}
            onChange={(event) => setPlaylistUrl(event.target.value)}
            placeholder="https://youtube.com/playlist?list=…"
            autoComplete="off"
            spellCheck={false}
            disabled={isLoading}
            className="w-full rounded-lg border border-black/15 bg-black/5 px-3 py-2 font-mono text-[12px] focus:outline-none focus:ring-1 focus:ring-waste-science disabled:opacity-60 dark:border-white/15 dark:bg-white/5"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || playlistUrl.trim().length === 0}
          className="retro-btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
          {isLoading ? "Reading playlist…" : "Preview playlist"}
        </button>
      </form>

      <div aria-live="polite">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-[12px] text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
            <XCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {preview && <PreviewSummary preview={preview} />}
      </div>

      <TriageCsvValidationPanel currentPreview={preview} />
    </section>
  );
}
