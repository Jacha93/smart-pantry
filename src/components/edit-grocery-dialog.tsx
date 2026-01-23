'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { groceriesAPI } from '@/lib/api';
import { useI18n } from '@/hooks/use-i18n';
import { GROCERY_CATEGORIES, UNITS as GROCERY_UNITS, Grocery } from '@/types';

interface EditGroceryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  grocery: Grocery | null;
}

export function EditGroceryDialog({ open, onOpenChange, onSuccess, grocery }: EditGroceryDialogProps) {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState('Other');
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [lowStockThreshold, setLowStockThreshold] = useState('1');

  // Initialize form when grocery changes
  useEffect(() => {
    if (grocery) {
      setName(grocery.name);
      setQuantity(grocery.quantity.toString());
      setUnit(grocery.unit);
      setCategory(grocery.category);
      setExpiryDate(grocery.expiry_date ? new Date(grocery.expiry_date) : undefined);
      setLowStockThreshold(grocery.low_stock_threshold?.toString() || '1');
    }
  }, [grocery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grocery) return;

    if (!name || !quantity || !unit || !category) {
      toast.error(t('common.fillAllFields'));
      return;
    }

    try {
      setIsLoading(true);
      
      const updateData = {
        name,
        quantity: parseFloat(quantity),
        unit,
        category,
        expiry_date: expiryDate ? expiryDate.toISOString() : undefined,
        low_stock_threshold: parseFloat(lowStockThreshold) || 1
      };

      await groceriesAPI.update(grocery.id, updateData);
      
      toast.success(t('groceries.updatedSuccess'));
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to update grocery:', error);
      toast.error(error.response?.data?.detail || t('groceries.failedToUpdate'));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to translate category names
  const translateCategory = (cat: string): string => {
    const categoryKey = `category.${cat.toLowerCase()}`;
    return t(categoryKey) || cat;
  };

  // Helper function to translate unit names
  const translateUnit = (u: string): string => {
    const unitKey = `unit.${u.toLowerCase()}`;
    return t(unitKey) || u;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[425px] p-3 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-base sm:text-xl">{t('groceries.editTitle')}</DialogTitle>
          <DialogDescription className="text-[10px] sm:text-sm">
            {t('groceries.editDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-4">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="edit-name" className="text-xs sm:text-sm">{t('common.name')}</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="h-8 sm:h-10 text-xs sm:text-sm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="edit-quantity" className="text-xs sm:text-sm">{t('common.quantity')}</Label>
              <Input
                id="edit-quantity"
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={isLoading}
                className="h-8 sm:h-10 text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="edit-unit" className="text-xs sm:text-sm">{t('common.unit')}</Label>
              <Select value={unit} onValueChange={setUnit} disabled={isLoading}>
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder={t('common.selectUnit')} />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  {GROCERY_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {translateUnit(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="edit-category" className="text-xs sm:text-sm">{t('common.category')}</Label>
            <Select value={category} onValueChange={setCategory} disabled={isLoading}>
              <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder={t('common.selectCategory')} />
              </SelectTrigger>
              <SelectContent className="z-[100]">
                {GROCERY_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {translateCategory(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label className="text-xs sm:text-sm">{t('groceries.expiryDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-8 sm:h-10 text-xs sm:text-sm",
                    !expiryDate && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {expiryDate ? format(expiryDate, "PPP") : <span>{t('groceries.pickDate')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" side="bottom">
                <Calendar
                  mode="single"
                  selected={expiryDate}
                  onSelect={setExpiryDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="edit-threshold" className="text-xs sm:text-sm">{t('groceries.lowStockThreshold')}</Label>
            <Input
              id="edit-threshold"
              type="number"
              min="0"
              step="1"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              disabled={isLoading}
              className="h-8 sm:h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-1.5 sm:space-x-2 pt-2 sm:pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="h-8 sm:h-10 text-xs sm:text-sm">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading} className="h-8 sm:h-10 text-xs sm:text-sm">
              {isLoading && <Loader2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
              {t('common.saveChanges')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
