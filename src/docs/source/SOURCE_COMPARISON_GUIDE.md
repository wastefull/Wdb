# Source Data Comparison Tool - User Guide

## Overview

The Source Data Comparison tool provides an **apples-to-apples comparison** of how different academic sources contribute to parameter values in WasteDB. This tool helps researchers, admins, and editors understand:

- **Source contribution**: Which sources influence each parameter and by how much
- **Weight distribution**: How source quality weights affect final values
- **Citation traceability**: Full attribution for every parameter value
- **Consensus visualization**: Where sources agree or diverge

## Accessing the Tool

### Method 1: Data Management Tab

1. Navigate to **Data Management** (admin menu)
2. Click on the **"Comparison"** tab
3. This sits alongside Materials, Batch Ops, Processing, Sources, Assets, and Charts tabs

### Method 2: Direct Navigation

The tool is also available as a standalone view accessible from the navigation context:

```typescript
navigateToSourceComparison();
```

## How It Works

### Source Weighting System

WasteDB uses a weighted averaging system where source quality determines influence:

| Source Type    | Weight | Description                               |
| -------------- | ------ | ----------------------------------------- |
| Peer-reviewed  | 1.0    | Academic journals with peer review        |
| Government     | 0.9    | Official government/international reports |
| Industrial/LCA | 0.7    | Industry lifecycle assessments            |
| NGO/Nonprofit  | 0.6    | Non-profit organization reports           |
| Internal       | 0.3    | Internal/unpublished data                 |

### Parameter Attribution

Each source must explicitly declare which parameters it supports via the `parameters` array in the source citation:

```typescript
{
  title: "Glass Recycling Study",
  authors: "Smith, J.",
  year: 2023,
  doi: "10.1234/example",
  weight: 1.0,
  parameters: ['Y_value', 'D_value', 'M_value'] // Explicitly listed
}
```

Only sources with matching parameters will appear in the comparison.

## Using the Tool

### Step 1: Select a Material

Choose from the dropdown which material you want to analyze. Only materials with sources will appear.

### Step 2: Filter by Dimension (Optional)

Use the dimension filter to narrow down parameters:

- **All Dimensions**: Show all parameters
- **Recyclability**: Y, D, C, M, E values
- **Compostability**: B, N, T, H values
- **Reusability**: L, R, U, C values

### Step 3: Select a Parameter

Pick which specific parameter you want to compare across sources.

### Step 4: Analyze Results

The comparison view shows:

#### Summary Card

- **Weighted Value**: Final calculated parameter value
- **Contributing Sources**: Number of sources cited for this parameter
- **Total Weight**: Combined weight of all sources
- **Dimension**: Which sustainability dimension (CR/CC/RU)

#### Source Breakdown Table

For each source, you'll see:

- **Source details**: Title, authors, year
- **Type badge**: Source type with color coding
- **Weight**: Quality weight (0-1 scale)
- **Contribution**: Percentage influence on final value (with progress bar)
- **Links**: DOI link (if available) or Google Scholar search

#### Methodology Note

An info box explains how weighted averaging works and what contribution percentages mean.

## Understanding Contributions

**Contribution Percentage** = (Source Weight / Total Weight) × 100

### Example

For a parameter with 3 sources:

- Peer-reviewed (weight 1.0) → 1.0 / 2.6 = **38.5% contribution**
- Government (weight 0.9) → 0.9 / 2.6 = **34.6% contribution**
- Industrial (weight 0.7) → 0.7 / 2.6 = **26.9% contribution**
- **Total Weight = 2.6**

The final parameter value is calculated as:

```
Value = (Source1_Value × 1.0 + Source2_Value × 0.9 + Source3_Value × 0.7) / 2.6
```

## Export Functionality

Click **"Export"** to download a JSON file containing:

- Material name
- Parameter name and value
- All source details with contributions
- Export timestamp

This is useful for:

- Documentation and reporting
- External analysis
- Audit trails
- Publication supplementary materials

## Important Notes

### Parameter Coverage

⚠️ **Sources must explicitly list parameters**: If a source doesn't have the parameter in its `parameters` array, it won't appear in the comparison—even if it's cited for the material.

### Google Scholar Fallback

Sources without DOIs automatically get a Google Scholar search link, combining the title and authors for easy lookup.

### Weighted Averages

The tool shows **how** the final value was calculated, but doesn't show individual source values (since those aren't stored separately in the current data model).

## Use Cases

### 1. **Quality Assurance**

Verify that high-impact parameters are backed by high-quality sources (peer-reviewed journals, government reports).

### 2. **Gap Identification**

Identify parameters relying on low-quality sources or single sources, indicating areas needing more research.

### 3. **Audit Trails**

Provide full transparency for where data comes from, meeting academic and regulatory requirements.

### 4. **Source Selection**

When adding new sources, see which parameters need more support and prioritize accordingly.

### 5. **Methodology Validation**

Confirm the weighting system is working as intended and sources are properly attributed.

## Related Documentation

- **SOURCE_LIBRARY_MANAGER_PRODUCTION.md**: Managing the source library
- **SOURCE_TRACEABILITY.md**: Source attribution system
- **SCIENT_DATA_EDITOR_STRUCTURE.md**: Scientific data editor architecture
- **DATA_PIPELINE.md**: Data processing pipeline

## Future Enhancements

Potential additions (see ROADMAP.md):

- Individual source value display (requires data model change)
- Discrepancy visualization (show variance between sources)
- Confidence interval calculation per source
- Source recommendation engine
- Comparative analysis across materials
- Export to BibTeX/RIS formats

---

**Last Updated**: January 2025  
**Feature Version**: 1.0  
**Status**: Production Ready
