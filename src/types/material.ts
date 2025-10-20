/**
 * WasteDB Material Type Definition
 * 
 * Includes both public-facing sustainability scores and scientific metadata
 * as specified in DATA_PIPELINE.md and ROADMAP.md
 */

export interface Source {
  title: string;
  authors?: string;
  year?: number;
  doi?: string;
  url?: string;
  weight?: number;  // Source weight in aggregation (0-1)
}

export interface ConfidenceInterval {
  lower: number;  // Lower bound (0-1)
  upper: number;  // Upper bound (0-1)
}

export interface Article {
  id: string;
  title: string;
  category: 'DIY' | 'Industrial' | 'Experimental';
  overview: {
    image?: string;
  };
  introduction: {
    image?: string;
    content: string;
  };
  supplies: {
    image?: string;
    content: string;
  };
  step1: {
    image?: string;
    content: string;
  };
  dateAdded: string;
}

export interface Material {
  // Core identification
  id: string;
  name: string;
  category: 'Plastics' | 'Metals' | 'Glass' | 'Paper & Cardboard' | 'Fabrics & Textiles' | 'Electronics & Batteries' | 'Building Materials' | 'Organic/Natural Waste';
  description?: string;
  
  // Public-facing sustainability scores (0-100 scale)
  compostability: number;   // Biological decomposition potential
  recyclability: number;    // Mechanical/chemical recycling potential (derived from CR_practical_mean)
  reusability: number;      // Direct reuse potential
  
  // Articles for each sustainability category
  articles: {
    compostability: Article[];
    recyclability: Article[];
    reusability: Article[];
  };
  
  // ========== SCIENTIFIC DATA LAYER ==========
  
  // Raw normalized parameters (0-1 scale)
  Y_value?: number;  // Yield - material recovery rate
  D_value?: number;  // Degradability - quality loss (higher = better quality retention)
  C_value?: number;  // Contamination tolerance - process sensitivity
  M_value?: number;  // Maturity - infrastructure availability and readiness
  E_value?: number;  // Energy demand - normalized energy cost
  
  // Composite Recyclability Index scores (0-1 scale)
  CR_practical_mean?: number;      // Practical recyclability (realistic conditions)
  CR_theoretical_mean?: number;    // Theoretical recyclability (ideal conditions)
  
  // 95% Confidence Intervals
  CR_practical_CI95?: ConfidenceInterval;
  CR_theoretical_CI95?: ConfidenceInterval;
  
  // Data quality and provenance
  confidence_level?: 'High' | 'Medium' | 'Low';  // Overall data confidence
  sources?: Source[];                             // Citation metadata
  
  // Versioning and audit trail
  whitepaper_version?: string;      // Methodology version (e.g., "2025.1")
  calculation_timestamp?: string;   // ISO 8601 timestamp of last calculation
  method_version?: string;           // Calculation method version (e.g., "CR-v1")
}

export type CategoryType = 'compostability' | 'recyclability' | 'reusability';
