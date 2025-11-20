# Phase 9.1: Database Schema Documentation

## Overview

Phase 9.1 implements a KV-store backed evidence and aggregation system that simulates a relational database structure. This document describes the intended production schema, current KV implementation, and optimization strategies.

---

## 🗄️ Intended Production Schema (PostgreSQL)

### Table: `public.evidence_points`

Evidence points (MIUs - Minimally Interpretable Units) represent granular data extracted from scientific literature.

```sql
CREATE TABLE public.evidence_points (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core Evidence Data (Phase 9.0)
  material_id TEXT NOT NULL,
  parameter_code TEXT NOT NULL,
  raw_value NUMERIC NOT NULL,
  raw_unit TEXT NOT NULL,
  transformed_value NUMERIC NULL,
  transform_version TEXT NOT NULL DEFAULT '1.0',
  snippet TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('whitepaper', 'article', 'external', 'manual')),
  citation TEXT NOT NULL,
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),
  notes TEXT NULL,
  page_number INTEGER NULL,
  figure_number TEXT NULL,
  table_number TEXT NULL,
  
  -- Phase 9.1 Extensions
  source_ref TEXT NOT NULL,
  source_weight NUMERIC NOT NULL DEFAULT 0.5 CHECK (source_weight >= 0 AND source_weight <= 1),
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'flagged', 'duplicate')),
  validated_by UUID NULL,
  validated_at TIMESTAMPTZ NULL,
  restricted_content BOOLEAN NOT NULL DEFAULT false,
  conflict_of_interest TEXT NULL,
  dimension TEXT NOT NULL CHECK (dimension IN ('CR', 'CC', 'RU')),
  
  -- Audit Fields
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Indexes

```sql
-- Primary lookups
CREATE INDEX idx_evidence_material ON evidence_points(material_id);
CREATE INDEX idx_evidence_parameter ON evidence_points(parameter_code);
CREATE INDEX idx_evidence_source ON evidence_points(source_ref);
CREATE INDEX idx_evidence_dimension ON evidence_points(dimension);

-- Composite indexes for common queries
CREATE INDEX idx_evidence_material_param ON evidence_points(material_id, parameter_code);
CREATE INDEX idx_evidence_material_dim ON evidence_points(material_id, dimension);
CREATE INDEX idx_evidence_validation ON evidence_points(validation_status, created_at DESC);

-- Full-text search on snippets
CREATE INDEX idx_evidence_snippet_fts ON evidence_points USING GIN(to_tsvector('english', snippet));
```

#### Row-Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE public.evidence_points ENABLE ROW LEVEL SECURITY;

-- Read: Anyone can read validated evidence
CREATE POLICY "Evidence read access"
  ON public.evidence_points
  FOR SELECT
  USING (
    validation_status = 'validated'
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Create: Authenticated users can create evidence
CREATE POLICY "Evidence create access"
  ON public.evidence_points
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- Update: Only admins can update validation status
CREATE POLICY "Evidence update access"
  ON public.evidence_points
  FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Delete: Only admins can delete evidence
CREATE POLICY "Evidence delete access"
  ON public.evidence_points
  FOR DELETE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
```

---

### Table: `public.parameter_aggregations`

Aggregations compute consensus values from multiple evidence points with confidence intervals.

