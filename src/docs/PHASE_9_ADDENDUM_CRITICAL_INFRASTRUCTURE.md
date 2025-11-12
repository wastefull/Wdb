# Phase 9 Addendum: Critical Infrastructure & Governance

**Status:** 🔴 MANDATORY  
**Source:** Phase9Changes.md pressure-test analysis  
**Integration:** Must be completed BEFORE Phase 9.1 begins  
**Last Updated:** November 12, 2025

---

## 🎯 Overview

This addendum specifies **11 critical infrastructure requirements** that must be implemented before any MIU extraction begins. These were identified through a comprehensive pressure-test of the Phase 9 specification and address:

- **Legal liability** (licensing, takedowns, COI)
- **Data integrity** (transform governance, validation)
- **Reproducibility** (policy snapshots, backups)
- **Security** (RLS hardening, signed URLs)
- **Operations** (observability, monitoring)

**These are non-negotiable for production launch.**

---

## 📋 Phase 9.0: Critical Infrastructure (NEW)

**Duration:** 1.5 weeks  
**Must complete BEFORE Phase 9.1**  
**Updated Timeline:** Phase 9 now 17.5 weeks (was 16 weeks)

This phase implements all 11 critical requirements in parallel with existing Phase 9 planning.

---

### **1. Legal & Licensing Policy** 🔴 CRITICAL

**Requirements:**
- ⬜ Publish MIU/snippet licensing policy
  - **Structured data (MIUs):** CC BY 4.0 license
  - **Verbatim snippets:** Fair use policy (< 250 words, properly cited)
  - **Screenshots:** Fair use + source attribution required
  - **Source PDFs:** Not redistributed (links only)
- ⬜ Add takedown process
  - Takedown request form (source URL, reason, contact)
  - Admin review workflow
  - "Restricted content" flag in source table
  - Email notification system
- ⬜ COI disclosure requirement
  - Add `conflict_of_interest` TEXT field to `evidence_points` table
  - Require declaration for industry-funded sources
  - Display COI badge on public Evidence tab
- ⬜ Data retention policy
  - MIUs: retained indefinitely (immutable record)
  - Screenshots: 7 years after last reference
  - Source PDFs: retained while MIUs reference them
  - Redaction flow for DMCA takedowns (preserve aggregations, remove snippets)

**Deliverables:**
- ⬜ `/legal/MIU_LICENSING_POLICY.md` document
- ⬜ `/legal/TAKEDOWN_PROCESS.md` document
- ⬜ Takedown request form at `/legal/takedown`
- ⬜ COI field in Evidence Wizard (Step 4: Confidence)
- ⬜ Retention schedule documented in admin guide

**Acceptance Criteria:**
- ✅ Licensing policy published and linked from footer
- ✅ Evidence Wizard requires license acknowledgment checkbox
- ✅ Takedown email address live (legal@wastedb.org)
- ✅ COI disclosure appears on public MIU cards when present
- ✅ Retention policy documented and automated archival scheduled

---

### **2. Transform Governance & Auto-Recompute** 🔴 CRITICAL

**Requirements:**
- ⬜ Versioned transforms
  - Create `/ontologies/transforms.json` with version history
  - Each transform includes: `id`, `parameter`, `formula`, `version`, `changelog`, `effective_date`
  - Store `transform_version` on every MIU (e.g., "Y_v1.0", "D_v1.1")
- ⬜ Auto-recompute job system
  - When transform version increments, queue recomputation jobs
  - Recompute all MIUs using that parameter's transform
  - Update `normalized_value` field with new version
  - Store both pre- and post-transform values for audit
  - Mark affected materials with `needs_refresh: true`
- ⬜ Impact tracking
  - Log which materials/parameters affected by transform change
  - Show "⚠️ Needs refresh" badge on material cards
  - Admin dashboard shows pending recompute queue
- ⬜ Changelog generation
  - Auto-generate transform changelog for releases
  - Include: parameter, old version, new version, reason, affected materials count

**Deliverables:**
- ⬜ `/ontologies/transforms.json` - Versioned transform definitions
- ⬜ `TransformVersionManager.tsx` - Admin UI for versioning
- ⬜ `POST /make-server-17cae920/transforms/recompute` - Queue recompute job
- ⬜ `RecomputeJobMonitor.tsx` - Admin dashboard for job status
- ⬜ Database job queue table: `public.recompute_jobs`

