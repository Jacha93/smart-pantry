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
  // WICHTIG: Nur JavaScript verwenden, keine TypeScript-Syntax!
  (function() {
    try {
      // Stelle sicher, dass window.crypto existiert
      if (!window.crypto) {
        window.crypto = {};
      }

      var cryptoObj = window.crypto;
      
      // Fallback-Funktion für randomUUID
      var fallbackRandomUUID = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0;
          var v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };
      
      // Prüfe ob randomUUID bereits verfügbar ist und funktioniert
      var needsPolyfill = true;
      if (typeof cryptoObj.randomUUID === 'function') {
        try {
          var testUUID = cryptoObj.randomUUID();
          if (testUUID && typeof testUUID === 'string' && testUUID.length === 36) {
            needsPolyfill = false;
            console.log('✓ crypto.randomUUID already available');
          }
        } catch (e) {
          // Falls es nicht funktioniert, brauchen wir den Polyfill
          needsPolyfill = true;
        }
      }
      
      // Setze Polyfill wenn nötig
      if (needsPolyfill) {
        // Versuche verschiedene Methoden um randomUUID zu setzen
        var polyfillSet = false;
        
        // Methode 1: Object.defineProperty auf window.crypto (am robustesten)
        try {
          Object.defineProperty(window.crypto, 'randomUUID', {
            value: fallbackRandomUUID,
            configurable: true,
            writable: true,
            enumerable: false,
          });
          polyfillSet = true;
        } catch (e) {
          // Methode 2: Direkte Zuweisung auf window.crypto
          try {
            window.crypto.randomUUID = fallbackRandomUUID;
            polyfillSet = true;
          } catch (e2) {
            // Methode 3: Auf cryptoObj
            try {
              cryptoObj.randomUUID = fallbackRandomUUID;
              polyfillSet = true;
            } catch (e3) {
              console.error('Failed to set crypto.randomUUID:', e3);
            }
          }
        }

        // Verify the polyfill works
        if (polyfillSet) {
          try {
            var testUUID = window.crypto.randomUUID();
            if (testUUID && typeof testUUID === 'string' && testUUID.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(testUUID)) {
              console.log('✓ crypto.randomUUID polyfill loaded successfully');
            } else {
              console.error('✗ crypto.randomUUID polyfill loaded but returned invalid UUID:', testUUID);
            }
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
        {/* Crypto Polyfill - Muss als erstes geladen werden, bevor jeglicher Code ausgeführt wird */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  if (typeof window === 'undefined') return;
  
  // Stelle sicher, dass window.crypto existiert
  if (!window.crypto) {
    window.crypto = {};
  }
  
  // Fallback-Funktion für randomUUID
  var fallbackRandomUUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
  
  // Setze Polyfill IMMER (auch wenn native Funktion existiert, als Fallback)
  try {
    if (!window.crypto.randomUUID || typeof window.crypto.randomUUID !== 'function') {
      Object.defineProperty(window.crypto, 'randomUUID', {
        value: fallbackRandomUUID,
        configurable: true,
        writable: true,
        enumerable: false,
      });
    }
  } catch (e) {
    try {
      window.crypto.randomUUID = fallbackRandomUUID;
    } catch (e2) {
      console.error('Failed to set crypto.randomUUID polyfill:', e2);
    }
  }
})();
            `,
          }}
        />
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
