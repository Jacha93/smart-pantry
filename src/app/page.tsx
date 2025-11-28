'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { auth, authDisabled } from '@/lib/auth';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LoginDialog } from '@/components/login-dialog';
import { Footer } from '@/components/footer';
import { useI18n } from '@/hooks/use-i18n';
import { 
  Package, 
  Camera, 
  ChefHat, 
  ShoppingCart, 
  Sparkles, 
  Shield, 
  Zap,
  ArrowRight,
  LogIn,
  LogOut,
  LayoutDashboard
} from 'lucide-react';

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    // Check auth status
    const checkAuth = () => {
      const authenticated = authDisabled || auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsLoading(false);
      // KEINE automatische Weiterleitung - eingeloggte User können die Landing Page sehen
    };
    checkAuth();
    
    // Listen for auth changes (storage events + custom events)
    const handleAuthChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('authchange', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('authchange', handleAuthChange);
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    router.push('/groceries');
    router.refresh();
  };

  const features = [
    {
      icon: Package,
      titleKey: 'landing.feature1Title',
      descKey: 'landing.feature1Desc',
    },
    {
      icon: Camera,
      titleKey: 'landing.feature2Title',
      descKey: 'landing.feature2Desc',
    },
    {
      icon: ChefHat,
      titleKey: 'landing.feature3Title',
      descKey: 'landing.feature3Desc',
    },
    {
      icon: ShoppingCart,
      titleKey: 'landing.feature4Title',
      descKey: 'landing.feature4Desc',
    },
  ];

  const highlights = [
    {
      icon: Sparkles,
      titleKey: 'landing.highlight1Title',
      descKey: 'landing.highlight1Desc',
    },
    {
      icon: Shield,
      titleKey: 'landing.highlight2Title',
      descKey: 'landing.highlight2Desc',
    },
    {
      icon: Zap,
      titleKey: 'landing.highlight3Title',
      descKey: 'landing.highlight3Desc',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="glass-card border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
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
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {!isLoading && (
                isAuthenticated ? (
                  <div className="flex gap-2">
                    <Link href="/groceries">
                      <Button className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        {t('landing.goToApp')}
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => {
                        auth.logout();
                        setIsAuthenticated(false);
                        router.refresh();
                      }}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('nav.logout')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => setIsLoginDialogOpen(true)}
                    >
                      <LogIn className="h-4 w-4" />
                      {t('auth.signIn')}
                    </Button>
                    <Link href="/register">
                      <Button className="flex items-center gap-2">
                        {t('auth.signUp')}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  {t('landing.heroTitle')}
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {t('landing.heroSubtitle')}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {!isLoading && (
                  isAuthenticated ? (
                    <Link href="/groceries">
                      <Button size="lg" className="text-lg px-8 py-6 flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5" />
                        {t('landing.goToApp')}
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/register">
                        <Button size="lg" className="text-lg px-8 py-6 flex items-center gap-2">
                          {t('landing.getStarted')}
                          <ArrowRight className="h-5 w-5" />
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="text-lg px-8 py-6 flex items-center gap-2"
                        onClick={() => setIsLoginDialogOpen(true)}
                      >
                        <LogIn className="h-5 w-5" />
                        {t('auth.signIn')}
                      </Button>
                    </>
                  )
                )}
              </div>
            </div>

            {/* Hero Image Placeholder */}
            <div className="relative">
              <div className="glass-card rounded-2xl p-8 border border-white/20">
                <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-32 h-32 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Image
                        src="/smart-pantry-favicon.png"
                        alt="Smart Pantry"
                        width={80}
                        height={80}
                        className="rounded-xl"
                      />
                    </div>
                    <p className="text-muted-foreground text-sm">{t('landing.heroImageAlt')}</p>
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 glass-card rounded-full px-4 py-2 border border-white/20 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t('landing.aiPowered')}</span>
              </div>
              <div className="absolute -bottom-4 -left-4 glass-card rounded-full px-4 py-2 border border-white/20 flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">{t('landing.secure')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t(feature.descKey)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {highlights.map((highlight, index) => (
              <div key={index} className="glass-card rounded-2xl p-8 border border-white/20 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                  <highlight.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {t(highlight.titleKey)}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(highlight.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-3xl p-12 border border-white/20 text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t('landing.ctaTitle')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('landing.ctaSubtitle')}
            </p>
            {!isLoading && (
              isAuthenticated ? (
                <Link href="/groceries">
                  <Button size="lg" className="text-lg px-10 py-6 flex items-center gap-2 mx-auto">
                    <LayoutDashboard className="h-5 w-5" />
                    {t('landing.goToApp')}
                  </Button>
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register">
                    <Button size="lg" className="text-lg px-10 py-6 flex items-center gap-2">
                      {t('landing.getStarted')}
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="text-lg px-10 py-6"
                    onClick={() => setIsLoginDialogOpen(true)}
                  >
                    {t('auth.signIn')}
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Login Dialog */}
      <LoginDialog 
        isOpen={isLoginDialogOpen} 
        onOpenChange={setIsLoginDialogOpen}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
