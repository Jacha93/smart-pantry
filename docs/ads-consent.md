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
