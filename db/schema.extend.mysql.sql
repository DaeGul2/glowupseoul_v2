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
