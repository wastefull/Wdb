/**
 * Keyword Matcher for Evidence Extraction
 *
 * Maps parameter codes to relevant keywords for scanning PDFs.
 * Keywords are organized by dimension (Recyclability, Compostability, Reusability)
 * and parameter (Y, C, M, D, E).
 *
 * Phase 9.2: Curation Workbench PDF Tooling
 */

export type ParameterCode = "Y" | "C" | "M" | "D" | "E";
export type Dimension = "recyclability" | "compostability" | "reusability";

export interface KeywordMatch {
  pageNumber: number;
  snippet: string;
  keyword: string;
  context: string; // Surrounding text for preview
  startIndex: number; // Position in page text
}

// Parameter keywords - these are shared across dimensions but may have dimension-specific additions
const PARAMETER_KEYWORDS: Record<ParameterCode, string[]> = {
  // Y - Yield (fiber recovery, material recovery)
  Y: [
    "yield",
    "recovery rate",
    "recovery",
    "fiber yield",
    "material yield",
    "recovered",
    "recovery efficiency",
    "mass recovery",
    "weight recovery",
    "extraction yield",
    "output",
    "%", // Often appears with yield values
  ],

  // C - Contamination (impurities, rejects)
  C: [
    "contamination",
    "contaminant",
    "impurity",
    "impurities",
    "reject",
    "rejects",
    "rejected",
    "foreign material",
    "foreign matter",
    "non-recyclable",
    "non-fiber",
    "dirt",
    "debris",
    "adhesive",
    "stickies",
    "ink",
    "coating",
  ],

  // M - Maturity (for compost) / Material Quality
  M: [
    "maturity",
    "mature",
    "curing",
    "stability",
    "stable",
    "C/N ratio",
    "carbon nitrogen",
    "humification",
    "germination",
    "phytotoxicity",
    "quality",
    "grade",
  ],

  // D - Degradability / Degradation
  D: [
    "degradation",
    "degradability",
    "degrade",
    "degraded",
    "decomposition",
    "decompose",
    "biodegradation",
    "biodegradable",
    "breakdown",
    "disintegration",
    "half-life",
    "mineralization",
    "weight loss",
    "mass loss",
  ],

  // E - Energy / Environmental Impact
  E: [
    "energy",
    "energy consumption",
    "energy demand",
    "electricity",
    "power",
    "kWh",
    "MJ",
    "joule",
    "carbon footprint",
    "CO2",
    "emission",
    "greenhouse",
    "GHG",
    "environmental impact",
    "LCA",
    "life cycle",
    "ecotoxicity",
    "toxicity",
    "COD",
    "BOD",
  ],
};

// Dimension-specific keyword additions
const DIMENSION_KEYWORDS: Record<Dimension, Record<ParameterCode, string[]>> = {
  recyclability: {
    Y: ["recycled content", "recyclate", "secondary fiber", "pulp yield"],
    C: ["sorting", "separation", "MRF", "material recovery facility"],
    M: ["fiber quality", "tensile strength", "brightness"],
    D: ["recyclable", "recycling rate", "collection rate"],
    E: ["processing energy", "sorting energy", "transport"],
  },
  compostability: {
    Y: ["compost yield", "organic matter", "humus"],
    C: ["plastic contamination", "glass", "metal", "inert"],
    M: ["compost maturity", "curing time", "finished compost"],
    D: ["composting time", "aerobic", "anaerobic", "windrow", "vessel"],
    E: ["methane", "CH4", "biogas", "aeration"],
  },
  reusability: {
    Y: ["reuse rate", "return rate", "refill"],
    C: ["damage", "wear", "defect", "hygiene"],
    M: ["durability", "lifespan", "cycles"],
    D: ["washing", "cleaning", "sanitization"],
    E: ["transport distance", "logistics", "collection"],
  },
};

/**
 * Get all keywords for a parameter, optionally filtered by dimension
 */
export function getKeywordsForParameter(
  parameterCode: ParameterCode,
  dimension?: Dimension
): string[] {
  const baseKeywords = PARAMETER_KEYWORDS[parameterCode] || [];

  if (dimension && DIMENSION_KEYWORDS[dimension]?.[parameterCode]) {
    return [...baseKeywords, ...DIMENSION_KEYWORDS[dimension][parameterCode]];
  }

  return baseKeywords;
}

/**
 * Search page text for keyword matches
 */
export function findKeywordMatches(
  pageText: string,
  pageNumber: number,
  parameterCode: ParameterCode,
  dimension?: Dimension
): KeywordMatch[] {
  const keywords = getKeywordsForParameter(parameterCode, dimension);
  const matches: KeywordMatch[] = [];
  const lowerText = pageText.toLowerCase();

  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    let startIndex = 0;

    while ((startIndex = lowerText.indexOf(lowerKeyword, startIndex)) !== -1) {
      // Extract context (50 chars before and after)
      const contextStart = Math.max(0, startIndex - 50);
      const contextEnd = Math.min(
        pageText.length,
        startIndex + keyword.length + 50
      );
      const context = pageText.substring(contextStart, contextEnd);

      // Extract snippet (the sentence or ~100 chars around the match)
      const snippetStart = Math.max(0, startIndex - 30);
      const snippetEnd = Math.min(
        pageText.length,
        startIndex + keyword.length + 70
      );
      let snippet = pageText.substring(snippetStart, snippetEnd).trim();

      // Add ellipsis if truncated
      if (snippetStart > 0) snippet = "..." + snippet;
      if (snippetEnd < pageText.length) snippet = snippet + "...";

      matches.push({
        pageNumber,
        snippet,
        keyword,
        context,
        startIndex,
      });

      startIndex += keyword.length;
    }
  }

  // Remove duplicates (same position, different keywords)
  const uniqueMatches = matches.filter(
    (match, index, self) =>
      index ===
      self.findIndex(
        (m) =>
          m.pageNumber === match.pageNumber &&
          Math.abs(m.startIndex - match.startIndex) < 10
      )
  );

  // Sort by position in document
  return uniqueMatches.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Scan all pages of a PDF for matches
 */
// PageTextContent is imported from PDFViewer when needed, defined inline here
// to avoid circular dependencies
interface PageTextContent {
  pageNumber: number;
  text: string;
}

export function scanPdfForMatches(
  pages: PageTextContent[],
  parameterCode: ParameterCode,
  dimension?: Dimension
): KeywordMatch[] {
  const allMatches: KeywordMatch[] = [];

  for (const page of pages) {
    const pageMatches = findKeywordMatches(
      page.text,
      page.pageNumber,
      parameterCode,
      dimension
    );
    allMatches.push(...pageMatches);
  }

  return allMatches;
}

/**
 * Group matches by page for display
 */
export function groupMatchesByPage(
  matches: KeywordMatch[]
): Map<number, KeywordMatch[]> {
  const grouped = new Map<number, KeywordMatch[]>();

  for (const match of matches) {
    const pageMatches = grouped.get(match.pageNumber) || [];
    pageMatches.push(match);
    grouped.set(match.pageNumber, pageMatches);
  }

  return grouped;
}
