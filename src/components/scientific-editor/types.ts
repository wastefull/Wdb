/**
 * Shared types for Scientific Data Editor components
 */

export interface Source {
  title: string;
  authors?: string;
  year?: number;
  doi?: string;
  url?: string;
  weight?: number;
  parameters?: string[];
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  compostability: number;
  recyclability: number;
  reusability: number;
  description?: string;
  
  // Recyclability (CR) parameters
  Y_value?: number;
  D_value?: number;
  C_value?: number;
  M_value?: number;
  E_value?: number;
  CR_practical_mean?: number;
  CR_theoretical_mean?: number;
  CR_practical_CI95?: ConfidenceInterval;
  CR_theoretical_CI95?: ConfidenceInterval;
  
  // Compostability (CC) parameters
  B_value?: number;
  N_value?: number;
  T_value?: number;
  H_value?: number;
  CC_practical_mean?: number;
  CC_theoretical_mean?: number;
  CC_practical_CI95?: ConfidenceInterval;
  CC_theoretical_CI95?: ConfidenceInterval;
  
  // Reusability (RU) parameters
  L_value?: number;
  R_value?: number;
  U_value?: number;
  C_RU_value?: number;
  RU_practical_mean?: number;
  RU_theoretical_mean?: number;
  RU_practical_CI95?: ConfidenceInterval;
  RU_theoretical_CI95?: ConfidenceInterval;
  
  // Metadata
  confidence_level?: 'High' | 'Medium' | 'Low';
  sources?: Source[];
  whitepaper_version?: string;
  calculation_timestamp?: string;
  method_version?: string;
}

export interface DimensionTabProps {
  formData: Material;
  onParameterChange: (key: keyof Material, value: any) => void;
}
