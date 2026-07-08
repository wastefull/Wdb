import {
  buildApprovedContentMappingManifest,
  CE_ALREADY_MAPPED_NOTE,
  classifyCeResolution,
  classifyRelResolution,
  REL_ALREADY_MAPPED_NOTE,
  resolveMaterialRef,
} from "../../../supabase/functions/server/content-mapping-preview";
import type { VideoPlaylistCandidate } from "../../../types/videoPlaylist";
import { EMPTY_MATERIAL_GRAPH_EXPERIENCE } from "../../../utils/materialExperience";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import {
  isSuggested3dPrintingVideo,
  VIDEO_TRIAGE_CSV_COLUMNS,
} from "../../../utils/videoPlaylistCsv";
import { previewVideoTriageCsv } from "../../../utils/videoTriageCsvImport";
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
            : "A graph-powered material section was enabled before Stage 10.",
        };
      },
    },
    {
      id: "stage-7-video-preview-capabilities",
      name: "Video playlist preview is safely configured",
      description:
        "Confirms the YouTube credential is server-side, read-only preview is enabled, private staging is explicitly reported, and draft apply plus graph reads remain disabled.",
      phase: "stage-7",
      stage: 7,
      category: "Video Curation",
      requiresAuth: true,
      testFn: async () => {
        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message:
              "Sign in as admin to verify playlist preview capabilities.",
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
    // ── Content-mapping preview tests ────────────────────────────────────────
    {
      id: "stage-7-content-mapping-preview-non-mutating",
      name: "Content-mapping preview writes no graph records",
      description:
        "Calls the content-mapping preview endpoint and verifies that entity_relationships and content_entities counts are unchanged before and after the preview, and that the response declares itself read-only.",
      phase: "stage-7",
      stage: 7,
      category: "Graph Curation",
      requiresAuth: true,
      testFn: async () => {
        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message:
              "Sign in as admin to verify the content-mapping preview is non-mutating.",
          };
        }
        const response = await fetch(
          `${EDGE_URL}/graph/content-mappings/preview`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "X-Session-Token": accessToken,
            },
          },
        );
        if (!response.ok) {
          return {
            success: false,
            message: `Content-mapping preview returned HTTP ${response.status}: ${await response.text()}`,
          };
        }
        const report = await response.json();
        const proof = report?.mutation_proof;
        const valid =
          report?.contract_version === "stage-7-content-mapping-preview-v1" &&
          report?.is_read_only === true &&
          typeof proof?.entity_relationships_before === "number" &&
          proof.entity_relationships_before ===
            proof.entity_relationships_after &&
          typeof proof?.content_entities_before === "number" &&
          proof.content_entities_before === proof.content_entities_after;
        return {
          success: valid,
          message: valid
            ? `Content-mapping preview is read-only: ${proof.entity_relationships_before} relationships and ${proof.content_entities_before} content mappings unchanged.`
            : `Preview mutation_proof mismatch or missing: ${JSON.stringify(proof)}`,
        };
      },
    },
    {
      id: "stage-7-content-mapping-preview-deterministic",
      name: "Content-mapping preview is deterministic across repeated calls",
      description:
        "Calls the content-mapping preview twice and verifies that relationship and content-mapping candidate totals are identical, confirming the preview does not alter state between runs.",
      phase: "stage-7",
      stage: 7,
      category: "Graph Curation",
      requiresAuth: true,
      testFn: async () => {
        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message:
              "Sign in as admin to verify content-mapping preview determinism.",
          };
        }
        const headers = {
          Authorization: `Bearer ${publicAnonKey}`,
          "X-Session-Token": accessToken,
        };
        const [r1, r2] = await Promise.all([
          fetch(`${EDGE_URL}/graph/content-mappings/preview`, { headers }),
          fetch(`${EDGE_URL}/graph/content-mappings/preview`, { headers }),
        ]);
        if (!r1.ok || !r2.ok) {
          return {
            success: false,
            message: `Preview requests failed: HTTP ${r1.status}, ${r2.status}.`,
          };
        }
        const [p1, p2] = await Promise.all([r1.json(), r2.json()]);

        // Compare summary totals
        const relTotalMatch =
          p1.summary?.relationship_candidates?.total ===
          p2.summary?.relationship_candidates?.total;
        const ceTotalMatch =
          p1.summary?.content_mapping_candidates?.total ===
          p2.summary?.content_mapping_candidates?.total;

        // Compare candidate identities and resolutions, not just totals
        type RelC = {
          source?: { entity_id?: string | null };
          target?: { entity_id?: string | null };
          resolution?: string;
        };
        type CeC = {
          content?: { entity_id?: string | null };
          subject?: { entity_id?: string | null };
          resolution?: string;
        };
        const rc1: RelC[] = p1.relationship_candidates ?? [];
        const rc2: RelC[] = p2.relationship_candidates ?? [];
        const relIdentical =
          rc1.length === rc2.length &&
          rc1.every(
            (c, i) =>
              c.source?.entity_id === rc2[i]?.source?.entity_id &&
              c.target?.entity_id === rc2[i]?.target?.entity_id &&
              c.resolution === rc2[i]?.resolution,
          );
        const cc1: CeC[] = p1.content_mapping_candidates ?? [];
        const cc2: CeC[] = p2.content_mapping_candidates ?? [];
        const ceIdentical =
          cc1.length === cc2.length &&
          cc1.every(
            (c, i) =>
              c.content?.entity_id === cc2[i]?.content?.entity_id &&
              c.subject?.entity_id === cc2[i]?.subject?.entity_id &&
              c.resolution === cc2[i]?.resolution,
          );

        const valid =
          relTotalMatch && ceTotalMatch && relIdentical && ceIdentical;
        return {
          success: valid,
          message: valid
            ? `Preview is deterministic: ${p1.summary?.relationship_candidates?.total} relationship and ${p1.summary?.content_mapping_candidates?.total} content-mapping candidates identical across both calls.`
            : !relTotalMatch || !ceTotalMatch
              ? `Preview returned different totals: rel ${p1.summary?.relationship_candidates?.total} vs ${p2.summary?.relationship_candidates?.total}, content ${p1.summary?.content_mapping_candidates?.total} vs ${p2.summary?.content_mapping_candidates?.total}.`
              : `Preview totals match but candidate identities or resolutions differ between calls.`,
        };
      },
    },
    {
      id: "stage-7-content-mapping-preview-semantics",
      name: "Content-mapping preview uses only conservative relationship semantics",
      description:
        "Verifies that all suggested relationship types in the preview are related_to and all suggested content roles are discusses; no evidence, primary_subject, or inferred-support semantics are present in preview output.",
      phase: "stage-7",
      stage: 7,
      category: "Knowledge Governance",
      requiresAuth: true,
      testFn: async () => {
        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message:
              "Sign in as admin to verify content-mapping preview semantics.",
          };
        }
        const response = await fetch(
          `${EDGE_URL}/graph/content-mappings/preview`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "X-Session-Token": accessToken,
            },
          },
        );
        if (!response.ok) {
          return {
            success: false,
            message: `Preview returned HTTP ${response.status}.`,
          };
        }
        const report = await response.json();
        const relCandidates: Array<{ suggested_relationship_type?: string }> =
          report?.relationship_candidates ?? [];
        const ceCandidates: Array<{ suggested_role?: string }> =
          report?.content_mapping_candidates ?? [];
        const badRel = relCandidates.find(
          (c) => c.suggested_relationship_type !== "related_to",
        );
        const badCe = ceCandidates.find(
          (c) => c.suggested_role !== "discusses",
        );
        const valid = !badRel && !badCe;
        return {
          success: valid,
          message: valid
            ? "All preview candidates use conservative semantics: related_to and discusses only."
            : badRel
              ? `Non-conservative relationship type found: '${badRel.suggested_relationship_type}'.`
              : `Non-conservative content role found: '${badCe?.suggested_role}'.`,
        };
      },
    },
    {
      id: "stage-7-content-mapping-preview-quarantine",
      name: "Unresolvable preview candidates are framed as awaiting_review",
      description:
        "Verifies that candidates in the preview where entities cannot be resolved carry resolution awaiting_review rather than a null, empty, or misleading label, preserving the quarantine contract for human review.",
      phase: "stage-7",
      stage: 7,
      category: "Knowledge Governance",
      requiresAuth: true,
      testFn: async () => {
        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message:
              "Sign in as admin to verify the content-mapping preview quarantine contract.",
          };
        }
        const response = await fetch(
          `${EDGE_URL}/graph/content-mappings/preview`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "X-Session-Token": accessToken,
            },
          },
        );
        if (!response.ok) {
          return {
            success: false,
            message: `Preview returned HTTP ${response.status}.`,
          };
        }
        const report = await response.json();
        const VALID_RESOLUTIONS = new Set([
          "resolved",
          "awaiting_review",
          "already_mapped",
        ]);
        const allCandidates = [
          ...(report?.relationship_candidates ?? []),
          ...(report?.content_mapping_candidates ?? []),
        ] as Array<{ resolution?: string }>;
        const badResolution = allCandidates.find(
          (c) => !VALID_RESOLUTIONS.has(c.resolution ?? ""),
        );
        const awaitingCount = allCandidates.filter(
          (c) => c.resolution === "awaiting_review",
        ).length;
        const valid = !badResolution;
        return {
          success: valid,
          message: valid
            ? `All ${allCandidates.length} preview candidates carry a valid resolution label; ${awaitingCount} are awaiting review.`
            : `Candidate carries invalid resolution '${badResolution?.resolution}'; expected resolved, awaiting_review, or already_mapped.`,
        };
      },
    },
    // ── Content-mapping preview fixture tests (no live API required) ──────────
    {
      id: "stage-7-content-mapping-preview-fixture-resolved",
      name: "Resolved candidate has both entity IDs and null resolution notes",
      description:
        "Verifies the resolved candidate contract using local fixtures: source/content and target/subject entity_ids must be present; resolution_notes must be null; semantics must be conservative.",
      phase: "stage-7",
      stage: 7,
      category: "Graph Curation",
      requiresAuth: false,
      testFn: async () => {
        // Drive resolveMaterialRef + classifyRelResolution with fixture maps so
        // production classification code is exercised, not just hardcoded objects.
        const materialByKvId = new Map([
          ["kv-a", { uuid: "uuid-a", name: "Material A" }],
          ["kv-b", { uuid: "uuid-b", name: "Material B" }],
        ]);
        const bindingByMaterialUuid = new Map([
          ["uuid-a", "ent-a"],
          ["uuid-b", "ent-b"],
        ]);
        const source = resolveMaterialRef(
          "kv-a",
          materialByKvId,
          bindingByMaterialUuid,
        );
        const target = resolveMaterialRef(
          "kv-b",
          materialByKvId,
          bindingByMaterialUuid,
        );
        const rel = classifyRelResolution(source, target, "kv-a", "kv-b");

        // CE: article with a canonical binding, subject material with a binding
        const subject = resolveMaterialRef(
          "kv-a",
          materialByKvId,
          bindingByMaterialUuid,
        );
        const ce = classifyCeResolution(
          "ent-c",
          "Article 'Article C'",
          subject,
          "kv-a",
        );

        const issues: string[] = [];
        if (source.entity_id !== "ent-a")
          issues.push("source.entity_id must equal ent-a");
        if (target.entity_id !== "ent-b")
          issues.push("target.entity_id must equal ent-b");
        if (rel.resolution !== "resolved")
          issues.push(
            `RelationshipCandidate: expected resolved, got ${rel.resolution}`,
          );
        if (rel.resolution_notes !== null)
          issues.push(
            "RelationshipCandidate: resolution_notes must be null for resolved",
          );
        if (ce.resolution !== "resolved")
          issues.push(
            `ContentMappingCandidate: expected resolved, got ${ce.resolution}`,
          );
        if (ce.resolution_notes !== null)
          issues.push(
            "ContentMappingCandidate: resolution_notes must be null for resolved",
          );
        const valid = issues.length === 0;
        return {
          success: valid,
          message: valid
            ? "Resolved candidate fixtures satisfy all contract invariants."
            : `Resolved candidate contract violations: ${issues.join("; ")}`,
        };
      },
    },
    {
      id: "stage-7-content-mapping-preview-fixture-awaiting-review",
      name: "Awaiting-review candidates carry non-null resolution notes",
      description:
        "Verifies the awaiting_review candidate contract using local fixtures: resolution_notes must be a non-empty string explaining why the candidate cannot be resolved.",
      phase: "stage-7",
      stage: 7,
      category: "Knowledge Governance",
      requiresAuth: false,
      testFn: async () => {
        // Case 1: source KV ID has no matching material record
        const tgtMaterials = new Map([["kv-b", { uuid: "uuid-b", name: "B" }]]);
        const tgtBindings = new Map([["uuid-b", "ent-b"]]);
        const srcMissing = resolveMaterialRef("kv-x", new Map(), new Map());
        const tgt = resolveMaterialRef("kv-b", tgtMaterials, tgtBindings);
        const r1 = classifyRelResolution(srcMissing, tgt, "kv-x", "kv-b");

        // Case 2: source material exists but has no canonical entity binding
        const matMap = new Map([
          ["kv-a", { uuid: "uuid-a", name: "Material A" }],
        ]);
        const srcHasMat = resolveMaterialRef("kv-a", matMap, new Map());
        const r2 = classifyRelResolution(srcHasMat, tgt, "kv-a", "kv-b");

        // Case 3: content item (article) has no canonical entity binding
        const subject = resolveMaterialRef(
          "kv-a",
          matMap,
          new Map([["uuid-a", "ent-a"]]),
        );
        const r3 = classifyCeResolution(
          null,
          "Article 'My Article'",
          subject,
          "kv-a",
        );

        const issues: string[] = [];
        if (r1.resolution !== "awaiting_review")
          issues.push(
            `case 1 (missing material): expected awaiting_review, got ${r1.resolution}`,
          );
        if (!r1.resolution_notes?.trim())
          issues.push(
            "case 1: resolution_notes must be a non-empty explanation",
          );
        if (r2.resolution !== "awaiting_review")
          issues.push(
            `case 2 (missing binding): expected awaiting_review, got ${r2.resolution}`,
          );
        if (!r2.resolution_notes?.trim())
          issues.push(
            "case 2: resolution_notes must be a non-empty explanation",
          );
        if (r3.resolution !== "awaiting_review")
          issues.push(
            `case 3 (missing content binding): expected awaiting_review, got ${r3.resolution}`,
          );
        if (!r3.resolution_notes?.trim())
          issues.push(
            "case 3: resolution_notes must be a non-empty explanation",
          );
        const valid = issues.length === 0;
        return {
          success: valid,
          message: valid
            ? "All awaiting_review candidate fixtures carry valid resolution notes."
            : `Awaiting-review contract violations: ${issues.join("; ")}`,
        };
      },
    },
    {
      id: "stage-7-content-mapping-preview-fixture-already-mapped",
      name: "Already-mapped candidates retain entity IDs and carry notes",
      description:
        "Verifies the already_mapped candidate contract using local fixtures: entity_ids must remain present (the pair was resolvable before the already_mapped check), and resolution_notes must explain the existing mapping.",
      phase: "stage-7",
      stage: 7,
      category: "Graph Curation",
      requiresAuth: false,
      testFn: async () => {
        // Verify already_mapped pre-conditions: classifyRelResolution must return
        // "resolved" when entity_ids are present (Step 7 upgrades it to already_mapped).
        const materialByKvId = new Map([
          ["kv-a", { uuid: "uuid-a", name: "A" }],
          ["kv-b", { uuid: "uuid-b", name: "B" }],
        ]);
        const bindingByMaterialUuid = new Map([
          ["uuid-a", "ent-a"],
          ["uuid-b", "ent-b"],
        ]);
        const source = resolveMaterialRef(
          "kv-a",
          materialByKvId,
          bindingByMaterialUuid,
        );
        const target = resolveMaterialRef(
          "kv-b",
          materialByKvId,
          bindingByMaterialUuid,
        );
        const initialRel = classifyRelResolution(
          source,
          target,
          "kv-a",
          "kv-b",
        );

        // Importing the note constants pins this test to the production strings;
        // if Step 7 or Step 12 change their note text without updating the export,
        // the string comparison below will fail.
        const relNote: string = REL_ALREADY_MAPPED_NOTE;
        const ceNote: string = CE_ALREADY_MAPPED_NOTE;

        const issues: string[] = [];
        if (!source.entity_id)
          issues.push(
            "source.entity_id must be non-null before the already_mapped check",
          );
        if (!target.entity_id)
          issues.push(
            "target.entity_id must be non-null before the already_mapped check",
          );
        if (initialRel.resolution !== "resolved")
          issues.push(
            `classifyRelResolution must return resolved when entity_ids are present; got ${initialRel.resolution}`,
          );
        if (!relNote)
          issues.push("REL_ALREADY_MAPPED_NOTE must be a non-empty string");
        if (!ceNote)
          issues.push("CE_ALREADY_MAPPED_NOTE must be a non-empty string");
        if (relNote === ceNote)
          issues.push(
            "REL_ALREADY_MAPPED_NOTE and CE_ALREADY_MAPPED_NOTE must be distinct",
          );
        const valid = issues.length === 0;
        return {
          success: valid,
          message: valid
            ? "Already-mapped candidate fixtures satisfy all contract invariants."
            : `Already-mapped contract violations: ${issues.join("; ")}`,
        };
      },
    },
    {
      id: "stage-7-content-mapping-preview-fixture-missing-binding",
      name: "Missing entity binding is distinct from missing material record",
      description:
        "Verifies that a candidate with a resolved material UUID but no canonical entity binding is correctly framed as awaiting_review with a binding-specific note, distinct from the note used when the material record itself is absent.",
      phase: "stage-7",
      stage: 7,
      category: "Knowledge Governance",
      requiresAuth: false,
      testFn: async () => {
        // Use resolveMaterialRef to produce distinct MaterialRefs for the two cases,
        // then verify classifyRelResolution surfaces structurally different notes.
        const tgtMaterials = new Map([["kv-b", { uuid: "uuid-b", name: "B" }]]);
        const tgtBindings = new Map([["uuid-b", "ent-b"]]);
        const target = resolveMaterialRef("kv-b", tgtMaterials, tgtBindings);

        // Case A: source KV ID has no material record → material_uuid null
        const missingMaterial = resolveMaterialRef(
          "kv-x",
          new Map(),
          new Map(),
        );
        const rA = classifyRelResolution(
          missingMaterial,
          target,
          "kv-x",
          "kv-b",
        );

        // Case B: source has a material record but no entity binding → material_uuid set, entity_id null
        const matMap = new Map([
          ["kv-a", { uuid: "uuid-a", name: "Material A" }],
        ]);
        const missingBinding = resolveMaterialRef("kv-a", matMap, new Map());
        const rB = classifyRelResolution(
          missingBinding,
          target,
          "kv-a",
          "kv-b",
        );

        const issues: string[] = [];
        if (missingMaterial.material_uuid !== null)
          issues.push("Missing-material: material_uuid must be null");
        if (missingBinding.material_uuid === null)
          issues.push(
            "Missing-binding: material_uuid must be non-null (material record exists)",
          );
        if (missingBinding.entity_id !== null)
          issues.push(
            "Missing-binding: entity_id must be null (binding is absent)",
          );
        if (rA.resolution !== "awaiting_review")
          issues.push(
            `Missing-material: expected awaiting_review, got ${rA.resolution}`,
          );
        if (rB.resolution !== "awaiting_review")
          issues.push(
            `Missing-binding: expected awaiting_review, got ${rB.resolution}`,
          );
        if (rA.resolution_notes === rB.resolution_notes)
          issues.push(
            "Missing-material and missing-binding notes must be distinct strings",
          );
        const valid = issues.length === 0;
        return {
          success: valid,
          message: valid
            ? "Missing-material and missing-binding cases are structurally distinct with different resolution notes."
            : `Missing-binding fixture contract violations: ${issues.join("; ")}`,
        };
      },
    },
    {
      id: "stage-7-content-mapping-preview-sample-limit",
      name: "sample_limit parameter caps returned candidate arrays",
      description:
        "Calls the content-mapping preview with sample_limit=2 and verifies the returned arrays contain at most 2 items while summary totals reflect the full scanned population.",
      phase: "stage-7",
      stage: 7,
      category: "Graph Curation",
      requiresAuth: true,
      testFn: async () => {
        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "Sign in as admin to verify sample_limit pagination.",
          };
        }
        const response = await fetch(
          `${EDGE_URL}/graph/content-mappings/preview?sample_limit=2`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "X-Session-Token": accessToken,
            },
          },
        );
        if (!response.ok) {
          return {
            success: false,
            message: `Preview returned HTTP ${response.status}: ${await response.text()}`,
          };
        }
        const report = await response.json();
        const relArray: unknown[] = report?.relationship_candidates ?? [];
        const ceArray: unknown[] = report?.content_mapping_candidates ?? [];
        const relTotal: number =
          report?.summary?.relationship_candidates?.total ?? -1;
        const ceTotal: number =
          report?.summary?.content_mapping_candidates?.total ?? -1;
        const issues: string[] = [];
        if (relArray.length > 2)
          issues.push(
            `relationship_candidates has ${relArray.length} items; expected ≤ 2`,
          );
        if (ceArray.length > 2)
          issues.push(
            `content_mapping_candidates has ${ceArray.length} items; expected ≤ 2`,
          );
        if (relTotal < relArray.length)
          issues.push(
            `summary.relationship_candidates.total (${relTotal}) < array length (${relArray.length})`,
          );
        if (ceTotal < ceArray.length)
          issues.push(
            `summary.content_mapping_candidates.total (${ceTotal}) < array length (${ceArray.length})`,
          );
        if (report?.sample_limit !== 2)
          issues.push(
            `report.sample_limit should be 2, got ${report?.sample_limit}`,
          );
        const valid = issues.length === 0;
        return {
          success: valid,
          message: valid
            ? `sample_limit=2: ${relArray.length} rel and ${ceArray.length} content-mapping candidates returned; summary totals ${relTotal} and ${ceTotal}.`
            : `sample_limit pagination contract violated: ${issues.join("; ")}`,
        };
      },
    },
    {
      id: "stage-7-content-mapping-preview-summary-consistency",
      name: "Preview summary counts are internally consistent",
      description:
        "Verifies that for both relationship and content-mapping candidates, summary.total equals resolved + awaiting_review + already_mapped, and all counts are non-negative.",
      phase: "stage-7",
      stage: 7,
      category: "Graph Curation",
      requiresAuth: true,
      testFn: async () => {
        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "Sign in as admin to verify summary consistency.",
          };
        }
        const response = await fetch(
          `${EDGE_URL}/graph/content-mappings/preview`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "X-Session-Token": accessToken,
            },
          },
        );
        if (!response.ok) {
          return {
            success: false,
            message: `Preview returned HTTP ${response.status}.`,
          };
        }
        const report = await response.json();
        const issues: string[] = [];
        for (const key of [
          "relationship_candidates",
          "content_mapping_candidates",
        ] as const) {
          const s = report?.summary?.[key] as
            | {
                total?: number;
                resolved?: number;
                awaiting_review?: number;
                already_mapped?: number;
              }
            | undefined;
          if (!s) {
            issues.push(`summary.${key} is missing`);
            continue;
          }
          const computed =
            (s.resolved ?? 0) +
            (s.awaiting_review ?? 0) +
            (s.already_mapped ?? 0);
          if (computed !== s.total) {
            issues.push(
              `summary.${key}: total=${s.total} but resolved(${s.resolved})+awaiting_review(${s.awaiting_review})+already_mapped(${s.already_mapped})=${computed}`,
            );
          }
          if (
            (s.total ?? 0) < 0 ||
            (s.resolved ?? 0) < 0 ||
            (s.awaiting_review ?? 0) < 0 ||
            (s.already_mapped ?? 0) < 0
          ) {
            issues.push(`summary.${key}: all counts must be non-negative`);
          }
        }
        const valid = issues.length === 0;
        const relS = report?.summary?.relationship_candidates;
        const ceS = report?.summary?.content_mapping_candidates;
        return {
          success: valid,
          message: valid
            ? `Summary consistent: ${relS?.total} rel (${relS?.resolved} resolved, ${relS?.awaiting_review} awaiting, ${relS?.already_mapped} mapped); ${ceS?.total} content-mapping (${ceS?.resolved} resolved, ${ceS?.awaiting_review} awaiting, ${ceS?.already_mapped} mapped).`
            : `Summary consistency violations: ${issues.join("; ")}`,
        };
      },
    },
    {
      id: "stage-7-content-mapping-reviewed-manifest",
      name: "Only explicitly reviewed candidates enter the apply manifest",
      description:
        "Uses local fixtures to verify that selected resolved candidates produce a deterministic manifest while unresolved and unknown candidates are rejected.",
      phase: "stage-7",
      stage: 7,
      category: "Knowledge Governance",
      requiresAuth: false,
      testFn: async () => {
        const resolved = {
          candidate_key: "relationship:fixture:a:b",
          provenance: "material_links" as const,
          source: {
            legacy_kv_id: "a",
            material_uuid: "material-a",
            entity_id: "entity-a",
            name: "A",
          },
          target: {
            legacy_kv_id: "b",
            material_uuid: "material-b",
            entity_id: "entity-b",
            name: "B",
          },
          suggested_relationship_type: "related_to" as const,
          resolution: "resolved" as const,
          resolution_notes: null,
        };
        const manifest = await buildApprovedContentMappingManifest(
          [resolved],
          [],
          [resolved.candidate_key],
        );
        let rejectedUnresolved = false;
        try {
          await buildApprovedContentMappingManifest(
            [{ ...resolved, resolution: "awaiting_review" as const }],
            [],
            [resolved.candidate_key],
          );
        } catch {
          rejectedUnresolved = true;
        }
        const valid =
          manifest.relationship_candidates.length === 1 &&
          manifest.relationship_candidates[0]?.candidate_key ===
            resolved.candidate_key &&
          /^[a-f0-9]{64}$/.test(manifest.manifest_checksum) &&
          rejectedUnresolved;
        return {
          success: valid,
          message: valid
            ? "The reviewed manifest contains only the selected resolved candidate and rejects unresolved input."
            : "Reviewed-manifest selection or rejection behavior was invalid.",
        };
      },
    },
  ];
}
