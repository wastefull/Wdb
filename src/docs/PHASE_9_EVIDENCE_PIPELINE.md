# Phase 9: Evidence Pipeline & Curation System

**Status:** 📋 PLANNED  
**Foundation Document:** `/docs/NOV12_SOURCES.md`  
**Design Influences:** `/docs/SIMILAR.md` (comparative platform analysis)  
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

### Design Principles (from Platform Analysis)

Drawing from proven platforms like EC3, iNaturalist, Open Food Facts, and ecoinvent:

1. **Evidence as First-Class Objects** - Sources treated like EPDs with verification badges and quality signals
2. **Research Grade Promotion** - Quality tiers (provisional → verified → research-grade) based on evidence coverage
3. **Contributor Recognition** - Public attribution for curators with leaderboards and badges
4. **Release Cadence** - Quarterly versioned snapshots for reproducible research
5. **Progressive Disclosure** - Simple labels with deep links to full evidence traceability
6. **Metadata Discipline** - Comprehensive documentation suite for curator consistency

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

**Goal:** Establish database tables and API endpoints for MIU storage, aggregation, and release management.

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
- ⬜ Create `public.releases` table (**NEW - ecoinvent pattern**)
  - Release version (e.g., "v2026.Q1")
  - Release date, changelog
  - Whitepaper versions (CR, CC, RU), weight policy version, transform version
  - Material snapshot (JSONB full data at release time)
  - Statistics (total materials, MIUs, research-grade count)
- ⬜ Extend `public.materials` table (**NEW - iNaturalist pattern**)
  - `evidence_status` ENUM ('provisional', 'verified', 'research-grade')
  - `evidence_quality_score` NUMERIC (0-100)
  - `promotion_date` TIMESTAMPTZ
- ⬜ Extend Source Library table (**NEW - EC3 pattern**)
  - `access_status` TEXT ('open_access', 'paywalled', 'restricted')
  - `verification_status` TEXT ('peer_reviewed', 'verified', 'unverified')
  - `citation_count` INTEGER
  - `impact_factor` NUMERIC
- ⬜ Extend `user_profiles` table (**NEW - Open Food Facts pattern**)
  - `public_credit` BOOLEAN (opt-in for attribution)
  - `display_name` TEXT (optional alias for public display)
- ⬜ Add indexes: `(material_id, parameter)`, `source_ref`, `evidence_status`
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
  - **Compute evidence quality score and promote to research-grade if criteria met**
- ⬜ `GET  /make-server-17cae920/releases` (**NEW**)
  - List all releases with versions, dates, changelogs
- ⬜ `POST /make-server-17cae920/releases` (**NEW**)
  - Create new release snapshot
  - Capture material data, MIU count, stats
- ⬜ Update export endpoints:
  - `GET /make-server-17cae920/export/full?release=v2026.Q1` - Support release versioning
  - Include MIU IDs, curator credits in research JSON

**Research Grade Promotion Logic** (**NEW - iNaturalist pattern**):
```typescript
function computeEvidenceStatus(material: Material): {
  status: 'provisional' | 'verified' | 'research-grade';
  score: number;
} {
  const parameterCount = countParametersWithMIUs(material);
  const avgMIUsPerParameter = calculateAvgMIUsPerParameter(material);
  const mixedSourceTypes = countDistinctSourceTypes(material);
  const hasPeerReviewed = checkForPeerReviewedSources(material);
  const avgCIWidth = calculateAvgCIWidth(material);
  const kappa = getLatestKappaScore(material);
  
  let score = 0;
  
  // Coverage (40 points)
  score += (parameterCount / 13) * 40;
  
  // Sample size (20 points)
  if (avgMIUsPerParameter >= 3) score += 20;
  else if (avgMIUsPerParameter >= 2) score += 10;
  
  // Source diversity (15 points)
  score += Math.min(mixedSourceTypes * 5, 15);
  
  // Quality indicators (15 points)
  if (hasPeerReviewed) score += 10;
  if (avgCIWidth < 0.3) score += 5;
  
  // Validation (10 points)
  if (kappa >= 0.7) score += 10;
  else if (kappa >= 0.5) score += 5;
  
  // Determine status
  if (score >= 85 && parameterCount === 13 && avgMIUsPerParameter >= 3) {
    return { status: 'research-grade', score };
  } else if (score >= 60) {
    return { status: 'verified', score };
  } else {
    return { status: 'provisional', score };
  }
}
```

