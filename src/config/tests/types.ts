/**
 * Test Type Definitions
 * 
 * Shared type definitions for the test suite.
 */

export interface Test {
  id: string;
  name: string;
  description: string;
  phase: string;
  category: string;
  testFn: () => Promise<{ success: boolean; message: string }>;
}
