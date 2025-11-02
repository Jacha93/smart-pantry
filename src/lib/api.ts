import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
};

// Groceries API
export const groceriesAPI = {
  getAll: () => api.get('/groceries'),
  create: (data: any) => api.post('/groceries', data),
  update: (id: number, data: any) => api.put(`/groceries/${id}`, data),
  delete: (id: number) => api.delete(`/groceries/${id}`),
};

// Shopping Lists API
export const shoppingListsAPI = {
  getAll: () => api.get('/shopping-lists'),
  create: (data: any) => api.post('/shopping-lists', data),
  generate: () => api.post('/shopping-lists/generate'),
  getById: (id: number) => api.get(`/shopping-lists/${id}`),
  update: (id: number, data: any) => api.put(`/shopping-lists/${id}`, data),
  delete: (id: number) => api.delete(`/shopping-lists/${id}`),
  complete: (id: number) => api.post(`/shopping-lists/${id}/complete`),
  addItem: (listId: number, data: any) => api.post(`/shopping-lists/${listId}/items`, data),
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
};
