/**
 * Blog Post Types
 */

export type BlogCategory =
  | "News"
  | "Tutorial"
  | "Case Study"
  | "Research"
  | "Community"
  | "Product Update";

export type BlogStatus = "draft" | "published" | "archived";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Markdown
  category: BlogCategory;

  // Media
  cover_image_url?: string;
  images?: string[];

  // Metadata
  tags?: string[];
  reading_time_minutes?: number;

  // Author & Publishing
  created_by: string;
  author_name?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  status: BlogStatus;

  // Engagement
  views_count: number;
  likes_count: number;

  // SEO
  meta_description?: string;
  meta_keywords?: string[];
}

export interface BlogPostSubmission {
  title: string;
  excerpt: string;
  content: string;
  category: BlogCategory;
  cover_image_url?: string;
  images?: string[];
  tags?: string[];
  meta_description?: string;
  meta_keywords?: string[];
}
