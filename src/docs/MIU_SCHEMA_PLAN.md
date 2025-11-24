# MIU Schema Planning Document

**Phase:** 9.0 Day 3 (Preparation for Phase 9.1)  
**Status:** 📐 PLANNING  
**Created:** November 14, 2025  
**Purpose:** Define complete database schema for Evidence Pipeline (MIUs and Aggregations)

---

## Executive Summary

This document specifies the database schema required to transform WasteDB from a **parameter-entry system** to an **evidence-extraction platform** where every numeric value is traceable to specific passages in peer-reviewed literature using **Minimally Interpretable Units (MIUs)**.

### Key Tables

1. **`evidence_points`** - Immutable evidence records (MIUs)
2. **`parameter_aggregations`** - Computed statistics from MIU sets
3. **`releases`** - Quarterly versioned data snapshots
4. **Materials extension** - Evidence quality tracking
5. **Sources extension** - Quality indicators and access status
6. **User profiles extension** - Public attribution settings

---

## 1. Core Schema Definitions

### 1.1 Evidence Points Table (MIUs)

**Purpose:** Store immutable, granular evidence extracted from sources.

```sql
CREATE TABLE IF NOT EXISTS public.evidence_points (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Material linkage
  material_id UUID NOT NULL,
  -- Note: In KV implementation, store as material.id string
  
  -- Source linkage (ties to Source Library Manager)
  source_ref TEXT NOT NULL,              -- Library Source id
  source_type TEXT,                       -- Cached: 'peer_reviewed', 'government', 'industrial', 'ngo', 'internal'
  source_weight NUMERIC,                  -- Cached default weight from source at extraction time
  
  -- Parameter specification
  parameter TEXT NOT NULL,                -- One of: Y, D, C, M, E, B, N, T, H, L, R, U, C_RU
  dimension TEXT NOT NULL,                -- One of: CR, CC, RU (derived from parameter)
  
  -- Value data
  value_raw NUMERIC NOT NULL,             -- Original value as extracted
  units TEXT NOT NULL,                    -- e.g., '%', 'kg CO2e/kg', 'cycles', 'years'
  value_norm NUMERIC,                     -- Normalized to 0-1 scale (NULL for categorical/E parameter)
  transform_version TEXT NOT NULL DEFAULT 'v1.0',  -- Transform used for normalization
  
  -- Source locator (at least one required)
  page INTEGER,                           -- Page number in PDF
  figure TEXT,                            -- Figure identifier (e.g., 'Figure 3', 'Fig. 2a')
  table_ref TEXT,                         -- Table identifier (e.g., 'Table 1', 'Appendix B')
  paragraph TEXT,                         -- Paragraph/section identifier
  
  -- Verbatim evidence (REQUIRED)
  snippet TEXT NOT NULL,                  -- Exact quote from source
  screenshot_url TEXT,                    -- Optional: cropped image from PDF
  
  -- Context tags (for filtering during aggregation)
  process TEXT,                           -- e.g., 'mechanical_recycling', 'industrial_composting'
  stream TEXT,                            -- e.g., 'post_consumer', 'post_industrial', 'mixed'
  region TEXT,                            -- e.g., 'north_america', 'europe', 'global'
  scale TEXT,                             -- e.g., 'laboratory', 'pilot', 'industrial'
  cycles INTEGER,                         -- Number of reuse cycles (for RU)
  contamination_percent NUMERIC,          -- Contamination level
  temperature_c NUMERIC,                  -- Temperature (for CC)
  time_minutes NUMERIC,                   -- Time duration (for CC)
  
  -- Derived values (for calculated parameters)
  is_derived BOOLEAN NOT NULL DEFAULT false,
  derived_formula TEXT,                   -- Mathematical expression used
  assumptions TEXT,                       -- Assumptions made in calculation
  
  -- Quality metadata
  method_completeness TEXT,               -- e.g., 'complete', 'partial', 'unclear'
  sample_size INTEGER,                    -- Sample size from study
  confidence_notes TEXT,                  -- Free-text quality notes
  
  -- Conflict of interest disclosure (Phase 9.0 Day 1 - Legal)
  conflict_of_interest TEXT,              -- COI disclosure for industry-funded sources
  
  -- Evidence type (Phase 9.0 Day 3 - Negative Evidence Support)
  evidence_type TEXT DEFAULT 'positive',  -- 'positive', 'negative', 'limit', 'threshold'
  
  -- Restriction flags (Phase 9.0 Day 1 - DMCA/Takedowns)
  restricted_content BOOLEAN DEFAULT false, -- DMCA takedown flag
  
  -- Curation metadata
  curator_id UUID,                        -- User who extracted this MIU
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  codebook_version TEXT NOT NULL DEFAULT 'v0',  -- Curator guideline version used
  
  -- Validation flags
  validation_status TEXT DEFAULT 'pending',  -- 'pending', 'validated', 'flagged'
  validated_by UUID,                          -- Second curator (double-extraction)
  validated_at TIMESTAMPTZ,
  
  -- Audit trail
  extraction_session_id TEXT,             -- Group MIUs from same extraction session
  
  CONSTRAINT valid_parameter CHECK (parameter IN ('Y', 'D', 'C', 'M', 'E', 'B', 'N', 'T', 'H', 'L', 'R', 'U', 'C_RU')),
  CONSTRAINT valid_dimension CHECK (dimension IN ('CR', 'CC', 'RU')),
  CONSTRAINT valid_source_type CHECK (source_type IN ('peer_reviewed', 'government', 'industrial', 'ngo', 'internal', 'preprint')),
  CONSTRAINT valid_method CHECK (method_completeness IN ('complete', 'partial', 'unclear', NULL)),
  CONSTRAINT valid_validation CHECK (validation_status IN ('pending', 'validated', 'flagged', 'duplicate')),
  CONSTRAINT has_locator CHECK (page IS NOT NULL OR figure IS NOT NULL OR table_ref IS NOT NULL OR paragraph IS NOT NULL),
  CONSTRAINT derived_requires_formula CHECK (NOT is_derived OR derived_formula IS NOT NULL)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS ep_material_param ON public.evidence_points (material_id, parameter);
CREATE INDEX IF NOT EXISTS ep_source_ref ON public.evidence_points (source_ref);
CREATE INDEX IF NOT EXISTS ep_dimension ON public.evidence_points (dimension);
CREATE INDEX IF NOT EXISTS ep_curator ON public.evidence_points (curator_id);
CREATE INDEX IF NOT EXISTS ep_created ON public.evidence_points (created_at DESC);
CREATE INDEX IF NOT EXISTS ep_validation ON public.evidence_points (validation_status);
CREATE INDEX IF NOT EXISTS ep_context ON public.evidence_points (process, stream, region) WHERE process IS NOT NULL;

-- Full-text search on snippet
CREATE INDEX IF NOT EXISTS ep_snippet_fts ON public.evidence_points USING gin(to_tsvector('english', snippet));
```

