# Phase 9.0 Implementation Checklist: Critical Infrastructure

**Status:** 🔴 MANDATORY  
**Duration:** 1.5 weeks (10 working days)  
**Must Complete BEFORE Phase 9.1**  
**Source:** Comprehensive pressure-test analysis  
**Last Updated:** November 12, 2025

---

## Overview

This checklist provides a **day-by-day implementation plan** for the 11 critical infrastructure requirements that must be completed before any MIU extraction begins.

### Priority Matrix

| Week   | Days      | Focus Areas                                                   | Critical Path         |
| ------ | --------- | ------------------------------------------------------------- | --------------------- |
| Week 1 | Days 1-5  | Legal, Transforms, Ontologies, Security                       | High-risk items first |
| Week 2 | Days 6-10 | Validation, Dedup, Observability, Backups, Exports, OA Triage | Integration & testing |

---

## 📋 Week 1: Foundation (Days 1-5)

### **Day 1: Legal & Licensing Policy** 🔴

**Goal:** Establish legal framework for MIU/snippet usage

#### Morning (4 hours)

- [ ] Draft `/legal/MIU_LICENSING_POLICY.md`
  - CC BY 4.0 for structured MIU data
  - Fair use policy for snippets (<250 words)
  - Screenshot attribution requirements
  - PDF redistribution prohibition
- [ ] Draft `/legal/TAKEDOWN_PROCESS.md`
  - Request form template
  - Admin review workflow (72-hour response SLA)
  - Redaction procedure (preserve aggregations, remove snippets)

#### Afternoon (4 hours)

- [ ] Create takedown request form page `/legal/takedown`
  - Fields: source_url, reason, contact_email, description
  - CAPTCHA protection
  - Email notification to legal@wastedb.org
- [ ] Add `conflict_of_interest` TEXT field to `evidence_points` table
  - Migration script
  - Default value: NULL (no COI)
  - UI field in Evidence Wizard Step 4

#### Evening (1 hour) - Testing

- [ ] Test takedown form submission
- [ ] Verify email notification sent
- [ ] Confirm COI field saves correctly

**Acceptance Criteria:**

- ✅ Both legal documents published and accessible
- ✅ Takedown form functional
- ✅ COI field added to database

---

### **Day 2: Transform Governance** 🔴

**Goal:** Implement versioned transforms and auto-recompute system

#### Morning (4 hours)

- [ ] Create `/ontologies/transforms.json`
  ```json
  {
    "version": "1.0",
    "transforms": [
      {
        "id": "Y_v1.0",
        "parameter": "Y",
        "formula": "value / 100",
        "description": "Convert percentage to ratio",
        "version": "1.0",
        "effective_date": "2025-11-12",
        "changelog": "Initial version"
      }
      // ... all 13 parameters
    ]
  }
  ```
- [ ] Create `public.recompute_jobs` table
  - Columns: id, parameter, transform_version_old, transform_version_new, status, created_at, completed_at, affected_mius_count

#### Afternoon (4 hours)

- [ ] Implement `POST /make-server-17cae920/transforms/recompute` endpoint
  - Accept: parameter, new_transform_version
  - Query all MIUs with old transform_version for that parameter
  - Queue recomputation job
  - Return: job_id, estimated_duration
- [ ] Create `TransformVersionManager.tsx` admin UI
  - Display current transforms
  - Edit formula (with confirmation warning)
  - Trigger recompute button

#### Evening (1 hour) - Testing

- [ ] Test recompute job with 10 sample MIUs
- [ ] Verify audit log shows pre/post values
- [ ] Confirm "needs refresh" badge appears on materials

**Acceptance Criteria:**

- ✅ transforms.json populated for all 13 parameters
- ✅ Recompute job processes MIUs correctly
- ✅ Audit trail captures transform changes

---

### **Day 3: Controlled Vocabularies & Validation** 🔴

**Goal:** Enforce ontologies and validation rules

#### Morning (4 hours)

- [ ] Create `/ontologies/units.json`
  ```json
  {
    "Y": {
      "canonical": "ratio",
      "units": ["%", "ratio", "kg/kg"],
      "conversions": {
        "%": "divide by 100",
        "ratio": "identity",
        "kg/kg": "identity"
      }
    }
    // ... all 13 parameters
  }
  ```
