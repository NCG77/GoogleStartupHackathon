# SafeRoute — One-Page Pitch

**Tagline:** The safest way home — not just the fastest.
**Stage:** Live Android prototype · Mumbai beta · November 2026
**Founders:** Swastik Mishra · Avanesh Joshi (CSE, VIT Bhopal)
**Raising:** ₹1,50,000 on an uncapped SAFE — to fund a 90-day Mumbai closed beta

---

### Problem
Half of urban Indian women restrict their movement after dark (NFHS-5). India recorded **4,41,534 crimes against women in 2024 — one every 71 seconds** (NCRB). Yet Google Maps only answers *"what's fastest?"*, ride-hailing SOS only works *inside* the vehicle, and 112/Himmat only *react*. **Nobody plans for safety.**

### Solution
A navigation app that scores every route **0–100 for safety** using NASA VIIRS satellite street-lighting (refreshed monthly), proximity to police and hospitals, road type, time of day, and community reports — bundled with **Safe Walk** (live route-sharing with trusted guardians + automated check-ins), **Guardian invite** (cryptographic one-tap sharing), and **SOS** (push + SMS to guardians, broadcast to opted-in nearby SafeRoute users within 300 m, and short audio-evidence clip). Core safety — SOS, 112 dial, basic Safest route, 1 guardian — is **free forever**.

### Product — what ships today
Real Android prototype with Mumbai routing graph. **Verified working:** A* Safest/Balanced/Fastest routing, rule-based safety scoring with monthly VIIRS refresh, Safe Walk end-to-end, guardian invite/accept/revoke, SOS with real audio recording uploaded to Firebase Storage, Firestore rules (callable-only writes), FastAPI routing service with Firebase-ID-token auth + rate limits. **Honest note:** we previously called the score "AI-powered" — it is actually a rule-based engine over real satellite + geo inputs. The label was retired because the training data had target leakage; the engine itself is unchanged and defensible.

### Market
- 650 M+ urban Indian smartphone users (TRAI). 22 M in Mumbai Metro Region alone.
- Beachhead: **women students 18–24 in Mumbai** (~1 M+ in higher-ed; viral on-campus; parents pay).
- Adjacent B2B: night-shift workforce (BPO / IT / hospitals / aviation) — 3–5 M across metros, employer-liable.

### Competitive moat
**Category moat**, not algorithm: Google and Ola can copy features but won't enter the planning-layer safety category (liability + no monetisable pedestrian session; Google shelved its 2022 "lit streets" trial). Our edge is localised data assets (VIIRS + OSM + Indian crime/police geo), pedestrian-first vertical focus, and brand trust in a vertical incumbents avoid. Rebuilding this takes a competent challenger 12+ months.

### Business model
Freemium consumer (**₹99/mo** individual / **₹199/mo** family — parents of students pay) as the top-of-funnel and brand, **B2B employee-safety SaaS at ₹39–79/user/month** sold to BPOs, IT services, hospitals, and logistics as the P&L engine (replaces manual "did she reach home?" WhatsApp protocols; a 2,000-employee contract ≈ ₹14 L ARR). Future: safety-intelligence API for logistics, fintech-KYC, insurance. **We explicitly do not sell location histories or run surveillance ads.**

### The ask — ₹1,50,000 on an uncapped SAFE
Fund the **90-day Mumbai closed beta** → 300–500 real users, measured D28 retention, 75-route ground-truth dataset, first B2B pilot LOI. This is the evidence we need before raising a **₹1.5–2.5 Cr pre-seed round in Q2 2027**.

| Use of funds | Amount |
| --- | --- |
| Campus ambassadors (10 × ₹2,000 × 2 mo) | ₹40,000 |
| Reels / Insta content + micro-boosts | ₹30,000 |
| Google Maps / Places / Directions API | ₹20,000 |
| Firebase / Railway / EAS / Expo infrastructure | ₹10,000 |
| Beta meetups + tester incentives | ₹20,000 |
| Campus posters + QR + print collateral | ₹10,000 |
| Contingency (safety incident response fund) | ₹20,000 |
| **Total** | **₹1,50,000** |

Founders self-fund living expenses. 100 % of the capital goes to execution.

### 90-day milestones this money buys
Days 0–30: ship audit blockers, instrument Sentry + PostHog, hand-walk 75 Mumbai routes. Days 31–60: 300–500 beta users across 2 colleges + night-shift mini-cohort. Days 61–90: Product Hunt + Mid-Day launch, 10 k installs, 1 signed B2B pilot LOI.

### Long-term vision
The safety layer under India's urban movement. In five years, *"has she reached home yet?"* is answered by software, not WhatsApp.
