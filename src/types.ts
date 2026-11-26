export type SpecimenCategory = 'all' | 'plants' | 'birds' | 'insects' | 'mammals' | 'reptiles' | 'amphibians' | 'fishes' | 'fungi' | 'arachnids' | 'mollusks' | 'crustaceans' | 'others';

export type NaturalistPersona =
  | 'general'
  | 'botanist'
  | 'entomologist'
  | 'birder'
  | 'mammalogist'
  | 'mycologist'
  | 'herpetologist'
  | 'ichthyologist'
  | 'invertebrates';

export type AuthProvider = 'google' | 'kakao' | 'apple' | 'email' | 'guest';

export interface UserAccount {
  isLoggedIn: boolean;
  id?: string; // 계정별 저장 데이터 키 (게스트는 없음)
  email?: string;
  name: string;
  nickname?: string;
  nicknameUpdatedAt?: string;
  provider: AuthProvider;
  profileImage?: string;
  connectedAt?: string;
  ageGroup?: 'adult_or_teen14' | 'under14';
  isUnder14?: boolean;
  guardianConsentPending?: boolean;
  guardianConsent?: {
    guardianName: string;
    guardianEmail: string;
    consentedAt: string;
  };
}

export interface LoginOptions {
  persona?: NaturalistPersona; // 온보딩에서 정한 탐험가 유형
  firstSpecimen?: Specimen; // 가입 전 체험으로 포착한 첫 생물 (빈 칸이 있으면 1번 칸으로 등록)
  closeOnboarding?: boolean; // 로그인 후 온보딩을 바로 닫고 홈으로
}

export interface SpeciesEcologyDetail {
  id: string;
  koreanName: string;
  scientificName: string;
  englishName: string;
  category: 'birds' | 'plants' | 'mammals' | 'insects' | 'reptiles' | 'amphibians' | 'fishes' | 'fungi' | 'arachnids' | 'mollusks' | 'crustaceans' | 'others';
  categoryLabel: string;
  family: string;
  order?: string;
  size: string;
  status: string; // e.g. "관심대상(LC)", "천연기념물 제327호", "도심 흔한 텃새"
  keyIdentification: string; // 생김새 (주요 외형 및 식별 형질)
  callOrSound: string; // 울음소리, 소리 패턴 또는 향기/감촉
  dietAndBehavior: string; // 생태 (먹이 활동, 비행/이동 행동, 번식 습성 / 개화 결실)
  habitat: string; // 서식지 (주 서식지 환경)
  etymology?: string; // 어원 (이름의 유래 - 선택)
  specialNotes?: string; // 특이사항 (보호등급, 약용/식용, 독성, 꽃말 등 - 선택)
  bestObservationTip: string; // 필드 관찰 및 촬영 요령
  photoGearTip?: string; // 추천 탐사 및 촬영 장비
  fieldEtiquette?: string; // 생태 탐사 에티켓 및 안전 주의사항
  categoryFocus?: string; // 카테고리별 핵심 초점 (식독판별/주야활동/개화결실 등)
  lynxBirdLifeNote: string; // BirdLife / Lynx Edicions / Flora of Korea 학술 인용
  seasonality: string; // 사계절 관찰 시기
  tags: string[];
  sources?: {
    taxonomy?: string;
    appearance?: string;
    habitat?: string;
    dietAndBehavior?: string;
    etymology?: string;
    conservation?: string;
    general?: string;
  };
}

export interface HotspotEcology {
  id: string;
  name: string;
  category: 'birds' | 'plants' | 'mammals' | 'insects' | 'general' | 'reptiles' | 'amphibians' | 'fishes' | 'fungi' | 'arachnids' | 'mollusks' | 'crustaceans' | 'others';
  categoryLabel: string;
  distanceKm: number;
  locationName: string;
  address: string;
  birdlifeRef?: string; // e.g. "BirdLife IBA KR012"
  lynxEdicionsRef?: string; // e.g. "Lynx Handbook Vol.8"
  bestSeason: string;
  bestTime: string;
  habitatBadge: string;
  targetSpecies: {
    koreanName: string;
    scientificName: string;
    rarity: 'common' | 'uncommon' | 'rare';
    chancePercent: number;
  }[];
  fieldTips: string;
  mapCoord: { x: number; y: number };
}

