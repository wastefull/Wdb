# WasteDB Quick Reference Card

Handy reference for common commands and configurations.

---

## 🔧 Environment Setup

### File: `.env.local`

**Remote Supabase (Production):**

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_DB_URL=postgresql://postgres:PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
RESEND_API_KEY=re_xxx...  # Optional
```

**Local Supabase (Development):**

```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # From supabase start
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # From supabase start
SUPABASE_DB_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

---

## 🏃 Common Commands

### Frontend Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Supabase Management

```bash
# Install CLI
npm install -g supabase

# Initialize project
supabase init

# Start local Supabase (requires Docker)
supabase start

# Stop local Supabase
supabase stop

# Check status
supabase status

# Link to remote project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy edge functions
supabase functions deploy make-server-17cae920

# Deploy with debug output
supabase functions deploy make-server-17cae920 --debug

# View function logs
supabase functions logs make-server-17cae920

# Follow logs in real-time
supabase functions logs make-server-17cae920 --follow

# Reset local database
supabase db reset
```

### Database Initialization

```bash
# Initialize ontologies (cURL)
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-17cae920/ontologies/initialize \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Initialize ontologies (local)
curl -X POST http://localhost:54321/functions/v1/make-server-17cae920/ontologies/initialize \
  -H "Authorization: Bearer YOUR_LOCAL_ANON_KEY"
```

### Git Workflow

```bash
# Clone repository
git clone <repo-url>
cd wastedb

# Create feature branch
git checkout -b feature/my-feature

# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "Description of changes"

# Push to remote
git push origin feature/my-feature

# Pull latest changes
git pull origin main

# Merge main into your branch
git merge main
```

---

## 📂 File Locations

### Key Files to Edit

```
/utils/supabase/info.tsx          # Supabase project ID & anon key
.env.local                         # Environment variables (create from .env.example)
/supabase/functions/server/index.tsx  # Main backend server
```

### Key Files to NOT Edit

```
/supabase/functions/server/kv_store.tsx  # Protected utility file
/components/figma/ImageWithFallback.tsx  # Protected Figma component
```

### Test Files

```
/config/tests/phases/9.2.ts       # Phase 9.2 tests
/config/tests/all.ts              # Test aggregation
/config/tests/testDefinitions.ts  # Public test API
```

### Documentation

```
/docs/LOCAL_DEVELOPMENT_SETUP.md  # Setup guide
/docs/QUICK_START.md              # User guide
/README.md                        # Project overview
/SETUP_CHECKLIST.md               # Setup checklist
```

---

## 🌐 Important URLs

### Production

```
App:              https://db.wastefull.org
Support Email:    natto@wastefull.org
Magic Link From:  auth@wastefull.org
```

### Local Development

```
App:              http://localhost:5173
Supabase Studio:  http://localhost:54323
Inbucket (Email): http://localhost:54324
Supabase API:     http://localhost:54321
PostgreSQL:       localhost:54322
```

### External Services

```
Supabase Dashboard:  https://app.supabase.com
Resend Dashboard:    https://resend.com/dashboard
GitHub Repo:         <your-repo-url>
```

---

## 🔐 Security Reminders

### ✅ Safe to Commit

- `.env.example`
- `/utils/supabase/info.tsx` (contains only public keys)
- Documentation files
- Source code

### ❌ NEVER Commit

- `.env.local`
- `.env`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- Any file with "secret" or "key" in the name

### Always Check Before Push

```bash
# View what will be committed
git diff --staged

# Verify .gitignore is working
git status --ignored
```

---

## 🧪 Testing

### Run Tests in UI

1. Navigate to **Roadmap** tab
2. Select phase (e.g., **Phase 9.2**)
3. Click **Run Tests**
4. View results

### Test Categories (Phase 9.2)

- Unit Validation
- Form Validation
- Scope Validation
- Evidence List
- UI Components

### Enable Debug Logging

```javascript
// In browser console
wastedbLogger.setTestMode(true);
wastedbLogger.info(); // Check config
```

---

