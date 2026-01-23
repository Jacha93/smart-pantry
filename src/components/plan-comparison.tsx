'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';
import { Check, Crown, Zap, Gift } from 'lucide-react';

interface PlanComparisonProps {
  currentPlan: 'free' | 'basic' | 'pro';
  quotas: any;
}

export function PlanComparison({ currentPlan, quotas }: PlanComparisonProps) {
  const { t } = useI18n();

  const plans = [
    {
      id: 'free',
      name: t('profile.plans.free.name'),
      price: t('profile.plans.free.price'),
      icon: Gift,
      features: [
        t('profile.plans.free.features.photoAnalysis'),
        t('profile.plans.free.features.recipeCalls'),
        t('profile.plans.free.features.cacheSuggestions'),
        t('profile.plans.free.features.chatMessages'),
        t('profile.plans.free.features.groceries'),
        t('profile.plans.free.features.ads'),
      ],
      limits: {
        photoAnalysis: '5',
        recipeCalls: '6',
        cacheSuggestions: '12',
        chatMessages: '4',
        groceriesTotal: '20',
        groceriesWithExpiry: '10',
      },
    },
    {
      id: 'basic',
      name: t('profile.plans.basic.name'),
      price: t('profile.plans.basic.price'),
      icon: Zap,
      features: [
        t('profile.plans.basic.features.photoAnalysis'),
        t('profile.plans.basic.features.recipeCalls'),
        t('profile.plans.basic.features.cacheSuggestions'),
        t('profile.plans.basic.features.chatMessages'),
        t('profile.plans.basic.features.groceries'),
        t('profile.plans.basic.features.noAds'),
      ],
      limits: {
        photoAnalysis: '15',
        recipeCalls: '15',
        cacheSuggestions: '30',
        chatMessages: '16',
        groceriesTotal: '250',
        groceriesWithExpiry: '100',
      },
    },
    {
      id: 'pro',
      name: t('profile.plans.pro.name'),
      price: t('profile.plans.pro.price'),
      icon: Crown,
      features: [
        t('profile.plans.pro.features.photoAnalysis'),
        t('profile.plans.pro.features.recipeCalls'),
        t('profile.plans.pro.features.cacheSuggestions'),
        t('profile.plans.pro.features.chatMessages'),
        t('profile.plans.pro.features.groceries'),
        t('profile.plans.pro.features.prioritySupport'),
      ],
      limits: {
        photoAnalysis: '50',
        recipeCalls: '48',
        cacheSuggestions: '∞',
        chatMessages: '50',
        groceriesTotal: '∞',
        groceriesWithExpiry: '∞',
      },
    },
  ];

  const handleUpgrade = (planId: string) => {
    // TODO: Implement upgrade logic
    console.log('Upgrade to:', planId);
    // This would typically redirect to a payment page or show a payment dialog
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {plans.map((plan) => {
        const Icon = plan.icon;
        const isCurrentPlan = currentPlan === plan.id;
        const isUpgrade = 
          (currentPlan === 'free' && plan.id === 'basic') ||
          (currentPlan === 'free' && plan.id === 'pro') ||
          (currentPlan === 'basic' && plan.id === 'pro');

        return (
          <Card
            key={plan.id}
            className={isCurrentPlan ? 'border-primary border-2' : ''}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                {isCurrentPlan && (
                  <Badge variant="default">{t('profile.currentPlan')}</Badge>
                )}
              </div>
              <CardDescription className="text-2xl font-bold">
                {plan.price}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={isCurrentPlan ? 'outline' : 'default'}
                disabled={isCurrentPlan}
                onClick={() => handleUpgrade(plan.id)}
              >
                {isCurrentPlan
                  ? t('profile.currentPlan')
                  : isUpgrade
                  ? t('profile.upgrade')
                  : t('profile.downgrade')}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

