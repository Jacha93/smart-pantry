'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { auth } from '@/lib/auth';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { Loader2 } from 'lucide-react';

const baseRegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string()
});

type RegisterForm = z.infer<typeof baseRegisterSchema>;

interface RegisterDialogProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export function RegisterDialog({ 
  trigger, 
  isOpen: controlledIsOpen, 
  onOpenChange: controlledOnOpenChange,
  onSuccess,
  onLoginClick 
}: RegisterDialogProps) {
  const { t } = useI18n();

  const registerSchema = z.object({
    name: z.string().min(2, t('auth.nameMinLength')),
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(6, t('auth.passwordMinLength')),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.passwordsDoNotMatch'),
    path: ["confirmPassword"],
  });

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isOpen = controlledIsOpen ?? internalIsOpen;
  const setIsOpen = controlledOnOpenChange ?? setInternalIsOpen;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await auth.register(data.email, data.password, data.name);
      toast.success(t('common.registrationSuccess'));
      setIsOpen(false);
      reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.detail || error.message || t('common.registrationFailed');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('common.register')}</DialogTitle>
          <DialogDescription>
            {t('auth.createAccountDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="reg-name">{t('common.name')}</Label>
            <Input
              id="reg-name"
              placeholder={t('common.exampleName')}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email">{t('common.email')}</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder={t('common.exampleEmail')}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">{t('common.password')}</Label>
            <Input
              id="reg-password"
              type="password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-confirm">{t('common.confirmPassword')}</Label>
            <Input
              id="reg-confirm"
              type="password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>
          <DialogFooter className="flex-col sm:justify-between gap-4 pt-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.registering')}
                </>
              ) : (
                t('common.register')
              )}
            </Button>
            {onLoginClick && (
              <div className="text-center text-sm">
                {t('auth.haveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onLoginClick();
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {t('auth.loginHere')}
                </button>
              </div>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

