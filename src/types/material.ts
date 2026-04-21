/**
 * WasteDB Material Type Definition
 *
 * Includes both public-facing sustainability scores and scientific metadata
 * as specified in DATA_PIPELINE.md and ROADMAP.md
 */

import { Article, CategoryType } from "./article";

export interface Source {
  title: string;
  authors?: string;
  year?: number;
  doi?: string;
  url?: string;
  weight?: number; // Source weight in aggregation (0-1)
  parameters?: string[]; // Which parameters this source contributed to (e.g., ['Y_value', 'D_value'])
  pdfFileName?: string; // Filename of uploaded PDF in Supabase Storage
}

export interface ConfidenceInterval {
  lower: number; // Lower bound (0-1)
  upper: number; // Upper bound (0-1)
}

export interface Submission {
  id: string;
  type:
    | "new_material"
    | "edit_material"
    | "new_article"
    | "update_article"
    | "delete_material"
    | "delete_article";
  content_data: any; // JSON blob with submission-specific data
  original_content_id?: string; // For edits/updates/deletes - references the original material/article
  status:
    | "pending_review"
    | "pending_revision"
    | "approved"
    | "rejected"
    | "flagged";
  submitted_by: string;
  reviewed_by?: string;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type:
    | "submission_approved"
    | "feedback_received"
    | "new_review_item"
    | "article_published"
    | "content_flagged";
  content_id: string;
  content_type: "material" | "article" | "submission";
  message: string;
  read: boolean;
  created_at: string;
}

export interface UserProfile {
  user_id: string;
  email: string;
  name: string;
  role: "user" | "staff" | "admin";
  bio?: string;
  social_link?: string;
  avatar_url?: string;
  show_on_leaderboard?: boolean;
  active: boolean;
  created_at: string;
}

export const MATERIAL_CATEGORIES = [
  "Plastics",
  "Metals",
  "Glass",
  "Paper & Cardboard",
  "Fabrics & Textiles",
  "Electronics & Batteries",
  "Building Materials",
  "Organic/Natural Waste",
  "Elements",
] as const;

export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export interface Material {
  // Core identification
  id: string;
  name: string;
  category: MaterialCategory;
  description?: string;

  // Public-facing sustainability scores (0-100 scale)
  compostability: number; // Biological decomposition potential
  recyclability: number; // Mechanical/chemical recycling potential (derived from CR_practical_mean)
  reusability: number; // Direct reuse potential

  // NOTE: Articles are now stored separately and linked via material_id
  // Legacy field maintained for backward compatibility
  articles?: {
    compostability: Article[];
    recyclability: Article[];
    reusability: Article[];
  };

  // ========== SCIENTIFIC DATA LAYER ==========

  // ========== RECYCLABILITY (CR-v1) ==========
  // Raw normalized parameters (0-1 scale)
  Y_value?: number; // Yield - material recovery rate
  D_value?: number; // Degradability - quality loss (higher = better quality retention)
  C_value?: number; // Contamination tolerance - process sensitivity
  M_value?: number; // Maturity - infrastructure availability and readiness (shared across all dimensions)
  E_value?: number; // Energy demand - normalized energy cost

  // Composite Recyclability Index scores (0-1 scale)
  CR_practical_mean?: number; // Practical recyclability (realistic conditions)
  CR_theoretical_mean?: number; // Theoretical recyclability (ideal conditions)

  // 95% Confidence Intervals
  CR_practical_CI95?: ConfidenceInterval;
  CR_theoretical_CI95?: ConfidenceInterval;

  // ========== COMPOSTABILITY (CC-v1) ==========
  // Raw normalized parameters (0-1 scale)
  B_value?: number; // Biodegradation rate constant
  N_value?: number; // Nutrient balance - C:N:P ratio suitability
  T_value?: number; // Toxicity / Residue index (degree of phytotoxicity)
  H_value?: number; // Habitat adaptability - fraction of composting systems
  // M_value - shared with CR above

  // Composite Compostability Index scores (0-1 scale)
  CC_practical_mean?: number; // Practical compostability (regional facilities)
  CC_theoretical_mean?: number; // Theoretical compostability (ideal conditions)

  // 95% Confidence Intervals
  CC_practical_CI95?: ConfidenceInterval;
  CC_theoretical_CI95?: ConfidenceInterval;

  // ========== REUSABILITY (RU-v1) ==========
  // Raw normalized parameters (0-1 scale)
  L_value?: number; // Lifetime - average functional cycles before failure
  R_value?: number; // Repairability - ease of disassembly / component replacement
  U_value?: number; // Upgradability - ease of adaptation / repurposing
  C_RU_value?: number; // Contamination susceptibility (probability of functional loss per use) - renamed to avoid conflict
  // M_value - shared with CR and CC above

  // Composite Reusability Index scores (0-1 scale)
  RU_practical_mean?: number; // Practical reusability (market reality)
  RU_theoretical_mean?: number; // Theoretical reusability (design intent)

  // 95% Confidence Intervals
  RU_practical_CI95?: ConfidenceInterval;
  RU_theoretical_CI95?: ConfidenceInterval;

  // Data quality and provenance
  confidence_level?: "High" | "Medium" | "Low"; // Overall data confidence
  sources?: Source[]; // Citation metadata

  // Versioning and audit trail
  whitepaper_version?: string; // Methodology version (e.g., "2025.1")
  calculation_timestamp?: string; // ISO 8601 timestamp of last calculation
  method_version?: string; // Calculation method version (e.g., "CR-v1")

  // Content attribution
  created_by?: string; // User ID of original creator
  edited_by?: string; // User ID of editor (if edited directly by admin)
  writer_name?: string; // Display name of original writer
  editor_name?: string; // Display name of editor

  // Wikimedia enrichment (optional — absent on pre-wiki records)
  wiki?: MaterialWikiMetadata;
}

