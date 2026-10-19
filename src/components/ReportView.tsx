import React, { useState } from 'react';
import {
  Compass,
  Leaf,
  Feather,
  Bug,
  Cat,
  Sparkles,
  Flame,
  Award,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  RefreshCw,
  X,
  Check,
  Camera,
  BookOpen,
  PieChart,
  Sun,
  Sunrise,
  Sunset as SunsetIcon,
  Moon,
  ShieldCheck,
  Lock,
  SlidersHorizontal,
  Target,
  Trophy,
  CheckCircle2,
  Layers,
  Activity,
  UserCheck,
  Droplets,
  Fish,
  Tag,
  Hash,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Specimen, UserStats, NaturalistPersona, EXPLORER_TITLES } from '../types';
import { NATURALIST_PERSONAS, SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';
import { evaluateExplorerBadges, EvaluatedBadge } from '../data/badges';
import { RecentSpecimenBasket } from './RecentSpecimenBasket';

interface ReportViewProps {
  specimens: Specimen[];
  userStats: UserStats;
  onUpdatePersona: (persona: NaturalistPersona) => void;
  onSelectSpecimen: (sp: Specimen) => void;
  onOpenLens: () => void;
  onOpenHotspots: () => void;
  onOpenQuestModal: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  specimens,
  userStats,
  onUpdatePersona,
  onSelectSpecimen,
  onOpenLens,
  onOpenQuestModal,
}) => {
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [selectedBadgeModal, setSelectedBadgeModal] = useState<EvaluatedBadge | null>(null);
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const safeSpecimens = specimens || [];
  const collectedList = safeSpecimens.filter((s) => s.isCollected && !s.isPending);

  // 1. Category Breakdown (9 Exact Groups)
  const plantCount = collectedList.filter((s) => s.category === 'plants').length;
  const insectCount = collectedList.filter((s) => s.category === 'insects').length;
  const birdCount = collectedList.filter((s) => s.category === 'birds').length;
  const invertCount = collectedList.filter((s) => s.category === 'arachnids' || s.category === 'mollusks' || s.category === 'crustaceans').length;
  const mammalCount = collectedList.filter((s) => s.category === 'mammals').length;
  const herpCount = collectedList.filter((s) => s.category === 'amphibians' || s.category === 'reptiles').length;
  const fishCount = collectedList.filter((s) => s.category === 'fishes').length;
  const fungiCount = collectedList.filter((s) => s.category === 'fungi').length;

  const totalCollectedCount = collectedList.length || 1;

  const plantPct = Math.round((plantCount / totalCollectedCount) * 100);
  const insectPct = Math.round((insectCount / totalCollectedCount) * 100);
  const birdPct = Math.round((birdCount / totalCollectedCount) * 100);
  const invertPct = Math.round((invertCount / totalCollectedCount) * 100);
  const mammalPct = Math.round((mammalCount / totalCollectedCount) * 100);
  const herpPct = Math.round((herpCount / totalCollectedCount) * 100);
  const fishPct = Math.round((fishCount / totalCollectedCount) * 100);
  const fungiPct = Math.round((fungiCount / totalCollectedCount) * 100);

  // Dynamic Nativeness & Conservation Status calculation based on collected list & encyclopedia
  const nativeCount = collectedList.filter((s) => {
    const eco = SPECIES_ECOLOGY_ENCYCLOPEDIA.find((e) => e.koreanName === s.koreanName);
    if (!eco) return true;
    const isIntroduced = (eco.tags && eco.tags.some((t) => t.includes('외래') || t.includes('귀화'))) || s.koreanName.includes('서양');
    return !isIntroduced;
  }).length;

  const introducedCount = collectedList.length - nativeCount;
  const nativePctCalc = Math.round((nativeCount / (collectedList.length || 1)) * 100);
  const totalAvailableSpecimens = specimens.filter((s) => !s.isDeleted).length || 1;
  const collectionRatePct = Math.round((collectedList.length / totalAvailableSpecimens) * 100);
  const lcCount = collectedList.length;

  // Habitat Distribution with domain-appropriate natural tone colors
  const habitatDistribution = [
    { name: '도심 공원/녹지', pct: 45, count: Math.round(collectedList.length * 0.45), color: '#10b981', bgClass: 'bg-emerald-600' },
    { name: '산림 및 수목림', pct: 30, count: Math.round(collectedList.length * 0.30), color: '#059669', bgClass: 'bg-emerald-700' },
    { name: '하천 및 습지 수변', pct: 15, count: Math.round(collectedList.length * 0.15), color: '#0284c7', bgClass: 'bg-sky-600' },
    { name: '인가/화단/초지', pct: 10, count: Math.round(collectedList.length * 0.10), color: '#d97706', bgClass: 'bg-amber-600' },
  ];

  const streakDays = userStats.streakDays || 5;

  const ALL_BADGES = React.useMemo(() => {
    return evaluateExplorerBadges(specimens, userStats);
  }, [specimens, userStats]);

  const unlockedBadgesCount = ALL_BADGES.filter((b) => b.isUnlocked).length;

  const levelIdx = 
    unlockedBadgesCount >= 14 ? 4 :
    unlockedBadgesCount >= 10 ? 3 :
    unlockedBadgesCount >= 6 ? 2 :
    unlockedBadgesCount >= 3 ? 1 : 0;
  
  const lang = 'ko'; 
  
  const currentPersona = NATURALIST_PERSONAS[userStats?.persona || 'general'] || NATURALIST_PERSONAS.general;
  const currentPersonaColor = currentPersona.accentColor || '#6B9F0A';

  const personaKey = (userStats.persona as keyof typeof EXPLORER_TITLES.ko.personas) || 'general';
  
  const personaData = React.useMemo(() => 
    EXPLORER_TITLES[lang].personas[personaKey] || EXPLORER_TITLES[lang].personas.general,
    [personaKey]
  );
  
  const levelData = React.useMemo(() => 
    EXPLORER_TITLES[lang].levels[levelIdx] || EXPLORER_TITLES[lang].levels[0],
    [levelIdx]
  );

  // 2. DYNAMIC PERSONAL OBSERVATION ARCHETYPE
  let derivedPersonaKey: NaturalistPersona = 'general';
  if (birdPct >= 35) derivedPersonaKey = 'birder';
  else if (plantPct >= 35) derivedPersonaKey = 'botanist';
  else if (insectPct >= 35) derivedPersonaKey = 'entomologist';
  else if (mammalPct >= 30) derivedPersonaKey = 'mammalogist';

  const activePersonaKey = userStats.persona || derivedPersonaKey;
  const activePersona = NATURALIST_PERSONAS[activePersonaKey] || NATURALIST_PERSONAS.general;

  // 3. Helper Persona Icon
  const getPersonaIcon = (pId: string) => {
    switch (pId) {
      case 'botanist': return Leaf;
      case 'birder': return Feather;
      case 'entomologist': return Bug;
      case 'mammalogist': return Cat;
      default: return Compass;
    }
  };
  const CurrentIcon = getPersonaIcon(activePersonaKey);

  // Filter Badges list
  const filteredBadges = ALL_BADGES.filter((b) => {
    if (badgeFilter === 'unlocked') return b.isUnlocked;
    if (badgeFilter === 'locked') return !b.isUnlocked;
    return true;
  });

  // 8 Actual Ecological Biodiversity Categories (식물, 조류, 곤충, 포유류, 균류, 양서·파충류, 어류, 무척추·기타)
  const biodiversityCategories = [
    {
      id: 'plants',
      name: '식물',
      count: plantCount,
      pct: plantPct,
      color: '#6B9F0A',
      bgClass: 'bg-[#6B9F0A]',
      icon: Leaf,
    },
    {
      id: 'birds',
      name: '조류',
      count: birdCount,
      pct: birdPct,
      color: '#778AA6',
      bgClass: 'bg-[#778AA6]',
      icon: Feather,
    },
    {
      id: 'insects',
      name: '곤충',
      count: insectCount,
      pct: insectPct,
      color: '#DFAD3E',
      bgClass: 'bg-[#DFAD3E]',
      icon: Bug,
    },
    {
      id: 'mammals',
      name: '포유류',
      count: mammalCount,
      pct: mammalPct,
      color: '#C76C2C',
      bgClass: 'bg-[#C76C2C]',
      icon: Cat,
    },
    {
      id: 'fungi',
      name: '균류',
      count: fungiCount,
      pct: fungiPct,
      color: '#EF4452',
      bgClass: 'bg-[#EF4452]',
      icon: Sparkles,
    },
    {
      id: 'herptiles',
      name: '양서·파충류',
      count: herpCount,
      pct: herpPct,
      color: '#00A199',
      bgClass: 'bg-[#00A199]',
      icon: Droplets,
    },
    {
      id: 'fishes',
      name: '어류',
      count: fishCount,
      pct: fishPct,
      color: '#1E6EF4',
      bgClass: 'bg-[#1E6EF4]',
      icon: Fish,
    },
    {
      id: 'invertebrates',
      name: '무척추·기타',
      count: invertCount,
      pct: invertPct,
      color: '#DD928C',
      bgClass: 'bg-[#DD928C]',
      icon: Layers,
    },
  ];

  // =========================================================================
  // Dynamic monthly observations aggregation (Current Month & Recent 6 Months)
  // Overall vs Custom Tendency (2 classifications only: 맞춤 성향 vs 기타 탐사)
  // =========================================================================
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const isGeneralPersona = (userStats?.persona || 'general') === 'general' || currentPersona.id === 'general';
  const personaRecommendedCats = currentPersona?.recommendedCategories || [];

  // Generate 6 month slots ending at current month
  const recent6MonthsSlots = Array.from({ length: 6 }, (_, idx) => {
    const offsetMonths = 5 - idx;
    const slotDate = new Date(currentYear, currentMonth - 1 - offsetMonths, 1);
    const y = slotDate.getFullYear();
    const m = slotDate.getMonth() + 1;
    const ymKey = `${y}.${String(m).padStart(2, '0')}`;
    const monthLabel = `${m}월`;
    const isCurrent = offsetMonths === 0;

    return {
      ymKey,
      y,
      m,
      monthLabel,
      isCurrent,
      label: isCurrent ? '이번달' : undefined,
    };
  });

  const monthObsCounts: Record<string, number> = {};
  const monthPersonaCounts: Record<string, number> = {};
  recent6MonthsSlots.forEach((s) => {
    monthObsCounts[s.ymKey] = 0;
    monthPersonaCounts[s.ymKey] = 0;
  });

  let totalRecent6Months = 0;
  let totalPersona6Months = 0;
  let earliestObsDate: string | null = null;

  collectedList.forEach((sp) => {
    const isPersonaMatch = personaRecommendedCats.includes(sp.category);
    sp.observations?.forEach((obs) => {
      if (!obs.date) return;
      const m = obs.date.replace(/-/g, '.').match(/(\d{4})\.(\d{1,2})/);
      if (m) {
        const ym = `${m[1]}.${m[2].padStart(2, '0')}`;
        if (!earliestObsDate || ym < earliestObsDate) {
          earliestObsDate = ym;
        }
        if (monthObsCounts[ym] !== undefined) {
          monthObsCounts[ym] += 1;
          totalRecent6Months += 1;
          if (isPersonaMatch) {
            monthPersonaCounts[ym] += 1;
            totalPersona6Months += 1;
          }
        }
      }
    });
  });

  const personaRatioPct = totalRecent6Months > 0 ? Math.round((totalPersona6Months / totalRecent6Months) * 100) : 0;
  const otherObsCount = Math.max(0, totalRecent6Months - totalPersona6Months);
  const otherRatioPct = 100 - personaRatioPct;

  const activeMonthsWithObs = recent6MonthsSlots.filter((s) => (monthObsCounts[s.ymKey] || 0) > 0);
  const explorerTenureMonths = Math.max(1, activeMonthsWithObs.length);
  const isFirstMonthUser = activeMonthsWithObs.length <= 1;

  const recent6MonthsData = recent6MonthsSlots.map((s) => {
    const rawCount = monthObsCounts[s.ymKey] || 0;
    const personaCount = monthPersonaCounts[s.ymKey] || 0;
    const isBeforeUserStart = earliestObsDate ? s.ymKey < earliestObsDate : !s.isCurrent;
    return {
      month: s.monthLabel,
      ymKey: s.ymKey,
      count: rawCount,
      personaCount,
      isCurrent: s.isCurrent,
      isBeforeUserStart: isBeforeUserStart && rawCount === 0,
      label: s.isCurrent ? '이번달' : (isBeforeUserStart && rawCount === 0 ? '시작전' : undefined),
    };
  });

  const maxMonthCount = Math.max(...recent6MonthsData.map((d) => d.count), 5);
  const avgMonthlyCount = (totalRecent6Months / Math.max(1, explorerTenureMonths)).toFixed(1);

  // =========================================================================
  // Dynamic Aggregation of Top Captured Tags (주요 포착 태그)
  // =========================================================================
  const capturedTagStats = React.useMemo(() => {
    const tagCountMap: Record<string, {
      tag: string;
      count: number;
      categoryType: 'trait' | 'habitat' | 'conservation' | 'behavior';
      specimens: Specimen[];
    }> = {};

    collectedList.forEach((sp) => {
      // Find matching encyclopedia entry
      const eco = SPECIES_ECOLOGY_ENCYCLOPEDIA.find(
        (e) => e.koreanName === sp.koreanName || e.scientificName === sp.scientificName
      );

      // Collect raw candidate tags
      const rawCandidates = [
        ...(sp.traitChips || []),
        ...(eco?.tags || []),
      ];

      // Add habitat if available
      if (sp.habitatType) {
        const hClean = sp.habitatType.split(/[/,]/)[0].trim();
        if (hClean.length >= 2) rawCandidates.push(hClean);
      }

      const uniqueInThisSpecimen = new Set<string>();

      rawCandidates.forEach((raw) => {
        if (!raw || typeof raw !== 'string') return;
        const cleaned = raw.trim().replace(/^#/, '');
        if (cleaned.length < 2 || cleaned.length > 15) return;
        if (/^\d+$/.test(cleaned)) return;
        if (['자생종', '생물', '야생', '관찰', '식물계', '동물계', '종'].includes(cleaned)) return;

        // Normalize spacing
        const key = cleaned.replace(/\s+/g, '');
        if (uniqueInThisSpecimen.has(key)) return;
        uniqueInThisSpecimen.add(key);

        if (!tagCountMap[key]) {
          let catType: 'trait' | 'habitat' | 'conservation' | 'behavior' = 'trait';
          if (/하천|공원|숲|산림|습지|사구|수변|정원|화단|연못|골목길|도심/.test(key)) {
            catType = 'habitat';
          } else if (/천연기념물|보호|멸종위기|1급수지표|지표종|특산|IUCN|취약/.test(key)) {
            catType = 'conservation';
          } else if (/야행성|비행|사냥|포식|수분|동면|명음|울음|흡밀|잠수|호버링/.test(key)) {
            catType = 'behavior';
          }

          tagCountMap[key] = {
            tag: cleaned,
            count: 0,
            categoryType: catType,
            specimens: [],
          };
        }

        tagCountMap[key].count += 1;
        if (!tagCountMap[key].specimens.some((s) => s.id === sp.id)) {
          tagCountMap[key].specimens.push(sp);
        }
      });
    });

    return Object.values(tagCountMap).sort((a, b) => b.count - a.count);
  }, [collectedList]);

  return (
    <div className="space-y-4 pb-16 select-none bg-stone-100/60 p-1" id="report-view-container">
      {/* ========================================================
          1. NATURALIST PROFILE & ACTIVITY SUMMARY (GALAXY GLASS STYLE)
          ======================================================== */}
      <section className="galaxy-glass-card rounded-[28px] p-5 space-y-4">
        <div className="text-center space-y-3">
          <h2
            className="text-2xl font-black tracking-tight transition-colors"
            style={{ color: currentPersonaColor }}
          >
            <span>{levelData.adj}</span>{' '}
            <span>{currentPersona.title}</span>
          </h2>
          <button
            type="button"
            onClick={() => setIsPersonaModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-4 py-1.5 rounded-full transition-all cursor-pointer border border-stone-200 shadow-2xs active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
            <span>유형 변경</span>
          </button>
        </div>

        {/* 3-Metric Summary Pods (Galaxy Soft Glass) */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="galaxy-glass-subtle rounded-2xl p-3 text-center">
            <span className="text-[11px] text-stone-500 font-medium block mb-0.5">총 수집 표본</span>
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-lg sm:text-xl font-extrabold text-stone-900 font-mono">{collectedList.length}</span>
              <span className="text-[11px] text-stone-500 font-medium">종</span>
            </div>
          </div>
          <div className="galaxy-glass-subtle rounded-2xl p-3 text-center">
            <span className="text-[11px] text-stone-500 font-medium block mb-0.5">연속 관찰</span>
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-lg sm:text-xl font-extrabold text-stone-900 font-mono">{streakDays}</span>
              <span className="text-[11px] text-stone-500 font-medium">일째</span>
            </div>
          </div>
          <div
            onClick={onOpenQuestModal}
            className="rotating-gradient-border galaxy-glass-subtle rounded-2xl p-3 text-center cursor-pointer hover:scale-105 transition-all active:scale-95 group"
            title="클릭하여 생태 탐험가 레벨 및 퀘스트 보기"
          >
            <span className="text-[10px] text-stone-500 font-bold block mb-0.5">탐험가 레벨</span>
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-sm font-extrabold text-stone-900 font-mono truncate">Lv.{levelIdx + 1}</span>
            </div>
          </div>
        </div>

      </section>

      {/* ========================================================
          2. RECENT 6-MONTH EXPLORATION TREND & TENDENCY RATIO
          (만능 탐험가는 탐사 추이 미노출, 특정 관심 성향 탐험가 전용)
          ======================================================== */}
            {!isGeneralPersona && (
        <section className="galaxy-glass-card rounded-[28px] p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 transition-colors" style={{ color: currentPersonaColor }} />
                <span>최대 6개월 탐사 추이</span>
              </h3>
              {isFirstMonthUser ? (
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs transition-colors"
                  style={{
                    color: currentPersonaColor,
                    backgroundColor: `${currentPersonaColor}18`,
                    borderColor: `${currentPersonaColor}40`,
                  }}
                >
                  🌱 탐사 1개월 차 (실시간 누적 중)
                </span>
              ) : (
                <span className="text-[11px] font-bold text-stone-700 bg-white/90 px-2.5 py-0.5 rounded-full border border-white/90 shadow-2xs">
                  누적 {explorerTenureMonths}개월 활동
                </span>
              )}
            </div>
            <span className="text-xs font-mono font-bold text-stone-700 bg-white/80 px-2.5 py-1 rounded-full border border-white/90 shadow-2xs">
              {isFirstMonthUser ? `이번달 ${recent6MonthsData.find((d) => d.isCurrent)?.count || 0}회 관찰` : `월평균 ${avgMonthlyCount}회`}
            </span>
          </div>

          {/* Clean Activity Bar Chart */}
          <div className="galaxy-glass-subtle rounded-2xl p-4 sm:p-5 space-y-3">
            {/* Chart Drawing Area */}
            <div className="relative h-40 flex items-end justify-between gap-2 pt-6 pb-0 border-b border-stone-200">
              {/* Horizontal Reference Grid Line */}
              <div className="absolute top-8 left-0 right-0 border-t border-dashed border-stone-200 pointer-events-none" />
              <div className="absolute top-20 left-0 right-0 border-t border-dashed border-stone-200/60 pointer-events-none" />

              {recent6MonthsData.map((item) => {
                const hasCount = item.count > 0;
                const barHeightPct = hasCount ? Math.max(16, Math.round((item.count / maxMonthCount) * 100)) : 4;
                const personaBarPct = item.count > 0 ? Math.round((item.personaCount / item.count) * 100) : 0;
                const tooltipText = `${item.month}: ${item.personaCount}건(${personaBarPct}%)`;

                return (
                  <div
                    key={item.ymKey}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    title={tooltipText}
                  >
                    {/* Count indicator on top of bar */}
                    <span
                      className={`text-[11px] font-mono mb-1 ${
                        item.isCurrent
                          ? 'font-black'
                          : (hasCount ? 'text-stone-700 font-bold' : 'text-stone-300')
                      }`}
                      style={item.isCurrent ? { color: currentPersonaColor } : undefined}
                    >
                      {hasCount ? item.count : (item.isBeforeUserStart ? '-' : '0')}
                    </span>

                    {/* Level Baseline Column Bar */}
                    <div className="w-full max-w-[34px] sm:max-w-[42px] flex flex-col justify-end h-full">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${barHeightPct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`w-full rounded-t-lg overflow-hidden flex flex-col-reverse shadow-2xs ${
                          !hasCount ? (item.isBeforeUserStart ? 'bg-stone-200/50' : 'bg-stone-200/80') : 'bg-stone-300'
                        }`}
                      >
                        {hasCount && item.personaCount > 0 && (
                          <div
                            style={{
                              height: `${personaBarPct}%`,
                              backgroundColor: currentPersonaColor,
                            }}
                            className="w-full transition-all"
                          />
                        )}
                      </motion.div>
                    </div>

                    {/* Short Tooltip on Hover */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {item.personaCount}건({personaBarPct}%)
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Month Labels */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {recent6MonthsData.map((item) => (
                <div key={item.ymKey} className="flex-1 text-center py-1">
                  <span className={`text-xs block ${
                    item.isCurrent ? 'font-extrabold text-stone-900' : 'font-medium text-stone-500'
                  }`}>
                    {item.month}
                  </span>
                  {item.label && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md inline-block mt-0.5 ${
                        item.isCurrent
                          ? 'text-white'
                          : 'text-stone-400 bg-stone-100'
                      }`}
                      style={item.isCurrent ? { backgroundColor: currentPersonaColor } : undefined}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Activity Insight Footer */}
            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500 flex-wrap gap-1.5">
              <span>최근 6개월 누적 {totalRecent6Months}회 관찰 분석 완료</span>
              <span className="font-bold transition-colors" style={{ color: currentPersonaColor }}>
                {currentPersona.title} 맞춤 연동
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          3. BIODIVERSITY BALANCE (8 ACTUAL NATURAL CATEGORIES)
          ======================================================== */}
      <section className="galaxy-glass-card rounded-[28px] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-stone-700" />
            <span>생물 다양성 밸런스</span>
          </h3>
          <span className="text-xs font-mono font-bold text-stone-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-white/90 shadow-2xs">
            총 {collectedList.length}종 수집
          </span>
        </div>

        {/* Proportional Segmented Progress Bar */}
        <div className="space-y-3">
          <div className="w-full h-3 bg-stone-200/70 rounded-full overflow-hidden flex shadow-inner">
            {biodiversityCategories
              .filter((cat) => cat.count > 0)
              .map((cat) => {
                const widthPct = Math.max(3, cat.pct);
                return (
                  <div
                    key={cat.id}
                    style={{ width: `${widthPct}%`, backgroundColor: cat.color }}
                    className="h-full transition-all"
                    title={`${cat.name} ${cat.count}종 (${cat.pct}%)`}
                  />
                );
              })}
          </div>

          {/* 8 Actual Categories Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            {biodiversityCategories.map((cat) => {
              const Icon = cat.icon;
              const hasItems = cat.count > 0;

              return (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    hasItems
                      ? 'galaxy-glass-subtle text-stone-900 font-medium'
                      : 'bg-white/40 border-stone-200/40 text-stone-400'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-medium truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: hasItems ? cat.color : '#D6D3D1' }}
                    />
                    <Icon className="w-3 h-3 shrink-0 opacity-70" />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className={`font-mono font-bold shrink-0 ml-1 ${hasItems ? 'text-stone-900' : 'text-stone-400'}`}>
                    {cat.count}종
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>



      {/* ========================================================
          6. ACHIEVEMENT BADGES (GALAXY GLASS STYLE)
          ======================================================== */}
      <section className="galaxy-glass-card rounded-[28px] p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-stone-700" />
            <span>탐사 뱃지</span>
          </h3>

          <div className="flex items-center gap-1 bg-stone-200/50 p-1 rounded-full text-xs">
            <button
              type="button"
              onClick={() => setBadgeFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                badgeFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              전체 ({ALL_BADGES.length})
            </button>
            <button
              type="button"
              onClick={() => setBadgeFilter('unlocked')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                badgeFilter === 'unlocked' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              달성 ({unlockedBadgesCount})
            </button>
            <button
              type="button"
              onClick={() => setBadgeFilter('locked')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                badgeFilter === 'locked' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              도전 과제
            </button>
          </div>
        </div>

        {/* Badges List / Cards with Titles, Descriptions, and Chips - 2 Columns */}
        <div className="grid grid-cols-2 gap-2.5">
          {filteredBadges.map((badge) => {
            const isUnlocked = badge.isUnlocked;
            const progressPct = Math.min(100, Math.round((badge.currentProgress / badge.targetProgress) * 100));

            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadgeModal(badge)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center group hover:shadow-sm ${
                  isUnlocked
                    ? 'bg-emerald-50/40 border-emerald-200/60 hover:border-emerald-300'
                    : 'bg-white/60 border-stone-200/60 hover:border-stone-300'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center text-2xl transition-transform group-hover:scale-105 shadow-2xs mb-3 ${
                    isUnlocked
                      ? 'bg-emerald-100/80 border border-emerald-200 text-emerald-700'
                      : 'bg-stone-100 border border-stone-200 text-stone-400'
                  }`}
                >
                  {isUnlocked ? <span>{badge.icon}</span> : <Lock className="w-5 h-5 text-stone-400" />}
                </div>

                {/* Chips */}
                <div className="flex items-center justify-center gap-1.5 mb-2 flex-wrap">
                  <span className="text-[10px] font-medium text-stone-500 bg-stone-100/80 px-2 py-0.5 rounded-full">
                    {badge.category}
                  </span>
                  {isUnlocked ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      달성 완료 ✦
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-stone-600 bg-stone-200/70 px-2 py-0.5 rounded-full">
                      진행 중 ({progressPct}%)
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div className="w-full">
                  <h4 className="font-bold text-sm text-stone-900 mb-1 line-clamp-1">{badge.title}</h4>
                  <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">{badge.desc}</p>

                  {!isUnlocked && (
                    <div className="w-full bg-stone-200/70 rounded-full h-1.5 overflow-hidden mt-3">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-stone-400"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          6. RECENT OBSERVATION BASKET (RECENT SPECIMENS)
          ======================================================== */}
      <section className="galaxy-glass-card rounded-[28px] p-5">
        <RecentSpecimenBasket
          specimens={specimens}
          onSelectSpecimen={onSelectSpecimen}
          title="최근 포착된 주요 표본"
        />
      </section>

      {/* ================= BADGE DETAIL MODAL (GALAXY GLASS STYLE) ================= */}
      <AnimatePresence>
        {selectedBadgeModal && (() => {
          const isBadgeUnlocked = selectedBadgeModal.isUnlocked;
          const badgeProgressPct = Math.min(100, Math.round((selectedBadgeModal.currentProgress / selectedBadgeModal.targetProgress) * 100));

          return (
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedBadgeModal(null)}
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm galaxy-glass-card rounded-[28px] p-5 sm:p-6 shadow-2xl border border-white/80 select-none text-stone-900 text-center relative overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setSelectedBadgeModal(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className={`w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl shadow-xs ${
                  isBadgeUnlocked
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                    : 'bg-stone-100 border border-stone-200 text-stone-400'
                }`}>
                  {isBadgeUnlocked ? selectedBadgeModal.icon : '🔒'}
                </div>

                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                    {selectedBadgeModal.category}
                  </span>
                  {isBadgeUnlocked ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      달성 완료
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-stone-500 bg-stone-200/70 px-2 py-0.5 rounded-full">
                      진행 중 ({badgeProgressPct}%)
                    </span>
                  )}
                </div>

                <h3 className="text-base font-extrabold text-stone-900 mb-1">
                  {selectedBadgeModal.title}
                </h3>

                <p className="text-xs text-stone-600 mb-3.5 font-medium leading-normal">
                  {selectedBadgeModal.desc}
                </p>

                {/* Progress Indicator */}
                <div className="p-3 galaxy-glass-subtle rounded-xl mb-3 text-left space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <span>달성 진행도</span>
                    <span className="font-mono">
                      {selectedBadgeModal.currentProgress} / {selectedBadgeModal.targetProgress} {selectedBadgeModal.progressUnit}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200/80 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${badgeProgressPct}%` }}
                      className={`h-full rounded-full transition-all ${isBadgeUnlocked ? 'bg-emerald-500' : 'bg-stone-800'}`}
                    />
                  </div>
                  {selectedBadgeModal.unlockedAt && (
                    <p className="text-[10px] text-emerald-700 font-medium pt-0.5">
                      달성일: {selectedBadgeModal.unlockedAt}
                    </p>
                  )}
                </div>

                {/* Short Actionable Tip */}
                <div className="text-left px-3 py-2 bg-amber-50/80 rounded-xl border border-amber-200/60 mb-4 flex items-center gap-2">
                  <span className="text-xs shrink-0">💡</span>
                  <p className="text-[11px] text-amber-900 font-medium leading-snug">
                    {selectedBadgeModal.tip}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBadgeModal(null)}
                  className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  확인
                </button>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ================= PERSONA OVERRIDE MODAL ================= */}
      <AnimatePresence>
        {isPersonaModalOpen && (
          <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
            onClick={() => setIsPersonaModalOpen(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg wabi-glass-card bg-white/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col text-stone-900 border border-white/60 select-none overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    관찰 성향 커스텀 변경
                  </h3>
                  <p className="text-xs text-stone-500">
                    원하는 주 관찰 프로필을 수동으로 선택할 수 있습니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPersonaModalOpen(false)}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 py-4 overflow-y-auto pr-1 flex-1 scrollbar-none">
                {Object.entries(NATURALIST_PERSONAS).map(([key, p]) => {
                  const isSelected = activePersonaKey === key;
                  const IconC = getPersonaIcon(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        onUpdatePersona(key as NaturalistPersona);
                        setIsPersonaModalOpen(false);
                      }}
                      className={`w-full p-4 rounded-2xl text-left transition-all flex items-start gap-3.5 border cursor-pointer ${
                        isSelected
                          ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                          : 'bg-white/90 text-stone-800 border-stone-200 hover:border-stone-400 hover:bg-stone-50'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                        isSelected ? 'bg-white text-stone-900' : 'bg-stone-100 text-stone-700'
                      }`}>
                        <IconC className="w-5 h-5 stroke-[2.2px]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-black truncate">{p.title}</h4>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-white text-stone-900 flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3px]" />
                            </div>
                          )}
                        </div>
                        <p className={`text-xs leading-relaxed ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                          {p.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsPersonaModalOpen(false)}
                className="w-full py-3.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-2xl transition-colors cursor-pointer mt-1 shrink-0"
              >
                닫기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
