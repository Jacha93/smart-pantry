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

import { motion } from 'framer-motion';

export function UsageOverview({ usage, quotas }: UsageOverviewProps) {
  const { t, locale } = useI18n();

  // Prüfe ob usage gültig ist - Backend returns flat structure with llmTokensUsed, quotaLlmTokens, etc.
  if (!usage || typeof usage !== 'object' || Object.keys(usage).length === 0) {
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
    return 'brand-accent'; // Use new brand color for good status
  };

  // Calculate percentages from flat structure
  const calculatePercent = (used: number, total: number) => {
    if (total <= 0 || total === -1) return 0; // -1 means unlimited
    return Math.min(100, Math.round((used / total) * 100));
  };

  const usageItems = [
    {
      key: 'llmTokens',
      label: t('profile.usage.llmTokens') || 'LLM Tokens',
      used: usage.llmTokensUsed || 0,
      total: usage.quotaLlmTokens || 0,
      percent: calculatePercent(usage.llmTokensUsed || 0, usage.quotaLlmTokens || 0),
      unlimited: usage.quotaLlmTokens === -1,
    },
    {
      key: 'recipeCalls',
      label: t('profile.usage.recipeCalls') || 'Rezept-Aufrufe',
      used: usage.recipeCallsUsed || 0,
      total: usage.quotaRecipeCalls || 0,
      percent: calculatePercent(usage.recipeCallsUsed || 0, usage.quotaRecipeCalls || 0),
      unlimited: usage.quotaRecipeCalls === -1,
    },
    {
      key: 'cacheSuggestions',
      label: t('profile.usage.cacheSuggestions') || 'Rezeptvorschläge Cache',
      used: usage.cacheRecipeSuggestionsUsed || 0,
      total: usage.maxCacheRecipeSuggestions || 0,
      percent: calculatePercent(usage.cacheRecipeSuggestionsUsed || 0, usage.maxCacheRecipeSuggestions || 0),
      unlimited: false,
    },
    {
      key: 'chatMessages',
      label: t('profile.usage.chatMessages') || 'Chat-Nachrichten',
      used: usage.chatMessagesUsed || 0,
      total: usage.maxChatMessages || 0,
      percent: calculatePercent(usage.chatMessagesUsed || 0, usage.maxChatMessages || 0),
      unlimited: false,
    },
    {
      key: 'cacheSearch',
      label: t('profile.usage.cacheSearch') || 'Cache-Suche',
      used: usage.cacheRecipeSearchViaChatUsed || 0,
      total: usage.maxCacheRecipeSearchViaChat || 0,
      percent: calculatePercent(usage.cacheRecipeSearchViaChatUsed || 0, usage.maxCacheRecipeSearchViaChat || 0),
      unlimited: false,
    },
    {
      key: 'groceriesTotal',
      label: t('profile.usage.groceriesTotal') || 'Lebensmittel Gesamt',
      used: usage.currentGroceriesTotal || 0,
      total: usage.maxGroceriesTotal || 0,
      percent: calculatePercent(usage.currentGroceriesTotal || 0, usage.maxGroceriesTotal || 0),
      unlimited: false,
    },
    {
      key: 'groceriesWithExpiry',
      label: t('profile.usage.groceriesWithExpiry') || 'Lebensmittel mit Ablaufdatum',
      used: usage.currentGroceriesWithExpiry || 0,
      total: usage.maxGroceriesWithExpiry || 0,
      percent: calculatePercent(usage.currentGroceriesWithExpiry || 0, usage.maxGroceriesWithExpiry || 0),
      unlimited: false,
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {usageItems.map((item) => (
          <motion.div 
            key={item.key} 
            variants={itemAnim}
            className="p-4 rounded-xl border bg-card/50 hover:bg-card/80 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-foreground/90">{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.unlimited ? (
                    <Badge variant="outline" className="flex items-center gap-1 border-[#17f6fe]/50 text-[#17f6fe] bg-[#17f6fe]/5">
                      <Infinity className="h-3 w-3" />
                      {t('profile.unlimited')}
                    </Badge>
                  ) : (
                    <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                      {formatNumber(item.used)} / {item.total === -1 ? '∞' : formatNumber(item.total)}
                    </span>
                  )}
                </div>
              </div>
              {!item.unlimited && (
                <div className="space-y-1">
                  <Progress 
                    value={item.percent} 
                    className="h-2 bg-muted/50"
                    indicatorClassName={
                      item.percent >= 90 ? 'bg-destructive' : 
                      item.percent >= 70 ? 'bg-orange-500' : 
                      '#17f6fe'
                    }
                  />
                  <div className="flex justify-end">
                    <span className={`text-xs ${
                      item.percent >= 90 ? 'text-destructive' : 
                      item.percent >= 70 ? 'text-orange-500' : 
                      'text-muted-foreground'
                    }`}>
                      {item.percent}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      {usage.resetAt && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-4 border-t flex flex-col sm:flex-row gap-4 justify-between text-xs text-muted-foreground"
        >
          <p>
            {t('profile.resetInfo')}: <span className="text-foreground">{formatResetDate(usage.resetAt, locale)}</span>
          </p>
          {usage.monthlyLimitResetAt && (
            <p>
              {t('profile.monthlyResetInfo')}: <span className="text-foreground">{formatResetDate(usage.monthlyLimitResetAt, locale)}</span>
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

