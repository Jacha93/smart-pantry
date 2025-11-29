import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a UUID v4. Uses crypto.randomUUID() if available,
 * otherwise falls back to a manual implementation.
 */
export function generateUUID(): string {
  try {
    // Check if crypto.randomUUID is available and callable
    if (typeof crypto !== 'undefined' && 
        typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (error) {
    // If crypto.randomUUID throws an error, fall back to manual implementation
    console.warn('crypto.randomUUID() not available, using fallback:', error);
  }
  
  // Fallback for browsers that don't support crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
