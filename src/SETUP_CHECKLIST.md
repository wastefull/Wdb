# WasteDB Setup Checklist ✅

Use this checklist when setting up WasteDB from GitHub for the first time.

---

## 📋 Pre-Setup Requirements

### System Requirements
- [ ] Node.js v18+ installed (`node --version`)
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] Docker installed (for local Supabase only)
- [ ] Code editor (VS Code recommended)

### Accounts Needed
- [ ] GitHub account (to clone repo)
- [ ] Supabase account (https://app.supabase.com)
- [ ] Resend account (optional, for emails - https://resend.com)

---

## 🔧 Initial Setup

### 1. Clone & Install
- [ ] Clone repository: `git clone <repo-url>`
- [ ] Navigate to directory: `cd wastedb`
- [ ] Install dependencies: `npm install`
- [ ] Verify installation: `npm run dev` (should fail due to missing env vars - that's okay!)

### 2. Supabase Setup

**Choose ONE option:**

#### Option A: Remote Supabase (Recommended)
- [ ] Create new project at https://app.supabase.com
- [ ] Copy Project ID from Settings → General
- [ ] Copy Anon Key from Settings → API
- [ ] Copy Service Role Key from Settings → API (keep secret!)
- [ ] Copy Database URL from Settings → Database
- [ ] Note down Project URL: `https://YOUR_PROJECT_ID.supabase.co`

#### Option B: Local Supabase
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Initialize: `supabase init`
- [ ] Start local instance: `supabase start`
- [ ] Copy credentials from terminal output
- [ ] Note local URLs (API: `http://localhost:54321`)

### 3. Environment Configuration
- [ ] Copy template: `cp .env.example .env.local`
- [ ] Open `.env.local` in editor
- [ ] Fill in Supabase credentials:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_PROJECT_ID`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `SUPABASE_DB_URL`
- [ ] (Optional) Add `RESEND_API_KEY` if using email
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Save file

### 4. Update `/utils/supabase/info.tsx`
- [ ] Open `/utils/supabase/info.tsx`
- [ ] Replace `projectId` with your Project ID
- [ ] Replace `publicAnonKey` with your Anon Key
- [ ] Save file

### 5. Deploy Edge Functions (if using Remote Supabase)
- [ ] Link project: `supabase link --project-ref YOUR_PROJECT_ID`
- [ ] Deploy server: `supabase functions deploy make-server-17cae920`
- [ ] Verify deployment: Check Supabase Dashboard → Edge Functions
- [ ] View logs: `supabase functions logs make-server-17cae920`

---

## 🗄️ Database Initialization

### 6. Initialize Ontologies
This step loads required data into the database.

**Using cURL:**
```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-17cae920/ontologies/initialize \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Or in browser console after starting dev server:**
```javascript
await fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-17cae920/ontologies/initialize', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_ANON_KEY' }
});
```

- [ ] Run initialization command
- [ ] Verify response: `{"success":true, "initialized":["units","context"]}`
- [ ] Check Supabase Dashboard → Table Editor → `kv_store_17cae920` (should have data)

---

## 🚀 First Run

### 7. Start Development Server
- [ ] Run: `npm run dev`
- [ ] Note the URL (usually `http://localhost:5173`)
- [ ] Open URL in browser
- [ ] Verify app loads (should see WasteDB interface)

### 8. Test Authentication
- [ ] Click **Sign In** button
- [ ] Enter your email address
- [ ] Check email for magic link

**If using Local Supabase:**
- [ ] Open Inbucket: `http://localhost:54324`
- [ ] Find magic link email
- [ ] Click link

**If using Remote Supabase with Resend:**
- [ ] Check your email inbox
- [ ] Click magic link in email
- [ ] Should redirect back to app signed in

- [ ] Verify you're signed in (name appears in header)

---

## 🧪 Verify Setup with Tests

### 9. Run Phase 9.2 Tests
- [ ] Navigate to **Roadmap** tab
- [ ] Click **Phase 9.2** tab
- [ ] Click **Run Tests** button
- [ ] Wait for tests to complete

**Expected results:**
- [ ] ✅ Load Units Ontology (passes)
- [ ] ✅ Validate Allowed Unit (passes)
- [ ] ✅ Reject Invalid Unit (passes)
- [ ] ✅ Evidence Wizard Form Validation (passes)
- [ ] ✅ Verify Pilot Materials Scope (passes)
- [ ] ✅ Verify CR Parameters Scope (passes)
- [ ] ⚠️ Evidence List tests (may show 0 evidence - that's okay)
- [ ] ✅ Confidence Level Options (passes)
- [ ] ✅ Wizard Step Progression (passes)

**If any tests fail:**
- Check browser console for errors
- Verify edge functions are deployed
- Verify ontologies initialized
- Check Supabase logs

---

## 🎨 Optional: Configure Admin Access

### 10. Set Up Admin User
- [ ] Sign in with your email
- [ ] Open Supabase Dashboard → Authentication → Users
- [ ] Find your user
- [ ] Click "..." → "Edit User"
- [ ] Add custom claim: `{"role": "admin"}`
- [ ] Save
- [ ] Refresh app
- [ ] Verify **Admin** button appears in header

---

## 📧 Optional: Email Configuration

### 11. Set Up Resend (Production Emails)
- [ ] Sign up at https://resend.com
- [ ] Get API key from dashboard
- [ ] Add to `.env.local`: `RESEND_API_KEY=re_xxx...`
- [ ] Open Supabase Dashboard → Settings → Auth → SMTP Settings
- [ ] Configure:
  - Host: `smtp.resend.com`
  - Port: `465`
  - User: `resend`
  - Password: `<your-resend-api-key>`
  - Sender email: `auth@your-domain.com`
  - Sender name: `WasteDB`
- [ ] Save settings
- [ ] Test magic link flow

📖 See `/docs/smtp/test/RESEND_SETUP_QUICK_GUIDE.md` for details.

---

## ✅ Final Verification

### 12. Complete Feature Check
- [ ] App loads without errors
- [ ] Can sign in/out with magic link
- [ ] Materials list displays
- [ ] Can navigate between tabs (Materials, Roadmap, etc.)
- [ ] Tests tab shows all test suites
- [ ] Phase tabs show filtered tests
- [ ] Admin features visible (if admin role)
- [ ] No console errors in browser DevTools

---

## 🎉 Setup Complete!

You're now ready to develop locally. Here's what you can do next:

### Next Steps
- [ ] Read [QUICK_START.md](/docs/QUICK_START.md) for feature guide
- [ ] Explore test suites in `/config/tests/phases/`
- [ ] Check out components in `/components/`
- [ ] Review documentation in `/docs/`
- [ ] Make your first code change and test hot-reload

### Development Workflow
1. Make changes to frontend code → Auto-reload
2. Make changes to edge functions → `supabase functions deploy make-server-17cae920`
3. Test changes → Navigate to Roadmap → Run Tests
4. Commit & push → `git add . && git commit -m "..." && git push`

---

## 🐛 Common Issues & Solutions

### Issue: "Module not found" errors
```bash
rm -rf node_modules
npm install
```

### Issue: "Failed to load units ontology"
```bash
# Re-initialize ontologies
curl -X POST <SUPABASE_URL>/functions/v1/make-server-17cae920/ontologies/initialize \
  -H "Authorization: Bearer <ANON_KEY>"
```

### Issue: "Unauthorized" errors
- Verify you're signed in
- Check session in console: `await supabase.auth.getSession()`
- Try signing in again

### Issue: Edge function deployment fails
```bash
# Link project again
supabase link --project-ref YOUR_PROJECT_ID

# Deploy with debug output
supabase functions deploy make-server-17cae920 --debug
```

### Issue: Local Supabase won't start
```bash
# Stop and restart
supabase stop
supabase start

# If still failing, check Docker
docker ps
```

### Issue: Hot reload not working
- Restart dev server
- Clear browser cache
- Check for syntax errors in console

---

## 📚 Additional Resources

- **Full Setup Guide**: [LOCAL_DEVELOPMENT_SETUP.md](/docs/LOCAL_DEVELOPMENT_SETUP.md)
- **User Guide**: [QUICK_START.md](/docs/QUICK_START.md)
- **Project Overview**: [README.md](/README.md)
- **Phase Roadmap**: [PHASE_9_ROADMAP.md](/docs/PHASE_9_ROADMAP.md)
- **All Docs**: `/docs/` directory

---

## 🆘 Need Help?

- Check `/docs/LOCAL_DEVELOPMENT_SETUP.md` troubleshooting section
- Review Supabase logs: `supabase functions logs make-server-17cae920`
- Check browser DevTools console for errors
- Open GitHub issue with error details

---

**Print this checklist and check off items as you go!** 📝
