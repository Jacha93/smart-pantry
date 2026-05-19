# GitHub Issue Roadmap

Open issues read on 2026-05-19 from `jacha93/smart-pantry`.

## Phase 1: Stabilize Decisions and Local Testing

| Issue | Work item | Status |
| --- | --- | --- |
| #8 | Architecture ADR for monorepo split and domain strategy | Started in `docs/adr/0001-monorepo-split-domain-strategy.md` |
| #9 | Repository structure, scripts, shared boundaries | Documented target; code move still pending |
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
| #13 | hreflang, canonical, x-default locale model | Pending |
| #14 | Public legal and trust pages | Pending |
| #15 | Structured data | Pending |
| #17 | robots.txt, sitemap.xml, index rules | Pending |
| #24 | Content architecture for feature, use-case, and blog pages | Pending |

## Phase 4: Ads, Consent, Analytics, and Performance

| Issue | Work item | Status |
| --- | --- | --- |
| #16 | Performance and Core Web Vitals budgets | Pending |
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
| #9 | Target tree and migration order documented | Actual `apps/web`, `apps/marketing`, and script split |
| #19 | Domain, local origins, API origin concept, auth/indexing boundaries documented | Concrete proxy/CORS deployment config |
| #25 | API versioning, OpenAPI reuse, deep-link separation, web-vs-mobile ads documented | Generated contracts and mobile-specific tests |
| #26 | Staging surfaces, redirect matrix, smoke tests, rollback scopes documented | Executable redirect checks and deployed staging verification |

## Next Code Slice

The next safe implementation slice is issue #9:

1. Add package scripts that name the future deployables while still pointing to the current working app.
2. Add placeholder directories only where they do not change runtime behavior.
3. Verify `npm run build` and, when real environment values are available, run the local smoke test from `docs/local-testing.md`.

The `apps/web` move from issue #10 should happen only after this script layer is committed, because it changes import paths, Vite config, Tailwind inputs, Docker paths, and CI assumptions at the same time.
