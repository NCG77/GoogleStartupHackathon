# SafeRoute — 30 / 60 / 90-Day Product & Launch Roadmap

Grounded in the audit. Three stages: MVP readiness → closed beta → public launch. Assume a small founding team (1–3 people) and pre-seed budget constraints (₹5–15L cash on hand, pre-fundraise).

---

## Stage A — Pre-launch / MVP readiness (Days 0–30)

**Goal:** make SafeRoute shippable without dishonesty, trust-eroding bugs, or legal exposure. Zero new user-facing features in this stage.

### Days 0–14 — Launch blockers (non-negotiable)

Each item maps to the audit's Launch Blockers list.

| # | Task | Owner | Evidence of done |
| --- | --- | --- | --- |
| 1 | Fix `SOS.tsx:51` police number `122` → `112` | Engineer | Grep clean; a production build dials 112 on test device |
| 2 | Remove "Audio recording: Active" / "Snapshot" status rows from `SOS.tsx:110` OR actually implement `expo-audio recordAsync` + upload to Firebase Storage with retention ≤ 30 days + consent copy | Engineer | UI either absent or wired to a real capture pipeline |
| 3 | Lock down FastAPI routing service: Firebase ID-token verification middleware, remove `verified=True` default on `/report/hazard`, tighten `allow_origins` to app bundle origins only, add per-IP rate limit (e.g. slowapi, 60 req/min) | Engineer | `curl` without a valid token returns 401 |
| 4 | Enable Firebase App Check (Play Integrity on Android, DeviceCheck on iOS) on callables and Firestore | Engineer | Unauthenticated Firebase REST call to `activateSOS` returns 401 |
| 5 | Restrict Google Maps API key in GCP (Android pkg + SHA-1; iOS bundle id; separate keys for Maps SDK vs Places vs Directions; per-key daily quota caps) | Engineer | Key usage dashboard shows separate per-API counters |
| 6 | Retire or rebrand the XGBoost model: either (a) retrain against a real target (police-FIR heatmap, if obtainable) OR (b) relabel the "AI Safety Score" as "SafeRoute Safety Score (rule-based)" across UI, app store listing, pitch deck | Founder+Eng | No surface uses "AI" without a defensible claim |
| 7 | Account-deletion & data-export callable + Settings UI entries | Engineer | Delete wipes `users`, `report_authors`, `guardians` edges, scrubs `routes`; export emits JSON zip |
| 8 | Install Sentry (RN + Functions + FastAPI) and PostHog (events: route_requested, sos_triggered, walk_started, walk_completed, guardian_invited, guardian_accepted) | Engineer | Dashboard populated with real events from dev builds |
| 9 | Mumbai-only guardrail in onboarding: detect user location on first launch; if outside Mumbai bbox, show "SafeRoute is in Mumbai beta — join waitlist" screen | Engineer | A device in Bangalore sees waitlist, not an unusable map |

### Days 15–30 — Pre-beta hardening

| # | Task | Done when |
| --- | --- | --- |
| 10 | **Hand-walk ground-truth cohort**: founder + 3 testers walk 25 highest-use routes in South Mumbai and Andheri West at 3 time slots (morning, 8 PM, 11 PM). Log where the score felt wrong. Tune weights in `core/safetyScore.ts` and lighting threshold once. | Dataset of 75 route-time samples; one weight-tuning PR merged |
| 11 | Simple moderation web dashboard (Firebase Hosting + Admin SDK) — list pending reports, approve/reject, trust-penalty on reject | Can approve a report in <30s |
| 12 | Firestore-rules emulator test suite (`firebase emulators:exec`) covering: unauthenticated writes blocked, report `participantIds` enforced, SOS responder list unreadable by non-admin, live/current payload-size guard | `npm test:rules` green |
| 13 | Battery impact measurement for Safe Walk — Android + iOS, 60-minute walk, log % drop. Publish in onboarding copy. | Documented number; if >8%/hr tune location update cadence |
| 14 | `eas.json` adds `staging` profile with separate Firebase project + env vars; wire GitHub Actions to build on every tag | `eas build --profile staging` succeeds |
| 15 | Draft **safety disclaimer + ToS + privacy policy** reflecting DPDP 2023 (publish on Firebase Hosting) | Lawyer-reviewed if budget allows; otherwise use Termly + SpotDraft templates with DPDP clauses |
| 16 | Replace all `"AI"` strings in-app, store listings, pitch deck with honest copy | Grep clean |

**Stage A exit criteria:** every Launch Blocker fixed; 75-point ground-truth dataset collected; emulator tests green; staging builds pass; disclaimers live.

---

## Stage B — Closed beta (Days 31–60)

**Goal:** 300–500 real users in Mumbai using SafeRoute at least once a week. Validate the five assumptions in Market Assessment §"What is validated vs assumed".

### Ideal beta user profile

- Woman, 18–28, resident or student in Mumbai
- Uses a smartphone ≥ 4h/day
- Travels at night at least twice a week (college, work, errands)
- Has at least one potential guardian (parent, flatmate, partner) willing to install the companion app

### Cohort design

| Cohort | Size | Source | Why |
| --- | --- | --- | --- |
| **College A** — a women's or co-ed college in South Mumbai | 150 | Partnership with women's cell / student council | High density, viral in dorm |
| **College B** — Andheri/Vile Parle cluster | 150 | 1 ambassador per 50 users | Different micro-geography |
| **Night-shift mini-cohort** | 50–100 | One Powai/BKC BPO partnership OR direct outreach via r/Mumbai, LinkedIn | Validates Segment #2 |

