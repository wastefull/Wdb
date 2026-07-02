import assert from "node:assert/strict";
import test from "node:test";
import {
  buildApprovedContentMappingManifest,
  type ContentMappingCandidate,
  type RelationshipCandidate,
} from "./content-mapping-preview.ts";

const relationship: RelationshipCandidate = {
  candidate_key: "relationship:fixture:a:b",
  provenance: "material_links",
  source: {
    legacy_kv_id: "a",
    material_uuid: "00000000-0000-0000-0000-000000000001",
    entity_id: "00000000-0000-0000-0000-000000000011",
    name: "A",
  },
  target: {
    legacy_kv_id: "b",
    material_uuid: "00000000-0000-0000-0000-000000000002",
    entity_id: "00000000-0000-0000-0000-000000000012",
    name: "B",
  },
  suggested_relationship_type: "related_to",
  resolution: "resolved",
  resolution_notes: null,
};

const contentMapping: ContentMappingCandidate = {
  candidate_key: "content:article:fixture:a",
  provenance: "articles.legacy_material_kv_id",
  content: {
    type: "article",
    domain_id: "00000000-0000-0000-0000-000000000003",
    entity_id: "00000000-0000-0000-0000-000000000013",
    name: "Fixture article",
  },
  subject: relationship.source,
  suggested_role: "discusses",
  resolution: "resolved",
  resolution_notes: null,
};

test("builds a deterministic manifest containing only explicitly approved candidates", async () => {
  const first = await buildApprovedContentMappingManifest(
    [relationship],
    [contentMapping],
    [contentMapping.candidate_key, relationship.candidate_key],
  );
  const second = await buildApprovedContentMappingManifest(
    [relationship],
    [contentMapping],
    [relationship.candidate_key, contentMapping.candidate_key],
  );

  assert.deepEqual(first.relationship_candidates, [
    {
      candidate_key: relationship.candidate_key,
      source_entity_id: relationship.source.entity_id,
      target_entity_id: relationship.target.entity_id,
      provenance: relationship.provenance,
    },
  ]);
  assert.equal(first.content_mapping_candidates.length, 1);
  assert.equal(first.manifest_checksum, second.manifest_checksum);
});

test("rejects unknown, duplicate, and unreviewed candidate keys", async () => {
  await assert.rejects(
    buildApprovedContentMappingManifest([relationship], [], ["unknown"]),
    /Unknown candidate key/,
  );
  await assert.rejects(
    buildApprovedContentMappingManifest(
      [relationship],
      [],
      [relationship.candidate_key, relationship.candidate_key],
    ),
    /unique, explicitly approved/,
  );
  await assert.rejects(
    buildApprovedContentMappingManifest(
      [{ ...relationship, resolution: "awaiting_review" }],
      [],
      [relationship.candidate_key],
    ),
    /not currently resolved/,
  );
  await assert.rejects(
    buildApprovedContentMappingManifest(
      [{ ...relationship, resolution: "already_mapped" }],
      [],
      [relationship.candidate_key],
    ),
    /not currently resolved/,
  );
});

test("allows already-mapped candidates only for an exact retry lookup", async () => {
  const manifest = await buildApprovedContentMappingManifest(
    [{ ...relationship, resolution: "already_mapped" }],
    [],
    [relationship.candidate_key],
    { allowAlreadyMapped: true },
  );
  assert.equal(manifest.relationship_candidates.length, 1);
  assert.match(manifest.manifest_checksum, /^[a-f0-9]{64}$/);
});

test("rejects self relationships before invoking the database transaction", async () => {
  await assert.rejects(
    buildApprovedContentMappingManifest(
      [
        {
          ...relationship,
          target: {
            ...relationship.target,
            entity_id: relationship.source.entity_id,
          },
        },
      ],
      [],
      [relationship.candidate_key],
    ),
    /two distinct entity IDs/,
  );
});
