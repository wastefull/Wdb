# Phase 9.1 Implementation Plan - COMPLETE

**Date:** November 18, 2025  
**Phase:** 9.1 - Database Schema & Backend Extensions  
**Status:** ✅ COMPLETE  
**Completion Date:** November 20, 2025
**Base:** Phase 9.0 Evidence Infrastructure (see `/docs/PHASE_9_0_STATUS_SUMMARY.md`)

---

## 🎯 CRITICAL: Build on Phase 9.0, Don't Replace It

**Phase 9.0 Already Provides:**
- ✅ Evidence point CRUD endpoints (POST/GET/PUT/DELETE `/evidence`)
- ✅ Evidence schema with all core fields (parameter_code, raw_value, raw_unit, snippet, citation, etc.)
- ✅ Transform validation system (validates units against ontology)
- ✅ Source attribution (source_type, confidence_level)
- ✅ Evidence Lab UI (fully connected to backend)
- ✅ Audit logging for all evidence operations
- ✅ KV storage with `evidence:{id}` and `evidence_by_material:{materialId}` keys

**Phase 9.1 Goal:** EXTEND Phase 9.0 with:
1. **New Fields** - Add validation workflow, source references, quality metrics
2. **Aggregation System** - Add parameter aggregations (weighted means)
3. **API Enhancements** - Add filtered queries, validation updates, aggregation endpoints

**DO NOT:**
- ❌ Create new evidence endpoints that replace existing ones
- ❌ Rename existing fields (keep `parameter_code`, `raw_value`, `raw_unit`)
- ❌ Change KV storage keys (keep `evidence:` prefix)
- ❌ Create parallel data structures

---

## Overview

Transform WasteDB from a parameter-entry system to an evidence-extraction platform where every numeric value is traceable to specific passages in peer-reviewed literature using **Minimally Interpretable Units (MIUs)**.

**Architecture:**
- **Evidence Points (MIUs)** - Individual data extractions from sources (EXTEND Phase 9.0 schema)
- **Parameter Aggregations** - Weighted means computed from MIUs (NEW in Phase 9.1)
- **Quality Metrics** - Source weighting, confidence intervals, validation status

---

## Task Breakdown

### Task 1: EXTEND Evidence Points Schema ✅ COMPLETE

**Objective:** Add Phase 9.1 fields to existing Phase 9.0 evidence point schema.

**Phase 9.0 Schema (Already Exists):**
```typescript
interface EvidencePoint {
  // Core identification
  id: string;
  material_id: string;
  
  // Parameter & value (Phase 9.0)
  parameter_code: string;        // Keep existing name
  raw_value: number;             // Keep existing name
  raw_unit: string;              // Keep existing name
  transformed_value: number | null;
  transform_version: string;
  
  // Source attribution (Phase 9.0)
  source_type: 'whitepaper' | 'article' | 'external' | 'manual';
  citation: string;              // Keep for backward compatibility
  confidence_level: 'high' | 'medium' | 'low';
  
  // Location metadata (Phase 9.0)
  snippet: string;
  notes: string | null;
  page_number: number | null;
  figure_number: string | null;
  table_number: string | null;
  
  // Audit trail (Phase 9.0)
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

**NEW Fields to Add (Phase 9.1):**
```typescript
interface EvidencePoint {
  // ... all Phase 9.0 fields above ...
  
  // Source management (Phase 9.1)
  source_ref: string;            // Reference to source in sources table (whitepaper/article ID)
  source_weight: number;         // 0.0-1.0 weight for aggregation
  
  // Validation workflow (Phase 9.1)
  validation_status: 'pending' | 'validated' | 'flagged' | 'duplicate';
  validated_by: string | null;
  validated_at: string | null;
  
  // Quality metadata (Phase 9.1)
  restricted_content: boolean;   // True if contains proprietary data
  conflict_of_interest: string | null; // COI disclosure
  
  // Dimension (Phase 9.1) - derived from parameter
  dimension: 'CR' | 'CC' | 'RU'; // Compostability, Recyclability, Reusability
}
```

**Implementation:**
- ✅ Create `/utils/supabase/evidence.ts` with helper functions that EXTEND existing endpoints
- ✅ Add field validation for new fields
- ✅ Maintain backward compatibility with Phase 9.0 data

---

### Task 2: Create Parameter Aggregations Data Structure ✅ COMPLETE

**Objective:** Implement the `parameter_aggregations` data structure in the KV store.

**NEW Schema (Phase 9.1):**
```typescript
interface ParameterAggregation {
  id: string;
  material_id: string;
  parameter: string;              // e.g., "Y", "D", "C"
  dimension: 'CR' | 'CC' | 'RU';  // Derived from parameter
  