```sql
CREATE TABLE public.parameter_aggregations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Aggregation Identity
  material_id TEXT NOT NULL,
  parameter TEXT NOT NULL,
  
  -- Aggregation Results
  aggregation_method TEXT NOT NULL DEFAULT 'weighted_mean',
  point_estimate NUMERIC NOT NULL,
  lower_bound NUMERIC NOT NULL,
  upper_bound NUMERIC NOT NULL,
  confidence_interval_width NUMERIC NOT NULL,
  
  -- Quality Metrics
  num_sources INTEGER NOT NULL,
  num_mius INTEGER NOT NULL,
  quality_score NUMERIC NOT NULL CHECK (quality_score >= 0 AND quality_score <= 1),
  heterogeneity_score NUMERIC NULL,
  
  -- Aggregation Metadata
  miu_ids UUID[] NOT NULL,
  quality_threshold NUMERIC NOT NULL DEFAULT 0.0,
  min_sources INTEGER NOT NULL DEFAULT 1,
  
  -- Versioning
  snapshot_id UUID NULL,
  superseded_by UUID NULL,
  is_current BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit Fields
  calculated_by UUID NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_current_aggregation UNIQUE (material_id, parameter, is_current) WHERE is_current = true
);
```

#### Indexes

```sql
-- Primary lookups
CREATE INDEX idx_aggregation_material ON parameter_aggregations(material_id);
CREATE INDEX idx_aggregation_parameter ON parameter_aggregations(parameter);
CREATE INDEX idx_aggregation_current ON parameter_aggregations(is_current) WHERE is_current = true;

-- Composite indexes for common queries
CREATE INDEX idx_aggregation_material_param ON parameter_aggregations(material_id, parameter);
CREATE INDEX idx_aggregation_material_current ON parameter_aggregations(material_id) WHERE is_current = true;
CREATE INDEX idx_aggregation_quality ON parameter_aggregations(quality_score DESC);

-- Snapshot tracking
CREATE INDEX idx_aggregation_snapshot ON parameter_aggregations(snapshot_id);
CREATE INDEX idx_aggregation_superseded ON parameter_aggregations(superseded_by);
```

#### Row-Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE public.parameter_aggregations ENABLE ROW LEVEL SECURITY;

-- Read: Anyone can read current aggregations
CREATE POLICY "Aggregation read access"
  ON public.parameter_aggregations
  FOR SELECT
  USING (
    is_current = true
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Create: Only admins can create aggregations
CREATE POLICY "Aggregation create access"
  ON public.parameter_aggregations
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    AND calculated_by = auth.uid()
  );

-- Update: Only admins can supersede aggregations
CREATE POLICY "Aggregation update access"
  ON public.parameter_aggregations
  FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Delete: No direct deletes (use superseding instead)
CREATE POLICY "Aggregation delete access"
  ON public.parameter_aggregations
  FOR DELETE
  USING (false);
```

---

## 🔑 Current KV Store Implementation

### Key Patterns

#### Evidence Points

```typescript
// Primary storage
`evidence:{evidenceId}` → EvidencePoint

// Material index
`evidence_by_material:{materialId}:{parameterCode}:{evidenceId}` → evidenceId

// Source index (for referential integrity)
`evidence_by_source:{sourceRef}:{evidenceId}` → evidenceId

// Validation queue
`evidence_by_validation:{validationStatus}:{evidenceId}` → evidenceId
```

#### Parameter Aggregations

```typescript
// Primary storage
`aggregation:{aggregationId}` → ParameterAggregation

// Current aggregation (superseding pattern)
`aggregation_current:{materialId}:{parameter}` → aggregationId

// Material index
`aggregation_by_material:{materialId}:{parameter}:{aggregationId}` → aggregationId

// Snapshot tracking
`aggregation_by_snapshot:{snapshotId}:{aggregationId}` → aggregationId
```

---

## 📊 Views & Helper Queries

### View: `evidence_summary_by_material`

Aggregate statistics per material.

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
  COUNT(*) FILTER (WHERE validation_status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE validation_status = 'flagged') as flagged_count,
  MIN(created_at) as first_evidence_date,
  MAX(created_at) as last_evidence_date
FROM evidence_points
GROUP BY material_id, dimension;
```

**KV Implementation:** See `getEvidenceStatsByMaterial()` in `/utils/supabase/evidence.ts`

---

### View: `aggregation_coverage_matrix`

Show which material+parameter combinations have aggregations.

