# Evidence-Based Sustainability Scoring Plan

Stage 8 should start from reviewed evidence, not from discovery-first graph
reads. The first delivery slice should establish the scoring methodology,
provenance model, and admin review workflow that lets humans approve source
observations before any score can change.

## Summary

- Keep the workflow admin-first and UI-backed.
- Treat discovery relationships as separate from evidentiary support.
- Require explicit approval for source observations before they influence any
  published score.
- Preserve the existing audit-log system for every create, review, update,
  archive, or delete action.

## Key Changes

- Methodology and provenance
  - Define the authoritative scoring methodology, versioning rules, and the
    minimum provenance captured for each observation.
  - Keep the observation record focused on source, location, quote/snippet,
    confidence, reviewer, and methodology version.
- Admin review workflow
  - Build a dedicated admin UI for entering and reviewing source-PDF
    observations.
  - Make the workflow low-friction for items that already have human review
    and keep extra gating only where ambiguity or destructive action exists.
- Publication boundary
  - Publish scores only from approved observations.
  - Keep draft observations and unapproved inputs out of public score outputs.
  - Present provenance clearly on material pages so the score is traceable.
- Audit and compatibility
  - Continue writing audit-log entries for each mutation.
  - Preserve existing contributor, evidence, and material workflows while the
    scoring layer is introduced.

## Test Plan

- Methodology versioning stays deterministic and reproducible.
- Observations cannot affect public scores before approval.
- Approved observations calculate the expected score output.
- Volunteer-safe admin constraints keep forms bounded and clear.
- Audit-log entries are written for each mutation path.

## Assumptions

- Stage 8 will stay admin-first and avoid discovery-read cutover work.
- Human-reviewed inputs should stay low-friction rather than requiring a
  separate queue when the review already happened elsewhere.
- The current audit-log system remains the canonical trail for Stage 8
  mutations.
