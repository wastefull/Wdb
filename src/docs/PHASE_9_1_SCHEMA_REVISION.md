# Phase 9.1 Schema Revision - Build on Phase 9.0

**Date:** November 18, 2025  
**Issue:** Initial Phase 9.1 implementation created parallel data structures instead of extending Phase 9.0  
**Resolution:** Reverted to extend Phase 9.0 schema with backward compatibility

---

## Problem

The initial Phase 9.1 implementation created entirely new data structures with renamed fields:

**Initial Approach (WRONG):**
- Created new `evidence_point:` KV prefix (Phase 9.0 used `evidence:`)
- Renamed fields: `parameter` (was `parameter_code`), `value_raw` (was `raw_value`), `units` (was `raw_unit`)
- Created parallel endpoints that would conflict with Phase 9.0
- Would break existing evidence data from Phase 9.0 Day 4

This violated the core principle: **Phase 9.1 should EXTEND Phase 9.0, not replace it.**

---

## Solution: EXTEND Phase 9.0 Schema

### Phase 9.0 Evidence Schema (Base)

Already implemented in Day 4:

```typescript
interface EvidencePoint {
  // Core
  id: string;
  material_id: string;
  
  // Parameter & value
  parameter_code: string;        // ✅ Keep this name
  raw_value: number;             // ✅ Keep this name
  raw_unit: string;              // ✅ Keep this name
  transformed_value: number | null;
  transform_version: string;
  
  // Source attribution
  source_type: 'whitepaper' | 'article' | 'external' | 'manual';
  citation: string;
  confidence_level: 'high' | 'medium' | 'low';
  
  // Location
  snippet: string;
  notes: string | null;
  page_number: number | null;
  figure_number: string | null;
  table_number: string | null;
  
  // Audit
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

### Phase 9.1 Additions (NEW Fields Only)

```typescript
interface EvidencePoint {
  // ... all Phase 9.0 fields above (unchanged) ...
  
