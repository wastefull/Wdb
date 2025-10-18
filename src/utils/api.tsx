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
    throw new Error(errorData.error || `API call failed: ${response.statusText}`);
  }

  return response.json();
}

// Auth API calls
export async function signUp(email: string, password: string, name?: string): Promise<AuthResponse> {
  try {
    const data = await apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    return data;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const data = await apiCall('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store the access token
    if (data.access_token) {
      setAccessToken(data.access_token);
    }
    
    return data;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

export function signOut() {
  clearAccessToken();
}

// Get all materials from Supabase
export async function getAllMaterials(): Promise<Material[]> {
  try {
    const data = await apiCall('/materials');
    return data.materials || [];
  } catch (error) {
    console.error('Error fetching materials from Supabase:', error);
    throw error;
  }
}

// Save a single material to Supabase
export async function saveMaterial(material: Material): Promise<Material> {
  try {
    const data = await apiCall('/materials', {
      method: 'POST',
      body: JSON.stringify(material),
    });
    return data.material;
  } catch (error) {
    console.error('Error saving material to Supabase:', error);
    throw error;
  }
}

// Batch save materials to Supabase
export async function batchSaveMaterials(materials: Material[]): Promise<void> {
  try {
    await apiCall('/materials/batch', {
      method: 'POST',
      body: JSON.stringify({ materials }),
    });
  } catch (error) {
    console.error('Error batch saving materials to Supabase:', error);
    throw error;
  }
}

// Update a material in Supabase
export async function updateMaterial(material: Material): Promise<Material> {
  try {
    const data = await apiCall(`/materials/${material.id}`, {
      method: 'PUT',
      body: JSON.stringify(material),
    });
    return data.material;
  } catch (error) {
    console.error('Error updating material in Supabase:', error);
    throw error;
  }
}

// Delete a material from Supabase
export async function deleteMaterial(id: string): Promise<void> {
  try {
    await apiCall(`/materials/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting material from Supabase:', error);
    throw error;
  }
}

// Delete all materials from Supabase
export async function deleteAllMaterials(): Promise<void> {
  try {
    await apiCall('/materials', {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting all materials from Supabase:', error);
    throw error;
  }
}

// Get current user's role
export async function getUserRole(): Promise<'user' | 'admin'> {
  try {
    const data = await apiCall('/users/me/role');
    return data.role;
  } catch (error) {
    console.error('Error getting user role:', error);
    throw error;
  }
}

// Get all users (admin only)
export async function getAllUsers(): Promise<any[]> {
  try {
    const data = await apiCall('/users');
    return data.users || [];
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

// Update user role (admin only)
export async function updateUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
  try {
    await apiCall(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

// Delete user (admin only)
export async function deleteUser(userId: string): Promise<void> {
  try {
    await apiCall(`/users/${userId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Update user details (admin only)
export async function updateUser(userId: string, updates: { name?: string; email?: string; password?: string }): Promise<void> {
  try {
    await apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}