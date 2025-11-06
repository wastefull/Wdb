/**
 * Parameter Source Cache Utilities
 * 
 * Performance optimization for checking which parameters have source attribution.
 * Prevents repeated iteration through source lists by pre-calculating availability.
 */

interface MaterialSource {
  parameters?: string[];
}

interface MaterialWithSources {
  id: string;
  sources?: MaterialSource[];
  [key: string]: any;
}

/**
 * Cache structure mapping material IDs to parameter availability
 */
export interface ParameterSourceCache {
  [materialId: string]: {
    [parameterKey: string]: boolean;
  };
}

/**
 * Build a comprehensive cache of which parameters have sources for each material
 * 
 * @param materials - Array of materials with source citations
 * @param parameterKeys - Array of parameter keys to check (e.g., ['Y_value', 'D_value', ...])
 * @returns Cache object for O(1) lookup
 * 
 * @example
 * const cache = buildParameterSourceCache(materials, Object.keys(PARAMETER_INFO));
 * const hasYieldSources = cache[materialId]?.Y_value || false;
 */
export function buildParameterSourceCache(
  materials: MaterialWithSources[],
  parameterKeys: string[]
): ParameterSourceCache {
  const cache: ParameterSourceCache = {};

  materials.forEach(material => {
    if (!material.sources || material.sources.length === 0) {
      cache[material.id] = {};
      return;
    }

    const parameterAvailability: Record<string, boolean> = {};

    parameterKeys.forEach(paramKey => {
      // Check if ANY source lists this parameter
      parameterAvailability[paramKey] = material.sources!.some(source =>
        source.parameters?.includes(paramKey)
      );
    });

    cache[material.id] = parameterAvailability;
  });

  return cache;
}

/**
 * Get source availability for a single material
 * 
 * @param material - Material with source citations
 * @param parameterKeys - Array of parameter keys to check
 * @returns Object mapping parameter keys to availability
 * 
 * @example
 * const availability = getParameterAvailability(material, ['Y_value', 'D_value']);
 * if (availability.Y_value) { ... }
 */
export function getParameterAvailability(
  material: MaterialWithSources,
  parameterKeys: string[]
): Record<string, boolean> {
  if (!material.sources || material.sources.length === 0) {
    return Object.fromEntries(parameterKeys.map(key => [key, false]));
  }

  const availability: Record<string, boolean> = {};

  parameterKeys.forEach(paramKey => {
    availability[paramKey] = material.sources!.some(source =>
      source.parameters?.includes(paramKey)
    );
  });

  return availability;
}

/**
 * Get statistics about parameter coverage for a material
 * 
 * @param material - Material with source citations
 * @param parameterKeys - Array of parameter keys to check
 * @returns Coverage statistics
 * 
 * @example
 * const stats = getParameterCoverageStats(material, Object.keys(PARAMETER_INFO));
 * console.log(`${stats.withSources}/${stats.total} parameters have sources`);
 */
export function getParameterCoverageStats(
  material: MaterialWithSources,
  parameterKeys: string[]
): {
  total: number;
  withSources: number;
  withoutSources: number;
  percentageCovered: number;
  missingParameters: string[];
} {
  const availability = getParameterAvailability(material, parameterKeys);
  
  const withSources = Object.values(availability).filter(Boolean).length;
  const withoutSources = parameterKeys.length - withSources;
  const missingParameters = parameterKeys.filter(key => !availability[key]);

  return {
    total: parameterKeys.length,
    withSources,
    withoutSources,
    percentageCovered: parameterKeys.length > 0 
      ? Math.round((withSources / parameterKeys.length) * 100) 
      : 0,
    missingParameters,
  };
}

/**
 * Filter parameters to only those with source attribution
 * 
 * @param material - Material with source citations
 * @param parameterKeys - Array of parameter keys to filter
 * @returns Array of parameter keys that have sources
 * 
 * @example
 * const sourcedParams = filterParametersWithSources(material, allParameters);
 * // Returns only parameters that have source citations
 */
export function filterParametersWithSources(
  material: MaterialWithSources,
  parameterKeys: string[]
): string[] {
  if (!material.sources || material.sources.length === 0) {
    return [];
  }

  return parameterKeys.filter(paramKey =>
    material.sources!.some(source => source.parameters?.includes(paramKey))
  );
}

/**
 * Filter parameters to only those WITHOUT source attribution
 * Useful for identifying gaps in documentation
 * 
 * @param material - Material with source citations
 * @param parameterKeys - Array of parameter keys to filter
 * @returns Array of parameter keys that lack sources
 * 
 * @example
 * const gapParams = filterParametersWithoutSources(material, allParameters);
 * // Returns parameters needing source attribution
 */
export function filterParametersWithoutSources(
  material: MaterialWithSources,
  parameterKeys: string[]
): string[] {
  if (!material.sources || material.sources.length === 0) {
    return parameterKeys;
  }

  return parameterKeys.filter(paramKey =>
    !material.sources!.some(source => source.parameters?.includes(paramKey))
  );
}