- [ ] Create `/ontologies/context.json`
  ```json
  {
    "process": [
      "mechanical",
      "chemical",
      "thermal",
      "biological",
      "manual",
      "automated"
    ],
    "stream": ["post-consumer", "post-industrial", "mixed", "source-separated"],
    "region": ["North America", "Europe", "Asia", "Global", "Other"],
    "scale": ["lab", "pilot", "commercial", "theoretical"]
  }
  ```
- [ ] Create API endpoints:
  - `GET /make-server-17cae920/ontologies/units`
  - `GET /make-server-17cae920/ontologies/context`

#### Afternoon (4 hours)

- [ ] Implement server-side validation middleware
  - Check locator (page OR figure OR table required)
  - Check snippet (min 20 chars, max 1000 chars)
  - Check raw_value is numeric
  - Check units match parameter (from ontology)
  - Check transform_version exists
  - Return 400 with detailed error message if validation fails
- [ ] Implement client-side Zod schemas
  - Real-time validation in Evidence Wizard
  - Red border + error message on invalid fields
  - Character counter for snippet field

#### Evening (1 hour) - Testing

- [ ] Test invalid MIU submission (should fail with 400)
- [ ] Test valid MIU submission (should succeed)
- [ ] Verify units dropdown auto-filters by parameter

**Acceptance Criteria:**

- ✅ Ontologies enforce enum values
- ✅ Server rejects invalid MIUs
- ✅ Client shows real-time validation errors

---

### **Day 4: Security & RLS Hardening** 🔴

**Goal:** Secure data access and prevent unauthorized modifications

#### Morning (4 hours)

- [ ] Implement RLS policies for `evidence_points`

  ```sql
  -- Read: all authenticated users
  CREATE POLICY "evidence_read" ON evidence_points
    FOR SELECT USING (true);

  -- Create: admin only
  CREATE POLICY "evidence_create" ON evidence_points
    FOR INSERT WITH CHECK (
      auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')
    );

  -- Update/Delete: admin only
  CREATE POLICY "evidence_update" ON evidence_points
    FOR UPDATE USING (
      auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')
    );
  ```

- [ ] Create RLS test suite (Vitest or similar)
  - Test non-admin cannot edit MIU (expect 403)
  - Test non-admin cannot delete MIU (expect 403)
  - Test admin can edit/delete MIU (expect 200)

#### Afternoon (4 hours)

- [ ] Implement signed URLs for file storage
  - `GET /make-server-17cae920/sources/{id}/pdf` returns signed URL (1-hour expiry)
  - `GET /make-server-17cae920/evidence/{id}/screenshot` returns signed URL (24-hour expiry)
  - Use non-guessable storage paths: `/sources/{uuid}/{hash}.pdf`
- [ ] Implement source deletion guard
  - Check if source is referenced by MIUs before allowing delete
  - Return 409 Conflict: "Source referenced by X MIUs"
  - Add soft delete option (mark `deleted: true`)
- [ ] Create `public.audit_log` table
  - Columns: id, action, table_name, record_id, user_id, old_value, new_value, timestamp
  - Trigger on INSERT/UPDATE/DELETE for evidence_points

#### Evening (1 hour) - Testing

- [ ] Test signed URL expiry (should fail after timeout)
- [ ] Test source deletion guard (should block if MIUs exist)
- [ ] Verify audit log captures all write operations

**Acceptance Criteria:**

- ✅ RLS test suite passes (non-admin blocked, admin allowed)
- ✅ All PDF/screenshot URLs are signed
- ✅ Source deletion blocked when referenced

---

### **Day 5: Policy Snapshots & Deduplication** 🔴

**Goal:** Ensure reproducibility and prevent duplicate data

#### Morning (4 hours)

- [ ] Extend `parameter_aggregations` table
  - Add columns: `transform_version`, `weight_policy_version`, `codebook_version`, `ontology_version`, `weights_used` (JSONB)
  - Migration script
- [ ] Update aggregation computation endpoint
  - Store complete version snapshot with each aggregation
  - Include `miu_ids[]` array
  - Include `weights_used` JSON: `{miu_id: weight}`
- [ ] Create `AggregationSnapshot.tsx` display component
  - Show all versions used
  - Link to transforms.json, weight policy, codebook

#### Afternoon (4 hours)

- [ ] Implement source deduplication
  - `GET /make-server-17cae920/sources/check-duplicate?doi={doi}&title={title}`
  - Exact match: DOI or URL
  - Fuzzy match: title similarity >90% (Levenshtein distance)
  - Return: array of potential duplicates with similarity scores
