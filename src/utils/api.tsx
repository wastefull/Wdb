import { projectId, publicAnonKey } from './supabase/info';
import { logger } from './logger';
import { toast } from 'sonner@2.0.3';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-17cae920`;
logger.log('🔧 API_BASE_URL initialized:', API_BASE_URL);

// Session expiry callback - will be set by AuthContext
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredCallback(callback: () => void) {
  onSessionExpired = callback;
}

interface Material {
  id: string;
  name: string;
  category: string;
  compostability: number;
  recyclability: number;
  reusability: number;
  description?: string;
  articles: {
    compostability: any[];
    recyclability: any[];
    reusability: any[];
  };
  
  // ========== RECYCLABILITY (CR-v1) ==========
  Y_value?: number;  // Yield (recovery rate)
  D_value?: number;  // Degradation (quality loss)
  C_value?: number;  // Contamination tolerance
  M_value?: number;  // Maturity (infrastructure availability) - shared across all dimensions
  E_value?: number;  // Energy demand (normalized)
  
  // Calculated composite recyclability scores
  CR_practical_mean?: number;      // Practical recyclability (0-1)
  CR_theoretical_mean?: number;    // Theoretical recyclability (0-1)
  CR_practical_CI95?: {            // 95% confidence interval
    lower: number;
    upper: number;
  };
  CR_theoretical_CI95?: {
    lower: number;
    upper: number;
  };
  
  // ========== COMPOSTABILITY (CC-v1) ==========
  B_value?: number;  // Biodegradation rate constant
  N_value?: number;  // Nutrient balance
  T_value?: number;  // Toxicity / Residue index
  H_value?: number;  // Habitat adaptability
  
  CC_practical_mean?: number;
  CC_theoretical_mean?: number;
  CC_practical_CI95?: {
    lower: number;
    upper: number;
  };
  CC_theoretical_CI95?: {
    lower: number;
    upper: number;
  };
  
  // ========== REUSABILITY (RU-v1) ==========
  L_value?: number;  // Lifetime
  R_value?: number;  // Repairability
  U_value?: number;  // Upgradability
  C_RU_value?: number;  // Contamination susceptibility (renamed to avoid conflict)
  
  RU_practical_mean?: number;
  RU_theoretical_mean?: number;
  RU_practical_CI95?: {
    lower: number;
    upper: number;
  };
  RU_theoretical_CI95?: {
    lower: number;
    upper: number;
  };
  
  // Confidence and provenance
  confidence_level?: 'High' | 'Medium' | 'Low';  // Based on data quality
  sources?: Array<{                               // Citation metadata
    title: string;
    authors?: string;
    year?: number;
    doi?: string;
    url?: string;
    weight?: number;  // Source weight in aggregation
  }>;
  
  // Versioning and audit trail
  whitepaper_version?: string;      // e.g., "2025.1"
  calculation_timestamp?: string;   // ISO 8601 timestamp
  method_version?: string;           // e.g., "CR-v1"
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
  const token = sessionStorage.getItem('wastedb_access_token') || publicAnonKey;
  logger.log('getAccessToken called, returning:', token === publicAnonKey ? '(anon key)' : '(authenticated token)');
  return token;
}

// Store access token in session storage
export function setAccessToken(token: string) {
  logger.log('setAccessToken called - storing authenticated token');
  sessionStorage.setItem('wastedb_access_token', token);
  logger.log('Token stored in sessionStorage successfully');
}

// Clear access token from session storage
export function clearAccessToken() {
  sessionStorage.removeItem('wastedb_access_token');
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const token = sessionStorage.getItem('wastedb_access_token');
  return token !== null && token !== publicAnonKey;
}

// Helper function to make API calls
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  const isCustomToken = token !== publicAnonKey;
  
  logger.log('🌐 API Call:', {
    endpoint,
    method: options.method || 'GET',
    authType: isCustomToken ? 'authenticated' : 'anonymous',
  });
  
  // For custom session tokens, use X-Session-Token header
  // For anon key, use Authorization header
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,  // Always use anon key for Supabase
      ...(isCustomToken ? { 'X-Session-Token': token } : {}),  // Custom tokens go in X-Session-Token
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    logger.error('API call failed:', {
      endpoint,
      status: response.status,
      statusText: response.statusText,
      error: errorData.error || 'Unknown error',
    });
    
    // If we get a 401 and it's not a signin/signup request, handle session expiry
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      logger.warn('Session expired - clearing authentication');
      clearAccessToken();
      sessionStorage.removeItem('wastedb_user');
      
      // Show toast notification for session expiry
      const errorMessage = errorData.error || '';
      if (errorMessage.includes('expired') || errorMessage.includes('Unauthorized')) {
        toast.error('Your session has expired. Please sign in again.');
      }
      
      // Trigger the session expired callback (redirects to sign-in)
      if (onSessionExpired) {
        onSessionExpired();
      }
    }
    
    throw new Error(errorData.error || `API call failed: ${response.statusText}`);
  }

  return response.json();
}

// Auth API calls
export async function signUp(email: string, password: string, name?: string, honeypot?: string): Promise<AuthResponse> {
  const data = await apiCall('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, honeypot }),
  });
  return data;
}

export async function signIn(email: string, password: string, honeypot?: string): Promise<AuthResponse> {
  const data = await apiCall('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password, honeypot }),
  });
  
  // Store the access token
  if (data.access_token) {
    setAccessToken(data.access_token);
  }
  
  return data;
}

import { projectId, publicAnonKey } from './supabase/info';

export async function sendMagicLink(email: string, honeypot?: string): Promise<{ message: string; token?: string }> {
  const data = await apiCall('/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email, honeypot }),
  });
  return data;
}

export async function verifyMagicLink(token: string): Promise<AuthResponse> {
  logger.log('Verifying magic link token');
  try {
    const data = await apiCall('/auth/verify-magic-link', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    logger.log('Magic link verification successful');
    
    // Store the access token
    if (data.access_token) {
      logger.log('Storing access token from magic link verification');
      setAccessToken(data.access_token);
      
      // Verify it was stored
      const stored = sessionStorage.getItem('wastedb_access_token');
      logger.log('Token stored successfully:', !!stored);
    }
    
    return data;
  } catch (error) {
    logger.error('Magic link verification failed:', error);
    throw error;
  }
}

export function signOut() {
  clearAccessToken();
}

// Get all materials from Supabase
export async function getAllMaterials(): Promise<Material[]> {
  const data = await apiCall('/materials');
  return data.materials || [];
}

// Save a single material to Supabase
export async function saveMaterial(material: Material): Promise<Material> {
  const data = await apiCall('/materials', {
    method: 'POST',
    body: JSON.stringify(material),
  });
  return data.material;
}

// Batch save materials to Supabase
export async function batchSaveMaterials(materials: Material[]): Promise<void> {
  await apiCall('/materials/batch', {
    method: 'POST',
    body: JSON.stringify({ materials }),
  });
}

// Update a material in Supabase
export async function updateMaterial(material: Material): Promise<Material> {
  const data = await apiCall(`/materials/${material.id}`, {
    method: 'PUT',
    body: JSON.stringify(material),
  });
  return data.material;
}

// Delete a material from Supabase
export async function deleteMaterial(id: string): Promise<void> {
  await apiCall(`/materials/${id}`, {
    method: 'DELETE',
  });
}

// Delete all materials from Supabase
export async function deleteAllMaterials(): Promise<void> {
  await apiCall('/materials', {
    method: 'DELETE',
  });
}

// Get current user's role
export async function getUserRole(): Promise<'user' | 'admin'> {
  const data = await apiCall('/users/me/role');
  return data.role;
}

// Get all users (admin only)
export async function getAllUsers(): Promise<any[]> {
  const data = await apiCall('/users');
  return data.users || [];
}

// Update user role (admin only)
export async function updateUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
  await apiCall(`/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

