**Updated:** 10/17/25

# **Circular Materials Database: Statistical and Accessibility Methodology**

## **Organization Overview**

**Organization:** *Wastefull, Inc.*
**Location:** San Jose, California
**Focus:** Advancing biological and technological recycling through open data, research, and community collaboration.

**Mission Statement:**
We develop open scientific infrastructure to measure, understand, and improve material circularity. Our goal is to empower communities, researchers, and industry to make data-driven decisions that reduce waste and expand what is materially possible. We treat recyclability not as a fixed property but as a moving boundary that science and design can continually push outward.

---

## **1. Purpose and Philosophy**

Our approach balances *scientific optimism* with *practical realism*. We assume that, with sufficient progress, any material can ultimately be recycled. However, our database quantifies *current recyclability* to guide practical decisions in manufacturing, product design, and consumer behavior.

We quantify recyclability through a **multi-parameter model**, where each parameter is grounded in empirical data or a reproducible calculation. Every data point must be traceable to at least three independent sources.

---

## **2. Core Parameters**

| Symbol | Parameter               | Definition                                                                               | Empirical Basis                                                     |
| :----: | ----------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
|  **Y** | Yield                   | Percentage of material successfully recovered after standard processing                  | Laboratory recovery data, industrial trials, LCA datasets           |
|  **D** | Degradability           | Rate and quality of degradation under relevant environmental or industrial conditions    | Material science and composting studies, UV/weathering data         |
|  **C** | Contamination Tolerance | Sensitivity of the recycling process to contaminants (e.g. food residue, polymer mixing) | Process data from recycling facilities and waste management reports |
|  **E** | Energy Demand           | Net energy input per unit mass for recovery or transformation                            | Life Cycle Assessment (LCA) and process energy audits               |

> **Note:** $E$ is tracked separately as an **energy score**, not folded into the composite recyclability index. This preserves transparency in tradeoffs between process feasibility and sustainability.

---

## **3. Data Collection Standards**

Each data point must meet the following requirements:

* **Minimum of 3 independent sources**, with at least one being peer-reviewed or government-backed.
* **Full citation traceability**, with DOI, accession number, or public dataset link.
* **Standardized units** (e.g., MJ/kg, %, g CO₂e per kg material).
* **Source weighting** recorded in metadata for transparency.

### **3.1 Source Weight Parameters**

| Source Type                               | Weight ($w_i$) | Rationale                                 |
| ----------------------------------------- | :------------: | ----------------------------------------- |
| Peer-reviewed paper                       |       1.0      | Gold standard of verification             |
| Government or international agency report |       0.9      | High reliability, large-scale datasets    |
| Industrial white paper or LCA dataset     |       0.7      | Empirical but may include bias            |
| NGO or nonprofit study                    |       0.6      | Often regionally specific or small-sample |
| Internal or unpublished data              |       0.3      | Provisional, to be validated              |

Weighted means and confidence intervals are computed as:

$$
\bar{x}_w = \frac{\sum_i w_i x_i}{\sum_i w_i}
$$

and

$$
SE_w = \sqrt{\frac{\sum_i w_i (x_i - \bar{x}_w)^2}{(\sum_i w_i)(n-1)}}
$$

Confidence intervals are expressed as:

$
CI_{95\%} = \bar{x}_w \pm 1.96 \times SE_w
$

---

## **4. Statistical Handling**

* **Aggregation:** Weighted mean and standard deviation across sources.
* **Confidence Intervals:** Computed using weighted standard error ($SE_w$).
* **Covariance Tracking (Stage II):** Future iterations will include covariance matrices to examine interdependencies between parameters—for example, contamination tolerance vs. yield, or degradability vs. energy demand.

---

## **5. Data Categorization and Accessibility**

Materials are grouped into **public taxonomic categories**, such as:

* **Plastics** (e.g. PET, HDPE)
* **Metals** (e.g. aluminum, copper)
* **Cellulose-Based** (e.g. paper, mycelium composites)
* **Composites** (e.g. fiberglass, multilayer laminates)
* **Biopolymers** (e.g. PLA, PHB)

Each material entry includes:

* Parameter values ($Y$, $D$, $C$) with confidence intervals
* Separate **energy demand score** ($E$)
* A **categorical recyclability label** (e.g. “High,” “Moderate,” “Challenging”) for public interpretation

### **5.1 Accessibility and Visual Design**

To ensure inclusive access:

