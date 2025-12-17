/**
 * Blog API Functions
 * Handles CRUD operations for blog posts
 */

import { BlogPost, BlogPostSubmission } from "../types/blog";
import { logger } from "./logger";
import { projectId, publicAnonKey } from "./supabase/info";

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-17cae920`;

// Get current access token from session storage
function getAccessToken(): string {
  return sessionStorage.getItem("wastedb_access_token") || publicAnonKey;
}

// Generic API call helper
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAccessToken();
  const isCustomToken = token !== publicAnonKey;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`, // Always use anon key for Supabase
      ...(isCustomToken ? { "X-Session-Token": token } : {}), // Custom tokens go in X-Session-Token
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      JSON.stringify(error) || `API call failed: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Fetch all published blog posts
 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  try {
    const data = await apiCall("/blog?status=published");
    return data || [];
  } catch (error) {
    logger.error("Error fetching published blog posts:", error);
    return [];
  }
}

/**
 * Fetch blog posts by category
 */
export async function getPostsByCategory(
  category: string
): Promise<BlogPost[]> {
  try {
    const data = await apiCall(`/blog?status=published&category=${category}`);
    return data || [];
  } catch (error) {
    logger.error(`Error fetching blog posts for category ${category}:`, error);
    return [];
  }
}

/**
 * Fetch a single blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const data = await apiCall(`/blog/${slug}`);
    return data;
  } catch (error) {
    logger.error(`Error fetching blog post with slug ${slug}:`, error);
    return null;
  }
}

/**
 * Fetch a single blog post by ID
 */
export async function getPostById(id: string): Promise<BlogPost | null> {
  try {
    const data = await apiCall(`/blog/by-id/${id}`);
    return data;
  } catch (error) {
    logger.error(`Error fetching blog post with id ${id}:`, error);
    return null;
  }
}

/**
 * Fetch blog posts by current user
 */
export async function getMyPosts(): Promise<BlogPost[]> {
  try {
    const data = await apiCall("/blog/my-posts");
    return data || [];
  } catch (error) {
    logger.error("Error fetching my blog posts:", error);
    return [];
  }
}

/**
 * Create a new blog post
 */
export async function createPost(
  postData: BlogPostSubmission
): Promise<BlogPost | null> {
  try {
    const data = await apiCall("/blog", {
      method: "POST",
      body: JSON.stringify(postData),
    });
    logger.log("Blog post created successfully:", data.id);
    return data;
  } catch (error) {
    logger.error("Error creating blog post:", error);
    throw error;
  }
}

/**
 * Update an existing blog post
 */
export async function updatePost(
  id: string,
  updates: Partial<BlogPostSubmission>
): Promise<BlogPost | null> {
  try {
    const data = await apiCall(`/blog/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    logger.log("Blog post updated successfully:", id);
    return data;
  } catch (error) {
    logger.error("Error updating blog post:", error);
    throw error;
  }
}

/**
 * Delete a blog post
 */
export async function deletePost(id: string): Promise<boolean> {
  try {
    await apiCall(`/blog/${id}`, {
      method: "DELETE",
    });
    logger.log("Blog post deleted successfully:", id);
    return true;
  } catch (error) {
    logger.error("Error deleting blog post:", error);
    return false;
  }
}

/**
 * Increment view count
 */
export async function incrementPostViews(id: string): Promise<void> {
  try {
    await apiCall(`/blog/${id}/views`, {
      method: "POST",
    });
  } catch (error) {
    logger.error("Error incrementing blog post views:", error);
  }
}

/**
 * Search blog posts
 */
export async function searchPosts(query: string): Promise<BlogPost[]> {
  try {
    const data = await apiCall(`/blog/search?q=${encodeURIComponent(query)}`);
    return data || [];
  } catch (error) {
    logger.error("Error searching blog posts:", error);
    return [];
  }
}
