# WasteDB Documentation

This directory contains current engineering and admin documentation. The admin
roadmap, backed by `src/config/roadmap.ts`, is the operational source of truth
for stage status, deliverables, acceptance tests, and backlog items.

## Current Documents

### Engineering

- [Development setup](./setup/DEVELOPMENT.md)
- [Deployment](./setup/DEPLOYMENT.md)
- [System overview](./architecture/SYSTEM_OVERVIEW.md)
- [Current data model](./architecture/DATA_MODEL.md)
- [ADR 001: Knowledge graph foundation](./architecture/ADR_001_KNOWLEDGE_GRAPH_FOUNDATION.md)
- [Security](./security/SECURITY.md)
- [Visualization](./visualization/VISUALIZATION.md)

### Admin Operations

- [Admin guide](./admin/ADMIN_GUIDE.md)
- [Authentication](./admin/AUTHENTICATION.md)
- [Operations, backup, restore, and audit](./admin/OPERATIONS.md)
- [Email](./admin/EMAIL.md)
- [Guide import format](./admin/GUIDE_IMPORT_FORMAT.md)
- [Evidence curation](./data/EVIDENCE_CURATION.md)
- [Source management](./source/SOURCE_MANAGEMENT.md)
- [Content-mapping operations](./roadmap/guides/KNOWLEDGE_GRAPH_CONTENT_MAPPING_REVIEW_RUNBOOK.md)

### Roadmap

- [Roadmap conventions](./roadmap/README.md)
- [Knowledge graph and discovery](./roadmap/KNOWLEDGE_GRAPH_DISCOVERY.md)
- [Knowledge graph migration and safety](./roadmap/KNOWLEDGE_GRAPH_MIGRATION.md)
- [Stage 7 graph content and curation](./roadmap/KNOWLEDGE_GRAPH_CURATION.md)
- [Stage 6 knowledge graph foundation runbook](./roadmap/guides/KNOWLEDGE_GRAPH_FOUNDATION_RUNBOOK.md)

## Documentation Rules

- Do not create dated status reports or duplicate roadmap files.
- Put stage status, deliverables, tests, and backlog items in
  `src/config/roadmap.ts`.
- Update current operational documents when behavior changes.
- Preserve historical context in git history instead of an in-repository
  documentation archive.
- Never remove a recovery procedure until its replacement is tested and
  documented.
- Run `npm run docs:check` before merging documentation changes.