* Color schemes follow **WCAG 2.1 AA** standards or better.
* **Colorblind-safe palettes** (blue–orange, magenta–gray) are default.
* Non-color cues (e.g. symbols, textures) reinforce meaning.
* High-contrast and grayscale themes are available by default.

| Confidence                   | Color                      | Pattern/Texture    | Shape/Icon Cue       | Accessibility Notes                              |
| ---------------------------- | -------------------------- | ------------------ | -------------------- | ------------------------------------------------ |
| **High**                     | Dark blue (#003366)        | Solid fill         | ▲ (upward triangle)  | High luminance contrast; readable in grayscale.  |
| **Medium**                   | Medium gray-blue (#6A7BA2) | Diagonal hatch (\) | ■ (square)           | Distinct texture for colorblind differentiation. |
| **Low**                      | Light gray (#D0D0D0)       | Cross-hatch (×)    | ● (circle)           | Retains meaning when color is removed.           |
| **Unverified / Conflicting** | Orange (#E57E25)           | Checkerboard       | ! (exclamation mark) | Clear flag for user attention.                   |

> “Confidence levels are represented using an accessible multimodal cue system combining color, texture, and shape, ensuring interpretability for users with color vision deficiencies or those requiring high contrast. This design meets or exceeds WCAG 2.1 AA standards.”

---

## **6. Transparency and Version Control**

All datasets and visualizations are:

* **Versioned** with public changelogs
* **Openly licensed** where possible
* **Traceable** from processed visualization back to raw data sources

Statistical methods and updates are documented in the repository’s `/methods` directory, with timestamps, contributor names, and change logs.

---

## **7. Future Work**

1. Develop a full **covariance model** linking $Y$, $D$, $C$, and $E$.
2. Improve **source weighting** using automated metadata quality scoring.
3. Deploy a **public dashboard** enabling filtering by confidence interval and data reliability.
4. Integrate **probabilistic forecasts** for recyclability improvement based on research trends.

---

## **Appendix A: Metadata Schema and Representation**

### **A.1 Overview**

Each material entry in the Circular Materials Database contains a core record representing empirical recyclability data and associated metadata for traceability, confidence assessment, and accessibility.
The schema is designed to be interoperable with standard data formats such as **JSON-LD**, **CSV**, or **SQL relational models**.

---

### **A.2 Core Schema**

| Field                 | Type                | Description                                                           |
| --------------------- | ------------------- | --------------------------------------------------------------------- |
| `material_id`         | String (UUID)       | Unique identifier for the material entry                              |
| `material_name`       | String              | Common or trade name (e.g. “HDPE,” “Aluminum 6061”)                   |
| `category`            | Enum                | Public taxonomy label (e.g. “Plastics,” “Metals,” “Cellulose-Based”)  |
| `subtype`             | String              | Optional refinement (e.g. “bioplastic,” “ferrous metal”)              |
| `Y_value`             | Float               | Weighted mean recyclate yield (%)                                     |
| `Y_CI95`              | Tuple(Float, Float) | 95% confidence interval bounds for yield                              |
| `D_value`             | Float               | Weighted degradability score (%) or half-life (days)                  |
| `D_CI95`              | Tuple(Float, Float) | 95% confidence interval bounds for degradability                      |
| `C_value`             | Float               | Contamination tolerance index (0–1 scale)                             |
| `C_CI95`              | Tuple(Float, Float) | 95% confidence interval bounds for contamination tolerance            |
| `E_value`             | Float               | Energy demand (MJ/kg)                                                 |
| `E_CI95`              | Tuple(Float, Float) | 95% confidence interval bounds for energy demand                      |
| `recyclability_label` | Enum                | “High,” “Moderate,” or “Challenging” — consumer-facing interpretation |
| `confidence_level`    | Enum                | “High,” “Medium,” “Low,” or “Unverified” — visual cue for reliability |
| `source_list`         | Array[Object]       | All sources contributing to the material record                       |
| `last_reviewed`       | ISO 8601 Date       | Date of last data verification                                        |
| `version`             | String              | Repository version tag (e.g. `v1.2.0`)                                |
| `reviewed_by`         | String              | Contributor or organization name(s)                                   |
| `notes`               | Text                | Additional contextual or methodological notes                         |

---

### **A.3 Source Metadata Object**

Each entry in `source_list` provides traceability and weighting:

| Field            | Type          | Description                                                                            |
| ---------------- | ------------- | -------------------------------------------------------------------------------------- |
| `source_id`      | String (UUID) | Unique ID for citation                                                                 |
| `citation`       | String        | Full bibliographic citation (APA or DOI)                                               |
| `type`           | Enum          | “peer_reviewed,” “government_report,” “industry_data,” “ngo_study,” or “internal_data” |
| `weight`         | Float         | Weight ($w_i$) applied to this source during aggregation                               |
| `data_points`    | Array[String] | Parameters sourced (e.g. `[“Y”, “E”]`)                                                 |
| `region`         | String        | Geographic scope (e.g. “EU,” “Global,” “California”)                                   |
| `confidence`     | Float         | Individual source confidence (0–1)                                                     |
| `retrieved_date` | ISO 8601 Date | Retrieval or access date                                                               |
| `url`            | String        | Link to dataset or publication                                                         |
| `license`        | String        | Data license (e.g. CC-BY 4.0)                                                          |

---

### **A.4 Statistical Metadata**

For each material parameter, the system should record the following computationally derived statistics:

| Field             | Type          | Description                                      |
| ----------------- | ------------- | ------------------------------------------------ |
| `n_sources`       | Integer       | Number of sources used ($n$)                     |
| `weighted_mean`   | Float         | $\bar{x}_w$ — Weighted mean                      |
| `weighted_SE`     | Float         | $SE_w$ — Weighted standard error                 |
| `CI95_lower`      | Float         | Lower bound of 95% CI                            |
| `CI95_upper`      | Float         | Upper bound of 95% CI                            |
| `variance`        | Float         | Weighted variance for the parameter              |
| `covariance_refs` | Array[String] | List of correlated parameters (Stage II feature) |

---

### **A.5 Accessibility Metadata**

Accessibility tagging ensures every material visualization is compliant with WCAG 2.1 standards.

| Field                         | Type          | Description                                               |
| ----------------------------- | ------------- | --------------------------------------------------------- |
| `accessibility_label`         | String        | “Colorblind-safe,” “High-contrast,” “Texture-coded,” etc. |
| `color_hex`                   | String        | Hex code used for default display (e.g. `#003366`)        |
| `pattern_type`                | Enum          | “solid,” “hatch,” “cross-hatch,” “checkerboard”           |
| `icon_symbol`                 | String        | Unicode symbol (▲, ■, ●, !) for redundancy                |
| `contrast_ratio`              | Float         | Calculated contrast ratio (should meet ≥4.5:1)            |
| `alt_text`                    | String        | Screen-reader description of confidence level             |
| `verified_accessibility_date` | ISO 8601 Date | Last accessibility audit                                  |

---

### **A.6 Example JSON Representation**

```json
{
  "material_id": "uuid-1234-5678-9012",
  "material_name": "HDPE",
  "category": "Plastics",
  "Y_value": 82.4,
  "Y_CI95": [79.2, 85.6],
  "D_value": 1.3,
  "C_value": 0.72,
  "E_value": 12.6,
  "recyclability_label": "High",
  "confidence_level": "Medium",
  "source_list": [
    {
      "source_id": "src-001",
      "citation": "Smith et al. (2023). Mechanical Recycling of HDPE. *Journal of Polymer Science.*",
      "type": "peer_reviewed",
      "weight": 1.0,
      "data_points": ["Y", "C"],
      "region": "Global",
      "confidence": 0.95,
      "retrieved_date": "2025-03-15",
      "url": "https://doi.org/10.xxxxx",
      "license": "CC-BY 4.0"
    }
  ],
  "version": "v1.0.0",
  "reviewed_by": "Circular Materials Research Team",
  "last_reviewed": "2025-10-15",
  "accessibility": {
    "accessibility_label": "Colorblind-safe",
    "color_hex": "#003366",
    "pattern_type": "solid",
    "icon_symbol": "▲",
    "contrast_ratio": 5.2,
    "alt_text": "High confidence (blue triangle, solid fill)",
    "verified_accessibility_date": "2025-10-10"
  }
}
```

---

### **A.7 Implementation Notes**

1. **Unit Normalization:** All metrics must include a unit field and conversion record to SI base units for cross-material comparison.
2. **Covariance Readiness:** Fields for covariance and uncertainty propagation are included to support future modeling without schema changes.
3. **Provenance Tracking:** Each update must generate a changelog entry that records *who changed what and why*.
4. **Extensibility:** The schema is compatible with FAIR data principles — *Findable, Accessible, Interoperable, Reusable.*

---