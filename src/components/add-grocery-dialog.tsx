'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { GROCERY_CATEGORIES, UNITS } from '@/types';
import { groceriesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { UpgradePrompt } from '@/components/upgrade-prompt';
import { useState } from 'react';

const grocerySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().min(0, 'Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  category: z.string().min(1, 'Category is required'),
  expiry_date: z.date().optional(),
  low_stock_threshold: z.number().min(0, 'Threshold must be positive'),
});

type GroceryForm = z.infer<typeof grocerySchema>;

interface AddGroceryDialogProps {
  onGroceryAdded: () => void;
}

export function AddGroceryDialog({ onGroceryAdded }: AddGroceryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [limitError, setLimitError] = useState<{ limitType: 'groceries_total' | 'groceries_with_expiry', limit: number, current: number } | null>(null);
  const { t } = useI18n();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<GroceryForm>({
    resolver: zodResolver(grocerySchema),
  });

  const watchedExpiryDate = watch('expiry_date');

  const onSubmit = async (data: GroceryForm) => {
    setIsLoading(true);
    try {
      await groceriesAPI.create({
        ...data,
        expiry_date: data.expiry_date?.toISOString(),
      });
      toast.success(t('groceries.addedSuccess'));
      setOpen(false);
      reset();
      onGroceryAdded();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string; limit?: string; limitReached?: boolean } } };
      if (apiError.response?.data?.limitReached && apiError.response?.data?.limit) {
        const limitType = apiError.response.data.limit as 'groceries_total' | 'groceries_with_expiry';
        // Parse limit from error message or use default
        const limitMatch = apiError.response.data.detail?.match(/(\d+)/);
        const limit = limitMatch ? parseInt(limitMatch[1]) : (limitType === 'groceries_total' ? 20 : 10);
        setLimitError({ limitType, limit, current: limit });
      } else {
        toast.error(apiError.response?.data?.detail || t('groceries.failedToAdd'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('groceries.add')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('groceries.addNew')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('groceries.name')}</Label>
            <Input
              id="name"
              placeholder={t('groceries.enterName')}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">{t('groceries.quantity')}</Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                placeholder="0"
                {...register('quantity', { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">{t('groceries.unit')}</Label>
              <Select onValueChange={(value) => setValue('unit', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('groceries.selectUnit')} />
                </SelectTrigger>
                <SelectContent  className="z-[100]">
                  {UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-destructive">{errors.unit.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t('groceries.category')}</Label>
            <Select onValueChange={(value) => setValue('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('groceries.selectCategory')} />
              </SelectTrigger>
              <SelectContent  className="z-[100]">
                {GROCERY_CATEGORIES.map((category) => {
                  const categoryKey = `category.${category.toLowerCase()}`;
                  return (
                  <SelectItem key={category} value={category}>
                      {t(categoryKey) || category}
                  </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('groceries.expiryDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !watchedExpiryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watchedExpiryDate ? format(watchedExpiryDate, "PPP") : t('groceries.pickDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watchedExpiryDate}
                  onSelect={(date) => setValue('expiry_date', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="low_stock_threshold">{t('groceries.lowStockThreshold')}</Label>
            <Input
              id="low_stock_threshold"
              type="number"
              step="0.1"
              placeholder="1.0"
              {...register('low_stock_threshold', { valueAsNumber: true })}
            />
            {errors.low_stock_threshold && (
              <p className="text-sm text-destructive">{errors.low_stock_threshold.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('groceries.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('groceries.adding') : t('groceries.add')}
            </Button>
          </div>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
