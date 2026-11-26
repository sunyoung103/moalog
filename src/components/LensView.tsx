import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Zap,
  ZapOff,
  Upload,
  Check,
  X,
  Sparkles,
  Camera,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Share2,
  Pencil,
  Lock,
  Play,
  Disc,
  Crosshair,
} from 'lucide-react';
import { Specimen, Observation, UserStats, UserAccount } from '../types';
import { sounds, getFormattedNow } from '../utils/cutoutHelper';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';
import { stripExifFromImageFile } from '../utils/imagePrivacy';
import { getSpeciesTaxonomyCategoryLabel } from '../utils/speciesNameHelper';
import {
  getLevelProgress,
  getUnder14DesignFlags,
  NEW_SPECIES_XP_REWARD,
  DAILY_NEW_SPECIES_XP_CAP,
} from '../utils/levelPolicy';
import { getExplorerTitleInfo } from '../utils/explorerTitles';
import {
  assessImageQuality,
  cropImageAtFocus,
  imageUrlToBase64,
  ImageQualityReport,
} from '../utils/imageQuality';

const HexGradeBadge: React.FC<{ grade: string; size?: 'md' | 'sm' }> = ({ grade, size = 'md' }) => {
  const g = (grade || 'B').toUpperCase();
  const gradient =
    g === 'S'
      ? 'from-[#6ad2ff] via-[#38bdf8] to-[#2563eb]'
      : g === 'A'
      ? 'from-[#fde68a] via-[#f59e0b] to-[#b45309]'
      : g === 'B'
      ? 'from-[#f1f5f9] via-[#cbd5e1] to-[#64748b]'
      : 'from-[#a1a1aa] via-[#71717a] to-[#3f3f46]';

  const dim = size === 'sm' ? 'w-5 h-5 text-[9px]' : 'w-7 h-7 text-[13px]';
  return (
    <span
      className={`${dim} relative inline-flex items-center justify-center font-extrabold text-white bg-gradient-to-br ${gradient} shadow-sm shrink-0`}
      style={{
        clipPath: 'polygon(50% 0%, 94% 25%, 94% 75%, 50% 100%, 6% 75%, 6% 25%)',
      }}
    >
      <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">{g}</span>
    </span>
  );
};

interface LensViewProps {
  onCollectSpecimen: (
    newSpecimen: Specimen,
    observation: Observation,
    options?: { suppressAttendanceModal?: boolean }
  ) => void;
  existingSpecimens: Specimen[];
  freeScansRemaining: number;
  isProUser: boolean;
  currentPersona: string;
  userStats?: UserStats;
  userAccount?: UserAccount;
  onSelectSpecimen?: (specimen: Specimen) => void;
  onNavigateToArchive: () => void;
  onOpenPaywall: () => void;
  isOnboarding?: boolean;
  onOnboardingComplete?: (specimen: Specimen, capturedImage: string) => void;
  onOnboardingBack?: () => void;
}

const ALBUM_STORAGE_KEY = 'moalog_camera_album';

