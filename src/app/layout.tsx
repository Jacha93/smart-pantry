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
    NEXT_PUBLIC_BACKEND_PORT: ${JSON.stringify(process.env.NEXT_PUBLIC_BACKEND_PORT ?? '')},
    NEXT_PUBLIC_API_URL: ${JSON.stringify(process.env.NEXT_PUBLIC_API_URL ?? '')},
  });

  // Crypto Polyfill
  try {
    if (!window.crypto) {
      window.crypto = {};
    }

    var cryptoObj = window.crypto;
    if (typeof cryptoObj.randomUUID !== 'function') {
      var fallbackRandomUUID = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0;
          var v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      // Try Object.defineProperty first, fallback to direct assignment
      try {
        Object.defineProperty(cryptoObj, 'randomUUID', {
          value: fallbackRandomUUID,
          configurable: true,
          writable: true,
        });
      } catch (e) {
        // Fallback for environments where defineProperty fails
        cryptoObj.randomUUID = fallbackRandomUUID;
      }

      // Verify the polyfill works
      if (typeof cryptoObj.randomUUID === 'function') {
        console.log('✓ crypto.randomUUID polyfill loaded successfully');
      } else {
        console.error('✗ Failed to load crypto.randomUUID polyfill');
      }
    } else {
      console.log('✓ crypto.randomUUID already available');
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
