'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/hooks/use-i18n';

interface UsageChartProps {
  usage: any;
}

export function UsageChart({ usage }: UsageChartProps) {
  const { t } = useI18n();
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Animate values from 0 to actual percentage
    const animationDuration = 1000; // 1 second
    const steps = 60;
    const stepDuration = animationDuration / steps;
    
    const animate = () => {
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        const progress = Math.min(currentStep / steps, 1);
        // Easing function for smooth animation
        const eased = 1 - Math.pow(1 - progress, 3);
        
        setAnimatedValues({
          llmTokens: Math.round(usage.llmTokens.percent * eased),
          recipeCalls: Math.round(usage.recipeCalls.percent * eased),
          cacheSuggestions: usage.cacheSuggestions.unlimited ? -1 : Math.round(usage.cacheSuggestions.percent * eased),
          chatMessages: Math.round(usage.chatMessages.percent * eased),
          cacheSearch: Math.round(usage.cacheSearch.percent * eased),
          groceriesTotal: usage.groceriesTotal.unlimited ? -1 : Math.round(usage.groceriesTotal.percent * eased),
          groceriesWithExpiry: usage.groceriesWithExpiry.unlimited ? -1 : Math.round(usage.groceriesWithExpiry.percent * eased),
        });
        
        if (currentStep >= steps) {
          clearInterval(interval);
        }
      }, stepDuration);
    };
    
    animate();
  }, [usage]);

  const chartData = [
    { key: 'llmTokens', label: t('profile.usage.llmTokens'), value: animatedValues.llmTokens || 0, color: '#3b82f6' },
    { key: 'recipeCalls', label: t('profile.usage.recipeCalls'), value: animatedValues.recipeCalls || 0, color: '#10b981' },
    { key: 'cacheSuggestions', label: t('profile.usage.cacheSuggestions'), value: animatedValues.cacheSuggestions || 0, color: '#f59e0b', unlimited: usage.cacheSuggestions.unlimited },
    { key: 'chatMessages', label: t('profile.usage.chatMessages'), value: animatedValues.chatMessages || 0, color: '#8b5cf6' },
    { key: 'cacheSearch', label: t('profile.usage.cacheSearch'), value: animatedValues.cacheSearch || 0, color: '#ec4899' },
    { key: 'groceriesTotal', label: t('profile.usage.groceriesTotal'), value: animatedValues.groceriesTotal || 0, color: '#06b6d4', unlimited: usage.groceriesTotal.unlimited },
    { key: 'groceriesWithExpiry', label: t('profile.usage.groceriesWithExpiry'), value: animatedValues.groceriesWithExpiry || 0, color: '#ef4444', unlimited: usage.groceriesWithExpiry.unlimited },
  ];

  const maxBarHeight = 200;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chartData.map((item) => (
          <div key={item.key} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{item.label}</span>
              <span className="text-sm text-muted-foreground">
                {item.unlimited ? '∞' : `${item.value}%`}
              </span>
            </div>
            <div className="relative h-8 bg-secondary rounded-full overflow-hidden">
              {!item.unlimited && (
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${item.value}%`,
                    backgroundColor: item.color,
                  }}
                />
              )}
              {item.unlimited && (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">∞</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

