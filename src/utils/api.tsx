import { projectId, publicAnonKey } from "./supabase/info";
import { logger } from "./logger";
import { toast } from "sonner";
import { Material } from "../types/material";

// Export projectId and publicAnonKey for use in other modules
export { projectId, publicAnonKey };

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-17cae920`;
logger.log("🔧 API_BASE_URL initialized:", API_BASE_URL);

// Session expiry callback - will be set by AuthContext
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredCallback(callback: () => void) {
  onSessionExpired = callback;
}

interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

// Get current access token from session storage
function getAccessToken(): string {
  const token = sessionStorage.getItem("wastedb_access_token") || publicAnonKey;
  logger.log(
    "getAccessToken called, returning:",
    token === publicAnonKey ? "(anon key)" : "(authenticated token)"
  );
  return token;
}

// Store access token in session storage
export function setAccessToken(token: string) {
  logger.log("setAccessToken called - storing authenticated token");
  sessionStorage.setItem("wastedb_access_token", token);
  logger.log("Token stored in sessionStorage successfully");
}

// Clear access token from session storage
export function clearAccessToken() {
  sessionStorage.removeItem("wastedb_access_token");
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const token = sessionStorage.getItem("wastedb_access_token");
  return token !== null && token !== publicAnonKey;
}

// Helper function to make API calls
export async function apiCall(
  endpoint: string,
  options: RequestInit = {},
  suppressAuthToast = false
) {
  const token = getAccessToken();
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  const isCustomToken = token !== publicAnonKey;

  logger.log("🌐 API Call:", {
    endpoint,
    method: options.method || "GET",
    authType: isCustomToken ? "authenticated" : "anonymous",
  });

  // For custom session tokens, use X-Session-Token header
  // For anon key, use Authorization header
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`, // Always use anon key for Supabase
      ...(isCustomToken ? { "X-Session-Token": token } : {}), // Custom tokens go in X-Session-Token
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle authentication/authorization errors (401 Unauthorized, 403 Forbidden)
    const isAuthError = response.status === 401 || response.status === 403;
    const isAuthEndpoint = endpoint.includes("/auth/");
    const isNotificationEndpoint = endpoint.includes("/notifications");

    // For suppressAuthToast endpoints, auth errors are expected (public endpoints for unauthenticated users)
    // Only log errors if they're unexpected
    const isExpectedAuthFailure = isAuthError && suppressAuthToast;
    if (!isExpectedAuthFailure) {
      // Log error WITHOUT exposing full endpoint in production
      logger.error("API call failed:", {
        method: options.method || "GET",
        status: response.status,
        statusText: response.statusText,
        errorMessage: errorData.error || response.statusText,
        // Only log endpoint path (not full URL) and only in test mode
        ...(logger.isTestMode() ? { endpoint } : {}),
      });
    }

    // Handle session expiry for non-auth, non-notification endpoints
    // Notification errors should NOT trigger session expiry (non-critical feature)
    // Also skip if suppressAuthToast is true (for public endpoints that may fail for unauthenticated users)
    if (
      isAuthError &&
      !isAuthEndpoint &&
      !isNotificationEndpoint &&
      !suppressAuthToast
    ) {
      logger.warn("🔐 Authentication error detected - clearing session");
      clearAccessToken();
      sessionStorage.removeItem("wastedb_user");

      // Show user-friendly message based on status and error message
      const errorMessage = errorData.error || "";
      if (response.status === 401) {
        if (
          errorMessage.toLowerCase().includes("session expired") ||
          errorMessage.toLowerCase().includes("expired")
        ) {
          toast.error("Your session has expired. Please sign in again.", {
            duration: 5000,
            id: "session-expired", // Prevent duplicate toasts
          });
        } else {
          toast.error("Authentication required. Please sign in to continue.", {
            duration: 5000,
            id: "auth-required",
          });
        }
      } else if (response.status === 403) {
        toast.error("You do not have permission to perform this action.", {
          duration: 5000,
          id: "permission-denied",
        });
      }

      // Trigger the session expired callback (redirects to front page/login)
      if (onSessionExpired) {
        logger.log("🔄 Triggering session expired callback");
        // Delay slightly to ensure toast is visible
        setTimeout(() => {
          if (onSessionExpired) {
            onSessionExpired();
          }
        }, 100);
      }

      // Throw a user-friendly error (don't expose endpoint)
      throw new Error(
        errorMessage || "Authentication required. Please sign in to continue."
      );
    }

    // For non-auth errors, throw with sanitized message
    const userMessage =
      errorData.error ||
      (response.status >= 500
        ? "Server error. Please try again later."
        : "Request failed. Please try again.");
    throw new Error(userMessage);
  }

  return response.json();
}

