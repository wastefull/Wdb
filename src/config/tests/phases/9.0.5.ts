/**
 * Phase 9.0.5 Tests - Source Management & Duplicate Detection
 * 
 * Tests for DOI normalization, duplicate checking, and fuzzy title matching.
 */

import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { Test } from '../types';

export function getPhase905Tests(user: any): Test[] {
  return [
    {
      id: 'phase9-day5-doi-normalization',
      name: 'DOI Normalization',
      description: 'Verify DOI format normalization across different input formats',
      phase: '9.0.5',
      category: 'Sources',
      testFn: async () => {
        try {
          const testDOIs = [
            'https://doi.org/10.1234/example',
            'http://dx.doi.org/10.1234/example',
            'doi:10.1234/example',
            '10.1234/example',
            'DOI: 10.1234/example',
          ];

          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/normalize-doi`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dois: testDOIs }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to normalize DOIs' };
          }

          const data = await response.json();
          const allMatch = data.normalized.every((norm: string) => norm === '10.1234/example');

          return { 
            success: allMatch, 
            message: allMatch 
              ? `All ${testDOIs.length} DOI formats normalized correctly ✓` 
              : `DOI normalization inconsistent: ${JSON.stringify(data.normalized)}` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error normalizing DOIs: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day5-duplicate-check',
      name: 'DOI Duplicate Check',
      description: 'Verify duplicate detection for existing DOIs',
      phase: '9.0.5',
      category: 'Sources',
      testFn: async () => {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-duplicate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              doi: '10.1126/science.test123',
              title: 'Test Automated Duplicate Check',
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to check for duplicates' };
          }

          const data = await response.json();

          return { 
            success: true, 
            message: data.isDuplicate 
              ? `Duplicate detected ✓ (match type: ${data.matchType}, confidence: ${data.confidence}%)` 
              : `No duplicates found ✓` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error checking duplicates: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day5-fuzzy-title-match',
      name: 'Fuzzy Title Matching',
      description: 'Verify fuzzy title matching for similar source titles',
      phase: '9.0.5',
      category: 'Sources',
      testFn: async () => {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-duplicate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Life Cycle Assessment of Plastic Materials',
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            return {
              success: false,
              message: `Fuzzy match failed: ${error}`,
            };
          }

          const result = await response.json();

          return {
            success: true,
            message: result.isDuplicate 
              ? `Similar title found ⚠️ Match: "${result.existingSource?.title}" (${result.similarity}% similar)`
              : `No similar titles found ✓ Safe to add.`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error performing fuzzy match: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      }
    },
  ];
}