  // Aggregation results
  mean: number;                   // Weighted mean
  se: number | null;              // Standard error
  ci95_lower: number | null;      // 95% CI lower bound
  ci95_upper: number | null;      // 95% CI upper bound
  
  // Traceability
  n_mius: number;                 // Number of evidence points used
  miu_ids: string[];              // IDs of evidence points
  weights_used: Record<string, number>; // Source weights applied
  
  // Versioning
  transform_version: string;      // Transform version used
  ontology_version: string;       // Units ontology version
  codebook_version: string;       // Codebook version
  
  // Policy snapshot
  quality_threshold: number;      // Minimum quality score to include MIU
  min_sources: number;            // Minimum number of sources required
  
  // Audit trail
  calculated_by: string;          // User who triggered calculation
  calculated_at: string;          // Timestamp
  is_current: boolean;            // Only one current per material+parameter
  superseded_at: string | null;   // When this version was replaced
  superseded_by: string | null;   // ID of newer aggregation
}
```

**KV Storage Pattern:**
```
aggregation:{id}                                    → Full aggregation object
aggregation_current:{material_id}:{parameter}       → ID of current aggregation
aggregation_history:{material_id}:{parameter}:{id}  → Historical aggregations
```

**Implementation:**
- ✅ Create `/utils/supabase/aggregations.ts`
- ✅ Implement versioning (only one `is_current=true` per material+parameter)
- ✅ Add quality metric calculations (weighted mean, SE, CI)

---

### Task 3: Backend API Endpoints ✅ COMPLETE

**Objective:** Add Phase 9.1 endpoints that EXTEND (not replace) Phase 9.0 evidence endpoints.

**NEW Endpoints (Phase 9.1):**

#### Evidence Endpoints (Extensions)
1. ✅ `PATCH /evidence/:id/validation` - Update validation status (admin only)
2. ✅ `GET /evidence/material/:materialId?parameter=X&dimension=CR` - Filtered queries
3. ✅ `GET /evidence/source/:sourceRef` - Get all evidence for a source (for data guards)

#### Aggregation Endpoints (New)
4. ✅ `POST /aggregations` - Create new aggregation (admin only)
5. ✅ `GET /aggregations/:id` - Get specific aggregation
6. ✅ `GET /aggregations/material/:materialId` - Get current aggregations for material
7. ✅ `GET /aggregations/material/:materialId/history?parameter=Y` - Get aggregation history
8. ✅ `GET /aggregations/material/:materialId/stats` - Get aggregation statistics

#### Data Guard Endpoints (New)
9. ✅ `GET /sources/:sourceRef/can-delete` - Check if source has evidence points

**KEEP Phase 9.0 Endpoints (Already Working):**
- ✅ `POST /evidence` - Create evidence point
- ✅ `GET /evidence/:id` - Get single evidence point
- ✅ `GET /evidence/material/:materialId` - Get all evidence for material
- ✅ `PUT /evidence/:id` - Update evidence point
- ✅ `DELETE /evidence/:id` - Delete evidence point

**Implementation:**
- ✅ Create `/supabase/functions/server/evidence-routes.tsx`
- ✅ Register routes in `/supabase/functions/server/index.tsx`
- ✅ Use existing auth middleware (verifyAuth, verifyAdmin)
- ✅ Use existing audit logging system

---

### Task 4: Data Validation & Guards ✅ COMPLETE

**Objective:** Ensure data integrity for new fields.

**Validation Rules:**

1. **Evidence Point Validation:**
   - ✅ `source_ref` must reference existing source (whitepaper or article)
   - ✅ `source_weight` must be 0.0-1.0
   - ✅ `validation_status` must be one of: pending, validated, flagged, duplicate
   - ✅ `dimension` must match parameter (use existing parameter mapping)
   - ✅ `restricted_content` defaults to false

2. **Aggregation Validation:**
   - ✅ Cannot create aggregation without at least 1 validated MIU
   - ✅ Only one `is_current=true` per material+parameter
   - ✅ When creating new aggregation, set `is_current=false` on previous one

3. **Referential Integrity:**
   - ✅ Cannot delete source if evidence points reference it (use existing Day 7 logic)
   - ✅ Deleting evidence point updates any aggregations that used it

**Implementation:**
- ✅ Add validation in evidence.ts and aggregations.ts
- ✅ Use existing data guard patterns from Phase 9.0 Day 7

---

### Task 5: Testing Infrastructure ✅ COMPLETE

**Objective:** Comprehensive automated tests for all Phase 9.1 functionality.

**Test Suites:**

1. ✅ **Evidence CRUD Tests** (extend Phase 9.0 Day 4 tests)
   - Create evidence with new fields
   - Get evidence with filters
   - Update validation status
   - Get evidence by source

2. ✅ **Aggregation Tests** (new)
   - Create aggregation
   - Get current aggregation
   - Get aggregation history
   - Get aggregation stats
   - Versioning works correctly

3. ✅ **Data Guard Tests** (extend Phase 9.0 Day 7 tests)
   - Source deletion blocked if evidence exists
   - Check source can delete endpoint

4. ✅ **Integration Tests** (new)
   - Full workflow: create evidence → validate → aggregate → display
   - Verify audit logs created
   - Verify notifications sent

**Test Component:**
- ✅ Create `/components/Phase91Tests.tsx`
- ✅ Add to Admin > Testing > Roadmap interface
- ✅ All tests automated (no manual steps)

**Test Data:**
- ✅ Use existing materials from database
- ✅ Use existing sources (whitepapers/articles)
- ✅ Clean up test data after completion

---

## Implementation Checklist

### Schema & Data Layer
- ✅ Create `/utils/supabase/evidence.ts` (extends Phase 9.0)
- ✅ Create `/utils/supabase/aggregations.ts` (new)
- ✅ Add validation functions
- ✅ Document schema changes

### Backend API
- ✅ Create `/supabase/functions/server/evidence-routes.tsx`
- ✅ Register 11 new endpoints in index.tsx
- ✅ Add data guards
- ✅ Test all endpoints with curl/Postman

### Testing
- ✅ Create `/components/Phase91Tests.tsx`
- ✅ Add 10+ automated tests
- ✅ Integrate with roadmap UI
- ✅ Document test coverage

### Documentation
- ✅ Update API documentation
- ✅ Document new schema fields
- ✅ Create migration guide (Phase 9.0 → 9.1)
- ✅ Update roadmap status

---

## Success Criteria

**Phase 9.1 is complete when:**

1. ✅ All Phase 9.0 evidence endpoints still work unchanged
2. ✅ New validation workflow endpoints functional
3. ✅ Aggregation system creates versioned aggregations
4. ✅ Data guards prevent orphaned references
5. ✅ All 10+ automated tests passing
6. ✅ Documentation complete
7. ✅ Zero breaking changes to existing data

---

## Migration Strategy

**Existing Phase 9.0 Data:**
- Evidence points created in Phase 9.0 continue to work
- Missing Phase 9.1 fields get default values:
  - `source_ref` = `citation` (use citation as source reference)
  - `source_weight` = 0.5 (medium weight)
  - `validation_status` = 'pending'
  - `validated_by` = null
  - `validated_at` = null
  - `restricted_content` = false
  - `conflict_of_interest` = null
  - `dimension` = derived from parameter_code

**Backward Compatibility:**
- ✅ Keep `parameter_code`, `raw_value`, `raw_unit` field names
- ✅ Keep `evidence:{id}` KV storage pattern
- ✅ Keep existing endpoints working
- ✅ Add new fields as optional

---

## Timeline

**Estimated Duration:** 4-6 hours

- Task 1: EXTEND Evidence Schema (1h) ✅
- Task 2: Create Aggregations Schema (1h) ✅
- Task 3: Backend API Endpoints (2h) ✅
- Task 4: Data Validation (1h) ✅
- Task 5: Testing Infrastructure (1h) ✅

**Status:** ✅ **COMPLETE** - All tasks finished

---

## Related Documents

- `/docs/PHASE_9_0_STATUS_SUMMARY.md` - Base infrastructure (MUST READ FIRST)
- `/docs/MIU_SCHEMA_PLAN.md` - Full MIU schema design
- `/docs/PHASE_9_ADDENDUM_CRITICAL_INFRASTRUCTURE.md` - Overall Phase 9 plan
- `/legal/MIU_LICENSING_POLICY.md` - Legal framework for evidence