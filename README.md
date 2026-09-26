# Safe-Alleys

Free, no-login, privacy-first PWA showing where people report feeling unsafe — at alley-level precision using India Post's DIGIPIN — rendered as a colour-coded traffic-style map layer. India-first.

**Live:** https://safealleys.pages.dev

## Phase status
- **Phase 0 (done):** PWA skeleton — installable manifest, offline service worker, Leaflet + OSM map, official DIGIPIN encoder bundled client-side, EN/HI toggle, privacy policy, security headers (`_headers`), D1 schema draft (`schema/d1-schema.sql`).
- **Phase 1:** Report flow (tap map → category icons → submit), IndexedDB queue, launch city, colour-coded overlay from seeded data.
- **Phase 2:** D1 backend, nightly aggregation cron → static JSON risk tiles, yes/no verification, confidence score v1.
- **Phase 3:** Web Push digests, trip mode, pre-trip route briefings.
- **Phase 4:** Historical submissions, trend dashboards, city expansion.

## Core principles
1. Free forever, no login, no payment — usable by children on parents' phones.
2. Privacy-first / local-first — profile lives in IndexedDB; server gets only anonymised reports.
3. **We never mark any place "safe".** No data ≠ safe. Advisory disclaimer on every screen.
4. Literacy-independent — colour + icon coding.
5. Commons data — aggregated safety data stays free and public.

## Security & privacy posture
- No secrets in client code (verified — Gitleaks-style sweep passes).
- No user input is rendered as HTML anywhere (all DOM writes via `textContent` or escaped).
- CSP + security headers via `_headers` (X-Frame-Options DENY, nosniff, HSTS, no object-src).
- No analytics/ads/tracking in Phase 0–2.
- GSC verification tag pre-pasted (account-wide token).

## Credits
- Map data © OpenStreetMap contributors (ODbL) — attribution is legally required and always displayed.
- DIGIPIN: official open-source algorithm of India Post / Department of Posts.