- [ ] Implement MIU deduplication
  - `GET /make-server-17cae920/evidence/check-duplicate?source_ref={id}&locator={loc}&parameter={param}&value={val}`
  - Exact match: same source + locator + parameter + value
  - Near match: value within ε=0.05
  - Return: array of potential duplicates
- [ ] Create `DuplicateWarningDialog.tsx`
  - Show existing MIU details
  - Actions: "Use existing" | "Create anyway" | "Cancel"

#### Evening (1 hour) - Testing

- [ ] Test policy snapshot saves correctly
- [ ] Test duplicate detection (should warn on match)
- [ ] Test duplicate override (should allow with justification)

**Acceptance Criteria:**

- ✅ Aggregations include complete version snapshots
- ✅ Duplicate warnings appear appropriately
- ✅ Override with justification allowed

---

## 📋 Week 2: Integration & Polish (Days 6-10)

### **Day 6: Observability Infrastructure** 🔴

**Goal:** Implement logging, alerting, and monitoring dashboard

#### Morning (4 hours)

- [ ] Set up logging middleware (Winston)
  - Log all MIU create/update/delete operations
  - Log aggregation computations with latency
  - Log recompute queue stats
  - Log export generation time
  - Log failed auth attempts
- [ ] Create `public.system_logs` table
  - Columns: id, level (info/warn/error), message, context (JSONB), timestamp
  - Retention: 90 days (auto-delete old logs)

#### Afternoon (4 hours)

- [ ] Implement alert rules
  - CI width > 0.3 for any parameter
  - Aggregation stale >7 days
  - Recompute job failed
  - Export generation failed
  - RLS violation attempts
- [ ] Configure alert notifications
  - Email alerts (use RESEND_API_KEY)
  - Alert template with context details
- [ ] Create `ObservabilityDashboard.tsx`
  - Real-time error rate (last 24h)
  - Aggregation latency percentiles (p50, p90, p99)
  - Stale aggregations count
  - Failed jobs list
  - Alert history

#### Evening (1 hour) - Testing

- [ ] Trigger test alert (e.g., manually set CI width >0.3)
- [ ] Verify email sent within 5 minutes
- [ ] Check dashboard displays metrics correctly

**Acceptance Criteria:**

- ✅ All operations logged with context
- ✅ At least one alert rule fires in test environment
- ✅ Dashboard accessible at `/admin/observability`

---

### **Day 7: Backups & Release Snapshots** 🔴

**Goal:** Implement automated backups and immutable releases

#### Morning (4 hours)

- [ ] Create nightly backup script (Deno cron)

  ```typescript
  // backup-cron.ts
  import { createClient } from "@supabase/supabase-js";

  async function backupEvidenceData() {
    const supabase = createClient(/*...*/);

    // Export evidence_points table
    const { data: mius } = await supabase.from("evidence_points").select("*");

    // Export parameter_aggregations table
    const { data: aggregations } = await supabase
      .from("parameter_aggregations")
      .select("*");

    // Create backup bundle
    const backup = {
      timestamp: new Date().toISOString(),
      mius,
      aggregations,
    };

    // Upload to backup bucket
    await supabase.storage
      .from("make-17cae920-backups")
      .upload(`backup-${Date.now()}.json`, JSON.stringify(backup));
  }

  // Schedule daily at 2 AM UTC
  Deno.cron("nightly-backup", "0 2 * * *", backupEvidenceData);
  ```

- [ ] Configure backup retention (7 daily, 4 weekly, 12 monthly)
- [ ] Set up backup failure alert

#### Afternoon (4 hours)

- [ ] Create restore procedure documentation `/docs/RESTORE_PROCEDURE.md`
  - Step-by-step restore from backup
  - Data integrity verification steps
  - Target: <1 hour restore time
- [ ] Implement release artifact checksumming
  - Generate SHA-256 checksum for each export file
  - Store in `make-17cae920-releases` bucket
  - Create release manifest JSON with checksums
- [ ] Create `ReleaseManager.tsx` UI
  - Create new release button
  - Select materials to include
  - Generate changelog (compare to previous release)
  - Export snapshot (CSV/JSON)
  - Publish release (make available via API)

#### Evening (1 hour) - Testing

- [ ] Test backup script runs successfully
- [ ] Test checksum generation and verification
- [ ] Perform test restore to verify procedure

**Acceptance Criteria:**

- ✅ Nightly backup runs without errors
- ✅ Restore procedure documented and tested
- ✅ Release artifacts checksummed

---

### **Day 8: Export Completeness** 🔴

