# SafeRoute

SafeRoute is a personal-safety navigation app for Indian cities. It recommends safety-weighted walking routes, lets trusted guardians follow a walk live, and gives one-tap SOS. Routes are scored from road lighting (NASA/NOAA VIIRS night-time satellite data), proximity to police, regional crime statistics, entrapment/prospect streetscape metrics, and live community hazard reports, with grounded Gemini safety explanations.

## Features

- **Safety-weighted routing**: an A* router over a Mumbai road graph returns multiple route options (safest, balanced, fastest) with a safety score, a plain-language "why this route" explanation, and a confidence value. Night-time travel weights lighting more heavily.
- **Live navigation**: turn-by-turn HUD, nearest police station, rerouting around newly reported hazards, and Android picture-in-picture navigation.
- **Safe Walk**: share a walk with guardians, with periodic check-ins, a live viewer, and a post-walk review.
- **Guardians**: invite trusted contacts through deep links hosted on Firebase Hosting; accept or revoke access; guardians get push alerts.
- **SOS**: one-tap emergency alert that pushes live location to guardians and nearby users.
- **Community reports**: users report hazards; reports are verified, moderated, expire automatically, and feed back into route scoring every 15 minutes.
- **Alerts feed, saved places, onboarding, product tour, light/dark theme.**

## Architecture

```
┌──────────────────────────┐      ┌──────────────────────────────┐
│ Mobile app (Expo / RN)   │─────▶│ Routing API (FastAPI, Python)│
│ app/ components/ core/   │ HTTP │ routing/  ml/  data/processed│
│ services/ hooks/ tasks/  │      │ Railway / Render             │
└───────────┬──────────────┘      └──────────────┬───────────────┘
            │ Firebase SDK                        │ firebase-admin (report sync)
            ▼                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Firebase: Auth, Firestore (+rules), Cloud Functions, FCM push,  │
│ Hosting (guardian invite pages, Android assetlinks)             │
└─────────────────────────────────────────────────────────────────┘
            ▲
            │ monthly commit of refreshed lighting scores
┌───────────┴──────────────┐
│ GitHub Action            │  VIIRS via Google Earth Engine
│ monthly-lighting.yml     │
└──────────────────────────┘
```

| Layer | Location | Stack |
| --- | --- | --- |
| Mobile app | `app/`, `components/`, `core/`, `services/`, `hooks/`, `tasks/` | Expo SDK 57, React Native 0.86, React 19, Expo Router, react-native-maps (Google), Reanimated, React Native Paper |
| Native module | `modules/navigation-pip`, `plugins/withNavigationPip.js` | Kotlin, Expo config plugin |
| Cloud backend | `functions/src/index.ts`, `firestore.rules`, `firestore.indexes.json`, `hosting/` | Firebase Functions v2 (Node 22), Firestore, FCM, Hosting |
| Routing API | `routing/` | Python 3.12, FastAPI, NetworkX, GeoPandas |
| Safety & Explanation | `ml/`, `routing/` | Safety Score v2 (weighted geometric mean), Gemini 1.5 Flash grounded explanations |
| Data | `data/processed/` | Prebuilt Mumbai routing graph and per-road safety scores |

### Routing API endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/route/safe` | Compute route options between two points |
| GET | `/route/explain/{route_id}` | Explanation for a computed route |
| GET | `/route/confidence/{route_id}` | Confidence score for a computed route |
| POST | `/route/reroute` | Reroute from current position, avoiding active hazards |
| POST | `/report/hazard` | Register a temporary hazard |
| GET | `/community/stats` | Community report aggregates |
| GET | `/ml/metrics` | Risk model metrics |
| GET | `/health` | Health check |
| POST | `/admin/reload` | Reload scores and reports (requires `X-Admin-Token`) |

### Cloud Functions

Callable: `calculateSafetyScore`, `generateRoutes`, `verifyReport`, `moderateReport`, `createGuardianInvite`, `acceptGuardianInvite`, `revokeGuardian`, `startSafeWalk`, `startLiveShare`, `safeWalkCheckin`, `publishSafetyEvent`, `activateSOS`, `publishEmergencyEvent`, `markNotificationRead`, `clearNotifications`.
Triggers: `onReportCreated`, `onLiveRouteLocationUpdated`. HTTP: `updateCrowdDensity`. Scheduled: `expireOldReports` (hourly), `expireStaleSafetySessions`.

## Setup

### Prerequisites

- Node.js 22, npm
- Python 3.12
- JDK 17 and Android SDK (for Android builds), Xcode (for iOS)
- Firebase CLI (`npm i -g firebase-tools`) and EAS CLI (`npm i -g eas-cli`)
- A Google Cloud project with billing and these APIs enabled: Maps SDK for Android, Maps SDK for iOS, Places API, Directions API

