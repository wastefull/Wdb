# WasteDB Copilot Instructions

**Updated:** December 18, 2025

## Project Overview

WasteDB is a React + TypeScript CMS for managing material sustainability data. It's a project by nonprofit Wastefull, Inc. with a retro arcade-inspired design. The app runs on Vite locally and deploys to production at db.wastefull.org upon merge to the main branch via GitHub Actions.

## Architecture

```
React Frontend (Vite + Tailwind v4)
    ↓ apiCall() in src/utils/api.tsx
Supabase Edge Functions (Deno + Hono)
    ↓ supabase/functions/make-server-17cae920/index.tsx
PostgreSQL + KV Store
```

**Key files:**

- `src/App.tsx` - Main app with navigation switch (1200+ lines)
- `src/contexts/MaterialsContext.tsx` - Single source of truth for materials state
- `src/utils/api.tsx` - All API calls with dual-token auth pattern
- `supabase/functions/make-server-17cae920/index.tsx` - Backend (12000+ lines, monolithic)

## Authentication Pattern

⚠️ **Common Pitfall**: The API uses a dual-token system that often trips up collaborators:

```typescript
// Authorization header ALWAYS uses anon key (for Supabase gateway)
Authorization: `Bearer ${publicAnonKey}`
// Authenticated users add session token in SEPARATE header
X-Session-Token: <user_jwt>
```

**Wrong**: Putting the user's JWT in the Authorization header  
**Right**: Always use anon key in Authorization, user JWT in X-Session-Token

See `src/utils/api.tsx:apiCall()` and `src/utils/supabase/info.tsx` for the anon key.

## Component Patterns

### Views

All views are in `src/components/views/` and follow this pattern:

- Accept `onBack: () => void` prop for navigation
- Use `<PageTemplate>` wrapper from `src/components/shared/PageTemplate`
- Export from `src/components/views/index.ts`

### Custom Tiptap Extensions

Rich text editor extensions live in `src/components/editor/extensions/`:

- Each extension has `ExtensionName.ts` (node definition) + `ExtensionNameComponent.tsx` (React renderer)
- Export from `index.ts` and add to GuideEditor's extensions array

### Styling

- Use Tailwind classes, design tokens defined in `src/styles/fresh.css`
- Brand colors: `waste-compost`, `waste-recycle`, `waste-reuse`, `waste-science`
- Card style: `retro-card` class, buttons: `retro-btn-primary`, `retro-icon-button`
- Dark mode uses `.dark` class with arcade/CRT aesthetic

## Common Commands

```bash
npm run dev              # Start dev server (default task)
npm run build            # Production build

# Edge Functions (requires Supabase CLI)
supabase functions deploy make-server-17cae920 --project-ref bdvfwjmaufjeqmxphmtv
supabase functions logs make-server-17cae920 --project-ref bdvfwjmaufjeqmxphmtv --follow
```

VS Code tasks are configured in `.vscode/tasks.json` for these common operations.

## Data Flow

1. **Materials**: `MaterialsContext` manages state, syncs localStorage ↔ Supabase
2. **Guides/Blog**: Fetched directly from API, stored in Supabase `guides`/`blog` tables
3. **Auth**: Magic link flow via Supabase Auth + Resend email

## API Routes

All routes are defined in the monolithic `supabase/functions/make-server-17cae920/index.tsx` using Hono framework:

- Routes use `app.get()`, `app.post()`, etc.
- Auth validation happens per-route using `X-Session-Token` header
- Public routes skip auth; protected routes return 401/403 on failure

## Scientific Data Model: MIUs

**MIUs (Minimum Interpretable Units)**, also called "evidence points", are the atomic units of scientific evidence. Each extracted datapoint must include:

- **Parameter**: Y (Yield), C (Contamination), M (Maturity), D (Degradability), or E (Energy)
- **Value**: Numeric value + units + context (method, feedstock, cycles, temp, region)
- **Source location**: Page/figure/table/equation reference
- **Verbatim snippet**: Exact quote (+ optional screenshot) for audit
- **Assumptions**: How the value was normalized/scaled
- **Metadata**: Curator ID + timestamp

Note: "MIU" is the backend term; we may rename this to something more user-friendly on the frontend.

## CMS Systems

WasteDB has three content management systems, each with its own table and CRUD routes:

| CMS           | Table            | Routes                         | Utils                 |
| ------------- | ---------------- | ------------------------------ | --------------------- |
| **Guides**    | `guides`         | `/guides`, `/guides/:id`       | `src/utils/guides.ts` |
| **Blog**      | `blog`           | `/blog`, `/blog/:id`           | `src/utils/blog.ts`   |
| **Materials** | `materials` (KV) | `/materials`, `/materials/:id` | `MaterialsContext`    |

Guides and Blog use Tiptap JSON for rich content; Materials use structured scientific data.

## Key Conventions

- **No sample data**: All materials data should be real/verified
- **Logger**: Use `logger` from `src/utils/logger.ts`, controlled via `window.wastedbLogger.setTestMode(true)`
- **Toast notifications**: Use `toast` from `sonner` for user feedback
- **Icons**: Use `lucide-react` for all icons
- **Forms**: Use `react-hook-form` for form state

## File Naming

- Views: `FeatureNameView.tsx`
- Forms: `FeatureNameForm.tsx`
- Components: PascalCase
- Utils: camelCase

## Testing

Tests run in-app via the Roadmap view. Test definitions are in `src/config/tests/phases/`.

## Documentation

All project documentation lives in `src/docs/`. Key documents:

- `QUICK_START.md` - End-user guide
- `LOCAL_DEVELOPMENT_SETUP.md` - Developer setup
- `SUPABASE_INTEGRATION.md` - Database architecture
- `DATA_PIPELINE.md` - Scientific methodology
- `SECURITY.md` - Auth and RBAC details

When creating new documentation, always place it in `src/docs/` (or appropriate subdirectory).

## Documentation Structure

```
src/docs/
├── admin/          # Admin feature docs
├── archive/        # Historical/deprecated docs
├── auth/           # Authentication docs
├── data/           # Data pipeline & processing
├── roadmap/        # Project roadmap & status
│   ├── complete/   # Completed phase records
│   ├── guides/     # Guides system roadmap
│   └── ui-bugs/    # UI bug tracking
├── security/       # Security & RBAC
├── setup/          # Development setup
├── smtp/           # Email configuration
├── source/         # Source library docs
└── visualization/  # Chart/viz docs
```

## Common Mistakes to Avoid

1. **Don't use React Router** - This project uses a custom `NavigationContext` with view state, not `react-router-dom`. See `src/contexts/NavigationContext.tsx`.

2. **Don't create new Edge Functions** - `make-server-17cae920` is the ONLY edge function. Add new routes to the existing monolithic file, don't create separate functions.

3. **Don't split the backend file** - The 12000+ line server file is intentional for Edge Functions cold start optimization. Keep it monolithic.

4. **Use barrel exports** - Import views from `src/components/views`, forms from `src/components/forms`, admin from `src/components/admin` - each has an `index.ts`.

5. **Materials ≠ Guides/Blog** - Materials use Supabase KV Store via `MaterialsContext`; Guides/Blog use Postgres tables via direct API calls. Materials also have nested `articles` (longer-form informal texts exploring composting/recycling/reuse aspects), which are distinct from Guides or Blog posts.

6. **Don't hardcode the anon key** - Import `publicAnonKey` from `src/utils/supabase/info.tsx`.

## Don't Commit

- `.env.local` (contains API keys)
- `private.txt`
- Service role keys
