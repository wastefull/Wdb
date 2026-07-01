import { useState } from "react";
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Terminal,
  GitMerge,
  ListVideo,
} from "lucide-react";
import * as api from "../../utils/api";
import { ContentMappingPreviewPanel } from "./ContentMappingPreviewPanel";
import { VideoPlaylistPreviewPanel } from "./VideoPlaylistPreviewPanel";
import { VideoTriageReviewPanel } from "./VideoTriageReviewPanel";

interface OneTimeAction {
  id: string;
  title: string;
  description: string;
  warning?: string;
  disabled?: boolean;
  run: () => Promise<unknown>;
}

interface GraphMigrationField {
  key: string;
  label: string;
  defaultValue: string;
  readOnly?: boolean;
  hint?: string;
}

interface GraphMigrationAction {
  disabled?: boolean;
  id: string;
  title: string;
  description: string;
  warning?: string;
  requiredConfirmation: string;
  fields: GraphMigrationField[];
  run: (values: Record<string, string>) => Promise<unknown>;
}

const ACTIONS: OneTimeAction[] = [
  {
    id: "recover-toothbrush-article",
    title: "Recover 'Keep your old toothbrushes!' Article",
    description:
      "Restores the reusability article for Toothbrush that was direct-published by an admin on 2026-05-28 but never persisted to Postgres (the content was recovered from the audit log). Safe to run once — will create a duplicate if run again.",
    warning:
      "Run only once. Check that the article does not already exist before running.",
    disabled: true,
    run: api.recoverToothbrushArticle,
  },
  {
    id: "migrate-kv-articles",
    title: "Migrate KV-Only Articles to Postgres",
    description:
      "Scans all KV material blobs and inserts any articles with numeric (pre-UUID) IDs into the Postgres articles table. These are articles that were direct-published by admins before the Postgres persistence fix. Safe to run multiple times — articles already in Postgres (matched by title + material + category) are skipped.",
    warning:
      "Admin only. Run this once to recover articles that were added directly through the admin article editor before today's fix.",
    disabled: true,
    run: api.migrateKvArticlesToPostgres,
  },
  {
    id: "recover-approved-articles",
    title: "Recover Approved Articles",
    description:
      "Scans all approved article submissions in KV and re-inserts any that are missing from the Postgres articles table. Safe to run multiple times — articles already in Postgres are skipped.",
    warning:
      "Admin only. Run this once after deploying the article persistence fix to restore any articles that were approved but never saved.",
    disabled: true,
    run: api.recoverApprovedArticles,
  },
  {
    id: "seed-evidence-from-kv",
    title: "Seed Evidence Points from KV",
    description:
      "Reads all material:* KV blobs and migrates embedded evidence (MIU) data into the evidence_points Postgres table. Safe to run multiple times — already-seeded entries are skipped.",
    warning:
      "Admin only. Check the response for errors before marking Step 15 complete.",
    disabled: true,
    run: api.seedEvidenceFromKV,
  },
  {
    id: "seed-audit-log-from-kv",
    title: "Seed Audit Log from KV",
    description:
      "Reads all audit:* KV entries and migrates them into the audit_log Postgres table. Safe to run multiple times — already-seeded entries are skipped. Does NOT trigger audit email notifications.",
    warning:
      "Admin only. Run after deploying the audit_log table migration (Step 17).",
    disabled: true,
    run: api.seedAuditLogFromKV,
  },
  {
    id: "seed-roles-from-kv",
    title: "Seed Roles from KV",
    description:
      "Reads all user_role:* KV entries and updates user_profiles.role in Postgres. Safe to run multiple times — KV value wins if it differs from 'user'. Does NOT trigger audit emails.",
    warning:
      "Admin only. Run after deploying the role column migration (Step 19).",
    disabled: true,
    run: api.seedRolesFromKV,
  },
];

