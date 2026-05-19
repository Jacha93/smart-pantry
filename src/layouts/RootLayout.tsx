import { lazy, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import '../styles/globals.css';

const ChatBubble = lazy(() =>
  import('@/components/chat-bubble').then((module) => ({ default: module.ChatBubble }))
);
const AdBlockerDetector = lazy(() =>
  import('@/components/adblocker-detector').then((module) => ({ default: module.AdBlockerDetector }))
);

function upsertMeta(name: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.name = name;
    document.head.appendChild(element);
  }

  element.content = content;
}

export function RootLayout() {
  const location = useLocation();

  useEffect(() => {
    const isPrivateAppRoute = location.pathname === '/app' || location.pathname.startsWith('/app/');
    upsertMeta('robots', isPrivateAppRoute ? 'noindex,nofollow' : 'index,follow');
  }, [location.pathname]);

  return (
    <>
      {/* Viewport Glows */}
      <div className="glow-top" />
      <div className="glow-bottom" />
      
      <Outlet />
      <Toaster />
      <Suspense fallback={null}>
        <ChatBubble />
        <AdBlockerDetector />
      </Suspense>
    </>
  );
}
