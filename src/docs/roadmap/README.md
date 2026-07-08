# Roadmap Conventions

The admin roadmap, backed by `src/config/roadmap.ts`, is the operational source
of truth for stage status, deliverables, planned acceptance tests, executable
test mapping, and backlog items.

## Twelve-Stage Convention

1. Foundation - Complete
2. Evidence Infrastructure - Complete
3. Curation Lab - Complete at revised scope
4. Data Migration - Complete
5. Material Experience Redesign - Complete
6. Knowledge Graph Foundation - Complete
7. Material Relationships & Educational Content - Active
8. Evidence-Based Sustainability Scoring - Planned
9. Public Source Library & Citations - Planned
10. Taxonomy, Discovery & Learning Paths - Planned
11. Privacy, Audit & Revision History - Planned
12. Scale - Planned

Stages 11 and 12 must remain the final sequence.

## TDD Workflow

- Define planned acceptance tests before implementation.
- Attach executable tests as behavior becomes available.
- Existing Phase 9.x and 10.0 tests appear under Stages 2-4 while retaining
  legacy phase metadata.
- Stage 5 avoids known accessibility regressions through semantic structure,
  visible focus, keyboard reachability, reduced-motion compatibility, and
  non-color-only state communication.
- Stage 7 completion is defined by reviewed educational-content and
  material-relationship outcomes, including focused authorization, duplicate
  protection, public reads, and focused audit behavior.
- Generalized taxonomy governance and broad discovery read cutover move to
  Stage 10.
- Do not duplicate current stage status in Markdown.

## Migration Standard

All future migrations must be additive, data-preserving, idempotent where
practical, and backed by verified recovery procedures. See
[Knowledge Graph Migration](./KNOWLEDGE_GRAPH_MIGRATION.md).

Active Stage 7 implementation contract:
[Material Relationships and Educational Content](./KNOWLEDGE_GRAPH_CURATION.md).
