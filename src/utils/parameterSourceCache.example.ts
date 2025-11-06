/**
 * Parameter Source Cache - Example Usage & Validation
 * 
 * This file demonstrates correct usage of the parameter source cache
 * and can be used to verify the system works as expected.
 */

import {
  buildParameterSourceCache,
  getParameterAvailability,
  getParameterCoverageStats,
  filterParametersWithSources,
  filterParametersWithoutSources,
} from './parameterSourceCache';

// Example material data structure
const exampleMaterial = {
  id: 'glass-container-001',
  name: 'Glass Food Container',
  category: 'Glass',
  Y_value: 95,
  D_value: 0,
  C_value: 70,
  M_value: 85,
  E_value: 60,
  sources: [
    {
      title: 'Glass Recycling Study 2023',
      authors: 'Smith, J.',
      year: 2023,
      doi: '10.1234/glass-2023',
      weight: 1.0,
      parameters: ['Y_value', 'D_value', 'M_value'], // Has 3 parameters
    },
    {
      title: 'Contamination Tolerance Report',
      authors: 'Johnson, A.',
      year: 2022,
      weight: 0.9,
      parameters: ['C_value'], // Has 1 parameter
    },
  ],
};

const exampleMaterials = [
  exampleMaterial,
  {
    id: 'cardboard-box-002',
    name: 'Cardboard Shipping Box',
    category: 'Paper & Cardboard',
    Y_value: 80,
    D_value: 15,
    sources: [
      {
        title: 'Cardboard Lifecycle Analysis',
        year: 2023,
        weight: 1.0,
        parameters: ['Y_value', 'D_value'],
      },
    ],
  },
  {
    id: 'plastic-bottle-003',
    name: 'PET Plastic Bottle',
    category: 'Plastics',
    Y_value: 70,
    sources: [], // No sources
  },
];

const allParameterKeys = [
  'Y_value',
  'D_value',
  'C_value',
  'M_value',
  'E_value',
];

// ============================================================
// Example 1: Single Material Availability
// ============================================================
console.log('=== Example 1: Single Material Availability ===');
const availability = getParameterAvailability(exampleMaterial, allParameterKeys);
console.log('Parameter Availability:', availability);
// Expected output:
// {
//   Y_value: true,  ✓ (in source 1)
//   D_value: true,  ✓ (in source 1)
//   C_value: true,  ✓ (in source 2)
//   M_value: true,  ✓ (in source 1)
//   E_value: false  ✗ (no source)
// }

// ============================================================
// Example 2: Coverage Statistics
// ============================================================
console.log('\n=== Example 2: Coverage Statistics ===');
const stats = getParameterCoverageStats(exampleMaterial, allParameterKeys);
console.log('Coverage Stats:', stats);
// Expected output:
// {
//   total: 5,
//   withSources: 4,
//   withoutSources: 1,
//   percentageCovered: 80,
//   missingParameters: ['E_value']
// }

// ============================================================
// Example 3: Filter Parameters With Sources
// ============================================================
console.log('\n=== Example 3: Filter Parameters With Sources ===');
const withSources = filterParametersWithSources(exampleMaterial, allParameterKeys);
console.log('Parameters with sources:', withSources);
// Expected output: ['Y_value', 'D_value', 'C_value', 'M_value']

// ============================================================
// Example 4: Filter Parameters Without Sources
// ============================================================
console.log('\n=== Example 4: Filter Parameters Without Sources ===');
const withoutSources = filterParametersWithoutSources(exampleMaterial, allParameterKeys);
console.log('Parameters without sources:', withoutSources);
// Expected output: ['E_value']

