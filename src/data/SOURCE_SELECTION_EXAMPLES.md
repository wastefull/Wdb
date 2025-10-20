# Source Selection Algorithm - Examples

This document shows concrete examples of how the intelligent source selection algorithm works during data migration.

## Algorithm Overview

The system uses a **relevance scoring algorithm** that:
1. Parses material name into search terms
2. Scores each source based on tag matches, title mentions, and quality
3. Prioritizes peer-reviewed sources over industry reports
4. Ensures a mix of material-specific and general methodology sources

## Scoring Breakdown

| Match Type | Points | Example |
|------------|--------|---------|
| Exact tag match | +10 | "pet" material → source tagged "pet" |
| Partial tag match | +5 | "cardboard" material → source tagged "paper" |
| Title mention | +3 | "Plastic" in material → "Plastic recycling" in source title |
| Abstract mention | +2 | "PET" in material → "PET bottles" in abstract |
| Source weight | +(weight × 2) | Peer-reviewed (1.0) gets +2, Industrial (0.7) gets +1.4 |
| General/methodology | +1 | Sources tagged "lca", "methodology", or "general" |

---

## Example 1: Cardboard

**Material Name:** "Cardboard"

### Search Terms Extracted:
- `cardboard`

### Top Scored Sources:

1. **"Degradation of cardboard and paper in home composting conditions"** (Score: ~18)
   - Tag exact match: `cardboard` (+10)
   - Tag partial match: `composting` (+5)
   - Peer-reviewed weight bonus (+2)
   - Title mention (+3)

2. **"Fiber quality decline during cardboard recycling cycles"** (Score: ~17)
   - Tag exact match: `cardboard` (+10)
   - Tag partial match: `fiber-quality`, `recycling` (+5)
   - Peer-reviewed weight bonus (+2)
   - Title mention (+3)

3. **"Advancing Sustainable Materials Management: 2018 Fact Sheet"** (Score: ~8)
   - Tag partial match: `cardboard`, `paper` (+5)
   - Government weight bonus (+1.8)
   - Title mention (+3)

4. **"European Declaration of Paper Recycling 2020"** (Score: ~7)
   - Tag partial match: `cardboard`, `paper` (+5)
   - Industrial weight bonus (+1.4)
   - General tag bonus (+1)

5. **"ISO 14044:2020 Environmental management — Life cycle assessment"** (Score: ~4)
   - Methodology tag bonus (+1)
   - Government weight bonus (+1.8)
   - General tag bonus (+1)

### Final Selection:
✅ 4 material-specific sources (cardboard/paper focused)
✅ 1 general LCA methodology source
✅ Total: 5 sources with High confidence potential

---

## Example 2: Plastic (PET)

**Material Name:** "Plastic (PET)"

### Search Terms Extracted:
- `plastic`
- `pet`

### Top Scored Sources:

1. **"PET recycling: Recovery and purification by magnetic density separation"** (Score: ~20)
   - Tag exact match: `pet`, `plastic` (+20)
   - Title mention (+3)
   - Peer-reviewed weight bonus (+2)

2. **"Quality deterioration in recycled PET: Influence of recycling cycles"** (Score: ~19)
   - Tag exact match: `pet`, `plastic` (+20)
   - Title mention (+3)
   - Peer-reviewed weight bonus (+2)
   - Abstract mention (+2)

3. **"Contamination challenges in PET bottle recycling"** (Score: ~16)
   - Tag exact match: `pet` (+10)
   - Tag partial match: `plastic`, `contamination` (+5)
   - Title mention (+3)
   - Industrial weight bonus (+1.4)

4. **"The State of PET Recycling in North America"** (Score: ~15)
   - Tag exact match: `pet` (+10)
   - Tag partial match: `plastic`, `infrastructure` (+5)
   - Title mention (+3)
   - Industrial weight bonus (+1.4)

5. **"Circular Economy Indicators: What Do They Measure?"** (Score: ~3)
   - General tag bonus (+1)
   - Government weight bonus (+1.8)
   - Methodology bonus (+1)

### Final Selection:
✅ 4 PET-specific sources (all mention PET explicitly)
✅ 1 circular economy framework source
✅ Total: 5 sources with High confidence potential

---

## Example 3: Glass

**Material Name:** "Glass"

### Search Terms Extracted:
- `glass`

### Top Scored Sources:

1. **"Glass Recycling: Quality and Purity Standards"** (Score: ~16)
   - Tag exact match: `glass` (+10)
   - Title mention (+3)
   - Industrial weight bonus (+1.4)
   - Tag partial: `recycling` (+5)

