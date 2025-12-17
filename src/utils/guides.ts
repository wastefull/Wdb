/**
 * Guide API Functions
 * Handles CRUD operations for guides
 */

import { Guide, GuideSubmission } from "../types/guide";
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
 * Fetch all published guides
 */
export async function getPublishedGuides(): Promise<Guide[]> {
  try {
    const data = await apiCall("/guides?status=published");
    return data || [];
  } catch (error) {
    logger.error("Error fetching published guides:", error);
    return [];
  }
}

/**
 * Fetch guides by method
 */
export async function getGuidesByMethod(method: string): Promise<Guide[]> {
  try {
    const data = await apiCall(`/guides?status=published&method=${method}`);
    return data || [];
  } catch (error) {
    logger.error(`Error fetching guides for method ${method}:`, error);
    return [];
  }
}

/**
 * Fetch a single guide by slug
 */
export async function getGuideBySlug(slug: string): Promise<Guide | null> {
  try {
    const data = await apiCall(`/guides/${slug}`);
    return data;
  } catch (error) {
    logger.error(`Error fetching guide with slug ${slug}:`, error);
    return null;
  }
}

/**
 * Fetch a single guide by ID
 */
export async function getGuideById(id: string): Promise<Guide | null> {
  try {
    const data = await apiCall(`/guides/by-id/${id}`);
    return data;
  } catch (error) {
    logger.error(`Error fetching guide with id ${id}:`, error);
    return null;
  }
}

/**
 * Fetch guides by current user
 */
export async function getMyGuides(): Promise<Guide[]> {
  try {
    const data = await apiCall("/guides/my-guides");
    return data || [];
  } catch (error) {
    logger.error("Error fetching my guides:", error);
    return [];
  }
}

/**
 * Create a new guide
 */
export async function createGuide(
  guideData: GuideSubmission
): Promise<Guide | null> {
  try {
    const data = await apiCall("/guides", {
      method: "POST",
      body: JSON.stringify(guideData),
    });
    logger.log("Guide created successfully:", data.id);
    return data;
  } catch (error) {
    logger.error("Error creating guide:", error);
    throw error;
  }
}

/**
 * Update an existing guide
 */
export async function updateGuide(
  id: string,
  updates: Partial<GuideSubmission>
): Promise<Guide | null> {
  try {
    const data = await apiCall(`/guides/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    logger.log("Guide updated successfully:", id);
    return data;
  } catch (error) {
    logger.error("Error updating guide:", error);
    throw error;
  }
}

/**
 * Delete a guide
 */
export async function deleteGuide(id: string): Promise<boolean> {
  try {
    await apiCall(`/guides/${id}`, {
      method: "DELETE",
    });
    logger.log("Guide deleted successfully:", id);
    return true;
  } catch (error) {
    logger.error("Error deleting guide:", error);
    return false;
  }
}

/**
 * Increment view count
 */
export async function incrementGuideViews(id: string): Promise<void> {
  try {
    await apiCall(`/guides/${id}/views`, {
      method: "POST",
    });
  } catch (error) {
    logger.error("Error incrementing guide views:", error);
  }
}

/**
 * Search guides
 */
export async function searchGuides(query: string): Promise<Guide[]> {
  try {
    const data = await apiCall(`/guides/search?q=${encodeURIComponent(query)}`);
    return data || [];
  } catch (error) {
    logger.error("Error searching guides:", error);
    return [];
  }
}
