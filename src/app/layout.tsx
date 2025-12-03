import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ChatBubble } from '@/components/chat-bubble';
import { AdBlockerDetector } from '@/components/adblocker-detector';

const inter = Inter({ subsets: ['latin'] });

const runtimeConfigScript = `
(function () {
  if (typeof window === 'undefined') {
    return;
  }

  // Runtime Environment Variables
  window.__ENV = Object.assign({}, window.__ENV || {}, {
    NEXT_PUBLIC_API_URL: ${JSON.stringify(process.env.NEXT_PUBLIC_API_URL ?? '')},
  });

  // Crypto Polyfill - Muss sehr früh geladen werden
  try {
    // Stelle sicher, dass window.crypto existiert
    if (!window.crypto) {
      window.crypto = {} as Crypto;
    }

    var cryptoObj = window.crypto;
    
    // Prüfe ob randomUUID bereits verfügbar ist
    if (typeof cryptoObj.randomUUID === 'function') {
      // Teste ob es funktioniert
      try {
        cryptoObj.randomUUID();
        console.log('✓ crypto.randomUUID already available');
      } catch (e) {
        // Falls es nicht funktioniert, ersetze es
        console.warn('crypto.randomUUID exists but does not work, replacing...');
        var cryptoObj = window.crypto;
        if (typeof cryptoObj.randomUUID !== 'function') {
          // Fallback wird unten gesetzt
        }
      }
    }
    
    // Setze Polyfill nur wenn randomUUID nicht verfügbar ist
    if (typeof cryptoObj.randomUUID !== 'function') {
      var fallbackRandomUUID = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0;
          var v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      // Versuche verschiedene Methoden um randomUUID zu setzen
      var polyfillSet = false;
      
      // Methode 1: Object.defineProperty
      try {
        Object.defineProperty(cryptoObj, 'randomUUID', {
          value: fallbackRandomUUID,
          configurable: true,
          writable: true,
          enumerable: false,
        });
        polyfillSet = true;
      } catch (e) {
        // Methode 2: Direkte Zuweisung
        try {
          (cryptoObj as any).randomUUID = fallbackRandomUUID;
          polyfillSet = true;
        } catch (e2) {
          // Methode 3: Erstelle neues crypto Objekt
          try {
            var newCrypto = Object.create(cryptoObj);
            newCrypto.randomUUID = fallbackRandomUUID;
            window.crypto = newCrypto as Crypto;
            polyfillSet = true;
          } catch (e3) {
            console.error('All methods to set crypto.randomUUID failed');
          }
        }
      }

      // Verify the polyfill works
      if (polyfillSet && typeof window.crypto.randomUUID === 'function') {
        try {
          window.crypto.randomUUID();
          console.log('✓ crypto.randomUUID polyfill loaded successfully');
        } catch (e) {
          console.error('✗ crypto.randomUUID polyfill loaded but does not work:', e);
        }
      } else {
        console.error('✗ Failed to load crypto.randomUUID polyfill');
      }
    }
  } catch (error) {
    console.error('✗ Failed to initialize crypto polyfill:', error);
  }
})();
`;

export const metadata: Metadata = {
  title: 'Smart Pantry',
  description: 'AI-powered grocery inventory management with intelligent recipe suggestions',
  icons: {
    icon: [
      { url: '/smart-pantry-favicon.png', type: 'image/png', rel: 'icon' },
      { url: '/smart-pantry-favicon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/smart-pantry-favicon.png',
    apple: '/smart-pantry-favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script id="runtime-env" strategy="beforeInteractive">
          {runtimeConfigScript}
        </Script>
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
        <ChatBubble />
        <AdBlockerDetector />
      </body>
    </html>
  );
}