// Delete user (admin only)
export async function deleteUser(userId: string): Promise<void> {
  await apiCall(`/users/${userId}`, {
    method: 'DELETE',
  });
}

// Update user details (admin only)
export async function updateUser(userId: string, updates: { name?: string; email?: string; password?: string }): Promise<void> {
  await apiCall(`/users/${userId}`, {
    method: 'PUT',
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
  logger.log('Fetching whitepapers from API');
  const response = await fetch(`${API_BASE_URL}/whitepapers`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`, // Required for Supabase edge functions
    },
  });
  
  logger.log('Whitepaper response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Whitepaper fetch failed:', {
      status: response.status,
      error: errorText,
    });
    throw new Error('Failed to fetch whitepapers');
  }
  
  const data = await response.json();
  logger.log('Whitepapers fetched successfully:', data.whitepapers?.length || 0, 'whitepapers');
  return data.whitepapers || [];
}

// Get a single whitepaper by slug (public, no auth required)
export async function getWhitepaper(slug: string): Promise<Whitepaper | null> {
  const response = await fetch(`${API_BASE_URL}/whitepapers/${slug}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`, // Required for Supabase edge functions
    },
  });
  
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    throw new Error('Failed to fetch whitepaper');
  }
  
  const data = await response.json();
  return data.whitepaper;
}

// Save/update a whitepaper (admin only)
export async function saveWhitepaper(whitepaper: { slug: string; title: string; content: string }): Promise<Whitepaper> {
  const data = await apiCall('/whitepapers', {
    method: 'POST',
    body: JSON.stringify(whitepaper),
  });
  return data.whitepaper;
}

// Delete a whitepaper (admin only)
export async function deleteWhitepaper(slug: string): Promise<void> {
  await apiCall(`/whitepapers/${slug}`, {
    method: 'DELETE',
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
  type: 'peer-reviewed' | 'government' | 'industrial' | 'ngo' | 'internal';
  abstract?: string;
  tags?: string[];
}

// Get all sources (public, no auth required)
export async function getAllSources(): Promise<Source[]> {
  const response = await fetch(`${API_BASE_URL}/sources`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch sources');
  }
  
  const data = await response.json();
  return data.sources || [];
}

// Create a new source (admin only)
export async function createSource(source: Source): Promise<Source> {
  const data = await apiCall('/sources', {
    method: 'POST',
    body: JSON.stringify(source),
  });
  return data.source;
}

// Update a source (admin only)
export async function updateSource(id: string, source: Source): Promise<Source> {
  const data = await apiCall(`/sources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(source),
  });
  return data.source;
}

// Delete a source (admin only)
export async function deleteSource(id: string): Promise<void> {
  await apiCall(`/sources/${id}`, {
    method: 'DELETE',
  });
}

// Batch save sources (admin only)
export async function batchSaveSources(sources: Source[]): Promise<void> {
  await apiCall('/sources/batch', {
    method: 'POST',
    body: JSON.stringify({ sources }),
  });
}

// ==================== CALCULATION API ====================

export interface CompostabilityParams {
  B?: number;  // Biodegradation rate constant (0-1)
  N?: number;  // Nutrient balance (0-1)
  T?: number;  // Toxicity / Residue index (0-1)
  H?: number;  // Habitat adaptability (0-1)
  M?: number;  // Maturity - infrastructure (0-1)
  mode?: 'theoretical' | 'practical';
}

export interface ReusabilityParams {
  L?: number;  // Lifetime (0-1)
  R?: number;  // Repairability (0-1)
  U?: number;  // Upgradability (0-1)
  C?: number;  // Contamination susceptibility (0-1)
  M?: number;  // Maturity - market infrastructure (0-1)
  mode?: 'theoretical' | 'practical';
}

export interface CalculationResult {
  mean: number;  // 0-1 scale
  public: number;  // 0-100 scale
  mode: 'theoretical' | 'practical';
  weights: Record<string, number>;
  whitepaper_version: string;
  method_version: string;
  calculation_timestamp: string;
}

// Calculate Compostability Index (CC)
export async function calculateCompostability(params: CompostabilityParams): Promise<CalculationResult> {
  const data = await apiCall('/calculate/compostability', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return {
    mean: data.CC_mean,
    public: data.CC_public,
    mode: data.mode,
    weights: data.weights,
    whitepaper_version: data.whitepaper_version,
    method_version: data.method_version,
    calculation_timestamp: data.calculation_timestamp
  };
}

// Calculate Reusability Index (RU)
export async function calculateReusability(params: ReusabilityParams): Promise<CalculationResult> {
  const data = await apiCall('/calculate/reusability', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return {
    mean: data.RU_mean,
    public: data.RU_public,
    mode: data.mode,
    weights: data.weights,
    whitepaper_version: data.whitepaper_version,
    method_version: data.method_version,
    calculation_timestamp: data.calculation_timestamp
  };
}

// Calculate all three dimensions (CR, CC, RU)
export async function calculateAllDimensions(params: any): Promise<any> {
  const data = await apiCall('/calculate/all-dimensions', {
    method: 'POST',
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

export async function updateUserProfile(userId: string, updates: {
  bio?: string;
  social_link?: string;
  avatar_url?: string;
}): Promise<any> {
  const data = await apiCall(`/profile/${userId}`, {
    method: 'PUT',
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
  if (params?.status) queryParams.append('status', params.status);
  if (params?.material_id) queryParams.append('material_id', params.material_id);
  
  const url = `/articles${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
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
  category: 'composting' | 'recycling' | 'reuse';
  material_id: string;
}): Promise<any> {
  const data = await apiCall('/articles', {
    method: 'POST',
    body: JSON.stringify(article),
  });
  return data.article;
}

export async function updateArticle(id: string, updates: any): Promise<any> {
  const data = await apiCall(`/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return data.article;
}

export async function deleteArticle(id: string): Promise<void> {
  await apiCall(`/articles/${id}`, {
    method: 'DELETE',
  });
}

// ===== SUBMISSIONS =====

export async function getSubmissions(status?: string): Promise<any[]> {
  const url = status ? `/submissions?status=${status}` : '/submissions';
  const data = await apiCall(url);
  return data.submissions;
}

export async function getMySubmissions(): Promise<any[]> {
  const data = await apiCall('/submissions/my');
  return data.submissions;
}

export async function createSubmission(submission: {
  type: 'new_material' | 'edit_material' | 'new_article' | 'update_article' | 'delete_material' | 'delete_article';
  content_data: any;
  original_content_id?: string;
}): Promise<any> {
  const data = await apiCall('/submissions', {
    method: 'POST',
    body: JSON.stringify(submission),
  });
  return data.submission;
}

export async function updateSubmission(id: string, updates: {
  status?: string;
  feedback?: string;
  reviewed_by?: string;
}): Promise<any> {
  const data = await apiCall(`/submissions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return data.submission;
}

export async function deleteSubmission(id: string): Promise<void> {
  await apiCall(`/submissions/${id}`, {
    method: 'DELETE',
  });
}

// ===== NOTIFICATIONS =====

export async function getNotifications(userId: string): Promise<any[]> {
  const data = await apiCall(`/notifications/${userId}`);
  return data.notifications;
}

export async function markNotificationAsRead(id: string): Promise<any> {
  const data = await apiCall(`/notifications/${id}/read`, {
    method: 'PUT',
  });
  return data.notification;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await apiCall(`/notifications/${userId}/read-all`, {
    method: 'PUT',
  });
}

// ===== EMAIL NOTIFICATIONS =====

export async function sendEmail(params: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}): Promise<{ success: boolean; emailId: string }> {
  const data = await apiCall('/email/send', {
    method: 'POST',
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
  const data = await apiCall('/email/revision-request', {
    method: 'POST',
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
  const data = await apiCall('/email/approval', {
    method: 'POST',
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
  const data = await apiCall('/email/rejection', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return data;
}