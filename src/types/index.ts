export interface ApiError {
  response?: {
    data?: {
      detail?: string | string[] | { message?: string; msg?: string };
    };
  };
  message?: string;
}

export interface Grocery {
  id: number;
  user_id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date?: string;
  added_date: string;
  low_stock_threshold: number;
}

export interface GroceryCreate {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date?: string;
  low_stock_threshold: number;
}

export interface ShoppingListItem {
  id: number;
  list_id: number;
  grocery_name: string;
  quantity: number;
  checked: boolean;
}

export interface ShoppingList {
  id: number;
  user_id: number;
  name?: string;
  created_at: string;
  completed: boolean;
  items: ShoppingListItem[];
}

export interface ShoppingListCreate {
  items: Omit<ShoppingListItem, 'id' | 'list_id' | 'checked'>[];
}

export const GROCERY_CATEGORIES = [
  'Dairy',
  'Produce',
  'Meat',
  'Bakery',
  'Pantry',
  'Frozen',
  'Beverages',
  'Snacks',
  'Other'
] as const;

export const UNITS = [
  'pcs',
  'kg',
  'g',
  'l',
  'ml',
  'oz',
  'lb',
  'box',
  'pack',
  'bottle',
  'can',
  'bag'
] as const;
