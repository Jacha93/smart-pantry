# SEO QA

This is the current QA gate for the transitional Vite shell before the Astro marketing split.

## Local Gate

Run:

```bash
npm run check:seo
```

The check validates:

- `public/robots.txt` allows the public root and excludes `/app`
- `public/robots.txt` points to the production sitemap
- `public/sitemap.xml` contains the current public URLs
- the sitemap does not include private app routes
- `index.html` has one canonical root URL
- `index.html` exposes an `x-default` alternate
- JSON-LD is valid and contains Organization, WebSite, and SoftwareApplication nodes

## CI Gate

`.github/workflows/web-quality.yml` runs `npm run check:seo` before the build and budget checks.

## Later Astro Split

After `/de` and `/en` are server-rendered by the marketing app, expand this gate to validate rendered route HTML for:

- per-route canonical URLs
- `de`, `en`, and `x-default` hreflang clusters
- BreadcrumbList JSON-LD
- noindex behavior for private app routes at the response/header level
- redirect targets for legacy URLs
