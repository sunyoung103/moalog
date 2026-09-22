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

  // Calculate Donut Segment Offsets for Biological Group
  const plantOffset = 0;
  const insectOffset = -plantPct;
  const birdOffset = -(plantPct + insectPct);
  const invertOffset = -(plantPct + insectPct + birdPct);
  const mammalOffset = -(plantPct + insectPct + birdPct + invertPct);
  const herpOffset = -(plantPct + insectPct + birdPct + invertPct + mammalPct);
  const fishOffset = -(plantPct + insectPct + birdPct + invertPct + mammalPct + herpPct);
  const fungiOffset = -(plantPct + insectPct + birdPct + invertPct + mammalPct + herpPct + fishPct);

  // Calculate Donut Segment Offsets for Habitat Coverage
  const hab1Offset = 0;
  const hab2Offset = -45;
  const hab3Offset = -75;
  const hab4Offset = -90;

  return (
    <div className="space-y-4 pb-12 select-none" id="report-view-container">
      {/* ========================================================
          1. DYNAMIC OBSERVATION ARCHETYPE & OBSERVER PERSONA (TOP)
          ======================================================== */}
      <section className="wabi-glass-card rounded-3xl p-5 shadow-md border border-white/80 bg-white/85 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white border border-stone-800 flex items-center justify-center shrink-0 shadow-md">
              <CurrentIcon className="w-5 h-5 stroke-[2.2px]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-stone-500 font-bold uppercase tracking-wider">
                  ACTIVE OBSERVER PERSONA
                </span>
                <span className="text-[9px] font-bold bg-stone-100 text-stone-800 px-1.5 py-0.2 rounded font-mono border border-stone-200">
                  실시간 연동
                </span>
              </div>
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <span>관찰자 유형: {activePersona.title}</span>
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPersonaModalOpen(true)}
            className="wabi-glass-bubble flex items-center gap-1 text-[11px] font-bold text-stone-700 hover:text-stone-950 bg-stone-100/90 hover:bg-stone-200/80 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer shadow-2xs shrink-0 border border-stone-200/80"
          >
            <SlidersHorizontal className="w-3 h-3 text-stone-600" />
            <span>성향 변경</span>
          </button>
        </div>

        {/* Dynamic Archetype Profile Card */}
        <div className="wabi-glass-dark bg-stone-900 text-white rounded-2xl p-4 border border-stone-800 mb-4 shadow-lg relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-black text-stone-950 bg-white px-2.5 py-0.5 rounded-lg font-mono shadow-sm">
                  {activePersona.title}
                </span>
                <span className="text-[11px] font-mono text-stone-300 font-extrabold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-stone-300" />
                  <span>탐사 성향 프로필</span>
                </span>
              </div>
              <p className="text-xs text-stone-200 leading-relaxed font-medium">
                {activePersona.description}
              </p>
            </div>
          </div>

          {/* Biological Group Spectrum Ratio */}
          <div className="pt-2 border-t border-stone-800 relative z-10 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-300">
              <span>수집 생물군 분포 비중</span>
              <span className="text-[10px] text-stone-400 font-mono">총 {collectedList.length}종 수집</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 text-stone-900">
              <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-white/95 rounded-xl border border-white/20 shadow-2xs">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  🌿 식물
                </span>
                <span className="font-mono font-black text-stone-900">{plantPct}%</span>
              </div>

              <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-white/95 rounded-xl border border-white/20 shadow-2xs">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  🐞 곤충
                </span>
                <span className="font-mono font-black text-stone-900">{insectPct}%</span>
              </div>

              <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-white/95 rounded-xl border border-white/20 shadow-2xs">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  🪶 조류
                </span>
                <span className="font-mono font-black text-stone-900">{birdPct}%</span>
              </div>

              <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-white/95 rounded-xl border border-white/20 shadow-2xs">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  🕷️ 거미&연체
                </span>
                <span className="font-mono font-black text-stone-900">{invertPct}%</span>
              </div>

              <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-white/95 rounded-xl border border-white/20 shadow-2xs">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  🐾 포유류
                </span>
                <span className="font-mono font-black text-stone-900">{mammalPct}%</span>
              </div>

              <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-white/95 rounded-xl border border-white/20 shadow-2xs">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  🐸 양서&파충
                </span>
                <span className="font-mono font-black text-stone-900">{herpPct}%</span>
              </div>

              <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-white/95 rounded-xl border border-white/20 shadow-2xs">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  🐟 어류
                </span>
                <span className="font-mono font-black text-stone-900">{fishPct}%</span>
              </div>

              <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-white/95 rounded-xl border border-white/20 shadow-2xs">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-700" />
                  🍄 균류
                </span>
                <span className="font-mono font-black text-stone-900">{fungiPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Observation Specialty Journal Summary */}
        <RecentSpecimenBasket
          specimens={specimens}
          onSelectSpecimen={onSelectSpecimen}
          title="최근 포착된 주요 표본"
        />
      </section>

      {/* ========================================================
          2. CONSOLIDATED EXPLORATION & BIODIVERSITY SPECTRUM
          (월별 탐사 추이 + 생물 다양성 + 서식지 커버리지 통합 뷰)
          ======================================================== */}
      <section className="wabi-glass-card rounded-3xl p-5 shadow-md border border-white/80 bg-white/85 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-stone-900 text-white border border-stone-800 flex items-center justify-center shrink-0 shadow-sm">
              <PieChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-stone-900">생태 탐사 및 다양성 스펙트럼</h3>
                <span className="text-[9px] font-bold bg-stone-100 text-stone-800 px-1.5 py-0.2 rounded font-mono border border-stone-200">
                  실측 탐사 데이터
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium">월별 관찰 빈도 곡선과 분류군·서식지 도넛 파이 분석</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
            총 {collectedList.length}개 표본 기록됨
          </span>
        </div>

        {/* 1. Monthly Exploration Trend (Sparkline Curve) - 12-Month Continuous Observation */}
        <div className="p-4 rounded-2xl bg-stone-50/90 border border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-700" />
              <span>연간 12개월 탐사 추이</span>
            </h4>
            <span className="text-[10px] font-mono font-bold text-stone-800 bg-stone-200/70 px-2 py-0.5 rounded-full border border-stone-300">
              12개월 탐사 로그
            </span>
          </div>

          {/* SVG Smooth Continuous Sparkline across all 12 months */}
          <div className="relative pt-1 pb-1">
            <svg className="w-full h-24 overflow-visible" viewBox="0 0 320 80">
              <defs>
                <linearGradient id="annualCurveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#18181b" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#18181b" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#71717a" />
                  <stop offset="50%" stopColor="#18181b" />
                  <stop offset="100%" stopColor="#52525b" />
                </linearGradient>
              </defs>

              {/* Baseline Grid lines */}
              <line x1="10" y1="65" x2="310" y2="65" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="10" y1="35" x2="310" y2="35" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2 2" />

              {/* Filled Area below spline */}
              <path
                d="M 10 65 L 10 48 Q 23 42 36 38 Q 49 32 62 25 Q 75 14 88 10 Q 101 8 114 12 Q 127 18 140 22 Q 153 20 166 18 Q 179 16 192 20 Q 205 28 218 32 Q 231 36 244 38 Q 257 44 270 48 Q 283 52 296 55 Q 309 58 310 58 L 310 65 Z"
                fill="url(#annualCurveGrad)"
              />

              {/* Continuous Spline Path */}
              <path
                d="M 10 48 Q 23 42 36 38 Q 49 32 62 25 Q 75 14 88 10 Q 101 8 114 12 Q 127 18 140 22 Q 153 20 166 18 Q 179 16 192 20 Q 205 28 218 32 Q 231 36 244 38 Q 257 44 270 48 Q 283 52 296 55 Q 309 58 310 58"
                fill="none"
                stroke="url(#lineStrokeGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Monthly Active Observation Data Points (1~12월) */}
              <circle cx="10" cy="48" r="2.5" fill="#ffffff" stroke="#18181b" strokeWidth="1.5" />
              <circle cx="36" cy="38" r="2.5" fill="#ffffff" stroke="#18181b" strokeWidth="1.5" />
              <circle cx="62" cy="25" r="2.5" fill="#ffffff" stroke="#27272a" strokeWidth="1.5" />
              <circle cx="88" cy="10" r="3.5" fill="#ffffff" stroke="#09090b" strokeWidth="2" />
              <circle cx="114" cy="12" r="3.5" fill="#ffffff" stroke="#09090b" strokeWidth="2" />
              <circle cx="140" cy="22" r="2.5" fill="#ffffff" stroke="#27272a" strokeWidth="1.5" />
              <circle cx="166" cy="18" r="2.5" fill="#ffffff" stroke="#3f3f46" strokeWidth="1.5" />
              <circle cx="192" cy="20" r="3" fill="#ffffff" stroke="#27272a" strokeWidth="2" />
              <circle cx="218" cy="32" r="2.5" fill="#ffffff" stroke="#52525b" strokeWidth="1.5" />
              <circle cx="244" cy="38" r="2.5" fill="#ffffff" stroke="#71717a" strokeWidth="1.5" />
              <circle cx="270" cy="48" r="2.5" fill="#ffffff" stroke="#71717a" strokeWidth="1.5" />
              <circle cx="296" cy="55" r="2.5" fill="#ffffff" stroke="#a1a1aa" strokeWidth="1.5" />
            </svg>

            {/* 12-Month Labels (1월~12월 매월) */}
            <div className="grid grid-cols-12 text-center font-mono text-[9px] font-bold border-t border-stone-200/60 pt-1.5 text-stone-500">
              <span>1월</span>
              <span>2월</span>
              <span className="text-stone-700">3월</span>
              <span className="text-stone-900 font-black">4월</span>
              <span className="text-stone-900 font-black">5월</span>
              <span className="text-stone-700">6월</span>
              <span className="text-stone-700">7월</span>
              <span className="text-stone-900 font-black">8월</span>
              <span className="text-stone-700">9월</span>
              <span>10월</span>
              <span>11월</span>
              <span>12월</span>
            </div>
          </div>
        </div>

        {/* 2. Donut & Pie Pair Row: 생물 분류군 다양성 (Donut) + 서식지 커버리지 (Donut) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* 2-A. Taxonomic Group Donut Chart */}
          <div className="bg-stone-50/90 rounded-2xl p-4 border border-stone-200/80 space-y-3 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-stone-700" />
                <h4 className="text-xs font-black text-stone-900">생물 분류군 다양성</h4>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-stone-200 text-stone-800 font-bold border border-stone-300">
                수집 분류군
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* SVG Donut Chart */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="5"
                  />
                  {/* Plant Segment */}
                  {plantPct > 0 && (
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="5"
                      strokeDasharray={`${plantPct}, 100`}
                      strokeDashoffset={plantOffset}
                    />
                  )}
                  {/* Insect Segment */}
                  {insectPct > 0 && (
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="5"
                      strokeDasharray={`${insectPct}, 100`}
                      strokeDashoffset={insectOffset}
                    />
                  )}
                  {/* Bird Segment */}
                  {birdPct > 0 && (
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="5"
                      strokeDasharray={`${birdPct}, 100`}
                      strokeDashoffset={birdOffset}
                    />
                  )}
                  {/* Invertebrates Segment */}
                  {invertPct > 0 && (
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="5"
                      strokeDasharray={`${invertPct}, 100`}
                      strokeDashoffset={invertOffset}
                    />
                  )}
                  {/* Mammal Segment */}
                  {mammalPct > 0 && (
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="5"
                      strokeDasharray={`${mammalPct}, 100`}
                      strokeDashoffset={mammalOffset}
                    />
                  )}
                  {/* Herptiles Segment */}
                  {herpPct > 0 && (
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#14b8a6"
                      strokeWidth="5"
                      strokeDasharray={`${herpPct}, 100`}
                      strokeDashoffset={herpOffset}
                    />
                  )}
                  {/* Fish Segment */}
                  {fishPct > 0 && (
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="5"
                      strokeDasharray={`${fishPct}, 100`}
                      strokeDashoffset={fishOffset}
                    />
                  )}
                  {/* Fungi Segment */}
                  {fungiPct > 0 && (
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e11d48"
                      strokeWidth="5"
                      strokeDasharray={`${fungiPct}, 100`}
                      strokeDashoffset={fungiOffset}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-xs font-black text-stone-900">{collectedList.length}종</span>
                  <span className="text-[8px] text-stone-400 font-bold">수집 완료</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-stone-700 font-medium text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    🌿 식물
                  </span>
                  <span className="font-mono font-bold text-stone-900 text-[11px]">{plantCount}종 ({plantPct}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-stone-700 font-medium text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    🐞 곤충
                  </span>
                  <span className="font-mono font-bold text-stone-900 text-[11px]">{insectCount}종 ({insectPct}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-stone-700 font-medium text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-sky-600" />
                    🪶 조류
                  </span>
                  <span className="font-mono font-bold text-stone-900 text-[11px]">{birdCount}종 ({birdPct}%)</span>
                </div>
                {invertCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-stone-700 font-medium text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    🕷️ 거미&연체
                  </span>
                  <span className="font-mono font-bold text-stone-900 text-[11px]">{invertCount}종 ({invertPct}%)</span>
                </div>
                )}
                {mammalCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-stone-700 font-medium text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-amber-700" />
                    🐾 포유류
                  </span>
                  <span className="font-mono font-bold text-stone-900 text-[11px]">{mammalCount}종 ({mammalPct}%)</span>
                </div>
                )}
                {herpCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-stone-700 font-medium text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    🐸 양서&파충
                  </span>
                  <span className="font-mono font-bold text-stone-900 text-[11px]">{herpCount}종 ({herpPct}%)</span>
                </div>
                )}
                {fishCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-stone-700 font-medium text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    🐟 어류
                  </span>
                  <span className="font-mono font-bold text-stone-900 text-[11px]">{fishCount}종 ({fishPct}%)</span>
                </div>
                )}
                {fungiCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-stone-700 font-medium text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    🍄 균류
                  </span>
                  <span className="font-mono font-bold text-stone-900 text-[11px]">{fungiCount}종 ({fungiPct}%)</span>
                </div>
                )}
              </div>
            </div>
          </div>

          {/* 2-B. Habitat Environmental Coverage Donut Chart */}
          <div className="bg-stone-50/90 rounded-2xl p-4 border border-stone-200/80 space-y-3 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-700" />
                <h4 className="text-xs font-black text-stone-900">서식지 환경 분포</h4>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-stone-200 text-stone-800 font-bold border border-stone-300">
                4대 환경 비율
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* SVG Donut Chart for Habitat */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="5"
                  />
                  {/* Segment 1: Urban Park (45%) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="5"
                    strokeDasharray="45, 100"
                    strokeDashoffset={hab1Offset}
                  />
                  {/* Segment 2: Forest (30%) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="5"
                    strokeDasharray="30, 100"
                    strokeDashoffset={hab2Offset}
                  />
                  {/* Segment 3: Wetland / River (15%) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="5"
                    strokeDasharray="15, 100"
                    strokeDashoffset={hab3Offset}
                  />
                  {/* Segment 4: Residential / Grass (10%) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="5"
                    strokeDasharray="10, 100"
                    strokeDashoffset={hab4Offset}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-xs font-black text-stone-900">4대</span>
                  <span className="text-[8px] text-stone-400 font-bold">서식지</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-1 text-xs">
                {habitatDistribution.map((h) => (
                  <div key={h.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-stone-700 font-medium text-[11px]">
                      <span className={`w-2 h-2 rounded-full ${h.bgClass}`} />
                      {h.name}
                    </span>
                    <span className="font-mono font-bold text-stone-900 text-[11px]">{h.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Conservation Status & Ecological Trait Tag Cloud */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          {/* Nativeness / Conservation */}
          <div className="sm:col-span-6 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>자생종 및 보전 등급</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-stone-800 bg-stone-200/80 px-2 py-0.5 rounded-md border border-stone-300">
                자생종 비율 {nativePctCalc}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-white/90 rounded-xl border border-stone-200/60 shadow-2xs">
                <span className="text-[10px] text-stone-500 font-bold block">자생종</span>
                <span className="text-sm font-black font-mono text-stone-900">{nativeCount}종</span>
              </div>
              <div className="p-2 bg-white/90 rounded-xl border border-stone-200/60 shadow-2xs">
                <span className="text-[10px] text-stone-500 font-bold block">귀화/외래종</span>
                <span className="text-sm font-black font-mono text-stone-800">{introducedCount}종</span>
              </div>
              <div className="p-2 bg-white/90 rounded-xl border border-stone-200/60 shadow-2xs">
                <span className="text-[10px] text-stone-500 font-bold block">관심대상(LC)</span>
                <span className="text-sm font-black font-mono text-stone-900">{lcCount}종</span>
              </div>
            </div>
          </div>

          {/* High-Frequency Ecological Trait Tag Cloud */}
          <div className="sm:col-span-6 p-3.5 bg-stone-50/90 rounded-2xl border border-stone-200/80 space-y-2">
            <span className="text-xs font-black text-stone-900 flex items-center gap-1">
              🏷️ 주요 생태 태그
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { tag: '#텃새', count: '12회' },
                { tag: '#도심적응', count: '15회' },
                { tag: '#자생초본', count: '8회' },
                { tag: '#수분매개', count: '6회' },
                { tag: '#주행성', count: '18회' },
              ].map((t) => (
                <span
                  key={t.tag}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-lg border border-stone-200/90 bg-stone-100/90 text-stone-800 flex items-center gap-1 shadow-2xs"
                >
                  <span>{t.tag}</span>
                  <span className="text-[9px] opacity-70 font-mono font-normal">({t.count})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. TROPHY CABINET & ACHIEVEMENT BADGES (WABI 3D GLASS)
          ======================================================== */}
      <section className="wabi-glass-card rounded-3xl p-5 shadow-md border border-white/80 bg-white/85 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-stone-900 text-white border border-stone-800 flex items-center justify-center shrink-0 shadow-sm">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-stone-900">업적 뱃지 보관함</h3>
                <span className="text-[10px] font-mono font-black text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                  {unlockedBadgesCount} / {ALL_BADGES.length} 획득
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium">탐사 마일스톤 및 주요 생태 도전 과제 달성 현황</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-stone-100/90 p-1 rounded-xl border border-stone-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setBadgeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                badgeFilter === 'all' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              전체 ({ALL_BADGES.length})
            </button>
            <button
              type="button"
              onClick={() => setBadgeFilter('unlocked')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                badgeFilter === 'unlocked' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              획득 ({unlockedBadgesCount})
            </button>
            <button
              type="button"
              onClick={() => setBadgeFilter('locked')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                badgeFilter === 'locked' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              미해제 ({ALL_BADGES.length - unlockedBadgesCount})
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
                className={`p-4 rounded-2xl flex flex-col items-center justify-between text-center transition-all cursor-pointer relative overflow-hidden group active:scale-95 ${
                  isUnlocked
                    ? 'wabi-glass-dark bg-stone-900 text-white shadow-lg border border-white/20 hover:border-white/40'
                    : 'wabi-glass-panel bg-stone-50/90 text-stone-800 border border-stone-200/80 hover:bg-stone-100/90'
                }`}
              >
                {/* Glow for unlocked */}
                {isUnlocked && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:bg-white/15 transition-all" />
                )}

                {/* Badge Icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2.5 shadow-sm transition-transform group-hover:scale-110 ${
                  isUnlocked
                    ? 'bg-white/15 text-white border border-white/25 shadow-inner'
                    : 'bg-stone-200/80 text-stone-400 border border-stone-300/60'
                }`}>
                  {isUnlocked ? badge.icon : <Lock className="w-5 h-5 text-stone-400" />}
                </div>

                <h4 className={`text-xs font-black tracking-tight mb-1 ${isUnlocked ? 'text-white' : 'text-stone-900'}`}>
                  {badge.title}
                </h4>

                <p className={`text-[10px] leading-tight mb-3 line-clamp-2 h-7 font-medium ${
                  isUnlocked ? 'text-stone-300' : 'text-stone-500'
                }`}>
                  {badge.desc}
                </p>

                {/* Status Tag */}
                <div className="w-full">
                  {isUnlocked ? (
                    <div className="inline-flex items-center gap-1 text-[9px] font-black bg-white text-stone-950 px-2 py-1 rounded-full shadow-xs w-full justify-center">
                      <CheckCircle2 className="w-3 h-3 fill-stone-950 text-white" />
                      <span>달성 완료</span>
                    </div>
                  ) : (
                    <div className="text-[9px] font-mono text-stone-500 font-bold bg-stone-200/70 py-1 px-2 rounded-full">
                      <span>{badge.currentProgress} / {badge.targetProgress} {badge.progressUnit}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
