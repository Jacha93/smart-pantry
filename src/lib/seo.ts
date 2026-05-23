const SITE_ORIGIN = 'https://smartpantry.eu';

type AlternateLink = {
  hrefLang: string;
  path: string;
};

type RouteSeo = {
  canonicalPath: string;
  alternates: AlternateLink[];
};

const legalAlternates: Record<'privacy' | 'imprint', AlternateLink[]> = {
  privacy: [
    { hrefLang: 'de', path: '/de/datenschutz' },
    { hrefLang: 'en', path: '/en/privacy' },
    { hrefLang: 'x-default', path: '/en/privacy' },
  ],
  imprint: [
    { hrefLang: 'de', path: '/de/impressum' },
    { hrefLang: 'en', path: '/en/legal-notice' },
    { hrefLang: 'x-default', path: '/en/legal-notice' },
  ],
};

const routeSeo: Record<string, RouteSeo> = {
  '/': {
    canonicalPath: '/',
    alternates: [{ hrefLang: 'x-default', path: '/' }],
  },
  '/de/datenschutz': {
    canonicalPath: '/de/datenschutz',
    alternates: legalAlternates.privacy,
  },
  '/en/privacy': {
    canonicalPath: '/en/privacy',
    alternates: legalAlternates.privacy,
  },
  '/de/impressum': {
    canonicalPath: '/de/impressum',
    alternates: legalAlternates.imprint,
  },
  '/en/legal-notice': {
    canonicalPath: '/en/legal-notice',
    alternates: legalAlternates.imprint,
  },
};

function toAbsoluteUrl(path: string) {
  return `${SITE_ORIGIN}${path === '/' ? '/' : path}`;
}

function upsertRobots(content: string) {
  let element = document.querySelector<HTMLMetaElement>('meta[name="robots"]');

  if (!element) {
    element = document.createElement('meta');
    element.name = 'robots';
    document.head.appendChild(element);
  }

  element.content = content;
}

function setCanonical(path: string | null) {
  const canonicalElements = document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]');

  if (!path) {
    canonicalElements.forEach((element) => element.remove());
    return;
  }

  const [firstCanonical, ...duplicateCanonicals] = Array.from(canonicalElements);
  const canonical = firstCanonical || document.createElement('link');

  canonical.rel = 'canonical';
  canonical.href = toAbsoluteUrl(path);

  if (!firstCanonical) {
    document.head.appendChild(canonical);
  }

  duplicateCanonicals.forEach((element) => element.remove());
}

function setAlternateLinks(alternates: AlternateLink[]) {
  document
    .querySelectorAll<HTMLLinkElement>('link[rel="alternate"][data-smart-pantry-seo="alternate"]')
    .forEach((element) => element.remove());

  alternates.forEach(({ hrefLang, path }) => {
    const element = document.createElement('link');
    element.rel = 'alternate';
    element.hreflang = hrefLang;
    element.href = toAbsoluteUrl(path);
    element.dataset.smartPantrySeo = 'alternate';
    document.head.appendChild(element);
  });
}

export function applyRouteSeo(pathname: string) {
  const isPrivateAppRoute = pathname === '/app' || pathname.startsWith('/app/');
  const seo = routeSeo[pathname];

  if (isPrivateAppRoute) {
    upsertRobots('noindex,nofollow');
    setCanonical(null);
    setAlternateLinks([]);
    return;
  }

  upsertRobots(seo ? 'index,follow' : 'noindex,follow');
  setCanonical(seo?.canonicalPath || null);
  setAlternateLinks(seo?.alternates || []);
}
