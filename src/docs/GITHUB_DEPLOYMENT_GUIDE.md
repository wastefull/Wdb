# GitHub Deployment Guide for WasteDB

This guide explains what you need to configure after pulling WasteDB from GitHub to run it locally or deploy it to production.

---

## 📚 Documentation Overview

After cloning, you'll have these setup guides:

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **README.md** | Project overview | First read for understanding project |
| **SETUP_CHECKLIST.md** | Step-by-step setup | During initial setup (print & check off!) |
| **LOCAL_DEVELOPMENT_SETUP.md** | Detailed setup guide | Reference for setup & troubleshooting |
| **QUICK_REFERENCE.md** | Command cheat sheet | Daily development reference |
| **/docs/QUICK_START.md** | End-user guide | Learn how to use the app |

---

## 🚀 Quick Start (5 Minutes)

### Absolute Minimum to Get Running

```bash
# 1. Clone & install
git clone <your-repo-url>
cd wastedb
npm install

# 2. Create environment file
cp .env.example .env.local

# 3. Get Supabase credentials
# Visit: https://app.supabase.com/project/YOUR_PROJECT/settings/api
# Copy: Project URL, Project ID, Anon Key, Service Role Key

# 4. Edit .env.local with your credentials

# 5. Update /utils/supabase/info.tsx with your Project ID and Anon Key

# 6. Deploy edge functions (if using remote Supabase)
supabase link --project-ref YOUR_PROJECT_ID
supabase functions deploy make-server-17cae920

# 7. Initialize database
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-17cae920/ontologies/initialize \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# 8. Start dev server
npm run dev
```

**That's it!** Visit http://localhost:5173

---

## 🔧 What You Need to Configure

### 1. Environment Variables (`.env.local`)

**Required Variables:**
```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_URL=postgresql://postgres:PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
```

**Optional Variables:**
```bash
RESEND_API_KEY=re_xxx...  # Only if using custom email provider
```

**Where to get these:**
- Go to [Supabase Dashboard](https://app.supabase.com)
- Select your project
- Navigate to **Settings** → **API**
- Copy each credential

**⚠️ SECURITY**: Never commit `.env.local` to Git! It's already in `.gitignore`.

---

### 2. Supabase Info File (`/utils/supabase/info.tsx`)

**Replace these values:**
```typescript
export const projectId = "YOUR_PROJECT_ID"  // e.g., "bdvfwjmaufjeqmxphmtv"
export const publicAnonKey = "YOUR_ANON_KEY"  // Starts with eyJhbGc...
```

**Where to get these:**
- Same location as environment variables (Settings → API)
- This file CAN be committed (only contains public keys)

---

### 3. Edge Functions Deployment

Your backend code lives in `/supabase/functions/server/`. After cloning, you need to deploy it:

```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy the main server function
supabase functions deploy make-server-17cae920
```

**Verify deployment:**
```bash
# Check if deployed
supabase functions list

# View logs
supabase functions logs make-server-17cae920

# Test health endpoint
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-17cae920/health \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

### 4. Database Initialization

The app requires ontology data to be loaded into the KV store:

```bash
# Using cURL
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-17cae920/ontologies/initialize \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Or using browser console (after starting dev server)
await fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-17cae920/ontologies/initialize', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_ANON_KEY' }
});
```

**Expected response:**
```json
{
  "success": true,
  "initialized": ["units", "context"],
  "versions": {
    "units": "1.0.0",
    "context": "1.0.0"
  }
}
```

---

### 5. Optional: Email Configuration

If you want magic link emails to work:

**Option A: Use Supabase's Built-in Email (Development)**
- Works out of the box for testing
- Emails shown in Supabase Dashboard → Authentication → Email Templates
- Limited to development use

**Option B: Use Resend (Production)**

1. Sign up at https://resend.com
2. Get API key from dashboard
3. Add to `.env.local`: `RESEND_API_KEY=re_xxx...`
4. Configure in Supabase Dashboard:
   - **Settings** → **Auth** → **SMTP Settings**
   - Host: `smtp.resend.com`
   - Port: `465`
   - User: `resend`
   - Password: `<your-resend-api-key>`
   - Sender: `auth@your-domain.com`

See `/docs/smtp/test/RESEND_SETUP_QUICK_GUIDE.md` for details.

---

## 🏗️ Two Deployment Modes

### Mode 1: Remote Supabase (Production)

**Use when:**
- Deploying to production
- Testing with real cloud infrastructure
- Collaborating with team

**Configuration:**
```bash
# .env.local
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=<from-supabase-dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from-supabase-dashboard>
SUPABASE_DB_URL=postgresql://postgres:PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
```

**Pros:**
- ✅ Persistent data
- ✅ Production-like environment
- ✅ Team collaboration
- ✅ Real email delivery

**Cons:**
- ❌ Requires internet
- ❌ Slower iteration (deploy functions)
- ❌ Counts toward Supabase quotas

---

### Mode 2: Local Supabase (Development)

**Use when:**
- Developing offline
- Fast iteration on backend code
- Testing migrations
- No production data risk

**Setup:**
```bash
# Install Docker first
# Then:
supabase init
supabase start
```

**Configuration:**
```bash
# .env.local
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<from-supabase-start-output>
SUPABASE_SERVICE_ROLE_KEY=<from-supabase-start-output>
SUPABASE_DB_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

