'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';
import { AdBlock } from './ad-block';
import { useUserPlan } from '@/hooks/use-user-plan';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

interface Recipe {
  id: number;
  title: string;
  image: string;
  used_ingredients: Array<{ name: string; amount: number; unit: string }>;
  missed_ingredients: Array<{ name: string; amount: number; unit: string }>;
  likes: number;
}

interface RecipeSuggestionsGridProps {
  recipes: Recipe[];
  onRecipeClick: (recipeId: number) => void;
}

export function RecipeSuggestionsGrid({ recipes, onRecipeClick }: RecipeSuggestionsGridProps) {
  const { t, locale } = useI18n();
  const [isFreeTier, setIsFreeTier] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [userLimits, setUserLimits] = useState<any>(null);
  const { plan } = useUserPlan();

  useEffect(() => {
    // Prüfe ob User Free Tier ist
    const checkTier = async () => {
      if (!auth.isAuthenticated()) {
        setIsFreeTier(true);
        return;
      }
      try {
        const response = await api.get('/user/limits');
        const limits = response.data;
        setUserLimits(limits);
        // Free Tier: maxCacheRecipeSuggestions = 12, Basic = 30, Pro = -1
        setIsFreeTier(limits.maxCacheRecipeSuggestions <= 12);
      } catch (error) {
        setIsFreeTier(true); // Default zu Free Tier bei Fehler
      }
    };
    checkTier();
  }, []);

  // Free Tier: Zeige 1 Rezept, dann Werbung, dann Button für mehr
  // Paid Tier: Zeige 2 Rezepte, dann Button für mehr
  const initialCount = isFreeTier ? 1 : 2;
  const displayedRecipes = showAll ? recipes : recipes.slice(0, initialCount);
  const hasMore = recipes.length > initialCount;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayedRecipes.map((recipe) => (
          <Card key={recipe.id} className="overflow-hidden">
            <div className="aspect-video relative">
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                {recipe.title}
              </h3>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">{t('fridge.usedIngredients')}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(recipe.used_ingredients || []).slice(0, 3).map((ingredient, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {ingredient.name}
                      </Badge>
                    ))}
                    {(recipe.used_ingredients || []).length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{t('fridge.moreIngredients').replace('{count}', String((recipe.used_ingredients || []).length - 3))}
                      </Badge>
                    )}
                  </div>
                </div>
                {(recipe.missed_ingredients || []).length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">{t('fridge.missingIngredients')}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(recipe.missed_ingredients || []).slice(0, 2).map((ingredient, idx) => (
                        <Badge key={idx} variant="destructive" className="text-xs">
                          {ingredient.name}
                        </Badge>
                      ))}
                      {(recipe.missed_ingredients || []).length > 2 && (
                        <Badge variant="destructive" className="text-xs">
                          +{t('fridge.moreIngredients').replace('{count}', String((recipe.missed_ingredients || []).length - 2))}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>❤️ {t('fridge.likes').replace('{count}', String(recipe.likes))}</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs"
                    onClick={() => onRecipeClick(recipe.id)}
                  >
                    {t('fridge.viewRecipe')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Werbung für Free Tier (nach erstem Rezept) */}
      {isFreeTier && !showAll && recipes.length > 0 && (
        <AdBlock 
          format="rectangle" 
          currentPlan={plan}
          className="my-4"
          devMode={process.env.NODE_ENV === 'development'}
        />
      )}

      {/* "Weitere anzeigen" Button */}
      {hasMore && !showAll && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(true)}
          >
            {locale === 'de' 
              ? `Weitere ${recipes.length - initialCount} Rezepte anzeigen`
              : `Show ${recipes.length - initialCount} more recipes`
            }
          </Button>
        </div>
      )}

      {/* Weitere Werbung für Free Tier (wenn alle angezeigt) */}
      {isFreeTier && showAll && recipes.length > 2 && (
        <AdBlock 
          format="horizontal" 
          currentPlan={plan}
          className="my-4"
          devMode={process.env.NODE_ENV === 'development'}
        />
      )}
    </div>
  );
}

