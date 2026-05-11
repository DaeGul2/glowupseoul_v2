// 아윤클리닉 강남 — ayunclinic.com 파싱 데이터 → xlsx
// 가격은 사이트 비공개. "consult"로 표기하거나 시장 평균 추정치 사용 (Note 컬럼에 명시).
const XLSX = require('xlsx');
const path = require('path');

const clinic = {
  id: 'c11',
  name: '아윤의원 강남',
  nameEn: 'AYUN Clinic Gangnam',
  area: '강남',
  rating: '비공개',
  description: '1:1 프라이빗 시스템 · 자연스러운 결과 추구 · SMAS 리프팅/윤곽/스킨부스터 종합',
  address: '서울 강남구 (사이트 미표기)',
  phone: '사이트 미표기',
  heroImage: 'https://ayunclinic.com/',
  highlights: '1:1 프라이빗 시스템 / 자연주의 결과 컨셉 / MetaView·MarkView 정밀 진단 / 프리미엄 장비',
  sourceUrl: 'https://ayunclinic.com/'
};

const treatments = [
  {
    treatmentId: 't11-1',
    clinicId: 'c11',
    clinicName: clinic.name,
    name: '울쎄라 프라임',
    nameEn: 'Ultherapy PRIME',
    category: '리프팅',
    concerns: '리프팅, 처짐, 주름(눈가/팔자/잔주름), 탄력, 턱선',
    targetAreas: '눈가, 이마, 입가, 볼, 턱선, 전체 얼굴, 이중턱',
    originalPrice: '상담 (Consult)',
    eventPrice: '상담 (Consult)',
    marketEstimate: '600샷 기준 정가 약 2,500,000원, 이벤트가 1,400,000~1,800,000원',
    downtimeDays: 0,
    downtimeNote: '메이크업·세안 즉시 가능. 약간의 붉어짐 가능',
    painLevel: 3,
    painNote: '이전 모델보다 통증 줄어듦',
    style: 2,
    styleNote: '자연스러운 점진적 개선 (2-3개월에 걸쳐 콜라겐 재생)',
    description: '고강도 집속 초음파(HIFU)로 SMAS층까지 정밀 전달, 콜라겐 재생 + 리프팅',
    sessions: '1회 시술 + 유지관리',
    sourceUrl: 'https://ayunclinic.com/html/procedure/ultherapy.html'
  },
  {
    treatmentId: 't11-2',
    clinicId: 'c11',
    clinicName: clinic.name,
    name: '써마지 FLX',
    nameEn: 'Thermage FLX',
    category: '리프팅·탄력',
    concerns: '탄력저하, 처짐, 잔주름(눈가/입가), 모공, 피부결, 눈꺼풀 처짐',
    targetAreas: '눈/눈꺼풀(Eye Tip), 전체 얼굴(Face Tip)',
    originalPrice: '상담 (Consult)',
    eventPrice: '상담 (Consult)',
    marketEstimate: '600샷 정가 약 3,500,000원, 이벤트가 1,800,000~2,500,000원',
    downtimeDays: 0,
    downtimeNote: '비침습. 일상 즉시 복귀',
    painLevel: 3,
    painNote: '마취크림/통증완화IV/국소마취 3옵션 제공',
    style: 2,
    styleNote: '"자연스럽게, 그러나 확실하게" — 점진적 개선',
    description: '6.78MHz 고주파(RF)로 진피층 콜라겐 수축·재생. 표피 보호',
    sessions: '연 1-4회 권장',
    sourceUrl: 'https://ayunclinic.com/html/procedure/thermage.html'
  },
  {
    treatmentId: 't11-3',
    clinicId: 'c11',
    clinicName: clinic.name,
    name: '페이스 컨투어 (필러)',
    nameEn: 'Face Contour (Filler)',
    category: '윤곽·볼륨',
    concerns: '깊은 주름, 볼륨 부족, 윤곽 부족, 처짐, 광대, 턱선',
    targetAreas: '볼, 관자놀이, 턱선 외 윤곽 전반',
    originalPrice: '상담 (Consult)',
    eventPrice: '상담 (Consult)',
    marketEstimate: '1cc 기준 약 600,000원~ (제품별 상이)',
    downtimeDays: 1,
    downtimeNote: '대부분 즉시 일상 복귀. 2주간 강한 운동/음주 자제',
    painLevel: 3,
    painNote: '주사 부위 미세 멍/부기 가능',
    style: 3,
    styleNote: '"자연스럽고 균형 잡힌 아름다움" — 디자인 맞춤',
    description: '히알루론산 필러로 3D 볼륨 디자인. Juvederm/Belotero/Restylane 3종 운용',
    sessions: '단회 + 6-12개월 후 재시술',
    sourceUrl: 'https://ayunclinic.com/html/procedure/facialContouring.html'
  },
  {
    treatmentId: 't11-4',
    clinicId: 'c11',
    clinicName: clinic.name,
    name: '리버스 부스터',
    nameEn: 'Rebirth Booster',
    category: '스킨부스터',
    concerns: '건조, 잔주름, 탄력저하, 피부결, 홍조, 색소, 모공',
    targetAreas: '전체 얼굴',
    originalPrice: '상담 (Consult)',
    eventPrice: '상담 (Consult)',
    marketEstimate: '1회 약 350,000~500,000원, 3회 패키지 900,000원~',
    downtimeDays: 1,
    downtimeNote: '2-3일 내 자국·홍조 사라짐. 미세 부기·멍 가능',
    painLevel: 2,
    painNote: '주사 통증 외 특이사항 없음',
    style: 1,
    styleNote: '"과하지 않고 부드럽게 스며듦" — 가장 자연스러움',
    description: '3D 영상(MetaView) + 정밀 분석(MarkView)으로 개인 맞춤 스킨부스터 디자인. 층별 주입',
    sessions: '3-4주 간격 3회+ 권장',
    sourceUrl: 'https://ayunclinic.com/html/procedure/rebirthBooster.html'
  }
];

