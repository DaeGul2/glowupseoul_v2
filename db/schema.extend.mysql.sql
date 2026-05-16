-- =====================================================================
-- Schema extension — admin image slots + doctor/B&A entities.
-- Apply AFTER db/schema.mysql.sql. Idempotent (IF NOT EXISTS / IF EXISTS).
-- Run via: `npm run db:extend` (server/scripts/extend.js).
-- =====================================================================

-- ---------------------------------------------------------------------
-- procedure_categories — category-level hero + thumbnail
-- (MySQL 8 has no `ADD COLUMN IF NOT EXISTS`; we ignore errno 1060 in
--  scripts/extend.js, so re-running is safe.)
-- ---------------------------------------------------------------------
ALTER TABLE procedure_categories ADD COLUMN thumbnail_url   TEXT AFTER display_order;
ALTER TABLE procedure_categories ADD COLUMN hero_image_url  TEXT AFTER thumbnail_url;

-- ---------------------------------------------------------------------
-- procedures — multi-image gallery
-- ---------------------------------------------------------------------
ALTER TABLE procedures ADD COLUMN gallery_urls JSON AFTER hero_image_url;

-- ---------------------------------------------------------------------
-- doctors — many per hospital, optionally chain across branches
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
  id                  INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug                VARCHAR(120) NOT NULL UNIQUE,
  hospital_id         INT          NOT NULL,
  brand_id            INT,                                  -- optional, for chain-wide doctors

  name_ko             VARCHAR(120) NOT NULL,
  name_en             VARCHAR(120),
  name_zh             VARCHAR(120),
  name_ja             VARCHAR(120),

  title_ko            VARCHAR(120),                         -- 원장 / 부원장 / 전문의
  title_en            VARCHAR(120),
  title_zh            VARCHAR(120),
  title_ja            VARCHAR(120),

  -- Photos (multiple slots — admin can pick which to show)
  portrait_url        TEXT,                                  -- 정면 단독 (square or 4:5)
  hero_image_url      TEXT,                                  -- (옵션) 와이드 / 스튜디오 컷
  gallery_urls        JSON,                                  -- 시술 중 / 단체샷 등

  -- Credentials
  years_experience    SMALLINT,
  specialties         JSON,                                  -- ['rhinoplasty','revision_rhinoplasty']
  education           JSON,                                  -- [{ year, school, degree }]
  certifications      JSON,                                  -- [{ name, issuer, year }]
  memberships         JSON,                                  -- [{ society, role }]

  -- Languages spoken by the doctor (subset of hospital.languages_supported)
  languages_spoken    JSON,                                  -- ['ko','en','zh']

  -- Bio (multilingual)
  bio_ko              TEXT,
  bio_en              TEXT,
  bio_zh              TEXT,
  bio_ja              TEXT,

  display_order       SMALLINT NOT NULL DEFAULT 0,
  is_featured         TINYINT(1) NOT NULL DEFAULT 0,        -- 카드/병원 상세 hero 자리에 노출
  is_active           TINYINT(1) NOT NULL DEFAULT 1,
  deleted_at          TIMESTAMP NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_doctors_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  CONSTRAINT fk_doctors_brand    FOREIGN KEY (brand_id)    REFERENCES brands(id)    ON DELETE SET NULL,
  INDEX idx_doctors_hospital (hospital_id),
  INDEX idx_doctors_brand    (brand_id),
  INDEX idx_doctors_featured (is_featured, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- ba_photos — before/after pairs, per hospital + procedure
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ba_photos (
  id                  INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  hospital_id         INT          NOT NULL,
  procedure_id        INT,                                  -- nullable (general case)
  doctor_id           INT,                                  -- 시술자 명시 (optional)

  before_url          TEXT         NOT NULL,
  after_url           TEXT         NOT NULL,
  -- Optional sequence (after_2w, after_3m, after_1y)
  followup_urls       JSON,                                  -- [{ label:'2w', url:'...' }, { label:'3m', url:'...' }]

  -- Case metadata (admin curates)
  case_title_ko       VARCHAR(200),
  case_title_en       VARCHAR(200),
  case_title_zh       VARCHAR(200),
  case_title_ja       VARCHAR(200),
  patient_age_range   VARCHAR(16),                          -- '20s' / '30s' / '40s'
  patient_gender      VARCHAR(8),                            -- 'f' / 'm' / 'nb'
  patient_country     VARCHAR(8),                            -- ISO-2 ('KR','CN','SG' ...)
  weeks_after         SMALLINT,                              -- 사진 시점 (after photo)
  device_brands       JSON,                                  -- 동일 케이스에 쓰인 device
  notes_ko            TEXT,
  notes_en            TEXT,

  -- Consent & visibility
  consent_signed      TINYINT(1) NOT NULL DEFAULT 0,        -- 환자 서면 동의 보유
  consent_date        DATE,
  is_anonymized       TINYINT(1) NOT NULL DEFAULT 1,        -- 눈/얼굴 마스킹 여부
  visibility          VARCHAR(16) NOT NULL DEFAULT 'logged_in', -- public / logged_in / staff_only
  display_order       SMALLINT NOT NULL DEFAULT 0,
  is_active           TINYINT(1) NOT NULL DEFAULT 1,
  deleted_at          TIMESTAMP NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_ba_visibility CHECK (visibility IN ('public','logged_in','staff_only')),
  CONSTRAINT fk_ba_hospital  FOREIGN KEY (hospital_id)  REFERENCES hospitals(id)  ON DELETE CASCADE,
  CONSTRAINT fk_ba_procedure FOREIGN KEY (procedure_id) REFERENCES procedures(id) ON DELETE SET NULL,
  CONSTRAINT fk_ba_doctor    FOREIGN KEY (doctor_id)    REFERENCES doctors(id)    ON DELETE SET NULL,
  INDEX idx_ba_hospital  (hospital_id),
  INDEX idx_ba_procedure (procedure_id),
  INDEX idx_ba_visibility (visibility, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- scan_events — AI 스캔 이벤트 로그 (비용 추적 + IP rate limit + admin 통계).
-- analyze + synthesize 두 종류. 토큰 수 / 비용 / IP / session 기록.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scan_events (
  id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event_type    VARCHAR(16)  NOT NULL,                 -- 'analyze' | 'synthesize'
  ip            VARCHAR(45),                            -- IPv4/IPv6 (X-Forwarded-For)
  session_token VARCHAR(120),
  user_agent    VARCHAR(255),
  model         VARCHAR(64),                            -- 'gpt-4o-mini' 등
  tokens_in     INT,
  tokens_out    INT,
  cost_usd      DECIMAL(10,6),                          -- 0.000220 같은 미세 비용
  duration_ms   INT,
  status_code   SMALLINT     NOT NULL DEFAULT 200,
  error         TEXT,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_scan_event_type CHECK (event_type IN ('analyze','synthesize')),
  INDEX idx_scan_ip_at (ip, created_at),
  INDEX idx_scan_at    (created_at),
  INDEX idx_scan_type  (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- concerns.category_id — 고민을 procedure_categories 8개 중 하나에 매핑.
-- 카테고리는 procedure 와 공유 (통합 분류 축). UI 그룹핑 + 운영자 큐레이션
-- 편의용. 매칭 로직엔 영향 없음 (concern_procedures 가 여전히 메인 매핑).
-- ---------------------------------------------------------------------
ALTER TABLE concerns
  ADD COLUMN category_id INT AFTER body_area;
ALTER TABLE concerns
  ADD CONSTRAINT fk_concerns_category FOREIGN KEY (category_id)
  REFERENCES procedure_categories(id) ON DELETE SET NULL;
ALTER TABLE concerns
  ADD INDEX idx_concerns_category (category_id);

-- ---------------------------------------------------------------------
-- devices — 기기 브랜드 (Ulthera·Shurink·Thermage 등)
-- 외국 환자가 "Ulthera 받고싶다" 처럼 기기명으로 검색하는 흐름을 위해
-- 카탈로그 1급 시민. 한 mechanism 에 여러 device, 한 procedure 에도
-- 여러 device 선택지 (procedure_devices 조인 테이블로).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devices (
  id                  INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug                VARCHAR(80)  NOT NULL UNIQUE,
  name_ko             VARCHAR(120) NOT NULL,
  name_en             VARCHAR(120) NOT NULL,
  name_zh             VARCHAR(120),
  name_ja             VARCHAR(120),

  mechanism_slug      VARCHAR(64),                          -- mechanisms.slug (this device's primary mechanism)

  manufacturer        VARCHAR(120),
  country_of_origin   VARCHAR(8),                            -- ISO-2 or short label

  description_ko      TEXT,
  description_en      TEXT,
  description_zh      TEXT,
  description_ja      TEXT,

  -- "iconic" (FDA 1st-gen), "premium", "k-favorite", "classic"
  badge               VARCHAR(24),

  -- Photos
  thumbnail_url       TEXT,
  hero_image_url      TEXT,
  gallery_urls        JSON,

  -- Marketing
  tags                JSON,                                  -- ['hifu','non-invasive']

  display_order       SMALLINT NOT NULL DEFAULT 0,
  is_active           TINYINT(1) NOT NULL DEFAULT 1,
  deleted_at          TIMESTAMP NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_devices_mechanism FOREIGN KEY (mechanism_slug) REFERENCES mechanisms(slug) ON DELETE SET NULL,
  INDEX idx_devices_mechanism (mechanism_slug),
  INDEX idx_devices_active    (is_active),
  INDEX idx_devices_order     (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- procedure_devices — 시술 ↔ 기기 매트릭스
-- 같은 시술도 여러 장비 선택지가 있음.
-- (HIFU 얼굴 리프팅 = Ulthera primary + Shurink alternative + Liftera alternative …)
-- relevance: primary (대표) / alternative (대체 가능) / compatible (호환만)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS procedure_devices (
  procedure_id        INT          NOT NULL,
  device_id           INT          NOT NULL,
  relevance           VARCHAR(16)  NOT NULL DEFAULT 'alternative',
  notes_ko            TEXT,
  notes_en            TEXT,
  notes_zh            TEXT,
  notes_ja            TEXT,
  display_order       SMALLINT     NOT NULL DEFAULT 0,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (procedure_id, device_id),
  CONSTRAINT chk_pd_relevance CHECK (relevance IN ('primary','alternative','compatible')),
  CONSTRAINT fk_pd_procedure FOREIGN KEY (procedure_id) REFERENCES procedures(id) ON DELETE CASCADE,
  CONSTRAINT fk_pd_device    FOREIGN KEY (device_id)    REFERENCES devices(id)    ON DELETE CASCADE,
  INDEX idx_pd_device (device_id),
  INDEX idx_pd_relevance (relevance)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
