# SafeRoute — Product & Market Opportunity Assessment

## Reality check against the implementation

Before any market claim, three product facts from the audit must be internalised:

1. **Geography is Mumbai-only today.** The road graph is bounded by `MUMBAI_BBOX`. Any TAM/SAM calculation must start with Mumbai, not India.
2. **"AI safety score" is realistically a rule-based lighting-weighted score.** The XGBoost model has target leakage; the honest differentiator is **VIIRS satellite night-lights refreshed monthly** plus proximity to police/hospitals. That's still a real edge over Google Maps, but it is not "AI".
3. **"Community-powered" is aspirational.** The pipeline works; the dataset has 1 report.

Positioning must match these. Overclaiming kills investor trust.

---

## Market context (India)

Sources below; treat numbers as order-of-magnitude, not forecasts. Verify with primary interviews.

- **Urban Indian smartphone users: ~650M+** (TRAI, IAMAI 2024). Mumbai Metropolitan Region alone ~22M, of whom ~15M+ are smartphone-active.
- **Women's mobility gap.** NFHS-5 (2019–21) and multiple IWWAGE/ILO studies: 36–50% of urban Indian women say they restrict movement after dark due to safety concerns. This is the strongest, most-cited behavioural signal in the sector.
- **Night-shift workforce** (BPO, hospitals, delivery, aviation, hospitality): ~3–5M in top metros (NASSCOM, industry estimates). Employer-paid cab policies are standard in large IT/ITES; smaller employers do not have one.
- **Student population in Mumbai**: ~1M+ in higher ed (AISHE 2021–22). Hostel + night-library use cases are concrete.
- **Government has never built a navigation layer.** 112 India app exists but is a help-request channel, not a planner. 181 women's helpline is state-level, low penetration. Himmat (Delhi Police) and Mumbai Police "Nirbhaya" app are emergency-focused, not routing. **Gap is real.**

### Existing products — honest competitor read

| Player | What they do | Overlap with SafeRoute | Can they copy it? |
| --- | --- | --- | --- |
| **Google Maps** | Fastest route, traffic, transit | 0% on safety scoring; some "lit streets" trial in 2022 shelved | Yes, instantly, if they want. They don't — safety opens liability. |
| **Ola / Uber / Rapido** | Ride-hailing with in-trip SOS, trip sharing, "share ETA" | SOS and trip-sharing overlap; routing is driver's, not user's | Partially — they only act once you're in their vehicle. They won't build a general-purpose walking/pre-trip planner. |
| **bSafe, Noonlight, Life360** | Guardian tracking, SOS | Guardian + SOS overlap | Life360 strong internationally, weak in India; pricing ($15/mo) wrong for India. |
| **Himmat / Mumbai Police** | Emergency button → control room | Emergency-only | Cannot build routing. |
| **112 India** | Unified emergency dispatch | SOS only | Government — slow, no product loop. |
| **Chalo, Moovit** | Transit | No safety | Low probability. |

**The clear white space:** a **planner + guardian + emergency stack**, built for pedestrians and transit-first commuters, priced for India, with a transparent rule-based safety signal. Nobody in India covers all three in one product.

---

## Target segment analysis — rank-ordered for SafeRoute's first 12 months

### 1. Women college students, 18–24, in Mumbai (recommended beachhead)

- **Why first:** highest intensity of the "after-dark problem" (NFHS-5), geographically concentrated (campuses), trust-network viral (dorms, WhatsApp groups), low income so **free tier matters** but **parents pay** for premium Safe Walk / Guardian features.
- **Go-to-market:** campus ambassadors, hostel wardens, college women's cell partnerships, Insta/Reel content. Cost to test: ₹50k–₹1L for a 2-college pilot.
- **Willingness to pay:** low for themselves (₹0–99/mo), **moderate from parents** (₹199–299/mo for family plan).
- **Risk:** safety scores must be ground-truthed in the actual campus vicinity before any marketing claim.

### 2. Night-shift commuters (BPO, hospital, aviation, delivery)

- **Why:** concrete pain, defined route (home→office), employer sometimes reimburses.
- **B2B path:** sell to the employer as an employee-safety add-on (see Business Model doc).
- **Risk:** this is the segment where Ola/Uber already have policy contracts; SafeRoute is complementary (last-mile from drop point to home), not a replacement.

### 3. Delivery / gig workers (Swiggy, Zomato, Zepto riders)

