**`WasteDB: Visualization and Accessibility Methodology`** (Whitepaper v2025.1a).

## Organization Overview

**Organization:** Wastefull
**Project:** WasteDB
**Focus:** Translating scientific circularity metrics into intuitive, accessible, and verifiable public interfaces.

**Purpose:**
To define a standardized visual language for communicating material circularity across three dimensions—**Recyclability (CR)**, **Compostability (CC)**, and **Reusability (RU)**—using the same quantitative backbone that underlies the scientific data layer.

---

## 1. Design Philosophy

WasteDB’s visualization framework is built on three commitments:

1. **Continuity:** Each sustainability dimension is expressed using the same *quantile-dot + halo + gap* grammar.
2. **Transparency:** Every mark corresponds to a statistically defined entity (mean, confidence interval, or overlap).
3. **Accessibility:** Every color cue is redundantly encoded with texture, pattern, or text; all states meet **WCAG 2.1 AA** or higher.

The system translates normalized 0–1 data into perceptible 0–100 scales without obscuring uncertainty.
A user should *see* the difference between what science can achieve and what society currently does.

---

## 2. Core Visual Model

Each metric has two distributions:

* **Theoretical:** the scientifically possible (ideal input, full infrastructure).
* **Practical:** the empirically observed (real-world contamination, existing systems).

These are represented as overlapping halos with quantile dots marking intersecting probability density.
A shaded or patterned **gap zone** indicates non-overlap (the “innovation gap”).

### Rendering Logic

```
const gap = |X_theoretical_mean − X_practical_mean|
const overlap = (CI_prac_upper ≥ CI_theo_lower) && (CI_theo_upper ≥ CI_prac_lower)

mode =
  overlap            → "overlap"
  gap < 0.10 (10 pts) → "near-overlap"
  else               → "gap"
```

### Modes

| Mode             | Description                        | Visual Expression                                      |
| ---------------- | ---------------------------------- | ------------------------------------------------------ |
| **Overlap**      | Confidence intervals intersect     | Dense quantile dots across shared range                |
| **Near-Overlap** | Partial intersection or <10 pt gap | Dots bridge halos, soft blend                          |
| **Gap**          | No intersection ≥10 pt             | Separated halos, neutral gap shading, dashed connector |

---

## 3. Color System (Normal Mode)

| Dimension          | Theoretical Halo                      | Practical Halo                    | Overlap Dots          | Gap Zone                     |
| ------------------ | ------------------------------------- | --------------------------------- | --------------------- | ---------------------------- |
| **Recyclability**  | Light Blue (`rgba(0, 102, 204, 0.3)`) | Gray (`rgba(160, 160, 160, 0.4)`) | Navy Blue (`#2D5A87`) | Gradient (`#A0A0A0→#0066CC`) |
| **Compostability** | Light Blue (`rgba(0, 102, 204, 0.3)`) | Gray (`rgba(160, 160, 160, 0.4)`) | Navy Blue (`#2D5A87`) | Gradient (`#A0A0A0→#0066CC`) |
| **Reusability**    | Light Blue (`rgba(0, 102, 204, 0.3)`) | Gray (`rgba(160, 160, 160, 0.4)`) | Navy Blue (`#2D5A87`) | Gradient (`#A0A0A0→#0066CC`) |

### Score Bars (Dimension-Specific)

| Dimension      | Pastel                       | High-Contrast             |
| -------------- | ---------------------------- | ------------------------- |
| Recyclability  | Pale Yellow (`#e4e3ac`)      | Golden Yellow (`#d4b400`) |
| Compostability | Soft Coral Beige (`#e6beb5`) | Brick Red (`#c74444`)     |
| Reusability    | Dusty Blue-Gray (`#b8c8cb`)  | Steel Blue (`#4a90a4`)    |

---

## 4. Accessibility Variants

### High-Contrast Mode

| Element          | Normal                                | High-Contrast                          |
| ---------------- | ------------------------------------- | -------------------------------------- |
| Theoretical Halo | Light Blue (`rgba(0, 102, 204, 0.3)`) | Dark Purple (`rgba(51, 51, 102, 0.6)`) |
| Practical Halo   | Gray (`rgba(160, 160, 160, 0.4)`)     | Dark Gray (`rgba(102, 102, 102, 0.7)`) |
| Overlap Dots     | Navy Blue (`#2D5A87`)                 | Black (`#000000`)                      |
| Dot Stroke       | Deep Navy (`#1A3A5A`)                 | Medium Gray (`#666666`)                |
| Gap Zone         | Gradient (`#A0A0A0→#0066CC`)          | Checkerboard Pattern (`#666666`)       |

