
---

# **WasteDB Visualization Spec — Hybrid Quantile–Halo Model**

**Purpose:**
Represent theoretical and practical recyclability distributions, their overlap, and the uncertainty or “innovation gap” between them — all in one consistent visual grammar.

---

## **1. Design Principles**

* **Continuity:** All materials use the same grammar — dots, halos, and (if necessary) gap zone.
* **Legibility:** Every visual cue has redundant meaning (color, texture, text, or hover).
* **Accessibility:** WCAG 2.1 AA compliant; colorblind-safe palette; high-contrast mode supported.
* **Narrative Integrity:** The visualization should visually *teach* what the data means without needing lengthy prose.

---

## **2. Visual Components**

| Element                      | Meaning                                                                                             | Behavior                                                |                       |             |                   |
| ---------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------------- | ----------- | ----------------- |
| **Quantile Dots**            | Overlap region — values where theoretical and practical distributions intersect or nearly intersect | Density encodes probability; shown in neutral blue-gray |                       |             |                   |
| **Practical Halo (gray)**    | Real-world variability / lower performance bound                                                    | Semi-transparent gray gradient fading outward           |                       |             |                   |
| **Theoretical Halo (blue)**  | Scientific potential / upper bound                                                                  | Semi-transparent blue gradient fading outward           |                       |             |                   |
| **Gap Zone (neutral blend)** | Region between non-overlapping CIs                                                                  | Light neutral shading (gray→blue gradient)              |                       |             |                   |
| **Connector Label**          | Annotates difference between means                                                                  | “Gap: x % potential increase”                           |                       |             |                   |
| **Axis**                     | 0–100 Recyclability (%)                                                                             | Always visible, ticks every 10 units                    |                       |             |                   |
| **Tooltip / Hover**          | Reveals numeric context                                                                             | Accessible text like “Practical: 37 ± 3 %               | Theoretical: 57 ± 2 % | Gap: 20 pts | Confidence: High” |

---

## **3. Threshold Logic**

```js
const gap = Math.abs(CR_theo - CR_prac);
const overlap = (CI_prac_upper >= CI_theo_lower) && (CI_theo_upper >= CI_prac_lower);

if (overlap) {
    mode = "overlap";           // quantile dots only
} else if (gap >= 0.10) {
    mode = "gap";               // quantile dots + halos + gap zone
} else {
    mode = "near-overlap";      // dense dots + faint blended halos
}
```

**Gap threshold:** 10 percentage-points (configurable).
**Confidence coloring:** derived from `confidence_level` field.

---

## **4. Visual Encoding by Mode**

### **A. Overlap Mode**

Used when theoretical and practical 95 % CIs overlap.

* Dots: 100 quantiles across intersection range.
* Halos: faint extensions of each distribution.
* No gap zone.
* Label: “Shared recyclability range: x–y %.”

### **B. Near-Overlap Mode**

Used when gap < 10 pts or small partial overlap.

* Dots: fill overlap + midpoint region.
* Halos: distinct but softly merged.
* Optional narrow neutral band indicating divergence.
* Label: “Minor difference between theoretical and practical performance.”

### **C. Gap Mode**

Used when gap ≥ 10 pts and no overlap.

* Quantile Dots: anchored at midpoint of the two CIs.
* Left Halo (gray): spans [CI_prac_lower, CI_prac_upper].
* Right Halo (blue): spans [CI_theo_lower, CI_theo_upper].
* Gap Zone: spans [CI_prac_upper, CI_theo_lower], filled with neutral blend gradient.
* Connector Line: dashed arrow from practical mean → theoretical mean.
* Label above arrow: “Gap = {gap×100}%.”

---

## **5. Color & Accessibility**

| Item             | Default                            | High-Contrast            | Notes                            |
| ---------------- | ---------------------------------- | ------------------------ | -------------------------------- |
| Practical halo   | `#A0A0A0` (40 % opacity)           | `#666666` (70 % opacity) | Gray palette                     |
| Theoretical halo | `#0066CC` (30 % opacity)           | `#003366` (60 % opacity) | Blue palette                     |
| Overlap dots     | `#4C78A8` solid                    | `#000000` solid          | Color-blind safe                 |
| Gap zone         | linear gradient(gray→blue 10 %)    | 50 % pattern hatch       | Maintains contrast               |
| Axis text        | `#222` / `#FFF` depending on theme | —                        | WCAG AA contrast ratio ≥ 4.5 : 1 |

---

## **6. Animation & Interaction**

| Feature      | Behavior                                                        | Accessibility                                       |
| ------------ | --------------------------------------------------------------- | --------------------------------------------------- |
| Dot Entrance | Dots animate sequentially across axis in 300 ms easing          | Disabled if `reduceMotion=true`                     |
| Halo Pulse   | Subtle 2 s opacity pulse on hover to highlight region           | Off in reduced motion                               |
| Tooltip      | Appears on hover/focus                                          | Keyboard-navigable, reads full description via ARIA |
| Gap Hover    | On hover of gap zone, show “Unrealized recyclability potential” | —                                                   |

---

## **7. Responsive Layout**

| Viewport | Dot Count | Axis Display                  |
| -------- | --------- | ----------------------------- |
| Desktop  | 100       | Full axis + labels            |
| Tablet   | 60        | Axis ticks every 20           |
| Mobile   | 30        | Minified axis + summary label |

---

## **8. Data Inputs**

```json
{
  "CR_practical_mean": 0.37,
  "CR_practical_CI95": [0.34, 0.40],
  "CR_theoretical_mean": 0.57,
  "CR_theoretical_CI95": [0.55, 0.59],
  "confidence_level": "High",
  "category": "Plastics"
}
```

Derived fields for renderer:

```js
gap = 0.20;
mode = "gap";
overlap_range = null;
```

---

## **9. Pseudocode Summary**

```js
function renderRecyclabilityViz(data) {
  const { CR_practical_mean, CR_theoretical_mean,
          CR_practical_CI95, CR_theoretical_CI95,
          confidence_level } = data;

  const overlap = checkOverlap(CR_practical_CI95, CR_theoretical_CI95);
  const gap = Math.abs(CR_theoretical_mean - CR_practical_mean);

  const mode = overlap ? "overlap"
              : gap < 0.10 ? "near-overlap"
              : "gap";

  drawAxis();
  drawHalos(CR_practical_CI95, "gray", confidence_level);
  drawHalos(CR_theoretical_CI95, "blue", confidence_level);

  if (mode === "overlap") drawDots(overlapRange());
  if (mode === "gap") drawGapZone(CR_practical_CI95[1], CR_theoretical_CI95[0]);
  drawLabelsAndTooltips(mode, gap, confidence_level);
}
```

---

## **10. Communicative Goal**

| Visual State                    | What the User Learns                           |
| ------------------------------- | ---------------------------------------------- |
| Dense dots + minimal halos      | “This material is consistently recyclable.”    |
| Dots bridging two faint halos   | “There’s some improvement potential.”          |
| Two halos with empty shaded gap | “Large gap — science outpaces infrastructure.” |

---