// Auth API calls
export async function signUp(
  email: string,
  password: string,
  name?: string,
  honeypot?: string
): Promise<AuthResponse> {
  const data = await apiCall("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name, honeypot }),
  });
  return data;
}

export async function signIn(
  email: string,
  password: string,
  honeypot?: string
): Promise<AuthResponse> {
  const data = await apiCall("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password, honeypot }),
  });

  // Store the access token
  if (data.access_token) {
    setAccessToken(data.access_token);
  }

  return data;
}

export async function sendMagicLink(
  email: string,
  honeypot?: string
): Promise<{ message: string; token?: string }> {
  const data = await apiCall("/auth/magic-link", {
    method: "POST",
    body: JSON.stringify({ email, honeypot }),
  });
  return data;
}

export async function verifyMagicLink(token: string): Promise<AuthResponse> {
  logger.log("Verifying magic link token");
  try {
    const data = await apiCall("/auth/verify-magic-link", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    logger.log("Magic link verification successful");

    // Store the access token
    if (data.access_token) {
      logger.log("Storing access token from magic link verification");
      setAccessToken(data.access_token);

      // Verify it was stored
      const stored = sessionStorage.getItem("wastedb_access_token");
      logger.log("Token stored successfully:", !!stored);
    }

    return data;
  } catch (error) {
    logger.error("Magic link verification failed:", error);
    throw error;
  }
}

export function signOut() {
  clearAccessToken();
}

// Get all materials from Supabase
export async function getAllMaterials(): Promise<Material[]> {
  // suppressAuthToast=true because this is called on page load for all users
  // If unauthenticated, we silently fall back to localStorage in MaterialsContext
  const data = await apiCall("/materials", {}, true);
  return data.materials || [];
}

// Save a single material to Supabase
export async function saveMaterial(material: Material): Promise<Material> {
  const data = await apiCall("/materials", {
    method: "POST",
    body: JSON.stringify(material),
  });
  return data.material;
}

// Batch save materials to Supabase
export async function batchSaveMaterials(materials: Material[]): Promise<void> {
  await apiCall("/materials/batch", {
    method: "POST",
    body: JSON.stringify({ materials }),
  });
}

// Update a material in Supabase
export async function updateMaterial(material: Material): Promise<Material> {
  const data = await apiCall(`/materials/${material.id}`, {
    method: "PUT",
    body: JSON.stringify(material),
  });
  return data.material;
}

// Delete a material from Supabase
export async function deleteMaterial(id: string): Promise<void> {
  await apiCall(`/materials/${id}`, {
    method: "DELETE",
  });
}

// Delete all materials from Supabase
export async function deleteAllMaterials(): Promise<void> {
  await apiCall("/materials", {
    method: "DELETE",
  });
}

// Get current user's role
export async function getUserRole(): Promise<"user" | "admin"> {
  const data = await apiCall("/users/me/role");
  return data.role;
}

// Get all users (admin only)
export async function getAllUsers(): Promise<any[]> {
  const data = await apiCall("/users");
  return data.users || [];
}

// Update user role (admin only)
export async function updateUserRole(
  userId: string,
  role: "user" | "admin"
): Promise<void> {
  await apiCall(`/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

// Delete user (admin only)
export async function deleteUser(userId: string): Promise<void> {
  await apiCall(`/users/${userId}`, {
    method: "DELETE",
  });
}

// Update user details (admin only)
export async function updateUser(
  userId: string,
  updates: {
    name?: string;
    email?: string;
    password?: string;
    active?: boolean;
  }
): Promise<void> {
  await apiCall(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

// ==================== WHITEPAPER API ====================

interface Whitepaper {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

// Get all whitepapers (public, no auth required)
export async function getAllWhitepapers(): Promise<Whitepaper[]> {
  logger.log("Fetching whitepapers from API");
  const response = await fetch(`${API_BASE_URL}/whitepapers`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`, // Required for Supabase edge functions
    },
  });

  logger.log("Whitepaper response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    logger.error("Whitepaper fetch failed:", {
      status: response.status,
      error: errorText,
    });
    throw new Error("Failed to fetch whitepapers");
  }

  const data = await response.json();
  logger.log(
    "Whitepapers fetched successfully:",
    data.whitepapers?.length || 0,
    "whitepapers"
  );
  return data.whitepapers || [];
}