export interface Observation {
  id: string;
  date: string;
  time: string;
  location: string;
  weather: string;
  temperature: string;
  photoUrl: string;
  seasonLabel?: string;
  memo?: string;
  detectedHabitatName?: string;
  environmentalCharacteristics?: string;
  focusPoint?: { x: number; y: number }; // Relative percentage (0-100) target point on photo
  focusAfMode?: 'Auto Multi-AF' | 'Spot Tap-AF' | 'Macro Focus' | 'Center Eye-AF';
  isCapturedWithLens?: boolean; // True if captured via real-time Lens (camera), false if imported from album
  photoScore?: number;
  photoGrade?: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  aiOneLineReview?: string;
  identificationMeta?: {
    stage1Engine: string;
    stage2Engine?: string;
    escalatedToGemini: boolean;
    escalationReasons?: string[];
    imageQualityScore?: number;
  };
  analysisMetadata?: {
    imageClarityScore: number; // 0-100
    isTargetInFocus: boolean;
    featuresDetected: string[]; // e.g., ["wing_pattern", "stamen", "leaf_veins"]
    recognitionConfidence: number; // 0-100
  };
}

export interface Candidate {
  koreanName: string;
  scientificName: string;
  confidence: number;
  family?: string;
  genus?: string;
  category?: 'plants' | 'birds' | 'insects' | 'mammals' | 'reptiles' | 'amphibians' | 'fungi' | 'arachnids' | 'mollusks' | 'crustaceans' | 'others';
}

export type SupportedLanguage = 'ko' | 'en' | 'zh' | 'ja' | 'fr' | 'es' | 'de';

