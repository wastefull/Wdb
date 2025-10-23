/**
 * Data Migration Utilities
 * Functions to backfill and update existing materials with new data structures
 */

import { SOURCE_LIBRARY, getSourcesByTag, type Source as LibrarySource } from '../data/sources';

interface Source {
  title: string;
  authors?: string;
  year?: number;
  doi?: string;
  url?: string;
  weight?: number;
}

interface ConfidenceInterval {
  lower: number;
  upper: number;
}

interface Material {
  id: string;
  name: string;
  category: string;
  compostability: number;
  recyclability: number;
  reusability: number;
  description?: string;
  
  // Scientific parameters - Recyclability (CR)
  Y_value?: number;
  D_value?: number;
  C_value?: number;
  M_value?: number;
  E_value?: number;
  
  // Scientific parameters - Compostability (CC)
  B_value?: number;
  N_value?: number;
  T_value?: number;
  H_value?: number;
  
  // Scientific parameters - Reusability (RU)
  L_value?: number;
  R_value?: number;
  U_value?: number;
  C_RU_value?: number;
  
  // Composite scores
  CR_practical_mean?: number;
  CR_theoretical_mean?: number;
  CR_practical_CI95?: ConfidenceInterval;
  CR_theoretical_CI95?: ConfidenceInterval;
  CC_practical_mean?: number;
  CC_theoretical_mean?: number;
  CC_practical_CI95?: ConfidenceInterval;
  CC_theoretical_CI95?: ConfidenceInterval;
  RU_practical_mean?: number;
  RU_theoretical_mean?: number;
  RU_practical_CI95?: ConfidenceInterval;
  RU_theoretical_CI95?: ConfidenceInterval;
  
  confidence_level?: 'High' | 'Medium' | 'Low';
  sources?: Source[];
  whitepaper_version?: string;
  calculation_timestamp?: string;
  method_version?: string;
}

/**
 * Material-specific default scientific data based on common materials
 * Now includes CC (Compostability) and RU (Reusability) data for all three dimensions
 */
