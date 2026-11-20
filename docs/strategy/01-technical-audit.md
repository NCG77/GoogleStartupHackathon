# SafeRoute — Technical Codebase Audit

**Scope:** `D:/Projects/SafeRoute`. Expo 57 / RN 0.86 / React 19 mobile client; Firebase (Auth, Firestore, Functions v2 `asia-south1`, Hosting, FCM); Python 3.12 FastAPI routing service (A* over Mumbai OSM graph + XGBoost). Mumbai-only graph (`MUMBAI_BBOX`, `routing/graph_builder.py:29`).

Totals: ~24,500 LOC across audited surfaces; a single 1,928-line `functions/src/index.ts`; a single 2,780-line `app/(tabs)/navigate.tsx`.

---

## 1. Frontend — Partially implemented (well wired)

All screens present and routed via expo-router: tabs (`Home`, `navigate`, `safewalk`, `SOS`, `alerts`, `contacts`, `settings` — `app/(tabs)/_layout.tsx:1`) plus modals (`CommunityReport`, `GuardianInvite`, `LiveWalkViewer`, `LiveNavigation`, `SafeWalkLive/Guardian/Review`, `RouteComparison`, `Onboarding`, `Permissions`). Design-system directory is real; Reanimated and PaperProvider are set up (`app/_layout.tsx:77`).

**Debt:** No component tests. Screens are monoliths (`navigate.tsx` 2,780 LOC, `SafeWalkLive.tsx` 1,626, `settings.tsx` 1,043). `components/maps/*.js` is plain JS in a TS project.

## 2. Backend — Implemented & verified, monolithic

- **Firebase Functions v2 (Node 22)** — one 1,928-line file. Callables: `calculateSafetyScore`, `generateRoutes`, `verifyReport`, `moderateReport`, `createGuardianInvite`/`acceptGuardianInvite`/`revokeGuardian`, `startSafeWalk`/`startLiveShare`, `safeWalkCheckin`, `publishSafetyEvent`, `publishEmergencyEvent`, `activateSOS`, `markNotificationRead`, `clearNotifications`. Triggers: `onReportCreated`. HTTP: `updateCrowdDensity` (`functions/src/index.ts:1834`). Schedules: `expireOldReports` hourly, `expireStaleSafetySessions`. Transactions, idempotency keys, deterministic doc IDs, grace windows — unusually careful for a pre-seed project.
- **FastAPI routing API** (`routing/route_api.py`) — endpoints `/route/safe`, `/route/reroute`, `/route/explain/{id}`, `/route/confidence/{id}`, `/report/hazard`, `/community/stats`, `/ml/metrics`, `/health`, `/admin/reload`. **CORS wide open** (`:273`, `allow_origins=["*"]`), no auth except `X-Admin-Token` on reload. In-memory route cache (200), 15-minute community-sync loop.

No staging/production split in `eas.json`.

## 3. Database — Implemented & verified

Collections: `users`, `reports`, `report_authors` (private), `routes`, `routes/{id}/live/current`, `routes/{id}/events`, `emergencies`, `sos_limits` (server-only), `sos_responders` (server-only), `road_segments`, `safety_scores`, `guardians`, `notifications`, `trust_logs`, `presence`, `crowd_cells`. 14 composite indexes. **Gap:** nothing in-app writes to `road_segments`; the `generateRoutes` callable queries it (`:94`) and would return empty — in practice the app uses the FastAPI planner, so this callable is dead code.

## 4. Auth — Implemented & verified

Email/password only (`components/auth/AuthScreen.tsx`). AsyncStorage persistence. `ensureUserProfile` seeds `trustScore=50`, writes phone `+91XXXXXXXXXX`. **No phone/OTP, no social sign-in, no email verification enforcement, no password reset screen, no account deletion** (DPDP concern — see §11).

## 5. Mapping & safety scoring — Partially implemented (material ML issue)

- **Maps:** Google Maps SDK on native (`app.config.js:82`) + Google Places + Google Directions on top of SafeRoute's A*. **Primary cost center.**
- **Routing:** A* over prebuilt Mumbai graph (`data/processed/mumbai_routing_graph.pkl`, 77 MB). Three modes share the graph, differ by `alpha` in `cost = D·(1 + α·risk)` (`routing/cost_function.py`). Reroute + hazard decay work.
- **Safety score:** well-engineered weighted formula with weight renormalisation over observed features (`core/safetyScore.ts:165`). Time-of-day and day-of-week baked in.
- **🚨 ML target leakage.** `ml/metrics.json` reports **test R² = 0.9987, MAE = 0.18 on a 0–100 scale**. The CSV (`data/processed/road_safety_scores.csv`) shows `safety_score` is a **deterministic linear combo** of `lighting_score`, `police_dist`, `crime_score` computed in `ml/refresh_monthly_lighting.py:253` and `ml/predict.py`. XGBoost is predicting its own input formula — **label leakage, not predictive power**. Do not cite R² = 0.999 to investors.
- ~~`crime_score` is constant 25.0 on sampled rows.~~ **Correction:** `crime_score` is not constant; it has 5 distinct region-level values (25.0, 34.3, 43.8, 69.6, 91.7 based on Praja 2023 reports). Within a region, score variation is driven by lighting and police proximity. Model retired in favor of axiomatic Safety Score v2.
- **VIIRS lighting refresh via GitHub Actions is real** (`ml/refresh_monthly_lighting.py`, `.github/workflows/monthly-lighting.yml`). Genuinely differentiating.