export interface Specimen {
  id: string;
  number: string;
  koreanName: string;
  englishName?: string;
  scientificName: string;
  category: 'plants' | 'birds' | 'insects' | 'mammals' | 'reptiles' | 'amphibians' | 'fishes' | 'fungi' | 'arachnids' | 'mollusks' | 'crustaceans' | 'others';
  family: string; // e.g. "국화과 (Asteraceae)"
  genus: string;  // e.g. "민들레속 (Taraxacum)"
  isCollected: boolean;
  isPending?: boolean;
  isLive?: boolean;
  candidates?: Candidate[];
  stickerImage?: string; // Cutout transparent PNG/SVG with white border style
  originalImage?: string; // Full-bleed original photograph
  silhouetteSvg?: string; // For uncollected line-art specimen slot
  confidence?: number;
  taxonomyPath: string[]; // e.g. ["식물계", "속씨식물문", "쌍떡잎식물강", "국화목", "국화과", "민들레속", "서양민들레"]
  traitChips: string[];
  habitatType: string; // e.g. "도심/골목길", "아파트 화단", "도시/공원", "습지/하천", "산림/숲", "초지/들판", "해외/도시"
  observations: Observation[];
  wikiSummary: string;
  wikiUrl: string;
  seasonalTip?: string;
  colorPalette?: string[]; // 5 harmonic nature hex colors extracted from specimen
  isDeleted?: boolean;
  deletedAt?: number;
  isDataValidated?: boolean; // New flag for data validation
  locationCoord?: {
    name: string;
    city?: string;      // e.g. "서울", "도쿄", "파리", "제주", "뉴욕"
    district?: string;  // e.g. "성수동", "마포구", "강남", "시부야", "몽마르트르"
    country?: string;   // e.g. "대한민국", "일본", "프랑스", "미국"
    environmentType?: 'urban_alley' | 'apartment_garden' | 'street' | 'indoor_terrace' | 'urban_park' | 'nature_wild' | 'forest' | 'wetland';
    lat?: number;       // e.g. 37.544
    lng?: number;       // e.g. 127.037
    x: number; // 0-100% on local map or projected
    y: number; // 0-100% on local map or projected
    mapScope?: 'seoul' | 'global' | 'local_urban';
  };
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'discover' | 'streak' | 'habitat' | 'species';
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface HabitatRegion {
  id: string;
  name: string;
  type: 'wetland' | 'forest' | 'urban' | 'grassland' | 'urban_alley' | 'apartment_garden' | 'nature_wild';
  typeName: string;
  color: string;
  description: string;
  bounds: { x: number; y: number; width: number; height: number }; // % on map
  recommendedSpecies: string[];
  city?: string;
  district?: string;
  country?: string;
  mapScope?: 'seoul' | 'global' | 'local_urban';
}

export interface UserStats {
  freeScans: number;
  isProUser: boolean;
  planType: 'free' | 'monthly' | 'yearly' | 'lifetime';
  subscribedAt?: string; // 월·연 구독 시작 시각(ISO). 예상 다음 결제일 계산에만 사용. 무료 전환 시 제거
  streakDays: number;
  exploredHabitats: string[];
  totalScans: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  highResCloudSync: boolean;
  pushDiscoveryAlerts: boolean;
  homeCity: string;
  taxonomyDisplayMode: 'common_first' | 'scientific_first';
  photoQuality: 'original' | 'optimized';
  unitSystem: 'metric' | 'imperial';
  viewJournalMode: boolean; // Focus on narrative observation rather than completion %
  persona?: NaturalistPersona; // 온보딩에서 정한 탐험가 유형
  preferredLocations?: string[]; // 온보딩 장소 선택
  visitFrequency?: string; // 온보딩 방문 빈도
  purposes?: string[]; // 온보딩 기록 목적
  exp: number; // 호환용 저장값(표시 미사용). EXP는 획득 뱃지 expReward 합계로 계산
  badges: string[];
  selectedTitleId?: string;
  questAlertsEnabled?: boolean;
  badgeHistoryPublic?: boolean;
  hideFromRanking?: boolean;
  mapSettings?: {
    defaultVisibility?: 'public' | 'nearby' | 'private';
    hideExactLocation?: boolean;
    notifyComment?: boolean;
    notifyLike?: boolean;
    notifyReply?: boolean;
    notifyNearby?: boolean;
    notifyBadge?: boolean;
  };
  language?: SupportedLanguage; // 'ko' | 'en' | 'zh' | 'ja' | 'fr' | 'es' | 'de'
  showEnglishNameWithLocal?: boolean; // When non-English is chosen, show English name alongside
  country?: string; // e.g. 'KR', 'US', 'JP', 'CN', 'FR', 'AU', 'GLOBAL'
}

export const EXPLORER_TITLES = {
  ko: {
    levels: [
      { adj: '초보', level: 1 },
      { adj: '관찰하는', level: 2 },
      { adj: '숙련된', level: 3 },
      { adj: '마스터', level: 4 },
      { adj: '전설의', level: 5 },
    ],
    personas: {
      general: { title: '만능 탐험가', color: 'text-[#6B9F0A]', hex: '#6B9F0A' },
      botanist: { title: '식물 탐험가', color: 'text-[#6B9F0A]', hex: '#6B9F0A' },
      plants: { title: '식물 탐험가', color: 'text-[#6B9F0A]', hex: '#6B9F0A' },
      birder: { title: '조류 탐험가', color: 'text-[#778AA6]', hex: '#778AA6' },
      birds: { title: '조류 탐험가', color: 'text-[#778AA6]', hex: '#778AA6' },
      entomologist: { title: '곤충 탐험가', color: 'text-[#DFAD3E]', hex: '#DFAD3E' },
      insects: { title: '곤충 탐험가', color: 'text-[#DFAD3E]', hex: '#DFAD3E' },
      mammalogist: { title: '포유류 탐험가', color: 'text-[#C76C2C]', hex: '#C76C2C' },
      mammals: { title: '포유류 탐험가', color: 'text-[#C76C2C]', hex: '#C76C2C' },
      herpetologist: { title: '양서·파충류 탐험가', color: 'text-[#1fa38a]', hex: '#1fa38a' },
      reptiles: { title: '파충류 탐험가', color: 'text-[#1fa38a]', hex: '#1fa38a' },
      amphibians: { title: '양서류 탐험가', color: 'text-[#1fa38a]', hex: '#1fa38a' },
      ichthyologist: { title: '어류 탐험가', color: 'text-[#2f5fd0]', hex: '#2f5fd0' },
      fishes: { title: '어류 탐험가', color: 'text-[#2f5fd0]', hex: '#2f5fd0' },
      mycologist: { title: '균류 탐험가', color: 'text-[#7a5646]', hex: '#7a5646' },
      fungi: { title: '균류 탐험가', color: 'text-[#7a5646]', hex: '#7a5646' },
      invertebrates: { title: '무척추동물 탐험가', color: 'text-[#e8896a]', hex: '#e8896a' },
      arachnids: { title: '무척추동물 탐험가', color: 'text-[#e8896a]', hex: '#e8896a' },
      mollusks: { title: '무척추동물 탐험가', color: 'text-[#e8896a]', hex: '#e8896a' },
      crustaceans: { title: '무척추동물 탐험가', color: 'text-[#e8896a]', hex: '#e8896a' },
    }
  },
  en: {
    levels: [
      { adj: 'Novice', level: 1 },
      { adj: 'Observing', level: 2 },
      { adj: 'Experienced', level: 3 },
      { adj: 'Master', level: 4 },
      { adj: 'Legendary', level: 5 },
    ],
    personas: {
      general: { title: 'General Explorer', color: 'text-stone-900', hex: '#18181B' },
      botanist: { title: 'Plant Explorer', color: 'text-[#5fa800]', hex: '#5fa800' },
      plants: { title: 'Plant Explorer', color: 'text-[#5fa800]', hex: '#5fa800' },
      birder: { title: 'Bird Explorer', color: 'text-[#6f9bd6]', hex: '#6f9bd6' },
      birds: { title: 'Bird Explorer', color: 'text-[#6f9bd6]', hex: '#6f9bd6' },
      entomologist: { title: 'Insect Explorer', color: 'text-[#f2b705]', hex: '#f2b705' },
      insects: { title: 'Insect Explorer', color: 'text-[#f2b705]', hex: '#f2b705' },
      mammalogist: { title: 'Mammal Explorer', color: 'text-[#c8702a]', hex: '#c8702a' },
      mammals: { title: 'Mammal Explorer', color: 'text-[#c8702a]', hex: '#c8702a' },
      herpetologist: { title: 'Herptile Explorer', color: 'text-[#1fa38a]', hex: '#1fa38a' },
      reptiles: { title: 'Reptile Explorer', color: 'text-[#1fa38a]', hex: '#1fa38a' },
      amphibians: { title: 'Amphibian Explorer', color: 'text-[#1fa38a]', hex: '#1fa38a' },
      ichthyologist: { title: 'Fish Explorer', color: 'text-[#2f5fd0]', hex: '#2f5fd0' },
      fishes: { title: 'Fish Explorer', color: 'text-[#2f5fd0]', hex: '#2f5fd0' },
      mycologist: { title: 'Fungi Explorer', color: 'text-[#7a5646]', hex: '#7a5646' },
      fungi: { title: 'Fungi Explorer', color: 'text-[#7a5646]', hex: '#7a5646' },
      invertebrates: { title: 'Invertebrate Explorer', color: 'text-[#e8896a]', hex: '#e8896a' },
      arachnids: { title: 'Invertebrate Explorer', color: 'text-[#e8896a]', hex: '#e8896a' },
      mollusks: { title: 'Invertebrate Explorer', color: 'text-[#e8896a]', hex: '#e8896a' },
      crustaceans: { title: 'Invertebrate Explorer', color: 'text-[#e8896a]', hex: '#e8896a' },
    }
  }
};

export type MemoReportReason =
  | '스팸 · 광고'
  | '부적절한 내용'
  | '위험한 위치 노출'
  | '사진 도용'
  | '기타';

export type MemoVisibility = 'public' | 'nearby' | 'private';

export interface ExplorerProfile {
  id: string;
  name: string;
  handle: string;
  titleBadge: string;
  bio: string;
  avatarColor: string;
  avatarEmoji: string;
  memoCount: number;
  followersCount: number;
  speciesCount: number;
  favoriteRegion: string;
  joinedAt: string;
}

export interface CommunityComment {
  id: string;
  memoId: string;
  authorId: string;
  authorName: string;
  authorEmoji: string;
  content: string;
  createdAt: string;
}

export interface CommunityMemo {
  id: string;
  authorId: string;
  authorName: string;
  authorTitle: string;
  authorEmoji: string;
  speciesKoreanName: string;
  speciesScientificName: string;
  category: Specimen['category'];
  specimenId?: string;
  photoUrl: string;
  memoText: string;
  placeName: string;
  regionLabel: string;
  lat: number;
  lng: number;
  isProtectedSpecies: boolean;
  exifStripped: boolean;
  visibility?: MemoVisibility;
  createdAt: string;
  likesCount: number;
  likedByMe?: boolean;
  comments: CommunityComment[];
}

export interface MapNotification {
  id: string;
  type: 'like' | 'comment' | 'nearby' | 'safety';
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  targetMemoId?: string;
}

export interface PublicSpecimenEntry {
  id: string;
  authorId: string;
  authorName: string;
  authorTitle: string;
  authorEmoji: string;
  speciesKoreanName: string;
  speciesScientificName: string;
  category: Specimen['category'];
  photoUrl: string;
  observedDate: string;
  regionLabel: string;
  habitatType: string;
  weather?: string;
  temperature?: string;
  fieldNote: string;
  traitChips?: string[];
  isProtectedSpecies?: boolean;
}