const SCAN_PRESETS = [
  {
    name: '노랑코스모스',
    scientific: 'Cosmos sulphureus',
    category: 'plants' as const,
    family: '국화과',
    genus: '코스모스속',
    confidence: 98,
    image: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=800&auto=format&fit=crop&q=80',
    colorPalette: ['#F97316', '#EAB308', '#4D7C0F', '#14532D'],
    taxonomyPath: ['식물계', '속씨식물문', '쌍떡잎식물강', '국화목', '국화과', '코스모스속', '노랑코스모스'],
    traitChips: ['한해살이풀', '주황·노랑 꽃', '깃 모양 잎', '길가·공원'],
    habitatType: '공원 화단/길가',
    wikiSummary: '주황색 또는 노란색 꽃잎이 8장 둥글게 피며 가을 길가와 공원 화단을 물들이는 국화과 식물입니다.',
    wikiUrl: 'https://ko.wikipedia.org/wiki/%EB%85%B8%EB%9E%91%EC%BD%94%EC%8A%A4%EB%AA%A8%EC%8A%A4',
    seasonalTip: '햇볕이 잘 드는 가을 오후 역광이 아닌 정면 자연광에서 꽃술이 선명히 담깁니다.',
    locationInfo: {
      name: '양재천 시민의숲',
      city: '서울',
      district: '서초구 양재동',
      country: '대한민국',
      environmentType: 'urban_park' as const,
      x: 54,
      y: 62,
    },
  },
  {
    name: '물총새',
    scientific: 'Alcedo atthis',
    category: 'birds' as const,
    family: '물총새과',
    genus: '물총새속',
    confidence: 98,
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
    colorPalette: ['#0284C7', '#EA580C', '#0369A1', '#C2410C', '#F8FAFC'],
    taxonomyPath: ['동물계', '척삭동물문', '조강', '파랑새목', '물총새과', '물총새속', '물총새'],
    traitChips: ['여름철새', '하천·호수', '약 17cm', '작은 물고기'],
    habitatType: '하천/호수',
    wikiSummary: '물총새는 파랑새목 물총새과의 대표 조류입니다. 코발트 블루의 등과 선명한 주황색 배를 지니며, 나뭇가지에 앉아 물속의 작은 물고기를 낚아챕니다.',
    wikiUrl: 'https://ko.wikipedia.org/wiki/%EB%AC%BC%EC%B4%9D%EC%83%88',
    seasonalTip: '양재천이나 탄천 여울목 나뭇가지에 앉아 있는 모습을 관찰할 수 있습니다.',
    locationInfo: {
      name: '양재천 둔치 수풀',
      city: '서울',
      district: '강남구 개포동',
      country: '대한민국',
      environmentType: 'nature_wild' as const,
      x: 52,
      y: 60,
    },
  },
  {
    name: '참새',
    scientific: 'Passer montanus',
    category: 'birds' as const,
    family: '참새과',
    genus: '참새속',
    confidence: 97,
    image: 'https://images.unsplash.com/photo-1522926197415-e580a2dfa733?w=800&auto=format&fit=crop&q=80',
    colorPalette: ['#78350F', '#A16207', '#D4D4D8', '#18181B', '#FEF3C7'],
    taxonomyPath: ['동물계', '척삭동물문', '조강', '참새목', '참새과', '참새속', '참새'],
    traitChips: ['도심 대표 텃새', '뺨의 검은 반점', '군집 생활'],
    habitatType: '도심/골목길',
    wikiSummary: '인간 생활권과 가장 밀접하게 공존하는 소형 텃새로 흰 뺨에 찍힌 검은 점이 특징입니다.',
    wikiUrl: 'https://ko.wikipedia.org/wiki/%EC%B0%B8%EC%83%88',
    seasonalTip: '공원 벤치나 도심 산책로 주변에서 사계절 내내 관찰됩니다.',
    locationInfo: {
      name: '서울숲 야외무대',
      city: '서울',
      district: '성동구 성수동',
      country: '대한민국',
      environmentType: 'urban_alley' as const,
      x: 35,
      y: 38,
    },
  },
  {
    name: '서양민들레',
    scientific: 'Taraxacum officinale',
    category: 'plants' as const,
    family: '국화과',
    genus: '민들레속',
    confidence: 99,
    image: 'https://images.unsplash.com/photo-1558285549-2a06fdfc5547?w=800&auto=format&fit=crop&q=80',
    colorPalette: ['#E6C229', '#2E7D32', '#7CB342', '#3E2723', '#F9FBE7'],
    taxonomyPath: ['식물계', '속씨식물문', '쌍떡잎식물강', '국화목', '국화과', '민들레속', '서양민들레'],
    traitChips: ['쌍떡잎식물', '다년생초본', '노란 두상화'],
    habitatType: '도심/골목길',
    wikiSummary: '국화과의 여러해살이풀로 총포편이 뒤로 젖혀져 있는 것이 특징입니다.',
    wikiUrl: 'https://ko.wikipedia.org/wiki/%EC%84%9C%EC%96%91%EB%AF%BC%EB%93%A4%EB%A0%88',
    seasonalTip: '봄부터 가을까지 보도블록 틈이나 화단에서 쉽게 찾을 수 있습니다.',
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
    name: '들꽃 (후보 선택)',
    scientific: 'Wildflower candidate',
    category: 'plants' as const,
    family: '국화과',
    genus: '코스모스속',
    confidence: 72,
    image: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?w=800&auto=format&fit=crop&q=80',
    colorPalette: ['#FACC15', '#4D7C0F', '#14532D'],
    taxonomyPath: ['식물계', '속씨식물문', '쌍떡잎식물강', '국화목', '국화과', '노랑코스모스'],
    traitChips: ['후보 비교', '꽃잎 관찰'],
    habitatType: '공원 화단',
    wikiSummary: '비슷한 꽃 형태를 가진 후보 종 중 알맞은 이름을 선택할 수 있습니다.',
    wikiUrl: '',
    seasonalTip: '꽃의 가운데 꽃술과 잎 모양이 함께 보이도록 찍으면 정확도가 높아져요.',
    locationInfo: {
      name: '서울숲 초화원',
      city: '서울',
      district: '성동구 성수동',
      country: '대한민국',
      environmentType: 'urban_park' as const,
      x: 50,
      y: 50,
    },
  },
  {
    name: '제주왕나비',
    scientific: 'Parantica sita',
    category: 'insects' as const,
    family: '네발나비과',
    genus: '왕나비속',
    confidence: 52,
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
    colorPalette: ['#0284c7', '#EA580C', '#1e293b'],
    taxonomyPath: ['동물계', '절지동물문', '곤충강', '나비목', '네발나비과', '제주왕나비'],
    traitChips: ['장거리 이동 나비', '반투명 날개'],
    habitatType: '숲길/초지',
    wikiSummary: '장거리를 이동하는 대형 나비로 날개 맥이 선명하며 꽃꿀을 빨아먹습니다.',
    wikiUrl: '',
    seasonalTip: '빛을 등지고 날개 무늬가 선명히 보이도록 가까이 촬영해 주세요.',
    locationInfo: {
      name: '양재천 숲길',
      city: '서울',
      district: '서초구 양재동',
      country: '대한민국',
      environmentType: 'nature_wild' as const,
      x: 52,
      y: 54,
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
    colorPalette: ['#ffffff'],
    taxonomyPath: ['없음'],
    traitChips: ['빈 배경'],
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

type PresetType = (typeof SCAN_PRESETS)[number];

interface CaptureShot {
  id: string;
  imageUrl: string;
  createdAt: number; // epoch ms
  preset: PresetType;
  isAlbum: boolean;
  isLive: boolean;
  zoomScale: number;
  focusPoint: { x: number; y: number };
  cropOffset?: { x: number; y: number };
  cropZoom?: number;
  focusAfMode: 'Auto Multi-AF' | 'Spot Tap-AF';
  confidence: number;
  identificationMeta?: {
    stage1Engine: string;
    stage2Engine?: string;
    escalatedToGemini: boolean;
    escalationReasons?: string[];
    imageQualityScore?: number;
  };
  isRegistered?: boolean;
  registeredSpecimenId?: string;
}

interface StoredAlbumItem {
  id: string;
  imageUrl: string;
  createdAt: number;
  speciesName: string;
  scientificName: string;
  category: Specimen['category'];
  family: string;
  genus: string;
  confidence: number;
  isLive: boolean;
  isRegistered: boolean;
  registeredSpecimenId?: string;
}

type CaptureFlowScreen =
  | null
  | 'candidates' // B-10e
  | 'low_confidence' // B-08
  | 'not_found' // B-08b
  | 'offline' // B-09
  | 'result'; // B-10 ('ready' | 'analyzing' | 'done')

interface CandidateOption {
  koreanName: string;
  scientificName: string;
  category: Specimen['category'];
  family: string;
  genus?: string;
  keyIdentification?: string;
  tags?: string[];
  percent: number;
}

function loadStoredAlbum(): StoredAlbumItem[] {
  try {
    const raw = localStorage.getItem(ALBUM_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredAlbumItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getDateGroupLabel(ts: number): string {
  const now = new Date();
  const target = new Date(ts);
  if (
    now.getFullYear() === target.getFullYear() &&
    now.getMonth() === target.getMonth() &&
    now.getDate() === target.getDate()
  ) {
    return '오늘';
  }
  return `${target.getMonth() + 1}월 ${target.getDate()}일`;
}

function getDaysRemainingIn30Days(ts: number): number {
  const elapsedDays = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
  return Math.max(1, 30 - elapsedDays);
}

function parseObsDateTimestamp(dateStr?: string): number {
  if (!dateStr) return Date.now() - 1000 * 60 * 60 * 24 * 3;
  const cleaned = dateStr.replace(/\./g, '-');
  const parsed = Date.parse(cleaned);
  return Number.isNaN(parsed) ? Date.now() - 1000 * 60 * 60 * 24 * 3 : parsed;
}

export const LensView: React.FC<LensViewProps> = ({
  onCollectSpecimen,
  existingSpecimens,
  isProUser,
  currentPersona,
  userStats,
  userAccount,
  onSelectSpecimen,
  onNavigateToArchive,
  onOpenPaywall,
  isOnboarding = false,
  onOnboardingComplete,
  onOnboardingBack,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const [hasCameraStream, setHasCameraStream] = useState(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);

  // Zoom & gesture
  const [zoomScale, setZoomScale] = useState(1.0);
  const touchStartDistanceRef = useRef<number | null>(null);
  const startZoomScaleRef = useRef<number>(1.0);

  // Camera controls
  const [isSilentMode] = useState(() => {
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

  const [isLiveMotionEnabled, setIsLiveMotionEnabled] = useState(false);
  const [isShutterFired, setIsShutterFired] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // B-07a
  const [analysisStageText, setAnalysisStageText] = useState<'gen_bio' | 'gemini_retry'>('gen_bio');
  const [scanningPreviewUrl, setScanningPreviewUrl] = useState<string | null>(null);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);

  // Tap focus
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const lastFocusPercentRef = useRef<{ x: number; y: number; isTap: boolean }>({ x: 50, y: 46, isTap: false });

  // Local 촬영 앨범 persistence
  const [storedAlbum, setStoredAlbum] = useState<StoredAlbumItem[]>(() => loadStoredAlbum());
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);
  const [albumFilter, setAlbumFilter] = useState<'all' | 'unregistered' | 'registered'>('all');
  const [isAlbumSelectMode, setIsAlbumSelectMode] = useState(false);
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>([]);

  // Active flow state (B-08 / B-08b / B-09 / B-10e / B-10)
  const [captureFlow, setCaptureFlow] = useState<CaptureFlowScreen>(null);
  const [activeShot, setActiveShot] = useState<CaptureShot | null>(null);
  const [candidateList, setCandidateList] = useState<CandidateOption[]>([]);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const [isTipsExpanded, setIsTipsExpanded] = useState(true);
  const [isDirectEditSheetOpen, setIsDirectEditSheetOpen] = useState(false);
  const [directEditTarget, setDirectEditTarget] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  // B-10 3-step stages
  const [resultStage, setResultStage] = useState<'ready' | 'analyzing' | 'done'>('ready');
  const [registeredSpecimen, setRegisteredSpecimen] = useState<Specimen | null>(null);
  const [xpAnimationState, setXpAnimationState] = useState<{
    beforeExp: number;
    afterExp: number;
    animateToAfter: boolean;
  }>({ beforeExp: 0, afterExp: 0, animateToAfter: false });

  // Manual species picker
  const [isManualSpeciesPickerOpen, setIsManualSpeciesPickerOpen] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualCategory, setManualCategory] = useState('all');

  // Quota / Paywall sheets
  const [isFlow16LimitModalOpen, setIsFlow16LimitModalOpen] = useState(false);
  const [flow16SelectedPlan, setFlow16SelectedPlan] = useState<'yearly' | 'monthly' | 'lifetime'>('yearly');
  const [isLivePaywallOpen, setIsLivePaywallOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Environment data
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [liveEnv, setLiveEnv] = useState<{
    name: string;
    city: string;
    district: string;
    temperature: string;
    weather: string;
  }>({
    name: '서울숲 생태공원',
    city: '서울',
    district: '성동구 성수동',
    temperature: '24°C',
    weather: '☀️ 맑음',
  });

  // Upload photo metadata
  const [uploadDate, setUploadDate] = useState(() => getFormattedNow().date);
  const [uploadTime, setUploadTime] = useState(() => getFormattedNow().time);

  const collectedSpecimens = useMemo(
    () => (existingSpecimens || []).filter((s) => s.isCollected && !s.isPending && !s.isDeleted),
    [existingSpecimens]
  );
  const collectedCount = collectedSpecimens.length;
  const currentPreset = SCAN_PRESETS[selectedPresetIndex];
  const { showShare } = getUnder14DesignFlags(userAccount);

  // Sync album to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ALBUM_STORAGE_KEY, JSON.stringify(storedAlbum));
    } catch {}
  }, [storedAlbum]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2800);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Real geolocation + weather on mount
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLiveCoords({ lat, lng });
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
            locName = addr.park || addr.leisure || addr.suburb || addr.neighbourhood || addr.quarter || '도심 생태구역';
            const city = addr.city || addr.province || addr.state || '서울';
            district = `${city} ${addr.suburb || addr.borough || ''}`.trim();
          }
        } catch {}

        setLiveEnv({
          name: locName,
          city: '서울',
          district,
          temperature: liveTemp,
          weather: liveWeather,
        });
      },
      () => {},
      { timeout: 5000, maximumAge: 60000 }
    );
  }, []);

  // Camera WebRTC stream
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

  // Combined album items (stored captures + existing collected/pending specimens)
  const combinedAlbumItems = useMemo(() => {
    const map = new Map<string, StoredAlbumItem & { linkedSpecimen?: Specimen }>();

    storedAlbum.forEach((item) => {
      const matchedSpecimen = existingSpecimens.find(
        (s) =>
          (item.registeredSpecimenId && s.id === item.registeredSpecimenId) ||
          (s.isCollected && !s.isPending && s.koreanName === item.speciesName)
      );
      map.set(item.id, {
        ...item,
        isRegistered: Boolean(item.isRegistered || (matchedSpecimen && !matchedSpecimen.isPending)),
        linkedSpecimen: matchedSpecimen,
      });
    });

    existingSpecimens
      .filter((sp) => !sp.isDeleted && (sp.isCollected || sp.isPending))
      .forEach((sp) => {
        const photo = sp.originalImage || sp.stickerImage || sp.observations?.[0]?.photoUrl || '';
        if (!photo) return;
        const alreadyInAlbum = Array.from(map.values()).some(
          (v) => v.registeredSpecimenId === sp.id || (v.speciesName === sp.koreanName && v.isRegistered)
        );
        if (alreadyInAlbum) return;
        const ts = parseObsDateTimestamp(sp.observations?.[0]?.date);
        map.set(`sp-album-${sp.id}`, {
          id: `sp-album-${sp.id}`,
          imageUrl: photo,
          createdAt: ts,
          speciesName: sp.koreanName,
          scientificName: sp.scientificName,
          category: sp.category,
          family: sp.family || '자연생물과',
          genus: sp.genus || sp.scientificName.split(' ')[0] || '',
          confidence: sp.confidence || 96,
          isLive: Boolean(sp.isLive),
          isRegistered: !sp.isPending,
          registeredSpecimenId: sp.id,
          linkedSpecimen: sp,
        });
      });

    return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
  }, [storedAlbum, existingSpecimens]);

  const filteredAlbumItems = useMemo(() => {
    if (albumFilter === 'unregistered') return combinedAlbumItems.filter((i) => !i.isRegistered);
    if (albumFilter === 'registered') return combinedAlbumItems.filter((i) => i.isRegistered);
    return combinedAlbumItems;
  }, [combinedAlbumItems, albumFilter]);

  const groupedAlbumSections = useMemo(() => {
    const groups: { label: string; items: (StoredAlbumItem & { linkedSpecimen?: Specimen })[] }[] = [];
    filteredAlbumItems.forEach((item) => {
      const label = getDateGroupLabel(item.createdAt);
      const found = groups.find((g) => g.label === label);
      if (found) found.items.push(item);
      else groups.push({ label, items: [item] });
    });
    return groups;
  }, [filteredAlbumItems]);

  const unregisteredAlbumCount = useMemo(
    () => combinedAlbumItems.filter((i) => !i.isRegistered).length,
    [combinedAlbumItems]
  );
  const registeredAlbumCount = useMemo(
    () => combinedAlbumItems.filter((i) => i.isRegistered).length,
    [combinedAlbumItems]
  );

  // Appraisal score helper
  const getArtScore = (name: string, confidence: number) => {
    let seed = 0;
    for (let i = 0; i < name.length; i++) seed += name.charCodeAt(i);
    const pose = 16 + (seed % 5);
    const size = 16 + ((seed * 3) % 5);
    const direction = 16 + ((seed * 7) % 5);
    const background = 16 + ((seed * 11) % 5);
    const clarity = 16 + ((seed * 13) % 5);
    const rawTotal = pose + size + direction + background + clarity;
    const total = Math.min(99, Math.max(confidence >= 85 ? 86 : 72, rawTotal));
    let grade: 'S' | 'A' | 'B' | 'C' = 'B';
    let feedbackTip = '주황빛 꽃잎이나 생물의 특징이 자연스럽게 잘 담겼어요.';
    if (total >= 90) {
      grade = 'S';
      feedbackTip = `${name}의 특징이 사선 구도로 또렷하게 담겨 생동감이 살아 있어요.`;
    } else if (total >= 80) {
      grade = 'A';
      feedbackTip = `자연광 아래에서 ${name}의 색감과 윤곽이 깔끔하게 기록되었어요.`;
    } else if (total >= 70) {
      grade = 'B';
      feedbackTip = '가까이 다가가 정면에서 다시 담으면 더 높은 점수를 받을 수 있어요.';
    } else {
      grade = 'C';
      feedbackTip = '조금 더 밝은 곳에서 초점을 맞춰 촬영해 보세요.';
    }
    return { total, grade, feedbackTip };
  };

  // Pinch zoom handlers
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
      const next = Math.min(5.0, Math.max(0.7, startZoomScaleRef.current * factor));
      setZoomScale(Math.round(next * 10) / 10);
    }
  };

  const handleTouchEnd = () => {
    touchStartDistanceRef.current = null;
  };

  // Viewfinder tap focus
  const handleViewfinderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAnalyzing || captureFlow || isAlbumOpen) return;
    setIsPresetMenuOpen(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusPoint({ x, y });
    lastFocusPercentRef.current = {
      x: Math.round(Math.max(5, Math.min(95, (x / rect.width) * 100))),
      y: Math.round(Math.max(5, Math.min(95, (y / rect.height) * 100))),
      isTap: true,
    };
    if (!isSilentMode) sounds.playTone(880, 0.05);
    setTimeout(() => setFocusPoint(null), 1300);
  };

  // Capture active WebRTC camera frame when live video stream is running
  const captureLiveVideoFrame = (): string | null => {
    const video = videoRef.current;
    if (!video || !hasCameraStream || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      return null;
    }
    try {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const effectiveZoom = Math.max(1, zoomScale);
      const cropW = Math.round(vw / effectiveZoom);
      const cropH = Math.round(vh / effectiveZoom);
      const sx = Math.max(0, Math.round((vw - cropW) / 2));
      const sy = Math.max(0, Math.round((vh - cropH) / 2));

      const maxOut = 960;
      const scale = Math.min(1, maxOut / Math.max(cropW, cropH));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(cropW * scale));
      canvas.height = Math.max(1, Math.round(cropH * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.88);
    } catch {
      return null;
    }
  };

  // Core 2-stage identification pipeline:
  // Stage 1: Fast primary classification (Gen Bio API when configured + quality check)
  // Stage 2: Gemini Vision deep re-analysis when image quality is low or Stage 1 is uncertain
  const runIdentificationPipeline = async (
    targetImageUrl: string,
    hintName: string,
    fromAlbum = false,
    presetOverride?: PresetType,
    options?: { forceGemini?: boolean; focusCropNote?: string }
  ) => {
    const focusInfo = lastFocusPercentRef.current;
    const basePreset = presetOverride || currentPreset;
    const nowMs = Date.now();
    const isDemoPresetShot = !fromAlbum && !hasCameraStream && !customPhotoUrl && !options?.forceGemini;

    setScanningPreviewUrl(targetImageUrl);
    setAnalysisStageText('gen_bio');
    setIsAnalyzing(true);

    const saveAsOfflineShot = () => {
      const offlineAlbumItem: StoredAlbumItem = {
        id: `alb-${nowMs}`,
        imageUrl: targetImageUrl,
        createdAt: nowMs,
        speciesName: '미확인',
        scientificName: '',
        category: 'plants',
        family: '',
        genus: '',
        confidence: 0,
        isLive: isLiveMotionEnabled && isProUser,
        isRegistered: false,
      };
      if (!fromAlbum) {
        setStoredAlbum((prev) => [offlineAlbumItem, ...prev.slice(0, 39)]);
      }
      setActiveShot({
        id: offlineAlbumItem.id,
        imageUrl: targetImageUrl,
        createdAt: nowMs,
        preset: basePreset,
        isAlbum: fromAlbum,
        isLive: offlineAlbumItem.isLive,
        zoomScale,
        focusPoint: { x: focusInfo.x, y: focusInfo.y },
        focusAfMode: focusInfo.isTap ? 'Spot Tap-AF' : 'Auto Multi-AF',
        confidence: 0,
      });
      setIsAnalyzing(false);
      setCaptureFlow('offline');
    };

    // Offline check (B-09)
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setTimeout(saveAsOfflineShot, 650);
      return;
    }

    // Fast test preset short-circuits for deterministic QA states (B-08b / B-08 / B-10e)
    if (isDemoPresetShot && hintName === '빈 공간 (피사체 없음)') {
      setTimeout(() => {
        setIsAnalyzing(false);
        setActiveShot({
          id: `shot-${nowMs}`,
          imageUrl: targetImageUrl,
          createdAt: nowMs,
          preset: basePreset,
          isAlbum: fromAlbum,
          isLive: isLiveMotionEnabled && isProUser,
          zoomScale,
          focusPoint: { x: focusInfo.x, y: focusInfo.y },
          focusAfMode: focusInfo.isTap ? 'Spot Tap-AF' : 'Auto Multi-AF',
          confidence: 0,
        });
        setCaptureFlow('not_found');
      }, 750);
      return;
    }

    let qualityReport: ImageQualityReport = {
      qualityScore: 85,
      isLowQuality: false,
      issues: [],
      width: 800,
      height: 800,
      meanLuminance: 128,
      sharpnessVariance: 24,
    };

    try {
      const [assessed, encoded] = await Promise.all([
        assessImageQuality(targetImageUrl),
        imageUrlToBase64(targetImageUrl),
      ]);
      qualityReport = assessed;

      // Stage 1: Gen Bio fast classifier
      let stage1Data: any = null;
      let stage1Engine = 'gen-bio';
      let stage1ShouldEscalate = Boolean(options?.forceGemini || qualityReport.isLowQuality);
      const escalationReasons: string[] = [];
      if (qualityReport.isLowQuality) escalationReasons.push(...qualityReport.issues);
      if (options?.forceGemini) escalationReasons.push('user_targeted_reanalysis');

      if (!options?.forceGemini) {
        try {
          const stage1Res = await fetch('/api/gen-bio-identify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: encoded?.base64,
              mimeType: encoded?.mimeType || 'image/jpeg',
              hint: hintName,
              isLowQuality: qualityReport.isLowQuality,
            }),
          });
          if (stage1Res.ok) {
            const s1Json = await stage1Res.json();
            stage1Engine = s1Json.engine || 'gen-bio';
            if (s1Json.configured && s1Json.data) {
              stage1Data = s1Json.data;
            }
            if (s1Json.shouldEscalateToGemini) {
              stage1ShouldEscalate = true;
              if (s1Json.reason) escalationReasons.push(s1Json.reason);
            }
          } else {
            stage1ShouldEscalate = true;
          }
        } catch {
          stage1ShouldEscalate = true;
          escalationReasons.push('gen_bio_unreachable');
        }
      }

      // If Gen Bio isn't configured yet and user clicked a built-in demo preset (not real photo/camera),
      // use local encyclopedia matching cleanly as Stage 1 fallback unless Gemini escalation is needed
      if (!stage1Data && isDemoPresetShot) {
        const { classifyImageContent } = await import('../utils/imageClassifier');
        const localMatch = classifyImageContent(targetImageUrl, hintName);
        if (localMatch.isHuman) {
          setIsAnalyzing(false);
          setToastMessage(localMatch.message || '인물 사진은 등록할 수 없어요.');
          return;
        }
        if (localMatch.matchedSpecies) {
          const conf = basePreset.name === '제주왕나비' ? 52 : localMatch.confidence;
          stage1Engine = 'local-preset-fast';
          stage1Data = {
            isHuman: false,
            hasOrganism: true,
            koreanName: localMatch.matchedSpecies.koreanName,
            scientificName: localMatch.matchedSpecies.scientificName,
            category: localMatch.matchedSpecies.category,
            family: localMatch.matchedSpecies.family,
            genus: (localMatch.matchedSpecies as any).genus || basePreset.genus,
            confidence: conf,
            wikiSummary: localMatch.matchedSpecies.keyIdentification,
            traitChips: localMatch.matchedSpecies.tags,
            candidates: (localMatch.candidates || []).map((c, idx) => ({
              koreanName: c.koreanName,
              scientificName: c.scientificName,
              category: c.category,
              family: c.family,
              keyIdentification: c.keyIdentification,
              tags: c.tags,
              confidence: [72, 18, 10][idx] ?? 10,
            })),
          };
          if (conf >= 80 && hintName !== '들꽃 (후보 선택)') {
            stage1ShouldEscalate = false;
          } else if (hintName === '들꽃 (후보 선택)' || hintName === '제주왕나비') {
            // Preserve deterministic B-10e / B-08 showcase for those explicit test presets
            stage1ShouldEscalate = false;
          }
        }
      }

      if (stage1Data?.isHuman) {
        setIsAnalyzing(false);
        setToastMessage('인물 사진은 도감에 등록할 수 없어요.');
        return;
      }

      if (stage1Data && typeof stage1Data.confidence === 'number' && stage1Data.confidence < 80) {
        stage1ShouldEscalate = true;
        escalationReasons.push('low_confidence_stage1');
      }

      // Stage 2: Escalate to Gemini Vision when image quality is low or Stage 1 is uncertain
      let finalResult = stage1Data;
      let stage2Engine: string | undefined;
      const escalatedToGemini = Boolean(stage1ShouldEscalate);

      if (escalatedToGemini) {
        setAnalysisStageText('gemini_retry');
        try {
          const s2Res = await fetch('/api/identify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: encoded?.base64,
              photoUrl: encoded?.base64 ? undefined : targetImageUrl,
              mimeType: encoded?.mimeType || 'image/jpeg',
              hint: hintName,
              stage1Guess: stage1Data
                ? {
                    koreanName: stage1Data.koreanName,
                    scientificName: stage1Data.scientificName,
                    confidence: stage1Data.confidence,
                  }
                : undefined,
              imageQualityIssues: qualityReport.issues,
              focusCropNote: options?.focusCropNote || '',
              lat: liveCoords?.lat,
              lng: liveCoords?.lng,
              timestamp: new Date().toISOString(),
              persona: currentPersona || 'general',
            }),
          });

          if (s2Res.ok) {
            const s2Json = await s2Res.json();
            if (s2Json.success && s2Json.data) {
              finalResult = s2Json.data;
              stage2Engine = s2Json.engine || 'gemini-4-hydrogen';
            }
          } else {
            const errBody = await s2Res.json().catch(() => ({}));
            if (!finalResult) {
              if (s2Res.status === 503 || errBody?.errorCode === 'GEMINI_NOT_CONFIGURED') {
                setToastMessage('Gemini API 키 연결을 확인한 뒤 다시 시도해 주세요.');
              }
              saveAsOfflineShot();
              return;
            }
          }
        } catch {
          if (!finalResult) {
            saveAsOfflineShot();
            return;
          }
        }
      }

      setIsAnalyzing(false);

      if (!finalResult) {
        saveAsOfflineShot();
        return;
      }

      if (finalResult.isHuman) {
        setToastMessage('인물 사진은 도감에 등록할 수 없어요.');
        return;
      }

      const finalConf = typeof finalResult.confidence === 'number' ? Math.round(finalResult.confidence) : 0;
      const hasOrganism = finalResult.hasOrganism !== false;

      // B-08b: Empty space or recognition failed
      if (!hasOrganism || !finalResult.koreanName || finalConf < 35) {
        setActiveShot({
          id: `shot-${nowMs}`,
          imageUrl: targetImageUrl,
          createdAt: nowMs,
          preset: basePreset,
          isAlbum: fromAlbum,
          isLive: isLiveMotionEnabled && isProUser,
          zoomScale,
          focusPoint: { x: focusInfo.x, y: focusInfo.y },
          focusAfMode: focusInfo.isTap ? 'Spot Tap-AF' : 'Auto Multi-AF',
          confidence: finalConf,
          identificationMeta: {
            stage1Engine,
            stage2Engine,
            escalatedToGemini,
            escalationReasons,
            imageQualityScore: qualityReport.qualityScore,
          },
        });
        setCaptureFlow('not_found');
        return;
      }

      const finalName = finalResult.koreanName;
      const finalSci = finalResult.scientificName || basePreset.scientific;
      const finalCat = (finalResult.category || basePreset.category || 'plants') as Specimen['category'];
      const finalFamily = finalResult.family || basePreset.family || '자연생물과';
      const finalGenus = finalResult.genus || basePreset.genus || finalSci.split(' ')[0] || '';

      const updatedPreset: PresetType = {
        ...basePreset,
        name: finalName,
        scientific: finalSci,
        category: finalCat as any,
        family: finalFamily,
        genus: finalGenus,
        confidence: finalConf,
        taxonomyPath:
          Array.isArray(finalResult.taxonomyPath) && finalResult.taxonomyPath.length > 0
            ? finalResult.taxonomyPath
            : basePreset.taxonomyPath,
        traitChips:
          Array.isArray(finalResult.traitChips) && finalResult.traitChips.length > 0
            ? finalResult.traitChips
            : basePreset.traitChips,
        habitatType: finalResult.habitatType || basePreset.habitatType,
        wikiSummary: finalResult.wikiSummary || basePreset.wikiSummary,
        wikiUrl: finalResult.wikiUrl || basePreset.wikiUrl,
        seasonalTip: finalResult.seasonalTip || basePreset.seasonalTip,
      };

      const shotId = `alb-${nowMs}`;
      const shotObj: CaptureShot = {
        id: shotId,
        imageUrl: targetImageUrl,
        createdAt: nowMs,
        preset: updatedPreset,
        isAlbum: fromAlbum,
        isLive: isLiveMotionEnabled && isProUser,
        zoomScale,
        focusPoint: { x: focusInfo.x, y: focusInfo.y },
        focusAfMode: focusInfo.isTap ? 'Spot Tap-AF' : 'Auto Multi-AF',
        confidence: finalConf,
        identificationMeta: {
          stage1Engine,
          stage2Engine,
          escalatedToGemini,
          escalationReasons,
          imageQualityScore: qualityReport.qualityScore,
        },
        isRegistered: false,
      };

      if (!fromAlbum) {
        setStoredAlbum((prev) => [
          {
            id: shotId,
            imageUrl: targetImageUrl,
            createdAt: nowMs,
            speciesName: finalName,
            scientificName: finalSci,
            category: finalCat,
            family: finalFamily,
            genus: finalGenus,
            confidence: finalConf,
            isLive: shotObj.isLive,
            isRegistered: false,
          },
          ...prev.slice(0, 39),
        ]);
      }

      setActiveShot(shotObj);

      // B-08: Very low confidence (< 60%) -> Confirm screen
      if (finalConf < 60) {
        setCaptureFlow('low_confidence');
        return;
      }

      // B-10e: Medium confidence (60..79%) with multiple candidates
      if (finalConf < 80 || hintName === '들꽃 (후보 선택)') {
        const apiCandidates = Array.isArray(finalResult.candidates) ? finalResult.candidates : [];
        const fallbackPool = SPECIES_ECOLOGY_ENCYCLOPEDIA.filter((e) => e.category === finalCat).slice(0, 3);
        const rawPool = apiCandidates.length >= 2 ? apiCandidates : fallbackPool;
        const weights = [72, 18, 10];
        setCandidateList(
          rawPool.slice(0, 3).map((c: any, idx: number) => ({
            koreanName: c.koreanName,
            scientificName: c.scientificName || '',
            category: (c.category || finalCat) as Specimen['category'],
            family: c.family || finalFamily || '국화과',
            keyIdentification: c.keyIdentification,
            tags: c.tags,
            percent: typeof c.confidence === 'number' && c.confidence > 0 ? c.confidence : (weights[idx] ?? 10),
          }))
        );
        setSelectedCandidateIndex(0);
        setCaptureFlow('candidates');
        return;
      }

      // B-10: High confidence ready screen
      setResultStage('ready');
      setRegisteredSpecimen(null);
      setCaptureFlow('result');
    } catch {
      saveAsOfflineShot();
    }
  };

  // Shutter trigger (B-01 -> B-07a)
  const handleShutterClick = () => {
    const shouldFlash = flashSetting === 'on' || flashSetting === 'auto';
    if (!isSilentMode) sounds.playShutter();
    setIsShutterFired(true);
    setTimeout(() => setIsShutterFired(false), shouldFlash ? 240 : 120);

    const liveFrame = !customPhotoUrl ? captureLiveVideoFrame() : null;
    const imgUrl = customPhotoUrl || liveFrame || currentPreset.image;
    const hintLabel = customPhotoUrl || liveFrame ? '촬영 사진' : currentPreset.name;
    runIdentificationPipeline(imgUrl, hintLabel, false);
  };

  // File upload handler (safe EXIF strip + run scan)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.lastModified) {
      const d = new Date(file.lastModified);
      setUploadDate(`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`);
      setUploadTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    }

    try {
      const cleanUrl = await stripExifFromImageFile(file);
      setCustomPhotoUrl(cleanUrl);
      setIsAlbumOpen(false);
      setCaptureFlow(null);
      const hintFromFile = file.name.replace(/\.[^.]+$/, '');
      runIdentificationPipeline(cleanUrl, hintFromFile || '촬영 사진', true);
    } catch {
      setToastMessage('사진을 불러오지 못했어요.');
    }
  };

  // Complete registration from B-10 ('ready' -> 'analyzing' -> 'done')
  const handleRegisterSpecimenFromResult = async () => {
    if (!activeShot) return;

    const aiData = activeShot.preset;
    const displayName = aiData.name || '자연 생물';
    const displayScientific = aiData.scientific || 'Species';
    const displayCategory = aiData.category || 'birds';
    const displayFamily = aiData.family || '미분류과';
    const displayGenus = aiData.genus || displayScientific.split(' ')[0] || '미분류속';

    const existingMatch = existingSpecimens.find(
      (s) => s.koreanName && (s.koreanName === displayName || s.koreanName.includes(displayName))
    );
    const isNewDiscovery = !existingMatch || !existingMatch.isCollected || existingMatch.isPending;

    // 10-slot limit check before registration
    if (!isProUser && collectedCount >= 10 && (!existingMatch || !existingMatch.isCollected)) {
      const tempScore = getArtScore(displayName, activeShot.confidence);
      const tempObs: Observation = {
        id: `obs-${Date.now()}`,
        date: activeShot.isAlbum ? uploadDate : getFormattedNow().date,
        time: activeShot.isAlbum ? uploadTime : getFormattedNow().time,
        location: `${liveEnv.name} (${liveEnv.district})`,
        weather: liveEnv.weather,
        temperature: liveEnv.temperature,
        photoUrl: activeShot.imageUrl,
        seasonLabel: activeShot.isAlbum ? '앨범 기록' : '실시간 포착',
        focusPoint: activeShot.focusPoint,
        focusAfMode: activeShot.focusAfMode,
        photoScore: tempScore.total,
        photoGrade: tempScore.grade,
        aiOneLineReview: tempScore.feedbackTip,
        identificationMeta: activeShot.identificationMeta,
        memo: `${displayName} 관찰 기록`,
      };
      const pendingSp: Specimen = {
        id: `sp-${Date.now()}`,
        number: `No.${String(collectedCount + 1).padStart(3, '0')}`,
        koreanName: displayName,
        scientificName: displayScientific,
        category: displayCategory,
        family: displayFamily,
        genus: displayGenus,
        isCollected: false,
        isPending: true,
        isLive: activeShot.isLive,
        confidence: activeShot.confidence || 96,
        stickerImage: activeShot.imageUrl,
        originalImage: activeShot.imageUrl,
        colorPalette: aiData.colorPalette || ['#4D7C0F', '#EAB308', '#14532D'],
        taxonomyPath: aiData.taxonomyPath || [displayName],
        traitChips: aiData.traitChips || ['야생 생물'],
        habitatType: aiData.habitatType || liveEnv.name,
        wikiSummary: aiData.wikiSummary || '',
        wikiUrl: aiData.wikiUrl || '',
        seasonalTip: aiData.seasonalTip || '',
        observations: [tempObs],
        locationCoord: {
          name: liveEnv.name,
          city: liveEnv.city,
          district: liveEnv.district,
          country: '대한민국',
          environmentType: 'urban_park',
          x: 52,
          y: 56,
        },
      };
      setRegisteredSpecimen(pendingSp);
      setIsFlow16LimitModalOpen(true);
      return;
    }

    // Enter B-10 'analyzing' stage
    setResultStage('analyzing');
    sounds.playSwoosh();

    const prevExp = userStats?.exp ?? collectedCount * NEW_SPECIES_XP_REWARD;
    let gainedXp = 0;
    if (isNewDiscovery) {
      try {
        const todayKey = new Date().toISOString().slice(0, 10);
        const stored = JSON.parse(localStorage.getItem('moalog_daily_new_xp') || '{}');
        const dailyCount = stored.date === todayKey && typeof stored.count === 'number' ? stored.count : 0;
        if (dailyCount < DAILY_NEW_SPECIES_XP_CAP) {
          gainedXp = NEW_SPECIES_XP_REWARD;
        }
      } catch {
        gainedXp = NEW_SPECIES_XP_REWARD;
      }
    }
    const nextExp = prevExp + gainedXp;

    // Request real Gemini photo art appraisal (/api/analyze-photo-art) while analyzing spinner shows
    const localFallbackScore = getArtScore(displayName, activeShot.confidence);
    let finalScore = localFallbackScore.total;
    let finalGrade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' = localFallbackScore.grade;
    let finalReview = localFallbackScore.feedbackTip;

    try {
      const encoded = await imageUrlToBase64(activeShot.imageUrl);
      const artRes = await fetch('/api/analyze-photo-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: encoded?.base64,
          photoUrl: encoded?.base64 ? undefined : activeShot.imageUrl,
          mimeType: encoded?.mimeType || 'image/jpeg',
          koreanName: displayName,
          scientificName: displayScientific,
          category: displayCategory,
          location: `${liveEnv.name} (${liveEnv.district})`,
          habitatType: aiData.habitatType || liveEnv.name,
          weather: liveEnv.weather,
          date: activeShot.isAlbum ? uploadDate : getFormattedNow().date,
        }),
      });
      if (artRes.ok) {
        const artJson = await artRes.json();
        const art = artJson?.data;
        if (art && typeof art.total === 'number') {
          finalScore = art.total;
          finalGrade = (art.grade || localFallbackScore.grade) as 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
          finalReview = art.oneLineReview || art.feedbackTip || localFallbackScore.feedbackTip;
        }
      }
    } catch {
      // Offline / unreachable: keep localFallbackScore cleanly
    }

    const newObs: Observation = {
      id: `obs-${Date.now()}`,
      date: activeShot.isAlbum ? uploadDate : getFormattedNow().date,
      time: activeShot.isAlbum ? uploadTime : getFormattedNow().time,
      location: `${liveEnv.name} (${liveEnv.district})`,
      weather: activeShot.isAlbum ? '' : liveEnv.weather,
      temperature: activeShot.isAlbum ? '' : liveEnv.temperature,
      photoUrl: activeShot.imageUrl,
      seasonLabel: activeShot.isAlbum ? '앨범 기록' : '실시간 포착',
      focusPoint: activeShot.focusPoint,
      focusAfMode: activeShot.focusAfMode,
      photoScore: finalScore,
      photoGrade: finalGrade,
      aiOneLineReview: finalReview,
      identificationMeta: activeShot.identificationMeta,
      memo: finalReview,
    };

    const isAnimal = ['birds', 'mammals', 'insects', 'amphibians', 'reptiles', 'fishes'].includes(displayCategory);
    const defaultTax = [isAnimal ? '동물계' : '식물계', displayFamily, displayName];

    const specimenToSave: Specimen = {
      id: existingMatch ? existingMatch.id : `sp-${Date.now()}`,
      number: existingMatch ? existingMatch.number : `No.${String(existingSpecimens.length + 1).padStart(3, '0')}`,
      koreanName: displayName,
      scientificName: displayScientific,
      category: displayCategory,
      family: displayFamily,
      genus: displayGenus,
      isCollected: true,
      isPending: false,
      isLive: activeShot.isLive,
      confidence: activeShot.confidence || 96,
      stickerImage: existingMatch?.stickerImage || activeShot.imageUrl,
      originalImage: activeShot.imageUrl,
      colorPalette: aiData.colorPalette || ['#4D7C0F', '#EAB308', '#14532D'],
      taxonomyPath: aiData.taxonomyPath || defaultTax,
      traitChips: aiData.traitChips || ['야생 생물'],
      habitatType: aiData.habitatType || liveEnv.name,
      wikiSummary: aiData.wikiSummary || `${displayName} 관찰 기록입니다.`,
      wikiUrl: aiData.wikiUrl || '',
      seasonalTip: aiData.seasonalTip || '',
      observations: existingMatch ? [newObs, ...(existingMatch.observations || [])] : [newObs],
      locationCoord: {
        name: liveEnv.name,
        city: liveEnv.city,
        district: liveEnv.district,
        country: '대한민국',
        environmentType: 'urban_park',
        x: 52,
        y: 58,
      },
    };

    setStoredAlbum((prev) =>
      prev.map((a) =>
        a.id === activeShot.id
          ? {
              ...a,
              speciesName: displayName,
              scientificName: displayScientific,
              category: displayCategory,
              family: displayFamily,
              isRegistered: true,
              registeredSpecimenId: specimenToSave.id,
            }
          : a
      )
    );

    if (isOnboarding && onOnboardingComplete) {
      onOnboardingComplete(specimenToSave, activeShot.imageUrl);
      setCaptureFlow(null);
      return;
    }

    onCollectSpecimen(specimenToSave, newObs, { suppressAttendanceModal: true });
    setRegisteredSpecimen(specimenToSave);
    setXpAnimationState({ beforeExp: prevExp, afterExp: nextExp, animateToAfter: false });
    setResultStage('done');
    sounds.playChime();
    if (finalGrade === 'S') {
      try {
        confetti({ particleCount: 36, spread: 58, origin: { y: 0.7 } });
      } catch {}
    }

    setTimeout(() => {
      setXpAnimationState((prev) => ({ ...prev, animateToAfter: true }));
    }, 320);
  };

  // Share capture card
  const handleShareResult = async () => {
    const targetSp = registeredSpecimen;
    const name = targetSp?.koreanName || activeShot?.preset.name || '자연 생물';
    const text = `[모아로그] '${name}' 생물을 도감에 기록했어요!`;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setToastMessage('공유 내용을 클립보드에 복사했어요.');
    } catch {
      setToastMessage('공유 준비가 완료되었어요.');
    }
  };

  // Apply candidate choice (B-10e -> B-10 'ready')
  const handleConfirmCandidate = () => {
    if (!activeShot || candidateList.length === 0) return;
    const chosen = candidateList[selectedCandidateIndex] || candidateList[0];
    setActiveShot({
      ...activeShot,
      confidence: 92,
      preset: {
        ...activeShot.preset,
        name: chosen.koreanName,
        scientific: chosen.scientificName,
        category: chosen.category as any,
        family: chosen.family,
        wikiSummary: chosen.keyIdentification || activeShot.preset.wikiSummary,
        traitChips: chosen.tags || activeShot.preset.traitChips,
      },
    });
    setResultStage('ready');
    setRegisteredSpecimen(null);
    setCaptureFlow('result');
  };

  // Open album item click handler
  const handleAlbumItemClick = (item: StoredAlbumItem & { linkedSpecimen?: Specimen }) => {
    if (isAlbumSelectMode) {
      setSelectedAlbumIds((prev) =>
        prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
      );
      return;
    }

    if (item.isRegistered && item.linkedSpecimen && onSelectSpecimen) {
      setIsAlbumOpen(false);
      onSelectSpecimen(item.linkedSpecimen);
      return;
    }

    // Unregistered photo -> open B-10 'ready' (or B-08b if unknown)
    const matchedPreset: PresetType = {
      ...SCAN_PRESETS[0],
      name: item.speciesName || '자연 생물',
      scientific: item.scientificName || 'Species',
      category: (item.category as any) || 'plants',
      family: item.family || '미분류과',
      genus: item.genus || '',
      confidence: item.confidence || 92,
      image: item.imageUrl,
    };
    setActiveShot({
      id: item.id,
      imageUrl: item.imageUrl,
      createdAt: item.createdAt,
      preset: matchedPreset,
      isAlbum: true,
      isLive: item.isLive,
      zoomScale: 1.0,
      focusPoint: { x: 50, y: 50 },
      focusAfMode: 'Auto Multi-AF',
      confidence: item.confidence || 92,
      isRegistered: false,
    });
    setIsAlbumOpen(false);

    if (!item.speciesName || item.speciesName === '미확인') {
      runIdentificationPipeline(item.imageUrl, item.speciesName || '들꽃', true);
    } else {
      setResultStage('ready');
      setRegisteredSpecimen(null);
      setCaptureFlow('result');
    }
  };

  // Batch delete selected album items (B-06c)
  const handleDeleteSelectedAlbumItems = () => {
    if (selectedAlbumIds.length === 0) return;
    setStoredAlbum((prev) => prev.filter((item) => !selectedAlbumIds.includes(item.id)));
    setToastMessage(`${selectedAlbumIds.length}장의 사진을 앨범에서 삭제했어요.`);
    setSelectedAlbumIds([]);
    setIsAlbumSelectMode(false);
  };

  const latestThumbUrl = combinedAlbumItems[0]?.imageUrl || '';

  return (
    <div
      ref={containerRef}
      id="lens-view-fullscreen"
      onClick={handleViewfinderClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full ${isOnboarding ? 'h-full' : 'h-[100dvh]'} bg-black text-white overflow-hidden select-none`}
    >
      {/* Hidden file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-[120] bg-[#202320] text-white px-4 py-2.5 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 max-w-[90vw] pointer-events-none"
          >
            <Check className="w-3.5 h-3.5 text-[#c4eb43] shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          B-01 LIVE VIEWFINDER BACKGROUND
          ======================================================== */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
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
          <img
            src={customPhotoUrl || currentPreset.image}
            alt={currentPreset.name}
            className="w-full h-full object-cover transition-transform duration-100 ease-out origin-center"
            style={{ transform: `scale(${zoomScale})` }}
          />
        )}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/75 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none" />
      </div>

      {/* Subtle Corner Viewfinder Brackets */}
      {!isAnalyzing && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <div className="relative w-[76vw] max-w-[300px] aspect-[4/4.3]">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl-xs" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr-xs" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/40 rounded-bl-xs" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br-xs" />
          </div>
        </div>
      )}

      {/* Shutter Flash */}
      {isShutterFired && <div className="absolute inset-0 z-40 bg-white/85 pointer-events-none" />}

      {/* Tap Focus Indicator */}
      {focusPoint && (
        <div
          className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ left: focusPoint.x, top: focusPoint.y }}
        >
          <div className="w-12 h-12 border-2 border-[#c4eb43] rounded-xl flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-[#c4eb43] rounded-full" />
          </div>
        </div>
      )}

      {/* ========================================================
          B-01 TOP CONTROLS (X left, Live + Flash right, optional Live pill)
          ======================================================== */}
      {!isAnalyzing && (
        <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-3.5 pointer-events-none">
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOnboarding && onOnboardingBack) onOnboardingBack();
                  else onNavigateToArchive();
                }}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer active:scale-95"
                aria-label="닫기"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Discreet test sample switch ONLY when camera hardware isn't active */}
              {!hasCameraStream && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPresetMenuOpen((prev) => !prev);
                    }}
                    className="h-8 px-2.5 rounded-full bg-black/45 text-white/80 text-[11px] font-medium flex items-center gap-1 backdrop-blur-md cursor-pointer"
                  >
                    <span>{customPhotoUrl ? '내 사진' : currentPreset.name}</span>
                    <ChevronDown className="w-3 h-3 opacity-75" />
                  </button>
                  {isPresetMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-0 top-10 w-44 rounded-2xl bg-white text-[#202320] shadow-2xl border border-[#e6e9e5] py-1.5 z-50 overflow-hidden"
                    >
                      {SCAN_PRESETS.map((p, idx) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => {
                            setSelectedPresetIndex(idx);
                            setCustomPhotoUrl(null);
                            setIsPresetMenuOpen(false);
                          }}
                          className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-[#f4f5f4] cursor-pointer ${
                            selectedPresetIndex === idx && !customPhotoUrl ? 'font-bold text-black' : 'text-[#626961]'
                          }`}
                        >
                          <span>{p.name}</span>
                          {selectedPresetIndex === idx && !customPhotoUrl && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Live Motion & Flash circles */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isProUser) {
                    setIsLivePaywallOpen(true);
                    return;
                  }
                  setIsLiveMotionEnabled((prev) => !prev);
                  if (!isSilentMode) sounds.playTone(800, 0.05);
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer ${
                  isLiveMotionEnabled && isProUser
                    ? 'bg-white text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                aria-label="Live 모션 전환"
              >
                <Disc className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = flashSetting === 'off' ? 'auto' : flashSetting === 'auto' ? 'on' : 'off';
                  setFlashSetting(next);
                  try {
                    localStorage.setItem('moalog_flash_setting', next);
                  } catch {}
                  if (!isSilentMode) sounds.playTone(660, 0.05);
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer ${
                  flashSetting === 'on'
                    ? 'bg-[#c4eb43] text-[#202320]'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                aria-label="플래시 전환"
              >
                {flashSetting === 'off' ? <ZapOff className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Live ● centered white pill (B-01) */}
          {isLiveMotionEnabled && isProUser && (
            <div className="flex justify-center mt-3">
              <div className="px-3.5 py-1 rounded-full bg-white text-[#202320] text-[12px] font-bold border border-[#c4eb43] shadow-sm flex items-center gap-1.5">
                <span>Live</span>
                <span className="w-2.5 h-2.5 rounded-full border-2 border-[#d2d7d1]" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          B-01 BOTTOM CONTROLS (Zoom pills + Upload / Shutter / Album)
          ======================================================== */}
      {!isAnalyzing && (
        <div className="absolute bottom-8 left-0 right-0 z-20 px-4 flex flex-col items-center pointer-events-none">
          {/* Zoom Strip: 0.5x 1x 3x 5x */}
          <div className="flex items-center gap-2 bg-black/45 backdrop-blur-md px-2 py-1 rounded-full mb-5 pointer-events-auto">
            {[
              { label: '0.5x', val: 0.7 },
              { label: '1x', val: 1.0 },
              { label: '3x', val: 3.0 },
              { label: '5x', val: 5.0 },
            ].map((z) => {
              const isActive = Math.abs(zoomScale - z.val) < 0.25;
              return (
                <button
                  key={z.label}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomScale(z.val);
                  }}
                  className={`px-3 h-7 rounded-full text-[12px] font-bold tabular-nums transition-all cursor-pointer ${
                    isActive ? 'bg-white text-black' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {z.label}
                </button>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="w-full max-w-sm flex items-center justify-between px-4 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer active:scale-95"
              aria-label="앨범에서 사진 올리기"
            >
              <Upload className="w-5 h-5 text-white" />
            </button>

            <motion.button
              id="btn-shutter-trigger"
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={(e) => {
                e.stopPropagation();
                handleShutterClick();
              }}
              className="w-[74px] h-[74px] rounded-full border-[3px] border-white p-1 flex items-center justify-center cursor-pointer"
              aria-label="생물 촬영"
            >
              <div className="w-full h-full rounded-full bg-white" />
            </motion.button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAlbumSelectMode(false);
                setSelectedAlbumIds([]);
                setIsAlbumOpen(true);
              }}
              className="w-11 h-11 rounded-xl bg-[#f4f5f4] border border-white/25 overflow-hidden active:scale-95 transition-transform cursor-pointer flex items-center justify-center"
              aria-label="모아로그 촬영 앨범 열기"
            >
              {latestThumbUrl ? (
                <img src={latestThumbUrl} alt="최근 촬영" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-5 h-5 text-[#8c948a]" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          B-07a SCANNING OVERLAY ("생물을 찾고 있어요")
          ======================================================== */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none"
          >
            <div className="p-4 pt-5">
              <button
                type="button"
                onClick={() => setIsAnalyzing(false)}
                className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer"
                aria-label="분석 취소"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative flex-1 flex items-center justify-center overflow-hidden">
              <img
                src={scanningPreviewUrl || customPhotoUrl || currentPreset.image}
                alt="스캔 대상"
                className="w-full h-[68vh] object-cover"
              />
              {/* 4 Corner White Brackets */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-[72vw] max-w-[270px] aspect-square">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-[3px] border-l-[3px] border-white" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-[3px] border-r-[3px] border-white" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-[3px] border-l-[3px] border-white" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-[3px] border-r-[3px] border-white" />
                </div>
              </div>
              <p className="absolute bottom-6 left-0 right-0 text-center text-[17px] font-bold text-white drop-shadow-md px-4">
                {analysisStageText === 'gemini_retry'
                  ? '사진을 더 정밀하게 분석하고 있어요'
                  : '생물을 찾고 있어요'}
              </p>
            </div>

            <div className="h-24 bg-black" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          B-06 / B-06c / B-06d / B-06e 모아로그 촬영 앨범
          ======================================================== */}
      <AnimatePresence>
        {isAlbumOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 bg-[#fbfbfb] text-[#202320] flex flex-col select-none"
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
              <h2 className="text-[19px] font-bold text-[#202320] tracking-tight">
                {isAlbumSelectMode ? `${selectedAlbumIds.length}장 선택됨` : '모아로그 촬영 앨범'}
              </h2>
              <div className="flex items-center gap-2">
                {filteredAlbumItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAlbumSelectMode((prev) => !prev);
                      setSelectedAlbumIds([]);
                    }}
                    className="px-3 py-1.5 rounded-full bg-white border border-[#e6e9e5] text-[12px] font-semibold text-[#202320] cursor-pointer"
                  >
                    {isAlbumSelectMode ? '취소' : '선택'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsAlbumOpen(false);
                    setIsAlbumSelectMode(false);
                    setSelectedAlbumIds([]);
                  }}
                  className="w-10 h-10 rounded-full bg-white shadow-sm border border-[#e6e9e5] flex items-center justify-center cursor-pointer"
                  aria-label="앨범 닫기"
                >
                  <X className="w-5 h-5 text-[#202320]" />
                </button>
              </div>
            </div>

            {/* Helper Subtitle + Filter Pills */}
            <div className="px-4 pb-3 space-y-3 shrink-0">
              <p className="text-[13px] text-[#8c948a] leading-relaxed">
                {isAlbumSelectMode
                  ? '삭제할 사진을 골라 주세요. 등록한 사진은 삭제돼도 도감에 남아요.'
                  : albumFilter === 'unregistered'
                  ? '아직 등록하지 않은 사진이에요. 눌러서 확인하고 등록하세요.'
                  : albumFilter === 'registered'
                  ? '도감에 등록한 사진이에요. 눌러서 도감 상세로 가요.'
                  : '사진을 눌러 확인하고 도감에 등록하세요. 찍은 사진은 30일 동안 보관돼요.'}
              </p>

              <div className="flex items-center gap-2">
                {[
                  { id: 'all' as const, label: `전체 ${combinedAlbumItems.length}` },
                  { id: 'unregistered' as const, label: `등록 전 ${unregisteredAlbumCount}` },
                  { id: 'registered' as const, label: `등록됨 ${registeredAlbumCount}` },
                ].map((tab) => {
                  const active = albumFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAlbumFilter(tab.id)}
                      className={`h-9 px-3.5 rounded-full text-[13px] font-bold transition-colors cursor-pointer ${
                        active
                          ? 'bg-black text-white'
                          : 'bg-white text-[#202320] shadow-2xs border border-[#efefef]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo Grid grouped by Date */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5 scrollbar-thin">
              {groupedAlbumSections.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <Camera className="w-9 h-9 text-[#b5bcb4] mx-auto" />
                  <p className="text-[14px] font-semibold text-[#626961]">보관된 사진이 아직 없어요</p>
                  <button
                    type="button"
                    onClick={() => setIsAlbumOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold cursor-pointer"
                  >
                    카메라로 촬영하기
                  </button>
                </div>
              ) : (
                groupedAlbumSections.map((group) => (
                  <div key={group.label} className="space-y-2">
                    <h3 className="text-[14px] font-bold text-[#626961]">
                      {group.label} · {group.items.length}장
                    </h3>
                    <div className="grid grid-cols-3 gap-0.5">
                      {group.items.map((item) => {
                        const isSelected = selectedAlbumIds.includes(item.id);
                        const daysLeft = getDaysRemainingIn30Days(item.createdAt);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onPointerDown={() => {
                              if (isAlbumSelectMode) return;
                              longPressTimerRef.current = window.setTimeout(() => {
                                setIsAlbumSelectMode(true);
                                setSelectedAlbumIds([item.id]);
                              }, 450);
                            }}
                            onPointerUp={() => {
                              if (longPressTimerRef.current) {
                                clearTimeout(longPressTimerRef.current);
                                longPressTimerRef.current = null;
                              }
                            }}
                            onPointerLeave={() => {
                              if (longPressTimerRef.current) {
                                clearTimeout(longPressTimerRef.current);
                                longPressTimerRef.current = null;
                              }
                            }}
                            onClick={() => handleAlbumItemClick(item)}
                            className={`aspect-square relative bg-[#f4f5f4] overflow-hidden cursor-pointer text-left ${
                              isSelected ? 'ring-2 ring-black z-10' : ''
                            }`}
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.speciesName}
                              className="w-full h-full object-cover"
                            />

                            {/* Live ▶ badge */}
                            {item.isLive && (
                              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-white text-[#202320] text-[10px] font-bold flex items-center gap-0.5 shadow-xs">
                                <span>Live</span>
                                <Play className="w-2.5 h-2.5 fill-[#91bf18] text-[#91bf18]" />
                              </div>
                            )}

                            {/* Selection check or D-N badge */}
                            {isAlbumSelectMode ? (
                              <div
                                className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-[#202320] text-white'
                                    : 'bg-black/30 border border-white/60 text-transparent'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              </div>
                            ) : (
                              !item.isRegistered &&
                              daysLeft <= 10 && (
                                <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-black/75 text-white text-[10px] font-bold tabular-nums">
                                  D-{daysLeft}
                                </span>
                              )
                            )}

                            {/* Bottom-left species label */}
                            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex">
                              <span className="px-2 py-0.5 rounded-full bg-black/75 text-white text-[11px] font-bold truncate max-w-full">
                                {item.speciesName || '미확인'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Delete Bar + Quota Footer */}
            <div className="px-4 pt-2 pb-5 bg-[#fbfbfb] shrink-0 space-y-3">
              {isAlbumSelectMode && (
                <button
                  type="button"
                  onClick={handleDeleteSelectedAlbumItems}
                  disabled={selectedAlbumIds.length === 0}
                  className="w-full h-14 rounded-2xl bg-black disabled:bg-[#e6e9e5] text-white disabled:text-[#a0a79e] font-bold text-[15px] cursor-pointer"
                >
                  {selectedAlbumIds.length}장 삭제
                </button>
              )}
              <p className="text-center text-[13px] text-[#8c948a] tabular-nums">
                {isProUser ? `Pro 도감 ${collectedCount}종` : `무료 도감 ${collectedCount} / 10칸`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          B-08 / B-08b / B-09 FULLSCREEN VERIFICATION & ERROR STATES
          ======================================================== */}
      <AnimatePresence>
        {(captureFlow === 'low_confidence' || captureFlow === 'not_found' || captureFlow === 'offline') && activeShot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[55] bg-[#fbfbfb] text-[#202320] flex flex-col justify-between p-4 pb-6 select-none"
          >
            {/* Top Bar: < left, 이름 변경하기 tooltip + Pencil button right */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setCaptureFlow(null)}
                className="w-10 h-10 rounded-full bg-white shadow-sm border border-[#efefef] flex items-center justify-center cursor-pointer"
                aria-label="뒤로"
              >
                <ChevronLeft className="w-5 h-5 text-[#202320]" />
              </button>

              <div className="flex items-center gap-2">
                <div className="relative px-3 py-1.5 rounded-lg bg-[#626961] text-white text-[12px] font-semibold">
                  <span>이름 변경하기</span>
                  <span className="w-2 h-2 bg-[#626961] rotate-45 absolute -right-1 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualSpeciesPickerOpen(true)}
                  className="w-10 h-10 rounded-full bg-white shadow-sm border border-[#efefef] flex items-center justify-center cursor-pointer"
                  aria-label="종 이름 직접 변경"
                >
                  <Pencil className="w-4 h-4 text-[#202320]" />
                </button>
              </div>
            </div>

            {/* Center Content */}
            {captureFlow === 'low_confidence' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-2 space-y-5">
                <div className="space-y-4">
                  <h2 className="text-[22px] font-bold text-[#202320] tracking-tight">
                    {activeShot.preset.name}
                  </h2>
                  <div className="w-36 h-36 mx-auto flex items-center justify-center">
                    <img
                      src={activeShot.imageUrl}
                      alt={activeShot.preset.name}
                      className="max-w-full max-h-full object-contain rounded-2xl shadow-md border-4 border-white"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#c92a2a] text-white text-[12px] font-extrabold flex items-center justify-center">
                      !
                    </span>
                    <span className="text-[14px] font-semibold text-[#202320]">신뢰도 매우낮음</span>
                  </div>
                </div>

                {/* Tips Card */}
                <div className="w-full max-w-sm bg-[#f4f5f4] rounded-[20px] p-4 text-left space-y-3">
                  <button
                    type="button"
                    onClick={() => setIsTipsExpanded((prev) => !prev)}
                    className="w-full flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-[15px] font-bold text-[#202320]">이렇게 찍어 보세요</span>
                    {isTipsExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#626961]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#626961]" />
                    )}
                  </button>
                  {isTipsExpanded && (
                    <div className="space-y-2.5 text-[13px] text-[#454a44]">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-sm shrink-0">🎯</span>
                        <span>생물이 화면 가운데에 크게 오도록</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-sm shrink-0">⏱️</span>
                        <span>초점이 맞을 때까지 잠깐 멈추기</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-sm shrink-0">⛅</span>
                        <span>해를 등지고 밝은 곳에서 찍기</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {captureFlow === 'not_found' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-2 space-y-5">
                <div className="w-52 h-52 rounded-full overflow-hidden bg-[#f4f5f4] border border-[#e6e9e5]">
                  <img
                    src={activeShot.imageUrl}
                    alt="감지된 사진"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-[21px] font-bold text-[#202320]">생물을 찾지 못했어요</h2>
                  <p className="text-[13px] text-[#8c948a]">사진이 흔들렸거나 생물이 너무 작을 수 있어요</p>
                </div>

                <div className="w-full max-w-sm bg-[#f4f5f4] rounded-[20px] p-4 text-left space-y-3">
                  <button
                    type="button"
                    onClick={() => setIsTipsExpanded((prev) => !prev)}
                    className="w-full flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-[15px] font-bold text-[#202320]">이렇게 찍어 보세요</span>
                    {isTipsExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#626961]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#626961]" />
                    )}
                  </button>
                  {isTipsExpanded && (
                    <div className="space-y-2.5 text-[13px] text-[#454a44]">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-sm shrink-0">🎯</span>
                        <span>생물이 화면 가운데에 크게 담기</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-sm shrink-0">⏱️</span>
                        <span>초점이 맞을 때까지 잠깐 멈추기</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-sm shrink-0">⛅</span>
                        <span>해를 등지고 밝은 곳에서 찍기</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {captureFlow === 'offline' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-6">
                <div className="w-56 h-56 rounded-full overflow-hidden bg-[#f4f5f4] border border-[#e6e9e5]">
                  <img
                    src={activeShot.imageUrl}
                    alt="보관된 사진"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <h2 className="text-[21px] font-bold text-[#202320]">지금은 확인할 수 없어요</h2>
                  <p className="text-[13px] text-[#8c948a] leading-relaxed max-w-xs mx-auto">
                    연결이 불안정해요. 사진은 최근 촬영에 안전하게 보관했어요
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="max-w-md w-full mx-auto space-y-2.5">
              {captureFlow === 'low_confidence' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setResultStage('ready');
                      setRegisteredSpecimen(null);
                      setCaptureFlow('result');
                    }}
                    className="w-full h-14 rounded-2xl bg-black hover:bg-[#202320] text-white font-bold text-[15px] cursor-pointer"
                  >
                    맞아요
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDirectEditTarget({ x: 50, y: 50 });
                      setIsDirectEditSheetOpen(true);
                    }}
                    className="w-full h-14 rounded-2xl bg-white border border-[#e6e9e5] text-[#202320] font-bold text-[15px] cursor-pointer"
                  >
                    다른 생명체예요
                  </button>
                </>
              )}

              {captureFlow === 'not_found' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCaptureFlow(null);
                      setCustomPhotoUrl(null);
                    }}
                    className="w-full h-14 rounded-2xl bg-black hover:bg-[#202320] text-white font-bold text-[15px] cursor-pointer"
                  >
                    다시 촬영하기
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCaptureFlow(null);
                      setIsAlbumOpen(true);
                    }}
                    className="w-full h-14 rounded-2xl bg-white border border-[#e6e9e5] text-[#202320] font-bold text-[15px] cursor-pointer"
                  >
                    앨범에서 고르기
                  </button>
                </>
              )}

              {captureFlow === 'offline' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCaptureFlow(null);
                      runIdentificationPipeline(activeShot.imageUrl, activeShot.preset.name, activeShot.isAlbum, activeShot.preset);
                    }}
                    className="w-full h-14 rounded-2xl bg-black hover:bg-[#202320] text-white font-bold text-[15px] cursor-pointer"
                  >
                    다시 확인하기
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCaptureFlow(null);
                      setAlbumFilter('unregistered');
                      setIsAlbumOpen(true);
                    }}
                    className="w-full h-14 rounded-2xl bg-white border border-[#e6e9e5] text-[#202320] font-bold text-[15px] cursor-pointer"
                  >
                    나중에 최근 촬영에서 확인하기
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          DIRECT EDIT CROP TARGET BOTTOM SHEET ("직접 수정")
          ======================================================== */}
      <AnimatePresence>
        {isDirectEditSheetOpen && activeShot && (
          <div
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-xs flex items-end justify-center select-none"
            onClick={() => setIsDirectEditSheetOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 340 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-[28px] overflow-hidden text-[#202320] shadow-2xl"
            >
              <div className="pt-2.5 pb-3 px-4">
                <div className="w-9 h-1 rounded-full bg-[#d2d7d1] mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsDirectEditSheetOpen(false)}
                    className="w-9 h-9 rounded-full bg-[#f4f5f4] flex items-center justify-center cursor-pointer"
                    aria-label="닫기"
                  >
                    <X className="w-4 h-4 text-[#626961]" />
                  </button>
                  <h3 className="text-[16px] font-bold text-[#202320]">직접 수정</h3>
                  <div className="w-9" />
                </div>
              </div>

              {/* Tap-to-pick subject area */}
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                  const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                  setDirectEditTarget({
                    x: Math.max(10, Math.min(90, x)),
                    y: Math.max(10, Math.min(90, y)),
                  });
                }}
                className="relative w-full h-64 bg-[#f4f5f4] overflow-hidden cursor-crosshair"
              >
                <img
                  src={activeShot.imageUrl}
                  alt="대상 직접 고르기"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute w-24 h-24 -translate-x-1/2 -translate-y-1/2 border-2 border-[#c4eb43] rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.3)] flex items-center justify-center pointer-events-none transition-all duration-150"
                  style={{ left: `${directEditTarget.x}%`, top: `${directEditTarget.y}%` }}
                >
                  <Crosshair className="w-5 h-5 text-[#c4eb43]" />
                </div>
              </div>

              <div className="py-2.5 bg-white text-center text-[13px] font-medium text-[#626961] border-y border-[#f0f1f0] flex items-center justify-center gap-1">
                <span>탭해서 대상을 골라 주세요</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </div>

              {/* Zoomed subject preview strip */}
              <div className="px-4 pt-3 pb-1 flex items-center gap-3 bg-[#fbfbfb] border-b border-[#f0f1f0]">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#eaede9] border border-[#e6e9e5] shrink-0">
                  <img
                    src={activeShot.imageUrl}
                    alt="선택 영역"
                    className="w-full h-full object-cover"
                    style={{
                      transform: 'scale(1.85)',
                      transformOrigin: `${directEditTarget.x}% ${directEditTarget.y}%`,
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[12px] font-bold text-[#202320]">선택한 영역 확대 재분석</p>
                  <p className="text-[11px] text-[#8c948a] truncate">
                    선택 지점을 중심으로 Gemini가 다시 판별해요
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsDirectEditSheetOpen(false);
                    setIsManualSpeciesPickerOpen(true);
                  }}
                  className="text-[11px] font-bold text-[#626961] underline shrink-0 cursor-pointer"
                >
                  이름 선택
                </button>
              </div>

              <div className="p-4 pb-7 space-y-2.5 bg-white">
                <button
                  type="button"
                  onClick={async () => {
                    setIsDirectEditSheetOpen(false);
                    const croppedUrl = await cropImageAtFocus(activeShot.imageUrl, directEditTarget, 0.55);
                    runIdentificationPipeline(
                      croppedUrl,
                      activeShot.preset.name,
                      activeShot.isAlbum,
                      undefined,
                      {
                        forceGemini: true,
                        focusCropNote: `사용자가 이미지 내 (${directEditTarget.x}%, ${directEditTarget.y}%) 영역을 직접 지정하여 확대했습니다.`,
                      }
                    );
                  }}
                  className="w-full h-14 rounded-2xl bg-black hover:bg-[#202320] text-white font-bold text-[15px] cursor-pointer"
                >
                  이 대상으로 확인
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDirectEditSheetOpen(false);
                    setCaptureFlow(null);
                  }}
                  className="w-full h-14 rounded-2xl bg-[#f4f5f4] hover:bg-[#eaede9] text-[#202320] font-bold text-[15px] cursor-pointer"
                >
                  다시 찍기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          B-10e CANDIDATE SHEET ("이 생물이 맞나요?")
          ======================================================== */}
      <AnimatePresence>
        {captureFlow === 'candidates' && activeShot && (
          <div
            className="fixed inset-0 z-[65] bg-black/50 backdrop-blur-xs flex items-end justify-center select-none"
            onClick={() => setCaptureFlow(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 340 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-[28px] px-5 pt-3 pb-6 text-[#202320] shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="w-9 h-1 rounded-full bg-[#d2d7d1] mx-auto" />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCaptureFlow(null)}
                  className="w-9 h-9 rounded-full bg-[#f4f5f4] flex items-center justify-center cursor-pointer"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4 text-[#626961]" />
                </button>
                <h3 className="text-[16px] font-bold text-[#202320]">포착 결과</h3>
                <div className="w-9" />
              </div>

              <div className="w-28 h-28 mx-auto flex items-center justify-center">
                <img
                  src={activeShot.imageUrl}
                  alt="후보 대상"
                  className="max-w-full max-h-full object-contain rounded-2xl"
                />
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-[22px] font-bold text-[#202320]">이 생물이 맞나요?</h2>
                <p className="text-[13px] text-[#8c948a]">AI가 추정한 후보예요 · 맞는 종을 골라 주세요</p>
              </div>

              <div className="space-y-2.5">
                {candidateList.map((cand, idx) => {
                  const selected = selectedCandidateIndex === idx;
                  return (
                    <button
                      key={`${cand.koreanName}-${idx}`}
                      type="button"
                      onClick={() => setSelectedCandidateIndex(idx)}
                      className={`w-full p-4 rounded-2xl flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                        selected
                          ? 'border-2 border-[#c4eb43] bg-white'
                          : 'border border-[#e6e9e5] bg-white hover:bg-[#fbfbfb]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            selected ? 'border-2 border-black' : 'border-2 border-[#b5bcb4]'
                          }`}
                        >
                          {selected && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[15px] font-bold text-[#202320] truncate">{cand.koreanName}</p>
                          <p className="text-[12px] text-[#8c948a] truncate">
                            {cand.scientificName} · {cand.family}
                          </p>
                        </div>
                      </div>
                      <span className="text-[14px] font-bold text-[#202320] tabular-nums shrink-0">
                        {cand.percent}%
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmCandidate}
                  className="w-full h-14 rounded-2xl bg-black hover:bg-[#202320] text-white font-bold text-[15px] cursor-pointer"
                >
                  이 종으로 등록하기
                </button>
                <div className="flex items-center justify-center gap-6 pt-1">
                  <button
                    type="button"
                    onClick={() => setCaptureFlow(null)}
                    className="text-[13px] font-semibold text-[#8c948a] hover:text-[#202320] cursor-pointer py-1"
                  >
                    다시 찍기
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsManualSpeciesPickerOpen(true)}
                    className="text-[13px] font-semibold text-[#8c948a] hover:text-[#202320] cursor-pointer py-1"
                  >
                    직접 종 찾기
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          B-10 RESULT SHEET ('ready' -> 'analyzing' -> 'done')
          ======================================================== */}
      <AnimatePresence>
        {captureFlow === 'result' && activeShot && (
          <div
            className="fixed inset-0 z-[65] bg-black/50 backdrop-blur-xs flex items-end justify-center select-none"
            onClick={() => {
              if (resultStage !== 'analyzing') setCaptureFlow(null);
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 340 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-[28px] px-5 pt-3 pb-7 text-[#202320] shadow-2xl max-h-[93vh] overflow-y-auto flex flex-col"
            >
              <div className="w-9 h-1 rounded-full bg-[#d2d7d1] mx-auto mb-3 shrink-0" />

              {/* Sheet Top Bar */}
              <div className="flex items-center justify-between mb-4 shrink-0">
                <button
                  type="button"
                  disabled={resultStage === 'analyzing'}
                  onClick={() => setCaptureFlow(null)}
                  className="w-9 h-9 rounded-full bg-[#f4f5f4] flex items-center justify-center cursor-pointer disabled:opacity-40"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4 text-[#626961]" />
                </button>
                <h3 className="text-[16px] font-bold text-[#202320]">포착 결과</h3>
                <div className="w-9" />
              </div>

              {/* STAGE 1 & 2: Ready or Analyzing */}
              {resultStage !== 'done' && (() => {
                const isNewDiscovery = !existingSpecimens.some(
                  (s) => s.isCollected && !s.isPending && s.koreanName === activeShot.preset.name
                );
                const categoryLabel = getSpeciesTaxonomyCategoryLabel(activeShot.preset.category);
                return (
                  <div className="flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-5 text-center pt-1">
                      {isNewDiscovery && (
                        <div className="flex justify-start">
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-black text-white text-[11px] font-bold">
                            <span>NEW</span>
                            <span>✦</span>
                            <span>처음 만난 생물</span>
                          </span>
                        </div>
                      )}

                      <div className="h-48 flex items-center justify-center">
                        <img
                          src={activeShot.imageUrl}
                          alt={activeShot.preset.name}
                          className="max-h-full max-w-[220px] object-contain rounded-2xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <h2 className="text-[26px] font-bold text-[#202320] tracking-tight">
                          {activeShot.preset.name}
                        </h2>
                        <p className="text-[13px] text-[#8c948a]">
                          {categoryLabel} · {activeShot.preset.family || '자연생물과'} · {activeShot.preset.scientific}
                        </p>
                      </div>

                      {resultStage === 'ready' ? (
                        <div className="space-y-2 pt-2">
                          <p className="text-[14px] text-[#626961]">등록하면 AI가 등급과 한줄평을 분석해요</p>
                          <button
                            type="button"
                            onClick={() => setIsManualSpeciesPickerOpen(true)}
                            className="text-[12px] text-[#8c948a] underline hover:text-[#202320] cursor-pointer"
                          >
                            혹시 다른 생물인가요? 이름 변경하기
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2.5 pt-2">
                          <div className="w-5 h-5 rounded-full border-2 border-[#202320] border-t-transparent animate-spin shrink-0" />
                          <span className="text-[14px] font-medium text-[#626961]">
                            AI가 등급과 한줄평을 분석하고 있어요
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-4">
                      {resultStage === 'ready' ? (
                        <>
                          <button
                            type="button"
                            onClick={handleRegisterSpecimenFromResult}
                            className="w-full h-14 rounded-2xl bg-black hover:bg-[#202320] text-white font-bold text-[15px] cursor-pointer"
                          >
                            도감에 등록하기
                          </button>
                          <button
                            type="button"
                            onClick={() => setCaptureFlow(null)}
                            className="w-full py-2 text-[13px] font-semibold text-[#8c948a] hover:text-[#202320] cursor-pointer"
                          >
                            다시 찍기
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full h-14 rounded-2xl bg-[#eaede9] text-[#a0a79e] font-bold text-[15px]"
                        >
                          분석하는 중이에요
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* STAGE 3: Done (Collectible card showcase, XP bar fill, AI 한줄평) */}
              {resultStage === 'done' && (() => {
                const sp = registeredSpecimen;
                const name = sp?.koreanName || activeShot.preset.name;
                const sci = sp?.scientificName || activeShot.preset.scientific;
                const fam = sp?.family || activeShot.preset.family || '자연생물과';
                const catLabel = getSpeciesTaxonomyCategoryLabel(sp?.category || activeShot.preset.category);
                const latestObs = sp?.observations?.[0];
                const fallbackScore = getArtScore(name, activeShot.confidence);
                const obsScore = latestObs?.photoScore ?? fallbackScore.total;
                const obsGrade =
                  latestObs?.photoGrade ||
                  (obsScore >= 90 ? 'S' : obsScore >= 80 ? 'A' : obsScore >= 68 ? 'B' : 'C');
                const reviewText = latestObs?.aiOneLineReview || fallbackScore.feedbackTip;

                const displayedExp = xpAnimationState.animateToAfter
                  ? xpAnimationState.afterExp
                  : xpAnimationState.beforeExp;
                const levelProg = getLevelProgress(displayedExp);
                const titleInfo = getExplorerTitleInfo(
                  existingSpecimens,
                  { ...(userStats || { freeScans: 10, isProUser, streakDays: 0, exploredHabitats: [], totalScans: 1 }), exp: displayedExp },
                  userAccount
                );
                const remainingXp = Math.max(0, levelProg.requiredXp - levelProg.currentXp);
                const userHandle = userAccount?.isLoggedIn
                  ? `@${(userAccount.email || 'explorer').split('@')[0]}`
                  : '@moa_explorer';
                const shortDistrict = (liveEnv.district || liveEnv.name || '').split(' ').slice(-1)[0] || liveEnv.name;

                return (
                  <div className="space-y-5">
                    {/* Title + Hexagon Grade Score */}
                    <div className="text-center space-y-1.5">
                      <h2 className="text-[24px] font-bold text-[#202320] tracking-tight">{name}</h2>
                      <p className="text-[12px] text-[#8c948a]">
                        {catLabel} · {fam} · {sci}
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1.5">
                        <HexGradeBadge grade={obsGrade} size="md" />
                        <span className="text-[17px] font-bold text-[#202320] tabular-nums">{obsScore}점</span>
                      </div>
                    </div>

                    {/* Collectible Card Showcase + Share button */}
                    <div className="bg-[#f4f5f4] rounded-[22px] p-4 relative flex justify-center">
                      {showShare && (
                        <button
                          type="button"
                          onClick={handleShareResult}
                          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white border border-[#e6e9e5] shadow-2xs flex items-center justify-center cursor-pointer"
                          aria-label="포착 카드 공유"
                        >
                          <Share2 className="w-4 h-4 text-[#202320]" />
                        </button>
                      )}

                      <div className="w-[168px] rounded-lg bg-[#65b200] p-2.5 text-white shadow-lg flex flex-col items-center">
                        <span className="text-[9px] font-extrabold text-[#111906] mb-1.5 tracking-tight">
                          Moalog
                        </span>
                        <div className="relative w-full rounded-xl bg-gradient-to-b from-[#2f322f] to-[#171917] p-2.5 space-y-2 border border-white/10 overflow-hidden">
                          <div
                            className="pointer-events-none absolute -top-6 -left-10 w-44 h-14 -rotate-35 bg-gradient-to-b from-white/15 to-transparent"
                            aria-hidden="true"
                          />
                          <div className="flex justify-center">
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[8px] font-semibold text-white/85">
                              {catLabel} · {sp?.number || 'No.001'}
                            </span>
                          </div>
                          <div className="h-24 flex items-center justify-center overflow-hidden rounded-lg">
                            <img
                              src={activeShot.imageUrl}
                              alt={name}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div className="flex items-end justify-between gap-1 pt-1">
                            <div className="min-w-0 text-left">
                              <p className="text-[11px] font-bold text-white truncate">{name}</p>
                              <p className="text-[7px] text-white/60 italic truncate">{sci}</p>
                              <p className="text-[7px] text-white/60 truncate mt-0.5">
                                {shortDistrict} · {getFormattedNow().date}
                              </p>
                            </div>
                            <HexGradeBadge grade={obsGrade} size="sm" />
                          </div>
                        </div>
                        <span className="text-[8px] font-bold text-[#111906] mt-1.5">{userHandle}</span>
                      </div>
                    </div>

                    {/* Explorer Level & Animated XP Progress */}
                    <div className="space-y-2">
                      <p className="text-[16px] font-bold text-[#202320]">
                        Lv.{levelProg.level} {titleInfo.activeTitle}
                      </p>
                      <div className="w-full h-2.5 rounded-full bg-[#eaede9] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#c4eb43] transition-all duration-700 ease-out"
                          style={{ width: `${Math.max(4, levelProg.percentage)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[12px] tabular-nums">
                        <span>
                          <strong className="text-[#202320] font-bold">{levelProg.currentXp}</strong>{' '}
                          <span className="text-[#8c948a]">/ {levelProg.requiredXp} XP</span>
                        </span>
                        <span className="font-bold text-[#202320]">
                          다음 레벨까지 {remainingXp} XP
                        </span>
                      </div>
                    </div>

                    {/* AI One-line Review */}
                    <div className="rounded-[18px] bg-white border border-[#c4eb43] p-4 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#626961]">
                        <Sparkles className="w-3.5 h-3.5 text-[#06b6d4]" />
                        <span>AI 한줄평</span>
                      </div>
                      <p className="text-[13px] text-[#202320] leading-relaxed">{reviewText}</p>
                    </div>

                    {/* Bottom CTA */}
                    <button
                      type="button"
                      onClick={() => {
                        setCaptureFlow(null);
                        if (registeredSpecimen && onSelectSpecimen) {
                          onSelectSpecimen(registeredSpecimen);
                        } else {
                          onNavigateToArchive();
                        }
                      }}
                      className="w-full h-14 rounded-2xl bg-black hover:bg-[#202320] text-white font-bold text-[15px] cursor-pointer"
                    >
                      도감에서 보기
                    </button>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MANUAL SPECIES PICKER MODAL (이름 직접 고르기)
          ======================================================== */}
      <AnimatePresence>
        {isManualSpeciesPickerOpen && (
          <div
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
            onClick={() => setIsManualSpeciesPickerOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white text-[#202320] rounded-t-[28px] sm:rounded-[24px] max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-[#efefef] flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-base font-bold text-[#202320]">직접 종 선택하기</h3>
                  <p className="text-xs text-[#8c948a] mt-0.5">도감 목록에서 맞는 생물 이름을 골라 주세요</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualSpeciesPickerOpen(false)}
                  className="w-9 h-9 rounded-full bg-[#f4f5f4] flex items-center justify-center cursor-pointer"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4 text-[#626961]" />
                </button>
              </div>

              <div className="p-4 space-y-3 flex-1 min-h-0 flex flex-col overflow-hidden bg-[#fbfbfb]">
                <div className="relative shrink-0">
                  <input
                    type="text"
                    value={manualSearchQuery}
                    onChange={(e) => setManualSearchQuery(e.target.value)}
                    placeholder="생물 이름 검색 (예: 노랑코스모스, 참새, 물총새)..."
                    className="w-full bg-white border border-[#e6e9e5] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#202320] placeholder:text-[#8c948a] focus:outline-none focus:border-black"
                  />
                  <Search className="w-4 h-4 text-[#8c948a] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 pb-0.5">
                  {[
                    { key: 'all', label: '전체' },
                    { key: 'plants', label: '식물' },
                    { key: 'insects', label: '곤충' },
                    { key: 'birds', label: '조류' },
                    { key: 'mammals', label: '포유류' },
                    { key: 'fishes', label: '어류' },
                    { key: 'fungi', label: '균류' },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setManualCategory(cat.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer ${
                        manualCategory === cat.key
                          ? 'bg-black text-white'
                          : 'bg-white border border-[#e6e9e5] text-[#626961]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 min-h-[200px] overflow-y-auto space-y-2 pr-0.5">
                  {SPECIES_ECOLOGY_ENCYCLOPEDIA.filter((item) => {
                    if (manualCategory !== 'all' && item.category !== manualCategory) return false;
                    const q = manualSearchQuery.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      item.koreanName.toLowerCase().includes(q) ||
                      item.scientificName.toLowerCase().includes(q) ||
                      (item.family || '').toLowerCase().includes(q)
                    );
                  }).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const baseImg = activeShot?.imageUrl || customPhotoUrl || currentPreset.image;
                        const updatedPreset: PresetType = {
                          ...currentPreset,
                          name: item.koreanName,
                          scientific: item.scientificName,
                          category: item.category as any,
                          family: item.family,
                          genus: item.order || item.family,
                          confidence: 98,
                          image: baseImg,
                          wikiSummary: item.keyIdentification,
                          traitChips: item.tags || [],
                        };
                        setActiveShot({
                          id: activeShot?.id || `alb-${Date.now()}`,
                          imageUrl: baseImg,
                          createdAt: activeShot?.createdAt || Date.now(),
                          preset: updatedPreset,
                          isAlbum: Boolean(activeShot?.isAlbum),
                          isLive: Boolean(activeShot?.isLive),
                          zoomScale: 1.0,
                          focusPoint: { x: 50, y: 50 },
                          focusAfMode: 'Auto Multi-AF',
                          confidence: 98,
                        });
                        setIsManualSpeciesPickerOpen(false);
                        setResultStage('ready');
                        setRegisteredSpecimen(null);
                        setCaptureFlow('result');
                        sounds.playChime();
                      }}
                      className="w-full text-left p-3 rounded-2xl bg-white border border-[#e6e9e5] hover:border-black flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-[13px] font-bold text-[#202320] truncate">{item.koreanName}</p>
                        <p className="text-[11px] text-[#8c948a] italic truncate">{item.scientificName}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8c948a] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          10-SLOT LIMIT PAYWALL SHEET
          ======================================================== */}
      <AnimatePresence>
        {isFlow16LimitModalOpen && registeredSpecimen && (
          <div
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-xs flex items-end justify-center select-none"
            onClick={() => setIsFlow16LimitModalOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[28px] max-h-[90vh] overflow-y-auto p-5 pb-7 text-[#202320] shadow-2xl max-w-md w-full space-y-4"
            >
              <div className="w-9 h-1 rounded-full bg-[#d2d7d1] mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-[#202320]">도감 10칸이 가득 찼어요</h3>
                <p className="text-xs text-[#626961] mt-1">
                  {registeredSpecimen.koreanName}을(를) 11번째 칸에 넣으려면 이용권이 필요해요
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'yearly' as const, title: '연간 구독', sub: '1년 · 월 2,417원 꼴', price: '29,000원' },
                  { id: 'monthly' as const, title: '월 구독', sub: '언제든 해지 가능', price: '3,300원' },
                  { id: 'lifetime' as const, title: '영구 이용권', sub: '평생 칸 제한 없이 소장', price: '58,000원' },
                ].map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setFlow16SelectedPlan(plan.id)}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between cursor-pointer ${
                      flow16SelectedPlan === plan.id
                        ? 'border-2 border-black bg-[#fbfbfb]'
                        : 'border border-[#e6e9e5] bg-white'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-bold text-[#202320]">{plan.title}</p>
                      <p className="text-[11px] text-[#8c948a]">{plan.sub}</p>
                    </div>
                    <span className="text-base font-bold text-[#202320] tabular-nums">{plan.price}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFlow16LimitModalOpen(false);
                    onOpenPaywall();
                  }}
                  className="w-full h-14 bg-black text-white font-bold text-sm rounded-2xl cursor-pointer"
                >
                  칸 제한 풀고 등록하기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (registeredSpecimen.observations?.[0]) {
                      onCollectSpecimen(registeredSpecimen, registeredSpecimen.observations[0], {
                        suppressAttendanceModal: true,
                      });
                    }
                    setIsFlow16LimitModalOpen(false);
                    setCaptureFlow(null);
                  }}
                  className="w-full py-2 text-[#8c948a] font-semibold text-xs text-center cursor-pointer"
                >
                  나중에 · 최근 촬영에 보관해요
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          LIVE PAYWALL SHEET
          ======================================================== */}
      <AnimatePresence>
        {isLivePaywallOpen && (
          <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-end justify-center select-none"
            onClick={() => setIsLivePaywallOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[28px] p-6 pb-8 text-[#202320] shadow-2xl max-w-md w-full space-y-5 text-center"
            >
              <div className="w-9 h-1 rounded-full bg-[#d2d7d1] mx-auto" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4fbdd] border border-[#c4eb43] text-[#6d8911] text-xs font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Live 포토</span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-[#202320]">
                  Live 포토는 이용권에서 저장돼요
                </h3>
                <p className="text-[13px] text-[#626961]">
                  날갯짓, 고개 돌리는 순간까지 셔터 앞뒤 1.5초를 함께 남겨요
                </p>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLivePaywallOpen(false);
                    onOpenPaywall();
                  }}
                  className="w-full h-14 bg-black text-white font-bold text-sm rounded-2xl cursor-pointer"
                >
                  이용권 보기
                </button>
                <button
                  type="button"
                  onClick={() => setIsLivePaywallOpen(false)}
                  className="w-full py-2 text-[#8c948a] font-semibold text-xs cursor-pointer"
                >
                  사진만 찍을게요
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