const MATERIAL_DEFAULTS: Record<string, Partial<Material>> = {
  // Paper & Cardboard
  'Cardboard': {
    // CR - Recyclability
    Y_value: 0.82,
    D_value: 0.15,
    C_value: 0.70,
    M_value: 0.95,
    E_value: 0.25,
    CR_practical_mean: 0.78,
    CR_theoretical_mean: 0.89,
    CR_practical_CI95: { lower: 0.74, upper: 0.82 },
    CR_theoretical_CI95: { lower: 0.85, upper: 0.93 },
    // CC - Compostability
    B_value: 0.65,  // Moderate biodegradation
    N_value: 0.72,  // Good nutrient balance (carbon-rich)
    T_value: 0.88,  // Low toxicity
    H_value: 0.75,  // Good habitat adaptability
    CC_practical_mean: 0.68,
    CC_theoretical_mean: 0.85,
    CC_practical_CI95: { lower: 0.64, upper: 0.72 },
    CC_theoretical_CI95: { lower: 0.81, upper: 0.89 },
    // RU - Reusability
    L_value: 0.35,  // Low lifetime (degrades quickly)
    R_value: 0.25,  // Poor repairability
    U_value: 0.55,  // Moderate upgradability (can be reused for storage)
    C_RU_value: 0.40,  // Moderate contamination susceptibility
    RU_practical_mean: 0.32,
    RU_theoretical_mean: 0.48,
    RU_practical_CI95: { lower: 0.28, upper: 0.36 },
    RU_theoretical_CI95: { lower: 0.44, upper: 0.52 },
  },
  'Paper': {
    // CR - Recyclability
    Y_value: 0.80,
    D_value: 0.18,
    C_value: 0.65,
    M_value: 0.95,
    E_value: 0.28,
    CR_practical_mean: 0.72,
    CR_theoretical_mean: 0.85,
    CR_practical_CI95: { lower: 0.68, upper: 0.76 },
    CR_theoretical_CI95: { lower: 0.81, upper: 0.89 },
    // CC - Compostability
    B_value: 0.70,  // Good biodegradation
    N_value: 0.75,  // Good nutrient balance
    T_value: 0.85,  // Low toxicity (some inks may be problematic)
    H_value: 0.78,  // Good habitat adaptability
    CC_practical_mean: 0.72,
    CC_theoretical_mean: 0.88,
    CC_practical_CI95: { lower: 0.68, upper: 0.76 },
    CC_theoretical_CI95: { lower: 0.84, upper: 0.92 },
    // RU - Reusability
    L_value: 0.30,  // Low lifetime
    R_value: 0.20,  // Poor repairability
    U_value: 0.50,  // Moderate upgradability
    C_RU_value: 0.35,  // Moderate contamination susceptibility
    RU_practical_mean: 0.28,
    RU_theoretical_mean: 0.42,
    RU_practical_CI95: { lower: 0.24, upper: 0.32 },
    RU_theoretical_CI95: { lower: 0.38, upper: 0.46 },
  },
  
  // Glass
  'Glass': {
    // CR - Recyclability
    Y_value: 0.98,
    D_value: 0.01,
    C_value: 0.85,
    M_value: 0.92,
    E_value: 0.35,
    CR_practical_mean: 0.93,
    CR_theoretical_mean: 0.97,
    CR_practical_CI95: { lower: 0.91, upper: 0.95 },
    CR_theoretical_CI95: { lower: 0.95, upper: 0.99 },
    // CC - Compostability
    B_value: 0.05,  // Very low biodegradation (inert)
    N_value: 0.10,  // No nutrient value
    T_value: 0.98,  // Very low toxicity (inert)
    H_value: 0.15,  // Poor habitat adaptability
    CC_practical_mean: 0.08,
    CC_theoretical_mean: 0.12,
    CC_practical_CI95: { lower: 0.06, upper: 0.10 },
    CC_theoretical_CI95: { lower: 0.10, upper: 0.14 },
    // RU - Reusability
    L_value: 0.92,  // Very high lifetime (durable)
    R_value: 0.45,  // Moderate repairability (can't repair cracks easily)
    U_value: 0.88,  // High upgradability (versatile)
    C_RU_value: 0.85,  // Low contamination susceptibility (easy to clean)
    RU_practical_mean: 0.85,
    RU_theoretical_mean: 0.92,
    RU_practical_CI95: { lower: 0.82, upper: 0.88 },
    RU_theoretical_CI95: { lower: 0.89, upper: 0.95 },
  },
  
  // Plastics
  'Plastic (PET)': {
    // CR - Recyclability
    Y_value: 0.65,
    D_value: 0.25,
    C_value: 0.45,
    M_value: 0.75,
    E_value: 0.40,
    CR_practical_mean: 0.52,
    CR_theoretical_mean: 0.71,
    CR_practical_CI95: { lower: 0.48, upper: 0.56 },
    CR_theoretical_CI95: { lower: 0.67, upper: 0.75 },
    // CC - Compostability
    B_value: 0.15,  // Very low biodegradation (petroleum-based)
    N_value: 0.20,  // Poor nutrient balance
    T_value: 0.75,  // Some concerns with microplastics
    H_value: 0.25,  // Poor habitat adaptability
    CC_practical_mean: 0.12,
    CC_theoretical_mean: 0.28,
    CC_practical_CI95: { lower: 0.10, upper: 0.14 },
    CC_theoretical_CI95: { lower: 0.24, upper: 0.32 },
    // RU - Reusability
    L_value: 0.55,  // Moderate lifetime (can degrade with UV)
    R_value: 0.35,  // Low repairability
    U_value: 0.65,  // Moderate upgradability
    C_RU_value: 0.60,  // Moderate contamination susceptibility
    RU_practical_mean: 0.52,
    RU_theoretical_mean: 0.68,
    RU_practical_CI95: { lower: 0.48, upper: 0.56 },
    RU_theoretical_CI95: { lower: 0.64, upper: 0.72 },
  },
  'PET': {
    // CR - Recyclability
    Y_value: 0.65,
    D_value: 0.25,
    C_value: 0.45,
    M_value: 0.75,
    E_value: 0.40,
    CR_practical_mean: 0.52,
    CR_theoretical_mean: 0.71,
    CR_practical_CI95: { lower: 0.48, upper: 0.56 },
    CR_theoretical_CI95: { lower: 0.67, upper: 0.75 },
    // CC - Compostability
    B_value: 0.15,
    N_value: 0.20,
    T_value: 0.75,
    H_value: 0.25,
    CC_practical_mean: 0.12,
    CC_theoretical_mean: 0.28,
    CC_practical_CI95: { lower: 0.10, upper: 0.14 },
    CC_theoretical_CI95: { lower: 0.24, upper: 0.32 },
    // RU - Reusability
    L_value: 0.55,
    R_value: 0.35,
    U_value: 0.65,
    C_RU_value: 0.60,
    RU_practical_mean: 0.52,
    RU_theoretical_mean: 0.68,
    RU_practical_CI95: { lower: 0.48, upper: 0.56 },
    RU_theoretical_CI95: { lower: 0.64, upper: 0.72 },
  },
  'HDPE': {
    // CR - Recyclability
    Y_value: 0.68,
    D_value: 0.22,
    C_value: 0.50,
    M_value: 0.72,
    E_value: 0.38,
    CR_practical_mean: 0.55,
    CR_theoretical_mean: 0.74,
    CR_practical_CI95: { lower: 0.51, upper: 0.59 },
    CR_theoretical_CI95: { lower: 0.70, upper: 0.78 },
    // CC - Compostability
    B_value: 0.12,
    N_value: 0.18,
    T_value: 0.78,
    H_value: 0.22,
    CC_practical_mean: 0.10,
    CC_theoretical_mean: 0.25,
    CC_practical_CI95: { lower: 0.08, upper: 0.12 },
    CC_theoretical_CI95: { lower: 0.22, upper: 0.28 },
    // RU - Reusability
    L_value: 0.62,
    R_value: 0.38,
    U_value: 0.70,
    C_RU_value: 0.65,
    RU_practical_mean: 0.58,
    RU_theoretical_mean: 0.72,
    RU_practical_CI95: { lower: 0.54, upper: 0.62 },
    RU_theoretical_CI95: { lower: 0.68, upper: 0.76 },
  },
  'PVC': {
    // CR - Recyclability
    Y_value: 0.45,
    D_value: 0.35,
    C_value: 0.30,
    M_value: 0.40,
    E_value: 0.55,
    CR_practical_mean: 0.28,
    CR_theoretical_mean: 0.48,
    CR_practical_CI95: { lower: 0.24, upper: 0.32 },
    CR_theoretical_CI95: { lower: 0.44, upper: 0.52 },
    // CC - Compostability
    B_value: 0.08,
    N_value: 0.12,
    T_value: 0.45,  // Contains plasticizers and additives
    H_value: 0.15,
    CC_practical_mean: 0.06,
    CC_theoretical_mean: 0.18,
    CC_practical_CI95: { lower: 0.04, upper: 0.08 },
    CC_theoretical_CI95: { lower: 0.15, upper: 0.21 },
    // RU - Reusability
    L_value: 0.58,
    R_value: 0.30,
    U_value: 0.55,
    C_RU_value: 0.50,
    RU_practical_mean: 0.45,
    RU_theoretical_mean: 0.62,
    RU_practical_CI95: { lower: 0.41, upper: 0.49 },
    RU_theoretical_CI95: { lower: 0.58, upper: 0.66 },
  },
  'Polystyrene': {
    // CR - Recyclability
    Y_value: 0.42,
    D_value: 0.38,
    C_value: 0.28,
    M_value: 0.35,
    E_value: 0.58,
    CR_practical_mean: 0.25,
    CR_theoretical_mean: 0.44,
    CR_practical_CI95: { lower: 0.21, upper: 0.29 },
    CR_theoretical_CI95: { lower: 0.40, upper: 0.48 },
    // CC - Compostability
    B_value: 0.10,
    N_value: 0.15,
    T_value: 0.65,
    H_value: 0.18,
    CC_practical_mean: 0.08,
    CC_theoretical_mean: 0.22,
    CC_practical_CI95: { lower: 0.06, upper: 0.10 },
    CC_theoretical_CI95: { lower: 0.19, upper: 0.25 },
    // RU - Reusability
    L_value: 0.40,  // Fragile
    R_value: 0.25,
    U_value: 0.45,
    C_RU_value: 0.40,
    RU_practical_mean: 0.35,
    RU_theoretical_mean: 0.52,
    RU_practical_CI95: { lower: 0.31, upper: 0.39 },
    RU_theoretical_CI95: { lower: 0.48, upper: 0.56 },
  },
  
  // Metals
  'Aluminum': {
    // CR - Recyclability
    Y_value: 0.95,
    D_value: 0.02,
    C_value: 0.88,
    M_value: 0.90,
    E_value: 0.30,
    CR_practical_mean: 0.90,
    CR_theoretical_mean: 0.95,
    CR_practical_CI95: { lower: 0.88, upper: 0.92 },
    CR_theoretical_CI95: { lower: 0.93, upper: 0.97 },
    // CC - Compostability
    B_value: 0.02,  // Essentially no biodegradation
    N_value: 0.08,
    T_value: 0.92,  // Low toxicity (inert)
    H_value: 0.10,
    CC_practical_mean: 0.05,
    CC_theoretical_mean: 0.08,
    CC_practical_CI95: { lower: 0.03, upper: 0.07 },
    CC_theoretical_CI95: { lower: 0.06, upper: 0.10 },
    // RU - Reusability
    L_value: 0.88,  // High lifetime (doesn't rust)
    R_value: 0.65,  // Good repairability
    U_value: 0.82,
    C_RU_value: 0.80,
    RU_practical_mean: 0.82,
    RU_theoretical_mean: 0.90,
    RU_practical_CI95: { lower: 0.79, upper: 0.85 },
    RU_theoretical_CI95: { lower: 0.87, upper: 0.93 },
  },
  'Steel': {
    // CR - Recyclability
    Y_value: 0.92,
    D_value: 0.03,
    C_value: 0.82,
    M_value: 0.88,
    E_value: 0.42,
    CR_practical_mean: 0.86,
    CR_theoretical_mean: 0.92,
    CR_practical_CI95: { lower: 0.84, upper: 0.88 },
    CR_theoretical_CI95: { lower: 0.90, upper: 0.94 },
    // CC - Compostability
    B_value: 0.03,  // Minimal corrosion
    N_value: 0.10,
    T_value: 0.88,
    H_value: 0.12,
    CC_practical_mean: 0.06,
    CC_theoretical_mean: 0.10,
    CC_practical_CI95: { lower: 0.04, upper: 0.08 },
    CC_theoretical_CI95: { lower: 0.08, upper: 0.12 },
    // RU - Reusability
    L_value: 0.85,  // High lifetime (can rust)
    R_value: 0.75,  // Excellent repairability
    U_value: 0.78,
    C_RU_value: 0.75,
    RU_practical_mean: 0.80,
    RU_theoretical_mean: 0.88,
    RU_practical_CI95: { lower: 0.77, upper: 0.83 },
    RU_theoretical_CI95: { lower: 0.85, upper: 0.91 },
  },
  
  // Organics
  'Food Waste': {
    // CR - Recyclability (limited applicability)
    Y_value: 0.75,
    D_value: 1.00, // Fully degrades (negative for recycling, positive for composting)
    C_value: 0.60,
    M_value: 0.55,
    E_value: 0.15,
    CR_practical_mean: 0.45,
    CR_theoretical_mean: 0.75,
    CR_practical_CI95: { lower: 0.41, upper: 0.49 },
    CR_theoretical_CI95: { lower: 0.71, upper: 0.79 },
    // CC - Compostability (ideal!)
    B_value: 0.95,  // Excellent biodegradation
    N_value: 0.88,  // Good nutrient balance
    T_value: 0.92,  // Low toxicity (natural material)
    H_value: 0.85,  // High habitat adaptability
    CC_practical_mean: 0.88,
    CC_theoretical_mean: 0.95,
    CC_practical_CI95: { lower: 0.85, upper: 0.91 },
    CC_theoretical_CI95: { lower: 0.92, upper: 0.98 },
    // RU - Reusability (not applicable)
    L_value: 0.15,  // Short lifetime (spoils)
    R_value: 0.10,  // No repairability
    U_value: 0.25,  // Limited upgradability (can be animal feed)
    C_RU_value: 0.05,  // High contamination susceptibility
    RU_practical_mean: 0.12,
    RU_theoretical_mean: 0.20,
    RU_practical_CI95: { lower: 0.10, upper: 0.14 },
    RU_theoretical_CI95: { lower: 0.18, upper: 0.22 },
  },
  
  // Textiles
  'Cotton Fabric': {
    // CR - Recyclability
    Y_value: 0.55,  // Moderate yield (fiber shortening)
    D_value: 0.30,  // Degradation through wear
    C_value: 0.40,  // Contamination from dyes/finishes
    M_value: 0.45,  // Limited infrastructure
    E_value: 0.50,  // Moderate energy
    CR_practical_mean: 0.38,
    CR_theoretical_mean: 0.58,
    CR_practical_CI95: { lower: 0.34, upper: 0.42 },
    CR_theoretical_CI95: { lower: 0.54, upper: 0.62 },
    // CC - Compostability
    B_value: 0.78,  // Good biodegradation (natural fiber)
    N_value: 0.70,  // Good nutrient balance
    T_value: 0.65,  // Some concerns with dyes/treatments
    H_value: 0.72,  // Good habitat adaptability
    CC_practical_mean: 0.68,
    CC_theoretical_mean: 0.82,
    CC_practical_CI95: { lower: 0.64, upper: 0.72 },
    CC_theoretical_CI95: { lower: 0.78, upper: 0.86 },
    // RU - Reusability
    L_value: 0.70,  // Good lifetime with care
    R_value: 0.65,  // Can be mended
    U_value: 0.75,  // High upgradability (repurpose, upcycle)
    C_RU_value: 0.70,  // Moderate cleaning ease
    RU_practical_mean: 0.68,
    RU_theoretical_mean: 0.78,
    RU_practical_CI95: { lower: 0.64, upper: 0.72 },
    RU_theoretical_CI95: { lower: 0.74, upper: 0.82 },
  },
  'Cotton': {
    // Same as Cotton Fabric
    Y_value: 0.55,
    D_value: 0.30,
    C_value: 0.40,
    M_value: 0.45,
    E_value: 0.50,
    CR_practical_mean: 0.38,
    CR_theoretical_mean: 0.58,
    CR_practical_CI95: { lower: 0.34, upper: 0.42 },
    CR_theoretical_CI95: { lower: 0.54, upper: 0.62 },
    B_value: 0.78,
    N_value: 0.70,
    T_value: 0.65,
    H_value: 0.72,
    CC_practical_mean: 0.68,
    CC_theoretical_mean: 0.82,
    CC_practical_CI95: { lower: 0.64, upper: 0.72 },
    CC_theoretical_CI95: { lower: 0.78, upper: 0.86 },
    L_value: 0.70,
    R_value: 0.65,
    U_value: 0.75,
    C_RU_value: 0.70,
    RU_practical_mean: 0.68,
    RU_theoretical_mean: 0.78,
    RU_practical_CI95: { lower: 0.64, upper: 0.72 },
    RU_theoretical_CI95: { lower: 0.74, upper: 0.82 },
  },
  
  // Construction Materials
  'Concrete': {
    // CR - Recyclability
    Y_value: 0.70,  // Can be crushed for aggregate
    D_value: 0.25,  // Quality loss (downcycling)
    C_value: 0.55,  // Contamination from rebar/additives
    M_value: 0.60,  // Growing infrastructure
    E_value: 0.65,  // Energy intensive crushing
    CR_practical_mean: 0.52,
    CR_theoretical_mean: 0.68,
    CR_practical_CI95: { lower: 0.48, upper: 0.56 },
    CR_theoretical_CI95: { lower: 0.64, upper: 0.72 },
    // CC - Compostability
    B_value: 0.08,  // Minimal biodegradation (mineral)
    N_value: 0.12,  // No nutrient value
    T_value: 0.82,  // Generally inert
    H_value: 0.15,  // Poor habitat adaptability
    CC_practical_mean: 0.10,
    CC_theoretical_mean: 0.15,
    CC_practical_CI95: { lower: 0.08, upper: 0.12 },
    CC_theoretical_CI95: { lower: 0.13, upper: 0.17 },
    // RU - Reusability
    L_value: 0.95,  // Very long lifetime (decades)
    R_value: 0.40,  // Difficult to repair (cracks)
    U_value: 0.50,  // Limited upgradability
    C_RU_value: 0.65,  // Moderate contamination resistance
    RU_practical_mean: 0.58,
    RU_theoretical_mean: 0.72,
    RU_practical_CI95: { lower: 0.54, upper: 0.62 },
    RU_theoretical_CI95: { lower: 0.68, upper: 0.76 },
  },
  'Cement': {
    // Similar to concrete but slightly different
    Y_value: 0.65,
    D_value: 0.28,
    C_value: 0.50,
    M_value: 0.55,
    E_value: 0.70,
    CR_practical_mean: 0.48,
    CR_theoretical_mean: 0.65,
    CR_practical_CI95: { lower: 0.44, upper: 0.52 },
    CR_theoretical_CI95: { lower: 0.61, upper: 0.69 },
    B_value: 0.05,
    N_value: 0.10,
    T_value: 0.80,
    H_value: 0.12,
    CC_practical_mean: 0.08,
    CC_theoretical_mean: 0.12,
    CC_practical_CI95: { lower: 0.06, upper: 0.10 },
    CC_theoretical_CI95: { lower: 0.10, upper: 0.14 },
    L_value: 0.92,
    R_value: 0.35,
    U_value: 0.45,
    C_RU_value: 0.60,
    RU_practical_mean: 0.55,
    RU_theoretical_mean: 0.68,
    RU_practical_CI95: { lower: 0.51, upper: 0.59 },
    RU_theoretical_CI95: { lower: 0.64, upper: 0.72 },
  },
  
  // Electronics & Batteries
  'Lithium-ion Battery': {
    // CR - Recyclability
    Y_value: 0.60,  // Moderate yield (lithium recovery)
    D_value: 0.35,  // Degradation through cycles
    C_value: 0.40,  // Complex material separation
    M_value: 0.50,  // Growing infrastructure
    E_value: 0.75,  // Very energy intensive
    CR_practical_mean: 0.42,
    CR_theoretical_mean: 0.62,
    CR_practical_CI95: { lower: 0.38, upper: 0.46 },
    CR_theoretical_CI95: { lower: 0.58, upper: 0.66 },
    // CC - Compostability
    B_value: 0.02,  // No biodegradation
    N_value: 0.05,  // No nutrient value
    T_value: 0.10,  // High toxicity (heavy metals, electrolytes)
    H_value: 0.05,  // Not suitable for composting
    CC_practical_mean: 0.03,
    CC_theoretical_mean: 0.05,
    CC_practical_CI95: { lower: 0.02, upper: 0.04 },
    CC_theoretical_CI95: { lower: 0.04, upper: 0.06 },
    // RU - Reusability
    L_value: 0.55,  // Moderate lifetime (500-1000 cycles)
    R_value: 0.30,  // Difficult to repair (sealed units)
    U_value: 0.40,  // Limited upgradability
    C_RU_value: 0.50,  // Moderate contamination concerns
    RU_practical_mean: 0.42,
    RU_theoretical_mean: 0.58,
    RU_practical_CI95: { lower: 0.38, upper: 0.46 },
    RU_theoretical_CI95: { lower: 0.54, upper: 0.62 },
  },
  'Battery': {
    // Generic battery (similar to lithium-ion)
    Y_value: 0.55,
    D_value: 0.40,
    C_value: 0.35,
    M_value: 0.45,
    E_value: 0.78,
    CR_practical_mean: 0.38,
    CR_theoretical_mean: 0.58,
    CR_practical_CI95: { lower: 0.34, upper: 0.42 },
    CR_theoretical_CI95: { lower: 0.54, upper: 0.62 },
    B_value: 0.02,
    N_value: 0.05,
    T_value: 0.15,
    H_value: 0.05,
    CC_practical_mean: 0.04,
    CC_theoretical_mean: 0.06,
    CC_practical_CI95: { lower: 0.03, upper: 0.05 },
    CC_theoretical_CI95: { lower: 0.05, upper: 0.07 },
    L_value: 0.50,
    R_value: 0.25,
    U_value: 0.35,
    C_RU_value: 0.45,
    RU_practical_mean: 0.38,
    RU_theoretical_mean: 0.52,
    RU_practical_CI95: { lower: 0.34, upper: 0.42 },
    RU_theoretical_CI95: { lower: 0.48, upper: 0.56 },
  },
  
  // Additional Common Materials
  'Wood': {
    // CR - Recyclability
    Y_value: 0.72,
    D_value: 0.20,
    C_value: 0.60,
    M_value: 0.65,
    E_value: 0.35,
    CR_practical_mean: 0.62,
    CR_theoretical_mean: 0.78,
    CR_practical_CI95: { lower: 0.58, upper: 0.66 },
    CR_theoretical_CI95: { lower: 0.74, upper: 0.82 },
    // CC - Compostability
    B_value: 0.60,  // Slow biodegradation (lignin)
    N_value: 0.55,  // Carbon-rich
    T_value: 0.85,  // Low toxicity (untreated)
    H_value: 0.65,  // Moderate habitat adaptability
    CC_practical_mean: 0.58,
    CC_theoretical_mean: 0.75,
    CC_practical_CI95: { lower: 0.54, upper: 0.62 },
    CC_theoretical_CI95: { lower: 0.71, upper: 0.79 },
    // RU - Reusability
    L_value: 0.78,
    R_value: 0.70,
    U_value: 0.85,  // Highly versatile
    C_RU_value: 0.68,
    RU_practical_mean: 0.75,
    RU_theoretical_mean: 0.85,
    RU_practical_CI95: { lower: 0.71, upper: 0.79 },
    RU_theoretical_CI95: { lower: 0.81, upper: 0.89 },
  },
  'Rubber': {
    // CR - Recyclability
    Y_value: 0.58,
    D_value: 0.32,
    C_value: 0.42,
    M_value: 0.50,
    E_value: 0.60,
    CR_practical_mean: 0.45,
    CR_theoretical_mean: 0.62,
    CR_practical_CI95: { lower: 0.41, upper: 0.49 },
    CR_theoretical_CI95: { lower: 0.58, upper: 0.66 },
    // CC - Compostability
    B_value: 0.25,  // Slow biodegradation
    N_value: 0.30,
    T_value: 0.60,  // Some concerns with additives
    H_value: 0.35,
    CC_practical_mean: 0.28,
    CC_theoretical_mean: 0.42,
    CC_practical_CI95: { lower: 0.24, upper: 0.32 },
    CC_theoretical_CI95: { lower: 0.38, upper: 0.46 },
    // RU - Reusability
    L_value: 0.68,
    R_value: 0.50,
    U_value: 0.60,
    C_RU_value: 0.55,
    RU_practical_mean: 0.58,
    RU_theoretical_mean: 0.70,
    RU_practical_CI95: { lower: 0.54, upper: 0.62 },
    RU_theoretical_CI95: { lower: 0.66, upper: 0.74 },
  },
  'Leather': {
    // CR - Recyclability
    Y_value: 0.45,
    D_value: 0.40,
    C_value: 0.35,
    M_value: 0.35,
    E_value: 0.55,
    CR_practical_mean: 0.32,
    CR_theoretical_mean: 0.48,
    CR_practical_CI95: { lower: 0.28, upper: 0.36 },
    CR_theoretical_CI95: { lower: 0.44, upper: 0.52 },
    // CC - Compostability
    B_value: 0.55,  // Moderate biodegradation (tanning affects)
    N_value: 0.50,
    T_value: 0.50,  // Concerns with tanning chemicals
    H_value: 0.45,
    CC_practical_mean: 0.48,
    CC_theoretical_mean: 0.62,
    CC_practical_CI95: { lower: 0.44, upper: 0.52 },
    CC_theoretical_CI95: { lower: 0.58, upper: 0.66 },
    // RU - Reusability
    L_value: 0.75,
    R_value: 0.68,
    U_value: 0.70,
    C_RU_value: 0.65,
    RU_practical_mean: 0.70,
    RU_theoretical_mean: 0.80,
    RU_practical_CI95: { lower: 0.66, upper: 0.74 },
    RU_theoretical_CI95: { lower: 0.76, upper: 0.84 },
  },
  'Ceramic': {
    // CR - Recyclability
    Y_value: 0.50,
    D_value: 0.30,
    C_value: 0.45,
    M_value: 0.40,
    E_value: 0.70,
    CR_practical_mean: 0.38,
    CR_theoretical_mean: 0.55,
    CR_practical_CI95: { lower: 0.34, upper: 0.42 },
    CR_theoretical_CI95: { lower: 0.51, upper: 0.59 },
    // CC - Compostability
    B_value: 0.05,
    N_value: 0.10,
    T_value: 0.90,
    H_value: 0.12,
    CC_practical_mean: 0.08,
    CC_theoretical_mean: 0.12,
    CC_practical_CI95: { lower: 0.06, upper: 0.10 },
    CC_theoretical_CI95: { lower: 0.10, upper: 0.14 },
    // RU - Reusability
    L_value: 0.90,
    R_value: 0.35,  // Difficult to repair when broken
    U_value: 0.80,
    C_RU_value: 0.85,
    RU_practical_mean: 0.78,
    RU_theoretical_mean: 0.88,
    RU_practical_CI95: { lower: 0.74, upper: 0.82 },
    RU_theoretical_CI95: { lower: 0.84, upper: 0.92 },
  },
};