**Data Guards:**
- ⬜ Prevent deletion of Library Sources with MIU references
- ⬜ Usage count tracking (sources → materials → MIUs)
- ⬜ Duplicate MIU detection (same source + page + parameter + value)

**Success Criteria:**
- ✅ Schema deployed to Supabase without errors
- ✅ All endpoints return correct status codes
- ✅ Validation rejects malformed MIUs
- ✅ Aggregation math matches manual calculations
- ✅ Research grade promotion logic tested with sample data
- ✅ Release snapshot captures complete material state

**Estimated Effort:** 2.5 weeks (+0.5 weeks for enhanced features)

---

### **Phase 9.2: Curation Workbench (Pilot - CR Only)** ⬜ NOT STARTED

**Goal:** Build MIU extraction UI with evidence-as-first-class-objects and validate with CR dimension for 3 pilot materials.

**Deliverables:**

**UI Components:**
- ⬜ `CurationWorkbench.tsx` - Split-pane layout
  - Left: Source Viewer (PDF display, page navigation, **evidence object card**)
  - Right: Evidence Wizard (5-step flow)
- ⬜ `EvidenceWizard.tsx` - 5-step MIU creation
  - **Step 1: Locate** - Source search, page/figure/table input, snippet capture
  - **Step 2: Classify** - Parameter selector (Y, D, C, M, E only for pilot), context tags
  - **Step 3: Quantify** - Raw value + units, unit conversion, normalization preview
  - **Step 4: Confidence** - Method completeness, sample size, notes
  - **Step 5: Review** - Summary, save button, "Add another from this source"
- ⬜ `SourceSelector.tsx` - Search Library Sources, display metadata **with badges**
- ⬜ `SourceEvidenceCard.tsx` (**NEW - EC3 pattern**) - First-class source display
  - Access status badge (🔓 Open Access / 🔒 Paywalled / ⚠️ Restricted)
  - Verification badge (✓ Peer Reviewed / ✓ Verified / ⚠️ Unverified)
  - Impact factor display
  - Citation count
  - Quality score visual (0-100)
- ⬜ `SnippetCapture.tsx` - Text input + optional screenshot upload
- ⬜ `PDFHighlighter.tsx` (**NEW - EC3 pattern**) - Highlight MIU locations
  - Yellow overlay on extracted passages
  - Click to view MIU details
  - Multiple highlights per page support
- ⬜ `UnitConverter.tsx` - Common unit conversions (%, g/kg, MJ/kg, etc.)
- ⬜ `ContextTags.tsx` - Process, stream, region, scale dropdowns
- ⬜ `MIUCard.tsx` - Read-only display of extracted MIU

**Workflow Features:**
- ⬜ Source Library integration (search, select, view PDF)
- ⬜ **Source evidence card** with access/verification badges (**NEW**)
- ⬜ **PDF highlighting** for previously extracted MIUs (**NEW**)
- ⬜ Page/figure/table reference fields
- ⬜ Verbatim snippet (required, min 20 characters)
- ⬜ Screenshot capture tool (optional, stored in Supabase)
- ⬜ Parameter dropdown (filtered to CR parameters for pilot)
- ⬜ Raw value validation (numeric, required)
- ⬜ Units dropdown (%, ratio, kg/kg, MJ/kg, TRL, facility count)
- ⬜ Normalization preview (apply transform version v1.0)
- ⬜ Derived value support (formula input, show calculation)
- ⬜ Auto-cache source type and default weight from Library Source
- ⬜ **Auto-populate access_status and verification_status** (**NEW**)
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
- ✅ Source badges displayed correctly for all sources
- ✅ PDF highlighting functional for returning to same source

**Estimated Effort:** 3.5 weeks (+0.5 weeks for evidence object features)

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

**Goal:** Expose evidence traceability to public users, implement research-grade status system, release management, and curator quality tools.

**Deliverables:**