2. **"Impact of contaminants on glass recycling quality"** (Score: ~18)
   - Tag exact match: `glass` (+10)
   - Title mention (+3)
   - Peer-reviewed weight bonus (+2)
   - Tag partial: `contamination`, `quality` (+5)

3. **"Life Cycle Assessment of Glass Container Production and End-of-Life"** (Score: ~17)
   - Tag exact match: `glass` (+10)
   - Title mention (+3)
   - Industrial weight bonus (+1.4)
   - Tag partial: `lca`, `energy` (+5)

4. **"Global Glass Recycling Infrastructure Assessment"** (Score: ~17)
   - Tag exact match: `glass` (+10)
   - Title mention (+3)
   - Government weight bonus (+1.8)
   - Tag partial: `infrastructure`, `global` (+5)

5. **"ISO 14044:2020 Environmental management — Life cycle assessment"** (Score: ~4)
   - Methodology tag bonus (+1)
   - Government weight bonus (+1.8)
   - General tag bonus (+1)

### Final Selection:
✅ 4 glass-specific sources
✅ 1 ISO LCA methodology source
✅ Total: 5 sources with High confidence potential

---

## Example 4: Unknown Material (Fallback)

**Material Name:** "Mystery Polymer XYZ"

### Search Terms Extracted:
- `mystery` (no matches)
- `polymer` (no exact matches in current library)
- `xyz` (no matches)

### Top Scored Sources (Fallback to General):

1. **"The impact of contamination on recycling systems: A comprehensive review"** (Score: ~5)
   - General tag bonus (+1)
   - Peer-reviewed weight bonus (+2)
   - Cross-material tag (+1)

2. **"Circular Economy Indicators: What Do They Measure?"** (Score: ~4)
   - General tag bonus (+1)
   - Government weight bonus (+1.8)
   - Methodology bonus (+1)

3. **"ISO 14044:2020 Environmental management — Life cycle assessment"** (Score: ~4)
   - Methodology tag bonus (+1)
   - Government weight bonus (+1.8)
   - LCA tag (+1)

### Final Selection:
⚠️ 3 general sources (no material-specific available)
⚠️ Total: 3 sources with Medium confidence (not High due to lack of specific data)

---

## Key Insights

### What Makes a Good Match?
1. **Material name appears in source tags** - Most important signal
2. **Source is peer-reviewed** - Quality indicator
3. **Source title mentions material** - Relevance confirmation
4. **Source has recent publication date** - Captured in year field

### Why Include General Sources?
Even materials with 4 specific sources get 1 general methodology source because:
- Provides methodological grounding (LCA standards, circular economy frameworks)
- Ensures consistency across materials
- Adds credibility through established scientific frameworks
- Fills gaps when material-specific literature is sparse

### Handling Edge Cases:
- **Very specific materials** (e.g., "Bioplastic PLA Cups") → Matches broader tags like "plastic", "bioplastic", "pla"
- **Generic materials** (e.g., "Waste") → Falls back to general sources
- **Multi-word materials** (e.g., "Recycled Aluminum Foil") → Matches each word: "aluminum", "foil", "recycled"

---

## Testing the Algorithm

To see what sources would be selected for a specific material, you can:

1. **In the UI**: Go to Database Management → Material Management → Expand any material in the migration list
2. **Programmatically**: Call `previewSourcesForMaterial("Material Name")` from `/utils/dataMigration.ts`

Example output for "Cardboard":
```typescript
[
  { title: "Degradation of cardboard...", weight: 1.0, ... },
  { title: "Fiber quality decline...", weight: 1.0, ... },
  { title: "Advancing Sustainable Materials...", weight: 0.9, ... },
  { title: "European Declaration...", weight: 0.7, ... },
  { title: "ISO 14044:2020...", weight: 0.9, ... }
]
```

---

## Future Improvements

Potential enhancements to the algorithm:

- [ ] **Semantic matching**: Use NLP to find conceptually similar terms (e.g., "container" ↔ "packaging")
- [ ] **Category awareness**: Boost sources that match the material's category
- [ ] **Recency weighting**: Prefer newer sources (2020+) over older ones
- [ ] **Citation count**: Integrate academic citation metrics if available
- [ ] **User feedback**: Learn from admin manual source selections
- [ ] **Dynamic library expansion**: Fetch additional sources from external APIs (CrossRef, PubMed)
