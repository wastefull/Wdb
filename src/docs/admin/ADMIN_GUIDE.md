# Admin Guide

The Admin Dashboard groups moderation, database, testing, and operational
tools. Admin mode controls privileged content-editing behavior; authentication
and role checks still apply on the server.

## Core Areas

- **Moderation:** review submissions, takedown requests, audit logs, and data
  retention.
- **Admin:** manage users, roles, categories, assets, maintenance mode, and
  one-time actions.
- **Database:** manage materials, sources, whitepapers, evidence, and curation.
- **Testing:** run transform tests, chart checks, and roadmap regression tests.

## Roadmap Workflow

The roadmap is the operational source of truth:

1. Open Admin > Testing > Roadmap.
2. Select the active stage.
3. Use deliverables and planned acceptance tests to define implementation.
4. Attach executable tests as behavior becomes available.
5. Run stage regressions before marking work complete.

Completed legacy Phase 9.x and 10.0 tests are displayed under current Stages
2-4 while retaining their legacy identifiers for traceability.

## Safety

Before data migrations or bulk operations, follow
[Operations](./OPERATIONS.md). Do not use one-time actions without reading
their description and confirming a verified backup exists.