const GRAPH_MIGRATION_ACTIONS: GraphMigrationAction[] = [
  {
    id: "entity-backfill-apply",
    title: "Apply Stage 6 Entity Backfill",
    description:
      "Runs the transactional entity and canonical-binding backfill against the reviewed dry-run plan. Each source table is processed in one database transaction; a failed phase rolls back its writes, persists a failed checkpoint, and can be resumed. GRAPH_MIGRATION_APPLY_ENABLED must be set to true in Edge Function secrets before running.",
    warning:
      "Irreversible without a separately approved cleanup migration. Confirm the dry-run checksum is still current, the recovery artifact SHA-256 matches the file on disk, and GRAPH_MIGRATION_APPLY_ENABLED is set before running.",
    requiredConfirmation: "APPLY STAGE 6 ENTITY BACKFILL",
    fields: [
      {
        key: "expected_report_checksum",
        label: "Dry-run report checksum",
        defaultValue:
          "a61a04f83dc09b5f98e68304e1edd5d39e8e7ca19b13408710f9c1dc352e8699",
        hint: 'Re-run "Entity backfill dry run is non-mutating" in Stage 6 tests to confirm this is still current.',
      },
      {
        key: "recovery_sha256",
        label: "Recovery artifact SHA-256",
        defaultValue: "",
        hint: "shasum -a 256 /private/tmp/wastedb-stage6-reports/wastedb-full-backup-2026-06-22.json",
      },
      {
        key: "recovery_location",
        label: "Recovery artifact location",
        defaultValue:
          "/private/tmp/wastedb-stage6-reports/wastedb-full-backup-2026-06-22.json",
      },
    ],
    run: async (values) => {
      return await api.applyEntityBackfill({
        confirmation: "APPLY STAGE 6 ENTITY BACKFILL",
        expected_report_checksum: values.expected_report_checksum,
        recovery_artifact: {
          schema_version: "4.0",
          sha256: values.recovery_sha256,
          location: values.recovery_location,
        },
      });
    },
    disabled: true,
  },
];

type ActionState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; result: unknown }
  | { status: "error"; message: string };

interface OneTimeActionsPanelProps {
  onBack: () => void;
}

