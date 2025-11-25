# ScientificDataEditor Structure Update

## Current Structure

```
- Tab: Parameters (CR params only)
- Tab: Scores (CR scores only)
- Tab: Sources
```

## New Structure

```
- Tab: Recyclability
  - CR Parameters (Y, D, C, M, E)
  - Calculate button
  - CR Composite Scores (practical/theoretical + CIs)
  - Confidence level

- Tab: Compostability
  - CC Parameters (B, N, T, H, M)
  - Calculate Practical button
  - Calculate Theoretical button
  - CC Composite Scores (practical/theoretical + CIs)

- Tab: Reusability
  - RU Parameters (L, R, U, C_RU, M)
  - Calculate Practical button
  - Calculate Theoretical button
  - RU Composite Scores (practical/theoretical + CIs)

- Tab: Sources (shared across all dimensions)
  - All sources with parameter assignments
```

## Implementation Notes

1. M_value (Infrastructure Maturity) is shared across all three dimensions
2. Each dimension has "Calculate Practical" and "Calculate Theoretical" buttons
3. Calculation buttons call API endpoints: calculateCompostability(), calculateReusability()
4. CR uses the existing local formula (CR = Y × D × C × M × U_clean)
5. CC and RU use server-side calculation endpoints
6. All tabs show both practical and theoretical scores
7. Confidence level is global (moved to metadata section or shown in all tabs)
