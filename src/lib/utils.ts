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
    // Prüfe sowohl window.crypto als auch global crypto
    const cryptoObj = typeof window !== 'undefined' ? window.crypto : (typeof crypto !== 'undefined' ? crypto : null);
    if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
      try {
        const uuid = cryptoObj.randomUUID();
        // Validiere dass es ein gültiges UUID-Format ist
        if (uuid && typeof uuid === 'string' && uuid.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) {
          return uuid;
        }
      } catch (e) {
        // Falls crypto.randomUUID einen Fehler wirft, verwende Fallback
        console.warn('crypto.randomUUID() threw error, using fallback:', e);
      }
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