## 🐛 Quick Troubleshooting

### Edge Function Errors

```bash
# 1. Check deployment status
supabase functions list

# 2. View recent logs
supabase functions logs make-server-17cae920 --tail 50

# 3. Redeploy
supabase functions deploy make-server-17cae920

# 4. Test endpoint
curl https://YOUR_PROJECT.supabase.co/functions/v1/make-server-17cae920/health \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Authentication Issues

```javascript
// In browser console
const { data } = await supabase.auth.getSession();
console.log(data.session); // Should show session or null

// Sign out and try again
await supabase.auth.signOut();
```

### Module Not Found

```bash
rm -rf node_modules package-lock.json
npm install
```

### Ontology Loading Fails

```bash
# Re-initialize
curl -X POST <SUPABASE_URL>/functions/v1/make-server-17cae920/ontologies/initialize \
  -H "Authorization: Bearer <ANON_KEY>"
```

### Local Supabase Won't Start

```bash
# Check Docker
docker ps

# Restart
supabase stop
supabase start

# If still failing
docker restart $(docker ps -q)
```

### Hot Reload Not Working

1. Stop dev server (Ctrl+C)
2. Clear `.cache/` directory (if exists)
3. Restart: `npm run dev`

---

## Project Stats

```
Components:       100+ React components
Tests:            100+ comprehensive tests
Documentation:    50+ markdown files
Backend Lines:    5000+ lines (Deno/TypeScript)
Edge Functions:   1 main server (make-server-17cae920)
Database Tables:  1 KV store (kv_store_17cae920)
Phases Complete:  9.0, 9.1, 9.2
```

---

## Common Tasks

### Add New Test

1. Open `/config/tests/phases/9.2.ts` (or relevant phase)
2. Add test object to array:

```typescript
{
  id: 'phase9.2-my-test',
  name: 'My Test Name',
  description: 'What this tests',
  phase: '9.2',
  category: 'My Category',
  testFn: async () => {
    // Test logic here
    return { success: true, message: 'Test passed!' };
  }
}
```

3. Test automatically appears in UI

### Add New Component

1. Create file: `/components/MyComponent.tsx`
2. Export component:

```typescript
export function MyComponent() {
  return <div>My Component</div>;
}
```

3. Import in App.tsx:

```typescript
import { MyComponent } from "./components/MyComponent";
```

### Add New API Endpoint

1. Open `/supabase/functions/server/index.tsx`
2. Add route:

```typescript
app.get("/make-server-17cae920/my-endpoint", async (c) => {
  return c.json({ message: "Hello!" });
});
```

3. Deploy: `supabase functions deploy make-server-17cae920`
4. Test:

```bash
curl https://YOUR_PROJECT.supabase.co/functions/v1/make-server-17cae920/my-endpoint \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## Where to Find Things

| Need to...             | Look in...                             |
| ---------------------- | -------------------------------------- |
| Add a test             | `/config/tests/phases/*.ts`            |
| Add a component        | `/components/*.tsx`                    |
| Update styling         | `/styles/globals.css`                  |
| Add API endpoint       | `/supabase/functions/server/index.tsx` |
| Update auth logic      | `/contexts/AuthContext.tsx`            |
| Modify materials state | `/contexts/MaterialsContext.tsx`       |
| Add source data        | `/data/sources.ts`                     |
| Check types            | `/types/material.ts`                   |
| View logs              | Supabase Dashboard → Logs              |
| Manage users           | Supabase Dashboard → Authentication    |
| View database          | Supabase Dashboard → Table Editor      |

---

## 📞 Get Help

- **Setup Issues**: `/docs/LOCAL_DEVELOPMENT_SETUP.md`
- **Usage Questions**: `/docs/QUICK_START.md`
- **Troubleshooting**: `/docs/LOCAL_DEVELOPMENT_SETUP.md` (Troubleshooting section)
- **Email Support**: natto@wastefull.org
- **GitHub Issues**: <your-repo-url>/issues

---

**Bookmark this page for quick reference!** 🔖
