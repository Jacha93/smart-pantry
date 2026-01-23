import axios, { AxiosRequestConfig } from 'axios';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './storage-keys';
import { auth } from './auth';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

// API Base URL - Vite Proxy
// Alle Requests gehen über /api, das vom Vite Dev-Server zum Backend proxiert wird
const getApiBaseUrl = (): string => {
  return '/api';
};

const getStoredToken = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
};

const setStoredToken = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
};

const removeStoredToken = (key: string) => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
};

const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
};

// API Instanzen - baseURL wird dynamisch bei jedem Request berechnet
export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  // Deaktiviere automatisches Caching für GET-Requests
  // Axios sendet sonst automatisch If-None-Match Header
  validateStatus: (status) => status < 500, // Akzeptiere alle Status außer 5xx
});

const authlessApi = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor um baseURL dynamisch zu aktualisieren (falls sich Port ändert)
api.interceptors.request.use((config) => {
  // Aktualisiere baseURL bei jedem Request zur Laufzeit
  config.baseURL = getApiBaseUrl();
  return config;
});

authlessApi.interceptors.request.use((config) => {
  // Aktualisiere baseURL bei jedem Request zur Laufzeit
  config.baseURL = getApiBaseUrl();
  return config;
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  // Aktualisiere baseURL bei jedem Request zur Laufzeit
  config.baseURL = getApiBaseUrl();
  
  // Token IMMER neu aus localStorage lesen (nicht cached)
  const token = getStoredToken(ACCESS_TOKEN_KEY);
  
  // Stelle sicher, dass headers existiert
  if (!config.headers) {
    config.headers = {};
  }
  
  // Setze Authorization-Header wenn Token vorhanden
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Entferne Authorization-Header wenn kein Token vorhanden
    delete config.headers.Authorization;
  }
  
  // Erweiterte Debug-Logs NUR in Development
  // In Production: Keine Token-Informationen loggen
  const isAuthEndpoint = config.url?.includes('/auth/');
  const hasToken = !!token;
  
  if (import.meta.env.DEV) {
    // In Development: Detaillierte Logs (aber ohne Token-Preview)
    if (isAuthEndpoint) {
      console.log('[API Request]', {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        hasAuthHeader: !!config.headers.Authorization,
        hasData: !!config.data,
        dataKeys: config.data ? Object.keys(config.data) : [],
      });
    }
  }
  
  // Warnung wenn Token fehlt bei geschützten Endpoints (nur in DEV)
  if (import.meta.env.DEV && !hasToken && !isAuthEndpoint && config.url && !config.url.includes('/auth/')) {
    console.warn('[API Request] Missing token for protected endpoint:', config.url);
  }
  
  return config;
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const subscribeTokenRefresh = (callback: (token: string | null) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getStoredToken(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    console.warn('[Token Refresh] No refresh token available');
    return null;
  }
  
  console.log('[Token Refresh] Attempting to refresh access token...');
  
  try {
    const response = await authlessApi.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    
    const { access_token, refresh_token } = response.data;
    
    if (!access_token) {
      console.error('[Token Refresh] No access_token in response');
      return null;
    }
    
    setStoredToken(ACCESS_TOKEN_KEY, access_token);
    if (refresh_token) {
      setStoredToken(REFRESH_TOKEN_KEY, refresh_token);
    }
    
    // Setze Authorization-Header sofort für zukünftige Requests
    api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
    
    console.log('[Token Refresh] Successfully refreshed access token');
    return access_token;
  } catch (error: any) {
    console.error('[Token Refresh] Failed to refresh token:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return null;
  }
};

// Track adblocker detection
let adBlockerDetected = false;
export const setAdBlockerDetected = (detected: boolean) => {
  adBlockerDetected = detected;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('adblocker-detected', { detail: detected }));
  }
};

