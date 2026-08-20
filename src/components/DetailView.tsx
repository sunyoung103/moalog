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

  // Active Observation record
  const activeObs =
    specimen.observations[selectedObservationIndex] ||
    specimen.observations[0] || {
      id: 'default-obs',
      date: '2026.08.17',
      time: '14:30',
      location: specimen.locationCoord?.name || '서울숲 생태원',
      weather: '☀️ 맑음',
      temperature: '24°C',
      photoUrl: specimen.originalImage || specimen.stickerImage || '',
      memo: '자연 서식지에서 포착된 개체입니다.',
    };

  const totalPhotosCount = specimen.observations?.length || 1;

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

  return (
    <>
      <div
        id="specimen-detail-overlay"
        className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-end justify-center select-none"
        onClick={onClose}
      >
        <motion.div
          id={`specimen-detail-${specimen.id}`}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-stone-50 text-stone-900 rounded-t-3xl shadow-2xl h-[95vh] max-h-[95vh] flex flex-col overflow-hidden"
        >
          {/* Top Pull Down Drag Handle Bar */}
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center cursor-pointer p-1"
            onClick={onClose}
          >
            <div className="w-10 h-1.5 bg-stone-300 rounded-full shadow-xs" />
          </div>

          {/* ========================================================
              1. Persistent Top Header ( [ 식별 결과 | 포착 점수 ] 탭 전환)
              ======================================================== */}
          <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between shrink-0 shadow-2xs border-b border-stone-200/80">
            {/* 좌측: [ 식별 결과 | 포착 점수 ] 세그먼트 탭 */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-full border border-stone-200/80 shrink-0 select-none">
              <button
                type="button"
                onClick={() => setIsPhotoSelectedMode(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  !isPhotoSelectedMode
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${!isPhotoSelectedMode ? 'text-emerald-400' : 'text-stone-400'}`} />
                <span>식별 결과</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPhotoSelectedMode(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isPhotoSelectedMode
                    ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <Trophy className={`w-3.5 h-3.5 ${isPhotoSelectedMode ? 'text-stone-950' : 'text-amber-500'}`} />
                <span>포착 점수</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-black ${
                    isPhotoSelectedMode
                      ? 'bg-black/20 text-stone-950'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {photoArtScore.total}점
                </span>
              </button>
            </div>

            {/* 우측 액션: 정보 수정 & 닫기 */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onUpdateSpecimen && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all active:scale-95 cursor-pointer"
                  title="표본 정보 수정"
                >
                  <Edit3 className="w-4 h-4 text-stone-600" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors active:scale-95 cursor-pointer"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Toast: Cover Set Feedback */}
          <AnimatePresence>
            {showCoverSetToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-amber-300 px-4 py-2 rounded-2xl shadow-2xl border border-amber-400/40 text-xs font-bold flex items-center gap-2"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>이 사진이 도감 대표 사진으로 지정되었습니다!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================
              2. Scrollable Body Content
              ======================================================== */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto pb-28 space-y-4 scrollbar-none"
          >
            {/* ========================================================
                ✦ 1. Clean Photo Stage (노이즈 없이 깔끔한 원본 사진)
                - 사진 좌측 하단: 대표사진인 사진 하나 작게 표시
                - 사진 우측 하단: 사진으로 된 인디케이터 (각 관찰사진 썸네일 스트립)
                - LIVE 버튼: 별개의 단독 버튼
                - 사진 터치 시: 같은 화면 내에서 테마(관찰원본, 스티커, 우표, 카드) & 구도분석/한줄평 화면으로 전환
                ======================================================== */}
            <div className="relative w-full bg-stone-50 overflow-hidden select-none">
              {/* 1:1 Aspect Ratio Visual Frame */}
              <div
                onClick={() => setIsPhotoSelectedMode(!isPhotoSelectedMode)}
                className="relative w-full aspect-square max-h-[380px] sm:max-h-[460px] flex items-center justify-center cursor-pointer overflow-hidden group"
              >
                {/* Visual Theme Rendering */}
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

                      {/* 사진 선택 모드일 때 구도 3분할선 표시 */}
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
                        className="max-w-[76%] max-h-[76%] object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.6)]"
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
                      <div className="relative w-[240px] h-[280px] rounded-2xl bg-gradient-to-b from-stone-800 via-stone-900 to-stone-950 p-2.5 shadow-2xl border-2 border-amber-400/50 flex flex-col justify-between text-white">
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

                {/* 사진 클릭 시 등장하는 하단 컨트롤 바 (좌측=대표사진 썸네일, 우측=다른 이미지 썸네일 스트립) */}
                <AnimatePresence>
                  {isPhotoSelectedMode && specimen.observations && specimen.observations.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* [좌측] 대표 사진 썸네일 (텍스트 없음, 별 뱃지만 작게 표시) */}
                      <div className="pointer-events-auto flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-md">
                        <button
                          type="button"
                          onClick={() => {
                            const repIdx = specimen.observations.findIndex(
                              (o) => o.photoUrl === specimen.originalImage
                            );
                            if (repIdx >= 0) setSelectedObservationIndex(repIdx);
                          }}
                          className={`relative w-8 h-8 rounded-lg overflow-hidden shrink-0 transition-all cursor-pointer ${
                            isRepresentativeCover
                              ? 'ring-2 ring-amber-400 opacity-100 scale-105 shadow-xs'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          title="대표 사진"
                        >
                          <img
                            src={specimen.originalImage || currentObsPhoto}
                            alt="대표 사진"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-0.5 left-0.5 bg-black/70 rounded-full p-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          </div>
                        </button>
                        {!isRepresentativeCover && (
                          <button
                            type="button"
                            onClick={handleSetAsRepresentativeCover}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-amber-400/20 text-stone-300 hover:text-amber-300 transition-colors cursor-pointer"
                            title="현재 사진을 대표 사진으로 설정"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* [우측] 다른 관찰 이미지들 썸네일 (4장 이상일 때 좌/우 < > 버튼) */}
                      <div className="pointer-events-auto flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-md max-w-[65%]">
                        {specimen.observations.length > 3 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (obsScrollRef.current) {
                                obsScrollRef.current.scrollBy({ left: -60, behavior: 'smooth' });
                              }
                            }}
                            className="w-5 h-7 rounded bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                            title="이전 사진 보기"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div
                          ref={obsScrollRef}
                          className="flex items-center gap-1.5 overflow-x-auto scrollbar-none scroll-smooth px-0.5"
                        >
                          {specimen.observations.map((obs, idx) => {
                            const isSelected = selectedObservationIndex === idx;
                            return (
                              <button
                                key={obs.id || idx}
                                type="button"
                                onClick={() => setSelectedObservationIndex(idx)}
                                className={`relative w-8 h-8 rounded-lg overflow-hidden shrink-0 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'ring-2 ring-emerald-400 opacity-100 scale-105 shadow-xs'
                                    : 'opacity-50 hover:opacity-90'
                                }`}
                                title={`관찰 사진 ${idx + 1}`}
                              >
                                <img
                                  src={obs.photoUrl || specimen.originalImage || ''}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            );
                          })}
                        </div>

                        {specimen.observations.length > 3 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (obsScrollRef.current) {
                                obsScrollRef.current.scrollBy({ left: 60, behavior: 'smooth' });
                              }
                            }}
                            className="w-5 h-7 rounded bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                            title="다음 사진 보기"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 사진 우측 상단: 사진 클릭 시 크게보기(새 창) 버튼 표시 */}
                <AnimatePresence>
                  {isPhotoSelectedMode && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute top-2.5 right-2.5 z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={currentObsPhoto}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/65 hover:bg-black/85 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-md transition-all active:scale-95 cursor-pointer"
                        title="새 창에서 원본 사진 크게 보기"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                        <span>크게보기</span>
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 사진 클릭 시 등장하는 에디션 테마 선택 탭바 (인플레이스) */}
              <AnimatePresence>
                {isPhotoSelectedMode && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-3 py-2 bg-stone-900 border-t border-stone-800 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none"
                  >
                    <span className="text-[10px] font-bold text-amber-300 shrink-0 mr-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </span>
                    <div className="flex items-center gap-1.5">
                      {visualThemesList.map((item) => {
                        const isActive = visualTheme === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setVisualTheme(item.id)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer active:scale-95 ${
                              isActive
                                ? 'bg-amber-400 text-stone-950 shadow-sm font-black'
                                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                            }`}
                          >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ========================================================
                ✦ 2. 본문 컨텐츠 영역 ✦
                - 사진 클릭 시: 구도분석과 한줄평 내용으로 교체
                - 사진 클릭 안 했을 때: 종 정보 요약, 관찰 팁 및 상단 버튼별 간략 정보
                ======================================================== */}
            <div className="px-4 space-y-4">
              {/* ✦ 상단: 타이틀 및 핵심 태그 버튼들 ✦ */}
              <div className="flex flex-col gap-2 pt-1">
                {/* 생물 이름 및 학명 */}
                <div className="space-y-0.5">
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                    {specimen.koreanName}
                  </h2>
                  <p className="text-xs text-stone-500 font-serif italic">
                    {specimen.scientificName}
                  </p>
                </div>

                {/* 핵심 태그 버튼들 (직박구리 타이틀 바로 아래 위치) */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-xs font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 shrink-0">
                    {specimen.category === 'birds'
                      ? '새'
                      : specimen.category === 'plants'
                      ? '식물'
                      : specimen.category === 'insects'
                      ? '곤충'
                      : '포유류'}
                  </span>

                  {/* 텃새 버튼 */}
                  <button
                    type="button"
                    onClick={() => setActiveTagTab(activeTagTab === 'habitat' ? null : 'habitat')}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 ${
                      activeTagTab === 'habitat'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    텃새
                  </button>

                  {/* 참새목 버튼 */}
                  <button
                    type="button"
                    onClick={() => setActiveTagTab(activeTagTab === 'taxonomy' ? null : 'taxonomy')}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 ${
                      activeTagTab === 'taxonomy'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {orderString || '참새목'}
                  </button>

                  {/* 잡식성 버튼 */}
                  <button
                    type="button"
                    onClick={() => setActiveTagTab(activeTagTab === 'diet' ? null : 'diet')}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 ${
                      activeTagTab === 'diet'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {specimen.category === 'birds' ? '잡식성' : '자생종'}
                  </button>

                  {/* 27cm 버튼 */}
                  <button
                    type="button"
                    onClick={() => setActiveTagTab(activeTagTab === 'size' ? null : 'size')}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 ${
                      activeTagTab === 'size'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    27cm
                  </button>
                </div>
              </div>

              {/* ✦ 상단 태그 버튼(텃새/참새목/잡식성/27cm) 눌렀을 때 하단에 간략하게 뜨는 정보 카드 ✦ */}
              <AnimatePresence>
                {activeTagTab && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4 bg-stone-50 rounded-3xl border border-stone-200 shadow-sm space-y-2.5"
                  >
                    {activeTagTab === 'habitat' && (
                      <div>
                        <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                          <h4 className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-stone-500" />
                            <span>1 텃새 관찰 정보</span>
                          </h4>
                          <span className="text-[10px] bg-stone-200 text-stone-700 font-bold px-2 py-0.5 rounded-full">
                            관심대상(LC)
                          </span>
                        </div>
                        <div className="space-y-1.5 pt-2 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-stone-500 shrink-0 w-12">시기</span>
                            <span className="text-stone-700 font-medium">연중 관찰가능 (사계절 국내 상주)</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-stone-500 shrink-0 w-12">분포</span>
                            <span className="text-stone-700 font-medium">전국 도심 ~ 산림 어디서나</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-stone-500 shrink-0 w-12">개체수</span>
                            <span className="text-stone-700 font-medium">매우 흔함 관심대상(LC)</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTagTab === 'taxonomy' && (
                      <div>
                        <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                          <h4 className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-stone-500" />
                            <span>2 {orderString || '참새목'} 분류 정보</span>
                          </h4>
                          <span className="text-[10px] bg-stone-200 text-stone-700 font-bold px-2 py-0.5 rounded-full">
                            {specimen.family}
                          </span>
                        </div>
                        <div className="space-y-1.5 pt-2 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-stone-500 shrink-0 w-12">계통</span>
                            <span className="text-stone-700 font-medium">동물계 &gt; 척삭동물문 &gt; 조강 &gt; {orderString || '참새목'}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-stone-500 shrink-0 w-12">특징</span>
                            <span className="text-stone-700 font-medium">나뭇가지를 쥐기에 알맞은 발가락 구조와 발달된 명관을 지님</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTagTab === 'diet' && (
                      <div>
                        <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                          <h4 className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>3 잡식성 먹이 및 행동</span>
                          </h4>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                            잡식성
                          </span>
                        </div>
                        <div className="space-y-1.5 pt-2 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-stone-500 shrink-0 w-12">먹이</span>
                            <span className="text-stone-700 font-medium">봄·여름 곤충과 꽃꿀, 가을·겨울 감·버찌 등 식물 열매</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-stone-500 shrink-0 w-12">천적</span>
                            <span className="text-stone-700 font-medium">새매, 황조롱이, 길고양이, 까치</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTagTab === 'size' && (
                      <div>
                        <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                          <h4 className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-stone-500" />
                            <span>4 크기 및 외형 제원</span>
                          </h4>
                          <span className="text-[10px] bg-stone-200 text-stone-700 font-bold px-2 py-0.5 rounded-full">
                            중형 조류
                          </span>
                        </div>
                        <div className="space-y-1.5 pt-2 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-stone-500 shrink-0 w-12">몸길이</span>
                            <span className="text-stone-700 font-medium">약 27~28cm (날개폭 약 40cm)</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-stone-500 shrink-0 w-12">구분</span>
                            <span className="text-stone-700 font-medium">암수 크기 및 색상이 비슷하여 외관 구분이 어려움</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ========================================================
                  [분기 1] 사진을 클릭했을 때: 구도분석과 한줄평 모드 (포켓몬 스냅 / 도감 구도 분석)
                  ======================================================== */}
              {isPhotoSelectedMode ? (
                <div className="space-y-5">
                  {/* 구도분석 & 5축 품질 분석 카드 */}
                  <div className="bg-white p-6 rounded-3xl shadow-xs border border-stone-200/80 space-y-5">
                    {/* Header: Score & Grade Badge */}
                    <div className="flex items-center justify-between pb-4 border-b border-stone-150">
                      <div>
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">
                          PHOTOGRAPHY COMPOSITION REPORT
                        </span>
                        <h3 className="text-xl font-black text-stone-900 flex items-center gap-2.5 mt-0.5">
                          <span>구도 분석 리포트</span>
                          <span className="text-xs px-3 py-1 rounded-full bg-stone-900 text-stone-50 font-black tracking-wide">
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

                    {/* 5개 평가 지표 (선명하고 시원한 2열 카드 그리드) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
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

                    {/* AI 심사 한줄평 (깔끔한 뉴트럴 카드) */}
                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-1.5 mt-2">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-stone-900">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>생태 포토 판정단 한줄평</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-stone-800 leading-relaxed pl-6">
                        "{photoArtScore.appraisalOneLiner.replace('한줄평: ', '')}"
                      </p>
                    </div>

                    {/* 대표 사진 지정 토글 버튼 */}
                    {!isRepresentativeCover && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleSetAsRepresentativeCover}
                          className="w-full py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 bg-stone-900 text-white hover:bg-stone-800 shadow-xs"
                        >
                          <span>이 사진을 대표 사진으로 지정</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ========================================================
                   [분기 2] 사진 클릭 안 했을 때 (Default): 생태 도감 종 정보 & 일러스트 아코디언
                   ======================================================== */
                <>
                  {/* ✦ 생태 도감 일러스트 카드 ✦ */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-stone-200/80 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-150">
                      <h3 className="text-xs font-black text-stone-900 flex items-center gap-1.5 uppercase tracking-wide">
                        <Info className="w-3.5 h-3.5 text-emerald-800" />
                        <span>생태 정보 도감 (Species Profile)</span>
                      </h3>
                      <span className="text-[10px] text-stone-500 font-bold">
                        터치하여 상세보기
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {/* 1. 생김새 (Appearance) */}
                      <div className="bg-stone-50 rounded-xl border border-stone-200/80 overflow-hidden transition-all">
                        <div
                          onClick={() => toggleCategory('appearance')}
                          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-stone-100/80 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="w-8 h-8 rounded-xl bg-stone-200/60 text-stone-800 flex items-center justify-center text-base shrink-0 font-bold border border-stone-200/60">
                              🎨
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-900 text-xs shrink-0">생김새 및 깃털</span>
                                <span className="text-[10px] bg-stone-200/70 text-stone-700 font-bold px-1.5 py-0.2 rounded shrink-0">외형</span>
                              </div>
                              <p className="text-xs text-stone-600 font-normal leading-snug mt-0.5">
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
                              {/* 특성 뱃지 */}
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
                      <div className="bg-stone-50 rounded-xl border border-stone-200/80 overflow-hidden transition-all">
                        <div
                          onClick={() => toggleCategory('ecology')}
                          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-stone-100/80 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="w-8 h-8 rounded-xl bg-stone-200/60 text-stone-800 flex items-center justify-center text-base shrink-0 font-bold border border-stone-200/60">
                              🍃
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-900 text-xs shrink-0">생태 및 먹이 습성</span>
                                <span className="text-[10px] bg-stone-200/70 text-stone-700 font-bold px-1.5 py-0.2 rounded shrink-0">식성</span>
                              </div>
                              <p className="text-xs text-stone-600 font-normal leading-snug mt-0.5">
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
                                  ? '봄과 여름에는 벚꽃 꿀과 곤충류(매미, 나방 등)를 포식하며, 가을과 겨울에는 감, 버찌, 피라칸타 열매를 주식으로 삼습니다. 번식기는 5~7월이며 나뭇가지 사이에 밥그릇 모양의 둥지를 짓습니다.'
                                  : dietText}
                              </p>

                              <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200/60 text-xs text-emerald-950 flex items-center gap-2 font-medium">
                                <Compass className="w-4 h-4 text-emerald-700 shrink-0" />
                                <span><strong>관찰 팁:</strong> 봄·여름엔 곤충을, 가을·겨울엔 감·버찌 같은 열매를 즐겨 먹어요!</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* 3. 어원 및 소리 (Etymology) */}
                      <div className="bg-stone-50 rounded-xl border border-stone-200/80 overflow-hidden transition-all">
                        <div
                          onClick={() => toggleCategory('etymology')}
                          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-stone-100/80 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="w-8 h-8 rounded-xl bg-stone-200/60 text-stone-800 flex items-center justify-center text-base shrink-0 font-bold border border-stone-200/60">
                              📜
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-900 text-xs shrink-0">어원 및 울음소리</span>
                                <span className="text-[10px] bg-stone-200/70 text-stone-700 font-bold px-1.5 py-0.2 rounded shrink-0">명칭</span>
                              </div>
                              <p className="text-xs text-stone-600 font-normal leading-snug mt-0.5">
                                {specimen.koreanName === '직박구리'
                                  ? "울음소리 '찌비, 피비'를 흉내 낸 이름에서 유래"
                                  : `${specimen.koreanName}의 국명 및 학명 유래`}
                              </p>
                            </div>
                          </div>
                          <div className="p-1 text-stone-400 shrink-0">
                            {expandedCategories.etymology ? (
                              <ChevronUp className="w-4 h-4 text-emerald-800" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-stone-400" />
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedCategories.etymology && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-4 pb-4 pt-1.5 border-t border-stone-200/70 bg-white text-stone-700 space-y-3"
                            >
                              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center gap-3">
                                <div className="text-xl p-2 rounded-lg bg-white border border-stone-200/80 shrink-0">🔊</div>
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">SOUND & NAME ORIGIN</span>
                                  <div className="flex items-center gap-1.5 flex-wrap text-xs font-medium text-stone-800">
                                    <span className="px-2 py-0.5 rounded-md bg-stone-150 border border-stone-200">🔊 '찌-익, 삐-익' 울음소리</span>
                                    <span className="px-2 py-0.5 rounded-md bg-stone-150 border border-stone-200">Brown-eared Bulbul</span>
                                  </div>
                                </div>
                              </div>

                              <p className="text-xs text-stone-800 leading-relaxed font-normal">
                                {specimen.koreanName === '직박구리'
                                  ? "특유의 거칠고 시끄러운 '찌-익, 삐-익' 울음소리가 의성어화되어 '직박구리'라는 이름을 갖게 되었습니다. 영어명 'Brown-eared Bulbul'은 뺨의 밤색(갈색) 반점을 뜻합니다."
                                  : `${specimen.koreanName}의 고유 생태적 특성이나 소리에서 비롯된 명칭입니다.`}
                              </p>

                              <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200/60 text-xs text-emerald-950 flex items-center gap-2 font-medium">
                                <Compass className="w-4 h-4 text-emerald-700 shrink-0" />
                                <span><strong>관찰 팁:</strong> 시끄러운 울음소리를 따라가면 숲이나 아파트 화단에서도 쉽게 발견할 수 있어요!</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* 4. 서식지 (Habitat) */}
                      <div className="bg-stone-50 rounded-xl border border-stone-200/80 overflow-hidden transition-all">
                        <div
                          onClick={() => toggleCategory('habitat')}
                          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-stone-100/80 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="w-8 h-8 rounded-xl bg-stone-200/60 text-stone-800 flex items-center justify-center text-base shrink-0 font-bold border border-stone-200/60">
                              🏞️
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-900 text-xs shrink-0">서식 환경 및 분포</span>
                                <span className="text-[10px] bg-stone-200/70 text-stone-700 font-bold px-1.5 py-0.2 rounded shrink-0">환경</span>
                              </div>
                              <p className="text-xs text-stone-600 font-normal leading-snug mt-0.5">
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
                      <div className="bg-stone-50 rounded-xl border border-stone-200/80 overflow-hidden transition-all">
                        <div
                          onClick={() => toggleCategory('funFact')}
                          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-stone-100/80 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="w-8 h-8 rounded-xl bg-stone-200/60 text-stone-800 flex items-center justify-center text-base shrink-0 font-bold border border-stone-200/60">
                              💡
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-900 text-xs shrink-0">특이사항 및 비행 패턴</span>
                                <span className="text-[10px] bg-stone-200/70 text-stone-700 font-bold px-1.5 py-0.2 rounded shrink-0">포인트</span>
                              </div>
                              <p className="text-xs text-stone-600 font-normal leading-snug mt-0.5">
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

                  {/* 관찰 팁 섹션 */}
                  <div className="bg-white p-4 rounded-2xl shadow-xs border border-stone-200/80 space-y-2">
                    <h3 className="text-xs font-black text-stone-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <Info className="w-3.5 h-3.5 text-emerald-800" />
                      <span>생태 현장 관찰 팁</span>
                    </h3>
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-xs text-stone-700 leading-relaxed space-y-1.5 font-normal">
                      <p>{photoArtScore.framingDetail}</p>
                      <p>{photoArtScore.lightingDetail}</p>
                    </div>
                  </div>
                </>
              )}

              {/* ✦ 3단계: 대화형 확장 (AI 생태학자 대화 배너) ✦ */}
              <div
                onClick={() => setIsAiChatOpen(true)}
                className="flex items-center justify-center py-4 cursor-pointer text-stone-400 hover:text-stone-600 transition-colors"
              >
                <span className="text-xs font-medium tracking-tight">더 궁금한 내용은 AI 생태학자에게 물어보아요</span>
              </div>
            </div>
          </div>

          {/* ========================================================
              3. Floating AI Naturalist Button
              ======================================================== */}
          <div className="absolute bottom-4 right-4 z-40">
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
        </motion.div>
      </div>

      {/* Edit Specimen Modal */}
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
