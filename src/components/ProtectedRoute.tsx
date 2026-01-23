import { Navigate } from 'react-router-dom';
import { auth, authDisabled } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Prüfe Auth-Status synchron
  const hasToken = !!auth.getToken();
  // Bei authDisabled: Prüfe nur Token-Existenz
  // Bei normaler Auth: Prüfe isAuthenticated UND Token
  const isAuth = authDisabled 
    ? hasToken  // Bei disabled: Nur Token-Existenz prüfen
    : (hasToken && auth.isAuthenticated());  // Bei normaler Auth: Beides prüfen
  
  console.log('[ProtectedRoute] Auth check:', { isAuth, hasToken, authDisabled });
  
  if (!isAuth || !hasToken) {
    console.warn('[ProtectedRoute] Not authenticated, redirecting to /');
    // Lösche Token falls vorhanden (könnten ungültig sein)
    if (hasToken) {
      console.warn('[ProtectedRoute] Token exists but auth check failed, clearing...');
      auth.clearAuth();
    }
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
