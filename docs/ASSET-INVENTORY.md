# SafeRoute Asset Inventory

One row per transferable component. Documentation status is based on what exists in the repo today; owners are to be assigned.

| Component / Module | Tech Stack | Documentation Status | Assigned Owner |
| --- | --- | --- | --- |
| Mobile app shell and navigation | React Native, Expo, Expo Router | Complete (README) | TBD |
| Auth and onboarding | React Native, Firebase Auth | Needs Polish | TBD |
| Map UI and destination search | React Native, Maps Integration (Google Maps, Places, Directions) | Needs Polish | TBD |
| Safety routing engine | Python, FastAPI, NetworkX, GeoPandas | Needs Polish | TBD |
| Risk model and lighting pipeline | Python, XGBoost, Earth Engine, GitHub Actions | Needs Polish | TBD |
| Live navigation and Android PiP | React Native, Kotlin native module | Needs Polish | TBD |
| Safe Walk, guardians and SOS | React Native, Firebase Functions, Firestore, FCM | Complete (`docs/GUARDIAN-LIVE-SAFETY.md`) | TBD |
| Community reports and moderation | React Native, Firebase Functions, Firestore | Needs Polish | TBD |
| Firebase backend (rules, functions, hosting) | Node/TypeScript, Firebase | Needs Polish | TBD |
| Design system | React Native, Reanimated | Complete (`docs/design-system.md`) | TBD |
| Mumbai routing dataset | OpenStreetMap (ODbL), VIIRS | Needs Polish | TBD |

## What each component includes

**Mobile app shell and navigation**: `app/_layout.tsx`, `app/(tabs)/`, `app/index.tsx`, `hooks/`, `constants/`, `app.config.js`, `eas.json`, `patches/`. Tabs: Home, Navigate, Safe Walk, SOS, Alerts, Contacts, Settings.

**Auth and onboarding**: `app/Login.tsx`, `app/Signup.tsx`, `app/Onboarding.tsx`, `app/Permissions.tsx`, `components/auth/`, `hooks/useAuth.tsx`, `components/tour/`. Email/password sign-in only.

**Map UI and destination search**: `components/maps/`, `components/destination/`, `components/route/`, `app/RouteComparison.tsx`, `services/placesAutocomplete.ts`, `services/nearbyPlaces.ts`, `core/destinationSearch.ts`, `core/heatmap.ts`, `core/reviewMapLayer.ts`.

**Safety routing engine**: `routing/` (A* router, cost function, dynamic hazards, reroute, explanations, confidence, FastAPI app), `railpack.json`, root `requirements.txt`, `services/safeRouteApi.ts`. Modes: safest, balanced, fastest; day/night weighting.

**Risk model and lighting pipeline**: `ml/` (scoring, evaluation, prediction, community intelligence, monthly VIIRS refresh), `ml/metrics.json`, `.github/workflows/monthly-lighting.yml`.

**Live navigation and Android PiP**: `app/LiveNavigation.tsx`, `components/navigation/`, `core/liveNavigation.ts`, `tasks/navigationLocation.ts`, `modules/navigation-pip/`, `plugins/withNavigationPip.js`.

**Safe Walk, guardians and SOS**: `app/SafeWalk*.tsx`, `app/LiveWalkViewer.tsx`, `app/LiveLocationShareScreen.tsx`, `app/GuardianInvite.tsx`, `components/guardian/`, `core/safeWalk*.ts`, `core/guardian*.ts`, `core/sos.ts`, `services/guardian*.ts`, `services/presence.ts`, `tasks/locationTracking.ts`, `hosting/`.

**Community reports and moderation**: `app/CommunityReport.tsx`, `services/communityReports.ts`, `services/communityIntelligence.ts`, `core/trust.ts`, `core/incidentDetection.ts`, report functions in `functions/src/index.ts`.

**Firebase backend**: `functions/`, `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `hosting/`.

**Design system**: `components/design-system/`, `constants/theme.ts`, `docs/design-system.md`, `assets/fonts/`.

**Mumbai routing dataset**: `data/processed/` (routing graph, road safety scores, lighting metadata, community aggregates). Raw OpenStreetMap extracts are not in the repo and must be re-downloaded to rebuild.

## Architecture & Deployment Notes

- **Mumbai Coverage.** The routing graph and safety scores cover Mumbai. Expansion to another city requires regional OpenStreetMap extracts, a scores CSV and a graph rebuild.
- **Rule-Based Safety Scoring (v2).** The scoring equation is an axiomatic weighted geometric mean combining VIIRS nighttime lighting, exponential decay police proximity, and regional crime scores (with entrapment and prospect streetscape features). The legacy linear model has been fully retired.
- **Verification & Tests.** Comprehensive test suite covers Firestore security rules, axiomatic scoring behavior, and routing confidence.
- **Android & Cross-Platform.** Android native project is configured and validated.
- **Environment Configuration.** All configuration is parameterized via environment variables and EAS profiles (`staging`, `preview`, `production`).
- **External Services.** Google Maps Platform, Firebase, EAS, and Earth Engine configurations are managed via standard environment secrets.

## Deployment Checklist

- [ ] Ensure Google Maps API keys are restricted by package name, SHA-1 fingerprint, and HTTP referrers.
- [ ] Configure production Firebase, EAS, and Cloud Run projects.
- [ ] Schedule GitHub Actions monthly lighting refresh workflow with Earth Engine credentials.
- [ ] Confirm no personal user data is in repo (synthetic / sample data only; production user records live in secure Firestore).
