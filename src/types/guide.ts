/**
 * Guide Types
 * Guides are step-by-step instructional content related to waste management
 */

export type GuideMethod = "DIY" | "Industrial" | "Experimental";
export type GuideStatus = "draft" | "published" | "pending_review" | "archived";

export interface Guide {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string; // Markdown content
  method: GuideMethod;
  material_id?: string; // Optional link to a material
  material_name?: string; // Denormalized for display

  // Media
  cover_image_url?: string;
  images?: string[]; // Array of image URLs

  // Metadata
  difficulty_level?: "beginner" | "intermediate" | "advanced";
  estimated_time?: string; // e.g., "30 minutes", "2 hours"
  required_materials?: string[]; // List of materials/tools needed
  tags?: string[];

  // Author & Publishing
  created_by: string; // User ID
  author_name?: string; // Denormalized for display
  created_at: string;
  updated_at: string;
  published_at?: string;
  status: GuideStatus;

  // Moderation (for future approval workflow)
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;

  // Engagement
  views_count?: number;
  likes_count?: number;

  // SEO
  meta_description?: string;
  meta_keywords?: string[];
}

export interface GuideSubmission {
  title: string;
  description: string;
  content: string;
  method: GuideMethod;
  material_id?: string;
  difficulty_level?: "beginner" | "intermediate" | "advanced";
  estimated_time?: string;
  required_materials?: string[];
  tags?: string[];
  cover_image_url?: string;
  meta_description?: string;
}
