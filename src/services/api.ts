import axios from 'axios';
import { User, Expense, ExpenseCategory, LoginCredentials, RegisterData, AuthResponse, ExpenseFilters } from '../types';

const API_BASE_URL = 'http://localhost:8001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenManager = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          tokenManager.setToken(access);
          
          return api(originalRequest);
        } catch (refreshError) {
          tokenManager.clearTokens();
          window.location.href = '/login';
        }
      } else {
        tokenManager.clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login/', credentials);
    const { access, refresh, user } = response.data;
    tokenManager.setToken(access);
    tokenManager.setRefreshToken(refresh);
    return { access, refresh, user };
  },

  register: async (userData: RegisterData): Promise<User> => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  logout: () => {
    tokenManager.clearTokens();
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async (): Promise<ExpenseCategory[]> => {
    const response = await api.get('/categories/');
    return response.data;
  },

  create: async (categoryData: Omit<ExpenseCategory, 'id' | 'created_at' | 'updated_at'>): Promise<ExpenseCategory> => {
    const response = await api.post('/categories/', categoryData);
    return response.data;
  },

  update: async (id: number, categoryData: Partial<ExpenseCategory>): Promise<ExpenseCategory> => {
    const response = await api.put(`/categories/${id}/`, categoryData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}/`);
  },
};

// Expenses API
export const expensesAPI = {
  getAll: async (filters?: ExpenseFilters): Promise<Expense[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category.toString());
    if (filters?.sort_by) params.append('ordering', filters.sort_by);
    
    const response = await api.get(`/expenses/?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<Expense> => {
    const response = await api.get(`/expenses/${id}/`);
    return response.data;
  },

  create: async (expenseData: {
    name: string;
    description?: string;
    amount: string;
    date: string;
    category?: number;
  }): Promise<Expense> => {
    const response = await api.post('/expenses/', expenseData);
    return response.data;
  },

  update: async (id: number, expenseData: {
    name?: string;
    description?: string;
    amount?: string;
    date?: string;
    category?: number;
  }): Promise<Expense> => {
    const response = await api.put(`/expenses/${id}/`, expenseData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/expenses/${id}/`);
  },

  getHistory: async (filters?: ExpenseFilters): Promise<Expense[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category.toString());
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    
    const response = await api.get(`/expenses/history/?${params.toString()}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/expenses/stats/');
    return response.data;
  },
};

export default api;