**Acceptance Criteria:**
- ✅ All MIUs have `transform_version` populated
- ✅ Transform change triggers recompute job automatically
- ✅ Recompute job processes all affected MIUs within 5 minutes
- ✅ Materials show "needs refresh" until aggregations updated
- ✅ Audit log shows pre/post values for transform changes

---

### **3. Controlled Vocabularies (Ontologies)** 🔴 CRITICAL

**Requirements:**
- ⬜ Create `/ontologies/units.json`
  - Units grouped by parameter
  - Conversion factors to canonical unit
  - Example: `{"Y": {"units": ["%", "ratio", "kg/kg"], "canonical": "ratio"}}`
- ⬜ Create `/ontologies/context.json`
  - **Process:** mechanical, chemical, thermal, biological, manual, automated
  - **Stream:** post-consumer, post-industrial, mixed, source-separated
  - **Region:** North America, Europe, Asia, Global, Other
  - **Scale:** lab, pilot, commercial, theoretical
- ⬜ Enforce in Evidence Wizard
  - Parameter dropdown → units dropdown auto-filters
  - Context tags use enums (no free-text drift)
  - Server-side validation rejects non-enum values
- ⬜ API documentation
  - `/api/ontologies/units` endpoint serves units JSON
  - `/api/ontologies/context` endpoint serves context JSON
  - Swagger/OpenAPI schema includes enum values

**Deliverables:**
- ⬜ `/ontologies/units.json` - Controlled unit vocabulary
- ⬜ `/ontologies/context.json` - Process/stream/region/scale enums
- ⬜ Evidence Wizard dropdowns enforce enums
- ⬜ Server-side validation middleware
- ⬜ API endpoints for ontology access

**Acceptance Criteria:**
- ✅ Evidence Wizard blocks non-enum values
- ✅ Server returns 400 error for invalid units/context
- ✅ Ontologies versioned (include `ontology_version` in aggregations)
- ✅ API docs show all enum options
- ✅ No free-text drift detected in MIU context fields

---

### **4. Validation Rules & Negative Evidence** 🔴 CRITICAL

**Requirements:**
- ⬜ **Server-side validation** (enforce before database write)
  - Locator required (page OR figure OR table)
  - Snippet required (min 20 characters, max 1000 characters)
  - Raw value must be numeric
  - Units must match parameter (from ontology)
  - If `derived: true`, formula field required
  - Transform version must exist in transforms.json
- ⬜ **Client-side validation** (real-time feedback in Wizard)
  - Red border + error message for invalid fields
  - "Required" indicator on mandatory fields
  - Character count for snippet field
  - Unit/parameter mismatch warning
- ⬜ **Negative evidence support**
  - Allow negative values (e.g., contamination limits, failure thresholds)
  - Add `evidence_type` ENUM: 'positive', 'negative', 'limit', 'threshold'
  - Negative MIUs shown in aggregation with appropriate sign/weight
  - Example: "Material fails recycling if contamination >10%"
- ⬜ **Formula validation** (for derived values)
  - Parse formula syntax (basic math expressions)
  - Validate variable references
  - Store assumptions in `formula_assumptions` TEXT field

**Deliverables:**
- ⬜ Server-side validation middleware (Hono)
- ⬜ Client-side Zod schemas for Evidence Wizard
- ⬜ `evidence_type` field added to schema
- ⬜ Formula parser utility (`parseFormula()`)
- ⬜ Validation error messages localized

**Acceptance Criteria:**
- ✅ Invalid MIU rejected by server with clear error message
- ✅ Client validation prevents submission of incomplete forms
- ✅ Negative evidence MIUs save successfully with correct sign
- ✅ Derived formulas validated for syntax errors
- ✅ 100% of MIUs pass validation rules in production

---

### **5. Security & RLS Hardening** 🔴 CRITICAL

**Requirements:**
- ⬜ **RLS policies verified**
  - Non-admins cannot edit/delete MIUs (read-only)
  - Contributors can create MIUs if enabled (future: curator role)
  - Admins can edit/delete MIUs with audit log
  - Test suite verifies RLS bypass attempts fail
- ⬜ **Signed URLs for file storage**
  - PDF URLs are signed (expiry: 1 hour)
  - Screenshot URLs are signed (expiry: 24 hours)
  - Non-guessable storage paths (`/sources/{uuid}/{hash}.pdf`)
  - Public bucket disabled, all files require auth
