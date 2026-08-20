export type SpecimenCategory = 'all' | 'plants' | 'birds' | 'insects' | 'mammals';

export type NaturalistPersona = 'general' | 'botanist' | 'birder' | 'mammalogist' | 'entomologist';

export type AuthProvider = 'google' | 'kakao' | 'apple' | 'email' | 'guest';

export interface UserAccount {
  isLoggedIn: boolean;
  email?: string;
  name: string;
  provider: AuthProvider;
  profileImage?: string;
  connectedAt?: string;
}

export interface SpeciesEcologyDetail {
  id: string;
  koreanName: string;
  scientificName: string;
  englishName: string;
  category: 'birds' | 'plants' | 'mammals' | 'insects';
  categoryLabel: string;
  family: string;
  order?: string;
  size: string;
  status: string; // e.g. "관심대상(LC)", "천연기념물 제327호", "도심 흔한 텃새"
  keyIdentification: string; // 주요 외형 및 식별 형질
  callOrSound: string; // 울음소리, 소리 패턴 또는 향기/감촉
  dietAndBehavior: string; // 먹이 활동, 비행/이동 행동, 번식 습성
  habitat: string; // 주 서식지 환경
  bestObservationTip: string; // 필드 관찰 요령
  lynxBirdLifeNote: string; // BirdLife / Lynx Edicions / Flora of Korea 학술 인용
  seasonality: string; // 사계절 관찰 시기
  tags: string[];
}

export interface HotspotEcology {
  id: string;
  name: string;
  category: 'birds' | 'plants' | 'mammals' | 'insects' | 'general';
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
}

export interface Candidate {
  koreanName: string;
  scientificName: string;
  confidence: number;
  family?: string;
  genus?: string;
  category?: 'plants' | 'birds' | 'insects' | 'mammals' | 'others';
}

export interface Specimen {
  id: string;
  number: string;
  koreanName: string;
  scientificName: string;
  category: 'plants' | 'birds' | 'insects' | 'mammals';
  family: string; // e.g. "국화과 (Asteraceae)"
  genus: string;  // e.g. "민들레속 (Taraxacum)"
  isCollected: boolean;
  isPending?: boolean;
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
  locationCoord?: {
    name: string;
    city?: string;      // e.g. "서울", "도쿄", "파리", "제주", "뉴욕"
    district?: string;  // e.g. "성수동", "마포구", "강남", "시부야", "몽마르트르"
    country?: string;   // e.g. "대한민국", "일본", "프랑스", "미국"
    environmentType?: 'urban_alley' | 'apartment_garden' | 'street' | 'indoor_terrace' | 'urban_park' | 'nature_wild';
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
  type: 'wetland' | 'forest' | 'urban' | 'grassland' | 'urban_alley' | 'apartment_garden';
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
  planType: 'free' | 'monthly' | 'yearly';
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
  persona?: NaturalistPersona; // e.g. 'general', 'birder', 'botanist', 'mammalogist', 'entomologist'
  badges: string[];
}

