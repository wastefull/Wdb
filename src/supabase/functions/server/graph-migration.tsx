const ENTITY_BACKFILL_VERSION = "stage-6-entity-backfill-v1";
const PAGE_SIZE = 1000;

type JsonRecord = Record<string, unknown>;

type SourceConfig = {
  table: "materials" | "articles" | "guides" | "blog_posts" | "sources";
  entityType: "material" | "article" | "guide" | "blog_post" | "source";
  bindingColumn:
    | "material_id"
    | "article_id"
    | "guide_id"
    | "blog_post_id"
    | "source_id";
  select: string;
  requiredSlug: boolean;
  map: (row: JsonRecord) => {
    name: unknown;
    slug: unknown;
    description: unknown;
    status: unknown;
  };
};

type DesiredEntity = {
  source_table: SourceConfig["table"];
  source_id: string;
  binding_column: SourceConfig["bindingColumn"];
  entity_type: SourceConfig["entityType"];
  name: string;
  slug: string | null;
  description: string | null;
  status: "draft" | "pending_review" | "active" | "archived";
};

type ClassifiedRecord = {
  source_table: SourceConfig["table"];
  source_id: string;
  classification:
    | "insert"
    | "update"
    | "reconciled"
    | "conflict"
    | "unresolved";
  reason: string;
  desired_entity?: DesiredEntity;
  existing_entity_id?: string;
  changed_fields?: string[];
  candidate_entity_ids?: string[];
  candidate_source_identifiers?: string[];
};

const SOURCE_CONFIGS: SourceConfig[] = [
  {
    table: "materials",
    entityType: "material",
    bindingColumn: "material_id",
    select: "id,name,slug,description,status",
    requiredSlug: false,
    map: (row) => ({
      name: row.name,
      slug: row.slug,
      description: row.description,
      status: row.status,
    }),
  },
  {
    table: "articles",
    entityType: "article",
    bindingColumn: "article_id",
    select: "id,title,slug,status",
    requiredSlug: true,
    map: (row) => ({
      name: row.title,
      slug: row.slug,
      description: null,
      status: row.status,
    }),
  },
  {
    table: "guides",
    entityType: "guide",
    bindingColumn: "guide_id",
    select: "id,title,slug,description,status",
    requiredSlug: true,
    map: (row) => ({
      name: row.title,
      slug: row.slug,
      description: row.description,
      status: row.status,
    }),
  },
  {
    table: "blog_posts",
    entityType: "blog_post",
    bindingColumn: "blog_post_id",
    select: "id,title,slug,excerpt,status",
    requiredSlug: true,
    map: (row) => ({
      name: row.title,
      slug: row.slug,
      description: row.excerpt,
      status: row.status,
    }),
  },
  {
    table: "sources",
    entityType: "source",
    bindingColumn: "source_id",
    select: "id,title",
    requiredSlug: false,
    map: (row) => ({
      name: row.title,
      slug: null,
      description: null,
      status: "active",
    }),
  },
];

function cleanRequiredText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function cleanOptionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return cleanRequiredText(value);
}

