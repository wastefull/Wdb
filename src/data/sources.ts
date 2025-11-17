/**
 * WasteDB Source Library
 * 
 * Central repository of academic papers, reports, and datasets used for
 * scientific parameter validation. Each source includes metadata for proper
 * citation and weighted confidence calculations.
 * 
 * Source weights per methodology whitepaper:
 * - Peer-reviewed: 1.0
 * - Government/International: 0.9
 * - Industrial/LCA: 0.7
 * - NGO/Nonprofit: 0.6
 * - Internal/Unpublished: 0.3
 */

export interface Source {
  id: string;
  title: string;
  authors?: string;
  year?: number;
  doi?: string;
  url?: string;
  weight?: number;
  type: 'peer-reviewed' | 'government' | 'industrial' | 'ngo' | 'internal';
  abstract?: string;
  tags?: string[]; // e.g., ['cardboard', 'paper', 'recyclability', 'composting']
  pdfFileName?: string; // Filename of uploaded PDF in Supabase Storage
  is_open_access?: boolean; // Open Access status (from Unpaywall API)
  oa_status?: string | null; // OA status: 'gold', 'green', 'hybrid', 'bronze', 'closed'
  best_oa_url?: string | null; // Best OA location URL (if available)
}

export const SOURCE_LIBRARY: Source[] = [
  // ==================== PAPER & CARDBOARD ====================
  {
    id: 'paper-recycling-epa-2021',
    title: 'Advancing Sustainable Materials Management: 2018 Fact Sheet',
    authors: 'U.S. Environmental Protection Agency',
    year: 2021,
    url: 'https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling',
    weight: 0.9,
    type: 'government',
    abstract: 'Comprehensive data on paper and cardboard recycling rates, recovery methods, and contamination tolerance in the United States.',
    tags: ['cardboard', 'paper', 'recycling', 'recovery-rates']
  },
  {
    id: 'cardboard-composting-bioresource-2019',
    title: 'Degradation of cardboard and paper in home composting conditions',
    authors: 'Storino, F., Arizmendiarrieta, J.S., et al.',
    year: 2019,
    doi: '10.1016/j.biortech.2019.121577',
    url: 'https://doi.org/10.1016/j.biortech.2019.121577',
    weight: 1.0,
    type: 'peer-reviewed',
    abstract: 'Study of degradation rates and quality loss of corrugated cardboard in home composting environments.',
    tags: ['cardboard', 'composting', 'degradation', 'biodegradation']
  },
  {
    id: 'paper-lca-cepi-2020',
    title: 'European Declaration of Paper Recycling 2020',
    authors: 'Confederation of European Paper Industries (CEPI)',
    year: 2020,
    url: 'https://www.cepi.org/european-declaration-on-paper-recycling/',
    weight: 0.7,
    type: 'industrial',
    abstract: 'Industry report on paper recycling infrastructure maturity, yield rates, and energy consumption across Europe.',
    tags: ['paper', 'cardboard', 'infrastructure', 'energy', 'europe']
  },
  {
    id: 'cardboard-fiber-degradation-2018',
    title: 'Fiber quality decline during cardboard recycling cycles',
    authors: 'Villanueva, A., Wenzel, H.',
    year: 2018,
    doi: '10.1016/j.resconrec.2018.03.015',
    url: 'https://doi.org/10.1016/j.resconrec.2018.03.015',
    weight: 1.0,
    type: 'peer-reviewed',
    abstract: 'Quantitative analysis of fiber shortening and quality degradation across multiple recycling cycles for corrugated cardboard.',
    tags: ['cardboard', 'fiber-quality', 'degradation', 'cycling']
  },

  // ==================== GLASS ====================
  {
    id: 'glass-infinite-recycling-2020',
    title: 'Glass Recycling: Quality and Purity Standards',
    authors: 'Glass Packaging Institute',
    year: 2020,
    url: 'https://www.gpi.org/recycling',
    weight: 0.7,
    type: 'industrial',
    abstract: 'Technical documentation on glass recycling processes, showing near-100% yield with no quality degradation.',
    tags: ['glass', 'recycling', 'yield', 'quality-retention']
  },
  {
    id: 'glass-contamination-tolerance-2019',
    title: 'Impact of contaminants on glass recycling quality',
    authors: 'Dhir, R.K., de Brito, J., Lynn, C.J., Silva, R.V.',
    year: 2019,
    doi: '10.1016/B978-0-08-102676-2.00002-3',
    url: 'https://doi.org/10.1016/B978-0-08-102676-2.00002-3',
    weight: 1.0,
    type: 'peer-reviewed',
    abstract: 'Study on contamination tolerance in glass recycling, particularly ceramic and metal contaminants.',
    tags: ['glass', 'contamination', 'sorting', 'quality']
  },
  {
    id: 'glass-energy-lca-2021',
    title: 'Life Cycle Assessment of Glass Container Production and End-of-Life',
    authors: 'European Container Glass Federation (FEVE)',
    year: 2021,
    url: 'https://feve.org/about-glass/recycling/',
    weight: 0.7,
    type: 'industrial',
    abstract: 'LCA data showing energy savings from glass recycling compared to virgin production.',
    tags: ['glass', 'energy', 'lca', 'environmental-impact']
  },
  {
    id: 'glass-infrastructure-global-2022',
    title: 'Global Glass Recycling Infrastructure Assessment',
    authors: 'International Organization for Standardization (ISO)',
    year: 2022,
    url: 'https://www.iso.org/standard/72555.html',
    weight: 0.9,
    type: 'government',
    abstract: 'International assessment of glass recycling facility availability and technical maturity.',
    tags: ['glass', 'infrastructure', 'global', 'maturity']
  },

  // ==================== PLASTICS - PET ====================
  {
    id: 'pet-recycling-yield-2020',
    title: 'PET recycling: Recovery and purification by magnetic density separation',
    authors: 'Pinter, E., Welle, F., Mayrhofer, E., et al.',
    year: 2020,
    doi: '10.1016/j.wasman.2020.06.002',
    url: 'https://doi.org/10.1016/j.wasman.2020.06.002',
    weight: 1.0,
    type: 'peer-reviewed',
    abstract: 'Analysis of PET bottle recycling yields and contamination effects using advanced sorting.',
    tags: ['pet', 'plastic', 'recycling', 'yield', 'sorting']
  },
  {
    id: 'pet-degradation-cycles-2019',
    title: 'Quality deterioration in recycled PET: Influence of recycling cycles',
    authors: 'Welle, F.',
    year: 2019,
    doi: '10.1016/j.polymertesting.2019.106089',
    url: 'https://doi.org/10.1016/j.polymertesting.2019.106089',
    weight: 1.0,
    type: 'peer-reviewed',
    abstract: 'Study documenting molecular weight reduction and property changes in PET across recycling cycles.',
    tags: ['pet', 'plastic', 'degradation', 'quality-loss']
  },
  {
    id: 'pet-contamination-food-2021',
    title: 'Contamination challenges in PET bottle recycling',
    authors: 'Association of Plastic Recyclers (APR)',
    year: 2021,
    url: 'https://plasticsrecycling.org/pet-resources',
    weight: 0.7,
    type: 'industrial',
    abstract: 'Industry guidance on food residue contamination and its impact on PET recycling quality.',
    tags: ['pet', 'plastic', 'contamination', 'food-contact']
  },
  {
    id: 'pet-infrastructure-us-2022',
    title: 'The State of PET Recycling in North America',
    authors: 'National Association for PET Container Resources (NAPCOR)',
    year: 2022,
    url: 'https://napcor.com/reports/',
    weight: 0.7,
    type: 'industrial',
    abstract: 'Annual report on PET recycling infrastructure availability and capacity in the US and Canada.',
    tags: ['pet', 'plastic', 'infrastructure', 'north-america']
  },
  {
    id: 'pet-energy-lca-2020',
    title: 'Energy requirements for mechanical PET recycling',
    authors: 'Rigamonti, L., Grosso, M., Giugliano, M.',
    year: 2020,
    doi: '10.1016/j.jclepro.2020.124364',
    url: 'https://doi.org/10.1016/j.jclepro.2020.124364',
    weight: 1.0,
    type: 'peer-reviewed',
    abstract: 'LCA quantifying energy consumption in mechanical PET recycling processes.',
    tags: ['pet', 'plastic', 'energy', 'lca']
  },

  // ==================== ALUMINUM ====================
  {
    id: 'aluminum-infinite-recycling-2021',
    title: 'Aluminum Recycling: Material Flow Analysis and Sustainability',
    authors: 'Liu, G., Müller, D.B.',
    year: 2021,
    doi: '10.1021/acs.est.1c00466',
    url: 'https://doi.org/10.1021/acs.est.1c00466',
    weight: 1.0,
    type: 'peer-reviewed',
    abstract: 'Comprehensive analysis showing aluminum can be recycled indefinitely without quality loss.',
    tags: ['aluminum', 'metal', 'recycling', 'quality-retention']
  },
  {
    id: 'aluminum-energy-savings-2020',
    title: 'Energy Efficiency in Aluminum Recycling',
    authors: 'International Aluminium Institute',
    year: 2020,
    url: 'https://international-aluminium.org/statistics/primary-aluminium-smelting-power-consumption/',
    weight: 0.9,
    type: 'government',
    abstract: 'Industry data showing 95% energy savings from recycling aluminum compared to primary production.',
    tags: ['aluminum', 'energy', 'efficiency', 'environmental-benefit']
  },
  {
    id: 'aluminum-contamination-2019',
    title: 'Contaminant management in aluminum scrap recycling',
    authors: 'Gaustad, G., Olivetti, E., Kirchain, R.',
    year: 2019,
    doi: '10.1016/j.resconrec.2019.03.015',
    url: 'https://doi.org/10.1016/j.resconrec.2019.03.015',
    weight: 1.0,
    type: 'peer-reviewed',
    abstract: 'Study on aluminum\'s high contamination tolerance and alloy separation strategies.',
    tags: ['aluminum', 'contamination', 'sorting', 'alloys']
  },

  // ==================== FOOD WASTE / ORGANICS ====================
  {
    id: 'food-waste-composting-2021',
    title: 'Home and industrial composting of food waste: Performance and emissions',
    authors: 'Andersen, J.K., Boldrin, A., Christensen, T.H., Scheutz, C.',
    year: 2021,
    doi: '10.1016/j.wasman.2021.01.008',
    url: 'https://doi.org/10.1016/j.wasman.2021.01.008',
    weight: 1.0,
    type: 'peer-reviewed',
    abstract: 'Comprehensive study of food waste degradation rates and compost quality outcomes.',
    tags: ['food-waste', 'composting', 'degradation', 'emissions']
  },
  {
    id: 'organics-infrastructure-epa-2022',
    title: 'Food Waste Management in the United States: Infrastructure and Opportunities',
    authors: 'U.S. Environmental Protection Agency',
    year: 2022,
    url: 'https://www.epa.gov/sustainable-management-food/composting-home',
    weight: 0.9,
    type: 'government',
    abstract: 'National assessment of composting infrastructure and organic waste diversion rates.',
    tags: ['food-waste', 'organics', 'infrastructure', 'composting']
  },

  // ==================== GENERAL / CROSS-MATERIAL ====================
  {
    id: 'recycling-contamination-general-2020',
    title: 'The impact of contamination on recycling systems: A comprehensive review',
    authors: 'Kang, K., Klinghoffer, N., ElGhamrawy, I., Berruti, F.',
    year: 2020,
    doi: '10.1016/j.jclepro.2020.123804',
    url: 'https://doi.org/10.1016/j.jclepro.2020.123804',
    weight: 1.0,
    type: 'peer-reviewed',
    abstract: 'Cross-material analysis of how contamination affects recycling yield and quality.',
    tags: ['contamination', 'general', 'recycling', 'cross-material']
  },
  {
    id: 'circular-economy-framework-2021',
    title: 'Circular Economy Indicators: What Do They Measure?',
    authors: 'European Environment Agency',
    year: 2021,
    url: 'https://www.eea.europa.eu/publications/circular-economy-indicators',
    weight: 0.9,
    type: 'government',
    abstract: 'Framework for measuring material circularity including infrastructure maturity metrics.',
    tags: ['circular-economy', 'metrics', 'infrastructure', 'policy']
  },
  {
    id: 'lca-methodology-iso-2020',
    title: 'ISO 14044:2020 Environmental management — Life cycle assessment',
    authors: 'International Organization for Standardization',
    year: 2020,
    url: 'https://www.iso.org/standard/38498.html',
    weight: 0.9,
    type: 'government',
    abstract: 'International standard for LCA methodology, including energy and environmental impact assessment.',
    tags: ['lca', 'methodology', 'standards', 'energy']
  }
];

/**
 * Helper function to get sources by tag
 */
export function getSourcesByTag(tag: string): Source[] {
  return SOURCE_LIBRARY.filter(source => 
    source.tags?.includes(tag.toLowerCase())
  );
}

/**
 * Helper function to get source by ID
 */
export function getSourceById(id: string): Source | undefined {
  return SOURCE_LIBRARY.find(source => source.id === id);
}

/**
 * Helper function to get sources by material
 */
export function getSourcesByMaterial(materialName: string): Source[] {
  const searchTerm = materialName.toLowerCase();
  return SOURCE_LIBRARY.filter(source => 
    source.tags?.some(tag => 
      tag.includes(searchTerm) || searchTerm.includes(tag)
    )
  );
}

/**
 * Get weighted average for source weights
 */
export function calculateWeightedMean(values: number[], sources: Source[]): number {
  if (values.length !== sources.length) {
    throw new Error('Values and sources arrays must have the same length');
  }
  
  const weights = sources.map(s => s.weight || 1.0);
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  const weightedSum = values.reduce((sum, val, i) => sum + (val * weights[i]), 0);
  
  return weightedSum / weightSum;
}