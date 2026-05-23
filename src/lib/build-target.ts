export type BuildTarget = 'app' | 'marketing';

const buildTarget = (import.meta.env.VITE_BUILD_TARGET as BuildTarget | undefined) ?? 'app';

export const isMarketingBuild = buildTarget === 'marketing';
export const isAppBuild = buildTarget === 'app';

function normalizeOrigin(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, '') : undefined;
}

function getLocalFallbackOrigin(port: string) {
  return `http://localhost:${port}`;
}

function inferSiblingOrigin(kind: 'app' | 'marketing') {
  if (typeof window === 'undefined') {
    return kind === 'app' ? getLocalFallbackOrigin('5173') : getLocalFallbackOrigin('4321');
  }

  const currentUrl = new URL(window.location.href);
  const { protocol, hostname } = currentUrl;

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    const siblingPort = kind === 'app' ? '5173' : '4321';
    currentUrl.port = siblingPort;
    return currentUrl.origin;
  }

  if (hostname === 'smartpantry.eu') {
    return kind === 'app' ? `${protocol}//app.${hostname}` : `${protocol}//${hostname}`;
  }

  if (hostname === 'staging.smartpantry.eu') {
    return kind === 'app' ? `${protocol}//staging-app.smartpantry.eu` : `${protocol}//${hostname}`;
  }

  if (hostname === 'app.smartpantry.eu') {
    return kind === 'app' ? window.location.origin : `${protocol}//smartpantry.eu`;
  }

  if (hostname === 'staging-app.smartpantry.eu') {
    return kind === 'app' ? window.location.origin : `${protocol}//staging.smartpantry.eu`;
  }

  if (hostname.startsWith('app.')) {
    return kind === 'app' ? window.location.origin : `${protocol}//${hostname.replace(/^app\./, '')}`;
  }

  if (hostname.startsWith('staging-app.')) {
    return kind === 'app' ? window.location.origin : `${protocol}//${hostname.replace(/^staging-app\./, 'staging.')}`;
  }

  if (kind === 'app') {
    return window.location.origin;
  }

  return `${protocol}//${hostname}`;
}

const appOrigin = normalizeOrigin(import.meta.env.VITE_APP_ORIGIN) || inferSiblingOrigin('app');
const marketingOrigin = normalizeOrigin(import.meta.env.VITE_MARKETING_ORIGIN) || inferSiblingOrigin('marketing');

function joinOriginAndPath(origin: string, path: string) {
  return new URL(path.startsWith('/') ? path : `/${path}`, origin).toString();
}

export function getAppUrl(path = '/') {
  return joinOriginAndPath(appOrigin, path);
}

export function getMarketingUrl(path = '/') {
  return joinOriginAndPath(marketingOrigin, path);
}
