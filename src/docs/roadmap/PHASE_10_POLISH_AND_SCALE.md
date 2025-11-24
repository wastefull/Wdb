# Phase 10: Polish, Scale & Community Growth

**Status:** 📋 PLANNED  
**Prerequisites:** Phase 9 Complete (All 6 sub-phases)  
**Source:** Phase 9 Addendum deferred features  
**Target Completion:** Q2-Q3 2026  
**Last Updated:** November 12, 2025

---

## 🎯 Overview

Phase 10 transforms WasteDB from a **functional evidence pipeline** to a **polished, scalable, community-driven platform** that can onboard 50+ volunteer curators, serve international audiences, and establish itself as the authoritative open data source for materials sustainability.

### Mission

**Phase 9 got it working. Phase 10 makes it excellent.**

Phase 10 focuses on five strategic pillars:

1. **Contributor Experience** - Make curation delightful, not just functional
2. **Analytics & Monitoring** - Comprehensive observability and optimization
3. **Publication & Outreach** - Academic credibility and trust signals
4. **Internationalization** - Global reach and multilingual support
5. **Community Growth** - Retention, gamification, and scaling to 50+ curators

---

## 🔗 Relationship to Phase 9

### Prerequisites (Must Be Complete)

✅ **Phase 9.0:** Critical Infrastructure (legal, security, governance)  
✅ **Phase 9.1:** Database Schema & Backend  
✅ **Phase 9.2:** Curation Workbench (Pilot)  
✅ **Phase 9.3:** Aggregation Engine  
✅ **Phase 9.4:** Scale to All Dimensions  
✅ **Phase 9.5:** Public Evidence Layer  

### What Phase 9 Delivers

- ✅ 250-300 MIUs across 8 materials
- ✅ Functional 5-step extraction wizard
- ✅ Research-grade status system (provisional/verified/research-grade)
- ✅ Evidence tab with public traceability
- ✅ Curator dashboard with basic metrics
- ✅ Quarterly release management

### What Phase 10 Adds

- 🆕 **Delightful UX** - OCR assist, practice mode, contextual help
- 🆕 **Advanced Analytics** - Performance dashboards, API optimization
- 🆕 **Academic Trust** - DOI minting, citation guides, rubric transparency
- 🆕 **Global Reach** - i18n, multilingual support, locale-aware data
- 🆕 **Community Scale** - Reputation system, campaigns, onboarding automation

---

## 📋 Phase Breakdown

Phase 10 is divided into **5 parallel workstreams** that can be implemented concurrently or sequentially based on priority.

---

## 🎨 Workstream 1: Contributor Experience

**Duration:** 3 weeks  
**Goal:** Make curation so delightful that curators become advocates

### **1.1: OCR + Highlight Assist** ⬜ NOT STARTED

**Goal:** Reduce manual snippet typing with AI-powered text extraction

#### Deliverables

- ⬜ **OCR Integration**
  - Integrate Tesseract.js or cloud OCR (Google Cloud Vision, AWS Textract)
  - Extract text from PDF pages automatically
  - Highlight selected text in PDF viewer
  - Copy-paste selected text into snippet field
  
- ⬜ **Highlight-to-Snippet Workflow**
  - Click-and-drag to select text in PDF
  - Auto-populate snippet field
  - Auto-detect page number
  - Auto-suggest locator (figure/table if detected)

- ⬜ **Smart Snippet Extraction**
  - Detect numeric values in highlighted text
  - Auto-suggest parameter based on context (keywords: "recyclability", "biodegradation", "durability")
  - Pre-fill raw value if numeric pattern detected

#### UI Components

- ⬜ `PDFHighlightSelector.tsx` - Click-drag text selection
- ⬜ `OCRProcessor.tsx` - Background OCR on page load
- ⬜ `SmartSnippetSuggest.tsx` - Context-aware parameter suggestions

#### Success Criteria

- ✅ OCR accuracy >95% on standard academic PDFs
- ✅ Highlight-to-snippet reduces time-per-MIU by 20%
- ✅ Smart suggestions correct 70% of the time
- ✅ Works with paywalled PDFs (screenshot upload + OCR)

**Estimated Effort:** 1 week

---

### **1.2: Practice Mode with Instant Feedback** ⬜ NOT STARTED

**Goal:** Onboard curators faster with hands-on training that feels like a game

#### Deliverables

- ⬜ **Practice Materials**
  - Curate 3 "training materials" (not real, but realistic)
  - Pre-populate with "golden standard" MIUs
  - Use open-access sources only
  
