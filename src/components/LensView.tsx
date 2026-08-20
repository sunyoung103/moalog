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
} from 'lucide-react';
import { Specimen, Observation } from '../types';
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
    family: '국화과 (Asteraceae)',
    genus: '민들레속 (Taraxacum)',
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
    family: '참새과 (Passeridae)',
    genus: '참새속 (Passer)',
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
    family: '천남성과 (Araceae)',
    genus: '몬스테라속 (Monstera)',
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
    family: '솔딱새과 (Muscicapidae)',
    genus: '울새속 (Erithacus)',
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
    family: '오리과 (Anatidae)',
    genus: '오리속 (Anas)',
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

  const [startWithCamera, setStartWithCamera] = useState(() => {
    try {
      return localStorage.getItem('moalog_startup_tab') === 'lens';
    } catch {
      return false;
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:3');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isShutterFired, setIsShutterFired] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);

  // Session Capture Queue for rapid firing
  const [sessionShots, setSessionShots] = useState<SessionShot[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewActiveIndex, setReviewActiveIndex] = useState(0);

  // Tap-to-focus state
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

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

      // Add to session queue instead of analyzing immediately, store zoomScale
      const newShot: SessionShot = {
        id: Date.now().toString(),
        imageUrl: customPhotoUrl || currentPreset.image,
        preset: currentPreset,
        isAlbum: false,
        zoomScale: zoomScale,
      };

      setSessionShots((prev) => [...prev, newShot]);
    }, 1100);
  };

  // 08-1 예술 점수 산출 (포켓몬 스냅 · 젤다 5대 구도 기반 채점)
  const getArtScore = (preset: any, seedIndex: number) => {
    const name = preset.name;

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

    const existingMatch = existingSpecimens.find(
      (s) =>
        s.koreanName.includes(aiData.name) ||
        aiData.name.includes(s.koreanName)
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
        memo: `생태 렌즈 다중 포착. 예술점수 ${score.total}점 (${score.grade}등급)`,
      };
    });

    const specimenToSave: Specimen = {
      id: existingMatch ? existingMatch.id : `sp-${Date.now()}`,
      number: existingMatch ? existingMatch.number : `No.0${existingSpecimens.length + 1}`,
      koreanName: aiData.name,
      scientificName: aiData.scientific,
      category: aiData.category,
      family: aiData.family,
      genus: aiData.genus,
      isCollected: true,
      isPending: false,
      confidence: aiData.confidence || 98,
      stickerImage: primaryShot.imageUrl,
      originalImage: primaryShot.imageUrl,
      colorPalette: aiData.colorPalette,
      taxonomyPath: aiData.taxonomyPath,
      traitChips: aiData.traitChips,
      habitatType: aiData.habitatType,
      wikiSummary: aiData.wikiSummary,
      wikiUrl: aiData.wikiUrl,
      seasonalTip: aiData.seasonalTip,
      observations: existingMatch ? [...newObservations, ...existingMatch.observations] : newObservations,
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
 
          {/* Camera Gear Settings Icon */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsSettingsOpen(true);
              if (!isSilentMode) {
                sounds.playTone(720, 0.05);
              }
            }}
            className="w-10 h-10 rounded-full bg-stone-900/80 text-stone-300 hover:bg-stone-800 border border-white/10 flex items-center justify-center transition-all shadow-md"
            title="카메라 앱 설정"
          >
            <Settings className="w-4 h-4 text-stone-300" />
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
                              <h3 className="text-base font-black text-stone-900">{sessionShots[reviewActiveIndex].preset.name}</h3>
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
                  <p className="text-[11px] text-stone-500 mt-0.5">도감 목록에서 포착한 생물 종을 직접 선택하세요</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualSpeciesPickerOpen(false)}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={manualSearchQuery}
                    onChange={(e) => setManualSearchQuery(e.target.value)}
                    placeholder="생물 이름 검색 (예: 참새, 서양민들레, 까치)..."
                    className="w-full bg-stone-100 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-900 font-medium focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
                  {[
                    { key: 'all', label: '전체' },
                    { key: 'birds', label: '조류' },
                    { key: 'plants', label: '식물' },
                    { key: 'insects', label: '곤충류' },
                    { key: 'mammals', label: '포유류' },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setManualCategory(cat.key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                        manualCategory === cat.key
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {SPECIES_ECOLOGY_ENCYCLOPEDIA.filter((item) => {
                    if (manualCategory !== 'all' && item.category !== manualCategory) return false;
                    const q = manualSearchQuery.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      item.koreanName.toLowerCase().includes(q) ||
                      item.scientificName.toLowerCase().includes(q) ||
                      item.family.toLowerCase().includes(q)
                    );
                  }).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const newShot: SessionShot = {
                          id: Date.now().toString(),
                          imageUrl: customPhotoUrl || currentPreset.image,
                          preset: item as any,
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

      {/* Camera App Settings Drawer / Modal (카메라 설정) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-stone-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
            onClick={() => setIsSettingsOpen(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-stone-900 text-white rounded-t-3xl sm:rounded-3xl max-w-md w-full flex flex-col shadow-2xl border border-white/10 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-stone-900 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold tracking-tight">포착렌즈 카메라 설정</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Settings List */}
              <div className="p-5 space-y-6">
                
                {/* 1. Flash Defaults */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-black">기본 플래시 모드</span>
                  </div>
                  <p className="text-[10px] text-stone-400 leading-relaxed">
                    셔터를 누를 때 적용될 플래시 모드를 지정합니다. 자동(Auto) 설정 시 빛이 부족한 환경에서 스마트 플래시가 적용됩니다.
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 pt-1.5">
                    {([
                      { key: 'off', label: '항상 꺼짐' },
                      { key: 'auto', label: '자동 (Auto)' },
                      { key: 'on', label: '항상 켬' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setFlashSetting(opt.key);
                          try {
                            localStorage.setItem('moalog_flash_setting', opt.key);
                          } catch {}
                          if (!isSilentMode) sounds.playTone(600, 0.05);
                        }}
                        className={`py-2 rounded-xl text-[11px] font-bold transition-all border ${
                          flashSetting === opt.key
                            ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-sm'
                            : 'bg-stone-800 text-stone-300 border-white/5 hover:bg-stone-750'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/5" />

                {/* 2. Silent Camera Mode Toggle */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {isSilentMode ? (
                        <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span className="text-xs font-black">카메라 무음 모드</span>
                    </div>
                    <p className="text-[10px] text-stone-400 leading-relaxed pr-2">
                      주변 야생 생물(조류, 곤충 등)의 소리 자극을 방지하기 위해 셔터 및 초점 알림 소리를 완전히 끕니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isSilentMode;
                      setIsSilentMode(next);
                      try {
                        localStorage.setItem('moalog_silent_camera', String(next));
                      } catch {}
                      if (!next) {
                        sounds.playTone(880, 0.05);
                      }
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 shrink-0 ${
                      isSilentMode ? 'bg-rose-500 flex justify-end' : 'bg-stone-700 flex justify-start'
                    }`}
                  >
                    <motion.div
                      layout
                      className="w-5 h-5 rounded-full bg-white shadow-md"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-white/5" />

                {/* 3. Startup Tab Toggle */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-black">앱 시작 시 카메라로 시작</span>
                    </div>
                    <p className="text-[10px] text-stone-400 leading-relaxed pr-2">
                      도감 목록 페이지 대신 포착렌즈 카메라 뷰파인더가 첫 화면으로 즉시 실행되도록 지정합니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !startWithCamera;
                      setStartWithCamera(next);
                      try {
                        localStorage.setItem('moalog_startup_tab', next ? 'lens' : 'archive');
                      } catch {}
                      if (!isSilentMode) sounds.playTone(700, 0.05);
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 shrink-0 ${
                      startWithCamera ? 'bg-emerald-500 flex justify-end' : 'bg-stone-700 flex justify-start'
                    }`}
                  >
                    <motion.div
                      layout
                      className="w-5 h-5 rounded-full bg-white shadow-md"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 bg-stone-900/60 border-t border-white/10 flex items-center justify-center shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-2.5 bg-white hover:bg-stone-150 text-stone-900 text-[11px] font-black rounded-xl transition-all active:scale-98"
                >
                  설정 완료
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
