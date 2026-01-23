'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { i18n, type Locale } from '@/lib/i18n';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LanguageSwitcher() {
  const [locale, setLocale] = useState<Locale>(i18n.getLocale());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleLocaleChange = () => {
      setLocale(i18n.getLocale());
    };
    window.addEventListener('localechange', handleLocaleChange);
    return () => window.removeEventListener('localechange', handleLocaleChange);
  }, []);

  const handleChange = (value: Locale) => {
    i18n.setLocale(value);
    setLocale(value);
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Globe className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px] rounded-full border-[#a10dfd]/20 hover:border-[#a10dfd]/40 hover:bg-[#a10dfd]/10 transition-all duration-300">
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue>
          {locale === 'en' ? 'English' : 'Deutsch'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="z-[100]">
        <SelectItem value="en">🇬🇧 English</SelectItem>
        <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
      </SelectContent>
    </Select>
  );
}

