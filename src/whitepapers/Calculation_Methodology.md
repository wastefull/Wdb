# WasteDB Calculation Methodology

## Overview

This document describes the scientific methodology used to calculate the Composite Recyclability Index (CR) in WasteDB.

## Composite Recyclability Index (CR)

The Composite Recyclability Index provides a quantitative measure of how recyclable a material is, based on multiple factors.

### Formula

The CR is calculated using the following formula:

$$
CR = Y \times D \times C \times M \times U_{clean}
$$

Where each parameter is normalized to a 0-1 scale:

- **Y (Yield)**: Material recovery rate - fraction successfully recovered in the recycling process
- **D (Degradability)**: Quality retention - higher values indicate better quality preservation through recycling cycles
- **C (Contamination)**: Contamination tolerance - how well the material handles impurities
- **M (Maturity)**: Infrastructure maturity - availability and readiness of recycling infrastructure
- **$U_{clean}$**: Cleanliness factor - input material quality

### Operating Modes

The methodology supports two operating modes:

#### Theoretical Mode (Ideal Conditions)
- $U_{clean} = 1.0$ (perfectly clean input)
- Represents the maximum theoretical recyclability
- Used for research and best-case scenario analysis

#### Practical Mode (Realistic Conditions) 
- $U_{clean} = 0.6$ (realistic contamination levels)
- Reflects real-world recycling conditions
- Used for public-facing scores and practical applications

### Score Interpretation

The calculated CR value (0-1 scale) is converted to a percentage (0-100) for display:

- **High (>70%)**: Excellent recyclability with established infrastructure
- **Medium (30-70%)**: Moderate recyclability with some limitations
- **Low (<30%)**: Poor recyclability or limited infrastructure

## Confidence Intervals

To account for measurement uncertainty and data quality:

- **95% Confidence Intervals** are calculated around the mean CR value
- Default margin: ±10% of the calculated value
- Adjusted based on source quality and data completeness

## Data Quality Levels

Materials are assigned confidence levels based on supporting evidence:

- **High Confidence**: 3+ peer-reviewed sources, complete parameter data
- **Medium Confidence**: 2+ credible sources, partial parameter data
- **Low Confidence**: 0-1 sources, preliminary or estimated data

## Parameter Estimation

When specific parameter data is not available, estimates are derived from:

1. Category-level averages from published literature
2. Expert assessments based on material properties
3. Comparative analysis with similar materials

### Default Parameter Values by Category

| Category | Y (Yield) | D (Quality) | C (Contamination) | M (Infrastructure) |
|----------|-----------|-------------|-------------------|-------------------|
| Glass | 0.95 | 1.00 | 0.85 | 0.95 |
| Metals | 0.90 | 0.95 | 0.80 | 0.90 |
| Paper & Cardboard | 0.70 | 0.60 | 0.65 | 0.85 |
| Plastics | 0.60 | 0.50 | 0.40 | 0.70 |
| Electronics & Batteries | 0.50 | 0.40 | 0.30 | 0.50 |
| Fabrics & Textiles | 0.40 | 0.45 | 0.35 | 0.40 |
| Building Materials | 0.65 | 0.70 | 0.60 | 0.60 |
| Organic/Natural Waste | 0.20 | 0.30 | 0.25 | 0.30 |

## Citation and Sources

All scientific data should be supported by citations from peer-reviewed literature, industry reports, or authoritative sources. Sources are tracked with:

- Title and authors
- Publication year
- DOI (when available)
- Source weight (for aggregating multiple studies)

## Versioning

The methodology is versioned to track changes over time:

- **Methodology Version**: Current version identifier (e.g., "CR-v1")
- **Whitepaper Version**: Reference to methodology whitepaper version (e.g., "2025.1")
- **Calculation Timestamp**: ISO 8601 timestamp of when scores were calculated

## References

For a complete description of the methodology and validation studies, see:
- Recyclability.md - Full technical whitepaper
- DATA_PIPELINE.md - Data processing pipeline documentation
- ROADMAP.md - Future enhancements and methodology updates

---

**Last Updated**: January 2025  
**Methodology Version**: CR-v1  
**Whitepaper Version**: 2025.1
