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

// Helper function to make API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API call failed: ${response.statusText}`);
  }

  return response.json();
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
