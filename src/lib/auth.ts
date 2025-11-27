import { authAPI } from './api';

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
  token_type: string;
}

export const auth = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    if (AUTH_DISABLED) {
      const placeholder = 'demo-token';
      localStorage.setItem('token', placeholder);
      // Dispatch custom event für Auth-Status-Update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('authchange'));
      }
      return { access_token: placeholder, token_type: 'bearer' };
    }
    const response = await authAPI.login(email, password);
    const { access_token, token_type } = response.data;
    
    localStorage.setItem('token', access_token);
    // Dispatch custom event für Auth-Status-Update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('authchange'));
    }
    return { access_token, token_type };
  },

  register: async (email: string, password: string, name: string): Promise<User> => {
    const response = await authAPI.register(email, password, name);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    // Dispatch custom event für Auth-Status-Update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('authchange'));
    }
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  isAuthenticated: (): boolean => {
    if (AUTH_DISABLED) return true;
    return !!localStorage.getItem('token');
  },
};
