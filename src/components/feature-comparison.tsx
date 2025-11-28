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
  const { t, locale } = useI18n();

  const features = [
    {
      name: locale === 'de' ? 'Foto-Analysen/Monat' : 'Photo Analyses/Month',
      free: '5',
      basic: '15',
      pro: '50'
    },
    {
      name: locale === 'de' ? 'Neue Rezepte anfordern' : 'Request New Recipes',
      free: '6x (18 Rezepte)',
      basic: '15x (45 Rezepte)',
      pro: '48x (144 Rezepte)'
    },
    {
      name: locale === 'de' ? 'Rezeptvorschläge (Cache)/Monat' : 'Recipe Suggestions (Cache)/Month',
      free: '12',
      basic: '30',
      pro: locale === 'de' ? 'Unbegrenzt' : 'Unlimited'
    },
    {
      name: locale === 'de' ? 'Chat-Nachrichten/Monat' : 'Chat Messages/Month',
      free: '4',
      basic: '16',
      pro: '50'
    },
    {
      name: locale === 'de' ? 'Rezeptsuche via Chat/Monat' : 'Recipe Search via Chat/Month',
      free: '4',
      basic: '20',
      pro: '100'
    },
    {
      name: locale === 'de' ? 'Lebensmittel mit MHD' : 'Groceries with Expiry Date',
      free: 'Max. 10',
      basic: 'Max. 100',
      pro: locale === 'de' ? 'Unbegrenzt' : 'Unlimited'
    },
    {
      name: locale === 'de' ? 'Lebensmittel insgesamt' : 'Total Groceries',
      free: 'Max. 20',
      basic: 'Max. 250',
      pro: locale === 'de' ? 'Unbegrenzt' : 'Unlimited'
    },
    {
      name: locale === 'de' ? 'Einkaufsliste' : 'Shopping List',
      free: locale === 'de' ? 'Nur manuell' : 'Manual only',
      basic: locale === 'de' ? 'Auto + Vorschlag' : 'Auto + Suggestion',
      pro: locale === 'de' ? 'Auto + Vorschlag' : 'Auto + Suggestion'
    },
    {
      name: locale === 'de' ? 'Rezeptvorschläge/Tag' : 'Recipe Suggestions/Day',
      free: '2 (je 1)',
      basic: '8 (je 2)',
      pro: '16 (je 2)'
    },
    {
      name: locale === 'de' ? 'Benachrichtigungen' : 'Notifications',
      free: false,
      basic: true,
      pro: true
    },
    {
      name: locale === 'de' ? 'Werbung' : 'Advertising',
      free: true,
      basic: false,
      pro: false
    },
    {
      name: locale === 'de' ? 'Support' : 'Support',
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
            {locale === 'de' ? 'Pläne vergleichen' : 'Compare Plans'}
          </DialogTitle>
          <DialogDescription>
            {locale === 'de' 
              ? 'Wähle den Plan, der am besten zu dir passt'
              : 'Choose the plan that best fits you'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Free Tier */}
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-lg">Free</CardTitle>
              <CardDescription>
                {locale === 'de' ? 'Kostenlos testen' : 'Free to try'}
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
                {locale === 'de' ? 'Aktueller Plan' : 'Current Plan'}
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
                {locale === 'de' ? 'Bestseller' : 'Bestseller'}
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
                {locale === 'de' ? 'Upgrade zu Basic' : 'Upgrade to Basic'}
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
                {locale === 'de' ? 'Für Power-User' : 'For Power Users'}
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
                {locale === 'de' ? 'Upgrade zu Pro' : 'Upgrade to Pro'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

