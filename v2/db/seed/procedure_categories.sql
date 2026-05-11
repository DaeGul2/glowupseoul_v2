-- =====================================================================
-- procedure_categories seed
-- See: ../../docs/ux-direction.md §3
-- 메인 페이지 카테고리 탭과 1:1 매핑
-- =====================================================================

INSERT INTO procedure_categories (slug, name_ko, name_en, name_zh, name_ja, domain, display_order) VALUES
('lifting',         '리프팅',         'Lifting & Tightening',           '提拉紧致',           'リフティング',       'face_aesthetic',   10),
('contouring',      '얼굴윤곽',       'Face Contouring',                '面部轮廓',           'フェイス輪郭',       'face_aesthetic',   20),
('skin_glow',       '스킨/광채',       'Skin & Glow',                    '肌肤护理',           'スキン/グロー',     'derm_medical',     30),
('injectables',     '주사미용',        'Injectables (Botox · Filler)',   '注射美容',           '注射美容',           'face_aesthetic',   40),
('eye_surgery',     '눈성형',         'Eye Surgery',                    '眼部整形',           '目の整形',           'surgical',         50),
('nose_surgery',    '코성형',         'Nose Surgery',                   '鼻部整形',           '鼻の整形',           'surgical',         60),
('body_contour',    '바디 컨투어링',   'Body Contouring',                '身体塑形',           'ボディ造形',         'body_contouring',  70),
('hair_scalp',      '헤어 / 두피',     'Hair & Scalp',                   '头发与头皮',         'ヘア・頭皮',         'regenerative',     80),
('regenerative',    '재생 / 줄기세포',  'Regenerative Medicine',          '再生医学',           '再生医療',           'regenerative',     90),
('dental',          '치과 미용',       'Dental Aesthetics',              '牙科美容',           '歯科美容',           'dental',          100)
;

-- 하위 카테고리 예시 (lifting 도메인 — 시술 종류별 sub)
-- 카테고리 페이지 내 sub-filter 로 사용
INSERT INTO procedure_categories (slug, name_ko, name_en, name_zh, name_ja, domain, parent_id, display_order) VALUES
('lifting_hifu',        '하이푸 리프팅',     'HIFU Lifting',           'HIFU提拉',         'HIFUリフト',     'face_aesthetic',   (SELECT id FROM procedure_categories WHERE slug = 'lifting'),     1),
('lifting_rf',          'RF 리프팅',         'RF Lifting',             'RF射频提拉',       'RFリフト',       'face_aesthetic',   (SELECT id FROM procedure_categories WHERE slug = 'lifting'),     2),
('lifting_thread',      '실리프팅',          'Thread Lifting',         '埋线提升',         '糸リフト',       'face_aesthetic',   (SELECT id FROM procedure_categories WHERE slug = 'lifting'),     3),
('lifting_surgical',    '안면거상',          'Surgical Facelift',      '面部除皱手术',     '顔リフト手術',   'surgical',         (SELECT id FROM procedure_categories WHERE slug = 'lifting'),     4)
;
