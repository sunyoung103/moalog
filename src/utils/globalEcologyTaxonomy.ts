// Global Biogeographical Realm, IUCN ISSG/GISD Invasive Alien Species Standards,
// and Category-Specific Ecological Niche Classification Engine

export type BiogeographicRealm =
  | 'Palearctic' // 구북구 (유라시아 북부, 한반도, 일본, 유럽)
  | 'Nearctic' // 신북구 (북아메리카, 알래스카, 캐나다, 미국)
  | 'Neotropical' // 신열대구 (중남미, 아마존, 갈라파고스, 안데스)
  | 'Afrotropical' // 에티오피아구 (아프리카 사하라 이남, 마다가스카르)
  | 'Indomalayan' // 동양구 (인도, 동남아시아, 인도네시아 열대림)
  | 'Australasian' // 오스트레일리아구 (호주, 뉴질랜드, 뉴기니)
  | 'Antarctic' // 남극구 (남극 대륙 및 아남극 제도)
  | 'Oceanian' // 오세아니아구 (태평양 제도)
  | 'IndoPacificReef' // 인도-태평양 산호초 해역
  | 'GlobalPelagic' // 전세계 외양/원양 부유계
  | 'Cosmopolitan'; // 범세계적 분포

export interface IucnTierMeta {
  code: 'CR' | 'EN' | 'VU' | 'NT' | 'LC' | 'DD' | 'NE';
  nameKo: string;
  shortBadge: string;
  letterGrade: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotBg: string;
  description: string;
}

export const IUCN_TIERS: Record<string, IucnTierMeta> = {
  CR: {
    code: 'CR',
    nameKo: '위급',
    shortBadge: '🟣 위급 · 등급 5 (CR)',
    letterGrade: '등급 5 (CR)',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-900',
    badgeBorder: 'border-rose-300',
    dotBg: 'bg-rose-600',
    description: '야생 절멸 직전의 극심한 멸종 위기에 직면한 최고 수준의 위기 등급 (API 등급 5). 긴급 인공 증식 및 강력한 법적 보호가 필요합니다.',
  },
  EN: {
    code: 'EN',
    nameKo: '위기',
    shortBadge: '🔴 위기 · 등급 4 (EN)',
    letterGrade: '등급 4 (EN)',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-900',
    badgeBorder: 'border-orange-300',
    dotBg: 'bg-orange-600',
    description: '서식지 파괴나 남획 등으로 야생 개체수가 급감하여 멸종 위험이 매우 높은 멸종위기 등급 (API 등급 4).',
  },
  VU: {
    code: 'VU',
    nameKo: '취약',
    shortBadge: '🟠 취약 · 등급 3 (VU)',
    letterGrade: '등급 3 (VU)',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    dotBg: 'bg-amber-500',
    description: '서식지 훼손이나 개체군 감소 추세로 인해 야생에서 중기적 멸종 위험이 높은 취약 등급 (API 등급 3).',
  },
  NT: {
    code: 'NT',
    nameKo: '준위협',
    shortBadge: '🟡 준위협 · 등급 2 (NT)',
    letterGrade: '등급 2 (NT)',
    badgeBg: 'bg-lime-50',
    badgeText: 'text-lime-900',
    badgeBorder: 'border-lime-300',
    dotBg: 'bg-lime-500',
    description: '현재는 멸종 위기가 아니지만 서식지 환경 악화 시 위협 등급으로 진행될 수 있는 단계 (API 등급 2).',
  },
  LC: {
    code: 'LC',
    nameKo: '안전',
    shortBadge: '🟢 안전 · 등급 1 (LC)',
    letterGrade: '등급 1 (LC)',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-300',
    dotBg: 'bg-emerald-500',
    description: '전 세계 및 국내 서식지에서 개체수가 풍부하고 안정적으로 분포하여 당장 멸종 위협을 받지 않는 등급 (API 등급 1).',
  },
  DD: {
    code: 'DD',
    nameKo: '정보부족',
    shortBadge: '⚪ 정보부족 · DD',
    letterGrade: '등급 ? (DD)',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300',
    dotBg: 'bg-slate-400',
    description: '자생 개체군의 분포 범위나 위협 요인에 대한 추가 학술 조사와 데이터 축적이 진행 중인 상태입니다.',
  },
};

export function getIucnTierMeta(category: string | null | undefined): IucnTierMeta | null {
  if (!category) return null;
  return IUCN_TIERS[category] || null;
}

export interface GlobalEcoStatusProfile {
  realm: BiogeographicRealm;
  realmNameKo: string;
  nativeRange: string;
  isEndemic: boolean;
  endemicRegionName?: string;
  isInvasiveGlobal: boolean;
  isNaturalized?: boolean;
  invasiveDatabase?: 'IUCN_GISD_100' | 'CABI_INVASIVE' | 'CITES_MONITORED' | 'REGIONAL_INTRODUCED' | 'KNA_NATURALIZED';
  iucnCategory: 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'EW' | 'EX' | 'DD' | 'NE' | null;
  iucnLabel: string;
  tierMeta?: IucnTierMeta | null;
  citesAppendix?: 'CITES I' | 'CITES II' | 'CITES III';
  hasSlot4: boolean;
  hasConservationData: boolean;
  
  // Category-specific core niche
  slot4Label: string;
  slot4Val: string;
  slot4Theme: 'normal' | 'warning' | 'endemic' | 'disturber' | 'naturalized';
  slot4BadgeText: string;
  slot4DetailTitle: string;
  slot4DetailedNarrative: string;
  slot4DataSource: string;
  slot4DbCode: string;
}

// 1. Explicit species-specific global database for curated specimens
interface SpecimenGlobalOverride {
  realm: BiogeographicRealm;
  realmNameKo: string;
  nativeRange: string;
  iucnCategory: 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'EW' | 'EX' | 'DD' | 'NE';
  iucnLabel: string;
  slot4Label: string;
  slot4Val: string;
  slot4Theme: 'normal' | 'warning' | 'endemic' | 'disturber' | 'naturalized';
  slot4BadgeText: string;
  slot4DetailTitle: string;
  slot4DetailedNarrative: string;
  slot4DataSource: string;
  slot4DbCode: string;
}

