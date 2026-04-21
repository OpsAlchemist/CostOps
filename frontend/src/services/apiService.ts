const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Example for handling persistent auth tokens if needed
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const apiService = {
  getStats: async () => {
    const res = await fetch(`${BASE_URL}/stats`, { 
      headers: getHeaders() 
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },
  
  getRecommendations: async () => {
    const res = await fetch(`${BASE_URL}/recommendations`, { 
      headers: getHeaders() 
    });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },
  
  getHistory: async () => {
    const res = await fetch(`${BASE_URL}/history`, { 
      headers: getHeaders() 
    });
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  updateProfile: async (data: { name: string; company: string; email: string; bio: string }) => {
    const res = await fetch(`${BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update profile');
    }
    return res.json();
  },

  connectCloud: async (data: { cloud_provider: string; access_key_id: string; secret_access_key: string }) => {
    const res = await fetch(`${BASE_URL}/user/connect-cloud`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to connect cloud account');
    }
    return res.json();
  },
};
