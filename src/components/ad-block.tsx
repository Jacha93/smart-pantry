'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/hooks/use-i18n';

interface AdBlockProps {
  /**
   * Ad-Slot ID für Google AdSense (z.B. '1234567890')
   * Wenn nicht gesetzt, wird ein Placeholder angezeigt
   */
  adSlotId?: string;
  /**
   * Format des Ads (z.B. 'auto', 'rectangle', 'horizontal')
   */
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  /**
   * Responsive Ad-Size
   */
  responsive?: boolean;
  /**
   * CSS-Klassen für zusätzliches Styling
   */
  className?: string;
  /**
   * Nur für Free Tier anzeigen (default: true)
   */
  showOnlyForFreeTier?: boolean;
  /**
   * Aktueller Plan des Users
   */
  currentPlan?: 'free' | 'basic' | 'pro';
  /**
   * Dev-Mode: Zeige Ads auch für Paid User (default: false)
   * Kann auch via NEXT_PUBLIC_SHOW_ADS_FOR_ALL=true gesetzt werden
   */
  devMode?: boolean;
}

/**
 * AdBlock Component - Zeigt Werbung für Free Tier User
 * 
 * Verwendung:
 * - Google AdSense: <AdBlock adSlotId="1234567890" format="auto" />
 * - Placeholder (Dev): <AdBlock format="rectangle" />
 * 
 * WICHTIG für Production:
 * 1. Google AdSense Account erstellen: https://www.google.com/adsense/
 * 2. Website verifizieren
 * 3. Ad Units erstellen und adSlotId kopieren
 * 4. AdSense Script in layout.tsx einbinden
 */
export function AdBlock({
  adSlotId,
  format = 'auto',
  responsive = true,
  className = '',
  showOnlyForFreeTier = true,
  currentPlan = 'free',
  devMode = false,
}: AdBlockProps) {
  const { t, locale } = useI18n();
  const adRef = useRef<HTMLDivElement>(null);
  const [isAdSenseLoaded, setIsAdSenseLoaded] = useState(false);
  const [showAd, setShowAd] = useState(false);

  // Prüfe ob Ad angezeigt werden soll
  useEffect(() => {
    // Dev-Mode: Zeige Ads für alle wenn NEXT_PUBLIC_SHOW_ADS_FOR_ALL=true
    const showAdsForAll = typeof window !== 'undefined' && 
      (window as any).__ENV?.NEXT_PUBLIC_SHOW_ADS_FOR_ALL === 'true';
    
    if (devMode || showAdsForAll || !showOnlyForFreeTier || currentPlan === 'free') {
      setShowAd(true);
    } else {
      setShowAd(false);
    }
  }, [devMode, showOnlyForFreeTier, currentPlan]);

  // Lade Google AdSense Script (nur wenn adSlotId gesetzt ist)
  useEffect(() => {
    if (!showAd || !adSlotId) return;

    // Prüfe ob AdSense bereits geladen ist
    if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
      setIsAdSenseLoaded(true);
      return;
    }

    // Lade AdSense Script
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-' + adSlotId.split('-')[0];
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      setIsAdSenseLoaded(true);
    };
    script.onerror = () => {
      console.warn('AdSense script failed to load');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup: Entferne Script nicht, da es wiederverwendet werden kann
    };
  }, [showAd, adSlotId]);

  // Initialisiere AdSense Ad (nur einmal pro AdBlock)
  useEffect(() => {
    if (!showAd || !adSlotId || !isAdSenseLoaded || !adRef.current) return;

    try {
      // Prüfe ob Ad bereits initialisiert wurde
      if (adRef.current.querySelector('ins.adsbygoogle')) {
        return;
      }

      // Erstelle AdSense Ad Element
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', 'ca-pub-' + adSlotId.split('-')[0]);
      ins.setAttribute('data-ad-slot', adSlotId.split('-')[1] || adSlotId);
      
      if (format === 'auto' && responsive) {
        ins.setAttribute('data-ad-format', 'auto');
        ins.setAttribute('data-full-width-responsive', 'true');
      } else {
        ins.setAttribute('data-ad-format', format);
      }

      adRef.current.appendChild(ins);

      // Initialisiere AdSense
      if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
        (window.adsbygoogle as any).push({});
      }
    } catch (error) {
      console.error('Error initializing AdSense:', error);
    }
  }, [showAd, adSlotId, isAdSenseLoaded, format, responsive]);

  // Zeige nichts wenn Ad nicht angezeigt werden soll
  if (!showAd) {
    return null;
  }

  // Placeholder für Dev/Testing (wenn keine adSlotId)
  if (!adSlotId) {
    return (
      <Card className={`border-dashed border-2 border-primary/30 bg-primary/5 ${className}`}>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center min-h-[100px] text-center space-y-2">
            <div className="text-xs font-mono text-primary/60 bg-primary/10 px-2 py-1 rounded">
              [AD PLACEHOLDER]
            </div>
            <div className="text-xs text-muted-foreground">
              {format === 'rectangle' && '300x250'}
              {format === 'horizontal' && '728x90'}
              {format === 'vertical' && '160x600'}
              {format === 'auto' && 'Responsive'}
            </div>
            {devMode && (
              <div className="text-xs text-amber-600 dark:text-amber-400">
                Dev Mode: Ad wird angezeigt
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Google AdSense Ad
  return (
    <div ref={adRef} className={className}>
      {/* AdSense wird hier dynamisch eingefügt */}
    </div>
  );
}

// TypeScript Declaration für window.adsbygoogle
declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