**Pros:**
- ✅ Works offline
- ✅ Fast iteration
- ✅ Free (no quotas)
- ✅ Test migrations safely

**Cons:**
- ❌ Requires Docker
- ❌ Data not persistent (resets on `supabase stop`)
- ❌ No real email delivery (uses Inbucket)

**Local URLs:**
- **App**: http://localhost:5173
- **Supabase Studio**: http://localhost:54323
- **Inbucket (emails)**: http://localhost:54324
- **API**: http://localhost:54321
- **DB**: localhost:54322

---

## 📋 Complete Setup Checklist

Use this when setting up for the first time:

### Prerequisites
- [ ] Node.js v18+ installed
- [ ] Git installed
- [ ] Supabase account created
- [ ] Docker installed (for local mode only)

### Setup Steps
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env.local`
- [ ] Get Supabase credentials from dashboard
- [ ] Fill in `.env.local` with credentials
- [ ] Update `/utils/supabase/info.tsx`
- [ ] Deploy edge functions (if remote)
- [ ] Initialize ontologies
- [ ] Run `npm run dev`
- [ ] Test sign-in with magic link
- [ ] Run Phase 9.2 tests to verify

**Detailed checklist**: See `/SETUP_CHECKLIST.md`

---

## 🧪 Verify Setup is Working

After setup, run these checks:

### 1. Dev Server Starts
```bash
npm run dev
# Should open on http://localhost:5173 without errors
```

### 2. App Loads
- Open http://localhost:5173
- Should see WasteDB interface
- No console errors in browser DevTools

### 3. Edge Functions Work
```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-17cae920/health \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Expected: {"status":"healthy","timestamp":"..."}
```

### 4. Ontologies Loaded
```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-17cae920/ontologies/units \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Expected: JSON with units ontology data
```

### 5. Tests Pass
1. Navigate to **Roadmap** → **Phase 9.2**
2. Click **Run Tests**
3. Verify these pass:
   - ✅ Load Units Ontology
   - ✅ Validate Allowed Unit
   - ✅ Reject Invalid Unit
   - ✅ Form Validation tests
   - ✅ Scope Validation tests

---

## 🔄 Workflow After Initial Setup

### Daily Development
```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Make changes (auto-reloads)

# 5. Test changes
# Navigate to Roadmap → Run Tests

# 6. Commit & push
git add .
git commit -m "Description"
git push origin main
```

### When Backend Changes
```bash
# After modifying /supabase/functions/server/index.tsx

# 1. Redeploy edge function
supabase functions deploy make-server-17cae920

# 2. View logs to verify
supabase functions logs make-server-17cae920 --follow

# 3. Test endpoint
curl https://YOUR_PROJECT.supabase.co/functions/v1/make-server-17cae920/your-endpoint \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 🐛 Common Setup Issues

