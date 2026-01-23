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
  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    // If not mounted yet, always use English to match server render
    if (!mounted) {
      const translation = translations[key];
      if (!translation) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
      let text = translation.en;
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          text = text.replace(`{${paramKey}}`, String(paramValue));
        });
      }
      return text;
    }
    // Use current locale from state
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    let text = translation[currentLocale] || translation.en;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(`{${paramKey}}`, String(paramValue));
      });
    }
    return text;
  }, [mounted, currentLocale]);

  return {
    t,
    locale: currentLocale,
  };
}

