import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-17cae920`;

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
  return sessionStorage.getItem('wastedb_access_token') || publicAnonKey;
}

// Store access token in session storage
export function setAccessToken(token: string) {
  sessionStorage.setItem('wastedb_access_token', token);
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
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
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
export async function signUp(email: string, password: string, name?: string): Promise<AuthResponse> {
  const data = await apiCall('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  return data;
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const data = await apiCall('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  // Store the access token
  if (data.access_token) {
    setAccessToken(data.access_token);
  }
  
  return data;
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