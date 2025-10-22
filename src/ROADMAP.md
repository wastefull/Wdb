# **ROADMAP.md**

*A development roadmap for integrating Wastefull's data science methodology into the WasteDB platform.*

---

## **Overview**

**Project:** WasteDB
**Organization:** Wastefull
**Purpose:** Build an open, accessible, and scientifically rigorous materials database that communicates both the *practical* and *theoretical* sustainability of materials across three dimensions: **Recyclability (CR)**, **Compostability (CC)**, and **Reusability (RU)**.

This roadmap outlines the technical milestones and feature dependencies required to evolve WasteDB from a user-facing sustainability tracker into a dual-layer scientific-public system that fully implements the Wastefull methodology described in the *Statistical and Accessibility Methodology White Paper* and accompanying methodology whitepapers (CR-v1, CC-v1, RU-v1, VIZ-v1).

---

## **System Vision**

WasteDB will:

1. Present **practical, lay-friendly data** (0–100 compostability, recyclability, reusability scores).
2. Maintain a **scientific backend layer** with normalized parameters for all three dimensions, confidence intervals, and source weighting.
3. Allow researchers and admins to compute, audit, and update scores via the in-app *Data Processing View*.
4. Keep all scientific methods transparent, versioned, and linked to public whitepapers.
5. Communicate uncertainty visually through the **Hybrid Quantile-Halo Visualization Model** (VIZ-v1).

---

## **Major Phases**

### **1. Data Model Integration** ✅ COMPLETE

**Goal:** Introduce the WasteDB scientific data layer without disrupting the public schema.

**Deliverables** ✅

* Extend Supabase schema for new scientific fields across all three dimensions:

  **Recyclability (CR-v1):**
  * `CR_practical_mean`, `CR_practical_CI95`, `CR_theoretical_mean`, `CR_theoretical_CI95`
  * Parameters: `Y_value`, `D_value`, `C_value`, `M_value`, `E_value`
  
  **Compostability (CC-v1):**
  * `CC_practical_mean`, `CC_practical_CI95`, `CC_theoretical_mean`, `CC_theoretical_CI95`
  * Parameters: `B_value`, `N_value`, `T_value`, `H_value`, `M_value`
  
  **Reusability (RU-v1):**
  * `RU_practical_mean`, `RU_practical_CI95`, `RU_theoretical_mean`, `RU_theoretical_CI95`
  * Parameters: `L_value`, `R_value`, `U_value`, `C_value`, `M_value`
  
  **Shared metadata:**
  * `confidence_level`, `sources`, `whitepaper_version`, `method_version`, `calculation_timestamp`

* Preserve existing public fields for backward compatibility (`recyclability = CR_practical_mean * 100`).
* Add migration scripts and validate new endpoints.
* Ensure localStorage mirrors public data only for performance.

**Status:** Completed October 20, 2025. Currently only CR (Recyclability) fully implemented; CC and RU data fields planned.

---

### **2. Admin & Research Tools** ✅ COMPLETE

**Goal:** Give administrators and researchers full control of scientific parameters.

**Deliverables** ✅

* Extend *Data Processing View* with dual modes (Theoretical & Practical).
* Compute both $CR_{theo}$ and $CR_{prac}$ and write results to Supabase.
* Add confidence interval display and "show parameter detail" toggle.
* Create *Admin Source Manager* for editing JSON-based citation metadata.
* Auto-recalculate confidence categories on save.

**Status:** Completed October 20, 2025 for CR (Recyclability). Extension to CC and RU planned.

---

### **3. Public Data & Export Layer** ✅ COMPLETE

**Goal:** Translate scientific data into user-friendly CSVs and visualizations.

**Deliverables** ✅

* ✅ Build `/api/export/public` for lay-friendly CSVs (0–100 scale).
* ✅ Build `/api/export/full` for researchers (raw normalized data + CI).
* ✅ Implement mapping logic:

  * `recyclability = CR_practical_mean * 100`
  * `compostability = 100 × (1 - D)` for biological materials
  * optional `(est.)` flag for low-confidence entries
* ✅ Support `.csv` and `.json` export formats.

**Status:** Completed October 20, 2025. See `/docs/PHASE_3_COMPLETE.md` for details.

---

### **4. Visualization & Accessibility** ✅ COMPLETE

**Goal:** Communicate uncertainty and scientific rigor through accessible, unified visualizations.

**Deliverables** ✅

* ✅ Implemented **Hybrid Quantile-Halo Visualization Model (VIZ-v1)** for all three dimensions
* ✅ Created unified renderer with three visualization modes:
  * **Overlap Mode:** Dense quantile dots across shared confidence intervals
  * **Near-Overlap Mode:** Bridging dots with soft merged halos
  * **Gap Mode:** Separated halos with gradient gap zone showing innovation potential
