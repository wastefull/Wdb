# Phase 9: Evidence Pipeline & Curation System

**Status:** 📋 PLANNED  
**Foundation Document:** `/docs/NOV12_SOURCES.md`  
**Target Completion:** Q1 2026  
**Last Updated:** November 12, 2025

---

## 🎯 Overview

Phase 9 establishes WasteDB's **Evidence-Based Curation Pipeline** - a systematic workflow for extracting granular evidence from academic sources, validating curator consistency, and aggregating data into the scientific parameters that power WasteDB's sustainability scores.

### Mission

Transform WasteDB from a **parameter-entry system** to an **evidence-extraction platform** where every numeric value is traceable to specific passages, figures, and tables in peer-reviewed literature.

### Core Innovation

**Minimally Interpretable Units (MIUs)** - Immutable evidence points that record:
- Exact source location (page, figure, table)
- Verbatim snippet from original text
- Raw value with units
- Normalization transform (versioned)
- Extraction context (process, region, scale)
- Curator identity and timestamp

MIUs are aggregated using **documented weighting policies** to produce the Y, D, C, M, E, B, N, T, H, L, R, U, C_RU parameter values that feed into WasteDB's CR, CC, and RU composite scores.

---

## 🔗 Relationship to Existing Infrastructure

### Builds On (Non-Breaking)

✅ **Source Library Manager** (Phase 5)
- Remains the single source of truth for bibliographic metadata
- MIUs reference Library Sources via stable `source_ref` ID
- Usage tracking prevents deletion of cited sources

✅ **Scientific Data Editor** (Phase 2/5)
- Parameter fields (Y, D, C, M, E, B, N, T, H, L, R, U, C_RU) remain
- Evidence Pipeline **feeds** these fields via aggregation
- Manual entry still supported for rapid prototyping

✅ **Multi-Dimensional Infrastructure** (Phase 5)
- CR, CC, RU calculation endpoints exist
- MIU extraction supports all three dimensions
- Composite scores derive from MIU-aggregated parameters

✅ **Export Layer** (Phase 3/7)
- Public CSV already exports 0-100 scores
- Research JSON will include MIU IDs for replication
- API endpoints extend to serve evidence metadata

### Extends (Additive)

🆕 **Curation Workbench** - New admin tool for MIU extraction  
🆕 **Aggregation Engine** - Weighted statistics with versioned policies  
🆕 **Evidence Tab** - Public-facing MIU traceability view  
🆕 **Quality Metrics** - Inter-curator agreement (κ), time-per-MIU tracking  

---

## 📊 Current State (Pre-Phase 9)

### Materials
- **Count:** 8 materials (all draft status)
- **Coverage:** Across 8 categories (Plastics, Metals, Glass, Paper & Cardboard, Fabrics & Textiles, Electronics & Batteries, Building Materials, Organic/Natural Waste)
- **Data Quality:** Parameter values entered manually with source citations
- **Migration Burden:** LOW - only 8 materials to backfill with MIUs

### Sources
- **Global Library:** ~50 sources with tags, DOIs, abstracts
- **Material Citations:** Each material has 3-5 sources with parameter mapping
- **PDF Storage:** Supabase Storage bucket `make-17cae920-sources`

### Parameters
- **CR (Recyclability):** Y, D, C, M, E (5 parameters)
- **CC (Compostability):** B, N, T, H, M (5 parameters, M shared)
- **RU (Reusability):** L, R, U, C_RU, M (5 parameters, M shared)
- **Total:** 13 unique parameters (M is shared across dimensions)

---

## 🚀 Phased Rollout Strategy

Phase 9 is divided into **5 sub-phases** with a **pilot-first approach** that validates the system with CR dimension before scaling to all three dimensions.

### Pilot Scope (Phase 9.1-9.2)

**Focus:** Recyclability (CR) dimension only  
**Materials:** 3 high-priority materials (Aluminum, PET Plastic, Cardboard)  
**Parameters:** Y, D, C, M, E (5 parameters)  
**Goal:** Validate MIU extraction workflow, curator agreement, and aggregation accuracy

### Full Scope (Phase 9.3-9.5)

**Focus:** All three dimensions (CR, CC, RU)  
**Materials:** All 8 existing materials  
**Parameters:** All 13 unique parameters  
**Goal:** Production-ready evidence pipeline supporting complete WasteDB methodology

