// 메인 페이지 social-proof ticker 시드. 운영자 큐레이션 가정.

const now = Date.now();
const minAgo = (m) => new Date(now - m * 60_000).toISOString();

export const publicFeedEntries = [
  { id: 'pf01', source_type: 'seed', display_initial: 'M.', country_code: 'SG', country_label_en: 'Singapore', treatment_label_en: 'HIFU Lifting',  treatment_label_ko: 'HIFU 리프팅',  outcome: 'consulted', outcome_note_en: 'matched with 3 clinics', displayed_at: minAgo(3),   is_visible: true, is_seed: true },
  { id: 'pf02', source_type: 'seed', display_initial: 'A.', country_code: 'CN', country_label_en: 'China',      treatment_label_en: 'Rhinoplasty',   treatment_label_ko: '코 성형',     outcome: 'quoted',    outcome_note_en: 'quote sent in 2h',        displayed_at: minAgo(8),   is_visible: true, is_seed: true },
  { id: 'pf03', source_type: 'seed', display_initial: 'J.', country_code: 'JP', country_label_en: 'Japan',      treatment_label_en: 'Thread Lift',   treatment_label_ko: '실리프팅',     outcome: 'consulted', outcome_note_en: null,                       displayed_at: minAgo(15),  is_visible: true, is_seed: true },
  { id: 'pf04', source_type: 'seed', display_initial: 'K.', country_code: 'US', country_label_en: 'USA',        treatment_label_en: 'Liposuction',   treatment_label_ko: 'LAMS 지방흡입', outcome: 'booked',    outcome_note_en: 'trip Jun 10-14',           displayed_at: minAgo(22),  is_visible: true, is_seed: true },
  { id: 'pf05', source_type: 'seed', display_initial: 'L.', country_code: 'VN', country_label_en: 'Vietnam',    treatment_label_en: 'Dental Implant',treatment_label_ko: '임플란트',     outcome: 'quoted',    outcome_note_en: null,                       displayed_at: minAgo(31),  is_visible: true, is_seed: true },
  { id: 'pf06', source_type: 'seed', display_initial: 'S.', country_code: 'TH', country_label_en: 'Thailand',   treatment_label_en: 'PicoSure',      treatment_label_ko: '피코 토닝',    outcome: 'consulted', outcome_note_en: null,                       displayed_at: minAgo(44),  is_visible: true, is_seed: true },
  { id: 'pf07', source_type: 'seed', display_initial: 'R.', country_code: 'ID', country_label_en: 'Indonesia',  treatment_label_en: 'Double Eyelid', treatment_label_ko: '쌍커풀',       outcome: 'booked',    outcome_note_en: 'with Hershe',              displayed_at: minAgo(58),  is_visible: true, is_seed: true },
  { id: 'pf08', source_type: 'seed', display_initial: 'F.', country_code: 'AE', country_label_en: 'UAE',        treatment_label_en: 'Thermage FLX',  treatment_label_ko: '써마지 FLX',  outcome: 'consulted', outcome_note_en: null,                       displayed_at: minAgo(73),  is_visible: true, is_seed: true },
];

publicFeedEntries.forEach((e) => {
  e.country_label_zh = e.country_label_en;
  e.country_label_ja = e.country_label_en;
  e.country_label_ko = e.country_label_en;
  e.treatment_label_zh = e.treatment_label_ko;
  e.treatment_label_ja = e.treatment_label_ko;
  e.outcome_note_zh = e.outcome_note_en;
  e.outcome_note_ja = e.outcome_note_en;
  e.outcome_note_ko = e.outcome_note_en;
});
