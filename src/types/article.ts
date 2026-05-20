/**
 * WasteDB Article Type Definitions
 *
 * Defines the structure for articles and related components
 */

import { TiptapContent } from "./guide";

export interface Article {
  id: string;
  title: string;

  // Article type classification (how it was created/tested)
  article_type: "DIY" | "Industrial" | "Experimental";

  // Sustainability category (what aspect it addresses)
  sustainability_category: CategoryType;

  // Cover/thumbnail image
  cover_image_url?: string;

  // Rich text content (Tiptap JSON format)
  content: TiptapContent;

  dateAdded: string;

  // Content attribution
  created_by?: string; // User ID of original creator
  edited_by?: string; // User ID of editor (if edited directly by admin)
  writer_name?: string; // Display name of original writer
  editor_name?: string; // Display name of editor

  // Additional required properties
  slug: string;
  material_id: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  version: number;
  status: "draft" | "published" | "archived";
}

export type CategoryType = "compostability" | "recyclability" | "reusability";
export type ArticleType = "DIY" | "Industrial" | "Experimental";

// Form-specific types
export interface ArticleFormProps {
  article?: Article;
  onSave: (
    article: Omit<Article, "id" | "dateAdded">,
    options?: { onBehalfOf?: string },
  ) => void;
  onCancel: () => void;
  /** Whether admin mode is active (shows UserSelector) */
  isAdminMode?: boolean;
}
