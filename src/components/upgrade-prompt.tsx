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
  const { t } = useI18n();
  const [showComparison, setShowComparison] = useState(false);

  const getMessage = () => {
    const key = `upgrade.message.${limitType}`;
    const text = t(key);
    return text.replace('{limit}', limit.toString());
  };

  return (
    <>
      <Alert className="border-primary/50 bg-primary/5">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertTitle className="flex items-center gap-2">
          <Crown className="h-4 w-4" />
          {t('upgrade.limitReached')}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-3">{getMessage()}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setShowComparison(true)}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {t('plans.button.comparePlans')}
            </Button>
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
              >
                {t('upgrade.later')}
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

