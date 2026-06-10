# Roadmap Conventions

The admin roadmap, backed by `src/config/roadmap.ts`, is the operational source
of truth for stage status, deliverables, planned acceptance tests, executable
test mapping, and backlog items.

## Ten-Stage Convention

1. Foundation - Complete
2. Evidence Infrastructure - Complete
3. Curation Lab - Complete at revised scope
4. Data Migration - Complete
5. Material Experience Redesign - Active
6. Knowledge Graph Foundation - Planned
7. Graph Content & Curation - Planned
8. Discovery & Learning Paths - Planned
9. Privacy, Audit & Revision History - Planned
10. Scale - Planned

Stages 9 and 10 must remain the final sequence.

## TDD Workflow

- Define planned acceptance tests before implementation.
- Attach executable tests as behavior becomes available.
- Existing Phase 9.x and 10.0 tests appear under Stages 2-4 while retaining
  legacy phase metadata.
- Do not duplicate current stage status in Markdown.

## Migration Standard

All future migrations must be additive, data-preserving, idempotent where
practical, and backed by verified recovery procedures. See
[Knowledge Graph Migration](./KNOWLEDGE_GRAPH_MIGRATION.md).
