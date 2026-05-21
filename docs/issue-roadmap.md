# GitHub Issue Roadmap

Open issues read on 2026-05-21 from `jacha93/smart-pantry`.

## Phase 1: Stabilize Decisions and Local Testing

| Issue | Work item | Status |
| --- | --- | --- |
| #8 | Architecture ADR for monorepo split and domain strategy | Started in `docs/adr/0001-monorepo-split-domain-strategy.md` |
| #9 | Repository structure, scripts, shared boundaries | Target documented; root scripts expose `dev:web`, `build:web`, `preview:web`, `dev:api`, local env check, and API smoke test; code move still pending |
| #19 | Domains, reverse proxy, CORS, environment config | Initial concept documented; deploy config pending |
| #26 | Rollout, redirects, staging, rollback | Operational checklist started in `docs/operations/rollout-staging-rollback.md`; redirect tests pending |

## Phase 2: Split Deployables

| Issue | Work item | Status |
| --- | --- | --- |
| #10 | Move current Vite app into `apps/web` | Pending |
| #11 | Scaffold Astro marketing app with `/de` and `/en` | Pending |
| #12 | Port landing page to Astro | Pending |
| #18 | Separate Docker images and CI/CD for marketing, web, API | Pending |

## Phase 3: SEO Content and Indexing

| Issue | Work item | Status |
| --- | --- | --- |
| #13 | hreflang, canonical, x-default locale model | Transitional route head manager added for current public Vite routes; Astro locale routes still pending |
| #14 | Public legal and trust pages | Transitional Vite routes added for `/de/datenschutz`, `/de/impressum`, `/en/privacy`, and `/en/legal-notice`; Astro/legal metadata still pending |
| #15 | Structured data | Basic Organization, WebSite, and SoftwareApplication JSON-LD added to current Vite shell; locale-specific Astro output and breadcrumbs pending |
| #17 | robots.txt, sitemap.xml, index rules | Transitional `robots.txt`, `sitemap.xml`, and client-side noindex for `/app` routes added; Astro locale sitemap still pending |
| #24 | Content architecture for feature, use-case, and blog pages | Pending |

## Phase 4: Ads, Consent, Analytics, and Performance

| Issue | Work item | Status |
| --- | --- | --- |
| #16 | Performance and Core Web Vitals budgets | Initial route-level code splitting and Vite manual chunks added; formal budgets/CI pending |
| #20 | AdSense readiness, certified CMP, consent mode | Pending |
| #21 | Marketing ad placements | Pending |
| #22 | App ad slots for free users and paid-user suppression | Pending |
| #23 | Analytics, Search Console, AdSense monitoring, SEO QA | Pending |

## Phase 5: Mobile Readiness

| Issue | Work item | Status |
| --- | --- | --- |
| #25 | Flutter/mobile API, deep links, shared contracts | Initial decision documented; contracts pending |

## Execution Rules

- Keep commits small and tied to one phase or issue group.
- Preserve the current app until equivalent local tests are green.
- Do not push until local real-backend smoke tests have been run or the missing environment is explicitly documented.
- Never commit `.env` files or real credentials.

## Current Acceptance Coverage

| Issue | Covered now | Still missing |
| --- | --- | --- |
| #8 | ADR exists with domain, build, deployment, SEO, migration, rollback, and risk boundaries | Final review after first code move |
| #9 | Target tree, migration order, root-level deployable scripts, local env check, and API smoke test documented | Actual `apps/web`, `apps/marketing`, and package/workspace split |
| #19 | Domain, local origins, API origin concept, auth/indexing boundaries documented | Concrete proxy/CORS deployment config |
| #25 | API versioning, OpenAPI reuse, deep-link separation, web-vs-mobile ads documented | Generated contracts and mobile-specific tests |
| #26 | Staging surfaces, redirect matrix, smoke tests, rollback scopes documented | Executable redirect checks and deployed staging verification |
| #16 | Route pages, chat, adblocker detection, React, markdown, motion, and form dependencies are split into separate chunks; `npm run build` has no chunk-size warning | Formal budget thresholds, CI checks, Lighthouse/PageSpeed workflow, image/font budget |
| #17 | Current Vite deploy serves `robots.txt` and `sitemap.xml`; `/app` routes receive `noindex,nofollow` in the document head after hydration | Astro `/de` and `/en` locale sitemap, canonical/hreflang, server-level private route headers |
| #15 | Current Vite shell exposes conservative Organization, WebSite, and SoftwareApplication JSON-LD without ratings/review claims | Locale-specific JSON-LD, BreadcrumbList, schema validator run, central typed schema data |
| #14 | Legal pages are directly routable and footer links point to real URLs in the active locale | Astro static legal pages, crawlable locale-specific metadata, legal review of ads/consent text |
| #13 | Current Vite shell keeps private app routes noindexed, clears canonicals on private routes, and emits canonical/x-default/locale alternates for the public legal routes | Real `/de` and `/en` marketing routes, server-rendered head output, redirect matrix, final x-default strategy |

## Next Code Slice

The current blocker for end-to-end local testing is the Supabase database URL in `backend_python/.env`:

1. Replace the direct `db.<project-ref>.supabase.co` URL with the Supabase Session Pooler URL.
2. Run `npm run check:local-env`.
3. Run `npm run check:db-schema`; apply `database-dumps/smart_pantry_schema.sql` to the disposable/staging Supabase database if tables are missing.
4. Run `npm run dev:api`, then `npm run smoke:api`.
5. Start `npm run dev:web` and complete the browser smoke checklist before pushing.

The `apps/web` move from issue #10 should happen only after a real backend smoke test passes, because it changes import paths, Vite config, Tailwind inputs, Docker paths, and CI assumptions at the same time.
