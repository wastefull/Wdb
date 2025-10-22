# WasteDB Reusability Methodology

**Methodology Version:** RU-v1
**Whitepaper Version:** 2025.1
**Linked Visualization Version:** Viz-v1

---

## 1. Overview

The Reusability Index (RU) quantifies a product’s or material’s ability to maintain utility through multiple life-cycles without re-processing.
It treats **durability, repairability, and system maturity** as equal citizens in circular design.

Dual modes mirror other indices:

- **Theoretical (RUₜₕₑₒ):** potential number of reuse or upgrade cycles given ideal design intent.
- **Practical (RUₚᵣₐ𝚌):** realized reuse cycles within current market and infrastructure limits.

---

## 2. Parameters

| Symbol | Parameter                    | Definition                                  | Empirical Basis                 |
| :----: | ---------------------------- | ------------------------------------------- | ------------------------------- |
| **L**  | Lifetime                     | Average functional cycles before failure    | Durability testing, LCA         |
| **R**  | Repairability                | Ease of disassembly / component replacement | Design audits, teardown studies |
| **U**  | Upgradability                | Ease of adaptation / repurposing            | Product modularity reports      |
| **C**  | Contamination Susceptibility | Probability of functional loss per use      | Return-stream data              |
| **M**  | Market Maturity              | Availability of reuse logistics             | Regional infrastructure indices |

---

## 3. Formula

[
RU = w_L L + w_R R + w_U U + w_M M − w_C C
]

**Default Weights**

| Mode        | w_L  | w_R  | w_U  | w_M  | w_C  |
| ----------- | ---- | ---- | ---- | ---- | ---- |
| Theoretical | 0.35 | 0.20 | 0.15 | 0.20 | 0.10 |
| Practical   | 0.25 | 0.25 | 0.15 | 0.25 | 0.10 |

Outputs normalized 0–1, scaled ×100 for display.

---

## 4. Confidence and Interpretation

Confidence intervals follow the same statistical treatment as CR and CC.

| RU (%) | Label                   | Meaning                                          |
| :----: | ----------------------- | ------------------------------------------------ |
| 80–100 | Highly reusable         | Designed for indefinite service / modular repair |
| 60–79  | Reusable with support   | Repair networks or parts required                |
| 40–59  | Occasionally reused     | Some reuse channels exist                        |
| 20–39  | Low reusability         | Economically or physically limited               |
|  0–19  | Disposable / single-use | No reuse path currently                          |

---

## 5. Data Sources and Weighting

| Source                           | Weight | Example                     |
| -------------------------------- | ------ | --------------------------- |
| Peer-reviewed durability study   | 1.0    | Material fatigue tests      |
| Manufacturer repair manuals      | 0.8    | iFixit scorecards           |
| Market data on reuse networks    | 0.7    | Refill/reuse program audits |
| NGO reports on product longevity | 0.6    | Circular design initiatives |
| Expert elicitation / prototypes  | 0.4    | Pilot reuse trials          |

---

## 6. Integration

- Stored fields: `RU_practical_mean`, `RU_theoretical_mean`, `RU_practical_CI95`, `RU_theoretical_CI95`, `L_value`, `R_value`, `U_value`, `C_value`, `M_value`.
- API field: `reusability = 100 × RU_practical_mean`.
- Visualization: gold–gray score bars; same halo grammar as other indices.

---

## 7. Cross-Metric Relationships

WasteDB may compute a **Circularity Vector** = ⟨ CR, CC, RU ⟩ for each material, allowing comparison of physical recyclability, biological return, and functional reuse.
Future versions will visualize this as a three-axis “circularity fingerprint.”

---

## 8. Versioning and Future Work

- Introduce time-weighted reuse decay curves (failure probability per cycle).
- Integrate social-infrastructure factor (SI) for cultural adoption of reuse.
- Add life-cycle energy and emissions coupling to RU scores.

---

**Last Updated:** October 2025
**Methodology Version:** RU-v1
**Linked Visualization Version:** Viz-v1

---