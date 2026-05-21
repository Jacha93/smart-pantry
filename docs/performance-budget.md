# Web Performance Budget

This is the transitional budget for the current Vite web app. It protects the route-level splitting work until the marketing and app deployables are separated.

## Local Gate

Run:

```bash
npm run build:web
npm run budget:web
```

`npm run budget:web` reads `dist/assets`, gzips the generated JavaScript and CSS files, and fails when an asset exceeds the defined thresholds.

## Current Thresholds

| Budget | Limit |
| --- | ---: |
| Single JavaScript chunk gzip | 125 KiB |
| Single CSS asset gzip | 20 KiB |
| Total JavaScript gzip | 500 KiB |

The limits are intentionally above the current build output but low enough to catch accidental dependency regressions, route de-lazying, and oversized shared chunks.

## CI Gate

`.github/workflows/web-quality.yml` runs on `dev`, `main`, and pull requests:

1. `npm ci`
2. `npm run lint`
3. `npx tsc --noEmit`
4. `npm run build:web`
5. `npm run budget:web`

## Later Astro Split

After the marketing app exists, add separate budgets for:

- marketing first-load JavaScript
- marketing image and font bytes
- app authenticated shell JavaScript
- Lighthouse or PageSpeed checks against deployed staging URLs
