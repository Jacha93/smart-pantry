import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChefHat,
  LayoutDashboard,
  LogIn,
  LogOut,
  Package,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Timer,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, authDisabled } from '@/lib/auth';
import { LanguageSwitcher } from '@/components/language-switcher';
import { LoginDialog } from '@/components/login-dialog';
import { RegisterDialog } from '@/components/register-dialog';
import { Footer } from '@/components/footer';
import { useI18n } from '@/hooks/use-i18n';

const pantryItems = [
  {
    nameKey: 'landing.previewItem1Name',
    metaKey: 'landing.previewItem1Meta',
    stateKey: 'landing.previewItem1State',
    accent: 'bg-[#17f6fe]',
  },
  {
    nameKey: 'landing.previewItem2Name',
    metaKey: 'landing.previewItem2Meta',
    stateKey: 'landing.previewItem2State',
    accent: 'bg-[#a10dfd]',
  },
  {
    nameKey: 'landing.previewItem3Name',
    metaKey: 'landing.previewItem3Meta',
    stateKey: 'landing.previewItem3State',
    accent: 'bg-amber-400',
  },
];

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  const checkAuth = () => {
    const token = auth.getToken();
    const authenticated = authDisabled ? !!token : token && auth.isAuthenticated();

    setIsAuthenticated(!!authenticated);
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();

    const handleAuthChange = () => {
      window.setTimeout(checkAuth, 10);
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('authchange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('authchange', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  const openLoginDialog = () => {
    setIsRegisterDialogOpen(false);
    setIsLoginDialogOpen(true);
  };

  const openRegisterDialog = () => {
    setIsLoginDialogOpen(false);
    setIsRegisterDialogOpen(true);
  };

  const handleLoginSuccess = () => {
    checkAuth();
    navigate('/app');
  };

  const handleRegisterSuccess = () => {
    openLoginDialog();
  };

  const features = [
    {
      icon: Package,
      titleKey: 'landing.feature1Title',
      descKey: 'landing.feature1Desc',
      metric: '124',
    },
    {
      icon: Camera,
      titleKey: 'landing.feature2Title',
      descKey: 'landing.feature2Desc',
      metric: 'AI',
    },
    {
      icon: ChefHat,
      titleKey: 'landing.feature3Title',
      descKey: 'landing.feature3Desc',
      metric: '3 min',
    },
    {
      icon: ShoppingCart,
      titleKey: 'landing.feature4Title',
      descKey: 'landing.feature4Desc',
      metric: 'Auto',
    },
  ];

  const highlights = [
    {
      icon: Sparkles,
      titleKey: 'landing.highlight1Title',
      descKey: 'landing.highlight1Desc',
    },
    {
      icon: ShieldCheck,
      titleKey: 'landing.highlight2Title',
      descKey: 'landing.highlight2Desc',
    },
    {
      icon: Zap,
      titleKey: 'landing.highlight3Title',
      descKey: 'landing.highlight3Desc',
    },
  ];

  const authActions = isAuthenticated ? (
    <Link to="/app">
      <Button className="flex items-center gap-2">
        <LayoutDashboard className="h-4 w-4" />
        {t('landing.goToApp')}
      </Button>
    </Link>
  ) : (
    <>
      <Button variant="outline" className="flex items-center gap-2" onClick={openLoginDialog}>
        <LogIn className="h-4 w-4" />
        {t('auth.signIn')}
      </Button>
      <Button className="flex items-center gap-2" onClick={openRegisterDialog}>
        {t('auth.signUp')}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </>
  );

  return (
    <div className="min-h-screen overflow-hidden bg-background dotted-grid-24">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#09090b]/82 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/smart-pantry-favicon.png"
              alt="Smart Pantry Icon"
              width={34}
              height={34}
              className="rounded-md ring-1 ring-[#17f6fe]/35"
            />
            <span className="text-base font-semibold text-foreground sm:text-lg">{t('nav.appTitle')}</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            {!isLoading && (
              <div className="hidden items-center gap-2 sm:flex">
                {authActions}
                {isAuthenticated && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await auth.logout();
                      window.setTimeout(() => {
                        checkAuth();
                        window.location.href = '/';
                      }, 100);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    {t('nav.logout')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main>
        <section className="relative border-b border-white/10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#17f6fe]/60 to-transparent" />
          <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-16">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-[#17f6fe]/25 bg-[#17f6fe]/10 px-3 py-2 text-sm font-medium text-[#17f6fe]">
                <ScanLine className="h-4 w-4" />
                {t('landing.heroBadge')}
              </div>
              <h1 className="text-4xl font-semibold leading-[1.02] text-foreground sm:text-5xl lg:text-6xl">
                {t('landing.heroTitle')}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                {t('landing.heroSubtitle')}
              </p>

              {!isLoading && (
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {isAuthenticated ? (
                    <Link to="/app">
                      <Button size="lg" className="w-full sm:w-auto">
                        <LayoutDashboard className="h-5 w-5" />
                        {t('landing.goToApp')}
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Button size="lg" className="w-full sm:w-auto" onClick={openRegisterDialog}>
                        {t('landing.getStarted')}
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                      <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={openLoginDialog}>
                        <LogIn className="h-5 w-5" />
                        {t('auth.signIn')}
                      </Button>
                    </>
                  )}
                </div>
              )}

              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 text-sm">
                <div className="border-l border-[#17f6fe]/45 pl-4">
                  <div className="text-2xl font-semibold text-foreground">4</div>
                  <div className="text-muted-foreground">{t('landing.metricCoreFlows')}</div>
                </div>
                <div className="border-l border-[#a10dfd]/45 pl-4">
                  <div className="text-2xl font-semibold text-foreground">AI</div>
                  <div className="text-muted-foreground">{t('landing.metricPhotoScan')}</div>
                </div>
                <div className="border-l border-white/18 pl-4">
                  <div className="text-2xl font-semibold text-foreground">{t('landing.metricFast')}</div>
                  <div className="text-muted-foreground">{t('landing.metricViteApp')}</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-lg border border-white/12 bg-[#101014]/95 p-3 shadow-[var(--shadow-xl)]">
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-3">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">{t('nav.appTitle')}</p>
                    <h2 className="text-lg font-semibold text-foreground">{t('landing.previewTitle')}</h2>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-[#17f6fe]/25 bg-[#17f6fe]/10 px-3 py-2 text-xs font-semibold text-[#17f6fe]">
                    <CheckCircle2 className="h-4 w-4" />
                    {t('landing.previewLive')}
                  </div>
                </div>

                <div className="grid gap-3 p-3 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-3">
                    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{t('landing.previewInventoryHealth')}</p>
                          <p className="mt-1 text-3xl font-semibold text-foreground">86%</p>
                        </div>
                        <Package className="h-8 w-8 text-[#17f6fe]" />
                      </div>
                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-[#17f6fe] to-[#a10dfd]" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {pantryItems.map((item) => (
                        <div key={item.nameKey} className="flex items-center justify-between rounded-md border border-white/10 bg-[#18181b]/80 p-3">
                          <div className="flex items-center gap-3">
                            <span className={`h-2.5 w-2.5 rounded-full ${item.accent}`} />
                            <div>
                              <p className="font-medium text-foreground">{t(item.nameKey)}</p>
                              <p className="text-xs text-muted-foreground">{t(item.metaKey)}</p>
                            </div>
                          </div>
                          <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-muted-foreground">{t(item.stateKey)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-lg border border-[#a10dfd]/25 bg-[#a10dfd]/10 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-[#a10dfd] p-2 text-white">
                          <ChefHat className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{t('landing.previewRecipeMatch')}</p>
                          <p className="text-sm text-muted-foreground">{t('landing.previewRecipeMatchDesc')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-[#17f6fe]/25 bg-[#17f6fe]/10 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-[#17f6fe] p-2 text-[#09090b]">
                          <Camera className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{t('landing.previewScanQueue')}</p>
                          <p className="text-sm text-muted-foreground">{t('landing.previewScanQueueDesc')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                      <div className="flex items-center gap-3">
                        <Timer className="h-5 w-5 text-amber-300" />
                        <div>
                          <p className="font-semibold text-foreground">{t('landing.previewExpiringSoon')}</p>
                          <p className="text-sm text-muted-foreground">{t('landing.previewExpiringSoonDesc')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-2xl">
              <p className="text-sm font-semibold uppercase text-[#17f6fe]">{t('landing.featuresTitle')}</p>
              <h2 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
                {t('landing.featuresSubtitle')}
              </h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <article
                  key={feature.titleKey}
                  className="group relative overflow-hidden rounded-lg border border-white/10 bg-[#101014] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-[#17f6fe]/35 hover:bg-[#111923] hover:shadow-[0_22px_60px_rgba(0,0,0,0.34),0_0_0_1px_rgba(23,246,254,0.08)]"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#17f6fe]/70 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#17f6fe]/9 via-transparent to-[#a10dfd]/10" />
                  </div>

                  <div className="relative mb-8 flex items-center justify-between">
                    <div className="rounded-md border border-white/10 bg-white/[0.05] p-2 transition-all duration-300 group-hover:border-[#17f6fe]/30 group-hover:bg-[#17f6fe]/12">
                      <feature.icon className="h-5 w-5 text-[#17f6fe]" />
                    </div>
                    <span className="text-sm font-semibold text-[#a10dfd] transition-colors duration-300 group-hover:text-[#b83fff]">{feature.metric}</span>
                  </div>
                  <h3 className="relative text-lg font-semibold text-foreground">{t(feature.titleKey)}</h3>
                  <p className="relative mt-3 text-sm leading-6 text-muted-foreground">{t(feature.descKey)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            {highlights.map((highlight) => (
              <article key={highlight.titleKey} className="rounded-lg border border-white/10 bg-[#101014]/86 p-6">
                <highlight.icon className="h-6 w-6 text-[#17f6fe]" />
                <h3 className="mt-5 text-xl font-semibold text-foreground">{t(highlight.titleKey)}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{t(highlight.descKey)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-lg border border-[#17f6fe]/25 bg-[#17f6fe]/10 p-6 sm:flex-row sm:items-center lg:p-8">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">{t('landing.ctaTitle')}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t('landing.ctaSubtitle')}</p>
            </div>
            {!isLoading && (
              isAuthenticated ? (
                <Link to="/app">
                  <Button size="lg">
                    <LayoutDashboard className="h-5 w-5" />
                    {t('landing.goToApp')}
                  </Button>
                </Link>
              ) : (
                <Button size="lg" onClick={openRegisterDialog}>
                  {t('landing.getStarted')}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              )
            )}
          </div>
        </section>
      </main>

      <Footer />

      <LoginDialog
        isOpen={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
        onSuccess={handleLoginSuccess}
        onRegisterClick={openRegisterDialog}
      />

      <RegisterDialog
        isOpen={isRegisterDialogOpen}
        onOpenChange={setIsRegisterDialogOpen}
        onSuccess={handleRegisterSuccess}
        onLoginClick={openLoginDialog}
      />
    </div>
  );
}
