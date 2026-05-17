'use client';

import { useEffect, useState } from 'react';
import { i18n, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

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
    if (value === locale) return;
    i18n.setLocale(value);
    setLocale(value);
  };

  if (!mounted) {
    return (
      <div className="inline-flex h-10 w-[84px] rounded-md border border-white/12 bg-white/[0.035]" aria-hidden="true" />
    );
  }

  const options: Array<{ value: Locale; label: string; ariaLabel: string }> = [
    { value: 'de', label: 'DE', ariaLabel: 'Deutsch' },
    { value: 'en', label: 'EN', ariaLabel: 'English' },
  ];

  return (
    <div
      className="inline-flex h-10 items-center gap-1 rounded-md border border-white/12 bg-white/[0.035] p-1"
      role="group"
      aria-label="Language"
      onClickCapture={(event) => {
        const target = event.target as HTMLElement;
        const button = target.closest<HTMLButtonElement>('button[data-locale]');
        const nextLocale = button?.dataset.locale as Locale | undefined;
        if (nextLocale) {
          handleChange(nextLocale);
        }
      }}
    >
      {options.map((option, index) => {
        const isActive = locale === option.value;
        return (
          <button
            key={option.value}
            type="button"
            data-locale={option.value}
            aria-label={option.ariaLabel}
            aria-pressed={isActive}
            onClick={() => handleChange(option.value)}
            onPointerDown={() => handleChange(option.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleChange(option.value);
              }
            }}
            className={cn(
              'h-8 rounded px-2.5 text-sm font-semibold transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a10dfd]/60',
              isActive
                ? 'border border-[#a10dfd]/55 bg-[#a10dfd]/22 text-[#f1d9ff] shadow-[0_0_18px_rgba(161,13,253,0.28)]'
                : 'border border-transparent text-muted-foreground hover:bg-white/[0.06] hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