### 1. Environment variables

```bash
cp .env.example .env
```

Fill in `.env`. Every variable is documented in `.env.example`:

| Variable | Used by |
| --- | --- |
| `EXPO_PUBLIC_FIREBASE_*` | App: Firebase web config |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | App: Expo push tokens |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | App: native maps (also injected into the Android manifest by Gradle) |
| `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`, `EXPO_PUBLIC_GOOGLE_DIRECTIONS_API_KEY` | App: search and directions |
| `EXPO_PUBLIC_ROUTING_API_URL` | App: routing API base URL (`http://10.0.2.2:8000` for the Android emulator) |
| `FIREBASE_SERVICE_ACCOUNT_JSON`, `COMMUNITY_SYNC_MINUTES`, `SAFEROUTE_ADMIN_TOKEN`, `SAFEROUTE_TZ` | Routing API server |
| `EE_SERVICE_ACCOUNT_JSON`, `EE_PROJECT`, `SAFEROUTE_API_URL` | GitHub Actions lighting refresh (set as repository secrets) |

Never commit `.env` or service-account keys; both are gitignored.

### 2. Firebase project

1. Create a Firebase project and enable Authentication (email/password), Firestore, Cloud Messaging and Hosting.
2. Register Android app `com.saferoute.app`, download `google-services.json` and place it in the project root (and in `android/app/`).
3. Point the CLI at your project and deploy the backend:

```bash
firebase use --add
npm --prefix functions install
firebase deploy --only functions,firestore,hosting
```

4. Guardian invite links use Android App Links. Put your signing certificate's SHA-256 in `hosting/.well-known/assetlinks.json`, and update the invite host names in `app.config.js` if your Hosting domain differs.

### 3. Routing API

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows; use `source .venv/bin/activate` elsewhere
pip install -r requirements.txt
python -m uvicorn routing.route_api:app --host 0.0.0.0 --port 8000
```

The API loads `data/processed/mumbai_routing_graph.pkl` at startup. To rebuild the graph or retrain the model you need the raw OpenStreetMap extracts (gitignored; see `data/README`), then run `python -m routing.graph_builder` and `python -m ml.train_xgboost`.

Deployment: `railpack.json` and the root `requirements.txt` deploy the API to Railway (or Render) as a Python 3.12 service. Set the server variables listed above on the host.

### 4. Mobile app

```bash
npm install
npx expo run:android   # or: npx expo run:ios
```

Expo Go is not supported (native maps keys, PiP module, background location); use a development build. `npm install` runs `patch-package` to apply the fixes in `patches/`.

### 5. Builds and release

EAS profiles are in `eas.json` (`development`, `preview` APK, `production`). Add the `EXPO_PUBLIC_*` variables as EAS environment variables, then:

```bash
eas build --profile preview --platform android
```

The `android/` project is committed. If you run `npx expo prebuild --clean`, re-check `android/app/src/main/AndroidManifest.xml` and keep the Maps key as the `${googleMapsApiKey}` placeholder rather than a literal key.

### 6. Monthly lighting refresh

`.github/workflows/monthly-lighting.yml` runs on the 5th and 20th of each month, pulls the latest VIIRS composite through Earth Engine, updates `data/processed/road_safety_scores.csv` and `lighting_meta.json`, commits the result and optionally hot-reloads the API. It needs the `EE_*` repository secrets.

## Project structure

```
app/            Screens (Expo Router); (tabs)/ holds Home, Navigate, Safe Walk, SOS, Alerts, Contacts, Settings
components/     UI, including design-system/, maps/, navigation/, route/, guardian/, tour/
core/           Client-side domain logic: safety score, route optimisation, Safe Walk, SOS, geohash, heatmap
services/       Firebase, routing API, notifications, places and presence clients
hooks/, tasks/  React hooks and background location tasks
functions/      Firebase Cloud Functions
routing/        FastAPI routing service
ml/             Risk model training, evaluation, community intelligence, lighting refresh
data/processed/ Runtime data for the routing service
docs/           SRS, design system, guardian/live-safety design notes
```

## Data sources and attribution

- Road network: © OpenStreetMap contributors, via Geofabrik. OpenStreetMap data is available under the [Open Database License](https://opendatacommons.org/licenses/odbl/). Products that use the routing graph must show this attribution, and the ODbL share-alike terms apply to derived databases.
- Night-time lights: NASA/NOAA VIIRS Day/Night Band monthly composites, accessed through Google Earth Engine.
- Maps, places and directions: Google Maps Platform (subject to Google's terms).

## License

Proprietary. All rights reserved.
