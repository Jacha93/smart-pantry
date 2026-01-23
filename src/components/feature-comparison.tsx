'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { Check, X, Crown, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FeatureComparisonProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeatureComparison({ isOpen, onOpenChange }: FeatureComparisonProps) {
  const { t } = useI18n();

  const features = [
    {
      name: t('plans.features.photoAnalyses Month'),
      free: '5',
      basic: '15',
      pro: '50'
    },
    {
      name: t('plans.features.requestNewRecipes'),
      free: '6x (18 Rezepte)',
      basic: '15x (45 Rezepte)',
      pro: '48x (144 Rezepte)'
    },
    {
      name: t('plans.features.recipeSuggestionsCacheMonth'),
      free: '12',
      basic: '30',
      pro: t('profile.unlimited')
    },
    {
      name: t('plans.features.chatMessagesMonth'),
      free: '4',
      basic: '16',
      pro: '50'
    },
    {
      name: t('plans.features.recipeSearchViaChatMonth'),
      free: '4',
      basic: '20',
      pro: '100'
    },
    {
      name: t('plans.features.groceriesWithExpiryDate'),
      free: 'Max. 10',
      basic: 'Max. 100',
      pro: t('profile.unlimited')
    },
    {
      name: t('plans.features.totalGroceries'),
      free: 'Max. 20',
      basic: 'Max. 250',
      pro: t('profile.unlimited')
    },
    {
      name: t('plans.features.shoppingList'),
      free: t('plans.features.manualOnly'),
      basic: t('plans.features.autoSuggestion'),
      pro: t('plans.features.autoSuggestion')
    },
    {
      name: t('plans.features.recipeSuggestionsDay'),
      free: '2 (je 1)',
      basic: '8 (je 2)',
      pro: '16 (je 2)'
    },
    {
      name: t('plans.features.notifications'),
      free: false,
      basic: true,
      pro: true
    },
    {
      name: t('plans.features.advertising'),
      free: true,
      basic: false,
      pro: false
    },
    {
      name: t('plans.features.support'),
      free: false,
      basic: false,
      pro: true
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {t('plans.button.comparePlans')}
          </DialogTitle>
          <DialogDescription>
            {t('profile.planManagementDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Free Tier */}
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-lg">Free</CardTitle>
              <CardDescription>
                {t('plans.button.freeToTry')}
              </CardDescription>
              <div className="text-3xl font-bold mt-2">€0</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{feature.name}</span>
                  <div className="flex items-center">
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <Check className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )
                    ) : (
                      <span className="text-foreground font-medium">{feature.free}</span>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4" disabled>
                {t('plans.button.currentPlan')}
              </Button>
            </CardContent>
          </Card>

          {/* Basic Tier */}
          <Card className="border-primary shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Basic
              </CardTitle>
              <CardDescription>
                {t('plans.button.bestseller')}
              </CardDescription>
              <div className="text-3xl font-bold mt-2">€4.99<span className="text-sm font-normal">/Monat</span></div>
            </CardHeader>
            <CardContent className="space-y-3">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{feature.name}</span>
                  <div className="flex items-center">
                    {typeof feature.basic === 'boolean' ? (
                      feature.basic ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )
                    ) : (
                      <span className="text-foreground font-medium">{feature.basic}</span>
                    )}
                  </div>
                </div>
              ))}
              <Button className="w-full mt-4">
                {t('plans.button.upgradeToBasic')}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Tier */}
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                Pro
              </CardTitle>
              <CardDescription>
                {t('plans.label.forPowerUsers')}
              </CardDescription>
              <div className="text-3xl font-bold mt-2">€9.99<span className="text-sm font-normal">/Monat</span></div>
            </CardHeader>
            <CardContent className="space-y-3">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{feature.name}</span>
                  <div className="flex items-center">
                    {typeof feature.pro === 'boolean' ? (
                      feature.pro ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )
                    ) : (
                      <span className="text-foreground font-medium">{feature.pro}</span>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4">
                {t('plans.button.upgradeToPro')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

