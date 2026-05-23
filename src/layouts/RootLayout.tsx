import { lazy, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { applyRouteSeo } from '@/lib/seo';
import { isMarketingBuild } from '@/lib/build-target';
import '../styles/globals.css';

const ChatBubble = lazy(() =>
  import('@/components/chat-bubble').then((module) => ({ default: module.ChatBubble }))
);
const AdBlockerDetector = lazy(() =>
  import('@/components/adblocker-detector').then((module) => ({ default: module.AdBlockerDetector }))
);

export function RootLayout() {
  const location = useLocation();

  useEffect(() => {
    applyRouteSeo(location.pathname);
  }, [location.pathname]);

  return (
    <>
      {/* Viewport Glows */}
      <div className="glow-top" />
      <div className="glow-bottom" />
      
      <Outlet />
      <Toaster />
      {!isMarketingBuild && (
        <Suspense fallback={null}>
          <ChatBubble />
          <AdBlockerDetector />
        </Suspense>
      )}
    </>
  );
}
