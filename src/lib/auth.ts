import { authAPI } from './api';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './storage-keys';

// Auth ist nur disabled, wenn explizit auf 'true' gesetzt
// In Development ist Auth standardmäßig aktiviert, außer explizit deaktiviert
const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === 'true';

const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
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
        console.log('[Auth] Access token stored successfully');
      } else {
        console.error('[Auth] No access_token in login response');
      }
      
      if (refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
        console.log('[Auth] Refresh token stored successfully');
      } else {
        console.warn('[Auth] No refresh_token in login response');
      }
      
      // Verifiziere, dass Token korrekt gespeichert wurden
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (storedToken !== access_token) {
        console.error('[Auth] Token storage verification failed!', {
          expected: access_token?.substring(0, 10) + '...',
          stored: storedToken?.substring(0, 10) + '...',
        });
      }
      
      dispatchAuthChange();
      console.log('[Auth] Login successful, authchange event dispatched');
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
    console.log('[Auth] Logout initiated');
    
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    
    // Lösche Token SOFORT (synchron)
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    
    // Verifiziere, dass Token gelöscht sind
    const tokenStillExists = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshTokenStillExists = localStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (tokenStillExists || refreshTokenStillExists) {
      console.error('[Auth] Token still exists after removal! Force removing...');
      // Force remove - mehrfach versuchen
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    
    // Verifiziere erneut
    const finalCheck = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (finalCheck) {
      console.error('[Auth] CRITICAL: Token still exists after force removal!');
      // Letzter Versuch mit clear
      localStorage.clear();
      // Setze nur die Token-Keys zurück (falls andere Daten wichtig sind)
      // localStorage wird komplett geleert, was in diesem Fall akzeptabel ist
    }
    
    console.log('[Auth] Tokens removed, isAuthenticated:', auth.isAuthenticated());
    
    // API-Logout (async, aber nicht blockierend)
    if (!AUTH_DISABLED && !USE_MOCK_AUTH && refreshToken) {
      try {
        await authAPI.logout(refreshToken);
      } catch (error) {
        console.warn('[Auth] Logout API Fehler:', error);
        // Ignoriere Fehler, Token sind bereits gelöscht
      }
    }
    
    // Dispatch Event NACH Token-Löschung mit kleiner Verzögerung für React State-Updates
    // Verwende setTimeout, damit React State-Updates Zeit haben
    setTimeout(() => {
      dispatchAuthChange();
      console.log('[Auth] Logout complete, authchange event dispatched');
      
      // Zusätzlich: Dispatch storage event für Cross-Tab-Synchronisation
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new StorageEvent('storage', {
          key: ACCESS_TOKEN_KEY,
          oldValue: accessToken,
          newValue: null,
          storageArea: localStorage,
        }));
      }
    }, 50);
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
    
    // Prüfe Token-Existenz
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      return false;
    }
    
    // Prüfe Token-Format (sollte nicht leer sein)
    if (token.trim() === '' || token === 'null' || token === 'undefined') {
      console.warn('[Auth] Invalid token format detected, clearing...');
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return false;
    }
    
    // Für Mock-Auth: Token-Existenz reicht
    if (USE_MOCK_AUTH) {
      return true;
    }
    
    // Für echte Auth: Token-Existenz reicht (Gültigkeit wird vom Backend geprüft)
    return true;
  },

  clearAuth: () => {
    console.log('[Auth] Clearing all auth data...');
    
    // Lösche ALLE Token
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    
    // Lösche ALLE möglichen Auth-Keys (für Sicherheit)
    const authKeys = ['token', 'refresh_token', 'access_token', 'auth_token'];
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Verifiziere, dass alles gelöscht ist
    const remainingTokens = authKeys.filter(key => 
      localStorage.getItem(key) || sessionStorage.getItem(key)
    );
    
    if (remainingTokens.length > 0) {
      console.error('[Auth] Some tokens still exist after clear!', remainingTokens);
      // Force clear - nur Auth-bezogene Keys
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    }
    
    // Dispatch Events
    dispatchAuthChange();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new StorageEvent('storage', {
        key: ACCESS_TOKEN_KEY,
        oldValue: null,
        newValue: null,
        storageArea: localStorage,
      }));
    }
    
    console.log('[Auth] Auth data cleared');
  },
};

// Debug-Tools für Console
if (typeof window !== 'undefined') {
  (window as any).debugAuth = () => {
    console.log('=== AUTH DEBUG ===');
    console.log('isAuthenticated:', auth.isAuthenticated());
    console.log('hasToken:', !!auth.getToken());
    console.log('hasRefreshToken:', !!auth.getRefreshToken());
    console.log('token:', auth.getToken() ? `${auth.getToken()?.substring(0, 20)}...` : 'none');
    console.log('authDisabled:', authDisabled);
    console.log('localStorage token:', localStorage.getItem(ACCESS_TOKEN_KEY));
    console.log('localStorage refresh:', localStorage.getItem(REFRESH_TOKEN_KEY));
    console.log('==================');
  };
  
  (window as any).clearAuth = () => {
    console.log('Clearing auth...');
    auth.clearAuth();
    window.location.href = '/';
  };
}

