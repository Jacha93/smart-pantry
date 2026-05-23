# Content Architecture

This plan covers issue #24 and prepares the Astro marketing app without moving the current Vite app yet.

## Goals

- Build indexable public pages for search demand around pantry management, grocery inventory, recipe suggestions, and fridge analysis.
- Keep the authenticated app private and out of the sitemap.
- Reuse one content model for German and English routes.
- Make ad, consent, analytics, and structured-data needs visible before implementation.

## Route Families

| Family | German route | English route | Search intent | Primary CTA |
| --- | --- | --- | --- | --- |
| Home | `/de` | `/en` | broad product/category discovery | Start web app |
| Feature | `/de/funktionen/vorratsverwaltung` | `/en/features/pantry-management` | feature evaluation | Create account |
| Feature | `/de/funktionen/kuehlschrank-analyse` | `/en/features/fridge-analyzer` | AI fridge scanner / photo analysis | Try analyzer |
| Feature | `/de/funktionen/rezeptvorschlaege` | `/en/features/recipe-suggestions` | recipes from existing ingredients | Find recipes |
| Use case | `/de/anwendungsfaelle/meal-planning` | `/en/use-cases/meal-planning` | planning weekly meals | Build pantry |
| Use case | `/de/anwendungsfaelle/lebensmittelverschwendung-reduzieren` | `/en/use-cases/reduce-food-waste` | reduce food waste | Track groceries |
| Use case | `/de/anwendungsfaelle/einkaufsliste-automatisieren` | `/en/use-cases/automated-shopping-list` | shopping list automation | Create list |
| Blog index | `/de/blog` | `/en/blog` | informational discovery | Read article |
| Blog article | `/de/blog/<slug>` | `/en/blog/<slug>` | long-tail informational search | Related feature |

## Page Model

Each public page should have:

- stable `slug`
- `locale`
- `canonicalPath`
- `alternatePaths` for `de`, `en`, and `x-default`
- `title`
- `description`
- `hero`
- `sections`
- `faq`
- `primaryCta`
- optional `relatedRoutes`
- optional `structuredDataType`

Keep the model content-first. React components should render the model, not hardcode copy per route.

## Feature Page Structure

1. H1: literal feature name.
2. Product proof: one clear screenshot or generated/real UI image.
3. Benefits: 3 to 5 concise outcome blocks.
4. Workflow: how the user completes the task.
5. Trust: privacy, local account, data ownership, ads/consent note where relevant.
6. FAQ: implementation, pricing, privacy, supported languages.
7. CTA: start app or register.

## Use-Case Page Structure

1. H1: user problem or category, not a slogan.
2. Scenario: who this page is for.
3. Current pain points.
4. Smart Pantry workflow.
5. Example data: groceries, recipe suggestions, or shopping list.
6. Related feature links.
7. FAQ.

## Blog Structure

Blog articles should support informational search and internal linking. Initial categories:

- pantry organization
- food waste reduction
- meal planning
- recipe inspiration
- product updates

Each article should include:

- author/source metadata
- updated date
- locale alternate
- related feature/use-case links
- no unsupported health, nutrition, or savings claims

## Internal Linking

- Home links to top feature and use-case pages.
- Feature pages link to relevant use cases and legal/privacy pages.
- Use-case pages link back to features and related articles.
- Blog articles link to one primary feature and one use case where natural.
- Private `/app` routes are never canonical targets from public SEO pages.

## Structured Data

Use conservative schema only:

- `Organization`
- `WebSite`
- `SoftwareApplication`
- `BreadcrumbList`
- `FAQPage` when FAQ content is visible on the page
- `Article` for blog articles

Do not add ratings, reviews, aggregate ratings, medical claims, or price claims unless real source data exists.

## Acceptance Criteria

- Every public route has canonical and locale alternates.
- Every sitemap URL is indexable and public.
- `/app` routes remain `noindex` and absent from public sitemaps.
- Feature and use-case pages can be generated from the same typed content shape.
- Blog content has explicit locale, date, and related-route metadata.
- Ad placements are not introduced until CMP/consent requirements are satisfied.
