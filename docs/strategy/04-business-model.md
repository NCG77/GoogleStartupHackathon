# SafeRoute — Business Model & Monetisation Strategy

## Principles (non-negotiable)

1. **The core safety stack is free forever.** SOS, 112 dial, basic safest route, 1 guardian, 1 Safe Walk per day. Charging for someone's survival is a moral and brand failure, and investors will know.
2. **No selling identifiable location histories.** Ever. This is the single fastest way to lose trust and run afoul of DPDP.
3. **No surveillance advertising.** If ads happen at all, they are contextual (nearby verified safe places), not behavioural.
4. **Monetise worry, not fear.** The product sells peace of mind to the person who cares about the user (parents, employers, partners), not fear to the user.

---

## Revenue stream evaluation

### Stream 1 — Freemium consumer subscription ("SafeRoute Premium")

**Who pays:** parents (for students), partners (for women), the user themselves (working professionals 24–35).
**Problem:** "I want to know she got home. I want her to have more than one guardian. I want 24/7 priority help."
**What we sell:**

| Feature | Free | Premium |
| --- | --- | --- |
| Safest / Balanced / Fastest routes | ✅ | ✅ |
| SOS to 112 + 1 guardian | ✅ | ✅ |
| Safe Walks per month | 10 | Unlimited |
| Guardians | 1 | Up to 5 |
| Live-location history replay | 24h | 30 days |
| Scheduled auto-share (daily commute) | ❌ | ✅ |
| Priority Safe Walk check-in reminders | ❌ | ✅ |
| Family plan (up to 4 members) | ❌ | ✅ |
| Early access to new-city expansion | ❌ | ✅ |

**Pricing:**
- Individual: **₹99/month** or **₹799/year** (33% off)
- Family (up to 4): **₹199/month** or **₹1,599/year**

Anchor: Netflix Mobile ₹149, Spotify Student ₹59, Life360 Silver equivalent ₹300–400 in India if launched. ₹99 fits the "single Netflix" mental slot.

**Revenue per customer:** ARPU ~₹700–900/yr (individual); ₹1,400–1,700/yr (family).
**Acquisition difficulty:** Moderate for parents of students (B2C2P); Harder for solo users.
**Implementation complexity:** Low — Stripe/Razorpay + RevenueCat for IAP/subscription management. 2 engineer-weeks.
**Time to first revenue:** Day 60–75 (after beta validation).
**Risk:** Early conversion will be <2% without strong parent-targeted funnel. Churn will be seasonal (academic year).

### Stream 2 — B2B employee safety (recommended early focus)

**Who pays:** HR/admin heads at BPOs, IT services, hospitals, aviation (crew), hospitality, delivery platforms.
**Problem:** "We have a corporate liability for staff travelling at night. Cab reimbursement doesn't cover the last 500m walk home." Many companies run manual "has she reached home?" WhatsApp protocols. Expensive, slow, inconsistent. HR teams would gladly pay for a software layer.
**What we sell:**
- Per-employee licence with:
  - Branded Safe Walk + Guardian defaults (employer is auto-guardian during shift hours)
  - Shift-aware auto-share from clock-out
  - Admin dashboard with aggregate (never individual) safety analytics
  - Panic escalation to a company security desk
  - SSO (Google/Microsoft) + offboarding on HRIS webhook
- Optional: a security-desk SaaS for cross-company response, later.

**Pricing:**

| Band | Users | ₹/user/month | Notes |
| --- | --- | --- | --- |
| Pilot (first 3 customers) | 50–200 | ₹49 | Pilot is 3 months free, then paid; annual contract |
| Small (SMB) | 200–1,000 | ₹79 | Monthly, auto-renew |
| Mid-market | 1,000–5,000 | ₹59 | Annual, PO + GST invoice |
| Enterprise (10k+) | 10k+ | ₹39 | Annual, procurement cycle |

A 2,000-employee BPO at ₹59 = **₹14.1L ARR per contract**. 10 contracts in year 1 = **~₹1 Cr ARR**. Achievable but requires founder sales effort.

**Acquisition difficulty:** High at first (3–6 month sales cycles, procurement processes). The pitch is easier than it looks because the pain is real and the ask (₹59/user/mo) is below what cab reimbursement costs.
**Implementation complexity:** Medium — admin dashboard, SSO, HRIS webhook, invoicing. ~6 engineer-weeks.
**Time to first revenue:** Day 90–150 (pilot conversion) if sold in parallel to beta.
**Risk:** Procurement delays. Policy committees. One lost pilot sets back the quarter.

### Stream 3 — API / safety intelligence (long-term)