## 6. Location tracking — Implemented & verified

Two background tasks: `saferoute-safety-location` (`tasks/locationTracking.ts`) + navigation task. Correct lifecycle — tasks self-halt when sessions close. `expo-location` configured for always + background on iOS/Android. Battery impact not measured. Presence beacon foreground-only.

## 7. SOS — Partially implemented (material gaps vs. marketing)

Hold-to-trigger state machine is solid (`core/sos.ts`). Backend `activateSOS` writes to `emergencies`, pushes to guardians, finds opted-in users within 300 m (`functions/src/index.ts:1424`–`:1508`), hides responder identities server-side, rate-limited to 3 nearby-broadcasts/hour.

**But:**
- **Police number hardcoded `122` — India's number is `112`** (`app/(tabs)/SOS.tsx:51`). Unshippable.
- **"Audio recording" / "snapshot" UI rows are cosmetic** (`SOS.tsx:110`). Schema accepts `audioPath`/`snapshotPath` but nothing in the app captures audio or takes a photo. No `recordAsync` call anywhere. Legal + trust hazard.
- **SMS fallback opens native composer** — user must press Send. If incapacitated, SMS never leaves. No Twilio.
- **"Call emergency services" is a confirm-prompt** (`SOS.tsx:248`), not one-tap.

## 8. Safe Walk & guardian sharing — Implemented & verified

End-to-end working. Deterministic session IDs, `participantIds` for rules, server pushes "started" to guardians, live/current updates constrained by rules (≤400 pts path, specific allowed keys — `firestore.rules:79`). Guardian invite uses `randomBytes(32)` + SHA-256 + `timingSafeEqual`, 7-day TTL. Revoke prunes historical sessions. 15-min grace window. **Most mature subsystem.**

## 9. Community reporting — Implemented but data-empty, no moderation UI

`verifyReport` enforces accuracy ≤100 m, device-vs-report location match, 5 reports/hour cap, dedupe (same geohash+category 1 h). Authorship stored privately. Moderation callable exists (`:340`) but **no moderation UI in `app/`**. `data/processed/community_bias.json`: **`reports_total: 1, roads_affected: 0`**. "Community-powered" is aspirational, not evidenced.

## 10. Third-party dependencies & cost exposure

| Dep | Use | Cost | Risk |
| --- | --- | --- | --- |
| Google Maps SDK | tiles | ~$200/mo free credit, then metered | Low at pre-seed |
| Google Places | autocomplete + nearby | ~$17/1K Autocomplete-per-session | **High** at scale |
| Google Directions | fallback driving | $5/1K | Medium |
| Firestore | live/current writes | 50K reads/day free; Safe Walk ≈ 720 writes/hr | Medium |
| Functions | invocations | 2M/mo free | Low initially |
| FCM / Expo Push | push | free | Rate limits at scale |
| EAS Build | builds | $29/mo | Fixed |
| Earth Engine (VIIRS) | monthly refresh | free (research) | License review |
| Railway/Render | FastAPI | ~$5–20/mo | Low |
| OSM (ODbL) | road graph | **share-alike** | **Legal:** derived data must be ODbL-licensed; affects commercial API resale |

**No Twilio, no OTP provider, no Sentry/Crashlytics, no analytics** (Mixpanel/Amplitude/PostHog).

## 11. Security & privacy — Partial, several material issues

**Good:**
- Firestore rules are unusually careful (`firestore.rules`). Reports and guardians are callable-only; live/current writes restricted to specific keys; `sos_limits`/`sos_responders` server-only; presence doc write-only by owner; grace windows.
- Invite tokens correctly hashed and compared with `timingSafeEqual` (`:937`).

**Issues:**
- **`google-services.json` committed.** Normal for Firebase (keys are identifiers) — but then Firestore rules + App Check are the real boundary. **App Check is not enabled anywhere.** Callables can be hit from any client with a Firebase Auth token.
- **FastAPI routing service has no auth.** CORS `*`, `/report/hazard` even defaults `verified=True` (`routing/route_api.py:325`). Anyone who finds the URL can inject "verified" hazards and consume CPU.
- Phone numbers plaintext on `users` doc (rules restrict read to owner; still a leak vector).
- **No DPDP-compliant account-deletion / data-export flow.** India's DPDP Act 2023 requires it.
- Google Maps `EXPO_PUBLIC_*` key is bundled with the app — verify API + App Restrictions in Google Cloud Console; set per-key daily quotas.