const KNOWN_GLOBAL_SPECIMENS: Record<string, SpecimenGlobalOverride> = {
  '흰머리수리': {
    realm: 'Nearctic',
    realmNameKo: '신북구 (Nearctic Realm)',
    nativeRange: '북아메리카 대륙(미국, 캐나다, 알래스카) 하천 및 해안가',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (Least Concern, 개체군 완전 회복)',
    slot4Label: '맹금·비행',
    slot4Val: '급강하 맹금 · LC',
    slot4Theme: 'normal',
    slot4BadgeText: '🦅 시속 160km 급강하 수면 사냥',
    slot4DetailTitle: '북미 최상위 맹금류의 공기역학적 수면 사냥 & 교목 영소 생태',
    slot4DetailedNarrative: '흰머리수리(Haliaeetus leucocephalus)는 신북구(북미 대륙) 전역의 하천·호수·해안가 침엽수림에 서식하는 대형 맹금류입니다. 익폭 최대 2.3m의 거대한 날개로 상승 기류를 타고 활공하다가 시속 160km로 급강하하여 수면의 연어 등 대형 어류를 날카로운 발톱으로 낚아챕니다. 지름 최대 3m, 무게 1톤에 달하는 거대한 둥지(Aerie)를 거목 꼭대기에 지어 해마다 보수하며 번식합니다.',
    slot4DataSource: 'US Fish & Wildlife Service & IUCN Red List (Birds of North America)',
    slot4DbCode: 'USFWS-EAGLE-US',
  },
  '토코투칸': {
    realm: 'Neotropical',
    realmNameKo: '신열대구 (Neotropical Realm)',
    nativeRange: '남아메리카 중부·동부(브라질 세하두, 볼리비아, 아르헨티나)',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (Least Concern)',
    slot4Label: '체온·섭식',
    slot4Val: '열교환 부리 · LC',
    slot4Theme: 'normal',
    slot4BadgeText: '🦜 열 방출 라디에이터 부리',
    slot4DetailTitle: '케라틴 거대 부리의 열교환(Thermal Radiator) 및 종자 분산 생태',
    slot4DetailedNarrative: '체장의 3분의 1을 차지하는 20cm의 거대한 부리는 케라틴과 뼈의 격자망 스펀지 구조로 놀랍도록 가볍습니다. 부리 내부 혈관망의 혈류를 조절하여 체온을 방출하는 천연 라디에이터 역할을 수행하며, 열대림 수관부의 과일을 채식하고 씨앗을 멀리 배설하는 핵심적인 산림 종자 확산자(Seed Disperser)입니다.',
    slot4DataSource: 'BirdLife International & Neotropical Birds Online',
    slot4DbCode: 'BIRDLIFE-NEO-TOUCAN',
  },
  '황제펭귄': {
    realm: 'Antarctic',
    realmNameKo: '남극구 (Antarctic Realm)',
    nativeRange: '남극 대륙 연안 정착빙 및 남극해',
    iucnCategory: 'NT',
    iucnLabel: '준위협 (Near Threatened, 해빙 감소 위협)',
    slot4Label: '극지·잠수',
    slot4Val: '심해 잠수 · NT',
    slot4Theme: 'warning',
    slot4BadgeText: '❄️ 수심 535m 심해 잠수 & 허들링',
    slot4DetailTitle: '남극 극한 영하 60℃ 번식 생리 및 심해 잠수 적응',
    slot4DetailedNarrative: '지구상 모든 펭귄 중 가장 거대하며, 남극의 혹한기(영하 60℃, 풍속 200km/h)에 번식을 시작합니다. 수컷들이 서로 몸을 밀착하여 체온을 나누는 허들링(Huddling) 행동으로 알을 발등 위에 품고 2달 이상 절식하며 지켜냅니다. 최대 수심 535m까지 20분 이상 잠수하여 크릴과 남극빙어를 사냥합니다.',
    slot4DataSource: 'SCAR Antarctic Biodiversity Portal & IUCN SSC',
    slot4DbCode: 'ANTARCTIC-PENGUIN-NT',
  },
  '붉은플라밍고': {
    realm: 'Neotropical',
    realmNameKo: '신열대구 (Neotropical Realm)',
    nativeRange: '카리브해 연안, 유카탄 반도, 갈라파고스 제도 고염분 석호',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (Least Concern)',
    slot4Label: '여과·색소',
    slot4Val: '여과 섭식 · LC',
    slot4Theme: 'normal',
    slot4BadgeText: '🦩 카로티노이드 깃털 & 여과 부리',
    slot4DetailTitle: '고염분 라군 여과섭식 및 카로티노이드 색소 대사',
    slot4DetailedNarrative: '부리를 거꾸로 물속에 담그고 혀의 펌프 작용과 부리 가장자리의 미세 판판(Lamellae) 구조를 통해 물과 진흙에서 미세 조류(Algae)와 알테미아(Artemia) 갑각류를 걸러 먹습니다. 먹이에 포함된 카로티노이드(Carotenoid) 색소를 체내에서 대사하여 화려한 진홍색 깃털을 유지합니다.',
    slot4DataSource: 'IUCN Flamingo Specialist Group & Caribbean Birds Hub',
    slot4DbCode: 'FLAMINGO-CARIB-LC',
  },
  '루비목벌새': {
    realm: 'Nearctic',
    realmNameKo: '신북구 (Nearctic Realm)',
    nativeRange: '북아메리카 동부 번식 / 멕시코 및 중미 월동 (대륙간 철새)',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (Least Concern)',
    slot4Label: '비행·대사',
    slot4Val: '초정밀 호버링 · LC',
    slot4Theme: 'normal',
    slot4BadgeText: '⚡ 초당 53회 날갯짓 & 멕시코만 무착륙 비행',
    slot4DetailTitle: '무한대(∞) 궤적 호버링 비행 및 멕시코만 800km 무착륙 횡단',
    slot4DetailedNarrative: '체중 단 3g에 불과하지만 8자 모양으로 날개를 회전시켜 전후좌우 및 제자리 정지 비행(Hovering)이 가능한 고도의 비행 생리학을 갖추었습니다. 분당 심박수가 1,200회에 달하며, 가을철 멕시코만 800km 해상을 무착륙으로 단숨에 횡단하여 중미로 이동하는 경이로운 장거리 이동 생태를 보입니다.',
    slot4DataSource: 'Audubon Field Guide & Hummingbird Society International',
    slot4DbCode: 'AUDUBON-HUMMING-LC',
  },
  '자이언트 판다': {
    realm: 'Palearctic',
    realmNameKo: '구북구 (Palearctic Realm)',
    nativeRange: '중국 쓰촨성·산시성·간쑤성 대나무 고산 산림 고유종',
    iucnCategory: 'VU',
    iucnLabel: '취약 (Vulnerable, 중국 1급 국가보호종)',
    slot4Label: '식이·해부',
    slot4Val: '가짜 엄지 · VU',
    slot4Theme: 'warning',
    slot4BadgeText: '🐼 요골 종자골(가짜 엄지) 진화',
    slot4DetailTitle: '식육목 소화계의 대나무 전용 적응 및 요골 가짜 엄지 골격',
    slot4DetailedNarrative: '분류학적으로 식육목(Carnivora) 곰과에 속하지만 먹이의 99%가 대나무로 분화했습니다. 짧은 장관과 소화 효소의 한계를 극복하기 위해 하루 12~38kg의 대나무를 섭취하며, 앞발의 요골 종자골(Radial Sesamoid)이 엄지손가락처럼 비대해져 대나무 줄기를 능숙하게 움켜쥘 수 있도록 진화했습니다.',
    slot4DataSource: 'China Giant Panda Conservation Authority & IUCN SSC Bear Specialist',
    slot4DbCode: 'PANDA-VU-CHINA',
  },
  '아프리카 사자': {
    realm: 'Afrotropical',
    realmNameKo: '에티오피아구 (Afrotropical Realm)',
    nativeRange: '아프리카 사하라 이남 사바나 및 개방형 초원',
    iucnCategory: 'VU',
    iucnLabel: '취약 (Vulnerable, 서식지 축소)',
    slot4Label: '사회·수렵',
    slot4Val: '프라이드 군집 · VU',
    slot4Theme: 'warning',
    slot4BadgeText: '🦁 유일한 고양이과 무리(Pride) 협동 수렵',
    slot4DetailTitle: '사바나 최상위 포식자의 프라이드(Pride) 사회 구조 및 매복 전술',
    slot4DetailedNarrative: '고양이과 동물 중 유일하게 무리(Pride)를 형성하여 복합적인 사회 구조를 유지합니다. 암사자들이 부채꼴 대형으로 초식동물을 포위하는 고도의 협동 수렵을 펼쳐 사바나의 얼룩말, 누우, 버팔로 등 대형 유제류를 포식함으로써 초원 생태계의 영양 피라미드 균형을 조절합니다.',
    slot4DataSource: 'IUCN SSC Cat Specialist Group & African Lion Working Group',
    slot4DbCode: 'LION-AFRICA-VU',
  },
  '붉은캥거루': {
    realm: 'Australasian',
    realmNameKo: '오스트레일리아구 (Australasian Realm)',
    nativeRange: '호주 대륙 내륙 건조 및 반건조 관목 초원(Outback)',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (Least Concern)',
    slot4Label: '운동·육아',
    slot4Val: '탄성 도약 · LC',
    slot4Theme: 'normal',
    slot4BadgeText: '🦘 아킬레스건 탄성 저장 & 육아낭(Marsupium)',
    slot4DetailTitle: '건조 아웃백의 탄성 에너지 도약(Hopping) 및 유대류 번식',
    slot4DetailedNarrative: '현존하는 유대류 중 가장 거대하며, 굵고 긴 뒷다리의 아킬레스건이 용수철처럼 탄성 에너지를 흡수·방출하여 시속 60km로 도약할 때 놀라울 정도로 산소 소비를 절약합니다. 극심한 가뭄 시 착상 지연(Embryonic Diapause)을 통해 새끼의 출산 시기를 조절하는 건조 기후 적응 번식을 합니다.',
    slot4DataSource: 'Australian Department of Climate Change & IUCN Australasia',
    slot4DbCode: 'KANGAROO-AUS-LC',
  },
  '호랑이꼬리여우원숭이': {
    realm: 'Afrotropical',
    realmNameKo: '에티오피아구 (Afrotropical Realm)',
    nativeRange: '마다가스카르 남부 및 남서부 가시림·갈비림 고유종',
    iucnCategory: 'EN',
    iucnLabel: '멸종위기 (Endangered, 서식지 파괴 심각)',
    slot4Label: '일광·사회',
    slot4Val: '모계 군집 · EN',
    slot4Theme: 'warning',
    slot4BadgeText: '🐒 가부장제 없는 모계 중심 & 요가 일광욕',
    slot4DetailTitle: '마다가스카르 고유 원시 곡비원류(Strepsirrhini)와 모계 서열',
    slot4DetailedNarrative: '마다가스카르 섬에만 자생하는 원시 영장류로, 흑백 띠가 번갈아 나타나는 긴 꼬리로 시각적 군집 신호를 보냅니다. 아침마다 양팔을 벌려 가슴의 털에 햇볕을 쬐는 독특한 요가 일광욕으로 체온을 올리며, 암컷이 수컷보다 높은 사회적 지위를 갖는 완전한 모계 사회를 형성합니다.',
    slot4DataSource: 'IUCN SSC Primate Specialist Group & Lemur Conservation Network',
    slot4DbCode: 'LEMUR-MADAG-EN',
  },
  '알프스 아이벡스': {
    realm: 'Palearctic',
    realmNameKo: '구북구 (Palearctic Realm)',
    nativeRange: '유럽 알프스 산맥 해발 2,000~3,500m 암벽 고산대',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (Least Concern, 19세기 멸종 위기 극복 복원종)',
    slot4Label: '등반·고산',
    slot4Val: '암벽 등반 · LC',
    slot4Theme: 'normal',
    slot4BadgeText: '🏔️ 80도 수직 댐벽 등반 발굽',
    slot4DetailTitle: '알프스 고산 암벽의 고무 탄성 분할 발굽 & 미네랄 섭식',
    slot4DetailedNarrative: '발굽 가장자리는 단단하고 내부는 부드러운 고무 패드 구조로 되어 있어 수직에 가까운 80도 경사의 알프스 댐 벽이나 바위 절벽을 자유자재로 오릅니다. 절벽 표면에 스며 나온 소금과 미네랄을 핥아 영양을 보충하며 천적인 늑대와 곰의 접근을 완벽히 차단합니다.',
    slot4DataSource: 'IUCN Caprinae Specialist Group & Alpine Convention Forum',
    slot4DbCode: 'IBEX-ALPS-LC',
  },
  '팬서 카멜레온': {
    realm: 'Afrotropical',
    realmNameKo: '에티오피아구 (Afrotropical Realm)',
    nativeRange: '마다가스카르 동부 및 북부 열대 저지대 우림 고유종',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (CITES II 등재종)',
    slot4Label: '광학·탄도',
    slot4Val: '나노 변색 · LC',
    slot4Theme: 'normal',
    slot4BadgeText: '🦎 구아닌 나노 결정 격자 광학 간섭 & 탄도 혀',
    slot4DetailTitle: '광학 간섭 나노 결정 구조 변색 및 0.007초 탄도 혀 사냥',
    slot4DetailedNarrative: '피부 진피층에 존재하는 구아닌(Guanine) 나노 결정의 격자 간격을 미세하게 조절하여 빛의 파장을 반사하는 물리적 구조색 광학 변색을 구사합니다. 체장의 2배에 달하는 흡착판 혀를 0.007초 만에 탄도체처럼 발사하여 먹이를 정밀 포획합니다.',
    slot4DataSource: 'CITES Trade Database & Reptile Database Global',
    slot4DbCode: 'CHAMELEON-PANTHER-LC',
  },
  '갈라파고스 바다이구아나': {
    realm: 'Neotropical',
    realmNameKo: '신열대구 (Neotropical Realm)',
    nativeRange: '갈라파고스 제도 전역 해안 암초 지대 고유종',
    iucnCategory: 'VU',
    iucnLabel: '취약 (Vulnerable, 엘니뇨 해양 온난화 위협)',
    slot4Label: '해양·생리',
    slot4Val: '염분 분사 · VU',
    slot4Theme: 'warning',
    slot4BadgeText: '🌊 지구 유일 해양 파충류 & 콧구멍 염분 분사',
    slot4DetailTitle: '세계 유일의 해양 이구아나 잠수 생태와 비강 염분 배출선',
    slot4DetailedNarrative: '세계에서 유일하게 바닷속으로 잠수하여 해저 암초의 해조류를 뜯어먹는 파충류입니다. 차가운 바닷물에서 잃은 체온을 검은 현무암 위에서 일광욕으로 회복하며, 섭취한 과도한 염분을 콧구멍 상단의 특화된 비강 염분 배출선을 통해 기침하듯 주기적으로 뿜어냅니다.',
    slot4DataSource: 'Charles Darwin Foundation & IUCN Galapagos Specialist',
    slot4DbCode: 'MARINE-IGUANA-VU',
  },
  '붉은눈나무개구리': {
    realm: 'Neotropical',
    realmNameKo: '신열대구 (Neotropical Realm)',
    nativeRange: '중앙아메리카(멕시코 남부~콜롬비아) 저지대 열대우림 수관부',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (Least Concern)',
    slot4Label: '위장·경계',
    slot4Val: '섬광 위장 · LC',
    slot4Theme: 'normal',
    slot4BadgeText: '🐸 깜짝 섬광색(Startle Coloration) 방어',
    slot4DetailTitle: '열대우림 수관부의 흡반 도약 및 천적 교란 섬광 착시',
    slot4DetailedNarrative: '낮에는 선명한 초록색 등판으로 잎사귀 뒤에 몸을 밀착하여 숨다가, 천적이 다가오면 거대하고 붉은 눈과 주황색 발가락, 청색 옆구리를 순식간에 드러내어 포식자를 순간적으로 깜짝 놀라게(Startle Effect) 한 뒤 도망치는 시각 방어 전략을 펼칩니다.',
    slot4DataSource: 'AmphibiaWeb & IUCN SSC Amphibian Specialist Group',
    slot4DbCode: 'RED-EYED-FROG-LC',
  },
  '파란화살독개구리': {
    realm: 'Neotropical',
    realmNameKo: '신열대구 (Neotropical Realm)',
    nativeRange: '남아메리카 수리남 남부 시팔리위니 사바나 고립 고산림 고유종',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (Least Concern, CITES II 등재)',
    slot4Label: '피부·적응',
    slot4Val: '경계색 방어 · LC',
    slot4Theme: 'normal',
    slot4BadgeText: '🐸 아포세마티즘(경계색) 피부 방어',
    slot4DetailTitle: '열대 고산림의 알칼로이드 피층 방어 기전 및 경계색(Aposematism)',
    slot4DetailedNarrative: '선명한 코발트 블루 체색은 포식자에게 접근을 경고하는 대표적인 경계색(Aposematism)입니다. 야생에서 섭식하는 미소 곤충들로부터 화합물을 체내에 축적하여 피층 분비선에 저장함으로써 포식자로부터 자신을 보호하는 독특한 화학 생태 방어 기전을 가집니다.',
    slot4DataSource: 'AmphibiaWeb & IUCN SSC Amphibian Specialist Group',
    slot4DbCode: 'AMPHIBIA-DART-LC',
  },
  '흰동가리': {
    realm: 'IndoPacificReef',
    realmNameKo: '인도-태평양 산호초 (Indo-Pacific Reef)',
    nativeRange: '인도양 및 서태평양 열대 산호초 (대보초, 동남아시아 연안)',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (Least Concern)',
    slot4Label: '공생·점액',
    slot4Val: '상리 공생 · LC',
    slot4Theme: 'normal',
    slot4BadgeText: '🐠 말미잘 자포(Nematocyst) 면역 당단백질 점액',
    slot4DetailTitle: '해양 말미잘과의 절대적 상리공생(Mutualism) 및 성전환 생태',
    slot4DetailedNarrative: '몸 표면에 당단백질로 이루어진 두터운 점액층을 분비하여 말미잘의 맹독성 자포(Nematocyst) 발사를 화학적으로 억제합니다. 말미잘 촉수 사이에 숨어 안전을 보장받는 대신 말미잘 주변의 찌꺼기를 청소하고 산소를 공급하며, 무리의 우두머리 암컷이 사망하면 서열 1위 수컷이 암컷으로 성전환(Protandry)합니다.',
    slot4DataSource: 'FishBase Global Aquatic DB & Great Barrier Reef Marine Park',
    slot4DbCode: 'CLOWNFISH-REEF-LC',
  },
  '고래상어': {
    realm: 'GlobalPelagic',
    realmNameKo: '전세계 원양계 (Global Pelagic Realm)',
    nativeRange: '전 세계 열대 및 온대 외양 표층수 (위도 30°N ~ 35°S)',
    iucnCategory: 'EN',
    iucnLabel: '멸종위기 (Endangered, CITES II 등재종)',
    slot4Label: '원양·여과',
    slot4Val: '여과 섭식 · EN',
    slot4Theme: 'warning',
    slot4BadgeText: '🦈 최대 18m 지구상 최대 어류 & 플랑크톤 여과',
    slot4DetailTitle: '지구 최대 연골어류의 아가미궁 여과 섭식 및 외양 회유',
    slot4DetailedNarrative: '현존하는 어류 중 가장 거대하여 최대 18m, 무게 20톤까지 성장합니다. 거대한 체구에도 불구하고 온순하며, 1.5m 너비의 거대한 입으로 바닷물을 들이마신 뒤 빗살 모양의 아가미궁(Gill Rakers)으로 크릴, 플랑크톤, 소형 어류만을 걸러 먹습니다. 수천 킬로미터의 열대 대양을 횡단하는 장거리 회유를 합니다.',
    slot4DataSource: 'IUCN Shark Specialist Group & Wildbook for Whale Sharks',
    slot4DbCode: 'WHALE-SHARK-EN',
  },
  '대왕쥐가오리': {
    realm: 'GlobalPelagic',
    realmNameKo: '전세계 원양계 (Global Pelagic Realm)',
    nativeRange: '전 세계 열대 및 아열대 대양 연안 및 산호초 해역',
    iucnCategory: 'EN',
    iucnLabel: '멸종위기 (Endangered, 아가미판 남획 위협)',
    slot4Label: '비행·두뇌',
    slot4Val: '수중 활공 · EN',
    slot4Theme: 'warning',
    slot4BadgeText: '🌊 익폭 7m 수중 비행 & 어류 최대 뇌 용적',
    slot4DetailTitle: '거대 가슴지느러미 수중 비행 및 산호초 클리닝 스테이션 생태',
    slot4DetailedNarrative: '날개 너비가 최대 7m, 체중이 2톤에 달하는 거대 가오리입니다. 어류 중 체중 대비 뇌의 크기가 가장 커 뛰어난 인지 능력과 호기심을 지니며, 머리 앞의 두부 지느러미(Cephalic Fins)로 플랑크톤 수류를 모읍니다. 산호초의 청소놀래기 서식처(Cleaning Station)를 정기적으로 방문하여 기생충을 제거받습니다.',
    slot4DataSource: 'Manta Trust & IUCN SSC Shark Specialist Group',
    slot4DbCode: 'MANTA-RAY-EN',
  },
  '블루 모르포 나비': {
    realm: 'Neotropical',
    realmNameKo: '신열대구 (Neotropical Realm)',
    nativeRange: '중남미 아마존 분지 및 코스타리카 열대우림 저지대',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (Least Concern)',
    slot4Label: '광학·구조',
    slot4Val: '나노 구조색 · LC',
    slot4Theme: 'normal',
    slot4BadgeText: '🦋 비늘 미세 크리스마스트리 격자 보강 간섭',
    slot4DetailTitle: '나노 다층 구조를 통한 빛의 보강 간섭(Structural Color) 메커니즘',
    slot4DetailedNarrative: '날개에 푸른색 색소가 전혀 없으며, 날개 비늘 표면의 미세한 크리스마스트리 모양 키틴질 나노 격자가 특정 파장(약 450nm의 푸른빛)만을 반사하고 증폭시키는 빛의 보강 간섭을 일으킵니다. 날개를 접으면 눈알 무늬의 갈색 보호색으로 위장하여 새들의 공격을 피합니다.',
    slot4DataSource: 'Catalogue of Life Lepidoptera & Smithsonian Tropical Research',
    slot4DbCode: 'MORPHO-AMAZON-LC',
  },
  '헤라클레스 장수풍뎅이': {
    realm: 'Neotropical',
    realmNameKo: '신열대구 (Neotropical Realm)',
    nativeRange: '중앙아메리카 및 남아메리카 안데스·아마존 열대우림',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (Least Concern)',
    slot4Label: '갑충·생체',
    slot4Val: '최대 갑충 · LC',
    slot4Theme: 'normal',
    slot4BadgeText: '🪲 체장 최대 18cm & 체중 850배 운반력',
    slot4DetailTitle: '세계 최대 갑충의 흉각 집게 지레 메커니즘 및 습도 반응 변색',
    slot4DetailedNarrative: '체장 최대 18cm로 세계에서 가장 긴 갑충입니다. 가슴에서 뻗은 거대한 흉각과 두각이 완벽한 집게를 이루어 영역 다툼 시 상대 수컷을 들어 올려 내던집니다. 딱지날개 내부의 미세 다공성 층이 주변 습도에 따라 빛 반사를 바꾸어 건조할 때는 황록색, 다습할 때는 칠흑색으로 변색합니다.',
    slot4DataSource: 'Scarab Beetles of the World & CoL Insecta DB',
    slot4DbCode: 'HERCULES-BEETLE-LC',
  },
  '그랑디디에 바오밥나무': {
    realm: 'Afrotropical',
    realmNameKo: '에티오피아구 (Afrotropical Realm)',
    nativeRange: '마다가스카르 서부 모론다바 건조 탈락수림 고유종',
    iucnCategory: 'EN',
    iucnLabel: '멸종위기 (Endangered, 마다가스카르 상징목)',
    slot4Label: '수분·생태',
    slot4Val: '수분 저류 · EN',
    slot4Theme: 'warning',
    slot4BadgeText: '🌳 줄기 내 12만 리터 저수 & 여우원숭이 수분',
    slot4DetailTitle: '수령 1,000년 건조 저수 수간 및 야간 박쥐·여우원숭이 수분',
    slot4DetailedNarrative: '높이 30m, 직경 3m에 달하는 거대한 원통형 줄기는 해면상 스펀지 조직으로 채워져 있어 우기에 흡수한 수분을 최대 12만 리터까지 저장하여 수개월의 가뭄을 견딥니다. 밤에만 피어나는 커다란 흰 꽃은 꿀을 찾는 박쥐와 여우원숭이를 유인하여 꽃가루를 매개(Chiropterophily)합니다.',
    slot4DataSource: 'Madagascar Flora Project & IUCN SSC Global Tree Specialist',
    slot4DbCode: 'BAOBAB-MADAG-EN',
  },
  '자이언트 세쿼이아': {
    realm: 'Nearctic',
    realmNameKo: '신북구 (Nearctic Realm)',
    nativeRange: '미국 캘리포니아주 시에라네바다 산맥 서사면(해발 1,400~2,150m)',
    iucnCategory: 'EN',
    iucnLabel: '멸종위기 (Endangered, 산불 격화 위협)',
    slot4Label: '수목·내화',
    slot4Val: '내화성 수피 · EN',
    slot4Theme: 'warning',
    slot4BadgeText: '🌲 부피 1,487㎥ 세계 최대 단일 유기체 & 산불 내성',
    slot4DetailTitle: '수령 3,000년 탄닌 방화 수피 및 산불 열기 솔방울 개열 생태',
    slot4DetailedNarrative: '세계에서 부피가 가장 큰 단일 유기체(제너럴 셔먼 트리)로 수고 83m, 기저부 직경 11m에 달합니다. 60cm 두께의 섬유질 수피는 탄닌(Tannin) 성분이 풍부하여 산불과 곤충 침입을 막아내며, 솔방울은 산불의 뜨거운 열기를 받아야만 송진이 녹아 벌어지며 종자를 숲 바닥에 살포하는 산불 의존성 번식 생태를 지닙니다.',
    slot4DataSource: 'US National Park Service (Sequoia & Kings Canyon) & IUCN Red List',
    slot4DbCode: 'SEQUOIA-US-EN',
  },
  '라플레시아 아르놀디': {
    realm: 'Indomalayan',
    realmNameKo: '동양구 (Indomalayan Realm)',
    nativeRange: '인도네시아 수마트라섬 및 보르네오섬 열대우림 고유종',
    iucnCategory: 'CR',
    iucnLabel: '위급 (Critically Endangered, 세계 최대 단일 꽃)',
    slot4Label: '기생·수분',
    slot4Val: '사체취 수분 · CR',
    slot4Theme: 'warning',
    slot4BadgeText: '🌸 직경 1m 잎·뿌리 없는 전기생 & 시체 부패향',
    slot4DetailTitle: '포도과 덩굴 체내 완전 기생 및 금파리 유인 부패취 수분',
    slot4DetailedNarrative: '잎, 줄기, 뿌리가 전혀 없으며 엽록소도 없어 광합성을 하지 못하고 오직 야생 포도나무 덩굴(Tetrastigma) 체내에 균사처럼 침투하여 영양을 흡수하는 완전 기생식물입니다. 개화 시 직경 1m, 무게 11kg의 거대한 꽃을 피우며 고기 썩는 악취(Dimethyl disulfide)와 발열을 통해 쇠파리와 금파리를 유인해 교차 수분을 완성합니다.',
    slot4DataSource: 'Kew Royal Botanic Gardens & Indonesian Forestry Agency',
    slot4DbCode: 'RAFFLESIA-SUMATRA-CR',
  },
  '파리지옥': {
    realm: 'Nearctic',
    realmNameKo: '신북구 (Nearctic Realm)',
    nativeRange: '미국 노스캐롤라이나 및 사우스캐롤라이나 해안 사구 습지 고유종',
    iucnCategory: 'VU',
    iucnLabel: '취약 (Vulnerable, 불법 채취 위협)',
    slot4Label: '식충·세포',
    slot4Val: '포획 덫 · VU',
    slot4Theme: 'warning',
    slot4BadgeText: '🪤 0.1초 급속 세포 팽창 포획 덫 & 전기 신호 기억',
    slot4DetailTitle: '질소 빈약 산성 습지의 활동전위(Action Potential) 식충 덫',
    slot4DetailedNarrative: '질소와 미네랄이 극도로 부족한 산성 이탄 습지에서 진화한 식충식물입니다. 잎 안쪽의 감각모(Trigger Hair)를 20초 이내에 2회 연속 건드리면 전기 활동전위가 발생하여 0.1초 만에 세포벽 수분을 이동시켜 잎을 닫습니다. 이후 5회 이상 자극되면 소화액을 분비하여 곤충 단백질로부터 질소와 인을 흡수합니다.',
    slot4DataSource: 'US Fish & Wildlife Service & BGCI Plant Conservation',
    slot4DbCode: 'VENUS-FLYTRAP-VU',
  },
  '야자집게': {
    realm: 'IndoPacificReef',
    realmNameKo: '인도-태평양 산호초 (Indo-Pacific Reef)',
    nativeRange: '인도양 및 남서태평양 열대 화산섬 및 산호 환초 해안림',
    iucnCategory: 'VU',
    iucnLabel: '취약 (Vulnerable, 세계 최대 육상 절지동물)',
    slot4Label: '갑각·적응',
    slot4Val: '육상 거대갑각 · VU',
    slot4Theme: 'warning',
    slot4BadgeText: '🥥 악력 3,300N (사자 치악력 필적) & 폐새실 호흡',
    slot4DetailTitle: '세계 최대 육상 절지동물의 폐새실(Branchiostegal Lung) 호흡',
    slot4DetailedNarrative: '체중 최대 4kg, 다리 경간 1m에 달하는 세계 최대의 육상 절지동물입니다. 성체는 바다에 들어가지 못하고 익사하며, 아가미 대신 혈관이 밀집한 폐새실(Branchiostegal lung)을 통해 공기 호흡을 합니다. 강력한 집게발은 3,300N(약 330kg)의 가공할 악력으로 단단한 코코넛 열매를 쪼개어 영양을 섭취합니다.',
    slot4DataSource: 'IUCN Terrestrial Decapod Specialist & Pacific Island Ecology',
    slot4DbCode: 'COCONUT-CRAB-VU',
  },
  '블루드래곤 갯민숭달팽이': {
    realm: 'GlobalPelagic',
    realmNameKo: '전세계 원양계 (Global Pelagic Realm)',
    nativeRange: '전 세계 열대 및 온대 외양 표층수 (부유성)',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (Least Concern)',
    slot4Label: '원양·적응',
    slot4Val: '자포 농축 · LC',
    slot4Theme: 'normal',
    slot4BadgeText: '🐉 자포 세포 농축(Kleptocnidy) 방어',
    slot4DetailTitle: '외양 표층 거꾸로 부유 생태 및 자포 농축(Kleptocnidy) 방어',
    slot4DetailedNarrative: '위장 속에 공기 방울을 삼켜 표면장력을 이용해 물 표면에 배를 하늘로 향한 채 거꾸로 떠다니며 살아갑니다. 자포동물을 섭식한 후 소화되지 않은 자포 세포를 깃털 모양 세르타(Cerata) 끝으로 이동 배치하여 물리적 방어 기작으로 활용하는 놀라운 적응 생태를 보입니다.',
    slot4DataSource: 'World Register of Marine Species (WoRMS) & Marine Bio Global',
    slot4DbCode: 'GLAUCUS-PELAGIC-LC',
  },
  '서양민들레': {
    realm: 'Palearctic',
    realmNameKo: '구북구 (유럽 원산, 전세계 귀화)',
    nativeRange: '유럽 및 중앙아시아 온대 초지 (전 세계 도시/초지 귀화)',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (Least Concern, 전세계 귀화식물)',
    slot4Label: '식물 지위',
    slot4Val: '외래 귀화식물',
    slot4Theme: 'naturalized',
    slot4BadgeText: '🌱 아포믹시스(무수정 결실) & 도심 밀원 식물',
    slot4DetailTitle: '서양민들레의 총포편 반전 및 무수정 생식(Apomixis) 적응',
    slot4DetailedNarrative: '꽃받침 아래 총포편(Involucral bracts)이 뒤로 완전히 젖혀지는 형태학적 특징으로 토종 민들레와 명확히 구분됩니다. 수분 곤충 없이도 씨앗을 맺는 아포믹시스(Apomixis)와 연중 수회 개화하는 왕성한 생명력으로 전 세계 도심 아스팔트 틈새와 공원에 정착하여 봄철 이른 시기 꿀벌과 나비에게 중요한 꿀과 화분을 공급하는 귀화식물입니다.',
    slot4DataSource: '국립수목원 KNA 국가생물종지식정보시스템 & APG IV',
    slot4DbCode: 'KNA-DANDELION-NAT',
  },
  '민들레': {
    realm: 'Palearctic',
    realmNameKo: '구북구 (동아시아 자생)',
    nativeRange: '한반도, 중국, 일본 등 동아시아 온대 지역 자생',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (Least Concern, 토종 자생식물)',
    slot4Label: '생태 지위',
    slot4Val: '동아시아 자생초본',
    slot4Theme: 'normal',
    slot4BadgeText: '🌼 총포편 곧게 직립 & 충매 타가수분',
    slot4DetailTitle: '토종 민들레의 충매 타가수분 및 봄철 한정 개화 생태',
    slot4DetailedNarrative: '외총포편이 뒤로 젖혀지지 않고 꽃을 감싸듯 곧게 서 있는 것이 토종 민들레(Taraxacum platycarpum)의 핵심 동정 포인트입니다. 서양민들레와 달리 반드시 방화 곤충을 통한 타가수분(Cross-pollination)을 거쳐야만 결실하며, 봄철(3~5월)에만 집중적으로 개화하는 온대성 다년생 자생초본입니다.',
    slot4DataSource: '국립수목원 KNA 표준식물목록 & 국가생물종DB',
    slot4DbCode: 'KNA-TARAXACUM-NAT',
  },
  '미선나무': {
    realm: 'Palearctic',
    realmNameKo: '구북구 한반도 고유 (Endemic to Korea)',
    nativeRange: '대한민국 충청북도(괴산·영동) 및 전북 자생 1속 1종',
    iucnCategory: 'NT',
    iucnLabel: '준위협 (Near Threatened, 멸종위기 야생생물 II급 해제 후 특별보호)',
    slot4Label: '고유 특산',
    slot4Val: '세계 유일 1속 1종 고유종',
    slot4Theme: 'endemic',
    slot4BadgeText: '🇰🇷 천연기념물 지정 한반도 특산식물',
    slot4DetailTitle: '세계에서 오직 한반도에만 자생하는 1속 1종 미선나무속(Abeliophyllum)',
    slot4DetailedNarrative: '열매 모양이 부채(선, 扇)를 닮아 미선(美扇)나무라 불리며, 전 세계 식물 분류군 중 오직 한반도 중부 석회암 지대에만 자생하는 1속 1종(Monotypic genus)의 귀중한 고유종입니다. 이른 봄 잎보다 먼저 흰색 또는 연분홍색의 향기로운 꽃을 피우며 세계 식물학계의 주목을 받는 핵심 보전 자원입니다.',
    slot4DataSource: '국립수목원 천연기념물 식물 DB & IUCN SSC Plant Specialist',
    slot4DbCode: 'KNA-ABELIO-ENDEMIC',
  },
  '쉬리': {
    realm: 'Palearctic',
    realmNameKo: '구북구 한반도 고유 (Endemic to Korea)',
    nativeRange: '대한민국 한강, 금강, 낙동강, 섬진강 등 맑은 여울목',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (Least Concern, 한반도 고유 담수어)',
    slot4Label: '고유 수생',
    slot4Val: '한국 고유 담수어',
    slot4Theme: 'endemic',
    slot4BadgeText: '🇰🇷 1급수 여울목 자갈 바닥 서식',
    slot4DetailTitle: '한국 하천 여울목(Riffle) 생태계 지표 어종 & 혼인색',
    slot4DetailedNarrative: '몸측면에 노란색, 주황색, 흑자색의 화려한 세로 띠를 지닌 한국 고유 담수어류입니다. 물 흐름이 빠르고 자갈이 깔린 용존산소량이 풍부한 1급수 맑은 여울에만 서식하며, 수서 곤충(하루살이, 날도래 유충)을 섭식하는 하천 상류 생태계의 대표적 수질 지표종입니다.',
    slot4DataSource: '국립생물자원관(NIBR) 한국 담수어류 도감',
    slot4DbCode: 'NIBR-CORETIS-ENDEMIC',
  },
  '각시붕어': {
    realm: 'Palearctic',
    realmNameKo: '구북구 한반도 고유 (Endemic to Korea)',
    nativeRange: '대한민국 서해 및 남해로 흐르는 하천 완류역',
    iucnCategory: 'LC',
    iucnLabel: '관심대상 (Least Concern, 한반도 고유종)',
    slot4Label: '고유 공생',
    slot4Val: '한국 고유 담수어',
    slot4Theme: 'endemic',
    slot4BadgeText: '🐚 민물조개(말조개) 산란 공생',
    slot4DetailTitle: '민물조개 아가미방 내 산란관 삽입 산란 특수 공생',
    slot4DetailedNarrative: '몸에 무지갯빛 광택이 흐르는 아름다운 한국 고유 소형 잉어과 담수어입니다. 산란기(4~6월)가 되면 암컷의 꼬리 부근에서 긴 산란관(Ovipositor)이 나와 살아있는 민물조개(말조개·작은말조개)의 출수공에 알을 낳고, 부화한 치어가 안전하게 자란 뒤 밖으로 나오는 정교한 상리공생(Mutualism)을 유지합니다.',
    slot4DataSource: '국립생물자원관(NIBR) & 환경부 담수생태계 DB',
    slot4DbCode: 'NIBR-RHODEUS-ENDEMIC',
  },
  '왕벚나무': {
    realm: 'Palearctic',
    realmNameKo: '구북구 (Palearctic Realm)',
    nativeRange: '동아시아 온대 수목 및 제주도 한라산 해발 500~900m 자생지',
    iucnCategory: 'DD',
    iucnLabel: '정보부족 (Data Deficient, 자생 군락 연구)',
    slot4Label: '개화·화서',
    slot4Val: '산형화서 · 봄개화',
    slot4Theme: 'normal',
    slot4BadgeText: '🌸 잎보다 먼저 피는 5판화 산형화서',
    slot4DetailTitle: '장미과 벚나무속의 봄철 선개화(Pre-foliation) 및 화분 매개 생태',
    slot4DetailedNarrative: '왕벚나무(Prunus yedoensis)는 장미과의 대표적인 낙엽교목으로, 이른 봄 잎이 돋기 전에 연분홍빛 또는 백색의 5판화가 3~6송이씩 모여 산형(또는 산방) 꽃차례를 이룹니다. 꽃자루와 암술대에 부드러운 미세 털이 밀생하는 고유한 형태 형질을 지니며, 봄철 꿀벌과 나비, 직박구리에게 풍부한 꿀(Nectar)과 화분을 제공하는 핵심 화분매개 기여 수목입니다.',
    slot4DataSource: '국립수목원 국가생물종지식정보시스템 & Plants of the World Online (POWO)',
    slot4DbCode: 'KNA-POWO-PRUNUS',
  },
};

