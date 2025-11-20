/**
 * Phase Configuration for WasteDB Development
 * 
 * This file configures which phase is currently active for development.
 * The active phase determines:
 * - Which tab is shown by default in the Roadmap
 * - Where the generic testing panel appears
 * - Where the Admin Dashboard testing link points
 */

export interface PhaseConfig {
  /** The active development phase (e.g., '9.0', '9.1', '9.2') */
  activePhase: string;
  
  /** Display name for the active phase */
  displayName: string;
  
  /** Description of the active phase */
  description: string;
  
  /** Tab ID for the Roadmap tabs (e.g., '9.1', '9.2') */
  tabId: string;
  
  /** Menu label for Admin Dashboard links */
  menuLabel: string;
}

/**
 * ACTIVE PHASE CONFIGURATION
 * 
 * Change this to set which phase is currently in development.
 * This will automatically update the Roadmap UI and Admin Dashboard links.
 */
export const PHASE_CONFIG: PhaseConfig = {
  activePhase: '9.1',
  displayName: 'Phase 9.1: Evidence Points & Aggregations',
  description: 'Database infrastructure for evidence-based material parameters using Minimally Interpretive Units (MIUs)',
  tabId: '9.1',
  menuLabel: 'Phase 9.1',
};

/**
 * Helper function to get the active phase
 */
export function getActivePhase(): string {
  return PHASE_CONFIG.activePhase;
}

/**
 * Helper function to get the display name
 */
export function getActivePhaseDisplayName(): string {
  return PHASE_CONFIG.displayName;
}

/**
 * Helper function to get the description
 */
export function getActivePhaseDescription(): string {
  return PHASE_CONFIG.description;
}

/**
 * Helper function to get the tab ID
 */
export function getActivePhaseTabId(): string {
  return PHASE_CONFIG.tabId;
}

/**
 * Helper function to get the menu label
 */
export function getActivePhaseMenuLabel(): string {
  return PHASE_CONFIG.menuLabel;
}