**Public UI Components (Progressive Disclosure - How2Recycle pattern):**
- ⬜ Update `MaterialCard.tsx` - Simple top-level display
  - Research-grade badge (🥇/🥈/🥉 or hidden if provisional)
  - Recyclability: 82/100 [simple bar]
  - "View evidence" link (progressive disclosure)
- ⬜ Update `MaterialDetail.tsx` - Expanded view
  - Practical vs. Theoretical scores with ±CI
  - Quantile-Halo visualization
  - "Based on X evidence points from Y sources"
  - Link to Evidence tab
- ⬜ `EvidenceTab.tsx` - Full traceability (Level 3 disclosure)
  - Read-only MIU list grouped by parameter
  - Display source title, locator, snippet preview
  - Link to Library Source (DOI/URL)
  - Show aggregation summary (mean, CI95, n)
  - **Source Evidence Cards** with badges (**NEW**)
- ⬜ `MIUCardPublic.tsx` - User-friendly evidence card
  - Parameter badge (color-coded by dimension)
  - Verbatim snippet (expandable)
  - Source citation with year + verification badge
  - Normalized value visualization (0-1 scale)
- ⬜ `AggregationSummary.tsx` - How parameter was calculated
  - "Based on X evidence points from Y sources"
  - Weighted mean formula (simplified)
  - Confidence interval display
  - Link to full methodology whitepaper
- ⬜ `ResearchGradeBadge.tsx` (**NEW - iNaturalist pattern**)
  - Display badge on material cards
  - 🥇 Research Grade (gold) - score ≥85, complete coverage
  - 🥈 Verified (blue) - score ≥60
  - 🥉 Provisional (gray) - score <60
  - Tooltip explaining promotion criteria
  - "Help improve this material" button for provisional status
- ⬜ `ReleasesPage.tsx` (**NEW - ecoinvent pattern**)
  - List all releases (v2026.Q1, v2025.Q4, etc.)
  - Download links (CSV/JSON snapshots)
  - Changelog per release
  - Whitepaper versions, methodology changes
  - Material count, MIU count, research-grade count
- ⬜ `ContributorsPage.tsx` (**NEW - Open Food Facts pattern**)
  - Curator leaderboard (top curators by MIU count)
  - Curator badges (Bronze/Silver/Gold based on contributions)
  - Recent contributions feed
  - "Become a curator" call-to-action

**Export Extensions:**
- ⬜ Update `/export/full` (research JSON):
  - Include `miu_ids` array for each parameter
  - Add `aggregation_metadata` (weights, policy version, timestamp)
  - Include `evidence_count` per parameter
  - Add `evidence_status` and `evidence_quality_score` (**NEW**)
  - Add `curator_credits` array with display names (opt-in) (**NEW**)
- ⬜ Add `/evidence/export` endpoint:
  - Full MIU dump (CSV/JSON)
  - Fields: material, parameter, source, locator, snippet, raw_value, normalized_value, context, curator
  - Filter by material, parameter, source, curator, date range
  - Include curator attribution (respecting opt-in preference) (**NEW**)

**Curator Quality Tools:**
- ⬜ `CuratorDashboard.tsx` - Performance metrics
  - MIUs created (count, by parameter, by material)
  - Time-per-MIU statistics (median, 90th percentile)
  - Agreement metrics (κ score from double-extraction)
  - Outlier detection (MIUs >2 SD from aggregated mean)
  - **Curator badge display** (Bronze/Silver/Gold) (**NEW**)
  - **Public profile settings** (opt-in/out of attribution) (**NEW**)
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
- ⬜ `ReleaseManager.tsx` (**NEW - ecoinvent pattern**)
  - Create new release snapshot
  - Select materials to include
  - Generate changelog (compare to previous release)
  - Set whitepaper versions
  - Export snapshot (CSV/JSON)
  - Publish release (makes it available via API)

**Validation & Alerts:**
- ⬜ CI width alerts (warn if >0.3, suggest more MIUs)
- ⬜ Low sample size warnings (n <3)
- ⬜ Outlier MIU flagging (>2 SD, prompt for review)
- ⬜ Missing parameter coverage (materials with <3 MIUs for a parameter)
- ⬜ Stale aggregations (MIUs added but aggregation not recomputed)
- ⬜ **Evidence quality score recalculation** after new MIUs (**NEW**)
- ⬜ **Promotion notifications** (material achieves research-grade) (**NEW**)

