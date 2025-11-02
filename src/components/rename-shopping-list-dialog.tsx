'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit } from 'lucide-react';
import { shoppingListsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { ShoppingList } from '@/types';

const renameSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

type RenameForm = z.infer<typeof renameSchema>;

interface RenameShoppingListDialogProps {
  list: ShoppingList;
  onRenamed: () => void;
}

export function RenameShoppingListDialog({ list, onRenamed }: RenameShoppingListDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<RenameForm>({
    resolver: zodResolver(renameSchema),
    defaultValues: {
      name: list.name || `Shopping List #${list.id}`,
    },
  });

  useEffect(() => {
    if (open) {
      setValue('name', list.name || `Shopping List #${list.id}`);
    }
  }, [open, list, setValue]);

  const onSubmit = async (data: RenameForm) => {
    setIsLoading(true);
    try {
      await shoppingListsAPI.update(list.id, { name: data.name });
      toast.success(t('shoppingList.listRenamed'));
      setOpen(false);
      reset();
      onRenamed();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to rename list');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('shoppingList.rename')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('shoppingList.listName')}</Label>
            <Input
              id="name"
              placeholder={t('shoppingList.listNamePlaceholder')}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('shoppingList.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('shoppingList.saving') : t('shoppingList.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