---

### 1.2 Parameter Aggregations Table

**Purpose:** Store computed statistics from sets of MIUs.

```sql
CREATE TABLE IF NOT EXISTS public.parameter_aggregations (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Material and parameter
  material_id UUID NOT NULL,
  parameter TEXT NOT NULL,
  dimension TEXT NOT NULL,
  
  -- Statistical results
  mean NUMERIC NOT NULL,                  -- Weighted mean
  se NUMERIC,                             -- Standard error
  ci95_lower NUMERIC,                     -- Lower bound of 95% CI
  ci95_upper NUMERIC,                     -- Upper bound of 95% CI
  n_mius INTEGER NOT NULL,                -- Number of MIUs aggregated
  
  -- Evidence traceability
  miu_ids UUID[] NOT NULL,                -- Array of evidence_points.id
  weights_used JSONB NOT NULL,            -- Weight policy snapshot for reproducibility
  
  -- Aggregation metadata
  methods_version TEXT NOT NULL,          -- Whitepaper version (e.g., 'CR-v1.0')
  weight_policy_version TEXT NOT NULL,    -- Weight policy version
  transform_version TEXT NOT NULL,        -- Transform version used
  codebook_version TEXT NOT NULL,         -- Curator guideline version (Phase 9.0 Day 5)
  ontology_version TEXT NOT NULL,         -- Units & context ontology version (Phase 9.0 Day 3)
  
  -- Filters applied
  filters_applied JSONB,                  -- Context filters used (process, region, etc.)
  
  -- Quality indicators
  evidence_quality_score NUMERIC,         -- 0-100 quality score
  curator_agreement_kappa NUMERIC,        -- Inter-curator agreement (if double-extracted)
  ci_width NUMERIC,                       -- Width of confidence interval
  source_diversity_count INTEGER,         -- Number of distinct sources
  
  -- Audit trail
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  calculated_by UUID,                     -- Admin who performed aggregation
  notes TEXT,                             -- Free-text notes about aggregation
  
  -- Versioning
  supersedes_aggregation_id UUID,         -- Previous aggregation this replaces
  is_current BOOLEAN NOT NULL DEFAULT true,  -- Only one current per material+parameter
  
  CONSTRAINT valid_parameter CHECK (parameter IN ('Y', 'D', 'C', 'M', 'E', 'B', 'N', 'T', 'H', 'L', 'R', 'U', 'C_RU')),
  CONSTRAINT valid_dimension CHECK (dimension IN ('CR', 'CC', 'RU')),
  CONSTRAINT ci_ordered CHECK (ci95_lower <= ci95_upper),
  CONSTRAINT min_mius CHECK (n_mius >= 1),
  CONSTRAINT quality_range CHECK (evidence_quality_score >= 0 AND evidence_quality_score <= 100)
);

-- Unique constraint: only one current aggregation per material+parameter
CREATE UNIQUE INDEX IF NOT EXISTS agg_current_unique 
  ON public.parameter_aggregations (material_id, parameter) 
  WHERE is_current = true;

-- Indexes
CREATE INDEX IF NOT EXISTS agg_material ON public.parameter_aggregations (material_id);
CREATE INDEX IF NOT EXISTS agg_dimension ON public.parameter_aggregations (dimension);
CREATE INDEX IF NOT EXISTS agg_calculated ON public.parameter_aggregations (calculated_at DESC);
CREATE INDEX IF NOT EXISTS agg_quality ON public.parameter_aggregations (evidence_quality_score DESC);
```