**Documentation (Expanded Suite - USLCI pattern):**
- ⬜ **Curator Codebook v0** (human-readable guidelines)
  - Golden rules
  - Parameter-specific extraction guidance (Y, D, C, M, E, B, N, T, H, L, R, U, C_RU)
  - MIU checklist
  - Double-extraction protocol
- ⬜ **Transform Documentation v1.0** (**NEW**)
  - Normalization formulas for each parameter
  - Unit conversion tables
  - Examples per parameter (raw → normalized)
  - Version history
- ⬜ **Weight Policy Documentation v1.0** (**NEW**)
  - Source type → weight mapping
  - Rationale for weights
  - How to propose weight adjustments
  - Sensitivity analysis examples
- ⬜ **Quality Assurance Guide** (**NEW**)
  - Double-extraction protocol
  - Disagreement resolution
  - Outlier detection and handling
  - Research-grade promotion criteria
- ⬜ **API Documentation Updates**
  - Evidence endpoints
  - Release versioning
  - Curator attribution in exports

**Success Criteria:**
- ✅ Evidence tab live on all 8 material pages with progressive disclosure
- ✅ Public users can trace every parameter to ≥3 MIUs
- ✅ Research-grade badges displayed on material cards
- ✅ All 8 materials have evidence_status computed
- ✅ Releases page with at least one published release (v2026.Q1 pilot)
- ✅ Contributors page with curator leaderboard
- ✅ Research export includes full MIU IDs, aggregation metadata, and curator credits
- ✅ Curator dashboard tracks quality metrics and badge status
- ✅ Double-extraction tools facilitate consistency checks
- ✅ **All 4 documentation guides** published and linked from Workbench
- ✅ Release management UI functional for admins

**Estimated Effort:** 4 weeks (+1 week for research-grade system, releases, expanded docs)

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
**Duration:** 4 weeks (+1 week for research-grade system, releases, expanded docs)  
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

## 🌟 WasteDB's Unique Differentiators

Phase 9 combines best practices from proven platforms to create a system that uniquely leads in materials sustainability data:

### **vs. RecyClass** (Plastics Packaging Assessment)
- ✅ **WasteDB:** Cross-material scope (8 categories, not just plastics)
- ✅ **WasteDB:** Open, research-grade exports (not just PDF reports)
- ✅ **WasteDB:** Three dimensions (CR, CC, RU) vs. single recyclability score
- ✅ **Shared:** Clear assessment methodology and regional framing

### **vs. How2Recycle** (Consumer Labeling)
- ✅ **WasteDB:** Evidence tab with MIU-level traceability (not just labels)
- ✅ **WasteDB:** Dual scores (practical + theoretical) show innovation gap
- ✅ **WasteDB:** Uncertainty visualization (quantile-halo plots)
- ✅ **Shared:** Simple top-level labels with progressive disclosure

### **vs. EC3** (Building Transparency - EPD Database)
- ✅ **WasteDB:** Multi-parameter scoring (13 parameters) vs. single carbon metric
- ✅ **WasteDB:** MIU-level provenance (page/figure/snippet) vs. document-level
- ✅ **WasteDB:** Uncertainty bands (CI95) for all parameters
- ✅ **Shared:** Evidence objects with verification status, document versioning, open API

### **vs. Material Circularity Indicator** (Ellen MacArthur Foundation)
- ✅ **WasteDB:** Per-parameter evidence trail vs. aggregated circularity score
- ✅ **WasteDB:** Open API and live database vs. Excel tool + PDF methodology
- ✅ **WasteDB:** Community curation with quality tiers
- ✅ **Shared:** Rigorous methodology PDF, transparency in calculation

### **vs. USLCI / LCA Commons** (NREL Life Cycle Inventory)
- ✅ **WasteDB:** Consumer-facing scores (0-100) + research data
- ✅ **WasteDB:** 5-step contributor wizard vs. submission handbook only
- ✅ **WasteDB:** Real-time web UI vs. data file archives
- ✅ **Shared:** Metadata discipline, submission guidelines, quality standards

