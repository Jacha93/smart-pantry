'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/hooks/use-i18n';
import { Loader2 } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData: { name: string; email: string };
  onSubmit: (data: { name?: string; email?: string }) => Promise<void>;
}

export function ProfileForm({ initialData, onSubmit }: ProfileFormProps) {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData,
  });

  const onFormSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const updateData: { name?: string; email?: string } = {};
      if (data.name !== initialData.name) {
        updateData.name = data.name;
      }
      if (data.email !== initialData.email) {
        updateData.email = data.email;
      }
      
      if (Object.keys(updateData).length > 0) {
        await onSubmit(updateData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('profile.name')}</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder={t('profile.namePlaceholder')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('profile.email')}</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder={t('profile.emailPlaceholder')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" disabled={!isDirty || isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('profile.saving')}
          </>
        ) : (
          t('profile.saveChanges')
        )}
      </Button>
    </form>
  );
}

