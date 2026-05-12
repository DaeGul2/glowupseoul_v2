// Match-history feed — what schema.sql calls `public_feed_entries`.
// Each entry mirrors a real-world consent-given match: who (anonymized), what they wanted,
// what Romie recommended. Used in:
//   1. Thin ticker under the hero  (1 entry rotating)
//   2. "Recently matched" editorial section on homepage (6 entries grid)
//
// When DB lands, this file becomes a thin fetch wrapper — schema fields are already aligned.

const now = Date.now();
const minAgo = (m) => new Date(now - m * 60_000).toISOString();

const seed = [
  {
    id: 'pf01',
    display_initial: 'M.', country_code: 'SG', country_label_en: 'Singapore',
    concern_slugs: ['sagging', 'wrinkles'],
    concern_labels_en: 'Lifting · Wrinkles',
    treatment_slug: 'hifu_face',
    treatment_label_en: 'HIFU Lifting',
    hospital_slug: 'vellicell_강남점',
    hospital_label_en: 'Vellicell',
    story_en: 'Wanted a non-invasive lift before her wedding in October.',
    outcome: 'matched', outcome_note_en: 'matched with 3 clinics',
    displayed_at: minAgo(3),
    case: {
      prefs: { budget_tier: '800_2000', budget_label: '₩800k – ₩2M', downtime_max: 3, pain_max: 4, style_target: 2, style_label: 'Soft', language: 'en', notes: 'Wedding in October — need recovery to be quick.' },
      ai_scan: { narrative: 'We notice mild jawline softening and the start of horizontal lines on the forehead — both very treatable at this stage.', confidence: 'medium', concerns_detected: ['sagging','wrinkles','aging_overall'], metrics: { skin_clarity: 72, tone_evenness: 78, under_eye_darkness: 24, jawline_definition: 56, symmetry: 91, youthful_volume: 78 }, regions: [{ label: 'JAWLINE', note: 'soft contour — lift candidates apply' }, { label: 'FOREHEAD', note: 'fine static lines' }] },
      synth: { overall: 'Your scan reads as early-stage softening in places that respond well to non-invasive lifting. Given your wedding timing and downtime cap, HIFU is the cleanest single-session choice.', rationale: 'Shurink 600-shot fits both your budget headroom and the SMAS-layer signal in your scan.', closing: 'Pick a date — we\'ll confirm doctor availability in your trip window.' },
      top_match: { procedure_name_en: 'HIFU Face Lifting', hospital_name_en: 'Vellicell · Gangnam', price_krw: 390000, original_price_krw: 600000, discount_pct: 35, device_brands: ['Shurink'] },
    },
  },
  {
    id: 'pf02',
    display_initial: 'A.', country_code: 'CN', country_label_en: 'China',
    concern_slugs: ['nose_shape'],
    concern_labels_en: 'Nose shape',
    treatment_slug: 'rhinoplasty_bridge',
    treatment_label_en: 'Bridge Rhinoplasty',
    hospital_slug: 'hershe_청담점',
    hospital_label_en: 'Hershe',
    story_en: 'First time in Korea, asked specifically about revision rates.',
    outcome: 'quoted', outcome_note_en: 'quote returned in 2h',
    displayed_at: minAgo(8),
    case: {
      prefs: { budget_tier: '2000_5000', budget_label: '₩2M – ₩5M', downtime_max: 14, pain_max: 5, style_target: 4, style_label: 'Bold', language: 'zh', notes: '想问一下，韩国医院的修复率如何？' },
      ai_scan: { narrative: 'The dorsum reads slightly flat and the tip projection is gentle — both align with what you described.', confidence: 'medium', concerns_detected: ['nose_shape'], metrics: { skin_clarity: 81, tone_evenness: 82, under_eye_darkness: 28, jawline_definition: 70, symmetry: 88, youthful_volume: 84 }, regions: [{ label: 'NOSE', note: 'low dorsum · soft tip' }] },
      synth: { overall: '从你的扫描来看，鼻梁略低、鼻尖角度柔和 — 这两点跟你描述的情况一致。Hershe 的安全记录和修复率在我们合作的医院中最透明。', rationale: 'Hershe 的鼻整形手术经验丰富，并且为海外患者提供完整的修复保障。', closing: '请告诉我你的访韩日期，我会安排医生面诊。' },
      top_match: { procedure_name_en: 'Bridge Rhinoplasty', hospital_name_en: 'Hershe Plastic Surgery · Cheongdam', price_krw: 7900000, original_price_krw: 9500000, discount_pct: 17, device_brands: [] },
    },
  },
  {
    id: 'pf03',
    display_initial: 'J.', country_code: 'JP', country_label_en: 'Japan',
    concern_slugs: ['jawline', 'sagging'],
    concern_labels_en: 'Jawline · Lifting',
    treatment_slug: 'thread_lift_pdo',
    treatment_label_en: 'Thread Lift (PDO)',
    hospital_slug: 'drtunes_강남점',
    hospital_label_en: 'Salon de Dr. Tunes',
    story_en: 'Tokyo-based, 1-day trip to Seoul, needed zero downtime.',
    outcome: 'consulted', outcome_note_en: null,
    displayed_at: minAgo(15),
    case: {
      prefs: { budget_tier: '800_2000', budget_label: '₩800k – ₩2M', downtime_max: 1, pain_max: 3, style_target: 2, style_label: 'Soft', language: 'ja', notes: '日帰り旅行なのでダウンタイムなしを優先。' },
      ai_scan: { narrative: 'フェイスラインがやや緩み、首の境界もぼやけ始めています。即効性のあるアプローチが合いそうです。', confidence: 'high', concerns_detected: ['jawline','sagging'], metrics: { skin_clarity: 74, tone_evenness: 80, under_eye_darkness: 30, jawline_definition: 48, symmetry: 92, youthful_volume: 70 }, regions: [{ label: 'JAWLINE', note: '境界やわらか' }] },
      synth: { overall: '日帰りで結果が見える施術となると、糸リフトが第一候補です。あなたのフェイスラインの緩みは PDO スレッドの即時引き上げが効きやすい段階です。', rationale: 'サロン・ド・ドクターチューンズは予約から術後まで日本語対応可能。', closing: '次回の渡航日が決まったら教えてください。' },
      top_match: { procedure_name_en: 'PDO Thread Lift', hospital_name_en: 'Salon de Dr. Tunes · Gangnam', price_krw: 1100000, original_price_krw: 1400000, discount_pct: 21, device_brands: ['Mint Lift'] },
    },
  },
  {
    id: 'pf04',
    display_initial: 'K.', country_code: 'US', country_label_en: 'USA',
    concern_slugs: ['fat_local'],
    concern_labels_en: 'Localized fat',
    treatment_slug: 'lams_liposuction',
    treatment_label_en: 'LAMS Liposuction',
    hospital_slug: '365mc_강남본원',
    hospital_label_en: '365mc',
    story_en: 'Booked a 10-day recovery trip, asked about airport pickup.',
    outcome: 'booked', outcome_note_en: 'trip Jun 10–20',
    displayed_at: minAgo(22),
    case: {
      prefs: { budget_tier: '2000_5000', budget_label: '₩2M – ₩5M', downtime_max: 10, pain_max: 5, style_target: 4, style_label: 'Bold', language: 'en', notes: 'Pickup from ICN preferred. 10-day window booked already.' },
      ai_scan: null,
      synth: { overall: 'Body work with your budget and 10-day window naturally points to 365mc — they have the highest-volume liposuction practice in Korea and an experienced foreign-patient team.', rationale: '365mc\'s LAMS approach + bundled airport pickup + recovery lodging matches your stated trip constraints exactly.', closing: 'We\'ll send you a pre-op checklist 7 days before arrival.' },
      top_match: { procedure_name_en: 'LAMS Liposuction', hospital_name_en: '365mc · Gangnam Main', price_krw: 6900000, original_price_krw: 9000000, discount_pct: 23, device_brands: ['MicroAire', 'VASER'] },
    },
  },
  {
    id: 'pf05',
    display_initial: 'L.', country_code: 'VN', country_label_en: 'Vietnam',
    concern_slugs: ['dental_align'],
    concern_labels_en: 'Teeth alignment',
    treatment_slug: 'invisalign',
    treatment_label_en: 'Invisalign',
    hospital_slug: 'lienjang_dental_강남점',
    hospital_label_en: 'Lienjang Dental',
    story_en: 'Compared dental tourism vs. local — asked for cost breakdown.',
    outcome: 'quoted', outcome_note_en: null,
    displayed_at: minAgo(31),
    case: {
      prefs: { budget_tier: 'over_5000', budget_label: 'Over ₩5M', downtime_max: 0, pain_max: 2, style_target: 3, style_label: 'Balanced', language: 'en', notes: 'Want clear aligners, total cost incl. all visits.' },
      ai_scan: null,
      synth: { overall: 'Invisalign at Lienjang Dental fits the brief — clear aligners, total cost transparent, and they handle remote check-ins so you don\'t fly back every 6 weeks.', rationale: 'Lienjang Dental offers full Invisalign packages with cross-border virtual follow-ups for international patients.', closing: 'We\'ll send the full multi-visit breakdown today.' },
      top_match: { procedure_name_en: 'Invisalign', hospital_name_en: 'Lienjang Dental · Gangnam', price_krw: 6500000, original_price_krw: 7500000, discount_pct: 13, device_brands: ['Invisalign'] },
    },
  },
  {
    id: 'pf06',
    display_initial: 'S.', country_code: 'TH', country_label_en: 'Thailand',
    concern_slugs: ['pores', 'skin_tone'],
    concern_labels_en: 'Pores · Skin tone',
    treatment_slug: 'picosure_pico',
    treatment_label_en: 'PicoSure',
    hospital_slug: 'soi_강남점',
    hospital_label_en: 'Soi Clinic',
    story_en: 'Bangkok climate damage — wanted a clarity + tone reset.',
    outcome: 'consulted', outcome_note_en: null,
    displayed_at: minAgo(44),
    case: {
      prefs: { budget_tier: '300_800', budget_label: '₩300k – ₩800k', downtime_max: 2, pain_max: 3, style_target: 2, style_label: 'Soft', language: 'en', notes: 'Sun damage from years in Bangkok. Want clarity, not dramatic.' },
      ai_scan: { narrative: 'Skin reads slightly uneven across the cheek and under-eye — likely sun-driven, very responsive to pico-pulse work.', confidence: 'high', concerns_detected: ['pores','skin_tone','pigmentation'], metrics: { skin_clarity: 58, tone_evenness: 52, under_eye_darkness: 38, jawline_definition: 76, symmetry: 90, youthful_volume: 80 }, regions: [{ label: 'CHEEKS', note: 'uneven tone · sun pattern' }, { label: 'UNDER_EYE', note: 'mild shadow' }] },
      synth: { overall: 'Your scan shows tone unevenness and mild under-eye shadow — the classic pattern after years in a tropical climate. PicoSure across 3–4 sessions is the gold-standard reset.', rationale: 'Soi Clinic\'s PicoSure protocol fits your budget tier and handles both pores and tone in one device.', closing: 'Best results show after session 2 — we recommend planning the trip around that.' },
      top_match: { procedure_name_en: 'PicoSure Laser', hospital_name_en: 'Soi Clinic · Gangnam', price_krw: 220000, original_price_krw: 320000, discount_pct: 31, device_brands: ['PicoSure'] },
    },
  },
  {
    id: 'pf07',
    display_initial: 'R.', country_code: 'ID', country_label_en: 'Indonesia',
    concern_slugs: ['eye_shape'],
    concern_labels_en: 'Double eyelid',
    treatment_slug: 'double_eyelid_incision',
    treatment_label_en: 'Double Eyelid (incision)',
    hospital_slug: 'wannabe_강남점',
    hospital_label_en: 'Wannabe',
    story_en: 'Asked for incision vs. non-incision pros/cons before deciding.',
    outcome: 'booked', outcome_note_en: 'surgery Apr 22',
    displayed_at: minAgo(58),
    case: {
      prefs: { budget_tier: '2000_5000', budget_label: '₩2M – ₩5M', downtime_max: 7, pain_max: 4, style_target: 3, style_label: 'Balanced', language: 'en', notes: 'Want it to last. Halal-friendly clinic preferred.' },
      ai_scan: { narrative: 'Lid crease reads softly defined and asymmetric between sides — a natural-line incisional approach can level this cleanly.', confidence: 'medium', concerns_detected: ['eye_shape'], metrics: { skin_clarity: 78, tone_evenness: 80, under_eye_darkness: 22, jawline_definition: 80, symmetry: 84, youthful_volume: 86 }, regions: [{ label: 'UNDER_EYE', note: 'subtle asymmetry' }] },
      synth: { overall: 'Given your "I want it to last" framing and slight asymmetry, the incision method is the cleaner long-term call. Wannabe\'s natural-line incision is one of the most-photographed in Gangnam.', rationale: 'Wannabe specializes in the natural-line incision technique you described wanting, and supports halal dietary requirements through partner hotels.', closing: 'Booking confirmed for Apr 22 — pre-op checklist coming Apr 15.' },
      top_match: { procedure_name_en: 'Double Eyelid (Incision)', hospital_name_en: 'Wannabe · Gangnam', price_krw: 2500000, original_price_krw: 3200000, discount_pct: 22, device_brands: [] },
    },
  },
  {
    id: 'pf08',
    display_initial: 'F.', country_code: 'AE', country_label_en: 'UAE',
    concern_slugs: ['aging_overall', 'wrinkles'],
    concern_labels_en: 'Overall aging',
    treatment_slug: 'rf_thermage',
    treatment_label_en: 'Thermage FLX',
    hospital_slug: 'ayun_청담점',
    hospital_label_en: 'Ayun',
    story_en: 'Dubai-based, wanted a single-session premium treatment.',
    outcome: 'consulted', outcome_note_en: null,
    displayed_at: minAgo(73),
    case: {
      prefs: { budget_tier: 'over_5000', budget_label: 'Over ₩5M', downtime_max: 0, pain_max: 4, style_target: 3, style_label: 'Balanced', language: 'en', notes: 'One session, premium device. Private recovery room.' },
      ai_scan: { narrative: 'Tone and volume read well — what we see is dermal thinning across forehead and around the eyes, the classic candidate signal for Thermage.', confidence: 'high', concerns_detected: ['aging_overall','wrinkles'], metrics: { skin_clarity: 84, tone_evenness: 86, under_eye_darkness: 28, jawline_definition: 64, symmetry: 92, youthful_volume: 70 }, regions: [{ label: 'FOREHEAD', note: 'dermal thinning' }, { label: 'UNDER_EYE', note: 'fine static lines' }] },
      synth: { overall: 'You wanted one session, premium, no downtime — that\'s Thermage FLX. Ayun runs the highest shot-count protocol in our network (1200 shots), which is what your scan calls for.', rationale: 'Ayun\'s 1200-shot Thermage protocol matches your "one premium session" brief, with private recovery rooms.', closing: 'We\'ll hold a Thursday morning slot once you confirm dates.' },
      top_match: { procedure_name_en: 'Thermage FLX', hospital_name_en: 'Ayun Clinic · Cheongdam', price_krw: 2200000, original_price_krw: 2600000, discount_pct: 15, device_brands: ['Thermage FLX'] },
    },
  },
  {
    id: 'pf09',
    display_initial: 'H.', country_code: 'KR', country_label_en: 'Korea',
    concern_slugs: ['acne_scars'],
    concern_labels_en: 'Acne scars',
    treatment_slug: 'frax_co2',
    treatment_label_en: 'CO2 Fractional',
    hospital_slug: 'lienjang_강남점',
    hospital_label_en: 'Lienjang',
    story_en: 'Local follow-up — completed 3-session protocol.',
    outcome: 'completed', outcome_note_en: 'D+30 check-in done',
    displayed_at: minAgo(92),
    case: {
      prefs: { budget_tier: '800_2000', budget_label: '₩800k – ₩2M', downtime_max: 5, pain_max: 4, style_target: 3, style_label: 'Balanced', language: 'ko', notes: '여드름 흉터 3번 세션 진행 후 D+30 결과 점검.' },
      ai_scan: { narrative: 'Acne scarring across the cheek and chin reads moderate — the kind that responds well to fractional CO2 + Rejuran combo.', confidence: 'high', concerns_detected: ['acne_scars'], metrics: { skin_clarity: 56, tone_evenness: 60, under_eye_darkness: 24, jawline_definition: 78, symmetry: 88, youthful_volume: 80 }, regions: [{ label: 'CHEEKS', note: 'mixed atrophic scars' }] },
      synth: { overall: '3세션 후 진피층 텍스처는 확실히 좋아졌어요. D+30 평가 결과도 만족도가 높아 추가 세션 없이 유지관리로 전환 추천.', rationale: '리엔셀 프락셔널 + 리쥬란 콤보 프로토콜이 진피층 흉터 회복에 효과적이었습니다.', closing: '3개월 후 유지관리 권장 — 일정 잡으실 때 알려주세요.' },
      top_match: { procedure_name_en: 'CO2 Fractional', hospital_name_en: 'Lienjang · Gangnam', price_krw: 380000, original_price_krw: 480000, discount_pct: 20, device_brands: ['Lutronic eCO2'] },
    },
  },
  {
    id: 'pf10',
    display_initial: 'Y.', country_code: 'AU', country_label_en: 'Australia',
    concern_slugs: ['volume_loss'],
    concern_labels_en: 'Volume loss',
    treatment_slug: 'filler_ha_cheek',
    treatment_label_en: 'HA Cheek Filler',
    hospital_slug: 'lamiche_청담점',
    hospital_label_en: 'Lamiche',
    story_en: 'Sydney, 2-day Seoul stopover. Asked about same-day social plans.',
    outcome: 'matched', outcome_note_en: null,
    displayed_at: minAgo(110),
    case: {
      prefs: { budget_tier: '800_2000', budget_label: '₩800k – ₩2M', downtime_max: 1, pain_max: 3, style_target: 2, style_label: 'Soft', language: 'en', notes: 'Have a dinner the night of the procedure. Subtle only.' },
      ai_scan: { narrative: 'Slight midface hollowness — natural for your range, very subtle filler refresh suits the brief.', confidence: 'medium', concerns_detected: ['volume_loss'], metrics: { skin_clarity: 80, tone_evenness: 82, under_eye_darkness: 30, jawline_definition: 78, symmetry: 92, youthful_volume: 62 }, regions: [{ label: 'CHEEKS', note: 'midface volume soft' }] },
      synth: { overall: 'For a same-day dinner with no signs of work — small dose HA in the midface, conservative placement. Lamiche\'s VIP track is the right environment.', rationale: 'Lamiche\'s 16-year HA practice supports the discreet, same-day brief — they will use under 2cc total.', closing: 'We\'ll book the earliest slot of your travel day.' },
      top_match: { procedure_name_en: 'HA Cheek Filler', hospital_name_en: 'Lamiche · Cheongdam', price_krw: 900000, original_price_krw: 1200000, discount_pct: 25, device_brands: ['Juvederm'] },
    },
  },
];

