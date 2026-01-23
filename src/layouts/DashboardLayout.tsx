import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { auth, authDisabled } from '@/lib/auth';
import { LogOut, ShoppingCart, Package, Camera, ChefHat, User } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Footer } from '@/components/footer';
import { useI18n } from '@/hooks/use-i18n';

export function DashboardLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    const validateSession = async () => {
      console.log('[DashboardLayout] Validating session...');
      
      if (authDisabled) {
        console.log('[DashboardLayout] Auth disabled, skipping validation');
        setIsLoading(false);
        return;
      }
      
      const isAuth = auth.isAuthenticated();
      const token = auth.getToken();
      const refreshToken = auth.getRefreshToken();
      
      console.log('[DashboardLayout] Auth state:', {
        isAuthenticated: isAuth,
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'none',
      });
      
      if (!isAuth || !token) {
        console.warn('[DashboardLayout] Not authenticated, redirecting to home');
        navigate('/');
        return;
      }
      
      // Attempt to refresh the token if we have a refresh token
      if (refreshToken) {
        try {
          console.log('[DashboardLayout] Attempting token refresh...');
          const refreshResult = await auth.refresh();
          if (refreshResult) {
            console.log('[DashboardLayout] Token refresh successful');
          } else {
            console.warn('[DashboardLayout] Token refresh returned null');
            // Token refresh failed, logout and redirect
            await auth.logout();
            window.location.href = '/';
            return;
          }
        } catch (e) {
          // Refresh failed, token is likely invalid
          console.error('[DashboardLayout] Token refresh failed on mount:', e);
          await auth.logout();
          window.location.href = '/';
          return;
        }
      } else {
        console.warn('[DashboardLayout] No refresh token available');
      }
      
      setIsLoading(false);
      console.log('[DashboardLayout] Session validation complete');
    };
    
    validateSession();
  }, [navigate]);

  const handleLogout = async () => {
    console.log('[DashboardLayout] Logout button clicked');
    
    // Warte auf Logout
    await auth.logout();
    
    // Verifiziere, dass Token gelöscht sind
    const stillAuthenticated = auth.isAuthenticated();
    if (stillAuthenticated) {
      console.error('[DashboardLayout] Still authenticated after logout! Force removing tokens...');
      // Force remove tokens
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      // Dispatch event erneut
      window.dispatchEvent(new Event('authchange'));
    }
    
    console.log('[DashboardLayout] Navigating to landing page...');
    
    // Navigiere zu Landing Page mit Hard-Refresh
    // Hard-Refresh stellt sicher, dass alle Komponenten neu initialisiert werden
    window.location.href = '/';
  };

  const isActive = (path: string) => {
    return location.pathname === path;
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
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="glass-card border-b border-white/20 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <img
                  src="/smart-pantry-favicon.png"
                  alt="Smart Pantry Icon"
                  width={32}
                  height={32}
                  className="rounded-lg shadow-[0_0_25px_rgba(23,246,254,0.35)]"
                />
                <h1 className="text-xl font-bold text-foreground">{t('nav.appTitle')}</h1>
              </Link>
              <div className="flex space-x-2">
                <Link
                  to="/groceries"
                  className={`flex items-center space-x-2 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    isActive('/groceries')
                      ? 'text-[#17f6fe] bg-[#17f6fe]/15 border-[#17f6fe]/30'
                      : 'text-foreground/90 hover:text-[#17f6fe] hover:bg-[#17f6fe]/10 border-white/5 hover:border-[#17f6fe]/20'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  <span>{t('nav.groceries')}</span>
                </Link>
                <Link
                  to="/shopping-list"
                  className={`flex items-center space-x-2 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    isActive('/shopping-list')
                      ? 'text-[#17f6fe] bg-[#17f6fe]/15 border-[#17f6fe]/30'
                      : 'text-foreground/90 hover:text-[#17f6fe] hover:bg-[#17f6fe]/10 border-white/5 hover:border-[#17f6fe]/20'
                  }`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>{t('nav.shoppingList')}</span>
                </Link>
                <Link
                  to="/fridge-analyzer"
                  className={`flex items-center space-x-2 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    isActive('/fridge-analyzer')
                      ? 'text-[#17f6fe] bg-[#17f6fe]/15 border-[#17f6fe]/30'
                      : 'text-foreground/90 hover:text-[#17f6fe] hover:bg-[#17f6fe]/10 border-white/5 hover:border-[#17f6fe]/20'
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  <span>{t('nav.fridgeAnalyzer')}</span>
                </Link>
                <Link
                  to="/recipes"
                  className={`flex items-center space-x-2 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    isActive('/recipes')
                      ? 'text-[#17f6fe] bg-[#17f6fe]/15 border-[#17f6fe]/30'
                      : 'text-foreground/90 hover:text-[#17f6fe] hover:bg-[#17f6fe]/10 border-white/5 hover:border-[#17f6fe]/20'
                  }`}
                >
                  <ChefHat className="h-4 w-4" />
                  <span>{t('nav.recipes')}</span>
                </Link>
                <Link
                  to="/profile"
                  className={`flex items-center space-x-2 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    isActive('/profile')
                      ? 'text-[#17f6fe] bg-[#17f6fe]/15 border-[#17f6fe]/30'
                      : 'text-foreground/90 hover:text-[#17f6fe] hover:bg-[#17f6fe]/10 border-white/5 hover:border-[#17f6fe]/20'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>{t('nav.profile')}</span>
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Button
                variant="accent"
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
