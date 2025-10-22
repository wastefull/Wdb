Splendid. Let’s begin with the **Compostability Methodology (CC-v1)**, written in the same formal white-paper structure as your _Calculation Methodology_, followed by the **Reusability Methodology (RU-v1)**.
Both documents preserve the WasteDB voice: scientific precision balanced with accessibility, versioned and citation-ready.

---

# WasteDB Compostability Methodology

**Methodology Version:** CC-v1
**Whitepaper Version:** 2025.1
**Linked Visualization Version:** Viz-v1

---

## 1. Overview

The Compostability Index (CC) quantifies how completely and safely a material can decompose under managed biological conditions.
It operates on the same dual-mode logic as the Composite Recyclability Index (CR):

- **Theoretical Compostability (CCₜₕₑₒ):** biodegradation under ideal laboratory or pilot-scale conditions.
- **Practical Compostability (CCₚᵣₐ𝚌):** observed performance in regional or industrial composting facilities.

The goal is to measure not only whether a material can break down, but whether it does so **reliably, non-toxically, and within existing infrastructure**.

---

## 2. Parameters

| Symbol | Parameter                      | Definition                                                        | Typical Source                    |
| :----: | ------------------------------ | ----------------------------------------------------------------- | --------------------------------- |
| **B**  | _Biodegradation Rate Constant_ | Fraction degraded over standardized period (ASTM D5338, OECD 301) | Laboratory assays, pilot composts |
| **N**  | _Nutrient Balance_             | Suitability of C : N : P ratio for microbial activity             | Soil and compost lab analyses     |
| **T**  | _Toxicity / Residue Index_     | Degree of phytotoxicity, heavy-metal, or VOC residue              | Plant-growth and emissions tests  |
| **H**  | _Habitat Adaptability_         | Fraction of composting systems where process succeeds             | Facility surveys, climate models  |
| **M**  | _Maturity of Infrastructure_   | Availability of industrial or community compost facilities        | Regional waste-management data    |

All parameters are normalized to 0–1.
Values include weighted means, standard errors, and 95 % confidence intervals per WasteDB’s statistical standard.

---

## 3. Formula

[
CC = w_B B + w_N N + w_H H + w_M M − w_T T
]

**Default Weights**

| Mode        | w_B  | w_N  | w_H  | w_M  | w_T  |
| ----------- | ---- | ---- | ---- | ---- | ---- |
| Theoretical | 0.45 | 0.15 | 0.15 | 0.15 | 0.10 |
| Practical   | 0.35 | 0.15 | 0.20 | 0.20 | 0.10 |

### Normalization

Outputs are constrained to 0–1, then scaled ×100 for display.

---

## 4. Confidence Intervals

Weighted standard errors are propagated from parameter uncertainties using the same formalism as CR-v1.
Confidence levels—High, Medium, Low—follow identical σ-thresholds (≤0.05, 0.05–0.10, >0.10).

---

## 5. Score Interpretation

| CC (%) | Label                         | Guidance                                              |
| :----: | ----------------------------- | ----------------------------------------------------- |
| 80–100 | Rapidly compostable           | Fully biodegrades ≤ 90 days under standard conditions |
| 60–79  | Compostable with care         | Requires optimized aeration / moisture control        |
| 40–59  | Conditionally compostable     | Breaks down in industrial but not home systems        |
| 20–39  | Slow / partial compostability | Leaves residue; not yet facility-ready                |
|  0–19  | Non-compostable               | Stable under biological conditions                    |

---

## 6. Data Quality and Source Weighting

Same weighting tiers as _Statistical Methodology v2025.1_ apply.
Biological test data are prioritized over proxy estimates; plant-growth and ecotoxicity data are required for High confidence.

---

## 7. Fallback Estimation

For biological materials lacking direct tests:
[
CC_{est.} ≈ 1 - D
]
where _D_ is the degradability parameter from CR, providing continuity between recycling and compost pathways.

---

## 8. Integration with WasteDB

- Stored fields:
  `CC_practical_mean`, `CC_theoretical_mean`, `CC_practical_CI95`, `CC_theoretical_CI95`, `B_value`, `N_value`, `T_value`, `H_value`, `M_value`.
- Visualization: blue–gray halos shared with CR (see Viz-v1).
- API output: `compostability = 100 × CC_practical_mean`.

---

## 9. Version Control

All computations carry `method_version: "CC-v1"` and `whitepaper_version: "2025.1"`.
Future revisions will address covariance among B, N, and T parameters and integrate microplastic residue metrics.

---

**Last Updated:** October 2025

---