# Graph Content and Curation Plan

Stage 7 turns the reconciled canonical entity layer into governed knowledge.
It does not enable graph-powered discovery reads; that remains a Stage 8 gate.

## Entry State

- 228 canonical entities and 228 bindings reconcile in production.
- Relationship, tag, content-mapping, video, and outbox tables are empty.
- Domain tables remain authoritative.
- Anonymous graph mutations are denied.
- `discusses` remains a discovery relationship and does not imply evidence.

## Implementation Order

1. Build non-mutating relationship and content-mapping previews for
   `material_links`, `materials.linked_material_ids`, article material links,
   and guide material links.
2. Preserve ambiguous records as immutable migration issues; prefer
   `related_to` and `discusses` over stronger inferred semantics.
3. Add reviewed relationship, tag, entity, and video curation APIs and admin
   interfaces.
4. Add scoped Key Insight review fields and supporting-evidence linkage.
5. Add transactional compatibility writes and idempotent outbox processing.
6. Preserve summary audit compatibility for every graph mutation.
7. Complete keyboard, screen-reader, high-contrast, dark-mode, responsive, and
   reduced-motion browser acceptance before closing Stage 7.

## Initial Automated Contracts

- Canonical entities and bindings remain available as the curation baseline.
- The governed `discusses` description stays explicitly evidence-neutral.
- Material graph sections remain in their honest pre-cutover state.

## Stop Conditions

Do not enable graph reads or apply relationship/content population when:

- canonical entity reconciliation no longer passes
- a source reference is ambiguous or unresolved
- a relationship would imply unsupported evidence or causality
- review, audit, authorization, or rollback behavior is incomplete
- full Stage 5-7 browser accessibility acceptance has not passed
