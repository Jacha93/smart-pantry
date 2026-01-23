import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ChatBubble } from '@/components/chat-bubble';
import { AdBlockerDetector } from '@/components/adblocker-detector';
import '../styles/globals.css';

export function RootLayout() {
  return (
    <>
      {/* Viewport Glows */}
      <div className="glow-top" />
      <div className="glow-bottom" />
      
      <Outlet />
      <Toaster />
      <ChatBubble />
      <AdBlockerDetector />
    </>
  );
}
