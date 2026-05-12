-- =====================================================================
-- procedure_categories seed — 8개 body-area 그룹 (1차 UI 카테고리)
--
-- 결정 근거: v2/CLAUDE.md §15 "카테고리 분기 축 결정 — 사고의 흐름"
-- 외국인 환자는 부위(body_area) 진입이 가장 자연스러움.
-- intensity_tier (surgery/petit/skin) 는 카테고리 페이지 내부 sub-filter 로 보존.
--
-- domain 필드는 "주된 도메인" 만 표기 (실제 시술은 여러 도메인 가능 —
-- 예: Face 에 surgery (안면거상) 도 derm (여드름) 도 일부 포함).
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
;

-- =====================================================================
-- 향후 sub-category 확장 (필요 시) — MVP 는 flat 8 + 카테고리 페이지 내부
-- secondary filter (intensity_tier / concerns chips / mechanism toggle /
-- price tier / downtime) 로 정렬.
--
-- 예시 (MVP 이후 활성화):
-- INSERT INTO procedure_categories (slug, name_ko, name_en, name_zh, name_ja, domain, parent_id, display_order) VALUES
-- ('face_lifting',     '얼굴 리프팅',     'Face Lifting',       '面部提升',     'リフティング',     'face_aesthetic',  (SELECT id FROM procedure_categories WHERE slug='face'), 1),
-- ('face_contouring',  '얼굴 윤곽',       'Face Contour',       '面部轮廓',     'フェイス輪郭',     'face_aesthetic',  (SELECT id FROM procedure_categories WHERE slug='face'), 2),
-- ('face_filler',      '필러 · 보톡스',  'Filler & Botox',     '填充剂与肉毒', 'フィラー',         'face_aesthetic',  (SELECT id FROM procedure_categories WHERE slug='face'), 3),
-- ('face_skinbooster', '스킨부스터',      'Skin Booster',       '皮肤助推剂',   'スキンブースター', 'face_aesthetic',  (SELECT id FROM procedure_categories WHERE slug='face'), 4),
-- ('face_facelift',    '안면거상',        'Facelift Surgery',   '面部除皱手术', '顔リフト手術',     'surgical',        (SELECT id FROM procedure_categories WHERE slug='face'), 5),
-- ('face_thread',      '실리프팅',        'Thread Lifting',     '埋线提升',     '糸リフト',         'face_aesthetic',  (SELECT id FROM procedure_categories WHERE slug='face'), 6);
-- =====================================================================
