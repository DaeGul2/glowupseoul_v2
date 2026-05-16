# CLAUDE.md

> Korea Medical/Beauty Tourism Platform — Project Context for Claude Code

This document is the source of truth for the project. Claude Code should read this before generating any code, schema, or architecture decisions.

---

## 1. Project Overview

### What we're building
A platform connecting **foreign patients** with **Korean dermatology / plastic surgery clinics** for medical-beauty tourism.

### Who we are
- Early-stage startup, solo/small team
- Cannot ask partner clinics to self-update prices/inventory in our DB (no leverage yet)
- Must rely on manual curation + concierge-style operations in early phase

### Target user
**Foreign patients** traveling to Korea (or considering it) for cosmetic procedures — NOT Korean domestic users.

Primary candidate markets (to be narrowed down):
- Japanese women 30–40s (natural anti-aging, weak yen → Korea trip is a stretch but doable)
- Southeast Asia (Thailand / Vietnam / Indonesia upper-middle class)
- Middle East women (high spend, privacy-critical, female-doctor requirement, almost untapped)
- Korean diaspora 2nd gen in US (weak Korean, no trusted family network in Korea, high disposable income)

---

## 2. Why Not Just Compete with 강남언니 / 바비톡

These platforms own the **Korean domestic** market. Their multilingual versions are translation layers on top of a Korean-domestic UX, which fails foreigners because:

1. **No baseline knowledge** — foreigners can't evaluate "is this a good price?" the way Koreans can
2. **No journey support** — airport→clinic→hotel→aftercare is left to the user
3. **Reviews are Korean-perspective** — face shape, skin tone, "natural" standards differ across cultures
4. **Filters reflect Korean priorities** — "celebrity-favored", "famous in 강남" instead of "English-speaking doctor", "intl coordinator on staff"

### Our differentiation strategy
**We are not a directory or a comparison platform. We are a concierge / guided-journey service.**

| 강남언니 | Us |
|---------|-----|
| DB search + reviews | Diagnostic matching + journey handling |
| Self-service | Human-in-the-loop |
| Korean baseline | Foreigner-optimized |
| Procedure info | Procedure + stay + aftercare bundle |
| Platform fee from clinics | Clinic commission + concierge fee from patient |
| Transaction ends at booking | Follow-up D+1 / D+7 / D+30 |

### Concrete differentiators we will build
- **Trip-level packaging** — not just a procedure, but a 5–6 day Korea trip (consult → procedure → recovery → secondary procedures → departure)
- **Pre-trip multilingual video consultation** (EN / ZH / JA at minimum) — feasible at our scale, infeasible for 강남언니
- **Post-op accountability** — we follow up; if complications, we coordinate with the clinic
- **Foreigner-specific filters** — English-speaking doctor / halal-friendly area / female-only staff / trans-friendly / Korean-not-required
- **B2B angles** — partnerships with overseas beauty influencers, intl medical-tourism agencies, foreign clinics making referrals (white-label option for their sites)

---

## 3. Core Data Model

### Design principle
**Separation of concerns by question: "Is this value the same regardless of which clinic?"**
- **Yes** → goes into `procedures` (intrinsic to the procedure itself)
- **No** → goes into `hospital_procedures` (the join table; varies by hospital-procedure combo)

This keeps procedure facts (downtime, pain, mechanism) DRY across all hospitals offering it, and isolates per-hospital variance (price tier, events, packages, equipment brand) to the join.

### Schema overview