// In-memory store. `_userAdded` flag separates real-time additions from seed.
let entries = [...seed];
let listeners = new Set();

// localStorage persistence — survive page refresh for the user's own scans.
const LS_KEY = 'gs_v2_public_feed_local';
function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function saveLocal(local) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(local)); } catch {}
}

if (typeof window !== 'undefined') {
  const local = loadLocal();
  if (local.length) entries = [...local, ...seed];
}

export const publicFeedEntries = entries;

// Fill multilingual label placeholders
seed.forEach((e) => {
  e.country_label_zh = e.country_label_en;
  e.country_label_ja = e.country_label_en;
  e.country_label_ko = e.country_label_en;
  e.treatment_label_zh = e.treatment_label_en;
  e.treatment_label_ja = e.treatment_label_en;
  e.treatment_label_ko = e.treatment_label_en;
  e.outcome_note_zh = e.outcome_note_en;
  e.outcome_note_ja = e.outcome_note_en;
  e.outcome_note_ko = e.outcome_note_en;
  e.is_visible = true;
  e.is_seed = true;
  e.source_type = 'seed';
});

export function getPublicFeedEntries() {
  return entries.filter((e) => e.is_visible !== false);
}

// One-shot hydrate from RDS. Replaces the in-memory seed with rows from
// /api/feed/recent so the homepage shows live entries (including ones added
// via /api/match-requests). Falls back silently when the API isn't ready.
let _hydrated = false;
export async function hydratePublicFeed() {
  if (_hydrated) return entries;
  if (typeof window === 'undefined') return entries;
  try {
    const res = await fetch('/api/feed/recent?limit=30');
    if (!res.ok) return entries;
    const json = await res.json();
    if (!Array.isArray(json.entries) || json.entries.length === 0) return entries;

    // Adapt API row → existing client entry shape (RecentMatches / Ticker read these).
    const adapted = json.entries.map((row) => ({
      id: row.id,
      display_initial: row.display_initial,
      country_code: row.country_code,
      country_label_en: row.country_label_en || row.country_code,
      treatment_label_en: row.treatment_label_en,
      treatment_label_zh: row.treatment_label_zh,
      outcome: row.outcome,
      outcome_note_en: row.outcome_note_en,
      displayed_at: row.displayed_at,
      is_visible: true,
      is_seed: row.is_seed,
      source_type: row.source_type,
    }));

    // Keep any locally-added entries on top (user just submitted), then DB rows.
    const local = entries.filter((e) => !e.is_seed && String(e.id).startsWith('local_'));
    entries = [...local, ...adapted];
    listeners.forEach((fn) => { try { fn(entries); } catch {} });
    _hydrated = true;
  } catch {
    // network failure → keep static seed
  }
  return entries;
}

export function addPublicFeedEntry(entry) {
  const full = {
    ...entry,
    id: entry.id || `local_${Date.now()}`,
    is_visible: true,
    is_seed: false,
    source_type: 'inquiry',
    displayed_at: entry.displayed_at || new Date().toISOString(),
  };
  entries = [full, ...entries];

  if (typeof window !== 'undefined') {
    const local = loadLocal();
    saveLocal([full, ...local].slice(0, 20));
  }
  listeners.forEach((fn) => { try { fn(entries); } catch {} });
  return full;
}

export function subscribeFeed(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function clearLocalFeed() {
  entries = entries.filter((e) => e.is_seed);
  if (typeof window !== 'undefined') saveLocal([]);
  listeners.forEach((fn) => { try { fn(entries); } catch {} });
}
