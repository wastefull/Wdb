// Non-mutating relationship and content-mapping preview for Stage 7.
//
// This module is deliberately read-only. It identifies candidate relationships
// and content mappings from existing authoritative data without creating any
// entity_relationships, content_entities, or other graph records. Ambiguous or
// unresolvable records are framed as "awaiting_review", never discarded or
// silently treated as "no relationship exists."
//
// Conservative semantics only: related_to for material→material pairs,
// discusses for content→material pairs. Stronger semantics require human review.

export const CONTENT_MAPPING_PREVIEW_VERSION =
  "stage-7-content-mapping-preview-v1";

const PAGE_SIZE = 500;
const DEFAULT_SAMPLE_LIMIT = 50;
const MAX_SAMPLE_LIMIT = 200;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PreviewResolution =
  | "resolved"
  | "awaiting_review"
  | "already_mapped";

export interface MaterialRef {
  legacy_kv_id: string;
  material_uuid: string | null;
  entity_id: string | null;
  name: string | null;
}

export interface ContentRef {
  type: "article" | "guide";
  domain_id: string;
  entity_id: string | null;
  name: string | null;
}

export interface RelationshipCandidate {
  provenance: "material_links" | "linked_material_ids";
  source: MaterialRef;
  target: MaterialRef;
  suggested_relationship_type: "related_to";
  resolution: PreviewResolution;
  resolution_notes: string | null;
}

export interface ContentMappingCandidate {
  provenance: "articles.legacy_material_kv_id" | "guides.material_id";
  content: ContentRef;
  subject: MaterialRef;
  suggested_role: "discusses";
  resolution: PreviewResolution;
  resolution_notes: string | null;
}

export interface PreviewSummary {
  total: number;
  resolved: number;
  awaiting_review: number;
  already_mapped: number;
}

export interface ContentMappingPreviewReport {
  contract_version: string;
  generated_at: string;
  is_read_only: true;
  mutation_proof: {
    entity_relationships_before: number;
    content_entities_before: number;
    entity_relationships_after: number;
    content_entities_after: number;
  };
  summary: {
    relationship_candidates: PreviewSummary;
    content_mapping_candidates: PreviewSummary;
  };
  relationship_candidates: RelationshipCandidate[];
  content_mapping_candidates: ContentMappingCandidate[];
  sample_limit: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type JsonRecord = Record<string, unknown>;

async function countRows(client: any, table: string): Promise<number> {
  const { count, error } = await client
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`Count failed for '${table}': ${error.message}`);
  return count ?? 0;
}

