// Relationship and content-mapping review workflow for Stage 7.
//
// Analysis and preview are deliberately read-only. Mutating operations accept
// checksum-bound reviewed manifests and delegate to service-role-only
// PostgreSQL functions so graph, outbox, migration, and audit writes are atomic.
// Ambiguous or unresolvable records are framed as "awaiting_review", never
// discarded or silently treated as "no relationship exists."
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
  candidate_key: string;
  provenance: "material_links" | "linked_material_ids";
  source: MaterialRef;
  target: MaterialRef;
  suggested_relationship_type: "related_to";
  resolution: PreviewResolution;
  resolution_notes: string | null;
}

export interface ContentMappingCandidate {
  candidate_key: string;
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
  /** SHA-256 over the complete candidate analysis and resolution state. */
  analysis_checksum: string;
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

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    return `{${Object.keys(rec)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson(rec[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

async function checksumJson(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
  "stage-7-content-mapping-quarantine-v2";

export interface ContentMappingQuarantineReport {
  contract_version: string;
  run_id: string;
  generated_at: string;
  analysis_checksum: string;
  relationship_issues_written: number;
  content_mapping_issues_written: number;
  total_issues_written: number;
  already_quarantined: boolean;
}

export const CONTENT_MAPPING_APPLY_VERSION = "stage-7-content-mapping-apply-v2";

export const CONTENT_MAPPING_APPLY_CONFIRMATION =
  "apply content-mapping relationships";

export interface ContentMappingApplyReport {
  contract_version: string;
  run_id: string;
  generated_at: string;
  analysis_checksum: string;
  manifest_checksum: string;
  approved_candidate_count: number;
  relationships_inserted: number;
  relationships_skipped: number;
  content_mappings_inserted: number;
  content_mappings_skipped: number;
  outbox_events_written: number;
  outbox_events_skipped: number;
  already_applied: boolean;
}

export interface ApprovedContentMappingManifest {
  relationship_candidates: Array<{
    candidate_key: string;
    source_entity_id: string;
    target_entity_id: string;
    provenance: RelationshipCandidate["provenance"];
  }>;
  content_mapping_candidates: Array<{
    candidate_key: string;
    content_entity_id: string;
    subject_entity_id: string;
    provenance: ContentMappingCandidate["provenance"];
  }>;
  manifest_checksum: string;
}

export async function buildApprovedContentMappingManifest(
  relationshipCandidates: RelationshipCandidate[],
  contentMappingCandidates: ContentMappingCandidate[],
  approvedCandidateKeys: string[],
  options: { allowAlreadyMapped?: boolean } = {},
): Promise<ApprovedContentMappingManifest> {
  const approvedKeys = [...new Set(approvedCandidateKeys)];
  if (
    approvedKeys.length === 0 ||
    approvedKeys.length !== approvedCandidateKeys.length
  ) {
    throw new Error(
      "At least one unique, explicitly approved candidate key is required.",
    );
  }

  const byKey = new Map<string, RelationshipCandidate | ContentMappingCandidate>(
    [...relationshipCandidates, ...contentMappingCandidates].map((candidate) => [
      candidate.candidate_key,
      candidate,
    ]),
  );
  const approved = approvedKeys.map((key) => {
    const candidate = byKey.get(key);
    if (!candidate) throw new Error(`Unknown candidate key: ${key}`);
    if (
      candidate.resolution !== "resolved" &&
      !(options.allowAlreadyMapped && candidate.resolution === "already_mapped")
    ) {
      throw new Error(`Candidate is not currently resolved: ${key}`);
    }
    return candidate;
  });

  const relationshipManifest = approved
    .filter((c): c is RelationshipCandidate => "source" in c)
    .map((c) => ({
      candidate_key: c.candidate_key,
      source_entity_id: c.source.entity_id!,
      target_entity_id: c.target.entity_id!,
      provenance: c.provenance,
    }))
    .sort((a, b) => a.candidate_key.localeCompare(b.candidate_key));
  const contentManifest = approved
    .filter((c): c is ContentMappingCandidate => "content" in c)
    .map((c) => ({
      candidate_key: c.candidate_key,
      content_entity_id: c.content.entity_id!,
      subject_entity_id: c.subject.entity_id!,
      provenance: c.provenance,
    }))
    .sort((a, b) => a.candidate_key.localeCompare(b.candidate_key));
  if (
    relationshipManifest.some(
      (candidate) =>
        !candidate.source_entity_id ||
        !candidate.target_entity_id ||
        candidate.source_entity_id === candidate.target_entity_id,
    )
  ) {
    throw new Error("Approved relationships require two distinct entity IDs.");
  }
  if (
    contentManifest.some(
      (candidate) =>
        !candidate.content_entity_id ||
        !candidate.subject_entity_id ||
        candidate.content_entity_id === candidate.subject_entity_id,
    )
  ) {
    throw new Error(
      "Approved content mappings require two distinct entity IDs.",
    );
  }
  const manifestChecksum = await checksumJson({
    relationship_candidates: relationshipManifest,
    content_mapping_candidates: contentManifest,
  });

  return {
    relationship_candidates: relationshipManifest,
    content_mapping_candidates: contentManifest,
    manifest_checksum: manifestChecksum,
  };
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
  /** SHA-256 over every sorted candidate and resolution state. */
  analysisChecksum: string;
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
        candidate_key: `relationship:${link.id}:${hubKv}:${spokeKv}`,
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
        candidate_key: `relationship:linked_material_ids:${hubKv}:${linkedKvId}`,
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
      candidate_key: `content:article:${domainId}:${matKv ?? ""}`,
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
      candidate_key: `content:guide:${domainId}:${matKv ?? ""}`,
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

  // Keep review pages deterministic and bring actionable candidates forward.
  const resolutionRank: Record<PreviewResolution, number> = {
    resolved: 0,
    awaiting_review: 1,
    already_mapped: 2,
  };
  relCandidates.sort(
    (a, b) =>
      resolutionRank[a.resolution] - resolutionRank[b.resolution] ||
      a.candidate_key.localeCompare(b.candidate_key),
  );
  ceMappings.sort(
    (a, b) =>
      resolutionRank[a.resolution] - resolutionRank[b.resolution] ||
      a.candidate_key.localeCompare(b.candidate_key),
  );

  // The checksum covers the complete analysis, not only resolved pairs. A
  // changed source, binding, resolution, or quarantine payload invalidates the
  // reviewed preview before any mutation can run.
  const analysisChecksum = await checksumJson({
    relationship_candidates: relCandidates,
    content_mapping_candidates: ceMappings,
  });

  return {
    relCandidates,
    ceMappings,
    relBefore,
    ceBefore,
    relAfter,
    ceAfter,
    analysisChecksum,
  };
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
    analysis_checksum: analysis.analysisChecksum,
  };
}

// ---------------------------------------------------------------------------
// Quarantine writer — writes awaiting_review candidates to
// graph_migration_issues for human review. Creates one graph_migration_runs
// row per invocation; old runs remain as audit history.
// ---------------------------------------------------------------------------

export async function buildContentMappingQuarantine(
  client: any,
  options: { startedBy: string; expectedAnalysisChecksum: string },
): Promise<ContentMappingQuarantineReport> {
  const generatedAt = new Date().toISOString();
  const analysis = await analyzeContentMapping(client);

  if (analysis.analysisChecksum !== options.expectedAnalysisChecksum) {
    throw new Error(
      `Analysis checksum mismatch: expected ${options.expectedAnalysisChecksum}, got ${analysis.analysisChecksum}. Re-run the preview before quarantining candidates.`,
    );
  }

  const awaitingRel = analysis.relCandidates.filter(
    (c) => c.resolution === "awaiting_review",
  );
  const awaitingCe = analysis.ceMappings.filter(
    (c) => c.resolution === "awaiting_review",
  );

  // Build issue rows
  const relIssueRows = awaitingRel.map((c) => ({
    candidate_key: c.candidate_key,
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
    candidate_key: c.candidate_key,
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
  const { data, error } = await client.rpc(
    "quarantine_content_mapping_candidates",
    {
      p_started_by: options.startedBy,
      p_analysis_checksum: analysis.analysisChecksum,
      p_issues: allRows,
    },
  );
  if (error) {
    throw new Error(`Failed to quarantine candidates: ${error.message}`);
  }

  return data as ContentMappingQuarantineReport;
}

// ---------------------------------------------------------------------------
// Apply writer — creates entity_relationships and content_entities for all
// resolved candidates (status: pending_review). Writes graph_sync_outbox
// events for downstream consumers. Idempotent: UNIQUE constraints on both
// tables and on outbox event_keys make re-runs safe.
// ---------------------------------------------------------------------------

export async function buildContentMappingApply(
  client: any,
  options: {
    startedBy: string;
    expectedAnalysisChecksum: string;
    approvedCandidateKeys: string[];
  },
): Promise<ContentMappingApplyReport> {
  const analysis = await analyzeContentMapping(client);

  if (analysis.analysisChecksum !== options.expectedAnalysisChecksum) {
    // A successful first request changes candidates to already_mapped and thus
    // changes the analysis checksum. Permit only an exact retry lookup here;
    // never use already-mapped candidates to create a new migration run.
    const retryManifest = await buildApprovedContentMappingManifest(
      analysis.relCandidates,
      analysis.ceMappings,
      options.approvedCandidateKeys,
      { allowAlreadyMapped: true },
    );
    const { data: existingRuns, error: retryError } = await client
      .from("graph_migration_runs")
      .select("id,completed_at,report")
      .eq("migration_version", CONTENT_MAPPING_APPLY_VERSION)
      .eq("status", "completed")
      .contains("report", {
        analysis_checksum: options.expectedAnalysisChecksum,
        manifest_checksum: retryManifest.manifest_checksum,
      })
      .limit(1);
    if (retryError) {
      throw new Error(`Failed to verify apply retry: ${retryError.message}`);
    }
    const existing = existingRuns?.[0];
    if (existing) {
      const report = existing.report as Record<string, unknown>;
      return {
        contract_version: CONTENT_MAPPING_APPLY_VERSION,
        run_id: existing.id as string,
        generated_at: existing.completed_at as string,
        analysis_checksum: options.expectedAnalysisChecksum,
        manifest_checksum: retryManifest.manifest_checksum,
        approved_candidate_count: Number(
          report.approved_candidate_count ?? 0,
        ),
        relationships_inserted: Number(report.relationships_inserted ?? 0),
        relationships_skipped: Number(report.relationships_skipped ?? 0),
        content_mappings_inserted: Number(
          report.content_mappings_inserted ?? 0,
        ),
        content_mappings_skipped: Number(
          report.content_mappings_skipped ?? 0,
        ),
        outbox_events_written: Number(report.outbox_events_written ?? 0),
        outbox_events_skipped: Number(report.outbox_events_skipped ?? 0),
        already_applied: true,
      };
    }
    throw new Error(
      `Analysis checksum mismatch: expected ${
        options.expectedAnalysisChecksum
      }, got ${analysis.analysisChecksum}. Re-run the preview and use the current analysis_checksum.`,
    );
  }

  const manifest = await buildApprovedContentMappingManifest(
    analysis.relCandidates,
    analysis.ceMappings,
    options.approvedCandidateKeys,
  );

  const { data, error } = await client.rpc("apply_content_mapping_candidates", {
    p_started_by: options.startedBy,
    p_analysis_checksum: analysis.analysisChecksum,
    p_manifest_checksum: manifest.manifest_checksum,
    p_relationships: manifest.relationship_candidates,
    p_content_mappings: manifest.content_mapping_candidates,
  });
  if (error) {
    throw new Error(`Failed to apply approved candidates: ${error.message}`);
  }

  return data as ContentMappingApplyReport;
}
