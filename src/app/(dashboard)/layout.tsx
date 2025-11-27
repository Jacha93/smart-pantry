'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { auth, authDisabled } from '@/lib/auth';
import { LogOut, ShoppingCart, Package, Camera, ChefHat } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useI18n } from '@/hooks/use-i18n';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    if (authDisabled || auth.isAuthenticated()) {
      setIsLoading(false);
    } else {
      router.push('/login');
    }
  }, [router, authDisabled]);

  const handleLogout = () => {
    auth.logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center glass-card p-8 rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="glass-card border-b border-white/20 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <Image
                  src="/smart-pantry-favicon.png"
                  alt="Smart Pantry Icon"
                  width={32}
                  height={32}
                  className="rounded-lg shadow-[0_0_25px_rgba(79,209,197,0.35)]"
                  priority
                />
                <h1 className="text-xl font-bold text-foreground">{t('nav.appTitle')}</h1>
              </div>
              <div className="flex space-x-2">
                <Link
                  href="/groceries"
                  className="flex items-center space-x-2 text-foreground/90 hover:text-foreground hover:bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium transition-all border border-white/10"
                >
                  <Package className="h-4 w-4" />
                  <span>{t('nav.groceries')}</span>
                </Link>
                <Link
                  href="/shopping-list"
                  className="flex items-center space-x-2 text-foreground/90 hover:text-foreground hover:bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium transition-all border border-white/10"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>{t('nav.shoppingList')}</span>
                </Link>
                <Link
                  href="/fridge-analyzer"
                  className="flex items-center space-x-2 text-foreground/90 hover:text-foreground hover:bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium transition-all border border-white/10"
                >
                  <Camera className="h-4 w-4" />
                  <span>{t('nav.fridgeAnalyzer')}</span>
                </Link>
                <Link
                  href="/recipes"
                  className="flex items-center space-x-2 text-foreground/90 hover:text-foreground hover:bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium transition-all border border-white/10"
                >
                  <ChefHat className="h-4 w-4" />
                  <span>{t('nav.recipes')}</span>
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('nav.logout')}</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
