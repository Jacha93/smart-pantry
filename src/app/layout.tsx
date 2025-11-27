import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ChatBubble } from '@/components/chat-bubble';

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
      <body className={inter.className}>
        {children}
        <Toaster />
        <ChatBubble />
      </body>
    </html>
  );
}