// ── Clinic 시트 ──
const clinicRows = [clinic];
const wsClinic = XLSX.utils.json_to_sheet(clinicRows, {
  header: [
    'id', 'name', 'nameEn', 'area', 'rating', 'description',
    'address', 'phone', 'heroImage', 'highlights', 'sourceUrl'
  ]
});
wsClinic['!cols'] = [
  { wch: 6 }, { wch: 18 }, { wch: 22 }, { wch: 8 }, { wch: 10 },
  { wch: 60 }, { wch: 28 }, { wch: 14 }, { wch: 30 }, { wch: 60 }, { wch: 36 }
];

// ── Treatments 시트 ──
const wsTreatments = XLSX.utils.json_to_sheet(treatments, {
  header: [
    'treatmentId', 'clinicId', 'clinicName',
    'name', 'nameEn', 'category',
    'concerns', 'targetAreas',
    'originalPrice', 'eventPrice', 'marketEstimate',
    'downtimeDays', 'downtimeNote',
    'painLevel', 'painNote',
    'style', 'styleNote',
    'description', 'sessions', 'sourceUrl'
  ]
});
wsTreatments['!cols'] = [
  { wch: 10 }, { wch: 8 }, { wch: 18 },
  { wch: 18 }, { wch: 22 }, { wch: 12 },
  { wch: 50 }, { wch: 30 },
  { wch: 14 }, { wch: 14 }, { wch: 50 },
  { wch: 12 }, { wch: 40 },
  { wch: 10 }, { wch: 28 },
  { wch: 8 }, { wch: 50 },
  { wch: 60 }, { wch: 28 }, { wch: 60 }
];

// ── Schema 시트 (필드 정의) ──
const schema = [
  { field: 'id', meaning: '병원 고유 ID (예: c11)' },
  { field: 'name / nameEn', meaning: '병원명 (한·영)' },
  { field: 'area', meaning: '강남/청담/압구정/신사 등 지역' },
  { field: 'rating', meaning: '평점 (구글/네이버/플랫폼별 통합 추정)' },
  { field: 'description', meaning: '병원 한 줄 컨셉' },
  { field: 'address', meaning: '주소' },
  { field: 'phone', meaning: '대표 번호' },
  { field: 'heroImage', meaning: '병원 대표 이미지 URL' },
  { field: 'highlights', meaning: '강점 키워드 (멀티 값, "/" 구분)' },
  { field: '──── 시술 ────', meaning: '' },
  { field: 'treatmentId', meaning: '시술 고유 ID (예: t11-1)' },
  { field: 'clinicId', meaning: '소속 병원 id 외래키' },
  { field: 'name / nameEn', meaning: '시술명 (한·영)' },
  { field: 'category', meaning: '리프팅/윤곽/스킨부스터/레이저 등' },
  { field: 'concerns', meaning: '해결 가능한 고민 키워드 (콤마 구분)' },
  { field: 'targetAreas', meaning: '타겟 부위' },
  { field: 'originalPrice', meaning: '정가 (없으면 "상담")' },
  { field: 'eventPrice', meaning: '이벤트가/할인가' },
  { field: 'marketEstimate', meaning: '시장 평균 추정 (원본 미공개 시 참고)' },
  { field: 'downtimeDays', meaning: '회복 일수 (0=다운타임 없음)' },
  { field: 'painLevel', meaning: '통증 1(아주 약함) ~ 5(매우 강함)' },
  { field: 'style', meaning: '결과 스타일 1(자연) ~ 5(드라마틱)' },
  { field: 'description', meaning: '시술 한 줄 설명 / 작동 원리' },
  { field: 'sessions', meaning: '권장 횟수/주기' },
  { field: 'sourceUrl', meaning: '원본 URL' }
];
const wsSchema = XLSX.utils.json_to_sheet(schema, { header: ['field', 'meaning'] });
wsSchema['!cols'] = [{ wch: 22 }, { wch: 70 }];

// ── 워크북 ──
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, wsClinic, 'Clinic');
XLSX.utils.book_append_sheet(wb, wsTreatments, 'Treatments');
XLSX.utils.book_append_sheet(wb, wsSchema, 'Schema');

const out = path.join(__dirname, '..', 'ayunclinic_parsed.xlsx');
XLSX.writeFile(wb, out);
console.log('wrote:', out);
