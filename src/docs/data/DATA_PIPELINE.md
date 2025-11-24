# **DATA_PIPELINE.md**

*A process guide for how WasteDB converts scientific data into public sustainability scores.*

---

## **1. Conceptual Flow**

```
Source Datasets (Y, D, C, M, E)
        │
        ▼
Weighted Aggregation
 (w_i, CI, SE per parameter)
        │
        ▼
Composite Index Calculation
 → CR_theoretical
 → CR_practical
        │
        ▼
Confidence Assessment
 (σ thresholds, High/Medium/Low)
        │
        ▼
Database Storage (Supabase)
 → Full scientific model
 → Version & provenance tags
        │
        ▼
Public Export Layer
 → Flattened 0–100 CSV
 → JSON API responses
```

---

## **2. Input Layer**

**Raw Parameters**

| Symbol | Meaning                    | Units                   | Example Source              |
| :----: | -------------------------- | ----------------------- | --------------------------- |
|    Y   | Yield (recovery rate)      | 0–1                     | Lab or industrial trials    |
|    D   | Degradation (quality loss) | 0–1                     | Polymer re-melt data        |
|    C   | Contamination tolerance    | 0–1                     | Facility process reports    |
|    M   | Maturity (infrastructure)  | 0–1                     | Regional availability index |
|    E   | Energy demand              | MJ/kg (then normalized) | LCA studies                 |

Each parameter has:

* `mean`, `SE`, `CI95`, `n_sources`, `source_weights[]`

---

## **3. Aggregation Step**

Weighted mean and standard error:

[
\bar{x}_w = \frac{\sum_i w_i x_i}{\sum_i w_i}
\qquad
SE_w = \sqrt{\frac{\sum_i w_i (x_i - \bar{x}_w)^2}{(\sum_i w_i)(n-1)}}
]

Confidence interval:

[
CI_{95%} = \bar{x}_w \pm 1.96 \times SE_w
]

Confidence category heuristic:

| σ range         | Label  |
| --------------- | ------ |
| σ ≤ 0.05        | High   |
| 0.05 < σ ≤ 0.10 | Medium |
| σ > 0.10        | Low    |

---

## **4. Composite Score Calculation**

For both theoretical and practical modes:

[
CR = w_Y Y + w_C C_{\text{eff}} + w_M M - w_D D
]

where
(C_{\text{eff}} = C_{\text{mat}} \times U_{\text{clean}})

Default weights:

* Theoretical: {Y: 0.35, C: 0.05, M: 0.35, D: 0.25}
* Practical: {Y: 0.25, C: 0.20, M: 0.20, D: 0.35}

Output:

* `CR_theoretical_mean`, `CR_practical_mean`
* Associated standard errors and 95 % CIs

---

## **5. Storage Layer**

Supabase schema fields:

```sql
materials (
  id uuid primary key,
  name text,
  category text,
  description text,
  compostability numeric,
  recyclability numeric,
  reusability numeric,
  Y_value numeric,
  D_value numeric,
  C_value numeric,
  M_value numeric,
  E_value numeric,
  CR_practical_mean numeric,
  CR_theoretical_mean numeric,
  CR_practical_CI95 jsonb,
  CR_theoretical_CI95 jsonb,
  confidence_level text,
  sources jsonb,
  whitepaper_version text,
  calculation_timestamp timestamptz
);
```

---

## **6. Public Export Layer**

**Transformation Rules**

| Public Field     | Formula / Mapping                   |
| ---------------- | ----------------------------------- |
| `compostability` | `100 × (1 - D)` (if organic) else 0 |
| `recyclability`  | `100 × CR_practical_mean`           |
| `reusability`    | curated or modeled index (0–100)    |
| `category`       | mapped from internal taxonomy       |
| `description`    | plain-language summary              |

**Example Output**

```csv
name,category,description,compostability,recyclability,reusability
Cardboard,Paper & Cardboard,Thick paper packaging.,95,85,60
Glass,Glass,Infinitely recyclable.,0,95,90
Plastic (PET),Plastics,Bottle-grade polymer.,0,37,50
```

---

## **7. Quality & Provenance Metadata**

Each export run appends:

```json
{
  "whitepaper_version": "2025.1",
  "calculation_date": "2025-10-20",
  "method_version": "CR-v1",
  "confidence_summary": {"High":48,"Medium":12,"Low":4}
}
```

Stored in Supabase logs and embedded in the CSV header comment for auditability.

---

## **8. Validation & Testing**

* Automated recomputation test ensures Δ < 1 % between stored and recalculated $CR$.
* CI width check: alert if `CI95_upper - CI95_lower > 0.2`.
* Export validator verifies public values match scaled scientific values.
* Accessibility audit on any visualized score outputs.

---

With these two documents in place, contributors can clearly see:

* *What* to build (`ROADMAP.md`)
* *How* the data moves and transforms (`DATA_PIPELINE.md`)

Together they complete Wastefull’s blueprint for a scientifically sound, publicly accessible WasteDB platform.
