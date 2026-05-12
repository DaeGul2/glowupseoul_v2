// hospitals — one row per branch. 22 brands × 1 location (chains kept as 1 branch for MVP).
// 모든 필드 schema.sql 매칭.

const heroPool = [
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583311270825-92d28b95bdb4?w=1600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1600&q=80&auto=format&fit=crop',
];
const thumbPool = [
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1610925715846-3ed4ed9d4fb6?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571066811602-716837d681de?w=800&q=80&auto=format&fit=crop',
];

const seed = [
  // id, brand_slug, branch, area(district/neighborhood), languages, intl features, established, ba_count, claim, phone, kakao/wechat/whatsapp/line, contract_status, foreign_case_monthly
  { brand: 'soi',          branch: '강남점',  district: '강남구', neighborhood: '역삼동',  city: '서울', languages: ['ko','en','zh'],         intl: true,  english: true,  est: 2014, ba: 1200, claim: '직각어깨 필러 누적 시술 8,000회+',                phone: '02-555-2424',  kakao: 'soiclinic24',     contract: 'active',     foreign: 90 },
  { brand: 'vellicell',    branch: '강남점',  district: '강남구', neighborhood: '논현동',  city: '서울', languages: ['ko','en','zh','ja'],     intl: true,  english: false, est: 2012, ba: 800,  claim: '슈링크·인모드 누적 5만회',                       phone: '02-3018-3300', kakao: 'vellicell',       contract: 'active',     foreign: 60 },
  { brand: 'ayun',         branch: '청담점',  district: '강남구', neighborhood: '청담동',  city: '서울', languages: ['ko','en','zh'],          intl: true,  english: false, est: 2015, ba: 450,  claim: '울쎄라 + 써마지 듀얼 라인업',                    phone: '02-512-7575',  kakao: 'ayunclinic',      contract: 'active',     foreign: 40 },
  { brand: 'dewyd',        branch: '강남점',  district: '강남구', neighborhood: '신사동',  city: '서울', languages: ['ko','en'],               intl: false, english: false, est: 2020, ba: 200,  claim: '수분·재생 페이셜 특화',                          phone: '02-518-1010',  kakao: 'dewyd',           contract: 'active',     foreign: 20 },
  { brand: 'lamiche',      branch: '청담점',  district: '강남구', neighborhood: '청담동',  city: '서울', languages: ['ko','en','zh'],          intl: true,  english: true,  est: 2011, ba: 950,  claim: 'VIP 멤버십 운영, 강남 16년',                     phone: '02-512-7799',  kakao: 'lamiche',         contract: 'active',     foreign: 110 },
  { brand: 'wooamedical',  branch: '강남점',  district: '강남구', neighborhood: '신사동',  city: '서울', languages: ['ko','en','zh'],          intl: true,  english: true,  est: 2013, ba: 1100, claim: '얼굴윤곽 누적 1만회',                            phone: '02-545-2014',  kakao: 'wooamedical',     contract: 'active',     foreign: 70 },
  { brand: 'wannabe',      branch: '강남점',  district: '강남구', neighborhood: '신사동',  city: '서울', languages: ['ko','en','zh','ja'],     intl: true,  english: true,  est: 2017, ba: 700,  claim: '코·쌍커풀 재수술 30%',                           phone: '02-516-7570',  kakao: 'wannabeps',       contract: 'active',     foreign: 50 },
  { brand: 'vannyps',      branch: '강남점',  district: '강남구', neighborhood: '논현동',  city: '서울', languages: ['ko','en'],               intl: false, english: false, est: 2018, ba: 400,  claim: '맞춤 윤곽 디자인',                                phone: '02-545-2828',  kakao: 'vannyps',         contract: 'active',     foreign: 25 },
  { brand: 'hershe',       branch: '청담점',  district: '강남구', neighborhood: '청담동',  city: '서울', languages: ['ko','en','zh','ja','th'], intl: true, english: true,  est: 2008, ba: 2400, claim: '50개국 4만명 0사고',                              phone: '02-3445-1331', wechat: 'hershe_global',  contract: 'active',     foreign: 220 },
  { brand: '365mc',        branch: '강남본원', district: '강남구', neighborhood: '논현동',  city: '서울', languages: ['ko','en','zh','ja'],     intl: true,  english: true,  est: 2003, ba: 5000, claim: '지방흡입 60만건 + 자체 LAMS 술식',                phone: '1855-2475',    kakao: '365mc',           contract: 'active',     foreign: 180 },
  { brand: 'lienjang',     branch: '강남점',  district: '강남구', neighborhood: '역삼동',  city: '서울', languages: ['ko','en','zh','ja','ar'], intl: true, english: true,  est: 2010, ba: 1800, claim: '리엔셀 시그너처 — 6 지점 운영',                  phone: '02-3445-7510', wechat: 'lienjang_global', contract: 'active',     foreign: 250 },
  { brand: 'noselips',     branch: '강남점',  district: '강남구', neighborhood: '신사동',  city: '서울', languages: ['ko','en','zh'],          intl: true,  english: false, est: 2005, ba: 1300, claim: '구순구개열 30년 — 코끝 재수술 1순위',            phone: '02-548-7585',  kakao: 'noselips',        contract: 'active',     foreign: 65 },
  { brand: 'drtunes',      branch: '강남점',  district: '강남구', neighborhood: '논현동',  city: '서울', languages: ['ko','en','zh'],          intl: true,  english: true,  est: 2019, ba: 350,  claim: '패키지형 컨시어지',                              phone: '02-516-9988',  kakao: 'salondedrtunes',  contract: 'active',     foreign: 35 },
  { brand: 'cellora',      branch: '강남점',  district: '강남구', neighborhood: '신사동',  city: '서울', languages: ['ko','en'],               intl: false, english: false, est: 2021, ba: 120,  claim: '재생·스킨부스터 신생 클리닉',                    phone: '02-543-7707',  kakao: 'cellora',         contract: 'active',     foreign: 15 },
  { brand: '1mm',          branch: '강남점',  district: '강남구', neighborhood: '신사동',  city: '서울', languages: ['ko','en','zh','ja'],     intl: true,  english: true,  est: 2016, ba: 500,  claim: '1mm 단위 정밀 — 영문 사이트 운영',                phone: '02-512-1004',  whatsapp: '+82-10-3333-1004', contract: 'active', foreign: 80 },
  { brand: 'eunel',        branch: '강남점',  district: '강남구', neighborhood: '청담동',  city: '서울', languages: ['ko'],                    intl: false, english: false, est: 2022, ba: 80,   claim: '신생 — 1:1 시술',                                phone: '02-548-2400',  kakao: 'eunel',           contract: 'negotiating', foreign: 0 },
  { brand: 'lead',         branch: '강남점',  district: '강남구', neighborhood: '논현동',  city: '서울', languages: ['ko'],                    intl: false, english: false, est: 2020, ba: 150,  claim: '맞춤 디자인',                                    phone: '02-543-8275',  kakao: 'leadps',          contract: 'negotiating', foreign: 0 },
  { brand: 'sunnygarden',  branch: '강남점',  district: '강남구', neighborhood: '논현동',  city: '서울', languages: ['ko'],                    intl: false, english: false, est: 2021, ba: 60,   claim: '자연주의 시술',                                  phone: '02-543-1010',  kakao: 'sunnygarden',     contract: 'negotiating', foreign: 0 },
  { brand: 'drkoops',      branch: '강남점',  district: '강남구', neighborhood: '신사동',  city: '서울', languages: ['ko','en'],               intl: false, english: false, est: 2017, ba: 300,  claim: '닥터쿱스 그림 라인',                              phone: '02-543-7700',  kakao: 'drkoops',         contract: 'negotiating', foreign: 0 },
  { brand: 'thepride',     branch: '강남점',  district: '강남구', neighborhood: '신사동',  city: '서울', languages: ['ko','en'],               intl: false, english: false, est: 2014, ba: 600,  claim: '눈·코 종합',                                     phone: '02-544-9700',  kakao: 'thepride',        contract: 'negotiating', foreign: 0 },
  { brand: 'lienjang_dental', branch: '강남점', district: '강남구', neighborhood: '역삼동', city: '서울', languages: ['ko','en','zh'],          intl: true,  english: true,  est: 2015, ba: 400,  claim: '리엔장 치과 — 임플란트·교정',                    phone: '02-3445-2222', kakao: 'lienjang_dental', contract: 'active',     foreign: 30 },
  { brand: 'centumcore',   branch: '센텀점',  district: '해운대구', neighborhood: '마린시티', city: '부산', languages: ['ko','en','zh','ja','ru'], intl: true, english: true,  est: 2016, ba: 600,  claim: '부산 외국 환자 1위',                              phone: '051-731-7575', kakao: 'centumcore',      contract: 'active',     foreign: 95 },
];