// Handle empty responses and normalize data
api.interceptors.response.use(
  (response) => {
    const url = response.config?.url || '';
    const isArrayEndpoint = url.includes('/groceries') || 
                            url.includes('/shopping-lists') ||
                            url.includes('/recipes');
    
    // Log successful responses in dev mode
    if (import.meta.env.DEV && !url.includes('/auth/')) {
      console.log('[API Response]', {
        url,
        status: response.status,
        hasData: !!response.data,
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      });
    }
    
    // Wenn response.data leer ist (leerer String), aber Content-Type JSON ist,
    // normalisiere zu leeren Array/Objekt basierend auf URL
    if (response.data === '' && response.headers['content-type']?.includes('application/json')) {
      response.data = isArrayEndpoint ? [] : {};
    }
    
    // Wenn response.data ein leeres Objekt {} ist, aber es ein Array-Endpunkt ist,
    // konvertiere zu leeren Array (z.B. bei 304 Not Modified)
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data) && 
        Object.keys(response.data).length === 0 && isArrayEndpoint) {
      response.data = [];
    }
    
    return response;
  },
  async (error) => {
    // Detect ERR_BLOCKED_BY_CLIENT (adblocker blocking requests)
    if (error.message?.includes('ERR_BLOCKED_BY_CLIENT') || 
        error.code === 'ERR_BLOCKED_BY_CLIENT' ||
        (error.response === undefined && error.request && error.message?.includes('blocked')) ||
        (error.message?.includes('Failed to fetch') && error.request === undefined)) {
      console.log('AdBlocker detected via API error:', error.message);
      setAdBlockerDetected(true);
    }
    const status = error.response?.status;
    const originalRequest = error.config;
    const url = originalRequest?.url || '';

    if (status === 402 && !url.includes('/chat/')) {
      return Promise.reject(error);
    }

    if (
      status === 401 &&
      !originalRequest?._retry &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/register') &&
      !url.includes('/auth/refresh')
    ) {
      console.log('[401 Handler] Unauthorized request detected:', {
        url,
        method: originalRequest?.method,
        hasRetryFlag: originalRequest?._retry,
      });
      
      originalRequest._retry = true;
      const refreshToken = getStoredToken(REFRESH_TOKEN_KEY);
      const currentToken = getStoredToken(ACCESS_TOKEN_KEY);
      
      // Token-Informationen nur in Development loggen
      if (import.meta.env.DEV) {
        console.log('[401 Handler] Token state:', {
          hasAccessToken: !!currentToken,
          hasRefreshToken: !!refreshToken,
        });
      }
      
      if (!refreshToken) {
        console.warn('[401 Handler] No refresh token available, redirecting to login');
        removeStoredToken(ACCESS_TOKEN_KEY);
        removeStoredToken(REFRESH_TOKEN_KEY);
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (!token) {
              reject(error);
            } else {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        onRefreshed(newToken);
        if (!newToken) {
          console.error('[401 Handler] Token refresh failed, clearing auth and redirecting to login');
          // Verwende clearAuth für vollständige Bereinigung
          auth.clearAuth();
          redirectToLogin();
          return Promise.reject(error);
        }
        
        // Setze Authorization-Header für den retry-Request
        if (!originalRequest.headers) {
          originalRequest.headers = {};
        }
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        console.log('[401 Handler] Retrying request with new token:', originalRequest.url);
        return api(originalRequest);
      } catch (refreshError) {
        console.error('[401 Handler] Token refresh error:', refreshError);
        onRefreshed(null);
        // Verwende clearAuth für vollständige Bereinigung
        auth.clearAuth();
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 401 for auth endpoints (login/register) - don't redirect, just reject
    if (status === 401) {
      console.error('[API] 401 Unauthorized detected:', {
        url,
        method: originalRequest?.method,
        isAuthEndpoint: url.includes('/auth/'),
      });
      
      // Für Login/Register: Nicht redirecten, nur Token löschen und Fehler zurückgeben
      if (url.includes('/auth/login') || url.includes('/auth/register')) {
        // Bei Login/Register-Fehlern: Token löschen (falls vorhanden) aber nicht redirecten
        // Der Login-Handler zeigt bereits eine Fehlermeldung
        removeStoredToken(ACCESS_TOKEN_KEY);
        removeStoredToken(REFRESH_TOKEN_KEY);
      } else {
        // Für alle anderen Endpunkte: Token löschen und redirecten
        console.error('[API] 401 on protected endpoint, clearing auth and redirecting');
        removeStoredToken(ACCESS_TOKEN_KEY);
        removeStoredToken(REFRESH_TOKEN_KEY);
        
        // Dispatch authchange event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('authchange'));
        }
        
        // Redirect zu Landing Page
        redirectToLogin();
      }
    }

    // Erweiterte Error-Logs für alle Fehler
    if (import.meta.env.DEV || url.includes('/auth/')) {
      console.error('[API Error]', {
        url,
        method: originalRequest?.method,
        status,
        message: error.message,
        response: error.response?.data,
        code: error.code,
        hasRequest: !!error.request,
        hasResponse: !!error.response,
        hasToken: !!getStoredToken(ACCESS_TOKEN_KEY),
        baseURL: originalRequest?.baseURL,
      });
    }

    return Promise.reject(error);
  }
);

// Auth API - Verwende authlessApi für Login/Register, da noch kein Token vorhanden ist
export const authAPI = {
  login: (email: string, password: string) => {
    console.log('[authAPI] Login request:', { email });
    return authlessApi.post('/auth/login', { email, password });
  },
  register: (email: string, password: string, name: string) => {
    console.log('[authAPI] Register request:', { email, name });
    return authlessApi.post('/auth/register', { email, password, name });
  },
  refresh: (refreshToken: string) => {
    console.log('[authAPI] Refresh request');
    return authlessApi.post('/auth/refresh', { refresh_token: refreshToken });
  },
  logout: (refreshToken: string) => {
    console.log('[authAPI] Logout request');
    // Für Logout können wir api verwenden, da wir bereits eingeloggt sind
    return api.post('/auth/logout', { refresh_token: refreshToken });
  },
};

interface GroceryData {
  name: string;
  quantity: number;
  unit: string;
  expiry_date?: string;
}

interface ShoppingListData {
  name: string;
  items?: Array<{ name: string; quantity: number; unit: string }>;
}

interface ShoppingListItemData {
  grocery_name: string;
  quantity: number;
  unit?: string;
}

// Groceries API
export const groceriesAPI = {
  getAll: () => api.get('/groceries'),
  create: (data: GroceryData) => api.post('/groceries', data),
  update: (id: number, data: GroceryData) => api.put(`/groceries/${id}`, data),
  delete: (id: number) => api.delete(`/groceries/${id}`),
};

// User Profile API
export const profileAPI = {
  get: () => api.get('/me'),
  update: (data: { fullName?: string; username?: string | null; email?: string }) => api.put('/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/me/password', { currentPassword, newPassword }),
  getUsage: () => api.get('/me/usage'),
  exportData: () => api.get('/me/export-data', { responseType: 'blob' }),
  deleteAccount: () => api.delete('/me'),
};

// Admin API
export const adminAPI = {
  switchUser: (userId: number) => api.post('/admin/switch', { userId }),
  getUsers: () => api.get('/admin/users'),
};

// Shopping Lists API
export const shoppingListsAPI = {
  getAll: () => api.get('/shopping-lists'),
  create: (data: ShoppingListData) => api.post('/shopping-lists', data),
  generate: () => api.post('/shopping-lists/generate'),
  getById: (id: number) => api.get(`/shopping-lists/${id}`),
  update: (id: number, data: ShoppingListData) => api.put(`/shopping-lists/${id}`, data),
  delete: (id: number) => api.delete(`/shopping-lists/${id}`),
  complete: (id: number) => api.post(`/shopping-lists/${id}/complete`),
  addItem: (listId: number, data: ShoppingListItemData) => api.post(`/shopping-lists/${listId}/items`, data),
  toggleItem: (listId: number, itemId: number) =>
    api.put(`/shopping-lists/${listId}/items/${itemId}/toggle`),
};

// Photo Recognition API
export const photoRecognitionAPI = {
  analyzeFridge: (formData: FormData) => 
    api.post('/photo-recognition/analyze-fridge', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  addRecognizedGroceries: (foodItems: string[]) =>
    api.post('/photo-recognition/add-recognized-groceries', { food_items: foodItems }),
  getRecipeDetails: (recipeId: number) =>
    api.get(`/photo-recognition/recipe-details/${recipeId}`),
  markRecipeAsCooked: (recipeId: number, recipeTitle: string, rating?: number) =>
    api.post('/photo-recognition/cooked-recipe', { recipe_id: recipeId, recipe_title: recipeTitle, rating }),
  getCookedRecipes: () =>
    api.get('/photo-recognition/cooked-recipes'),
  getSavedRecipes: () =>
    api.get('/recipes'),
  deleteRecipe: (id: number) =>
    api.delete(`/recipes/${id}`),
  translateInstructions: (text: string, targetLanguage: string) =>
    api.post('/photo-recognition/translate-instructions', { text, targetLanguage }),
  translateIngredients: (ingredients: Array<string | { name: string; amount?: number; unit?: string }>, targetLanguage: string) =>
    api.post('/photo-recognition/translate-ingredients', { ingredients, targetLanguage }),
  translateTitle: (title: string, targetLanguage: string) =>
    api.post('/photo-recognition/translate-title', { title, targetLanguage }),
};

// Recipes API
export const recipesAPI = {
  suggestFromInventory: () =>
    api.post('/recipes/suggest-from-inventory'),
};

// Chat API
export const chatAPI = {
  sendMessage: (message: string, context: string, isAuthenticated: boolean = false) =>
    api.post('/chat/message', { message, context, is_authenticated: isAuthenticated }),
  createIssue: (title: string, body: string, labels: string[] = [], isAuthenticated: boolean = false) =>
    api.post('/chat/create-issue', { title, body, labels, is_authenticated: isAuthenticated }),
};

