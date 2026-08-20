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
  TrendingUp,
  RefreshCw,
  X,
  Check,
  Camera,
  BookOpen,
  PieChart, BarChart3,
  Sun,
  Sunrise,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Specimen, UserStats, NaturalistPersona } from '../types';
import { NATURALIST_PERSONAS, SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';

interface ReportViewProps {
  specimens: Specimen[];
  userStats: UserStats;
  onUpdatePersona: (persona: NaturalistPersona) => void;
  onSelectSpecimen: (sp: Specimen) => void;
  onOpenLens: () => void;
  onOpenHotspots: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  specimens,
  userStats,
  onUpdatePersona,
  onSelectSpecimen,
  onOpenLens,
}) => {
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);

  const currentPersonaKey = userStats.persona || 'general';
  const currentPersona = NATURALIST_PERSONAS[currentPersonaKey] || NATURALIST_PERSONAS.general;

  const collectedList = specimens.filter((s) => s.isCollected && !s.isPending);
  const totalPossibleSpecies = SPECIES_ECOLOGY_ENCYCLOPEDIA.length;
  const completionRate = totalPossibleSpecies > 0
    ? Math.round((collectedList.length / totalPossibleSpecies) * 100)
    : 0;

  // Category counts
  const plantCount = collectedList.filter((s) => s.category === 'plants').length;
  const birdCount = collectedList.filter((s) => s.category === 'birds').length;
  const insectCount = collectedList.filter((s) => s.category === 'insects').length;
  const mammalCount = collectedList.filter((s) => s.category === 'mammals').length;
  const totalCollectedCount = collectedList.length || 1;

  const plantPct = Math.round((plantCount / totalCollectedCount) * 100);
  const birdPct = Math.round((birdCount / totalCollectedCount) * 100);
  const insectPct = Math.round((insectCount / totalCollectedCount) * 100);
  const mammalPct = Math.round((mammalCount / totalCollectedCount) * 100);

  // Seasonal counts
  const seasonStats = {
    spring: 0,
    summer: 0,
    autumn: 0,
    winter: 0,
  };

  collectedList.forEach((sp) => {
    sp.observations?.forEach((obs) => {
      const dateStr = obs.date || '';
      const month = parseInt(dateStr.split('.')[1] || '0', 10);
      if (month >= 3 && month <= 5) seasonStats.spring += 1;
      else if (month >= 6 && month <= 8) seasonStats.summer += 1;
      else if (month >= 9 && month <= 11) seasonStats.autumn += 1;
      else if (month === 12 || month === 1 || month === 2) seasonStats.winter += 1;
      else seasonStats.summer += 1; // default fallback
    });
  });

  if (collectedList.length > 0 && seasonStats.spring === 0 && seasonStats.summer === 0 && seasonStats.autumn === 0 && seasonStats.winter === 0) {
    seasonStats.summer = collectedList.length;
  }

  // Monthly breakdown
  const monthlyData = [
    { month: '3월', count: seasonStats.spring > 0 ? Math.ceil(seasonStats.spring * 0.4) : 0 },
    { month: '4월', count: seasonStats.spring > 0 ? Math.ceil(seasonStats.spring * 0.6) : 0 },
    { month: '5월', count: seasonStats.spring > 0 ? Math.ceil(seasonStats.spring * 0.5) : 0 },
    { month: '6월', count: seasonStats.summer > 0 ? Math.ceil(seasonStats.summer * 0.3) : 0 },
    { month: '7월', count: seasonStats.summer > 0 ? Math.ceil(seasonStats.summer * 0.3) : 0 },
    { month: '8월', count: seasonStats.summer > 0 ? Math.max(1, Math.ceil(seasonStats.summer * 0.4)) : 0 },
    { month: '9월', count: seasonStats.autumn > 0 ? Math.ceil(seasonStats.autumn * 0.5) : 0 },
    { month: '10월', count: seasonStats.autumn > 0 ? Math.ceil(seasonStats.autumn * 0.5) : 0 },
  ];

  const maxMonthCount = Math.max(...monthlyData.map((m) => m.count), 1);

  // All Badges list
  const BADGES = [
    {
      id: 'badge-01',
      title: '첫 생물 포착자',
      icon: '🌟',
      desc: '첫 번째 생태 도감 표본을 촬영하여 등록 완료',
      unlocked: collectedList.length >= 1,
      category: '탐험 시작',
    },
    {
      id: 'badge-02',
      title: '5일 연속 관찰가',
      icon: '🔥',
      desc: '5일 연속으로 자연 생태를 관찰하고 기록',
      unlocked: (userStats.streakDays || 0) >= 5,
      category: '연속 탐험',
    },
    {
      id: 'badge-03',
      title: '식물 분류 박사',
      icon: '🌿',
      desc: '야생화, 교목 등 식물 표본 3종 이상 수집',
      unlocked: plantCount >= 3,
      category: '식물학',
    },
    {
      id: 'badge-04',
      title: '도시 탐조가 (Birder)',
      icon: '🪶',
      desc: '도심 텃새 및 야생 조류 표본 관찰 및 등록',
      unlocked: birdCount >= 2,
      category: '조류학',
    },
    {
      id: 'badge-05',
      title: '미소 생태 탐험가',
      icon: '🐞',
      desc: '나비, 꿀벌 등 곤충류 표본 2종 이상 수집',
      unlocked: insectCount >= 2,
      category: '곤충학',
    },
    {
      id: 'badge-06',
      title: '서식지 개척자',
      icon: '🗺️',
      desc: '3곳 이상의 다양한 생태 서식지 탐험 완료',
      unlocked: (userStats.exploredHabitats?.length || 0) >= 3,
      category: '필드 탐사',
    },
    {
      id: 'badge-07',
      title: 'S등급 예술 사진가',
      icon: '✨',
      desc: '피사체 구도 및 조명 Art Score 90점 이상 달성',
      unlocked: collectedList.some((s) => (s.artScore || 0) >= 90),
      category: '생태 아트',
    },
    {
      id: 'badge-08',
      title: '전설의 탐험가',
      icon: '👑',
      desc: '도감 수집 완성률 50% 이상 돌파',
      unlocked: completionRate >= 50,
      category: '마스터',
    },
  ];

  // All Available 5 Personas for Selection
  const personaOptions: {
    id: NaturalistPersona;
    icon: any;
    title: string;
    level: string;
    desc: string;
    tags: string[];
    accentBg: string;
  }[] = [
    {
      id: 'general',
      icon: Compass,
      title: '만능 탐험가',
      level: 'Lv.3 전천후 관찰자',
      desc: '식물, 조류, 곤충 등 다양한 생물군을 관찰해요.',
      tags: ['식물', '조류', '곤충', '다양성'],
      accentBg: 'bg-emerald-600',
    },
    {
      id: 'botanist',
      icon: Leaf,
      title: '식물 탐험가',
      level: 'Lv.4 식물도감 큐레이터',
      desc: '야생화, 나무, 풀 등 다양한 식물류를 관찰해요.',
      tags: ['야생화', '나무', '풀', '형태학'],
      accentBg: 'bg-emerald-500',
    },
    {
      id: 'birder',
      icon: Feather,
      title: '조류 탐험가',
      level: 'Lv.4 조류 생태 마스터',
      desc: '텃새, 철새, 물새 등 다양한 조류를 관찰해요.',
      tags: ['텃새', '철새', '물새', '탐조'],
      accentBg: 'bg-sky-600',
    },
    {
      id: 'entomologist',
      icon: Bug,
      title: '곤충 탐험가',
      level: 'Lv.3 곤충 분류학자',
      desc: '나비, 잠자리, 딱정벌레 등 다양한 곤충류를 관찰해요.',
      tags: ['나비', '잠자리', '딱정벌레', '수분매개'],
      accentBg: 'bg-amber-500',
    },
    {
      id: 'mammalogist',
      icon: Cat,
      title: '포유류 탐험가',
      level: 'Lv.4 야생동물 서식지 추적자',
      desc: '다람쥐, 청설모, 고라니 등 포유류와 동물 발자국을 관찰해요.',
      tags: ['포유류', '발자국', '생태통로', '야생동물'],
      accentBg: 'bg-amber-600',
    },
  ];

  const getPersonaIcon = (pId: string) => {
    switch (pId) {
      case 'botanist': return Leaf;
      case 'birder': return Feather;
      case 'entomologist': return Bug;
      case 'mammalogist': return Cat;
      default: return Compass;
    }
  };

  const CurrentIcon = getPersonaIcon(currentPersonaKey);

  // [EMPTY STATE] 만약 수집된 도감이 하나도 없다면 빈 화면을 보여줍니다.
  if (collectedList.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4 text-stone-300">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-bold text-stone-900 mb-2">아직 분석할 리포트가 없습니다.</h3>
        <p className="text-xs text-stone-500 mb-6 leading-relaxed max-w-[200px]">
          도감을 하나 이상 수집하시면, 나의 관찰 성향과 통계를 분석해 드립니다.
        </p>
        <button
          onClick={onOpenLens}
          className="py-2.5 px-4 bg-stone-900 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-stone-800 transition-all inline-flex items-center gap-1.5"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>렌즈로 첫 생물 포착하기</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12 select-none" id="report-view-container">
      {/* ================= 1. 나의 탐험가 유형 ================= */}
      <section className="relative pb-6 border-b border-stone-200 mb-6">
        <div
          onClick={() => setIsPersonaModalOpen(true)}
          className="w-full cursor-pointer group"
        >
          {/* Top Label & Edit Prompt */}
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-500">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>탐험가 성향</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPersonaModalOpen(true);
              }}
              className="flex items-center gap-1 text-xs font-bold text-stone-400 group-hover:text-stone-600 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>유형 변경</span>
            </button>
          </div>

          {/* Center Explorer Identity Info */}
          <div className="flex items-start gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <CurrentIcon className="w-6 h-6 stroke-[2.2px]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-xl font-black text-stone-900 tracking-tight">
                  {currentPersona.title}
                </h2>
                <span className="text-[10px] font-mono font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md border border-stone-200">
                  {currentPersona.level || 'Lv.3 관찰자'}
                </span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">
                {currentPersona.description}
              </p>
            </div>
          </div>

          {/* Specialty Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2">
            <span className="text-[10px] text-stone-400 font-medium mr-1">관찰 테마:</span>
            {currentPersona.specialtyChips?.map((chip) => (
              <span
                key={chip}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 2. 나의 생태 관심 저널 ================= */}
      <section className="bg-white rounded-3xl p-5 shadow-2xs border border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-stone-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">나의 생태 관심 저널</h3>
              <p className="text-[11px] text-stone-500">도감 수집 현황</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
            {collectedList.length}종 관찰됨
          </span>
        </div>

        {/* 3 Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="bg-[#F2F5F0] p-3 rounded-2xl text-center">
            <span className="text-[10px] text-stone-500 font-bold block mb-1">총 포착</span>
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-lg font-black text-stone-900">{collectedList.length}</span>
              <span className="text-[10px] text-stone-500 font-bold">종</span>
            </div>
          </div>

          <div className="bg-[#F2F5F0] p-3 rounded-2xl text-center">
            <span className="text-[10px] text-stone-500 font-bold block mb-1">연속 관찰</span>
            <div className="flex items-baseline justify-center gap-0.5 text-amber-600">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 inline mr-0.5" />
              <span className="text-lg font-black text-stone-900">{userStats.streakDays || 5}</span>
              <span className="text-[10px] text-stone-500 font-bold">일</span>
            </div>
          </div>

          <div className="bg-[#F2F5F0] p-3 rounded-2xl text-center">
            <span className="text-[10px] text-stone-500 font-bold block mb-1">방문 서식지</span>
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-lg font-black text-stone-900">{userStats.exploredHabitats?.length || 4}</span>
              <span className="text-[10px] text-stone-500 font-bold">곳</span>
            </div>
          </div>
        </div>

        {/* Completion Rate Progress Bar */}
        <div className="bg-[#F2F5F0] p-3.5 rounded-2xl mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-800">생태 백과 도감 완성률</span>
            <span className="text-xs font-black text-emerald-700">{completionRate}%</span>
          </div>
          <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max(5, completionRate)}%` }}
            />
          </div>
          <p className="text-[10px] text-stone-500 mt-1.5 text-right font-mono">
            전체 {totalPossibleSpecies}종 중 {collectedList.length}종 수집
          </p>
        </div>
      </section>

      {/* ================= 3. 나의 관찰 성향 ================= */}
      <section className="bg-white rounded-3xl p-5 shadow-2xs border border-stone-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
            <PieChart className="w-4 h-4 text-stone-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-stone-900">나의 관찰 성향</h3>
            <p className="text-[11px] text-stone-500">생물군별 수집 비율 및 탐험 스타일 분석</p>
          </div>
        </div>

        {/* Category Distribution Bar */}
        <div className="space-y-3 mb-4">
          {/* Multi-color stacked segment bar */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-stone-100">
            <div style={{ width: `${plantPct}%` }} className="bg-emerald-500 h-full transition-all" title={`식물 ${plantPct}%`} />
            <div style={{ width: `${birdPct}%` }} className="bg-sky-500 h-full transition-all" title={`조류 ${birdPct}%`} />
            <div style={{ width: `${insectPct}%` }} className="bg-amber-500 h-full transition-all" title={`곤충 ${insectPct}%`} />
            <div style={{ width: `${mammalPct}%` }} className="bg-orange-500 h-full transition-all" title={`포유류 ${mammalPct}%`} />
          </div>

          {/* Category Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-[#F2F5F0] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>🌿 식물</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800">{plantCount}종 ({plantPct}%)</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F2F5F0] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>🪶 조류</span>
              </div>
              <span className="text-xs font-mono font-bold text-sky-800">{birdCount}종 ({birdPct}%)</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F2F5F0] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>🐞 곤충</span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-800">{insectCount}종 ({insectPct}%)</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F2F5F0] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>🐾 포유류</span>
              </div>
              <span className="text-xs font-mono font-bold text-orange-800">{mammalCount}종 ({mammalPct}%)</span>
            </div>
          </div>
        </div>

        {/* Observation Style AI Diagnostic summary card */}
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
          <div className="flex items-start gap-2.5">
            <span className="text-lg">💡</span>
            <div className="flex-1 text-xs text-stone-700 leading-relaxed">
              <strong className="text-stone-950 font-bold block mb-0.5">
                {plantPct >= 50
                  ? '도심 야생화와 틈새 식물에 높은 집중도를 보이는 식물 애호가입니다.'
                  : birdPct >= 40
                  ? '날카로운 관찰력으로 텃새와 물새를 찾아내는 탐조형 관찰자입니다.'
                  : '다양한 생물군을 고르게 탐색하는 전천후 생태 탐험가입니다.'}
              </strong>
              오전 9시~오후 2시 시간대와 도심 공원 서식지에서 가장 높은 포착률을 보이고 있습니다.
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4. 시기별 포착 ================= */}
      <section className="bg-white rounded-3xl p-5 shadow-2xs border border-stone-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-stone-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-stone-900">시기별 포착</h3>
            <p className="text-[11px] text-stone-500">계절별 활동량</p>
          </div>
        </div>

        {/* 4 Season Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-center">
            <span className="text-base block mb-0.5">🌸 봄</span>
            <span className="text-[10px] text-stone-500 font-bold block">3월~5월</span>
            <span className="text-sm font-black text-stone-900 font-mono mt-1 block">
              {seasonStats.spring}건
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-center">
            <span className="text-base block mb-0.5">☀️ 여름</span>
            <span className="text-[10px] text-stone-500 font-bold block">6월~8월</span>
            <span className="text-sm font-black text-stone-900 font-mono mt-1 block">
              {seasonStats.summer}건
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-center">
            <span className="text-base block mb-0.5">🍁 가을</span>
            <span className="text-[10px] text-stone-500 font-bold block">9월~11월</span>
            <span className="text-sm font-black text-stone-900 font-mono mt-1 block">
              {seasonStats.autumn}건
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-center">
            <span className="text-base block mb-0.5">❄️ 겨울</span>
            <span className="text-[10px] text-stone-500 font-bold block">12월~2월</span>
            <span className="text-sm font-black text-stone-900 font-mono mt-1 block">
              {seasonStats.winter}건
            </span>
          </div>
        </div>

        {/* Monthly Activity Histogram Bar Chart */}
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100">
          <h4 className="text-[11px] font-bold text-stone-700 mb-3 flex items-center justify-between">
            <span>월별 관찰 빈도 (포착 건수)</span>
            <span className="text-[10px] text-stone-500 font-normal">2026 연간</span>
          </h4>

          <div className="flex items-end justify-between gap-1.5 h-24 pt-2 px-1">
            {monthlyData.map((m) => {
              const heightPct = Math.max(12, Math.round((m.count / maxMonthCount) * 100));
              const isActive = m.count > 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[9px] font-mono font-bold text-stone-600">
                    {m.count > 0 ? m.count : ''}
                  </span>
                  <div
                    className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 ${
                      isActive ? 'bg-[#202424]' : 'bg-stone-300/50'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] font-medium text-stone-500">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= 5. 내 뱃지 ================= */}
      <section className="bg-white rounded-3xl p-5 shadow-2xs border border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
              <Award className="w-4 h-4 text-stone-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">내 뱃지</h3>
              <p className="text-[11px] text-stone-500">생태 탐험 업적 및 획득 배지</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-xl">
            {BADGES.filter((b) => b.unlocked).length} / {BADGES.length} 획득
          </span>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {BADGES.map((badge) => {
            const isUnlocked = badge.unlocked;
            return (
              <div
                key={badge.id}
                className={`p-3.5 rounded-2xl text-center flex flex-col items-center justify-between transition-all border ${
                  isUnlocked
                    ? 'bg-stone-50 border-stone-200 shadow-2xs'
                    : 'bg-stone-50 border-stone-100 opacity-60'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2 bg-white shadow-2xs border border-stone-100">
                  {isUnlocked ? badge.icon : '🔒'}
                </div>

                <h4 className="text-xs font-bold text-stone-900 tracking-tight mb-0.5">
                  {badge.title}
                </h4>
                <p className="text-[10px] text-stone-500 leading-tight mb-2 line-clamp-2">
                  {badge.desc}
                </p>

                {isUnlocked ? (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-stone-700 bg-stone-200 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    달성 완료
                  </span>
                ) : (
                  <span className="text-[9px] font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                    도전 중
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= PERSONA CHANGE MODAL ================= */}
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
              className="w-full max-w-lg bg-[#F8FAF7] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col text-stone-900 border border-stone-300 select-none overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    탐험가 유형 변경
                  </h3>
                  <p className="text-xs text-stone-500">
                    원하는 생태 관찰 성향을 선택하세요.
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

              {/* Persona Options List */}
              <div className="space-y-2.5 py-4 overflow-y-auto pr-1 flex-1 scrollbar-none">
                {personaOptions.map((opt) => {
                  const IconC = opt.icon;
                  const isSelected = currentPersonaKey === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onUpdatePersona(opt.id);
                        setIsPersonaModalOpen(false);
                      }}
                      className={`w-full p-4 rounded-2xl text-left transition-all flex items-start gap-3.5 border cursor-pointer ${
                        isSelected
                          ? 'bg-[#18201E] text-white border-[#18201E] shadow-md'
                          : 'bg-white text-stone-800 border-stone-200 hover:border-emerald-400/60 hover:bg-stone-50'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                          isSelected ? opt.accentBg + ' text-white' : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        <IconC className="w-5 h-5 stroke-[2.2px]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-black truncate">
                              {opt.title}
                            </h4>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                isSelected
                                  ? 'bg-emerald-500/25 text-emerald-300'
                                  : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {opt.level}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3px]" />
                            </div>
                          )}
                        </div>

                        <p
                          className={`text-xs leading-relaxed mb-2 ${
                            isSelected ? 'text-stone-300' : 'text-stone-500'
                          }`}
                        >
                          {opt.desc}
                        </p>

                        <div className="flex items-center gap-1 flex-wrap">
                          {opt.tags.map((t) => (
                            <span
                              key={t}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                isSelected
                                  ? 'bg-white/10 text-stone-200'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Close Button */}
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
