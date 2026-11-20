# SafeRoute — Founder Execution Plan & Strategic Verdict

## Verdict — is SafeRoute worth pursuing as a startup?

**Yes, conditionally.**

The product has three unusually strong assets for pre-seed: a real VIIRS satellite data pipeline, careful Firestore security rules, and a mature Safe Walk / Guardian subsystem. It also has three real liabilities: an overclaimed "AI" model that is actually label-leaking, UI rows that pretend to record audio when nothing is captured, and an emergency number hardcoded to the wrong value (`122` instead of `112`). The code is stronger than typical pre-seed; the marketing claims are weaker than typical pre-seed. Fix the claims to match the code, run a disciplined Mumbai beta, and this is a venture-fundable business. Ship as-is and it is not.

The category (planning-layer safety for Indian pedestrians) is real and uncontested. The hard part is not technology — it is trust and distribution. Those are founder problems.

## Strongest competitive advantage
A **category moat**, not an algorithm moat. Google, Ola, and Uber can technically build any single feature, but they won't enter the planning-layer safety category because: (a) safety claims open liability, (b) pedestrian routing isn't a monetisable session for them, (c) each additional metro of ground-truth data compounds. If SafeRoute is the trusted brand in 2 metros for 18 months, the next entrant has to rebuild the data + trust, which is a 12-month tax.

## Biggest weakness
**No evidence of real user demand yet.** 1 community report in the production dataset. No analytics. No retention data. Every strategic claim upstream — pricing, B2B willingness to pay, which route users pick — is an assumption until beta runs. Compounding this: solo-founder optics (hire the first engineer early), and overclaimed capabilities in current copy that will fail investor DD.

## What to stop building
- **Any new feature**, until the Launch Blockers (audit §Launch blockers) are shipped.
- The XGBoost "AI model" code path, unless it will be retrained against real labels (currently it predicts its own input formula). Either fix it or delete it; don't ship it as-is.
- Multi-city generalisation. Mumbai-only is the right discipline for 6+ months.
- A moderation dashboard built into the mobile app. Keep it as a Firebase Hosting admin page — cheaper, faster.
- Twilio-style server-sent SMS (expensive and unreliable). The native-composer fallback is defensible if the primary push works.
- The i18n / Hindi / regional languages scope. English-only in the Mumbai cohort.

## What to prioritise
1. **Audit launch-blockers 1–8** (single-digit days of work; unblocks everything downstream).
2. **75-route ground-truth dataset** (one weekend of founder+tester walking; essential before any marketing claim).
3. **Analytics instrumentation** (PostHog). Without this, beta is unmeasurable.
4. **Campus beachhead** (one Mumbai college, 150 users, one ambassador tier).
5. **B2B founder outreach** (15 BPO/IT HR conversations in parallel to beta; aim for 1 signed pilot LOI by Day 90).

## What to validate before spending money
Five assumptions, in order:
1. **Users will pick slower-safer routes** when offered. Measure: share of routes chosen that are not Fastest. Threshold for continuing: ≥ 30%.
2. **Parents will pay for a student's family plan** at ₹199/mo. Measure: conversion in an in-app parent-targeted flow. Threshold: ≥ 2% of users with an accepted guardian convert within 30 days.
3. **D28 retention ≥ 20%**. Below this, no paid acquisition.
4. **Safe Walk completion rate ≥ 70%** once started. Below this, the core promise isn't delivering.
5. **B2B HR persona confirms the pain** in 5 of 15 conversations. Below this, de-prioritise B2B for 6 months.

Do not spend on paid acquisition, B2B salespeople, or new-city expansion until the first four are true.

## Realistic path to 100 / 1,000 / 10,000 users

| Milestone | Path | Timeline |
| --- | --- | --- |
| **100 users** | Founders' + friends' + WhatsApp networks, one Mumbai college women's cell WhatsApp blast | Day 30–40 |
| **1,000 users** | College A full rollout (150 via ambassadors) + College B (150) + night-shift mini-cohort (50) + organic + 5 micro-influencer collabs | Day 55–70 |
| **10,000 users** | Public launch (Product Hunt + Mid-Day piece) + 3 more Mumbai colleges + 2 campus-ambassador cohorts + founder-led content on Insta/LinkedIn + referral loop (1 mo free Premium both sides) | Day 90–130 |

Do not use performance ads to get to 10k. The CAC will teach you nothing you don't already know, and retention isn't proven.

## Realistic path to the first paying customer
- **First consumer-paid customer:** Day 75–90, via Premium soft-launch to the most-active 10% of beta cohort. Expect single-digit paying users initially. This is a product-validation signal, not revenue.
- **First B2B pilot (free trial):** Day 60–90, via founder outreach to a BPO or hospital HR head.
- **First B2B paid contract:** Day 150–180, after pilot conversion. This is the real revenue event.

## B2C, B2B, or hybrid?
**Hybrid, with B2B as the P&L engine and B2C as the brand + funnel.**