// Get a single whitepaper by slug (public, no auth required)
export async function getWhitepaper(slug: string): Promise<Whitepaper | null> {
  const response = await fetch(`${API_BASE_URL}/whitepapers/${slug}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`, // Required for Supabase edge functions
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch whitepaper");
  }

  const data = await response.json();
  return data.whitepaper;
}

// Save/update a whitepaper (admin only)
export async function saveWhitepaper(whitepaper: {
  slug: string;
  title: string;
  content: string;
}): Promise<Whitepaper> {
  const data = await apiCall("/whitepapers", {
    method: "POST",
    body: JSON.stringify(whitepaper),
  });
  return data.whitepaper;
}

// Delete a whitepaper (admin only)
export async function deleteWhitepaper(slug: string): Promise<void> {
  await apiCall(`/whitepapers/${slug}`, {
    method: "DELETE",
  });
}

// ==================== SOURCE LIBRARY API ====================

export interface Source {
  id: string;
  title: string;
  authors?: string;
  year?: number;
  doi?: string;
  url?: string;
  weight?: number;
  type: "peer-reviewed" | "government" | "industrial" | "ngo" | "internal";
  abstract?: string;
  tags?: string[];
  pdfFileName?: string;
  is_open_access?: boolean; // Open Access status (from Unpaywall API)
  oa_status?: string | null; // OA status: 'gold', 'green', 'hybrid', 'bronze', 'closed'
  best_oa_url?: string | null; // Best OA location URL (if available)
}

// Get all sources (public, no auth required)
export async function getAllSources(): Promise<Source[]> {
  const response = await fetch(`${API_BASE_URL}/sources`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch sources");
  }

  const data = await response.json();
  return data.sources || [];
}

// Create a new source (admin only)
export async function createSource(source: Source): Promise<Source> {
  const data = await apiCall("/sources", {
    method: "POST",
    body: JSON.stringify(source),
  });
  return data.source;
}

// Update a source (admin only)
export async function updateSource(
  id: string,
  source: Source
): Promise<Source> {
  logger.log("📤 updateSource called:", {
    id,
    pdfFileName: source.pdfFileName,
    is_open_access: source.is_open_access,
    manual_oa_override: source.manual_oa_override,
  });
  const data = await apiCall(`/sources/${id}`, {
    method: "PUT",
    body: JSON.stringify(source),
  });
  logger.log("📥 updateSource response:", data);
  return data.source;
}

// Delete a source (admin only)
export async function deleteSource(id: string): Promise<void> {
  await apiCall(`/sources/${id}`, {
    method: "DELETE",
  });
}

// Batch delete ALL sources (admin only)
export async function deleteAllSources(): Promise<{
  success: boolean;
  deletedCount: number;
  deletedIds: string[];
  skippedCount: number;
  skippedIds: string[];
  message: string;
}> {
  const data = await apiCall("/sources/batch-delete-all", {
    method: "DELETE",
  });
  return data;
}

// Remove duplicate sources (admin only) - keeps first occurrence, removes exact title duplicates
export async function removeDuplicateSources(): Promise<{
  success: boolean;
  duplicatesFound: number;
  deletedCount: number;
  deletedIds: string[];
  skippedCount: number;
  skippedIds: string[];
  message: string;
}> {
  const data = await apiCall("/sources/remove-duplicates", {
    method: "DELETE",
  });
  return data;
}

// Batch save sources (admin only)
export async function batchSaveSources(
  sources: Source[]
): Promise<{ success: boolean; count: number }> {
  const data = await apiCall("/sources/batch", {
    method: "POST",
    body: JSON.stringify({ sources }),
  });
  return data;
}

