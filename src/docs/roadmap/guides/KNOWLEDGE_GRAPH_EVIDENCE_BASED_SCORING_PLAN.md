# Evidence Provenance and Scoring Plan

Stage 8 starts after the solo-admin source workflow is coherent. It establishes
the scoring methodology, a complete provenance model, and a fast source-centric
extraction flow. Discovery-first graph reads remain outside this stage.

An initial panel and backend contract already exist. Backend values such as
`pending`, `validated`, and `flagged` remain compatible, while the admin-facing
workflow describes them as draft, published, and excluded.

## Summary

- Keep the workflow admin-first and UI-backed.
- Treat discovery relationships as separate from evidentiary support.
- Require explicit admin publication for source observations before they
  influence any published score.
- Preserve complete scientific provenance and methodology lineage.
- Protect work with drafts, verified backups, and revision recovery without
  making actor-level audit infrastructure a Stage 8 prerequisite.

## Key Changes

- Methodology and provenance
  - Define the authoritative scoring methodology, versioning rules, and the
    minimum provenance captured for each observation.
  - Keep the observation record focused on source, location, quote/snippet,
    material, parameter, unit, confidence, and methodology version.
- Source-centric extraction
  - Keep the source, PDF or external record, and selected material visible while
    the admin captures multiple observations.
  - Support save-and-add-another, keyboard-efficient entry, and reusable source
    context so repeated observations do not require repeated setup.
- Publication boundary
  - Publish scores only from explicitly published observations.
  - Keep draft and excluded observations out of public score outputs.
  - Present provenance clearly on material pages so the score is traceable.
- Compatibility and recovery
  - Keep existing backend validation values and public summary fields stable
    while changing admin-facing language.
  - Preserve existing contributor, evidence, and material workflows while the
    scoring layer is introduced.
  - Retain verified backups and a simple way to revise or exclude an observation.

## Test Plan

- Methodology versioning stays deterministic and reproducible.
- Draft or excluded observations cannot affect public scores.
- Published observations calculate the expected score output.
- Each published observation retains complete source and location provenance.
- The direct admin publication view keeps the material, parameter, snippet,
  confidence, and methodology visible.

## Assumptions

- Stage 8 will stay admin-first and avoid discovery-read cutover work.
- The administrator can save a draft or publish directly without a separate
  self-approval action.
- Reviewer identity, approval routing, assignments, notifications, and
  actor-level audit views activate in Stage 11 only when another contributor or
  a compliance need exists.
