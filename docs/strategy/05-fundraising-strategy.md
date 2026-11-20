# SafeRoute — Pre-Seed Fundraising Strategy

## Are we raise-ready today? Honest answer: no, not yet.

The audit shows a product that is **architecturally strong** but has:
- A shippable-but-undemoed state (needs 2–3 weeks of blocker fixes before an investor demo)
- Zero live user traction (`reports_total: 1`)
- A safety-score claim that will not survive a technical DD
- No analytics instrumentation (nothing to show "retention is X")

A raise *right now* (week 0) would be forced to compete on vision alone. For a safety product with Indian investors, vision alone gets a ~₹30–50L raise at an unhelpful valuation (if any). **Better plan: close Stage A + a 2-month beta first, then raise.** You'll walk into pre-seed conversations with:

- Shipped product, honest safety score, no legal landmines
- ≥ 300 real users with ≥ 20% D28 retention
- A clear B2B pilot LOI (even unsigned) with a named counterparty
- Unit economics tested at small N

That changes a ₹50L raise at ₹2 Cr pre to a **₹1.5–2.5 Cr raise at ₹8–12 Cr pre**, with better terms.

**Recommendation: raise at Day 90–120, not Day 0.**

---

## Fundraising target

### Round shape

- **Instrument:** SAFE (Indian-adapted) or **CCPS** depending on investor preference. Avoid priced equity rounds at pre-seed — valuation will be unstable.
- **Target amount:** **₹1.5–2.5 Cr (US $180k–$300k)**
- **Pre-money valuation range** (negotiate against progress at pitch time): **₹6–12 Cr**
- **Runway target:** **14–18 months** (budget below assumes 15)

### Who to pitch, in order of fit

| Source | Why fit | Typical cheque | Realistic yes-rate |
| --- | --- | --- | --- |
| **Accelerators** (Antler, Techstars Bangalore, AngelList India PACT, 100X.VC Class) | Pre-seed structured, mentor-heavy, cohort press | ₹25–75L | High if accepted |
| **Angel syndicates** (AngelList India, LetsVenture, Inflection Point Ventures) | Fast, community, vertical angels (women-safety, consumer) | ₹25L–1 Cr | Medium |
| **Operator-angels** (ex-Ola, ex-Uber India, ex-Swiggy safety ops, Nykaa, MapmyIndia founders) | Pattern-match on consumer+mobility | ₹5–25L each | Medium-high with warm intros |
| **Micro-VC / pre-seed funds** (Blume Fellowship, Antler, Spaero, First Cheque, PeerCapital) | Written to lead ₹1–2 Cr pre-seed | ₹50L–1.5 Cr | Medium if traction |
| **Grants** (Nirbhaya Fund-linked state programs, Startup India Seed Fund Scheme) | Non-dilutive, mission-aligned | ₹10–50L | Low probability, slow (6–12mo) — apply in parallel, don't depend on |
| **CSR arms** (Mahindra, Tata, Reliance Foundation) | Mission fit; often conditional on partnership | ₹10–50L | Medium-slow |

**Strategy:** anchor with one lead (micro-VC or accelerator) → fill with 3–6 angels → simultaneously file SISFS application as free optionality.

---

## Suggested use of funds (₹2 Cr base case; scale pro-rata if smaller)

| Bucket | Allocation | ₹ (Cr) | What it buys |
| --- | --- | --- | --- |
| **Product & engineering** | 45% | 0.90 | 2 engineers (1 senior full-stack, 1 mobile) + founder for 15 mo; QA + a fractional iOS dev |
| **Infrastructure & APIs** | 10% | 0.20 | Google Maps/Places/Directions at projected scale; Firebase; Railway; Sentry; RevenueCat |
| **User acquisition** | 15% | 0.30 | Campus ambassadors, creator partnerships, PR consultant, modest Meta spend after retention validated |
| **Operations & overhead** | 10% | 0.20 | Founder stipends (₹30k/mo × 2 × 15mo baseline); legal (incorporation, DPDP compliance, ToS review); accounting |
| **Security & compliance** | 10% | 0.20 | External security audit (₹3–5L); DPDP compliance consultant; penetration test on FastAPI; cyber insurance (~₹80k/yr) |
| **Contingency** | 10% | 0.20 | Reserve — safety incidents will happen; keep cash for response |
| **Total** | 100% | **2.00** | 15-month runway |

For a ₹1.5 Cr round: cut product bucket to 1 engineer + founder, extend to 14mo; same proportions elsewhere.

---

## Milestones the money must buy

By end of 15 months, SafeRoute must have hit **at least 4 of 5**:

