# WasteDB Source Library

## Overview

The source library (`/data/sources.ts`) contains a curated collection of academic papers, government reports, industry whitepapers, and other citations used to validate scientific parameters in WasteDB.

## Purpose

Every scientific data point in WasteDB should be traceable to at least **3 independent sources** to ensure data quality and confidence. The source library makes it easy to:

- Browse pre-vetted academic and industry sources
- Add citations to materials with proper metadata
- Calculate weighted confidence scores
- Maintain traceability from data points back to original research

## Source Types and Weights

Per the WasteDB methodology whitepaper, sources are weighted based on their verification standards:

| Type | Weight | Description |
|------|--------|-------------|
| **peer-reviewed** | 1.0 | Peer-reviewed academic papers - highest verification standard |
| **government** | 0.9 | Government reports and international standards - large-scale, high reliability |
| **industrial** | 0.7 | Industry white papers and LCAs - empirical but possible bias |
| **ngo** | 0.6 | NGO and nonprofit studies - often regional, smaller scope |
| **internal** | 0.3 | Internal or unpublished data - provisional, to be validated |

## Using the Source Library

### In the Scientific Data Editor

1. Open the Scientific Data Editor for any material
2. Navigate to the **Sources** tab
3. Click **"Browse Source Library"** button
4. Sources are organized into:
   - **Recommended for {Material}**: Pre-filtered sources tagged for that specific material
   - **All Sources**: Full library with search functionality
5. Click **"Add"** to add a source to your material
6. Or manually add a custom source using the form below

### Programmatically

```typescript
import { SOURCE_LIBRARY, getSourcesByTag, getSourcesByMaterial } from './data/sources';

// Get all sources for a specific tag
const cardboardSources = getSourcesByTag('cardboard');

// Get recommended sources for a material
const glassSources = getSourcesByMaterial('Glass');

// Access the full library
console.log(SOURCE_LIBRARY);
```

## Source Structure

Each source includes:

```typescript
{
  id: string;                    // Unique identifier
  title: string;                 // Full citation title
  authors?: string;              // Author names
  year?: number;                 // Publication year
  doi?: string;                  // Digital Object Identifier
  url?: string;                  // Web link
  weight?: number;               // Source weight (0.3-1.0)
  type: 'peer-reviewed' | ...;   // Source type
  abstract?: string;             // Brief description
  tags?: string[];               // Search tags (material, topic, etc.)
}
```

## Source Provenance Tracking

Each source can be tagged with which parameters it contributed to. This enables transparent data provenance:

```typescript
{
  title: "PET recycling: Recovery and purification",
  authors: "Smith et al.",
  year: 2023,
  doi: "10.1016/j.wasman.2023.01.001",
  weight: 1.0,
  parameters: ['Y_value', 'CR_practical_mean']  // This source contributed to Yield and CR Practical
}
```

### How Parameters Are Assigned

When adding sources from the library, parameters are **automatically assigned** based on source tags:

| Source Tags | Parameters Assigned | Rationale |
|-------------|---------------------|-----------|
| `recycling`, `yield`, `recovery` | `Y_value`, `CR_practical_mean` | Recovery/yield data |
| `degradation`, `quality`, `composting` | `D_value` | Degradation/quality loss |
| `contamination`, `purity` | `C_value` | Contamination tolerance |
| `infrastructure`, `maturity` | `M_value` | Infrastructure availability |
| `energy`, `lca` | `E_value` | Energy demand |
| `general`, `methodology` | `CR_practical_mean`, `CR_theoretical_mean` | Overall methodology |

### Viewing Provenance

In the material detail view, each parameter shows inline citations:

```
Yield (Y): 0.85
  [1] Smith et al. 2023
  [3] Jones 2022
  
Degradability (D): 0.92
  [2] Brown et al. 2024
```

In the Sources section, each source lists what it contributed:

```
[1] Smith et al. PET recycling: Recovery and purification (2023)
    Used for: Yield, CR Practical
```

## Source Selection Algorithm (for Migration)