- B2C alone is slow to monetise in India and hard to make venture-scale at ₹99/mo.
- B2B alone lacks the top-of-funnel and the brand that makes the B2B sale easier.
- The B2C product is the credential for the B2B pitch: "the app your female employees already trust." Lose the consumer side and the B2B sale gets harder.

Investor framing: "safety SaaS for Indian employers with a consumer top-of-funnel", not "consumer safety app with monetisation TBD".

## 90-day founder scorecard

Expect to do, personally, in this order:

| Days | Must do |
| --- | --- |
| 0–14 | Ship Launch Blockers. Re-copy every "AI" claim. Enable App Check. Fix the `122` bug today. |
| 15–30 | Ground-truth 25 routes × 3 times = 75 samples. Tune safety-score weights once. Ship moderation dashboard. Instrument PostHog. Draft ToS/privacy with DPDP coverage. |
| 31–45 | Soft-launch to 50 users. Weekly office hours on one Mumbai campus. Fix top-5 crashes from Sentry. Start 15 B2B HR conversations. |
| 46–60 | Open College A full cohort (150). Launch Premium behind feature flag to top-10% actives. Run 15 user interviews. First B2B pilot proposal out. |
| 61–75 | College B + night-shift mini-cohort. Creator collab launches. Mid-Day pitch out. Measure the five validation thresholds. |
| 76–90 | Public launch (Product Hunt + press). 1 B2B pilot LOI signed. Decide: raise now or extend beta 30 days. |

## Prioritised execution plan

### Must do immediately (this week)
- Fix `SOS.tsx:51` — police number `122` → `112`. One-line PR today.
- Remove or implement the "Audio recording" / "Snapshot" status UI (`SOS.tsx:110`). Do not ship a product that lies about recording.
- Tighten FastAPI (`routing/route_api.py`) — Firebase ID-token verification middleware, drop `allow_origins=["*"]`, remove `verified=True` default on `/report/hazard`.
- Enable Firebase App Check on all callables.
- Restrict Google Maps API keys in GCP Console, set per-key daily quotas.
- Replace every "AI" claim in app copy, store listing, pitch deck with "SafeRoute Safety Score (rule-based, satellite-informed)" or equivalent honest copy.

### Must do before beta
- Account deletion + data export flow (DPDP).
- Moderation dashboard (Firebase Hosting admin page).
- Sentry + PostHog instrumented with the 8 core events listed in Roadmap §Days 0–14.
- Mumbai-only gate on first launch (out-of-area → waitlist).
- 75-point ground-truth dataset collected and weights tuned once.
- Firestore-rules emulator test suite green.
- ToS + privacy policy live on Firebase Hosting; DPDP clauses reviewed by counsel.
- `eas.json` staging profile live; builds reproducible via GitHub Actions.
- Guardian-companion onboarding ≤ 60 seconds measured.

### Must do before public launch
- Battery-impact benchmark published in onboarding (≤ 8%/hr target).
- Verified Google Play / App Store listings with honest screenshots (no fake user counts).
- Press kit assembled (one-page PDF of the pitch, founder bio, product GIFs).
- 1 campus partnership formalised in writing (even informally).
- 15 B2B outreach conversations complete; 5 progressed to second meeting.
- D28 retention measured and ≥ 20% for the beta cohort.
- Zero shipped safety-critical bugs for 2 consecutive sprints.
- Legal: product-liability insurance in place (~₹80k/yr).

### Can wait until after traction
- Hindi / regional language localisation.
- Multi-city graph (Bangalore, Pune).
- Retrained XGBoost with real incident labels.
- Public safety-intelligence API productisation.
- Institutional / government partnerships (long cycle; apply in background).
- Advanced guardian features (geofence alerts, scheduled auto-share).
- Verified "Safe Stops" (24/7 pharmacies, cafés) program.
- CSR / Nirbhaya Fund applications (slow cycle; file but don't depend on).

## Closing — brutal honesty for the founder

The hardest thing about SafeRoute is not writing the code — the code is largely written and is better than average for the stage. The hardest thing is resisting three temptations that kill consumer-safety startups:

1. **Overclaiming.** Calling the model "AI", claiming "community-powered" when the dataset has 1 report, pretending UI rows capture things they don't. This is the single fastest path to irrecoverable trust loss. Fix the copy before anyone else sees it.
2. **Premature expansion.** New cities before Mumbai retention is proven. New features before launch blockers are fixed. New customer segments before the beachhead is retentive.
3. **Spending before validation.** Paid ads before D28 is ≥ 20%. Hiring a growth team before there is anything to grow. Raising before beta data exists.

The 90-day plan is designed around all three.

If the founder does the first 14 days properly — ship the blockers, retire the AI claim, instrument analytics — they will pitch investors from a position of unusual credibility at Day 90. Most pre-seed consumer founders cannot answer their own technical DD questions. A SafeRoute founder who has shipped the audit's fixes, ground-truthed 75 routes, and can point to retention data will be in the top decile of the cohort they pitch alongside.

That is a reachable position. Everything else is execution.