**Who pays:** Logistics (Delhivery, Blinkit), fintech KYC/fraud (address-risk at loan origination), insurers (location-risk pricing), real estate (property safety score).
**What we sell:** `GET /safety-score?lat&lng&time` — a numeric score plus a lightweight explanation.
**Pricing:** ₹0.30–₹1 per call; volume tiers from ₹50k/mo.
**Acquisition difficulty:** Very high. Each customer is a custom integration + legal review.
**Implementation complexity:** Medium — need to harden FastAPI, add API keys, SLA, status page. ~3 engineer-weeks + ongoing.
**Time to first revenue:** 9–18 months. Not before Series A.
**Risk:** **OSM ODbL share-alike**. Scores derived from OSM may require derivatives to be OSM-licensed. Legal review mandatory before selling.
**Verdict:** Plan for it. Don't sell it in year 1.

### Stream 4 — Institutional partnerships

**Who pays:** colleges (safety-services budget), municipal bodies (smart-city grants), state police welfare funds, CSR arms of large corporates, NGOs (Nirbhaya Fund-linked projects).
**What we sell:** branded version of SafeRoute for a geofenced area (campus, city ward), aggregate dashboard for the institution, employer/campus-paid licences for members.
**Pricing:** ₹2–10L per institution per year. CSR projects can be ₹10–50L.
**Acquisition difficulty:** High (relationship + credentialing + often tender process).
**Implementation complexity:** Low (reuse enterprise dashboard).
**Time to first revenue:** 6–12 months.
**Risk:** Procurement is slow; political risk if a report flags a locality unfairly.

### Stream 5 — Other (flagged but not recommended early)

- **Verified safe-place partnerships** (24/7 pharmacies, cafés as "Safe Stops"): low revenue, good brand. Free in beta, paid-tier later. Not meaningful ARR.
- **In-app contextual recommendations** (Ola/Uber "Book a ride from here"): affiliate revenue is real but small. Only if they volunteer the integration.
- **Insurance referrals** (personal-accident add-ons): fine ethically if genuinely optional. Low urgency.

### Streams explicitly ruled out

- Selling location histories or anonymised movement datasets to anyone.
- Behavioural advertising.
- Paywalling SOS, 112 dial, or the primary Safest route.

---

## Scenario modelling (first 24 months)

Assumes Stage A/B/C execute as planned. Revenue attributions are conservative-moderate-optimistic.

### Year 1 (post-launch, Mumbai only)

| Metric | Conservative | Moderate | Optimistic |
| --- | --- | --- | --- |
| EOY installs | 20,000 | 50,000 | 120,000 |
| EOY MAU | 6,000 | 18,000 | 45,000 |
| Premium conversion % | 1.0% | 2.5% | 4.5% |
| Premium ARPU (blended, Ind+Fam) | ₹700 | ₹900 | ₹1,100 |
| **Consumer ARR (EOY)** | **₹0.4L** | **₹4L** | **₹22L** |
| B2B pilots signed | 0 | 2 | 4 |
| B2B ARR (EOY) | ₹0 | ₹25L | ₹70L |
| **Total ARR (EOY)** | **₹0.4L** | **₹29L** | **₹92L** |

### Year 2 (3-city expansion — Mumbai + Bangalore + Pune)

| Metric | Conservative | Moderate | Optimistic |
| --- | --- | --- | --- |
| EOY installs | 100k | 350k | 1M |
| EOY MAU | 30k | 120k | 400k |
| Consumer ARR | ₹5L | ₹35L | ₹1.5Cr |
| B2B ARR | ₹25L | ₹1.2Cr | ₹3.5Cr |
| **Total ARR (EOY)** | **₹30L** | **₹1.55Cr** | **₹5Cr** |

### Honest reading of the model

- **Consumer alone is slow.** At moderate numbers it's ₹4L ARR in Y1. That is not a venture business on its own in Y1.
- **B2B pulls the P&L.** Two pilots converted + two mid-market closes is the difference between a vanity app and a ₹1 Cr+ ARR startup entering Series A.
- **Optimistic case requires both tracks moving simultaneously**, plus one city beyond Mumbai in Y2.
- **Nothing here depends on the API or institutional streams.** Those are upside.

---

## Recommended first-12-month monetisation strategy

**Phase 1 (Months 0–3):** Free only. No monetisation. Focus on retention and ground-truthing. Launch Premium UI but keep behind feature flag.

**Phase 2 (Months 3–6):** Flip Premium on for a subset. Measure willingness to pay honestly. Target 2% conversion of 28-day actives. Simultaneously: founder-led outreach to 15 BPO/IT/hospital HR heads. Target: 1 pilot signed by Month 6.

**Phase 3 (Months 6–12):** Consumer Premium + 2–4 B2B pilots → paid. Introduce family plan after Month 9 when guardian-acceptance data is solid. Begin cautious conversations with institutions / CSR, no selling yet.

**Phase 4 (Months 12–18):** Expand to one new city, convert pilots, structure a first institutional partnership. Only now consider API productisation.

---

## What this means for the raise

The honest monetisation picture is: **B2B is the engine, consumer is the funnel and the brand**. This should be the framing in the investor pitch — a "safety SaaS with a consumer top-of-funnel", not a "consumer app with monetisation to be determined".
