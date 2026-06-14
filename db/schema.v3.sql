-- =====================================================================
-- Glow Up Seoul v3 — MySQL 8.x DDL (AWS RDS · database `glowupseoul_v3`)
--
-- v3 는 v2 의 21테이블 구조를 버리고 "마스터 뼈대"부터 다시 시작한다.
-- 큰 변화 두 가지:
--   1) 병원(hospitals/brands/hospital_procedures/doctors/ba_photos …) 전부 제거.
--      → 가격이 병원이 아니라 "시술/수술" 자체에 붙는다 (참고가).
--   2) 기기(devices) + 시술(procedures) 통합. "울쎄라"가 곧 한 행.
--
-- depth1(칼 대는 거 vs 안 대는 거)을 "두 개의 테이블"로 물리 분리:
--   · treatments — 비수술 시술 (울쎄라/써마지/필러 …)
--   · surgeries  — 수술        (코성형/안면거상/지방흡입 …)
-- 두 테이블은 현재 동일한 컬럼 구조다 (향후 수술 전용 필드는 천천히 추가).
--
-- All money in KRW (INT). utf8mb4 / utf8mb4_unicode_ci.
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- treatments — 비수술 시술 (depth1 = 안 대는 거)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS treatments (
  id              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug            VARCHAR(80)  NOT NULL UNIQUE,           -- URL/식별 키. 한번 정하면 안 바꿈.

  name            VARCHAR(160) NOT NULL,                  -- 시술명 (영문) — 예: Ulthera
  summary         VARCHAR(400),                           -- 한 줄 소개 (영문)
  description     TEXT,                                    -- 상세 설명 (Markdown 원문)

  -- 태그는 콤마 문자열이 아니라 정규화: tags 마스터 + treatment_tags 조인 (아래)

  price_krw       INT,                                     -- 참고 가격 (원)
  price_note      VARCHAR(255),                            -- 가격 비고 — 예: "100샷 기준"

  -- 효과 지속 — 규격화(enum). 자유텍스트 금지: 고민↔시술 매칭에 쓰려면 범주화 필수.
  duration        ENUM('temporary','months_3_6','months_6_12','year_1_2','years_2_plus','semi_permanent','permanent'),

  pain_level      ENUM('soft','mild','hard'),              -- 통증 정도 (규격화)
  recovery_level  ENUM('immediate','1_2_days','1_week_plus'), -- 회복 (규격화)
  recovery_note   VARCHAR(400),                            -- 회복 부연 (자유텍스트 OK — 매칭 대상 아님)

  benefits        JSON,                                    -- 장점/추천 대상 — 문자열 배열 ["...","..."]
  cautions        JSON,                                    -- 유의할 점 — 문자열 배열
  linked_note     TEXT,                                    -- (옵션) 연계병원 / 의전 서비스 안내

  thumbnail_url   TEXT,                                    -- 대표 이미지 (옵션)

  display_order   SMALLINT     NOT NULL DEFAULT 0,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  deleted_at      TIMESTAMP    NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_treatments_active (is_active),
  INDEX idx_treatments_order  (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- surgeries — 수술 (depth1 = 칼 대는 거)
-- 현재는 treatments 와 동일 구조. 수술 전용 필드(마취/입원/회복주차 등)는
-- 패턴이 굳으면 천천히 추가한다.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS surgeries (
  id              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug            VARCHAR(80)  NOT NULL UNIQUE,

  name            VARCHAR(160) NOT NULL,                  -- 수술명 (영문) — 예: Rhinoplasty
  summary         VARCHAR(400),                           -- 한 줄 소개 (영문)
  description     TEXT,                                    -- 상세 설명 (Markdown 원문)

  -- 태그는 정규화: tags 마스터 + surgery_tags 조인 (아래)

  price_krw       INT,
  price_note      VARCHAR(255),

  duration        ENUM('temporary','months_3_6','months_6_12','year_1_2','years_2_plus','semi_permanent','permanent'),

  pain_level      ENUM('soft','mild','hard'),
  recovery_level  ENUM('immediate','1_2_days','1_week_plus'),
  recovery_note   VARCHAR(400),

  benefits        JSON,                                    -- 장점/추천 대상 배열
  cautions        JSON,                                    -- 유의할 점 배열
  linked_note     TEXT,                                    -- (옵션) 구순구개열 연계병원 등

  thumbnail_url   TEXT,

  display_order   SMALLINT     NOT NULL DEFAULT 0,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  deleted_at      TIMESTAMP    NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_surgeries_active (is_active),
  INDEX idx_surgeries_order  (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- tags — 공유 태그 마스터. 콤마 문자열 금지. 시술/수술이 조인으로 참조.
-- "이런 다중선택 필드는 전부 FK 정규화" 원칙의 첫 적용.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
  id              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug            VARCHAR(80)  NOT NULL UNIQUE,
  name            VARCHAR(80)  NOT NULL,                   -- 태그명 (영문)
  display_order   SMALLINT     NOT NULL DEFAULT 0,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- treatment_tags — 시술 ↔ 태그 (M:N). 진짜 FK + cascade.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS treatment_tags (
  treatment_id    INT          NOT NULL,
  tag_id          INT          NOT NULL,
  PRIMARY KEY (treatment_id, tag_id),
  CONSTRAINT fk_tt_treatment FOREIGN KEY (treatment_id) REFERENCES treatments(id) ON DELETE CASCADE,
  CONSTRAINT fk_tt_tag       FOREIGN KEY (tag_id)       REFERENCES tags(id)       ON DELETE CASCADE,
  INDEX idx_tt_tag (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- surgery_tags — 수술 ↔ 태그 (M:N).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS surgery_tags (
  surgery_id      INT          NOT NULL,
  tag_id          INT          NOT NULL,
  PRIMARY KEY (surgery_id, tag_id),
  CONSTRAINT fk_st_surgery FOREIGN KEY (surgery_id) REFERENCES surgeries(id) ON DELETE CASCADE,
  CONSTRAINT fk_st_tag     FOREIGN KEY (tag_id)     REFERENCES tags(id)      ON DELETE CASCADE,
  INDEX idx_st_tag (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- concern_areas — 고민 부위 (depth2). track 으로 수술/비수술 분기 연결.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS concern_areas (
  id              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug            VARCHAR(80)  NOT NULL UNIQUE,
  name            VARCHAR(120) NOT NULL,                  -- 영문 (예: Skin, Eyes, Nose)
  track           ENUM('surgical','non_surgical','both') NOT NULL DEFAULT 'both',
  display_order   SMALLINT     NOT NULL DEFAULT 0,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ca_track (track)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- concerns — 세부 고민 (depth3). 부위(area)에 속함.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS concerns (
  id              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug            VARCHAR(80)  NOT NULL UNIQUE,
  name            VARCHAR(120) NOT NULL,                  -- 영문 (예: Sagging, Pores, Dark circles)
  area_id         INT,
  display_order   SMALLINT     NOT NULL DEFAULT 0,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_concern_area FOREIGN KEY (area_id) REFERENCES concern_areas(id) ON DELETE SET NULL,
  INDEX idx_concern_area (area_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- treatment_concerns / surgery_concerns — 시술·수술 ↔ 고민 매핑 (매칭의 핵심)
-- relevance: primary(핵심) / secondary(보조). 매칭 점수에 사용.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS treatment_concerns (
  treatment_id    INT          NOT NULL,
  concern_id      INT          NOT NULL,
  relevance       ENUM('primary','secondary') NOT NULL DEFAULT 'primary',
  reason          TEXT,                                   -- 왜 이 시술이 이 고민에 좋은지
  PRIMARY KEY (treatment_id, concern_id),
  CONSTRAINT fk_tc_treatment FOREIGN KEY (treatment_id) REFERENCES treatments(id) ON DELETE CASCADE,
  CONSTRAINT fk_tc_concern   FOREIGN KEY (concern_id)   REFERENCES concerns(id)   ON DELETE CASCADE,
  INDEX idx_tc_concern (concern_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS surgery_concerns (
  surgery_id      INT          NOT NULL,
  concern_id      INT          NOT NULL,
  relevance       ENUM('primary','secondary') NOT NULL DEFAULT 'primary',
  reason          TEXT,                                   -- 왜 이 수술이 이 고민에 좋은지
  PRIMARY KEY (surgery_id, concern_id),
  CONSTRAINT fk_sc_surgery FOREIGN KEY (surgery_id) REFERENCES surgeries(id) ON DELETE CASCADE,
  CONSTRAINT fk_sc_concern FOREIGN KEY (concern_id) REFERENCES concerns(id)  ON DELETE CASCADE,
  INDEX idx_sc_concern (concern_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
