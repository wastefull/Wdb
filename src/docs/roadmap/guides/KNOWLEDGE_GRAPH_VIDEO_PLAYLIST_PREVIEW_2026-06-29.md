# YouTube Playlist Preview Report

Execution date: June 29, 2026

Edge Function: `make-server-17cae920`, version 286

Mode: authenticated admin, read-only preview

## Result

The first full Stage 7 playlist preview completed successfully:

| Classification | Count |
| -------------- | ----: |
| Playlist items |   370 |
| Unique candidates | 370 |
| New videos | 366 |
| Existing WasteDB videos | 0 |
| Private videos | 4 |
| Unavailable videos | 0 |
| Deleted videos | 0 |
| Duplicate playlist items | 0 |
| Embedding disabled | 1 |

Preview checksum:

`d196045f0427a5e8a33144f096d48aec6e331628b5087f54719362a97c8f3512`

The counts reconcile: 366 available new candidates plus four private
candidates account for all 370 unique playlist positions. No candidate was
lost to duplication, deletion, malformed metadata, or an unexplained provider
failure.

## Non-Mutation Evidence

The operator panel only displays a successful result when the endpoint reports
`mutation_performed = false`, `mutation_detected = false`, and identical video,
video-entity, and video-binding snapshots before and after provider
enumeration. No video, entity, canonical binding, material mapping, editorial
lead, or triage decision was created by this preview.

## Candidate Handling

- The four private candidates are not eligible for video apply while their
  metadata remains inaccessible. A later import workflow should retain their
  playlist positions and private classification as reviewable import issues.
- The embedding-disabled candidate remains otherwise available. The proposed
  default is to retain it for editorial review as `external_playback_only`,
  linking to YouTube rather than promising an embedded player.
- The remaining 365 available candidates have no provider or duplicate issue.

These classifications do not publish, endorse, or establish evidentiary use
for any video.

## Decision

The preview implementation and source playlist are eligible for the next
Stage 7 slice: persistent four-way triage and resumable draft-apply design.
This report does not authorize creating video records or material mappings.
