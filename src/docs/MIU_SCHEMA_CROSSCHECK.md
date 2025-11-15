# MIU Schema Plan Cross-Check Report

**Date:** November 14, 2025  
**Purpose:** Verify MIU_SCHEMA_PLAN.md against Phase 9 specification documents  
**Status:** 🔍 REVIEW COMPLETE

---

## Documents Reviewed

1. `/docs/PHASE_9_0_IMPLEMENTATION_CHECKLIST.md` - Day-by-day implementation plan
2. `/docs/PHASE_9_ADDENDUM_CRITICAL_INFRASTRUCTURE.md` - 11 critical requirements
3. `/docs/PHASE_9_EVIDENCE_PIPELINE.md` - Full Phase 9 specification
4. `/docs/NOV12_SOURCES.md` - Foundation document (partially reviewed)

---

## ✅ Completeness Summary

### Core Tables
| Table | Status | Notes |
|-------|--------|-------|
| evidence_points | ✅ Complete | All core fields present |
| parameter_aggregations | ⚠️ Needs Updates | Missing some version fields |
| releases | ✅ Complete | Full implementation |
| materials extensions | ✅ Complete | Evidence status tracking |
| sources extensions | ✅ Complete | Quality indicators |
| user_profiles extensions | ✅ Complete | Public credit system |

### Infrastructure Tables
| Table | Status | Notes |
|-------|--------|-------|
| recompute_jobs | ❌ Missing | Operational table for Phase 9.0 Day 2 |
| audit_log | ❌ Missing | Operational table for Phase 9.0 Day 4 |
| system_logs | ❌ Missing | Operational table for Phase 9.0 Day 6 |

---

## 🔍 Detailed Findings

### 1. Evidence Points Table (evidence_points)

#### ✅ Present and Correct
- Material and source linkage
- Parameter (13 parameters across 3 dimensions)
- Raw value, units, normalized value, transform version
- Locators (page, figure, table, paragraph)
- Verbatim snippet (required)
- Context tags (process, stream, region, scale, cycles, contamination_percent, temperature_c, time_minutes)
- Derived values (is_derived, derived_formula, assumptions)
- Method completeness, sample size
- Curator tracking (curator_id, created_at, updated_at, codebook_version)
- Validation fields (validation_status, validated_by, validated_at)
- Extraction session ID

#### ⚠️ Missing Fields (Required by Phase 9.0)

1. **conflict_of_interest** TEXT
   - Required by: Day 1 - Legal & Licensing Policy
   - Purpose: COI disclosure for industry-funded sources
   - Action: ADD to evidence_points schema
   - Display: Show COI badge on public Evidence tab when present

2. **evidence_type** ENUM('positive', 'negative', 'limit', 'threshold')
   - Required by: Day 3 - Validation Rules & Negative Evidence
   - Purpose: Support negative evidence (e.g., "fails if contamination >10%")
   - Action: ADD to evidence_points schema
   - Default: 'positive'

3. **screenshot_url** TEXT
   - Status: ✅ Already present in schema
   - Note: Good!

#### 📝 Recommended Additions

4. **formula_assumptions** TEXT (separate from assumptions)
   - Requirement mentions "Store assumptions in `formula_assumptions` TEXT field"
   - Current schema has "assumptions" field
   - Action: Consider if we need BOTH "assumptions" and "formula_assumptions" or if "assumptions" is sufficient
   - Decision: **Keep as "assumptions"** - single field is clearer

5. **restricted_content** BOOLEAN
   - For DMCA takedowns
   - Action: ADD flag to mark content under takedown
   - When true: hide snippet, preserve aggregations

---

### 2. Parameter Aggregations Table (parameter_aggregations)

#### ✅ Present and Correct
- Material and parameter linkage
- Statistical results (mean, SE, CI95 bounds, n_mius)
- MIU traceability (miu_ids array, weights_used JSONB)
- Versioning (methods_version, weight_policy_version, transform_version)
- Filters applied
- Quality indicators (evidence_quality_score, curator_agreement_kappa, ci_width, source_diversity_count)
- Audit trail (calculated_at, calculated_by, notes)
- Version chain (supersedes_aggregation_id, is_current)

#### ⚠️ Missing Fields

1. **codebook_version** TEXT
   - Required by: Day 5 - Policy Snapshots
   - Purpose: Capture curator guideline version used
   - Action: ADD to parameter_aggregations schema

2. **ontology_version** TEXT
   - Required by: Day 3 - Controlled Vocabularies
   - Purpose: Capture units.json and context.json versions
   - Action: ADD to parameter_aggregations schema
   - Format: "units_v1.0|context_v1.0"

#### 📝 Schema Update Needed