function mapEntityStatus(
  value: unknown,
): DesiredEntity["status"] | null {
  if (value === "published") return "active";
  if (
    value === "draft" ||
    value === "pending_review" ||
    value === "active" ||
    value === "archived"
  ) {
    return value;
  }
  return null;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as JsonRecord;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

async function checksumJson(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchAllRows(
  client: any,
  table: string,
  select: string,
  orderColumn = "id",
): Promise<JsonRecord[]> {
  const rows: JsonRecord[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client
      .from(table)
      .select(select)
      .order(orderColumn, { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      throw new Error(`Failed to read '${table}': ${error.message}`);
    }

    const page = JSON.parse(JSON.stringify(data ?? [])) as JsonRecord[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return rows;
}

function bindingKey(table: SourceConfig["table"], sourceId: string): string {
  return `${table}:${sourceId}`;
}

function slugKey(entityType: string, slug: string): string {
  return `${entityType}:${slug.toLowerCase()}`;
}

function bindingSource(
  binding: JsonRecord,
): { table: SourceConfig["table"]; sourceId: string } | null {
  for (const config of SOURCE_CONFIGS) {
    const value = binding[config.bindingColumn];
    if (typeof value === "string") {
      return { table: config.table, sourceId: value };
    }
  }
  return null;
}

function mapDesiredEntity(
  config: SourceConfig,
  row: JsonRecord,
): { desired?: DesiredEntity; issue?: ClassifiedRecord } {
  const sourceId = typeof row.id === "string" ? row.id : "";
  const mapped = config.map(row);
  const name = cleanRequiredText(mapped.name);
  const slug = cleanOptionalText(mapped.slug);
  const description = cleanOptionalText(mapped.description);
  const status = mapEntityStatus(mapped.status);

  if (!sourceId) {
    return {
      issue: {
        source_table: config.table,
        source_id: "(missing)",
        classification: "unresolved",
        reason: "Source row has no UUID identifier.",
      },
    };
  }
  if (!name) {
    return {
      issue: {
        source_table: config.table,
        source_id: sourceId,
        classification: "unresolved",
        reason: "Source row has no usable name or title.",
      },
    };
  }
  if (config.requiredSlug && !slug) {
    return {
      issue: {
        source_table: config.table,
        source_id: sourceId,
        classification: "unresolved",
        reason: "Source row requires a non-empty canonical slug.",
      },
    };
  }
  if (!status) {
    return {
      issue: {
        source_table: config.table,
        source_id: sourceId,
        classification: "unresolved",
        reason: `Source status '${String(mapped.status)}' has no graph status mapping.`,
      },
    };
  }

  return {
    desired: {
      source_table: config.table,
      source_id: sourceId,
      binding_column: config.bindingColumn,
      entity_type: config.entityType,
      name,
      slug,
      description,
      status,
    },
  };
}

function changedEntityFields(
  existing: JsonRecord,
  desired: DesiredEntity,
): string[] {
  const changed: string[] = [];
  for (const field of ["name", "slug", "description", "status"] as const) {
    const existingValue = existing[field] ?? null;
    if (existingValue !== desired[field]) changed.push(field);
  }
  return changed;
}

function summarizeClassifications(records: ClassifiedRecord[]) {
  const summary = {
    processed: records.length,
    inserts: 0,
    updates: 0,
    reconciled: 0,
    conflicts: 0,
    unresolved: 0,
  };
  for (const record of records) {
    if (record.classification === "insert") summary.inserts++;
    if (record.classification === "update") summary.updates++;
    if (record.classification === "reconciled") summary.reconciled++;
    if (record.classification === "conflict") summary.conflicts++;
    if (record.classification === "unresolved") summary.unresolved++;
  }
  return summary;
}

function sampleRecords(records: ClassifiedRecord[], limit: number) {
  return {
    inserts: records
      .filter((record) => record.classification === "insert")
      .slice(0, limit),
    updates: records
      .filter((record) => record.classification === "update")
      .slice(0, limit),
    reconciled: records
      .filter((record) => record.classification === "reconciled")
      .slice(0, limit),
    conflicts: records
      .filter((record) => record.classification === "conflict")
      .slice(0, limit),
    unresolved: records
      .filter((record) => record.classification === "unresolved")
      .slice(0, limit),
  };
}

export async function buildEntityBackfillDryRun(
  client: any,
  options: { sampleLimit?: number } = {},
) {
  const sampleLimit = Math.min(Math.max(options.sampleLimit ?? 25, 1), 100);
  const generatedAt = new Date().toISOString();

  const sourceRowsByTable: Record<string, JsonRecord[]> = {};
  for (const config of SOURCE_CONFIGS) {
    sourceRowsByTable[config.table] = await fetchAllRows(
      client,
      config.table,
      config.select,
    );
  }

  const entitiesBefore = await fetchAllRows(
    client,
    "entities",
    "id,entity_type,name,slug,description,status",
  );
  const bindingsBefore = await fetchAllRows(
    client,
    "entity_canonical_bindings",
    "entity_id,material_id,article_id,guide_id,blog_post_id,source_id,video_id",
    "entity_id",
  );

  const entityById = new Map(
    entitiesBefore.map((entity) => [String(entity.id), entity]),
  );
  const entitiesBySlug = new Map<string, JsonRecord[]>();
  for (const entity of entitiesBefore) {
    if (typeof entity.entity_type !== "string" || typeof entity.slug !== "string")
      continue;
    const key = slugKey(entity.entity_type, entity.slug);
    entitiesBySlug.set(key, [...(entitiesBySlug.get(key) ?? []), entity]);
  }

  const bindingBySource = new Map<string, JsonRecord>();
  const boundEntityIds = new Set<string>();
  for (const binding of bindingsBefore) {
    if (typeof binding.entity_id === "string") {
      boundEntityIds.add(binding.entity_id);
    }
    const source = bindingSource(binding);
    if (source) {
      bindingBySource.set(
        bindingKey(source.table, source.sourceId),
        binding,
      );
    }
  }

  const desiredRecords: DesiredEntity[] = [];
  const records: ClassifiedRecord[] = [];
  for (const config of SOURCE_CONFIGS) {
    for (const row of sourceRowsByTable[config.table]) {
      const mapped = mapDesiredEntity(config, row);
      if (mapped.issue) records.push(mapped.issue);
      if (mapped.desired) desiredRecords.push(mapped.desired);
    }
  }

  const desiredBySlug = new Map<string, DesiredEntity[]>();
  for (const desired of desiredRecords) {
    if (!desired.slug) continue;
    const key = slugKey(desired.entity_type, desired.slug);
    desiredBySlug.set(key, [...(desiredBySlug.get(key) ?? []), desired]);
  }
  const duplicateDesiredKeys = new Set(
    [...desiredBySlug.entries()]
      .filter(([, desired]) => desired.length > 1)
      .map(([key]) => key),
  );

  for (const desired of desiredRecords) {
    if (
      desired.slug &&
      duplicateDesiredKeys.has(slugKey(desired.entity_type, desired.slug))
    ) {
      const candidates =
        desiredBySlug.get(slugKey(desired.entity_type, desired.slug)) ?? [];
      records.push({
        source_table: desired.source_table,
        source_id: desired.source_id,
        classification: "conflict",
        reason:
          "Multiple canonical source rows map to the same case-insensitive entity type and slug.",
        desired_entity: desired,
        candidate_source_identifiers: candidates.map(
          (candidate) => `${candidate.source_table}:${candidate.source_id}`,
        ),
      });
      continue;
    }

    const binding = bindingBySource.get(
      bindingKey(desired.source_table, desired.source_id),
    );
    if (binding) {
      const entityId = String(binding.entity_id);
      const entity = entityById.get(entityId);
      if (!entity) {
        records.push({
          source_table: desired.source_table,
          source_id: desired.source_id,
          classification: "conflict",
          reason: "Canonical binding references a missing entity.",
          desired_entity: desired,
          existing_entity_id: entityId,
        });
        continue;
      }
      if (entity.entity_type !== desired.entity_type) {
        records.push({
          source_table: desired.source_table,
          source_id: desired.source_id,
          classification: "conflict",
          reason: `Bound entity type '${String(entity.entity_type)}' does not match '${desired.entity_type}'.`,
          desired_entity: desired,
          existing_entity_id: entityId,
        });
        continue;
      }

      if (desired.slug) {
        const collisions =
          entitiesBySlug.get(slugKey(desired.entity_type, desired.slug)) ?? [];
        const otherEntities = collisions.filter(
          (candidate) => candidate.id !== entityId,
        );
        if (otherEntities.length > 0) {
          records.push({
            source_table: desired.source_table,
            source_id: desired.source_id,
            classification: "conflict",
            reason:
              "Desired slug is already used by another graph entity of the same type.",
            desired_entity: desired,
            existing_entity_id: entityId,
            candidate_entity_ids: otherEntities.map((candidate) =>
              String(candidate.id),
            ),
          });
          continue;
        }
      }

      const changedFields = changedEntityFields(entity, desired);
      records.push({
        source_table: desired.source_table,
        source_id: desired.source_id,
        classification: changedFields.length > 0 ? "update" : "reconciled",
        reason:
          changedFields.length > 0
            ? "Canonical binding exists, but mapped entity fields differ."
            : "Canonical binding and mapped entity fields already reconcile.",
        desired_entity: desired,
        existing_entity_id: entityId,
        ...(changedFields.length > 0 ? { changed_fields: changedFields } : {}),
      });
      continue;
    }

    if (desired.slug) {
      const collisions =
        entitiesBySlug.get(slugKey(desired.entity_type, desired.slug)) ?? [];
      if (collisions.length > 0) {
        records.push({
          source_table: desired.source_table,
          source_id: desired.source_id,
          classification: "conflict",
          reason:
            "An existing graph entity uses the desired type and slug but has no matching canonical binding.",
          desired_entity: desired,
          candidate_entity_ids: collisions.map((candidate) =>
            String(candidate.id),
          ),
        });
        continue;
      }
    }

    records.push({
      source_table: desired.source_table,
      source_id: desired.source_id,
      classification: "insert",
      reason: "No canonical binding exists and no entity slug conflict was found.",
      desired_entity: desired,
    });
  }

  const sourceIds = new Set<string>();
  for (const config of SOURCE_CONFIGS) {
    for (const row of sourceRowsByTable[config.table]) {
      if (typeof row.id === "string") {
        sourceIds.add(bindingKey(config.table, row.id));
      }
    }
  }
  const orphanBindings = bindingsBefore
    .map((binding) => ({ binding, source: bindingSource(binding) }))
    .filter(
      ({ source }) =>
        source && !sourceIds.has(bindingKey(source.table, source.sourceId)),
    )
    .map(({ binding, source }) => ({
      entity_id: binding.entity_id,
      source_table: source?.table,
      source_id: source?.sourceId,
      reason: "Canonical binding has no corresponding source row.",
    }));

  const entitiesAfter = await fetchAllRows(
    client,
    "entities",
    "id,entity_type,name,slug,description,status",
  );
  const bindingsAfter = await fetchAllRows(
    client,
    "entity_canonical_bindings",
    "entity_id,material_id,article_id,guide_id,blog_post_id,source_id,video_id",
    "entity_id",
  );
  const graphSnapshotBefore = {
    entity_count: entitiesBefore.length,
    binding_count: bindingsBefore.length,
    entities_checksum: await checksumJson(entitiesBefore),
    bindings_checksum: await checksumJson(bindingsBefore),
  };
  const graphSnapshotAfter = {
    entity_count: entitiesAfter.length,
    binding_count: bindingsAfter.length,
    entities_checksum: await checksumJson(entitiesAfter),
    bindings_checksum: await checksumJson(bindingsAfter),
  };
  const mutationDetected =
    canonicalJson(graphSnapshotBefore) !== canonicalJson(graphSnapshotAfter);
  if (mutationDetected) {
    throw new Error(
      "Graph state changed while the dry run was executing; discard this report and investigate concurrent writes.",
    );
  }

  const phases: Record<string, unknown> = {};
  for (const config of SOURCE_CONFIGS) {
    const phaseRecords = records.filter(
      (record) => record.source_table === config.table,
    );
    const desired = desiredRecords.filter(
      (record) => record.source_table === config.table,
    );
    phases[config.table] = {
      entity_type: config.entityType,
      binding_column: config.bindingColumn,
      source_count: sourceRowsByTable[config.table].length,
      source_checksum: await checksumJson(sourceRowsByTable[config.table]),
      mapped_checksum: await checksumJson(desired),
      summary: summarizeClassifications(phaseRecords),
      samples: sampleRecords(phaseRecords, sampleLimit),
    };
  }

  const summary = summarizeClassifications(records);
  const reportCore = {
    migration_version: ENTITY_BACKFILL_VERSION,
    mode: "dry_run",
    mutation_performed: false,
    mutation_detected: false,
    status_mapping: {
      published: "active",
      draft: "draft",
      pending_review: "pending_review",
      archived: "archived",
      sources: "active",
    },
    summary,
    prospective_writes: {
      entity_inserts: summary.inserts,
      canonical_binding_inserts: summary.inserts,
      entity_updates: summary.updates,
      total: summary.inserts * 2 + summary.updates,
    },
    blocking_issue_count:
      summary.conflicts + summary.unresolved + orphanBindings.length,
    orphan_bindings: orphanBindings,
    graph_snapshot_before: graphSnapshotBefore,
    graph_snapshot_after: graphSnapshotAfter,
    graph_inventory: {
      unbound_entity_count: entitiesBefore.filter(
        (entity) => !boundEntityIds.has(String(entity.id)),
      ).length,
    },
    phases,
  };

  return {
    ...reportCore,
    generated_at: generatedAt,
    sample_limit: sampleLimit,
    report_checksum: await checksumJson(reportCore),
  };
}
