# Phase 9 Database Schema & API Reference

**Last Updated:** November 20, 2025  
**Implementation:** KV Store (production will use PostgreSQL)  
**Status:** Phase 9.0 ✅ | Phase 9.1 ✅

---

## Overview

Phase 9 implements a KV-store backed evidence and aggregation system that simulates a relational database structure. This document describes:

1. Current KV implementation (what's running now)
2. Intended production schema (future PostgreSQL migration)
3. API endpoints reference
4. Migration strategy

---

## 🗄️ Current Implementation (KV Store)

### Evidence Points (MIUs)

**Interface:**

```typescript
interface EvidencePoint {
  // Core identification
  id: string; // UUID
  material_id: string; // e.g., "aluminum", "PET"

  // Parameter & value (Phase 9.0)
  parameter_code: string; // e.g., "Y", "D", "C" (13 total parameters)
  raw_value: number; // Original value from source
  raw_unit: string; // Original unit (%, kg/kg, etc.)
  transformed_value: number | null; // Normalized to [0,1] scale
  transform_version: string; // e.g., "Y_v1.0"

  // Source attribution (Phase 9.0)
  source_type: "whitepaper" | "article" | "external" | "manual";
  citation: string; // Free-text citation
  confidence_level: "high" | "medium" | "low";

  // Location metadata (Phase 9.0)
  snippet: string; // Verbatim text excerpt (<250 words)
  notes: string | null; // Curator notes
  page_number: number | null; // Page locator
  figure_number: string | null; // Figure locator
  table_number: string | null; // Table locator

  // Phase 9.1 additions
  source_ref: string; // Structured reference to sources table
  source_weight: number; // 0.0-1.0 weight for aggregation
  validation_status: "pending" | "validated" | "flagged" | "duplicate";
  validated_by: string | null; // User ID of validator
  validated_at: string | null; // ISO timestamp
  restricted_content: boolean; // DMCA takedown flag
  conflict_of_interest: string | null; // COI disclosure
  dimension: "CR" | "CC" | "RU"; // Compostability, Recyclability, Reusability

  // Audit trail (Phase 9.0)
  created_by: string; // User ID
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
```

**KV Storage Pattern:**

```typescript
// Primary storage
`evidence:{id}` → EvidencePoint

// Indexes for efficient querying
`evidence_index:material:{materialId}:{parameter}:{id}` → id
`evidence_index:source:{sourceRef}:{id}` → id
`evidence_index:curator:{userId}:{id}` → id
`evidence_index:validation:{status}:{id}` → id
```

**Helper Functions** (in `/utils/supabase/evidence.ts`):

- `createEvidencePoint(data)` - Create with validation
- `getEvidencePoint(id)` - Get single evidence
- `getEvidencePointsByMaterial(materialId, filters?)` - Query by material
- `getEvidencePointsBySource(sourceRef)` - Get all evidence for a source
- `updateEvidenceValidation(id, status, validatorId)` - Update validation
- `deleteEvidencePoint(id)` - Delete with cleanup
- `searchEvidenceBySnippet(query)` - Text search (basic)
- `getEvidenceCountByMaterial(materialId)` - Count aggregation
- `canDeleteSource(sourceRef)` - Data guard check

---

### Parameter Aggregations

**Interface:**

```typescript
interface ParameterAggregation {
  // Identity
  id: string; // UUID
  material_id: string;
  parameter: string; // e.g., "Y", "D", "C"
  dimension: "CR" | "CC" | "RU"; // Derived from parameter

  // Statistical results
  mean: number; // Weighted mean (normalized to [0,1])
  se: number | null; // Standard error
  ci95_lower: number | null; // 95% confidence interval lower bound
  ci95_upper: number | null; // 95% confidence interval upper bound

  // Traceability
  n_mius: number; // Number of evidence points used
  miu_ids: string[]; // Array of evidence point IDs
  weights_used: Record<string, number>; // Source type weights applied

  // Quality metrics
  evidence_quality_score: number; // 0-100 score
  source_diversity: number; // Unique source count
  curator_agreement: number | null; // Inter-rater κ (when applicable)

  // Policy snapshot (reproducibility)
  transform_version: string; // e.g., "Y_v1.0"
  ontology_version: string; // e.g., "units_v1.0"
  codebook_version: string; // e.g., "v0.1"
  weight_policy_version: string; // e.g., "WP_v1.0"
  methods_version: string; // e.g., "CR_v1.0"
  snapshot_id: string | null; // Link to policy snapshot

  // Versioning
  is_current: boolean; // Only one true per material+parameter
  superseded_at: string | null; // When replaced
  superseded_by: string | null; // ID of newer aggregation

  // Thresholds used
  quality_threshold: number; // Minimum MIU quality score required
  min_sources: number; // Minimum source count required

  // Audit trail
  calculated_by: string; // User ID
  calculated_at: string; // ISO timestamp
}
```

**KV Storage Pattern:**

```typescript
// Primary storage
`aggregation:{id}` → ParameterAggregation

// Current aggregation pointer (superseding pattern)
`aggregation_current:{materialId}:{parameter}` → id

// Indexes
`aggregation_index:material:{materialId}:{parameter}:{id}` → id
`aggregation_index:snapshot:{snapshotId}:{id}` → id
```

**Helper Functions** (in `/utils/supabase/aggregations.ts`):

- `createAggregation(data)` - Create with auto-supersede
- `getAggregation(id)` - Get single aggregation
- `getCurrentAggregations(materialId, parameter?)` - Get current versions
- `getAggregationHistory(materialId, parameter)` - Get all versions
- `getAggregationStats(materialId)` - Statistics summary
- `calculateWeightedMean(mius, weights)` - Statistical helper
- `calculateSourceDiversity(mius)` - Count unique sources

---

## 🔒 Validation Rules

### Evidence Point Validation

**Required Fields:**

- At least one locator (page_number OR figure_number OR table_number OR paragraph)
- snippet (20-1000 characters)
- raw_value (must be numeric)
- raw_unit (must match parameter's allowed units from ontology)

**Constraints:**

- `source_weight`: 0.0-1.0 range
- `validation_status`: Must be one of enum values
- `dimension`: Must match parameter's dimension (Y,D,C,M,E → CR; B,N,T,H → CC; L,R,U,C_RU → RU)
- If `transformed_value` is non-null, `transform_version` required

**Derived Values:**

- If evidence is derived from multiple sources/calculations, formula_assumptions field required

### Aggregation Validation

**Creation Rules:**

- Must have at least 1 validated MIU
- All `miu_ids` must exist and be validated
- Only one `is_current=true` per material+parameter combination
- Creating new aggregation auto-sets previous to `is_current=false`

**Statistical Constraints:**

- `ci95_lower <= mean <= ci95_upper`
- `evidence_quality_score`: 0-100 range
- `n_mius` must match `miu_ids.length`

---

## 🔐 Data Guards

### Source Deletion Protection

**Rule:** Cannot delete a source if any evidence points reference it

**Implementation:**

```typescript
// Check before deletion
const evidence = await getEvidencePointsBySource(sourceRef);
if (evidence.length > 0) {
  throw new Error(
    `Cannot delete source with ${evidence.length} dependent evidence point(s). ` +
      `Use the Evidence Lab to review and manage evidence points for this source.`
  );
}
```

**Endpoint:** `GET /make-server-17cae920/sources/:sourceRef/can-delete`

Returns:

```json
{
  "canDelete": false,
  "miuCount": 3,
  "sampleEvidence": [
    { "id": "uuid1", "snippet": "...", "parameter": "Y" }
    // ... up to 5 samples
  ]
}
```

### Material Deletion Protection

**Rule:** Warns if material has evidence, sources, or methodology

**Implementation:** Cascade warnings with detailed counts (from Phase 9.0 Day 7)

---

## 🌐 API Endpoints

### Evidence Endpoints

#### 1. Create Evidence Point

```http
POST /make-server-17cae920/evidence
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "material_id": "aluminum",
  "parameter_code": "Y",
  "raw_value": 92.5,
  "raw_unit": "%",
  "snippet": "Recycling yield was measured at 92.5%...",
  "page_number": 15,
  "source_ref": "whitepaper_smith2023",
  "source_weight": 1.0,
  "source_type": "peer_reviewed",
  "confidence_level": "high",
  "transform_version": "Y_v1.0"
}
```

**Response:** `201` Created with evidence object

#### 2. Get Evidence Point

```http
GET /make-server-17cae920/evidence/:id
Authorization: Bearer {token}
```

**Response:** `200` with evidence object (filters restricted_content for non-admins)

#### 3. Get Evidence by Material

```http
GET /make-server-17cae920/evidence/material/:materialId?parameter=Y&dimension=CR
Authorization: Bearer {token}
```

**Query Params:**

- `parameter` (optional) - Filter by parameter code
- `dimension` (optional) - Filter by dimension (CR/CC/RU)

**Response:** `200` with array of evidence objects

#### 4. Get Evidence by Source

```http
GET /make-server-17cae920/evidence/source/:sourceRef
Authorization: Bearer {admin_token}
```

**Response:** `200` with array of evidence objects (admin-only for data guard checks)

#### 5. Update Evidence Validation

```http
PATCH /make-server-17cae920/evidence/:id/validation
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "validation_status": "validated",
  "notes": "Verified citation and snippet accuracy"
}
```

**Response:** `200` with updated evidence object (auto-assigns validator_id and validated_at)

---

### Aggregation Endpoints

#### 6. Create Aggregation

```http
POST /make-server-17cae920/aggregations
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "material_id": "aluminum",
  "parameter": "Y",
  "dimension": "CR",
  "mean": 0.915,
  "se": 0.03,
  "ci95_lower": 0.855,
  "ci95_upper": 0.975,
  "miu_ids": ["uuid1", "uuid2", "uuid3"],
  "weights_used": { "peer_reviewed": 1.0, "whitepaper": 0.8 },
  "transform_version": "Y_v1.0",
  "codebook_version": "v0.1",
  "ontology_version": "units_v1.0",
  "weight_policy_version": "WP_v1.0",
  "methods_version": "CR_v1.0",
  "evidence_quality_score": 88
}
```

**Response:** `201` Created with aggregation object (auto-supersedes previous current aggregation)

#### 7. Get Aggregation

```http
GET /make-server-17cae920/aggregations/:id
Authorization: Bearer {token}
```

**Response:** `200` with aggregation object

#### 8. Get Current Aggregations by Material

```http
GET /make-server-17cae920/aggregations/material/:materialId?parameter=Y
Authorization: Bearer {token}
```

**Query Params:**

- `parameter` (optional) - Filter by specific parameter

**Response:** `200` with array of current aggregations only

#### 9. Get Aggregation History

```http
GET /make-server-17cae920/aggregations/material/:materialId/history?parameter=Y
Authorization: Bearer {admin_token}
```

**Query Params:**

- `parameter` (optional) - Filter by specific parameter

**Response:** `200` with array of all aggregations (including superseded) (admin-only)

#### 10. Get Aggregation Statistics

```http
GET /make-server-17cae920/aggregations/material/:materialId/stats
Authorization: Bearer {token}
```

**Response:** `200` with statistics summary:

```json
{
  "materialId": "aluminum",
  "totalAggregations": 5,
  "parametersCovered": ["Y", "D", "C", "M", "E"],
  "avgQualityScore": 85.6,
  "avgMiuCount": 4.2,
  "lastUpdated": "2025-11-20T10:30:00Z"
}
```

---

### Data Guard Endpoints

#### 11. Check Source Can Delete

```http
GET /make-server-17cae920/sources/:sourceRef/can-delete
Authorization: Bearer {admin_token}
```

**Response:** `200` with deletion check:

```json
{
  "canDelete": false,
  "miuCount": 3,
  "sampleEvidence": [
    {
      "id": "evidence_123",
      "snippet": "Recycling yield was measured...",
      "parameter": "Y",
      "materialId": "aluminum"
    }
  ],
  "hint": "Use the Evidence Lab to review and manage evidence points for this source."
}
```

---

## Views & Helper Queries

### Evidence Summary by Material

**KV Helper:** `getEvidenceStatsByMaterial(materialId)`

**Returns:**

```typescript
{
  materialId: string;
  totalEvidence: number;
  parametersCovered: string[];
  uniqueSources: number;
  avgSourceWeight: number;
  validatedCount: number;
  pendingCount: number;
  flaggedCount: number;
  firstEvidenceDate: string;
  lastEvidenceDate: string;
}
```

**Future SQL View:**

```sql
CREATE VIEW evidence_summary_by_material AS
SELECT
  material_id,
  dimension,
  COUNT(*) as total_evidence,
  COUNT(DISTINCT parameter_code) as parameters_covered,
  COUNT(DISTINCT source_ref) as unique_sources,
  AVG(source_weight) as avg_source_weight,
  COUNT(*) FILTER (WHERE validation_status = 'validated') as validated_count,
  MIN(created_at) as first_evidence_date,
  MAX(created_at) as last_evidence_date
FROM evidence_points
GROUP BY material_id, dimension;
```

### Aggregation Coverage Matrix

**KV Helper:** `getAggregationStats(materialId)`

**Future SQL View:**

```sql
CREATE VIEW aggregation_coverage_matrix AS
SELECT
  a.material_id,
  a.parameter,
  a.n_mius,
  a.source_diversity,
  a.evidence_quality_score,
  a.calculated_at,
  CASE
    WHEN a.n_mius >= 3 THEN 'good'
    WHEN a.n_mius >= 1 THEN 'sufficient'
    ELSE 'insufficient'
  END as coverage_status
FROM parameter_aggregations a
WHERE a.is_current = true;
```

---

## 🔄 Future: PostgreSQL Migration

### Intended Production Schema

#### Table: `public.evidence_points`

```sql
CREATE TABLE public.evidence_points (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core Evidence Data
  material_id TEXT NOT NULL,
  parameter_code TEXT NOT NULL,
  raw_value NUMERIC NOT NULL,
  raw_unit TEXT NOT NULL,
  transformed_value NUMERIC NULL,
  transform_version TEXT NOT NULL DEFAULT '1.0',
  snippet TEXT NOT NULL,

  -- Source Attribution
  source_type TEXT NOT NULL CHECK (source_type IN ('whitepaper', 'article', 'external', 'manual')),
  citation TEXT NOT NULL,
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),

  -- Location Metadata
  notes TEXT NULL,
  page_number INTEGER NULL,
  figure_number TEXT NULL,
  table_number TEXT NULL,

  -- Phase 9.1 Extensions
  source_ref TEXT NOT NULL,
  source_weight NUMERIC NOT NULL DEFAULT 0.5 CHECK (source_weight >= 0 AND source_weight <= 1),
  validation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (validation_status IN ('pending', 'validated', 'flagged', 'duplicate')),
  validated_by UUID NULL,
  validated_at TIMESTAMPTZ NULL,
  restricted_content BOOLEAN NOT NULL DEFAULT false,
  conflict_of_interest TEXT NULL,
  dimension TEXT NOT NULL CHECK (dimension IN ('CR', 'CC', 'RU')),

  -- Audit Fields
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT at_least_one_locator CHECK (
    page_number IS NOT NULL OR
    figure_number IS NOT NULL OR
    table_number IS NOT NULL
  )
);
```

**Indexes:**

```sql
CREATE INDEX idx_evidence_material ON evidence_points(material_id);
CREATE INDEX idx_evidence_parameter ON evidence_points(parameter_code);
CREATE INDEX idx_evidence_source ON evidence_points(source_ref);
CREATE INDEX idx_evidence_dimension ON evidence_points(dimension);
CREATE INDEX idx_evidence_material_param ON evidence_points(material_id, parameter_code);
CREATE INDEX idx_evidence_validation ON evidence_points(validation_status, created_at DESC);

-- Full-text search
CREATE INDEX idx_evidence_snippet_fts ON evidence_points
  USING GIN(to_tsvector('english', snippet));
```

**Row-Level Security:**

```sql
ALTER TABLE public.evidence_points ENABLE ROW LEVEL SECURITY;

-- Read: Anyone can read validated evidence
CREATE POLICY "Evidence read access"
  ON public.evidence_points FOR SELECT
  USING (
    validation_status = 'validated'
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Create: Authenticated users can create
CREATE POLICY "Evidence create access"
  ON public.evidence_points FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- Update: Only admins
CREATE POLICY "Evidence update access"
  ON public.evidence_points FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Delete: Only admins
CREATE POLICY "Evidence delete access"
  ON public.evidence_points FOR DELETE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
```

---

#### Table: `public.parameter_aggregations`

```sql
CREATE TABLE public.parameter_aggregations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  material_id TEXT NOT NULL,
  parameter TEXT NOT NULL,
  dimension TEXT NOT NULL CHECK (dimension IN ('CR', 'CC', 'RU')),

  -- Statistical Results
  mean NUMERIC NOT NULL,
  se NUMERIC NULL,
  ci95_lower NUMERIC NULL,
  ci95_upper NUMERIC NULL,

  -- Traceability
  n_mius INTEGER NOT NULL,
  miu_ids UUID[] NOT NULL,
  weights_used JSONB NOT NULL,

  -- Quality Metrics
  evidence_quality_score NUMERIC NOT NULL CHECK (evidence_quality_score >= 0 AND evidence_quality_score <= 100),
  source_diversity INTEGER NOT NULL,
  curator_agreement NUMERIC NULL,

  -- Policy Snapshot
  transform_version TEXT NOT NULL,
  ontology_version TEXT NOT NULL,
  codebook_version TEXT NOT NULL,
  weight_policy_version TEXT NOT NULL,
  methods_version TEXT NOT NULL,
  snapshot_id UUID NULL,

  -- Versioning
  is_current BOOLEAN NOT NULL DEFAULT true,
  superseded_at TIMESTAMPTZ NULL,
  superseded_by UUID NULL,

  -- Thresholds
  quality_threshold NUMERIC NOT NULL DEFAULT 0.0,
  min_sources INTEGER NOT NULL DEFAULT 1,

  -- Audit Fields
  calculated_by UUID NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_current_aggregation
    UNIQUE (material_id, parameter, is_current)
    WHERE is_current = true,
  CONSTRAINT valid_ci_bounds
    CHECK (ci95_lower IS NULL OR ci95_upper IS NULL OR ci95_lower <= ci95_upper),
  CONSTRAINT min_one_miu
    CHECK (n_mius >= 1)
);
```

**Indexes:**

```sql
CREATE INDEX idx_aggregation_material ON parameter_aggregations(material_id);
CREATE INDEX idx_aggregation_parameter ON parameter_aggregations(parameter);
CREATE INDEX idx_aggregation_current ON parameter_aggregations(is_current) WHERE is_current = true;
CREATE INDEX idx_aggregation_material_param ON parameter_aggregations(material_id, parameter);
CREATE INDEX idx_aggregation_snapshot ON parameter_aggregations(snapshot_id);
```

**Row-Level Security:**

```sql
ALTER TABLE public.parameter_aggregations ENABLE ROW LEVEL SECURITY;

-- Read: Anyone can read current aggregations
CREATE POLICY "Aggregation read access"
  ON public.parameter_aggregations FOR SELECT
  USING (
    is_current = true
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Create: Only admins
CREATE POLICY "Aggregation create access"
  ON public.parameter_aggregations FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    AND calculated_by = auth.uid()
  );

-- Update: Only admins
CREATE POLICY "Aggregation update access"
  ON public.parameter_aggregations FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Delete: No direct deletes (use superseding)
CREATE POLICY "Aggregation delete access"
  ON public.parameter_aggregations FOR DELETE
  USING (false);
```

---

### Migration Steps

1. **Export KV data:**

   ```typescript
   const allEvidence = await kv.getByPrefix("evidence:");
   const allAggregations = await kv.getByPrefix("aggregation:");
   ```

2. **Run DDL statements** (CREATE TABLE, CREATE INDEX above)

3. **Bulk insert data:**

   ```sql
   COPY evidence_points FROM 'evidence_export.csv' WITH CSV HEADER;
   COPY parameter_aggregations FROM 'aggregations_export.csv' WITH CSV HEADER;
   ```

4. **Enable RLS policies** (SQL above)

5. **Validation queries:**

   ```sql
   SELECT COUNT(*) FROM evidence_points WHERE validation_status = 'validated';
   SELECT material_id, COUNT(*) FROM parameter_aggregations WHERE is_current = true GROUP BY material_id;
   ```

6. **Update application code:**
   - Replace KV calls with Supabase client queries
   - Enable RLS enforcement
   - Test all API endpoints

**Estimated time:** 4-6 hours

---

## Related Documentation

- **Status Summary:** `/docs/PHASE_9_STATUS.md` - Completion status and timeline
- **Roadmap:** `/docs/PHASE_9_ROADMAP.md` - High-level Phase 9.0-9.5 plan
- **Transforms:** `/docs/TRANSFORMS_ONTOLOGY.md` - Transform system details
- **Overall Roadmap:** `/docs/ROADMAP.md` - Full WasteDB roadmap