// Search CrossRef for sources by material/topic
export interface CrossRefSearchResult {
  doi: string;
  title: string;
  authors: string[];
  year: number | null;
  journal: string | null;
  abstract: string | null;
  type: string;
}

export async function searchSources(
  query: string,
  rows: number = 10
): Promise<{
  success: boolean;
  query: string;
  total: number;
  results: CrossRefSearchResult[];
}> {
  const response = await fetch(
    `${API_BASE_URL}/sources/search?q=${encodeURIComponent(
      query
    )}&rows=${rows}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to search for sources");
  }

  return await response.json();
}

// Lookup DOI metadata from CrossRef
export interface DOILookupResult {
  doi: string;
  title: string;
  authors: string[];
  year: number | null;
  journal: string | null;
  abstract: string | null;
  type: string;
  publisher: string | null;
  issn: string | null;
  url: string;
}

export async function lookupDOI(doi: string): Promise<{
  success: boolean;
  source: DOILookupResult;
}> {
  const response = await fetch(
    `${API_BASE_URL}/sources/lookup-doi?doi=${encodeURIComponent(doi)}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("DOI not found");
    }
    throw new Error("Failed to lookup DOI");
  }

  return await response.json();
}

// Check Open Access status for a DOI
export async function checkOAStatus(doi: string): Promise<{
  is_open_access: boolean;
  doi: string;
  oa_status?: string | null;
  best_oa_location?: {
    url: string;
    url_for_pdf?: string;
    version?: string;
    license?: string;
  } | null;
  publisher?: string | null;
  journal?: string | null;
  message?: string;
}> {
  const response = await fetch(
    `${API_BASE_URL}/sources/check-oa?doi=${encodeURIComponent(doi)}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to check Open Access status");
  }

  return await response.json();
}

// Check for duplicate sources (public endpoint)
export async function checkSourceDuplicate(params: {
  doi?: string;
  title?: string;
}): Promise<{
  success: boolean;
  isDuplicate: boolean;
  matchType?: "doi" | "title";
  confidence?: number;
  similarity?: number;
  existingSource?: {
    id: string;
    title: string;
    doi?: string;
    year?: number;
    authors?: string[];
  };
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/sources/check-duplicate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to check for duplicates");
  }

  return await response.json();
}

// Merge duplicate sources (admin only)
export async function mergeSources(
  primarySourceId: string,
  duplicateSourceId: string
): Promise<{
  success: boolean;
  primarySource: Source;
  miusMigrated: number;
  message: string;
}> {
  const data = await apiCall("/sources/merge", {
    method: "POST",
    body: JSON.stringify({
      primarySourceId,
      duplicateSourceId,
    }),
  });
  return data;
}

// Upload PDF for a source (admin only)
export async function uploadSourcePdf(
  file: File,
  sourceId: string
): Promise<{ success: boolean; fileName: string }> {
  logger.log(" Starting PDF upload:", {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    sourceId,
  });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("sourceId", sourceId);

  const token = sessionStorage.getItem("wastedb_access_token") || publicAnonKey;
  const isCustomToken = token !== publicAnonKey;

  logger.log("🔐 Auth state for PDF upload:", {
    hasCustomToken: isCustomToken,
    tokenPreview: token.substring(0, 8) + "...",
  });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${publicAnonKey}`, // Always use anon key for Supabase
  };

  // Custom tokens go in X-Session-Token header
  if (isCustomToken) {
    headers["X-Session-Token"] = token;
  }

  const uploadUrl = `${API_BASE_URL}/source-pdfs/upload`;
  logger.log("🌐 Uploading to:", uploadUrl);

  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers,
      body: formData,
    });

    logger.log("📡 Upload response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("❌ Upload failed:", {
        status: response.status,
        statusText: response.statusText,
        responseBody: errorText,
      });

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: "Failed to upload PDF" };
      }

      throw new Error(
        errorData.error || `Upload failed: ${response.statusText}`
      );
    }

    const result = await response.json();
    logger.log("PDF upload successful:", result);
    return result;
  } catch (error) {
    logger.error("PDF upload exception:", error);
    throw error;
  }
}

