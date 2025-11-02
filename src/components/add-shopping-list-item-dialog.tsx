'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { shoppingListsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';

const itemSchema = z.object({
  grocery_name: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
});

type ItemForm = z.infer<typeof itemSchema>;

interface AddShoppingListItemDialogProps {
  listId: number;
  onItemAdded: () => void;
}

export function AddShoppingListItemDialog({ listId, onItemAdded }: AddShoppingListItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
  });

  const onSubmit = async (data: ItemForm) => {
    setIsLoading(true);
    try {
      await shoppingListsAPI.addItem(listId, data);
      toast.success(t('shoppingList.itemAdded'));
      setOpen(false);
      reset();
      onItemAdded();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('shoppingList.failedToAdd'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hover:scale-[1.02] active:scale-[0.98] transition-transform">
          <Plus className="h-4 w-4 mr-2" />
          {t('shoppingList.addItem')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('shoppingList.addItem')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grocery_name">{t('shoppingList.itemName')}</Label>
            <Input
              id="grocery_name"
              placeholder={t('shoppingList.itemNamePlaceholder')}
              {...register('grocery_name')}
            />
            {errors.grocery_name && (
              <p className="text-sm text-destructive">{errors.grocery_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">{t('shoppingList.quantity')}</Label>
            <Input
              id="quantity"
              type="number"
              step="1"
              placeholder="1"
              {...register('quantity', { valueAsNumber: true })}
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity.message}</p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('shoppingList.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading} className="hover:scale-[1.02] active:scale-[0.98] transition-transform">
              {isLoading ? t('shoppingList.adding') : t('shoppingList.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

