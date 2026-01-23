'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { auth } from '@/lib/auth';

/**
 * Detects if an adblocker is active and shows a warning dialog
 * Shows for all users (authenticated and non-authenticated)
 * Can be configured to only show for free tier users
 */
export function AdBlockerDetector() {
  const [showDialog, setShowDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adBlockerDetected, setAdBlockerDetected] = useState(false);
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

    // Suppress console errors from blocked scripts when adblocker is detected
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    let consoleSuppressed = false;
    
    const suppressConsoleErrors = () => {
      if (consoleSuppressed) return; // Already suppressed
      consoleSuppressed = true;
      
      console.error = (...args: any[]) => {
        const message = args.join(' ');
        // Filter out ERR_BLOCKED_BY_CLIENT errors
        if (message.includes('ERR_BLOCKED_BY_CLIENT') || 
            message.includes('net::ERR_BLOCKED_BY_CLIENT') ||
            message.includes('hsadspixel') ||
            message.includes('hs-analytics') ||
            message.includes('hs-banner')) {
          return; // Suppress these errors
        }
        originalError.apply(console, args);
      };

      console.warn = (...args: any[]) => {
        const message = args.join(' ');
        // Filter out Permissions-Policy warnings
        if (message.includes('Permissions-Policy') || 
            message.includes('Unrecognized feature') ||
            message.includes('Origin trial controlled feature')) {
          return; // Suppress these warnings
        }
        originalWarn.apply(console, args);
      };
    };
    
    const restoreConsoleErrors = () => {
      if (!consoleSuppressed) return; // Not suppressed
      consoleSuppressed = false;
      console.error = originalError;
      console.warn = originalWarn;
    };

    // Robust adblocker detection with three parallel methods
    const detectAdBlockerRobust = async (): Promise<{
      detected: boolean;
      confidence: string;
      results: Array<{ method: string; detected: boolean }>;
    }> => {
      const results: Array<{ method: string; detected: boolean }> = [];
      
      // Method 1: Script Loading (most reliable)
      const detectScriptMethod = (): Promise<boolean> => {
        return new Promise((resolve) => {
          try {
            const testAdUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
            const script = document.createElement('script');
            script.src = testAdUrl;
            script.async = true;
            
            let resolved = false;
            const timeout = setTimeout(() => {
              if (!resolved) {
                resolved = true;
                if (script.parentNode) {
                  script.parentNode.removeChild(script);
                }
                resolve(true); // Timeout = likely blocked
              }
            }, 2000); // 2 second timeout
            
            script.onload = () => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                if (script.parentNode) {
                  script.parentNode.removeChild(script);
                }
                resolve(false); // Script loaded = no adblocker
              }
            };
            
            script.onerror = () => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                if (script.parentNode) {
                  script.parentNode.removeChild(script);
                }
                resolve(true); // Script error = adblocker likely
              }
            };
            
            document.head.appendChild(script);
          } catch (error) {
            console.warn('[AdBlockerDetector] Script method error:', error);
            resolve(false); // On error, assume no adblocker
          }
        });
      };
      
      // Method 2: DOM Element Check (extended with more selectors)
      const detectDOMMethod = (): Promise<boolean> => {
        return new Promise((resolve) => {
          try {
            const adSelectors = [
              { className: 'adsbox', id: 'adsbox' },
              { className: 'advertisement', id: 'advertisement' },
              { className: 'ad-banner', id: 'ad-banner' },
              { className: 'ads', id: 'ads' },
              { className: 'advert', id: 'advert' },
              { className: 'ublock', id: 'ublock' }, // uBlock-specific
            ];
            
            const adElements: HTMLDivElement[] = [];
            
            adSelectors.forEach(({ className, id }) => {
              const fakeAd = document.createElement('div');
              fakeAd.innerHTML = '&nbsp;';
              fakeAd.className = className;
              fakeAd.id = id;
              fakeAd.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;z-index:-9999;';
              document.body.appendChild(fakeAd);
              adElements.push(fakeAd);
            });
            
            setTimeout(() => {
              try {
                let blockedCount = 0;
                
                adElements.forEach((fakeAd) => {
                  const computedStyle = window.getComputedStyle(fakeAd);
                  const isBlocked = 
                    computedStyle.display === 'none' || 
                    computedStyle.visibility === 'hidden' ||
                    computedStyle.height === '0px' ||
                    computedStyle.width === '0px' ||
                    fakeAd.offsetHeight === 0 ||
                    fakeAd.offsetWidth === 0;
                  
                  if (isBlocked) {
                    blockedCount++;
                  }
                  
                  if (fakeAd.parentNode) {
                    document.body.removeChild(fakeAd);
                  }
                });
                
                // AdBlocker detected if ≥50% of elements are blocked
                const detected = blockedCount >= adSelectors.length / 2;
                resolve(detected);
              } catch (error) {
                console.warn('[AdBlockerDetector] DOM method error:', error);
                resolve(false);
              }
            }, 200); // 200ms check delay
          } catch (error) {
            console.warn('[AdBlockerDetector] DOM method setup error:', error);
            resolve(false);
          }
        });
      };
      
      // Method 3: Fetch Test (confirmation)
      const detectFetchMethod = (): Promise<boolean> => {
        return new Promise((resolve) => {
          try {
            const testAdUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
            const timeout = setTimeout(() => {
              resolve(true); // Timeout = likely blocked
            }, 2000);
            
            fetch(testAdUrl, {
              method: 'HEAD',
              mode: 'no-cors',
              cache: 'no-cache'
            })
            .then(() => {
              clearTimeout(timeout);
              resolve(false); // Fetch succeeded (though we can't verify with no-cors)
            })
            .catch(() => {
              clearTimeout(timeout);
              resolve(true); // Fetch failed = likely blocked
            });
          } catch (error) {
            console.warn('[AdBlockerDetector] Fetch method error:', error);
            resolve(false);
          }
        });
      };
      
      // Run all three methods in parallel
      try {
        const [scriptResult, domResult, fetchResult] = await Promise.all([
          detectScriptMethod(),
          detectDOMMethod(),
          detectFetchMethod(),
        ]);
        
        results.push({ method: 'script', detected: scriptResult });
        results.push({ method: 'dom', detected: domResult });
        results.push({ method: 'fetch', detected: fetchResult });
        
        // Evaluation: At least 2 of 3 methods must detect adblocker
        const detectedCount = results.filter(r => r.detected).length;
        const detected = detectedCount >= 2;
        
        return {
          detected,
          confidence: `${detectedCount}/3 methods`,
          results
        };
      } catch (error) {
        console.error('[AdBlockerDetector] Detection error:', error);
        return {
          detected: false,
          confidence: 'error',
          results: []
        };
      }
    };

    // Main detection function
    const detectAdBlocker = async () => {
      const detection = await detectAdBlockerRobust();
      
      console.log('[AdBlockerDetector] Detection results:', {
        detected: detection.detected,
        confidence: detection.confidence,
        results: detection.results
      });
      
      if (detection.detected) {
        setAdBlockerDetected(true);
        setShowDialog(true);
        suppressConsoleErrors();
      }
    };

    // Run detection after 1 second (improved timing)
    const timer = setTimeout(detectAdBlocker, 1000);
    
    // Also try to detect immediately if page is already loaded
    if (document.readyState === 'complete') {
      detectAdBlocker();
    } else {
      window.addEventListener('load', detectAdBlocker);
    }

    // Listen for adblocker detection from API interceptor
    // This serves as an additional confirmation
    const handleAdBlockerDetected = (event: CustomEvent) => {
      if (event.detail) {
        console.log('[AdBlockerDetector] AdBlocker detected via API interceptor (additional confirmation)');
        // Only set if not already detected to avoid duplicate popups
        if (!adBlockerDetected) {
          setAdBlockerDetected(true);
          setShowDialog(true);
          suppressConsoleErrors();
        }
      }
    };
    window.addEventListener('adblocker-detected', handleAdBlockerDetected as EventListener);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('authchange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('adblocker-detected', handleAdBlockerDetected as EventListener);
      window.removeEventListener('load', detectAdBlocker);
      // Restore console methods on cleanup
      if (adBlockerDetected) {
        restoreConsoleErrors();
      }
    };
  }, [isAuthenticated, adBlockerDetected]);

  // Hide dialog if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && showDialog) {
      setShowDialog(false);
    }
  }, [isAuthenticated, showDialog]);

  // Use i18n translations instead of hardcoded messages
  const messages = {
    de: {
      title: t('adblocker.title') || 'AdBlocker erkannt',
      description: t('adblocker.description') || 'Es wurde ein AdBlocker in Ihrem Browser erkannt. Dieser kann wichtige Funktionen blockieren.',
      instruction: t('adblocker.instruction') || 'Bitte deaktivieren Sie den AdBlocker für diese Website, um alle Funktionen nutzen zu können.',
      upgrade: t('adblocker.upgrade') || 'Oder upgraden Sie auf einen Premium-Plan für eine werbefreie Erfahrung ohne AdBlocker-Probleme.',
      button: t('adblocker.button') || 'Verstanden',
    },
    en: {
      title: t('adblocker.title') || 'AdBlocker Detected',
      description: t('adblocker.description') || 'An adblocker has been detected in your browser. It may be blocking important features.',
      instruction: t('adblocker.instruction') || 'Please disable the adblocker for this website to use all features.',
      upgrade: t('adblocker.upgrade') || 'Or upgrade to a Premium plan for an ad-free experience without adblocker issues.',
      button: t('adblocker.button') || 'Got it',
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