When automatically backfilling sources during data migration, the system uses an intelligent scoring algorithm:

### Selection Process

1. **Parse Material Name**: Extract search terms (e.g., "Plastic (PET)" → ["plastic", "pet"])

2. **Score Each Source**: Each source in the library receives a relevance score:
   - **Exact tag match** (e.g., "pet" material → "pet" tag): +10 points
   - **Partial tag match** (e.g., "cardboard" → "paper"): +5 points
   - **Title mention**: +3 points
   - **Abstract mention**: +2 points
   - **Source weight bonus**: +(weight × 2) points
   - **General/methodology bonus**: +1 point

3. **Prioritize Quality**: Peer-reviewed sources (weight 1.0) score higher than industry reports (weight 0.7)

4. **Ensure Diversity**: Final selection includes:
   - 3-4 material-specific sources (highest scoring)
   - 1 general LCA/methodology source (for methodological rigor)
   - Minimum 3 sources, maximum 5 sources

### Example Selections

**Material: "Cardboard"**
- Gets: cardboard recycling, cardboard composting, fiber degradation, paper infrastructure
- Plus: 1 general LCA methodology source

**Material: "Plastic (PET)"**
- Gets: PET recycling yield, PET degradation, PET contamination, PET infrastructure
- Plus: 1 circular economy framework source

**Material: "Unknown Material XYZ"**
- Gets: General sources on contamination, LCA methodology, circular economy
- (Falls back to cross-material studies when no specific sources exist)

## Adding New Sources

### To the Library

Edit `/data/sources.ts` and add a new entry to the `SOURCE_LIBRARY` array:

```typescript
{
  id: 'unique-id-slug',
  title: 'Study Title',
  authors: 'Smith, J., Doe, A.',
  year: 2024,
  doi: '10.1234/example',
  url: 'https://doi.org/10.1234/example',
  weight: 1.0,
  type: 'peer-reviewed',
  abstract: 'Brief description of the study...',
  tags: ['material-name', 'topic', 'region']
}
```

### Custom Sources (Per Material)

If you have a source that's not in the library:

1. In the Scientific Data Editor, scroll to **"Add Custom Source"**
2. Fill in the citation details
3. Set the appropriate weight based on source type
4. Click **"Add Source"**

## Confidence Levels

The system automatically suggests confidence levels based on source count and weights:

- **High Confidence**: 3+ sources with weighted average ≥ 0.8
- **Medium Confidence**: 2+ sources OR weighted average ≥ 0.6
- **Low Confidence**: 0-1 sources OR low weighted average

The UI will warn you if your confidence level doesn't match the number of sources provided.

## Current Library Contents

The library currently includes sources for:

- **Paper & Cardboard**: 4 sources covering recycling, composting, degradation, and infrastructure
- **Glass**: 4 sources on recycling quality, contamination, energy, and infrastructure
- **PET Plastics**: 5 sources on yield, degradation, contamination, infrastructure, and energy
- **Aluminum**: 3 sources on recycling quality, energy savings, and contamination
- **Food Waste/Organics**: 2 sources on composting performance and infrastructure
- **General/Cross-material**: 3 sources on contamination, circular economy metrics, and LCA methodology

## Contributing Sources

When adding sources to the library, please:

1. ✅ Verify the citation is accurate (DOI, authors, year)
2. ✅ Include an abstract/description (1-2 sentences)
3. ✅ Tag appropriately for discoverability
4. ✅ Set the correct weight based on source type
5. ✅ Ensure the source is publicly accessible when possible
6. ✅ Add at least 3 sources per material for High confidence

## Integration with Sample Data

The initial sample data (Cardboard, Glass, PET) now automatically pulls sources from the library during initialization. This ensures every material starts with proper citations and traceability.

## Future Enhancements

- [ ] Automated DOI lookup and metadata fetching
- [ ] Integration with academic databases (CrossRef, PubMed)
- [ ] Source quality scoring based on citation count
- [ ] Automated source weight calibration
- [ ] Export citations in standard formats (BibTeX, RIS)
- [ ] Version control for source metadata changes
