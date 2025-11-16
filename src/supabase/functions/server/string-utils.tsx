// String utility functions for source deduplication

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy title matching to detect potential duplicates
 * 
 * @param str1 First string
 * @param str2 Second string
 * @returns The Levenshtein distance (number of edits needed)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Create a 2D array for dynamic programming
  const matrix: number[][] = [];
  
  // Initialize the matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Calculate similarity percentage between two strings using Levenshtein distance
 * 
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity percentage (0-100)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  // Normalize strings: lowercase, trim, remove extra whitespace
  const normalized1 = str1.toLowerCase().trim().replace(/\s+/g, ' ');
  const normalized2 = str2.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Handle empty strings
  if (normalized1.length === 0 && normalized2.length === 0) {
    return 100;
  }
  if (normalized1.length === 0 || normalized2.length === 0) {
    return 0;
  }
  
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  // Calculate similarity as a percentage
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  return Math.round(similarity);
}

/**
 * Normalize a DOI to canonical format (10.xxxx/xxxxx)
 * Handles various DOI formats:
 * - https://doi.org/10.xxxx/xxxxx
 * - http://dx.doi.org/10.xxxx/xxxxx
 * - doi:10.xxxx/xxxxx
 * - DOI: 10.xxxx/xxxxx
 * - 10.xxxx/xxxxx (already normalized)
 * 
 * @param doi The DOI string in any format
 * @returns Normalized DOI in format "10.xxxx/xxxxx" or null if invalid
 */
export function normalizeDOI(doi: string): string | null {
  if (!doi) return null;
  
  // Trim whitespace
  let normalized = doi.trim();
  
  // Remove common prefixes
  normalized = normalized
    .replace(/^https?:\/\/doi\.org\//i, '')
    .replace(/^https?:\/\/dx\.doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .replace(/^DOI:\s*/i, '');
  
  // Check if it matches the DOI pattern (10.xxxx/xxxxx)
  const doiPattern = /^10\.\d{4,}\/\S+$/;
  
  if (doiPattern.test(normalized)) {
    return normalized;
  }
  
  // Invalid DOI format
  return null;
}

/**
 * Check if two titles are similar enough to be considered potential duplicates
 * 
 * @param title1 First title
 * @param title2 Second title
 * @param threshold Similarity threshold percentage (default: 90)
 * @returns true if titles are similar above threshold
 */
export function areTitlesSimilar(title1: string, title2: string, threshold: number = 90): boolean {
  const similarity = calculateSimilarity(title1, title2);
  return similarity >= threshold;
}