---

## 📋 Phase Breakdown

### **Phase 9.1: Database Schema & Backend** ⬜ NOT STARTED

**Goal:** Establish database tables and API endpoints for MIU storage and aggregation.

**Deliverables:**

**Database Schema:**
- ✅ Design complete (see NOV12_SOURCES.md § 6)
- ⬜ Create `public.evidence_points` table (MIUs)
  - Material reference, source reference, parameter
  - Raw value + units, normalized value, transform version
  - Locator (page, figure, table, paragraph)
  - Verbatim snippet (required)
  - Context tags (process, stream, region, scale, cycles, contamination %, temp, time)
  - Derived formula + assumptions (for calculated values)
  - Method completeness, sample size
  - Curator ID, timestamp, codebook version
- ⬜ Create `public.parameter_aggregations` table
  - Material ID, parameter
  - Weighted mean, SE, CI95, n (sample size)
  - MIU IDs (array), weight policy snapshot (JSON)
  - Methods version, calculation timestamp, operator ID
- ⬜ Add indexes: `(material_id, parameter)`, `source_ref`
- ⬜ Create views: `v_materials_public`, `v_materials_research`
- ⬜ Implement RLS policies (read: all, write: admin)

**Backend Endpoints:**
- ⬜ `GET  /make-server-17cae920/evidence?material&parameter`
  - Fetch MIUs for a given material and/or parameter
  - Filter by source, curator, date range
- ⬜ `POST /make-server-17cae920/evidence`
  - Create new MIU
  - Validate: parameter, raw value + units, locator, snippet, transform version
  - Return: MIU ID and confirmation
- ⬜ `GET  /make-server-17cae920/aggregations?material`
  - Fetch aggregations for a material
  - Include MIU IDs, weights, CI95
- ⬜ `POST /make-server-17cae920/aggregate`
  - Compute weighted statistics from selected MIUs
  - Save aggregation with policy snapshot
  - Update material parameter fields
- ⬜ Update export endpoints:
  - `GET /make-server-17cae920/export/full` - Include MIU IDs in research JSON

**Data Guards:**
- ⬜ Prevent deletion of Library Sources with MIU references
- ⬜ Usage count tracking (sources → materials → MIUs)
- ⬜ Duplicate MIU detection (same source + page + parameter + value)

**Success Criteria:**
- ✅ Schema deployed to Supabase without errors
- ✅ All endpoints return correct status codes
- ✅ Validation rejects malformed MIUs
- ✅ Aggregation math matches manual calculations

**Estimated Effort:** 2 weeks

---

### **Phase 9.2: Curation Workbench (Pilot - CR Only)** ⬜ NOT STARTED

**Goal:** Build MIU extraction UI and validate with CR dimension for 3 pilot materials.

**Deliverables:**

**UI Components:**
- ⬜ `CurationWorkbench.tsx` - Split-pane layout
  - Left: Source Viewer (PDF display, page navigation)
  - Right: Evidence Wizard (5-step flow)
- ⬜ `EvidenceWizard.tsx` - 5-step MIU creation
  - **Step 1: Locate** - Source search, page/figure/table input, snippet capture
  - **Step 2: Classify** - Parameter selector (Y, D, C, M, E only for pilot), context tags
  - **Step 3: Quantify** - Raw value + units, unit conversion, normalization preview
  - **Step 4: Confidence** - Method completeness, sample size, notes
  - **Step 5: Review** - Summary, save button, "Add another from this source"
- ⬜ `SourceSelector.tsx` - Search Library Sources, display metadata
- ⬜ `SnippetCapture.tsx` - Text input + optional screenshot upload
- ⬜ `UnitConverter.tsx` - Common unit conversions (%, g/kg, MJ/kg, etc.)
- ⬜ `ContextTags.tsx` - Process, stream, region, scale dropdowns
- ⬜ `MIUCard.tsx` - Read-only display of extracted MIU

**Workflow Features:**
- ⬜ Source Library integration (search, select, view PDF)
- ⬜ Page/figure/table reference fields
- ⬜ Verbatim snippet (required, min 20 characters)
- ⬜ Screenshot capture tool (optional, stored in Supabase)
- ⬜ Parameter dropdown (filtered to CR parameters for pilot)
- ⬜ Raw value validation (numeric, required)
- ⬜ Units dropdown (%, ratio, kg/kg, MJ/kg, TRL, facility count)
- ⬜ Normalization preview (apply transform version v1.0)
- ⬜ Derived value support (formula input, show calculation)
- ⬜ Auto-cache source type and default weight from Library Source
- ⬜ MIU ID display after save
- ⬜ "Add another from this source" quick-action

