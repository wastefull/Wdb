/**
 * Test Definitions - Central Test Export
 * 
 * This module serves as the centralized source of truth for all test definitions.
 * It exports all tests and provides filtering functions used by:
 * - TestSuite.tsx (for unified test view)
 * - PhaseFilteredTests.tsx (for phase-specific test tabs)
 */

import { Test } from './types';
import { buildAllTests, getTestsByPhase } from './all';

/**
 * Get all test definitions
 * This function should be called by TestSuite.tsx to get the complete test array
 * @param user - Current authenticated user (or null)
 * @returns Complete array of all test definitions
 */
export function getAllTestDefinitions(user: any): Test[] {
  return buildAllTests(user);
}

/**
 * Get test definitions filtered by phase
 * This function should be called by PhaseFilteredTests.tsx to get tests for a specific phase
 * @param phase - Phase identifier (e.g., '9.0.1', '9.1', '9.2')
 * @param user - Current authenticated user (or null)
 * @returns Array of tests for the specified phase
 */
export function getTestDefinitionsByPhase(phase: string, user: any): Test[] {
  return getTestsByPhase(phase, user);
}

/**
 * Export the Test type for use in components
 */
export type { Test };