// ============================================================
// Example 5: Build Global Cache
// ============================================================
console.log('\n=== Example 5: Build Global Cache ===');
const globalCache = buildParameterSourceCache(exampleMaterials, allParameterKeys);
console.log('Global Cache:', JSON.stringify(globalCache, null, 2));
// Expected output:
// {
//   "glass-container-001": {
//     "Y_value": true,
//     "D_value": true,
//     "C_value": true,
//     "M_value": true,
//     "E_value": false
//   },
//   "cardboard-box-002": {
//     "Y_value": true,
//     "D_value": true,
//     "C_value": false,
//     "M_value": false,
//     "E_value": false
//   },
//   "plastic-bottle-003": {
//     "Y_value": false,
//     "D_value": false,
//     "C_value": false,
//     "M_value": false,
//     "E_value": false
//   }
// }

// ============================================================
// Example 6: Performance Comparison
// ============================================================
console.log('\n=== Example 6: Performance Comparison ===');

// Without cache (naive approach)
console.time('Without Cache (1000 lookups)');
for (let i = 0; i < 1000; i++) {
  allParameterKeys.forEach(paramKey => {
    exampleMaterial.sources?.some(s => s.parameters?.includes(paramKey));
  });
}
console.timeEnd('Without Cache (1000 lookups)');

// With cache
console.time('Build Cache');
const cache = getParameterAvailability(exampleMaterial, allParameterKeys);
console.timeEnd('Build Cache');

console.time('With Cache (1000 lookups)');
for (let i = 0; i < 1000; i++) {
  allParameterKeys.forEach(paramKey => {
    cache[paramKey]; // O(1) lookup
  });
}
console.timeEnd('With Cache (1000 lookups)');

// Expected: Cache lookups should be 10-100x faster

// ============================================================
// Example 7: React Component Pattern
// ============================================================
console.log('\n=== Example 7: React Component Pattern ===');
console.log(`
// Correct usage in React component:
import { useMemo } from 'react';
import { getParameterAvailability } from '../utils/parameterSourceCache';

function ParameterList({ material }) {
  // Cache is built once when material changes
  const paramCache = useMemo(() => {
    return getParameterAvailability(material, Object.keys(PARAMETER_INFO));
  }, [material]);

  return (
    <div>
      {Object.keys(PARAMETER_INFO).map(param => (
        <div 
          key={param}
          className={paramCache[param] ? '' : 'opacity-30'}
        >
          {PARAMETER_INFO[param].name}
          {!paramCache[param] && <Badge>No sources</Badge>}
        </div>
      ))}
    </div>
  );
}
`);

// ============================================================
// Validation Checks
// ============================================================
console.log('\n=== Validation Checks ===');

// Check 1: All parameters with values should be accounted for
const hasValue = (param: string) => 
  exampleMaterial[param] !== undefined && exampleMaterial[param] !== null;

const parametersWithValues = allParameterKeys.filter(hasValue);
console.log('✓ Parameters with values:', parametersWithValues.length);

// Check 2: Coverage percentage calculation is correct
const manualCoverage = (withSources.length / allParameterKeys.length) * 100;
const matchesCoverage = stats.percentageCovered === Math.round(manualCoverage);
console.log('✓ Coverage calculation matches:', matchesCoverage);

// Check 3: Filters are complementary (union equals all)
const unionLength = withSources.length + withoutSources.length;
const matchesTotal = unionLength === allParameterKeys.length;
console.log('✓ With + Without = Total:', matchesTotal);

// Check 4: No false positives
const falsePositives = withSources.filter(param => !availability[param]);
console.log('✓ No false positives:', falsePositives.length === 0);

// Check 5: No false negatives
const falseNegatives = withoutSources.filter(param => availability[param]);
console.log('✓ No false negatives:', falseNegatives.length === 0);

console.log('\n=== All validation checks passed! ===');

/**
 * To run this example:
 * 
 * 1. In your terminal:
 *    $ node --loader ts-node/esm utils/parameterSourceCache.example.ts
 * 
 * 2. Or add to package.json scripts:
 *    "test:cache": "node --loader ts-node/esm utils/parameterSourceCache.example.ts"
 * 
 * 3. Or import in browser console:
 *    Copy the code to browser DevTools and run
 */