**Pilot Execution:**
- ⬜ Select 3 materials: **Aluminum**, **PET Plastic**, **Cardboard**
- ⬜ Extract MIUs for CR parameters only (Y, D, C, M, E)
- ⬜ Target: ≥3 MIUs per parameter per material (minimum 45 total MIUs)
- ⬜ Two curators extract independently for same material (double-extraction)
- ⬜ Track time-per-MIU (target: median <3 minutes)

**Success Criteria:**
- ✅ 45+ MIUs created for 3 pilot materials
- ✅ Median time-per-MIU ≤ 3 minutes after first day
- ✅ Inter-curator agreement κ ≥ 0.7 on categorical fields (parameter, process)
- ✅ Median numeric delta ≤ 5% on raw values
- ✅ 100% of MIUs have valid locator + snippet

**Estimated Effort:** 3 weeks

---

### **Phase 9.3: Aggregation Engine & Validation** ⬜ NOT STARTED

**Goal:** Build aggregation UI, compute weighted statistics, and validate against existing parameter values.

**Deliverables:**

**UI Components:**
- ⬜ `AggregationEngine.tsx` - Main aggregation interface
  - Material selector
  - Parameter selector
  - MIU list with filter controls
  - Weight policy display
  - Compute button → results panel
- ⬜ `MIUFilterPanel.tsx` - Filter by source type, region, process, date
- ⬜ `MIUSelectionTable.tsx` - Checkbox selection, display raw/normalized values
- ⬜ `WeightPolicyDisplay.tsx` - Show weights, policy version, sensitivity controls
- ⬜ `AggregationResults.tsx` - Display mean, SE, CI95, n, MIU IDs
- ⬜ `ParameterUpdateButton.tsx` - Write aggregation to material fields

**Aggregation Features:**
- ⬜ Select MIUs for material × parameter
- ⬜ Apply weight policy (default: source type weights)
- ⬜ Compute weighted mean: `Σ(w_i × v_i) / Σ(w_i)`
- ⬜ Compute standard error: `SE = sqrt(Σ(w_i × (v_i - mean)²) / Σ(w_i))`
- ⬜ Compute 95% confidence interval: `CI95 = [mean - 1.96×SE, mean + 1.96×SE]`
- ⬜ Display sample size (n = number of MIUs)
- ⬜ Save aggregation record with:
  - MIU IDs (array)
  - Weight policy snapshot (JSON)
  - Methods version (e.g., "CR-v1")
  - Timestamp and operator ID
- ⬜ Update material parameter fields (e.g., `Y_value`, `D_value`)

**Validation Tests:**
- ⬜ Compare aggregated values to existing manual entries
- ⬜ Target: ≤5% difference for pilot materials
- ⬜ Identify outlier MIUs (>2 SD from mean)
- ⬜ Test sensitivity to weight adjustments (±10% weight change)

**Quality Controls:**
- ⬜ CI width alerts (warn if CI95 width >0.3)
- ⬜ Minimum n requirement (warn if <3 MIUs)
- ⬜ Duplicate MIU detection (same source + locator + value)
- ⬜ Aggregation audit log (track who computed what when)

**Success Criteria:**
- ✅ Aggregated Y, D, C, M, E values for 3 pilot materials
- ✅ Values within ±5% of existing manual entries
- ✅ All aggregations have n ≥ 3
- ✅ CI95 width <0.3 for 90% of parameters
- ✅ Aggregation records saved with complete metadata

**Estimated Effort:** 2 weeks

---

### **Phase 9.4: Scale to All Three Dimensions** ⬜ NOT STARTED

**Goal:** Extend Curation Workbench and Aggregation Engine to support CC (Compostability) and RU (Reusability) dimensions for all 8 materials.

**Deliverables:**

**Workbench Extensions:**
- ⬜ Update parameter dropdown to include all 13 parameters:
  - **CR:** Y, D, C, M, E
  - **CC:** B, N, T, H, M (M shared with CR/RU)
  - **RU:** L, R, U, C_RU, M (M shared with CR/CC)