---

### 1.3 Releases Table (Quarterly Snapshots)

**Purpose:** Store versioned snapshots of database for reproducible research (ecoinvent pattern).

```sql
CREATE TABLE IF NOT EXISTS public.releases (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Release identification
  version TEXT NOT NULL UNIQUE,           -- e.g., 'v2026.Q1', 'v2026.Q2'
  release_date DATE NOT NULL,
  
  -- Documentation
  title TEXT NOT NULL,                    -- e.g., 'WasteDB 2026 Q1 Release'
  changelog TEXT,                         -- Markdown changelog
  doi TEXT,                               -- Optional DOI for citation
  
  -- Methodology versions (snapshot of versions at release)
  whitepaper_cr_version TEXT,             -- e.g., 'CR-v1.0'
  whitepaper_cc_version TEXT,             -- e.g., 'CC-v1.0'
  whitepaper_ru_version TEXT,             -- e.g., 'RU-v1.0'
  weight_policy_version TEXT,             -- e.g., 'WP-v1.0'
  transform_version TEXT,                 -- e.g., 'v1.0'
  codebook_version TEXT,                  -- e.g., 'v1.0'
  
  -- Data snapshot (JSONB full dump)
  materials_snapshot JSONB NOT NULL,      -- Full materials data at release time
  aggregations_snapshot JSONB,            -- Aggregations data
  sources_snapshot JSONB,                 -- Source library state
  
  -- Statistics
  total_materials INTEGER NOT NULL,
  total_mius INTEGER NOT NULL,
  total_aggregations INTEGER,
  research_grade_count INTEGER,           -- Materials at research-grade
  verified_count INTEGER,                 -- Materials at verified
  provisional_count INTEGER,              -- Materials at provisional
  
  -- Coverage metrics
  dimension_coverage JSONB,               -- Per-dimension parameter coverage
  category_coverage JSONB,                -- Per-category material coverage
  
  -- Quality metrics
  avg_mius_per_material NUMERIC,
  avg_sources_per_material NUMERIC,
  avg_evidence_quality_score NUMERIC,
  avg_curator_kappa NUMERIC,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,                        -- Admin who created release
  is_published BOOLEAN NOT NULL DEFAULT false,
  
  CONSTRAINT valid_version_format CHECK (version ~ '^v\d{4}\.Q[1-4]$')
);

-- Indexes
CREATE INDEX IF NOT EXISTS releases_date ON public.releases (release_date DESC);
CREATE INDEX IF NOT EXISTS releases_published ON public.releases (is_published) WHERE is_published = true;
```

---

## 2. Table Extensions

### 2.1 Materials Table Extensions

**Purpose:** Track evidence status and quality (iNaturalist pattern).

```sql
-- Add to existing materials table structure
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS evidence_status TEXT DEFAULT 'provisional';
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS evidence_quality_score NUMERIC DEFAULT 0;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS promotion_date TIMESTAMPTZ;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS promotion_notes TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS total_mius INTEGER DEFAULT 0;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS last_aggregation_date TIMESTAMPTZ;

ALTER TABLE public.materials ADD CONSTRAINT valid_evidence_status 
  CHECK (evidence_status IN ('provisional', 'verified', 'research-grade'));
ALTER TABLE public.materials ADD CONSTRAINT valid_quality_score
  CHECK (evidence_quality_score >= 0 AND evidence_quality_score <= 100);

CREATE INDEX IF NOT EXISTS materials_evidence_status ON public.materials (evidence_status);
CREATE INDEX IF NOT EXISTS materials_quality_score ON public.materials (evidence_quality_score DESC);
```

**Evidence Status Promotion Logic:**

- **Provisional** (default): Manual entry or <50% parameter coverage
- **Verified**: ≥50% parameters have MIUs, avg ≥2 MIUs per parameter
- **Research-Grade**: 100% parameter coverage, avg ≥3 MIUs per parameter, quality score ≥85