- ⬜ **Prevent source deletion if referenced**
  - Check `evidence_points.source_ref` before allowing delete
  - Return 409 Conflict with message: "Source referenced by X MIUs"
  - Soft delete option (mark `deleted: true`, hide from UI)
  - Admin override with confirmation dialog
- ⬜ **Audit logging**
  - Log all MIU create/edit/delete operations
  - Log source deletion attempts (success + failures)
  - Log aggregation computations
  - Admin dashboard shows recent audit events

**Deliverables:**
- ⬜ RLS policies tested and documented
- ⬜ Signed URL generation in server endpoints
- ⬜ Source deletion guard middleware
- ⬜ `public.audit_log` table
- ⬜ `AuditLogViewer.tsx` component

**Acceptance Criteria:**
- ✅ Non-admin MIU edit attempt fails with 403 Forbidden
- ✅ All PDF/screenshot URLs are signed
- ✅ Source deletion blocked if MIUs reference it
- ✅ Audit log captures all write operations
- ✅ Penetration test confirms no RLS bypasses

---

### **6. Deduplication (Minimum Viable)** 🔴 CRITICAL

**Requirements:**
- ⬜ **Source deduplication**
  - Exact match: same DOI or URL
  - Fuzzy match: title similarity >90% (Levenshtein distance)
  - Prompt before creating duplicate source
  - Merge UI: select primary source, redirect MIU references
- ⬜ **MIU deduplication**
  - Exact match: same `source_ref` + `locator` + `parameter` + `raw_value`
  - Near match: same source + locator + parameter, value within ε=0.05
  - Prompt before creating duplicate MIU
  - Allow override with justification (e.g., "Different extraction method")
- ⬜ **Duplicate detection UI**
  - "⚠️ Possible duplicate" warning in Evidence Wizard (Step 5)
  - Show existing MIU details
  - Actions: "Use existing" | "Create anyway" | "Cancel"

**Deliverables:**
- ⬜ `GET /make-server-17cae920/sources/check-duplicate?title={title}` endpoint
- ⬜ `GET /make-server-17cae920/evidence/check-duplicate` endpoint
- ⬜ `DuplicateWarningDialog.tsx` component
- ⬜ Source merge admin tool (`MergeSourcesDialog.tsx`)
- ⬜ Fuzzy matching utility (Levenshtein or similar)

**Acceptance Criteria:**
- ✅ Duplicate source warning appears if DOI/URL match
- ✅ Duplicate MIU warning appears if locator + value match
- ✅ Merge tool successfully redirects all MIU references
- ✅ No duplicate MIUs created without explicit override
- ✅ Fuzzy title matching catches >95% of duplicates in test set

---

### **7. Policy Snapshots on Every Aggregation** 🔴 CRITICAL

**Requirements:**
- ⬜ Store complete policy snapshot with each aggregation:
  - `transform_version` (per parameter)
  - `weight_policy_version` (e.g., "v1.0")
  - `codebook_version` (e.g., "v0.1")
  - `ontology_version` (e.g., "units_v1.0", "context_v1.0")
  - `miu_ids[]` (array of UUIDs)
  - `weights_used` (JSON object: `{miu_id: weight}`)
- ⬜ Research export includes snapshots
  - Exports show all versions used in aggregation
  - Replication script can reproduce results from snapshot
- ⬜ Version comparison UI
  - Show what changed between aggregation versions
  - Highlight policy differences causing value changes

**Deliverables:**
- ⬜ Extend `parameter_aggregations` table with version fields
- ⬜ `AggregationSnapshot.tsx` - Display snapshot details
- ⬜ Research export includes `aggregation_metadata` object
- ⬜ Replication notebook template (Python/R)

**Acceptance Criteria:**
- ✅ Every aggregation has complete version snapshot
- ✅ Research export includes all version metadata
- ✅ Replication script reproduces aggregation within 0.1% error
- ✅ Version comparison UI shows policy diffs
- ✅ No aggregations missing snapshot data

---

### **8. Minimal Observability** 🔴 CRITICAL

**Requirements:**
- ⬜ **Logging**
  - MIU create/update errors (validation failures, server errors)
  - Aggregation runtime (latency per material/parameter)
  - Recompute queue stats (pending, completed, failed)
  - Export generation time
  - Failed auth attempts
- ⬜ **Alerting**
  - CI width > 0.3 for any parameter
  - Aggregation stale >7 days (MIUs added but not recomputed)
  - Recompute job failed
  - Export generation failed
  - RLS violation attempts