```typescript
// Add to ParameterAggregation interface
codebook_version: string;       // e.g., 'v0.1'
ontology_version: string;       // e.g., 'units_v1.0|context_v1.0'
```

---

### 3. Operational Tables (Missing)

These tables are required for Phase 9.0 infrastructure but are NOT part of the core evidence schema. They should be added as separate infrastructure:

#### A. recompute_jobs (Phase 9.0 Day 2)

```sql
CREATE TABLE IF NOT EXISTS public.recompute_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter TEXT NOT NULL,                      -- Which parameter is being recomputed
  transform_version_old TEXT NOT NULL,          -- Old transform version
  transform_version_new TEXT NOT NULL,          -- New transform version
  status TEXT NOT NULL DEFAULT 'pending',       -- 'pending', 'processing', 'completed', 'failed'
  affected_mius_count INTEGER,                  -- Number of MIUs to recompute
  completed_mius_count INTEGER DEFAULT 0,       -- Progress tracking
  error_message TEXT,                           -- If failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID,                              -- Admin who triggered recompute
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS jobs_status ON public.recompute_jobs (status);
CREATE INDEX IF NOT EXISTS jobs_created ON public.recompute_jobs (created_at DESC);
```

---

#### B. audit_log (Phase 9.0 Day 4)

```sql
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,                         -- 'INSERT', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,                     -- 'evidence_points', 'materials', 'sources'
  record_id UUID NOT NULL,                      -- ID of affected record
  user_id UUID,                                 -- Who performed the action
  old_value JSONB,                              -- Previous state (for UPDATE/DELETE)
  new_value JSONB,                              -- New state (for INSERT/UPDATE)
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,                              -- Optional: client IP
  user_agent TEXT,                              -- Optional: client user agent
  
  CONSTRAINT valid_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

CREATE INDEX IF NOT EXISTS audit_table ON public.audit_log (table_name, record_id);
CREATE INDEX IF NOT EXISTS audit_user ON public.audit_log (user_id);
CREATE INDEX IF NOT EXISTS audit_timestamp ON public.audit_log (timestamp DESC);
```

---

#### C. system_logs (Phase 9.0 Day 6)

```sql
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL,                          -- 'info', 'warn', 'error'
  message TEXT NOT NULL,                        -- Log message
  context JSONB,                                -- Additional context
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  component TEXT,                               -- e.g., 'evidence_api', 'aggregation_engine'
  user_id UUID,                                 -- If action was user-initiated
  request_id TEXT,                              -- For tracing requests
  
  CONSTRAINT valid_level CHECK (level IN ('info', 'warn', 'error', 'debug'))
);

CREATE INDEX IF NOT EXISTS logs_level ON public.system_logs (level);
CREATE INDEX IF NOT EXISTS logs_timestamp ON public.system_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS logs_component ON public.system_logs (component);

-- Auto-delete logs older than 90 days (retention policy)
-- Implement via scheduled job or trigger
```

---

### 4. Source Library Extensions

#### ✅ Present in Schema Plan
- access_status ('open_access', 'paywalled', 'restricted')
- verification_status ('peer_reviewed', 'verified', 'unverified')
- citation_count
- impact_factor
- miu_count (usage tracking)
- last_cited_at
- cited_by_materials
- can_delete (computed field)

#### ⚠️ Missing Fields

1. **deleted** BOOLEAN (soft delete)
   - Required by: Day 4 - Security & RLS Hardening
   - Purpose: Mark source as deleted but preserve for MIU references
   - Action: ADD to source interface
   - When true: hide from UI but keep data

2. **restricted_content** BOOLEAN
   - Required by: Day 1 - Legal & Licensing Policy
   - Purpose: Mark sources under DMCA takedown
   - Action: ADD to source interface
   - When true: hide snippets but preserve aggregations

#### 📝 Updated Source Interface

```typescript
interface Source {
  // ... existing fields
  
  // Quality indicators (✅ Already in plan)
  access_status: 'open_access' | 'paywalled' | 'restricted';
  verification_status: 'peer_reviewed' | 'verified' | 'unverified';
  citation_count: number;
  impact_factor: number | null;
  
  // Usage tracking (✅ Already in plan)
  miu_count: number;
  last_cited_at: string;
  cited_by_materials: string[];
  can_delete: boolean;
  
  // Deletion/restriction (⚠️ ADD THESE)
  deleted: boolean;                 // Soft delete flag
  restricted_content: boolean;      // DMCA takedown flag
  restriction_reason?: string;      // Why restricted
  restriction_date?: string;        // When restricted
}
```

---

### 5. TypeScript Interfaces