---

### 2.2 Source Library Extensions

**Purpose:** Add quality indicators and access tracking (EC3 pattern).

```sql
-- Add to existing source library structure (KV store implementation)
-- These fields will be added to the Source interface

{
  // Existing fields...
  
  // Quality indicators
  access_status: 'open_access' | 'paywalled' | 'restricted',
  verification_status: 'peer_reviewed' | 'verified' | 'unverified',
  citation_count: number,
  impact_factor: number | null,
  
  // Usage tracking (updated when MIUs reference this source)
  miu_count: number,                    // Total MIUs citing this source
  last_cited_at: string,                // ISO timestamp
  cited_by_materials: string[],         // Array of material IDs
  
  // Prevent deletion if cited
  can_delete: boolean,                  // false if miu_count > 0
}
```

---

### 2.3 User Profiles Extensions

**Purpose:** Public attribution and contributor recognition (Open Food Facts pattern).

```sql
-- Add to existing user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS public_credit BOOLEAN DEFAULT false;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS total_mius_created INTEGER DEFAULT 0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS curator_rank TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS curator_badges JSONB;

ALTER TABLE public.user_profiles ADD CONSTRAINT valid_curator_rank
  CHECK (curator_rank IN ('novice', 'contributor', 'curator', 'expert', 'moderator', NULL));

CREATE INDEX IF NOT EXISTS profiles_total_mius ON public.user_profiles (total_mius_created DESC);
```

---

## 3. TypeScript Interfaces

### 3.1 Evidence Point (MIU)

```typescript
export interface EvidencePoint {
  // Primary
  id: string;
  material_id: string;
  
  // Source linkage
  source_ref: string;
  source_type: 'peer_reviewed' | 'government' | 'industrial' | 'ngo' | 'internal' | 'preprint';
  source_weight: number;
  
  // Parameter
  parameter: 'Y' | 'D' | 'C' | 'M' | 'E' | 'B' | 'N' | 'T' | 'H' | 'L' | 'R' | 'U' | 'C_RU';
  dimension: 'CR' | 'CC' | 'RU';
  
  // Value
  value_raw: number;
  units: string;
  value_norm: number | null;
  transform_version: string;
  
  // Locator (at least one required)
  page?: number;
  figure?: string;
  table_ref?: string;
  paragraph?: string;
  
  // Evidence
  snippet: string;
  screenshot_url?: string;
  
  // Context
  process?: string;
  stream?: string;
  region?: string;
  scale?: string;
  cycles?: number;
  contamination_percent?: number;
  temperature_c?: number;
  time_minutes?: number;
  
  // Derived
  is_derived: boolean;
  derived_formula?: string;
  assumptions?: string;
  
  // Quality
  method_completeness?: 'complete' | 'partial' | 'unclear';
  sample_size?: number;
  confidence_notes?: string;
  
  // Conflict of interest disclosure (Phase 9.0 Day 1 - Legal)
  conflict_of_interest?: string;         -- COI disclosure for industry-funded sources
  
  // Evidence type (Phase 9.0 Day 3 - Negative Evidence Support)
  evidence_type?: 'positive' | 'negative' | 'limit' | 'threshold';
  
  // Restriction flags (Phase 9.0 Day 1 - DMCA/Takedowns)
  restricted_content?: boolean;          -- DMCA takedown flag
  
  // Curation
  curator_id?: string;
  created_at: string;
  updated_at: string;
  codebook_version: string;
  
  // Validation
  validation_status: 'pending' | 'validated' | 'flagged' | 'duplicate';
  validated_by?: string;
  validated_at?: string;
  
  // Session
  extraction_session_id?: string;
}

export interface EvidencePointCreate extends Omit<EvidencePoint, 'id' | 'created_at' | 'updated_at'> {}

export interface EvidencePointFilter {
  material_id?: string;
  parameter?: string;
  dimension?: string;
  source_ref?: string;
  curator_id?: string;
  validation_status?: string;
  process?: string;
  stream?: string;
  region?: string;
  date_from?: string;
  date_to?: string;
}
```

---

### 3.2 Parameter Aggregation

