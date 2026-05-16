-- =====================================================================
-- v2 Korea Medical Tourism Platform — MySQL 8.x DDL (AWS RDS target)
--
-- Ported from db/schema.sql (Postgres). Differences kept minimal so app
-- code stays mostly portable:
--   SERIAL                  → INT AUTO_INCREMENT
--   UUID gen_random_uuid()  → CHAR(36) DEFAULT (UUID())
--   TEXT[] / JSONB          → JSON  (validate / index at app layer)
--   TIMESTAMPTZ + now()     → TIMESTAMP DEFAULT CURRENT_TIMESTAMP
--   NUMERIC                 → DECIMAL
--   GIN / partial indexes   → plain indexes (filter at app layer)
--   ARRAY['ko']             → JSON_ARRAY('ko')
--
-- All money in KRW (INT). Strings default utf8mb4 / utf8mb4_unicode_ci.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. mechanisms
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mechanisms (
  slug                VARCHAR(64)  NOT NULL PRIMARY KEY,
  label_ko            VARCHAR(120) NOT NULL,
  label_en            VARCHAR(120) NOT NULL,
  label_zh            VARCHAR(120),
  label_ja            VARCHAR(120),
  description_ko      TEXT,
  description_en      TEXT,
  description_zh      TEXT,
  description_ja      TEXT,
  domain              VARCHAR(32)  NOT NULL,
  display_order       SMALLINT,
  is_active           TINYINT(1)   NOT NULL DEFAULT 1,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_mechanisms_domain CHECK (domain IN
    ('face_aesthetic','body_contouring','regenerative','surgical','derm_medical','dental'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. procedure_categories
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS procedure_categories (
  id                  INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug                VARCHAR(64)  NOT NULL UNIQUE,
  name_ko             VARCHAR(120) NOT NULL,
  name_en             VARCHAR(120) NOT NULL,
  name_zh             VARCHAR(120),
  name_ja             VARCHAR(120),
  domain              VARCHAR(32)  NOT NULL,
  parent_id           INT,
  display_order       SMALLINT,
  is_active           TINYINT(1)   NOT NULL DEFAULT 1,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_proc_cat_domain CHECK (domain IN
    ('face_aesthetic','body_contouring','regenerative','surgical','derm_medical','dental')),
  CONSTRAINT fk_proc_cat_parent FOREIGN KEY (parent_id)
    REFERENCES procedure_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. procedures (intrinsic)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS procedures (
  id                   INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug                 VARCHAR(80)  NOT NULL UNIQUE,
  category_id          INT,

  name_ko              VARCHAR(160) NOT NULL,
  name_en              VARCHAR(160),
  name_zh              VARCHAR(160),
  name_ja              VARCHAR(160),
  description_ko       TEXT,
  description_en       TEXT,
  description_zh       TEXT,
  description_ja       TEXT,

  -- Classification (arrays → JSON; validate at app layer)
  mechanism            JSON         NOT NULL,
  domain               VARCHAR(32)  NOT NULL,
  body_area            JSON         NOT NULL,

  pain_level           SMALLINT,
  intensity            VARCHAR(16),
  downtime_days        SMALLINT,
  result_onset         VARCHAR(16),
  result_duration      VARCHAR(16),
  typical_sessions     SMALLINT,

  is_surgical          TINYINT(1)   NOT NULL DEFAULT 0,
  anesthesia_typical   VARCHAR(16),
  op_duration_hours    DECIMAL(3,1),
  hospitalization_days SMALLINT,
  stitch_removal_days  SMALLINT,
  swelling_peak_days   SMALLINT,
  final_result_weeks   SMALLINT,
  revision_eligible    TINYINT(1),

  market_price_min     INT,
  market_price_max     INT,
  price_unit           VARCHAR(32),
  unit_type            VARCHAR(16),
  common_units         JSON,

  device_examples      JSON,

  thumbnail_url        TEXT,
  hero_image_url       TEXT,
  illustration_url     TEXT,

  tags                 JSON,

  is_active            TINYINT(1)   NOT NULL DEFAULT 1,
  deleted_at           TIMESTAMP    NULL,
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_procedures_domain      CHECK (domain IN
    ('face_aesthetic','body_contouring','regenerative','surgical','derm_medical','dental')),
  CONSTRAINT chk_procedures_pain        CHECK (pain_level IS NULL OR pain_level BETWEEN 1 AND 5),
  CONSTRAINT chk_procedures_intensity   CHECK (intensity IS NULL OR intensity IN ('subtle','moderate','dramatic')),
  CONSTRAINT chk_procedures_onset       CHECK (result_onset IS NULL OR result_onset IN ('immediate','gradual')),
  CONSTRAINT chk_procedures_duration    CHECK (result_duration IS NULL OR result_duration IN ('temporary','months','years','permanent')),
  CONSTRAINT chk_procedures_anesthesia  CHECK (anesthesia_typical IS NULL OR anesthesia_typical IN ('topical','local','sedation','general','none')),
  CONSTRAINT chk_procedures_unit_type   CHECK (unit_type IS NULL OR unit_type IN ('shots','cc','sessions','area','flat')),
  CONSTRAINT fk_procedures_category     FOREIGN KEY (category_id)
    REFERENCES procedure_categories(id) ON DELETE SET NULL,
  INDEX idx_procedures_domain     (domain),
  INDEX idx_procedures_category   (category_id),
  INDEX idx_procedures_surgical   (is_surgical),
  INDEX idx_procedures_active     (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. concerns
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS concerns (
  id                  INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug                VARCHAR(64)  NOT NULL UNIQUE,
  name_ko             VARCHAR(120) NOT NULL,
  name_en             VARCHAR(120) NOT NULL,
  name_zh             VARCHAR(120),
  name_ja             VARCHAR(120),
  description_ko      TEXT,
  description_en      TEXT,
  description_zh      TEXT,
  description_ja      TEXT,
  body_area           VARCHAR(32)  NOT NULL,
  display_order       SMALLINT,
  is_active           TINYINT(1)   NOT NULL DEFAULT 1,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_concerns_body_area (body_area)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. concern_procedures
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS concern_procedures (
  concern_id          INT          NOT NULL,
  procedure_id        INT          NOT NULL,
  relevance           VARCHAR(16)  NOT NULL,
  rationale_ko        TEXT,
  rationale_en        TEXT,
  rationale_zh        TEXT,
  rationale_ja        TEXT,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (concern_id, procedure_id),
  CONSTRAINT chk_concern_proc_rel CHECK (relevance IN ('primary','secondary','adjunct')),
  CONSTRAINT fk_cp_concern   FOREIGN KEY (concern_id)   REFERENCES concerns(id)   ON DELETE CASCADE,
  CONSTRAINT fk_cp_procedure FOREIGN KEY (procedure_id) REFERENCES procedures(id) ON DELETE CASCADE,
  INDEX idx_cp_procedure (procedure_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. brands
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brands (
  id                   INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug                 VARCHAR(80)  NOT NULL UNIQUE,
  name_ko              VARCHAR(160) NOT NULL,
  name_en              VARCHAR(160),
  name_zh              VARCHAR(160),
  name_ja              VARCHAR(160),
  founding_doctor      VARCHAR(120),
  specialization_depth VARCHAR(16),
  is_chain             TINYINT(1)   NOT NULL DEFAULT 0,
  website_url          TEXT,
  logo_url             TEXT,
  brand_hero_url       TEXT,
  description_ko       TEXT,
  description_en       TEXT,
  description_zh       TEXT,
  description_ja       TEXT,
  is_active            TINYINT(1)   NOT NULL DEFAULT 1,
  deleted_at           TIMESTAMP    NULL,
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_brands_spec CHECK (specialization_depth IS NULL OR specialization_depth IN ('niche','device_led','general'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. hospitals (branch)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospitals (
  id                       INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug                     VARCHAR(120) NOT NULL UNIQUE,
  brand_id                 INT,
  branch_name              VARCHAR(120),

  name_ko                  VARCHAR(200) NOT NULL,
  name_en                  VARCHAR(200),
  name_zh                  VARCHAR(200),
  name_ja                  VARCHAR(200),

  country                  VARCHAR(8)   NOT NULL DEFAULT 'KR',
  city                     VARCHAR(64)  NOT NULL,
  district                 VARCHAR(64)  NOT NULL,
  neighborhood             VARCHAR(64),
  full_address_ko          TEXT,
  full_address_en          TEXT,
  lat                      DECIMAL(10,8),
  lng                      DECIMAL(11,8),

  phone                    VARCHAR(40),
  email                    VARCHAR(160),
  kakao_id                 VARCHAR(80),
  wechat_id                VARCHAR(80),
  whatsapp                 VARCHAR(40),
  line_id                  VARCHAR(80),
  website_url              TEXT,

  languages_supported      JSON         NOT NULL,  -- default set at app layer (e.g. ['ko'])

  has_intl_coordinator      TINYINT(1)  NOT NULL DEFAULT 0,
  has_interpreter           TINYINT(1)  NOT NULL DEFAULT 0,
  interpreter_languages     JSON,
  english_doctor            TINYINT(1)  NOT NULL DEFAULT 0,
  female_doctor_available   TINYINT(1)  NOT NULL DEFAULT 0,
  accepts_foreign_card      TINYINT(1)  NOT NULL DEFAULT 0,
  airport_pickup            TINYINT(1)  NOT NULL DEFAULT 0,
  recovery_lodging_partner  TINYINT(1)  NOT NULL DEFAULT 0,
  halal_friendly            TINYINT(1)  NOT NULL DEFAULT 0,
  private_room_available    TINYINT(1)  NOT NULL DEFAULT 0,
  anesthesiologist_onsite   TINYINT(1)  NOT NULL DEFAULT 0,

  ba_gallery_url              TEXT,
  ba_photo_count              INT,
  doctor_profile_url          TEXT,
  safety_claim                TEXT,
  foreign_case_volume_monthly INT,
  established_year            SMALLINT,
  external_review_links       JSON,

  thumbnail_url             TEXT,
  hero_image_url            TEXT,
  gallery_urls              JSON,
  thumbnail_alt_ko          VARCHAR(255),
  thumbnail_alt_en          VARCHAR(255),

  contract_status          VARCHAR(16)  NOT NULL DEFAULT 'pending',
  commission_pct           DECIMAL(5,2),
  notes                    TEXT,

  is_active                TINYINT(1)   NOT NULL DEFAULT 1,
  deleted_at               TIMESTAMP    NULL,
  created_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_hospitals_contract CHECK (contract_status IN
    ('active','pending','negotiating','declined','paused')),
  CONSTRAINT fk_hospitals_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
  INDEX idx_hospitals_brand    (brand_id),
  INDEX idx_hospitals_city     (city),
  INDEX idx_hospitals_district (district),
  INDEX idx_hospitals_contract (contract_status),
  INDEX idx_hospitals_active   (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. hospital_procedures
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospital_procedures (
  id                   INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  hospital_id          INT          NOT NULL,
  procedure_id         INT          NOT NULL,
  offered              TINYINT(1)   NOT NULL DEFAULT 1,

  local_name_ko        VARCHAR(200),
  local_name_en        VARCHAR(200),
  local_name_zh        VARCHAR(200),
  local_name_ja        VARCHAR(200),

  price_tier           VARCHAR(8),
  price_disclosed      TINYINT(1)   NOT NULL DEFAULT 0,
  starting_price_krw   INT,
  pricing_notes        TEXT,
  available_units      JSON,

  has_active_event     TINYINT(1)   NOT NULL DEFAULT 0,
  event_notes          TEXT,
  event_until          DATE,

  package_notes        TEXT,

  device_brands        JSON,
  doctor_specialty     VARCHAR(200),
  years_offering       SMALLINT,
  is_signature         TINYINT(1)   NOT NULL DEFAULT 0,

  thumbnail_url        TEXT,
  hero_image_url       TEXT,

  source_url           TEXT,
  notes                TEXT,

  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_hp_price_tier CHECK (price_tier IS NULL OR price_tier IN ('$','$$','$$$','$$$$')),
  CONSTRAINT uq_hp_hospital_proc UNIQUE (hospital_id, procedure_id),
  CONSTRAINT fk_hp_hospital  FOREIGN KEY (hospital_id)  REFERENCES hospitals(id)  ON DELETE CASCADE,
  CONSTRAINT fk_hp_procedure FOREIGN KEY (procedure_id) REFERENCES procedures(id) ON DELETE CASCADE,
  INDEX idx_hp_hospital  (hospital_id),
  INDEX idx_hp_procedure (procedure_id),
  INDEX idx_hp_signature (is_signature),
  INDEX idx_hp_event     (has_active_event)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                   CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  email                VARCHAR(255) UNIQUE,
  phone                VARCHAR(40),
  full_name            VARCHAR(160),
  display_name         VARCHAR(160),
  preferred_language   VARCHAR(8)   NOT NULL DEFAULT 'en',
  country_code         VARCHAR(8),

  wechat_id            VARCHAR(80),
  whatsapp             VARCHAR(40),
  line_id              VARCHAR(80),
  kakao_id             VARCHAR(80),

  auth_provider        VARCHAR(32),
  auth_provider_uid    VARCHAR(160),
  password_hash        VARCHAR(255),
  email_verified_at    TIMESTAMP    NULL,

  acquisition_channel  VARCHAR(64),
  acquisition_meta     JSON,

  is_active            TINYINT(1)   NOT NULL DEFAULT 1,
  deleted_at           TIMESTAMP    NULL,
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_users_language (preferred_language),
  INDEX idx_users_country  (country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. match_requests
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_requests (
  id                   CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id              CHAR(36),
  session_token        VARCHAR(120),

  concern_ids          JSON         NOT NULL,
  budget_tier          VARCHAR(16),
  budget_min_krw       INT,
  budget_max_krw       INT,

  pain_tolerance       VARCHAR(8),
  intensity_pref       VARCHAR(16),
  max_downtime_days    SMALLINT,
  preferred_languages  JSON,
  district_pref        VARCHAR(64),
  city_pref            VARCHAR(64),
  trip_start           DATE,
  trip_end             DATE,
  prior_procedures     JSON,
  notes                TEXT,

  matched_at           TIMESTAMP    NULL,
  match_result         JSON,

  public_feed_consent  TINYINT(1)   NOT NULL DEFAULT 0,

  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_mr_budget_tier CHECK (budget_tier IS NULL OR budget_tier IN
    ('under_300','300_800','800_2000','2000_5000','over_5000','flexible')),
  CONSTRAINT chk_mr_pain  CHECK (pain_tolerance IS NULL OR pain_tolerance IN ('low','medium','high')),
  CONSTRAINT chk_mr_intensity CHECK (intensity_pref IS NULL OR intensity_pref IN ('subtle','moderate','dramatic','any')),
  CONSTRAINT fk_mr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_mr_user (user_id),
  INDEX idx_mr_session (session_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. inquiries / quotes
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
  id                   CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  match_request_id     CHAR(36),
  user_id              CHAR(36),
  hospital_id          INT          NOT NULL,
  procedure_id         INT          NOT NULL,
  status               VARCHAR(16)  NOT NULL DEFAULT 'sent',
  channel              VARCHAR(16),
  user_message         TEXT,
  hospital_response_ko TEXT,
  notes                TEXT,
  public_feed_consent  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_inq_status CHECK (status IN ('sent','quoted','declined','booked','expired')),
  CONSTRAINT fk_inq_match    FOREIGN KEY (match_request_id) REFERENCES match_requests(id) ON DELETE SET NULL,
  CONSTRAINT fk_inq_user     FOREIGN KEY (user_id)          REFERENCES users(id)          ON DELETE SET NULL,
  CONSTRAINT fk_inq_hospital FOREIGN KEY (hospital_id)      REFERENCES hospitals(id),
  CONSTRAINT fk_inq_proc     FOREIGN KEY (procedure_id)     REFERENCES procedures(id),
  INDEX idx_inq_status (status),
  INDEX idx_inq_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quotes (
  id                   CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  inquiry_id           CHAR(36)     NOT NULL,
  quoted_price_krw     INT,
  quoted_units         INT,
  valid_until          DATE,
  hospital_response_ko TEXT,
  translation_en       TEXT,
  translation_zh       TEXT,
  translation_ja       TEXT,
  attachments          JSON,
  sent_to_user_at      TIMESTAMP    NULL,
  notes                TEXT,
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quotes_inquiry FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE,
  INDEX idx_quotes_inquiry (inquiry_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. trips
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trips (
  id                       CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id                  CHAR(36)     NOT NULL,
  arrival_date             DATE,
  departure_date           DATE,
  status                   VARCHAR(16)  NOT NULL DEFAULT 'planning',
  procedures_planned       JSON,
  accommodation            JSON,
  interpreter_user_id      CHAR(36),
  airport_pickup_scheduled TINYINT(1)   NOT NULL DEFAULT 0,
  emergency_contact        VARCHAR(200),
  notes                    TEXT,
  created_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_trips_status CHECK (status IN ('planning','booked','in_progress','completed','cancelled')),
  CONSTRAINT fk_trips_user        FOREIGN KEY (user_id)             REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_trips_interpreter FOREIGN KEY (interpreter_user_id) REFERENCES users(id),
  INDEX idx_trips_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 13. consultations
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consultations (
  id                   CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id              CHAR(36)     NOT NULL,
  trip_id              CHAR(36),
  scheduled_at         TIMESTAMP    NOT NULL,
  duration_min         SMALLINT,
  language             VARCHAR(8)   NOT NULL,
  phase                VARCHAR(16)  NOT NULL,
  consultant_user_id   CHAR(36),
  meeting_url          TEXT,
  notes                TEXT,
  recommendations      JSON,
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_consult_phase CHECK (phase IN ('pre_trip','in_trip','post_trip')),
  CONSTRAINT fk_consult_user       FOREIGN KEY (user_id)            REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_consult_trip       FOREIGN KEY (trip_id)            REFERENCES trips(id) ON DELETE SET NULL,
  CONSTRAINT fk_consult_consultant FOREIGN KEY (consultant_user_id) REFERENCES users(id),
  INDEX idx_consult_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 14. post_op_checkins
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_op_checkins (
  id                   CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  trip_id              CHAR(36)     NOT NULL,
  procedure_id         INT,
  day_offset           SMALLINT     NOT NULL,
  scheduled_at         TIMESTAMP    NULL,
  completed_at         TIMESTAMP    NULL,
  user_response        JSON,
  photo_urls           JSON,
  flagged_for_review   TINYINT(1)   NOT NULL DEFAULT 0,
  resolved_by_user_id  CHAR(36),
  resolution_notes     TEXT,
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_checkin_trip     FOREIGN KEY (trip_id)             REFERENCES trips(id)      ON DELETE CASCADE,
  CONSTRAINT fk_checkin_proc     FOREIGN KEY (procedure_id)        REFERENCES procedures(id),
  CONSTRAINT fk_checkin_resolver FOREIGN KEY (resolved_by_user_id) REFERENCES users(id),
  INDEX idx_checkin_trip (trip_id),
  INDEX idx_checkin_flagged (flagged_for_review)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 15. public_feed_entries
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public_feed_entries (
  id                   CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  source_type          VARCHAR(16)  NOT NULL,
  source_id            CHAR(36),

  display_initial      VARCHAR(4)   NOT NULL,
  country_code         VARCHAR(8),
  country_label_en     VARCHAR(80),
  country_label_zh     VARCHAR(80),
  country_label_ja     VARCHAR(80),
  country_label_ko     VARCHAR(80),

  procedure_id         INT,
  concern_id           INT,

  treatment_label_en   VARCHAR(160),
  treatment_label_zh   VARCHAR(160),
  treatment_label_ja   VARCHAR(160),
  treatment_label_ko   VARCHAR(160),

  outcome              VARCHAR(16),
  outcome_note_en      VARCHAR(255),
  outcome_note_zh      VARCHAR(255),
  outcome_note_ja      VARCHAR(255),
  outcome_note_ko      VARCHAR(255),

  is_visible           TINYINT(1)   NOT NULL DEFAULT 1,
  is_seed              TINYINT(1)   NOT NULL DEFAULT 0,
  priority             SMALLINT     NOT NULL DEFAULT 0,

  displayed_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at           TIMESTAMP    NULL,

  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_feed_source  CHECK (source_type IN ('inquiry','match_request','seed')),
  CONSTRAINT chk_feed_outcome CHECK (outcome IS NULL OR outcome IN
    ('consulted','matched','quoted','booked','completed')),
  CONSTRAINT fk_feed_procedure FOREIGN KEY (procedure_id) REFERENCES procedures(id) ON DELETE SET NULL,
  CONSTRAINT fk_feed_concern   FOREIGN KEY (concern_id)   REFERENCES concerns(id)   ON DELETE SET NULL,
  INDEX idx_feed_visible_at (is_visible, displayed_at),
  INDEX idx_feed_source     (source_type, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
