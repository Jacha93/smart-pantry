import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Check, Trash2, Loader2, Clock, Users, Sparkles } from 'lucide-react';
import { photoRecognitionAPI, recipesAPI } from '@/lib/api';
import { RecipeDetailsModal } from '@/components/recipe-details-modal';
import { RecipeSuggestionsDialog } from '@/components/recipe-suggestions-dialog';
import { AddRecipeDialog } from '@/components/add-recipe-dialog';
import { AdBlock } from '@/components/ad-block';
import { useUserPlan } from '@/hooks/use-user-plan';
import { useI18n } from '@/hooks/use-i18n';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  is_new?: boolean;
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
  const [isSuggestionsDialogOpen, setIsSuggestionsDialogOpen] = useState(false);
  const [suggestionsData, setSuggestionsData] = useState<{
    newRecipes: any[];
    existingMatchingRecipes: any[];
  } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSuggestingFromInventory, setIsSuggestingFromInventory] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<SavedRecipe | null>(null);
  const { t } = useI18n();
  const { plan } = useUserPlan();
  const location = useLocation();

  useEffect(() => {
    loadRecipes();
    
    // Prüfe ob Dialog von groceries-Seite geöffnet werden soll
    if (location.state?.showSuggestions && location.state?.suggestionsData) {
      setSuggestionsData(location.state.suggestionsData);
      setIsSuggestionsDialogOpen(true);
      // Cleanup location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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

  const handleDelete = (recipe: SavedRecipe) => {
    setRecipeToDelete(recipe);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!recipeToDelete) return;

    setDeletingId(recipeToDelete.id);
    setDeleteConfirmOpen(false);
    
    try {
      await photoRecognitionAPI.deleteRecipe(recipeToDelete.id);
      setRecipes(recipes.filter((r) => r.id !== recipeToDelete.id));
      toast.success(t('recipes.deleted'));
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || t('recipes.deleteFailed'));
    } finally {
      setDeletingId(null);
      setRecipeToDelete(null);
    }
  };

  const handleSuggestFromInventory = async () => {
    setIsSuggestingFromInventory(true);
    try {
      const response = await recipesAPI.suggestFromInventory();
      if (response.data) {
        const { new_recipes, existing_matching_recipes } = response.data;
        
        // Zeige Dialog mit Vorschlägen
        setSuggestionsData({
          newRecipes: new_recipes || [],
          existingMatchingRecipes: existing_matching_recipes || [],
        });
        setIsSuggestionsDialogOpen(true);
        
        // Lade Rezepte neu, um die neuen Vorschläge anzuzeigen
        await loadRecipes();
        
        const totalCount = (new_recipes?.length || 0) + (existing_matching_recipes?.length || 0);
        if (totalCount > 0) {
          toast.success(t('recipes.suggestionsFound', { count: totalCount }));
        } else {
          toast.info(t('recipes.noSuggestionsFound'));
        }
      } else {
        toast.info(t('recipes.noSuggestionsFound'));
      }
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || t('recipes.suggestionsFailed'));
    } finally {
      setIsSuggestingFromInventory(false);
    }
  };

  // Sortiere Rezepte: NEU -> Ältere -> Gekocht
  const sortedRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => {
      // 1. Neue Rezepte zuerst
      if (a.is_new && !b.is_new) return -1;
      if (!a.is_new && b.is_new) return 1;
      
      // 2. Gekochte Rezepte zuletzt
      if (a.is_cooked && !b.is_cooked) return 1;
      if (!a.is_cooked && b.is_cooked) return -1;
      
      // 3. Ansonsten nach saved_at (neueste zuerst)
      if (a.saved_at && b.saved_at) {
        return new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime();
      }
      
      return 0;
    });
  }, [recipes]);

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
        <div className="flex gap-2">
          <Button
            onClick={handleSuggestFromInventory}
            disabled={isSuggestingFromInventory}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChefHat className="h-4 w-4" />
            {isSuggestingFromInventory ? t('recipes.suggesting') : t('recipes.suggestFromInventory')}
          </Button>
          <AddRecipeDialog onRecipeAdded={loadRecipes} />
        </div>
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
          {sortedRecipes.map((recipe) => (
            <Card key={recipe.id} className="overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-white/5 hover:border-[#17f6fe]/30">
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button 
                    variant="default"
                    className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                    onClick={() => {
                        setSelectedRecipeId(recipe.recipe_id);
                        setIsRecipeModalOpen(true);
                      }}
                  >
                    {t('fridge.viewRecipe')}
                  </Button>
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {recipe.is_new && (
                    <Badge className="bg-[#17f6fe] text-black font-bold">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {t('recipes.new')}
                    </Badge>
                  )}
                  {recipe.is_cooked && (
                    <Badge className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      {t('recipes.cooked')}
                    </Badge>
                  )}
                </div>
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
                      onClick={() => handleDelete(recipe)}
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

      <RecipeSuggestionsDialog
        isOpen={isSuggestionsDialogOpen}
        onClose={() => {
          setIsSuggestionsDialogOpen(false);
          setSuggestionsData(null);
        }}
        newRecipes={suggestionsData?.newRecipes || []}
        existingMatchingRecipes={suggestionsData?.existingMatchingRecipes || []}
        onRecipeClick={(recipeId) => {
          setSelectedRecipeId(recipeId);
          setIsRecipeModalOpen(true);
        }}
        isLoading={isSuggestingFromInventory}
      />

      {/* Ad Block für Free Tier User */}
      <AdBlock 
        format="horizontal" 
        currentPlan={plan}
        className="mt-6"
        devMode={import.meta.env.MODE === 'development'}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('recipes.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('recipes.deleteConfirmMessage', { name: recipeToDelete?.title || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>
              {t('common.cancel') || 'Abbrechen'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} disabled={deletingId !== null}>
              {deletingId !== null ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.deleting') || 'Löschen...'}</>
              ) : (
                t('common.delete') || 'Löschen'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
