'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/hooks/use-i18n';
import { Sparkles } from 'lucide-react';

interface AdPlaceholderProps {
  variant?: 'banner' | 'inline' | 'sidebar';
}

export function AdPlaceholder({ variant = 'inline' }: AdPlaceholderProps) {
  const { locale } = useI18n();

  const variants = {
    banner: 'h-24 w-full',
    inline: 'h-32 w-full',
    sidebar: 'h-64 w-full'
  };

  return (
    <Card className={`${variants[variant]} border-dashed border-2 border-muted/50 bg-muted/20 flex items-center justify-center`}>
      <CardContent className="p-4 text-center">
        <Sparkles className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          {locale === 'de' 
            ? 'Werbung' 
            : 'Advertisement'
          }
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {locale === 'de'
            ? 'Upgrade für werbefreie Nutzung'
            : 'Upgrade for ad-free experience'
          }
        </p>
      </CardContent>
    </Card>
  );
}

