import { authAPI } from './api';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './storage-keys';

const AUTH_DISABLED =
  process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true' ||
  (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_AUTH_DISABLED !== 'false');

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';
const MOCK_USERS_KEY = 'smart-pantry:mock-users';
const MOCK_ID_COUNTER_KEY = 'smart-pantry:mock-user-id';
const MOCK_ACCESS_TOKEN = 'mock-access-token';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token';

type MockUserRecord = {
  id: number;
  email: string;
  name: string;
  password: string;
  created_at: string;
};

const normalizeEmail = (email: string) => String(email).trim().toLowerCase();

const safelyReadLocalStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Failed to read localStorage key ${key}:`, error);
    return fallback;
  }
};

const writeLocalStorage = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to write localStorage key ${key}:`, error);
  }
};

const readMockUsers = (): MockUserRecord[] => safelyReadLocalStorage(MOCK_USERS_KEY, []);

const writeMockUsers = (users: MockUserRecord[]) => writeLocalStorage(MOCK_USERS_KEY, users);

const nextMockUserId = (): number => {
  if (typeof window === 'undefined') {
    return Date.now();
  }
  const current = safelyReadLocalStorage<number | null>(MOCK_ID_COUNTER_KEY, null);
  const next = current && Number.isFinite(current) ? current + 1 : 1;
  writeLocalStorage(MOCK_ID_COUNTER_KEY, next);
  return next;
};

const dispatchAuthChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('authchange'));
  }
};

const createMockError = (message: string, detail?: string) => {
  const error = new Error(message);
  Object.assign(error, {
    response: detail
      ? {
          data: { detail },
        }
      : undefined,
  });
  return error;
};

const loginWithMockAuth = (email: string, password: string): AuthResponse => {
  if (typeof window === 'undefined') {
    throw new Error('Mock authentication ist im SSR-Kontext nicht verfügbar.');
  }
  const users = readMockUsers();
  const user = users.find((entry) => normalizeEmail(entry.email) === normalizeEmail(email));
  if (!user || user.password !== password) {
    throw createMockError('Invalid credentials', 'Invalid credentials');
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, MOCK_ACCESS_TOKEN);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, MOCK_REFRESH_TOKEN);
  dispatchAuthChange();
  return { access_token: MOCK_ACCESS_TOKEN, refresh_token: MOCK_REFRESH_TOKEN, token_type: 'bearer' };
};

const registerWithMockAuth = (email: string, password: string, name: string): User => {
  if (typeof window === 'undefined') {
    throw new Error('Mock authentication ist im SSR-Kontext nicht verfügbar.');
  }
  const normalizedEmail = normalizeEmail(email);
  const users = readMockUsers();
  if (users.some((entry) => normalizeEmail(entry.email) === normalizedEmail)) {
    throw createMockError('User already exists', 'User already exists');
  }

  const newUser: MockUserRecord = {
    id: nextMockUserId(),
    email: normalizedEmail,
    name: String(name).trim() || normalizedEmail,
    password,
    created_at: new Date().toISOString(),
  };
  const updatedUsers = [...users, newUser];
  writeMockUsers(updatedUsers);
  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    created_at: newUser.created_at,
  };
};

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
      dispatchAuthChange();
      return { access_token: placeholder, token_type: 'bearer' };
    }

    if (USE_MOCK_AUTH) {
      return loginWithMockAuth(email, password);
    }

    // Lösche alte Token vor dem Login (falls vorhanden)
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    try {
      const response = await authAPI.login(email, password);
      
      // Prüfe ob die Response gültig ist
      if (!response || !response.data || !response.data.access_token) {
        throw new Error('Invalid login response: missing access_token');
      }
      
      const { access_token, refresh_token, token_type } = response.data;

      // Speichere Token nur wenn sie vorhanden sind
      if (access_token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
      }
      if (refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
      }
      
      dispatchAuthChange();
      return { access_token, refresh_token, token_type };
    } catch (error: any) {
      // Stelle sicher, dass Token gelöscht sind bei Fehler
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      dispatchAuthChange();
      throw error;
    }
  },

  register: async (email: string, password: string, name: string): Promise<User> => {
    if (AUTH_DISABLED || USE_MOCK_AUTH) {
      return registerWithMockAuth(email, password, name);
    }

    try {
      const response = await authAPI.register(email, password, name);
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      throw error;
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    if (!AUTH_DISABLED && !USE_MOCK_AUTH && refreshToken) {
      try {
        await authAPI.logout(refreshToken);
      } catch (error) {
        console.warn('Logout API Fehler:', error);
      }
    }
    dispatchAuthChange();
  },

  getToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  refresh: async (): Promise<AuthResponse | null> => {
    if (AUTH_DISABLED || USE_MOCK_AUTH) return null;

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;
    try {
      const response = await authAPI.refresh(refreshToken);
      const { access_token, refresh_token, token_type } = response.data;
      localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
      if (refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
      }
      dispatchAuthChange();
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
    if (USE_MOCK_AUTH) {
      return !!localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },
};

