import axios, { AxiosRequestConfig } from 'axios';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './storage-keys';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

declare global {
  interface Window {
    __ENV?: {
      NEXT_PUBLIC_API_URL?: string;
    };
  }
}

// Backend URL für Server-Side Requests (SSR)
// In Docker: NEXT_INTERNAL_API_URL ist hardcoded auf http://smart-pantry-backend:3001
// Lokal: Fallback auf localhost:3001
const SERVER_BASE_URL =
  process.env.NEXT_INTERNAL_API_URL ||
  process.env.API_INTERNAL_URL ||
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:3001';

// API Base URL - wird dynamisch zur Laufzeit berechnet
// WICHTIG: NEXT_PUBLIC_* Variablen werden zur Build-Zeit kompiliert, daher müssen wir
// zur Laufzeit den Port dynamisch aus window.location ableiten
const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Client-seitig immer über Next.js Proxy laufen
    return '/api';
  }
  // Server-side: Präferiere interne URL (Docker / SSR)
  return SERVER_BASE_URL;
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
  const token = getStoredToken(ACCESS_TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log requests for debugging (especially auth endpoints)
  if (config.url?.includes('/auth/register') || config.url?.includes('/auth/login')) {
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasData: !!config.data,
      dataKeys: config.data ? Object.keys(config.data) : [],
    });
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
  if (!refreshToken) return null;
  const response = await authlessApi.post('/auth/refresh', {
    refresh_token: refreshToken,
  });
  const { access_token, refresh_token } = response.data;
  setStoredToken(ACCESS_TOKEN_KEY, access_token);
  if (refresh_token) {
    setStoredToken(REFRESH_TOKEN_KEY, refresh_token);
  }
  return access_token;
};

// Track adblocker detection
let adBlockerDetected = false;
export const setAdBlockerDetected = (detected: boolean) => {
  adBlockerDetected = detected;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('adblocker-detected', { detail: detected }));
  }
};

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
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
      originalRequest._retry = true;
      const refreshToken = getStoredToken(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
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
          removeStoredToken(ACCESS_TOKEN_KEY);
          removeStoredToken(REFRESH_TOKEN_KEY);
          redirectToLogin();
          return Promise.reject(error);
        }
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        onRefreshed(null);
        removeStoredToken(ACCESS_TOKEN_KEY);
        removeStoredToken(REFRESH_TOKEN_KEY);
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401) {
      removeStoredToken(ACCESS_TOKEN_KEY);
      removeStoredToken(REFRESH_TOKEN_KEY);
      redirectToLogin();
    }

    // Log all errors for debugging (especially registration/login failures)
    if (url.includes('/auth/register') || url.includes('/auth/login')) {
      console.error('Auth API Error:', {
        url,
        status,
        message: error.message,
        response: error.response?.data,
        code: error.code,
        request: error.request ? 'Request exists' : 'No request',
      });
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refresh_token: refreshToken }),
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

// Chat API
export const chatAPI = {
  sendMessage: (message: string, context: string, isAuthenticated: boolean = false) =>
    api.post('/chat/message', { message, context, is_authenticated: isAuthenticated }),
  createIssue: (title: string, body: string, labels: string[] = [], isAuthenticated: boolean = false) =>
    api.post('/chat/create-issue', { title, body, labels, is_authenticated: isAuthenticated }),
};

