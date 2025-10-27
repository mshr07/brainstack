export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: number;
  name: string;
  description?: string;
  amount: string;
  date: string;
  category?: number | null;
  category_name: string;
  user: number;
  user_username: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface ExpenseFilters {
  search?: string;
  category?: number;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
}