```
procedure_categories
  id, slug
  name_ko, name_en, name_zh, name_ja

procedures                      -- intrinsic to the procedure, hospital-agnostic
  id, slug, category_id
  name_ko/en/zh/ja
  description_ko/en/zh/ja

  -- Medical / physical attributes (same wherever you get it)
  mechanism            text[]    -- ['hifu','rf','laser_ablative','laser_non_ablative',
                                 --  'injection_toxin','injection_filler','injection_skin',
                                 --  'thread','peel','surgery','extraction','topical']
  pain_level           smallint  -- 1..5
  intensity            text      -- 'subtle' | 'moderate' | 'dramatic'
  downtime_days        smallint
  result_onset         text      -- 'immediate' | 'gradual'
  result_duration      text      -- 'temporary' | 'months' | 'years' | 'permanent'
  typical_sessions     smallint

  -- Korean market reference price (for filtering / sanity-check; NOT per-hospital)
  market_price_min     integer   -- KRW
  market_price_max     integer
  price_unit           text      -- '회당' | '100샷당' | 'cc당' | 'session' | 'shot_unit' | 'cc'

  -- Unit system (handles the 100/200/300-shot vs 300/400-shot variance)
  unit_type            text      -- 'shots' | 'cc' | 'sessions' | 'area' | 'flat'
  common_units         integer[] -- [100, 200, 300, 400, 500] -- the market-wide pool

mechanisms                      -- lookup table for mechanism enum (multilingual labels)
  slug                          -- 'hifu', 'rf', etc.
  label_ko, label_en, label_zh, label_ja
  description_ko/en/zh/ja

concerns                        -- user-facing concerns (their language, not medical)
  id, slug
  name_ko/en/zh/ja
  description_ko/en/zh/ja
  body_area            text     -- 'face' | 'body' | 'skin' | 'hair' (for grouping in UI)

concern_procedures              -- the matching matrix (hand-curated; quality of the
                                --  whole system depends on this table being accurate)
  concern_id, procedure_id
  relevance            text     -- 'primary' | 'secondary' | 'adjunct'
  rationale_ko/en/zh/ja text    -- "why this procedure helps this concern"

hospitals
  id
  name_ko/en/zh/ja
  district, lat, lng, full_address_ko/en
  phone, kakao_id, line_id, whatsapp

  -- Foreign-patient-specific fields (this is where we differentiate)
  languages_supported           text[]   -- ['en','zh','ja','ar',...]
  has_interpreter               bool
  has_dedicated_intl_coordinator bool
  english_doctor_available      bool
  female_doctor_available       bool     -- critical for ME market
  accepts_foreign_card          bool
  airport_pickup                bool
  private_room_available        bool
  halal_food_nearby             bool
  foreign_patient_count_per_month integer
  avg_consultation_duration_min smallint
  recovery_care_partnership     bool     -- partnered recovery hotels/centers
  post_op_followup_protocol     bool     -- has a structured aftercare protocol

hospital_procedures             -- per-hospital, per-procedure variance lives here
  hospital_id, procedure_id
  offered                       bool

  -- Pricing (hospital-specific)
  price_tier                    text     -- '$' | '$$' | '$$$' (relative to market_price)
  starting_price                integer  -- optional; "starts from"
  pricing_notes                 text     -- free text: "100/200/300샷 옵션", etc.
  available_units               integer[] -- subset of procedures.common_units

  -- Events (hospital-specific, manually toggled)
  has_active_event              bool
  event_notes                   text

  -- Packages
  package_notes                 text     -- "울세라+슈링크 콤보 가능"

  -- Hospital-specific quality signals
  doctor_specialty              text     -- doctor known for this procedure
  machine_brand                 text     -- "Ulthera SPT" vs generic HIFU — matters for foreigners
  years_offering                smallint

match_requests                  -- user input for matching
  id, user_id, created_at
  concern_ids                   int[]
  budget_min, budget_max        integer  -- KRW (auto-converted from USD/JPY/etc)
  pain_tolerance                smallint -- 1..5
  intensity_pref                text     -- 'subtle' | 'moderate' | 'dramatic' | 'any'
  max_downtime_days             smallint
  preferred_languages           text[]
  district_pref                 text
  trip_dates                    daterange
  prior_procedures              jsonb    -- ["ulthera 3mo ago"] for conflict checks

inquiries                       -- match → specific quote request to a hospital
  id, match_request_id
  hospital_id, procedure_id
  user_id
  status                        -- 'sent' | 'quoted' | 'declined' | 'booked'
  created_at

quotes                          -- our reply to user, after we ask the hospital
  id, inquiry_id
  hospital_response_ko          -- raw hospital reply (Korean)
  our_translation               -- translated/summarized for the user
  quoted_price                  integer
  valid_until                   date
  attachments                   jsonb

trips                           -- the journey package (differentiator)
  id, user_id
  arrival_date, departure_date
  status                        -- 'planning' | 'booked' | 'in_progress' | 'completed'
  procedures                    jsonb    -- ordered list w/ scheduled dates
  accommodation                 jsonb
  interpreter_assigned          uuid
  airport_pickup_scheduled      bool
  emergency_contact             text

consultations                   -- pre/in/post-trip 1:1 sessions
  id, user_id, trip_id
  scheduled_at, language
  phase                         -- 'pre_trip' | 'in_trip' | 'post_trip'
  consultant_id
  notes, recommendations

post_op_checkins                -- aftercare tracking (differentiator)
  id, trip_id
  day_offset                    -- D+1, D+7, D+30, D+90
  user_response                 jsonb
  photos                        text[]
  flagged_for_review            bool     -- complication suspected
  resolved_by, resolution_notes
```

### Mechanism enum reference