// Get signed URL for a source PDF (authenticated users)
export async function getSourcePdfUrl(fileName: string): Promise<string> {
  logger.log(" Fetching PDF URL for:", fileName);
  try {
    const data = await apiCall(`/source-pdfs/${fileName}`);
    logger.log("Got signed URL:", data.signedUrl?.substring(0, 50) + "...");
    return data.signedUrl;
  } catch (error) {
    logger.error("Failed to get PDF URL:", error);
    throw error;
  }
}

// Get direct view URL for a source PDF (for use in <a> tags)
// Returns the public Supabase Storage URL (no server endpoint needed since bucket is public)
export function getSourcePdfViewUrl(fileName: string): string {
  const url = `https://${projectId}.supabase.co/storage/v1/object/public/make-17cae920-source-pdfs/${encodeURIComponent(
    fileName
  )}`;
  logger.log(`🔗 Generated PDF view URL for "${fileName}":`, url);
  return url;
}

// Delete a source PDF (admin only)
export async function deleteSourcePdf(fileName: string): Promise<void> {
  await apiCall(`/source-pdfs/${fileName}`, {
    method: "DELETE",
  });
}

// Get diagnostics for a source PDF (debug tool)
export async function getSourcePdfDiagnostics(fileName: string): Promise<any> {
  logger.log(`🔍 Fetching diagnostics for PDF: ${fileName}`);
  try {
    const data = await apiCall(
      `/source-pdfs/${encodeURIComponent(fileName)}/debug`,
      {
        method: "GET",
      }
    );
    logger.log(`Diagnostics received:`, data);
    return data;
  } catch (error) {
    logger.error("Failed to get PDF diagnostics:", error);
    throw error;
  }
}

// ==================== CALCULATION API ====================

export interface CompostabilityParams {
  B?: number; // Biodegradation rate constant (0-1)
  N?: number; // Nutrient balance (0-1)
  T?: number; // Toxicity / Residue index (0-1)
  H?: number; // Habitat adaptability (0-1)
  M?: number; // Maturity - infrastructure (0-1)
  mode?: "theoretical" | "practical";
}

export interface ReusabilityParams {
  L?: number; // Lifetime (0-1)
  R?: number; // Repairability (0-1)
  U?: number; // Upgradability (0-1)
  C?: number; // Contamination susceptibility (0-1)
  M?: number; // Maturity - market infrastructure (0-1)
  mode?: "theoretical" | "practical";
}

export interface CalculationResult {
  mean: number; // 0-1 scale
  public: number; // 0-100 scale
  mode: "theoretical" | "practical";
  weights: Record<string, number>;
  whitepaper_version: string;
  method_version: string;
  calculation_timestamp: string;
}

