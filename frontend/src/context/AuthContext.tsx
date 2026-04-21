import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface User {
  user_id: number;
  role: string;
  username?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, name: string, email: string) => Promise<void>;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  authFetch: async () => new Response(),
});

function decodeToken(token: string): User | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return {
      user_id: decoded.user_id,
      role: decoded.role,
      username: decoded.username,
    };
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    if (!decoded.exp) return false;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('auth_token');
    if (token && !isTokenExpired(token)) {
      return decodeToken(token);
    }
    return null;
  });

  const isAuthenticated = user !== null;
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token && isTokenExpired(token)) {
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || data.message || 'Login failed');
    }

    const data = await res.json();
    const token = data.access_token || data.token;
    if (!token) {
      throw new Error('No token received');
    }

    localStorage.setItem('auth_token', token);
    setUser(decodeToken(token));
  }, [BASE_URL]);

  const signup = useCallback(async (username: string, password: string, name: string, email: string) => {
    const res = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, name, email }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || data.message || 'Signup failed');
    }

    const data = await res.json();
    const token = data.access_token || data.token;
    if (!token) {
      throw new Error('No token received');
    }

    localStorage.setItem('auth_token', token);
    setUser(decodeToken(token));
  }, [BASE_URL]);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
  }, []);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers = new Headers(options.headers || {});

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      localStorage.removeItem('auth_token');
      setUser(null);
    }

    return res;
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, signup, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
