# Development

## Prerequisites

- Node.js 18 or newer
- npm
- Supabase CLI for edge-function and migration work
- Access to the appropriate Supabase project and secrets

## Local App

```bash
npm install
npm run dev
```

Build the production client with:

```bash
npm run build
```

The app uses Vite, React, TypeScript, Tailwind CSS, and Supabase. Client project
information is loaded from `src/utils/supabase/info.tsx`. Server secrets belong
in Supabase Edge Function secrets and must never be committed.

## Important Paths

- `src/App.tsx`: application view composition
- `src/components/`: UI and admin tools
- `src/config/roadmap.ts`: canonical roadmap configuration
- `src/config/tests/`: admin roadmap regression tests
- `src/supabase/functions/server/index.tsx`: edge-function API
- `supabase/migrations/`: additive database migrations

## Development Safety

- Treat production Supabase access as live data access.
- Use additive migrations and dry runs for data transformations.
- Create and validate a full-site backup before migration work.
- Never use replacement or destructive restore behavior without explicit
  approval and a verified rollback path.
- Preserve unknown or ambiguous legacy records for manual review.

## Verification

```bash
npm run build
npm run docs:check
git diff --check
```

Executable integration tests are available in Admin > Testing > Roadmap. They
may require an authenticated admin and the configured Supabase environment.