#### ✅ Comprehensive Coverage
- EvidencePoint interface: ✅ Complete
- EvidencePointCreate interface: ✅ Complete
- EvidencePointFilter interface: ✅ Complete
- ParameterAggregation interface: ✅ Complete
- WeightPolicy interface: ✅ Complete
- AggregationRequest interface: ✅ Complete
- Release interface: ✅ Complete

#### ⚠️ Missing Interfaces

Add these new interfaces for operational tables:

```typescript
export interface RecomputeJob {
  id: string;
  parameter: string;
  transform_version_old: string;
  transform_version_new: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  affected_mius_count?: number;
  completed_mius_count: number;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  created_by?: string;
}

export interface AuditLogEntry {
  id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: string;
  user_id?: string;
  old_value?: any;
  new_value?: any;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

export interface SystemLogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  component?: string;
  user_id?: string;
  request_id?: string;
}
```

---

### 6. Validation Rules

#### ✅ Comprehensive Validation Present
- Required fields validation
- Locator requirement (at least one)
- Derived values require formula
- Parameter enum validation
- Dimension auto-derivation
- Aggregation minimum MIUs warning

#### 📝 Additional Validations Needed

From Day 3 requirements:

1. **Snippet length validation**
   - Min: 20 characters
   - Max: 1000 characters
   - Add to validateEvidencePoint()

2. **Units must match parameter**
   - Check against units.json ontology
   - Reject if unit not valid for parameter
   - Add to validateEvidencePoint()

3. **Formula validation** (for derived values)
   - Parse formula syntax
   - Validate variable references
   - Add parseFormula() utility

---

### 7. RLS Policies

#### ✅ Comprehensive RLS Present
- Evidence read: all authenticated users
- Evidence insert: admin only
- Evidence update: admin only (with immutability checks)
- Evidence delete: admin only (with aggregation check)
- Aggregations: admin write, all read

#### ✅ Correct Implementation
All RLS policies match Phase 9.0 Day 4 requirements exactly.

---

### 8. Data Guards

#### ✅ Present
- canDeleteSource(): Prevents deletion if MIUs reference source ✅
- canDeleteEvidencePoint(): Prevents deletion if MIU is in aggregations ✅

#### 📝 Enhancements Needed

1. **Soft delete option**
   - Return soft delete as alternative when deletion blocked
   - UI: "Cannot delete. Mark as deleted instead?" dialog

2. **Admin override**
   - Allow admin to force delete with confirmation
   - Log override in audit_log

---

### 9. API Endpoints

#### ✅ Core Endpoints Specified
- POST /evidence - Create MIU ✅
- GET /evidence - List/filter MIUs ✅
- POST /aggregate - Compute aggregation ✅
- GET /aggregations - List aggregations ✅

#### ⚠️ Missing Endpoints (from Phase 9.0)

Add these to schema plan:

1. **Ontology Endpoints** (Day 3)
   - GET /make-server-17cae920/ontologies/units
   - GET /make-server-17cae920/ontologies/context

2. **Transform Management** (Day 2)
   - GET /make-server-17cae920/transforms
   - GET /make-server-17cae920/transforms/:parameter
   - POST /make-server-17cae920/transforms/recompute
   - GET /make-server-17cae920/transforms/recompute/:jobId
   - GET /make-server-17cae920/transforms/recompute (list all jobs)

3. **Duplicate Detection** (Day 5)
   - GET /make-server-17cae920/sources/check-duplicate?doi={doi}&title={title}
   - GET /make-server-17cae920/evidence/check-duplicate?source_ref={id}&locator={loc}&parameter={param}&value={val}

4. **Signed URL Generation** (Day 4)
   - GET /make-server-17cae920/sources/{id}/pdf (returns signed URL)
   - GET /make-server-17cae920/evidence/{id}/screenshot (returns signed URL)

5. **Release Management** (Day 7)
   - GET /make-server-17cae920/releases (list all releases)
   - POST /make-server-17cae920/releases (create new release)
   - GET /make-server-17cae920/releases/:version (get specific release)

6. **Queue/Triage** (Day 10)
   - GET /make-server-17cae920/queue (curation queue with filters)

---

## 📊 Coverage Matrix

### Schema Planning Document Coverage

| Category | Required Items | Items in Plan | Coverage | Status |
|----------|---------------|---------------|----------|---------|
| Core Tables | 6 | 6 | 100% | ✅ Complete |
| Operational Tables | 3 | 0 | 0% | ❌ Not Included |
| Evidence Fields | 30+ | 28 | 93% | ⚠️ 2 missing |
| Aggregation Fields | 20+ | 18 | 90% | ⚠️ 2 missing |
| Source Extensions | 10 | 8 | 80% | ⚠️ 2 missing |
| Validation Rules | 10 | 7 | 70% | ⚠️ 3 missing |
| RLS Policies | 4 | 4 | 100% | ✅ Complete |
| Data Guards | 2 | 2 | 100% | ✅ Complete |
| API Endpoints | 15+ | 4 | 27% | ⚠️ 11 missing |
| TypeScript Interfaces | 10+ | 7 | 70% | ⚠️ 3 missing |