/** Fetches all rows from a table, paginating until the last page is partial. */
async function fetchAllRows(
  client: any,
  table: string,
  select: string,
  filter?: (q: any) => any,
  orderColumn = "id",
): Promise<JsonRecord[]> {
  const rows: JsonRecord[] = [];
  let offset = 0;
  while (true) {
    let q = client
      .from(table)
      .select(select)
      .order(orderColumn, { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw new Error(`Failed to read '${table}': ${error.message}`);
    const page = (data ?? []) as JsonRecord[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return rows;
}

/**
 * Fetches rows from `table` where `column` is any of `ids`,
 * batching into PAGE_SIZE chunks to stay within URL-length limits.
 */
async function fetchRowsForIds(
  client: any,
  table: string,
  column: string,
  ids: string[],
  select: string,
  orderColumn = "id",
  additionalFilter?: (q: any) => any,
): Promise<JsonRecord[]> {
  const rows: JsonRecord[] = [];
  for (let i = 0; i < ids.length; i += PAGE_SIZE) {
    const chunk = ids.slice(i, i + PAGE_SIZE);
    let offset = 0;
    while (true) {
      let q = client
        .from(table)
        .select(select)
        .in(column, chunk)
        .order(orderColumn, { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);
      if (additionalFilter) q = additionalFilter(q);
      const { data, error } = await q;
      if (error) {
        throw new Error(
          `Failed to read '${table}' (${column} IN [...]): ${error.message}`,
        );
      }
      const page = (data ?? []) as JsonRecord[];
      rows.push(...page);
      if (page.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  }
  return rows;
}

function summarize(
  candidates: Array<{ resolution: PreviewResolution }>,
): PreviewSummary {
  return {
    total: candidates.length,
    resolved: candidates.filter((c) => c.resolution === "resolved").length,
    awaiting_review: candidates.filter(
      (c) => c.resolution === "awaiting_review",
    ).length,
    already_mapped: candidates.filter((c) => c.resolution === "already_mapped")
      .length,
  };
}

// ---------------------------------------------------------------------------
// Exported pure helpers — resolution classification without DB I/O
// ---------------------------------------------------------------------------

/** Note text written when a related_to relationship already exists for a pair. */
export const REL_ALREADY_MAPPED_NOTE =
  "A related_to relationship already exists between these entities";

/** Note text written when a discusses content_entity mapping already exists. */
export const CE_ALREADY_MAPPED_NOTE =
  "A discusses content_entity mapping already exists";

/**
 * Resolve a legacy KV ID to a MaterialRef using pre-loaded lookup maps.
 * Pure function — no DB calls.
 */
export function resolveMaterialRef(
  kvId: string | null,
  materialByKvId: Map<string, { uuid: string; name: string | null }>,
  bindingByMaterialUuid: Map<string, string>,
): MaterialRef {
  if (!kvId) {
    return {
      legacy_kv_id: "",
      material_uuid: null,
      entity_id: null,
      name: null,
    };
  }
  const mat = materialByKvId.get(kvId);
  if (!mat) {
    return {
      legacy_kv_id: kvId,
      material_uuid: null,
      entity_id: null,
      name: null,
    };
  }
  const entityId = bindingByMaterialUuid.get(mat.uuid) ?? null;
  return {
    legacy_kv_id: kvId,
    material_uuid: mat.uuid,
    entity_id: entityId,
    name: mat.name,
  };
}

/**
 * Classify the initial resolution for a material→material relationship candidate.
 * Returns "resolved" only when both entity_ids are present.
 * Does not handle already_mapped — that requires a live DB lookup (Step 7).
 * Pure function — no DB calls.
 */
export function classifyRelResolution(
  source: MaterialRef,
  target: MaterialRef,
  sourceKvId: string,
  targetKvId: string,
): {
  resolution: "resolved" | "awaiting_review";
  resolution_notes: string | null;
} {
  if (!source.material_uuid) {
    return {
      resolution: "awaiting_review",
      resolution_notes: `Source KV ID '${sourceKvId}' has no matching material record`,
    };
  }
  if (!target.material_uuid) {
    return {
      resolution: "awaiting_review",
      resolution_notes: `Target KV ID '${targetKvId}' has no matching material record`,
    };
  }
  if (!source.entity_id) {
    return {
      resolution: "awaiting_review",
      resolution_notes: `Source material '${source.name ?? sourceKvId}' has no canonical entity binding`,
    };
  }
  if (!target.entity_id) {
    return {
      resolution: "awaiting_review",
      resolution_notes: `Target material '${target.name ?? targetKvId}' has no canonical entity binding`,
    };
  }
  return { resolution: "resolved", resolution_notes: null };
}

/**
 * Classify the initial resolution for a content→material mapping candidate.
 * `contentDescription` is the human-readable label for the content item,
 * e.g. "Article 'My Title'" or "Guide 'My Guide'".
 * Returns "resolved" only when both entity_ids are present.
 * Does not handle already_mapped — that requires a live DB lookup (Step 12).
 * Pure function — no DB calls.
 */
export function classifyCeResolution(
  contentEntityId: string | null,
  contentDescription: string,
  subject: MaterialRef,
  subjectKvId: string | null,
): {
  resolution: "resolved" | "awaiting_review";
  resolution_notes: string | null;
} {
  if (!contentEntityId) {
    return {
      resolution: "awaiting_review",
      resolution_notes: `${contentDescription} has no canonical entity binding`,
    };
  }
  if (!subject.entity_id) {
    return {
      resolution: "awaiting_review",
      resolution_notes: !subject.material_uuid
        ? `Material KV ID '${subjectKvId}' has no matching material record`
        : `Material '${subject.name ?? subjectKvId}' has no canonical entity binding`,
    };
  }
  return { resolution: "resolved", resolution_notes: null };
}

// ---------------------------------------------------------------------------
// Quarantine
// ---------------------------------------------------------------------------

export const CONTENT_MAPPING_QUARANTINE_VERSION =
  "stage-7-content-mapping-quarantine-v1";

export interface ContentMappingQuarantineReport {
  contract_version: string;
  run_id: string;
  generated_at: string;
  relationship_issues_written: number;
  content_mapping_issues_written: number;
  total_issues_written: number;
}

// ---------------------------------------------------------------------------
// Internal full analysis — shared by preview and quarantine
// ---------------------------------------------------------------------------

interface ContentMappingAnalysis {
  relCandidates: RelationshipCandidate[];
  ceMappings: ContentMappingCandidate[];
  relBefore: number;
  ceBefore: number;
  relAfter: number;
  ceAfter: number;
}

async function analyzeContentMapping(
  client: any,
): Promise<ContentMappingAnalysis> {
  // ── Step 1: Capture graph-record counts BEFORE preview ──────────────────
  const [relBefore, ceBefore] = await Promise.all([
    countRows(client, "entity_relationships"),
    countRows(client, "content_entities"),
  ]);

  // ── Step 2: Load all material_links, fully paginated ────────────────────
  const materialLinks = await fetchAllRows(
    client,
    "material_links",
    "id,legacy_hub_kv_id,legacy_linked_kv_id",
  );

  // ── Step 3: Load all materials, fully paginated ──────────────────────────
  const allMaterials = await fetchAllRows(
    client,
    "materials",
    "id,legacy_kv_id,name,linked_material_ids",
  );

  // Build KV ID → {uuid, name} map from the loaded materials
  const materialByKvId = new Map<
    string,
    { uuid: string; name: string | null }
  >();
  for (const mat of allMaterials) {
    const kvId = mat.legacy_kv_id as string | null;
    const uuid = mat.id as string | null;
    if (kvId && uuid) {
      materialByKvId.set(kvId, { uuid, name: (mat.name as string) ?? null });
    }
  }

  // ── Step 4: Load entity_canonical_bindings for all known materials ───────
  const materialUuids = [
    ...new Set([...materialByKvId.values()].map((m) => m.uuid)),
  ];

  const bindingByMaterialUuid = new Map<string, string>(); // uuid → entity_id
  if (materialUuids.length > 0) {
    const matBindings = await fetchRowsForIds(
      client,
      "entity_canonical_bindings",
      "material_id",
      materialUuids,
      "material_id,entity_id",
      "entity_id",
    );
    for (const b of matBindings) {
      const matId = b.material_id as string | null;
      const entId = b.entity_id as string | null;
      if (matId && entId) bindingByMaterialUuid.set(matId, entId);
    }
  }

  // Helper: resolve a material reference from a legacy KV ID
  const resolveMaterial = (kvId: string | null): MaterialRef =>
    resolveMaterialRef(kvId, materialByKvId, bindingByMaterialUuid);

  // ── Step 5: Build relationship candidates from material_links ───────────
  const relCandidates: RelationshipCandidate[] = [];
  const seenPairs = new Set<string>(); // deduplicate across sources

  for (const link of materialLinks) {
    const hubKv = link.legacy_hub_kv_id as string | null;
    const spokeKv = link.legacy_linked_kv_id as string | null;
    if (!hubKv || !spokeKv) continue;

    const source = resolveMaterial(hubKv);
    const target = resolveMaterial(spokeKv);

    const { resolution, resolution_notes } = classifyRelResolution(
      source,
      target,
      hubKv,
      spokeKv,
    );

    const pairKey = `${source.entity_id ?? hubKv}::${target.entity_id ?? spokeKv}`;
    if (!seenPairs.has(pairKey)) {
      seenPairs.add(pairKey);
      relCandidates.push({
        provenance: "material_links",
        source,
        target,
        suggested_relationship_type: "related_to",
        resolution,
        resolution_notes,
      });
    }
  }

  // ── Step 6: Build relationship candidates from linked_material_ids ───────
  for (const mat of allMaterials) {
    const linkedIds = mat.linked_material_ids;
    if (!Array.isArray(linkedIds) || linkedIds.length === 0) continue;
    const hubKv = mat.legacy_kv_id as string | null;
    if (!hubKv) continue;
    const source = resolveMaterial(hubKv);

    for (const linkedKvId of linkedIds) {
      if (typeof linkedKvId !== "string") continue;
      const target = resolveMaterial(linkedKvId);

      const pairKey = `${source.entity_id ?? hubKv}::${target.entity_id ?? linkedKvId}`;
      if (seenPairs.has(pairKey)) continue; // already captured from material_links
      seenPairs.add(pairKey);

      const { resolution, resolution_notes } = classifyRelResolution(
        source,
        target,
        hubKv,
        linkedKvId,
      );

      relCandidates.push({
        provenance: "linked_material_ids",
        source,
        target,
        suggested_relationship_type: "related_to",
        resolution,
        resolution_notes,
      });
    }
  }

  // ── Step 7: Check existing entity_relationships for resolved pairs ───────
  const resolvedSourceIds = [
    ...new Set(
      relCandidates
        .filter((c) => c.resolution === "resolved" && c.source.entity_id)
        .map((c) => c.source.entity_id!),
    ),
  ];

  const existingRelSet = new Set<string>();
  if (resolvedSourceIds.length > 0) {
    const existingRels = await fetchRowsForIds(
      client,
      "entity_relationships",
      "source_entity_id",
      resolvedSourceIds,
      "id,source_entity_id,target_entity_id,relationship_type",
      "id",
      (q) => q.eq("relationship_type", "related_to"),
    );
    for (const er of existingRels) {
      existingRelSet.add(`${er.source_entity_id}::${er.target_entity_id}`);
    }
  }

  for (const candidate of relCandidates) {
    if (
      candidate.resolution === "resolved" &&
      candidate.source.entity_id &&
      candidate.target.entity_id
    ) {
      const key = `${candidate.source.entity_id}::${candidate.target.entity_id}`;
      if (existingRelSet.has(key)) {
        candidate.resolution = "already_mapped";
        candidate.resolution_notes = REL_ALREADY_MAPPED_NOTE;
      }
    }
  }

  // ── Step 8: Load all articles with a material association, fully paginated
  const articles = await fetchAllRows(
    client,
    "articles",
    "id,title,legacy_material_kv_id,status",
    (q) => q.not("legacy_material_kv_id", "is", null).neq("status", "archived"),
  );

  // ── Step 9: Load all guides with a material association, fully paginated ──
  const guides = await fetchAllRows(
    client,
    "guides",
    "id,title,material_id,status",
    (q) => q.not("material_id", "is", null).neq("status", "archived"),
  );

  // ── Step 10: Resolve entity bindings for articles and guides ─────────────
  const articleIds = articles.map((a) => a.id as string).filter(Boolean);
  const guideIds = guides.map((g) => g.id as string).filter(Boolean);

  const bindingByArticleId = new Map<string, string>();
  const bindingByGuideId = new Map<string, string>();

  if (articleIds.length > 0) {
    const artBindings = await fetchRowsForIds(
      client,
      "entity_canonical_bindings",
      "article_id",
      articleIds,
      "article_id,entity_id",
      "entity_id",
    );
    for (const b of artBindings) {
      const artId = b.article_id as string | null;
      const entId = b.entity_id as string | null;
      if (artId && entId) bindingByArticleId.set(artId, entId);
    }
  }

  if (guideIds.length > 0) {
    const guideBindings = await fetchRowsForIds(
      client,
      "entity_canonical_bindings",
      "guide_id",
      guideIds,
      "guide_id,entity_id",
      "entity_id",
    );
    for (const b of guideBindings) {
      const guideId = b.guide_id as string | null;
      const entId = b.entity_id as string | null;
      if (guideId && entId) bindingByGuideId.set(guideId, entId);
    }
  }

  // ── Step 11: Build content mapping candidates ─────────────────────────────
  const ceMappings: ContentMappingCandidate[] = [];
  const ceResolvedPairs: { content: string; subject: string }[] = [];

  for (const article of articles) {
    const domainId = article.id as string;
    const contentEntityId = bindingByArticleId.get(domainId) ?? null;
    const matKv = article.legacy_material_kv_id as string | null;
    const subject = resolveMaterial(matKv);

    const { resolution, resolution_notes } = classifyCeResolution(
      contentEntityId,
      `Article '${article.title ?? domainId}'`,
      subject,
      matKv,
    );
    if (resolution === "resolved") {
      ceResolvedPairs.push({
        content: contentEntityId!,
        subject: subject.entity_id!,
      });
    }

    ceMappings.push({
      provenance: "articles.legacy_material_kv_id",
      content: {
        type: "article",
        domain_id: domainId,
        entity_id: contentEntityId,
        name: (article.title as string) ?? null,
      },
      subject,
      suggested_role: "discusses",
      resolution,
      resolution_notes,
    });
  }

  for (const guide of guides) {
    const domainId = guide.id as string;
    const contentEntityId = bindingByGuideId.get(domainId) ?? null;
    const matKv = guide.material_id as string | null;
    const subject = resolveMaterial(matKv);

    const { resolution, resolution_notes } = classifyCeResolution(
      contentEntityId,
      `Guide '${guide.title ?? domainId}'`,
      subject,
      matKv,
    );
    if (resolution === "resolved") {
      ceResolvedPairs.push({
        content: contentEntityId!,
        subject: subject.entity_id!,
      });
    }

    ceMappings.push({
      provenance: "guides.material_id",
      content: {
        type: "guide",
        domain_id: domainId,
        entity_id: contentEntityId,
        name: (guide.title as string) ?? null,
      },
      subject,
      suggested_role: "discusses",
      resolution,
      resolution_notes,
    });
  }

  // ── Step 12: Check existing content_entities for already-mapped pairs ─────
  const ceContentIds = [...new Set(ceResolvedPairs.map((p) => p.content))];
  const existingCeSet = new Set<string>();
  if (ceContentIds.length > 0) {
    const existingCe = await fetchRowsForIds(
      client,
      "content_entities",
      "content_entity_id",
      ceContentIds,
      "id,content_entity_id,subject_entity_id,role",
      "id",
      (q) => q.eq("role", "discusses"),
    );
    for (const ce of existingCe) {
      existingCeSet.add(`${ce.content_entity_id}::${ce.subject_entity_id}`);
    }
  }

  for (const candidate of ceMappings) {
    if (
      candidate.resolution === "resolved" &&
      candidate.content.entity_id &&
      candidate.subject.entity_id
    ) {
      const key = `${candidate.content.entity_id}::${candidate.subject.entity_id}`;
      if (existingCeSet.has(key)) {
        candidate.resolution = "already_mapped";
        candidate.resolution_notes = CE_ALREADY_MAPPED_NOTE;
      }
    }
  }

  // ── Step 13: Verify no graph records were written ─────────────────────────
  const [relAfter, ceAfter] = await Promise.all([
    countRows(client, "entity_relationships"),
    countRows(client, "content_entities"),
  ]);

  return { relCandidates, ceMappings, relBefore, ceBefore, relAfter, ceAfter };
}

// ---------------------------------------------------------------------------
// Main preview builder — deliberately non-mutating
// ---------------------------------------------------------------------------

export async function buildContentMappingPreview(
  client: any,
  options: { sampleLimit?: number } = {},
): Promise<ContentMappingPreviewReport> {
  const sampleLimit = Math.min(
    Math.max(1, options.sampleLimit ?? DEFAULT_SAMPLE_LIMIT),
    MAX_SAMPLE_LIMIT,
  );
  const analysis = await analyzeContentMapping(client);
  return {
    contract_version: CONTENT_MAPPING_PREVIEW_VERSION,
    generated_at: new Date().toISOString(),
    is_read_only: true,
    mutation_proof: {
      entity_relationships_before: analysis.relBefore,
      content_entities_before: analysis.ceBefore,
      entity_relationships_after: analysis.relAfter,
      content_entities_after: analysis.ceAfter,
    },
    summary: {
      relationship_candidates: summarize(analysis.relCandidates),
      content_mapping_candidates: summarize(analysis.ceMappings),
    },
    relationship_candidates: analysis.relCandidates.slice(0, sampleLimit),
    content_mapping_candidates: analysis.ceMappings.slice(0, sampleLimit),
    sample_limit: sampleLimit,
  };
}

// ---------------------------------------------------------------------------
// Quarantine writer — writes awaiting_review candidates to
// graph_migration_issues for human review. Creates one graph_migration_runs
// row per invocation; old runs remain as audit history.
// ---------------------------------------------------------------------------

const QUARANTINE_BATCH_SIZE = 200;

export async function buildContentMappingQuarantine(
  client: any,
  options: { startedBy: string },
): Promise<ContentMappingQuarantineReport> {
  const generatedAt = new Date().toISOString();
  const analysis = await analyzeContentMapping(client);

  const awaitingRel = analysis.relCandidates.filter(
    (c) => c.resolution === "awaiting_review",
  );
  const awaitingCe = analysis.ceMappings.filter(
    (c) => c.resolution === "awaiting_review",
  );

  // Create the migration run record
  const { data: runData, error: runError } = await client
    .from("graph_migration_runs")
    .insert({
      migration_version: CONTENT_MAPPING_QUARANTINE_VERSION,
      mode: "apply",
      status: "running",
      started_by: options.startedBy,
      started_at: generatedAt,
    })
    .select("id")
    .single();
  if (runError) {
    throw new Error(`Failed to create quarantine run: ${runError.message}`);
  }
  const runId = runData.id as string;

  const markFailed = async (message: string) => {
    await client
      .from("graph_migration_runs")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);
  };

  // Build issue rows
  const relIssueRows = awaitingRel.map((c) => ({
    run_id: runId,
    source_table: c.provenance,
    source_identifier: `${c.source.legacy_kv_id}→${c.target.legacy_kv_id}`,
    issue_category: "awaiting_review",
    reason: c.resolution_notes ?? "Unresolvable relationship candidate",
    original_payload: {
      source: c.source,
      target: c.target,
      suggested_relationship_type: c.suggested_relationship_type,
    },
    candidate_matches: [] as string[],
    diagnostic_metadata: {
      provenance: c.provenance,
      generated_at: generatedAt,
    },
  }));

  const ceIssueRows = awaitingCe.map((c) => ({
    run_id: runId,
    source_table: c.provenance,
    source_identifier: c.content.domain_id,
    issue_category: "awaiting_review",
    reason: c.resolution_notes ?? "Unresolvable content mapping candidate",
    original_payload: {
      content: c.content,
      subject: c.subject,
      suggested_role: c.suggested_role,
    },
    candidate_matches: [] as string[],
    diagnostic_metadata: {
      provenance: c.provenance,
      generated_at: generatedAt,
    },
  }));

  const allRows = [...relIssueRows, ...ceIssueRows];

  // Batch-insert to stay within request-size limits
  for (let i = 0; i < allRows.length; i += QUARANTINE_BATCH_SIZE) {
    const { error } = await client
      .from("graph_migration_issues")
      .insert(allRows.slice(i, i + QUARANTINE_BATCH_SIZE));
    if (error) {
      await markFailed(error.message);
      throw new Error(`Failed to insert quarantine issues: ${error.message}`);
    }
  }

  // Finalize run as completed
  await client
    .from("graph_migration_runs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      report: {
        relationship_issues: relIssueRows.length,
        content_mapping_issues: ceIssueRows.length,
        total_issues: allRows.length,
      },
    })
    .eq("id", runId);

  return {
    contract_version: CONTENT_MAPPING_QUARANTINE_VERSION,
    run_id: runId,
    generated_at: generatedAt,
    relationship_issues_written: relIssueRows.length,
    content_mapping_issues_written: ceIssueRows.length,
    total_issues_written: allRows.length,
  };
}
