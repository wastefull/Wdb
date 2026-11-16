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
7. Solo-Admin Content Curation - Active
8. Evidence Provenance & Scoring - Planned next
9. Public Sources & Structured Citations - Planned
10. Taxonomy, Discovery & Learning Paths - Planned
11. Revision Recovery & Multi-User Readiness - Trigger-gated
12. Scale & Community Workflows - Trigger-gated

Stages 11 and 12 remain the final sequence and begin only when their activation
criteria are met.

## Current Operating Assumption

WasteDB currently has one administrator and no interns, reviewers, or other
contributors. The critical path should make that administrator faster at
fleshing out material pages with canonical sources, traceable evidence, and
useful educational content.

Scientific provenance, authorization, backups, and practical recovery remain
required. Actor-level audit history, reviewer routing, assignments,
notifications, retention dashboards, and outbox consumers are deferred until a
second contributor or a concrete compliance requirement creates a need.

## TDD Workflow

- Define planned acceptance tests before implementation.
- Attach executable tests as behavior becomes available.
- Existing Phase 9.x and 10.0 tests appear under Stages 2-4 while retaining
  legacy phase metadata.
- Stage 5 avoids known accessibility regressions through semantic structure,
  visible focus, keyboard reachability, reduced-motion compatibility, and
  non-color-only state communication.
- Stage 7 completion is defined by a material-centered solo-admin workflow,
  canonical source identity, fast source linking, actionable coverage gaps,
  material-page provenance, duplicate protection, direct publication, and a
  lightweight recovery baseline.
- Existing video intake, triage, relationship, and mapping work is retained as
  implementation history, but no longer defines the active completion gate.
- Stage 8 starts after the Stage 7 source workflow is coherent. It centers on
  source-centric observation capture, methodology versioning, complete
  scientific provenance, and direct admin publication.
- The existing evidence scoring panel and backend validation states remain
  compatible; the admin-facing workflow presents them as draft, published,
  excluded, or duplicate.
- Generalized taxonomy governance and broad discovery read cutover move to
  Stage 10.
- Multi-user approval and actor-level audit infrastructure move to triggered
  Stage 11.
- Treat `src/config/roadmap.ts` as authoritative if narrative documents drift.

## Migration Standard

All future migrations must be additive, data-preserving, idempotent where
practical, and backed by verified recovery procedures. See
[Knowledge Graph Migration](./KNOWLEDGE_GRAPH_MIGRATION.md).

Active Stage 7 implementation contract:
[Solo-Admin Graph Content and Curation](./KNOWLEDGE_GRAPH_CURATION.md).

Stage 8 planning guide:
[Evidence Provenance and Scoring Plan](./guides/KNOWLEDGE_GRAPH_EVIDENCE_BASED_SCORING_PLAN.md).
