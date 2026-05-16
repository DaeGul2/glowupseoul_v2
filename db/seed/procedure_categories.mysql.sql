-- =====================================================================
-- procedure_categories seed (MySQL) — 8 body-area groups (1st-level UI)
-- See db/seed/procedure_categories.sql for Postgres twin + design notes.
-- =====================================================================

INSERT INTO procedure_categories (slug, name_ko, name_en, name_zh, name_ja, domain, display_order) VALUES
('face',      '얼굴',           'Face',                    '面部',         '顔',              'face_aesthetic',   10),
('eyes',      '눈',             'Eyes',                    '眼部',         '目',              'surgical',         20),
('nose',      '코',             'Nose',                    '鼻部',         '鼻',              'surgical',         30),
('body',      '바디',           'Body',                    '身体',         'ボディ',          'body_contouring',  40),
('skin',      '피부',           'Skin',                    '皮肤',         '肌',              'derm_medical',     50),
('hair',      '헤어 / 두피',    'Hair & Scalp',            '头发与头皮',   'ヘア・頭皮',      'surgical',         60),
('wellness',  '재생 / 웰니스',  'Wellness & Regenerative', '健康再生',     'ウェルネス・再生','regenerative',     70),
('dental',    '치과',           'Dental',                  '牙科',         '歯科',            'dental',           80)
ON DUPLICATE KEY UPDATE
  name_ko = VALUES(name_ko),
  name_en = VALUES(name_en),
  name_zh = VALUES(name_zh),
  name_ja = VALUES(name_ja),
  domain = VALUES(domain),
  display_order = VALUES(display_order);