- ⬜ **Practice Mode UI**
  - Toggle "Practice Mode" in Curation Workbench
  - Extract MIUs from training materials
  - System compares to golden standard
  - Instant feedback: "✅ Correct!" vs "❌ Check your units" vs "⚠️ Snippet too short"
  
- ⬜ **Feedback System**
  - Compare curator's MIU to golden standard
  - Check: parameter, raw value (±5%), units, locator accuracy, snippet length
  - Show side-by-side diff
  - Award "badges" for milestones (5 correct, 10 correct, perfect streak)

- ⬜ **Graduation Criteria**
  - Complete 10 practice MIUs
  - Achieve 80% accuracy
  - Pass double-extraction validation (κ ≥ 0.7 with golden standard)
  - Get "Certified Curator" badge

#### UI Components

- ⬜ `PracticeMode.tsx` - Training interface
- ⬜ `GoldenStandardComparator.tsx` - MIU validation logic
- ⬜ `InstantFeedback.tsx` - Real-time accuracy display
- ⬜ `CuratorBadges.tsx` - Achievement system

#### Success Criteria

- ✅ 90% of trainees graduate within 1 hour
- ✅ Graduates achieve κ ≥ 0.7 on real materials
- ✅ Positive feedback: "Felt like a game, not homework"
- ✅ Retention: 80% of graduates extract ≥20 real MIUs within first month

**Estimated Effort:** 1.5 weeks

---

### **1.3: Challenge Campaigns** ⬜ NOT STARTED

**Goal:** Recruit evidence for low-coverage parameters with focused campaigns

#### Deliverables

- ⬜ **Campaign System**
  - Admin creates campaign: "Close the PET Gap" (focus on PET Plastic, parameters with <3 MIUs)
  - Set goal: "Extract 15 MIUs for PET Compostability"
  - Set deadline: 2 weeks
  - Show progress bar on campaign page
  
- ⬜ **Campaign Types**
  - **Coverage Campaigns:** Fill gaps (low-coverage parameters)
  - **Double-Extraction Campaigns:** Validate existing MIUs (recruit second curator)
  - **Source Campaigns:** Extract from a specific high-value source
  - **Region Campaigns:** Add regional data (e.g., "Asian recycling facilities")
  
- ⬜ **Incentives**
  - Leaderboard per campaign
  - Special badges: "Gap Closer", "Validator", "Regional Expert"
  - Public recognition on Contributors page
  - Top 3 contributors featured in quarterly release notes

#### UI Components

- ⬜ `CampaignsPage.tsx` - List active campaigns
- ⬜ `CampaignDetail.tsx` - Progress, leaderboard, "Join campaign" button
- ⬜ `CampaignCreator.tsx` - Admin tool to create campaigns
- ⬜ `CampaignProgress.tsx` - Real-time goal tracking

#### Success Criteria

- ✅ First campaign ("Close the PET Gap") completes in ≤2 weeks
- ✅ 10+ curators participate per campaign
- ✅ Campaign materials achieve research-grade status
- ✅ Community enthusiasm: "This feels purposeful, not random"

**Estimated Effort:** 0.5 weeks

---

### **1.4: Rich Provenance UI** ⬜ NOT STARTED

**Goal:** Show curators why their work matters with "impact summaries"

#### Deliverables

- ⬜ **"Why This Matters" Summaries**
  - After saving MIU, show impact:
    - "This MIU brings PET Plastic to 4/5 parameters for research-grade!"
    - "You're the 2nd curator to extract from this source—validation complete!"
    - "This fills a gap: no other MIUs exist for PET Compostability in Asia"
  
- ⬜ **MIU Impact Dashboard**
  - Curator profile shows: "Your MIUs contributed to X materials achieving research-grade"
  - "Your MIUs cited in Y exports/downloads"
  - "Your work helped close Z coverage gaps"
  
- ⬜ **Public MIU Pages**
  - Each MIU gets a public page: `/evidence/{miu_id}`
  - Shows: snippet, source, parameter, normalized value, curator attribution
  - Shows: which aggregations use this MIU
  - Shows: how this MIU compares to others for same parameter (percentile)

#### UI Components

- ⬜ `MIUImpactSummary.tsx` - Post-save impact message
- ⬜ `CuratorImpactDashboard.tsx` - Profile impact stats
- ⬜ `MIUPublicPage.tsx` - Public MIU detail page

#### Success Criteria