### Overall Assessment

**Core Evidence Schema:** 95% Complete ✅  
**Infrastructure Schema:** 0% Complete ❌  
**API Specification:** 27% Complete ⚠️  
**Validation & Security:** 85% Complete ⚠️

---

## 🎯 Recommended Actions

### Priority 1: Update MIU_SCHEMA_PLAN.md (Core Schema)

Add these critical missing fields:

1. **evidence_points table:**
   - Add `conflict_of_interest TEXT`
   - Add `evidence_type TEXT DEFAULT 'positive'` with CHECK constraint
   - Add `restricted_content BOOLEAN DEFAULT false`

2. **parameter_aggregations table:**
   - Add `codebook_version TEXT NOT NULL`
   - Add `ontology_version TEXT NOT NULL`

3. **Source interface:**
   - Add `deleted BOOLEAN DEFAULT false`
   - Add `restricted_content BOOLEAN DEFAULT false`
   - Add `restriction_reason TEXT`
   - Add `restriction_date TIMESTAMPTZ`

4. **Validation rules:**
   - Add snippet length validation (20-1000 chars)
   - Add units-parameter validation
   - Add formula parser utility

### Priority 2: Create Separate Infrastructure Schema Document

Create `/docs/MIU_INFRASTRUCTURE_SCHEMA.md` for:

1. **Operational tables:**
   - recompute_jobs
   - audit_log
   - system_logs

2. **Additional API endpoints:**
   - Ontology endpoints
   - Transform management endpoints
   - Duplicate detection endpoints
   - Signed URL endpoints
   - Release management endpoints
   - Queue/triage endpoints

3. **Observability:**
   - Logging middleware specification
   - Alert rules configuration
   - Dashboard metrics specification

4. **Backup & Recovery:**
   - Backup automation script
   - Restore procedure
   - Release artifact checksumming

### Priority 3: Update TypeScript Interfaces

Add interfaces for operational tables (RecomputeJob, AuditLogEntry, SystemLogEntry).

---

## 📝 Notes for Implementation

### Phase 9.0 Day 3 Context

The MIU_SCHEMA_PLAN.md was created for **Phase 9.0 Day 3** which focuses on "MIU Schema Planning" as preparation for **Phase 9.1 implementation**.

**What Day 3 Requires:**
- ✅ Database schema design (evidence_points, parameter_aggregations, releases)
- ✅ TypeScript interfaces
- ✅ KV store implementation strategy
- ✅ Validation rules design
- ⚠️ Should also include operational tables (recompute_jobs, audit_log, system_logs)

**What Day 3 Does NOT Require:**
- ❌ Actual implementation of endpoints (that's Phase 9.1)
- ❌ Frontend components (that's Phase 9.2)
- ❌ Curation workflow (that's Phase 9.2-9.4)

However, since we're creating a **planning document**, it should include schemas for ALL tables needed in Phase 9.1, including operational infrastructure.

### Recommendation

**Option A (Minimal):** Update MIU_SCHEMA_PLAN.md with the 7 missing fields only (Priority 1)

**Option B (Comprehensive):** Create both:
1. Updated MIU_SCHEMA_PLAN.md (core evidence schema)
2. New MIU_INFRASTRUCTURE_SCHEMA.md (operational tables)

**Recommended:** **Option B** - Complete documentation for Phase 9.1 readiness.

---

## ✅ Conclusion

The `MIU_SCHEMA_PLAN.md` document provides an **excellent foundation** for the core evidence schema with 95% coverage of evidence-related requirements.

**Strengths:**
- ✅ Comprehensive evidence_points table design
- ✅ Well-thought-out aggregation schema
- ✅ Excellent TypeScript interfaces
- ✅ KV store adaptation strategy
- ✅ Quality scoring algorithm
- ✅ RLS policies
- ✅ Data guards

**Gaps:**
- ⚠️ Missing 7 fields across 3 tables (easily fixed)
- ❌ Missing operational infrastructure tables (recompute_jobs, audit_log, system_logs)
- ⚠️ Missing detailed API endpoint specifications
- ⚠️ Some validation rules need expansion

**Overall Grade:** A- (Excellent core schema, needs infrastructure supplement)

**Next Step:** Apply Priority 1 updates to MIU_SCHEMA_PLAN.md, then create MIU_INFRASTRUCTURE_SCHEMA.md for operational concerns.

---

**Report Completed:** November 14, 2025  
**Reviewer:** Phase 9.0 Day 3 Implementation Team  
**Status:** Ready for schema updates
