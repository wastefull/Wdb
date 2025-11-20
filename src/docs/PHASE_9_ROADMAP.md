# Phase 9 Roadmap: Evidence Pipeline & Curation System

**Status:** Phase 9.0 ✅ | Phase 9.1 ✅ | Phase 9.2 🚧  
**Target Completion:** Q1 2026  
**Last Updated:** November 20, 2025

---

## 🎯 Mission

Transform WasteDB from a **parameter-entry system** to an **evidence-extraction platform** where every numeric value is traceable to specific passages in peer-reviewed literature.

### Core Innovation: Minimally Interpretable Units (MIUs)

**MIUs** are immutable evidence points that record:
- Exact source location (page, figure, table)
- Verbatim snippet from original text
- Raw value with units
- Normalization transform (versioned)
- Extraction context (process, region, scale)
- Curator identity and timestamp

MIUs are aggregated using **documented weighting policies** to produce the Y, D, C, M, E, B, N, T, H, L, R, U, C_RU parameter values that power WasteDB's sustainability scores.

### Design Principles

Drawing from proven platforms (EC3, iNaturalist, Open Food Facts, ecoinvent):

1. **Evidence as First-Class Objects** - Sources with verification badges and quality signals
2. **Research Grade Promotion** - Quality tiers (provisional → verified → research-grade)
3. **Contributor Recognition** - Public attribution for curators
4. **Release Cadence** - Quarterly versioned snapshots for reproducibility
5. **Progressive Disclosure** - Simple labels with deep links to evidence
6. **Metadata Discipline** - Comprehensive documentation for consistency

---

## 🔗 Relationship to Existing Infrastructure

### Builds On (Non-Breaking)

✅ **Source Library Manager** (Phase 5)
- MIUs reference Library Sources via stable `source_ref` ID
- Usage tracking prevents deletion of cited sources

✅ **Scientific Data Editor** (Phase 2/5)
- Parameter fields remain; Evidence Pipeline feeds them via aggregation
- Manual entry still supported for rapid prototyping

✅ **Multi-Dimensional Infrastructure** (Phase 5)
- MIU extraction supports CR, CC, RU dimensions
- Composite scores derive from MIU-aggregated parameters

✅ **Export Layer** (Phase 3/7)
- Research JSON will include MIU IDs for replication
- API endpoints extend to serve evidence metadata

### Extends (Additive)

🆕 **Curation Workbench** - Admin tool for MIU extraction  
🆕 **Aggregation Engine** - Weighted statistics with versioned policies  
🆕 **Evidence Tab** - Public-facing MIU traceability view  
🆕 **Quality Metrics** - Inter-curator agreement (κ), time-per-MIU tracking

---

## 📊 Current State

### Materials
- **Count:** 8 materials (across 8 categories)
- **Migration Burden:** LOW - only 8 materials to backfill with MIUs

### Sources
- **Global Library:** ~50 sources with tags, DOIs, abstracts
- **PDF Storage:** Supabase bucket `make-17cae920-sources`

### Parameters
- **CR (Recyclability):** Y, D, C, M, E (5 parameters)
- **CC (Compostability):** B, N, T, H (4 parameters)
- **RU (Reusability):** L, R, U, C_RU (4 parameters)
- **Total:** 13 unique parameters (M is shared across CR, CC, RU)

---

## 🚀 Phase Timeline

### ✅ Phase 9.0: Critical Infrastructure (COMPLETE)

**Duration:** 11 days (Nov 12-17, 2025)  
**Goal:** Establish production-ready infrastructure before MIU extraction begins

**Completed:**
- ✅ Legal & licensing policy (CC BY 4.0 for MIUs, fair use for snippets)
- ✅ DMCA takedown process with 72-hour response guarantee
- ✅ Transform governance with versioned definitions and auto-recompute
- ✅ Controlled vocabularies (units, context ontologies)
- ✅ Evidence collection system (CRUD endpoints, Evidence Lab UI)
- ✅ Validation rules (server + client-side)
- ✅ Observability & monitoring (structured logging, notifications)
- ✅ Data guards (prevent deletion of referenced sources)
- ✅ Policy snapshots for reproducibility
- ✅ Backup & export infrastructure
- ✅ Security hardening (RLS simulation, signed URLs)
- ✅ Comprehensive test suite (40+ automated tests)

**See:** `/docs/PHASE_9_STATUS.md` for detailed completion summary

---

### ✅ Phase 9.1: Database Schema & Backend (COMPLETE)

