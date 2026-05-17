import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { auth, authDisabled } from '@/lib/auth';
import { Sidebar } from '@/components/sidebar';
import { MobileSidebar } from '@/components/mobile-sidebar';
import { Footer } from '@/components/footer';
import { useI18n } from '@/hooks/use-i18n';

export function AppLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    const validateSession = async () => {
      console.log('[AppLayout] Validating session...');
      
      const token = auth.getToken();
      const refreshToken = auth.getRefreshToken();
      
      // Bei authDisabled: Prüfe nur Token-Existenz
      // Bei normaler Auth: Prüfe isAuthenticated UND Token
      const isAuth = authDisabled 
        ? !!token  // Bei disabled: Nur Token-Existenz
        : (token && auth.isAuthenticated());  // Bei normaler Auth: Beides
      
      console.log('[AppLayout] Auth state:', {
        isAuthenticated: isAuth,
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'none',
        authDisabled,
      });
      
      if (authDisabled) {
        // Bei disabled Auth: Prüfe nur Token-Existenz
        if (!token) {
          console.warn('[AppLayout] Auth disabled but no token, redirecting to home');
          window.location.href = '/';
          return;
        }
        console.log('[AppLayout] Auth disabled, token present, allowing access');
        setIsLoading(false);
        return;
      }
      
      // Normale Auth-Prüfung
      if (!isAuth || !token) {
        console.warn('[AppLayout] Not authenticated, clearing auth and redirecting to home');
        auth.clearAuth();
        window.location.href = '/';
        return;
      }
      
      // Prüfe Token-Format
      if (token.trim() === '' || token === 'null' || token === 'undefined') {
        console.error('[AppLayout] Invalid token format, clearing auth');
        auth.clearAuth();
        window.location.href = '/';
        return;
      }
      
      // Attempt to refresh the token if we have a refresh token
      if (refreshToken) {
        try {
          console.log('[AppLayout] Attempting token refresh...');
          const refreshResult = await auth.refresh();
          if (refreshResult) {
            console.log('[AppLayout] Token refresh successful');
          } else {
            console.warn('[AppLayout] Token refresh returned null, clearing auth');
            // Token refresh failed, clear auth and redirect
            auth.clearAuth();
            window.location.href = '/';
            return;
          }
        } catch (e) {
          // Refresh failed, token is likely invalid
          console.error('[AppLayout] Token refresh failed on mount:', e);
          auth.clearAuth();
          window.location.href = '/';
          return;
        }
      } else {
        console.warn('[AppLayout] No refresh token available, but access token exists');
        // Versuche einen Test-Request, um zu prüfen ob Token gültig ist
        // Falls nicht, wird der 401-Handler das Auth löschen
      }
      
      setIsLoading(false);
      console.log('[AppLayout] Session validation complete');
    };
    
    validateSession();
  }, [navigate]);


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
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="md:hidden">
        <MobileSidebar />
      </div>

      <div className="flex min-h-screen flex-1 flex-col md:ml-64">
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pt-20 sm:px-6 md:pt-6 lg:px-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