**Goal:** Ensure exports include all required provenance fields

#### Morning (4 hours)

- [ ] Update `GET /make-server-17cae920/export/public` (CSV)
  - Columns: material_name, category, CR_score, CC_score, RU_score, CR_practical, CR_theoretical, CC_practical, CC_theoretical, RU_practical, RU_theoretical, evidence_count_CR, evidence_count_CC, evidence_count_RU, research_grade_status
  - Generate CSV from materials table
  - Add evidence counts per dimension
- [ ] Update `GET /make-server-17cae920/export/full` (Research JSON)
  ```json
  {
    "version": "v2026.Q1",
    "generated_at": "2025-11-12T10:30:00Z",
    "materials": [
      {
        "id": "...",
        "name": "Aluminum",
        "category": "Metals",
        "evidence_status": "research-grade",
        "evidence_quality_score": 92,
        "parameters": {
          "Y": {
            "normalized_value": 0.85,
            "CI95": [0.82, 0.88],
            "miu_ids": ["uuid1", "uuid2", "uuid3"],
            "source_refs": ["ref1", "ref2"],
            "aggregation_metadata": {
              "transform_version": "Y_v1.0",
              "weight_policy_version": "v1.0",
              "codebook_version": "v0.1",
              "weights_used": { "uuid1": 1.0, "uuid2": 0.8 },
              "computed_at": "2025-11-10T14:20:00Z"
            }
          }
          // ... other parameters
        },
        "curator_credits": ["Alice Smith", "Bob Jones"]
      }
    ]
  }
  ```

#### Afternoon (4 hours)

- [ ] Create `/docs/EXPORT_SCHEMA.md` documentation
  - CSV column definitions
  - JSON Schema for research export
  - Example files with annotations
- [ ] Implement export validation tests
  - Check export matches stored aggregations
  - Check no missing fields
  - Check all MIU IDs valid (no orphans)
- [ ] Create example export files
  - `example-public-export.csv`
  - `example-research-export.json`

#### Evening (1 hour) - Testing

- [ ] Run export validation tests (should pass 100%)
- [ ] Manually inspect example exports
- [ ] Verify schema documentation matches actual exports

**Acceptance Criteria:**

- ✅ Public CSV includes all required columns
- ✅ Research JSON includes all provenance fields
- ✅ Validation tests pass

---

### **Day 9: OA Triage & Curation Queue** 🔴

**Goal:** Surface open access sources and prioritize curation work

#### Morning (4 hours)

- [ ] Create `GET /make-server-17cae920/queue` endpoint
  - Return materials with <3 MIUs per parameter
  - Include evidence coverage matrix (parameter × material)
  - Include source access_status for each material's sources
  - Sort by priority (lowest coverage first)
- [ ] Create `CurationQueue.tsx` dashboard
  - Filter: "Open Access Only" checkbox
  - Filter: dimension (CR / CC / RU)
  - Filter: material category
  - Sort: access status (OA first), coverage (low first)
  - "Claim material" button
- [ ] Create `EvidenceHeatmap.tsx` component
  - Visual matrix: rows = materials, columns = parameters
  - Color code: green (≥3 MIUs), yellow (1-2), red (0)
  - Click cell → show existing MIUs for that material/parameter

#### Afternoon (4 hours)

- [ ] Implement "Claim material" workflow
  - Add `claimed_by` user_id to materials table (nullable)
  - Add `claimed_at` timestamp
  - Auto-unclaim after 7 days of inactivity
  - Show "Claimed by @username" badge on material cards
- [ ] Add time estimate per material
  - Formula: uncovered_parameters_count × 3 min/MIU × 3 MIUs = estimated_minutes
  - Display: "Estimated: 45 min"
- [ ] Add progress tracker
  - "X/Y parameters completed" on claimed materials
  - Progress bar visual

#### Evening (1 hour) - Testing

- [ ] Test OA filter reduces queue correctly
- [ ] Test claim workflow (claim, release, auto-unclaim)
- [ ] Verify heatmap displays coverage accurately

**Acceptance Criteria:**

- ✅ OA filter functional
- ✅ Heatmap shows coverage gaps
- ✅ Claim workflow prevents double work

---

### **Day 10: Integration Testing & Documentation** ✅

**Goal:** Verify all 11 requirements work together and document

#### Morning (4 hours)

