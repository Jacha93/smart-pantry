'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';
import { Infinity } from 'lucide-react';

interface UsageOverviewProps {
  usage: any;
  quotas: any;
}

export function UsageOverview({ usage, quotas }: UsageOverviewProps) {
  const { t } = useI18n();

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
      used: usage.llmTokens.used,
      total: usage.llmTokens.total,
      percent: usage.llmTokens.percent,
      unlimited: false,
    },
    {
      key: 'recipeCalls',
      label: t('profile.usage.recipeCalls'),
      used: usage.recipeCalls.used,
      total: usage.recipeCalls.total,
      percent: usage.recipeCalls.percent,
      unlimited: false,
    },
    {
      key: 'cacheSuggestions',
      label: t('profile.usage.cacheSuggestions'),
      used: usage.cacheSuggestions.used,
      total: usage.cacheSuggestions.total,
      percent: usage.cacheSuggestions.percent,
      unlimited: usage.cacheSuggestions.unlimited,
    },
    {
      key: 'chatMessages',
      label: t('profile.usage.chatMessages'),
      used: usage.chatMessages.used,
      total: usage.chatMessages.total,
      percent: usage.chatMessages.percent,
      unlimited: false,
    },
    {
      key: 'cacheSearch',
      label: t('profile.usage.cacheSearch'),
      used: usage.cacheSearch.used,
      total: usage.cacheSearch.total,
      percent: usage.cacheSearch.percent,
      unlimited: false,
    },
    {
      key: 'groceriesTotal',
      label: t('profile.usage.groceriesTotal'),
      used: usage.groceriesTotal.used,
      total: usage.groceriesTotal.total,
      percent: usage.groceriesTotal.percent,
      unlimited: usage.groceriesTotal.unlimited,
    },
    {
      key: 'groceriesWithExpiry',
      label: t('profile.usage.groceriesWithExpiry'),
      used: usage.groceriesWithExpiry.used,
      total: usage.groceriesWithExpiry.total,
      percent: usage.groceriesWithExpiry.percent,
      unlimited: usage.groceriesWithExpiry.unlimited,
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
      
      <div className="pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          {t('profile.resetInfo')}: {new Date(usage.resetAt).toLocaleDateString()}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('profile.monthlyResetInfo')}: {new Date(usage.monthlyResetAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

