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
import { motion } from 'framer-motion';

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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.045
      }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="space-y-4">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3"
      >
        {displayedRecipes.map((recipe) => (
          <motion.div key={recipe.id} variants={itemAnim} whileHover={{ y: -3 }} transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}>
            <Card className="overflow-hidden h-full hover:shadow-xl hover:border-brand-accent/50 transition-all duration-300 group">
              <div className="aspect-video relative overflow-hidden">
                <motion.img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.035 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <Button 
                    size="sm" 
                    className="w-full font-medium shadow-lg translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                    onClick={() => onRecipeClick(recipe.id)}
                  >
                    {t('fridge.viewRecipe')}
                  </Button>
                </div>
              </div>
              <CardContent className="p-4 flex flex-col gap-2">
                <h3 className="font-semibold text-base line-clamp-2 min-h-[3rem] group-hover:text-brand-accent transition-colors">
                  {recipe.title}
                </h3>
                <div className="space-y-3 mt-auto">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-brand-accent uppercase tracking-wider text-[10px]">{t('fridge.usedIngredients')}</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(recipe.used_ingredients || []).slice(0, 3).map((ingredient, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-[#17f6fe]/5 border-[#17f6fe]/20">
                          {ingredient.name}
                        </Badge>
                      ))}
                      {(recipe.used_ingredients || []).length > 3 && (
                        <Badge variant="outline" className="text-xs bg-muted">
                          +{t('fridge.moreIngredients').replace('{count}', String((recipe.used_ingredients || []).length - 3))}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {(recipe.missed_ingredients || []).length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-destructive uppercase tracking-wider text-[10px]">{t('fridge.missingIngredients')}</span>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(recipe.missed_ingredients || []).slice(0, 2).map((ingredient, idx) => (
                          <Badge key={idx} variant="destructive" className="text-xs opacity-90">
                            {ingredient.name}
                          </Badge>
                        ))}
                        {(recipe.missed_ingredients || []).length > 2 && (
                          <Badge variant="destructive" className="text-xs opacity-70">
                            +{t('fridge.moreIngredients').replace('{count}', String((recipe.missed_ingredients || []).length - 2))}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="pt-2 mt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">❤️ {t('fridge.likes').replace('{count}', String(recipe.likes))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Werbung für Free Tier (nach erstem Rezept) */}
      {isFreeTier && !showAll && recipes.length > 0 && (
        <AdBlock 
          format="rectangle" 
          currentPlan={plan}
          className="my-4"
          devMode={import.meta.env.MODE === 'development'}
        />
      )}

      {/* "Weitere anzeigen" Button */}
      {hasMore && !showAll && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            className="group hover:border-brand-accent hover:text-brand-accent transition-colors"
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
          devMode={import.meta.env.MODE === 'development'}
        />
      )}
    </div>
  );
}
