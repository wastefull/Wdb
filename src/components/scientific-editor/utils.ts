/**
 * Shared utilities for Scientific Data Editor
 */

import type { Source } from './types';

/**
 * Calculate suggested confidence level based on source count and weights
 */
export function getSuggestedConfidenceLevel(
  sourceCount: number, 
  totalWeight: number
): 'High' | 'Medium' | 'Low' {
  const weightedScore = sourceCount > 0 ? totalWeight / sourceCount : 0;
  
  if (sourceCount === 0) {
    return 'Low';
  } else if (sourceCount >= 3 && weightedScore >= 0.8) {
    return 'High';
  } else if (sourceCount >= 2 || weightedScore >= 0.6) {
    return 'Medium';
  } else {
    return 'Low';
  }
}

/**
 * Parameter display names for source assignments
 */
export const PARAMETER_NAMES: Record<string, string> = {
  // CR
  'Y_value': 'Yield',
  'D_value': 'Degradability',
  'C_value': 'Contamination',
  'M_value': 'Maturity',
  'E_value': 'Energy',
  'CR_practical_mean': 'CR Practical',
  'CR_theoretical_mean': 'CR Theoretical',
  // CC
  'B_value': 'Biodegradation',
  'N_value': 'Nutrient Balance',
  'T_value': 'Toxicity',
  'H_value': 'Habitat Adaptability',
  'CC_practical_mean': 'CC Practical',
  'CC_theoretical_mean': 'CC Theoretical',
  // RU
  'L_value': 'Lifetime',
  'R_value': 'Repairability',
  'U_value': 'Upgradability',
  'C_RU_value': 'Contamination (RU)',
  'RU_practical_mean': 'RU Practical',
  'RU_theoretical_mean': 'RU Theoretical',
};

/**
 * Auto-assign parameters based on source tags
 */
export function autoAssignParameters(tags: string[]): string[] {
  const parameters: string[] = [];
  
  // CR parameters
  if (tags.some(t => ['recycling', 'yield', 'recovery'].includes(t))) {
    parameters.push('Y_value', 'CR_practical_mean');
  }
  if (tags.some(t => ['degradation', 'quality'].includes(t))) {
    parameters.push('D_value');
  }
  if (tags.some(t => ['contamination', 'purity'].includes(t))) {
    parameters.push('C_value');
  }
  if (tags.some(t => ['infrastructure', 'maturity', 'facilities'].includes(t))) {
    parameters.push('M_value');
  }
  if (tags.some(t => ['energy', 'lca'].includes(t))) {
    parameters.push('E_value');
  }
  
  // CC parameters
  if (tags.some(t => ['biodegradation', 'composting'].includes(t))) {
    parameters.push('B_value', 'CC_practical_mean');
  }
  if (tags.some(t => ['nutrient-balance', 'nutrient'].includes(t))) {
    parameters.push('N_value');
  }
  if (tags.some(t => ['toxicity', 'phytotoxicity'].includes(t))) {
    parameters.push('T_value');
  }
  if (tags.some(t => ['habitat', 'adaptability'].includes(t))) {
    parameters.push('H_value');
  }
  
  // RU parameters
  if (tags.some(t => ['lifetime', 'durability', 'longevity'].includes(t))) {
    parameters.push('L_value', 'RU_practical_mean');
  }
  if (tags.some(t => ['repair', 'repairability'].includes(t))) {
    parameters.push('R_value');
  }
  if (tags.some(t => ['upgrade', 'upgradability', 'modularity'].includes(t))) {
    parameters.push('U_value');
  }
  
  if (tags.includes('general') || tags.includes('methodology')) {
    parameters.push(
      'CR_practical_mean', 'CR_theoretical_mean',
      'CC_practical_mean', 'CC_theoretical_mean',
      'RU_practical_mean', 'RU_theoretical_mean'
    );
  }
  
  // If no specific parameters assigned, default to all scores
  return parameters.length > 0 ? parameters : ['CR_practical_mean', 'CR_theoretical_mean'];
}
