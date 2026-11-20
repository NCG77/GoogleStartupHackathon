# SafeRoute

SafeRoute is a personal-safety navigation app for Indian cities. It recommends safety-weighted walking routes, lets trusted guardians follow a walk live, and gives one-tap SOS. Routes are scored from road lighting (NASA/NOAA VIIRS night-time satellite data), proximity to police, regional crime statistics, entrapment/prospect streetscape metrics, and live community hazard reports, integrated with Google's **Gemini 3.8 Flash** multimodal safety intelligence suite.

## Features

- **Safety-weighted routing**: an A* router over a Mumbai road graph returns multiple route options (safest, balanced, fastest) with a safety score, a plain-language "why this route" explanation, and a confidence value. Night-time travel weights lighting more heavily.
- **Grounded Natural-Language Route Explanations ("Why This Route?")**: Powered by **Gemini 3.8 Flash**, translating complex spatial and illumination metrics (VIIRS night lighting, police station distance, entrapment scores, road prospect, and crime percentiles) into plain, reassuring pedestrian language with strict zero-hallucination grounding and deterministic offline fallbacks.
- **Multimodal Incident & Hazard Verification**: Employs **Gemini 3.8 Flash Vision** to classify community hazard photos (broken streetlights, deserted alleys, waterlogging, blocked sidewalks), detect real physical hazards, filter out spam/selfies, and rate severity (1–5) prior to public map dispatch.
- **Hands-Free / Voice-Activated Safety Assistant**: Dual-tier earphone assistant featuring a 0ms zero-latency regex scanner for urgent distress phrases in English, Hindi, and Marathi (`help me`, `being followed`, `call police`, `bachao`), coupled with **Gemini 3.8 Flash** for hands-free navigation commands (`reroute to safer street`, `find police`, `status check`).
- **Dynamic Neighborhood Safety Briefings**: Contextual, time-aware pre-trip briefings powered by **Gemini 3.8 Flash** synthesized from current hour, neighborhood lighting density, crowd activity, and police proximity (e.g., *"You're traveling after 10 PM in Kurla. Linking Road remains well-lit and active until midnight, but pedestrian crossways near the station have reduced lighting"*).
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
| Safety & Explanation | `services/`, `ml/`, `routing/` | Safety Score v2 (weighted geometric mean), Gemini 3.8 Flash multimodal intelligence |
| Data | `data/processed/` | Prebuilt Mumbai routing graph and per-road safety scores |

### Gemini 3.8 Flash Safety Intelligence Suite

SafeRoute integrates Google's **Gemini 3.8 Flash** model across client and server runtimes to provide real-time, grounded pedestrian safety intelligence with 100% deterministic offline fallback guarantees.

1. **Grounded Natural-Language Route Explanations ("Why This Route?")**:
   - Synthesizes complex road metrics (NASA/NOAA VIIRS night lighting radiance, police station proximity, road prospect/width, entrapment score, crime percentiles, and unlit segments avoided) into calm, reassuring single-sentence pedestrian guidance (e.g., *"This route adds 4 mins but avoids 3 unlit service lanes and keeps you within 300 m of a 24/7 police beat box"*).
   - Enforces strict zero-hallucination grounding (never invents streets or landmarks; every statement maps to an input metric).
   - Paired with deterministic template fallback engines: `services/geminiRouteExplanation.ts` (client) and `routing/gemini_explainer.py` (FastAPI backend).
   - Wired into `components/maps/MapTripSheet.tsx` and `components/route/ComparisonRouteCard.tsx`.

2. **Multimodal Incident & Hazard Verification**:
   - Uses `gemini-3.8-flash` multimodal vision to inspect and classify community hazard photos (broken streetlights, deserted alleys, waterlogging, blocked sidewalks, harassment blindspots).
   - Detects authentic physical street hazards, automatically rejects spam, selfies, and memes, and grades hazard severity on a 1–5 scale.
   - Outputs triaged moderation actions: `auto_approved` ($\ge 0.85$ confidence), `flagged_for_human_review`, or `rejected_spam`.
   - Includes test presets (`SAMPLE_HAZARD_PRESETS`) in `services/geminiHazardVerification.ts` and interactive UI in `app/CommunityReport.tsx`.

3. **Hands-Free / Voice-Activated Safety Assistant**:
   - Designed for night pedestrians walking with earphones without drawing attention to a phone screen.
   - **Dual-tier architecture**:
     - **Tier 1 (0ms Instant Distress Scanner)**: Local regex scanner detecting critical emergency distress terms across English, Hindi, and Marathi (`help me`, `being followed`, `call police`, `bachao`, `madad`, `choro`, `police ko bulao`, `koi peeche hai`). Dispatches immediate SOS alerts to guardians and nearby police with zero network latency.
     - **Tier 2 (Gemini 3.8 Flash Intent Engine)**: Natural-language command parser handling pedestrian navigation requests (`reroute to safer street`, `where is nearest police`, `status check`, `report hazard`).
   - Produces short, calming, low-volume earphone-ready audio responses.
   - Implemented via `services/geminiVoiceSafetyAssistant.ts`, `hooks/useVoiceSafetyAssistant.ts`, and integrated into `components/navigation/LiveNavigationHUD.tsx`.

