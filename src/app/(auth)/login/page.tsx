'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await auth.login(data.email, data.password);
      toast.success(t('common.loginSuccess'));
      router.push('/groceries');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Link href="/" className="flex justify-center mb-2 hover:opacity-80 transition-opacity">
            <Image
              src="/smart-pantry-favicon.png"
              alt="Smart Pantry Icon"
              width={56}
              height={56}
              className="rounded-xl shadow-[0_0_30px_rgba(129,140,248,0.35)]"
              priority
            />
          </Link>
          <CardTitle className="text-2xl font-bold text-center text-card-foreground">{t('auth.signIn')}</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {t('auth.enterEmailPassword')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">{t('auth.email')}</Label>
              <Input
                id="email"
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
              <Label htmlFor="password" className="text-foreground">{t('auth.password')}</Label>
              <Input
                id="password"
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
            <Link href="/register" className="text-primary hover:text-primary/80 hover:underline transition-colors">
              {t('auth.signUp')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
