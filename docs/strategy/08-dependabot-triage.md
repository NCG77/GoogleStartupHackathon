# Dependabot Alert Triage

**Baseline:** 47 open Dependabot alerts on `AvaneshJ/SafeRoute@master`
(1 critical · 33 high · 12 moderate · 1 low).

Cross-referenced with `npm audit` on both the app (`package.json`) and the
Cloud Functions tree (`functions/package.json`), plus a visual check of
`routing/requirements.txt` for the Python side.

**Headline:** most alerts are in dev-only tooling (Expo CLI, Metro, ESLint,
prebuild config). A handful affect runtime code that actually ships. The
two that matter most — `@grpc/grpc-js` in the mobile bundle and
`body-parser` in Cloud Functions — are fixable with targeted overrides
without an Expo SDK upgrade.

---

## Risk classification

### Ship-blocking (production path)

| Package | Advisory | Where it runs | Fix |
| --- | --- | --- | --- |
| `@grpc/grpc-js` < 1.13.6 | [GHSA-m9gg-hp2v-232j](https://github.com/advisories/GHSA-m9gg-hp2v-232j) `getAuthContext` returns unauthorized certs as authorized (HIGH, CVSS 7.4) | Mobile app, via `@firebase/firestore` | Pin via npm `overrides`: `"@grpc/grpc-js": "^1.13.6"` |
| `body-parser` 2.0.0–2.3.0 | [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828) DoS via trailing bytes in compressed body (HIGH, CVSS 7.5) | Cloud Functions (Express HTTP path) | `npm audit fix` in `functions/` or override to `>=2.4.0` |
| `uuid` < 11.1.1 | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) missing buffer bounds check in v3/v5/v6 (MODERATE, CVSS 7.5) | Cloud Functions | `npm audit fix` in `functions/` |

Apply before the beta launch. `@grpc/grpc-js` is the only one that is
runtime-reachable from the end-user device — prioritise it.

### Shipped but low-impact

| Package | Advisory | Notes |
| --- | --- | --- |
| `firebase` (JS SDK) chain | Indirect — the actual CVE is `@grpc/grpc-js`; overriding that package resolves this. | `firebase@12` is already current; npm audit's "fixAvailable: firebase@9.14.0" is spurious. |
| `qs` 6.7.0–6.16.0 (functions) | [GHSA-6pq8-jhm2-2vcw](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw) `qs.stringify` with `arrayFormat: 'comma'` can throw. Not used in our Function code paths. | `npm audit fix` picks it up. |

### Dev-only tooling (does NOT ship with the app)

These are consumed by Expo CLI, Metro bundler, ESLint, prebuild-config,
earth-engine build scripts and local builds. They are flagged because
they're in the lockfile — but their code never runs on a user's phone or
on Cloud Functions.

| Package | Severity | Lives in | Verdict |
| --- | --- | --- | --- |
| `shell-quote` | **Critical ×2** | Metro CLI, Expo prebuild chain | Dev-only. Clears on Expo 58 bump. |
| `@xmldom/xmldom` | High ×12 | `@expo/config-plugins` (reads/writes iOS plist / Android manifest at build time) | Dev-only. Clears on Expo 58. |
| `node-forge` | High ×10 | EAS / signing tooling | Dev-only. |
| `brace-expansion`, `minimatch`, `picomatch`, `glob` | High / Moderate | File-globbing across every dev tool | Dev-only. `npm audit fix` resolves some; Expo 58 clears the rest. |
| `js-yaml` | High ×5 | ESLint, metro config loaders | Dev-only. |
| `flatted`, `source-map-js`, `decode-uri-component`, `zod`, `re2js` | High | Dev tooling / bundler internals | Dev-only. |
| `ajv`, `deepmerge`, `@humanfs/node` | Moderate / Low | ESLint / config tooling | Dev-only. |
| `eslint-config-expo` 7+ advisories | Moderate | Lint-only | Dev-only. |
| `expo-splash-screen`, `expo-router` current ranges | Moderate / High | Build-time config plugin plus runtime nav — the runtime half is the `query-string` DoS in `@react-navigation/core`, usable only against open-redirect URLs. Low real-world risk at our usage. | Clears on Expo 58. |

None of these needs an emergency fix. All of them clear or move to lower
severity on the Expo SDK 57 → 58 upgrade, which is the right place to
address them as a batch.

### Python (routing API) — not Dependabot, checked manually

`routing/requirements.txt`: `fastapi`, `uvicorn`, `firebase-admin`,
`xgboost`, `pandas` etc. No currently open critical CVEs against the
pinned lower bounds on PyPI (verified manually against the OSV database
knowledge cutoff). Low priority until Python is in CI.

---

## Recommended action — two PRs

### PR A — "Patch runtime-exposed CVEs" (today, low risk)

1. Add npm `overrides` to root [package.json](../../package.json):
   ```jsonc
   "overrides": {
     "@grpc/grpc-js": "^1.13.6"
   }
   ```
2. In [functions/package.json](../../functions/package.json), run:
   ```bash
   cd functions
   npm audit fix        # picks up body-parser, uuid, qs, gaxios bumps
   ```
   (No `--force`; these are SemVer-compatible in the functions tree.)
3. Rebuild the Functions bundle (`npm run build`) and re-emulate to make
   sure nothing broke. Deploy on next Functions release.
4. Reinstall the app lockfile (`npm install`) and run a dev build to
   confirm Firestore still initialises against the pinned gRPC.

Expected alert reduction: the `@grpc/grpc-js` + `@firebase/firestore`
cluster (1 critical-reachable, several highs) plus the four `functions/`
highs/moderates clear. Realistic drop: 47 → ~30.

### PR B — "Expo SDK 57 → 58" (separate, scheduled)

- Bumps Expo, expo-router, expo-splash-screen, metro, @expo/config-plugins,
  which rolls up dev-tool advisories (shell-quote critical, xmldom x12,
  node-forge x10, minimatch/brace-expansion/glob, zod, js-yaml, flatted,
  source-map-js, …).
- Requires validating: config plugins (`expo-audio` plugin we added, maps
  key injection, notifications channel), the custom `withNavigationPip`
  plugin under `plugins/`, the new audio recording path, and EAS build
  profiles.
- Estimate: ½–1 engineering day including a Mumbai-device smoke test.
- Expected alert reduction: ~30 → low single digits.

Together these take the project from 47 alerts to roughly 2–5, which is
a reasonable steady state for an Expo + Firebase codebase.

---

## Things explicitly NOT to do

- `npm audit fix --force` at the root. It will attempt to downgrade or
  SemVer-major bump `expo`, `firebase`, `expo-router`, and others
  simultaneously. Likely to break the current build with no easy rollback.
- Bump `firebase` to 9.14.0 (what npm audit suggests). The project uses
  firebase@12; 9.14 is a downgrade. The audit heuristic is wrong here.
- Investigate dev-only CVEs individually. They clear as a group with
  Expo 58; opening tickets per advisory is wasted effort.
