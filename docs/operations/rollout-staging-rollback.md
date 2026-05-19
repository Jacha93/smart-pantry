# Rollout, Staging, Redirect, and Rollback Plan

This checklist supports issue #26 and keeps the marketing/web/API split deployable in small stages.

## Environments

| Surface | Local | Staging | Production |
| --- | --- | --- | --- |
| Marketing | `http://localhost:4321` | `https://staging.smartpantry.eu` | `https://smartpantry.eu` |
| Web app | `http://localhost:5173` | `https://staging-app.smartpantry.eu` | `https://app.smartpantry.eu` |
| API | `http://localhost:3001` | `https://staging-api.smartpantry.eu` | `https://api.smartpantry.eu` or app-proxied `/api` |

Staging must use separate environment variables and either a disposable Supabase project or a staging database. Production credentials must not be reused in local or staging environments.

## Redirect Matrix

| From | To | Type | Purpose |
| --- | --- | --- | --- |
| `https://smartpantry.eu/` | `https://smartpantry.eu/de/` or locale-aware equivalent | 302 first, 301 after verification | Locale entry |
| `https://smartpantry.eu/app/*` | `https://app.smartpantry.eu/*` | 302 first, 301 after verification | Move private app routes |
| `https://app.smartpantry.eu/` | `https://app.smartpantry.eu/login` or authenticated dashboard | 302 | App entry |
| Old login/register URLs | Equivalent app-domain URL | 302 first, 301 after verification | Preserve user access |

Do not make redirect status permanent until staging and production smoke tests confirm the target routes, auth redirects, and canonical tags.

## Pre-Deployment Smoke Tests

- Marketing build renders `/de/` and `/en/` without requiring the app bundle.
- Web app build starts and protected routes still require authentication.
- Backend `/health` returns `{"status":"ok"}`.
- Local real-backend smoke test from `docs/local-testing.md` passes with two users.
- No `.env`, secret, database dump with live credentials, or token screenshot is staged for commit.

## Post-Deployment Checks

- DNS resolves for all active domains and staging domains.
- TLS certificates are valid in a private browser session.
- Marketing pages return indexable responses only on public routes.
- App private routes return `noindex` signals or are otherwise excluded from indexing.
- API CORS allows only the expected marketing, app, staging, and local origins.
- Search Console and AdSense checks are reviewed after launch, not before consent requirements are implemented.

## Rollback

Keep rollback scoped to the deployable that changed:

- Marketing rollback: redeploy the previous marketing artifact and restore the previous redirect config.
- Web rollback: redeploy the previous web artifact and keep API unchanged.
- API rollback: redeploy the previous API artifact and verify `/health`, login, groceries, shopping lists, recipes, and profile.
- Single-image fallback: keep the existing combined Docker path until separate images are green in CI and staging.

Record the artifact tag, commit SHA, changed environment variables, and smoke-test result for every deployment.