- ⬜ Add dimension selector (CR / CC / RU) for context
- ⬜ Update unit conversion for CC/RU-specific units:
  - **CC:** biodegradation rate (%), days to decompose, toxicity level
  - **RU:** durability (cycles), repairability index, cleanability score
- ⬜ Extend context tags:
  - **CC:** composting conditions (temp, moisture, time, system type)
  - **RU:** use case, wear patterns, cleaning protocols
- ⬜ Add parameter-specific guidance tooltips

**Material Coverage:**
- ⬜ Expand from 3 pilot materials to all 8 materials:
  - Aluminum (CR focus)
  - PET Plastic (CR focus)
  - Cardboard (CR + CC focus)
  - Glass (CR + RU focus)
  - Cotton Fabric (CC + RU focus)
  - Lithium-Ion Battery (RU focus, special handling)
  - Concrete (RU + recycling challenges)
  - Food Waste (CC focus)
- ⬜ Extract MIUs for relevant dimensions per material
- ⬜ Target: ≥3 MIUs per parameter per material (estimated 200-300 total MIUs)

**Aggregation Extensions:**
- ⬜ Support CC and RU parameter aggregation
- ⬜ Handle shared M_value across dimensions:
  - Option 1: Single MIU pool for M, used by all dimensions
  - Option 2: Dimension-specific M_value MIUs (infrastructure maturity varies)
- ⬜ Update material fields:
  - **CC:** `B_value`, `N_value`, `T_value`, `H_value`, `M_value`
  - **RU:** `L_value`, `R_value`, `U_value`, `C_RU_value`, `M_value`
- ⬜ Trigger composite score recalculation:
  - Update `CC_practical_mean`, `CC_theoretical_mean`, `CC_practical_CI95`, `CC_theoretical_CI95`
  - Update `RU_practical_mean`, `RU_theoretical_mean`, `RU_practical_CI95`, `RU_theoretical_CI95`

**Double-Extraction Validation:**
- ⬜ Select 2 materials for full double-extraction (all dimensions)
- ⬜ Two curators independently extract MIUs
- ⬜ Calculate inter-curator agreement:
  - **Categorical:** κ (kappa) for parameter, process, region
  - **Numeric:** median absolute delta for raw values
- ⬜ Adjudication process for disagreements
- ⬜ Update Curator Codebook v0 based on findings

**Success Criteria:**
- ✅ All 8 materials have MIU coverage for relevant dimensions
- ✅ All 13 parameters covered with ≥3 MIUs where applicable
- ✅ Double-extraction κ ≥ 0.7 for categorical fields
- ✅ Double-extraction numeric delta ≤ 5%
- ✅ Composite scores (CR, CC, RU) recalculated from aggregated parameters
- ✅ **ALL THREE DIMENSIONS (CR, CC, RU) FULLY SUPPORTED**

**Estimated Effort:** 4 weeks

---

### **Phase 9.5: Public Evidence Layer & Quality Tools** ⬜ NOT STARTED

**Goal:** Expose evidence traceability to public users and implement curator quality management tools.

**Deliverables:**

**Public UI Components:**
- ⬜ `EvidenceTab.tsx` - New tab on material detail pages
  - Read-only MIU list grouped by parameter
  - Display source title, locator, snippet preview
  - Link to Library Source (DOI/URL)
  - Show aggregation summary (mean, CI95, n)
- ⬜ `MIUCardPublic.tsx` - User-friendly evidence card
  - Parameter badge (color-coded by dimension)
  - Verbatim snippet (expandable)
  - Source citation with year
  - Normalized value visualization (0-1 scale)
- ⬜ `AggregationSummary.tsx` - How parameter was calculated
  - "Based on X evidence points from Y sources"
  - Weighted mean formula (simplified)
  - Confidence interval display
  - Link to full methodology whitepaper

**Export Extensions:**
- ⬜ Update `/export/full` (research JSON):
  - Include `miu_ids` array for each parameter
  - Add `aggregation_metadata` (weights, policy version, timestamp)
  - Include `evidence_count` per parameter
- ⬜ Add `/evidence/export` endpoint:
  - Full MIU dump (CSV/JSON)
  - Fields: material, parameter, source, locator, snippet, raw_value, normalized_value, context
  - Filter by material, parameter, source, curator, date range

