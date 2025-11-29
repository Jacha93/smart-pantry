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

    // Detect adblocker by multiple methods
    const detectAdBlocker = () => {
      // Only show warning for non-authenticated users
      if (auth.isAuthenticated()) {
        return;
      }

      // Use a ref-like approach with a shared object to track state
      const detectionState = {
        scriptLoaded: false,
        scriptErrored: false,
        domCheckCompleted: false,
        scriptCheckCompleted: false,
      };

      const evaluateAndShow = () => {
        // Both checks must be completed before evaluation
        if (!detectionState.domCheckCompleted || !detectionState.scriptCheckCompleted) {
          return;
        }

        // Script-Methode ist nur zur Bestätigung - DOM-Methode ist primär
        // Wenn Script erfolgreich lädt, bestätigt es dass kein AdBlocker aktiv ist
        if (detectionState.scriptLoaded) {
          console.log('Ad script loaded successfully - confirms NO AdBlocker');
          // Popup wurde bereits von DOM-Methode gesteuert, hier nichts tun
        } else {
          console.log('Ad script check inconclusive - DOM method is primary indicator');
          // Popup wurde bereits von DOM-Methode gesteuert
        }
      };

      // Method 1: Create a fake ad element that adblockers typically block
      // This method is less reliable, so we use it as secondary check
      const fakeAd = document.createElement('div');
      fakeAd.innerHTML = '&nbsp;';
      fakeAd.className = 'adsbox';
      fakeAd.style.position = 'absolute';
      fakeAd.style.left = '-9999px';
      fakeAd.style.width = '1px';
      fakeAd.style.height = '1px';
      fakeAd.style.opacity = '0';
      document.body.appendChild(fakeAd);

      setTimeout(() => {
        // Check if element was blocked/hidden by adblocker
        const computedStyle = window.getComputedStyle(fakeAd);
        const isBlocked = computedStyle.display === 'none' && 
                         computedStyle.visibility === 'hidden';
        
        if (fakeAd.parentNode) {
          document.body.removeChild(fakeAd);
        }

        // DOM check completed
        detectionState.domCheckCompleted = true;
        
        // DOM-Methode ist jetzt PRIMÄR - wenn Element blockiert ist, ist AdBlocker aktiv
        if (isBlocked) {
          console.log('AdBlocker detected via DOM element - showing popup');
          // Zeige Popup sofort wenn DOM-Methode AdBlocker erkennt
          setShowDialog(true);
        } else {
          console.log('DOM element not blocked - no AdBlocker detected');
        }
        
        evaluateAndShow();
      }, 500);

      // Method 2: Try to load a known ad script URL (PRIMARY METHOD)
      // WICHTIG: Wir verwenden fetch() statt <script> Tag, um bessere Fehlerbehandlung zu haben
      const testAdUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      
      fetch(testAdUrl, { 
        method: 'HEAD',
        mode: 'no-cors', // Umgeht CORS, aber wir können trotzdem sehen ob es blockiert wurde
        cache: 'no-cache'
      })
      .then(() => {
        // Request erfolgreich - kein AdBlocker
        detectionState.scriptLoaded = true;
        detectionState.scriptCheckCompleted = true;
        console.log('Ad script request successful - definitively NO AdBlocker');
        evaluateAndShow();
      })
      .catch((error) => {
        // Request fehlgeschlagen - könnte AdBlocker sein, aber auch Netzwerkfehler
        // WICHTIG: Wir können bei no-cors mode nicht zwischen AdBlocker und Netzwerkfehler unterscheiden
        // Daher verwenden wir nur die DOM-Methode als Fallback
        console.log('Ad script request failed - inconclusive (might be network or adblocker)');
        detectionState.scriptCheckCompleted = true;
        evaluateAndShow();
      });
      
      // Timeout fallback - wenn fetch() zu lange dauert
      setTimeout(() => {
        if (!detectionState.scriptCheckCompleted) {
          console.log('Ad script check timeout - inconclusive');
          detectionState.scriptCheckCompleted = true;
          evaluateAndShow();
        }
      }, 3000);
    };

    // Run detection after page is fully loaded
    const timer = setTimeout(detectAdBlocker, 2000);
    
    // Also try to detect immediately if page is already loaded
    if (document.readyState === 'complete') {
      detectAdBlocker();
    } else {
      window.addEventListener('load', detectAdBlocker);
    }

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
      window.removeEventListener('load', detectAdBlocker);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            {message.title}
          </DialogTitle>
          <DialogDescription className="pt-4 space-y-4">
            <div className="space-y-3">
              <p className="text-base leading-relaxed">{message.description}</p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  {locale === 'de' ? 'Was bedeutet das für Sie?' : 'What does this mean for you?'}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">{message.instruction}</p>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm font-medium text-primary mb-2">
                  {locale === 'de' ? 'Premium-Lösung' : 'Premium Solution'}
                </p>
                <p className="text-sm text-muted-foreground">{message.upgrade}</p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            {message.button}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