- ✅ 100% of MIU saves show impact summary
- ✅ Curators report: "Seeing impact motivates me to do more"
- ✅ Public MIU pages get organic traffic (indexed by Google Scholar)
- ✅ Citation count increases: "We used WasteDB MIU #1234 for..."

**Estimated Effort:** 0.5 weeks (building on Phase 9 infrastructure)

---

## 📊 Workstream 2: Analytics & Monitoring

**Duration:** 2 weeks  
**Goal:** Full observability, performance optimization, API polish

### **2.1: Advanced Observability Dashboards** ⬜ NOT STARTED

**Goal:** Beyond Phase 9's minimal observability, add comprehensive metrics

#### Deliverables

- ⬜ **Curator Analytics Dashboard**
  - MIU creation rate over time (daily/weekly/monthly)
  - Parameter coverage heatmap (which parameters being extracted)
  - Inter-curator agreement trends (κ scores over time)
  - Time-per-MIU distribution (identify bottlenecks)
  - Source utilization (which sources most extracted from)
  
- ⬜ **Platform Health Dashboard**
  - API response time percentiles (p50, p90, p99, p99.9)
  - Database query performance (slow query log)
  - Export generation time trends
  - Aggregation computation latency
  - User growth metrics (MAU, DAU, curator retention)
  
- ⬜ **Research Usage Analytics**
  - Export download counts per release
  - API call frequency and endpoint popularity
  - Research JSON vs. public CSV usage ratio
  - Geographic distribution of API consumers

#### UI Components

