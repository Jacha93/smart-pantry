import { authAPI } from './api';

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
    const response = await authAPI.login(email, password);
    const { access_token, token_type } = response.data;
    
    localStorage.setItem('token', access_token);
    return { access_token, token_type };
  },

  register: async (email: string, password: string, name: string): Promise<User> => {
    const response = await authAPI.register(email, password, name);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};
