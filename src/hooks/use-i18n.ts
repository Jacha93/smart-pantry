'use client';

import { useState, useEffect, useCallback } from 'react';
import { i18n, type Locale, translations } from '@/lib/i18n';

export function useI18n() {
  // Start with 'en' on both server and client to avoid hydration mismatch
  const [locale, setLocale] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only after mount, read from localStorage
    setMounted(true);
    const savedLocale = i18n.getLocale();
    setLocale(savedLocale);
    
    const handleLocaleChange = () => {
      const newLocale = i18n.getLocale();
      setLocale(newLocale);
    };
    window.addEventListener('localechange', handleLocaleChange);
    return () => window.removeEventListener('localechange', handleLocaleChange);
  }, []);

  // Use saved locale only after mount, otherwise use 'en' to match server
  const currentLocale = mounted ? locale : 'en';

  // Memoize the translation function to ensure it uses the latest locale
  const t = useCallback((key: string) => {
    // If not mounted yet, always use English to match server render
    if (!mounted) {
      const translation = translations[key];
      if (!translation) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
      return translation.en;
    }
    // Use current locale from state
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[currentLocale] || translation.en;
  }, [mounted, currentLocale]);

  return {
    t,
    locale: currentLocale,
  };
}