```typescript
export interface ParameterAggregation {
  // Primary
  id: string;
  material_id: string;
  parameter: 'Y' | 'D' | 'C' | 'M' | 'E' | 'B' | 'N' | 'T' | 'H' | 'L' | 'R' | 'U' | 'C_RU';
  dimension: 'CR' | 'CC' | 'RU';
  
  // Statistics
  mean: number;
  se?: number;
  ci95_lower?: number;
  ci95_upper?: number;
  n_mius: number;
  
  // Traceability
  miu_ids: string[];
  weights_used: WeightPolicy;
  
  // Versions
  methods_version: string;
  weight_policy_version: string;
  transform_version: string;
  codebook_version: string;
  ontology_version: string;
  
  // Filters
  filters_applied?: {
    process?: string[];
    stream?: string[];
    region?: string[];
    source_types?: string[];
  };
  
  // Quality
  evidence_quality_score?: number;
  curator_agreement_kappa?: number;
  ci_width?: number;
  source_diversity_count?: number;
  
  // Audit
  calculated_at: string;
  calculated_by?: string;
  notes?: string;
  
  // Versioning
  supersedes_aggregation_id?: string;
  is_current: boolean;
}

export interface WeightPolicy {
  version: string;
  weights: {
    peer_reviewed: number;
    government: number;
    industrial: number;
    ngo: number;
    internal: number;
    preprint: number;
  };
  regional_modifiers?: Record<string, number>;
  process_modifiers?: Record<string, number>;
}

export interface AggregationRequest {
  material_id: string;
  parameter: string;
  miu_ids: string[];
  weight_policy?: WeightPolicy;
  filters?: {
    process?: string[];
    stream?: string[];
    region?: string[];
  };
  notes?: string;
}
```

---

### 3.3 Release

```typescript
export interface Release {
  id: string;
  version: string; // Format: vYYYY.Q[1-4]
  release_date: string;
  
  title: string;
  changelog?: string;
  doi?: string;
  
  // Methodology versions
  whitepaper_cr_version?: string;
  whitepaper_cc_version?: string;
  whitepaper_ru_version?: string;
  weight_policy_version?: string;
  transform_version?: string;
  codebook_version?: string;
  
  // Snapshots
  materials_snapshot: any[];
  aggregations_snapshot?: any[];
  sources_snapshot?: any[];
  
  // Statistics
  total_materials: number;
  total_mius: number;
  total_aggregations?: number;
  research_grade_count?: number;
  verified_count?: number;
  provisional_count?: number;
  
  // Coverage
  dimension_coverage?: Record<string, number>;
  category_coverage?: Record<string, number>;
  
  // Quality
  avg_mius_per_material?: number;
  avg_sources_per_material?: number;
  avg_evidence_quality_score?: number;
  avg_curator_kappa?: number;
  
  created_at: string;
  created_by?: string;
  is_published: boolean;
}
```

---

## 4. KV Store Implementation Strategy

Since WasteDB uses Supabase's KV store (not full Postgres tables), we need to adapt the schema:

### 4.1 Key Naming Conventions

```typescript
// Evidence Points
`evidence_point:${id}`                          // Individual MIU
`material:${materialId}:evidence_points`        // Array of MIU IDs for a material
`parameter:${parameter}:evidence_points`        // Array of MIU IDs for a parameter
`curator:${curatorId}:evidence_points`          // Array of MIU IDs by curator

// Aggregations
`aggregation:${id}`                             // Individual aggregation
`material:${materialId}:aggregations`           // Array of aggregation IDs
`aggregation:current:${materialId}:${parameter}` // Current aggregation for material+parameter

// Releases
`release:${version}`                            // Individual release
`releases:all`                                  // Array of all release versions (sorted)
`release:latest`                                // Latest published release

// Indexes (for efficient lookup)
`index:evidence_points:material:${materialId}`  // Set of MIU IDs
`index:evidence_points:source:${sourceRef}`     // Set of MIU IDs
`index:evidence_points:dimension:${dimension}`  // Set of MIU IDs
`index:aggregations:material:${materialId}`     // Set of aggregation IDs
```

---

### 4.2 Data Structures

```typescript
// KV Store Entry for Evidence Point
{
  key: `evidence_point:${uuid}`,
  value: {
    ...EvidencePoint,
    // All fields from interface
  }
}

// KV Store Entry for Material Index
{
  key: `index:evidence_points:material:${materialId}`,
  value: {
    ids: string[],              // Array of evidence_point IDs
    count: number,
    last_updated: string
  }
}

// KV Store Entry for Aggregation
{
  key: `aggregation:${uuid}`,
  value: {
    ...ParameterAggregation,
    // All fields from interface
  }
}

// KV Store Entry for Current Aggregation
{
  key: `aggregation:current:${materialId}:${parameter}`,
  value: {
    aggregation_id: string,
    updated_at: string
  }
}
```

---

## 5. Validation Rules

### 5.1 Evidence Point Validation