```
'hifu'                ulthera, shurink, thermage-FLX (focused ultrasound)
'rf'                  thermage, inmode, oligio (radiofrequency)
'laser_ablative'      fraxel, CO2 (resurfacing — peels skin)
'laser_non_ablative'  laser toning, IPL, hair removal lasers
'injection_toxin'     botox, dysport
'injection_filler'    HA fillers, collagen boosters
'injection_skin'      skin booster, rejuran, "water shine" injection
'thread'              thread lifting (PDO/PLA threads)
'peel'                chemical peels (TCA, glycolic)
'surgery'             facelift, double jaw, rhinoplasty, blepharoplasty
'extraction'          comedone extraction, pore care
'topical'             LED, in-clinic facial care
```

Stored as `text[]` because some procedures combine mechanisms (e.g. InMode = `['rf','em']`).

---

## 4. Matching Algorithm (pseudocode)

```python
def match(req: MatchRequest) -> list[Match]:
    # Step 1: concerns -> candidate procedures
    candidate_procs = (
        concern_procedures
          .where(concern_id IN req.concern_ids)
          .where(relevance IN ('primary', 'secondary'))
    )

    # Step 2: filter by INTRINSIC procedure attributes (hospital-agnostic)
    procs = procedures.where(
        id IN candidate_procs,
        pain_level <= req.pain_tolerance,
        downtime_days <= req.max_downtime_days,
        (intensity == req.intensity_pref OR req.intensity_pref == 'any'),
        market_price_min <= req.budget_max,
    )

    # Step 3: conflict check — same mechanism received recently
    procs = exclude_mechanism_conflicts(procs, req.prior_procedures)

    # Step 4: hospital-level filter
    results = (
        hospital_procedures.join(hospitals)
          .where(
              procedure_id IN procs,
              offered == True,
              languages_supported && req.preferred_languages,  # array overlap
              price_tier compatible with req.budget,
          )
    )

    # Step 5: scoring
    for r in results:
        score = 0
        if r.relevance == 'primary':                  score += 3
        if r.relevance == 'secondary':                score += 1
        if req.preferred_languages ⊆ r.languages_supported: score += 2
        if r.has_dedicated_intl_coordinator:          score += 2
        if r.has_interpreter:                         score += 1
        if r.district == req.district_pref:           score += 2
        if r.has_active_event:                        score += 1
        if r.pain_level << req.pain_tolerance:        score += 1  # comfort margin

    # Step 6: group by mechanism for UI ("pick one of these")
    grouped = group_by_mechanism(results)

    return sort_by_score(grouped)
```

### Why mechanism grouping matters in the result UI
A user with "wrinkles" concern matches Ulthera, Shurink, Thermage — but these are all `hifu`/`rf` thermal-energy procedures and the user picks **one**, not all. Show:

```
HIFU-class (pick one):       Ulthera • Shurink • Thermage FLX
RF-class (pick one):         Thermage • InMode • Oligio
Injectable (combinable):     Botox • Filler
```

This single decision turns "5 confusing Korean brand names" into "I understand what's happening."

---

## 5. UX Principles for Foreigner-Facing Inputs

### Budget — never ask for a Korean Won number
Foreigners don't know KRW baseline. Use tiers, internally convert:
```
Under $300  /  $300–800  /  $800–2000  /  $2000–5000  /  $5000+  /  Flexible
```

### Concerns — chips, not free text
Multi-select chips grouped by `body_area`. 20–30 concerns total.

### Intensity — visual descriptions
```
Subtle    "I want to look refreshed, no one notices"
Moderate  "Visible improvement, still natural"
Dramatic  "Clear transformation"
```

### Pain tolerance — not a 1–5 slider
```
Low       "Numbing cream is my limit"
Medium    "I can handle some discomfort"
High      "Pain doesn't bother me much"
```

### Mechanism is INTERNAL
Never show "HIFU" raw to a non-medical user. Always show via the `mechanisms` lookup labels in their language. Use mechanism for grouping logic only.

---

## 6. Phased Rollout

### Phase 1 (MVP — current focus)
- Procedure catalog (multilingual + categorized + mechanism-tagged)
- Hospital ↔ procedure mapping — **no exact prices**, only `price_tier`
- Concerns matrix hand-curated (~20–30 concerns × 50–80 procedures)
- "Inquire / Get a quote" button → routes to us (manual concierge in the loop)
- Pre-trip video consultation feature (Calendly + Zoom is fine, no need to build)
- Multilingual UI: EN, JA, ZH (KO admin-only initially)

### Phase 2 (after some volume)
- "Starting from" prices for clinics that opt in
- Multilingual reviews + before/after photos (with consent)
- Trip packaging UI (procedures + accommodation + interpreter)
- Post-op check-in flow (D+1 / D+7 / D+30)

