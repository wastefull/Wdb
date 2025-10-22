import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-17cae920`;
console.log('🔧 API_BASE_URL initialized:', API_BASE_URL);

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
  
  // Scientific parameters (normalized 0-1)
  Y_value?: number;  // Yield (recovery rate)
  D_value?: number;  // Degradation (quality loss)
  C_value?: number;  // Contamination tolerance
  M_value?: number;  // Maturity (infrastructure availability)
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
  console.log('getAccessToken called, returning:', token.substring(0, 8) + '...', token === publicAnonKey ? '(anon key)' : '(custom token)');
  return token;
}

// Store access token in session storage
export function setAccessToken(token: string) {
  console.log('setAccessToken called with:', token.substring(0, 8) + '...');
  sessionStorage.setItem('wastedb_access_token', token);
  console.log('Token stored in sessionStorage, verifying:', sessionStorage.getItem('wastedb_access_token')?.substring(0, 8) + '...');
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
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log('🌐 apiCall - Full URL:', fullUrl);
  console.log('🌐 apiCall - Method:', options.method || 'GET');
  console.log('🌐 apiCall - Token:', token.substring(0, 8) + '...');
  
  // For custom session tokens, use X-Session-Token header
  // For anon key, use Authorization header
  const isCustomToken = token !== publicAnonKey;
  
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
    
    // If we get a 401 and it's not a signin/signup request, clear the stale token
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      clearAccessToken();
      sessionStorage.removeItem('wastedb_user');
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
  console.log('Calling verify-magic-link API with token:', token);
  try {
    const data = await apiCall('/auth/verify-magic-link', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    console.log('Verify-magic-link API response:', data);
    
    // Store the access token
    if (data.access_token) {
      console.log('Storing access token from verification:', data.access_token);
      setAccessToken(data.access_token);
      
      // Verify it was stored
      const stored = sessionStorage.getItem('wastedb_access_token');
      console.log('Token stored successfully?', stored === data.access_token, 'stored:', stored?.substring(0, 8) + '...');
    }
    
    return data;
  } catch (error) {
    console.error('Verify-magic-link API error:', error);
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
  console.log('Fetching whitepapers from:', `${API_BASE_URL}/whitepapers`);
  const response = await fetch(`${API_BASE_URL}/whitepapers`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`, // Required for Supabase edge functions
    },
  });
  
  console.log('Whitepaper response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Whitepaper fetch failed:', errorText);
    throw new Error('Failed to fetch whitepapers');
  }
  
  const data = await response.json();
  console.log('Whitepapers data:', data);
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