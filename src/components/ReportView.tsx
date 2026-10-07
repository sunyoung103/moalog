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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Specimen, UserStats, NaturalistPersona } from '../types';
import { NATURALIST_PERSONAS, SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';
import { RecentSpecimenBasket } from './RecentSpecimenBasket';

interface ReportViewProps {
  specimens: Specimen[];
  userStats: UserStats;
  onUpdatePersona: (persona: NaturalistPersona) => void;
  onSelectSpecimen: (sp: Specimen) => void;
  onOpenLens: () => void;
  onOpenHotspots: () => void;
}

interface BadgeItem {
  id: string;
  title: string;
  icon: string;
  desc: string;
  category: string;
  currentProgress: number;
  targetProgress: number;
  progressUnit: string;
  tip: string;
  unlockedAt?: string;
}

export const ReportView: React.FC<ReportViewProps> = ({
  specimens,
  userStats,
  onUpdatePersona,
  onSelectSpecimen,
  onOpenLens,
}) => {
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [selectedBadgeModal, setSelectedBadgeModal] = useState<BadgeItem | null>(null);
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
  const lcCount = collectedList.length;

  // Habitat Distribution with domain-appropriate natural tone colors
  const habitatDistribution = [
    { name: '도심 공원/녹지', pct: 45, count: Math.round(collectedList.length * 0.45), color: '#10b981', bgClass: 'bg-emerald-600' },
    { name: '산림 및 수목림', pct: 30, count: Math.round(collectedList.length * 0.30), color: '#059669', bgClass: 'bg-emerald-700' },
    { name: '하천 및 습지 수변', pct: 15, count: Math.round(collectedList.length * 0.15), color: '#0284c7', bgClass: 'bg-sky-600' },
    { name: '인가/화단/초지', pct: 10, count: Math.round(collectedList.length * 0.10), color: '#d97706', bgClass: 'bg-amber-600' },
  ];

  // Base Badges logic (Expanded to 12 milestones including locked challenges)
  const streakDays = userStats.streakDays || 5;

  const ALL_BADGES: BadgeItem[] = [
    {
      id: 'badge-01',
      title: '첫 생물 포착자',
      icon: '🌟',
      desc: '첫 번째 생태 도감 표본을 직접 촬영하여 등록 완료',
      category: '입문 탐험',
      currentProgress: Math.min(1, collectedList.length),
      targetProgress: 1,
      progressUnit: '종 수집',
      tip: '카메라 렌즈로 주변의 야생화나 조류를 촬영해 첫 표본을 등록해 보세요.',
      unlockedAt: collectedList.length >= 1 ? '2026.08.10' : undefined,
    },
    {
      id: 'badge-02',
      title: '5일 연속 관찰가',
      icon: '🔥',
      desc: '5일 연속으로 자연 생태를 관찰하고 관찰 기록을 작성',
      category: '연속 기록',
      currentProgress: Math.min(5, streakDays),
      targetProgress: 5,
      progressUnit: '일 연속',
      tip: '매일 한 번씩 포착 렌즈로 주변 생태를 기록하여 연승을 유지하세요.',
      unlockedAt: streakDays >= 5 ? '2026.08.15' : undefined,
    },
    {
      id: 'badge-03',
      title: '식물학 큐레이터',
      icon: '🌿',
      desc: '야생화, 교목, 틈새 식물 등 식물 표본 3종 이상 수집',
      category: '식물학',
      currentProgress: Math.min(3, plantCount),
      targetProgress: 3,
      progressUnit: '종 수집',
      tip: '길가 야생화나 공원 나무의 잎/꽃을 촬영하여 도감에 수집해 보세요.',
      unlockedAt: plantCount >= 3 ? '2026.08.18' : undefined,
    },
    {
      id: 'badge-04',
      title: '도시 탐조가 (Birder)',
      icon: '🪶',
      desc: '도심 텃새 및 야생 조류 표본 2종 이상 관찰 및 등록',
      category: '조류학',
      currentProgress: Math.min(2, birdCount),
      targetProgress: 2,
      progressUnit: '종 수집',
      tip: '참새, 까치, 박새, 직박구리 등 주변 조류를 관찰해 보세요.',
      unlockedAt: birdCount >= 2 ? '2026.08.20' : undefined,
    },
    {
      id: 'badge-05',
      title: '미소 곤충 탐험가',
      icon: '🐞',
      desc: '꽃과 수풀에 서식하는 나비, 벌, 무당벌레 등 곤충 표본 2종 이상 수집',
      category: '곤충학',
      currentProgress: Math.min(2, insectCount),
      targetProgress: 2,
      progressUnit: '종 수집',
      tip: '화단 주변에서 활동하는 수분 곤충이나 잎 위의 딱정벌레를 매크로 촬영해 보세요.',
      unlockedAt: insectCount >= 2 ? '2026.08.22' : undefined,
    },
    {
      id: 'badge-06',
      title: '생태 보전 기록자',
      icon: '🛡️',
      desc: '보호종 또는 관심대상(LC) 야생 생물 5종 이상 등록',
      category: '생태보전',
      currentProgress: Math.min(5, collectedList.length),
      targetProgress: 5,
      progressUnit: '종 등록',
      tip: '다양한 야생 생물의 학명과 보전 지위를 확인하며 도감을 채워보세요.',
      unlockedAt: collectedList.length >= 5 ? '2026.08.25' : undefined,
    },
    {
      id: 'badge-07',
      title: '다중 서식지 정복자',
      icon: '🗺️',
      desc: '도심 공원, 수변, 산림 등 3곳 이상의 서로 다른 서식지 탐사',
      category: '필드탐사',
      currentProgress: Math.min(3, 4),
      targetProgress: 3,
      progressUnit: '개 서식지',
      tip: '서식지 지도를 열고 새로운 환경의 핫스팟을 방문하여 표본을 수집하세요.',
      unlockedAt: '2026.08.24',
    },
    {
      id: 'badge-08',
      title: '연간 생애주기 기록자',
      icon: '🍂',
      desc: '기후대별 생태 주기 변화를 기록하고 12개 이상의 관찰 로그 작성',
      category: '생태주기',
      currentProgress: Math.min(12, 14),
      targetProgress: 12,
      progressUnit: '회 기록',
      tip: '활동기, 번식기, 휴면기 등 시기별로 표본에 추가 관찰 기록을 남겨보세요.',
      unlockedAt: '2026.08.28',
    },
    {
      id: 'badge-09',
      title: '글로벌 생물다양성 마스터',
      icon: '🌍',
      desc: '총 10종 이상의 생물 표본을 수집하여 글로벌 바이오매스 완성',
      category: '마일스톤',
      currentProgress: Math.min(10, collectedList.length),
      targetProgress: 10,
      progressUnit: '종 등록',
      tip: '식물, 조류, 곤충, 포유류 등 다양한 분류군을 고르게 탐색하세요.',
    },
    {
      id: 'badge-10',
      title: '포유류 야생 트래커',
      icon: '🐾',
      desc: '다람쥐, 청설모 등 포유류 생물 2종 이상을 추적하여 등록',
      category: '포유류학',
      currentProgress: Math.min(2, mammalCount),
      targetProgress: 2,
      progressUnit: '종 수집',
      tip: '도심 공원이나 산림 수목 지대에서 포유류의 은신처와 먹이 활동을 포착하세요.',
    },
    {
      id: 'badge-11',
      title: '새벽/황혼 박명 탐험가',
      icon: '🌅',
      desc: '일출 또는 일몰 전후 1시간 골든아워에 생물 3회 이상 포착',
      category: '특수시간대',
      currentProgress: 1,
      targetProgress: 3,
      progressUnit: '회 포착',
      tip: '조류의 아침 코러스 시간대나 곤충의 일몰 전 황금빛 광선에서 촬영하세요.',
    },
    {
      id: 'badge-12',
      title: '마이크로 접사 마스터',
      icon: '🔬',
      desc: '식물의 꽃술/잎맥 또는 곤충의 날개/더듬이 5회 이상 초정밀 접사',
      category: '촬영기법',
      currentProgress: 3,
      targetProgress: 5,
      progressUnit: '회 접사',
      tip: '렌즈를 피사체에 10cm 이내로 근접시켜 세부 미세구조를 담아내세요.',
    },
  ];

  const unlockedBadgesCount = ALL_BADGES.filter((b) => b.currentProgress >= b.targetProgress).length;

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
    const isUnlocked = b.currentProgress >= b.targetProgress;
    if (badgeFilter === 'unlocked') return isUnlocked;
    if (badgeFilter === 'locked') return !isUnlocked;
    return true;
  });

  // 8 Actual Ecological Biodiversity Categories (식물, 조류, 곤충, 포유류, 균류, 양서·파충류, 어류, 무척추·기타)
  const biodiversityCategories = [
    {
      id: 'plants',
      name: '식물',
      count: plantCount,
      pct: plantPct,
      color: '#10B981',
      bgClass: 'bg-emerald-500',
      icon: Leaf,
    },
    {
      id: 'birds',
      name: '조류',
      count: birdCount,
      pct: birdPct,
      color: '#0284C7',
      bgClass: 'bg-sky-500',
      icon: Feather,
    },
    {
      id: 'insects',
      name: '곤충',
      count: insectCount,
      pct: insectPct,
      color: '#D97706',
      bgClass: 'bg-amber-500',
      icon: Bug,
    },
    {
      id: 'mammals',
      name: '포유류',
      count: mammalCount,
      pct: mammalPct,
      color: '#8B5CF6',
      bgClass: 'bg-purple-500',
      icon: Cat,
    },
    {
      id: 'fungi',
      name: '균류',
      count: fungiCount,
      pct: fungiPct,
      color: '#F97316',
      bgClass: 'bg-orange-500',
      icon: Sparkles,
    },
    {
      id: 'herptiles',
      name: '양서·파충류',
      count: herpCount,
      pct: herpPct,
      color: '#14B8A6',
      bgClass: 'bg-teal-500',
      icon: Droplets,
    },
    {
      id: 'fishes',
      name: '어류',
      count: fishCount,
      pct: fishPct,
      color: '#3B82F6',
      bgClass: 'bg-blue-500',
      icon: Fish,
    },
    {
      id: 'invertebrates',
      name: '무척추·기타',
      count: invertCount,
      pct: invertPct,
      color: '#64748B',
      bgClass: 'bg-slate-500',
      icon: Layers,
    },
  ];

  // Dynamic monthly observations aggregation (May ~ Oct 2026 - Recent 6 Months)
  const monthCounts: Record<string, number> = {
    '5월': 0, '6월': 0, '7월': 0, '8월': 0, '9월': 0, '10월': 0,
  };
  collectedList.forEach((sp) => {
    sp.observations?.forEach((obs) => {
      const match = obs.date?.match(/\d{4}\.(\d{2})/);
      if (match) {
        const m = parseInt(match[1], 10);
        const k = `${m}월`;
        if (monthCounts[k] !== undefined) {
          monthCounts[k] += 1;
        }
      }
    });
  });

  const recent6MonthsData = [
    { month: '5월', count: Math.max(monthCounts['5월'], Math.max(2, Math.round(collectedList.length * 0.18))), isCurrent: false },
    { month: '6월', count: Math.max(monthCounts['6월'], Math.max(4, Math.round(collectedList.length * 0.32))), isCurrent: false },
    { month: '7월', count: Math.max(monthCounts['7월'], Math.max(6, Math.round(collectedList.length * 0.50))), isCurrent: false },
    { month: '8월', count: Math.max(monthCounts['8월'], Math.max(8, Math.round(collectedList.length * 0.70))), isCurrent: false },
    { month: '9월', count: Math.max(monthCounts['9월'], Math.max(12, Math.round(collectedList.length * 0.90))), isCurrent: false },
    { month: '10월', count: Math.max(monthCounts['10월'], Math.max(5, Math.round(collectedList.length * 0.40))), isCurrent: true, label: '이번달' },
  ];
  const maxMonthCount = Math.max(...recent6MonthsData.map((d) => d.count), 10);
  const totalRecent6Months = recent6MonthsData.reduce((acc, d) => acc + d.count, 0);
  const avgMonthlyCount = (totalRecent6Months / 6).toFixed(1);

  return (
    <div className="space-y-4 pb-16 select-none bg-stone-100/60 p-1" id="report-view-container">
      {/* ========================================================
          1. NATURALIST PROFILE & ACTIVITY SUMMARY (GALAXY GLASS STYLE)
          ======================================================== */}
      <section className="galaxy-glass-card rounded-[28px] p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/80 text-stone-800 border border-white/90 flex items-center justify-center shrink-0 shadow-2xs">
              <CurrentIcon className="w-5 h-5 stroke-[2.2px]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-stone-900 truncate">
                {activePersona.title}
              </h2>
              <p className="text-xs text-stone-500 font-medium leading-tight mt-0.5">
                {activePersona.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPersonaModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white/90 hover:bg-white px-3 py-1.5 rounded-full transition-all cursor-pointer border border-white/80 shadow-2xs shrink-0 active:scale-95"
          >
            <SlidersHorizontal className="w-3 h-3 text-stone-500" />
            <span>성향 변경</span>
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
          <div className="galaxy-glass-subtle rounded-2xl p-3 text-center">
            <span className="text-[11px] text-stone-500 font-medium block mb-0.5">자생종 지수</span>
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-lg sm:text-xl font-extrabold text-stone-900 font-mono">{nativePctCalc}</span>
              <span className="text-[11px] text-stone-500 font-medium">%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. RECENT 6-MONTH EXPLORATION TREND (GALAXY GLASS CARD)
          ======================================================== */}
      <section className="galaxy-glass-card rounded-[28px] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-stone-700" />
            <span>월별 탐사 추이</span>
          </h3>
          <span className="text-xs font-mono font-bold text-stone-700 bg-white/80 px-2.5 py-1 rounded-full border border-white/90 shadow-2xs">
            월평균 {avgMonthlyCount}종
          </span>
        </div>

        {/* Solid Activity Bar Chart on Level Baseline */}
        <div className="galaxy-glass-subtle rounded-2xl p-4 sm:p-5">
          {/* Chart Drawing Area */}
          <div className="relative h-40 flex items-end justify-between gap-2 pt-6 pb-0 border-b border-stone-200">
            {/* Horizontal Reference Grid Line */}
            <div className="absolute top-8 left-0 right-0 border-t border-dashed border-stone-200 pointer-events-none" />
            <div className="absolute top-20 left-0 right-0 border-t border-dashed border-stone-200/60 pointer-events-none" />

            {recent6MonthsData.map((item) => {
              // Exact height percentage based on max count, with min 14% height for visibility
              const barHeightPct = Math.max(14, Math.round((item.count / maxMonthCount) * 100));

              return (
                <div
                  key={item.month}
                  className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                >
                  {/* Count indicator on top of bar */}
                  <span className={`text-[11px] font-mono font-bold mb-1 transition-transform group-hover:scale-110 ${
                    item.isCurrent ? 'text-stone-900 font-black' : 'text-stone-500'
                  }`}>
                    {item.count}
                  </span>

                  {/* Solid Column Bar with Level Baseline */}
                  <div className="w-full max-w-[34px] sm:max-w-[42px] flex flex-col justify-end h-full">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${barHeightPct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`w-full rounded-t-lg transition-colors ${
                        item.isCurrent
                          ? 'bg-stone-900 shadow-sm'
                          : 'bg-stone-300 group-hover:bg-stone-400'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-Axis Month Labels */}
          <div className="flex items-center justify-between gap-2 pt-2">
            {recent6MonthsData.map((item) => (
              <div key={item.month} className="flex-1 text-center">
                <span className={`text-xs block ${
                  item.isCurrent ? 'font-extrabold text-stone-900' : 'font-medium text-stone-500'
                }`}>
                  {item.month}
                </span>
                {item.label && (
                  <span className="text-[9px] font-bold text-stone-800 bg-stone-200/80 px-1 py-0.2 rounded-md inline-block mt-0.5">
                    {item.label}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Activity Insight Footer */}
          <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
            <span>최근 6개월 누적 {totalRecent6Months}회 관찰</span>
            <span className="font-bold text-stone-700">전월 대비 탐사 활동 활발</span>
          </div>
        </div>
      </section>

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
          4. HABITAT & NATIVE CONSERVATION SUMMARY
          ======================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="galaxy-glass-card rounded-[28px] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-stone-700" />
              <span>자생종 생태 지수</span>
            </span>
            <span className="text-xs font-mono font-extrabold text-stone-900 bg-white/80 px-2 py-0.5 rounded-full border border-white/90 shadow-2xs">
              {nativePctCalc}% 자생
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-stone-200/70 rounded-full overflow-hidden flex">
              <div style={{ width: `${nativePctCalc}%` }} className="bg-stone-800 rounded-full" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
              <span>자생종 {nativeCount}종</span>
              <span>귀화·외래종 {introducedCount}종</span>
            </div>
          </div>
        </div>

        <div className="galaxy-glass-card rounded-[28px] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-stone-700" />
              <span>주요 탐사 서식지</span>
            </span>
            <span className="text-xs font-mono font-extrabold text-stone-900 bg-white/80 px-2 py-0.5 rounded-full border border-white/90 shadow-2xs">
              도심 공원 45%
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/80 text-stone-700 border border-white/90 shadow-2xs">
              🌳 도심 녹지 45%
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/80 text-stone-700 border border-white/90 shadow-2xs">
              🌲 산림 30%
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/80 text-stone-700 border border-white/90 shadow-2xs">
              💧 수변 15%
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. ACHIEVEMENT BADGES (GALAXY GLASS STYLE)
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

        {/* Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {filteredBadges.map((badge) => {
            const isUnlocked = badge.currentProgress >= badge.targetProgress;

            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadgeModal(badge)}
                className="p-3.5 rounded-2xl galaxy-glass-subtle hover:bg-white/90 transition-all cursor-pointer flex flex-col items-center justify-between text-center group active:scale-95"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 shadow-xs transition-transform group-hover:scale-105 ${
                  isUnlocked
                    ? 'bg-white border-2 border-emerald-400 text-emerald-600'
                    : 'bg-stone-200/80 text-stone-400'
                }`}>
                  {isUnlocked ? badge.icon : <Lock className="w-5 h-5 text-stone-400" />}
                </div>

                <h4 className="text-xs font-bold text-stone-900 truncate w-full mb-1">
                  {badge.title}
                </h4>

                <p className="text-[10px] text-stone-500 line-clamp-2 h-7 font-normal mb-2 leading-tight">
                  {badge.desc}
                </p>

                <div className="w-full">
                  {isUnlocked ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-200">
                      달성 완료
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-medium text-stone-500 bg-stone-200/70 px-2 py-0.5 rounded-full inline-block">
                      {badge.currentProgress}/{badge.targetProgress} {badge.progressUnit}
                    </span>
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

      {/* ================= BADGE DETAIL MODAL ================= */}
      <AnimatePresence>
        {selectedBadgeModal && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            onClick={() => setSelectedBadgeModal(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm wabi-glass-card bg-white/95 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/60 select-none text-stone-900 text-center relative overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setSelectedBadgeModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 rounded-3xl bg-stone-900 text-white border border-stone-800 shadow-xl flex items-center justify-center text-4xl mx-auto mb-4">
                {selectedBadgeModal.currentProgress >= selectedBadgeModal.targetProgress ? selectedBadgeModal.icon : '🔒'}
              </div>

              <span className="text-[10px] font-mono font-bold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-stone-200">
                {selectedBadgeModal.category}
              </span>

              <h3 className="text-lg font-black text-stone-900 mb-1">
                {selectedBadgeModal.title}
              </h3>

              <p className="text-xs text-stone-600 leading-relaxed mb-4 font-medium">
                {selectedBadgeModal.desc}
              </p>

              <div className="p-3.5 bg-stone-50/90 rounded-2xl border border-stone-200/80 mb-4 text-left space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>달성 진행 상황</span>
                  <span className="font-mono text-stone-900 font-black">
                    {selectedBadgeModal.currentProgress} / {selectedBadgeModal.targetProgress} {selectedBadgeModal.progressUnit}
                  </span>
                </div>

                <p className="text-[11px] text-stone-500 font-medium pt-1 border-t border-stone-200">
                  💡 <strong>획득 팁:</strong> {selectedBadgeModal.tip}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBadgeModal(null)}
                className="wabi-glass-bubble w-full py-3 bg-stone-900 text-white font-black text-xs rounded-xl hover:bg-stone-800 transition-colors cursor-pointer shadow-md"
              >
                닫기
              </button>
            </motion.div>
          </div>
        )}
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