### **vs. ecoinvent** (Global LCI - Licensed)
- ✅ **WasteDB:** Open access (no paywall)
- ✅ **WasteDB:** Citizen-science intake (volunteer curators)
- ✅ **WasteDB:** Per-datum traceability (MIU snippets)
- ✅ **Shared:** Versioned releases (quarterly), review cycles, quality guidelines

### **vs. Open Food Facts** (Crowdsourced Product Database)
- ✅ **WasteDB:** Scientific rigor (double-extraction, κ ≥ 0.7)
- ✅ **WasteDB:** Weighted aggregation vs. raw field display
- ✅ **WasteDB:** Research-grade promotion system
- ✅ **Shared:** Open data license, contributor credit, nightly dumps, "every field sourced"

### **vs. iNaturalist** (Community Science)
- ✅ **WasteDB:** Quantitative parameters + weighted statistics
- ✅ **WasteDB:** Evidence-based (not observation-based)
- ✅ **WasteDB:** Structured 5-step extraction wizard
- ✅ **Shared:** Research-grade status, peer review, verification flags, reputation system

---

## 🎯 What Makes Phase 9 Unique

**No existing platform combines ALL of these:**

1. **Dual-Score Model** (Practical + Theoretical)
   - Communicates both current reality AND future potential
   - Gap visualization shows innovation opportunity
   - Unique to WasteDB

2. **MIU-Level Provenance** (Page/Figure/Snippet)
   - Brings LCA-grade traceability to accessible UI
   - Public Evidence tab with verbatim snippets
   - Unique granularity vs. document-level citations

3. **Volunteer-Friendly Curation with Research Rigor**
   - 5-step wizard (< 3 min per MIU)
   - Double-extraction validation (κ ≥ 0.7)
   - Research-grade promotion system
   - Bridges citizen science AND academic standards

4. **Evidence as First-Class Objects**
   - Sources with verification badges (EC3 pattern)
   - Access status signals (Open Access / Paywalled)
   - Impact factor and citation count display
   - PDF highlighting for extracted passages

5. **Three-Dimensional Coverage**
   - Recyclability (CR), Compostability (CC), Reusability (RU)
   - 13 parameters across all dimensions
   - Shared infrastructure maturity (M_value)
   - Complete circular economy view

6. **Quantile-Halo Uncertainty Visualization**
   - Communicates confidence intervals visually
   - Three modes: Overlap / Near-Overlap / Gap
   - Accessible (WCAG-compliant, reduced-motion support)
   - Unique to WasteDB (not found in any comparison platform)

7. **Versioned Releases for Reproducibility**
   - Quarterly snapshots (v2026.Q1, etc.)
   - Full changelog and methodology versioning
   - API support for historical data
   - Academic citation-ready

8. **Progressive Disclosure**
   - Level 1: Simple score + badge (material card)
   - Level 2: Practical/Theoretical + visualization (detail page)
   - Level 3: Full evidence trail (Evidence tab)
   - Serves both lay users AND researchers

---

## 🚀 Strategic Position

**WasteDB sits at the intersection of:**

- **Consumer Clarity** (How2Recycle-style labeling)
- **Scientific Uncertainty** (USLCI-style metadata)
- **Innovation Potential** (Dual-score gap visualization)
- **Open Access** (Open Food Facts-style licensing)
- **Research Rigor** (ecoinvent-style review cycles)
- **Community Contribution** (iNaturalist-style curation)
- **Evidence Transparency** (EC3-style provenance)

**No other platform occupies this full space.**

This unique position enables WasteDB to serve:
- **Consumers:** Simple 0-100 scores with trusted badges
- **Industry:** Benchmarking data and procurement decisions
- **Researchers:** FAIR-compliant datasets with full provenance
- **Policy:** Evidence-based standards and regional comparisons
- **Innovators:** Gap metrics showing improvement opportunities

---

**This is the foundation document for Phase 9. Implementation begins after Phase 8 completion.**

---

**Last Updated:** November 12, 2025  
**Status:** Specification Complete, Enhanced with SIMILAR.md Patterns  
**Next Action:** Finalize Phase 8, then implement Phase 9.1 (Database Schema)