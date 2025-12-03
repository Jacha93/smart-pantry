'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';
import { Infinity } from 'lucide-react';
import { formatResetDate } from '@/lib/date-utils';

interface UsageOverviewProps {
  usage: any;
  quotas: any;
}

export function UsageOverview({ usage, quotas }: UsageOverviewProps) {
  const { t, locale } = useI18n();

  // Prüfe ob usage gültig ist und die erwartete Struktur hat
  if (!usage || typeof usage !== 'object' || !usage.llmTokens) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">{t('profile.usage.loading') || 'Loading usage data...'}</p>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'destructive';
    if (percent >= 70) return 'default';
    return 'default';
  };

  const usageItems = [
    {
      key: 'llmTokens',
      label: t('profile.usage.llmTokens'),
      used: usage.llmTokens?.used || 0,
      total: usage.llmTokens?.total || 0,
      percent: usage.llmTokens?.percent || 0,
      unlimited: false,
    },
    {
      key: 'recipeCalls',
      label: t('profile.usage.recipeCalls'),
      used: usage.recipeCalls?.used || 0,
      total: usage.recipeCalls?.total || 0,
      percent: usage.recipeCalls?.percent || 0,
      unlimited: false,
    },
    {
      key: 'cacheSuggestions',
      label: t('profile.usage.cacheSuggestions'),
      used: usage.cacheSuggestions?.used || 0,
      total: usage.cacheSuggestions?.total || 0,
      percent: usage.cacheSuggestions?.percent || 0,
      unlimited: usage.cacheSuggestions?.unlimited || false,
    },
    {
      key: 'chatMessages',
      label: t('profile.usage.chatMessages'),
      used: usage.chatMessages?.used || 0,
      total: usage.chatMessages?.total || 0,
      percent: usage.chatMessages?.percent || 0,
      unlimited: false,
    },
    {
      key: 'cacheSearch',
      label: t('profile.usage.cacheSearch'),
      used: usage.cacheSearch?.used || 0,
      total: usage.cacheSearch?.total || 0,
      percent: usage.cacheSearch?.percent || 0,
      unlimited: false,
    },
    {
      key: 'groceriesTotal',
      label: t('profile.usage.groceriesTotal'),
      used: usage.groceriesTotal?.used || 0,
      total: usage.groceriesTotal?.total || 0,
      percent: usage.groceriesTotal?.percent || 0,
      unlimited: usage.groceriesTotal?.unlimited || false,
    },
    {
      key: 'groceriesWithExpiry',
      label: t('profile.usage.groceriesWithExpiry'),
      used: usage.groceriesWithExpiry?.used || 0,
      total: usage.groceriesWithExpiry?.total || 0,
      percent: usage.groceriesWithExpiry?.percent || 0,
      unlimited: usage.groceriesWithExpiry?.unlimited || false,
    },
  ];

  return (
    <div className="space-y-4">
      {usageItems.map((item) => (
        <div key={item.key} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{item.label}</span>
            <div className="flex items-center gap-2">
              {item.unlimited ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Infinity className="h-3 w-3" />
                  {t('profile.unlimited')}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {formatNumber(item.used)} / {item.total === -1 ? '∞' : formatNumber(item.total)}
                </span>
              )}
            </div>
          </div>
          {!item.unlimited && (
            <Progress 
              value={item.percent} 
              className="h-2"
            />
          )}
        </div>
      ))}
      
      {usage.resetAt && (
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {t('profile.resetInfo')}: {formatResetDate(usage.resetAt, locale)}
          </p>
          {usage.monthlyLimitResetAt && (
            <p className="text-sm text-muted-foreground">
              {t('profile.monthlyResetInfo')}: {formatResetDate(usage.monthlyLimitResetAt, locale)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