/**
 * Safe Wikimedia Commons image licenses for use in WasteDB.
 * Only materials whose wiki.imageLicenseName matches one of these values
 * will have their wiki block preserved on backup import.
 */
export const SAFE_WIKI_IMAGE_LICENSES = [
  "CC0",
  "CC0 1.0",
  "CC0 1.0 Universal",
  "CC BY 2.0",
  "CC BY 3.0",
  "CC BY 4.0",
  "CC BY-SA 2.0",
  "CC BY-SA 3.0",
  "CC BY-SA 4.0",
  "Public Domain",
  "PD",
] as const;

export type SafeWikiImageLicense = (typeof SAFE_WIKI_IMAGE_LICENSES)[number];

/**
 * Optional Wikimedia enrichment metadata stored on a material.
 * All fields are optional so that materials without wiki data remain valid.
 * Attribution fields are required for compliance when text/images are sourced
 * from Wikipedia or Wikimedia Commons.
 */
export interface MaterialWikiMetadata {
  // Identity
  wikidataQid: string; // e.g. "Q11254"
  wikipediaUrl?: string;
  wikipediaTitle?: string;
  aliases?: string[];
  translations?: Record<string, string[]>; // lang -> aliases
  chemicalNames?: string[];
  tradeNames?: string[];
  materialClassRaw?: string[];

  // Description (staff-reviewed; CC BY-SA attribution trail below)
  shortDescription?: string;
  compositionSummary?: string;

  // Image (Wikimedia Commons — per-file license)
  imageUrl?: string;
  commonsFileName?: string;
  commonsCategory?: string;
  imageAuthor?: string;
  imageLicenseName?: string; // Must be in SAFE_WIKI_IMAGE_LICENSES to be stored
  imageLicenseUrl?: string;
  imageAttributionText?: string;
  imageCommonsPageUrl?: string;

  // Text attribution trail (CC BY-SA 4.0 compliance)
  sourceUrl?: string; // Wikipedia article URL
  sourceRevisionId?: number; // Versioned attribution
  textRetrievedAt?: string; // ISO date

  // Sync metadata
  lastSyncedAt?: string; // ISO date of last Wikimedia fetch
}

// Re-export CategoryType for convenience
export type { CategoryType };
