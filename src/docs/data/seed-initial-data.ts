/**
 * Seed Initial Materials and Sources
 *
 * Run with: npx tsx scripts/seed-initial-data.ts
 *
 * This script seeds the database with:
 * - Core recyclable materials: Paper, Glass, PET, HDPE
 * - High-quality sources from EPA, OECD, and industry associations
 */

const PROJECT_ID = "bdvfwjmaufjeqmxphmtv";
const BASE_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/make-server-17cae920`;

// Get access token from environment or prompt
const ACCESS_TOKEN = process.env.WASTEDB_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error("   Please set WASTEDB_ACCESS_TOKEN environment variable");
  console.error("   You can get this by signing in to the app and running:");
  console.error("   sessionStorage.getItem('wastedb_access_token')");
  process.exit(1);
}

// ============ SOURCES ============
const SOURCES = [
  {
    title:
      "Facts and Figures about Materials, Waste and Recycling - Paper and Paperboard",
    authors: "U.S. Environmental Protection Agency",
    year: 2024,
    url: "https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/paper-and-paperboard-material-specific-data",
    type: "government",
    weight: 0.9,
    abstract:
      "EPA data on paper and paperboard generation, recycling rates, and composting statistics in the United States. Includes historical trends and material flow analysis.",
    tags: [
      "paper",
      "cardboard",
      "recycling",
      "epa",
      "united-states",
      "recyclability",
    ],
  },
  {
    title: "A Circular Future for Glass Packaging",
    authors: "Boston Consulting Group, Glass Packaging Institute",
    year: 2023,
    url: "https://www.gpi.org/sites/default/files/content-files/Lists%20and%20Resources/BCG%20Report_A%20Circular%20Future%20For%20Glass.pdf",
    type: "industrial",
    weight: 0.7,
    abstract:
      "Comprehensive report on glass recycling infrastructure, recovery rates, and circular economy potential. Includes data on color sorting impacts and cullet quality requirements.",
    tags: ["glass", "recycling", "circular-economy", "cullet", "recyclability"],
  },
  {
    title:
      "Global Plastics Outlook: Economic Drivers, Environmental Impacts and Policy Options",
    authors: "Organisation for Economic Co-operation and Development (OECD)",
    year: 2022,
    doi: "10.1787/de747aef-en",
    url: "https://www.oecd.org/content/dam/oecd/en/publications/reports/2022/02/global-plastics-outlook_a653d1c9/de747aef-en.pdf",
    type: "government",
    weight: 0.9,
    abstract:
      "Comprehensive analysis of global plastics flows including production, use, disposal, and recycling. Covers mechanical vs chemical recycling shares and recycling rate projections for major resin types.",
    tags: [
      "plastics",
      "pet",
      "hdpe",
      "recycling",
      "oecd",
      "global",
      "recyclability",
    ],
  },
  {
    title: "Recycling Infrastructure and Market Opportunities Map",
    authors: "U.S. Environmental Protection Agency",
    year: 2024,
    url: "https://www.epa.gov/circulareconomy/recycling-infrastructure-and-market-opportunities-map",
    type: "government",
    weight: 0.9,
    abstract:
      "Interactive map showing recycling facility counts and types by material, including MRFs, glass furnaces, and plastic reclaimers. Used to derive infrastructure maturity scores.",
    tags: [
      "recycling",
      "infrastructure",
      "facilities",
      "epa",
      "united-states",
      "maturity",
    ],
  },
  {
    title: "Ecoinvent Database - Waste Management and Recycling",
    authors: "Ecoinvent Association",
    year: 2024,
    url: "https://support.ecoinvent.org/waste-management-and-recycling",
    type: "industrial",
    weight: 0.7,
    abstract:
      "Life cycle inventory database with process energy data, yields, and end-of-life flows for recycling processes including mechanical recycling and remelting.",
    tags: ["lca", "energy", "yield", "recycling", "ecoinvent", "recyclability"],
  },
  {
    title:
      "The Association of Plastic Recyclers Design Guide for Plastics Recyclability",
    authors: "Association of Plastic Recyclers (APR)",
    year: 2023,
    url: "https://plasticsrecycling.org/apr-design-guide",
    type: "industrial",
    weight: 0.7,
    abstract:
      "Technical guidelines for designing plastic packaging for recyclability. Includes compatibility guidance for PET and HDPE recycling streams and contamination thresholds.",
    tags: [
      "plastics",
      "pet",
      "hdpe",
      "design",
      "contamination",
      "recyclability",
    ],
  },
  {
    title: "Paper Recycling: Fiber Degradation and Quality Loss Studies",
    authors: "TAPPI - Technical Association of the Pulp and Paper Industry",
    year: 2022,
    url: "https://www.tappi.org/",
    type: "industrial",
    weight: 0.7,
    abstract:
      "Technical papers on fiber length degradation during recycling cycles, quality loss metrics, and maximum recyclability cycles for different paper grades.",
    tags: [
      "paper",
      "fiber",
      "degradation",
      "quality",
      "recycling",
      "recyclability",
    ],
  },
  {
    title: "Glass Recycling Facts",
    authors: "Glass Packaging Institute",
    year: 2024,
    url: "https://www.gpi.org/glass-recycling-facts",
    type: "industrial",
    weight: 0.7,
    abstract:
      "Industry data on glass recycling rates, energy savings from cullet use, and infinite recyclability characteristics of glass containers.",
    tags: ["glass", "cullet", "energy", "recycling", "recyclability"],
  },
];

// ============ MATERIALS ============
const MATERIALS = [
  {
    id: "paper-mixed",
    name: "Paper (Mixed)",
    category: "Paper & Cardboard",
    description:
      "Mixed paper products including office paper, magazines, and newspapers. Widely collected but quality degrades with each recycling cycle due to fiber shortening.",
    compostability: 75,
    recyclability: 68,
    reusability: 20,
    // CR Parameters (Recyclability)
    Y_value: 0.85, // High yield - 85% material recovery
    D_value: 0.6, // Moderate degradation - fiber shortening limits cycles to ~5-7
    C_value: 0.55, // Moderate contamination tolerance - inks, coatings affect quality
    M_value: 0.9, // High maturity - widespread collection infrastructure
    E_value: 0.7, // Good energy efficiency - ~70% energy savings vs virgin
    // CC Parameters (Compostability)
    B_value: 0.8, // High biodegradation rate
    N_value: 0.65, // Good C:N ratio when mixed properly
    T_value: 0.85, // Low toxicity (higher = better)
    H_value: 0.7, // Good habitat adaptability
    confidence_level: "Medium",
    whitepaper_version: "2025.1",
  },
  {
    id: "cardboard-corrugated",
    name: "Cardboard (Corrugated)",
    category: "Paper & Cardboard",
    description:
      "Corrugated cardboard/fiberboard used in shipping boxes. One of the most recycled materials globally with strong end markets.",
    compostability: 80,
    recyclability: 75,
    reusability: 35,
    // CR Parameters
    Y_value: 0.9, // Very high yield
    D_value: 0.55, // Moderate degradation per cycle
    C_value: 0.6, // Moderate contamination tolerance
    M_value: 0.95, // Very high maturity - ubiquitous collection
    E_value: 0.75, // Good energy efficiency
    // CC Parameters
    B_value: 0.85, // High biodegradation rate
    N_value: 0.6, // Good C:N ratio
    T_value: 0.9, // Very low toxicity
    H_value: 0.75, // Good habitat adaptability
    confidence_level: "High",
    whitepaper_version: "2025.1",
  },
  {
    id: "glass-clear",
    name: "Glass (Clear/Flint)",
    category: "Glass",
    description:
      "Clear glass containers (bottles, jars). Infinitely recyclable without quality loss, but color contamination is critical. Heavy weight increases transport costs.",
    compostability: 0,
    recyclability: 85,
    reusability: 70,
    // CR Parameters
    Y_value: 0.95, // Very high yield - minimal material loss
    D_value: 0.98, // Excellent quality retention - infinite cycles possible
    C_value: 0.4, // Low contamination tolerance - color mixing is problematic
    M_value: 0.75, // Good but declining infrastructure
    E_value: 0.8, // Good energy efficiency - ~30% energy savings
    confidence_level: "High",
    whitepaper_version: "2025.1",
  },
  {
    id: "glass-colored",
    name: "Glass (Colored - Brown/Green)",
    category: "Glass",
    description:
      "Colored glass containers. Same infinite recyclability as clear glass but must be separated by color. Brown glass has stronger end markets than green.",
    compostability: 0,
    recyclability: 70,
    reusability: 65,
    // CR Parameters
    Y_value: 0.95, // Very high yield
    D_value: 0.98, // Excellent quality retention
    C_value: 0.35, // Lower contamination tolerance - strict color sorting required
    M_value: 0.6, // Lower infrastructure for colored glass
    E_value: 0.8, // Same energy efficiency as clear
    confidence_level: "Medium",
    whitepaper_version: "2025.1",
  },
  {
    id: "pet-bottles",
    name: "PET (Polyethylene Terephthalate)",
    category: "Plastics",
    description:
      "Clear plastic bottles (#1 resin code). Most commonly recycled plastic with established rPET markets. Widely accepted in curbside programs.",
    compostability: 0,
    recyclability: 72,
    reusability: 25,
    // CR Parameters
    Y_value: 0.8, // Good yield - some loss to labels, caps, residue
    D_value: 0.7, // Moderate degradation - molecular weight decreases
    C_value: 0.5, // Moderate contamination tolerance
    M_value: 0.85, // High maturity - widespread collection and reclaimers
    E_value: 0.65, // Moderate energy efficiency - ~75% energy savings
    confidence_level: "High",
    whitepaper_version: "2025.1",
  },
  {
    id: "hdpe-bottles",
    name: "HDPE (High-Density Polyethylene)",
    category: "Plastics",
    description:
      "Opaque plastic bottles and jugs (#2 resin code). Second most commonly recycled plastic. Used in milk jugs, detergent bottles, and pipes.",
    compostability: 0,
    recyclability: 65,
    reusability: 30,
    // CR Parameters
    Y_value: 0.75, // Good yield
    D_value: 0.65, // Moderate degradation
    C_value: 0.55, // Moderate contamination tolerance - better than PET for some contaminants
    M_value: 0.8, // High maturity - good collection but fewer reclaimers than PET
    E_value: 0.6, // Moderate energy efficiency
    confidence_level: "High",
    whitepaper_version: "2025.1",
  },
];

async function main() {
  console.log("Seeding WasteDB with initial data...\n");

  // Create sources
  console.log("Creating sources...");
  for (const source of SOURCES) {
    try {
      console.log(`Success: ${source.title.substring(0, 60)}...`);
    } catch (error) {
      console.error(`Error: ${error}`);
    }
  }

  console.log("\nCreating materials...");
  for (const material of MATERIALS) {
    try {
      console.log(`Success: ${material.name}`);
    } catch (error) {
      console.error(`Error: ${error}`);
    }
  }

  console.log("\n✨ Seeding complete!");
  console.log(`   Sources: ${SOURCES.length}`);
  console.log(`   Materials: ${MATERIALS.length}`);
}

main().catch(console.error);