1. **50,000 installs**, Mumbai + 1 other city
2. **D28 retention ≥ 22%**
3. **₹25L+ ARR** (consumer + at least 1 paid B2B pilot)
4. **2 signed B2B contracts** (not LOIs)
5. **Zero shipped safety incidents** attributable to product failure

Missing more than one of these makes a Series A difficult at a useful valuation.

---

## What investors will ask (hard questions) — and honest answers

1. **"Why can't Google Maps / Ola do this tomorrow?"**
   — They can copy features; they won't build the category because safety opens liability and pedestrian routing isn't a monetisable session for them. Our moat is category focus + localised data + trust, not algorithm novelty.

2. **"How is your 'AI safety score' actually AI?"**
   — Honest answer post-fix: *"Today it is a rule-based score that uses satellite night-light data refreshed monthly, proximity to police and hospital points, and road-type features. We previously labelled it AI; we don't anymore. We'll add a learned model once we have ground-truth incident labels from our community layer, which we're seeding now."* This earns credibility. The alternative is being caught.

3. **"What's the incident data quality?"**
   — At 350 beta users: anecdotal. We complement with police-public-crime stats (Praja), satellite light, and OSM. Over months 6–12, community reports become the differentiator — this is the data flywheel.

4. **"What happens if someone uses your app, follows the 'safest' route, and something bad happens anyway?"**
   — First, product liability is an insurance line item, budgeted. Second, ToS explicitly frames the score as "informational, not a guarantee". Third, we don't claim the route is safe — we claim it has a higher safety score than alternatives. The honest framing is the defensible one.

5. **"Why Mumbai only? That caps your TAM."**
   — A deliberate choice: build one city to retention first. Expanding without ground-truth is how safety products get sued.

6. **"How do you prevent malicious reports?"**
   — Rate limits (already shipped), trust scoring (schema in place), auto-expiry with decay (shipped), moderation queue (shipping Stage A). Low-trust reports surface as "unverified" on the map, not omitted entirely.

7. **"B2B feels tacked on."**
   — It's where the P&L is. The consumer app is user-acquisition and brand. For the HR persona, Safe Walk is a cheaper, software replacement for cab reimbursement last-mile — we've verified this with 5 informal conversations and have X scheduled.

8. **"Burn rate vs unit economics?"**
   — Blended CAC target ₹40–80 for consumer (organic + ambassador-heavy in cohort 1); LTV only meaningful after 6 months of paid data. B2B CAC via founder sales ≈ 25% of first-year contract. Honest view: unit economics aren't proven. We will not spend on paid acquisition until D28 ≥ 20%.

9. **"What stops a founder-only exit? Who else is senior on the team?"**
   — Current gap. Hiring plan: 1 senior full-stack mobile lead by Month 2 of the round; 1 growth lead by Month 6. Already in conversations with [names].

10. **"What if DPDP compliance costs more than you think?"**
    — Budgeted at 10% of the round. External consultant and legal review are line items, not afterthoughts. Account-delete and data-export are shipping in Stage A.

---

## Reasons an investor will say no — and whether to respect them

| Likely objection | Valid? | How to address |
| --- | --- | --- |
| "Solo founder" | Yes | Hire a technical co-founder / first engineer before pitching |
| "Market risk — Indian women won't pay" | Partially | Lean into the B2B2P (parent-pays) and B2B framing |
| "Google Maps will crush you" | No, but perceived | Show the Maps shelved-safety-trial precedent |
| "Safety is CSR-territory, not venture" | Partially | Point to B2B ARR plan; CSR is a bonus revenue source, not the thesis |
| "You'll never get police / government API access" | Mostly yes | Design the product not to depend on it |
| "Liability is a landmine" | Yes | Insurance line item; conservative copy; legal reviewed ToS |
| "Not enough traction to price" | Yes (if raising day 0) | **Don't pitch yet. Raise after beta.** |

---

## Grants & non-dilutive to file in parallel

- **Startup India Seed Fund Scheme (SISFS)** — up to ₹50L (grant + debt mix). File through a recognised incubator (IIT-B SINE, NSRCEL, IIM-B, etc.). 4–6 month cycle.
- **MeitY TIDE 2.0** — if co-founder is early-career, incubator-adjacent.
- **Nirbhaya Fund-linked state programs** — tracked by Ministry of Women & Child Development. Slow; include in the 24-month plan, not Y1 budget.

Grants should be treated as free optionality. Do not delay the raise for them.

---

## Decision: raise now vs raise after beta

**Raise after beta.** The 90-day investment to get there is ~₹5L of your own capital or F&F. The valuation difference is 3–5×. The product will survive real investor DD. The only reason to raise now is if you literally cannot self-fund the next 90 days — in which case, raise a small F&F bridge (₹10–25L) on an uncapped SAFE, not a priced pre-seed.