/**
 * Get default scientific data for a material based on its name
 */
function getDefaultScientificData(materialName: string): Partial<Material> | null {
  // Try exact match first
  if (MATERIAL_DEFAULTS[materialName]) {
    return MATERIAL_DEFAULTS[materialName];
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(MATERIAL_DEFAULTS)) {
    if (materialName.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(materialName.toLowerCase())) {
      return value;
    }
  }
  
  return null;
}

/**
 * Get sources for a material from the source library
 * 
 * Selection Algorithm:
 * 1. Extract search terms from material name (e.g., "Plastic (PET)" → ["plastic", "pet"])
 * 2. Score each source in library based on tag relevance
 * 3. Prioritize high-weight sources (peer-reviewed > government > industry)
 * 4. Return top 3-5 sources, mixing material-specific and general sources
 * 
 * Tag Matching Strategy:
 * - Exact match: "pet" material → "pet" tag (high score)
 * - Partial match: "cardboard" material → "paper" tag (medium score)
 * - Category match: any plastic → "plastic" tag (medium score)
 * - Fallback: general sources for LCA methodology (low score, but always included)
 */
function getSourcesForMaterial(materialName: string): Source[] {
  // Extract search terms from material name
  const searchTerms = materialName.toLowerCase()
    .split(/[\s(),-]+/)  // Split on space, parens, commas, hyphens
    .filter(term => term.length > 2);  // Ignore very short terms like "or", "of"
  
  // Score each source based on relevance
  interface ScoredSource {
    source: LibrarySource;
    score: number;
  }
  
  const scoredSources: ScoredSource[] = SOURCE_LIBRARY.map(source => {
    let score = 0;
    const sourceTags = source.tags || [];
    
    // Check each search term against source tags
    searchTerms.forEach(term => {
      sourceTags.forEach(tag => {
        // Exact match (e.g., "pet" === "pet")
        if (tag === term) {
          score += 10;
        }
        // Term contains tag or vice versa (e.g., "cardboard" contains "card")
        else if (tag.includes(term) || term.includes(tag)) {
          score += 5;
        }
      });
      
      // Also check title and abstract for mentions
      if (source.title.toLowerCase().includes(term)) {
        score += 3;
      }
      if (source.abstract?.toLowerCase().includes(term)) {
        score += 2;
      }
    });
    
    // Boost score based on source weight (prefer peer-reviewed)
    score += (source.weight || 1.0) * 2;
    
    // Boost general/methodology sources slightly (always want at least one)
    if (sourceTags.includes('general') || 
        sourceTags.includes('lca') || 
        sourceTags.includes('methodology')) {
      score += 1;
    }
    
    return { source, score };
  });
  
  // Sort by score descending
  scoredSources.sort((a, b) => b.score - a.score);
  
  // Strategy: Get top material-specific sources + ensure at least one general source
  const materialSpecific = scoredSources.filter(s => s.score > 5).slice(0, 4);
  const generalSource = scoredSources.find(s => 
    s.source.tags?.includes('general') || 
    s.source.tags?.includes('lca') ||
    s.source.tags?.includes('methodology')
  );
  
  // Combine: prefer 3-4 material-specific + 1 general
  const selectedSources: LibrarySource[] = [];
  
  // Add material-specific sources
  materialSpecific.forEach(s => {
    if (!selectedSources.includes(s.source)) {
      selectedSources.push(s.source);
    }
  });
  
  // Add general source if not already included
  if (generalSource && !selectedSources.includes(generalSource.source)) {
    selectedSources.push(generalSource.source);
  }
  
  // If we still don't have at least 3, add top-scored regardless
  if (selectedSources.length < 3) {
    for (const scored of scoredSources) {
      if (!selectedSources.includes(scored.source)) {
        selectedSources.push(scored.source);
        if (selectedSources.length >= 3) break;
      }
    }
  }
  
  // Convert to Material source format with parameter assignments (limit to 5 max)
  return selectedSources.slice(0, 5).map((s, index) => {
    // Assign parameters based on source tags and material context
    const parameters: string[] = [];
    const tags = s.tags || [];
    
    // Material-specific sources (high score) contribute to most parameters
    if (scoredSources.find(scored => scored.source === s)!.score > 8) {
      // High-relevance sources: contribute to Y, D, C
      if (tags.some(t => ['recycling', 'yield', 'recovery'].includes(t))) {
        parameters.push('Y_value', 'CR_practical_mean');
      }
      if (tags.some(t => ['degradation', 'quality', 'composting'].includes(t))) {
        parameters.push('D_value');
      }
      if (tags.some(t => ['contamination', 'quality', 'purity'].includes(t))) {
        parameters.push('C_value');
      }
      if (tags.some(t => ['infrastructure', 'maturity', 'facilities'].includes(t))) {
        parameters.push('M_value');
      }
      if (tags.some(t => ['energy', 'lca'].includes(t))) {
        parameters.push('E_value');
      }
      
      // If no specific matches, assign to general CR scores
      if (parameters.length === 0) {
        parameters.push('CR_practical_mean', 'CR_theoretical_mean');
      }
    }
    // General/methodology sources contribute to CR scores and methodology
    else if (tags.includes('general') || tags.includes('lca') || tags.includes('methodology')) {
      parameters.push('CR_practical_mean', 'CR_theoretical_mean');
    }
    // Medium-relevance sources: contribute to at least CR
    else {
      parameters.push('CR_practical_mean');
    }
    
    return {
      title: s.title,
      authors: s.authors,
      year: s.year,
      doi: s.doi,
      url: s.url,
      weight: s.weight,
      parameters: parameters.length > 0 ? parameters : undefined,
    };
  });
}

