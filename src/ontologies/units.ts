/**
 * WasteDB Units Ontology
 * 
 * Canonical units and conversion rules for all WasteDB parameters
 */

export interface UnitConversion {
  to_canonical: string;
  description: string;
}

export interface ParameterValidation {
  min?: number;
  max?: number;
  description: string;
}

export interface ParameterUnit {
  name: string;
  canonical_unit: string;
  allowed_units: string[];
  conversions: Record<string, UnitConversion>;
  validation: ParameterValidation;
}

export interface UnitsOntology {
  version: string;
  effective_date: string;
  description: string;
  parameters: Record<string, ParameterUnit>;
}

export const unitsOntology: UnitsOntology = {
  version: "1.0",
  effective_date: "2025-11-17",
  description: "Canonical units and conversion rules for all WasteDB parameters",
  parameters: {
    Y: {
      name: "Yield",
      canonical_unit: "ratio",
      allowed_units: ["%", "ratio", "kg/kg"],
      conversions: {
        "%": {
          to_canonical: "value / 100",
          description: "Convert percentage to ratio"
        },
        ratio: {
          to_canonical: "value",
          description: "Identity conversion (already canonical)"
        },
        "kg/kg": {
          to_canonical: "value",
          description: "Mass ratio is equivalent to dimensionless ratio"
        }
      },
      validation: {
        min: 0,
        max: 1,
        description: "Yield must be between 0 and 1 (0-100%)"
      }
    },
    D: {
      name: "Degradation Rate",
      canonical_unit: "ratio",
      allowed_units: ["%", "ratio", "fraction"],
      conversions: {
        "%": {
          to_canonical: "value / 100",
          description: "Convert percentage to ratio"
        },
        ratio: {
          to_canonical: "value",
          description: "Identity conversion"
        },
        fraction: {
          to_canonical: "value",
          description: "Fraction is equivalent to ratio"
        }
      },
      validation: {
        min: 0,
        max: 1,
        description: "Degradation rate must be between 0 and 1"
      }
    },
    C: {
      name: "Contamination Level",
      canonical_unit: "ppm",
      allowed_units: ["ppm", "mg/kg", "%", "ppb"],
      conversions: {
        ppm: {
          to_canonical: "value",
          description: "Identity conversion"
        },
        "mg/kg": {
          to_canonical: "value",
          description: "mg/kg is equivalent to ppm"
        },
        "%": {
          to_canonical: "value * 10000",
          description: "Convert percentage to ppm (1% = 10,000 ppm)"
        },
        ppb: {
          to_canonical: "value / 1000",
          description: "Convert parts per billion to ppm"
        }
      },
      validation: {
        min: 0,
        description: "Contamination level must be non-negative"
      }
    },
    M: {
      name: "Market Demand Index",
      canonical_unit: "index",
      allowed_units: ["index", "score", "unitless"],
      conversions: {
        index: {
          to_canonical: "value",
          description: "Identity conversion"
        },
        score: {
          to_canonical: "value",
          description: "Score is equivalent to index"
        },
        unitless: {
          to_canonical: "value",
          description: "Dimensionless value"
        }
      },
      validation: {
        min: 0,
        max: 100,
        description: "Market demand index typically 0-100"
      }
    },
    E: {
      name: "Energy Intensity",
      canonical_unit: "MJ/kg",
      allowed_units: ["MJ/kg", "kWh/kg", "GJ/ton", "BTU/lb"],
      conversions: {
        "MJ/kg": {
          to_canonical: "value",
          description: "Identity conversion"
        },
        "kWh/kg": {
          to_canonical: "value * 3.6",
          description: "Convert kWh to MJ (1 kWh = 3.6 MJ)"
        },
        "GJ/ton": {
          to_canonical: "value",
          description: "GJ/ton is equivalent to MJ/kg"
        },
        "BTU/lb": {
          to_canonical: "value * 0.002326",
          description: "Convert BTU/lb to MJ/kg"
        }
      },
      validation: {
        min: 0,
        description: "Energy intensity must be non-negative"
      }
    },
    B: {
      name: "Biodegradability",
      canonical_unit: "ratio",
      allowed_units: ["%", "ratio", "fraction"],
      conversions: {
        "%": {
          to_canonical: "value / 100",
          description: "Convert percentage to ratio"
        },
        ratio: {
          to_canonical: "value",
          description: "Identity conversion"
        },
        fraction: {
          to_canonical: "value",
          description: "Fraction is equivalent to ratio"
        }
      },
      validation: {
        min: 0,
        max: 1,
        description: "Biodegradability must be between 0 and 1"
      }
    },
    N: {
      name: "Nutrient Value",
      canonical_unit: "kg/kg",
      allowed_units: ["kg/kg", "%", "g/kg", "ratio"],
      conversions: {
        "kg/kg": {
          to_canonical: "value",
          description: "Identity conversion"
        },
        "%": {
          to_canonical: "value / 100",
          description: "Convert percentage to mass ratio"
        },
        "g/kg": {
          to_canonical: "value / 1000",
          description: "Convert g/kg to kg/kg"
        },
        ratio: {
          to_canonical: "value",
          description: "Mass ratio"
        }
      },
      validation: {
        min: 0,
        max: 1,
        description: "Nutrient value must be between 0 and 1"
      }
    },
    T: {
      name: "Toxicity Level",
      canonical_unit: "LD50_mg/kg",
      allowed_units: ["LD50_mg/kg", "mg/kg", "g/kg"],
      conversions: {
        LD50_mg_kg: {
          to_canonical: "value",
          description: "Identity conversion (LD50 in mg/kg)"
        },
        "mg/kg": {
          to_canonical: "value",
          description: "Concentration in mg/kg"
        },
        "g/kg": {
          to_canonical: "value * 1000",
          description: "Convert g/kg to mg/kg"
        }
      },
      validation: {
        min: 0,
        description: "Toxicity must be non-negative (lower LD50 = more toxic)"
      }
    },
    H: {
      name: "Health Impact Score",
      canonical_unit: "DALY",
      allowed_units: ["DALY", "QALY", "score"],
      conversions: {
        DALY: {
          to_canonical: "value",
          description: "Disability-Adjusted Life Years"
        },
        QALY: {
          to_canonical: "value * -1",
          description: "Quality-Adjusted Life Years (inverted scale)"
        },
        score: {
          to_canonical: "value",
          description: "Generic health impact score"
        }
      },
      validation: {
        min: 0,
        description: "Health impact must be non-negative"
      }
    },
    L: {
      name: "Labor Intensity",
      canonical_unit: "hours/kg",
      allowed_units: ["hours/kg", "hours/ton", "FTE/year", "person-hours/kg"],
      conversions: {
        "hours/kg": {
          to_canonical: "value",
          description: "Identity conversion"
        },
        "hours/ton": {
          to_canonical: "value / 1000",
          description: "Convert hours/ton to hours/kg"
        },
        "FTE/year": {
          to_canonical: "value",
          description: "Full-time equivalent per year"
        },
        "person-hours/kg": {
          to_canonical: "value",
          description: "Equivalent to hours/kg"
        }
      },
      validation: {
        min: 0,
        description: "Labor intensity must be non-negative"
      }
    },
    R: {
      name: "Resource Recovery Rate",
      canonical_unit: "ratio",
      allowed_units: ["%", "ratio", "kg/kg"],
      conversions: {
        "%": {
          to_canonical: "value / 100",
          description: "Convert percentage to ratio"
        },
        ratio: {
          to_canonical: "value",
          description: "Identity conversion"
        },
        "kg/kg": {
          to_canonical: "value",
          description: "Mass ratio"
        }
      },
      validation: {
        min: 0,
        max: 1,
        description: "Resource recovery rate must be between 0 and 1"
      }
    },
    U: {
      name: "Utility Retention",
      canonical_unit: "ratio",
      allowed_units: ["%", "ratio", "score"],
      conversions: {
        "%": {
          to_canonical: "value / 100",
          description: "Convert percentage to ratio"
        },
        ratio: {
          to_canonical: "value",
          description: "Identity conversion"
        },
        score: {
          to_canonical: "value / 100",
          description: "Convert 0-100 score to 0-1 ratio"
        }
      },
      validation: {
        min: 0,
        max: 1,
        description: "Utility retention must be between 0 and 1"
      }
    },
    C_RU: {
      name: "Reusability Contamination",
      canonical_unit: "ppm",
      allowed_units: ["ppm", "mg/kg", "%", "ppb"],
      conversions: {
        ppm: {
          to_canonical: "value",
          description: "Identity conversion"
        },
        "mg/kg": {
          to_canonical: "value",
          description: "mg/kg is equivalent to ppm"
        },
        "%": {
          to_canonical: "value * 10000",
          description: "Convert percentage to ppm (1% = 10,000 ppm)"
        },
        ppb: {
          to_canonical: "value / 1000",
          description: "Convert parts per billion to ppm"
        }
      },
      validation: {
        min: 0,
        description: "Contamination must be non-negative"
      }
    }
  }
};

export default unitsOntology;
