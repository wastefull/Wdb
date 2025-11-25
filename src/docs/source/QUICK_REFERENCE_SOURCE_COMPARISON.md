# Source Data Comparison - Quick Reference

## What It Does

Compare how different academic sources contribute to parameter values across materials. See which sources have the most influence on final scores.

## Access

**Path:** Data Management → Comparison tab  
**Requirements:** Materials with source citations  
**Permissions:** All users (read-only for non-admins)

## Key Features

### Visual Indicators

- ✅ **Normal text** = Parameter has sources
- ⚠️ **Grayed text + badge** = Parameter lacks sources
- **Coverage summary** = X / Y parameters have sources

### What You Can Do

1. **Compare sources** for a specific parameter
2. **See weighted contributions** (peer-reviewed = 1.0, government = 0.9, etc.)
3. **Export comparison data** as JSON
4. **Identify data gaps** via grayed parameters
5. **Follow DOI links** or Google Scholar searches

## 🔧 Common Tasks

### Task 1: Find Well-Sourced Parameters

```
1. Select material
2. Look at coverage summary: "8 / 13 have sources"
3. Choose parameter WITHOUT gray text
4. View detailed source breakdown
```

### Task 2: Identify Missing Sources

```
1. Select material
2. Scan dropdown for grayed parameters with "No sources" badge
3. These parameters need source attribution
4. Forward to admin/editor for updating
```

### Task 3: Verify Source Quality

```
1. Select material and parameter
2. Check source type badges:
   - Green = Peer-reviewed (weight 1.0)
   - Blue = Government (weight 0.9)
   - Yellow = Industrial/NGO (weight 0.7-0.6)
3. Verify contribution percentages match expectations
```

### Task 4: Export for Documentation

```
1. Select material and parameter
2. Click "Export" button
3. JSON file downloads with:
   - Parameter value
   - All source details
   - Contribution percentages
   - Timestamp
```

## Reading the Results

### Summary Card

```
Weighted Value: 85.3%  ← Final calculated value
Contributing Sources: 3  ← Number of sources cited
Total Weight: 2.6  ← Combined source weights
Dimension: Recyclability  ← Which score (CR/CC/RU)
```

### Source Breakdown

```
Source: "Glass Recycling Study 2023"
Type: Peer-reviewed (green badge)
Weight: 1.0
Contribution: 38.5% ← Influence on final value
Links: [DOI] or [🎓 Scholar]
```

### Contribution Formula

```
Contribution % = (Source Weight / Total Weight) × 100

Example:
Source 1 (1.0) → 1.0 / 2.6 = 38.5%
Source 2 (0.9) → 0.9 / 2.6 = 34.6%
Source 3 (0.7) → 0.7 / 2.6 = 26.9%
Total: 100%
```

## ⚠️ Common Issues

### "No sources are tagged for this parameter"

**Why:** Sources don't list this parameter in their `parameters` array  
**Fix:** Add parameter to source citation or add new source  
**Who:** Admin/Editor via Scientific Data Editor → Sources tab

### "No materials in dropdown"

**Why:** No materials have source citations  
**Fix:** Add sources to materials via Scientific Data Editor  
**Who:** Admin/Editor

### Grayed parameter still has a value

**Why:** Value exists but lacks source attribution (data quality issue)  
**Fix:** Add proper source citation for transparency  
**Who:** Admin/Editor

## 🎓 Understanding Weights

| Type              | Weight | Use Case           |
| ----------------- | ------ | ------------------ |
| **Peer-reviewed** | 1.0    | Academic journals  |
| **Government**    | 0.9    | EPA, EU reports    |
| **Industrial**    | 0.7    | Industry LCAs      |
| **NGO**           | 0.6    | Non-profit studies |
| **Internal**      | 0.3    | Unpublished data   |

Higher weights = more influence on final value.

## 💡 Pro Tips

### 1. Coverage First

Always check the coverage summary before diving into specific parameters. Focus on well-sourced parameters for reliable data.

### 2. Multiple Sources = Confidence

Parameters with 3+ sources (especially peer-reviewed) are most reliable. Single-source parameters may need validation.

### 3. Export for Reports

Use JSON export for documentation, publications, or external audits. Includes full attribution chain.

### 4. Dimension Filter

Use the dimension dropdown to focus on specific scores:

- Recyclability → Y, D, C, M, E
- Compostability → B, N, T, H
- Reusability → L, R, U, C

### 5. Google Scholar Fallback

No DOI? Click the purple 🎓 Scholar link to search Google Scholar automatically.

## 🔗 Related Tools

- **Source Library Manager**: View/edit all sources
- **Scientific Data Editor**: Edit material parameters and sources
- **Data Processing**: Calculate scores from parameters
- **Batch Operations**: Update multiple materials at once

## Documentation

- **SOURCE_COMPARISON_GUIDE.md**: Full user guide
- **PARAMETER_SOURCE_CACHE.md**: Developer documentation
- **SOURCE_TRACEABILITY.md**: Attribution system details
- **SOURCE_LIBRARY_MANAGER_PRODUCTION.md**: Source management

## 🐛 Troubleshooting

**Q: Dropdown shows all gray parameters?**  
A: Material has no source attributions. Add sources via Scientific Data Editor.

**Q: Coverage shows 0 / 13?**  
A: Sources exist but don't list parameters. Edit sources to add `parameters` array.

**Q: Export button disabled?**  
A: Must select material AND parameter with sources first.

**Q: Contribution doesn't add to 100%?**  
A: Check for rounding. Contributions may show 38.5% + 34.6% + 26.9% = 100%.

## ⚡ Performance Notes

The tool uses an intelligent caching system:

- ✅ Instant visual feedback (no lag)
- ✅ 10x faster than naive source checking
- ✅ Cache rebuilds only when materials change
- ✅ Smooth UI even with 100+ materials

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** Production Ready
