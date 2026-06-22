import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import type { Test } from "../types";

const REST_URL = `https://${projectId}.supabase.co/rest/v1`;
const EDGE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-17cae920`;

const GRAPH_BACKUP_TABLES = [
  "entity_types",
  "relationship_types",
  "tag_types",
  "content_roles",
  "lifecycle_focuses",
  "evidence_uses",
  "videos",
  "entities",
  "entity_canonical_bindings",
  "entity_relationships",
  "tags",
  "entity_tags",
  "content_entities",
  "graph_migration_runs",
  "graph_migration_checkpoints",
  "graph_migration_issues",
  "graph_sync_outbox",
] as const;

const ANONYMOUS_WRITE_PROBES: Array<{
  table: string;
  payload: Record<string, unknown>;
}> = [
  {
    table: "entities",
    payload: {
      entity_type: "process",
      name: "Stage 6 anonymous entity probe",
      status: "active",
    },
  },
  {
    table: "entity_relationships",
    payload: {
      source_entity_id: "00000000-0000-0000-0000-000000000001",
      target_entity_id: "00000000-0000-0000-0000-000000000002",
      relationship_type: "related_to",
      status: "active",
    },
  },
  {
    table: "entity_tags",
    payload: {
      entity_id: "00000000-0000-0000-0000-000000000001",
      tag_id: "00000000-0000-0000-0000-000000000002",
      status: "active",
    },
  },
  {
    table: "tags",
    payload: {
      slug: "stage-6-anonymous-tag-probe",
      label: "Stage 6 anonymous tag probe",
    },
  },
  {
    table: "content_entities",
    payload: {
      content_entity_id: "00000000-0000-0000-0000-000000000001",
      subject_entity_id: "00000000-0000-0000-0000-000000000002",
      role: "mentioned",
      status: "active",
    },
  },
  {
    table: "videos",
    payload: {
      title: "Stage 6 anonymous video probe",
      youtube_url: "https://www.youtube.com/watch?v=stage6probe",
      status: "published",
    },
  },
  {
    table: "relationship_types",
    payload: {
      slug: "anonymous_governance_probe",
      label: "Anonymous governance probe",
      description: "Anonymous governance writes must be denied.",
    },
  },
  {
    table: "graph_migration_issues",
    payload: {
      run_id: "00000000-0000-0000-0000-000000000001",
      source_table: "anonymous_probe",
      source_identifier: "anonymous_probe",
      issue_category: "authorization_probe",
      reason: "Anonymous writes must be denied",
      original_payload: {},
    },
  },
];

async function publicRest(
  table: string,
  query = "select=*&limit=1",
): Promise<Response> {
  return fetch(`${REST_URL}/${table}?${query}`, {
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
      apikey: publicAnonKey,
      Accept: "application/json",
    },
  });
}

export function getStage6Tests(): Test[] {
  return [
    {
      id: "stage-6-graph-tables-accessible",
      name: "Graph foundation tables are present",
      description:
        "Confirms every schema-version 4.0 graph, migration-support, and outbox table is exposed through PostgREST.",
      phase: "stage-6",
      stage: 6,
      category: "Graph Schema",
      requiresAuth: false,
      testFn: async () => {
        const failures: string[] = [];
        for (const table of GRAPH_BACKUP_TABLES) {
          const response = await publicRest(table);
          if (!response.ok) {
            failures.push(`${table} (${response.status})`);
          }
        }

        return {
          success: failures.length === 0,
          message:
            failures.length === 0
              ? `All ${GRAPH_BACKUP_TABLES.length} graph-era tables are accessible.`
              : `Missing or inaccessible graph tables: ${failures.join(", ")}`,
        };
      },
    },
    {
      id: "stage-6-governed-vocabularies-seeded",
      name: "Governed graph vocabularies are seeded",
      description:
        "Checks stable entity, relationship, content-role, lifecycle, evidence-use, and tag-type slugs.",
      phase: "stage-6",
      stage: 6,
      category: "Graph Schema",
      requiresAuth: false,
      testFn: async () => {
        const required: Record<string, string[]> = {
          entity_types: ["material", "video", "process", "policy"],
          relationship_types: [
            "related_to",
            "discusses",
            "recycled_by",
            "explains",
          ],
          tag_types: ["difficulty", "topic", "evidence"],
          content_roles: ["primary_subject", "mentioned", "evidence"],
          lifecycle_focuses: ["production", "recycling", "remediation"],
          evidence_uses: [
            "recyclability",
            "environmental_impact",
            "policy_context",
          ],
        };
        const missing: string[] = [];

        for (const [table, slugs] of Object.entries(required)) {
          const response = await publicRest(
            table,
            `select=slug,description,active,approved_at&slug=in.(${slugs.join(",")})`,
          );
          if (!response.ok) {
            missing.push(`${table} (HTTP ${response.status})`);
            continue;
          }
          const rows = (await response.json()) as Array<{
            slug: string;
            description?: string;
            active?: boolean;
            approved_at?: string;
          }>;
          const returned = new Set(rows.map((row) => row.slug));
          const missingSlugs = slugs.filter((slug) => !returned.has(slug));
          missing.push(
            ...missingSlugs.map((slug) => `${table}.${slug}`),
          );
          missing.push(
            ...rows
              .filter(
                (row) =>
                  !row.description || !row.active || !row.approved_at,
              )
              .map((row) => `${table}.${row.slug} (not approved)`),
          );
        }

        return {
          success: missing.length === 0,
          message:
            missing.length === 0
              ? "All required governed vocabulary slugs are present."
              : `Missing vocabulary values: ${missing.join(", ")}`,
        };
      },
    },
    {
      id: "stage-6-evidence-linkage-columns",
      name: "Evidence graph linkage columns are available",
      description:
        "Verifies source_id, entity_id, and score_category were added without replacing existing evidence fields.",
      phase: "stage-6",
      stage: 6,
      category: "Compatibility",
      requiresAuth: false,
      testFn: async () => {
        const response = await publicRest(
          "evidence_points",
          "select=id,source_id,entity_id,score_category&limit=1",
        );
        return {
          success: response.ok,
          message: response.ok
            ? "Evidence graph linkage columns are queryable."
            : `Evidence linkage query failed with HTTP ${response.status}: ${await response.text()}`,
        };
      },
    },
    {
      id: "stage-6-public-graph-write-denied",
      name: "Anonymous knowledge-shaping mutations are denied",
      description:
        "Attempts anonymous writes across entities, relationships, tags, mappings, videos, vocabularies, and quarantine data and requires an authorization rejection.",
      phase: "stage-6",
      stage: 6,
      category: "RLS",
      requiresAuth: false,
      testFn: async () => {
        const failures: string[] = [];
        for (const probe of ANONYMOUS_WRITE_PROBES) {
          const response = await fetch(`${REST_URL}/${probe.table}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              apikey: publicAnonKey,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify(probe.payload),
          });
          if (response.status !== 401 && response.status !== 403) {
            failures.push(`${probe.table} (HTTP ${response.status})`);
          }
        }

        return {
          success: failures.length === 0,
          message:
            failures.length === 0
              ? `Anonymous writes were authorization-denied across all ${ANONYMOUS_WRITE_PROBES.length} knowledge-shaping surfaces.`
              : `Anonymous probes did not produce an authorization rejection: ${failures.join(", ")}`,
        };
      },
    },
    {
      id: "stage-6-backup-v4-coverage",
      name: "Full-site backup v4 covers the graph schema",
      description:
        "Exports and validates a graph-era backup with every graph table, row count, and checksum represented.",
      phase: "stage-6",
      stage: 6,
      category: "Backup & Recovery",
      requiresAuth: true,
      testFn: async () => {
        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "Sign in as admin to verify backup schema version 4.0.",
          };
        }
        const headers = {
          Authorization: `Bearer ${publicAnonKey}`,
          "X-Session-Token": accessToken,
          "Content-Type": "application/json",
        };
        const exportResponse = await fetch(`${EDGE_URL}/backup/full-export`, {
          headers,
        });
        if (!exportResponse.ok) {
          return {
            success: false,
            message: `Full backup returned HTTP ${exportResponse.status}: ${await exportResponse.text()}`,
          };
        }
        const backup = await exportResponse.json();
        const missing = GRAPH_BACKUP_TABLES.filter(
          (table) =>
            !Array.isArray(backup.postgres_data?.[table]) ||
            !backup.manifest?.postgres_tables?.includes(table) ||
            backup.manifest?.row_counts?.[`postgres.${table}`] === undefined ||
            !backup.manifest?.checksums?.[`postgres.${table}`],
        );
        if (backup.metadata?.schema_version !== "4.0" || missing.length > 0) {
          return {
            success: false,
            message:
              backup.metadata?.schema_version !== "4.0"
                ? `Expected schema version 4.0, received ${backup.metadata?.schema_version ?? "none"}.`
                : `Backup is missing graph coverage: ${missing.join(", ")}`,
          };
        }

        const validationResponse = await fetch(`${EDGE_URL}/backup/validate`, {
          method: "POST",
          headers,
          body: JSON.stringify({ backup }),
        });
        const validation = await validationResponse.json();
        return {
          success: validationResponse.ok && validation.valid === true,
          message:
            validationResponse.ok && validation.valid === true
              ? `Schema 4.0 backup covers and validates all ${GRAPH_BACKUP_TABLES.length} graph-era tables.`
              : `Schema 4.0 validation failed: ${JSON.stringify(validation.issues ?? validation)}`,
        };
      },
    },
    {
      id: "stage-6-entity-backfill-dry-run",
      name: "Entity backfill dry run is non-mutating",
      description:
        "Builds the canonical entity and binding plan, reports inserts, updates, reconciled rows, conflicts, and unresolved rows, and proves that graph snapshots are unchanged.",
      phase: "stage-6",
      stage: 6,
      category: "Migration Safety",
      requiresAuth: true,
      testFn: async () => {
        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "Sign in as admin to run the entity backfill dry run.",
          };
        }

        const response = await fetch(
          `${EDGE_URL}/graph/migrations/entity-backfill/dry-run`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "X-Session-Token": accessToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sample_limit: 5 }),
          },
        );
        const payload = await response.json();
        if (!response.ok || payload.success !== true) {
          return {
            success: false,
            message: `Entity dry run failed with HTTP ${response.status}: ${JSON.stringify(payload)}`,
          };
        }

        const report = payload.report;
        const phases = Object.values(report?.phases ?? {}) as Array<{
          source_count?: number;
          summary?: { processed?: number };
        }>;
        const sourceCount = phases.reduce(
          (total, phase) => total + (phase.source_count ?? 0),
          0,
        );
        const phaseProcessed = phases.reduce(
          (total, phase) => total + (phase.summary?.processed ?? 0),
          0,
        );
        const summary = report?.summary;
        const prospective = report?.prospective_writes;
        const snapshotStable =
          JSON.stringify(report?.graph_snapshot_before) ===
          JSON.stringify(report?.graph_snapshot_after);
        const totalsReconcile =
          summary?.processed === sourceCount &&
          phaseProcessed === sourceCount &&
          prospective?.entity_inserts === summary?.inserts &&
          prospective?.canonical_binding_inserts === summary?.inserts &&
          prospective?.entity_updates === summary?.updates &&
          prospective?.total === summary?.inserts * 2 + summary?.updates;
        const valid =
          report?.mode === "dry_run" &&
          report?.mutation_performed === false &&
          report?.mutation_detected === false &&
          snapshotStable &&
          totalsReconcile &&
          typeof report?.report_checksum === "string" &&
          /^[a-f0-9]{64}$/.test(report.report_checksum);

        return {
          success: valid,
          message: valid
            ? `Dry run reconciled ${sourceCount} canonical rows without graph writes; ${report.blocking_issue_count} blocking issue(s) reported.`
            : "Entity dry-run report did not satisfy the non-mutation or reconciliation contract.",
        };
      },
    },
    {
      id: "stage-6-entity-backfill-apply-gate",
      name: "Entity backfill apply remains explicitly gated",
      description:
        "Confirms the admin capability contract reports graph reads and compatibility writes disabled and requires a separate apply-window flag.",
      phase: "stage-6",
      stage: 6,
      category: "Migration Safety",
      requiresAuth: true,
      testFn: async () => {
        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "Sign in as admin to verify the entity apply gate.",
          };
        }

        const response = await fetch(
          `${EDGE_URL}/graph/migrations/entity-backfill/capabilities`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "X-Session-Token": accessToken,
            },
          },
        );
        const payload = await response.json();
        const valid =
          response.ok &&
          payload.migration_version === "stage-6-entity-backfill-v1" &&
          payload.apply_enabled === false &&
          payload.graph_reads_enabled === false &&
          payload.compatibility_writes_enabled === false &&
          Array.isArray(payload.phases) &&
          payload.phases.length === 5 &&
          typeof payload.apply_confirmation === "string";

        return {
          success: valid,
          message: valid
            ? "Entity apply tooling is deployed but production execution, graph reads, and compatibility writes remain disabled."
            : `Entity apply capability contract is unsafe or incomplete: ${JSON.stringify(payload)}`,
        };
      },
    },
    {
      id: "stage-6-entity-backfill-rpc-private",
      name: "Entity backfill RPC rejects anonymous execution",
      description:
        "Attempts to invoke the transactional phase function through PostgREST with the anonymous role and requires authorization denial.",
      phase: "stage-6",
      stage: 6,
      category: "RLS",
      requiresAuth: false,
      testFn: async () => {
        const response = await fetch(
          `${REST_URL}/rpc/apply_graph_entity_backfill_phase`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              apikey: publicAnonKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              p_run_id: "00000000-0000-0000-0000-000000000001",
              p_phase: "materials",
              p_records: [],
              p_plan_checksum: "0".repeat(64),
            }),
          },
        );

        return {
          success: response.status === 401 || response.status === 403,
          message:
            response.status === 401 || response.status === 403
              ? "Anonymous execution of the entity-backfill RPC was denied."
              : `Entity-backfill RPC returned unexpected HTTP ${response.status}: ${await response.text()}`,
        };
      },
    },
  ];
}