export const hospitals = seed.map((s, i) => ({
  id: i + 1,
  // Keep Korean characters in slug so hospital_procedures seed lookups by `${brand}_${branch}` match.
  slug: `${s.brand}_${s.branch}`,
  brand_id: null, // resolved below
  brand_slug: s.brand, // helper for resolution
  branch_name: s.branch,
  name_ko: '', // resolved from brand
  name_en: '',
  name_zh: '',
  name_ja: '',
  country: 'KR', city: s.city, district: s.district, neighborhood: s.neighborhood,
  full_address_ko: `${s.city} ${s.district} ${s.neighborhood} (${s.brand} ${s.branch})`,
  full_address_en: `${s.neighborhood}, ${s.district}, ${s.city}, Korea`,
  lat: null, lng: null,
  phone: s.phone || null,
  email: null,
  kakao_id: s.kakao || null,
  wechat_id: s.wechat || null,
  whatsapp: s.whatsapp || null,
  line_id: null,
  website_url: null, // resolved from brand
  languages_supported: s.languages,
  has_intl_coordinator: s.intl,
  has_interpreter: s.intl,
  interpreter_languages: s.intl ? s.languages.filter((l) => l !== 'ko') : [],
  english_doctor: s.english,
  female_doctor_available: i % 2 === 0,
  accepts_foreign_card: s.intl,
  airport_pickup: s.intl && s.foreign > 50,
  recovery_lodging_partner: s.intl && s.foreign > 80,
  halal_friendly: s.languages.includes('ar') || s.languages.includes('id'),
  private_room_available: s.foreign > 30,
  anesthesiologist_onsite: s.foreign > 100 || s.brand === '365mc' || s.brand.includes('lienjang'),
  ba_gallery_url: `${s.brand}-ba-gallery`,
  ba_photo_count: s.ba,
  doctor_profile_url: `${s.brand}-doctors`,
  safety_claim: s.claim,
  foreign_case_volume_monthly: s.foreign,
  established_year: s.est,
  external_review_links: {
    naver: `https://map.naver.com/v5/search/${encodeURIComponent(s.brand)}`,
    instagram: `https://instagram.com/${s.brand.replace(/[^a-z0-9]/g,'')}`,
  },
  thumbnail_url: thumbPool[i % thumbPool.length],
  hero_image_url: heroPool[i % heroPool.length],
  gallery_urls: [thumbPool[(i+1)%5], thumbPool[(i+2)%5], heroPool[(i+1)%5]],
  thumbnail_alt_ko: `${s.brand} 외관`,
  thumbnail_alt_en: `${s.brand} clinic exterior`,
  contract_status: s.contract,
  commission_pct: s.contract === 'active' ? 15 : null,
  notes: null,
  is_active: true,
  created_at: '2026-05-12T00:00:00Z',
  updated_at: '2026-05-12T00:00:00Z',
}));

// Resolve brand_id, names, website from brands
import { brandBySlug } from './brands.js';
hospitals.forEach((h) => {
  const b = brandBySlug[h.brand_slug];
  if (!b) throw new Error(`No brand for ${h.brand_slug}`);
  h.brand_id = b.id;
  h.name_ko = b.name_ko;
  h.name_en = b.name_en;
  h.name_zh = b.name_zh;
  h.name_ja = b.name_ja;
  h.website_url = b.website_url;
});

export const hospitalBySlug = Object.fromEntries(hospitals.map((h) => [h.slug, h]));
export const hospitalById = Object.fromEntries(hospitals.map((h) => [h.id, h]));