## 12. Deployment readiness

- `eas.json` minimal — `preview` builds an APK, `production` only sets `autoIncrement`. No `staging`, no OTA/release-channel strategy, no EAS env vars wired.
- No CI/CD for the app (only the monthly-lighting workflow).
- No crash reporting — first prod crash will be invisible.
- Routing API: Railway config exists; in-memory cache + in-memory community bias means restart drops state (short-lived, acceptable).
- Firestore-rules tests absent despite careful rules.
- Android `com.saferoute.app`. No Play/App Store listings yet. App Links `assetlinks` referenced but signed-cert verification not confirmed.

---

## Top 10 bugs & tech debt

1. Police emergency number `122` → should be `112` (`SOS.tsx:51`).
2. ML target leakage — R²=0.999 is spurious (`ml/metrics.json`, `ml/train_xgboost.py`).
3. SOS "audio recording" UI row is a lie — no capture wired.
4. FastAPI routes publicly open.
5. No App Check / server rate limits on callables.
6. `generateRoutes` queries `road_segments` nothing populates — dead code.
7. Community bias empty (1 report, 0 roads affected).
8. No Sentry/Crashlytics/analytics.
9. Giant screens (`navigate.tsx` 2.8k LOC) — maintenance risk.
10. No Firestore-rules tests.

## Launch blockers (ordered)

1. **Fix `122` → `112`.** One-line fix; untenable to ship with.
2. **Remove or actually implement audio/snapshot capture.** Shipping "Audio recording: On" when nothing records is a trust and legal hazard.
3. **Lock down FastAPI** — Firebase ID-token verification, tighten CORS, remove `verified=True` default on `/report/hazard`, add rate limits.
4. **Enable Firebase App Check** for Functions and Firestore.
5. **Restrict Google Maps API key** (Android package + SHA-1; separate Places/Directions keys; per-key daily quotas).
6. **Retrain or retire the XGBoost model.** Either collect real incident labels or publicly describe the product as a rule-based risk score with lighting weight — honest, still differentiated.
7. **Add a moderation surface** (even a simple web dashboard) or auto-expire pending reports and mark pins as "Pending".
8. **Account-deletion + data-export flow** for DPDP compliance.
9. **Add Sentry/Crashlytics + PostHog/Amplitude.**
10. **Scope the geography.** Mumbai-only graph; handle out-of-area users gracefully; say "Mumbai beta" in onboarding.
11. **Firestore-rules tests** (`firebase emulators:exec`) before public launch.
12. **Expand `eas.json`** with staging profile, EAS env vars, OTA updates.
13. **Ground-truth safety claims.** Walk the "safest" vs "fastest" routes in Mumbai with a test cohort before marketing "safer than Google Maps".

## Feature classification summary

| Feature | Verdict |
| --- | --- |
| Email/password auth | Implemented & verified |
| Google Maps display + search | Implemented & verified |
| A* Safest/Balanced/Fastest (Mumbai) | Implemented & verified; **Mumbai-only** |
| Safety score (rule-based) | Implemented & verified |
| XGBoost risk model | **Effectively mocked** — predicts its own input formula |
| Street-lighting via VIIRS (monthly) | Implemented & verified |
| Police/hospital proximity | Implemented & verified (CSV snapshot) |
| Community reports | Implemented but **data-empty**; **no moderation UI** |
| Guardian invite/accept/revoke | Implemented & verified |
| Safe Walk live sharing | Implemented & verified |
| SOS alert to guardians (push) | Implemented & verified |
| SOS SMS to guardians | Partial — opens composer; no server SMS |
| SOS nearby helpers | Implemented & verified |
| SOS audio / snapshot capture | **Not implemented** (UI shows active anyway) |
| One-tap 112 dial | Partial — hardcoded wrong number, confirm prompt |
| Live navigation + PiP | Implemented (custom native module) |
| Push notifications | Implemented & verified |
| Background location | Implemented & verified |
| Account deletion / data export | **Not implemented** |
| App Check / server rate limits | **Not implemented** |
| Crash reporting / analytics | **Not implemented** |
| Moderation dashboard | **Not implemented** |
| Multi-city support | **Not implemented** (Mumbai bbox hardcoded) |
| i18n / Hindi + regional languages | **Not implemented** |

---

**Bottom line.** Core architecture is stronger than typical pre-seed (careful Firestore rules, callable-only writes, idempotency, background tasks, PiP, real VIIRS pipeline). The dangerous gaps are: wrong emergency number, fake audio-recording status, an unprotected public routing API, a leaky XGBoost claim, and an empty community dataset. None is unfixable; none should ship unfixed.
