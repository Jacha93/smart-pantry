import { authAPI } from './api';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './storage-keys';

const AUTH_DISABLED =
  process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true' ||
  (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_AUTH_DISABLED !== 'false');

export const authDisabled = AUTH_DISABLED;

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

export const auth = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    if (AUTH_DISABLED) {
      const placeholder = 'demo-token';
      localStorage.setItem(ACCESS_TOKEN_KEY, placeholder);
      // Dispatch custom event für Auth-Status-Update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('authchange'));
      }
      return { access_token: placeholder, token_type: 'bearer' };
    }
    const response = await authAPI.login(email, password);
    const { access_token, refresh_token, token_type } = response.data;
    
    localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    if (refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
    }
    // Dispatch custom event für Auth-Status-Update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('authchange'));
    }
    return { access_token, refresh_token, token_type };
  },

  register: async (email: string, password: string, name: string): Promise<User> => {
    const response = await authAPI.register(email, password, name);
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    if (!AUTH_DISABLED && refreshToken) {
      try {
        await authAPI.logout(refreshToken);
      } catch (error) {
        console.warn('Logout API Fehler:', error);
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('authchange'));
    }
  },

  getToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  refresh: async (): Promise<AuthResponse | null> => {
    if (AUTH_DISABLED) return null;
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;
    try {
      const response = await authAPI.refresh(refreshToken);
      const { access_token, refresh_token, token_type } = response.data;
      localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
      if (refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('authchange'));
      }
      return { access_token, refresh_token, token_type };
    } catch (error) {
      console.error('Token Refresh Error:', error);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    if (AUTH_DISABLED) return true;
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },
};