/**
 * Migrate a single material to include scientific data and sources
 * Now adds all three dimensions: CR (Recyclability), CC (Compostability), RU (Reusability)
 */
export function migrateMaterial(material: Material): Material {
  const migrated = { ...material };
  let hasChanges = false;
  
  // Get defaults for this material
  const defaults = getDefaultScientificData(material.name);
  
  // Add CR (Recyclability) data if missing
  if (migrated.Y_value === undefined && defaults) {
    // Add CR parameters
    if (defaults.Y_value !== undefined) {
      migrated.Y_value = defaults.Y_value;
      migrated.D_value = defaults.D_value;
      migrated.C_value = defaults.C_value;
      migrated.M_value = defaults.M_value;
      migrated.E_value = defaults.E_value;
      migrated.CR_practical_mean = defaults.CR_practical_mean;
      migrated.CR_theoretical_mean = defaults.CR_theoretical_mean;
      migrated.CR_practical_CI95 = defaults.CR_practical_CI95;
      migrated.CR_theoretical_CI95 = defaults.CR_theoretical_CI95;
      hasChanges = true;
    }
  }
  
  // Add CC (Compostability) data if missing
  if (migrated.B_value === undefined && defaults) {
    // Add CC parameters
    if (defaults.B_value !== undefined) {
      migrated.B_value = defaults.B_value;
      migrated.N_value = defaults.N_value;
      migrated.T_value = defaults.T_value;
      migrated.H_value = defaults.H_value;
      migrated.CC_practical_mean = defaults.CC_practical_mean;
      migrated.CC_theoretical_mean = defaults.CC_theoretical_mean;
      migrated.CC_practical_CI95 = defaults.CC_practical_CI95;
      migrated.CC_theoretical_CI95 = defaults.CC_theoretical_CI95;
      hasChanges = true;
    }
  }
  
  // Add RU (Reusability) data if missing
  if (migrated.L_value === undefined && defaults) {
    // Add RU parameters
    if (defaults.L_value !== undefined) {
      migrated.L_value = defaults.L_value;
      migrated.R_value = defaults.R_value;
      migrated.U_value = defaults.U_value;
      migrated.C_RU_value = defaults.C_RU_value;
      migrated.RU_practical_mean = defaults.RU_practical_mean;
      migrated.RU_theoretical_mean = defaults.RU_theoretical_mean;
      migrated.RU_practical_CI95 = defaults.RU_practical_CI95;
      migrated.RU_theoretical_CI95 = defaults.RU_theoretical_CI95;
      hasChanges = true;
    }
  }
  
  // Add sources if missing or insufficient
  if (!migrated.sources || migrated.sources.length < 3) {
    const sources = getSourcesForMaterial(material.name);
    migrated.sources = sources;
    hasChanges = true;
  }
  
  // Set confidence level based on sources
  if (!migrated.confidence_level && migrated.sources) {
    const totalWeight = migrated.sources.reduce((sum, s) => sum + (s.weight || 1.0), 0);
    const weightedScore = migrated.sources.length > 0 ? totalWeight / migrated.sources.length : 0;
    
    if (migrated.sources.length >= 3 && weightedScore >= 0.8) {
      migrated.confidence_level = 'High';
    } else if (migrated.sources.length >= 2 || weightedScore >= 0.6) {
      migrated.confidence_level = 'Medium';
    } else {
      migrated.confidence_level = 'Low';
    }
    hasChanges = true;
  }
  
  // Add metadata (update if any changes were made)
  if (hasChanges) {
    if (!migrated.whitepaper_version) {
      migrated.whitepaper_version = '2025.1';
    }
    if (!migrated.method_version) {
      migrated.method_version = 'CR-v1,CC-v1,RU-v1';  // Updated to reflect all three dimensions
    }
    migrated.calculation_timestamp = new Date().toISOString();  // Always update timestamp on migration
  }
  
  return migrated;
}

