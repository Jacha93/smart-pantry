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
  fullName: z.string().min(1, 'Full name is required'),
  username: z.string().optional(),
  email: z.string().email('Invalid email address'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData: { fullName: string; username?: string; email: string };
  onSubmit: (data: { fullName?: string; username?: string; email?: string }) => Promise<void>;
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
      const updateData: { fullName?: string; username?: string; email?: string } = {};
      if (data.fullName !== initialData.fullName) {
        updateData.fullName = data.fullName;
      }
      if (data.username !== (initialData.username || '')) {
        updateData.username = data.username || null;
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
        <Label htmlFor="fullName">{t('profile.fullName')}</Label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="off"
          {...register('fullName')}
          placeholder={t('profile.fullNamePlaceholder')}
        />
        {errors.fullName && (
          <p className="text-sm text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">{t('profile.username')}</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          {...register('username')}
          placeholder={t('profile.usernamePlaceholder')}
        />
        {errors.username && (
          <p className="text-sm text-destructive">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('profile.email')}</Label>
        <Input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
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

