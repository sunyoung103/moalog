import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Zap,
  ZapOff,
  Upload,
  Check,
  X,
  Sparkles,
  MapPin,
  Calendar,
  Star,
  Camera,
  RotateCcw,
  Sparkle,
  BookOpen,
  Focus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Settings,
  VolumeX,
  Volume2,
  SlidersHorizontal,
  Radio,
  Video,
  HelpCircle,
} from 'lucide-react';
import { Specimen, Observation } from '../types';
import { getApiSource, getIdentificationSourceMetadata } from '../utils/apiSources';
import { sounds, getFormattedNow } from '../utils/cutoutHelper';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';

interface LensViewProps {
  onCollectSpecimen: (newSpecimen: Specimen, observation: Observation) => void;
  existingSpecimens: Specimen[];
  freeScansRemaining: number;
  isProUser: boolean;
  currentPersona: string;
  onNavigateToArchive: () => void;
  onOpenPaywall: () => void;
}

type AspectRatio = '4:3' | '1:1' | 'full';

// Preset specimens with multiple multi-angle photos for carousel review and instant testing
const SCAN_PRESETS = [
  {
    name: '서양민들레',
    scientific: 'Taraxacum officinale',
    category: 'plants' as const,
    family: '',
    genus: '',
    confidence: 99,
    image: 'https://images.unsplash.com/photo-1558285549-2a06fdfc5547?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1558285549-2a06fdfc5547?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=800&auto=format&fit=crop&q=80',
    ],
    colorPalette: ['#E6C229', '#2E7D32', '#7CB342', '#3E2723', '#F9FBE7'],
    taxonomyPath: ['식물계', '속씨식물문', '쌍떡잎식물강', '국화목', '국화과', '민들레속', '서양민들레'],
    traitChips: ['쌍떡잎식물', '다년생초본', '노란 두상화', '총포편 젖혀짐', '보도블록/도심 골목'],
    habitatType: '도심/골목길',
    wikiSummary: '서양민들레는 국화과의 여러해살이풀로 총포편이 뒤로 젖혀져 있는 것이 특징입니다. 꽃이 진 후 솜털 같은 홀씨를 맺어 아스팔트와 보도블록 틈에서도 번식합니다.',
    wikiUrl: 'https://ko.wikipedia.org/wiki/%EC%84%9C%EC%96%91%EB%AF%BC%EB%93%A4%EB%A0%88',
    seasonalTip: '봄부터 늦가을까지 도심 골목과 화단에서 흔히 관찰됩니다.',
    locationInfo: {
      name: '성수동 골목길 보도블록',
      city: '서울',
      district: '성동구 성수동',
      country: '대한민국',
      environmentType: 'urban_alley' as const,
      x: 58,
      y: 52,
    },
  },
  {
    name: '참새',
    scientific: 'Passer montanus',
    category: 'birds' as const,
    family: '',
    genus: '',
    confidence: 99,
    image: 'https://images.unsplash.com/photo-1522926197415-e580a2dfa733?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1522926197415-e580a2dfa733?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555169062-013468b47731?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
    ],
    colorPalette: ['#78350F', '#A16207', '#D4D4D8', '#18181B', '#FEF3C7'],
    taxonomyPath: ['동물계', '척삭동물문', '조강', '참새목', '참새과', '참새속', '참새'],
    traitChips: ['도심 대표 텃새', '뺨의 검은 반점', '군집 생활', '곡물/곤충 섭식', '카페 테라스'],
    habitatType: '도심/골목길',
    wikiSummary: '참새는 인간 생활권과 가장 밀접하게 공존하는 소형 텃새입니다. 흰 뺨에 찍힌 선명한 검은색 둥근 점이 특징이며 도심 테라스와 골목에서 모이를 찾습니다.',
    wikiUrl: 'https://ko.wikipedia.org/wiki/%EC%B0%B8%EC%83%88',
    seasonalTip: '도심 카페 야외 테라스나 벤치 주변에서 연중 활발하게 활동합니다.',
    locationInfo: {
      name: '연남동 경의선 숲길 테라스',
      city: '서울',
      district: '마포구 연남동',
      country: '대한민국',
      environmentType: 'urban_alley' as const,
      x: 35,
      y: 38,
    },
  },
  {
    name: '몬스테라 델리시오사',
    scientific: 'Monstera deliciosa',
    category: 'plants' as const,
    family: '',
    genus: '',
    confidence: 98,
    image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1599598425947-320a6797a783?w=800&auto=format&fit=crop&q=80',
    ],
    colorPalette: ['#064E3B', '#047857', '#10B981', '#34D399', '#ECFDF5'],
    taxonomyPath: ['식물계', '속씨식물문', '외떡잎식물강', '천남성목', '천남성과', '몬스테라속', '몬스테라'],
    traitChips: ['열대 덩굴성', '잎 갈라짐(천공)', '공기뿌리', '실내 가드닝 인기', '공기정화'],
    habitatType: '실내/테라스',
    wikiSummary: '몬스테라는 현대 도심 인테리어와 카페 가드닝의 상징으로 사랑받는 열대 관엽식물입니다.',
    wikiUrl: 'https://ko.wikipedia.org/wiki/%EB%AA%AC%EC%8A%A4%ED%85%8C%EB%9D%BC_%EB%8D%B8%EB%A6%AC%EC%8B%9C%EC%98%A4%EC%82%AC',
    seasonalTip: '도심 실내나 카페에서 사계절 내내 새순을 올리며 자랍니다.',
    locationInfo: {
      name: '테헤란로 오피스 가든 라운지',
      city: '서울',
      district: '강남구 역삼동',
      country: '대한민국',
      environmentType: 'indoor_terrace' as const,
      x: 62,
      y: 68,
    },
  },
  {
    name: '유럽 울새 (로빈)',
    scientific: 'Erithacus rubecula',
    category: 'birds' as const,
    family: '',
    genus: '',
    confidence: 97,
    image: 'https://images.unsplash.com/photo-1544860707-c352cc5a92e3?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1544860707-c352cc5a92e3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&auto=format&fit=crop&q=80',
    ],
    colorPalette: ['#EA580C', '#C2410C', '#78350F', '#A8A29E', '#FFF7ED'],
    taxonomyPath: ['동물계', '척삭동물문', '조강', '참새목', '솔딱새과', '울새속', '유럽울새'],
    traitChips: ['유럽 대표 조류', '주황색 가슴깃', '호기심 많음', '낭랑한 지저귐', '해외 도시공원'],
    habitatType: '해외/도시생태',
    wikiSummary: '유럽 울새(European Robin)는 유럽과 프랑스 파리 등의 도심 공원에서 가장 친숙하게 만날 수 있는 참새목 조류입니다.',
    wikiUrl: 'https://ko.wikipedia.org/wiki/%EC%9C%A0%EB%9F%BD%EC%9A%B8%EC%83%88',
    seasonalTip: '파리 등 유럽 공원 벤치 주변까지 스스럼없이 다가옵니다.',
    locationInfo: {
      name: '파리 뤽상부르 공원',
      city: '파리',
      district: '6구 라탱 지구',
      country: '프랑스',
      environmentType: 'urban_park' as const,
      x: 25,
      y: 35,
    },
  },
  {
    name: '청둥오리',
    scientific: 'Anas platyrhynchos',
    category: 'birds' as const,
    family: '',
    genus: '',
    confidence: 98,
    image: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555169062-013468b47731?w=800&auto=format&fit=crop&q=80',
    ],
    colorPalette: ['#065F46', '#047857', '#F59E0B', '#1E3A8A', '#E2E8F0'],
    taxonomyPath: ['동물계', '척삭동물문', '조강', '기러기목', '오리과', '오리속', '청둥오리'],
    traitChips: ['수조류', '수컷 녹색 광택 머리', '물갈퀴', '수생식물 섭식', '습지 서식'],
    habitatType: '습지/하천',
    wikiSummary: '청둥오리는 하천과 호수에서 흔히 볼 수 있는 대표적인 물새입니다. 수컷은 머리가 에메랄드빛 광택이 나는 짙은 녹색이며, 목에 가느다란 흰 띠가 있습니다.',
    wikiUrl: 'https://ko.wikipedia.org/wiki/%EC%B2%AD%EB%91%A5%EC%98%A4%EB%A6%AC',
    seasonalTip: '서울숲 습지생태원 및 한강 합수부에서 사계절 내내 무리 지어 유영합니다.',
    locationInfo: {
      name: '서울숲 습지생태원',
      city: '서울',
      district: '성동구 성수동',
      country: '대한민국',
      environmentType: 'nature_wild' as const,
      x: 55,
      y: 56,
    },
  },
  {
    name: '루비목벌새',
    scientific: 'Archilochus colubris',
    category: 'birds' as const,
    family: '벌새과',
    genus: '벌새속',
    confidence: 99,
    image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551085254-e96b210df58a?w=800&auto=format&fit=crop&q=80',
    ],
    colorPalette: ['#dc2626', '#15803d', '#1e293b', '#f8fafc'],
    taxonomyPath: ['동물계', '척삭동물문', '조강', '칼새목', '벌새과', '루비목벌새'],
    traitChips: ['초고속 날갯짓(초당 50회+)', '공중정지비행(호버링)', '에메랄드/루비빛 광택', '꽃꿀 전문 섭식'],
    habitatType: '열대/아열대 운무림',
    wikiSummary: '루비목벌새는 공중정지 비행과 후진 비행이 가능한 신비로운 소형 조류로 햇빛 각도에 따라 목 부위가 붉은 보석처럼 빛납니다.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Ruby-throated_hummingbird',
    seasonalTip: '밝은 붉은색 꽃이나 허밍버드 피더 주변에서 고속 셔터로 날개짓을 촬영할 수 있습니다.',
    locationInfo: {
      name: '몬테베르데 운무림 허밍버드 가든',
      city: '몬테베르데',
      district: '푼타레나스',
      country: '코스타리카',
      environmentType: 'nature_wild' as const,
      x: 25,
      y: 52,
    },
  },
  {
    name: '붉은눈나무개구리',
    scientific: 'Agalychnis callidryas',
    category: 'amphibians' as const,
    family: '청개구리과',
    genus: '나무개구리속',
    confidence: 99,
    image: 'https://images.unsplash.com/photo-1559253664-ca249d4608c6?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1559253664-ca249d4608c6?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=800&auto=format&fit=crop&q=80',
    ],
    colorPalette: ['#ef4444', '#22c55e', '#3b82f6', '#f97316'],
    taxonomyPath: ['동물계', '척삭동물문', '양서강', '무미목', '청개구리과', '붉은눈나무개구리'],
    traitChips: ['선명한 붉은 눈', '형광 연두빛 체색', '주황색 발가락 흡반', '열대우림 야행성'],
    habitatType: '열대우림/수목',
    wikiSummary: '중남미 열대우림을 상징하는 대표적 양서류로 붉은 눈과 파란 옆구리, 주황색 발가락 흡반으로 천적을 놀라게 하는 섬광 채색을 가집니다.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Agalychnis_callidryas',
    seasonalTip: '우기철 밤 몬스테라나 헬리코니아 큰 잎 위에서 휴식하거나 울음소리를 냅니다.',
    locationInfo: {
      name: '아레날 화산 국립공원 레인포레스트',
      city: '알라후엘라',
      district: '라포르투나',
      country: '코스타리카',
      environmentType: 'nature_wild' as const,
      x: 24,
      y: 50,
    },
  },
  {
    name: '블루 모르포 나비',
    scientific: 'Morpho peleides',
    category: 'insects' as const,
    family: '네발나비과',
    genus: '모르포나비속',
    confidence: 98,
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1545063914-a1a6ec821c88?w=800&auto=format&fit=crop&q=80',
    ],
    colorPalette: ['#0284c7', '#0369a1', '#1e293b', '#e0f2fe'],
    taxonomyPath: ['동물계', '절지동물문', '곤충강', '나비목', '네발나비과', '블루모르포'],
    traitChips: ['나노 미세구조색', '코발트블루 광택', '뒷면 눈알무늬(의태)', '열대 캐노피 비행'],
    habitatType: '열대우림/숲길',
    wikiSummary: '날개 표면의 미세 격자 구조가 빛을 회절시켜 눈부신 금속성 푸른빛을 발산하는 세계에서 가장 아름다운 나비 중 하나입니다.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Morpho_peleides',
    seasonalTip: '오전 10시~오후 2시 햇볕이 비치는 숲길 캐노피 틈새에서 활공하는 모습을 만날 수 있습니다.',
    locationInfo: {
      name: '마누엘 안토니오 국립공원 숲길',
      city: '푼타레나스',
      district: '케포스',
      country: '코스타리카',
      environmentType: 'nature_wild' as const,
      x: 26,
      y: 54,
    },
  },
  {
    name: '흰동가리',
    scientific: 'Amphiprion ocellaris',
    category: 'marine' as const,
    family: '자리돔과',
    genus: '흰동가리속',
    confidence: 99,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520315342629-6ea920342047?w=800&auto=format&fit=crop&q=80',
    ],
    colorPalette: ['#f97316', '#ffffff', '#0f172a', '#fb923c'],
    taxonomyPath: ['동물계', '척삭동물문', '조기어강', '농어목', '자리돔과', '흰동가리'],
    traitChips: ['말미잘과 절대공생', '주황 바탕 3줄 흰 띠', '점액질 피부 보호막', '모계 사회 성전환'],
    habitatType: '산호초/해양',
    wikiSummary: '말미잘의 독성 촉수에 면역 점액질을 지녀 공생하며 살아가는 산호초 어류로, 주황색 몸체와 선명한 3개의 흰색 세로 줄무늬가 특징입니다.',
    wikiUrl: 'https://ko.wikipedia.org/wiki/%ED%9D%B0%EB%8F%99%EA%B0%80%EB%A6%AC',
    seasonalTip: '산호초 얕은 수심의 카펫말미잘 촉수 사이에서 머리를 내미는 모습을 수중 촬영하기 좋습니다.',
    locationInfo: {
      name: '그레이트 배리어 리프 아우터 리프',
      city: '케언즈',
      district: '퀸즐랜드주',
      country: '호주',
      environmentType: 'nature_wild' as const,
      x: 85,
      y: 64,
    },
  },
  {
    name: '팬서 카멜레온',
    scientific: 'Furcifer pardalis',
    category: 'reptiles' as const,
    family: '카멜레온과',
    genus: '카멜레온속',
    confidence: 99,
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=800&auto=format&fit=crop&q=80',
    ],
    colorPalette: ['#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
    taxonomyPath: ['동물계', '척삭동물문', '파충강', '뱀목', '카멜레온과', '팬서카멜레온'],
    traitChips: ['화려한 무지개 발색', '독립 회전 원추형 눈', '초고속 탄도 혀', '마다가스카르 고유종'],
    habitatType: '아열대 해안림',
    wikiSummary: '마다가스카르 고유종으로 서식 로컬리티(노시베, 암반자 등)에 따라 터키옥색, 루비색, 라임색 등 환상적인 발색 변이를 자랑합니다.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Panther_chameleon',
    seasonalTip: '해안 관목이나 덤불 가지 위에서 독립적으로 움직이는 두 눈을 관찰해보세요.',
    locationInfo: {
      name: '노시베 섬 해안 관목림',
      city: '노시베',
      district: '디아나구',
      country: '마다가스카르',
      environmentType: 'nature_wild' as const,
      x: 62,
      y: 68,
    },
  },
  {
    name: '푸른바다민달팽이',
    scientific: 'Glaucus atlanticus',
    category: 'marine' as const,
    family: '글라우쿠스과',
    genus: '글라우쿠스속',
    confidence: 99,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
    ],
    colorPalette: ['#38bdf8', '#1e40af', '#e2e8f0', '#0f172a'],
    taxonomyPath: ['동물계', '연체동물문', '복족강', '나선달팽이목', '글라우쿠스과', '글라우쿠스'],
    traitChips: ['바다의 푸른 용', '수면 거꾸로 부유', '자포동물 독소 축적', '환상적 사파이어 체색'],
    habitatType: '원양 표층/조수웅덩이',
    wikiSummary: '신화 속 미니 드래곤을 닮은 부유성 갯민숭달팽이로, 위장 배색과 포르투갈전쟁이의 독소를 체내에 축적하는 놀라운 생태를 지닙니다.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Glaucus_atlanticus',
    seasonalTip: '남동풍이 부는 여름철 해안 조수 웅덩이로 밀려온 수면 거품 속에서 만날 수 있습니다(맨손 접촉 금지).',
    locationInfo: {
      name: '케이프타운 외해 수면 부유물',
      city: '케이프타운',
      district: '서케이프주',
      country: '남아프리카공화국',
      environmentType: 'nature_wild' as const,
      x: 52,
      y: 78,
    },
  },
  {
    name: '빈 공간 (피사체 없음)',
    scientific: 'Empty space',
    category: 'plants' as const,
    family: '없음',
    genus: '없음',
    confidence: 0,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    ],
    colorPalette: ['#ffffff'],
    taxonomyPath: ['없음'],
    traitChips: ['빈 배경', '테스트용'],
    habitatType: '없음',
    wikiSummary: '인식할 피사체가 발견되지 않은 빈 배경입니다.',
    wikiUrl: '',
    seasonalTip: '',
    locationInfo: {
      name: '도심 생태구역',
      city: '서울',
      district: '성동구 성수동',
      country: '대한민국',
      environmentType: 'urban_alley' as const,
      x: 50,
      y: 50,
    },
  },
];