/**
 * Migrate all materials in a batch
 */
export function migrateAllMaterials(materials: Material[]): Material[] {
  return materials.map(migrateMaterial);
}

/**
 * Check if a material needs migration
 * Now checks for all three dimensions: CR, CC, and RU
 */
export function needsMigration(material: Material): boolean {
  // Check for sources (needed for all dimensions)
  const needsSources = !material.sources || material.sources.length < 3;
  
  // Check for CR (Recyclability) data
  const needsCR = material.Y_value === undefined;
  
  // Check for CC (Compostability) data
  const needsCC = material.B_value === undefined;
  
  // Check for RU (Reusability) data
  const needsRU = material.L_value === undefined;
  
  return needsSources || needsCR || needsCC || needsRU;
}

/**
 * Get detailed migration needs for a material
 */
export function getMaterialMigrationNeeds(material: Material): {
  needsCR: boolean;
  needsCC: boolean;
  needsRU: boolean;
  needsSources: boolean;
} {
  return {
    needsCR: material.Y_value === undefined,
    needsCC: material.B_value === undefined,
    needsRU: material.L_value === undefined,
    needsSources: !material.sources || material.sources.length < 3,
  };
}

/**
 * Get migration statistics
 * Now includes separate counts for each dimension (CR, CC, RU)
 */
export function getMigrationStats(materials: Material[]): {
  total: number;
  needsMigration: number;
  hasCR: number;
  hasCC: number;
  hasRU: number;
  hasSources: number;
  highConfidence: number;
  needsCR: number;
  needsCC: number;
  needsRU: number;
} {
  return {
    total: materials.length,
    needsMigration: materials.filter(needsMigration).length,
    hasCR: materials.filter(m => m.Y_value !== undefined).length,
    hasCC: materials.filter(m => m.B_value !== undefined).length,
    hasRU: materials.filter(m => m.L_value !== undefined).length,
    hasSources: materials.filter(m => m.sources && m.sources.length > 0).length,
    highConfidence: materials.filter(m => m.confidence_level === 'High').length,
    needsCR: materials.filter(m => m.Y_value === undefined).length,
    needsCC: materials.filter(m => m.B_value === undefined).length,
    needsRU: materials.filter(m => m.L_value === undefined).length,
  };
}

/**
 * Preview what sources will be added to a material
 * (exported for UI preview purposes)
 */
export function previewSourcesForMaterial(materialName: string): Source[] {
  return getSourcesForMaterial(materialName);
}
