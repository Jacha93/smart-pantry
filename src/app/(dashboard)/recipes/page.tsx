'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Check, Trash2, Loader2, Clock, Users } from 'lucide-react';
import { photoRecognitionAPI } from '@/lib/api';
import { RecipeDetailsModal } from '@/components/recipe-details-modal';
import { AddRecipeDialog } from '@/components/add-recipe-dialog';
import { AdBlock } from '@/components/ad-block';
import { useUserPlan } from '@/hooks/use-user-plan';
import { useI18n } from '@/hooks/use-i18n';
import { toast } from 'sonner';

interface SavedRecipe {
  id: number;
  recipe_id: number;
  title: string;
  image: string;
  used_ingredients: Array<{ name: string; amount: number; unit: string }>;
  missed_ingredients: Array<{ name: string; amount: number; unit: string }>;
  likes: number;
  sourceUrl: string;
  saved_at: string;
  is_cooked: boolean;
  is_custom?: boolean;
  ready_in_minutes?: number;
  servings?: number;
  instructions?: string;
  cooked_info?: {
    cooked_at: string;
    rating?: number;
  };
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { t } = useI18n();
  const { plan } = useUserPlan();

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setIsLoading(true);
    try {
      const response = await photoRecognitionAPI.getSavedRecipes();
      setRecipes(Array.isArray(response.data) ? response.data : []);
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || t('recipes.loadFailed'));
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('recipes.deleteConfirm'))) {
      return;
    }

    setDeletingId(id);
    try {
      await photoRecognitionAPI.deleteRecipe(id);
      setRecipes(recipes.filter((r) => r.id !== id));
      toast.success(t('recipes.deleted'));
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || t('recipes.deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('recipes.title')}</h1>
          <p className="text-muted-foreground">{t('recipes.subtitle')}</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('recipes.title')}</h1>
          <p className="text-muted-foreground">{t('recipes.subtitle')}</p>
        </div>
        <AddRecipeDialog onRecipeAdded={loadRecipes} />
      </div>

      {recipes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('recipes.noRecipes')}</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {t('recipes.noRecipesDescription')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
                {recipe.is_cooked && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      {t('recipes.cooked')}
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                  {recipe.title}
                </h3>
                <div className="space-y-2">
                  {/* Zeige Zeit/Portionen für eigene Rezepte */}
                  {recipe.is_custom && (recipe.ready_in_minutes || recipe.servings) && (
                    <div className="flex gap-3 text-xs text-muted-foreground mb-2">
                      {recipe.ready_in_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {recipe.ready_in_minutes} {t('recipe.minutes')}
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {recipe.servings} {t('recipe.servings')}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">{recipe.is_custom ? t('recipe.ingredients') : t('fridge.usedIngredients')}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {recipe.used_ingredients.slice(0, 3).map((ingredient, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {ingredient.name}
                        </Badge>
                      ))}
                      {recipe.used_ingredients.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{recipe.used_ingredients.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!recipe.is_custom && recipe.missed_ingredients.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">{t('fridge.missingIngredients')}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {recipe.missed_ingredients.slice(0, 2).map((ingredient, idx) => (
                          <Badge key={idx} variant="destructive" className="text-xs">
                            {ingredient.name}
                          </Badge>
                        ))}
                        {recipe.missed_ingredients.length > 2 && (
                          <Badge variant="destructive" className="text-xs">
                            +{recipe.missed_ingredients.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {recipe.is_custom ? (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                        {t('recipes.customRecipe')}
                      </Badge>
                    ) : (
                      <span>❤️ {t('fridge.likes').replace('{count}', String(recipe.likes))}</span>
                    )}
                    {!recipe.is_cooked && (
                      <Badge variant="outline" className="text-xs">
                        {t('recipes.notCooked')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => {
                        setSelectedRecipeId(recipe.recipe_id);
                        setIsRecipeModalOpen(true);
                      }}
                    >
                      {t('fridge.viewRecipe')}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs"
                      onClick={() => handleDelete(recipe.id)}
                      disabled={deletingId === recipe.id}
                    >
                      {deletingId === recipe.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RecipeDetailsModal
        recipeId={selectedRecipeId}
        isOpen={isRecipeModalOpen}
        onClose={() => {
          setIsRecipeModalOpen(false);
          setSelectedRecipeId(null);
          loadRecipes(); // Reload to update cooked status
        }}
      />

      {/* Ad Block für Free Tier User */}
      <AdBlock 
        format="horizontal" 
        currentPlan={plan}
        className="mt-6"
        devMode={process.env.NODE_ENV === 'development'}
      />
    </div>
  );
}