- ⬜ **Dashboard**
  - Real-time error rate (last 24h)
  - Aggregation latency percentiles (p50, p90, p99)
  - Stale aggregations count
  - Failed jobs list
  - Alert history

**Deliverables:**
- ⬜ Server logging middleware (Winston or similar)
- ⬜ `ObservabilityDashboard.tsx` - Admin metrics view
- ⬜ Alert configuration (email/Slack webhooks)
- ⬜ Log aggregation (store in `public.system_logs` table)
- ⬜ Alert rules engine

**Acceptance Criteria:**
- ✅ All errors logged with timestamp, user, context
- ✅ At least one alert rule firing in test environment
- ✅ Dashboard accessible to admins at `/admin/observability`
- ✅ Alerts sent within 5 minutes of condition trigger
- ✅ Logs retained for 90 days

---

### **9. Backups & Release Snapshots** 🔴 CRITICAL

**Requirements:**
- ⬜ **Nightly database backups**
  - Automated Supabase backup (managed)
  - Custom backup script for `evidence_points`, `parameter_aggregations`, `releases`
  - Store in separate Supabase bucket: `make-17cae920-backups`
  - Retention: 7 daily, 4 weekly, 12 monthly
- ⬜ **Verified restore drill**
  - Quarterly restore test (documented procedure)
  - Restore to staging environment
  - Verify data integrity (count MIUs, check aggregations)
  - Document restore time (target: <1 hour)
- ⬜ **Immutable release artifacts**
  - Checksummed export bundles (SHA-256)
  - Store in `make-17cae920-releases` bucket
  - Publish checksum with release
  - Never delete or modify release artifacts
- ⬜ **Release manifest**
  - JSON file with: version, date, material_count, miu_count, file_checksums

**Deliverables:**
- ⬜ Backup automation script (Deno cron or GitHub Actions)
- ⬜ Restore procedure documentation (`/docs/RESTORE_PROCEDURE.md`)
- ⬜ Release artifact checksum generator
- ⬜ Release manifest schema
- ⬜ Backup monitoring (alert if backup fails)

**Acceptance Criteria:**
- ✅ Nightly backups run automatically without errors
- ✅ Restore drill documented and successful
- ✅ Release artifacts checksummed and immutable
- ✅ Checksum verification passes for all releases
- ✅ Backup failure triggers immediate alert

---

### **10. Export Completeness** 🔴 CRITICAL

**Requirements:**
- ⬜ **Public CSV export** (0-100 scores)
  - Material name, category, CR/CC/RU scores
  - Practical vs. Theoretical columns
  - Evidence count per dimension
  - Research-grade status badge
- ⬜ **Research JSON export** (full provenance)
  - Normalized parameters (0-1 scale) with CI95
  - `miu_ids[]` array for each parameter
  - `source_refs[]` list with DOI/URL
  - Aggregation metadata: versions, weights, timestamp
  - Evidence counts and quality scores
  - Curator credits (opt-in attribution)
- ⬜ **Schema documentation**
  - JSON Schema for research export
  - CSV column definitions
  - Example files with annotations
- ⬜ **Validation**
  - Automated checks: export matches stored aggregations
  - No missing fields
  - All MIU IDs valid (no orphans)

**Deliverables:**
- ⬜ Updated `/export/public` endpoint (CSV)
- ⬜ Updated `/export/full` endpoint (research JSON)
- ⬜ `/docs/EXPORT_SCHEMA.md` documentation
- ⬜ Export validation tests
- ⬜ Example export files

**Acceptance Criteria:**
- ✅ Public CSV exports all 8 materials with complete scores
- ✅ Research JSON includes all required provenance fields
- ✅ Validation tests pass (100% data integrity)
- ✅ Schema documentation published and accurate
- ✅ Example exports match schema exactly

---

### **11. OA Triage & Curation Queue** 🔴 CRITICAL

**Requirements:**
- ⬜ **Open Access status surfaced**
  - Display `access_status` badge in curation queue
  - Filter: "Open Access Only" checkbox
  - Sort by access status (OA first)
- ⬜ **Curation queue features**
  - Show materials with <3 MIUs per parameter (prioritize)
  - Evidence heatmap: green (≥3 MIUs), yellow (1-2), red (0)
  - Filter by dimension (CR / CC / RU)
  - Filter by material category
  - "Double extraction needed" flag for validation
- ⬜ **Volunteer workflow optimization**
  - "Claim material" button (assign to curator)
  - Time estimate per material (based on parameter count)
  - Progress tracker (X/Y parameters completed)

