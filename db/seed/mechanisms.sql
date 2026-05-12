-- =====================================================================
-- mechanisms seed (다국어 라벨)
-- See: ../../docs/research-findings.md §2
-- =====================================================================

INSERT INTO mechanisms (slug, label_ko, label_en, label_zh, label_ja, domain, display_order, description_en) VALUES
-- face_aesthetic (energy / injection)
('hifu',                    '하이푸',        'HIFU',                       '高强度聚焦超声',   'HIFU',           'face_aesthetic',  10,  'Focused ultrasound for non-invasive lifting (Ulthera, Shurink, Liftera).'),
('mmfu',                    'MMFU',         'MMFU (micro-focused)',       '微聚焦超声',       'MMFU',           'face_aesthetic',  11,  'Micro-focused ultrasound (Sofwave) — distinct from classical HIFU.'),
('rf',                      'RF',           'Radiofrequency',             '射频',             'RF',             'face_aesthetic',  20,  'Monopolar/bipolar/microneedle RF (Thermage, InMode, Oligio, Potenza).'),
('laser_ablative',          '박피레이저',    'Ablative Laser',             '剥脱性激光',       'アブレイティブレーザー', 'face_aesthetic',  30,  'CO2, Fraxel — removes top skin layer.'),
('laser_non_ablative',      '비박피레이저',  'Non-ablative Laser',         '非剥脱性激光',     'ノンアブレイティブレーザー', 'face_aesthetic',  31,  'Toning, IPL, Picosure, BBL — no skin peeling.'),
('injection_toxin',         '보톡스',        'Botox / Neurotoxin',         '肉毒素',           'ボトックス',     'face_aesthetic',  40,  'Botulinum toxin: lines, masseter, brow.'),
('injection_filler',        '필러',          'Filler',                     '填充剂',           'フィラー',       'face_aesthetic',  41,  'Hyaluronic / collagen filler injection.'),
('injection_skin',          '스킨부스터',    'Skin Booster',               '皮肤助推剂',       'スキンブースター', 'face_aesthetic', 42,  'Rejuran, Skinbooster, water-shine injections.'),
('thread',                  '실리프팅',      'Thread Lifting',             '埋线提升',         '糸リフト',       'face_aesthetic',  50,  'PDO / PLA / PCL thread lifting.'),
('peel',                    '필링',          'Chemical Peel',              '化学换肤',         'ケミカルピール', 'face_aesthetic',  60,  'TCA, glycolic, salicylic peels.'),

-- derm_medical
('extraction',              '여드름압출',    'Extraction',                 '粉刺挑除',         '面皰圧出',       'derm_medical',    10,  'Comedone / blackhead extraction, pore care.'),
('subcision',               '서브시전',      'Subcision',                  '皮下分离',         'サブシジョン',   'derm_medical',    20,  'Needle/jet subcision for scars.'),
('topical',                 '국소요법',      'Topical / LED',              '外用/LED',         'トピカル/LED',   'derm_medical',    30,  'In-clinic LED, facials, topical applications.'),

-- surgical
('surgery',                 '수술',          'Surgery',                    '手术',             '手術',           'surgical',        10,  'General term for surgical aesthetic procedures.'),
('reconstructive',          '재건수술',      'Reconstructive Surgery',     '修复手术',         '再建手術',       'surgical',        11,  'Cleft lip/palate, burn/keloid, scar revision.'),
('hair_transplant',         '모발이식',      'Hair Transplant',            '植发',             '植毛',           'surgical',        20,  'FUE/FUT hair restoration.'),

-- body_contouring
('liposuction',             '지방흡입',      'Liposuction',                '吸脂',             '脂肪吸引',       'body_contouring', 10,  'Suction-assisted fat removal (PAL, VASER, LAMS, etc.).'),
('fat_grafting',            '자가지방이식',  'Fat Grafting',               '自体脂肪移植',     '脂肪注入',       'body_contouring', 11,  'Autologous fat transfer.'),
('fat_dissolve_injection',  '지방분해주사',  'Fat-dissolving Injection',   '溶脂注射',         '脂肪溶解注射',   'body_contouring', 20,  'DCA, lipolysis injections.'),
('cryolipolysis',           '쿨스컬프팅',    'Cryolipolysis',              '冷冻溶脂',         'クールスカルプティング', 'body_contouring', 21,  'CoolSculpting and similar fat-freezing.'),
('em_muscle_stim',          '전자기근육자극', 'EM Muscle Stimulation',      '电磁肌肉刺激',     'EM筋肉刺激',     'body_contouring', 30,  'Emsculpt and similar electromagnetic muscle building.'),

-- regenerative
('stem_cell',               '줄기세포',      'Stem Cell Therapy',          '干细胞治疗',       '幹細胞療法',     'regenerative',    10,  'Adipose-derived stem cell injections / programs.'),
('exosome',                 '엑소좀',        'Exosome Therapy',            '外泌体疗法',       'エクソソーム',   'regenerative',    20,  'ASCE+ and similar exosome treatments.'),
('prp',                     'PRP',          'PRP (Platelet-rich Plasma)', '富血小板血浆',     'PRP',            'regenerative',    30,  'Autologous PRP injection for skin / hair / scar.'),
('iv_therapy',              '수액/영양주사', 'IV Therapy',                 '静脉输液',         'IV療法',         'regenerative',    40,  'Functional medicine IV (immune, vitamin, NAD+).'),

-- dental
('implant',                 '임플란트',      'Dental Implant',             '种植牙',           'インプラント',   'dental',          10,  'Titanium fixture + abutment + crown.'),
('orthodontic',             '치아교정',      'Orthodontics',               '正畸',             '矯正',           'dental',          20,  'Invisalign, brackets, partial alignment.'),
('prosthetic',              '보철',          'Prosthetic / Veneer',        '修复/贴面',        '補綴/ベニア',   'dental',          30,  'Crowns, bridges, veneers, laminates.'),
('restorative',             '충치치료',      'Restorative (Filling)',      '充填治疗',         '修復治療',       'dental',          40,  'Caries restoration, fillings, root canal.'),
('periodontal',             '치주치료',      'Periodontal Care',           '牙周护理',         '歯周治療',       'dental',          50,  'Scaling, gum surgery, periodontitis treatment.'),
('bleaching_dental',        '치아미백',      'Teeth Whitening',            '牙齿美白',         'ホワイトニング', 'dental',          60,  'Cosmetic bleaching / whitening.')
;