**Duration:** 2 days (Nov 18-20, 2025)  
**Goal:** Extend Phase 9.0 with validation workflow and aggregations

**Completed:**

#### Evidence Points Schema Extensions
- ✅ Extended Phase 9.0 schema with 8 new fields:
  - `source_ref`, `source_weight`, `validation_status`
  - `validated_by`, `validated_at`, `restricted_content`
  - `conflict_of_interest`, `dimension`
- ✅ Full backward compatibility with Phase 9.0 data

#### Parameter Aggregations (NEW)
- ✅ Complete aggregation system with versioning
- ✅ Weighted mean calculations with CI95
- ✅ MIU traceability via `miu_ids` array
- ✅ Policy snapshot integration
- ✅ Quality metrics (evidence_quality_score, source_diversity)

#### API Endpoints (11 total)
- ✅ Evidence CRUD + validation endpoints (5)
- ✅ Aggregation endpoints (5)
- ✅ Data guard endpoints (1)

#### Data Integrity
- ✅ Source deletion blocked if MIUs reference it
- ✅ Aggregation versioning (only one current per material+parameter)
- ✅ KV-based indexes for efficient querying

#### Testing
- ✅ 10 automated tests covering all endpoints
- ✅ Integrated into unified TestSuite component

**See:** `/docs/PHASE_9_SCHEMA.md` for complete schema documentation

---

### 🚧 Phase 9.2: Curation Workbench UI (IN PROGRESS)

**Duration:** 1-2 weeks (estimated)  
**Goal:** Build UI for evidence extraction workflow

**Scope:**
- **Pilot:** CR dimension only (Recyclability)
- **Materials:** 3 high-priority (Aluminum, PET, Cardboard)
- **Parameters:** Y, D, C, M, E (5 parameters)

**Deliverables:**

#### Curation Workbench
- [ ] Split-pane interface (Source Viewer + Evidence Wizard)
- [ ] PDF annotation and highlighting tools
- [ ] Source navigation (page jump, figure zoom)
- [ ] Smart context pre-fill (detect material, parameter from context)

#### Evidence Wizard (5 Steps)
1. [ ] **Parameter Selection** - Select parameter code
2. [ ] **Value Extraction** - Input raw value + units (validated against ontology)
3. [ ] **Locator** - Specify page/figure/table
4. [ ] **Confidence & Context** - Set confidence level, add context tags
5. [ ] **Review & Submit** - Preview MIU before creation

#### Double-Extraction Validation
- [ ] Assign same source to 2 curators
- [ ] Compute inter-rater reliability (κ)
- [ ] Target: κ ≥ 0.7 (substantial agreement)
- [ ] Conflict resolution workflow for low κ

#### Performance Tracking
- [ ] Time-per-MIU metrics
- [ ] Target: <3 minutes per MIU creation
- [ ] Curator leaderboard (opt-in)

**Success Criteria:**
- 3 materials have ≥3 MIUs per parameter
- κ ≥ 0.7 for all double-extracted sources
- <3 minutes average extraction time

---

### 📋 Phase 9.3: Aggregation Engine & Validation (PLANNED)

**Duration:** 2-3 weeks (estimated)  
**Goal:** Build admin tools for computing aggregations and validating quality

**Deliverables:**

#### Aggregation Builder UI
- [ ] MIU selection/filtering interface
- [ ] Weight policy selector (peer-reviewed vs whitepaper)
- [ ] Real-time preview of weighted mean + CI95
- [ ] Outlier detection and flagging
- [ ] One-click aggregation computation

#### Quality Dashboard
- [ ] Evidence coverage heatmap (materials × parameters)
- [ ] Quality score visualization (0-100 scale)
- [ ] Source diversity metrics
- [ ] CI width distribution
- [ ] Inter-rater reliability (κ) tracking

#### Validation Workflow
- [ ] Admin review queue for pending MIUs
- [ ] Batch validation tools
- [ ] Flagging system for suspicious values
- [ ] Duplicate detection

#### Material Promotion
- [ ] Auto-compute evidence quality score
- [ ] Promote to "research-grade" when criteria met:
  - All 13 parameters covered
  - ≥3 MIUs per parameter
  - Quality score ≥85
  - κ ≥0.7
- [ ] Display badges on material cards

**Success Criteria:**
- 3 pilot materials reach "research-grade" status
- All aggregations have documented policy snapshots
- Quality metrics dashboard functional

---

