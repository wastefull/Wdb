# Source Management

The Source Library stores reusable citation records and links them to materials
and evidence.

## Current Model

- `sources` is the authoritative citation table.
- `material_sources` links sources to materials and stores weights or parameter
  associations.
- `evidence_points.source_ref` remains a compatibility field.
- Stage 6 plans an additive `evidence_points.source_id` link and graph entity
  representation.

## Admin Workflow

- Search before creating a source.
- Prefer stable DOI metadata when available.
- Upload PDFs only when licensing permits.
- Review dependencies before deletion.
- Preserve source identifiers and original metadata during migrations.

## Migration Safety

Source-reference matching can be ambiguous. Match conservatively by DOI, URL,
title, or stored filename, and route ambiguous results to manual review.
Never discard an evidence point because its source cannot be resolved
automatically.