// Known Global Invasive / Naturalized Species Database with Native Origin vs Introduced Ecosystems
const GLOBAL_INVASIVE_SPECIES_MAP: Record<string, {
  origin: string;
  introduced: string;
  impact: string;
  type: 'disturber' | 'naturalized';
  db: 'IUCN_GISD_100' | 'CABI_INVASIVE' | 'CITES_MONITORED' | 'REGIONAL_INTRODUCED' | 'KNA_NATURALIZED';
}> = {
  // 1. 생태계교란 생물 / 침입외래종 (Ecosystem Disturber - Amber/Orange Theme)
  '큰입배스': { origin: '신북구 (북미 미시시피 담수계 원산)', introduced: '동아시아, 유럽, 아프리카 담수계 유입', impact: 'IUCN 100대 악성 침입외래종. 토종 담수 치어 및 수생 갑각류 무차별 포식으로 담수 생태계 교란', type: 'disturber', db: 'IUCN_GISD_100' },
  '파랑볼우럭': { origin: '신북구 (북미 동부 하천 원산)', introduced: '아시아, 유럽 수계 유입', impact: '생태계교란 생물. 높은 번식력과 잡식성으로 토착 어류 알 및 수생 곤충 군집 잠식', type: 'disturber', db: 'IUCN_GISD_100' },
  '블루길': { origin: '신북구 (북미 동부 하천 원산)', introduced: '아시아, 유럽 수계 유입', impact: '생태계교란 생물. 높은 번식력과 잡식성으로 토착 어류 알 및 수생 곤충 군집 잠식', type: 'disturber', db: 'IUCN_GISD_100' },
  '붉은귀거북': { origin: '신북구 (미국 남부 미시시피 원산)', introduced: '전 세계 온대·열대 담수 습지 유입', impact: 'IUCN 100대 침입종. 질병 매개 및 토착 담수 파충류·양서류 서식처 경쟁 배제', type: 'disturber', db: 'IUCN_GISD_100' },
  '황소개구리': { origin: '신북구 (북미 동부 원산)', introduced: '아시아, 유럽, 남미 습지 유입', impact: 'IUCN 100대 악성 침입종. 뱀, 어류, 소형 조류까지 포식하는 왕성한 식욕으로 양서류 다양성 교란', type: 'disturber', db: 'IUCN_GISD_100' },
  '가시박': { origin: '신북구 (북아메리카 원산)', introduced: '동아시아 및 유럽 하천변 유입', impact: '생태계교란 식물. 덩굴성 맹렬한 생장으로 수변 수목과 고유 초본을 뒤덮어 일광 차단 및 질식 고사 초래', type: 'disturber', db: 'CABI_INVASIVE' },
  '단풍잎돼지풀': { origin: '신북구 (북아메리카 원산)', introduced: '유라시아 하천변 유입', impact: '생태계교란 식물. 대량의 꽃가루로 알레르기 유발 및 하천변 고유 식생 단일군락화', type: 'disturber', db: 'CABI_INVASIVE' },
  '돼지풀': { origin: '신북구 (북아메리카 원산)', introduced: '유라시아 개활지 유입', impact: '생태계교란 식물. 자생 식물과의 공간 경쟁 및 고농도 화분 알레르기 유발', type: 'disturber', db: 'CABI_INVASIVE' },
  '뉴트리아': { origin: '신열대구 (남아메리카 늪지 원산)', introduced: '북미, 유럽, 동아시아 습지 유입', impact: 'IUCN 100대 침입종. 습지 제방 굴착으로 수리 시설 파괴 및 습지 수생식물 과다 섭식', type: 'disturber', db: 'IUCN_GISD_100' },
  '미국선녀벌레': { origin: '신북구 (북미 원산)', introduced: '유럽, 동아시아 농림지 유입', impact: '과수 및 활엽수 즙액 흡즙 및 왁스 물질 분비로 그을음병 유발', type: 'disturber', db: 'CABI_INVASIVE' },
  '꽃매미': { origin: '동양구 (중국 남부 원산)', introduced: '동아시아 전역 과수원 유입', impact: '수목 줄기 수액 흡즙 및 과수 농업 피해 유발 침입 곤충', type: 'disturber', db: 'CABI_INVASIVE' },
  '미국가재': { origin: '신북구 (미국 남동부 원산)', introduced: '전 세계 담수 유입', impact: '하천 둑 굴착 및 토종 가재·치어 서식지 잠식 생태계 교란종', type: 'disturber', db: 'IUCN_GISD_100' },

  // 2. 일반 귀화식물 / 외래 도입종 (Naturalized / Alien Introduced - Mild Teal/Emerald Theme)
  '서양민들레': { origin: '구북구 (유럽·중앙아시아 원산)', introduced: '전 세계 도시 및 초지 귀화', impact: '일반 귀화식물. 아포믹시스(무수정 종자형성)와 긴 개화기로 도시·공원 녹지에 자연스럽게 정착하여 방화 곤충에게 화분을 공급', type: 'naturalized', db: 'KNA_NATURALIZED' },
  '개망초': { origin: '신북구 (북미 원산)', introduced: '유라시아 전역 귀화', impact: '일반 귀화식물. 도로변, 나대지 등 척박한 토양에 선구 식물로 정착하여 토양 유실 방지 및 밀원 제공', type: 'naturalized', db: 'KNA_NATURALIZED' },
  '토끼풀': { origin: '구북구 (유럽 원산)', introduced: '전 세계 초지·목초지 귀화', impact: '일반 귀화식물. 뿌리혹박테리아 질소 고정으로 토양을 비옥하게 만드는 지피식물', type: 'naturalized', db: 'KNA_NATURALIZED' },
  '달맞이꽃': { origin: '신북구 (북아메리카 원산)', introduced: '유라시아 하천 및 공터 귀화', impact: '일반 귀화식물. 야간 개화로 밤 곤충(박각시 등)의 주요 밀원 식물 역할', type: 'naturalized', db: 'KNA_NATURALIZED' },
  '자주광대나물': { origin: '구북구 (유럽·아시아 원산)', introduced: '온대 지역 밭둑 및 정원 귀화', impact: '일반 귀화식물. 이른 봄 일찍 개화하여 월동 곤충의 소중한 초기 밀원 역할', type: 'naturalized', db: 'KNA_NATURALIZED' },
};

