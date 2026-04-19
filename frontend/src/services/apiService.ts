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
  }
};