- ⬜ `CuratorAnalyticsDashboard.tsx` - Curator-facing metrics
- ⬜ `PlatformHealthDashboard.tsx` - Admin metrics (extends Phase 9's ObservabilityDashboard)
- ⬜ `ResearchUsageAnalytics.tsx` - API/export metrics

#### Success Criteria

- ✅ Dashboards accessible and performant (<2s load time)
- ✅ Identify and fix ≥3 performance bottlenecks
- ✅ Curator feedback: "I love seeing my progress visualized"
- ✅ Admin can debug issues 50% faster with dashboards

**Estimated Effort:** 1 week

---

### **2.2: Performance Optimization** ⬜ NOT STARTED

**Goal:** Ensure system scales to 1000+ MIUs and 50+ concurrent curators

#### Deliverables

- ⬜ **Database Optimization**
  - Add missing indexes (analyze slow query log from 2.1)
  - Optimize aggregation queries (use materialized views for frequently accessed data)
  - Partition evidence_points table by material_id or created_at
  - Connection pooling tuning (Supabase config)
  
- ⬜ **API Optimization**
  - Implement caching (Redis or Supabase edge caching)
  - Batch aggregation computations (queue instead of synchronous)
  - Pagination for large result sets (limit 50 per page)
  - Compress responses (gzip/brotli)
  
- ⬜ **Frontend Optimization**
  - Lazy load PDF viewer (don't load until user opens it)
  - Virtualize large MIU lists (react-window)
  - Debounce search inputs
  - Optimize re-renders (React.memo, useMemo)

#### Deliverables

- ⬜ Load testing report (simulate 50 concurrent curators)
- ⬜ Performance budget document (target: p95 < 500ms for all endpoints)
- ⬜ Optimization checklist completed

#### Success Criteria

- ✅ API p95 latency <500ms for all endpoints
- ✅ Database handles 1000+ MIUs without degradation
- ✅ Frontend Time to Interactive (TTI) <3s
- ✅ Load test: 50 concurrent curators no errors

**Estimated Effort:** 0.5 weeks

---

### **2.3: API Rate-Limit Polish** ⬜ NOT STARTED

**Goal:** Add HTTP caching headers and rate limits for production API

#### Deliverables

- ⬜ **ETag Support**
  - Generate ETags for aggregations (hash of MIU IDs + versions)
  - Return `304 Not Modified` if ETag matches
  - Reduce bandwidth for repeated requests
  
- ⬜ **Last-Modified Headers**
  - Track when materials/aggregations last updated
  - Return `Last-Modified` header
  - Support `If-Modified-Since` conditional requests
  
- ⬜ **Rate Limiting**
  - Implement token bucket algorithm
  - Limit: 100 requests/minute per IP (authenticated users: 500/minute)
  - Return `429 Too Many Requests` with `Retry-After` header
  - Whitelist known academic/research IPs
  
- ⬜ **API Documentation Updates**
  - Document ETag/Last-Modified usage
  - Document rate limits and best practices
  - Provide example code (Python, R, JavaScript)

#### UI Components

- ⬜ Update `/docs/API.md` with caching examples
- ⬜ Rate limit dashboard (admin view showing top consumers)

#### Success Criteria

- ✅ ETag reduces bandwidth by 30% for repeat consumers
- ✅ Rate limits prevent abuse (no DDoS incidents)
- ✅ API docs include caching examples in 3 languages
- ✅ Research users report: "API is fast and respectful"

**Estimated Effort:** 0.5 weeks

---

## 📚 Workstream 3: Publication & Outreach

**Duration:** 2 weeks  
**Goal:** Establish WasteDB as academically credible and citation-worthy

### **3.1: Research-Grade Rubric Public Page** ⬜ NOT STARTED

**Goal:** Transparent promotion criteria builds trust

#### Deliverables

- ⬜ **Public Rubric Page** (`/methodology/research-grade`)
  - Explain three tiers: Provisional, Verified, Research-Grade
  - Show scoring formula (coverage 40pts, sample size 20pts, etc.)
  - Provide examples: "Aluminum is research-grade because..."
  - Link to Phase 9 documentation
  
- ⬜ **Material Status Explanations**
  - Each material page shows: "This material is Research-Grade"
  - Click badge → tooltip explaining why (score breakdown)
  - Link to rubric page for details
  
- ⬜ **Promotion History**
  - Materials page shows: "Achieved Research-Grade on Mar 15, 2026"
  - Changelog: "Added 5 MIUs for parameter B → promoted from Verified"
  
#### UI Components

- ⬜ `ResearchGradeRubricPage.tsx` - Public methodology page
- ⬜ `PromotionTooltip.tsx` - Badge click → score breakdown
- ⬜ `PromotionHistory.tsx` - Timeline of status changes

#### Success Criteria

- ✅ Rubric page linked from footer and methodology section
- ✅ 100% of materials show clear status explanation
- ✅ Academic feedback: "This transparency is excellent"
- ✅ Citations include: "...using research-grade materials from WasteDB"

**Estimated Effort:** 0.5 weeks

---

### **3.2: DOI/DataCite Minting for Releases** ⬜ NOT STARTED

**Goal:** Make quarterly releases citable with persistent identifiers

#### Deliverables

- ⬜ **DataCite Integration**
  - Register WasteDB with DataCite
  - Generate DOIs for each quarterly release
  - Format: `10.xxxxx/wastedb.v2026.Q1`
  
- ⬜ **Release Metadata**
  - Title: "WasteDB: Evidence-Based Materials Sustainability Data v2026.Q1"
  - Creators: WasteDB Contributors (with curator credits)
  - Publisher: WasteDB Project
  - Publication Year: 2026
  - Resource Type: Dataset
  - License: CC BY 4.0 (structured data) + Fair Use (snippets)
  
- ⬜ **Landing Pages**
  - Each release has a landing page: `/releases/v2026.Q1`
  - Shows: DOI, changelog, download links, citation formats
  - Citation formats: BibTeX, RIS, APA, MLA, Chicago
  
- ⬜ **Citation Widget**
  - "Cite this release" button on Releases page
  - Copy-paste citation in preferred format
  - Auto-generates: "WasteDB Contributors (2026). WasteDB: Evidence-Based Materials Sustainability Data v2026.Q1. DOI: 10.xxxxx/wastedb.v2026.Q1"

#### UI Components

- ⬜ `DOIMinter.tsx` - Admin tool to generate DOIs
- ⬜ `ReleaseLandingPage.tsx` - Public release page with DOI
- ⬜ `CitationWidget.tsx` - Copy citation in multiple formats

#### Success Criteria

- ✅ First release (v2026.Q1) minted with DOI
- ✅ DOI resolves to WasteDB landing page
- ✅ DataCite metadata validated and indexed
- ✅ Citations start appearing in academic papers
- ✅ Google Scholar indexes WasteDB releases

**Estimated Effort:** 1 week

---

### **3.3: Academic Citation Guides** ⬜ NOT STARTED

**Goal:** Make it dead simple for researchers to cite WasteDB correctly

#### Deliverables

- ⬜ **Citation Guide Page** (`/cite`)
  - How to cite the platform: "WasteDB (2026). https://wastedb.org"
  - How to cite a release: Use DOI citation from 3.2
  - How to cite a specific material: "Aluminum data from WasteDB v2026.Q1, DOI: ..."
  - How to cite a specific MIU: "WasteDB MIU #1234, extracted by @curator, [link]"
  
- ⬜ **Export with Citations**
  - Research JSON export includes recommended citation
  - CSV export header includes citation comment
  - API responses include `X-Cite` header with citation string
  
- ⬜ **Integration Guides**
  - LaTeX/BibTeX example
  - Zotero/Mendeley import instructions
  - EndNote RIS file download
  - R/Python code examples with inline citations

#### UI Components

- ⬜ `CitationGuidePage.tsx` - `/cite` route
- ⬜ Update export endpoints to include citation metadata

#### Success Criteria

- ✅ Citation guide linked from footer and docs
- ✅ 100% of exports include citation metadata
- ✅ Zotero can auto-import WasteDB citations
- ✅ Academic feedback: "Citing WasteDB is trivial"
- ✅ Citations start appearing in peer-reviewed papers

**Estimated Effort:** 0.5 weeks

---

## 🌍 Workstream 4: Internationalization (i18n)

**Duration:** 3 weeks  
**Goal:** Global reach with multilingual UI and locale-aware data

### **4.1: UI Internationalization** ⬜ NOT STARTED

**Goal:** Translate WasteDB UI to 3+ languages (English, Spanish, Mandarin)

#### Deliverables

- ⬜ **i18n Framework**
  - Integrate next-intl or react-i18next
  - Extract all hardcoded strings to translation files
  - Support language switcher in header
  - Detect browser language preference
  
- ⬜ **Translation Files**
  - Create `.json` files for each language
  - Translate: UI labels, buttons, tooltips, error messages, help text
  - Priority languages: English (default), Spanish, Mandarin Chinese
  - Future: French, German, Portuguese
  
- ⬜ **Localized Content**
  - Methodology pages in multiple languages
  - Curator Codebook translated
  - Email templates localized
  - Error messages localized

#### UI Components

- ⬜ `LanguageSwitcher.tsx` - Dropdown in header
- ⬜ Translation JSON files for each language
- ⬜ Locale-aware date/number formatting

#### Success Criteria

- ✅ 100% of UI strings translatable
- ✅ Spanish and Mandarin translations complete (90% accuracy)
- ✅ Language switcher functional
- ✅ Non-English users report: "UI feels native, not translated"
- ✅ Curator onboarding in Spanish/Mandarin available

**Estimated Effort:** 2 weeks

---

### **4.2: Localized Parameter Names & Tooltips** ⬜ NOT STARTED

**Goal:** Translate scientific parameters (Y, D, C, M, E, etc.) for clarity

#### Deliverables

- ⬜ **Parameter Translations**
  - Y (Yield): "Rendimiento" (ES), "产量" (ZH)
  - D (Demand): "Demanda" (ES), "需求" (ZH)
  - C (Contamination): "Contaminación" (ES), "污染" (ZH)
  - ...all 13 parameters
  
- ⬜ **Tooltip Translations**
  - Parameter tooltips explain meaning in local language
  - Context tags (process, stream, region) translated
  
- ⬜ **Evidence Tab Localization**
  - MIU snippet remains in original language (verbatim requirement)
  - But labels/metadata translated: "Locator", "Snippet", "Normalized Value"

#### UI Components

- ⬜ Update parameter dropdowns with localized names
- ⬜ Localized tooltip overlays

#### Success Criteria

- ✅ All 13 parameters have accurate translations in 3 languages
- ✅ Non-English curators can extract MIUs without language barrier
- ✅ Tooltips clear and scientifically accurate

**Estimated Effort:** 0.5 weeks

---

### **4.3: Locale-Aware MIU Tags** ⬜ NOT STARTED

**Goal:** Allow MIUs to specify language/region for snippet

#### Deliverables

- ⬜ **Add Locale Field to MIUs**
  - `snippet_language` TEXT field (ISO 639-1 codes: 'en', 'es', 'zh', 'fr', etc.)
  - `snippet_region` TEXT field (ISO 3166-1: 'US', 'CN', 'MX', 'DE', etc.)
  
- ⬜ **Evidence Wizard Update**
  - Auto-detect language from source metadata
  - Allow manual override (dropdown)
  
- ⬜ **Filtering by Locale**
  - Aggregation engine can filter MIUs by language/region
  - Example: "Show only MIUs from Chinese sources for Asia-specific data"
  - Public Evidence tab filterable by language

#### UI Components

- ⬜ `LocaleSelector.tsx` - Language/region dropdowns in Evidence Wizard Step 4
- ⬜ `LocaleFilter.tsx` - Filter MIUs by locale in aggregation engine

#### Success Criteria

- ✅ 100% of MIUs tagged with language
- ✅ Regional filtering works (e.g., "Asia-specific recyclability data")
- ✅ Multilingual sources supported without confusion
- ✅ No English-centric bias in data representation

**Estimated Effort:** 0.5 weeks

---

## 🚀 Workstream 5: Community Growth & Gamification

**Duration:** 3 weeks  
**Goal:** Scale from 5 curators to 50+ with retention and engagement

### **5.1: Advanced Reputation Mechanics** ⬜ NOT STARTED

**Goal:** Beyond Bronze/Silver/Gold badges, add nuanced reputation system

#### Deliverables

- ⬜ **Reputation Points**
  - MIU created: +10 points
  - Double-extraction validated: +20 points
  - First MIU for a parameter: +50 points (gap closer bonus)
  - Material promoted to research-grade (contributor): +100 points
  - Adjudication accepted (your MIU chosen over conflicting): +15 points
  
- ⬜ **Reputation Tiers**
  - 0-99: Novice Curator 🌱
  - 100-499: Curator 📊
  - 500-999: Expert Curator 🎯
  - 1000-2499: Master Curator 🏆
  - 2500+: Legend Curator 👑
  
- ⬜ **Skill Badges**
  - "Specialist" badges per dimension: CR Specialist, CC Specialist, RU Specialist (25+ MIUs in dimension)
  - "Material Expert" badges: Aluminum Expert, PET Expert (20+ MIUs for one material)
  - "Validator" badge: Completed 10+ double-extractions
  - "Gap Closer" badge: First MIU for 5+ parameters
  - "Polyglot" badge: MIUs in 3+ languages
  
- ⬜ **Leaderboards**
  - All-time: Top curators by total reputation
  - This month: Top curators in last 30 days
  - Per dimension: Top CR curators, CC curators, RU curators
  - Per campaign: Campaign-specific leaderboards

#### UI Components

- ⬜ `ReputationDisplay.tsx` - Show points and tier on profile
- ⬜ `BadgeCollection.tsx` - Display earned badges
- ⬜ `Leaderboards.tsx` - Multiple leaderboard views
- ⬜ `ReputationHistory.tsx` - Activity log with point gains

#### Success Criteria

- ✅ 100% of curators have reputation score
- ✅ Leaderboards update in real-time
- ✅ Curator feedback: "Badges motivate me to keep going"
- ✅ Top 10% of curators account for 60% of MIUs (Pareto principle healthy)

**Estimated Effort:** 1 week

---

### **5.2: Automated Onboarding Wizard** ⬜ NOT STARTED

**Goal:** Onboard new curators without manual admin intervention

#### Deliverables

- ⬜ **Onboarding Flow**
  - Sign up → Welcome page
  - Watch 5-min intro video
  - Read Curator Codebook v0 (or skip to practice mode)
  - Enter Practice Mode (from 1.2)
  - Complete 10 practice MIUs
  - Pass validation (κ ≥ 0.7)
  - Get "Certified Curator" badge
  - Assigned to first real material (from Curation Queue)
  
- ⬜ **Welcome Email Sequence**
  - Day 0: Welcome, link to onboarding
  - Day 2: "Still working on practice mode?" reminder
  - Day 5: "Congrats on completing practice!" (if completed)
  - Day 7: "Join your first campaign" nudge
  - Day 14: "Your first MIU contributed to research-grade!" (if applicable)
  
- ⬜ **Automated Role Assignment**
  - New signups default to "Contributor" role (can create MIUs in practice mode only)
  - After certification, promoted to "Curator" role (can create real MIUs)
  - After 100 reputation points, promoted to "Trusted Curator" (can adjudicate disagreements)

#### UI Components

- ⬜ `OnboardingWizard.tsx` - Step-by-step flow
- ⬜ `WelcomeVideo.tsx` - Embedded intro video
- ⬜ Email templates (using RESEND_API_KEY)

#### Success Criteria

- ✅ 90% of signups complete onboarding within 1 week
- ✅ Zero manual admin intervention required
- ✅ Retention: 80% of certified curators extract ≥1 real MIU within first month
- ✅ Email open rate >60%, click-through rate >40%

**Estimated Effort:** 1 week

---

### **5.3: Curator Training Videos & Interactive Tutorials** ⬜ NOT STARTED

**Goal:** Supplement written docs with visual and interactive training

#### Deliverables

- ⬜ **Video Series**
  - **Intro:** "What is WasteDB?" (3 min)
  - **Tutorial 1:** "Your First MIU" (5 min)
  - **Tutorial 2:** "Understanding Parameters" (7 min)
  - **Tutorial 3:** "Normalization and Units" (5 min)
  - **Tutorial 4:** "Double-Extraction and Validation" (6 min)
  - **Advanced:** "Adjudicating Disagreements" (8 min)
  
- ⬜ **Interactive Tutorials** (using library like Shepherd.js or React Joyride)
  - Guided tour of Curation Workbench
  - Step-by-step walkthrough of 5-step wizard
  - Highlight key UI elements with tooltips
  
- ⬜ **Video Hosting**
  - Upload to YouTube (WasteDB channel)
  - Embed in onboarding wizard
  - Link from Curator Codebook sections
  - Searchable by topic

#### UI Components

- ⬜ YouTube channel setup
- ⬜ `VideoEmbeds.tsx` - Embedded videos in onboarding
- ⬜ `InteractiveTour.tsx` - Guided UI tour

#### Success Criteria

- ✅ 6 videos published and embedded
- ✅ Interactive tour available in Curation Workbench
- ✅ Video views: 100+ within first month
- ✅ Curator feedback: "Videos made everything click"
- ✅ Reduction in support questions by 30%

**Estimated Effort:** 1 week (assuming video production outsourced or done async)

---

## 📊 Timeline

Phase 10 can be implemented in **3 sequential passes** or **5 parallel workstreams** depending on team capacity.

### **Option A: Sequential (Total: 13 weeks)**

**Pass 1: Polish (Weeks 1-6)**
- Workstream 1: Contributor Experience (3 weeks)
- Workstream 2: Analytics & Monitoring (2 weeks)
- Workstream 3: Publication & Outreach (2 weeks)

**Pass 2: Internationalization (Weeks 7-9)**
- Workstream 4: i18n (3 weeks)

**Pass 3: Scale (Weeks 10-13)**
- Workstream 5: Community Growth (3 weeks)
- Final integration and testing (1 week)

### **Option B: Parallel (Total: 3 weeks with 5-person team)**

**Week 1-3: All Workstreams in Parallel**
- Person 1: Contributor Experience (1.1, 1.2, 1.3, 1.4)
- Person 2: Analytics & Monitoring (2.1, 2.2, 2.3)
- Person 3: Publication & Outreach (3.1, 3.2, 3.3)
- Person 4: Internationalization (4.1, 4.2, 4.3)
- Person 5: Community Growth (5.1, 5.2, 5.3)

**Recommended:** Option A (sequential) for solo/small team, Option B (parallel) for larger team.

---

## ✅ Phase 10 Completion Criteria

Phase 10 is complete when ALL of the following are TRUE:

### Contributor Experience ✅
- [ ] OCR + Highlight assist functional (time-per-MIU reduced 20%)
- [ ] Practice mode with 10 golden standard MIUs available
- [ ] First challenge campaign completed successfully
- [ ] Rich provenance "impact summaries" displayed on all MIU saves

### Analytics & Monitoring ✅
- [ ] 3 observability dashboards deployed (curator, platform, research usage)
- [ ] Load test passed (50 concurrent curators, no errors)
- [ ] API p95 latency <500ms for all endpoints
- [ ] ETag and rate-limiting implemented

### Publication & Outreach ✅
- [ ] Research-grade rubric page published
- [ ] First release minted with DOI (v2026.Q1 or later)
- [ ] Citation guide published with 3+ format examples
- [ ] Zotero/Mendeley can auto-import WasteDB citations

### Internationalization ✅
- [ ] UI translated to 3 languages (English, Spanish, Mandarin)
- [ ] All 13 parameters have localized names and tooltips
- [ ] MIUs tagged with snippet_language field
- [ ] Locale filtering functional in aggregation engine

### Community Growth ✅
- [ ] Reputation system with 5 tiers and 8+ badge types
- [ ] Automated onboarding wizard (zero manual admin intervention)
- [ ] 6 training videos published and embedded
- [ ] Interactive UI tour available in Curation Workbench

---

## 📊 Success Metrics

### Quantitative Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Active curators | 50+ | Monthly active users with ≥1 MIU created |
| Curator retention | 80% | Certified curators who create ≥1 real MIU in first month |
| Time-per-MIU | <2.5 min | Median (20% reduction from Phase 9's <3 min) |
| API latency | p95 <500ms | All endpoints |
| Onboarding time | <1 hour | Signup → certified curator |
| Campaign participation | 10+ curators per campaign | Avg curators per challenge campaign |
| International reach | 30% non-English users | Curators using non-English UI |
| Academic citations | 5+ papers | Citing WasteDB in peer-reviewed journals |

### Qualitative Goals

- ✅ **Delight:** Curators describe experience as "fun" and "rewarding"
- ✅ **Trust:** Academic community views WasteDB as credible and rigorous
- ✅ **Global:** Non-English curators feel welcomed and supported
- ✅ **Scalable:** Platform handles 100+ curators without degradation
- ✅ **Community:** Curators self-organize campaigns and recruit peers

---

## 🎯 Expected Outcomes

Upon completion of Phase 10:

### For Curators
- 🎨 **Delightful UX:** OCR assist, practice mode, instant feedback
- 🏆 **Recognition:** Reputation system, badges, leaderboards
- 🌍 **Global:** UI in their language, regional data supported
- 📹 **Training:** Video tutorials and interactive tours
- 🎯 **Purpose:** Challenge campaigns give focus and impact

### For Researchers
- 📊 **Credibility:** DOI-minted releases, citation guides
- 🔍 **Transparency:** Public research-grade rubric
- ⚡ **Performance:** Fast API, HTTP caching, rate limits
- 📈 **Analytics:** Usage metrics and download tracking
- 🌐 **Access:** Multilingual docs and locale-aware data

### For WasteDB Platform
- 📈 **Scale:** 50+ active curators (10x Phase 9's 5 curators)
- 🌍 **Reach:** 30% non-English users
- 📚 **Citations:** Appearing in peer-reviewed papers
- 💎 **Quality:** 90% of materials at research-grade status
- 🚀 **Momentum:** Self-sustaining community growth

---

## 🔄 Integration with Future Phases

### Phase 11 (Potential): Regional Models

- **Leverage:** Locale-aware MIU tags (4.3) enable region-specific aggregations
- **Example:** "Recyclability score for PET in North America vs. Europe"
- **Data:** Phase 10's internationalization prepares for regional expansion

### Phase 12 (Potential): Predictive Analytics

- **Leverage:** Phase 10's advanced analytics (2.1) provide baseline metrics
- **Example:** "Predict which materials will achieve research-grade in next quarter"
- **ML Models:** Use reputation data to predict curator retention

### Phase 13 (Potential): Self-Assessment Tool

- **Leverage:** Practice mode (1.2) infrastructure can be adapted
- **Example:** Public users input material data, get estimated scores (not saved)
- **Conversion:** "Create account to contribute to WasteDB" call-to-action

---

## 📚 Related Documentation

### Phase 9 Deliverables (Prerequisites)
- `/docs/PHASE_9_EVIDENCE_PIPELINE.md` - Core curation system
- `/docs/PHASE_9_ADDENDUM_CRITICAL_INFRASTRUCTURE.md` - Critical infrastructure (Phase 9.0)
- `/docs/PHASE_9_0_IMPLEMENTATION_CHECKLIST.md` - Day-by-day Phase 9.0 plan

### Methodology Documents
- `/whitepapers/CR-v1.md` - Recyclability methodology
- `/whitepapers/CC-v1.md` - Compostability methodology
- `/whitepapers/RU-v1.md` - Reusability methodology
- `/whitepapers/Statistical_Methodology.md` - Aggregation math

### Platform Analysis
- `/docs/SIMILAR.md` - Comparative platform analysis (design influences)

---

## 🎉 Vision: WasteDB by End of Phase 10

**A globally recognized, community-driven, academically credible platform where:**

- 🌍 **50+ curators** from 3+ continents extract evidence in their native languages
- 🏆 **All 8 materials** achieve research-grade status with 100% parameter coverage
- 📚 **500+ MIUs** across all dimensions, fully traceable and reproducible
- 🎓 **Academic papers** cite WasteDB with DOI-minted releases
- 🎮 **Challenge campaigns** drive focused recruitment for low-coverage areas
- ⚡ **Sub-second API** serves thousands of research queries per day
- 📊 **Real-time dashboards** show platform health and curator impact
- 🎨 **Delightful UX** makes curation feel like contribution, not labor

**WasteDB becomes the de facto standard for materials sustainability data.**

---

**Last Updated:** November 12, 2025  
**Status:** Specification Complete  
**Next Action:** Complete Phase 9, then implement Phase 10 Workstream 1 (Contributor Experience)
