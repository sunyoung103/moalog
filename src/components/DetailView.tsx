import React, { useState, useRef } from 'react';
import { Specimen, Observation } from '../types';
import {
  MapPin,
  Sparkles,
  Trophy,
  Calendar,
  Layers,
  Star,
  CloudSun,
  X,
  Crown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Tag,
  Compass,
  Edit3,
  Bot,
  Info,
  Check,
  Zap,
  Sliders,
  Maximize2,
  Scan,
  Activity,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  MessageCircleQuestion,
  HelpCircle,
  ExternalLink,
  Eye,
  Camera,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';
import { EditSpecimenModal } from './EditSpecimenModal';
import { AiChatbotModal } from './AiChatbotModal';
import { RadarChart } from './RadarChart';

// Sticker design themes for swipeable collection card
export type CardVisualTheme =
  | 'photo' // 1. Real photo
  | 'sticker_classic' // 2. Die-cut Sticker with art score
  | 'stamp_vintage' // 3. Postal Stamp (우표 감성)
  | 'collector_card'; // 4. Premium Hologram Collector Card (점수/스탯 포함)

interface DetailViewProps {
  specimen: Specimen;
  currentPersona: string;
  onClose: () => void;
  onSelectTaxonomyFilter: (taxon: string) => void;
  onAddObservation: (specimenId: string, observation: Observation) => void;
  onUpdateSpecimen?: (updatedSpecimen: Specimen) => void;
  onDeleteSpecimen?: (specimenId: string) => void;
  onOpenLens?: () => void;
}

export const DetailView: React.FC<DetailViewProps> = ({
  specimen,
  currentPersona,
  onClose,
  onSelectTaxonomyFilter,
  onAddObservation,
  onUpdateSpecimen,
  onDeleteSpecimen,
  onOpenLens,
}) => {
  // Photo selection carousel index
  const [selectedObservationIndex, setSelectedObservationIndex] = useState(0);

  // Active Visual Theme mode (Photo, Sticker, Postal Stamp, Collector Card)
  const [visualTheme, setVisualTheme] = useState<CardVisualTheme>('photo');

  // In-place photo detail & composition review toggle (사진 클릭 시 같은 화면 내에서 내용 전환)
  const [isPhotoSelectedMode, setIsPhotoSelectedMode] = useState(false);

  // Active Top Tag Tab selection (텃새, 참새목, 잡식성, 27cm)
  const [activeTagTab, setActiveTagTab] = useState<string | null>(null);

  // 2단계 상세 백과사전 아코디언 상태 (생김새, 생태, 어원, 서식지, 특이사항/관찰팁)
  const [expandedCategories, setExpandedCategories] = useState<{
    appearance: boolean;
    ecology: boolean;
    etymology: boolean;
    habitat: boolean;
    funFact: boolean;
  }>({
    appearance: false,
    ecology: false,
    etymology: false,
    habitat: false,
    funFact: false,
  });

  const toggleCategory = (key: keyof typeof expandedCategories) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Wikipedia full text expand state
  const [isWikiExpanded, setIsWikiExpanded] = useState(false);

  // Live Photo motion state
  const [isLivePlaying, setIsLivePlaying] = useState(false);
  const [liveSecondsLeft, setLiveSecondsLeft] = useState(0);
  const liveTimerRef = useRef<number | null>(null);

  // Modals & toasts
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [showCoverSetToast, setShowCoverSetToast] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Refs for smooth scrolling to specific sections when clicking tags
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const obsScrollRef = useRef<HTMLDivElement>(null);
  const taxonomySectionRef = useRef<HTMLDivElement>(null);
  const habitatSectionRef = useRef<HTMLDivElement>(null);
  const dietSectionRef = useRef<HTMLDivElement>(null);
  const sizeSectionRef = useRef<HTMLDivElement>(null);

  // Guarantee multiple sample observation photos if specimen has 1 observation
  const displayObservations =
    specimen.observations && specimen.observations.length > 1
      ? specimen.observations
      : [
          ...(specimen.observations || []),
          {
            id: 'sample-obs-2',
            date: '2026.08.15',
            time: '오후 02:40',
            location: '서울숲 열매나무 숲길',
            weather: '🌤️ 구름조금',
            temperature: '26°C',
            photoUrl:
              specimen.koreanName === '직박구리'
                ? 'https://images.unsplash.com/photo-1555169062-013468b47731?w=800&auto=format&fit=crop&q=80'
                : 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&auto=format&fit=crop&q=80',
            memo: '나무 열매 탐식 및 날개 움직임 순간 포착',
          },
          {
            id: 'sample-obs-3',
            date: '2026.08.18',
            time: '오전 11:15',
            location: '남산 야외식물원 산책로',
            weather: '☀️ 맑음',
            temperature: '24°C',
            photoUrl:
              specimen.koreanName === '직박구리'
                ? 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80'
                : 'https://images.unsplash.com/photo-1549608276-5786777e6587?w=800&auto=format&fit=crop&q=80',
            memo: '측면 깃털 질감 및 표정 관찰 샷',
          },
        ];

  // Active Observation record
  const activeObs =
    displayObservations[selectedObservationIndex] ||
    displayObservations[0] || {
      id: 'default-obs',
      date: '2026.08.17',
      time: '14:30',
      location: specimen.locationCoord?.name || '서울숲 생태원',
      weather: '☀️ 맑음',
      temperature: '24°C',
      photoUrl: specimen.originalImage || specimen.stickerImage || '',
      memo: '자연 서식지에서 포착된 개체입니다.',
    };

  const totalPhotosCount = displayObservations.length;

  // Active display photo URL
  const currentObsPhoto =
    activeObs.photoUrl || specimen.originalImage || specimen.stickerImage || '';
  const currentStickerPhoto = specimen.stickerImage || currentObsPhoto;

  // Find encyclopedia deep info
  const ecoDetail = SPECIES_ECOLOGY_ENCYCLOPEDIA.find(
    (e) => e.koreanName === specimen.koreanName
  );

  // Calculate unique Composition Art Score for THIS specific observation
  // 5 항목: 포즈(18), 배율(18), 시선(16), 배경(20), 선명도(17) -> 총점 89 S등급 (직박구리 기준 매핑)
  const photoArtScore = (() => {
    const seedStr = `${specimen.id}-${activeObs?.id || '0'}-${
      activeObs?.photoUrl || ''
    }-${activeObs?.date || ''}-${selectedObservationIndex}`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
    const posHash = Math.abs(hash);

    // Baseline: 16~20 points per metric
    const pose = 18 + ((posHash + 0) % 3) - 1; // 17 ~ 19
    const zoom = 18 + ((posHash >> 2) % 3) - 1; // 17 ~ 19 (배율)
    const gaze = 16 + ((posHash >> 4) % 4); // 16 ~ 19 (시선)
    const bg = 19 + ((posHash >> 6) % 2); // 19 ~ 20 (배경)
    const sharpness = 17 + ((posHash >> 8) % 3); // 17 ~ 19 (선명도)

    const total = pose + zoom + gaze + bg + sharpness; // 87 ~ 98
    const grade: 'S' | 'A' | 'B' =
      total >= 88 ? 'S' : total >= 80 ? 'A' : 'B';

    let appraisalOneLiner = '한줄평: 고고한 움직임이 아름다워요!';
    let appraisalTitle = '자연 서식지 최적 구도';
    let framingDetail = '피사체와 배경의 대비가 우수하며 3분할 황금비율에 안정적으로 배치됨';
    let lightingDetail = '자연 채광 및 하이라이트 디테일이 생생하게 살아있는 표본';

    if (specimen.koreanName === '직박구리') {
      appraisalOneLiner = '한줄평: 고고한 움직임이 아름다워요!';
      appraisalTitle = 'S등급 황금비율 생태 걸작';
      framingDetail = '부스스한 머리깃과 뺨의 밤색 반점이 황금 교차점에 선명하게 포착되었습니다.';
      lightingDetail = '나뭇가지 사이로 들어오는 소프트 자연광이 깃털 질감을 극대화합니다.';
    } else if (grade === 'S') {
      appraisalOneLiner = '한줄평: 생생한 숨결이 느껴지는 완벽한 순간 포착!';
      appraisalTitle = 'S등급 황금비율 생태 걸작';
      framingDetail = '피사체의 주요 동적 특징이 프레임 황금 교차점에 완벽히 일치하여 최고의 생태적 가치를 지닙니다.';
      lightingDetail = '소프트 자연광이 깃털/잎맥의 미세한 질감을 선명하게 부각시킵니다.';
    } else {
      appraisalOneLiner = '한줄평: 자연스러운 생태 환경과 안정된 시선 처리가 돋보여요.';
      appraisalTitle = 'A등급 우수 생태 포착';
      framingDetail = '안정적인 수평 구도와 피사체 중심 집중도가 돋보이는 훌륭한 기록입니다.';
    }

    const radarData = [
      { label: '포즈', value: pose, fullMark: 20 },
      { label: '배율', value: zoom, fullMark: 20 },
      { label: '시선', value: gaze, fullMark: 20 },
      { label: '배경', value: bg, fullMark: 20 },
      { label: '선명도', value: sharpness, fullMark: 20 },
    ];

    return {
      total,
      grade,
      pose,
      zoom,
      gaze,
      bg,
      sharpness,
      radarData,
      appraisalOneLiner,
      appraisalTitle,
      framingDetail,
      lightingDetail,
    };
  })();

  // Swipe gesture for horizontal photo / card navigation
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const isLeftSwipe = distance > 35;
    const isRightSwipe = distance < -35;

    if (isLeftSwipe) {
      handleNextPhoto();
    } else if (isRightSwipe) {
      handlePrevPhoto();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const handlePrevPhoto = () => {
    setSelectedObservationIndex((prev) =>
      prev > 0 ? prev - 1 : totalPhotosCount - 1
    );
  };

  const handleNextPhoto = () => {
    setSelectedObservationIndex((prev) =>
      prev < totalPhotosCount - 1 ? prev + 1 : 0
    );
  };

  const isRepresentativeCover =
    selectedObservationIndex === 0 ||
    activeObs.photoUrl === specimen.originalImage;

  // Set active photo as representative cover
  const handleSetAsRepresentativeCover = () => {
    if (!onUpdateSpecimen) return;

    const chosenObs = activeObs;
    const reorderedObservations = [
      chosenObs,
      ...specimen.observations.filter(
        (_, idx) => idx !== selectedObservationIndex
      ),
    ];

    const updated: Specimen = {
      ...specimen,
      originalImage: chosenObs.photoUrl || specimen.originalImage,
      observations: reorderedObservations,
    };

    onUpdateSpecimen(updated);
    setSelectedObservationIndex(0);
    setShowCoverSetToast(true);
    setTimeout(() => setShowCoverSetToast(false), 2400);
  };

  // Toggle Live Photo (독립 버튼 동작)
  const handleToggleLivePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLivePlaying) {
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
      setIsLivePlaying(false);
      setLiveSecondsLeft(0);
      return;
    }

    setIsLivePlaying(true);
    setLiveSecondsLeft(3.5);

    const startTime = Date.now();
    const duration = 3500;

    if (liveTimerRef.current) clearInterval(liveTimerRef.current);
    liveTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (duration - elapsed) / 1000);
      setLiveSecondsLeft(+remaining.toFixed(1));

      if (remaining <= 0) {
        if (liveTimerRef.current) clearInterval(liveTimerRef.current);
        setIsLivePlaying(false);
      }
    }, 100);
  };

  // Species Classification text parsing
  const orderString =
    specimen.taxonomyPath.find((t) => t.endsWith('목')) || specimen.family;
  const kingdomString =
    specimen.taxonomyPath.find((t) => t.endsWith('계')) || '동물계';

  // Specific size or physical stats
  const speciesSizeText =
    ecoDetail?.size ||
    specimen.traitChips.find((t) => t.includes('cm') || t.includes('mm') || t.includes('길이')) ||
    '몸길이 약 27~28cm (날개 약 40cm)';

  // Diet and enemies / interactions
  const dietText =
    ecoDetail?.dietAndBehavior ||
    '나무 열매(감·버찌), 꽃꿀(동백·벚꽃), 여름철 곤충·거미 등 다양한 먹이원을 섭취하는 잡식성';

  const enemiesText =
    specimen.category === 'birds'
      ? '새매 · 황조롱이, 까치 · 어치 · 청설모, 길고양이'
      : specimen.category === 'plants'
      ? '초식 곤충류, 달팽이, 설치류, 제초 작업'
      : specimen.category === 'insects'
      ? '박새 · 딱새 등 식충 조류, 거미류, 사마귀, 개구리'
      : '맹금류, 대형 식육목 동물, 로드킬';

  // Habitat / Seasonality
  const seasonText = ecoDetail?.seasonality || '연중 관찰가능 (사계절 국내 상주)';
  const habitatRangeText =
    specimen.habitatType ||
    ecoDetail?.habitat ||
    '전국 도심 녹지 ~ 산림 및 공원 어디서나';
  const populationText = ecoDetail?.status || '매우 흔함 • 관심대상(LC)';

  // Core Tag Chips for Step 1 UI
  const primaryTags = [
    { label: '텃새', section: 'habitat' },
    { label: orderString || '참새목', section: 'taxonomy' },
    {
      label: specimen.category === 'birds' ? '잡식성' : '자생종',
      section: 'diet',
    },
    { label: '27cm', section: 'size' },
  ];

  // Helper to scroll to section smoothly
  const scrollToSection = (section: string) => {
    let targetRef: React.RefObject<HTMLDivElement> | null = null;
    if (section === 'taxonomy') targetRef = taxonomySectionRef;
    else if (section === 'habitat') targetRef = habitatSectionRef;
    else if (section === 'diet') targetRef = dietSectionRef;
    else if (section === 'size') targetRef = sizeSectionRef;

    if (targetRef && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Design styles for visual theme switcher
  const visualThemesList: { id: CardVisualTheme; label: string; icon: string }[] = [
    { id: 'photo', label: '관찰 원본', icon: '📷' },
    { id: 'sticker_classic', label: '도감 스티커', icon: '🏷️' },
    { id: 'stamp_vintage', label: '우표 에디션', icon: '📮' },
    { id: 'collector_card', label: '스탯 카드', icon: '✨' },
  ];

  // Wikipedia full text content (요약 없는 공식 위키백과 내용 원문)
  const fullWikipediaContent =
    specimen.koreanName === '직박구리'
      ? `직박구리(Hypsipetes amaurotis, 영어: Brown-eared Bulbul)는 참새목 직박구리과에 속하는 중형 조류이다. 한반도 전역의 산림과 도시 공원 등에서 매우 흔하게 번식하는 텃새이다. 

몸길이는 약 27~28cm이며, 몸 전체는 회갈색이고 뺨 부분에 특징적인 밤색 반점이 있다. 머리 꼭대기의 깃털은 뾰족하게 서서 약간 부스스한 형태를 이룬다. 날개폭은 약 40cm이다. 

식성은 잡식성으로 봄철에는 벚꽃이나 동백꽃의 꿀을 먹으며 수분을 돕고, 여름에는 매미, 나방, 딱정벌레, 거미 등 곤충류를 포식하며, 가을과 겨울에는 감, 버찌, 쥐똥나무, 피라칸타 등 식물의 열매를 주식으로 삼는다. 

'찌비-, 피비-' 하고 매우 크고 날카롭게 울며, 무리를 지어 나무 사이를 빠르게 날아다닌다. 한반도 외에도 일본 열도, 타이완, 중국 동남부, 필리핀 북부 등 동아시아 전역에 널리 분포한다.`
      : specimen.wikiSummary ||
        `${specimen.koreanName}(${specimen.scientificName})는 ${specimen.taxonomyPath.join(' ')}에 속하는 생물종으로, 한반도 자연 생태계의 주요 구성원입니다.`;

  // Summary Description for top overview
  const summaryDescription =
    specimen.koreanName === '직박구리'
      ? '한반도 전역의 산림과 도심 공원에서 사계절 내내 흔하게 관찰되는 대표적인 텃새로, 회갈색 몸과 뺨의 밤색 반점이 특징입니다.'
      : specimen.description ||
        ecoDetail?.keyIdentification ||
        `${specimen.koreanName}는 ${specimen.family}에 속하는 대표적인 생물종으로 한반도 생태계의 주요 구성원입니다.`;

  return (
    <>
      {/* ================= FULL SCREEN CONTAINER ================= */}
      <motion.div
        id={`specimen-detail-${specimen.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 bg-stone-950 text-stone-900 w-full h-full overflow-y-auto select-none flex flex-col scrollbar-none"
      >
        {/* Scrollable Body Content */}
        <div className="flex-1 w-full max-w-lg mx-auto pb-28 relative">
          {/* Toast: Cover Set Feedback */}
          <AnimatePresence>
            {showCoverSetToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-amber-300 px-4 py-2 rounded-full shadow-2xl border border-amber-400/40 text-xs font-bold flex items-center gap-2"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>도감 대표 사진으로 지정되었습니다!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================
              1. Photo Stage (1:1 Aspect Ratio with Floating Circle Buttons)
              ======================================================== */}
          <div className="relative w-full bg-stone-950 overflow-hidden select-none">
            {/* Top Floating Circular Action Controls over Photo */}
            <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
              {/* Top Left: Circular Back Button + High Contrast Mode Switcher Badge */}
              <div className="pointer-events-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-stone-900/70 hover:bg-stone-900/90 text-white backdrop-blur-md shadow-lg border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                  title="뒤로가기"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPhotoSelectedMode(!isPhotoSelectedMode)}
                  className="px-3.5 py-2 rounded-full bg-stone-900/90 hover:bg-stone-950 text-white text-xs font-black backdrop-blur-md shadow-2xl border border-white/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer select-none"
                  title="클릭하여 모드 전환"
                >
                  {isPhotoSelectedMode ? (
                    <>
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>포착 점수 모드</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>생태 백과 모드</span>
                    </>
                  )}
                  <span className="text-[10px] text-stone-300 bg-white/20 px-1.5 py-0.5 rounded-md font-extrabold ml-0.5">전환 ▾</span>
                </button>
              </div>

              {/* Top Right: Edit Circular Button ONLY (No redundant X button) */}
              <div className="pointer-events-auto flex items-center gap-2">
                {onUpdateSpecimen && (
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-10 h-10 rounded-full bg-stone-900/70 hover:bg-stone-900/90 text-white backdrop-blur-md shadow-lg border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                    title="수정"
                  >
                    <Edit3 className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Score Mode Theme Switcher Bar (Overlayed on Photo) */}
            <AnimatePresence>
              {isPhotoSelectedMode && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-16 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-auto"
                >
                  {/* Edition Theme Switcher */}
                  <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-lg text-xs overflow-x-auto scrollbar-none">
                    {visualThemesList.map((item) => {
                      const isActive = visualTheme === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVisualTheme(item.id);
                          }}
                          className={`px-2.5 py-1 rounded-full font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer active:scale-95 ${
                            isActive
                              ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                              : 'text-stone-300 hover:text-white'
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span className="text-[10px]">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Zoom Original Image Button (Full-Screen Lightbox Modal) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsZoomModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-xs font-extrabold border border-white/20 shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
                    title="새 창에서 크게 보기"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>크게보기</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 1:1 Aspect Ratio Main Image Display Frame */}
            <div
              onClick={() => setIsPhotoSelectedMode(!isPhotoSelectedMode)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative w-full aspect-square bg-stone-950 flex items-center justify-center cursor-pointer overflow-hidden group"
            >
              <AnimatePresence mode="wait">
                {visualTheme === 'photo' && (
                  <motion.div
                    key={`main-photo-${selectedObservationIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full relative"
                  >
                    <motion.img
                      src={currentObsPhoto}
                      alt={specimen.koreanName}
                      referrerPolicy="no-referrer"
                      animate={
                        isLivePlaying
                          ? {
                              scale: [1, 1.04, 1.02, 1.05, 1],
                              rotate: [0, -0.8, 0.8, -0.4, 0],
                              x: [0, -3, 3, -1, 0],
                              y: [0, -2, 2, -1, 0],
                            }
                          : { scale: 1, rotate: 0, x: 0, y: 0 }
                      }
                      transition={
                        isLivePlaying
                          ? {
                              duration: 3.5,
                              ease: 'easeInOut',
                              repeat: Infinity,
                            }
                          : { duration: 0.25 }
                      }
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />

                    {/* Rule of thirds grid on score mode */}
                    {isPhotoSelectedMode && (
                      <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-amber-400/40">
                        <div className="border-r border-b border-amber-400/30" />
                        <div className="border-r border-b border-amber-400/30" />
                        <div className="border-b border-amber-400/30" />
                        <div className="border-r border-b border-amber-400/30 relative">
                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full shadow-md animate-ping" />
                        </div>
                        <div className="border-r border-b border-amber-400/30 relative">
                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full shadow-md animate-ping" />
                        </div>
                        <div className="border-b border-amber-400/30" />
                        <div className="border-r border-amber-400/30" />
                        <div className="border-r border-amber-400/30" />
                        <div />
                      </div>
                    )}
                  </motion.div>
                )}

                {visualTheme === 'sticker_classic' && (
                  <motion.div
                    key={`main-sticker-${selectedObservationIndex}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex flex-col items-center justify-center p-6 bg-radial from-stone-800 to-stone-950 relative"
                  >
                    <img
                      src={currentStickerPhoto}
                      alt={`${specimen.koreanName} 스티커`}
                      referrerPolicy="no-referrer"
                      className="max-w-[80%] max-h-[80%] object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.6)]"
                      style={{
                        filter:
                          'drop-shadow(2.5px 2.5px 0 #ffffff) drop-shadow(-2.5px -2.5px 0 #ffffff) drop-shadow(2.5px -2.5px 0 #ffffff) drop-shadow(-2.5px 2.5px 0 #ffffff)',
                      }}
                    />
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/95 text-[#202424] rounded-full text-[10px] font-black font-mono shadow-xl flex items-center gap-1.5 border border-stone-200">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>생태 스티커 No.{specimen.number || '001'}</span>
                    </div>
                  </motion.div>
                )}

                {visualTheme === 'stamp_vintage' && (
                  <motion.div
                    key={`main-stamp-${selectedObservationIndex}`}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex items-center justify-center p-4 bg-radial from-stone-900 to-[#121615]"
                  >
                    <div className="relative w-[240px] h-[270px] bg-[#F7F4EB] rounded-lg p-2.5 shadow-2xl border-4 border-dashed border-[#D4C5A9] flex flex-col justify-between overflow-hidden text-stone-900">
                      <div className="flex items-center justify-between border-b border-[#D4C5A9] pb-1">
                        <span className="text-[8px] font-serif font-black tracking-widest text-[#5C4D3C] uppercase">
                          KOREA BIODIVERSITY
                        </span>
                        <span className="text-[11px] font-mono font-black text-[#A8422B]">
                          ₩800
                        </span>
                      </div>
                      <div className="my-1 flex-1 rounded overflow-hidden border border-[#D4C5A9] bg-stone-950 relative">
                        <img
                          src={currentObsPhoto}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover sepia-[0.15]"
                        />
                      </div>
                      <div className="flex items-end justify-between pt-1 border-t border-[#D4C5A9]">
                        <div>
                          <p className="text-xs font-black text-[#382F24] font-serif truncate max-w-[120px]">
                            {specimen.koreanName}
                          </p>
                        </div>
                        <span className="text-[8px] font-mono font-bold bg-[#E8DEC8] text-[#5C4D3C] px-1 py-0.5 rounded">
                          VERIFIED
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {visualTheme === 'collector_card' && (
                  <motion.div
                    key={`main-card-${selectedObservationIndex}`}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex items-center justify-center p-3 bg-radial from-stone-900 to-black"
                  >
                    <div className="relative w-[240px] h-[270px] rounded-2xl bg-gradient-to-b from-stone-800 via-stone-900 to-stone-950 p-2.5 shadow-2xl border-2 border-amber-400/50 flex flex-col justify-between text-white">
                      <div className="flex items-center justify-between border-b border-amber-400/30 pb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-black text-amber-400">
                            {specimen.number || 'No.001'}
                          </span>
                          <h4 className="text-xs font-black text-white">
                            {specimen.koreanName}
                          </h4>
                        </div>
                        <span className="bg-amber-400 text-stone-950 text-[9px] font-black px-1.5 py-0.2 rounded-md">
                          {photoArtScore.grade}
                        </span>
                      </div>
                      <div className="relative my-1.5 flex-1 rounded-xl overflow-hidden border border-white/10">
                        <img
                          src={currentObsPhoto}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center bg-white/5 p-1 rounded-xl border border-white/10">
                        <div>
                          <span className="text-[7px] text-stone-400 block">포즈</span>
                          <span className="text-[9px] font-mono font-bold text-amber-300">
                            {photoArtScore.pose}
                          </span>
                        </div>
                        <div>
                          <span className="text-[7px] text-stone-400 block">배율</span>
                          <span className="text-[9px] font-mono font-bold text-amber-300">
                            {photoArtScore.zoom}
                          </span>
                        </div>
                        <div>
                          <span className="text-[7px] text-stone-400 block">선명도</span>
                          <span className="text-[9px] font-mono font-bold text-amber-300">
                            {photoArtScore.sharpness}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Left-Aligned Floating Sub Photo Thumbnails - ONLY in 포착점수모드 */}
              {isPhotoSelectedMode && displayObservations && displayObservations.length > 1 && (
                <div
                  className="absolute bottom-3 left-4 z-30 pointer-events-auto flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 shadow-2xl">
                    {displayObservations.map((obs, idx) => {
                      const isSelected = selectedObservationIndex === idx;
                      const isRepPhoto = obs.photoUrl === specimen.originalImage;
                      return (
                        <button
                          key={obs.id || idx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedObservationIndex(idx);
                          }}
                          className={`relative w-10 h-10 rounded-xl overflow-hidden shrink-0 transition-all cursor-pointer shadow-xl border ${
                            isSelected
                              ? 'ring-2 ring-emerald-400 border-white opacity-100 scale-105 shadow-2xl'
                              : 'border-white/30 bg-stone-900/40 opacity-70 hover:opacity-100'
                          }`}
                          title={`관찰 포토 #${idx + 1}${isRepPhoto ? ' (대표 사진)' : ''}`}
                        >
                          <img
                            src={obs.photoUrl || specimen.originalImage || ''}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          {/* Star badge indicator on each thumbnail */}
                          {isRepPhoto ? (
                            <div className="absolute top-0.5 right-0.5 bg-amber-400 text-stone-950 p-0.5 rounded-full shadow-md" title="대표 사진">
                              <Star className="w-2.5 h-2.5 fill-stone-950 stroke-none" />
                            </div>
                          ) : (
                            <div className="absolute top-0.5 right-0.5 bg-black/60 text-stone-300 p-0.5 rounded-full" title="관찰 사진">
                              <Star className="w-2.5 h-2.5 opacity-50" />
                            </div>
                          )}
                        </button>
                      );
                    })}

                    {/* Button to set current selected photo as representative image if not already */}
                    {!isRepresentativeCover ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetAsRepresentativeCover();
                        }}
                        className="ml-1 px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-[11px] font-black shadow-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
                        title="이 사진을 대표 사진으로 지정"
                      >
                        <Star className="w-3.5 h-3.5 fill-stone-950 stroke-none" />
                        <span>대표로 지정</span>
                      </button>
                    ) : (
                      <div className="ml-1 px-2.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black flex items-center gap-1 shrink-0 backdrop-blur-md">
                        <Star className="w-3 h-3 fill-amber-300 stroke-none" />
                        <span>대표 사진</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================
              2. Clean White Sheet Container
              Matches reference design with shared header & mode content
              ======================================================== */}
          <div className="bg-white rounded-t-[32px] -mt-5 relative z-10 shadow-2xl px-5 pt-6 pb-20 space-y-5">
            {/* Top Metadata Section: Always visible across both modes */}
            <div className="space-y-3 pb-3 border-b border-stone-150">
              {/* Scientific Name & Family Row */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-500 font-serif italic text-xs">
                  {specimen.scientificName}
                </span>
                <span className="text-stone-400 font-bold">
                  과: {specimen.family}
                </span>
              </div>

              {/* Korean Name & Mode Stat Badges (직박구리 / 포착 5회 / 89점 / S) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                  {specimen.koreanName}
                </h2>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    포착 {displayObservations.length}회
                  </span>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    {photoArtScore.total}점
                  </span>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-400 text-stone-950 shadow-xs">
                    {photoArtScore.grade}
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================
                [포착 점수 모드] 구도 분석 리포트 (헤더~한줄평까지만)
                ======================================================== */}
            {isPhotoSelectedMode ? (
              <div className="space-y-5 pt-1">
                {/* Header: Score & Grade Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-150">
                  <div>
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">
                      PHOTOGRAPHY COMPOSITION REPORT
                    </span>
                    <h3 className="text-lg font-black text-stone-900 flex items-center gap-2 mt-0.5">
                      <span>구도 분석 리포트</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-black">
                        {photoArtScore.grade}등급 ({photoArtScore.total}점)
                      </span>
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-3xl font-black text-emerald-800">
                      {photoArtScore.total}
                    </span>
                    <span className="text-xs text-stone-400 font-mono font-bold"> / 100</span>
                  </div>
                </div>

                {/* Radar Chart */}
                <div className="flex justify-center my-2">
                  <RadarChart
                    data={[
                      { label: '포즈', value: photoArtScore.pose, fullMark: 20 },
                      { label: '배율', value: photoArtScore.zoom, fullMark: 20 },
                      { label: '시선', value: photoArtScore.gaze, fullMark: 20 },
                      { label: '배경', value: photoArtScore.bg, fullMark: 20 },
                      { label: '선명도', value: photoArtScore.sharpness, fullMark: 20 },
                    ]}
                    size={220}
                    grade={photoArtScore.grade}
                    totalScore={photoArtScore.total}
                  />
                </div>

                {/* 5개 평가 지표 2열 카드 그리드 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-extrabold text-stone-800">
                      <span>📸 포즈 (Pose)</span>
                      <span className="font-mono text-emerald-800 font-black text-xs">
                        {photoArtScore.pose} / 20
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${(photoArtScore.pose / 20) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-extrabold text-stone-800">
                      <span>🔍 배율 (Zoom)</span>
                      <span className="font-mono text-emerald-800 font-black text-xs">
                        {photoArtScore.zoom} / 20
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${(photoArtScore.zoom / 20) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-extrabold text-stone-800">
                      <span>👁️ 시선 (Gaze)</span>
                      <span className="font-mono text-emerald-800 font-black text-xs">
                        {photoArtScore.gaze} / 20
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${(photoArtScore.gaze / 20) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-extrabold text-stone-800">
                      <span>🏞️ 배경 (BG)</span>
                      <span className="font-mono text-emerald-800 font-black text-xs">
                        {photoArtScore.bg} / 20
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${(photoArtScore.bg / 20) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 flex flex-col justify-between col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between text-xs font-extrabold text-stone-800">
                      <span>✨ 선명도 (Clarity)</span>
                      <span className="font-mono text-emerald-800 font-black text-xs">
                        {photoArtScore.sharpness} / 20
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${(photoArtScore.sharpness / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* AI 심사 한줄평 */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-stone-900">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>생태 포토 판정단 한줄평</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-stone-800 leading-relaxed pl-6">
                    "{photoArtScore.appraisalOneLiner.replace('한줄평: ', '')}"
                  </p>
                </div>
              </div>
            ) : (
              /* ========================================================
                  [생태 백과 모드] 태그버튼, 관찰팁, 정보상세 아코디언
                  ======================================================== */
              <div className="space-y-5 pt-1">
                {/* 4 Clean Interactive Tag Buttons (Clickable: 서식구분, 계통분류, 먹이식성, 체구크기) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTagTab(activeTagTab === 'habitat' ? null : 'habitat')}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer active:scale-98 ${
                      activeTagTab === 'habitat'
                        ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-400/50 shadow-xs'
                        : 'bg-stone-50 border-stone-150 hover:bg-stone-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center text-sm font-bold shrink-0">
                      🏠
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-stone-400 font-bold block">서식구분</span>
                      <span className="text-xs font-extrabold text-stone-800 truncate block">#텃새</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTagTab(activeTagTab === 'taxonomy' ? null : 'taxonomy')}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer active:scale-98 ${
                      activeTagTab === 'taxonomy'
                        ? 'bg-emerald-100/90 border-emerald-400 ring-2 ring-emerald-400/50 shadow-xs'
                        : 'bg-stone-50 border-stone-150 hover:bg-stone-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center text-sm font-bold shrink-0">
                      🌱
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-stone-400 font-bold block">계통분류</span>
                      <span className="text-xs font-extrabold text-stone-800 truncate block">#{orderString || '참새목'}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTagTab(activeTagTab === 'diet' ? null : 'diet')}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer active:scale-98 ${
                      activeTagTab === 'diet'
                        ? 'bg-blue-100/90 border-blue-400 ring-2 ring-blue-400/50 shadow-xs'
                        : 'bg-stone-50 border-stone-150 hover:bg-stone-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-800 flex items-center justify-center text-sm font-bold shrink-0">
                      🫐
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-stone-400 font-bold block">먹이식성</span>
                      <span className="text-xs font-extrabold text-stone-800 truncate block">#{specimen.category === 'birds' ? '잡식성' : '자생종'}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTagTab(activeTagTab === 'size' ? null : 'size')}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer active:scale-98 ${
                      activeTagTab === 'size'
                        ? 'bg-purple-100/90 border-purple-400 ring-2 ring-purple-400/50 shadow-xs'
                        : 'bg-stone-50 border-stone-150 hover:bg-stone-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-100/80 text-purple-800 flex items-center justify-center text-sm font-bold shrink-0">
                      📏
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-stone-400 font-bold block">체구크기</span>
                      <span className="text-xs font-extrabold text-stone-800 truncate block">#약 27cm</span>
                    </div>
                  </button>
                </div>

                {/* 태그 버튼 클릭 시 하단에 펼쳐지는 상세 정보 카드 */}
                <AnimatePresence>
                  {activeTagTab && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -6 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -6 }}
                      className="p-4 rounded-2xl bg-stone-900 text-white shadow-xl space-y-3 overflow-hidden border border-stone-800"
                    >
                      {activeTagTab === 'habitat' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                            <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                              🏠 서식 구분 정보 (#텃새)
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveTagTab(null)}
                              className="text-stone-400 hover:text-white p-1 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-medium">
                            한반도 전역의 산림과 도심 공원에서 사계절 내내 흔하게 관찰되는 대표적인 텃새입니다.
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-stone-300 font-mono flex-wrap pt-1">
                            <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700">사계절 국내 상주</span>
                            <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700">전국 도심/산림 분포</span>
                          </div>
                        </div>
                      )}

                      {activeTagTab === 'taxonomy' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                            <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                              🌱 참새목 계통 분류
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveTagTab(null)}
                              className="text-stone-400 hover:text-white p-1 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-1.5 text-xs text-stone-200">
                            <p className="font-extrabold text-emerald-300 text-sm">
                              동물계 척삭동물문 &gt; 조강 참새목
                            </p>
                            <p className="text-stone-300 pl-2.5 border-l-2 border-emerald-500/80 font-bold">
                              {specimen.family || '직박구리과'} &gt; {specimen.genus || '직박구리속'} &gt; {specimen.koreanName}
                            </p>
                          </div>
                        </div>
                      )}

                      {activeTagTab === 'diet' && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                            <span className="text-xs font-black text-blue-400 flex items-center gap-1.5">
                              🫐 잡식성 먹이와 천적
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveTagTab(null)}
                              className="text-stone-400 hover:text-white p-1 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-stone-800/90 border border-stone-700/80">
                              <span className="text-[11px] font-bold text-blue-300 block mb-0.5">🫐 먹이</span>
                              <p className="text-stone-200 font-medium">나무 열매(감·버찌), 꽃꿀(동백·벚꽃), 여름철 곤충, 거미</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-stone-800/90 border border-stone-700/80">
                              <span className="text-[11px] font-bold text-rose-300 block mb-0.5">🦅 천적</span>
                              <p className="text-stone-200 font-medium">새매·황조롱이, 까치·어치·청설모, 길고양이</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTagTab === 'size' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                            <span className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                              📏 크기 및 암수 구별
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveTagTab(null)}
                              className="text-stone-400 hover:text-white p-1 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-2 text-xs text-stone-200">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2 rounded-xl bg-stone-800 border border-stone-700">
                                <span className="text-[10px] text-stone-400 block font-bold">몸길이</span>
                                <span className="text-sm font-black text-purple-300">약 27~28cm</span>
                              </div>
                              <div className="p-2 rounded-xl bg-stone-800 border border-stone-700">
                                <span className="text-[10px] text-stone-400 block font-bold">날개폭</span>
                                <span className="text-sm font-black text-purple-300">약 40cm</span>
                              </div>
                            </div>
                            <p className="text-stone-300 font-bold pt-0.5 leading-relaxed">
                              💡 암수 크기 및 색이 비슷해 외관 구분이 어려워요.
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 관찰 팁 섹션 */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2">
                  <h3 className="text-xs font-black text-stone-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <Info className="w-3.5 h-3.5 text-emerald-800" />
                    <span>생태 현장 관찰 팁</span>
                  </h3>
                  <div className="text-xs text-stone-700 leading-relaxed space-y-1 font-normal">
                    <p>{photoArtScore.framingDetail}</p>
                    <p>{photoArtScore.lightingDetail}</p>
                  </div>
                </div>

                {/* 생태 도감 정보 아코디언 (Species Profile) */}
                <div className="space-y-3 pt-3 border-t border-stone-200/80">
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="text-xs font-black text-stone-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <Info className="w-3.5 h-3.5 text-emerald-800" />
                      <span>생태 정보 상세 (Species Profile)</span>
                    </h3>
                    <span className="text-[10px] text-stone-400 font-bold">
                      항목을 눌러 펼쳐보기
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* 1. 생김새 (Appearance) */}
                    <div className="bg-stone-50 rounded-2xl border border-stone-200/80 overflow-hidden transition-all">
                      <div
                        onClick={() => toggleCategory('appearance')}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-stone-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-8 h-8 rounded-xl bg-white text-stone-800 flex items-center justify-center text-base shrink-0 font-bold border border-stone-200">
                            🎨
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900 text-xs shrink-0">생김새 및 깃털</span>
                              <span className="text-[10px] bg-stone-200/70 text-stone-700 font-bold px-1.5 py-0.2 rounded shrink-0">외형</span>
                            </div>
                            <p className="text-xs text-stone-600 font-normal leading-snug mt-0.5 truncate">
                              {specimen.koreanName === '직박구리'
                                ? '회갈색 몸, 뺨의 밤색 반점, 부스스한 머리깃'
                                : ecoDetail?.keyIdentification || specimen.description || '특징적인 형태와 고유한 색상'}
                            </p>
                          </div>
                        </div>
                        <div className="p-1 text-stone-400 shrink-0">
                          {expandedCategories.appearance ? (
                            <ChevronUp className="w-4 h-4 text-emerald-800" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedCategories.appearance && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4 pt-1.5 border-t border-stone-200/70 bg-white text-stone-700 space-y-3"
                          >
                            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center gap-3">
                              <div className="text-xl p-2 rounded-lg bg-white border border-stone-200/80 shrink-0">🦜</div>
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">KEY VISUAL FEATURE</span>
                                <div className="flex items-center gap-1.5 flex-wrap text-xs font-medium text-stone-800">
                                  <span className="px-2 py-0.5 rounded-md bg-stone-150 border border-stone-200">#부스스한머리깃</span>
                                  <span className="px-2 py-0.5 rounded-md bg-stone-150 border border-stone-200">#회갈색깃털</span>
                                  <span className="px-2 py-0.5 rounded-md bg-stone-150 border border-stone-200">#밤색뺨반점</span>
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-stone-800 leading-relaxed font-normal">
                              {specimen.koreanName === '직박구리'
                                ? '몸길이는 약 27~28cm이며 날개폭은 약 40cm입니다. 전체적으로 회갈색 깃털을 지니며, 귀 주변과 뺨에 선명한 밤색(적갈색) 반점이 있어 다른 조류와 쉽게 구별됩니다. 머리 꼭대기 깃은 왕관처럼 뾰족하게 일어섭니다.'
                                : ecoDetail?.keyIdentification || `${specimen.koreanName}의 고유한 외형 특징과 색상 패턴입니다.`}
                            </p>

                            <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200/60 text-xs text-emerald-950 flex items-center gap-2 font-medium">
                              <Compass className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span><strong>관찰 팁:</strong> 나뭇가지 끝에 앉았을 때 부스스한 머리깃과 뺨의 밤색 깃털을 확인하세요!</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* 2. 생태 및 식성 (Ecology) */}
                    <div className="bg-stone-50 rounded-2xl border border-stone-200/80 overflow-hidden transition-all">
                      <div
                        onClick={() => toggleCategory('ecology')}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-stone-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-8 h-8 rounded-xl bg-white text-stone-800 flex items-center justify-center text-base shrink-0 font-bold border border-stone-200">
                            🍃
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900 text-xs shrink-0">생태 및 먹이 습성</span>
                              <span className="text-[10px] bg-stone-200/70 text-stone-700 font-bold px-1.5 py-0.2 rounded shrink-0">식성</span>
                            </div>
                            <p className="text-xs text-stone-600 font-normal leading-snug mt-0.5 truncate">
                              {specimen.koreanName === '직박구리'
                                ? '여러 마리가 무리지어 이동하는 잡식성 텃새'
                                : ecoDetail?.dietAndBehavior || '계절에 맞춰 번식과 먹이 활동을 이어가는 생태종'}
                            </p>
                          </div>
                        </div>
                        <div className="p-1 text-stone-400 shrink-0">
                          {expandedCategories.ecology ? (
                            <ChevronUp className="w-4 h-4 text-emerald-800" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedCategories.ecology && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4 pt-1.5 border-t border-stone-200/70 bg-white text-stone-700 space-y-3"
                          >
                            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center gap-3">
                              <div className="text-xl p-2 rounded-lg bg-white border border-stone-200/80 shrink-0">🫐</div>
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">DIET & HABITAT TYPE</span>
                                <div className="flex items-center gap-1.5 flex-wrap text-xs font-medium text-stone-800">
                                  <span className="px-2 py-0.5 rounded-md bg-stone-150 border border-stone-200">🌾 잡식성</span>
                                  <span className="px-2 py-0.5 rounded-md bg-stone-150 border border-stone-200">🌸 벚꽃꿀·곤충</span>
                                  <span className="px-2 py-0.5 rounded-md bg-stone-150 border border-stone-200">🫐 감·버찌</span>
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-stone-800 leading-relaxed font-normal">
                              {specimen.koreanName === '직박구리'
                                ? '봄철에는 벚꽃이나 동백꽃의 꿀을 찾아 수분을 돕고, 여름철에는 매미, 나방, 딱정벌레, 거미 등 곤충류를 포식하며, 가을과 겨울에는 감, 버찌, 쥐똥나무 열매를 주로 먹습니다.'
                                : ecoDetail?.dietAndBehavior || `${specimen.koreanName}의 생태 및 먹이 습성에 관한 정보입니다.`}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* 3. 울음소리 (Call) */}
                    <div className="bg-stone-50 rounded-2xl border border-stone-200/80 overflow-hidden transition-all">
                      <div
                        onClick={() => toggleCategory('call')}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-stone-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-8 h-8 rounded-xl bg-white text-stone-800 flex items-center justify-center text-base shrink-0 font-bold border border-stone-200">
                            🎵
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900 text-xs shrink-0">울음소리 및 신호</span>
                              <span className="text-[10px] bg-stone-200/70 text-stone-700 font-bold px-1.5 py-0.2 rounded shrink-0">소리</span>
                            </div>
                            <p className="text-xs text-stone-600 font-normal leading-snug mt-0.5 truncate">
                              {specimen.koreanName === '직박구리'
                                ? "'찌비-, 피비-' 크고 날카로운 금속성 울음소리"
                                : ecoDetail?.callOrSound || '고유한 신호음과 소리 특성'}
                            </p>
                          </div>
                        </div>
                        <div className="p-1 text-stone-400 shrink-0">
                          {expandedCategories.call ? (
                            <ChevronUp className="w-4 h-4 text-emerald-800" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedCategories.call && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4 pt-1.5 border-t border-stone-200/70 bg-white text-stone-700 space-y-3"
                          >
                            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center gap-3">
                              <div className="text-xl p-2 rounded-lg bg-white border border-stone-200/80 shrink-0">🔊</div>
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">VOCALIZATION</span>
                                <div className="flex items-center gap-1.5 flex-wrap text-xs font-medium text-stone-800">
                                  <span className="px-2 py-0.5 rounded-md bg-stone-150 border border-stone-200">📢 '찌비-, 피비-'</span>
                                  <span className="px-2 py-0.5 rounded-md bg-stone-150 border border-stone-200">⚡ 금속성 고음</span>
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-stone-800 leading-relaxed font-normal">
                              {specimen.koreanName === '직박구리'
                                ? "도심이나 숲속에서 매우 크고 날카롭게 '찌비-, 피비-' 하는 소리를 냅니다. 번식기나 무리를 지어 움직일 때 시끄러울 정도로 울어대는 특성이 있습니다."
                                : ecoDetail?.callOrSound || `${specimen.koreanName}의 울음소리와 관련 정보입니다.`}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* 4. 서식지 및 분포 (Habitat) */}
                    <div className="bg-stone-50 rounded-2xl border border-stone-200/80 overflow-hidden transition-all">
                      <div
                        onClick={() => toggleCategory('habitat')}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-stone-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-8 h-8 rounded-xl bg-white text-stone-800 flex items-center justify-center text-base shrink-0 font-bold border border-stone-200">
                            🌲
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900 text-xs shrink-0">서식지 및 분포</span>
                              <span className="text-[10px] bg-stone-200/70 text-stone-700 font-bold px-1.5 py-0.2 rounded shrink-0">분포</span>
                            </div>
                            <p className="text-xs text-stone-600 font-normal leading-snug mt-0.5 truncate">
                              {specimen.koreanName === '직박구리'
                                ? '산림 · 공원 · 도심 가로수 (전국 분포)'
                                : habitatRangeText}
                            </p>
                          </div>
                        </div>
                        <div className="p-1 text-stone-400 shrink-0">
                          {expandedCategories.habitat ? (
                            <ChevronUp className="w-4 h-4 text-emerald-800" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedCategories.habitat && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4 pt-1.5 border-t border-stone-200/70 bg-white text-stone-700 space-y-3"
                          >
                            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center gap-3">
                              <div className="text-xl p-2 rounded-lg bg-white border border-stone-200/80 shrink-0">🌲</div>
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">HABITAT ECOSYSTEM</span>
                                <div className="flex items-center gap-1.5 flex-wrap text-xs font-medium text-stone-800">
                                  <span className="px-2 py-0.5 rounded-md bg-stone-150 border border-stone-200">🌲 산림·공원</span>
                                  <span className="px-2 py-0.5 rounded-md bg-stone-150 border border-stone-200">🏡 도심 수목</span>
                                  <span className="px-2 py-0.5 rounded-md bg-stone-150 border border-stone-200">🌳 가로수</span>
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-stone-800 leading-relaxed font-normal">
                              {specimen.koreanName === '직박구리'
                                ? '한반도 전역의 평지와 저산지대, 도시의 근린공원, 학교 화단, 아파트 단지 수목에 이르기까지 나무가 있는 곳이라면 어디서나 사계절 내내 머무는 대표적 텃새입니다.'
                                : habitatRangeText}
                            </p>

                            <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200/60 text-xs text-emerald-950 flex items-center gap-2 font-medium">
                              <Compass className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span><strong>관찰 팁:</strong> 도심 속 열매나무(산수유, 이팝나무, 감나무) 근처를 주목해보세요.</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* 5. 특이사항 및 관찰 포인트 (Fun Fact) */}
                    <div className="bg-stone-50 rounded-2xl border border-stone-200/80 overflow-hidden transition-all">
                      <div
                        onClick={() => toggleCategory('funFact')}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-stone-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-8 h-8 rounded-xl bg-white text-stone-800 flex items-center justify-center text-base shrink-0 font-bold border border-stone-200">
                            💡
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900 text-xs shrink-0">특이사항 및 비행 패턴</span>
                              <span className="text-[10px] bg-stone-200/70 text-stone-700 font-bold px-1.5 py-0.2 rounded shrink-0">포인트</span>
                            </div>
                            <p className="text-xs text-stone-600 font-normal leading-snug mt-0.5 truncate">
                              {specimen.koreanName === '직박구리'
                                ? '도심의 대표적 새, 파도 모양의 파상 비행'
                                : ecoDetail?.callOrSound || '주변 생태계와 긴밀히 상호작용하는 특징'}
                            </p>
                          </div>
                        </div>
                        <div className="p-1 text-stone-400 shrink-0">
                          {expandedCategories.funFact ? (
                            <ChevronUp className="w-4 h-4 text-emerald-800" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedCategories.funFact && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4 pt-1.5 border-t border-stone-200/70 bg-white text-stone-700 space-y-3"
                          >
                            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center gap-3">
                              <div className="text-xl p-2 rounded-lg bg-white border border-stone-200/80 shrink-0">🕊️</div>
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">FLIGHT & BEHAVIOR PATTERN</span>
                                <div className="flex items-center gap-1.5 flex-wrap text-xs font-medium text-stone-800">
                                  <span className="px-2 py-0.5 rounded-md bg-stone-150 border border-stone-200">🌊 파상 비행 (Undulating)</span>
                                  <span className="px-2 py-0.5 rounded-md bg-stone-150 border border-stone-200">🏙️ 도심 적응력 최고</span>
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-stone-800 leading-relaxed font-normal">
                              {specimen.koreanName === '직박구리'
                                ? '도심에서 참새, 까치와 함께 가장 흔하게 마주치는 새입니다. 비행 시 날갯짓을 몇 번 하고 날개를 몸에 붙여 파도 모양(파상 비행)으로 날아가는 독특한 비행 궤적을 관찰할 수 있습니다.'
                                : '현장에서 마주쳤을 때 기억해두면 좋은 핵심 생태 포인트입니다.'}
                            </p>

                            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-950 flex items-center gap-2 font-medium">
                              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                              <span><strong>나만의 가이드 팁:</strong> 물결치듯 오르내리는 파상 비행(Undulating Flight)을 확인하면 바로 직박구리임을 알 수 있어요!</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI 생태학자 대화 배너 */}
            <div
              onClick={() => setIsAiChatOpen(true)}
              className="pt-2 text-center cursor-pointer text-stone-400 hover:text-stone-700 transition-colors"
            >
              <span className="text-xs font-medium tracking-tight">더 궁금한 내용은 AI 생태학자에게 물어보아요 💬</span>
            </div>
          </div>

          {/* Floating AI Naturalist Button */}
          <div className="fixed bottom-4 right-4 z-40">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsAiChatOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-stone-900 hover:bg-emerald-800 text-white shadow-xl border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              title="AI 생태학자에게 질문하기"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">AI 생태학자</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Edit Specimen Modal */}
      {/* Full-Screen Lightbox Zoom Modal (새창으로 크게보기 - X버튼 + 테마/우표 스티커 전환) */}
      <AnimatePresence>
        {isZoomModalOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[120] bg-stone-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none"
          >
            {/* Top Bar: Title & X Close Button */}
            <div className="flex items-center justify-between text-white pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Maximize2 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-black text-white">{specimen.koreanName}</h3>
                  <p className="text-[10px] text-stone-400 font-mono">새창 크게보기 모드 · 관찰사진 #{selectedObservationIndex + 1}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                title="닫기"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Middle Canvas Stage: Enlarged Image Frame with Theme Applied */}
            <div className="flex-1 flex items-center justify-center my-3 overflow-hidden relative">
              <div className="w-full max-w-sm sm:max-w-md aspect-square bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center relative">
                {visualTheme === 'photo' && (
                  <img
                    src={currentObsPhoto}
                    alt={specimen.koreanName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                )}

                {visualTheme === 'sticker_classic' && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-radial from-stone-800 to-stone-950 relative">
                    <img
                      src={currentStickerPhoto}
                      alt={`${specimen.koreanName} 스티커`}
                      referrerPolicy="no-referrer"
                      className="max-w-[85%] max-h-[85%] object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)]"
                      style={{
                        filter:
                          'drop-shadow(3px 3px 0 #ffffff) drop-shadow(-3px -3px 0 #ffffff) drop-shadow(3px -3px 0 #ffffff) drop-shadow(-3px 3px 0 #ffffff)',
                      }}
                    />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/95 text-stone-900 rounded-full text-xs font-black font-mono shadow-xl flex items-center gap-1.5 border border-stone-200">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>생태 스티커 No.{specimen.number || '001'}</span>
                    </div>
                  </div>
                )}

                {visualTheme === 'stamp_vintage' && (
                  <div className="w-full h-full flex items-center justify-center p-4 bg-radial from-stone-900 to-[#121615]">
                    <div className="relative w-[260px] h-[290px] bg-[#F7F4EB] rounded-lg p-3 shadow-2xl border-4 border-dashed border-[#D4C5A9] flex flex-col justify-between overflow-hidden text-stone-900">
                      <div className="flex items-center justify-between border-b border-[#D4C5A9] pb-1">
                        <span className="text-[9px] font-serif font-black tracking-widest text-[#5C4D3C] uppercase">
                          KOREA BIODIVERSITY
                        </span>
                        <span className="text-xs font-mono font-black text-[#A8422B]">
                          ₩800
                        </span>
                      </div>
                      <div className="my-1 flex-1 rounded overflow-hidden border border-[#D4C5A9] bg-stone-950 relative">
                        <img
                          src={currentObsPhoto}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover sepia-[0.15]"
                        />
                      </div>
                      <div className="flex items-end justify-between pt-1 border-t border-[#D4C5A9]">
                        <div>
                          <p className="text-xs font-black text-[#382F24] font-serif truncate">
                            {specimen.koreanName}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-[#E8DEC8] text-[#5C4D3C] px-1.5 py-0.5 rounded">
                          VERIFIED
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {visualTheme === 'collector_card' && (
                  <div className="w-full h-full flex items-center justify-center p-4 bg-radial from-stone-900 to-black">
                    <div className="relative w-[260px] h-[290px] rounded-2xl bg-gradient-to-b from-stone-800 via-stone-900 to-stone-950 p-3 shadow-2xl border-2 border-amber-400/50 flex flex-col justify-between text-white">
                      <div className="flex items-center justify-between border-b border-amber-400/30 pb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-black text-amber-400">
                            {specimen.number || 'No.001'}
                          </span>
                          <h4 className="text-xs font-black text-white">
                            {specimen.koreanName}
                          </h4>
                        </div>
                        <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                          {photoArtScore.grade}
                        </span>
                      </div>
                      <div className="relative my-1.5 flex-1 rounded-xl overflow-hidden border border-white/10">
                        <img
                          src={currentObsPhoto}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center bg-white/5 p-1.5 rounded-xl border border-white/10">
                        <div>
                          <span className="text-[8px] text-stone-400 block">포즈</span>
                          <span className="text-[10px] font-mono font-bold text-amber-300">
                            {photoArtScore.pose}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-stone-400 block">배율</span>
                          <span className="text-[10px] font-mono font-bold text-amber-300">
                            {photoArtScore.zoom}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-stone-400 block">선명도</span>
                          <span className="text-[10px] font-mono font-bold text-amber-300">
                            {photoArtScore.sharpness}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Theme Control Bar in Lightbox */}
            <div className="space-y-2.5 bg-stone-900/90 backdrop-blur-md p-3 rounded-2xl border border-white/15">
              <p className="text-[11px] text-stone-300 font-bold text-center">
                🎨 스티커 · 빈티지 우표 · 컬렉터 카드 테마 선택
              </p>
              <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-none py-0.5">
                {visualThemesList.map((item) => {
                  const isActive = visualTheme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVisualTheme(item.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap ${
                        isActive
                          ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300 shadow-lg'
                          : 'bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700'
                      }`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isEditModalOpen && onUpdateSpecimen && (
        <EditSpecimenModal
          specimen={specimen}
          activeObsIndex={selectedObservationIndex}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(updated) => {
            onUpdateSpecimen(updated);
            setIsEditModalOpen(false);
          }}
        />
      )}

      {/* AI Chatbot Modal */}
      {isAiChatOpen && (
        <AiChatbotModal
          specimen={specimen}
          currentPersona={currentPersona}
          onClose={() => setIsAiChatOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[110] bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl space-y-5 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#202424]">
                기록을 삭제하시겠습니까?
              </h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                삭제된 관찰 기록은 설정의 휴지통으로 이동되며 30일 후 영구 삭제됩니다.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteSpecimen) {
                    setIsDeleteConfirmOpen(false);
                    onDeleteSpecimen(specimen.id);
                    onClose();
                  }
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-bold transition-colors shadow-md cursor-pointer"
              >
                삭제하기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
