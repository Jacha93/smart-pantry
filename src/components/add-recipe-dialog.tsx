'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Minus, X, Loader2, ChefHat, Clock, Users, ImageIcon } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { generateUUID } from '@/lib/utils';

interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

interface AddRecipeDialogProps {
  onRecipeAdded: () => void;
}

export function AddRecipeDialog({ onRecipeAdded }: AddRecipeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useI18n();

  // Formular-State
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [servings, setServings] = useState(4);
  const [prepTime, setPrepTime] = useState(30);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: generateUUID(), name: '', amount: 1, unit: '' }
  ]);
  const [instructions, setInstructions] = useState('');

  const resetForm = () => {
    setTitle('');
    setImageUrl('');
    setServings(4);
    setPrepTime(30);
    setIngredients([{ id: generateUUID(), name: '', amount: 1, unit: '' }]);
    setInstructions('');
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  // Zahlenfeld-Komponente
  const NumberInput = ({ 
    value, 
    onChange, 
    min = 1, 
    max = 999,
    step = 1,
    label,
    icon: Icon
  }: { 
    value: number; 
    onChange: (val: number) => void; 
    min?: number; 
    max?: number;
    step?: number;
    label: string;
    icon: React.ElementType;
  }) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </Label>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          value={value}
          onChange={(e) => {
            const val = parseInt(e.target.value) || min;
            onChange(Math.min(max, Math.max(min, val)));
          }}
          min={min}
          max={max}
          className="text-center h-10 w-20"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Zutat hinzufügen
  const addIngredient = () => {
    setIngredients([...ingredients, { id: generateUUID(), name: '', amount: 1, unit: '' }]);
  };

  // Zutat entfernen
  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ing => ing.id !== id));
    }
  };

  // Zutat aktualisieren
  const updateIngredient = (id: string, field: keyof Omit<Ingredient, 'id'>, value: string | number) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, [field]: value } : ing
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validierung
    if (!title.trim()) {
      toast.error(t('addRecipe.titleRequired'));
      return;
    }

    const validIngredients = ingredients.filter(ing => ing.name.trim());
    if (validIngredients.length === 0) {
      toast.error(t('addRecipe.ingredientsRequired'));
      return;
    }

    if (!instructions.trim()) {
      toast.error(t('addRecipe.instructionsRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/recipes', {
        title: title.trim(),
        image: imageUrl.trim() || '/smart-pantry-favicon.png', // Fallback-Bild
        ready_in_minutes: prepTime,
        servings,
        ingredients: validIngredients.map(ing => ({
          name: ing.name.trim(),
          amount: ing.amount,
          unit: ing.unit.trim()
        })),
        instructions: instructions.trim(),
        is_custom: true // Markiert als eigenes Rezept
      });

      toast.success(t('addRecipe.success'));
      handleClose();
      onRecipeAdded();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || t('addRecipe.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('addRecipe.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            {t('addRecipe.title')}
          </DialogTitle>
          <DialogDescription>
            {t('addRecipe.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titel */}
          <div className="space-y-2">
            <Label htmlFor="recipe-title">{t('addRecipe.recipeName')}</Label>
            <Input
              id="recipe-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('addRecipe.recipeNamePlaceholder')}
              className="text-lg"
            />
          </div>

          {/* Bild-URL */}
          <div className="space-y-2">
            <Label htmlFor="recipe-image" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              {t('addRecipe.imageUrl')}
            </Label>
            <Input
              id="recipe-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={t('addRecipe.imageUrlPlaceholder')}
              type="url"
            />
            {imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-white/10 h-32 w-full">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/smart-pantry-favicon.png';
                  }}
                />
              </div>
            )}
          </div>

          {/* Portionen und Zubereitungszeit */}
          <div className="grid grid-cols-2 gap-6">
            <NumberInput
              value={servings}
              onChange={setServings}
              min={1}
              max={50}
              label={t('addRecipe.servings')}
              icon={Users}
            />
            <NumberInput
              value={prepTime}
              onChange={setPrepTime}
              min={5}
              max={480}
              step={5}
              label={t('addRecipe.prepTime')}
              icon={Clock}
            />
          </div>

          {/* Zutaten */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t('addRecipe.ingredients')}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIngredient}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                {t('addRecipe.addIngredient')}
              </Button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <div key={ingredient.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 w-24">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => updateIngredient(ingredient.id, 'amount', Math.max(0.25, ingredient.amount - 0.25))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={ingredient.amount}
                      onChange={(e) => updateIngredient(ingredient.id, 'amount', parseFloat(e.target.value) || 1)}
                      min={0.25}
                      step={0.25}
                      className="text-center h-8 w-14 text-sm px-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => updateIngredient(ingredient.id, 'amount', ingredient.amount + 0.25)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    value={ingredient.unit}
                    onChange={(e) => updateIngredient(ingredient.id, 'unit', e.target.value)}
                    placeholder={t('addRecipe.unit')}
                    className="w-20 h-8 text-sm"
                  />
                  <Input
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)}
                    placeholder={`${t('addRecipe.ingredient')} ${index + 1}`}
                    className="flex-1 h-8 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => removeIngredient(ingredient.id)}
                    disabled={ingredients.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Anleitung */}
          <div className="space-y-2">
            <Label htmlFor="recipe-instructions">{t('addRecipe.instructions')}</Label>
            <textarea
              id="recipe-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t('addRecipe.instructionsPlaceholder')}
              rows={6}
              className="w-full rounded-lg border border-white/10 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <ChefHat className="h-4 w-4 mr-2" />
                  {t('addRecipe.save')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