### Dark Mode

| Element    | Light Mode             | Dark Mode                          |
| ---------- | ---------------------- | ---------------------------------- |
| Text       | Black (`#000`)         | White (`#fff`)                     |
| Tooltip BG | White (`#fff`)         | Charcoal Brown (`#2a2825`)         |
| Bar Stroke | Dark Brown (`#211f1c`) | White (`rgba(255, 255, 255, 0.2)`) |

### Reduced-Motion

| Feature       | Normal                  | Reduced Motion        |
| ------------- | ----------------------- | --------------------- |
| Dot Entrance  | Staggered fade-in 0.3 s | Instant appearance    |
| Halo Opacity  | Smooth 500 ms           | Instant state change  |
| Initial State | Opacity 0, Scale 0      | Opacity 0.85, Scale 1 |

---

## 5. Halo Opacity States

| Mode         | State   | Practical Halo Opacity | Theoretical Halo Opacity |
| ------------ | ------- | ---------------------- | ------------------------ |
| Overlap      | Default | 0.3                    | 0.25                     |
| Overlap      | Hover   | 0.6                    | 0.5                      |
| Near-Overlap | Default | 0.4                    | 0.3                      |
| Near-Overlap | Hover   | 0.7                    | 0.6                      |
| Gap          | Default | 0.5                    | 0.4                      |
| Gap          | Hover   | 0.8                    | 0.7                      |

---

## 6. Technical Implementation

### Frontend Architecture

* **Framework:** React + TypeScript
* **UI Library:** shadcn/ui (ARIA-compliant components)
* **Data Flow:** Supabase → Edge Function API → React context
* **Offline Cache:** `localStorage` keyed by `material_id@method_version@timestamp`
* **Animation:** CSS transitions with `prefers-reduced-motion` fallback

### Backend

* **Supabase + Deno Edge Functions** (Hono framework)
* **KV store** for normalized 0–1 datasets
* **Role-based access:** researcher/admin vs public user
* **Open CORS** for read-only public API

### Data Layer

* Dual-scale system: normalized (0–1) and public (0–100).
* Confidence intervals computed in Supabase Edge before render.
* All requests carry `whitepaper_version` and `method_version` for provenance.

---

## 7. Interaction and Semantics

* **Keyboard Navigation:** All interactive SVG elements (`<circle>`, gap zones) are tabbable.
* **ARIA Labels:** Full textual description of means, CIs, and gap size.
* **Tooltips:** Rendered through `TooltipProvider` (shadcn/ui); include numerical values and confidence level.
* **Screen-Reader Caption:** Summarizes key takeaway (“Gap 20 points; High confidence”).

---

## 8. Data–Visualization Linkage

Every visual parameter corresponds to a database field:

| Visual Element   | Data Field                               | Description          |
| ---------------- | ---------------------------------------- | -------------------- |
| Practical Halo   | `*_practical_CI95`                       | 95 % CI lower/upper  |
| Theoretical Halo | `*_theoretical_CI95`                     | 95 % CI lower/upper  |
| Dots             | `*_practical_mean`, `*_theoretical_mean` | Central tendencies   |
| Gap Zone         | Difference of CI bounds                  | Unrealized potential |
| Confidence Color | `confidence_level`                       | High / Medium / Low  |
| Tooltip Footer   | `whitepaper_version`, `method_version`   | Provenance info      |

---

## 9. Communicative Semantics

| Visual State               | Interpretation                                 |
| -------------------------- | ---------------------------------------------- |
| Dense dots + minimal halos | Performance matches expectation.               |
| Dots bridging soft halos   | Incremental improvement underway.              |
| Two halos + empty gap      | Scientific potential exceeds current practice. |

---

## 10. Versioning and Validation

* Visualization engine versioned as **`Viz-v1`**, paired with **`CR-v1`** methodology.
* Snapshot tests verify pixel accuracy of CI widths and color contrast.
* Every visual output includes a metadata footer embedding `calculation_timestamp` and `method_version`.

---

## 11. Future Work

1. Extend grammar to dynamic time-series (“improvement over time”).
2. Implement real-time confidence animation for streaming datasets.
3. Localize tooltip language for multilingual access.
4. Explore perceptually uniform color spaces (e.g., OKLCH) for halo rendering.
5. Integrate with probabilistic forecast layer planned in *Statistical Methodology v2*.

---

**Last Updated:** October 2025
**Visualization Methodology Version:** Viz-v1
**Linked Methodology:** CR-v1 / Whitepaper 2025.1