### Phase 3 (clinics depend on us for foreign traffic)
- Clinic admin panel — clinics self-update prices, events, schedules
- Automated quote engine
- B2B partner integrations (white-label for overseas agencies/influencers)

### Why this order
Once we send actual patients, clinics will *ask* to update prices themselves. That's the natural moment to build self-service. Building it first = empty admin panel + no leverage.

---

## 7. Seed Data Plan

The system's quality is **100% determined by the `concern_procedures` matrix accuracy**. Do not auto-generate this.

Approximate scope:
- `procedure_categories`: ~10
- `concerns`: 20–30
- `procedures`: 50–80 (Korea-popular ones)
- `concern_procedures`: 200–400 mappings
- `hospitals`: starts at ~10–20 (curated partners)
- `hospital_procedures`: 500–1500 rows after expansion

### Workflow
1. Build a spreadsheet matrix: rows = concerns, columns = procedures, cells = primary/secondary/adjunct/blank.
2. Fill `procedures` intrinsic attrs (mechanism, pain_level, downtime, market_price_min/max) in a separate sheet — reference 강남언니 / 바비톡 average prices for `market_price_min/max`.
3. Convert sheets → INSERT statements / seed scripts.
4. Translation passes for KO/EN/ZH/JA on `name_*` and `description_*` fields.

### Non-negotiables for seed data
- Every `procedure` must have at least one `mechanism`
- Every `procedure` must appear in at least one `concern_procedures` row (otherwise it's unmatchable)
- `pain_level` and `downtime_days` must be sanity-checked against `mechanism` (e.g. `surgery` shouldn't have downtime 0)

---

## 8. Operational Notes

### Pricing — handle by avoidance, not normalization
The original instinct to "normalize all prices into a single comparable unit" is a rathole. Instead:
- `procedures.market_price_min/max` for *filtering* by budget
- `hospital_procedures.price_tier` ($, $$, $$$) for *display*
- `hospital_procedures.pricing_notes` (free text) for the messy reality ("100/200/300샷 옵션", "package available", etc.)
- Exact prices come back through the `inquiries → quotes` flow when a user actually wants one

### Events — do not display in catalog
Events change too fast for us to track. `has_active_event` boolean is enough to *signal* there's something going on; details come through the inquiry flow.

### Packages — free text in MVP
`hospital_procedures.package_notes`. A dedicated `packages` table can come later when patterns emerge.

### Equipment authenticity
`hospital_procedures.machine_brand` is a real differentiator for foreigners — genuine Ulthera vs. generic HIFU device matters and is a growing concern in the foreign-patient segment. Don't bury this.

---

## 9. Tech Stack Notes (decisions to be made)

To be confirmed during Claude Code session — preliminary thinking only:

- **Database**: Postgres (array types, jsonb, daterange, text[] for mechanisms — all native)
- **Backend**: TBD — likely something I (Min) already know well
- **i18n**: KO / EN / JA / ZH minimum. Likely add AR (Arabic, RTL) later if ME market is targeted
- **Multilingual content**: per-locale columns (`name_ko`, `name_en`, ...) for static fields; consider a translations table only if locales explode
- **Currency**: store all internal money as KRW (integer); FX-convert on display
- **Auth**: social login (Google + LINE for JP + Kakao for KR-diaspora + WeChat for CN)

---

## 10. Open Questions

These need answers before / during the next session:

1. **Primary target market** — pick ONE for v1 launch. Drives language priority, payment methods, marketing channels.
2. **Initial hospital partner count** — how many do we have signed? Drives whether to seed with placeholder data or real data.
3. **Concierge capacity** — how many simultaneous patient journeys can Min realistically handle solo? Drives whether Phase 1 needs any automation or stays fully manual.
4. **Naming / brand** — is there a name already?
5. **Domain**, hosting, infra — anything already set up?

---

## 11. What Claude Code Should Default To

When generating code for this project:

- **Prefer Postgres-native types** (text[], jsonb, daterange) over normalized side-tables when the data is naturally a list and rarely queried inside-out
- **Multilingual fields = inline columns** (`name_ko`, `name_en`, ...) until we exceed ~5 locales
- **All money in KRW (integer)**, no floats, FX conversion at the edge
- **Slug-based identifiers** for procedures, concerns, mechanisms (stable, human-readable in URLs)
- **Soft-delete** on hospitals/procedures (we lose data otherwise when partnerships end)
- **Audit columns** (`created_at`, `updated_at`, `created_by`) on every business table
- **Don't auto-generate the concern_procedures matrix** — it must be human-curated
- **Don't build a clinic-facing admin panel in Phase 1** — Min curates everything manually

---

*Last updated: 2026-05-11. Update this file as decisions get made.*