**Curator Quality Tools:**
- ⬜ `CuratorDashboard.tsx` - Performance metrics
  - MIUs created (count, by parameter, by material)
  - Time-per-MIU statistics (median, 90th percentile)
  - Agreement metrics (κ score from double-extraction)
  - Outlier detection (MIUs >2 SD from aggregated mean)
- ⬜ `DoubleExtractionCompare.tsx` - Side-by-side diff
  - Show two curators' MIUs for same source/parameter
  - Highlight disagreements (parameter, value, context)
  - Adjudication controls (accept A, accept B, merge, reject both)
- ⬜ `CodebookManager.tsx` - Version control for curator guidelines
  - Display current codebook version
  - Track changes (who updated what when)
  - Link to training materials
- ⬜ `MIUAuditLog.tsx` - Full history
  - Who created/edited each MIU
  - Timestamp trail
  - Filter by curator, material, date

**Validation & Alerts:**
- ⬜ CI width alerts (warn if >0.3, suggest more MIUs)
- ⬜ Low sample size warnings (n <3)
- ⬜ Outlier MIU flagging (>2 SD, prompt for review)
- ⬜ Missing parameter coverage (materials with <3 MIUs for a parameter)
- ⬜ Stale aggregations (MIUs added but aggregation not recomputed)

**Documentation:**
- ⬜ Curator Codebook v0 (human-readable guidelines)
- ⬜ Parameter-specific extraction guidance (Y, D, C, M, E, B, N, T, H, L, R, U, C_RU)
- ⬜ Transform version documentation (normalization formulas)
- ⬜ Weight policy documentation (source type → weight mapping)
- ⬜ API documentation updates (evidence endpoints)

**Success Criteria:**
- ✅ Evidence tab live on all 8 material pages
- ✅ Public users can trace every parameter to ≥3 MIUs
- ✅ Research export includes full MIU IDs and aggregation metadata
- ✅ Curator dashboard tracks quality metrics
- ✅ Double-extraction tools facilitate consistency checks
- ✅ Codebook v0 published and linked from Workbench

**Estimated Effort:** 3 weeks

---

## 📊 Final Deliverables (End of Phase 9)

Upon completion of Phase 9, WasteDB will have:

### Data Infrastructure ✅
- ✅ **~250-300 MIUs** covering all 13 parameters across 8 materials
- ✅ **Evidence traceability** for every parameter value (≥3 MIUs each)
- ✅ **Aggregation records** with versioned weight policies
- ✅ **Complete coverage** of CR, CC, and RU dimensions

### Tools & Workflows ✅
- ✅ **Curation Workbench** - 5-step MIU extraction wizard
- ✅ **Aggregation Engine** - Weighted statistics with sensitivity analysis
- ✅ **Curator Dashboard** - Quality metrics and performance tracking
- ✅ **Double-Extraction Tools** - Inter-curator agreement validation

### Public Transparency ✅
- ✅ **Evidence Tab** on material pages - Full MIU traceability
- ✅ **Research Export** with MIU IDs - Replication support
- ✅ **API Endpoints** for evidence access - Programmatic querying

### Quality Standards ✅
- ✅ **Inter-curator agreement** κ ≥ 0.7
- ✅ **Time efficiency** median <3 min per MIU
- ✅ **Numeric accuracy** ≤5% delta on raw values
- ✅ **Sample size** ≥3 MIUs per parameter
- ✅ **CI95 width** <0.3 for 90% of aggregations

### Documentation ✅
- ✅ **Curator Codebook v0** - Extraction guidelines
- ✅ **Transform Versioning** - Normalization formulas
- ✅ **Weight Policy** - Source type → weight mapping
- ✅ **API Docs** - Evidence endpoint specifications

---

## 🎯 Success Metrics

### Quantitative Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Total MIUs created | 250-300 | Database count |
| Parameters with ≥3 MIUs | 100% | Coverage report |
| Inter-curator κ (categorical) | ≥0.7 | Double-extraction analysis |
| Median numeric delta | ≤5% | Double-extraction analysis |
| Median time-per-MIU | <3 min | Timestamp tracking |
| CI95 width <0.3 | ≥90% | Aggregation statistics |
| Materials with complete evidence | 8/8 (100%) | Dashboard view |
| Dimensions fully supported | 3/3 (CR, CC, RU) | System capability |

### Qualitative Goals