### Issue: "Module not found"
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Failed to load units ontology"
**Solution:**
```bash
# Re-initialize ontologies
curl -X POST <SUPABASE_URL>/functions/v1/make-server-17cae920/ontologies/initialize \
  -H "Authorization: Bearer <ANON_KEY>"
```

### Issue: "Function not found" (404 error)
**Solution:**
```bash
# Check deployment
supabase functions list

# Redeploy
supabase functions deploy make-server-17cae920
```

### Issue: "Unauthorized" when calling APIs
**Solution:**
1. Check you're using correct anon key
2. Verify header format: `Authorization: Bearer <key>`
3. Check edge function includes CORS headers
4. View function logs for details

### Issue: Local Supabase won't start
**Solution:**
```bash
# Check Docker is running
docker ps

# Restart
supabase stop
supabase start

# If still failing
docker restart $(docker ps -q)
```

**More troubleshooting**: See `/docs/LOCAL_DEVELOPMENT_SETUP.md`

---

## 📁 Files You MUST Configure

| File | Action | Required |
|------|--------|----------|
| `.env.local` | Create from `.env.example` | ✅ Yes |
| `/utils/supabase/info.tsx` | Update with your credentials | ✅ Yes |
| Edge functions | Deploy to Supabase | ✅ Yes |
| Database | Initialize ontologies | ✅ Yes |

---

## 📁 Files You Should NOT Edit

| File | Reason |
|------|--------|
| `/supabase/functions/server/kv_store.tsx` | Protected utility (system managed) |
| `/components/figma/ImageWithFallback.tsx` | Protected Figma component |
| `/utils/supabase/info.tsx` | Only update credentials, don't change structure |

---

## 🔐 Security Best Practices

### ✅ DO:
- Add `.env.local` to `.gitignore` (already done)
- Keep Service Role Key secret
- Use environment variables for all secrets
- Commit `.env.example` with placeholder values
- Use separate Supabase projects for dev/prod

### ❌ DON'T:
- Commit `.env.local` to Git
- Share Service Role Key publicly
- Hardcode API keys in code
- Expose Service Role Key to frontend
- Use production credentials in development

---

## 📊 What Gets Synced to GitHub

### ✅ Committed (Safe):
- All source code (`/components`, `/utils`, etc.)
- Documentation (`/docs`, `README.md`)
- Configuration templates (`.env.example`)
- Public keys (`/utils/supabase/info.tsx`)
- Edge function code (`/supabase/functions/server/`)
- Test definitions (`/config/tests/`)

### ❌ NOT Committed (Sensitive):
- `.env.local`
- `.env`
- `node_modules/`
- `dist/`, `build/`
- Local Supabase data (`.supabase/`)

---

## 🎓 Learning Resources

### New to the Project?
1. Read **README.md** for overview
2. Follow **SETUP_CHECKLIST.md** step-by-step
3. Reference **QUICK_REFERENCE.md** for commands
4. Explore `/docs/` for deep dives

### Ready to Develop?
1. Check **LOCAL_DEVELOPMENT_SETUP.md** for architecture
2. Review test files in `/config/tests/phases/`
3. Study components in `/components/`
4. Read backend code in `/supabase/functions/server/`

### Need Help?
- **Setup Issues**: `/docs/LOCAL_DEVELOPMENT_SETUP.md`
- **Usage Questions**: `/docs/QUICK_START.md`
- **Email**: natto@wastefull.org
- **GitHub Issues**: <your-repo-url>/issues

---

## ✅ Final Checklist

Before you start developing, ensure:

- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created and filled
- [ ] `/utils/supabase/info.tsx` updated
- [ ] Edge functions deployed
- [ ] Ontologies initialized
- [ ] Dev server running (`npm run dev`)
- [ ] App loads in browser
- [ ] Phase 9.2 tests pass
- [ ] Can sign in with magic link
- [ ] No console errors

**All checked?** You're ready to develop! 🎉

---

## 📞 Support

- **Documentation**: `/docs/` directory
- **Setup Guide**: `/docs/LOCAL_DEVELOPMENT_SETUP.md`
- **Quick Reference**: `/QUICK_REFERENCE.md`
- **Email**: natto@wastefull.org

---

**Welcome to WasteDB development!** 🚀