// Calculate Compostability Index (CC)
export async function calculateCompostability(
  params: CompostabilityParams
): Promise<CalculationResult> {
  const data = await apiCall("/calculate/compostability", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return {
    mean: data.CC_mean,
    public: data.CC_public,
    mode: data.mode,
    weights: data.weights,
    whitepaper_version: data.whitepaper_version,
    method_version: data.method_version,
    calculation_timestamp: data.calculation_timestamp,
  };
}

// Calculate Reusability Index (RU)
export async function calculateReusability(
  params: ReusabilityParams
): Promise<CalculationResult> {
  const data = await apiCall("/calculate/reusability", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return {
    mean: data.RU_mean,
    public: data.RU_public,
    mode: data.mode,
    weights: data.weights,
    whitepaper_version: data.whitepaper_version,
    method_version: data.method_version,
    calculation_timestamp: data.calculation_timestamp,
  };
}

// Calculate all three dimensions (CR, CC, RU)
export async function calculateAllDimensions(params: any): Promise<any> {
  const data = await apiCall("/calculate/all-dimensions", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data;
}

// ==================== PHASE 6: CONTENT MANAGEMENT API ====================

// ===== USER PROFILES =====

export async function getUserProfile(userId: string): Promise<any> {
  const data = await apiCall(`/profile/${userId}`);
  return data.profile;
}

export async function updateUserProfile(
  userId: string,
  updates: {
    bio?: string;
    social_link?: string;
    avatar_url?: string;
  }
): Promise<any> {
  const data = await apiCall(`/profile/${userId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return data.profile;
}

// ===== ARTICLES =====

export async function getArticles(params?: {
  status?: string;
  material_id?: string;
}): Promise<any[]> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.material_id)
    queryParams.append("material_id", params.material_id);

  const url = `/articles${
    queryParams.toString() ? "?" + queryParams.toString() : ""
  }`;
  const data = await apiCall(url);
  return data.articles;
}

export async function getArticle(id: string): Promise<any> {
  const data = await apiCall(`/articles/${id}`);
  return data.article;
}

export async function createArticle(article: {
  title: string;
  slug: string;
  content_markdown: string;
  category: "composting" | "recycling" | "reuse";
  material_id: string;
}): Promise<any> {
  const data = await apiCall("/articles", {
    method: "POST",
    body: JSON.stringify(article),
  });
  return data.article;
}

export async function updateArticle(id: string, updates: any): Promise<any> {
  const data = await apiCall(`/articles/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return data.article;
}

export async function deleteArticle(id: string): Promise<void> {
  await apiCall(`/articles/${id}`, {
    method: "DELETE",
  });
}

// ===== SUBMISSIONS =====

export async function getSubmissions(status?: string): Promise<any[]> {
  const url = status ? `/submissions?status=${status}` : "/submissions";
  const data = await apiCall(url);
  return data.submissions;
}

export async function getMySubmissions(): Promise<any[]> {
  const data = await apiCall("/submissions/my");
  return data.submissions;
}

export async function createSubmission(submission: {
  type:
    | "new_material"
    | "edit_material"
    | "new_article"
    | "update_article"
    | "delete_material"
    | "delete_article";
  content_data: any;
  original_content_id?: string;
}): Promise<any> {
  const data = await apiCall("/submissions", {
    method: "POST",
    body: JSON.stringify(submission),
  });
  return data.submission;
}

export async function updateSubmission(
  id: string,
  updates: {
    status?: string;
    feedback?: string;
    reviewed_by?: string;
  }
): Promise<any> {
  const data = await apiCall(`/submissions/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return data.submission;
}

export async function deleteSubmission(id: string): Promise<void> {
  await apiCall(`/submissions/${id}`, {
    method: "DELETE",
  });
}

// ===== NOTIFICATIONS =====

export async function createNotification(params: {
  user_id: string;
  type:
    | "submission_approved"
    | "feedback_received"
    | "new_review_item"
    | "article_published"
    | "content_flagged";
  content_id?: string;
  content_type?: "material" | "article" | "submission";
  message: string;
}): Promise<any> {
  const data = await apiCall("/notifications", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data.notification;
}

export async function getNotifications(userId: string): Promise<any[]> {
  try {
    const data = await apiCall(`/notifications/${userId}`);
    return data.notifications;
  } catch (error) {
    // Notifications are non-critical - fail silently without triggering session expiry
    // Return empty array instead of throwing
    return [];
  }
}

export async function markNotificationAsRead(id: string): Promise<any> {
  try {
    const data = await apiCall(`/notifications/${id}/read`, {
      method: "PUT",
    });
    return data.notification;
  } catch (error) {
    // Fail silently for non-critical notification operations
    return null;
  }
}

export async function markAllNotificationsAsRead(
  userId: string
): Promise<void> {
  await apiCall(`/notifications/${userId}/read-all`, {
    method: "PUT",
  });
}

// ===== EMAIL NOTIFICATIONS =====

export async function sendEmail(params: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}): Promise<{ success: boolean; emailId: string }> {
  const data = await apiCall("/email/send", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data;
}

export async function sendRevisionRequestEmail(params: {
  submissionId: string;
  feedback: string;
  submitterEmail: string;
  submitterName?: string;
  submissionType: string;
}): Promise<{ success: boolean; emailId: string }> {
  const data = await apiCall("/email/revision-request", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data;
}

export async function sendApprovalEmail(params: {
  submitterEmail: string;
  submitterName?: string;
  submissionType: string;
  contentName?: string;
}): Promise<{ success: boolean; emailId: string }> {
  const data = await apiCall("/email/approval", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data;
}

export async function sendRejectionEmail(params: {
  submitterEmail: string;
  submitterName?: string;
  submissionType: string;
  feedback?: string;
}): Promise<{ success: boolean; emailId: string }> {
  const data = await apiCall("/email/rejection", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return data;
}
