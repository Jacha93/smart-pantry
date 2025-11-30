import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ChatBubble } from '@/components/chat-bubble';
import { AdBlockerDetector } from '@/components/adblocker-detector';

const inter = Inter({ subsets: ['latin'] });

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window.crypto === 'undefined') {
                window.crypto = {};
              }
              if (typeof window.crypto.randomUUID === 'undefined') {
                window.crypto.randomUUID = function() {
                  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                  });
                };
              }
            `,
          }}
        />
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
