import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Specimen, UserStats } from '../types';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Compass,
  Sunrise,
  Sunset,
  Sun,
  Shield,
  Layers,
  Award,
  Flame,
  Camera,
  Activity,
  Heart,
  Smartphone,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Search,
  RotateCcw,
  Plus,
  Filter,
  Crop,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';

export interface ExportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  specimen?: Specimen | null;
  specimens: Specimen[];
  userStats: UserStats;
  initialMode?: 'specimen' | 'summary';
  onShowToast?: (msg: string) => void;
}

export type GalaxyGlassTheme =
  | 'galaxy_frosted' // Samsung One UI signature translucent ice glass
  | 'midnight_aurora' // Galaxy Ultra night aurora dark glass
  | 'eco_health' // Samsung Health emerald green glass
  | 'sunset_amber'; // Golden hour amber sunset glow glass

export type SummaryReportCriteria = 'recent' | 'diversity' | 'rare' | 'custom';

// Parse observation date and time robustly
function parseObservationTimestamp(dateStr?: string, timeStr?: string): number {
  if (!dateStr) return 0;
  const normalizedDate = dateStr.replace(/\./g, '-').trim();
  let hour = 12;
  let minute = 0;
  if (timeStr) {
    const isPM = timeStr.includes('오후') || /pm/i.test(timeStr);
    const isAM = timeStr.includes('오전') || /am/i.test(timeStr);
    const numbers = timeStr.match(/\d+/g);
    if (numbers && numbers.length >= 1) {
      hour = parseInt(numbers[0], 10);
      if (numbers.length >= 2) {
        minute = parseInt(numbers[1], 10);
      }
      if (isPM && hour < 12) hour += 12;
      if (isAM && hour === 12) hour = 0;
    }
  }
  const isoLike = `${normalizedDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  const parsed = Date.parse(isoLike);
  if (!isNaN(parsed)) return parsed;
  const parsedDate = Date.parse(normalizedDate);
  if (!isNaN(parsedDate)) return parsedDate;
  return 0;
}

export function getSpecimenLatestTimestamp(sp: Specimen): number {
  if (!sp.observations || sp.observations.length === 0) return 0;
  let maxTime = 0;
  for (const obs of sp.observations) {
    const t = parseObservationTimestamp(obs.date, obs.time);
    if (t > maxTime) maxTime = t;
  }
  return maxTime;
}

function getSpecimenRarityScore(sp: Specimen): number {
  const eco = SPECIES_ECOLOGY_ENCYCLOPEDIA.find(
    (e) => e.koreanName === sp.koreanName || e.scientificName === sp.scientificName
  );
  const statusStr = (eco?.status || '') + ' ' + (sp.traitChips?.join(' ') || '');
  if (statusStr.includes('멸종위기') || statusStr.includes('천연기념물')) return 100;
  if (statusStr.includes('취약') || statusStr.includes('위기') || statusStr.includes('보호')) return 80;
  if (statusStr.includes('준위협') || statusStr.includes('희귀') || statusStr.includes('NT')) return 60;
  return 40;
}

function getMosaicSpecimens(
  allCollected: Specimen[],
  criteria: SummaryReportCriteria,
  activeSpecimen?: Specimen,
  customIds?: string[]
): Specimen[] {
  if (allCollected.length === 0) {
    return [activeSpecimen].filter(Boolean) as Specimen[];
  }

  // 1. Sort by recency descending (Default basis)
  const byRecency = [...allCollected].sort((a, b) => {
    const tB = getSpecimenLatestTimestamp(b);
    const tA = getSpecimenLatestTimestamp(a);
    if (tB !== tA) return tB - tA;
    return (b.number || '').localeCompare(a.number || '');
  });

  // Mode: Recent (기본: 최근 관찰순)
  if (criteria === 'recent') {
    if (activeSpecimen && activeSpecimen.isCollected && !activeSpecimen.isPending) {
      const rest = byRecency.filter((s) => s.id !== activeSpecimen.id);
      return [activeSpecimen, ...rest].slice(0, 4);
    }
    return byRecency.slice(0, 4);
  }

  // Mode: Diversity (생태 다양성 균형)
  if (criteria === 'diversity') {
    const categories: ('birds' | 'plants' | 'insects')[] = ['birds', 'plants', 'insects'];
    const chosen: Specimen[] = [];
    const usedIds = new Set<string>();

    for (const cat of categories) {
      const found = byRecency.find((s) => s.category === cat && !usedIds.has(s.id));
      if (found) {
        chosen.push(found);
        usedIds.add(found.id);
      }
    }

    const fourth = byRecency.find(
      (s) => !categories.includes(s.category as any) && !usedIds.has(s.id)
    );
    if (fourth) {
      chosen.push(fourth);
      usedIds.add(fourth.id);
    }

    for (const s of byRecency) {
      if (chosen.length >= 4) break;
      if (!usedIds.has(s.id)) {
        chosen.push(s);
        usedIds.add(s.id);
      }
    }
    return chosen.slice(0, 4);
  }

  // Mode: Rare (보호/희귀종 우선)
  if (criteria === 'rare') {
    const byRarity = [...allCollected].sort((a, b) => {
      const scoreDiff = getSpecimenRarityScore(b) - getSpecimenRarityScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return getSpecimenLatestTimestamp(b) - getSpecimenLatestTimestamp(a);
    });
    return byRarity.slice(0, 4);
  }

  // Mode: Custom (직접 선택 4종)
  if (criteria === 'custom' && customIds && customIds.length > 0) {
    const customList: Specimen[] = [];
    for (const id of customIds) {
      const found = allCollected.find((s) => s.id === id);
      if (found && !customList.some((c) => c.id === found.id)) {
        customList.push(found);
      }
    }
    for (const s of byRecency) {
      if (customList.length >= 4) break;
      if (!customList.some((c) => c.id === s.id)) {
        customList.push(s);
      }
    }
    return customList.slice(0, 4);
  }

  return byRecency.slice(0, 4);
}

export const ExportCardModal: React.FC<ExportCardModalProps> = ({
  isOpen,
  onClose,
  specimen,
  specimens = [],
  userStats,
  initialMode = 'specimen',
  onShowToast,
}) => {
  const [activeMode, setActiveMode] = useState<'specimen' | 'summary'>(
    initialMode || (specimen ? 'specimen' : 'summary')
  );
  const [theme, setTheme] = useState<GalaxyGlassTheme>('galaxy_frosted');
  const [photoFitMode, setPhotoFitMode] = useState<'cover' | 'contain'>('cover');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Summary Report 4-Specimen Selection Criteria & Customizer State
  const [summaryCriteria, setSummaryCriteria] = useState<SummaryReportCriteria>('recent');
  const [customSelectedIds, setCustomSelectedIds] = useState<string[]>([]);
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerCategoryFilter, setPickerCategoryFilter] = useState<string>('all');
  const [activeReplaceSlot, setActiveReplaceSlot] = useState<number | null>(null);

  // Hidden canvas for high-resolution PNG rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync mode whenever modal opens or initialMode / specimen changes
  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode || (specimen ? 'specimen' : 'summary'));
      setSummaryCriteria('recent');
      setIsCustomPickerOpen(false);
      setActiveReplaceSlot(null);
    }
  }, [isOpen, initialMode, specimen]);

  const safeSpecimens = useMemo(() => {
    return specimens.filter((s) => s.isCollected && !s.isPending);
  }, [specimens]);

  // Selected specimen or fallback to latest collected specimen
  const activeSpecimen: Specimen | undefined =
    specimen ||
    safeSpecimens[0] ||
    specimens[0];

  // Initialize customSelectedIds when modal opens or safeSpecimens ready
  useEffect(() => {
    if (isOpen) {
      const initial4 = getMosaicSpecimens(safeSpecimens, 'recent', activeSpecimen);
      setCustomSelectedIds(initial4.map((s) => s.id));
    }
  }, [isOpen, safeSpecimens, activeSpecimen]);

  // Computed 4 specimens for summary collage
  const currentMosaicSpecimens = useMemo(() => {
    return getMosaicSpecimens(
      safeSpecimens,
      summaryCriteria,
      activeSpecimen,
      customSelectedIds
    );
  }, [safeSpecimens, summaryCriteria, activeSpecimen, customSelectedIds]);

  // Handle slot or custom specimen selection
  const handleSelectSpecimenForSlot = (sp: Specimen) => {
    setSummaryCriteria('custom');
    if (activeReplaceSlot !== null && activeReplaceSlot >= 0 && activeReplaceSlot < 4) {
      const newIds = [...currentMosaicSpecimens.map((s) => s.id)];
      newIds[activeReplaceSlot] = sp.id;
      setCustomSelectedIds(newIds);
      setActiveReplaceSlot(null);
    } else {
      if (customSelectedIds.includes(sp.id)) {
        if (customSelectedIds.length > 1) {
          setCustomSelectedIds(customSelectedIds.filter((id) => id !== sp.id));
        }
      } else {
        if (customSelectedIds.length < 4) {
          setCustomSelectedIds([...customSelectedIds, sp.id]);
        } else {
          const next = [...customSelectedIds.slice(0, 3), sp.id];
          setCustomSelectedIds(next);
        }
      }
    }
  };

  const criteriaBadgeText =
    summaryCriteria === 'recent'
      ? '최근 관찰순'
      : summaryCriteria === 'diversity'
      ? '생태 다양성'
      : summaryCriteria === 'rare'
      ? '보호·희귀종'
      : '직접 선택 4종';

  if (!isOpen) return null;

  // Active observation details
  const activeObs = activeSpecimen?.observations?.[0] || {
    date: '2026.10.08',
    time: '07:15',
    location: activeSpecimen?.locationCoord?.name || '서울숲 생태숲길',
    weather: '☀️ 맑음',
    temperature: '19°C',
    photoUrl: activeSpecimen?.originalImage || activeSpecimen?.stickerImage || '',
  };

  // Determine Sunrise / Sunset Golden Hour from observation time or tags
  const obsTime = activeObs.time || '14:30';
  const hourMatch = obsTime.match(/(\d{1,2})/);
  const hourNum = hourMatch ? parseInt(hourMatch[1], 10) : 14;
  const isSunriseGolden = hourNum >= 5 && hourNum <= 7;
  const isSunsetGolden = hourNum >= 17 && hourNum <= 19;
  const isNight = hourNum >= 20 || hourNum <= 4;

  const timeSlotLabel = isSunriseGolden
    ? '🌅 일출 골든아워 탐사'
    : isSunsetGolden
    ? '🌇 일몰 골든아워 탐사'
    : isNight
    ? '🌙 나이트 사파리 탐사'
    : '☀️ 주간 생태 관찰';

  // Find encyclopedia data for conservation info
  const ecoData = activeSpecimen
    ? SPECIES_ECOLOGY_ENCYCLOPEDIA.find(
        (e) =>
          e.koreanName === activeSpecimen.koreanName ||
          e.scientificName === activeSpecimen.scientificName
      )
    : undefined;

  const conservationLabel =
    ecoData?.status?.split('•')?.[0]?.trim() ||
    '관심대상 (IUCN LC)';

  // Samsung Health Activity Ring Percentages (0 - 100)
  // Mode-aware scores:
  // In 'specimen' mode:
  // Ring 1 (Green): 생태 다양성 기여도
  // Ring 2 (Cyan): 표본 관찰 충실도 (AI confidence)
  // Ring 3 (Orange): 골든아워/희귀도 보너스
  const specimenBiodiversityScore = Math.min(
    100,
    Math.max(35, Math.round((safeSpecimens.length / 10) * 100))
  );
  const completenessScore = activeSpecimen
    ? Math.min(100, Math.max(70, activeSpecimen.confidence || 95))
    : 85;
  const rarityBonus = isSunriseGolden || isSunsetGolden ? 96 : 82;

  // In 'summary' mode:
  // Ring 1 (Green): 전체 생태 다양성 지수 (수집 종수 목표)
  const summaryBiodiversityScore = Math.min(100, Math.max(40, Math.round((safeSpecimens.length / 12) * 100)));
  // Ring 2 (Cyan): 탐사 연속성 달성률 (연속 일수)
  const streakDays = userStats.streakDays || 5;
  const summaryStreakScore = Math.min(100, Math.max(30, streakDays * 15));
  // Ring 3 (Orange): 탐사 뱃지 마스터리율
  const unlockedBadgesCount = userStats.badges?.length || 6;
  const summaryBadgeScore = Math.min(100, Math.max(25, Math.round((unlockedBadgesCount / 12) * 100)));

  // Pick rings based on active mode
  const currentRings = activeMode === 'specimen'
    ? [
        { r: 52, color: '#10B981', pct: specimenBiodiversityScore, label: '생태 다양성', unit: `${specimenBiodiversityScore}%` },
        { r: 38, color: '#38BDF8', pct: completenessScore, label: '표본 완성도', unit: `${completenessScore}%` },
        { r: 24, color: '#F59E0B', pct: rarityBonus, label: '골든아워/희귀', unit: `${rarityBonus}점` },
      ]
    : [
        { r: 52, color: '#10B981', pct: summaryBiodiversityScore, label: '전체 생태 다양성', unit: `${summaryBiodiversityScore}%` },
        { r: 38, color: '#38BDF8', pct: summaryStreakScore, label: '탐사 연속성 달성', unit: `${streakDays}일 (${summaryStreakScore}%)` },
        { r: 24, color: '#F59E0B', pct: summaryBadgeScore, label: '뱃지 마스터리', unit: `${unlockedBadgesCount}개 (${summaryBadgeScore}%)` },
      ];

  // Overall Explorer Stats
  const totalSpeciesCount = safeSpecimens.length;

  // Theme Styling Properties
  const THEME_STYLES: Record<
    GalaxyGlassTheme,
    {
      name: string;
      cardBg: string;
      cardBorder: string;
      textPrimary: string;
      textSecondary: string;
      accentRing: string;
      pillBg: string;
      photoWindowBg: string;
      badgeColor: string;
    }
  > = {
    galaxy_frosted: {
      name: 'One UI 아이스 글래스',
      cardBg:
        'bg-gradient-to-b from-white/90 via-stone-50/85 to-white/95 backdrop-blur-2xl',
      cardBorder: 'border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.12)]',
      textPrimary: 'text-stone-900',
      textSecondary: 'text-stone-500',
      accentRing: '#10B981',
      pillBg: 'bg-white/80 border border-stone-200/80 shadow-2xs',
      photoWindowBg: 'bg-stone-100/90 border border-stone-200/70',
      badgeColor: 'bg-emerald-500 text-white',
    },
    midnight_aurora: {
      name: '갤럭시 울트라 오로라',
      cardBg:
        'bg-gradient-to-b from-stone-900/95 via-slate-900/90 to-stone-950/95 backdrop-blur-2xl',
      cardBorder: 'border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.45)]',
      textPrimary: 'text-white',
      textSecondary: 'text-stone-400',
      accentRing: '#38BDF8',
      pillBg: 'bg-stone-800/80 border border-white/10 shadow-2xs',
      photoWindowBg: 'bg-stone-950/80 border border-white/10',
      badgeColor: 'bg-cyan-500 text-stone-950 font-black',
    },
    eco_health: {
      name: '삼성 헬스 에메랄드',
      cardBg:
        'bg-gradient-to-b from-emerald-950/90 via-stone-900/90 to-emerald-950/95 backdrop-blur-2xl',
      cardBorder: 'border-emerald-500/30 shadow-[0_25px_60px_rgba(5,150,105,0.25)]',
      textPrimary: 'text-white',
      textSecondary: 'text-emerald-300/80',
      accentRing: '#10B981',
      pillBg: 'bg-emerald-900/50 border border-emerald-500/30 shadow-2xs',
      photoWindowBg: 'bg-stone-950/80 border border-emerald-500/30',
      badgeColor: 'bg-emerald-400 text-stone-950 font-black',
    },
    sunset_amber: {
      name: '골든아워 앰버 글래스',
      cardBg:
        'bg-gradient-to-b from-amber-950/90 via-stone-900/90 to-orange-950/95 backdrop-blur-2xl',
      cardBorder: 'border-amber-500/30 shadow-[0_25px_60px_rgba(245,158,11,0.25)]',
      textPrimary: 'text-white',
      textSecondary: 'text-amber-200/80',
      accentRing: '#F59E0B',
      pillBg: 'bg-amber-950/50 border border-amber-500/30 shadow-2xs',
      photoWindowBg: 'bg-stone-950/80 border border-amber-500/30',
      badgeColor: 'bg-amber-400 text-stone-950 font-black',
    },
  };

  const curStyle = THEME_STYLES[theme];

  // Helper to load image async for canvas drawing
  const loadCanvasImage = (url: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  // Helper to draw cover-cropped image into canvas rectangle
  const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    const imgRatio = img.width / img.height;
    const targetRatio = w / h;
    let sW = img.width;
    let sH = img.height;
    let sX = 0;
    let sY = 0;
    if (imgRatio > targetRatio) {
      sW = img.height * targetRatio;
      sX = (img.width - sW) / 2;
    } else {
      sH = img.width / targetRatio;
      sY = (img.height - sH) / 2;
    }
    ctx.drawImage(img, sX, sY, sW, sH, x, y, w, h);
  };

  // Helper to draw contain (uncropped) image with soft backdrop into canvas rectangle
  const drawImageContain = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    // 1. Draw softly dimmed cover backdrop
    ctx.save();
    ctx.filter = 'blur(16px) brightness(0.6)';
    drawImageCover(ctx, img, x, y, w, h);
    ctx.restore();

    // 2. Draw centered uncropped image with proper aspect ratio
    const imgRatio = img.width / img.height;
    const targetRatio = w / h;
    let dW = w;
    let dH = h;
    let dX = x;
    let dY = y;
    if (imgRatio > targetRatio) {
      dH = w / imgRatio;
      dY = y + (h - dH) / 2;
    } else {
      dW = h * imgRatio;
      dX = x + (w - dW) / 2;
    }
    ctx.drawImage(img, dX, dY, dW, dH);
  };

  // Category emoji helper
  const getCatEmoji = (cat?: string) => {
    if (cat === 'birds') return '🪶';
    if (cat === 'plants') return '🌿';
    if (cat === 'insects') return '🐞';
    if (cat === 'mammals') return '🐾';
    return '🌱';
  };

  // =========================================================================
  // Canvas Export Engine: Renders crisp 2x Retina PNG for Real Save & Share
  // =========================================================================
  const renderCardToCanvas = async (): Promise<string | null> => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const width = 720;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    const isDark = theme !== 'galaxy_frosted';

    // 1. Background Fill with subtle gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (theme === 'galaxy_frosted') {
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(0.5, '#F8FAFC');
      bgGrad.addColorStop(1, '#F1F5F9');
    } else if (theme === 'midnight_aurora') {
      bgGrad.addColorStop(0, '#0F172A');
      bgGrad.addColorStop(0.5, '#1E1B4B');
      bgGrad.addColorStop(1, '#0C0A09');
    } else if (theme === 'eco_health') {
      bgGrad.addColorStop(0, '#022C22');
      bgGrad.addColorStop(0.5, '#064E3B');
      bgGrad.addColorStop(1, '#022C22');
    } else {
      bgGrad.addColorStop(0, '#451A03');
      bgGrad.addColorStop(0.5, '#78350F');
      bgGrad.addColorStop(1, '#1C1917');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Card Glass Container (Rounded Squircle)
    const cardMargin = 40;
    const cardW = width - cardMargin * 2;
    const cardH = height - cardMargin * 2;
    const radius = 36;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 15;

    // Draw Rounded Card
    ctx.beginPath();
    ctx.roundRect(cardMargin, cardMargin, cardW, cardH, radius);
    ctx.fillStyle = isDark ? 'rgba(28, 25, 23, 0.88)' : 'rgba(255, 255, 255, 0.94)';
    ctx.fill();

    // Border
    ctx.lineWidth = 2;
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.85)';
    ctx.stroke();
    ctx.restore();

    // 3. Samsung Health Header Branding
    ctx.save();
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A';
    ctx.fillText('Samsung Health  ✕  EcoLog', cardMargin + 32, cardMargin + 50);

    ctx.font = '16px monospace';
    ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
    const subHeader = activeMode === 'specimen' ? 'SPECIMEN PASSPORT CARD' : 'BIODIVERSITY REPORT';
    ctx.fillText(subHeader, cardMargin + 32, cardMargin + 76);

    // Draw activity heart/ring badge at top right
    ctx.beginPath();
    ctx.roundRect(width - cardMargin - 150, cardMargin + 34, 118, 38, 19);
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(16, 185, 129, 0.12)';
    ctx.fill();
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = isDark ? '#34D399' : '#059669';
    ctx.fillText(activeMode === 'specimen' ? '● 표본 인증됨' : '● 종합 동기화', width - cardMargin - 138, cardMargin + 58);
    ctx.restore();

    // 4. Center Specimen Image OR 2x2 Multi-Specimen Collage Grid
    const photoY = cardMargin + 105;
    const photoH = 390;
    const photoW = cardW - 64;
    const photoX = cardMargin + 32;

    if (activeMode === 'specimen') {
      // -------------------------------------------------------------
      // SPECIMEN MODE: Single Hero Specimen Viewport
      // -------------------------------------------------------------
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoW, photoH, 24);
      ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(241, 245, 249, 0.9)';
      ctx.fill();
      ctx.clip();

      const photoSrc =
        activeObs.photoUrl ||
        activeSpecimen?.stickerImage ||
        activeSpecimen?.originalImage;

      if (photoSrc) {
        try {
          const img = await loadCanvasImage(photoSrc);
          if (img && img.width > 0) {
            if (photoFitMode === 'contain') {
              drawImageContain(ctx, img, photoX, photoY, photoW, photoH);
            } else {
              drawImageCover(ctx, img, photoX, photoY, photoW, photoH);
            }
          }
        } catch (err) {
          console.error('Image draw error:', err);
        }
      }
      ctx.restore();

      // Top-Right Chip on image
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(photoX + photoW - 170, photoY + 16, 154, 32, 16);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
      ctx.fill();
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`AI ${completenessScore}% 일치`, photoX + photoW - 156, photoY + 37);
      ctx.restore();

      // Bottom-Left Chip on image
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(photoX + 16, photoY + photoH - 46, 175, 32, 16);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
      ctx.fill();
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#FCD34D';
      ctx.fillText(timeSlotLabel, photoX + 26, photoY + photoH - 26);
      ctx.restore();

    } else {
      // -------------------------------------------------------------
      // SUMMARY MODE: 2x2 Multi-Specimen Ecological Mosaic Collage
      // -------------------------------------------------------------
      const mosaicSpecimens =
        currentMosaicSpecimens.length > 0
          ? currentMosaicSpecimens
          : ([activeSpecimen].filter(Boolean) as Specimen[]);
      const gap = 8;
      const halfW = (photoW - gap) / 2;
      const halfH = (photoH - gap) / 2;

      const quads = [
        { x: photoX, y: photoY, w: halfW, h: halfH, r: [24, 0, 0, 0] },
        { x: photoX + halfW + gap, y: photoY, w: halfW, h: halfH, r: [0, 24, 0, 0] },
        { x: photoX, y: photoY + halfH + gap, w: halfW, h: halfH, r: [0, 0, 0, 24] },
        { x: photoX + halfW + gap, y: photoY + halfH + gap, w: halfW, h: halfH, r: [0, 0, 24, 0] },
      ];

      for (let i = 0; i < 4; i++) {
        const q = quads[i];
        const sp = mosaicSpecimens[i % mosaicSpecimens.length];
        const pUrl = sp?.observations?.[0]?.photoUrl || sp?.stickerImage || sp?.originalImage;

        ctx.save();
        ctx.beginPath();
        // Rounded sub-quadrant
        ctx.roundRect(q.x, q.y, q.w, q.h, 14);
        ctx.fillStyle = isDark ? '#1C1917' : '#E2E8F0';
        ctx.fill();
        ctx.clip();

        if (pUrl) {
          try {
            const img = await loadCanvasImage(pUrl);
            if (img && img.width > 0) {
              if (photoFitMode === 'contain') {
                drawImageContain(ctx, img, q.x, q.y, q.w, q.h);
              } else {
                drawImageCover(ctx, img, q.x, q.y, q.w, q.h);
              }
            }
          } catch (e) {
            console.error('Mosaic img load error:', e);
          }
        }

        // Mini Slot badge top-left
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(q.x + 8, q.y + 8, 30, 20, 10);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fill();
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#FCD34D';
        ctx.fillText(`#${i + 1}`, q.x + 13, q.y + 22);
        ctx.restore();

        // Bottom gradient scrim & specimen name (clean, non-blocking)
        if (sp) {
          ctx.save();
          const scrimGrad = ctx.createLinearGradient(q.x, q.y + q.h - 45, q.x, q.y + q.h);
          scrimGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          scrimGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
          ctx.fillStyle = scrimGrad;
          ctx.fillRect(q.x, q.y + q.h - 45, q.w, 45);

          ctx.font = 'bold 13px sans-serif';
          ctx.fillStyle = '#FFFFFF';
          const emoji = getCatEmoji(sp.category);
          ctx.fillText(`${emoji} ${sp.koreanName}`, q.x + 10, q.y + q.h - 12);
          ctx.restore();
        }

        ctx.restore();
      }
    }

    // 5. Specimen Names & Classification
    const infoY = photoY + photoH + 45;
    ctx.save();
    ctx.font = 'bold 34px sans-serif';
    ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A';
    const mainTitle =
      activeMode === 'specimen'
        ? activeSpecimen?.koreanName || '생태 표본'
        : '자연 관찰자 종합 생태 리포트';
    ctx.fillText(mainTitle, cardMargin + 32, infoY);

    ctx.font = 'italic 19px serif';
    ctx.fillStyle = isDark ? '#A7F3D0' : '#475569';
    const subTitle =
      activeMode === 'specimen'
        ? activeSpecimen?.scientificName || 'Species Fauna & Flora'
        : `${criteriaBadgeText} 4선 · 총 ${safeSpecimens.length}종 탐사 · ${streakDays}일 연속 달성`;
    ctx.fillText(subTitle, cardMargin + 32, infoY + 30);
    ctx.restore();

    // 6. Samsung Health 3-Color Activity Rings Box
    const ringBoxY = infoY + 55;
    const ringBoxH = 150;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(photoX, ringBoxY, photoW, ringBoxH, 20);
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(241, 245, 249, 0.7)';
    ctx.fill();
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(203, 213, 225, 0.7)';
    ctx.stroke();

    // Draw concentric activity rings on left side
    const centerX = photoX + 80;
    const centerY = ringBoxY + ringBoxH / 2;

    currentRings.forEach(({ r, color, pct }) => {
      // Background track
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
      ctx.lineWidth = 10;
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
      ctx.stroke();

      // Filled progress arc
      const endAngle = -Math.PI / 2 + (pct / 100) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, -Math.PI / 2, endAngle);
      ctx.lineCap = 'round';
      ctx.strokeStyle = color;
      ctx.stroke();
    });

    // Ring Legend Text on right side
    const legX = photoX + 180;
    currentRings.forEach(({ color, label, unit }, idx) => {
      const legY = ringBoxY + 36 + idx * 40;
      // Color Dot
      ctx.beginPath();
      ctx.arc(legX, legY - 5, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Label
      ctx.font = '15px sans-serif';
      ctx.fillStyle = isDark ? '#E2E8F0' : '#475569';
      ctx.fillText(label, legX + 16, legY);

      // Score
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A';
      ctx.fillText(unit, legX + 210, legY);
    });
    ctx.restore();

    // 7. Bottom Squircle Metadata Pills
    const bottomY = ringBoxY + ringBoxH + 35;
    ctx.save();
    ctx.font = '15px sans-serif';
    ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';

    if (activeMode === 'specimen') {
      const locText = `📍 ${activeObs.location} · ${activeObs.date} ${activeObs.time}`;
      ctx.fillText(locText, cardMargin + 32, bottomY);

      const extraText = `${timeSlotLabel}  |  ${conservationLabel}`;
      ctx.fillText(extraText, cardMargin + 32, bottomY + 28);
    } else {
      const birdC = safeSpecimens.filter((s) => s.category === 'birds').length;
      const plantC = safeSpecimens.filter((s) => s.category === 'plants').length;
      const insectC = safeSpecimens.filter((s) => s.category === 'insects').length;
      const otherC = safeSpecimens.length - (birdC + plantC + insectC);

      // Extract top captured tags for export summary card
      const topTagsMap: Record<string, number> = {};
      safeSpecimens.forEach((sp) => {
        const eco = SPECIES_ECOLOGY_ENCYCLOPEDIA.find(
          (e) => e.koreanName === sp.koreanName || e.scientificName === sp.scientificName
        );
        const tags = [...(sp.traitChips || []), ...(eco?.tags || [])];
        tags.forEach((t) => {
          if (!t || t.length < 2 || t.length > 12) return;
          const clean = t.replace(/^#/, '').trim();
          if (['자생종', '생물', '야생', '관찰'].includes(clean)) return;
          topTagsMap[clean] = (topTagsMap[clean] || 0) + 1;
        });
      });
      const top3SummaryTags = Object.entries(topTagsMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([t]) => `#${t}`)
        .join('  ');

      const summaryStats = `📊 조류 ${birdC}종 · 식물 ${plantC}종 · 곤충 ${insectC}종 · 기타 ${otherC}종`;
      ctx.fillText(summaryStats, cardMargin + 32, bottomY);

      const summaryFooter = top3SummaryTags
        ? `🏷️ 주요 태그: ${top3SummaryTags}  |  해금 뱃지 ${unlockedBadgesCount}종`
        : `🏆 해금 뱃지 ${unlockedBadgesCount}종 보유  |  수도권 생태계 탐사 누적 기록`;
      ctx.fillText(summaryFooter, cardMargin + 32, bottomY + 28);
    }
    ctx.restore();

    // 8. Watermark
    ctx.save();
    ctx.font = '13px monospace';
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)';
    ctx.fillText('VERIFIED BY ECOLOG & SAMSUNG HEALTH PLATFORM', cardMargin + 32, height - cardMargin - 20);
    ctx.restore();

    return canvas.toDataURL('image/png');
  };

  // =========================================================================
  // User Actions: Download, Copy, Share
  // =========================================================================
  const handleDownloadImage = async () => {
    setIsDownloading(true);
    try {
      const dataUrl = await renderCardToCanvas();
      if (!dataUrl) return;

      const dateStr = new Date().toISOString().slice(0, 10);
      const link = document.createElement('a');
      link.download =
        activeMode === 'summary'
          ? `EcoReport_종합생태리포트_${dateStr}.png`
          : `EcoCard_${activeSpecimen?.koreanName || 'Specimen'}_${dateStr}.png`;
      link.href = dataUrl;
      link.click();

      confetti({ particleCount: 35, spread: 65, origin: { y: 0.7 } });
      onShowToast?.(
        activeMode === 'summary'
          ? '📊 종합 생태 리포트 카드가 저장되었습니다!'
          : '📸 단일 표본 카드가 저장되었습니다!'
      );
    } catch (err) {
      console.error(err);
      onShowToast?.('카드 다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyCard = async () => {
    setIsCopied(true);
    try {
      const dataUrl = await renderCardToCanvas();
      if (dataUrl) {
        // Attempt Blob clipboard copy
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        if (navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          onShowToast?.('📋 생태 카드 이미지가 클립보드에 복사되었습니다!');
        } else {
          onShowToast?.('📋 생태 카드 데이터가 준비되었습니다!');
        }
      }
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
      onShowToast?.('생태 카드가 복사되었습니다.');
    }
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    try {
      const dataUrl = await renderCardToCanvas();
      if (!dataUrl) return;

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = activeMode === 'summary' ? 'ecoreport.png' : 'ecocard.png';
      const file = new File([blob], fileName, { type: 'image/png' });

      const shareTitle =
        activeMode === 'summary'
          ? '[EcoLog] 자연 관찰자 종합 생태 리포트'
          : `[EcoLog] ${activeSpecimen?.koreanName || '생태 표본 카드'}`;

      const shareText =
        activeMode === 'summary'
          ? `삼성 헬스 연동 종합 생태 리포트: 총 ${safeSpecimens.length}종 수집 완료, ${streakDays}일 연속 탐사 달성!`
          : `삼성 헬스 연동 생태 탐사 카드: ${activeSpecimen?.koreanName} (${activeSpecimen?.scientificName})`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [file],
        });
        onShowToast?.('공유 창이 열렸습니다.');
        return;
      }
      // Fallback: Copy link
      handleCopyCard();
    } catch (err) {
      // User cancelled share or unsupported
      console.log('Share dismissed or fallback:', err);
    }
  };

  return (
    <div
      id="export-card-modal-backdrop"
      className="fixed inset-0 z-[120] bg-stone-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-stone-900 text-stone-100 rounded-t-[32px] sm:rounded-[32px] max-w-sm sm:max-w-3xl lg:max-w-4xl w-full max-h-[94vh] sm:max-h-[90vh] shadow-2xl flex flex-col border border-white/10 overflow-hidden"
      >
        {/* Top Modal Navigation Bar (Sticky/Fixed Header) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0 bg-stone-900/95 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span>삼성 헬스 연동 생태 카드</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Galaxy One UI
                </span>
              </h3>
              <p className="text-[10px] text-stone-400">
                실시간 프리뷰 &amp; 고해상도 리포트 생성기
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body: 2-Column Responsive Layout */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
            {/* Left Column: Settings, Theme & Specimen Selection */}
            <div className="sm:col-span-6 lg:col-span-6 space-y-3">
              {/* Mode Switcher: Single Specimen vs Overall Summary */}
              <div className="flex items-center p-1 rounded-2xl bg-stone-950/80 border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveMode('specimen')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMode === 'specimen'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>단일 표본 카드</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('summary')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMode === 'summary'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>종합 생태 리포트</span>
                </button>
              </div>

              {/* Theme & Photo Fit Controls Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] px-1 text-stone-400 font-bold">
                  <span>컬러 글래스 테마</span>
                  {/* Photo Fit Mode (Cover vs Contain) */}
                  <div className="flex items-center gap-1 bg-stone-950/70 p-0.5 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => setPhotoFitMode('cover')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        photoFitMode === 'cover'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-stone-400 hover:text-white'
                      }`}
                      title="화면 꽉 채우기"
                    >
                      <Crop className="w-2.5 h-2.5" />
                      <span>채우기</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoFitMode('contain')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        photoFitMode === 'contain'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-stone-400 hover:text-white'
                      }`}
                      title="사진 전체보기 (잘림 없음)"
                    >
                      <Maximize2 className="w-2.5 h-2.5" />
                      <span>전체보기</span>
                    </button>
                  </div>
                </div>

                {/* Theme Presets */}
                <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { id: 'galaxy_frosted', label: '아이스 글래스', icon: '❄️' },
                { id: 'midnight_aurora', label: '오로라 나이트', icon: '🌌' },
                { id: 'eco_health', label: '에코 그린', icon: '🌿' },
                { id: 'sunset_amber', label: '골든아워', icon: '🌅' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`py-1.5 px-1 rounded-xl text-[10px] font-bold text-center border transition-all cursor-pointer ${
                  theme === t.id
                    ? 'bg-white text-stone-950 border-white shadow-xs'
                    : 'bg-stone-950/50 text-stone-400 border-white/10 hover:bg-stone-800'
                }`}
              >
                <div className="text-xs mb-0.5">{t.icon}</div>
                <div className="truncate">{t.label}</div>
              </button>
            ))}
          </div>
        </div>

          {/* Summary Mode: 4-Specimen Selection Criteria & Customizer Toolbar */}
          {activeMode === 'summary' && (
            <div className="p-2.5 rounded-2xl bg-stone-950/90 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-black text-white">리포트 표본 4건 선정 기준</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomPickerOpen(!isCustomPickerOpen)}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{isCustomPickerOpen ? '선택창 닫기' : '표본 직접 변경'}</span>
                  {isCustomPickerOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* 4 Preset Option Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  {
                    id: 'recent' as const,
                    label: '최근 관찰순',
                    sub: '최신 기록',
                    icon: '🕒',
                    isRec: true,
                  },
                  {
                    id: 'diversity' as const,
                    label: '다양성 균형',
                    sub: '조류·식물·곤충',
                    icon: '🌿',
                    isRec: false,
                  },
                  {
                    id: 'rare' as const,
                    label: '보호·희귀종',
                    sub: '법정보호·위기',
                    icon: '⭐',
                    isRec: false,
                  },
                  {
                    id: 'custom' as const,
                    label: '직접 4종 선택',
                    sub: '원하는 종',
                    icon: '✏️',
                    isRec: false,
                  },
                ].map((crit) => {
                  const isActive = summaryCriteria === crit.id;
                  return (
                    <button
                      key={crit.id}
                      type="button"
                      onClick={() => {
                        if (crit.id === 'recent') {
                          setSummaryCriteria('recent');
                          const r4 = getMosaicSpecimens(safeSpecimens, 'recent', activeSpecimen);
                          setCustomSelectedIds(r4.map((s) => s.id));
                          setActiveReplaceSlot(null);
                        } else if (crit.id === 'diversity') {
                          setSummaryCriteria('diversity');
                          const d4 = getMosaicSpecimens(safeSpecimens, 'diversity', activeSpecimen);
                          setCustomSelectedIds(d4.map((s) => s.id));
                          setActiveReplaceSlot(null);
                        } else if (crit.id === 'rare') {
                          setSummaryCriteria('rare');
                          const rare4 = getMosaicSpecimens(safeSpecimens, 'rare', activeSpecimen);
                          setCustomSelectedIds(rare4.map((s) => s.id));
                          setActiveReplaceSlot(null);
                        } else {
                          setSummaryCriteria('custom');
                          setIsCustomPickerOpen(true);
                        }
                      }}
                      className={`relative py-1.5 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600/90 text-white border-emerald-400 shadow-xs'
                          : 'bg-stone-900/90 text-stone-300 border-white/10 hover:bg-stone-800'
                      }`}
                    >
                      {crit.isRec && (
                        <span className="absolute -top-1.5 right-1 px-1 py-0.2 bg-amber-400 text-stone-950 text-[8px] font-black rounded-full shadow-2xs">
                          기본
                        </span>
                      )}
                      <div className="text-xs">{crit.icon}</div>
                      <div className="text-[10px] font-bold truncate mt-0.5">{crit.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* Selected 4 Species Mini Pill Strip */}
              <div className="pt-1.5 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[9px] font-mono text-stone-400 shrink-0">선정된 4종:</span>
                {currentMosaicSpecimens.map((sp, idx) => {
                  const isSlotActive = activeReplaceSlot === idx;
                  return (
                    <button
                      key={sp.id || idx}
                      type="button"
                      onClick={() => {
                        setActiveReplaceSlot(isSlotActive ? null : idx);
                        setIsCustomPickerOpen(true);
                        setSummaryCriteria('custom');
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 transition-all border cursor-pointer ${
                        isSlotActive
                          ? 'bg-emerald-500 text-stone-950 border-emerald-300 ring-2 ring-emerald-400/50 scale-105'
                          : 'bg-stone-900 text-stone-200 border-white/10 hover:border-emerald-400/50'
                      }`}
                      title={`#${idx + 1} ${sp.koreanName} (클릭하여 교체)`}
                    >
                      <span className="font-mono text-[9px] text-amber-300">#{idx + 1}</span>
                      <span>{getCatEmoji(sp.category)}</span>
                      <span className="max-w-[70px] truncate">{sp.koreanName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Expandable Custom Specimen Picker Drawer */}
              <AnimatePresence>
                {isCustomPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 border-t border-white/10 space-y-2 overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 text-emerald-300 font-bold">
                        <span>
                          {activeReplaceSlot !== null
                            ? `슬롯 #${activeReplaceSlot + 1}에 넣을 표본을 선택하세요`
                            : '표본을 클릭하여 4종을 자유롭게 변경하세요'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSummaryCriteria('recent');
                          const r4 = getMosaicSpecimens(safeSpecimens, 'recent', activeSpecimen);
                          setCustomSelectedIds(r4.map((s) => s.id));
                          setActiveReplaceSlot(null);
                        }}
                        className="text-[10px] text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>최근순 초기화</span>
                      </button>
                    </div>

                    {/* Category Filter Chips & Search Bar */}
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Search className="w-3 h-3 absolute left-2 top-2 text-stone-400" />
                        <input
                          type="text"
                          value={pickerSearchQuery}
                          onChange={(e) => setPickerSearchQuery(e.target.value)}
                          placeholder="표본 이름 검색..."
                          className="w-full pl-6 pr-2 py-1 rounded-lg bg-stone-900 text-white text-[11px] border border-white/15 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {(
                          [
                            { id: 'all', label: '전체' },
                            { id: 'birds', label: '조류' },
                            { id: 'plants', label: '식물' },
                            { id: 'insects', label: '곤충' },
                            { id: 'others', label: '기타' },
                          ] as const
                        ).map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setPickerCategoryFilter(cat.id)}
                            className={`px-1.5 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                              pickerCategoryFilter === cat.id
                                ? 'bg-emerald-600 text-white border-emerald-400'
                                : 'bg-stone-800 text-stone-300 border-white/10 hover:bg-stone-700'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Collected Specimen Cards List */}
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {safeSpecimens
                        .filter((s) => {
                          if (pickerCategoryFilter !== 'all') {
                            if (pickerCategoryFilter === 'others') {
                              if (['birds', 'plants', 'insects'].includes(s.category)) return false;
                            } else if (s.category !== pickerCategoryFilter) {
                              return false;
                            }
                          }
                          if (pickerSearchQuery.trim()) {
                            const q = pickerSearchQuery.toLowerCase();
                            return (
                              s.koreanName.toLowerCase().includes(q) ||
                              s.scientificName.toLowerCase().includes(q)
                            );
                          }
                          return true;
                        })
                        .map((s) => {
                          const slotIndex = currentMosaicSpecimens.findIndex((m) => m.id === s.id);
                          const isSelected = slotIndex !== -1;
                          const latestObs = s.observations?.[0];
                          const photo = latestObs?.photoUrl || s.stickerImage || s.originalImage;

                          return (
                            <div
                              key={s.id}
                              onClick={() => handleSelectSpecimenForSlot(s)}
                              className={`p-1.5 rounded-xl flex items-center justify-between border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-950/70 border-emerald-500/80 ring-1 ring-emerald-500/40'
                                  : 'bg-stone-900/60 border-white/10 hover:bg-stone-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-stone-800 shrink-0 relative">
                                  {photo ? (
                                    <img
                                      src={photo}
                                      alt={s.koreanName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs">
                                      {getCatEmoji(s.category)}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-bold text-white truncate">
                                      {s.koreanName}
                                    </span>
                                    <span className="text-[9px] font-mono text-stone-400">
                                      {s.number}
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-stone-400 truncate flex items-center gap-1">
                                    <span>{getCatEmoji(s.category)}</span>
                                    <span>{latestObs?.date || '기록됨'}</span>
                                    {latestObs?.time && <span>· {latestObs.time}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 ml-2">
                                {isSelected ? (
                                  <div className="px-2 py-0.5 rounded-full bg-emerald-500 text-stone-950 text-[10px] font-black font-mono shadow-xs flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    <span>#{slotIndex + 1}</span>
                                  </div>
                                ) : (
                                  <div className="px-2 py-0.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold border border-white/10 flex items-center gap-1">
                                    <Plus className="w-3 h-3" />
                                    <span>
                                      {activeReplaceSlot !== null
                                        ? `#${activeReplaceSlot + 1}로 교체`
                                        : '선택'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right Column: Aesthetic Samsung Health Glassmorphism Live Preview Card */}
        <div className="sm:col-span-6 lg:col-span-6 flex flex-col items-center w-full">
          <div
            className={`relative w-full rounded-[28px] p-4 transition-all overflow-hidden border shadow-lg ${curStyle.cardBg} ${curStyle.cardBorder}`}
          >
            {/* Card Top Branding Header */}
            <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black tracking-tight font-sans text-stone-900 dark:text-white">
                  Samsung Health
                </span>
                <span className="text-[10px] font-mono text-stone-400">✕</span>
                <span className="text-[11px] font-black tracking-wider text-emerald-600 dark:text-emerald-400 font-sans">
                  EcoLog
                </span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{activeMode === 'specimen' ? '표본 데이터' : '종합 활동 동기화'}</span>
              </div>
            </div>

            {/* =========================================================
                Photo Viewport: Single Hero vs 2x2 Multi-Specimen Mosaic
                (Supports photoFitMode: cover vs contain with soft backdrop)
                ========================================================= */}
            {activeMode === 'specimen' ? (
              /* Single Specimen Hero Viewport */
              <div
                className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden my-3 shadow-inner flex items-center justify-center ${curStyle.photoWindowBg}`}
              >
                {activeObs.photoUrl ||
                activeSpecimen?.stickerImage ||
                activeSpecimen?.originalImage ? (
                  photoFitMode === 'contain' ? (
                    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                      <img
                        src={
                          activeObs.photoUrl ||
                          activeSpecimen?.stickerImage ||
                          activeSpecimen?.originalImage
                        }
                        alt={activeSpecimen?.koreanName || 'Specimen'}
                        className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-50"
                      />
                      <img
                        src={
                          activeObs.photoUrl ||
                          activeSpecimen?.stickerImage ||
                          activeSpecimen?.originalImage
                        }
                        alt={activeSpecimen?.koreanName || 'Specimen'}
                        referrerPolicy="no-referrer"
                        className="relative z-10 w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <img
                      src={
                        activeObs.photoUrl ||
                        activeSpecimen?.stickerImage ||
                        activeSpecimen?.originalImage
                      }
                      alt={activeSpecimen?.koreanName || 'Specimen'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center"
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-stone-400">
                    <span className="text-4xl">🌿</span>
                    <span className="text-[10px] mt-1 font-mono">SPECIMEN VIEW</span>
                  </div>
                )}

                {/* Top-Right Badge: Category & AI Verified */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-20">
                  <div
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold shadow-xs ${curStyle.badgeColor}`}
                  >
                    {getCatEmoji(activeSpecimen?.category)}{' '}
                    {activeSpecimen?.category === 'birds'
                      ? '조류'
                      : activeSpecimen?.category === 'plants'
                      ? '식물'
                      : activeSpecimen?.category === 'insects'
                      ? '곤충'
                      : '야생'}
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] font-mono border border-white/20">
                    AI {completenessScore}% 일치
                  </div>
                </div>

                {/* Bottom-Left Overlaid Golden Hour Chip */}
                <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 flex items-center gap-1 z-20">
                  <span>{timeSlotLabel}</span>
                </div>
              </div>
            ) : (
              /* Summary Mode: 2x2 Multi-Specimen Ecological Mosaic Collage */
              <div
                className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden my-3 shadow-inner p-1 grid grid-cols-2 grid-rows-2 gap-1.5 ${curStyle.photoWindowBg}`}
              >
                {currentMosaicSpecimens.map((sp, idx) => {
                  const imgUrl = sp.observations?.[0]?.photoUrl || sp.stickerImage || sp.originalImage;
                  const isSlotTarget = activeReplaceSlot === idx;
                  return (
                    <div
                      key={sp.id || idx}
                      onClick={() => {
                        setActiveReplaceSlot(idx);
                        setIsCustomPickerOpen(true);
                        setSummaryCriteria('custom');
                      }}
                      className={`relative w-full h-full rounded-xl overflow-hidden bg-stone-900/60 shadow-xs cursor-pointer group transition-all ${
                        isSlotTarget
                          ? 'ring-2 ring-emerald-400 scale-[0.98]'
                          : 'hover:brightness-110 active:scale-95'
                      }`}
                      title={`슬롯 #${idx + 1} (${sp.koreanName}) - 클릭하여 교체`}
                    >
                      {imgUrl ? (
                        photoFitMode === 'contain' ? (
                          <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                            <img
                              src={imgUrl}
                              alt={sp.koreanName}
                              className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-50"
                            />
                            <img
                              src={imgUrl}
                              alt={sp.koreanName}
                              referrerPolicy="no-referrer"
                              className="relative z-10 w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <img
                            src={imgUrl}
                            alt={sp.koreanName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">
                          {getCatEmoji(sp.category)}
                        </div>
                      )}

                      {/* Slot badge top-left */}
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[9px] font-mono font-bold text-amber-300 border border-white/10 z-20">
                        <span>#{idx + 1}</span>
                      </div>

                      {/* Subtle Bottom Gradient Scrim & Clean Label (no bulky black block) */}
                      <div className="absolute inset-x-0 bottom-0 pt-5 pb-1 px-1.5 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex items-center justify-between text-white text-[10px] font-bold z-20">
                        <div className="flex items-center gap-1 truncate drop-shadow-sm">
                          <span>{getCatEmoji(sp.category)}</span>
                          <span className="truncate">{sp.koreanName}</span>
                        </div>
                        {isSlotTarget && (
                          <span className="text-[8px] text-emerald-400 animate-pulse font-mono">선택중</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          {/* Titles & Latin Scientific Name */}
          <div className="space-y-0.5 mb-3">
            <div className="flex items-baseline justify-between">
              <h2
                className={`text-lg font-black tracking-tight ${curStyle.textPrimary}`}
              >
                {activeMode === 'specimen'
                  ? activeSpecimen?.koreanName || '자연 표본'
                  : '생태 종합 활동 리포트'}
              </h2>
              <span className={`text-[11px] font-mono font-bold ${curStyle.textSecondary}`}>
                {activeMode === 'specimen'
                  ? activeSpecimen?.number || '#SPECIMEN-01'
                  : `총 ${totalSpeciesCount}종 탐사`}
              </span>
            </div>
            <p className={`text-xs font-serif italic ${curStyle.textSecondary}`}>
              {activeMode === 'specimen'
                ? activeSpecimen?.scientificName || 'Flora & Fauna'
                : `${criteriaBadgeText} 4선 · ${streakDays}일 연속 탐사 기록 · 뱃지 ${unlockedBadgesCount}개`}
            </p>
          </div>

          {/* =========================================================
              Samsung Health Signature 3-Ring Activity Rings Widget
              ========================================================= */}
          <div
            className={`p-3 rounded-2xl mb-3 flex items-center justify-between ${curStyle.pillBg}`}
          >
            {/* Left: Concentric Activity Rings SVG */}
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Ring 1 (Green) */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke="rgba(16, 185, 129, 0.2)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="8"
                  strokeDasharray={`${(currentRings[0].pct / 100) * 264} 264`}
                  strokeLinecap="round"
                />

                {/* Ring 2 (Cyan) */}
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  fill="transparent"
                  stroke="rgba(56, 189, 248, 0.2)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  fill="transparent"
                  stroke="#38BDF8"
                  strokeWidth="8"
                  strokeDasharray={`${(currentRings[1].pct / 100) * 188} 188`}
                  strokeLinecap="round"
                />

                {/* Ring 3 (Amber) */}
                <circle
                  cx="50"
                  cy="50"
                  r="18"
                  fill="transparent"
                  stroke="rgba(245, 158, 11, 0.2)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="18"
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth="8"
                  strokeDasharray={`${(currentRings[2].pct / 100) * 113} 113`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              </div>
            </div>

            {/* Right: Ring Labels & Values */}
            <div className="flex-1 ml-3 space-y-1.5 text-xs">
              {currentRings.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: r.color }}
                    />
                    <span className={`font-medium ${curStyle.textSecondary}`}>
                      {r.label}
                    </span>
                  </div>
                  <span className={`font-black font-mono ${curStyle.textPrimary}`}>
                    {r.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Metadata Capsules */}
          <div className="space-y-1 pt-1 border-t border-black/5 dark:border-white/10 text-[10px] font-mono">
            {activeMode === 'specimen' ? (
              <>
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1 ${curStyle.textSecondary}`}>
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    <span className="truncate max-w-[170px]">{activeObs.location}</span>
                  </span>
                  <span className={curStyle.textSecondary}>
                    📅 {activeObs.date} {activeObs.time}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1 ${curStyle.textSecondary}`}>
                    <Shield className="w-3 h-3 text-amber-500" />
                    <span>{conservationLabel}</span>
                  </span>
                  <span className="text-[9px] text-stone-400 font-bold uppercase">
                    ONE UI 7 EDITION
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1 ${curStyle.textSecondary}`}>
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    <span>수도권 종합 생태 탐사 구역</span>
                  </span>
                  <span className={curStyle.textSecondary}>
                    📅 누적 종합 분석 리포트
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1 ${curStyle.textSecondary}`}>
                    <Award className="w-3 h-3 text-emerald-500" />
                    <span>해금 뱃지 {unlockedBadgesCount}종 보유</span>
                  </span>
                  <span className="text-[9px] text-stone-400 font-bold uppercase">
                    BIODIVERSITY ATLAS
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        {/* End of Preview Card */}
      </div>
      {/* End of Right Column */}
    </div>
    {/* End of 2-Column Grid */}
  </div>
  {/* End of Scrollable Body */}

  {/* Sticky Action Footer (Always Visible at bottom, zero scrolling required!) */}
  <div className="p-3 sm:px-6 sm:py-3.5 border-t border-white/10 bg-stone-900/95 backdrop-blur-md shrink-0">
    <div className="grid grid-cols-3 gap-2 max-w-sm sm:max-w-md mx-auto">
      {/* Download Image Button */}
      <button
        type="button"
        onClick={handleDownloadImage}
        disabled={isDownloading}
        className="py-2.5 px-3 rounded-2xl bg-white hover:bg-stone-100 text-stone-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
      >
        <Download className="w-4 h-4 text-emerald-600" />
        <span>이미지 저장</span>
      </button>

      {/* Copy Card Button */}
      <button
        type="button"
        onClick={handleCopyCard}
        className="py-2.5 px-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 border border-white/10"
      >
        {isCopied ? (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span>복사 완료!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-stone-300" />
            <span>카드 복사</span>
          </>
        )}
      </button>

      {/* Native Share Button */}
      <button
        type="button"
        onClick={handleNativeShare}
        className="py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
      >
        <Share2 className="w-4 h-4 text-white" />
        <span>SNS 공유</span>
      </button>
    </div>
  </div>
</motion.div>
</div>
);
};