export function OneTimeActionsPanel({ onBack }: OneTimeActionsPanelProps) {
  const [states, setStates] = useState<Record<string, ActionState>>({});

  const runAction = async (action: OneTimeAction) => {
    setStates((prev) => ({ ...prev, [action.id]: { status: "running" } }));
    try {
      const result = await action.run();
      setStates((prev) => ({
        ...prev,
        [action.id]: { status: "done", result },
      }));
    } catch (err) {
      setStates((prev) => ({
        ...prev,
        [action.id]: {
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        },
      }));
    }
  };

  const [graphFormValues, setGraphFormValues] = useState<
    Record<string, Record<string, string>>
  >(
    Object.fromEntries(
      GRAPH_MIGRATION_ACTIONS.map((action) => [
        action.id,
        Object.fromEntries(action.fields.map((f) => [f.key, f.defaultValue])),
      ]),
    ),
  );
  const [graphConfirm, setGraphConfirm] = useState<Record<string, string>>({});
  const [graphStates, setGraphStates] = useState<Record<string, ActionState>>(
    {},
  );

  const runGraphAction = async (action: GraphMigrationAction) => {
    setGraphStates((prev) => ({
      ...prev,
      [action.id]: { status: "running" },
    }));
    try {
      const result = await action.run(graphFormValues[action.id] ?? {});
      setGraphStates((prev) => ({
        ...prev,
        [action.id]: { status: "done", result },
      }));
    } catch (err) {
      setGraphStates((prev) => ({
        ...prev,
        [action.id]: {
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        },
      }));
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-72 border-r border-[#211f1c]/10 dark:border-white/10 p-6 shrink-0">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 normal hover:opacity-70 transition-opacity"
          >
            <ArrowLeft size={16} />
            <span className="font-sniglet text-[14px]">Admin Dashboard</span>
          </button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Terminal size={20} />
          <h2 className="font-display text-[22px] normal">One-Time Actions</h2>
        </div>

        <p className="text-[12px] text-black/60 dark:text-white/60 leading-relaxed">
          Administrative scripts and migration utilities. Each action is safe to
          re-run unless noted otherwise.
        </p>

        <div className="mt-6 space-y-1">
          <div className="pb-3 mb-3 border-b border-black/10 dark:border-white/10">
            <p className="text-[11px] uppercase tracking-wide text-black/40 dark:text-white/40 px-3 pb-2 flex items-center gap-1">
              <ListVideo size={10} /> Graph Content
            </p>
            <button
              onClick={() =>
                document
                  .getElementById("video-playlist-preview")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="w-full text-left px-3 py-2 rounded-lg text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <span className="w-3 h-3 shrink-0 rounded-full border border-black/20 dark:border-white/20" />
              <span className="truncate">YouTube Playlist Preview</span>
            </button>
          </div>

          {ACTIONS.map((action) => {
            const state = states[action.id] ?? { status: "idle" };
            return (
              <button
                disabled={action.disabled}
                key={action.id}
                onClick={
                  action.disabled
                    ? () => void 0
                    : () =>
                        document
                          .getElementById(`action-${action.id}`)
                          ?.scrollIntoView({ behavior: "smooth" })
                }
                className="w-full text-left px-3 py-2 rounded-lg text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                {state.status === "running" && (
                  <Loader2
                    size={12}
                    className="shrink-0 animate-spin text-waste-science"
                  />
                )}
                {state.status === "done" && (
                  <CheckCircle
                    size={12}
                    className="shrink-0 text-waste-compost"
                  />
                )}
                {state.status === "error" && (
                  <XCircle size={12} className="shrink-0 text-red-500" />
                )}
                {state.status === "idle" && (
                  <span className="w-3 h-3 shrink-0 rounded-full border border-black/20 dark:border-white/20" />
                )}
                <span className="truncate">{action.title}</span>
              </button>
            );
          })}

          <div className="pt-3 mt-3 border-t border-black/10 dark:border-white/10">
            <p className="text-[11px] uppercase tracking-wide text-black/40 dark:text-white/40 px-3 pb-2 flex items-center gap-1">
              <GitMerge size={10} /> Graph Migration
            </p>
            {GRAPH_MIGRATION_ACTIONS.map((action) => {
              const state = graphStates[action.id] ?? { status: "idle" };
              return (
                <button
                  disabled={action.disabled}
                  key={action.id}
                  onClick={
                    action.disabled
                      ? () => void 0
                      : () =>
                          document
                            .getElementById(`action-${action.id}`)
                            ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="w-full text-left px-3 py-2 rounded-lg text-[13px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  {state.status === "running" && (
                    <Loader2
                      size={12}
                      className="shrink-0 animate-spin text-waste-science"
                    />
                  )}
                  {state.status === "done" && (
                    <CheckCircle
                      size={12}
                      className="shrink-0 text-waste-compost"
                    />
                  )}
                  {state.status === "error" && (
                    <XCircle size={12} className="shrink-0 text-red-500" />
                  )}
                  {state.status === "idle" && (
                    <span className="w-3 h-3 shrink-0 rounded-full border border-black/20 dark:border-white/20" />
                  )}
                  <span className="truncate">{action.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          <ContentMappingPreviewPanel />
          <VideoPlaylistPreviewPanel />
          <VideoTriageReviewPanel />

          {ACTIONS.map((action) => {
            const state = states[action.id] ?? { status: "idle" };
            const isRunning = state.status === "running";
            return (
              <div
                key={action.id}
                id={`action-${action.id}`}
                className="retro-card p-6 space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-sniglet text-[16px] normal mb-1">
                      {action.title}
                    </h3>
                    <p className="text-[13px] text-black/70 dark:text-white/70 leading-relaxed">
                      {action.description}
                    </p>
                    {action.warning && (
                      <p className="mt-2 text-[12px] text-amber-600 dark:text-amber-400">
                        ⚠ {action.warning}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={
                      action.disabled ? () => void 0 : () => runAction(action)
                    }
                    disabled={isRunning || action.disabled}
                    className="retro-btn-primary flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRunning ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    {isRunning ? "Running…" : "Run"}
                  </button>
                </div>

                {/* Result */}
                {state.status === "done" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-waste-compost text-[13px]">
                      <CheckCircle size={14} />
                      <span>Completed</span>
                    </div>
                    <pre className="bg-black/5 dark:bg-white/5 rounded-lg p-4 text-[12px] font-mono overflow-x-auto whitespace-pre-wrap break-all border border-[#211f1c]/10 dark:border-white/10">
                      {JSON.stringify(state.result, null, 2)}
                    </pre>
                  </div>
                )}

                {state.status === "error" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-500 text-[13px]">
                      <XCircle size={14} />
                      <span>Error</span>
                    </div>
                    <pre className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 text-[12px] font-mono text-red-700 dark:text-red-300 overflow-x-auto whitespace-pre-wrap break-all border border-red-200 dark:border-red-800">
                      {state.message}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}

          {/* Graph Migration Actions */}
          <div className="pt-2">
            <h2 className="font-display text-[18px] normal mb-1 flex items-center gap-2">
              <GitMerge size={18} /> Graph Migration
            </h2>
            <p className="text-[12px] text-black/60 dark:text-white/60 mb-4">
              Separately approved migration operations. Each requires explicit
              confirmation and a validated recovery artifact.
            </p>
          </div>

          {GRAPH_MIGRATION_ACTIONS.map((action) => {
            const state = graphStates[action.id] ?? { status: "idle" };
            const isRunning = state.status === "running";
            const formValues = graphFormValues[action.id] ?? {};
            const confirmValue = graphConfirm[action.id] ?? "";
            const confirmationMatches =
              confirmValue === action.requiredConfirmation;
            const sha256Valid = /^[a-f0-9]{64}$/.test(
              (formValues.recovery_sha256 ?? "").trim(),
            );
            const canRun = confirmationMatches && sha256Valid && !isRunning;

            return (
              <div
                key={action.id}
                id={`action-${action.id}`}
                className="retro-card p-6 space-y-4 border-2 border-amber-200 dark:border-amber-800/50"
              >
                <div>
                  <h3 className="font-sniglet text-[16px] normal mb-1">
                    {action.title}
                  </h3>
                  <p className="text-[13px] text-black/70 dark:text-white/70 leading-relaxed">
                    {action.description}
                  </p>
                  {action.warning && (
                    <p className="mt-2 text-[12px] text-amber-600 dark:text-amber-400">
                      ⚠ {action.warning}
                    </p>
                  )}
                </div>

                {/* Form fields */}
                <div className="space-y-3">
                  {action.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-[11px] font-medium text-black/60 dark:text-white/60 mb-1">
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={formValues[field.key] ?? field.defaultValue}
                        readOnly={field.readOnly}
                        onChange={(e) =>
                          setGraphFormValues((prev) => ({
                            ...prev,
                            [action.id]: {
                              ...prev[action.id],
                              [field.key]: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 text-[12px] font-mono bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 rounded-lg focus:outline-none focus:ring-1 focus:ring-waste-science read-only:opacity-60 read-only:cursor-default"
                        spellCheck={false}
                      />
                      {field.hint && (
                        <p className="mt-1 text-[11px] text-black/40 dark:text-white/40">
                          {field.hint}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Confirmation */}
                <div>
                  <label className="block text-[11px] font-medium text-black/60 dark:text-white/60 mb-1">
                    Type confirmation to unlock:{" "}
                    <span className="font-mono text-amber-600 dark:text-amber-400">
                      {action.requiredConfirmation}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={confirmValue}
                    onChange={(e) =>
                      setGraphConfirm((prev) => ({
                        ...prev,
                        [action.id]: e.target.value,
                      }))
                    }
                    placeholder={action.requiredConfirmation}
                    className="w-full px-3 py-2 text-[12px] font-mono bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 rounded-lg focus:outline-none focus:ring-1 focus:ring-waste-science"
                    spellCheck={false}
                  />
                </div>

                {!sha256Valid && formValues.recovery_sha256 && (
                  <p className="text-[12px] text-red-500">
                    Recovery SHA-256 must be a 64-character hex string.
                  </p>
                )}

                <button
                  onClick={() => runGraphAction(action)}
                  disabled={!canRun}
                  className="retro-btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isRunning ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Play size={14} />
                  )}
                  {isRunning ? "Running…" : "Run"}
                </button>

                {state.status === "done" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-waste-compost text-[13px]">
                      <CheckCircle size={14} />
                      <span>Completed</span>
                    </div>
                    <pre className="bg-black/5 dark:bg-white/5 rounded-lg p-4 text-[12px] font-mono overflow-x-auto whitespace-pre-wrap break-all border border-[#211f1c]/10 dark:border-white/10">
                      {JSON.stringify(state.result, null, 2)}
                    </pre>
                  </div>
                )}

                {state.status === "error" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-500 text-[13px]">
                      <XCircle size={14} />
                      <span>Error</span>
                    </div>
                    <pre className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 text-[12px] font-mono text-red-700 dark:text-red-300 overflow-x-auto whitespace-pre-wrap break-all border border-red-200 dark:border-red-800">
                      {state.message}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
