import { EMPTY_MATERIAL_GRAPH_EXPERIENCE } from "../../../utils/materialExperience";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import {
  isSuggested3dPrintingVideo,
  VIDEO_TRIAGE_CSV_COLUMNS,
} from "../../../utils/videoPlaylistCsv";
import { previewVideoTriageCsv } from "../../../utils/videoTriageCsvImport";
import type { VideoPlaylistCandidate } from "../../../types/videoPlaylist";
import type { Test } from "../types";

const REST_URL = `https://${projectId}.supabase.co/rest/v1`;
const EDGE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-17cae920`;
const VIDEO_CURATION_TABLES = [
  "video_import_batches",
  "video_import_items",
  "editorial_leads",
] as const;

async function publicRest(table: string, query: string): Promise<Response> {
  return fetch(`${REST_URL}/${table}?${query}`, {
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
      apikey: publicAnonKey,
      Accept: "application/json",
    },
  });
}

export function getStage7Tests(): Test[] {
  return [
    {
      id: "stage-7-canonical-entry-baseline",
      name: "Stage 7 starts from canonical graph entities",
      description:
        "Confirms production exposes canonical entities and bindings before relationship, tag, content, and video curation begins.",
      phase: "stage-7",
      stage: 7,
      category: "Graph Curation",
      requiresAuth: false,
      testFn: async () => {
        const [entitiesResponse, bindingsResponse] = await Promise.all([
          publicRest("entities", "select=id&limit=1"),
          publicRest("entity_canonical_bindings", "select=entity_id&limit=1"),
        ]);
        if (!entitiesResponse.ok || !bindingsResponse.ok) {
          return {
            success: false,
            message: `Canonical baseline unavailable: entities HTTP ${entitiesResponse.status}, bindings HTTP ${bindingsResponse.status}.`,
          };
        }
        const entities = await entitiesResponse.json();
        const bindings = await bindingsResponse.json();
        const valid =
          Array.isArray(entities) &&
          entities.length > 0 &&
          Array.isArray(bindings) &&
          bindings.length > 0;
        return {
          success: valid,
          message: valid
            ? "Canonical entities and bindings are available as the Stage 7 baseline."
            : "Canonical entities or bindings are unexpectedly empty.",
        };
      },
    },
    {
      id: "stage-7-discusses-semantics",
      name: "Discovery relationships remain evidence-neutral",
      description:
        "Verifies the governed discusses vocabulary explicitly avoids implying evidentiary support.",
      phase: "stage-7",
      stage: 7,
      category: "Knowledge Governance",
      requiresAuth: false,
      testFn: async () => {
        const response = await publicRest(
          "relationship_types",
          "select=slug,description,active&slug=eq.discusses",
        );
        if (!response.ok) {
          return {
            success: false,
            message: `Discusses vocabulary query failed with HTTP ${response.status}.`,
          };
        }
        const rows = (await response.json()) as Array<{
          slug?: string;
          description?: string;
          active?: boolean;
        }>;
        const discusses = rows[0];
        const valid =
          discusses?.slug === "discusses" &&
          discusses.active === true &&
          discusses.description
            ?.toLowerCase()
            .includes("without implying evidentiary support") === true;
        return {
          success: valid,
          message: valid
            ? "The discusses relationship remains broad and evidence-neutral."
            : "The discusses vocabulary no longer preserves its evidence-neutral contract.",
        };
      },
    },
    {
      id: "stage-7-read-cutover-disabled",
      name: "Graph-powered material reads remain disabled",
      description:
        "Confirms Stage 7 curation work does not prematurely expose graph recommendations in the Stage 5 material adapter.",
      phase: "stage-7",
      stage: 7,
      category: "Compatibility",
      requiresAuth: false,
      testFn: async () => {
        const sections = [
          EMPTY_MATERIAL_GRAPH_EXPERIENCE.knowledgeFeed,
          EMPTY_MATERIAL_GRAPH_EXPERIENCE.relatedEntities,
          EMPTY_MATERIAL_GRAPH_EXPERIENCE.discoveryPaths,
        ];
        const valid = sections.every(
          (section) =>
            section.availability === "awaiting-graph-data" &&
            section.items.length === 0,
        );
        return {
          success: valid,
          message: valid
            ? "Material graph reads remain in the honest pre-cutover state."
            : "A graph-powered material section was enabled before Stage 8.",
        };
      },
    },
    {
      id: "stage-7-video-preview-capabilities",
      name: "Video playlist preview is safely configured",
      description:
        "Confirms the YouTube credential is server-side, read-only preview is enabled, private staging is explicitly reported, and draft apply and graph reads remain disabled.",
      phase: "stage-7",
      stage: 7,
      category: "Video Curation",
      requiresAuth: true,
      testFn: async () => {
        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "Sign in as admin to verify playlist preview capabilities.",
          };
        }
        const response = await fetch(
          `${EDGE_URL}/graph/videos/playlist/capabilities`,
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
          payload.contract_version === "stage-7-youtube-playlist-preview-v1" &&
          payload.provider === "youtube" &&
          payload.youtube_api_configured === true &&
          payload.preview_enabled === true &&
          payload.maximum_playlist_items >= 370 &&
          payload.draft_apply_enabled === false &&
          typeof payload.triage_persistence_enabled === "boolean" &&
          payload.graph_reads_enabled === false;
        return {
          success: valid,
          message: valid
            ? `YouTube playlist preview is server-side; private triage staging is ${payload.triage_persistence_enabled ? "enabled" : "disabled"}, while draft apply and graph reads remain disabled.`
            : `Playlist preview capability contract is unsafe or incomplete: ${JSON.stringify(payload)}`,
        };
      },
    },
    {
      id: "stage-7-video-triage-export",
      name: "Video triage worksheet preserves review fields",
      description:
        "Verifies the CSV contract includes disposition, material, topic, editorial-target, and notes fields plus a non-authoritative 3D-printing suggestion.",
      phase: "stage-7",
      stage: 7,
      category: "Video Curation",
      requiresAuth: false,
      testFn: async () => {
        const requiredColumns = [
          "preview_checksum",
          "disposition",
          "material_ids_or_slugs",
          "suggested_topic_tags",
          "reviewed_topic_tags",
          "editorial_targets",
          "review_notes",
        ];
        const candidate = {
          title: "Recycling filament for 3D printing",
          description: "An additive manufacturing example.",
          channel_name: "Fixture channel",
        } as VideoPlaylistCandidate;
        const valid =
          requiredColumns.every((column) =>
            VIDEO_TRIAGE_CSV_COLUMNS.includes(
              column as (typeof VIDEO_TRIAGE_CSV_COLUMNS)[number],
            ),
          ) && isSuggested3dPrintingVideo(candidate);
        return {
          success: valid,
          message: valid
            ? "The triage CSV preserves human review fields and marks 3D printing only as a suggestion."
            : "The triage CSV contract is missing review fields or topic suggestion behavior.",
        };
      },
    },
    {
      id: "stage-7-video-curation-backup",
      name: "Video curation records are fully backed up",
      description:
        "Exports and validates schema 4.1 with import batches, immutable triage items, and private editorial leads represented in the manifest.",
      phase: "stage-7",
      stage: 7,
      category: "Backup & Recovery",
      requiresAuth: true,
      testFn: async () => {
        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "Sign in as admin to verify Stage 7 backup coverage.",
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
            message: `Schema 4.1 backup returned HTTP ${exportResponse.status}: ${await exportResponse.text()}`,
          };
        }
        const backup = await exportResponse.json();
        const missing = VIDEO_CURATION_TABLES.filter(
          (table) =>
            !Array.isArray(backup.postgres_data?.[table]) ||
            !backup.manifest?.postgres_tables?.includes(table) ||
            backup.manifest?.row_counts?.[`postgres.${table}`] === undefined ||
            !backup.manifest?.checksums?.[`postgres.${table}`],
        );
        if (backup.metadata?.schema_version !== "4.1" || missing.length > 0) {
          return {
            success: false,
            message:
              backup.metadata?.schema_version !== "4.1"
                ? `Expected schema version 4.1, received ${backup.metadata?.schema_version ?? "none"}.`
                : `Backup is missing video-curation coverage: ${missing.join(", ")}`,
          };
        }
        const validationResponse = await fetch(`${EDGE_URL}/backup/validate`, {
          method: "POST",
          headers,
          body: JSON.stringify({ backup }),
        });
        const validation = await validationResponse.json();
        const valid = validationResponse.ok && validation.valid === true;
        return {
          success: valid,
          message: valid
            ? "Schema 4.1 backup covers and validates all private video-curation tables."
            : `Schema 4.1 validation failed: ${JSON.stringify(validation.issues ?? validation)}`,
        };
      },
    },
    {
      id: "stage-7-video-triage-validation",
      name: "Malformed triage worksheets fail closed",
      description:
        "Confirms local worksheet validation refuses incomplete contracts rather than staging partial review data.",
      phase: "stage-7",
      stage: 7,
      category: "Video Curation",
      requiresAuth: false,
      testFn: async () => {
        const result = await previewVideoTriageCsv(
          '"disposition","review_notes"\r\n"publish_now","unsafe"\r\n',
        );
        const valid =
          result.validForStaging === false &&
          result.readyForDraftApply === false &&
          result.counts.errors > 0 &&
          result.rows.length === 0;
        return {
          success: valid,
          message: valid
            ? "Malformed worksheets fail closed without staging partial rows."
            : "Worksheet validation accepted an incomplete or unsafe contract.",
        };
      },
    },
  ];
}
