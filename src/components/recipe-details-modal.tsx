'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Users, ChefHat, Check } from 'lucide-react';
import { photoRecognitionAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';

interface RecipeDetails {
  id: number;
  title: string;
  image: string;
  instructions: string;
  ingredients: Array<{
    id: number;
    name: string;
    amount: number;
    unit: string;
  }>;
  nutrition: {
    nutrients: Array<{
      name: string;
      amount: number;
      unit: string;
    }>;
  };
  ready_in_minutes: number;
  servings: number;
}

interface RecipeDetailsModalProps {
  recipeId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeDetailsModal({ recipeId, isOpen, onClose }: RecipeDetailsModalProps) {
  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedInstructions, setTranslatedInstructions] = useState<string | null>(null);
  const [translatedIngredients, setTranslatedIngredients] = useState<RecipeDetails['ingredients'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslatingTitle, setIsTranslatingTitle] = useState(false);
  const [isTranslatingInstructions, setIsTranslatingInstructions] = useState(false);
  const [isTranslatingIngredients, setIsTranslatingIngredients] = useState(false);
  const [isMarkingAsCooked, setIsMarkingAsCooked] = useState(false);
  const [isCooked, setIsCooked] = useState(false);
  const { t, locale } = useI18n();

  useEffect(() => {
    if (recipeId && isOpen) {
      fetchRecipeDetails();
      checkIfCooked();
    }
    // Reset translation when modal closes or recipe changes
    if (!isOpen || !recipeId) {
      setTranslatedTitle(null);
      setTranslatedInstructions(null);
      setTranslatedIngredients(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId, isOpen, locale]); // locale als Dependency für Re-Übersetzung bei Sprachwechsel

  const checkIfCooked = async () => {
    if (!recipeId) return;
    try {
      const response = await photoRecognitionAPI.getCookedRecipes();
      const cooked = response.data.some((r: { recipe_id: number }) => r.recipe_id === recipeId);
      setIsCooked(cooked);
    } catch {
      // Ignore errors
    }
  };

  // Einfache Spracheerkennung: Prüft ob Text hauptsächlich Englisch ist
  const isLikelyEnglish = (text: string): boolean => {
    const englishWords = ['the', 'and', 'or', 'with', 'for', 'into', 'over', 'heat', 'cook', 'add', 'stir', 'mix', 'cup', 'tablespoon', 'teaspoon', 'minutes', 'oven', 'pan', 'frying', 'what', 'how', 'make', 'style', 'easy', 'quick', 'best', 'recipe', 'dinner', 'lunch', 'breakfast', 'chicken', 'beef', 'pork', 'pasta', 'salad', 'soup', 'sauce'];
    const textLower = text.toLowerCase();
    const englishWordCount = englishWords.filter(word => textLower.includes(word)).length;
    return englishWordCount >= 1; // Bereits bei 1 englischen Wort übersetzen
  };

  // Prüft ob Zutaten wahrscheinlich Englisch sind
  const areIngredientsLikelyEnglish = (ingredients: RecipeDetails['ingredients']): boolean => {
    // Erweiterte Liste englischer Zutatenwörter
    const englishIngredientWords = [
      'flour', 'sugar', 'salt', 'pepper', 'oil', 'butter', 'milk', 'eggs', 'egg', 'cheese', 
      'chicken', 'beef', 'pork', 'lamb', 'fish', 'shrimp', 'salmon', 'tuna',
      'onion', 'garlic', 'tomato', 'potato', 'carrot', 'celery', 'broccoli', 'spinach',
      'tablespoon', 'teaspoon', 'cup', 'pound', 'ounce', 'clove', 'cloves',
      'cream', 'water', 'stock', 'broth', 'sauce', 'paste', 'juice', 'vinegar',
      'olive', 'vegetable', 'canola', 'sesame', 'coconut',
      'rice', 'pasta', 'noodles', 'bread', 'crumbs',
      'fresh', 'dried', 'ground', 'chopped', 'minced', 'sliced', 'diced',
      'large', 'small', 'medium', 'whole', 'half',
      'baking', 'powder', 'soda', 'yeast', 'vanilla', 'extract',
      'lemon', 'lime', 'orange', 'apple', 'banana', 'berry', 'berries'
    ];
    const allNames = ingredients.map(ing => ing.name.toLowerCase()).join(' ');
    const englishWordCount = englishIngredientWords.filter(word => allNames.includes(word)).length;
    // Bereits bei 1 englischem Wort übersetzen (weniger streng)
    return englishWordCount >= 1;
  };

  const translateInstructionsIfNeeded = async (instructions: string) => {
    // Nur übersetzen wenn:
    // 1. User hat Deutsch ausgewählt
    // 2. Anleitung ist wahrscheinlich Englisch
    if (locale === 'de' && instructions && isLikelyEnglish(instructions)) {
      setIsTranslatingInstructions(true);
      try {
        const response = await photoRecognitionAPI.translateInstructions(instructions, 'de');
        setTranslatedInstructions(response.data.translated_text);
      } catch (error: unknown) {
        console.warn('Übersetzung fehlgeschlagen, verwende Original:', error);
        // Bei Fehler Original verwenden
        setTranslatedInstructions(null);
      } finally {
        setIsTranslatingInstructions(false);
      }
    } else {
      setTranslatedInstructions(null);
    }
  };

  const translateTitleIfNeeded = async (title: string) => {
    // Nur übersetzen wenn:
    // 1. User hat Deutsch ausgewählt
    // 2. Titel ist wahrscheinlich Englisch
    if (locale === 'de' && title && isLikelyEnglish(title)) {
      setIsTranslatingTitle(true);
      try {
        const response = await photoRecognitionAPI.translateTitle(title, 'de');
        setTranslatedTitle(response.data.translated_title);
      } catch (error: unknown) {
        console.warn('Titel-Übersetzung fehlgeschlagen, verwende Original:', error);
        // Bei Fehler Original verwenden
        setTranslatedTitle(null);
      } finally {
        setIsTranslatingTitle(false);
      }
    } else {
      setTranslatedTitle(null);
    }
  };

  const translateIngredientsIfNeeded = async (ingredients: RecipeDetails['ingredients']) => {
    // Nur übersetzen wenn:
    // 1. User hat Deutsch ausgewählt
    // 2. Zutaten sind wahrscheinlich Englisch
    if (locale === 'de' && ingredients && ingredients.length > 0 && areIngredientsLikelyEnglish(ingredients)) {
      setIsTranslatingIngredients(true);
      try {
        const response = await photoRecognitionAPI.translateIngredients(ingredients, 'de');
        setTranslatedIngredients(response.data.translated_ingredients);
      } catch (error: unknown) {
        console.warn('Zutaten-Übersetzung fehlgeschlagen, verwende Original:', error);
        // Bei Fehler Original verwenden
        setTranslatedIngredients(null);
      } finally {
        setIsTranslatingIngredients(false);
      }
    } else {
      setTranslatedIngredients(null);
    }
  };

  const fetchRecipeDetails = async () => {
    if (!recipeId) return;

    setIsLoading(true);
    setTranslatedTitle(null);
    setTranslatedInstructions(null);
    setTranslatedIngredients(null);
    try {
      const response = await photoRecognitionAPI.getRecipeDetails(recipeId);
      const recipeData = response.data;
      setRecipe(recipeData);
      
      // Übersetze Titel falls nötig (asynchron, blockiert nicht das Laden)
      if (recipeData.title) {
        translateTitleIfNeeded(recipeData.title);
      }
      
      // Übersetze Anleitung falls nötig (asynchron, blockiert nicht das Laden)
      if (recipeData.instructions) {
        translateInstructionsIfNeeded(recipeData.instructions);
      }
      
      // Übersetze Zutaten falls nötig (asynchron, blockiert nicht das Laden)
      if (recipeData.ingredients && recipeData.ingredients.length > 0) {
        translateIngredientsIfNeeded(recipeData.ingredients);
      }
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || 'Failed to load recipe details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsCooked = async () => {
    if (!recipe || !recipeId) return;

    setIsMarkingAsCooked(true);
    try {
      await photoRecognitionAPI.markRecipeAsCooked(recipeId, recipe.title);
      setIsCooked(true);
      toast.success(t('recipe.markedAsCooked'));
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || t('recipe.markedAsCookedFailed'));
    } finally {
      setIsMarkingAsCooked(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ChefHat className="h-5 w-5" />
            <span>{t('recipe.details')}</span>
          </DialogTitle>
          <DialogDescription>
            {recipe ? `${t('recipe.detailsFor')} ${translatedTitle || recipe.title}` : t('recipe.loading')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>{t('recipe.loading')}</p>
            </div>
          </div>
        ) : recipe ? (
          <div className="space-y-6">
            {/* Recipe Header */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-1/2">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <div className="md:w-1/2 space-y-4">
                <div className="flex items-start gap-2">
                  <h2 className="text-2xl font-bold">{translatedTitle || recipe.title}</h2>
                  {isTranslatingTitle && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-1.5" />
                  )}
                  </div>
                <div className="flex flex-wrap gap-4">
                  <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary/10 text-foreground border border-primary/20">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{recipe.ready_in_minutes} {t('recipe.minutes')}</span>
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary/10 text-foreground border border-primary/20">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{recipe.servings} {t('recipe.servings')}</span>
                  </Badge>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">{t('recipe.ingredients')}</h3>
                {isTranslatingIngredients && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{t('recipe.translating')}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(translatedIngredients || recipe.ingredients).map((ingredient, idx) => (
                  <div key={ingredient.id || `ingredient-${idx}`} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-100 rounded border border-gray-200">
                    <Badge variant="outline" className="text-xs bg-white text-gray-700 border-gray-300">
                      {ingredient.amount} {ingredient.unit}
                    </Badge>
                    <span className="text-sm text-gray-900 dark:text-gray-800 font-medium">{ingredient.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">{t('recipe.instructions')}</h3>
                {isTranslatingInstructions && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{t('recipe.translating')}</span>
                  </div>
                )}
              </div>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: translatedInstructions || recipe.instructions 
                }}
              />
            </div>

            {/* Nutrition */}
            {recipe.nutrition?.nutrients && (
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('recipe.nutrition')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {recipe.nutrition.nutrients.slice(0, 8).map((nutrient, index) => (
                    <div key={`nutrient-${index}-${nutrient.name || index}`} className="text-center p-2 bg-gray-50 dark:bg-gray-100 rounded border border-gray-200">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-800">{nutrient.name}</div>
                      <div className="text-xs text-gray-700 dark:text-gray-700">
                        {nutrient.amount.toFixed(1)} {nutrient.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('recipe.noDetails')}</p>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          {recipe && !isCooked && (
            <Button
              onClick={handleMarkAsCooked}
              disabled={isMarkingAsCooked}
              className="flex items-center gap-2"
            >
              {isMarkingAsCooked ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('recipe.markingAsCooked')}</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>{t('recipe.markAsCooked')}</span>
                </>
              )}
            </Button>
          )}
          {recipe && isCooked && (
            <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20">
              <Check className="h-4 w-4" />
              <span>{t('recipe.markedAsCooked')}</span>
            </Badge>
          )}
          <div className={recipe && !isCooked ? '' : 'ml-auto'}>
          <Button variant="outline" onClick={onClose}>
              {t('recipe.close')}
          </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
