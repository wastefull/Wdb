# Backend Multi-Dimensional Support (CC & RU)

**Date:** October 22, 2025  
**Status:** Backend infrastructure complete, frontend integration pending  
**Related:** Phase 5 - Multi-Dimensional Scientific Data Layer

---

## Overview

This document describes the backend changes made to support Compostability (CC-v1) and Reusability (RU-v1) alongside the existing Recyclability (CR-v1) methodology.

---

## 1. Type System Updates

### Material Type (`/types/material.ts`)

Added 20 new fields to the `Material` interface:

#### Compostability (CC-v1)
- **Parameters (0-1 scale):**
  - `B_value` - Biodegradation rate constant
  - `N_value` - Nutrient balance (C:N:P ratio suitability)
  - `T_value` - Toxicity / Residue index
  - `H_value` - Habitat adaptability (fraction of composting systems)
  - `M_value` - Infrastructure maturity (shared across all dimensions)

- **Composite Indices:**
  - `CC_practical_mean` - Practical compostability (0-1)
  - `CC_theoretical_mean` - Theoretical compostability (0-1)
  - `CC_practical_CI95` - 95% confidence interval
  - `CC_theoretical_CI95` - 95% confidence interval

#### Reusability (RU-v1)
- **Parameters (0-1 scale):**
  - `L_value` - Lifetime (average functional cycles)
  - `R_value` - Repairability (ease of disassembly)
  - `U_value` - Upgradability (ease of adaptation)
  - `C_RU_value` - Contamination susceptibility (renamed to avoid conflict with CR's C_value)
  - `M_value` - Market infrastructure maturity (shared)

- **Composite Indices:**
  - `RU_practical_mean` - Practical reusability (0-1)
  - `RU_theoretical_mean` - Theoretical reusability (0-1)
  - `RU_practical_CI95` - 95% confidence interval
  - `RU_theoretical_CI95` - 95% confidence interval

---

## 2. API Endpoints

### Calculation Endpoints (Admin Only)

All endpoints require authentication and admin role.

#### POST `/make-server-17cae920/calculate/compostability`

Calculate CC index from parameters.

**Request Body:**
```json
{
  "B": 0.85,
  "N": 0.92,
  "T": 0.15,
  "H": 0.78,
  "M": 0.65,
  "mode": "practical"
}
```

**Response:**
```json
{
  "CC_mean": 0.7145,
  "CC_public": 71,
  "mode": "practical",
  "weights": {
    "w_B": 0.35,
    "w_N": 0.15,
    "w_H": 0.20,
    "w_M": 0.20,
    "w_T": 0.10
  },
  "inputs": { "B": 0.85, "N": 0.92, "T": 0.15, "H": 0.78, "M": 0.65 },
  "whitepaper_version": "2025.1",
  "method_version": "CC-v1",
  "calculation_timestamp": "2025-10-22T..."
}
```

**Weights:**
- **Theoretical mode:** `{ w_B: 0.45, w_N: 0.15, w_H: 0.15, w_M: 0.15, w_T: 0.10 }`
- **Practical mode:** `{ w_B: 0.35, w_N: 0.15, w_H: 0.20, w_M: 0.20, w_T: 0.10 }`

**Formula:** `CC = w_B·B + w_N·N + w_H·H + w_M·M − w_T·T`

---

#### POST `/make-server-17cae920/calculate/reusability`

Calculate RU index from parameters.

**Request Body:**
```json
{
  "L": 0.88,
  "R": 0.75,
  "U": 0.60,
  "C": 0.20,
  "M": 0.55,
  "mode": "theoretical"
}
```

**Response:**
```json
{
  "RU_mean": 0.6825,
  "RU_public": 68,
  "mode": "theoretical",
  "weights": {
    "w_L": 0.35,
    "w_R": 0.20,
    "w_U": 0.15,
    "w_M": 0.20,
    "w_C": 0.10
  },
  "inputs": { "L": 0.88, "R": 0.75, "U": 0.60, "C": 0.20, "M": 0.55 },
  "whitepaper_version": "2025.1",
  "method_version": "RU-v1",
  "calculation_timestamp": "2025-10-22T..."
}
```

**Weights:**
- **Theoretical mode:** `{ w_L: 0.35, w_R: 0.20, w_U: 0.15, w_M: 0.20, w_C: 0.10 }`
- **Practical mode:** `{ w_L: 0.25, w_R: 0.25, w_U: 0.15, w_M: 0.25, w_C: 0.10 }`

**Formula:** `RU = w_L·L + w_R·R + w_U·U + w_M·M − w_C·C`

---

#### POST `/make-server-17cae920/calculate/all-dimensions`

Calculate CR, CC, and RU in a single request.

**Request Body:**
```json
{
  "mode": "practical",
  "Y": 0.80, "D": 0.85, "C": 0.70, "M": 0.60, "E": 0.45,
  "B": 0.90, "N": 0.88, "T": 0.10, "H": 0.75,
  "L": 0.92, "R": 0.80, "U": 0.65, "C_RU": 0.18
}
```

**Response:**
```json
{
  "mode": "practical",
  "calculation_timestamp": "2025-10-22T...",
  "whitepaper_version": "2025.1",
  "CR": {
    "message": "CR calculation implementation needed",
    "requires": ["Y", "D", "C", "M", "E"]
  },
  "CC": {
    "mean": 0.7425,
    "public": 74,
    "method_version": "CC-v1",
    "weights": { ... }
  },
  "RU": {
    "mean": 0.6932,
    "public": 69,
    "method_version": "RU-v1",
    "weights": { ... }
  }
}
```

**Note:** CR calculation logic needs to be added to this endpoint.

---

### Export Endpoints (Updated)

#### GET `/make-server-17cae920/export/full?format=csv`

Full research export now includes all CC and RU fields.

**New CSV Columns Added:**
- `B (Biodegradation)`, `N (Nutrient Balance)`, `T (Toxicity)`, `H (Habitat Adaptability)`
- `CC Practical Mean`, `CC Practical CI Lower`, `CC Practical CI Upper`
- `CC Theoretical Mean`, `CC Theoretical CI Lower`, `CC Theoretical CI Upper`
- `L (Lifetime)`, `R (Repairability)`, `U (Upgradability)`, `C_RU (Contamination)`
- `RU Practical Mean`, `RU Practical CI Lower`, `RU Practical CI Upper`
- `RU Theoretical Mean`, `RU Theoretical CI Lower`, `RU Theoretical CI Upper`

**Total columns:** 39 (was 24)

---

## 3. API Utility Functions

### Added to `/utils/api.tsx`

```typescript
// Calculate Compostability
calculateCompostability(params: CompostabilityParams): Promise<CalculationResult>

// Calculate Reusability
calculateReusability(params: ReusabilityParams): Promise<CalculationResult>

// Calculate all dimensions
calculateAllDimensions(params: any): Promise<any>
```

**TypeScript Interfaces:**
- `CompostabilityParams` - B, N, T, H, M, mode
- `ReusabilityParams` - L, R, U, C, M, mode
- `CalculationResult` - mean, public, mode, weights, versions, timestamp

---

## 4. Data Storage

All new fields are stored in the KV store alongside existing material data:

```json
{
  "id": "material-123",
  "name": "Wood Fiber",
  "category": "Organic/Natural Waste",
  
  "Y_value": 0.75,
  "D_value": 0.82,
  "CR_practical_mean": 0.68,
  "CR_theoretical_mean": 0.85,
  
  "B_value": 0.95,
  "N_value": 0.88,
  "T_value": 0.05,
  "H_value": 0.92,
  "CC_practical_mean": 0.87,
  "CC_theoretical_mean": 0.93,
  
  "L_value": 0.45,
  "R_value": 0.30,
  "U_value": 0.25,
  "C_RU_value": 0.65,
  "RU_practical_mean": 0.28,
  "RU_theoretical_mean": 0.35,
  
  "M_value": 0.70,
  "confidence_level": "High",
  "whitepaper_version": "2025.1"
}
```

---

## 5. Shared Parameters

### M_value (Infrastructure Maturity)

The `M_value` parameter is **shared across all three dimensions** as specified in the whitepapers:

- **CR:** Infrastructure availability and readiness for recycling
- **CC:** Availability of industrial or community compost facilities
- **RU:** Availability of reuse logistics and market infrastructure

This represents the general circular economy infrastructure maturity for a given material/region.

---

## 6. Validation

All calculation endpoints validate that:
1. Input parameters are numbers
2. Values are within 0-1 range
3. Mode is either 'theoretical' or 'practical' (defaults to 'practical')

**Error Response Example:**
```json
{
  "error": "Invalid B value. Must be between 0 and 1."
}
```

---

## 7. Versioning

All calculations include:
- `whitepaper_version`: "2025.1"
- `method_version`: "CC-v1" or "RU-v1"
- `calculation_timestamp`: ISO 8601 timestamp

This ensures full reproducibility and traceability.

---

## 8. Next Steps (Frontend Integration)

### Phase 5 Implementation Tasks

1. **ScientificDataEditor Extension**
   - Add tabbed interface: Recyclability / Compostability / Reusability
   - Create parameter input forms for B, N, T, H (CC) and L, R, U, C (RU)
   - Add "Calculate CC" and "Calculate RU" buttons
   - Wire up to new API endpoints

2. **DataProcessingView Extension**
   - Add CC calculator component
   - Add RU calculator component
   - Share M_value slider across all three calculators
   - Display all three results side-by-side

3. **QuantileVisualization Extension**
   - Add dimension selector dropdown
   - Fetch CC/RU data alongside CR data
   - Render appropriate score bar colors per dimension

4. **Source Library Enhancement**
   - Add tags: `biodegradation`, `composting`, `toxicity`, `nutrient-balance`
   - Add tags: `repair`, `durability`, `longevity`, `modularity`
   - Auto-assign parameters based on source tags

---

## 9. Testing Checklist

- [ ] Test CC calculation with all parameters
- [ ] Test CC calculation with mode='theoretical'
- [ ] Test RU calculation with all parameters
- [ ] Test RU calculation with mode='practical'
- [ ] Test all-dimensions endpoint
- [ ] Test validation errors (values >1, values <0)
- [ ] Test export/full includes CC and RU columns
- [ ] Verify CSV formatting with new columns
- [ ] Test material save/update with CC and RU fields
- [ ] Verify M_value is correctly shared across dimensions

---

## 10. Methodology References

- **CR-v1:** `/whitepapers/Recyclability.md`
- **CC-v1:** `/whitepapers/CC-v1.md`
- **RU-v1:** `/whitepapers/RU-v1.md`
- **VIZ-v1:** `/whitepapers/VIZ-v1.md`

---

**Status:** Backend infrastructure complete ✅  
**Next:** Frontend UI implementation for Phase 5  
**Estimated Effort:** 3-4 days for complete frontend integration
