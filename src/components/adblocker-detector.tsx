'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { auth } from '@/lib/auth';

/**
 * Detects if an adblocker is active and shows a warning dialog
 * Only shows for non-authenticated users (free users)
 */
export function AdBlockerDetector() {
  const [showDialog, setShowDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t, locale } = useI18n();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      setIsAuthenticated(auth.isAuthenticated());
    };
    checkAuth();

    // Listen for auth changes
    const handleAuthChange = () => {
      checkAuth();
    };
    window.addEventListener('authchange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    // Detect adblocker by trying to load a known ad script
    const detectAdBlocker = () => {
      // Only show warning for non-authenticated users
      if (auth.isAuthenticated()) {
        return;
      }

      // Create a fake ad element that adblockers typically block
      const fakeAd = document.createElement('div');
      fakeAd.innerHTML = '&nbsp;';
      fakeAd.className = 'adsbox';
      fakeAd.style.position = 'absolute';
      fakeAd.style.left = '-9999px';
      fakeAd.style.width = '1px';
      fakeAd.style.height = '1px';
      document.body.appendChild(fakeAd);

      // Check if adblocker blocked it
      setTimeout(() => {
        const isBlocked = fakeAd.offsetHeight === 0 || 
                         fakeAd.offsetWidth === 0 ||
                         fakeAd.style.display === 'none' ||
                         fakeAd.style.visibility === 'hidden';
        
        if (fakeAd.parentNode) {
          document.body.removeChild(fakeAd);
        }

        if (isBlocked && !isAuthenticated) {
          console.log('AdBlocker detected via DOM element');
          setShowDialog(true);
        }
      }, 200);
    };

    // Run detection after a short delay
    const timer = setTimeout(detectAdBlocker, 1000);

    // Listen for adblocker detection from API interceptor
    const handleAdBlockerDetected = (event: CustomEvent) => {
      if (event.detail && !isAuthenticated) {
        setShowDialog(true);
      }
    };
    window.addEventListener('adblocker-detected', handleAdBlockerDetected as EventListener);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('authchange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('adblocker-detected', handleAdBlockerDetected as EventListener);
    };
  }, [isAuthenticated]);

  // Hide dialog if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && showDialog) {
      setShowDialog(false);
    }
  }, [isAuthenticated, showDialog]);

  const messages = {
    de: {
      title: 'AdBlocker erkannt',
      description: 'Es wurde ein AdBlocker in Ihrem Browser erkannt. Dieser blockiert möglicherweise wichtige Funktionen wie die Registrierung oder den Login.',
      instruction: 'Bitte deaktivieren Sie den AdBlocker für diese Website, um alle Funktionen nutzen zu können.',
      upgrade: 'Oder upgraden Sie auf einen Premium-Plan für eine werbefreie Erfahrung ohne AdBlocker-Probleme.',
      button: 'Verstanden',
    },
    en: {
      title: 'AdBlocker Detected',
      description: 'An adblocker has been detected in your browser. It may be blocking important features such as registration or login.',
      instruction: 'Please disable the adblocker for this website to use all features.',
      upgrade: 'Or upgrade to a Premium plan for an ad-free experience without adblocker issues.',
      button: 'Got it',
    },
  };

  const message = messages[locale as 'de' | 'en'] || messages.en;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {message.title}
          </DialogTitle>
          <DialogDescription className="pt-4 space-y-3">
            <p>{message.description}</p>
            <p className="text-sm text-muted-foreground">{message.instruction}</p>
            <p className="text-sm font-medium text-primary">{message.upgrade}</p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button onClick={() => setShowDialog(false)}>
            {message.button}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

