'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Sparkles, Loader2 } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';

interface Recipe {
  id?: number;
  recipe_id?: number;
  title: string;
  image: string;
  used_ingredients: Array<{ name: string; amount: number; unit: string }>;
  missed_ingredients?: Array<{ name: string; amount: number; unit: string }>;
  likes?: number;
  is_new?: boolean;
  match_score?: number;
  matched_ingredients?: string[];
}

interface RecipeSuggestionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  newRecipes: Recipe[];
  existingMatchingRecipes: Recipe[];
  onRecipeClick: (recipeId: number) => void;
  isLoading?: boolean;
}

export function RecipeSuggestionsDialog({
  isOpen,
  onClose,
  newRecipes,
  existingMatchingRecipes,
  onRecipeClick,
  isLoading = false,
}: RecipeSuggestionsDialogProps) {
  const { t } = useI18n();

  const getRecipeId = (recipe: Recipe): number => {
    return recipe.recipe_id || recipe.id || 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            {t('recipes.suggestionsTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('recipes.suggestionsDescription')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Neue Rezepte */}
            {newRecipes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#17f6fe]" />
                  {t('recipes.newRecipes')} ({newRecipes.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {newRecipes.map((recipe, idx) => (
                    <Card
                      key={idx}
                      className="overflow-hidden group hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => {
                        const recipeId = getRecipeId(recipe);
                        if (recipeId) {
                          onRecipeClick(recipeId);
                          onClose();
                        }
                      }}
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.035]"
                        />
                        {recipe.is_new && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-[#17f6fe] text-black font-bold">
                              {t('recipes.new')}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-semibold text-sm mb-2 line-clamp-2">
                          {recipe.title}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {recipe.used_ingredients?.slice(0, 3).map((ing, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {ing.name}
                            </Badge>
                          ))}
                          {recipe.used_ingredients && recipe.used_ingredients.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{recipe.used_ingredients.length - 3}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Passende existierende Rezepte */}
            {existingMatchingRecipes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {t('recipes.matchingRecipes')} ({existingMatchingRecipes.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {existingMatchingRecipes.map((recipe, idx) => (
                    <Card
                      key={idx}
                      className="overflow-hidden group hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => {
                        const recipeId = getRecipeId(recipe);
                        if (recipeId) {
                          onRecipeClick(recipeId);
                          onClose();
                        }
                      }}
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.035]"
                        />
                        {recipe.match_score !== undefined && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-green-500/80 text-white">
                              {t('recipes.matchScore')}: {recipe.match_score}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-semibold text-sm mb-2 line-clamp-2">
                          {recipe.title}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {recipe.used_ingredients?.slice(0, 3).map((ing, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {ing.name}
                            </Badge>
                          ))}
                          {recipe.used_ingredients && recipe.used_ingredients.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{recipe.used_ingredients.length - 3}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Keine Rezepte gefunden */}
            {newRecipes.length === 0 && existingMatchingRecipes.length === 0 && (
              <div className="text-center py-8">
                <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t('recipes.noSuggestionsFound')}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