interface SessionShot {
  id: string;
  imageUrl: string;
  preset: typeof SCAN_PRESETS[0];
  isAlbum: boolean;
  zoomScale: number;
  focusPoint?: { x: number; y: number };
  focusAfMode?: 'Auto Multi-AF' | 'Spot Tap-AF' | 'Macro Focus' | 'Center Eye-AF';
}

export const LensView: React.FC<LensViewProps> = ({
  onCollectSpecimen,
  existingSpecimens,
  freeScansRemaining,
  isProUser,
  currentPersona,
  onNavigateToArchive,
  onOpenPaywall,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hasCameraStream, setHasCameraStream] = useState(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  
  // Refined zoom state supporting pinch and gestures natively
  const [zoomScale, setZoomScale] = useState(1.0);
  const touchStartDistanceRef = useRef<number | null>(null);
  const startZoomScaleRef = useRef<number>(1.0);

  // Camera App Settings
  const [isSilentMode, setIsSilentMode] = useState(() => {
    try {
      return localStorage.getItem('moalog_silent_camera') === 'true';
    } catch {
      return false;
    }
  });

  const [flashSetting, setFlashSetting] = useState<'off' | 'auto' | 'on'>(() => {
    try {
      const saved = localStorage.getItem('moalog_flash_setting');
      if (saved === 'auto' || saved === 'on' || saved === 'off') return saved;
    } catch {}
    return 'auto';
  });

  const [isLiveMotionEnabled, setIsLiveMotionEnabled] = useState(true);

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:3');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isShutterFired, setIsShutterFired] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);

  // Session Capture Queue for rapid firing
  const [sessionShots, setSessionShots] = useState<SessionShot[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewActiveIndex, setReviewActiveIndex] = useState(0);

  // Tap-to-focus state & percentage ref
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const lastFocusPercentRef = useRef<{ x: number; y: number; isTap: boolean }>({ x: 50, y: 44, isTap: false });

  // Real-time live environmental data
  const [liveEnv, setLiveEnv] = useState<{
    name: string;
    city: string;
    district: string;
    temperature: string;
    weather: string;
    isLoading: boolean;
  }>({
    name: '서울숲 생태공원',
    city: '서울',
    district: '성동구 성수동',
    temperature: '24°C',
    weather: '☀️ 맑음',
    isLoading: false,
  });

  // Album / Photo capture metadata
  const [isAlbumUpload, setIsAlbumUpload] = useState(false);
  const [uploadDate, setUploadDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [uploadTime, setUploadTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [uploadLocation, setUploadLocation] = useState('서울숲 야외무대');

  // Recognition failure & manual species picker states
  const [isRecognitionFailed, setIsRecognitionFailed] = useState(false);
  const [isManualSpeciesPickerOpen, setIsManualSpeciesPickerOpen] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualCategory, setManualCategory] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const currentPreset = SCAN_PRESETS[selectedPresetIndex];
  const activeImage = customPhotoUrl || currentPreset.image;
  const timeData = getFormattedNow();

  // Load Real-time Geolocation & Live Temperature on mount
  useEffect(() => {
    async function loadRealtimeEnvironment() {
      if (!('geolocation' in navigator)) return;

      try {
        setLiveEnv((prev) => ({ ...prev, isLoading: true }));
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            let liveTemp = '24°C';
            let liveWeather = '☀️ 맑음';
            let locName = '서울숲 생태원';
            let district = '성동구 성수동';

            try {
              const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`
              );
              if (res.ok) {
                const data = await res.json();
                if (data?.current?.temperature_2m !== undefined) {
                  const t = Math.round(data.current.temperature_2m);
                  liveTemp = `${t}°C`;
                  const code = data.current.weather_code;
                  if (code >= 1 && code <= 3) liveWeather = '⛅ 구름 조금';
                  else if (code >= 45 && code <= 48) liveWeather = '🌫️ 안개';
                  else if (code >= 51 && code <= 67) liveWeather = '🌧️ 비';
                  else if (code >= 71 && code <= 77) liveWeather = '❄️ 눈';
                  else if (code >= 80 && code <= 99) liveWeather = '⛈️ 소나기';
                  else liveWeather = '☀️ 맑음';
                }
              }
            } catch {}

            try {
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`
              );
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                const addr = geoData.address || {};
                const neighborhood =
                  addr.park || addr.leisure || addr.suburb || addr.neighbourhood || addr.quarter || '도심 생태구역';
                const city = addr.city || addr.province || addr.state || '서울';
                locName = neighborhood;
                district = `${city} ${addr.suburb || addr.borough || ''}`.trim();
              }
            } catch {}

            setLiveEnv({
              name: locName,
              city: '서울',
              district: district,
              temperature: liveTemp,
              weather: liveWeather,
              isLoading: false,
            });
          },
          () => setLiveEnv((prev) => ({ ...prev, isLoading: false })),
          { timeout: 5000, maximumAge: 60000 }
        );
      } catch {
        setLiveEnv((prev) => ({ ...prev, isLoading: false }));
      }
    }

    loadRealtimeEnvironment();
  }, []);

  // Try initializing camera WebRTC stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setHasCameraStream(true);
          }
        }
      } catch {
        setHasCameraStream(false);
      }
    }

    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Multi-touch Pinch to Zoom Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistanceRef.current = dist;
      startZoomScaleRef.current = zoomScale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistanceRef.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / touchStartDistanceRef.current;
      const newScale = Math.min(5.0, Math.max(0.7, startZoomScaleRef.current * factor));
      // Round to 1 decimal place for butter-smooth visual feedback
      setZoomScale(Math.round(newScale * 10) / 10);
    }
  };

  const handleTouchEnd = () => {
    touchStartDistanceRef.current = null;
  };

  // Handle tap on viewfinder for focus
  const handleViewfinderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReviewOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusPoint({ x, y });
    
    const pctX = Math.round(Math.max(5, Math.min(95, (x / rect.width) * 100)));
    const pctY = Math.round(Math.max(5, Math.min(95, (y / rect.height) * 100)));
    lastFocusPercentRef.current = { x: pctX, y: pctY, isTap: true };

    if (!isSilentMode) {
      sounds.playTone(880, 0.05);
    }
    setTimeout(() => setFocusPoint(null), 1600);
  };

  // Handle capture trigger with robust flash & silent mode logic
  const handleShutterClick = async () => {
    if (!isProUser && freeScansRemaining <= 0) {
      onOpenPaywall();
      return;
    }

    const shouldFlash = flashSetting === 'on' || flashSetting === 'auto';

    if (shouldFlash) {
      if (!isSilentMode) {
        sounds.playTone(1200, 0.08);
      }
      try {
        if (videoRef.current && videoRef.current.srcObject) {
          const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
          const capabilities = (track as any).getCapabilities?.();
          if (capabilities?.torch) {
            (track as any).applyConstraints({ advanced: [{ torch: true }] });
            setTimeout(() => {
              (track as any).applyConstraints({ advanced: [{ torch: false }] });
            }, 250);
          }
        }
      } catch {}
    }

    if (!isSilentMode) {
      sounds.playShutter();
    }
    
    setIsShutterFired(true);
    setTimeout(() => setIsShutterFired(false), shouldFlash ? 280 : 140);

    // Trigger AI Scan & Cutout Analysis Animation
    setIsAnalyzing(true);
    
    setTimeout(() => {
      setIsAnalyzing(false);
      
      // Check if the user is shooting empty space / nothing
      if (currentPreset.name === '빈 공간 (피사체 없음)') {
        setIsRecognitionFailed(true);
        return;
      }

      // Add to session queue instead of analyzing immediately, store zoomScale and focus point
      const focusInfo = lastFocusPercentRef.current;
      const newShot: SessionShot = {
        id: Date.now().toString(),
        imageUrl: customPhotoUrl || currentPreset.image,
        preset: currentPreset,
        isAlbum: false,
        zoomScale: zoomScale,
        focusPoint: { x: focusInfo.x, y: focusInfo.y },
        focusAfMode: focusInfo.isTap ? 'Spot Tap-AF' : 'Auto Multi-AF',
      };

      setSessionShots((prev) => [...prev, newShot]);
    }, 1100);
  };

  // 08-1 예술 점수 산출 (포켓몬 스냅 · 젤다 5대 구도 기반 채점)
  const getArtScore = (preset: any, seedIndex: number) => {
    const name = preset?.name || 'specimen';

    let seed = 0;
    for (let i = 0; i < name.length; i++) {
      seed += name.charCodeAt(i);
    }
    seed += seedIndex * 23;

    // 5 criteria (each max 20) -> Total max 100
    const pose = 16 + (seed % 5); // 16 ~ 20
    const size = 16 + ((seed * 3) % 5); // 16 ~ 20
    const direction = 15 + ((seed * 7) % 6); // 15 ~ 20
    const background = 16 + ((seed * 11) % 5); // 16 ~ 20
    const clarity = 16 + ((seed * 13) % 5); // 16 ~ 20
    const total = pose + size + direction + background + clarity;

    let grade: 'S' | 'A' | 'B' | 'C' = 'B';
    let stars = 3;
    let gradeTitle = '우수 관찰작 (Good Shot)';
    let feedbackTip = '피사체가 중앙에 안정적으로 위치하며 자연스러운 생태 활동을 잘 담아냈습니다.';

    if (total >= 93) {
      grade = 'S';
      stars = 5;
      gradeTitle = '★ 전설적인 하이랄 명작 포착 (S-Rank Masterpiece)';
      feedbackTip = '황금비율과 완벽한 시선 처리! 박물관 명예의 전당 등재 수준의 완벽한 구도입니다.';
    } else if (total >= 85) {
      grade = 'A';
      stars = 4;
      gradeTitle = '★ 마스터피스 도감 사진 (A-Rank Excellent)';
      feedbackTip = '피사체의 생동감이 탁월합니다. 앵글을 살짝만 더 낮추면 S등급 100점을 달성할 수 있습니다.';
    } else if (total >= 75) {
      grade = 'B';
      stars = 3;
      gradeTitle = '표준 도감 구도 (B-Rank Standard)';
      feedbackTip = '자연광이 드는 방향에서 피사체가 중앙에 오도록 줌을 조절해 재도전해 보세요.';
    } else {
      grade = 'C';
      stars = 2;
      gradeTitle = '관찰 기록용 (C-Rank Entry)';
      feedbackTip = '배경과 피사체가 겹치지 않게 거리와 포커스를 조정해 재도전해 보세요.';
    }

    return { pose, size, direction, background, clarity, total, grade, stars, gradeTitle, feedbackTip };
  };

  // Add all session shots to Archive
  const handleRegisterAll = () => {
    if (sessionShots.length === 0) return;
    sounds.playSwoosh();

    const primaryShot = sessionShots[0];
    const aiData = primaryShot.preset;
    const safeExistingSpecimens = existingSpecimens || [];

    const displayName = aiData.name || (aiData as any).koreanName || '자연 생물';
    const displayScientific = aiData.scientific || (aiData as any).scientificName || 'Species';
    const displayCategory = aiData.category || 'birds';
    const displayFamily = aiData.family || '미분류과';
    const displayGenus = aiData.genus || (displayScientific ? displayScientific.split(' ')[0] : '미분류속');

    const existingMatch = safeExistingSpecimens.find(
      (s) =>
        Boolean(s.koreanName && displayName && (s.koreanName.includes(displayName) || displayName.includes(s.koreanName)))
    );

    const locInfo = {
      name: uploadLocation || liveEnv.name || '성수동 골목길 보도블록',
      city: liveEnv.city || '서울',
      district: liveEnv.district || '성동구 성수동',
      country: '대한민국',
      environmentType: 'urban_alley' as const,
      x: 58,
      y: 52,
    };

    const newObservations: Observation[] = sessionShots.map((shot, idx) => {
      const isAlbum = shot.isAlbum;
      const formattedDate = isAlbum ? (uploadDate ? uploadDate.replace(/-/g, '.') : '') : timeData.date;
      const formattedTime = isAlbum ? (uploadTime || '') : timeData.time;
      const score = getArtScore(shot.preset, idx);

      return {
        id: `obs-${Date.now()}-${idx}`,
        date: formattedDate,
        time: formattedTime,
        location: isAlbum ? (uploadLocation || '앨범 불러온 사진') : `${locInfo.name} (${locInfo.district})`,
        weather: isAlbum ? '' : (liveEnv.weather || '☀️ 맑음'),
        temperature: isAlbum ? '' : (liveEnv.temperature || '24°C'),
        photoUrl: shot.imageUrl,
        seasonLabel: isAlbum ? '앨범 포착 기록' : '실시간 포착',
        focusPoint: shot.focusPoint || { x: 50, y: 44 },
        focusAfMode: shot.focusAfMode || 'Auto Multi-AF',
        memo: `생태 렌즈 포착 기록. 초점 타깃 (${shot.focusPoint?.x || 50}%, ${shot.focusPoint?.y || 44}%) [${shot.focusAfMode || 'Auto Multi-AF'}]. 예술점수 ${score.total}점 (${score.grade}등급)`,
      };
    });

    const isAnimal = displayCategory === 'birds' || displayCategory === 'mammals' || displayCategory === 'insects';
    const defaultTaxonomy = [
      isAnimal ? '동물계' : '식물계',
      displayCategory === 'birds' ? '조강' : displayCategory === 'insects' ? '곤충강' : displayCategory === 'mammals' ? '포유강' : '속씨식물문',
      displayFamily,
      displayName
    ];

    const specimenToSave: Specimen = {
      id: existingMatch ? existingMatch.id : `sp-${Date.now()}`,
      number: existingMatch ? existingMatch.number : `No.0${safeExistingSpecimens.length + 1}`,
      koreanName: displayName,
      scientificName: displayScientific,
      category: displayCategory,
      family: displayFamily,
      genus: displayGenus,
      isCollected: true,
      isPending: false,
      confidence: aiData.confidence || 98,
      stickerImage: primaryShot.imageUrl,
      originalImage: primaryShot.imageUrl,
      colorPalette: aiData.colorPalette || ['#2e4033', '#8c7a6b', '#d9c8b4'],
      taxonomyPath: aiData.taxonomyPath || defaultTaxonomy,
      traitChips: aiData.traitChips || (aiData as any).tags || ['자생종', '야생 생물'],
      habitatType: aiData.habitatType || (aiData as any).habitat || '도심 공원 및 야생 생태계',
      wikiSummary: aiData.wikiSummary || (aiData as any).keyIdentification || `${displayName}은(는) 한반도 자연 생태계의 주요 구성원입니다.`,
      wikiUrl: aiData.wikiUrl || '',
      seasonalTip: aiData.seasonalTip || (aiData as any).bestObservationTip || '',
      observations: existingMatch ? [...newObservations, ...(existingMatch.observations || [])] : newObservations,
      locationCoord: locInfo,
    };

    onCollectSpecimen(specimenToSave, newObservations[0]);
    setSessionShots([]);
    setIsReviewOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.lastModified) {
        const d = new Date(file.lastModified);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        setUploadDate(`${yyyy}.${mm}.${dd}`);
        setUploadTime(`${hh}:${min}`);
      } else {
        setUploadDate('');
        setUploadTime('');
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setSessionShots((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            imageUrl: url,
            preset: currentPreset,
            isAlbum: true,
            zoomScale: 1.0,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      ref={containerRef}
      id="lens-view-fullscreen"
      onClick={handleViewfinderClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[100dvh] bg-stone-950 text-white overflow-hidden select-none"
    >
      {/* Toast notification message (3 seconds auto-dismiss) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-[100] bg-stone-900/95 text-amber-300 px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/40 text-xs font-bold flex items-center gap-2.5 backdrop-blur-md max-w-sm w-[90%] text-center justify-center pointer-events-none"
          >
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 1. Camera Viewfinder Feed */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {hasCameraStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transition-transform duration-100 ease-out origin-center"
            style={{ transform: `scale(${zoomScale})` }}
          />
        ) : (
          <div className="relative w-full h-full bg-stone-950 flex items-center justify-center">
            <img
              src={customPhotoUrl || currentPreset.image}
              alt="피사체 관찰 뷰파인더"
              className="w-full h-full object-cover transition-transform duration-100 ease-out origin-center"
              style={{ transform: `scale(${zoomScale})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Shutter White Flash effect */}
      {isShutterFired && (
        <div
          className={`absolute inset-0 z-40 pointer-events-none transition-opacity duration-300 ${
            (flashSetting === 'on' || flashSetting === 'auto') ? 'bg-white' : 'bg-white/80'
          }`}
        />
      )}

      {/* Tap-to-focus animated reticle */}
      {focusPoint && (
        <div
          className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ left: focusPoint.x, top: focusPoint.y }}
        >
          <div className="w-12 h-12 border-2 border-amber-400 rounded-lg animate-ping opacity-70" />
          <div className="absolute inset-0 border-2 border-amber-400 rounded-lg flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
          </div>
        </div>
      )}

      {/* 2. Top Clean Minimal Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-3.5 pb-2 flex items-center justify-between pointer-events-auto select-none">
        <div className="flex items-center gap-2">
          {/* 3.5s Live Ecological Motion Camera Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLiveMotionEnabled(!isLiveMotionEnabled);
              if (!isSilentMode) {
                sounds.playTone(800, 0.05);
              }
            }}
            className={`h-10 px-3.5 rounded-full flex items-center gap-1.5 transition-all text-xs font-black shadow-md border cursor-pointer active:scale-95 ${
              isLiveMotionEnabled
                ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-300 ring-2 ring-rose-500/40'
                : 'bg-stone-900/80 text-stone-400 hover:text-white border-white/10'
            }`}
            title="포착렌즈 3.5초 생태 모션 LIVE 자동 촬영"
          >
            <span className={`w-2 h-2 rounded-full ${isLiveMotionEnabled ? 'bg-white animate-pulse' : 'bg-stone-500'}`} />
            <span>{isLiveMotionEnabled ? 'LIVE ON' : 'LIVE OFF'}</span>
          </button>

          {/* Flash Setting Switcher */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              let next: 'off' | 'auto' | 'on' = 'off';
              if (flashSetting === 'off') next = 'auto';
              else if (flashSetting === 'auto') next = 'on';
              else next = 'off';
              
              setFlashSetting(next);
              try {
                localStorage.setItem('moalog_flash_setting', next);
              } catch {}
              
              if (!isSilentMode) {
                sounds.playTone(660, 0.05);
              }
            }}
            className={`w-10 h-10 rounded-full flex flex-col items-center justify-center transition-all ${
              flashSetting === 'on'
                ? 'bg-white text-stone-950 font-bold shadow-md'
                : flashSetting === 'auto'
                ? 'bg-stone-100 text-stone-950 font-bold shadow-md'
                : 'bg-stone-900/80 text-stone-300 hover:bg-stone-800 border border-white/10'
            }`}
            title={`플래시 설정: ${flashSetting === 'on' ? '켜짐' : flashSetting === 'auto' ? '자동' : '꺼짐'}`}
          >
            {flashSetting === 'on' && <Zap className="w-4 h-4 fill-stone-950" />}
            {flashSetting === 'auto' && (
              <div className="relative flex flex-col items-center">
                <Zap className="w-3.5 h-3.5 text-stone-950" />
                <span className="text-[7px] font-black -mt-0.5">AUTO</span>
              </div>
            )}
            {flashSetting === 'off' && <ZapOff className="w-4 h-4 text-stone-400" />}
          </button>
        </div>

        {/* Exit Camera Back Button (Single Prominent X Close) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigateToArchive();
          }}
          className="w-10 h-10 rounded-full bg-stone-900/90 text-white hover:bg-stone-800 flex items-center justify-center transition-all shadow-lg border border-white/20 active:scale-95"
          title="포착렌즈 닫기"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
        
      {/* Hidden input for album upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 2.5 Top Middle Preset Subject Simulator (Clean Flat Wrap Layout) */}
      <div className="absolute top-[58px] left-0 right-0 z-30 px-4 flex justify-center pointer-events-none select-none">
        <div className="flex flex-wrap items-center justify-center gap-1 bg-stone-950/85 p-1.5 rounded-xl pointer-events-auto max-w-[95vw] sm:max-w-md border border-white/10 shadow-lg">
          <span className="text-[9px] text-stone-400 font-bold font-mono tracking-wider shrink-0 mr-1.5 pl-1">
            시뮬레이션:
          </span>
          {SCAN_PRESETS.map((p, idx) => (
            <button
              key={p.name}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPresetIndex(idx);
                setCustomPhotoUrl(null);
              }}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                selectedPresetIndex === idx && !customPhotoUrl
                  ? 'bg-white text-stone-950 font-black'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
              }`}
            >
              {p.name}
            </button>
          ))}
          {customPhotoUrl && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-stone-950 font-black">
              내 사진
            </span>
          )}
        </div>
      </div>

      {/* Live Motion Value Proposition Banner */}
      <div className="absolute top-[106px] left-0 right-0 z-30 flex justify-center pointer-events-none select-none">
        <div className="px-3 py-1 rounded-full bg-stone-950/90 text-rose-300 text-[10px] font-black border border-rose-500/30 shadow-xl flex items-center gap-1.5 backdrop-blur-md">
          <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
          <span>포착 렌즈 전용: 3.5초 생태 모션 LIVE 자동 촬영</span>
        </div>
      </div>

      {/* ========================================================
          3. Smart AR Viewfinder & AI Scanning / Cutout Animation
          ======================================================== */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
        {/* Single Centered 1:1 Viewfinder with Shadow Mask - Flat, borderless outline */}
        <div className="relative w-[80vw] max-w-[320px] aspect-square rounded-2xl border border-white/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center overflow-hidden">
          
          {/* AI Scan & Cutout Analysis Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-[2px] flex flex-col items-center justify-between p-4 z-20">
              {/* Top scanning badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 py-1 rounded-full bg-emerald-500/90 text-stone-950 font-black text-[11px] shadow-lg flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-stone-950 animate-spin" />
                <span>AI 누끼 &amp; 생태 분석 중...</span>
              </motion.div>

              {/* Laser Scanning Line Motion */}
              <motion.div
                animate={{ y: [-130, 130, -130] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399]"
              />

              {/* Corner AI Reticle brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

              {/* Bottom detail text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 py-1 rounded-full bg-stone-950/80 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30"
              >
                피사체 감지 · 배경 누끼 추출 중
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Bottom Capture & Zoom Controls */}
      <div className="absolute bottom-16 left-0 right-0 z-20 px-4 flex flex-col items-center pointer-events-none">
        
        {/* Sleek, ultra-thin iOS-style Zoom Dial & Floating precise scale display */}
        <div className="flex flex-col items-center gap-1.5 mb-5 pointer-events-auto select-none">
          {/* Small floating precise scale display - Flat, borderless */}
          <div className="text-[9px] font-mono font-bold text-white bg-stone-900/90 px-2.5 py-0.5 rounded-full tracking-wider">
            {zoomScale.toFixed(1)}x
          </div>
          
          <div className="flex items-center gap-1 bg-stone-950/80 p-1 rounded-full">
            {[0.7, 1.0, 2.0, 3.0, 5.0].map((val) => (
              <button
                key={val}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomScale(val);
                }}
                className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-[10px] font-mono transition-all font-bold ${
                  zoomScale === val
                    ? 'bg-white text-stone-950 scale-105'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {val === 0.7 ? '0.7' : val === 1.0 ? '1x' : `${val}`}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom Switcher + Main Shutter Button + Tray - Completely Flat */}
        <div className="w-full max-w-sm flex items-center justify-between px-2 pointer-events-auto">
          {/* Album Upload */}
          <div className="w-[90px] flex justify-start pl-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="relative w-11 h-11 rounded-xl bg-stone-900 text-white hover:bg-stone-800 flex flex-col items-center justify-center transition-colors active:scale-95"
            >
              <Upload className="w-5 h-5 text-stone-300" />
            </button>
          </div>

          {/* Main Shutter Button */}
          <motion.button
            id="btn-shutter-trigger"
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={(e) => {
              e.stopPropagation();
              handleShutterClick();
            }}
            className="w-[72px] h-[72px] rounded-full bg-white/30 flex items-center justify-center transition-all"
            aria-label="생물 포착"
          >
            <div className="w-[56px] h-[56px] rounded-full bg-white flex items-center justify-center" />
          </motion.button>

          {/* Capture Session Tray */}
          <div className="w-[90px] flex justify-end pr-2 relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (sessionShots.length > 0) {
                  setReviewActiveIndex(sessionShots.length - 1);
                  setIsReviewOpen(true);
                }
              }}
              className="relative w-11 h-11 rounded-xl bg-stone-850 overflow-hidden active:scale-95 transition-transform"
            >
              {sessionShots.length > 0 ? (
                <>
                  <img
                    src={sessionShots[sessionShots.length - 1].imageUrl}
                    alt="Latest shot"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-stone-600">
                  <div className="w-4 h-4 border border-stone-600 rounded-xs" />
                </div>
              )}
            </button>
            {sessionShots.length > 0 && (
              <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-stone-950 z-10 pointer-events-none translate-x-1 -translate-y-1">
                {sessionShots.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          5. Multi-Shot Review & Batch Registration Overlay
          ======================================================== */}
      <AnimatePresence>
        {isReviewOpen && sessionShots.length > 0 && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 bg-white/60 backdrop-blur-xl flex flex-col text-stone-900"
          >
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between p-4 bg-white/80 border-b border-stone-200 backdrop-blur-md">
              <button
                onClick={() => setIsReviewOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100"
              >
                <ChevronLeft className="w-6 h-6 text-stone-700" />
              </button>
              <div className="text-sm font-bold tracking-wide text-stone-900">
                포착된 사진 ({reviewActiveIndex + 1}/{sessionShots.length})
              </div>
              <button
                onClick={() => {
                  setSessionShots((prev) => prev.filter((_, i) => i !== reviewActiveIndex));
                  if (sessionShots.length === 1) {
                    setIsReviewOpen(false);
                  } else if (reviewActiveIndex >= sessionShots.length - 1) {
                    setReviewActiveIndex(Math.max(0, sessionShots.length - 2));
                  }
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Carousel & Appraisal Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 scrollbar-thin">
              <AnimatePresence mode="wait">
                <motion.div
                  key={reviewActiveIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Side-by-Side: Original (Focused) vs Cutout */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Left: Original (Simulated 1:1 Focus Crop) */}
                    <div className="aspect-square rounded-2xl bg-stone-800 overflow-hidden relative border border-stone-700 shadow-inner">
                      <img
                        src={sessionShots[reviewActiveIndex].imageUrl}
                        alt="Original focus"
                        style={{
                          transform: `scale(${1.15 * (sessionShots[reviewActiveIndex].zoomScale || 1.0)})`,
                        }}
                        className="w-full h-full object-cover origin-center transition-transform"
                      />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-medium text-stone-200">
                        원본 ({zoomScale > 1.0 ? `${(sessionShots[reviewActiveIndex].zoomScale || 1.0).toFixed(1)}x ` : ''}1:1 프레임)
                      </div>
                    </div>

                    {/* Right: AI Cutout */}
                    <div className="aspect-square rounded-2xl bg-stone-900 overflow-hidden relative border border-stone-700 shadow-inner bg-[repeating-conic-gradient(#292524_0%_25%,#1c1917_0%_50%)] bg-[length:16px_16px]">
                      <img
                        src={sessionShots[reviewActiveIndex].imageUrl}
                        alt="Cutout"
                        style={{
                          transform: `scale(${0.9 * (sessionShots[reviewActiveIndex].zoomScale || 1.0)})`,
                        }}
                        className="w-full h-full object-contain mix-blend-screen drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] origin-center transition-transform"
                      />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-emerald-500/90 backdrop-blur-md border border-emerald-400 text-[9px] font-bold text-white flex items-center gap-1 shadow-md">
                        <Sparkles className="w-2.5 h-2.5" />
                        AI 자동 누끼
                      </div>
                    </div>
                  </div>

                  {/* Swipe Indicators */}
                  {sessionShots.length > 1 && (
                    <div className="flex justify-center gap-1.5 py-2">
                      {sessionShots.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setReviewActiveIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === reviewActiveIndex ? 'bg-amber-500 w-4' : 'bg-stone-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Evaluation Score Card for Current Shot */}
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/40 shadow-lg">
                    {(() => {
                      const score = getArtScore(sessionShots[reviewActiveIndex].preset, reviewActiveIndex);
                      return (
                        <>
                          <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 mb-3">
                            <div>
                              <h3 className="text-base font-black text-stone-900">{sessionShots[reviewActiveIndex].preset.name || (sessionShots[reviewActiveIndex].preset as any).koreanName || '자연 생물'}</h3>
                              <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                                신뢰도 {sessionShots[reviewActiveIndex].preset.confidence}%
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-stone-500 font-mono block">예술 점수</span>
                              <div className="text-xl font-black text-amber-500 font-mono tracking-tight">
                                {score.total}<span className="text-xs text-stone-400 font-normal">/100</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                             <div className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                               score.grade === 'S' ? 'bg-amber-400 text-stone-950 border-amber-300' :
                               score.grade === 'A' ? 'bg-emerald-400 text-stone-950 border-emerald-300' :
                               'bg-stone-100 text-stone-700 border-stone-200'
                             }`}>
                               {score.grade} 등급
                             </div>
                             <span className="text-xs font-bold text-amber-600">{score.gradeTitle}</span>
                          </div>
                          <p className="text-[11px] text-stone-600 leading-relaxed bg-white p-2.5 rounded-xl border border-stone-100 shadow-sm">
                            {score.feedbackTip}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Floating Action: Register All */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white/90 via-white/80 to-transparent backdrop-blur-sm">
              <button
                onClick={handleRegisterAll}
                className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm rounded-2xl shadow-[0_4px_20px_rgba(251,191,36,0.3)] flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Check className="w-5 h-5 stroke-[3px]" />
                {sessionShots.length}장 한 번에 도감 등록하기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recognition Failed Screen (종을 식별하지 못했을 때 다시 촬영하기 유도) */}
      <AnimatePresence>
        {isRecognitionFailed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-60 bg-stone-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <button
              type="button"
              onClick={() => setIsRecognitionFailed(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white bg-stone-900/80 transition-colors"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-stone-900 flex items-center justify-center text-white mb-5 relative">
              <Camera className="w-6 h-6 text-stone-300" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-stone-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">!</span>
            </div>
            
            <h2 className="text-lg font-black text-white tracking-tight mb-2">
              아무것도 발견하지 못했습니다
            </h2>
            <p className="text-xs text-stone-400 max-w-xs leading-relaxed mb-6 font-medium">
              식물, 조류 등 분석할 생물 피사체가 감지되지 않았습니다.<br/>
              피사체가 화면 중앙의 타겟 박스 안에 가득 차도록 다시 깨끗하게 찍어보세요!
            </p>
            
            <div className="px-3 py-1 rounded-full bg-stone-900 text-stone-400 text-[10px] font-bold mb-8 font-mono tracking-wider">
              무료 체험 횟수는 전혀 차감되지 않았습니다
            </div>
            
            <div className="w-full max-w-xs space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsRecognitionFailed(false);
                  setCustomPhotoUrl(null);
                }}
                className="w-full py-3.5 bg-white hover:bg-stone-100 text-stone-950 font-black text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-stone-950 stroke-[2.5px]" />
                <span>다시 촬영하기</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRecognitionFailed(false);
                  setIsManualSpeciesPickerOpen(true);
                }}
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-850 text-stone-300 font-bold text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-stone-400" />
                <span>도감에서 직접 종 찾기</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Species Picker Modal (직접 종 선택하기) */}
      <AnimatePresence>
        {isManualSpeciesPickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-stone-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
            onClick={() => setIsManualSpeciesPickerOpen(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white text-stone-900 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="p-4 bg-stone-50 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">직접 종 선택하기</h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">도감 목록에서 원하는 생물 종을 직접 터치하세요</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualSpeciesPickerOpen(false)}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                  title="닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-3 flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="relative shrink-0">
                  <input
                    type="text"
                    value={manualSearchQuery}
                    onChange={(e) => setManualSearchQuery(e.target.value)}
                    placeholder="생물 이름 검색 (예: 참새, 서양민들레, 까치)..."
                    className="w-full bg-stone-100 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-900 font-medium focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      const el = (e.currentTarget.nextElementSibling as HTMLDivElement);
                      if (el) el.scrollBy({ left: -140, behavior: 'smooth' });
                    }}
                    className="flex items-center justify-center w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 shrink-0 cursor-pointer text-xs"
                    title="왼쪽 스크롤"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div 
                    onWheel={(e) => {
                      if (e.deltaY !== 0) {
                        e.currentTarget.scrollLeft += e.deltaY;
                      }
                    }}
                    className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none touch-pan-x flex-1"
                  >
                    {[
                      { key: 'all', label: '전체' },
                      { key: 'plants', label: '식물' },
                      { key: 'insects', label: '곤충' },
                      { key: 'birds', label: '조류' },
                      { key: 'invertebrates', label: '거미&연체동물' },
                      { key: 'mammals', label: '포유류' },
                      { key: 'herptiles', label: '양서&파충류' },
                      { key: 'fishes', label: '어류' },
                      { key: 'fungi', label: '균류' },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setManualCategory(cat.key)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                          manualCategory === cat.key
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      const el = (e.currentTarget.previousElementSibling as HTMLDivElement);
                      if (el) el.scrollBy({ left: 140, behavior: 'smooth' });
                    }}
                    className="flex items-center justify-center w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 shrink-0 cursor-pointer text-xs"
                    title="오른쪽 스크롤"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-h-[200px] overflow-y-auto overscroll-contain touch-pan-y pr-1 space-y-1.5">
                  {SPECIES_ECOLOGY_ENCYCLOPEDIA.filter((item) => {
                    if (manualCategory !== 'all') {
                      if (manualCategory === 'invertebrates') {
                        if (item.category !== 'arachnids' && item.category !== 'mollusks' && item.category !== 'crustaceans') return false;
                      } else if (manualCategory === 'herptiles') {
                        if (item.category !== 'amphibians' && item.category !== 'reptiles') return false;
                      } else if (item.category !== manualCategory) {
                        return false;
                      }
                    }
                    const q = manualSearchQuery.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      (item.koreanName || '').toLowerCase().includes(q) ||
                      (item.scientificName || '').toLowerCase().includes(q) ||
                      (item.family || '').toLowerCase().includes(q)
                    );
                  }).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const isFungi = item.category === 'fungi';
                        const isPlant = item.category === 'plants';
                        const isAnimal = !isFungi && !isPlant;
                        
                        let fallbackClass = '강';
                        if (item.category === 'birds') fallbackClass = '조강';
                        else if (item.category === 'insects') fallbackClass = '곤충강';
                        else if (item.category === 'mammals') fallbackClass = '포유강';
                        else if (item.category === 'fungi') fallbackClass = '담자균강';
                        else if (item.category === 'plants') fallbackClass = '쌍떡잎식물강';
                        
                        const presetObj = {
                          name: item.koreanName,
                          scientific: item.scientificName,
                          category: item.category,
                          family: item.family,
                          genus: item.order || item.family,
                          confidence: 99,
                          image: customPhotoUrl || currentPreset.image,
                          photos: [customPhotoUrl || currentPreset.image],
                          colorPalette: ['#2e4033', '#8c7a6b', '#d9c8b4'],
                          taxonomyPath: [
                            isFungi ? '균계' : isPlant ? '식물계' : '동물계',
                            item.categoryLabel || fallbackClass,
                            item.family,
                            item.koreanName
                          ],
                          traitChips: item.tags || ['자생종', '도심생태'],
                          habitatType: item.habitat,
                          wikiSummary: item.keyIdentification,
                          wikiUrl: '',
                          seasonalTip: item.bestObservationTip || '',
                          locationInfo: {
                            name: liveEnv.name || '서울숲 생태공원',
                            city: liveEnv.city || '서울',
                            district: liveEnv.district || '성동구',
                            country: '대한민국',
                            environmentType: 'nature_wild' as const,
                            x: 50,
                            y: 50
                          }
                        };
                        const newShot: SessionShot = {
                          id: Date.now().toString(),
                          imageUrl: customPhotoUrl || currentPreset.image,
                          preset: presetObj as any,
                          isAlbum: false,
                          zoomScale: 1.0,
                        };
                        setSessionShots((prev) => [...prev, newShot]);
                        setIsManualSpeciesPickerOpen(false);
                        sounds.playChime();
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 transition-all flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-bold text-stone-900">{item.koreanName}</span>
                          <span className="text-[10px] text-stone-500 font-serif italic">{item.scientificName}</span>
                        </div>
                        <p className="text-[10px] text-stone-500 mt-0.5">{item.family} · {item.habitat}</p>
                      </div>
                      <span className="text-[10px] text-stone-700 bg-stone-200 px-2 py-1 rounded-lg font-bold shrink-0">
                        선택하기
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
