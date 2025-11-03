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

**Progress: 7 of 8 phases complete (87.5%)**

```
[██████████████████████████████████████████████████░░] 87.5%
```

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

### **5. Multi-Dimensional Scientific Data Layer** ✅ COMPLETE

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

**Frontend Deliverables** ✅
* ✅ Implement ScientificDataEditor with tabbed interface for CR/CC/RU
* ✅ Refactor into modular structure (7 files, ~185 lines each)
* ✅ Create parameter input forms for all 15 parameters across three dimensions
* ✅ Implement CC and RU calculation buttons with API integration
* ✅ Share M_value across all three dimensions
* ✅ Update DataProcessingView with three separate calculators (CR/CC/RU tabs)
* ✅ Update source library tags for compostability and reusability sources
* ✅ Extend QuantileVisualization with dimension selector (scoreType prop)

**Status:** Completed October 23, 2025. All three dimensions (CR, CC, RU) now have complete scientific data infrastructure, calculation endpoints, parameter editors, and visualizations. See `/docs/PHASE_5_COMPLETE.md` for details.

---

### **6. Content Management & Editorial Workflow** 🔄 IN PROGRESS

**Goal:** Enable community-driven content creation with admin editorial oversight.

**Deliverables**

**Phase 6.1: Foundation** ✅ COMPLETE
* ✅ User profiles with bio, social links, and contribution history
* ✅ Articles data model (markdown-based, tied to materials)
* ✅ Submissions workflow (new materials, material edits, articles)
* ✅ Notifications system with bell UI
* ✅ Basic WYSIWYG markdown editor
* ✅ "Inactivate" button in User Management

**Phase 6.2: Submission Forms** ✅ COMPLETE
* ✅ Submit new material form (basic fields only)
* ✅ Suggest material description edit form
* ✅ Submit new article form (category + material selector)
* ✅ "Pending Review" badges for submitters (My Submissions view)
* ✅ User-facing submission workflow integrated into main UI
* ✅ "Suggest Edit" button on material cards for non-admin users
* ✅ "My Submissions" view to track submission status

**Phase 6.3: Content Review Center** ✅ COMPLETE
* ✅ Three-tab interface (Review / Pending / Moderation)
* ✅ Review feed with type icons, snippets, Review/Flag buttons
* ✅ Review modal with Approve/Edit Directly/Suggest Edits
* ✅ Flag system moving content to Moderation tab
* ✅ Submission cards with timestamps and status indicators
* ✅ Direct editing capability for admin reviewers
* ✅ Auto-publishing approved submissions to database

**Phase 6.4: Editorial Features** ✅ COMPLETE
* ✅ "Suggest Edits" workflow with email feedback via Resend
* ✅ "Edit Directly" with dual Writer/Editor credit attribution
* ✅ Published materials show Writer and Editor credits
* ⬜ Inline diff viewer for article updates (color + icons) - DEFERRED

**Phase 6.5: Notifications & Email** ✅ COMPLETE
* ✅ Email templates for editorial feedback and approvals (with logo)
* ✅ Notification triggers (new submission, feedback, approval, rejection)
* ✅ Manual Pending actions ("Remit to Review" / "Delete")

**Status:** Phase 6.5 and Phase 8 (partial) completed November 2, 2025. Email system with logo integration complete. Performance optimizations (lazy loading, virtual scrolling, monitoring) implemented.

---

### **7. Research API & Data Publication** ✅ COMPLETE

**Goal:** Open WasteDB data for public and academic use.

**Deliverables** ✅

* ✅ Create `/api/v1/materials` (read-only, paginated JSON)
* ✅ Add `/api/v1/materials/:id` for detailed metadata
* ✅ Create `/api/v1/stats` for aggregate database statistics
* ✅ Create `/api/v1/categories` for material category listing
* ✅ Create `/api/v1/methodology` for scoring methodology information
* ✅ Include `whitepaper_version`, `calculation_date`, and `method_version`
* ✅ Build comprehensive API documentation component
* ✅ Integrate API docs into main UI navigation with Code icon

**Status:** Completed October 30, 2025. See `/docs/PHASE_7_API_INTEGRATION_COMPLETE.md` for details.

---

### **8. Performance & Scalability** 🔄 IN PROGRESS

**Goal:** Optimize rendering performance for large datasets and complex visualizations.

**Deliverables**

* **Local Rasterization of Charts:** Pre-render quantile visualizations to canvas/image format to prevent poor page performance with many materials
  * ✅ Implement IndexedDB caching infrastructure (`/utils/chartCache.ts`)
  * ✅ Create SVG-to-canvas rasterization hook (`/utils/useRasterizedChart.ts`)
  * ✅ Build rasterized component wrapper (`/components/RasterizedQuantileVisualization.tsx`)
  * ✅ Add cache management UI for admins (`/components/ChartCacheManager.tsx`)
  * ✅ Maintain accessibility with ARIA labels and keyboard navigation
  * ✅ Preserve interactivity (tooltips, click handlers, hover states)
  * ✅ Implement lazy loading for visualization rendering
  * ⬜ Add server-side rendering option for static charts
* ⬜ Database query optimization for large material collections
* ✅ Implement virtual scrolling for material lists
* ⬜ Add progressive loading for scientific data editor
* ✅ Performance monitoring and metrics collection

**Status:** Phase 8.1-8.3 Complete. Chart rasterization, lazy loading, virtual scrolling, and performance monitoring implemented. See `/docs/PHASE_8_PERFORMANCE_OPTIMIZATIONS.md` for details.

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