- ✅ **Reproducibility:** External researchers can replicate parameter values from MIU data
- ✅ **Transparency:** Every number traces to a specific passage in a source
- ✅ **Scalability:** Volunteer curators can contribute without admin bottleneck
- ✅ **Efficiency:** Curator onboarding <1 day, productive extraction after training
- ✅ **Quality:** Aggregated values match or improve upon manual parameter entries

---

## 🔄 Migration from Current State

### Current System (Pre-Phase 9)
- 8 materials with manually-entered parameter values
- 3-5 sources per material with parameter mapping
- Parameters: Y, D, C, M, E, B, N, T, H, L, R, U, C_RU

### Transition Strategy

**Option 1: Fresh Extraction (Recommended)**
- Treat existing parameter values as "legacy estimates"
- Extract MIUs from scratch using Curation Workbench
- Validate: aggregated MIUs should match legacy values within ±10%
- If major discrepancies, investigate and document

**Option 2: Backfill Legacy MIUs**
- Create "synthetic" MIUs from existing source citations
- Mark with `is_derived: true` and `assumptions: "backfilled from legacy parameter"`
- Use existing parameter value as normalized value
- Reverse-engineer raw value if possible
- Lower weight (0.5) due to imprecision

**Recommended:** Option 1 for pilot materials (Aluminum, PET, Cardboard), Option 2 for remaining 5 materials if time-constrained.

### Data Continuity
- ✅ Public-facing scores (0-100) unchanged during migration
- ✅ Source Library remains intact
- ✅ Material IDs stable (no breaking changes)
- ✅ Scientific Data Editor continues to work
- ✅ Export endpoints maintain backward compatibility

---

## 🛡️ Risk Mitigation

### Risk 1: Curator Time Commitment
**Risk:** MIU extraction takes longer than 3 min/MIU target  
**Mitigation:**
- Pilot with experienced users first
- Iterate on UI based on time tracking data
- Add keyboard shortcuts and auto-fill features
- Provide "quick mode" for simple extractions

### Risk 2: Low Inter-Curator Agreement
**Risk:** κ <0.7 due to ambiguous parameters or codebook  
**Mitigation:**
- Start with clearest parameters (Y, D)
- Refine codebook based on disagreements
- Add parameter-specific guidance and examples
- Implement real-time feedback in Workbench

### Risk 3: Source Availability
**Risk:** PDFs behind paywalls or poor quality scans  
**Mitigation:**
- Focus on open-access sources first
- Partner with university libraries for access
- Accept non-PDF sources (screenshots, HTML snippets)
- Document access barriers in source metadata

### Risk 4: Aggregation Discrepancies
**Risk:** Aggregated values differ significantly from manual entries  
**Mitigation:**
- Validate with pilot materials first
- Document and investigate discrepancies >10%
- Allow override with documented rationale
- Maintain "legacy value" field for comparison

### Risk 5: Scope Creep
**Risk:** Attempting too many materials/dimensions too quickly  
**Mitigation:**
- **Strict phasing:** Pilot CR only → Scale to all dimensions
- **Success gates:** Don't proceed to Phase 9.4 until 9.3 validates
- **Time-box:** Cap Phase 9 at 14 weeks total

---

## 📅 Timeline

### Phase 9.1: Database & Backend
**Duration:** 2 weeks  
**Dependencies:** None (can start immediately after Phase 8)

### Phase 9.2: Curation Workbench (Pilot)
**Duration:** 3 weeks  
**Dependencies:** 9.1 complete  
**Deliverable:** 45 MIUs for CR parameters on 3 materials

### Phase 9.3: Aggregation Engine
**Duration:** 2 weeks  
**Dependencies:** 9.2 complete  
**Deliverable:** Validated aggregations for pilot materials

### Phase 9.4: Scale to All Dimensions
**Duration:** 4 weeks  
**Dependencies:** 9.3 validates (±5% accuracy)  
**Deliverable:** 250-300 MIUs covering all 13 parameters, 8 materials, 3 dimensions

### Phase 9.5: Public Evidence Layer
**Duration:** 3 weeks  
**Dependencies:** 9.4 complete  
**Deliverable:** Evidence tab, curator tools, research export

### **Total Duration: 14 weeks (~3.5 months)**

---

## 🎓 Training & Onboarding