* ✅ Comprehensive accessibility support:
  * High-contrast mode with distinct color palettes
  * Dark mode variants with appropriate contrast
  * Reduced-motion mode for users with vestibular disorders
  * Full ARIA labels and keyboard navigation
* ✅ Interactive opacity states (hover animations on halos)
* ✅ Tooltips showing practical/theoretical means, confidence intervals, and gap metrics
* ✅ Score bar colors (dimension-specific): Recyclability (yellow), Compostability (coral), Reusability (blue-gray)
* ✅ Documentation: `/whitepapers/VIZ-v1.md`, `/docs/VIZ_UNIFIED.md`

**Status:** Completed October 22, 2025. See `/docs/PHASE_4_VISUALIZATION_COMPLETE.md` for details.

---

### **5. Multi-Dimensional Scientific Data Layer** 🔄 IN PROGRESS

**Goal:** Extend scientific data infrastructure to Compostability and Reusability.

**Backend Deliverables** ✅
* ✅ Extend Material type with 20 new fields (CC and RU parameters + composite indices)
* ✅ Add calculation logic for CC (Compostability) composite index
* ✅ Add calculation logic for RU (Reusability) composite index
* ✅ Create `/calculate/compostability` endpoint
* ✅ Create `/calculate/reusability` endpoint
* ✅ Create `/calculate/all-dimensions` batch endpoint
* ✅ Update export endpoints to include CC and RU fields (39 total CSV columns)
* ✅ Add API utility functions for calculations
* ✅ Create whitepapers: `CC-v1.md` (Compostability) and `RU-v1.md` (Reusability)

**Frontend Deliverables**
* ✅ Implement ScientificDataEditor with tabbed interface for CR/CC/RU
* ✅ Refactor into modular structure (7 files, ~185 lines each)
* ✅ Create parameter input forms for all 15 parameters across three dimensions
* ✅ Implement CC and RU calculation buttons with API integration
* ✅ Share M_value across all three dimensions
* ⏳ Update DataProcessingView with three separate calculators (in progress)
* ⏳ Update source library tags for compostability and reusability sources (in progress)
* ⏳ Extend QuantileVisualization with dimension selector (in progress)

**Status:** Backend complete (Oct 22, 2025); ScientificDataEditor complete (Oct 22, 2025); remaining UI components in progress. **Phase 5: 60% complete**. See `/docs/PHASE_5_MILESTONE_SCIENTIFIC_EDITOR.md` for details.

---

### **6. Research API & Data Publication** ⬜ PLANNED

**Goal:** Open WasteDB data for public and academic use.

**Deliverables**

* Create `/api/v1/materials` (read-only, paginated JSON).
* Add `/api/v1/materials/:id/full` for detailed metadata.
* Embed dataset citation (DOI or DataCite).
* Include `whitepaper_version`, `calculation_date`, and `method_version`.
* Host data snapshots on Wastefull's GitHub or a research subdomain.

---

## **Cross-Cutting Concerns**

### **Accessibility**

* Maintain WCAG 2.1 AA compliance for all UI components.
* Provide screen-reader text for every confidence or color cue.
* Support high-contrast, dark mode, and reduced-motion preferences.

### **Data Integrity**

* Record `calculation_timestamp`, `whitepaper_version`, and parameter weights for every computation.
* Generate input checksums for reproducibility.

### **Testing & Validation**

* Unit tests for formula correctness.
* Snapshot tests for CSV and JSON exports.
* Automated validation comparing recomputed and stored data.

---

## **Outcome**

When complete, **WasteDB** will:

* Expose scientifically traceable and reproducible sustainability metrics across three dimensions.
* Empower lay users with clear 0–100 sustainability scores visualized through an accessible, uncertainty-aware visual language.
* Provide researchers with structured, open, FAIR-compliant datasets including confidence intervals and complete source citations.
* Serve as Wastefull's central technical platform for circular-economy research.
* Communicate the gap between theoretical potential and practical reality through the Quantile-Halo visualization model.

---

## **Methodology Versions**

| Whitepaper | Version | Status | Published |
| ---------- | ------- | ------ | --------- |
| **CR-v1** (Recyclability) | 2025.1 | ✅ Complete | October 2025 |
| **CC-v1** (Compostability) | 2025.1 | ✅ Complete | October 2025 |
| **RU-v1** (Reusability) | 2025.1 | ✅ Complete | October 2025 |
| **VIZ-v1** (Visualization) | 2025.1a | ✅ Complete | October 2025 |