Total target: **350–400 active users**.

### Launch plan

- **Week 5:** Soft-launch to 50 users (founders' networks, immediate friends). Fix top 5 crashes.
- **Week 6:** Open to College A ambassadors. Weekly office hours on campus.
- **Week 7:** Add College B + night-shift. Deploy Reels/Insta content from ambassadors.
- **Week 8:** Measure. Interview 15 users (3 per cohort). Decide whether to continue to public launch or extend beta.

### Metrics (weekly in PostHog)

- **North-star:** # users who completed ≥ 1 Safe Walk in the week
- D1 / D7 / D28 retention
- Routes generated per WAU
- % of routes where user picked Safest vs Balanced vs Fastest (**key product-truth signal**)
- Guardian invite → accept rate (target ≥ 40%)
- SOS triggers (want this to be 0 in beta; any real one gets manual triage and a post-mortem)
- NPS at week 4

### Success criteria (go/no-go to public launch)

- ≥ 250 users active in week 8
- D28 retention ≥ 20% (consumer-utility benchmark)
- ≥ 30% of routes picked are NOT fastest (if 95% pick fastest, the safety signal isn't moving behaviour)
- ≥ 40% guardian acceptance
- Qualitative: ≥ 10 out of 15 interviewees would be upset if the app disappeared (Sean Ellis cut)
- 0 shipped incidents of wrong emergency dial / SOS not reaching guardian

### Failure modes to monitor

- Safety score mismatch with lived experience → pause marketing, re-ground-truth
- Battery complaints → tune location cadence or cap background duration
- Guardian churn (installed, uninstalled within 7 days) → simplify companion onboarding
- SOS false triggers → raise hold threshold

### Budget — Stage B

Lean. Absolute numbers depend on partnerships.

| Line item | Estimate (INR) |
| --- | --- |
| 10 campus ambassadors × ₹2,000/mo × 2 mo | 40,000 |
| Reels/Insta boost + content | 50,000 |
| Google Maps/Places/Directions (400 DAUs × 30d × ~2 routes/day) | 20,000–40,000 |
| Firebase + Railway + EAS + Expo | 10,000 |
| Beta users meetup + tester incentives (swag, pizza) | 20,000 |
| Printed campus posters + QR | 10,000 |
| **Total** | **1.5–1.7 Lakh** |

---

## Stage C — Public launch (Days 61–90)

**Goal:** 3,000–5,000 total users in Mumbai, press coverage in at least 2 publications, 1 B2B pilot LOI signed.

### Pre-launch (Week 9)

- App Store Optimisation: icon, screenshots, 3-line pitch, "Mumbai only" explicit in description.
- Press kit: founder photo, product GIFs, one-pager, founder story (short, personal, truthful).
- Prepare "launch day" press blast to: Inc42, YourStory, The Ken, Mid-Day (Mumbai-local). Prioritise Mid-Day over nationals.

### Launch (Weeks 10–12)

- **Product Hunt + Twitter/X launch** on a Tuesday. Target Top 5 of the day — not a hit metric, but it drives early D1.
- **Content engine**: 2 Instagram Reels per week from founders about *why*, not features. "Here's what Mumbai after 10 PM looks like on our data." Data storytelling, not demos.
- **Creator collabs**: 5–8 micro-influencers in Mumbai (10k–50k followers, women-led accounts, student-life focus). ₹5,000–15,000 per partnership. Prioritise long-form (2–5 min videos) over stories.
- **Campus expansion**: College C and D onboard via ambassador referrals.
- **PR angle**: "Why can't Google Maps keep women safe in Mumbai?" — opinion piece by founder. More pickup than product announcements.
- **Referral**: in-app invite flow. Reward both sides with 1 month free Premium. Honest, not predatory.

### B2B parallel track (Week 9 onwards)

- Cold-reach 15 BPO/IT-BPO employee-safety heads in BKC + Powai. Target: 1 signed pilot LOI by day 90.
- Cold-reach 5 Mumbai colleges' women's cells. Target: 1 formal campus partnership.

### 90-day target scorecard

| Metric | Target |
| --- | --- |
| Total installs | 10,000 |
| 28-day actives | 3,000 |
| Safe Walks completed | 5,000 |
| Guardians active | 2,000 |
| Press placements | 2 |
| B2B pilot LOIs | 1 |
| Paid users (if subscriptions live) | 150–300 at ₹99/mo |

### Budget — Stage C

| Line item | Estimate (INR) |
| --- | --- |
| Influencer collabs (6 × ₹10k) | 60,000 |
| PR consultant (part-time, 1 mo) | 50,000 |
| Google Maps/Places/Directions (3k DAUs scale) | 60,000 |
| Firebase + Railway + EAS + Expo | 15,000 |
| Event / college launch days | 30,000 |
| Reserve for ad experiments (Meta, strictly tested) | 50,000 |
| **Total** | **~2.5 Lakh** |

**Sum of Stages A+B+C: ~4.5–5.5 Lakh.** Before any raise.

---

## What NOT to do in 90 days

- Do not expand beyond Mumbai. Graph work + ground-truthing another city is a 2-month tax.
- Do not build multi-language i18n yet. English-first in Mumbai college cohort.
- Do not launch a B2B dashboard product. One pilot LOI ≠ productising.
- Do not spend on performance ads before D28 retention ≥ 20%. You will burn cash moving people into a leaky funnel.
- Do not ship the XGBoost model as "AI". The investor round after beta will ask.
- Do not integrate with 112 India app without a specific government contact. It sounds great in the pitch and takes 9 months of follow-up.