```sql
CREATE VIEW aggregation_coverage_matrix AS
SELECT
  a.material_id,
  a.parameter,
  a.num_mius,
  a.num_sources,
  a.quality_score,
  a.confidence_interval_width,
  a.calculated_at,
  CASE
    WHEN a.num_mius >= 3 THEN 'good'
    WHEN a.num_mius >= 1 THEN 'sufficient'
    ELSE 'insufficient'
  END as coverage_status
FROM parameter_aggregations a
WHERE a.is_current = true;
```

**KV Implementation:** See `getAggregationStats()` in `/utils/supabase/aggregations.ts`

---

## 🔒 Referential Integrity Guards

### Prevent Source Deletion with Evidence

```sql
-- Function to check if source can be deleted
CREATE FUNCTION can_delete_source(source_ref TEXT)
RETURNS TABLE(can_delete BOOLEAN, evidence_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) = 0 as can_delete,
    COUNT(*)::INTEGER as evidence_count
  FROM evidence_points
  WHERE evidence_points.source_ref = $1;
END;
$$ LANGUAGE plpgsql;
```

**KV Implementation:** See `getEvidencePointsBySource()` and endpoint `GET /sources/:sourceRef/can-delete`

---

## ⚡ Performance Optimization

### 1. Add Source Index to KV Store

Currently, checking if a source can be deleted requires scanning all evidence. Add an index:

```typescript
// When creating evidence, also store:
await kv.set(
  `evidence_by_source:${sourceRef}:${evidenceId}`,
  evidenceId
);

// Fast lookup:
const sourceEvidence = await kv.getByPrefix(`evidence_by_source:${sourceRef}:`);
```

### 2. Add Validation Queue Index

For curation workflows, add validation status index:

```typescript
// When creating/updating evidence:
await kv.set(
  `evidence_by_validation:${validationStatus}:${evidenceId}`,
  evidenceId
);

// Query pending evidence:
const pendingEvidence = await kv.getByPrefix('evidence_by_validation:pending:');
```

### 3. Cache Current Aggregations

Avoid repeated lookups for current aggregations:

```typescript
// Store pointer to current aggregation:
await kv.set(
  `aggregation_current:${materialId}:${parameter}`,
  aggregationId
);

// Fast retrieval:
const currentId = await kv.get(`aggregation_current:${materialId}:${parameter}`);
const aggregation = await kv.get(`aggregation:${currentId}`);
```

---

## 🧪 Migration Path (Future)

When migrating from KV to Postgres:

1. **Export KV data:**
   ```typescript
   const allEvidence = await kv.getByPrefix('evidence:');
   const allAggregations = await kv.getByPrefix('aggregation:');
   ```

2. **Run DDL statements** (CREATE TABLE, CREATE INDEX)

3. **Bulk insert data:**
   ```sql
   COPY evidence_points FROM 'evidence_export.csv' WITH CSV HEADER;
   COPY parameter_aggregations FROM 'aggregations_export.csv' WITH CSV HEADER;
   ```

4. **Enable RLS policies**

5. **Run validation queries:**
   ```sql
   SELECT COUNT(*) FROM evidence_points WHERE validation_status = 'validated';
   ```

---

## 📚 Related Documentation

- Phase 9.0 Infrastructure: `/docs/PHASE_9_0_STATUS_SUMMARY.md`
- Transform System: `/docs/TRANSFORMS_ONTOLOGY.md`
- API Documentation: See `/components/PhaseFilteredTests.tsx` for endpoint tests

---

## ✅ Completion Checklist

- [x] Document intended production schema
- [x] Add source index to KV store
- [x] Add validation queue index to KV store
- [x] Implement `getEvidenceStatsByMaterial()` view helper
- [x] Implement `getAggregationCoverageMatrix()` view helper
- [ ] Add auth checks to all data layer functions (RLS simulation)
- [ ] Create migration export script
- [ ] Add schema validation tests