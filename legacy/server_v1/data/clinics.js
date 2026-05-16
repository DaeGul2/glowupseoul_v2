// Mock 병원 DB — 10개 강남/청담/압구정 뷰티 클리닉
// 각 시술: concerns(고민 키워드), originalPrice, eventPrice, downtimeDays, painLevel(1-5), style(1=자연 ~ 5=드라마틱)

export const clinics = [
  {
    id: 'c01',
    name: '강남 글로우 피부과',
    area: '강남',
    rating: 4.7,
    description: '톤업·잡티 레이저 특화. 다운타임 짧은 시술 위주.',
    address: '서울 강남구 테헤란로 123',
    heroImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=80',
    highlights: ['10년 이상 경력 원장', '점심시간 시술 가능', '외국인 통역 지원'],
    treatments: [
      {
        id: 't01-1',
        name: '피코토닝 10회',
        concerns: ['잡티', '색소', '피부톤', '기미'],
        originalPrice: 1200000,
        eventPrice: 690000,
        downtimeDays: 0,
        painLevel: 2,
        style: 1,
        description: '톤업·기미 완화. 메이크업 바로 가능.'
      },
      {
        id: 't01-2',
        name: '제네시스 5회',
        concerns: ['모공', '홍조', '피부결'],
        originalPrice: 750000,
        eventPrice: 390000,
        downtimeDays: 0,
        painLevel: 1,
        style: 1,
        description: '진정·모공축소. 통증 거의 없음.'
      }
    ]
  },
  {
    id: 'c02',
    name: '청담 라운드 성형외과',
    area: '청담',
    rating: 4.8,
    description: '윤곽·리프팅 중심. 드라마틱한 변화 추구 환자 다수.',
    address: '서울 강남구 도산대로 456',
    heroImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80',
    highlights: ['윤곽수술 전문의 3인', '입원실 완비', '한·영·중 통역'],
    treatments: [
      {
        id: 't02-1',
        name: '울쎄라 600샷',
        concerns: ['처짐', '리프팅', '턱선', '주름'],
        originalPrice: 2500000,
        eventPrice: 1490000,
        downtimeDays: 2,
        painLevel: 4,
        style: 3,
        description: '깊은 층까지 리프팅. 약간의 부기 가능.'
      },
      {
        id: 't02-2',
        name: '광대축소술',
        concerns: ['윤곽', '광대', '얼굴축소'],
        originalPrice: 6500000,
        eventPrice: 5800000,
        downtimeDays: 14,
        painLevel: 5,
        style: 5,
        description: '뼈 절골. 회복기 길지만 변화 큼.'
      }
    ]
  },
  {
    id: 'c03',
    name: '압구정 미라클 피부과',
    area: '압구정',
    rating: 4.6,
    description: '모공·여드름·흉터 전문. 20-30대 중심.',
    address: '서울 강남구 압구정로 789',
    heroImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1200&q=80',
    highlights: ['트러블 케이스 5,000+', '맞춤 홈케어 처방', '재방문율 87%'],
    treatments: [
      {
        id: 't03-1',
        name: '인모드 FSR 3회',
        concerns: ['모공', '여드름흉터', '피부결'],
        originalPrice: 900000,
        eventPrice: 520000,
        downtimeDays: 1,
        painLevel: 3,
        style: 2,
        description: '모공·흉터 동시 개선. 약간의 붉음.'
      },
      {
        id: 't03-2',
        name: '여드름 압출+레이저 패키지',
        concerns: ['여드름', '트러블', '피지'],
        originalPrice: 350000,
        eventPrice: 180000,
        downtimeDays: 0,
        painLevel: 2,
        style: 1,
        description: '진정·재생 패키지.'
      }
    ]
  },
  {
    id: 'c04',
    name: '신사 비너스 클리닉',
    area: '신사',
    rating: 4.5,
    description: '필러·보톡스·스킨부스터 비수술 전문.',
    address: '서울 강남구 신사동 12-34',
    heroImage: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=80',
    highlights: ['정품 필러만 사용', '여성 전담 의료진', '주말 진료'],
    treatments: [
      {
        id: 't04-1',
        name: '리쥬란 힐러 2cc',
        concerns: ['피부결', '탄력', '잔주름'],
        originalPrice: 700000,
        eventPrice: 390000,
        downtimeDays: 1,
        painLevel: 3,
        style: 1,
        description: '피부재생. 자연스러운 결 개선.'
      },
      {
        id: 't04-2',
        name: '턱끝 필러 1cc',
        concerns: ['턱선', '윤곽', '무턱'],
        originalPrice: 600000,
        eventPrice: 350000,
        downtimeDays: 1,
        painLevel: 3,
        style: 3,
        description: '옆모습 라인 보정.'
      },
      {
        id: 't04-3',
        name: '보톡스 사각턱',
        concerns: ['턱선', '얼굴축소', '윤곽'],
        originalPrice: 200000,
        eventPrice: 89000,
        downtimeDays: 0,
        painLevel: 2,
        style: 2,
        description: '저작근 축소. 2-3주 후 효과.'
      }
    ]
  },
  {
    id: 'c05',
    name: '강남 퓨어라인 의원',
    area: '강남',
    rating: 4.7,
    description: '"티 안 나게 예뻐지는" 자연스러움 추구.',
    address: '서울 강남구 강남대로 555',
    heroImage: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=1200&q=80',
    highlights: ['자연주의 시술 컨셉', 'After-care 1년 보장', '비절개 전문'],
    treatments: [
      {
        id: 't05-1',
        name: '눈밑 지방재배치 (비절개)',
        concerns: ['눈', '다크서클', '눈밑꺼짐'],
        originalPrice: 1800000,
        eventPrice: 1290000,
        downtimeDays: 5,
        painLevel: 3,
        style: 2,
        description: '비절개로 다크서클 개선.'
      },
      {
        id: 't05-2',
        name: '입술 필러 1cc',
        concerns: ['입술', '볼륨'],
        originalPrice: 500000,
        eventPrice: 290000,
        downtimeDays: 2,
        painLevel: 3,
        style: 2,
        description: '자연스러운 볼륨감.'
      }
    ]
  },
  {
    id: 'c06',
    name: '청담 셀렙 성형외과',
    area: '청담',
    rating: 4.9,
    description: '드라마틱한 변화 — 양악·코 재수술 강점.',
    address: '서울 강남구 청담동 88-1',
    heroImage: 'https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?w=1200&q=80',
    highlights: ['연예인 시술 다수', '재수술 50% 이상', '24시간 케어 라운지'],
    treatments: [
      {
        id: 't06-1',
        name: '코 재수술 (실리콘+귀연골)',
        concerns: ['코', '윤곽'],
        originalPrice: 8500000,
        eventPrice: 7900000,
        downtimeDays: 14,
        painLevel: 5,
        style: 5,
        description: '코끝 + 콧대 종합. 회복 2주.'
      },
      {
        id: 't06-2',
        name: '앞트임+뒤트임',
        concerns: ['눈', '윤곽'],
        originalPrice: 2800000,
        eventPrice: 2390000,
        downtimeDays: 7,
        painLevel: 4,
        style: 4,
        description: '눈매 또렷하게.'
      }
    ]
  },
  {
    id: 'c07',
    name: '강남 케어플러스 피부과',
    area: '강남',
    rating: 4.4,
    description: '점심시간 시술 — 다운타임 0일 시술 특화.',
    address: '서울 강남구 역삼로 200',
    heroImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80',
    highlights: ['평균 시술 시간 30분', '직장인 대상 패키지', '예약 100% 정시 진행'],
    treatments: [
      {
        id: 't07-1',
        name: '슈링크 유니버스 300샷',
        concerns: ['리프팅', '처짐', '탄력'],
        originalPrice: 800000,
        eventPrice: 290000,
        downtimeDays: 0,
        painLevel: 3,
        style: 2,
        description: '약한 리프팅. 점심시간 가능.'
      },
      {
        id: 't07-2',
        name: '엑소좀 부스터 3회',
        concerns: ['피부결', '탄력', '재생'],
        originalPrice: 600000,
        eventPrice: 330000,
        downtimeDays: 0,
        painLevel: 1,
        style: 1,
        description: '피부속 광채.'
      }
    ]
  },
  {
    id: 'c08',
    name: '압구정 디바인 클리닉',
    area: '압구정',
    rating: 4.6,
    description: '리프팅 종합 — 슈링크부터 실리프팅까지.',
    address: '서울 강남구 논현로 320',
    heroImage: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1200&q=80',
    highlights: ['리프팅 누적 8,000건', '맞춤 조합 시술', '40-60대 케이스 풍부'],
    treatments: [
      {
        id: 't08-1',
        name: '실리프팅 (코그실 20개)',
        concerns: ['처짐', '리프팅', '턱선'],
        originalPrice: 1500000,
        eventPrice: 990000,
        downtimeDays: 4,
        painLevel: 4,
        style: 3,
        description: '즉각적 리프팅. 부기 3-4일.'
      },
      {
        id: 't08-2',
        name: '리니어 Z 리프팅',
        concerns: ['처짐', '리프팅', '주름'],
        originalPrice: 1100000,
        eventPrice: 690000,
        downtimeDays: 1,
        painLevel: 3,
        style: 2,
        description: '슈링크보다 강한 리프팅.'
      }
    ]
  },
  {
    id: 'c09',
    name: '강남 모드 의원',
    area: '강남',
    rating: 4.5,
    description: '비수술 코·눈 — 시술로 보완하는 컨셉.',
    address: '서울 강남구 봉은사로 100',
    heroImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=1200&q=80',
    highlights: ['수술 없이 변화', '3D 시뮬레이션 상담', '필러·매몰 특화'],
    treatments: [
      {
        id: 't09-1',
        name: '코필러 1cc',
        concerns: ['코', '윤곽'],
        originalPrice: 700000,
        eventPrice: 390000,
        downtimeDays: 1,
        painLevel: 3,
        style: 3,
        description: '비수술 코높임. 즉시 효과.'
      },
      {
        id: 't09-2',
        name: '쌍꺼풀 매몰법',
        concerns: ['눈', '윤곽'],
        originalPrice: 1500000,
        eventPrice: 990000,
        downtimeDays: 5,
        painLevel: 3,
        style: 3,
        description: '비절개 쌍꺼풀.'
      }
    ]
  },
  {
    id: 'c10',
    name: '청담 르네상스 성형외과',
    area: '청담',
    rating: 4.7,
    description: '종합 성형 — 윤곽·코·눈 복합 디자인.',
    address: '서울 강남구 청담동 77-2',
    heroImage: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=1200&q=80',
    highlights: ['멀티 시술 디자인', '해외 환자 30%+', '회복기 라운지'],
    treatments: [
      {
        id: 't10-1',
        name: '안면윤곽 V라인 (턱끝+사각턱)',
        concerns: ['윤곽', '턱선', '얼굴축소'],
        originalPrice: 9500000,
        eventPrice: 8500000,
        downtimeDays: 21,
        painLevel: 5,
        style: 5,
        description: '광범위 윤곽수술. 회복 3주+.'
      },
      {
        id: 't10-2',
        name: '지방이식 (이마+볼)',
        concerns: ['볼륨', '윤곽', '꺼짐'],
        originalPrice: 4500000,
        eventPrice: 3290000,
        downtimeDays: 10,
        painLevel: 4,
        style: 3,
        description: '자가지방 이식. 부기 1-2주.'
      }
    ]
  }
];

// 모든 시술을 단일 배열로 펼친 헬퍼 (매칭에 사용)
export function getAllTreatments() {
  return clinics.flatMap(c =>
    c.treatments.map(t => ({
      ...t,
      clinicId: c.id,
      clinicName: c.name,
      clinicArea: c.area,
      clinicRating: c.rating,
      clinicAddress: c.address,
      clinicHeroImage: c.heroImage,
      clinicDescription: c.description,
      clinicHighlights: c.highlights
    }))
  );
}
