import { useState } from "react";
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Terminal,
} from "lucide-react";
import * as api from "../../utils/api";

interface OneTimeAction {
  id: string;
  title: string;
  description: string;
  warning?: string;
  run: () => Promise<unknown>;
}

const ACTIONS: OneTimeAction[] = [
  {
    id: "recover-toothbrush-article",
    title: "Recover 'Keep your old toothbrushes!' Article",
    description:
      "Restores the reusability article for Toothbrush that was direct-published by an admin on 2026-05-28 but never persisted to Postgres (the content was recovered from the audit log). Safe to run once — will create a duplicate if run again.",
    warning:
      "Run only once. Check that the article does not already exist before running.",
    run: api.recoverToothbrushArticle,
  },
  {
    id: "migrate-kv-articles",
    title: "Migrate KV-Only Articles to Postgres",
    description:
      "Scans all KV material blobs and inserts any articles with numeric (pre-UUID) IDs into the Postgres articles table. These are articles that were direct-published by admins before the Postgres persistence fix. Safe to run multiple times — articles already in Postgres (matched by title + material + category) are skipped.",
    warning:
      "Admin only. Run this once to recover articles that were added directly through the admin article editor before today's fix.",
    run: api.migrateKvArticlesToPostgres,
  },
  {
    id: "recover-approved-articles",
    title: "Recover Approved Articles",
    description:
      "Scans all approved article submissions in KV and re-inserts any that are missing from the Postgres articles table. Safe to run multiple times — articles already in Postgres are skipped.",
    warning:
      "Admin only. Run this once after deploying the article persistence fix to restore any articles that were approved but never saved.",
    run: api.recoverApprovedArticles,
  },
  {
    id: "seed-evidence-from-kv",
    title: "Seed Evidence Points from KV",
    description:
      "Reads all material:* KV blobs and migrates embedded evidence (MIU) data into the evidence_points Postgres table. Safe to run multiple times — already-seeded entries are skipped.",
    warning:
      "Admin only. Check the response for errors before marking Step 15 complete.",
    run: api.seedEvidenceFromKV,
  },
  {
    id: "seed-audit-log-from-kv",
    title: "Seed Audit Log from KV",
    description:
      "Reads all audit:* KV entries and migrates them into the audit_log Postgres table. Safe to run multiple times — already-seeded entries are skipped. Does NOT trigger audit email notifications.",
    warning:
      "Admin only. Run after deploying the audit_log table migration (Step 17).",
    run: api.seedAuditLogFromKV,
  },
  {
    id: "seed-roles-from-kv",
    title: "Seed Roles from KV",
    description:
      "Reads all user_role:* KV entries and updates user_profiles.role in Postgres. Safe to run multiple times — KV value wins if it differs from 'user'. Does NOT trigger audit emails.",
    warning:
      "Admin only. Run after deploying the role column migration (Step 19).",
    run: api.seedRolesFromKV,
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
          {ACTIONS.map((action) => {
            const state = states[action.id] ?? { status: "idle" };
            return (
              <button
                key={action.id}
                onClick={() =>
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
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
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
                    onClick={() => runAction(action)}
                    disabled={isRunning}
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
        </div>
      </main>
    </div>
  );
}
