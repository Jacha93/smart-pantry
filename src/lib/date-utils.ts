import { Locale } from '@/lib/i18n';

/**
 * Berechnet das nächste Reset-Datum basierend auf dem aktuellen Reset-Datum
 * @param resetDate Das aktuelle Reset-Datum
 * @param intervalMs Das Intervall in Millisekunden (z.B. 30 Tage = 30 * 24 * 60 * 60 * 1000)
 * @returns Das nächste Reset-Datum
 */
export function getNextResetDate(resetDate: Date | string, intervalMs: number): Date {
  const date = typeof resetDate === 'string' ? new Date(resetDate) : resetDate;
  const now = new Date();
  
  // Wenn das Reset-Datum in der Zukunft liegt, verwende es
  if (date > now) {
    return date;
  }
  
  // Berechne das nächste Reset-Datum
  let nextReset = new Date(date);
  while (nextReset <= now) {
    nextReset = new Date(nextReset.getTime() + intervalMs);
  }
  
  return nextReset;
}

/**
 * Formatiert ein Datum entsprechend der Locale
 * @param date Das zu formatierende Datum
 * @param locale Die Locale ('de' oder 'en')
 * @returns Formatierter Datums-String
 */
export function formatDate(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return locale === 'de' ? 'Ungültiges Datum' : 'Invalid Date';
  }
  
  if (locale === 'de') {
    // DE: "03.12.2025"
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } else {
    // EN: "December 3, 2025"
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}

/**
 * Formatiert ein Datum für Quota-Resets (monatlich)
 * Berechnet automatisch das nächste Reset-Datum
 * @param resetDate Das aktuelle Reset-Datum
 * @param locale Die Locale
 * @returns Formatierter Datums-String mit dem nächsten Reset-Datum
 */
export function formatResetDate(resetDate: Date | string, locale: Locale): string {
  // Monatliches Reset = 30 Tage
  const MONTHLY_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;
  const nextReset = getNextResetDate(resetDate, MONTHLY_INTERVAL_MS);
  return formatDate(nextReset, locale);
}

