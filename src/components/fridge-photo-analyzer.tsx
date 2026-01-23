'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Plus, ChefHat, Loader2 } from 'lucide-react';
import { photoRecognitionAPI } from '@/lib/api';
import { toast } from 'sonner';
import { RecipeDetailsModal } from './recipe-details-modal';
import { RecipeSuggestionsGrid } from './recipe-suggestions-grid';
import { useI18n } from '@/hooks/use-i18n';


interface Recipe {
  id: number;
  title: string;
  image: string;
  missed_ingredients: Array<{ name: string; amount: number; unit: string }>;
  used_ingredients: Array<{ name: string; amount: number; unit: string }>;
  likes: number;
}

interface AnalysisResult {
  recognized_foods: string[];
  recipe_suggestions: Recipe[];
  message: string;
}

export function FridgePhotoAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAddingGroceries, setIsAddingGroceries] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setAnalysisResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await photoRecognitionAPI.analyzeFridge(formData);

      setAnalysisResult(response.data);
      toast.success(t('fridge.analyzeSuccess'));
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || t('fridge.analyzeFailed'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddToInventory = async () => {
    if (!analysisResult?.recognized_foods) return;

    setIsAddingGroceries(true);
    try {
      await photoRecognitionAPI.addRecognizedGroceries(analysisResult.recognized_foods);
      toast.success(t('fridge.addSuccess'));
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || t('fridge.addFailed'));
    } finally {
      setIsAddingGroceries(false);
    }
  };

  const handleRetakePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>{t('fridge.cardTitle')}</span>
          </CardTitle>
          <CardDescription>
            {t('fridge.cardDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!previewUrl ? (
            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center glass-card">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                {t('fridge.uploadPhoto')}
              </p>
              <p className="text-muted-foreground mb-4">
                {t('fridge.uploadDescription')}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Camera className="h-4 w-4 mr-2" />
                {t('fridge.choosePhoto')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Fridge preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRetakePhoto}
                >
                  {t('fridge.retake')}
                </Button>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('fridge.analyzing')}
                  </>
                ) : (
                  <>
                    <ChefHat className="h-4 w-4 mr-2" />
                    {t('fridge.analyzePhoto')}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {analysisResult && (
        <div className="space-y-6">
          {/* Recognized Foods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>{t('fridge.recognizedItems')}</span>
              </CardTitle>
              <CardDescription>
                {t('fridge.foundItems').replace('{count}', String(analysisResult.recognized_foods?.length || 0))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {(analysisResult.recognized_foods || []).map((food, index) => (
                  <Badge key={index} variant="secondary">
                    {food}
                  </Badge>
                ))}
              </div>
              <Button
                onClick={handleAddToInventory}
                disabled={isAddingGroceries}
                className="w-full"
              >
                {isAddingGroceries ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('fridge.addingToInventory')}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('fridge.addAllToInventory')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recipe Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ChefHat className="h-5 w-5" />
                <span>{t('fridge.recipeSuggestions')}</span>
              </CardTitle>
              <CardDescription>
                {t('fridge.recipeDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecipeSuggestionsGrid 
                recipes={analysisResult.recipe_suggestions || []}
                onRecipeClick={(recipeId) => {
                  setSelectedRecipeId(recipeId);
                  setIsRecipeModalOpen(true);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <RecipeDetailsModal
        recipeId={selectedRecipeId}
        isOpen={isRecipeModalOpen}
        onClose={() => {
          setIsRecipeModalOpen(false);
          setSelectedRecipeId(null);
        }}
      />
    </div>
  );
}
