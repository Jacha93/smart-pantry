'use client';

import { FridgePhotoAnalyzer } from '@/components/fridge-photo-analyzer';
import { useI18n } from '@/hooks/use-i18n';

export default function FridgeAnalyzerPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('fridge.title')}</h1>
        <p className="text-muted-foreground">
          {t('fridge.subtitle')}
        </p>
      </div>
      <FridgePhotoAnalyzer />
    </div>
  );
}