### Curator Onboarding Checklist
- [ ] Read Curator Codebook v0
- [ ] Watch MIU extraction demo video (5 min)
- [ ] Complete practice extraction (2 MIUs)
- [ ] Double-extract with experienced curator (validation)
- [ ] Achieve κ ≥ 0.7 on practice set
- [ ] Get access to Curation Workbench
- [ ] Extract first 10 MIUs under supervision
- [ ] Independent extraction approved

### Training Materials
- ⬜ Curator Codebook v0 (written guide)
- ⬜ Video walkthrough of 5-step wizard
- ⬜ Parameter-specific extraction examples
- ⬜ Unit conversion reference table
- ⬜ Common pitfalls and how to avoid them
- ⬜ Quality checklist (locator, snippet, units, transform)

---

## 📚 Related Documentation

### Foundation Documents
- `/docs/NOV12_SOURCES.md` - Full technical specification
- `/docs/SOURCE_SCHEMA.md` - Source interface definitions
- `/docs/SOURCE_TRACEABILITY.md` - Philosophy and workflow

### Whitepapers
- `/whitepapers/CR-v1.md` - Recyclability methodology
- `/whitepapers/CC-v1.md` - Compostability methodology
- `/whitepapers/RU-v1.md` - Reusability methodology
- `/whitepapers/Statistical_Methodology.md` - Aggregation math

### Existing Infrastructure
- `/docs/PHASE_5_COMPLETE.md` - Source Library Manager
- `/docs/PHASE_2_COMPLETE.md` - Scientific Data Editor
- `/docs/PHASE_7_COMPLETE.md` - Research API

---

## 🎉 Expected Outcomes

Upon completion of Phase 9:

### For Researchers
- ✅ **Reproducible data:** Replicate any parameter from MIU IDs
- ✅ **Transparent methods:** Versioned transforms and weight policies
- ✅ **Sensitivity analysis:** Test impact of weight adjustments
- ✅ **Regional specificity:** Filter MIUs by geography

### For Curators
- ✅ **Structured workflow:** Clear 5-step extraction process
- ✅ **Quality feedback:** Real-time metrics and agreement tracking
- ✅ **Efficient tools:** <3 min per MIU after training
- ✅ **Recognition:** Curator attribution on MIUs

### For Public Users
- ✅ **Evidence access:** See exact passages supporting each score
- ✅ **Source links:** Click DOIs to read original papers
- ✅ **Confidence context:** Understand n and CI95 per parameter
- ✅ **Trust building:** Transparent provenance of every number

### For WasteDB Platform
- ✅ **Research credibility:** Gold-standard data quality
- ✅ **Scalable curation:** Volunteer-driven evidence extraction
- ✅ **Three-dimensional coverage:** CR, CC, RU fully implemented
- ✅ **Foundation for Phase 10+:** Weight calibration, regional models, predictive analytics

---

## ✅ Phase 9 Completion Criteria

Phase 9 is complete when:

- ✅ Database schema deployed (`evidence_points`, `parameter_aggregations`)
- ✅ All 6 evidence endpoints functional and tested
- ✅ Curation Workbench supports all 13 parameters across CR, CC, RU
- ✅ 250-300 MIUs created covering all 8 materials
- ✅ Every parameter has ≥3 MIUs (100% coverage)
- ✅ Aggregation engine produces weighted means, SE, CI95
- ✅ All material parameter fields updated from aggregations
- ✅ Evidence tab visible on all 8 material pages
- ✅ Research export includes MIU IDs and aggregation metadata
- ✅ Curator dashboard tracks quality metrics
- ✅ Double-extraction validation achieves κ ≥ 0.7
- ✅ Median time-per-MIU ≤ 3 minutes
- ✅ Codebook v0 published
- ✅ API documentation updated

### **CRITICAL:** All Three Dimensions Supported

**By the end of Phase 9, the Evidence Pipeline must support:**
- ✅ **Recyclability (CR)** - Y, D, C, M, E parameters
- ✅ **Compostability (CC)** - B, N, T, H, M parameters
- ✅ **Reusability (RU)** - L, R, U, C_RU, M parameters

**Evidence extraction, aggregation, and public traceability are fully functional for all three sustainability dimensions.**

---

**This is the foundation document for Phase 9. Implementation begins after Phase 8 completion.**

---

**Last Updated:** November 12, 2025  
**Status:** Specification Complete, Awaiting Phase 8 Completion  
**Next Action:** Finalize Phase 8, then implement Phase 9.1 (Database Schema)