### 📋 Phase 9.4: Scale to All Materials (PLANNED)

**Duration:** 3-4 weeks (estimated)  
**Goal:** Extend evidence pipeline to all 8 materials and all 3 dimensions

**Scope:**
- **Materials:** All 8 existing materials
- **Dimensions:** CR, CC, RU (all three)
- **Parameters:** All 13 unique parameters

**Deliverables:**

#### Full Dimension Support
- [ ] CC dimension (B, N, T, H parameters) MIU extraction
- [ ] RU dimension (L, R, U, C_RU parameters) MIU extraction
- [ ] Cross-dimension consistency checks (M parameter shared)

#### Curator Onboarding
- [ ] Curator training materials
- [ ] Video tutorials for Evidence Wizard
- [ ] Codebook reference (v1.0)
- [ ] Example MIUs for each parameter

#### Batch Operations
- [ ] Bulk import MIUs from CSV
- [ ] Batch validation tools
- [ ] Batch aggregation computation

#### Performance Optimization
- [ ] Caching for aggregation lookups
- [ ] Lazy loading for large MIU lists
- [ ] Background jobs for recompute tasks

**Success Criteria:**
- All 8 materials have MIUs for ≥10 parameters
- ≥3 materials reach "research-grade" status
- Curator training completion rate ≥80%

---

### 📋 Phase 9.5: Public Launch & Documentation (PLANNED)

**Duration:** 2 weeks (estimated)  
**Goal:** Make evidence pipeline visible to public users

**Deliverables:**

#### Public Evidence Tab
- [ ] Read-only view of validated MIUs
- [ ] Material-specific evidence page
- [ ] Source citation links
- [ ] Curator attribution (opt-in only)
- [ ] COI disclosure badges

#### API Documentation
- [ ] OpenAPI/Swagger schema for evidence endpoints
- [ ] API usage examples
- [ ] Rate limiting documentation
- [ ] Authentication guide

#### User Guides
- [ ] "How to Read Evidence" tutorial
- [ ] MIU citation generator
- [ ] Aggregation methodology explainer
- [ ] Transform changelog

#### Release Management
- [ ] v2026.Q1 release preparation
- [ ] Release changelog generation
- [ ] Snapshot creation (material data + MIU counts)
- [ ] Release announcement

**Success Criteria:**
- Public Evidence tab accessible on all materials
- API documentation complete
- First quarterly release (v2026.Q1) published

---

## 📈 Success Metrics

### Phase 9.0
✅ All 11 days completed  
✅ 40+ automated tests passing  
✅ Legal framework established  

### Phase 9.1
✅ 11 API endpoints implemented  
✅ 10 automated tests passing  
✅ Zero breaking changes  

### Phase 9.2 (In Progress)
- [ ] 3 materials with ≥3 MIUs per parameter
- [ ] κ ≥ 0.7 for double-extraction
- [ ] <3 minutes per MIU creation

### Phase 9.3-9.5 (Planned)
- [ ] All 8 materials with evidence coverage
- [ ] ≥3 materials "research-grade"
- [ ] Public Evidence tab launched
- [ ] First quarterly release published

---

## 🔄 Migration Strategy

### Current State → Evidence Pipeline
1. Existing parameter values remain untouched
2. MIUs created via Curation Workbench
3. Aggregations computed from MIUs
4. Manual values gradually replaced by aggregated values
5. Evidence status promoted from "provisional" → "verified" → "research-grade"

### Backward Compatibility
- All Phase 9.0 endpoints continue working
- Manual parameter entry still supported
- Export formats remain unchanged (JSON/CSV)
- No breaking changes to existing materials

---

## Related Documentation

- **Status:** `/docs/PHASE_9_STATUS.md` - Detailed completion summary
- **Schema:** `/docs/PHASE_9_SCHEMA.md` - Database schema & API reference
- **Overall:** `/docs/ROADMAP.md` - Full WasteDB roadmap

---

## Notes

### Why Pilot-First (Phase 9.2)?
- Validates workflow before scaling
- Faster iteration on UX
- Risk mitigation (test assumptions with CR dimension only)
- CR parameters most critical for launch

### Why KV Store (Phase 9.0-9.2)?
- No database migrations in Figma Make environment
- Sufficient for pilot scope
- Easy migration to Postgres later

### Why Quarterly Releases?
- Follows ecoinvent/Open Food Facts pattern
- Reproducible research (pinned versions)
- Controlled quality gate
- Predictable update schedule
