# **ROADMAP.md**

**Updated:** May 27, 2026
_A development roadmap for integrating Wastefull's data science methodology into the WasteDB platform._

---

## **Overview**

**Project:** WasteDB
**Organization:** Wastefull
**Purpose:** Build an open, accessible, and scientifically rigorous materials database that communicates both the _practical_ and _theoretical_ sustainability of materials across three dimensions: **Recyclability (CR)**, **Compostability (CC)**, and **Reusability (RU)**.

This roadmap outlines the technical milestones and feature dependencies required to evolve WasteDB from a user-facing sustainability tracker into a dual-layer scientific-public system that fully implements the Wastefull methodology described in the _Statistical and Accessibility Methodology White Paper_ and accompanying methodology whitepapers (CR-v1, CC-v1, RU-v1, VIZ-v1).

---

## **System Vision**

WasteDB will:

1. Present **practical, lay-friendly data** (0–100 compostability, recyclability, reusability scores).
2. Maintain a **scientific backend layer** with normalized parameters for all three dimensions, confidence intervals, and source weighting.
3. Allow researchers and admins to compute, audit, and update scores via the in-app _Data Processing View_.
4. Keep all scientific methods transparent, versioned, and linked to public whitepapers.
5. Communicate uncertainty visually through the **Hybrid Quantile-Halo Visualization Model** (VIZ-v1).

---

## **Major Phases**

**Progress: 3 of 10 stages complete (30%)**

```
[███████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 30%
```

### **1. Foundation** ✅ COMPLETE

**Goal:** Establish WasteDB's core product surface and scientific platform foundations.

**Deliverables** ✅

- Scientific data model with CR, CC, and RU parameters plus confidence intervals
- Admin and research tools for calculation, review, and batch operations
- Public export layer and visualization infrastructure
- Content management and editorial workflow foundation
- Research API, chart rasterization, virtual scrolling, and performance monitoring

**Status:** Completed November 2, 2025.

---

### **2. Evidence Infrastructure** ✅ COMPLETE

**Goal:** Build the evidence, governance, and compliance infrastructure behind WasteDB's scientific claims.

**Deliverables** ✅

- Versioned transform definitions for all 13 parameters
- Evidence points CRUD API with unit and transform validation
- Legal framework, takedown process, audit logging, data retention, and exports
- Observability, source deletion guards, and policy snapshot infrastructure
- Aggregation backend and supporting admin workflows

**Status:** Completed November 20, 2025.

---

### **3. Curation Lab** 🔄 IN PROGRESS

**Goal:** Build the evidence extraction workbench and editor experience for MIU-based curation.

**Deliverables**

- ✅ Curation Workbench split-pane interface and 5-step extraction wizard
- ✅ Integrated PDF viewer with selection-to-form prefill flows
- ✅ MIU create, edit, and delete workflows
- ⏸️ Evidence List Viewer and pilot extraction work carried forward
- ⬜ Double-extraction validation and conflict resolution

**Status:** Partial. Work paused in May 2026 while the team executed the database migration.

---

### **4. Data Migration** ✅ COMPLETE

**Goal:** Move core application data from the KV store to relational Postgres with RLS and foreign-key integrity.

**Deliverables** ✅

- Relational tables for materials, articles, sources, user profiles, evidence points, and audit logs
- Join tables for categories, links, and source relationships
- Row-level security for anon, authenticated, and admin access tiers
- Migration scripts and seeded data for existing content
- Foreign-key integrity enforced across the migrated data model

**Status:** Completed May 21, 2026.

---

### **5. Privacy, Audit & Revision History** 📋 PLANNED

**Goal:** Redesign WasteDB's logging and provenance model around privacy minimization while preserving scientific trust, security, and accountability.

**Deliverables**

- Split the current broad audit model into three layers:
  - public or semi-public revision history for content provenance
  - restricted admin audit for approvals, deletions, and role-sensitive actions
  - security telemetry for authentication, abuse prevention, and suspicious activity
