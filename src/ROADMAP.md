# **ROADMAP.md**

*A development roadmap for integrating Wastefull’s data science methodology into the WasteDB platform.*

---

## **Overview**

**Project:** WasteDB
**Organization:** Wastefull
**Purpose:** Build an open, accessible, and scientifically rigorous materials database that communicates both the *practical* and *theoretical* recyclability of materials.

This roadmap outlines the technical milestones and feature dependencies required to evolve WasteDB from a user-facing sustainability tracker into a dual-layer scientific-public system that fully implements the Wastefull methodology described in the *Statistical and Accessibility Methodology White Paper*.

---

## **System Vision**

WasteDB will:

1. Present **practical, lay-friendly data** (0–100 compostability, recyclability, reusability scores).
2. Maintain a **scientific backend layer** with normalized parameters ($Y$, $D$, $C$, $M$, $E$), confidence intervals, and source weighting.
3. Allow researchers and admins to compute, audit, and update scores via the in-app *Data Processing View*.
4. Keep all scientific methods transparent, versioned, and linked to public whitepapers.

---

## **Major Phases**

### **1. Data Model Integration**

**Goal:** Introduce the WasteDB scientific data layer without disrupting the public schema.

**Deliverables**

* Extend Supabase schema for new scientific fields:

  * `CR_practical_mean`, `CR_practical_CI95`, `CR_practical_label`
  * `CR_theoretical_mean`, `CR_theoretical_CI95`, `CR_theoretical_label`
  * `confidence_level`, `E_value`, `Y_value`, `C_value`, `M_value`, `D_value`, `sources`
* Preserve existing public fields for backward compatibility (`recyclability = CR_practical_mean * 100`).
* Add migration scripts and validate new endpoints.
* Ensure localStorage mirrors public data only for performance.

---

### **2. Admin & Research Tools**

**Goal:** Give administrators and researchers full control of scientific parameters.

**Deliverables**

* Extend *Data Processing View* with dual modes (Theoretical & Practical).
* Compute both $CR_{theo}$ and $CR_{prac}$ and write results to Supabase.
* Add confidence interval display and “show parameter detail” toggle.
* Create *Admin Source Manager* for editing JSON-based citation metadata.
* Auto-recalculate confidence categories on save.

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

**Status:** Completed October 20, 2025. See `/PHASE_3_COMPLETE.md` for details.

---

### **4. UI & UX Enhancements**

**Goal:** Communicate complexity transparently while preserving clarity.

**Deliverables**

* Add “Advanced View” toggle to reveal theoretical vs practical scores.
* Visualize confidence intervals (whiskers or shaded bars).
* Link methodology tooltips directly to the relevant whitepaper section.
* Integrate confidence color palette and ARIA descriptions.
* Show source count badges on each material card.

---

### **5. Research API & Data Publication**

**Goal:** Open WasteDB data for public and academic use.

**Deliverables**

* Create `/api/v1/materials` (read-only, paginated JSON).
* Add `/api/v1/materials/:id/full` for detailed metadata.
* Embed dataset citation (DOI or DataCite).
* Include `whitepaper_version`, `calculation_date`, and `method_version`.
* Host data snapshots on Wastefull’s GitHub or a research subdomain.

---

## **Cross-Cutting Concerns**

### **Accessibility**

* Maintain WCAG 2.1 AA compliance for all UI components.
* Provide screen-reader text for every confidence or color cue.

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

* Expose scientifically traceable and reproducible sustainability metrics.
* Empower lay users with clear 0–100 sustainability scores.
* Provide researchers with structured, open, FAIR-compliant datasets.
* Serve as Wastefull’s central technical platform for circular-economy research.