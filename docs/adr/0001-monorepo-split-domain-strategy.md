# ADR 0001: Monorepo Split and Domain Strategy

## Status

Accepted for staged migration.

## Context

Smart Pantry currently runs as one Vite React web app plus one FastAPI backend. The open GitHub issues define a target state with separate deployables for public marketing content, private web app workflows, and the API.

The migration must preserve the working app while making SEO, indexing, ads, analytics, and future mobile clients explicit.

## Decision

Use a staged monorepo structure:

```text
apps/
  marketing/        # Astro, public SEO content, legal pages, sitemaps
  web/              # React/Vite authenticated app
apps/api/           # Optional future location for FastAPI
backend_python/     # Current FastAPI location until the API move is done
packages/
  shared/           # Optional shared contracts, generated types, brand assets
docs/
  adr/
  operations/
```

The first migration phase keeps the current runtime layout intact and documents the split. Later commits can move the Vite app into `apps/web`, scaffold `apps/marketing`, and either keep or move FastAPI after build and deploy scripts are ready.

## Domains

| Surface | Production origin | Staging origin | Local origin | Indexing |
| --- | --- | --- | --- | --- |
| Marketing | `https://smartpantry.eu` | `https://staging.smartpantry.eu` | `http://localhost:4321` | indexable |
| Web app | `https://app.smartpantry.eu` | `https://staging-app.smartpantry.eu` | `http://localhost:5173` | noindex/private |
| API | `https://api.smartpantry.eu` or app-proxied `/api` | `https://staging-api.smartpantry.eu` | `http://localhost:3001` | not indexable |

The current local Vite app proxies `/api` to FastAPI. That remains the local default until `apps/web` owns its own config.

## Locale Model

Public marketing pages use path based locales:

- `/de/`
- `/en/`

Each public page needs a canonical URL, `de` and `en` alternates, and an `x-default` alternate. Query parameters must not be used as the SEO language model.

The private app can later mirror locale-aware routes, for example `/de/dashboard` and `/en/dashboard`, but authenticated route protection and noindex behavior have priority over SEO discoverability.

## Indexing Boundaries

Marketing pages are the only crawlable public surface. They will own:

- `robots.txt`
- `sitemap.xml`
- public legal pages
- structured data
- feature, use-case, and blog content

The app surface must emit noindex signals for private routes and must not be submitted as an indexable sitemap target.

## API and Mobile Readiness

The FastAPI API remains the canonical backend. To prepare Flutter or other mobile clients:

- Keep `/api` contracts stable and version new breaking contracts under `/api/v1` or a later explicit prefix.
- Keep auth token exchange independent from browser-only behavior.
- Document request and response schemas through OpenAPI generated from FastAPI.
- Reserve app deep links separately from marketing URLs, for example `smartpantry://app/...` for native and `https://app.smartpantry.eu/...` for web.

## Ads and Analytics Boundaries

Ads and analytics are consent gated and deployable specific:

- Marketing may use AdSense after CMP and policy checks.
- Web app may later show calm ad slots only for free users.
- Paid users must be controlled by a backend entitlement such as `no_ads` or subscription status before app ads are enabled.
- Mobile monetization is a separate AdMob decision and must not reuse web-only AdSense assumptions.

## Migration Plan

1. Document target structure and local test requirements.
2. Add scaffolded `apps/marketing` without changing current app behavior.
3. Move the existing Vite app into `apps/web` and preserve the current protected routes.
4. Add package scripts for independent `dev`, `build`, and `preview` commands.
5. Add robots, sitemap, hreflang, legal pages, and structured data to marketing.
6. Split CI and Docker artifacts for marketing, web, and API.
7. Add staging smoke tests, redirect checks, rollback commands, and post-launch SEO checks.

## Rollback

Each stage must remain revertible as a commit:

- Documentation-only stages have no runtime rollback.
- App moves must keep equivalent package scripts until the new scripts are verified.
- Deployment split must keep the current single-image Docker path until the separated artifacts are green in CI.

## Non-Goals

- No immediate production domain switch in the documentation phase.
- No direct edits on the homeserver.
- No secrets in repository files.
- No AdSense script loading before consent and CMP requirements are implemented.

