/**
 * Unified Test Definitions
 *
 * Centralized test registry that imports and aggregates all phase tests.
 * Provides functions to retrieve all tests or filter by phase.
 */

import { getPhase901Tests } from "./phases/9.0.1";
import { getPhase9010Tests } from "./phases/9.0.10";
import { getPhase9011Tests } from "./phases/9.0.11";
import { getPhase902Tests } from "./phases/9.0.2";
import { getPhase903Tests } from "./phases/9.0.3";
import { getPhase904Tests } from "./phases/9.0.4";
import { getPhase905Tests } from "./phases/9.0.5";
import { getPhase906Tests } from "./phases/9.0.6";
import { getPhase907Tests } from "./phases/9.0.7";
import { getPhase908Tests } from "./phases/9.0.8";
import { getPhase909Tests } from "./phases/9.0.9";
import { getPhase91Tests } from "./phases/9.1";
import { getPhase92Tests } from "./phases/9.2";
import { Test } from "./types";

/**
 * Build all test definitions
 * @param user - Current authenticated user (or null)
 * @returns Array of all test definitions from all phases
 */
export function buildAllTests(user: any): Test[] {
  return [
    ...getPhase901Tests(user),
    ...getPhase902Tests(user),
    ...getPhase903Tests(user),
    ...getPhase904Tests(user),
    ...getPhase905Tests(),
    ...getPhase906Tests(user),
    ...getPhase907Tests(user),
    ...getPhase908Tests(user),
    ...getPhase909Tests(),
    ...getPhase9010Tests(),
    ...getPhase9011Tests(user),
    ...getPhase91Tests(user),
    ...getPhase92Tests(user),
    // Future phases will be added here:
    // etc.
  ];
}

/**
 * Get tests filtered by phase
 * @param phase - Phase identifier (e.g., '9.0.1', '9.1', '9.2')
 * @param user - Current authenticated user (or null)
 * @returns Array of tests matching the specified phase
 */
export function getTestsByPhase(
  phase: string,
  user: any,
): Test[] {
  const allTests = buildAllTests(user);
  return allTests.filter((test) => test.phase === phase);
}

/**
 * Get all unique phases that have tests defined
 * @param user - Current authenticated user (or null)
 * @returns Array of unique phase identifiers
 */
export function getAllPhases(user: any): string[] {
  const allTests = buildAllTests(user);
  const phases = new Set(allTests.map((test) => test.phase));
  return Array.from(phases).sort();
}

export type { Test };