- [ ] End-to-end integration test
  1. Create new source (test deduplication warning)
  2. Create new MIU (test validation, ontologies, COI field, signed URLs)
  3. Create duplicate MIU (test duplicate warning)
  4. Update transform (test auto-recompute job)
  5. Compute aggregation (test policy snapshot)
  6. Generate exports (test completeness)
  7. View observability dashboard (test logging)
  8. Test takedown request flow
  9. Test backup/restore procedure
  10. Test curation queue and claim workflow
  11. Test RLS policies (non-admin attempt to edit MIU)

#### Afternoon (4 hours)

- [ ] Create `/docs/PHASE_9_0_COMPLETE.md` summary document
  - All 11 requirements completed
  - Test results and acceptance criteria met
  - Known issues / technical debt
  - Handoff notes for Phase 9.1
- [ ] Update main Phase 9 document references
- [ ] Create training materials for Phase 9.0 features
  - Admin guide: Transform management
  - Admin guide: Observability dashboard
  - Admin guide: Backup/restore procedures
  - Legal guide: Takedown process
  - Curator guide: Ontologies and validation

#### Evening (1-2 hours) - Final Review

- [ ] Review checklist: All 11 requirements ✅
- [ ] Stakeholder demo of critical infrastructure
- [ ] Get approval to proceed to Phase 9.1

**Final Acceptance Criteria:**

- ✅ All 11 requirements pass individual tests
- ✅ End-to-end integration test passes
- ✅ Documentation complete
- ✅ Stakeholder approval received

---

## ✅ Phase 9.0 Completion Checklist

Phase 9.0 is complete when ALL of the following are TRUE:

### Legal & Licensing

- [ ] MIU_LICENSING_POLICY.md published and linked from footer
- [ ] TAKEDOWN_PROCESS.md published
- [ ] Takedown form functional at /legal/takedown
- [ ] COI field added to evidence_points table
- [ ] Evidence Wizard includes COI input (Step 4)

### Transform Governance

- [ ] transforms.json created with all 13 parameters
- [ ] recompute_jobs table exists
- [ ] Auto-recompute endpoint functional
- [ ] TransformVersionManager UI operational
- [ ] Audit log captures pre/post transform values

### Controlled Vocabularies

- [ ] units.json created and served via API
- [ ] context.json created and served via API
- [ ] Evidence Wizard enforces enums
- [ ] Server validation rejects invalid enums

### Validation

- [ ] Server-side validation middleware active
- [ ] Client-side Zod schemas implemented
- [ ] evidence_type field supports negative evidence
- [ ] Formula parser validates derived values

### Security

- [ ] RLS policies tested and passing
- [ ] Signed URLs implemented for PDFs/screenshots
- [ ] Source deletion guard prevents orphaning MIUs
- [ ] audit_log table captures all write operations

### Deduplication

- [ ] Source duplicate detection endpoint functional
- [ ] MIU duplicate detection endpoint functional
- [ ] DuplicateWarningDialog appears appropriately
- [ ] Merge tool redirects MIU references correctly

### Policy Snapshots

- [ ] parameter_aggregations table extended with version fields
- [ ] Aggregations save complete policy snapshots
- [ ] Research export includes aggregation_metadata

### Observability

- [ ] Logging middleware active
- [ ] At least 2 alert rules firing in test environment
- [ ] ObservabilityDashboard accessible at /admin/observability
- [ ] system_logs table retains 90 days

### Backups

- [ ] Nightly backup script scheduled and tested
- [ ] RESTORE_PROCEDURE.md documented
- [ ] Release artifacts checksummed (SHA-256)
- [ ] Backup failure alert configured

### Exports

- [ ] Public CSV includes all required columns
- [ ] Research JSON includes miu_ids and aggregation_metadata
- [ ] EXPORT_SCHEMA.md documentation published
- [ ] Export validation tests pass

### OA Triage

- [ ] Curation queue accessible with OA filter
- [ ] EvidenceHeatmap displays coverage matrix
- [ ] Claim material workflow functional
- [ ] Queue sorts by priority (OA first, low coverage first)

---

## Handoff to Phase 9.1

Once all checkboxes above are completed:

1. **Schedule kickoff meeting** for Phase 9.1 (Database Schema & Backend)
2. **Archive Phase 9.0 documentation** in `/docs/archive/`
3. **Update project board** to mark Phase 9.0 as COMPLETE
4. **Begin Phase 9.1 implementation** with confidence that critical infrastructure is solid

---

**Last Updated:** November 12, 2025  
**Status:** Implementation Checklist  
**Next Action:** Begin Day 1 (Legal & Licensing Policy) after Phase 8 completion