- Minimize default audit payloads to actor ID, action, target, timestamp, change summary, and changed fields
- Limit full before/after snapshots to content revision history and explicitly justified integrity-critical cases
- Separate request metadata from content/admin revisions so IP address and user-agent are collected only where operationally necessary
- Prefer stable user IDs over email duplication in audit records unless email is specifically needed for an operational workflow
- Introduce tiered retention:
  - revision history retained for provenance
  - minimal admin accountability logs retained for compliance needs
  - raw IP address and full user-agent retained for shorter, security-scoped windows
- Update privacy policy, retention documentation, exports, and admin tooling to reflect the layered model

**Success Criteria**

- Full-content snapshots are no longer the generic default for private audit rows
- IP address and user-agent retention is narrowed and separated by purpose
- Public-facing content provenance remains reconstructible without exposing unnecessary personal data
- Privacy disclosures match actual implementation and retention behavior

**Status:** Planned as the next stage after the KV-to-Postgres migration.

---

### **6. TBD** 📋 PLANNED

**Goal:** Reserved for upcoming planned work before scaling.

**Status:** TBD.

---

### **7. TBD** 📋 PLANNED

**Goal:** Reserved for upcoming planned work before scaling.

**Status:** TBD.

---

### **8. TBD** 📋 PLANNED

**Goal:** Reserved for upcoming planned work before scaling.

**Status:** TBD.

---

### **9. TBD** 📋 PLANNED

**Goal:** Reserved for upcoming planned work before scaling.

**Status:** TBD.

---

### **10. Scale** 📋 PLANNED

**Goal:** Build on the relational foundation to enable evidence curation at scale, aggregation, and public traceability.

**Deliverables**

- ⬜ Aggregation engine with weighted statistics and confidence intervals
- ⬜ Evidence List Viewer for browsing, filtering, and searching MIUs at scale
- ⬜ Pilot extraction expansion across additional materials and parameters
- ⬜ Evidence curation for 30+ materials across all dimensions
- ⬜ Public evidence traceability layer on material detail pages
- ⬜ Community curator onboarding, quality metrics, and duplicate detection

**Status:** Planned for after interim Stages 6-9 are defined and completed.

---

## **Cross-Cutting Concerns**

### **Accessibility**

- Maintain WCAG 2.1 AA compliance for all UI components.
- Provide screen-reader text for every confidence or color cue.
- Support high-contrast, dark mode, and reduced-motion preferences.

### **Data Integrity**

- Record `calculation_timestamp`, `whitepaper_version`, and parameter weights for every computation.
- Generate input checksums for reproducibility.

### **Testing & Validation**

- Unit tests for formula correctness.
- Snapshot tests for CSV and JSON exports.
- Automated validation comparing recomputed and stored data.

---

## **Outcome**

When complete, **WasteDB** will:

- Expose scientifically traceable and reproducible sustainability metrics across three dimensions.
- Empower lay users with clear 0–100 sustainability scores visualized through an accessible, uncertainty-aware visual language.
- Provide researchers with structured, open, FAIR-compliant datasets including confidence intervals and complete source citations.
- Serve as Wastefull's central technical platform for circular-economy research.
- Communicate the gap between theoretical potential and practical reality through the Quantile-Halo visualization model.

---

## **Methodology Versions**

| Whitepaper                 | Version | Status      | Published    |
| -------------------------- | ------- | ----------- | ------------ |
| **CR-v1** (Recyclability)  | 2025.1  | ✅ Complete | October 2025 |
| **CC-v1** (Compostability) | 2025.1  | ✅ Complete | October 2025 |
| **RU-v1** (Reusability)    | 2025.1  | ✅ Complete | October 2025 |
| **VIZ-v1** (Visualization) | 2025.1a | ✅ Complete | October 2025 |
