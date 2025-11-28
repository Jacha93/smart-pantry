'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useI18n } from '@/hooks/use-i18n';
import { AlertCircle, Crown, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { FeatureComparison } from './feature-comparison';

interface UpgradePromptProps {
  limitType: 'groceries_total' | 'groceries_with_expiry' | 'chat_messages' | 'cache_recipe_suggestions' | 'recipe_calls';
  currentValue: number;
  limit: number;
  onDismiss?: () => void;
}

export function UpgradePrompt({ limitType, currentValue, limit, onDismiss }: UpgradePromptProps) {
  const { t, locale } = useI18n();
  const [showComparison, setShowComparison] = useState(false);

  const messages = {
    groceries_total: {
      de: `Du hast das Limit von ${limit} Lebensmitteln erreicht. Upgrade auf Basic oder Pro für mehr Lebensmittel!`,
      en: `You've reached the limit of ${limit} groceries. Upgrade to Basic or Pro for more groceries!`
    },
    groceries_with_expiry: {
      de: `Du hast das Limit von ${limit} Lebensmitteln mit MHD erreicht. Upgrade für mehr Lebensmittel mit MHD!`,
      en: `You've reached the limit of ${limit} groceries with expiry date. Upgrade for more groceries with expiry dates!`
    },
    chat_messages: {
      de: `Du hast dein Chat-Kontingent aufgebraucht. Upgrade für mehr Chat-Nachrichten!`,
      en: `You've used up your chat quota. Upgrade for more chat messages!`
    },
    cache_recipe_suggestions: {
      de: `Du hast dein Kontingent für Rezeptvorschläge aufgebraucht. Upgrade für mehr Vorschläge!`,
      en: `You've used up your recipe suggestion quota. Upgrade for more suggestions!`
    },
    recipe_calls: {
      de: `Du hast dein Kontingent für neue Rezepte aufgebraucht. Upgrade für mehr Rezepte!`,
      en: `You've used up your recipe quota. Upgrade for more recipes!`
    }
  };

  const message = messages[limitType][locale as 'de' | 'en'] || messages[limitType].en;

  return (
    <>
      <Alert className="border-primary/50 bg-primary/5">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertTitle className="flex items-center gap-2">
          <Crown className="h-4 w-4" />
          {locale === 'de' ? 'Limit erreicht' : 'Limit Reached'}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-3">{message}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setShowComparison(true)}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {locale === 'de' ? 'Pläne vergleichen' : 'Compare Plans'}
            </Button>
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
              >
                {locale === 'de' ? 'Später' : 'Later'}
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>

      <FeatureComparison 
        isOpen={showComparison} 
        onOpenChange={setShowComparison}
      />
    </>
  );
}