  // Phase 9.1 additions:
  source_ref: string;              // Reference to source in sources table
  source_weight: number;           // 0.0-1.0 weight for aggregation
  validation_status: 'pending' | 'validated' | 'flagged' | 'duplicate';
  validated_by: string | null;
  validated_at: string | null;
  restricted_content: boolean;
  conflict_of_interest: string | null;
  dimension: 'CR' | 'CC' | 'RU';  // Derived from parameter_code
}
```

---

## Key Principles

### ✅ DO (What We Did)

1. **Keep Phase 9.0 field names**: `parameter_code`, `raw_value`, `raw_unit`
2. **Keep Phase 9.0 storage keys**: `evidence:`, `evidence_by_material:`
3. **Keep Phase 9.0 endpoints working**: POST/GET/PUT/DELETE `/evidence`
4. **Add new fields as optional**: Backward compatible with Phase 9.0 data
5. **Add new endpoints only**: PATCH for validation, aggregation endpoints
6. **Build on existing infrastructure**: Use Phase 9.0 transform validation, audit logging

### ❌ DON'T

1. ~~Rename existing fields~~ (breaks Phase 9.0 data)
2. ~~Change KV storage patterns~~ (orphans Phase 9.0 data)
3. ~~Create parallel endpoints on same routes~~ (route conflicts)
4. ~~Replace working infrastructure~~ (unnecessary work)

---

## Implementation Changes Made

### 1. Updated `/utils/supabase/evidence.ts`

**Changed from:**
```typescript
interface EvidencePoint {
  parameter: string;      // NEW name
  value_raw: number;      // NEW name
  units: string;          // NEW name
}
```

**Changed to:**
```typescript
interface EvidencePoint {
  parameter_code: string;  // Phase 9.0 name (KEEP)
  raw_value: number;       // Phase 9.0 name (KEEP)
  raw_unit: string;        // Phase 9.0 name (KEEP)
  // ... Phase 9.1 additions below ...
  source_ref: string;
  source_weight: number;
  validation_status: ValidationStatus;
  // etc.
}
```

### 2. Updated `/utils/supabase/aggregations.ts`

- Uses `parameter_code` from evidence points (not renamed `parameter`)
- References evidence points with Phase 9.0 schema
- Computes aggregations using `raw_value` and `transformed_value`

### 3. Updated `/supabase/functions/server/evidence-routes.tsx`

- Works with Phase 9.0 schema
- Adds NEW endpoints for Phase 9.1 features:
  - `PATCH /evidence/:id/validation`
  - `GET /evidence/material/:id?parameter=X`
  - Aggregation endpoints (all new)
  - Data guard endpoints

### 4. Updated `/supabase/functions/server/index.tsx`

- Moved Phase 9.1 route registrations BEFORE Phase 9.0 routes
- This ensures Phase 9.1 endpoints (with more specific paths) match first
- Added deprecation comment to Phase 9.0 routes
- Will remove Phase 9.0 routes in future cleanup (not today)

### 5. Updated `/components/Phase91Tests.tsx`

- Uses Phase 9.0 field names in test payloads
- Tests Phase 9.1 additions (validation, aggregations)
- Validates backward compatibility

### 6. Updated `/docs/PHASE_9_1_IMPLEMENTATION_PLAN.md`

- Added **CRITICAL** section at top emphasizing Phase 9.0 base
- Documented what Phase 9.0 already provides
- Clarified Phase 9.1 only ADDS features
- Added migration strategy for backward compatibility

---

## Backward Compatibility

### Existing Phase 9.0 Data Works

Evidence points created in Phase 9.0 Day 4 work perfectly:

```json
{
  "id": "evidence_123",
  "material_id": "PET",
  "parameter_code": "Y",
  "raw_value": 85.5,
  "raw_unit": "%",
  "source_type": "whitepaper",
  "citation": "Smith et al. 2024",
  "confidence_level": "high",
  "created_by": "user_456",
  // ... all Phase 9.0 fields ...
  
  // Phase 9.1 additions (missing = default values)
  // source_ref: citation (fallback)
  // source_weight: 0.5 (default medium)
  // validation_status: 'pending' (default)
}
```

### Phase 9.1 Enhancements

New evidence points include Phase 9.1 fields:

```json
{
  // ... all Phase 9.0 fields ...
  "source_ref": "whitepaper_789",  // NEW: structured reference
  "source_weight": 0.9,             // NEW: explicit weight
  "validation_status": "validated", // NEW: workflow tracking
  "validated_by": "admin_123",      // NEW: who validated
  "validated_at": "2025-11-18T...", // NEW: when validated
  "restricted_content": false,      // NEW: access control
  "dimension": "CR"                 // NEW: derived dimension
}
```

---

## What Phase 9.0 Already Provided

From `/docs/PHASE_9_0_STATUS_SUMMARY.md`:

✅ **Day 4 - Evidence Collection System** (Nov 16, 2025)
- 5 CRUD endpoints: POST, GET (single), GET (by material), PUT, DELETE
- Transform validation (validates units against ontology)
- Source attribution (source_type, confidence_level)
- Evidence Lab UI (fully connected to backend)
- Audit logging for all operations
- KV storage pattern: `evidence:{id}`, `evidence_by_material:{materialId}:{parameter}:{id}`

**Phase 9.1 just adds:**
- Validation workflow (pending → validated → flagged)
- Structured source references (vs free-text citation)
- Parameter aggregations (weighted means)
- Source weight tracking
- Data guards (prevent source deletion if evidence exists)

---

## Testing

All 10 Phase 9.1 tests now use Phase 9.0 schema:

1. ✅ Create Evidence Point (Phase 9.0 fields + Phase 9.1 additions)
2. ✅ Get Evidence Point by ID
3. ✅ Get Evidence Points by Material
4. ✅ Update Evidence Validation (NEW in 9.1)
5. ✅ Create Aggregation (NEW in 9.1)
6. ✅ Get Aggregation by ID (NEW in 9.1)
7. ✅ Get Aggregations by Material (NEW in 9.1)
8. ✅ Get Aggregation Stats (NEW in 9.1)
9. ✅ Check Source Can Delete - with evidence (NEW in 9.1)
10. ✅ Check Source Can Delete - without evidence (NEW in 9.1)

---

## Files Modified

1. `/docs/PHASE_9_1_IMPLEMENTATION_PLAN.md` - Added CRITICAL warning about Phase 9.0 base
2. `/utils/supabase/evidence.ts` - Reverted to Phase 9.0 schema, added Phase 9.1 fields
3. `/utils/supabase/aggregations.ts` - Uses Phase 9.0 schema
4. `/supabase/functions/server/evidence-routes.tsx` - Works with Phase 9.0 schema
5. `/supabase/functions/server/index.tsx` - Reordered route registration
6. `/components/Phase91Tests.tsx` - Uses Phase 9.0 field names

---

## Lessons Learned

### Why This Happened

1. **Insufficient planning review**: Didn't carefully read Phase 9.0 status summary first
2. **Over-engineering**: Tried to "improve" naming when existing names were fine
3. **Schema redesign temptation**: Wanted to make things "better" instead of incremental
4. **Ignored YAGNI**: Renamed fields unnecessarily

### Prevention Strategy

Before implementing any phase:

1. ✅ **Read status summary** of previous phase FIRST
2. ✅ **List what exists** before designing what's new
3. ✅ **Default to extending** not replacing
4. ✅ **Keep field names** unless there's a compelling reason
5. ✅ **Add, don't rename** - new features get new fields
6. ✅ **Test backward compatibility** - old data must still work

### Decision Framework

**When to EXTEND (Phase 9.1 case):**
- ✅ Existing infrastructure works
- ✅ Just adding new features
- ✅ Backward compatibility required
- ✅ No fundamental design flaws

**When to REPLACE:**
- ❌ Existing infrastructure is broken
- ❌ Security vulnerability
- ❌ Performance is unacceptable
- ❌ Data model fundamentally wrong

---

## Status

✅ **RESOLVED** - Phase 9.1 now correctly extends Phase 9.0

**Next:** Ready to proceed with Phase 9.2 (Curation Workbench UI)

---

## Related Documents

- `/docs/PHASE_9_0_STATUS_SUMMARY.md` - What we built on (Day 4 especially)
- `/docs/PHASE_9_1_IMPLEMENTATION_PLAN.md` - Revised plan emphasizing Phase 9.0 base
- `/utils/supabase/evidence.ts` - Extended Phase 9.0 schema
- `/utils/supabase/aggregations.ts` - New aggregation system