```typescript
function validateEvidencePoint(miu: EvidencePointCreate): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!miu.material_id) errors.push('material_id is required');
  if (!miu.source_ref) errors.push('source_ref is required');
  if (!miu.parameter) errors.push('parameter is required');
  if (miu.value_raw === undefined || miu.value_raw === null) errors.push('value_raw is required');
  if (!miu.units) errors.push('units is required');
  if (!miu.snippet) errors.push('snippet is required (verbatim quote from source)');
  if (!miu.transform_version) errors.push('transform_version is required');
  
  // At least one locator
  if (!miu.page && !miu.figure && !miu.table_ref && !miu.paragraph) {
    errors.push('At least one locator (page, figure, table_ref, or paragraph) is required');
  }
  
  // Derived values require formula
  if (miu.is_derived && !miu.derived_formula) {
    errors.push('derived_formula is required when is_derived is true');
  }
  
  // Valid parameter
  const validParameters = ['Y', 'D', 'C', 'M', 'E', 'B', 'N', 'T', 'H', 'L', 'R', 'U', 'C_RU'];
  if (!validParameters.includes(miu.parameter)) {
    errors.push(`parameter must be one of: ${validParameters.join(', ')}`);
  }
  
  // Auto-derive dimension from parameter
  if (!miu.dimension) {
    miu.dimension = getParameterDimension(miu.parameter);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function getParameterDimension(parameter: string): 'CR' | 'CC' | 'RU' {
  const CR_PARAMS = ['Y', 'D', 'C', 'E'];
  const CC_PARAMS = ['B', 'N', 'T', 'H'];
  const RU_PARAMS = ['L', 'R', 'U', 'C_RU'];
  
  if (CR_PARAMS.includes(parameter)) return 'CR';
  if (CC_PARAMS.includes(parameter)) return 'CC';
  if (RU_PARAMS.includes(parameter)) return 'RU';
  
  // M is shared - determine from context
  return 'CR'; // Default for M
}
```

---

### 5.2 Aggregation Validation

