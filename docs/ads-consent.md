# Ads and Consent Readiness

This is the current guardrail for issue #20 while the app is still a single Vite deployable.

## Current Policy

External AdSense scripts must not load unless both gates are true:

```env
VITE_ADSENSE_ENABLED=true
VITE_ADSENSE_CONSENT_GRANTED=true
```

Keep both values false in local and staging environments until a certified CMP and consent-mode flow have been implemented and tested.

`VITE_SHOW_ADS_FOR_ALL=true` is only a layout/testing switch. It may show placeholders to paid users during development, but it does not bypass the AdSense script gate.

## Before Enabling AdSense

Complete these steps before setting either gate to true in production:

1. Add a certified CMP for the target markets.
2. Store and expose the user's ad consent state to the frontend.
3. Wire the consent state into `VITE_ADSENSE_CONSENT_GRANTED` or its runtime replacement.
4. Verify paid users suppress app ad slots through backend entitlements.
5. Review legal copy for advertising cookies and consent withdrawal.
6. Run the web smoke checklist with a free user and a paid/no-ads user.

## Current Implementation

`src/components/ad-block.tsx` centralizes the guard. When an ad slot is configured but either gate is false, the component renders a local placeholder and does not append the Google AdSense script.

## Marketing Ad Placement Plan

Marketing pages may only use calm, content-adjacent placements after CMP consent is active.

| Surface | Placement | Format | Rule |
| --- | --- | --- | --- |
| Home | below main feature/use-case section | horizontal | never in first viewport |
| Feature pages | after workflow/proof section | rectangle or horizontal | keep away from primary CTA |
| Use-case pages | between content sections | rectangle | max one slot before FAQ |
| Blog index | between article cards | horizontal | do not interrupt filters/navigation |
| Blog article | after intro and before related content | rectangle | no ad before the first useful content block |

Marketing no-go zones:

- no ads in hero sections
- no sticky ads
- no layout-shifting slots without reserved space
- no ads inside legal/privacy pages
- no ads before consent is known

## App Ad Slot Plan

App ads are only for free users and only after backend-backed entitlement checks are available.

| Surface | Existing component area | Format | Suppression rule |
| --- | --- | --- | --- |
| Groceries | after inventory card | rectangle | hide for `basic` and `pro` |
| Recipes | after recipe content/dialog area | horizontal | hide for `basic` and `pro` |
| Recipe suggestions | between visible recipe cards | rectangle/horizontal | hide for `basic` and `pro` |
| Shopping list | after list cards | rectangle | hide for `basic` and `pro` |

App no-go zones:

- no ads inside forms, modals, destructive confirmations, or auth flows
- no ads in the protected route shell/navigation
- no ads on profile billing/plan-management controls
- no ads that cover table actions or shopping-list checkboxes
- no paid-user suppression based only on localStorage or frontend-only flags

## Entitlement Requirement

The current frontend infers a plan from profile quotas. Before real app ads go live, the backend should expose an explicit entitlement such as:

```json
{
  "plan": "free",
  "entitlements": {
    "ads": true,
    "no_ads": false
  }
}
```

Ad rendering should use that backend-owned value. The current `currentPlan` prop is acceptable for placeholders and transitional layout checks, but not as the final billing source of truth.
