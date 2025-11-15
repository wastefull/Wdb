/**
 * Transform Definitions v1.0
 * Last Updated: 2025-11-15
 * 
 * Defines all 13 parameter transforms for converting raw evidence data
 * into normalized sustainability scores (0-100).
 */

export interface Transform {
  parameter: string;
  name: string;
  formula: string;
  description: string;
  input_unit: string;
  output_unit: string;
  input_range: {
    min: number;
    max: number;
  };
  output_range: {
    min: number;
    max: number;
  };
  notes: string;
}

export interface TransformsData {
  version: string;
  last_updated: string;
  transforms: Transform[];
}

export const transformsData: TransformsData = {
  version: "1.0",
  last_updated: "2025-11-15",
  transforms: [
    {
      parameter: "Y",
      name: "Years to Degrade",
      formula: "100 - (10 * log10(x + 1))",
      description: "Logarithmic transform converting degradation time to score",
      input_unit: "years",
      output_unit: "score (0-100)",
      input_range: {
        min: 0,
        max: 1000
      },
      output_range: {
        min: 0,
        max: 100
      },
      notes: "Longer degradation time results in lower score"
    },
    {
      parameter: "D",
      name: "Degradability",
      formula: "x",
      description: "Direct mapping of degradability percentage",
      input_unit: "percentage",
      output_unit: "score (0-100)",
      input_range: {
        min: 0,
        max: 100
      },
      output_range: {
        min: 0,
        max: 100
      },
      notes: "Higher degradability yields higher score"
    },
    {
      parameter: "C",
      name: "Compostability",
      formula: "x",
      description: "Direct mapping of compostability percentage",
      input_unit: "percentage",
      output_unit: "score (0-100)",
      input_range: {
        min: 0,
        max: 100
      },
      output_range: {
        min: 0,
        max: 100
      },
      notes: "Higher compostability yields higher score"
    },
    {
      parameter: "M",
      name: "Methane Production",
      formula: "100 - x",
      description: "Inverse mapping where higher methane production lowers score",
      input_unit: "percentage",
      output_unit: "score (0-100)",
      input_range: {
        min: 0,
        max: 100
      },
      output_range: {
        min: 0,
        max: 100
      },
      notes: "Lower methane production is better for sustainability"
    },
    {
      parameter: "E",
      name: "Ecotoxicity",
      formula: "100 - x",
      description: "Inverse mapping where higher ecotoxicity lowers score",
      input_unit: "percentage",
      output_unit: "score (0-100)",
      input_range: {
        min: 0,
        max: 100
      },
      output_range: {
        min: 0,
        max: 100
      },
      notes: "Lower ecotoxicity is better for environmental health"
    },
    {
      parameter: "B",
      name: "Biodegradability",
      formula: "x",
      description: "Direct mapping of biodegradability percentage",
      input_unit: "percentage",
      output_unit: "score (0-100)",
      input_range: {
        min: 0,
        max: 100
      },
      output_range: {
        min: 0,
        max: 100
      },
      notes: "Higher biodegradability yields higher score"
    },
    {
      parameter: "N",
      name: "Novelty",
      formula: "x",
      description: "Direct mapping of material novelty/innovation",
      input_unit: "percentage",
      output_unit: "score (0-100)",
      input_range: {
        min: 0,
        max: 100
      },
      output_range: {
        min: 0,
        max: 100
      },
      notes: "Measures how innovative the material is"
    },
    {
      parameter: "T",
      name: "Toxicity",
      formula: "100 - x",
      description: "Inverse mapping where higher toxicity lowers score",
      input_unit: "percentage",
      output_unit: "score (0-100)",
      input_range: {
        min: 0,
        max: 100
      },
      output_range: {
        min: 0,
        max: 100
      },
      notes: "Lower toxicity is better for human and environmental health"
    },
    {
      parameter: "H",
      name: "Human Health Impact",
      formula: "100 - x",
      description: "Inverse mapping where higher health impact lowers score",
      input_unit: "percentage",
      output_unit: "score (0-100)",
      input_range: {
        min: 0,
        max: 100
      },
      output_range: {
        min: 0,
        max: 100
      },
      notes: "Lower health impact is better"
    },
    {
      parameter: "L",
      name: "Leachate Potential",
      formula: "100 - x",
      description: "Inverse mapping where higher leachate potential lowers score",
      input_unit: "percentage",
      output_unit: "score (0-100)",
      input_range: {
        min: 0,
        max: 100
      },
      output_range: {
        min: 0,
        max: 100
      },
      notes: "Lower leachate potential is better for soil and water quality"
    },
    {
      parameter: "R",
      name: "Recyclability",
      formula: "x",
      description: "Direct mapping of recyclability percentage",
      input_unit: "percentage",
      output_unit: "score (0-100)",
      input_range: {
        min: 0,
        max: 100
      },
      output_range: {
        min: 0,
        max: 100
      },
      notes: "Higher recyclability yields higher score"
    },
    {
      parameter: "U",
      name: "Reusability",
      formula: "x",
      description: "Direct mapping of reusability percentage",
      input_unit: "percentage",
      output_unit: "score (0-100)",
      input_range: {
        min: 0,
        max: 100
      },
      output_range: {
        min: 0,
        max: 100
      },
      notes: "Higher reusability yields higher score"
    },
    {
      parameter: "C_RU",
      name: "Combined Recyclability + Reusability",
      formula: "(R + U) / 2",
      description: "Average of recyclability and reusability scores",
      input_unit: "percentage",
      output_unit: "score (0-100)",
      input_range: {
        min: 0,
        max: 100
      },
      output_range: {
        min: 0,
        max: 100
      },
      notes: "Combined metric for circular economy potential"
    }
  ]
};
