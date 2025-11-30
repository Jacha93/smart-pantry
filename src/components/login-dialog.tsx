'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { auth } from '@/lib/auth';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

interface LoginDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onRegisterClick?: () => void;
}

export function LoginDialog({ isOpen, onOpenChange, onSuccess, onRegisterClick }: LoginDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await auth.login(data.email, data.password);
      toast.success(t('common.loginSuccess'));
      reset();
      onOpenChange(false);
      
      // Kurze Verzögerung, damit der Event gefeuert werden kann
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/groceries');
          router.refresh();
        }
      }, 100);
    } catch (error: unknown) {
      let errorMessage = t('common.loginFailed');
      
      const apiError = error as { response?: { data?: { detail?: string | string[] | { message?: string; msg?: string } } } };
      
      if (apiError.response?.data?.detail) {
        if (typeof apiError.response.data.detail === 'string') {
          errorMessage = apiError.response.data.detail;
        } else if (Array.isArray(apiError.response.data.detail)) {
          errorMessage = apiError.response.data.detail.map((err) => {
            if (typeof err === 'string') return err;
            if (typeof err === 'object' && err !== null) {
              return (err as { msg?: string; message?: string }).msg || (err as { msg?: string; message?: string }).message || String(err);
            }
            return String(err);
          }).join(', ');
        } else if (typeof apiError.response.data.detail === 'object') {
          errorMessage = apiError.response.data.detail.message || apiError.response.data.detail.msg || t('common.invalidCredentials');
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleRegisterLinkClick = () => {
    handleClose();
    if (onRegisterClick) {
      onRegisterClick();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-card-foreground">{t('auth.signIn')}</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {t('auth.enterEmailPassword')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dialog-email" className="text-foreground">{t('auth.email')}</Label>
            <Input
              id="dialog-email"
              type="email"
              autoComplete="email"
              placeholder={t('auth.email')}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-password" className="text-foreground">{t('auth.password')}</Label>
            <Input
              id="dialog-password"
              type="password"
              autoComplete="current-password"
              placeholder={t('auth.password')}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <button
            type="button"
            onClick={handleRegisterLinkClick}
            className="text-primary hover:text-primary/80 hover:underline transition-colors"
          >
            {t('auth.signUp')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

