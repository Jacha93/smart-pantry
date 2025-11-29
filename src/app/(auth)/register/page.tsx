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

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      console.log('Registration attempt:', { email: data.email, name: data.name });
      await auth.register(data.email, data.password, data.name);
      console.log('Registration successful');
      toast.success(t('common.registrationSuccess'));
      router.push('/login');
    } catch (error: unknown) {
      console.error('Registration error in component:', error);
      let errorMessage = t('common.registrationFailed');
      
      const apiError = error as { 
        response?: { 
          data?: { 
            detail?: string | string[] | { message?: string; msg?: string } 
          },
          status?: number
        },
        message?: string,
        code?: string
      };
      
      // Log detailed error information
      console.error('API Error details:', {
        hasResponse: !!apiError.response,
        status: apiError.response?.status,
        data: apiError.response?.data,
        message: apiError.message,
        code: apiError.code,
      });
      
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
          errorMessage = apiError.response.data.detail.message || apiError.response.data.detail.msg || t('common.registrationFailed');
        }
      } else if (apiError.message) {
        // If no response but there's a message (network error, CORS, etc.)
        errorMessage = apiError.message;
      }
      
      console.error('Final error message:', errorMessage);
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
          <CardTitle className="text-2xl font-bold text-center text-card-foreground">{t('auth.createAccount')}</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {t('auth.enterDetails')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">{t('auth.name')}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t('auth.name')}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
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
                placeholder={t('auth.password')}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">{t('auth.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('auth.confirmPassword')}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {t('auth.haveAccount')}{' '}
            <Link href="/login" className="text-primary hover:text-primary/80 hover:underline transition-colors">
              {t('auth.signIn')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