```typescript
function validateAggregation(request: AggregationRequest): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!request.material_id) errors.push('material_id is required');
  if (!request.parameter) errors.push('parameter is required');
  if (!request.miu_ids || request.miu_ids.length === 0) {
    errors.push('At least one MIU is required');
  }
  
  // Minimum MIUs for confidence
  if (request.miu_ids.length < 3) {
    console.warn('Warning: Aggregation has <3 MIUs - will be marked low confidence');
  }
  
  // All MIUs must exist and belong to the material
  // (validated in backend)
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 6. Evidence Quality Scoring

### 6.1 Material Evidence Quality Score

**Algorithm** (from iNaturalist pattern):

```typescript
function computeEvidenceQualityScore(material: Material, mius: EvidencePoint[], aggregations: ParameterAggregation[]): {
  status: 'provisional' | 'verified' | 'research-grade';
  score: number;
} {
  let score = 0;
  
  // 1. Parameter Coverage (40 points)
  const totalParameters = 13; // Y, D, C, M, E, B, N, T, H, L, R, U, C_RU
  const parametersWithMIUs = new Set(mius.map(m => m.parameter)).size;
  score += (parametersWithMIUs / totalParameters) * 40;
  
  // 2. Sample Size (20 points)
  const avgMIUsPerParameter = mius.length / Math.max(parametersWithMIUs, 1);
  if (avgMIUsPerParameter >= 3) score += 20;
  else if (avgMIUsPerParameter >= 2) score += 10;
  else if (avgMIUsPerParameter >= 1) score += 5;
  
  // 3. Source Diversity (15 points)
  const distinctSources = new Set(mius.map(m => m.source_ref)).size;
  score += Math.min(distinctSources * 3, 15);
  
  // 4. Quality Indicators (15 points)
  const hasPeerReviewed = mius.some(m => m.source_type === 'peer_reviewed');
  if (hasPeerReviewed) score += 10;
  
  const avgCIWidth = aggregations.reduce((sum, agg) => {
    if (agg.ci95_lower !== undefined && agg.ci95_upper !== undefined) {
      return sum + (agg.ci95_upper - agg.ci95_lower);
    }
    return sum;
  }, 0) / Math.max(aggregations.length, 1);
  if (avgCIWidth < 0.3) score += 5;
  
  // 5. Validation (10 points)
  const validatedMIUs = mius.filter(m => m.validation_status === 'validated').length;
  const validationRate = validatedMIUs / Math.max(mius.length, 1);
  if (validationRate >= 0.5) score += 10;
  else if (validationRate >= 0.25) score += 5;
  
  // Determine status
  let status: 'provisional' | 'verified' | 'research-grade' = 'provisional';
  
  if (score >= 85 && parametersWithMIUs === totalParameters && avgMIUsPerParameter >= 3) {
    status = 'research-grade';
  } else if (score >= 50 && parametersWithMIUs >= 7 && avgMIUsPerParameter >= 2) {
    status = 'verified';
  }
  
  return { status, score: Math.round(score) };
}
```

---

## 7. Migration Strategy

### 7.1 Phase 9.1 Implementation Steps

1. **Create KV keys for new data structures** (non-breaking)
   - Evidence points will use new key patterns
   - Aggregations will use new key patterns
   - Existing materials/sources remain unchanged initially

2. **Extend existing material objects** (non-breaking)
   - Add `evidence_status`, `evidence_quality_score`, `total_mius` fields
   - Default values: `provisional`, `0`, `0`
   - Update material save logic to preserve new fields

3. **Extend existing source objects** (non-breaking)
   - Add `access_status`, `verification_status`, `miu_count`, `citation_count`
   - Update when MIUs are created

4. **Create backend endpoints** (Phase 9.1)
   - `POST /evidence` - Create MIU
   - `GET /evidence` - List MIUs
   - `POST /aggregate` - Compute aggregation
   - `GET /aggregations` - List aggregations

5. **Update material CRUD operations**
   - When MIUs are created: increment `total_mius`, update `evidence_quality_score`
   - When aggregations are saved: update material parameter values
   - Maintain backward compatibility with manual entry

---

### 7.2 Backward Compatibility

**Critical:** The evidence pipeline is **additive only**. Existing functionality remains:

- ✅ Manual parameter entry still works (Phase 2/5)
- ✅ Source Library Manager unchanged (Phase 5)
- ✅ Calculation endpoints unchanged (Phase 5)
- ✅ Export endpoints unchanged (Phase 7) - will be extended, not replaced
- ✅ All existing materials/sources/parameters preserved

**New materials** can use either:
1. Manual entry → `evidence_status: 'provisional'`
2. MIU extraction → automatic promotion to `verified` or `research-grade`

---

## 8. API Endpoint Specification

### 8.1 Evidence Endpoints

#### POST /make-server-17cae920/evidence
Create a new MIU.

**Request:**
```json
{
  "material_id": "uuid",
  "source_ref": "source-id",
  "parameter": "Y",
  "value_raw": 85.5,
  "units": "%",
  "transform_version": "v1.0",
  "page": 12,
  "snippet": "The mechanical recycling rate for PET bottles was found to be 85.5%",
  "process": "mechanical_recycling",
  "region": "north_america",
  "method_completeness": "complete",
  "sample_size": 50
}
```

**Response:**
```json
{
  "id": "uuid",
  "value_norm": 0.855,
  "dimension": "CR",
  "created_at": "2026-01-15T10:30:00Z",
  "message": "Evidence point created successfully"
}
```

---

#### GET /make-server-17cae920/evidence
Fetch MIUs with filters.

**Query Parameters:**
- `material_id` - Filter by material
- `parameter` - Filter by parameter
- `dimension` - Filter by dimension (CR, CC, RU)
- `source_ref` - Filter by source
- `curator_id` - Filter by curator
- `validation_status` - Filter by validation status
- `limit` - Pagination limit (default: 50)
- `offset` - Pagination offset

**Response:**
```json
{
  "evidence_points": [
    {
      "id": "uuid",
      "material_id": "uuid",
      "parameter": "Y",
      "value_raw": 85.5,
      "value_norm": 0.855,
      "snippet": "...",
      // ... full MIU object
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

---

### 8.2 Aggregation Endpoints

#### POST /make-server-17cae920/aggregate
Compute aggregation from MIUs.

**Request:**
```json
{
  "material_id": "uuid",
  "parameter": "Y",
  "miu_ids": ["uuid1", "uuid2", "uuid3"],
  "weight_policy": {
    "version": "v1.0",
    "weights": {
      "peer_reviewed": 1.0,
      "government": 0.9,
      "industrial": 0.7,
      "ngo": 0.6,
      "internal": 0.5,
      "preprint": 0.4
    }
  },
  "notes": "First aggregation for PET Y parameter"
}
```

**Response:**
```json
{
  "id": "uuid",
  "mean": 0.845,
  "se": 0.032,
  "ci95_lower": 0.781,
  "ci95_upper": 0.909,
  "n_mius": 3,
  "evidence_quality_score": 72,
  "material_updated": true,
  "message": "Aggregation computed and saved successfully"
}
```

---

#### GET /make-server-17cae920/aggregations
Fetch aggregations for a material.

**Query Parameters:**
- `material_id` - Required
- `parameter` - Optional filter
- `current_only` - Boolean, only return current aggregations

**Response:**
```json
{
  "aggregations": [
    {
      "id": "uuid",
      "parameter": "Y",
      "mean": 0.845,
      "n_mius": 3,
      "is_current": true,
      // ... full aggregation object
    }
  ],
  "total": 5
}
```

---

## 9. RLS (Row-Level Security) Policies

### 9.1 Evidence Points

```sql
-- Read: All authenticated users can read evidence points
CREATE POLICY evidence_read ON public.evidence_points
  FOR SELECT
  USING (true);

-- Insert: Admin users only
CREATE POLICY evidence_insert ON public.evidence_points
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Update: Admin users only, cannot change immutable fields
CREATE POLICY evidence_update ON public.evidence_points
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    -- Prevent changing core evidence (only allow metadata updates)
    old.material_id = new.material_id
    AND old.source_ref = new.source_ref
    AND old.parameter = new.parameter
    AND old.value_raw = new.value_raw
    AND old.snippet = new.snippet
  );

-- Delete: Admin users only, only if not referenced in aggregations
CREATE POLICY evidence_delete ON public.evidence_points
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.parameter_aggregations
      WHERE new.id = ANY(parameter_aggregations.miu_ids)
    )
  );
```

---

### 9.2 Parameter Aggregations

```sql
-- Read: All authenticated users
CREATE POLICY aggregations_read ON public.parameter_aggregations
  FOR SELECT
  USING (true);

-- Insert/Update/Delete: Admin only
CREATE POLICY aggregations_write ON public.parameter_aggregations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
```

---

## 10. Data Guards

### 10.1 Prevent Source Deletion if Cited

```typescript
async function canDeleteSource(sourceRef: string): Promise<{ canDelete: boolean; reason?: string }> {
  // Check if any MIUs reference this source
  const miuIds = await kv.get(`index:evidence_points:source:${sourceRef}`);
  
  if (miuIds && miuIds.ids && miuIds.ids.length > 0) {
    return {
      canDelete: false,
      reason: `Cannot delete source: ${miuIds.ids.length} evidence points reference this source. Remove evidence points first.`
    };
  }
  
  return { canDelete: true };
}
```

---

### 10.2 Prevent MIU Deletion if Aggregated

```typescript
async function canDeleteEvidencePoint(miuId: string): Promise<{ canDelete: boolean; reason?: string }> {
  // Find all aggregations
  const allAggregations = await kv.getByPrefix('aggregation:');
  
  for (const agg of allAggregations) {
    if (agg.value.miu_ids && agg.value.miu_ids.includes(miuId)) {
      return {
        canDelete: false,
        reason: `Cannot delete evidence point: it is referenced in aggregation ${agg.value.id}. Remove from aggregation first.`
      };
    }
  }
  
  return { canDelete: true };
}
```

---

## 11. Performance Considerations

### 11.1 Indexing Strategy

**High-Priority Indexes:**
- `(material_id, parameter)` - Most common query pattern
- `source_ref` - For source usage tracking
- `dimension` - For dimension-filtered queries
- `created_at DESC` - For recent activity feeds

**Secondary Indexes:**
- `curator_id` - For curator dashboards
- `validation_status` - For quality control workflows
- Context fields `(process, stream, region)` - For aggregation filtering

---

### 11.2 KV Store Optimization

**Denormalization:**
- Store MIU IDs array on material objects for fast lookup
- Cache aggregation results on material objects
- Maintain count fields (`total_mius`, `miu_count`) to avoid full scans

**Batch Operations:**
- Fetch multiple MIUs in parallel using `mget()`
- Batch update indexes when creating/deleting MIUs
- Use transaction-like patterns for aggregation + material update

---

## 12. Testing Strategy

### 12.1 Unit Tests

- ✅ Validate MIU creation with all required fields
- ✅ Validate MIU creation fails without required fields
- ✅ Validate aggregation computation with weighted mean
- ✅ Validate evidence quality score calculation
- ✅ Validate status promotion logic

---

### 12.2 Integration Tests

- ✅ Create MIU → verify indexes updated
- ✅ Create aggregation → verify material updated
- ✅ Delete source → blocked if MIUs exist
- ✅ Delete MIU → blocked if aggregated
- ✅ Update material status based on evidence

---

## 13. Next Steps (Phase 9.1 Implementation)

### Day 1-2: Backend Setup
- [ ] Create evidence endpoint handlers in `/supabase/functions/server/index.tsx`
- [ ] Implement KV store CRUD for evidence points
- [ ] Implement KV store CRUD for aggregations
- [ ] Add validation logic

### Day 3-4: Aggregation Logic
- [ ] Implement weighted statistics computation
- [ ] Implement evidence quality scoring
- [ ] Add material promotion logic
- [ ] Update material objects with aggregation results

### Day 5: Testing & Documentation
- [ ] Write unit tests for validation
- [ ] Write integration tests for endpoints
- [ ] Update API documentation
- [ ] Create migration guide

---

## 14. Related Documentation

- `/docs/PHASE_9_ROADMAP.md` - Phase 9 high-level roadmap
- `/docs/NOV12_SOURCES.md` - Source integration specification
- `/docs/SOURCE_SCHEMA.md` - Source Library interface
- `/docs/PHASE_9_STATUS.md` - Phase 9 implementation status
- `/ROADMAP.md` - Project roadmap

---

**Status:** 📐 Planning Complete  
**Ready for Phase 9.1 Implementation:** ✅  
**Schema Version:** v1.0  
**Last Updated:** November 14, 2025