**Deliverables:**
- ⬜ `CurationQueue.tsx` - Triage dashboard
- ⬜ `EvidenceHeatmap.tsx` - Visual coverage matrix
- ⬜ `GET /make-server-17cae920/queue` endpoint
- ⬜ Filter and sort controls
- ⬜ "Claim material" workflow

**Acceptance Criteria:**
- ✅ OA filter reduces queue to open-access sources only
- ✅ Heatmap accurately shows parameter coverage
- ✅ Curators can claim and track assigned materials
- ✅ Queue sorts by priority (low coverage first)
- ✅ No extra clicks required to focus on OA sources

---

## ✅ Phase 9.0 Completion Criteria

Phase 9.0 is complete when ALL 11 requirements pass:

1. ✅ **Legal:** Licensing policy published, takedown process live, COI field added
2. ✅ **Transforms:** Versioning system works, auto-recompute jobs functional
3. ✅ **Ontologies:** Units & context enums enforced, no free-text drift
4. ✅ **Validation:** Server + client validation blocks invalid MIUs, negative evidence supported
5. ✅ **Security:** RLS verified, signed URLs used, source deletion guarded, audit log active
6. ✅ **Dedup:** Source + MIU duplicate detection prompts before save
7. ✅ **Snapshots:** All aggregations include complete version metadata
8. ✅ **Observability:** Logging active, at least 2 alert rules firing in test
9. ✅ **Backups:** Nightly backups verified, restore drill documented
10. ✅ **Exports:** Public CSV + research JSON include all required fields, validation passes
11. ✅ **OA Triage:** Queue filters OA sources, heatmap shows coverage gaps

---

## 📊 Updated Phase 9 Timeline

### Original Timeline: 16 weeks
### Updated Timeline: 17.5 weeks

**Phase 9.0: Critical Infrastructure** (NEW)  
- Duration: 1.5 weeks  
- Must complete before any MIU extraction

**Phase 9.1: Database Schema & Backend**  
- Duration: 2.5 weeks  
- Depends on: Phase 9.0 complete

**Phase 9.2: Curation Workbench (Pilot)**  
- Duration: 3.5 weeks  
- Depends on: Phase 9.1 complete

**Phase 9.3: Aggregation Engine**  
- Duration: 2 weeks  
- Depends on: Phase 9.2 complete

**Phase 9.4: Scale to All Dimensions**  
- Duration: 4 weeks  
- Depends on: Phase 9.3 validate

**Phase 9.5: Public Evidence Layer**  
- Duration: 4 weeks  
- Depends on: Phase 9.4 complete

**Total: 17.5 weeks (~4.5 months)**

---

## 🚀 Phase 10 Preview

Features deferred to Phase 10 (per Phase9Changes.md):

### **Contributor Experience**
- ⬜ OCR + highlight assist in PDF viewer
- ⬜ Practice mode with sample PDFs and instant feedback
- ⬜ Challenge prompts ("Close the PET gap" campaigns)
- ⬜ Rich provenance UI (inline "why this MIU matters" summaries)

### **Analytics & Monitoring**
- ⬜ Full observability suite with dashboards
- ⬜ Performance analytics and optimization
- ⬜ API rate-limit polish (ETag/Last-Modified)

### **Publication & Outreach**
- ⬜ Research-grade rubric public page (transparent promotion criteria)
- ⬜ DOI/DataCite minting for releases
- ⬜ Academic citation guides

### **Internationalization**
- ⬜ i18n for Evidence tab labels
- ⬜ Parameter names and tooltips localization
- ⬜ MIU snippets with locale tags

### **Community Growth**
- ⬜ Reputation mechanics and contributor badges
- ⬜ Community campaigns and gamification
- ⬜ Curator training videos and interactive tutorials

---

## 📝 Integration Instructions

To integrate this addendum into the main Phase 9 document:

1. Insert Phase 9.0 BEFORE Phase 9.1 in the main document
2. Update timeline from 16 weeks → 17.5 weeks
3. Add "Critical Infrastructure (All Phases)" section to rollout strategy
4. Reference Phase9Changes.md as source document
5. Update completion criteria to include Phase 9.0 requirements

---

**This document is MANDATORY reading for all Phase 9 implementers.**  
**No MIU extraction begins until Phase 9.0 requirements are met.**

---

**Last Updated:** November 12, 2025  
**Status:** Specification Complete  
**Next Action:** Begin Phase 9.0 implementation after Phase 8 completion