4. **Dynamic Neighborhood Safety Briefings**:
   - Delivers time-aware, localized pre-trip intelligence before beginning a walk (e.g., *"You're traveling after 10 PM in Kurla. Linking Road remains well-lit and active until midnight, but pedestrian crossways near the station have reduced lighting"*).
   - Dynamically aggregates neighborhood name, current hour, VIIRS night illumination, police proximity, crowd ratio, and active community hazards.
   - Categorizes risk level (`low`, `moderate`, `caution`) with actionable highlights and an earphone audio briefing script.
   - Implemented in `services/geminiNeighborhoodBriefing.ts`, `components/safety/NeighborhoodBriefingCard.tsx`, mounted on `app/(tabs)/Home.tsx` and `components/maps/MapTripSheet.tsx`.

> Comprehensive schemas, prompt designs, error handling, runnable examples, and test matrices are documented in [docs/GEMINI-SAFETY-FEATURES.md](docs/GEMINI-SAFETY-FEATURES.md). Automated test suites are located in [tests/test_gemini_features.ts](tests/test_gemini_features.ts) and [tests/test_gemini_explainer.py](tests/test_gemini_explainer.py).

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
| `EXPO_PUBLIC_GEMINI_API_KEY` | App: Gemini 3.8 Flash route explanations, hazard vision verification, voice assistant, and neighborhood briefings |
| `GEMINI_API_KEY` | Routing API & backend server: Gemini 3.8 Flash route explanations (`routing/gemini_explainer.py`) |
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

### 7. Testing and verification

SafeRoute maintains automated test suites validating the Gemini 3.8 Flash safety intelligence suite and deterministic offline fallback guarantees:

```bash
# Run TypeScript / Node test suite (tests/test_gemini_features.ts - 10 unit & integration tests)
npm test
# or: npm run test:gemini

# Run Python route explainer test suite (tests/test_gemini_explainer.py - 5 unit tests)
npm run test:python
```

- **Client Safety Intelligence Suite (`tests/test_gemini_features.ts`)**:
  - **Feature 1**: Route explanation metric grounding and offline graceful degradation without API key.
  - **Feature 2**: Multimodal hazard photo classification, spam/selfie/meme rejection, and simulation presets (`SAMPLE_HAZARD_PRESETS`).
  - **Feature 3**: Voice safety assistant 0ms instant distress trigger across English, Hindi (`bachao`, `madad`, `police ko bulao`), and Marathi (`choro`, `koi peeche hai`), navigation intent parsing (`reroute_safest`, `find_police`, `status_check`, `report_hazard`), and command presets.
  - **Feature 4**: Dynamic neighborhood safety briefings, time-aware risk levels (`low`, `moderate`, `caution`), and async fallback execution.
- **Routing Engine Suite (`tests/test_gemini_explainer.py`)**:
  - Metric synthesis (delta minutes, VIIRS unlit service lanes avoided, police proximity).
  - Road prospect and entrapment escape route synthesis.
  - Offline degradation when `GEMINI_API_KEY` is omitted.
  - Zero-hallucination constraint verification (never invents ungrounded landmarks or streets).

## Project structure

```
app/            Screens (Expo Router); (tabs)/ holds Home, Navigate, Safe Walk, SOS, Alerts, Contacts, Settings
components/     UI, including design-system/, maps/, navigation/, route/, guardian/, tour/
core/           Client-side domain logic: safety score, route optimisation, Safe Walk, SOS, geohash, heatmap
services/       Firebase, routing API, notifications, places, presence, and Gemini 3.8 Flash safety services
hooks/, tasks/  React hooks (including useVoiceSafetyAssistant) and background location tasks
functions/      Firebase Cloud Functions
routing/        FastAPI routing service and gemini_explainer.py engine
ml/             Risk model training, evaluation, community intelligence, lighting refresh
tests/          Unit and integration test suites: Gemini safety suite (test_gemini_features.ts, test_gemini_explainer.py)
data/processed/ Runtime data for the routing service
docs/           SRS, Gemini safety suite (GEMINI-SAFETY-FEATURES.md), design system, guardian notes
```

## Data sources and attribution

- Road network: © OpenStreetMap contributors, via Geofabrik. OpenStreetMap data is available under the [Open Database License](https://opendatacommons.org/licenses/odbl/). Products that use the routing graph must show this attribution, and the ODbL share-alike terms apply to derived databases.
- Night-time lights: NASA/NOAA VIIRS Day/Night Band monthly composites, accessed through Google Earth Engine.
- Maps, places and directions: Google Maps Platform (subject to Google's terms).

## License

Proprietary. All rights reserved.
