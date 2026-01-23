import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddGroceryDialog } from '@/components/add-grocery-dialog';
import { GroceryTable } from '@/components/grocery-table';
import { AdBlock } from '@/components/ad-block';
import { useI18n } from '@/hooks/use-i18n';
import { useUserPlan } from '@/hooks/use-user-plan';
import { ChefHat } from 'lucide-react';
import { recipesAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function GroceriesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFindingRecipes, setIsFindingRecipes] = useState(false);
  const { t } = useI18n();
  const { plan } = useUserPlan();
  const navigate = useNavigate();

  const handleGroceryAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleGroceryUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleFindRecipes = async () => {
    setIsFindingRecipes(true);
    try {
      const response = await recipesAPI.suggestFromInventory();
      if (response.data) {
        const { new_recipes, existing_matching_recipes } = response.data;
        const totalCount = (new_recipes?.length || 0) + (existing_matching_recipes?.length || 0);
        
        if (totalCount > 0) {
          // Navigiere zur Rezepte-Seite - der Dialog wird dort geöffnet
          navigate('/app/recipes', { 
            state: { 
              showSuggestions: true,
              suggestionsData: {
                newRecipes: new_recipes || [],
                existingMatchingRecipes: existing_matching_recipes || [],
              }
            }
          });
          toast.success(t('groceries.recipesFound', { count: totalCount }));
        } else {
          toast.info(t('groceries.noRecipesFound'));
        }
      } else {
        toast.info(t('groceries.noRecipesFound'));
      }
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || t('groceries.findRecipesFailed'));
    } finally {
      setIsFindingRecipes(false);
    }
  };

  return (
    <div className="space-y-2 md:space-y-6 px-0.5 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">{t('groceries.title')}</h1>
          <p className="text-xs sm:text-base text-muted-foreground">{t('groceries.subtitle')}</p>
        </div>
        <div className="flex-shrink-0">
          <AddGroceryDialog onGroceryAdded={handleGroceryAdded} />
        </div>
      </div>

      {/* CTA-Bereich für Rezeptvorschläge */}
      <Card className="border-[#17f6fe]/20">
        <CardContent className="p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-xs sm:text-base">{t('groceries.findRecipes')}</h3>
              <p className="text-[10px] sm:text-sm text-muted-foreground mt-0.5">
                {t('groceries.findRecipesDesc')}
              </p>
            </div>
            <Button 
              onClick={handleFindRecipes}
              disabled={isFindingRecipes}
              className="flex items-center gap-1.5 sm:gap-2 h-8 sm:h-10 text-xs sm:text-base w-full sm:w-auto justify-center sm:justify-start"
            >
              <ChefHat className="h-3 w-3 sm:h-4 sm:w-4" />
              {isFindingRecipes ? t('groceries.findingRecipes') : t('groceries.findRecipesButton')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-2 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-xl">{t('groceries.inventory')}</CardTitle>
          <CardDescription className="text-[10px] sm:text-sm">
            {t('groceries.inventoryDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          <GroceryTable key={refreshKey} onGroceryUpdated={handleGroceryUpdated} />
        </CardContent>
      </Card>

      {/* Ad Block für Free Tier User */}
      <AdBlock 
        format="rectangle" 
        currentPlan={plan}
        className="mt-6"
        devMode={import.meta.env.MODE === 'development'}
      />
    </div>
  );
}
