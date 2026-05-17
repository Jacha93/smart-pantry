import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddGroceryDialog } from '@/components/add-grocery-dialog';
import { GroceryTable } from '@/components/grocery-table';
import { AdBlock } from '@/components/ad-block';
import { useI18n } from '@/hooks/use-i18n';
import { useUserPlan } from '@/hooks/use-user-plan';
import { ChefHat, PackageSearch } from 'lucide-react';
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
    <div className="space-y-4 md:space-y-6">
      <div className="rounded-lg border border-white/10 bg-[#101014] p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-[#17f6fe]">Inventory</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">{t('groceries.title')}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('groceries.subtitle')}</p>
          </div>
          <div className="flex-shrink-0">
            <AddGroceryDialog onGroceryAdded={handleGroceryAdded} />
          </div>
        </div>
      </div>

      <Card className="border-[#17f6fe]/20 bg-[#17f6fe]/[0.055]">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-[#17f6fe]/25 bg-[#17f6fe]/10">
                <PackageSearch className="h-5 w-5 text-[#17f6fe]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold sm:text-base">{t('groceries.findRecipes')}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
                  {t('groceries.findRecipesDesc')}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleFindRecipes}
              disabled={isFindingRecipes}
              className="w-full justify-center sm:w-auto"
            >
              <ChefHat className="h-4 w-4" />
              {isFindingRecipes ? t('groceries.findingRecipes') : t('groceries.findRecipesButton')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">{t('groceries.inventory')}</CardTitle>
          <CardDescription className="text-xs leading-5 sm:text-sm">
            {t('groceries.inventoryDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 pt-0 sm:p-6 sm:pt-0">
          <GroceryTable key={refreshKey} onGroceryUpdated={handleGroceryUpdated} />
        </CardContent>
      </Card>

      <AdBlock 
        format="rectangle" 
        currentPlan={plan}
        className="mt-6"
        devMode={import.meta.env.MODE === 'development'}
      />
    </div>
  );
}
