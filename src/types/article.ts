/**
 * WasteDB Article Type Definitions
 *
 * Defines the structure for articles and related components
 */

import { TiptapContent } from "./guide";

export interface ArticleSection {
  image?: string; // base64 encoded image
  content: string;
}

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
  content?: TiptapContent;

  // Legacy section-based content (deprecated, for backward compatibility)
  /** @deprecated Use content (TiptapContent) instead */
  overview: {
    image?: string;
  };
  /** @deprecated Use content (TiptapContent) instead */
  introduction: ArticleSection;
  /** @deprecated Use content (TiptapContent) instead */
  supplies: ArticleSection;
  /** @deprecated Use content (TiptapContent) instead */
  step1: ArticleSection;

  dateAdded: string;

  // Content attribution
  created_by?: string; // User ID of original creator
  edited_by?: string; // User ID of editor (if edited directly by admin)
  writer_name?: string; // Display name of original writer
  editor_name?: string; // Display name of editor

  // Additional required properties
  slug: string;
  content_markdown: string;
  material_id: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  version: number;
  status: "draft" | "published" | "archived";

  // Legacy field for backwards compatibility
  /** @deprecated Use article_type instead */
  category?: "DIY" | "Industrial" | "Experimental";
}

export type CategoryType = "compostability" | "recyclability" | "reusability";
export type ArticleType = "DIY" | "Industrial" | "Experimental";

// Form-specific types
export interface ArticleFormProps {
  article?: Article;
  onSave: (article: Omit<Article, "id" | "dateAdded">) => void;
  onCancel: () => void;
}