- **Why:** >1M in metros; hostile stretches at night; some platforms are already liable.
- **B2B path:** platform partnership. Hard to close as a founder with no prior B2B relationships; put on "after traction" list.

### 4. Working professional women, 24–35

- **Why:** disposable income, safety concern on late-office days.
- **Risk:** lower-intensity problem than students; higher CAC; harder cold-start.

### 5. Parents using it for themselves + elders

- Life360-style family use case. Useful but not a beachhead.

### Do NOT build for first:

- Men 18–35: 10× lower intensity on the core problem; they'll install if friends/partners insist but won't pay.
- Tier-2/3 cities: graph data and local trust networks aren't there yet.
- Tourists: episodic use, no habit formation.

---

## Answers to the six strategic questions

**Q1. Why would someone use SafeRoute instead of Google Maps?**
Because Google Maps only asks "how do I get there fastest?"; SafeRoute asks "how do I get there safely?" and surfaces the trade-off. Added layer: Safe Walk / guardian share / SOS, which Google Maps doesn't do at all. Honest limit: in Mumbai only, today.

**Q2. Why wouldn't Ola/Uber just build this?**
Two structural reasons:
- They only operate inside their vehicles — once you're walking, you're not a monetisable session for them. Safety routing for pedestrians is cost-centre, not revenue.
- Shipping a "safety score" opens liability they actively avoid. Google shelved its 2022 "lighter streets" trial for the same reason.

They can copy specific features (trip-share, SOS). They won't build the planner.

**Q3. Defensible competitive advantage?**
Not a single moat — a layered one:
- **Data asset**: VIIRS monthly lighting + police/hospital geodata + community reports, specific to Indian metros. Google won't localise this. Rebuilding it takes 6–12 months.
- **Trust & brand**: a safety product's brand is its moat. Life360 is not technically hard; it's trusted. SafeRoute must earn that in Mumbai first.
- **Vertical focus**: pedestrians + transit + two-wheeler, not cars. Maps players neglect these in India.
- **Regulatory alignment**: potential eventual MoU with state police / college ecosystems — slow but durable once won.

**Q4. How to stay accurate without a large user base?**
- **Satellite + static feeds do most of the work.** VIIRS lighting (monthly), police/hospital locations, road-type from OSM, time-of-day priors. Score is useful at install without community volume.
- **Expert seeding**: before launch, have a small team walk the top 200 Mumbai routes and hand-annotate. 200 is feasible in 2 weeks.
- **Trust-weighted reports**: already architected (`trustScore` on users). Give weight to trusted reporters; auto-expire old reports.

**Q5. Preventing outdated / malicious reports?**
- Rate limits (already 5/hr), dedup (already 1 h same geohash+category), author-private storage (already).
- Add: auto-expiry (hazard decay already exists in `routing/dynamic_risk.py`), moderation UI (missing), trust score penalty for rejected reports (schema supports it, logic missing).
- Display pending vs verified vs expired distinctly on the map — currently all pins look equal.

**Q6. Strongest initial target market?**
**Women college students in Mumbai**, with **parents as the paying customer** for premium plans. See ranking above.

---

## What is validated vs assumed

**Validated (from secondary sources):**
- Behavioural evidence: Indian women restrict post-dark movement.
- No incumbent in India combines planner + guardian + SOS.
- Lighting correlates with perceived safety (Harvard/UChicago street-lighting-crime studies).

**Still assumptions, to test in beta:**
- Users will actually prefer a "safer" route when it takes 8–15 minutes longer.
- Parents will pay for a student's family plan.
- Campus channels will generate organic virality (ambassador programs often disappoint).
- The safety score matches lived experience in Mumbai micro-neighbourhoods (ground-truth before claiming accuracy).
- Night-shift employers will pay for employee safety software vs. just reimbursing cabs.

Running the Mumbai closed beta (see Roadmap doc) is explicitly a tool to turn these assumptions into evidence.

---

## Barriers to adoption

- **Trust at first use**: a safety product has to work the first time or users uninstall. The `122`-vs-`112` bug is a brand-killer if it ships.
- **Battery**: background location is a real cost. Measure and publish in the app's onboarding.
- **Behavioural change**: route choice is habitual. The "balanced" route needs to be the default once scores are trustworthy.
- **Low data literacy on scores**: "What does 72/100 mean?" — the app already has explanation text; harden it.
- **Guardian friction**: inviting family members requires them to install. Keep guardian sign-up to under 60 seconds.
