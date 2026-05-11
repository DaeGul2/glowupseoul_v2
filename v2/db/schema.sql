-- =====================================================================
-- v2 Korea Medical Tourism Platform — Postgres DDL
-- Target: Foreign patients (CN 80% / EN 20%) ↔ Korean derm/surgery/dental
-- See: ../README.md , ../docs/research-findings.md , ../../CLAUDE (3).md
--
-- Design axis (claude(3).md §3):
--   intrinsic to procedure (same across hospitals) → `procedures`
--   varies per hospital                           → `hospital_procedures`
--
-- All money in KRW (integer). FX conversion at the display edge only.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- text search on names

-- ---------------------------------------------------------------------
-- 1. Lookup: mechanisms (multilingual labels)
-- ---------------------------------------------------------------------
CREATE TABLE mechanisms (
  slug                TEXT PRIMARY KEY,            -- 'hifu','rf','stem_cell',...
  label_ko            TEXT NOT NULL,
  label_en            TEXT NOT NULL,
  label_zh            TEXT,
  label_ja            TEXT,
  description_ko      TEXT,
  description_en      TEXT,
  description_zh      TEXT,
  description_ja      TEXT,
  domain              TEXT NOT NULL CHECK (domain IN (
                        'face_aesthetic',
                        'body_contouring',
                        'regenerative',
                        'surgical',
                        'derm_medical',
                        'dental'
                      )),
  display_order       SMALLINT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2. procedure_categories — top-level UI grouping
-- ---------------------------------------------------------------------
CREATE TABLE procedure_categories (
  id                  SERIAL PRIMARY KEY,
  slug                TEXT UNIQUE NOT NULL,
  name_ko             TEXT NOT NULL,
  name_en             TEXT NOT NULL,
  name_zh             TEXT,
  name_ja             TEXT,
  domain              TEXT NOT NULL CHECK (domain IN (
                        'face_aesthetic','body_contouring','regenerative',
                        'surgical','derm_medical','dental'
                      )),
  parent_id           INTEGER REFERENCES procedure_categories(id) ON DELETE SET NULL,
  display_order       SMALLINT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 3. procedures — intrinsic, hospital-agnostic
-- ---------------------------------------------------------------------
CREATE TABLE procedures (
  id                  SERIAL PRIMARY KEY,
  slug                TEXT UNIQUE NOT NULL,
  category_id         INTEGER REFERENCES procedure_categories(id) ON DELETE SET NULL,

  -- Multilingual
  name_ko             TEXT NOT NULL,
  name_en             TEXT,
  name_zh             TEXT,
  name_ja             TEXT,
  description_ko      TEXT,
  description_en      TEXT,
  description_zh      TEXT,
  description_ja      TEXT,

  -- Classification (mechanism is array → combinations like InMode RF+EM)
  mechanism           TEXT[] NOT NULL,
  domain              TEXT NOT NULL CHECK (domain IN (
                        'face_aesthetic','body_contouring','regenerative',
                        'surgical','derm_medical','dental'
                      )),
  body_area           TEXT[] NOT NULL,        -- ['face','neck','breast','body','buttocks','hair','dental','skin','eye','nose','lip']

  -- Intrinsic medical attributes
  pain_level          SMALLINT CHECK (pain_level BETWEEN 1 AND 5),
  intensity           TEXT CHECK (intensity IN ('subtle','moderate','dramatic')),
  downtime_days       SMALLINT,
  result_onset        TEXT CHECK (result_onset IN ('immediate','gradual')),
  result_duration     TEXT CHECK (result_duration IN ('temporary','months','years','permanent')),
  typical_sessions    SMALLINT,

  -- Surgery-specific (NULL when non-surgical)
  is_surgical         BOOLEAN NOT NULL DEFAULT FALSE,
  anesthesia_typical  TEXT CHECK (anesthesia_typical IN ('topical','local','sedation','general','none')),
  op_duration_hours   NUMERIC(3,1),
  hospitalization_days SMALLINT,
  stitch_removal_days SMALLINT,
  swelling_peak_days  SMALLINT,
  final_result_weeks  SMALLINT,
  revision_eligible   BOOLEAN,

  -- Korean market reference price (filter only; NOT for per-hospital display)
  market_price_min    INTEGER,                -- KRW
  market_price_max    INTEGER,
  price_unit          TEXT,                   -- '회당'|'session'|'100샷'|'cc'|'flat'
  unit_type           TEXT CHECK (unit_type IN ('shots','cc','sessions','area','flat')),
  common_units        INTEGER[],

  -- Reference device examples (informational)
  -- e.g., hifu_face → ['Ulthera SPT','Ulthera Prime','Shurink','Liftera']
  device_examples     TEXT[],

  -- Visual assets (generic, hospital-agnostic — for category page treatment cards)
  thumbnail_url       TEXT,        -- 256~512px, category grid card
  hero_image_url      TEXT,        -- 1280px+, treatment detail page hero
  illustration_url    TEXT,        -- optional medical diagram / mechanism illustration

  -- Cross-cutting search tags
  tags                TEXT[],

  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_procedures_domain      ON procedures (domain);
CREATE INDEX idx_procedures_mechanism   ON procedures USING GIN (mechanism);
CREATE INDEX idx_procedures_body_area   ON procedures USING GIN (body_area);
CREATE INDEX idx_procedures_tags        ON procedures USING GIN (tags);

-- ---------------------------------------------------------------------
-- 4. concerns — user-facing language (their problem, not medical term)
-- ---------------------------------------------------------------------
CREATE TABLE concerns (
  id                  SERIAL PRIMARY KEY,
  slug                TEXT UNIQUE NOT NULL,
  name_ko             TEXT NOT NULL,
  name_en             TEXT NOT NULL,
  name_zh             TEXT,
  name_ja             TEXT,
  description_ko      TEXT,
  description_en      TEXT,
  description_zh      TEXT,
  description_ja      TEXT,
  body_area           TEXT NOT NULL,           -- 'face','body','skin','hair','dental'
  display_order       SMALLINT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 5. concern_procedures — matching matrix (HAND-CURATED)
-- claude(3).md §11: NEVER auto-generate. Quality of platform = quality of this table.
-- ---------------------------------------------------------------------
CREATE TABLE concern_procedures (
  concern_id          INTEGER NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
  procedure_id        INTEGER NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  relevance           TEXT NOT NULL CHECK (relevance IN ('primary','secondary','adjunct')),
  rationale_ko        TEXT,
  rationale_en        TEXT,
  rationale_zh        TEXT,
  rationale_ja        TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (concern_id, procedure_id)
);

-- ---------------------------------------------------------------------
-- 6. brands — parent of hospitals (chain support: 리엔장 6지점)
-- ---------------------------------------------------------------------
CREATE TABLE brands (
  id                  SERIAL PRIMARY KEY,
  slug                TEXT UNIQUE NOT NULL,
  name_ko             TEXT NOT NULL,
  name_en             TEXT,
  name_zh             TEXT,
  name_ja             TEXT,
  founding_doctor     TEXT,                    -- e.g., '최우식' (Noselips), '닥터쿱스' (그림)
  -- niche=specialist (cleft/nose/derma), device_led=brand-machine-signature, general=mixed
  specialization_depth TEXT CHECK (specialization_depth IN ('niche','device_led','general')),
  is_chain            BOOLEAN NOT NULL DEFAULT FALSE,
  website_url         TEXT,

  -- Visual assets (brand-level, shared across branches)
  logo_url            TEXT,                    -- transparent PNG/SVG, header/footer
  brand_hero_url      TEXT,                    -- optional brand-level cover

  description_ko      TEXT,
  description_en      TEXT,
  description_zh      TEXT,
  description_ja      TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 7. hospitals — physical branch (1 row per location)
-- ---------------------------------------------------------------------
CREATE TABLE hospitals (
  id                  SERIAL PRIMARY KEY,
  slug                TEXT UNIQUE NOT NULL,
  brand_id            INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  branch_name         TEXT,                    -- '강남점','명동점' (NULL if single-location brand)

  -- Display name (often same as brand.name, but override allowed)
  name_ko             TEXT NOT NULL,
  name_en             TEXT,
  name_zh             TEXT,
  name_ja             TEXT,

  -- Geo (3-tier — generalized for non-Seoul: 부산 센텀코어 etc.)
  country             TEXT NOT NULL DEFAULT 'KR',
  city                TEXT NOT NULL,           -- '서울','부산'
  district            TEXT NOT NULL,           -- '강남구','해운대구'
  neighborhood        TEXT,                    -- '청담동','마린시티'
  full_address_ko     TEXT,
  full_address_en     TEXT,
  lat                 NUMERIC(10,8),
  lng                 NUMERIC(11,8),

  -- Contact channels
  phone               TEXT,
  email               TEXT,
  kakao_id            TEXT,
  wechat_id           TEXT,
  whatsapp            TEXT,
  line_id             TEXT,
  website_url         TEXT,

  -- Languages (codes: 'ko','en','zh','ja','ru','vi','id','th','ar','mn')
  languages_supported TEXT[] NOT NULL DEFAULT ARRAY['ko'],

  -- Foreign-patient capabilities
  has_intl_coordinator    BOOLEAN NOT NULL DEFAULT FALSE,
  has_interpreter         BOOLEAN NOT NULL DEFAULT FALSE,
  interpreter_languages   TEXT[],
  english_doctor          BOOLEAN NOT NULL DEFAULT FALSE,
  female_doctor_available BOOLEAN NOT NULL DEFAULT FALSE,
  accepts_foreign_card    BOOLEAN NOT NULL DEFAULT FALSE,
  airport_pickup          BOOLEAN NOT NULL DEFAULT FALSE,
  recovery_lodging_partner BOOLEAN NOT NULL DEFAULT FALSE,
  halal_friendly          BOOLEAN NOT NULL DEFAULT FALSE,
  private_room_available  BOOLEAN NOT NULL DEFAULT FALSE,
  anesthesiologist_onsite BOOLEAN NOT NULL DEFAULT FALSE,

  -- Trust signals (foreigner decision-making)
  ba_gallery_url            TEXT,
  ba_photo_count            INTEGER,
  doctor_profile_url        TEXT,
  safety_claim              TEXT,                  -- "50개국 4만명 0사고" 등 자체 클레임
  foreign_case_volume_monthly INTEGER,
  established_year          SMALLINT,
  external_review_links     JSONB,                 -- { "unni": "...", "pickabeau": "..." }

  -- Visual assets (branch-level — used on hospital cards / detail page)
  thumbnail_url             TEXT,                  -- 4:3 or 1:1, 512~768px — category/comparison cards
  hero_image_url            TEXT,                  -- 16:9, 1600px+ — hospital detail page hero
  gallery_urls              TEXT[],                -- 시설 사진, 대기실, 진료실, 의사 단체샷 등
  thumbnail_alt_ko          TEXT,
  thumbnail_alt_en          TEXT,

  -- Operational
  contract_status     TEXT NOT NULL DEFAULT 'pending' CHECK (
                        contract_status IN ('active','pending','negotiating','declined','paused')
                      ),
  commission_pct      NUMERIC(5,2),
  notes               TEXT,

  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hospitals_brand        ON hospitals (brand_id);
CREATE INDEX idx_hospitals_city         ON hospitals (city);
CREATE INDEX idx_hospitals_district     ON hospitals (district);
CREATE INDEX idx_hospitals_languages    ON hospitals USING GIN (languages_supported);
CREATE INDEX idx_hospitals_contract     ON hospitals (contract_status);

-- ---------------------------------------------------------------------
-- 8. hospital_procedures — per-hospital variance (price / device / event / package)
-- ---------------------------------------------------------------------
CREATE TABLE hospital_procedures (
  id                  SERIAL PRIMARY KEY,
  hospital_id         INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  procedure_id        INTEGER NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  offered             BOOLEAN NOT NULL DEFAULT TRUE,

  -- Hospital-specific local name (e.g., 리엔장 "리엔셀 피부주사", 소이 "직각어깨 필러")
  local_name_ko       TEXT,
  local_name_en       TEXT,
  local_name_zh       TEXT,
  local_name_ja       TEXT,

  -- Pricing (per claude(3).md §8 — avoidance, not normalization)
  price_tier          TEXT CHECK (price_tier IN ('$','$$','$$$','$$$$')),
  price_disclosed     BOOLEAN NOT NULL DEFAULT FALSE,
  starting_price_krw  INTEGER,
  pricing_notes       TEXT,                    -- "100/200/300샷 옵션"
  available_units     INTEGER[],

  -- Events (manually toggled; don't try to scrape regularly)
  has_active_event    BOOLEAN NOT NULL DEFAULT FALSE,
  event_notes         TEXT,
  event_until         DATE,

  -- Packages (MVP: free text. Phase 2 → procedure_bundles table)
  package_notes       TEXT,

  -- Hospital-specific quality signals
  device_brands       TEXT[],                  -- ['Ulthera Prime','Thermage FLX']
  doctor_specialty    TEXT,                    -- "구순구개열 30년" / "쌍커풀"
  years_offering      SMALLINT,
  is_signature        BOOLEAN NOT NULL DEFAULT FALSE,  -- 병원 시그너처로 미는지

  -- Override visual assets when this hospital has a custom shot for the procedure
  -- (rare; falls back to procedures.thumbnail_url / hero_image_url)
  thumbnail_url       TEXT,
  hero_image_url      TEXT,

  source_url          TEXT,                    -- 데이터 출처 (병원 홈페이지 menu URL)
  notes               TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (hospital_id, procedure_id)
);

CREATE INDEX idx_hp_hospital            ON hospital_procedures (hospital_id);
CREATE INDEX idx_hp_procedure           ON hospital_procedures (procedure_id);
CREATE INDEX idx_hp_signature           ON hospital_procedures (is_signature) WHERE is_signature;
CREATE INDEX idx_hp_event               ON hospital_procedures (has_active_event) WHERE has_active_event;

-- ---------------------------------------------------------------------
-- 9. users (patients)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT UNIQUE,
  phone               TEXT,
  full_name           TEXT,
  display_name        TEXT,
  preferred_language  TEXT NOT NULL DEFAULT 'en',  -- 'ko','en','zh','ja',...
  country_code        TEXT,                         -- 'CN','US','JP','VN',...

  -- Identity / contact
  wechat_id           TEXT,
  whatsapp            TEXT,
  line_id             TEXT,
  kakao_id            TEXT,

  -- Auth
  auth_provider       TEXT,                          -- 'google','line','wechat','kakao','email'
  auth_provider_uid   TEXT,
  password_hash       TEXT,                          -- email signup only
  email_verified_at   TIMESTAMPTZ,

  -- Marketing / acquisition
  acquisition_channel TEXT,                          -- 'wechat_ad','xhs','tiktok','organic','referral'
  acquisition_meta    JSONB,

  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email            ON users (email);
CREATE INDEX idx_users_language         ON users (preferred_language);
CREATE INDEX idx_users_country          ON users (country_code);

-- ---------------------------------------------------------------------
-- 10. match_requests — user input snapshot for matching
-- ---------------------------------------------------------------------
CREATE TABLE match_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  session_token       TEXT,                          -- pre-login matching session

  concern_ids         INTEGER[] NOT NULL,
  -- Budget tier (foreigner UX — never raw KRW from user; converted internally)
  budget_tier         TEXT CHECK (budget_tier IN (
                        'under_300','300_800','800_2000','2000_5000','over_5000','flexible'
                      )),
  budget_min_krw      INTEGER,
  budget_max_krw      INTEGER,

  pain_tolerance      TEXT CHECK (pain_tolerance IN ('low','medium','high')),
  intensity_pref      TEXT CHECK (intensity_pref IN ('subtle','moderate','dramatic','any')),
  max_downtime_days   SMALLINT,
  preferred_languages TEXT[],
  district_pref       TEXT,
  city_pref           TEXT,
  trip_start          DATE,
  trip_end            DATE,
  prior_procedures    JSONB,                         -- [{ procedure: 'ulthera', date: '2026-02-01' }]
  notes               TEXT,

  matched_at          TIMESTAMPTZ,
  match_result        JSONB,                         -- snapshot of top N matches at time of request
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 11. inquiries → quotes (concierge loop)
-- ---------------------------------------------------------------------
CREATE TABLE inquiries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_request_id    UUID REFERENCES match_requests(id) ON DELETE SET NULL,
  user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  hospital_id         INTEGER NOT NULL REFERENCES hospitals(id),
  procedure_id        INTEGER NOT NULL REFERENCES procedures(id),
  status              TEXT NOT NULL DEFAULT 'sent' CHECK (
                        status IN ('sent','quoted','declined','booked','expired')
                      ),
  channel             TEXT,                          -- 'wechat','whatsapp','email','kakao'
  user_message        TEXT,
  hospital_response_ko TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE quotes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id          UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  quoted_price_krw    INTEGER,
  quoted_units        INTEGER,
  valid_until         DATE,
  hospital_response_ko TEXT,
  translation_en      TEXT,
  translation_zh      TEXT,
  translation_ja      TEXT,
  attachments         JSONB,
  sent_to_user_at     TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 12. trips — journey package (differentiator vs 강남언니)
-- ---------------------------------------------------------------------
CREATE TABLE trips (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  arrival_date        DATE,
  departure_date      DATE,
  status              TEXT NOT NULL DEFAULT 'planning' CHECK (
                        status IN ('planning','booked','in_progress','completed','cancelled')
                      ),
  procedures_planned  JSONB,                         -- ordered list w/ scheduled dates
  accommodation       JSONB,
  interpreter_user_id UUID REFERENCES users(id),     -- our staff
  airport_pickup_scheduled BOOLEAN NOT NULL DEFAULT FALSE,
  emergency_contact   TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 13. consultations — pre/in/post-trip sessions
-- ---------------------------------------------------------------------
CREATE TABLE consultations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id             UUID REFERENCES trips(id) ON DELETE SET NULL,
  scheduled_at        TIMESTAMPTZ NOT NULL,
  duration_min        SMALLINT,
  language            TEXT NOT NULL,
  phase               TEXT NOT NULL CHECK (phase IN ('pre_trip','in_trip','post_trip')),
  consultant_user_id  UUID REFERENCES users(id),
  meeting_url         TEXT,
  notes               TEXT,
  recommendations     JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 14. post_op_checkins — D+1 / D+7 / D+30 (differentiator)
-- ---------------------------------------------------------------------
CREATE TABLE post_op_checkins (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  procedure_id        INTEGER REFERENCES procedures(id),
  day_offset          SMALLINT NOT NULL,             -- 1, 7, 30, 90
  scheduled_at        TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  user_response       JSONB,
  photo_urls          TEXT[],
  flagged_for_review  BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by_user_id UUID REFERENCES users(id),
  resolution_notes    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- DECISIONS LOG
--
-- Q: Why mechanism = TEXT[] instead of FK?
-- A: Combinations (InMode = ['rf','em_muscle_stim']). FK to mechanisms.slug
--    enforced at application layer; trade discipline for query simplicity.
--
-- Q: Why dental in `procedures`, not a separate table?
-- A: Sharing concerns/match_requests/inquiries flow is the whole point.
--    Body_area='dental' + mechanism extensions (implant, orthodontic, ...)
--    keeps the matching algorithm DRY. See research-findings §5-5.
--
-- Q: Why is_surgical bool AND mechanism includes 'surgery'?
-- A: Redundant on purpose. `is_surgical` is a fast filter index;
--    `mechanism` is for cross-cutting analytics. Surgery-specific NULL columns
--    (op_duration_hours etc.) are validated against is_surgical at app layer.
--
-- Q: Why packages defer to free text?
-- A: 1 confirmed pattern (살롱드닥터튠즈). Premature abstraction. See claude(3).md §8.
--
-- Q: Why brand → hospital (branch) 2 layers?
-- A: 리엔장 6 branches. Without separation, identical procedures duplicate 6x.
--    Trust/contract is brand-level; pricing/event/coordinator is branch-level.
--
-- Q: Why store wechat_id on hospitals when only 2/19 sites have it?
-- A: We're trying to FILL the gap. Where hospital has none, we route inquiries
--    through our own WeChat. Tracking the field per-hospital lets us measure
--    which clinics ever get direct access.
--
-- Q: Image fields in 3 places (procedures / hospitals / hospital_procedures) — why?
-- A: Different rendering contexts:
--      procedures.thumbnail_url           → category page treatment cards (generic, brand-agnostic)
--      hospitals.thumbnail_url            → comparison page / clinic listings (per-clinic)
--      hospital_procedures.thumbnail_url  → override (rare — only when a clinic ships a custom
--                                            shot of their specific take on the procedure)
--    UI falls back: hospital_procedures → procedures (no clinic override). Hospitals always own
--    their own thumb. Storage is just URL — actual files in Supabase Storage / S3 / Cloudinary.
-- =====================================================================