/**
 * Calculates a truly global, unbiased ecological, biogeographical, and niche profile for any organism
 */
export function getGlobalEcoStatusProfile(params: {
  koreanName: string;
  scientificName: string;
  category: string;
  family?: string;
  order?: string;
  statusText?: string;
  dietText?: string;
  habitatText?: string;
  keyIdentification?: string;
}): GlobalEcoStatusProfile {
  const { koreanName, scientificName, category, statusText = '', dietText = '', habitatText = '', keyIdentification = '' } = params;
  const cleanName = koreanName.split('(')[0].trim();

  // 1. Check curated explicit global database first
  const exactCurated = KNOWN_GLOBAL_SPECIMENS[cleanName] || Object.entries(KNOWN_GLOBAL_SPECIMENS).find(([key]) => koreanName.includes(key))?.[1];
  if (exactCurated) {
    const tierMeta = getIucnTierMeta(exactCurated.iucnCategory);
    return {
      realm: exactCurated.realm,
      realmNameKo: exactCurated.realmNameKo,
      nativeRange: exactCurated.nativeRange,
      isEndemic: exactCurated.slot4Theme === 'endemic' || exactCurated.nativeRange.includes('고유'),
      endemicRegionName: exactCurated.nativeRange,
      isInvasiveGlobal: exactCurated.slot4Theme === 'disturber',
      isNaturalized: exactCurated.slot4Theme === 'naturalized',
      iucnCategory: exactCurated.iucnCategory,
      iucnLabel: tierMeta ? `${tierMeta.nameKo} (${tierMeta.code})` : exactCurated.iucnLabel,
      tierMeta,
      hasSlot4: true,
      hasConservationData: true,
      slot4Label: exactCurated.slot4Label,
      slot4Val: exactCurated.slot4Val,
      slot4Theme: exactCurated.slot4Theme,
      slot4BadgeText: exactCurated.slot4BadgeText,
      slot4DetailTitle: exactCurated.slot4DetailTitle,
      slot4DetailedNarrative: exactCurated.slot4DetailedNarrative,
      slot4DataSource: exactCurated.slot4DataSource,
      slot4DbCode: exactCurated.slot4DbCode,
    };
  }

  // 2. Strict Category Disambiguation (NEVER confuse crustaceans/birds/mammals with plants!)
  const rawCat = (category || '').toLowerCase();
  const name = koreanName || '';
  const familyName = params.family || '';

  const isFungi = rawCat === 'fungi' || /버섯|균류|균계|곰팡이|균근|효모|담자균|자낭균|Fungi|Amanita|Agaric|Boletus|Ganoderma|Pleurotus|Tricholoma/i.test(name) || /버섯|균류|균계|곰팡이|균근|효모|Fungi|담자균|자낭균/i.test(rawCat) || /버섯과|Fungi/i.test(familyName);
  const isCrustacean = !isFungi && (rawCat === 'crustaceans' || /가재|참가재|방게|꽃게|대게|털게|새우|집게|투구게|crustacean|crayfish|crab|shrimp/i.test(name) || /가재과|게과|새우과/.test(familyName));
  const isBird = !isFungi && !isCrustacean && (rawCat === 'birds' || (!['plants', 'insects', 'fishes', 'mammals', 'reptiles', 'amphibians', 'mollusks', 'crustaceans', 'arachnids'].includes(rawCat) && /새|오리|까치|직박구리|참새|매|수리|백로|왜가리|물총새|두루미|올빼미|부엉이|벌새|딱따구리|갈매기|도요|가마우지|꿩|비둘기|제비|박새|꾀꼬리|핀치|독수리|흰머리수리|펠리컨|투칸|플라밍고|펭귄/.test(name)));
  const isInsect = !isFungi && !isCrustacean && (rawCat === 'insects' || (!isBird && /나비|잠자리|벌|딱정벌레|메뚜기|매미|꽃등에|무당벌레|사마귀|장수풍뎅이|사슴벌레|길앞잡이|모기|파리/.test(name)));
  const isFish = !isFungi && !isCrustacean && (rawCat === 'fishes' || rawCat === 'fish' || (!isBird && !isInsect && /잉어|붕어|피라미|가물치|쏘가리|은어|쉬리|각시붕어|꺽지|버들치|금강모치|열목어|비단잉어|송사리|미꾸리|메기|상어|가오리|복어|참복|자주복|흰동가리|망둑|감성돔|농어/.test(name)));
  const isMammal = !isFungi && !isCrustacean && (rawCat === 'mammals' || (!isBird && !isInsect && !isFish && /다람쥐|너구리|고양이|족제비|노루|고라니|수달|호랑이|표범|늑대|여우|박쥐|토끼|멧돼지|사슴|곰|고래|물개|바다사자|사자|캥거루|리머|여우원숭이|아이벡스|판다/.test(name)));
  const isHerptile = !isFungi && !isCrustacean && (rawCat === 'herptiles' || rawCat === 'reptiles' || rawCat === 'amphibians' || (!isBird && !isInsect && !isFish && !isMammal && /뱀|구렁이|살모사|유혈목이|꽃뱀|개구리|두꺼비|도롱뇽|도마뱀|거북|맹꽁이|무당개구리|수원청개구리|금개구리|카멜레온|악어|이구아나/.test(name)));
  const isMolluskOrInvert = !isFungi && !isCrustacean && (rawCat === 'mollusks' || (!isBird && !isInsect && !isFish && !isMammal && !isHerptile && /달팽이|민달팽이|문어|오징어|해파리|말미잘|조개|소라|고둥/.test(name)));
  const isArachnid = !isFungi && !isCrustacean && (rawCat === 'arachnids' || /거미|타란툴라|전갈/.test(name));
  const isPlant = !isFungi && !isCrustacean && (rawCat === 'plants' || (!isBird && !isInsect && !isFish && !isMammal && !isHerptile && !isMolluskOrInvert && !isArachnid && /민들레|나무|진달래|개나리|소나무|벚나무|서양민들레|고사리|이끼|풀|꽃|수목|단풍|참나무|바오밥|미선나무|금강초롱꽃|가시박|돼지풀|몬스테라|세쿼이아|라플레시아|파리지옥|개망초|토끼풀/.test(name)));

  const full = `${koreanName} ${scientificName} ${category} ${statusText} ${dietText} ${habitatText} ${keyIdentification}`;

  // 3. Invasive / Naturalized Alien Species check
  const invasiveMatch = GLOBAL_INVASIVE_SPECIES_MAP[cleanName] || Object.entries(GLOBAL_INVASIVE_SPECIES_MAP).find(([key]) => name.includes(key))?.[1];

  // 4. Korean Endemic Species Check
  const isEndemicKorean = /한국고유|고유종|한반도 고유|미선나무|쉬리|각시붕어|금강모치|참갈겨니|어름치|자가사리|퉁가리|점쉬리|금강초롱꽃|모데미풀|제주고사리삼|구상나무/.test(full);

  // 5. Biogeographical Realm Determination (Based on text clues, NOT blind Palearctic defaults!)
  let realm: BiogeographicRealm = 'Palearctic';
  let realmNameKo = '구북구 (Palearctic Realm)';
  let nativeRange = '동아시아 및 온대 자생';

  if (invasiveMatch) {
    if (invasiveMatch.origin.includes('신북구')) {
      realm = 'Nearctic';
      realmNameKo = '신북구 (Nearctic Realm)';
      nativeRange = invasiveMatch.origin;
    } else if (invasiveMatch.origin.includes('신열대구')) {
      realm = 'Neotropical';
      realmNameKo = '신열대구 (Neotropical Realm)';
      nativeRange = invasiveMatch.origin;
    } else if (invasiveMatch.origin.includes('구북구')) {
      realm = 'Palearctic';
      realmNameKo = '구북구 (Palearctic Realm)';
      nativeRange = invasiveMatch.origin;
    }
  } else if (isEndemicKorean) {
    realm = 'Palearctic';
    realmNameKo = '구북구 한반도 고유 (Endemic to Korea)';
    nativeRange = '대한민국 고유 서식지 (한반도 특산)';
  } else if (/신북구|북미|북아메리카|미국|캐나다|알래스카|Nearctic/i.test(full)) {
    realm = 'Nearctic';
    realmNameKo = '신북구 (Nearctic Realm)';
    nativeRange = '북아메리카 대륙 자생';
  } else if (/신열대구|남미|남아메리카|아마존|갈라파고스|안데스|멕시코|중미|Neotropical/i.test(full)) {
    realm = 'Neotropical';
    realmNameKo = '신열대구 (Neotropical Realm)';
    nativeRange = '중남미 열대·아열대 자생';
  } else if (/에티오피아구|아프리카|마다가스카르|사하라|사바나|세렝게티|Afrotropical/i.test(full)) {
    realm = 'Afrotropical';
    realmNameKo = '에티오피아구 (Afrotropical Realm)';
    nativeRange = '아프리카 대륙 및 마다가스카르 자생';
  } else if (/오스트레일리아구|호주|오스트레일리아|뉴질랜드|뉴기니|아웃백|Australasian/i.test(full)) {
    realm = 'Australasian';
    realmNameKo = '오스트레일리아구 (Australasian Realm)';
    nativeRange = '호주 및 대양주 자생';
  } else if (/동양구|인도|동남아시아|인도네시아|보르네오|말레이|열대아시아|Indomalayan/i.test(full)) {
    realm = 'Indomalayan';
    realmNameKo = '동양구 (Indomalayan Realm)';
    nativeRange = '동남아시아 및 인도 아대륙 자생';
  } else if (/남극|남극해|Antarctic/i.test(full)) {
    realm = 'Antarctic';
    realmNameKo = '남극구 (Antarctic Realm)';
    nativeRange = '남극 대륙 및 남빙양 자생';
  } else if (/산호초|인도태평양|reef|marine/i.test(full)) {
    realm = 'IndoPacificReef';
    realmNameKo = '인도-태평양 산호초 (Indo-Pacific Reef)';
    nativeRange = '열대 인도-태평양 산호초 해역';
  } else if (/한국|대한민국|한반도|일본|중국|유럽|시베리아|유라시아|Palearctic/i.test(full)) {
    realm = 'Palearctic';
    realmNameKo = '구북구 (Palearctic Realm)';
    nativeRange = '유라시아 온대 및 동아시아 자생';
  } else {
    realm = 'Cosmopolitan';
    realmNameKo = '범세계적 분포 (Cosmopolitan)';
    nativeRange = '전 세계 온대 및 열대 지역';
  }

  // 6. IUCN Red List Category Determination (NO blind 'LC' default!)
  // If Fungi, only true if explicit conservation category exists (e.g. 송이버섯 with VU).
  // Pure edibility or toxicity descriptions (식용, 맹독, 부생균 등) are NOT conservation status!
  const hasExplicitStatus = Boolean(
    statusText &&
    statusText.trim().length > 0 &&
    !statusText.includes('표준 상태') &&
    !statusText.includes('정보 없음') &&
    /CR|EN|VU|NT|LC|DD|위급|위기|취약|준위협|관심대상|멸종위기|보호종|천연기념물|고유종|교란|귀화/i.test(statusText) &&
    (!isFungi || /CR|EN|VU|NT|LC|DD|위급|위기|취약|준위협|멸종위기|보호종|천연기념물/i.test(statusText))
  );

  let iucnCategory: GlobalEcoStatusProfile['iucnCategory'] = null;
  let iucnLabel = '보전 정보 미확인';

  if (/위급|CR|Critically Endangered/i.test(statusText)) {
    iucnCategory = 'CR';
    iucnLabel = '위급 (Critically Endangered, CR)';
  } else if (/위기|EN|Endangered/i.test(statusText)) {
    iucnCategory = 'EN';
    iucnLabel = '멸종위기 (Endangered, EN)';
  } else if (/취약|VU|Vulnerable/i.test(statusText)) {
    iucnCategory = 'VU';
    iucnLabel = '취약 (Vulnerable, VU)';
  } else if (/준위협|NT|Near Threatened/i.test(statusText)) {
    iucnCategory = 'NT';
    iucnLabel = '준위협 (Near Threatened, NT)';
  } else if (!isFungi && /관심대상|LC|Least Concern/i.test(statusText)) {
    iucnCategory = 'LC';
    iucnLabel = '안전 (Least Concern, LC)';
  } else if (/정보부족|DD|Data Deficient/i.test(statusText)) {
    iucnCategory = 'DD';
    iucnLabel = '정보부족 (Data Deficient, DD)';
  }

  const tierMeta = getIucnTierMeta(iucnCategory);

  // 7. Dynamic Category-Specific Slot 4 Niche Generation
  // When there is NO conservation data (e.g. 참가재, wild mushrooms without IUCN status, or unassessed species),
  // hasSlot4 = false so the UI gracefully reduces from 4 cards to 3 cards!
  let hasSlot4 = false;
  let slot4Label = '';
  let slot4Val = '';
  let slot4Theme: GlobalEcoStatusProfile['slot4Theme'] = 'normal';
  let slot4BadgeText = '';
  let slot4DetailTitle = '';
  let slot4DetailedNarrative = '';
  let slot4DataSource = '';
  let slot4DbCode = '';

  if (invasiveMatch && invasiveMatch.type === 'disturber') {
    hasSlot4 = true;
    slot4Label = '생태계 교란';
    slot4Val = invasiveMatch.db === 'IUCN_GISD_100' ? 'IUCN 100대 교란종' : '생태계교란 생물';
    slot4Theme = 'disturber';
    slot4BadgeText = `⚠️ 원산: ${invasiveMatch.origin.split('(')[0]}`;
    slot4DetailTitle = `생태계교란 생물 지정 및 고유 생물다양성 관리`;
    slot4DetailedNarrative = `자생 원산지는 [${invasiveMatch.origin}]이며, [${invasiveMatch.introduced}]에 유입되었습니다. ${invasiveMatch.impact}. 환경부 생태계교란 생물 및 세계자연보전연맹(IUCN) 침입종전문가그룹(ISSG) 지침에 따라 고유 생태계 보전을 위한 확산 모니터링이 이루어지고 있습니다.`;
    slot4DataSource = '환경부 생태계교란생물 도감 & IUCN GISD';
    slot4DbCode = 'ME-INVASIVE-DISTURB';
  } else if (invasiveMatch && invasiveMatch.type === 'naturalized') {
    hasSlot4 = true;
    slot4Label = '식물 지위';
    slot4Val = '외래 귀화식물';
    slot4Theme = 'naturalized';
    slot4BadgeText = `🌱 원산: ${invasiveMatch.origin.split('(')[0]}`;
    slot4DetailTitle = `외래 귀화식물의 도심 생태계 적응 및 밀원 제공`;
    slot4DetailedNarrative = `원산지는 [${invasiveMatch.origin}]이며, 국내외 도시 및 초지에 정착한 대표적인 귀화식물입니다. ${invasiveMatch.impact}. 맹독이나 공격적인 교란종이 아니며, 도심 생태계에서 곤충들에게 꿀과 화분을 제공하는 식생 구성원으로 자리잡고 있습니다. (국립수목원 국가생물종지식정보시스템 귀화식물 등록)`;
    slot4DataSource = '국립수목원 KNA 국가생물종표준도감 (귀화종)';
    slot4DbCode = 'KNA-NATURALIZED-PLANT';
  } else if (isEndemicKorean) {
    hasSlot4 = true;
    slot4Label = '고유 특산';
    slot4Val = tierMeta ? `한반도 고유 · ${tierMeta.code}` : (iucnCategory ? `한반도 고유 · ${iucnCategory}` : '한반도 고유종');
    slot4Theme = 'endemic';
    slot4BadgeText = '🇰🇷 한반도 고유 생물자원';
    slot4DetailTitle = '대한민국 고유종(Endemic Species) 생물주권 보전 가치';
    slot4DetailedNarrative = `${koreanName}은(는) 전 세계에서 오직 한반도 및 인접 수계에만 자생하는 대한민국 고유 특산 생물입니다. 빙하기 이후 한반도 고유의 지형 및 수계 격리 과정을 거쳐 독자적으로 분화하였으며, 국가 생물주권 및 유전자원 보전 측면에서 최우선 보호 가치를 지닙니다.`;
    slot4DataSource = '국립생물자원관(NIBR) 국가생물종목록';
    slot4DbCode = 'NIBR-KOREA-ENDEMIC';
  } else if (hasExplicitStatus) {
    hasSlot4 = true;
    slot4Label = '보전 등급';
    slot4Val = tierMeta ? `${tierMeta.nameKo} (${tierMeta.code})` : (statusText.split('•')[0].trim());
    slot4Theme = (iucnCategory && ['CR', 'EN', 'VU', 'NT'].includes(iucnCategory)) ? 'warning' : 'normal';
    slot4BadgeText = tierMeta ? tierMeta.shortBadge : (iucnCategory ? `IUCN ${iucnCategory} 등급` : '자연 보전 지표');
    slot4DetailTitle = `${koreanName} 글로벌 보전 지위 & 평가 프로파일`;
    slot4DetailedNarrative = tierMeta
      ? `${tierMeta.description} (국제자연보전연맹 IUCN 적색목록 공식 등급)`
      : `국제자연보전연맹(IUCN) 적색목록 및 서식지 모니터링 자료에 등재된 개체군 생존 상태입니다: ${statusText}`;
    slot4DataSource = 'IUCN Red List of Threatened Species & GBIF Ecosystem';
    slot4DbCode = 'IUCN-REDLIST-GLOB';
  } else {
    // NO explicit conservation data -> slot 4 is NOT rendered (UI drops cleanly to 3 cards)
    hasSlot4 = false;
  }

  return {
    realm,
    realmNameKo,
    nativeRange,
    isEndemic: isEndemicKorean,
    isInvasiveGlobal: invasiveMatch?.type === 'disturber',
    isNaturalized: invasiveMatch?.type === 'naturalized',
    invasiveDatabase: invasiveMatch?.db,
    iucnCategory,
    iucnLabel,
    tierMeta,
    hasSlot4,
    hasConservationData: hasExplicitStatus,
    slot4Label,
    slot4Val,
    slot4Theme,
    slot4BadgeText,
    slot4DetailTitle,
    slot4DetailedNarrative,
    slot4DataSource,
    slot4DbCode,
  };
}
