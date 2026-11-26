import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Share2,
  X,
  Camera,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Specimen, UserStats, NaturalistPersona, UserAccount, CommunityMemo } from '../types';
import { NATURALIST_PERSONAS, SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';
import {
  evaluateExplorerBadges,
  EvaluatedBadge,
  TOTAL_POLICY_BADGES_ADULT,
  TOTAL_POLICY_BADGES_UNDER14,
} from '../data/badges';
import { MAP_COMMUNITY_STORAGE_KEYS, INITIAL_COMMUNITY_MEMOS } from '../data/communityMapData';
import { PersonaBadgeIcon } from './PersonaBadgeIcon';
import {
  getLevelFromXp,
  getRequiredXpForLevel,
  getTitleAdjectiveForLevel,
  getUnder14DesignFlags,
  NEW_SPECIES_XP_REWARD,
} from '../utils/levelPolicy';
import { getExplorerTitleInfo } from '../utils/explorerTitles';
import { getSpeciesTaxonomyCategoryLabel } from '../utils/speciesNameHelper';
import { RecentSpecimenBasket } from './RecentSpecimenBasket';

interface ReportViewProps {
  specimens: Specimen[];
  userStats: UserStats;
  userAccount?: UserAccount;
  onUpdatePersona: (persona: NaturalistPersona) => void;
  onSelectSpecimen: (sp: Specimen) => void;
  onOpenLens: () => void;
  onOpenHotspots: () => void;
  onOpenQuestModal: () => void;
  onOpenReportShare?: () => void;
}

interface DonutSlice {
  id: string;
  name: string;
  count: number;
  color: string;
}

const CategoryDonutChart: React.FC<{
  slices: DonutSlice[];
  centerValue: string;
  centerLabel: string;
}> = ({ slices, centerValue, centerLabel }) => {
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  const size = 136;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;

  return (
    <div className="relative w-[136px] h-[136px] shrink-0 flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f4f5f4"
          strokeWidth={strokeWidth}
        />
        {total > 0 &&
          slices
            .filter((s) => s.count > 0)
            .map((slice) => {
              const frac = slice.count / total;
              const dashLen = Math.max(0, frac * circumference - 2);
              const dashOffset = -cumulative * circumference;
              cumulative += frac;
              return (
                <circle
                  key={slice.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLen} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                />
              );
            })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-[20px] font-bold text-[#202320] leading-none tabular-nums">
          {centerValue}
        </span>
        <span className="text-[11px] font-medium text-[#8c948a] mt-1">{centerLabel}</span>
      </div>
    </div>
  );
};

function getSpecimenScore(sp: Specimen): number {
  const obsMeta = sp.observations?.[0]?.analysisMetadata;
  if (obsMeta?.imageClarityScore) return Math.round(obsMeta.imageClarityScore);
  if (typeof sp.confidence === 'number' && sp.confidence > 0) return Math.round(sp.confidence);
  return 85;
}

function getScoreGrade(score: number): 'S' | 'A' | 'B' | 'C' {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  return 'C';
}

function getTierBadgeLabel(tier: EvaluatedBadge['tier']): string {
  switch (tier) {
    case 'bronze':
      return '동 뱃지';
    case 'silver':
      return '은 뱃지';
    case 'gold':
      return '금 뱃지';
    case 'legend':
      return '마스터 뱃지';
  }
}

export const ReportView: React.FC<ReportViewProps> = ({
  specimens,
  userStats,
  userAccount,
  onUpdatePersona,
  onSelectSpecimen,
  onOpenQuestModal,
  onOpenReportShare,
}) => {
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [selectedBadgeModal, setSelectedBadgeModal] = useState<EvaluatedBadge | null>(null);
  const [shareBadgeModal, setShareBadgeModal] = useState<EvaluatedBadge | null>(null);
  const [selectedMonthSlot, setSelectedMonthSlot] = useState<{ ymKey: string; y: number; m: number } | null>(null);
  const [selectedKeywordTag, setSelectedKeywordTag] = useState<string | null>(null);
  const [localToast, setLocalToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setLocalToast(msg);
    setTimeout(() => setLocalToast(null), 2400);
  };

  const safeSpecimens = specimens || [];
  const collectedList = useMemo(
    () => safeSpecimens.filter((s) => s.isCollected && !s.isPending && !s.isDeleted),
    [safeSpecimens]
  );

  // Compute real 8-category slices for a list of specimens
  const buildCategorySlices = (list: Specimen[]): DonutSlice[] => {
    const plantCount = list.filter((s) => s.category === 'plants').length;
    const birdCount = list.filter((s) => s.category === 'birds').length;
    const insectCount = list.filter((s) => s.category === 'insects').length;
    const mammalCount = list.filter((s) => s.category === 'mammals').length;
    const herpCount = list.filter((s) => s.category === 'amphibians' || s.category === 'reptiles').length;
    const fishCount = list.filter((s) => s.category === 'fishes').length;
    const invertCount = list.filter(
      (s) => s.category === 'arachnids' || s.category === 'mollusks' || s.category === 'crustaceans'
    ).length;
    const fungiCount = list.filter((s) => s.category === 'fungi').length;

    return [
      { id: 'plants', name: '식물', count: plantCount, color: '#6B9F0A' },
      { id: 'birds', name: '조류', count: birdCount, color: '#6b9be0' },
      { id: 'insects', name: '곤충', count: insectCount, color: '#f5b800' },
      { id: 'mammals', name: '포유류', count: mammalCount, color: '#c4631c' },
      { id: 'herptiles', name: '양서·파충류', count: herpCount, color: '#00a388' },
      { id: 'fishes', name: '어류', count: fishCount, color: '#1e6ef4' },
      { id: 'invertebrates', name: '무척추동물', count: invertCount, color: '#e8896a' },
      { id: 'fungi', name: '균류', count: fungiCount, color: '#7a5646' },
    ];
  };

  const biodiversitySlices = useMemo(() => buildCategorySlices(collectedList), [collectedList]);
  const activeCategoryCount = biodiversitySlices.filter((s) => s.count > 0).length;

  const streakDays = userStats.streakDays || 0;
  const ALL_BADGES = useMemo(
    () => evaluateExplorerBadges(specimens, userStats, userAccount),
    [specimens, userStats, userAccount]
  );
  const { under14, showShare } = getUnder14DesignFlags(userAccount);
  const totalPolicyBadges = under14 ? TOTAL_POLICY_BADGES_UNDER14 : TOTAL_POLICY_BADGES_ADULT;
  const unlockedBadgesList = ALL_BADGES.filter((b) => b.isUnlocked);
  const unlockedBadgesCount = unlockedBadgesList.length;

  const titleInfo = useMemo(
    () => getExplorerTitleInfo(specimens, userStats, userAccount),
    [specimens, userStats, userAccount]
  );

  const collectedCount = collectedList.length;
  const exp = Math.max(userStats.exp || 0, collectedCount * NEW_SPECIES_XP_REWARD);
  const currentLevel = getLevelFromXp(exp);
  const nextTierLevel =
    currentLevel < 5 ? 5 : currentLevel < 10 ? 10 : currentLevel < 20 ? 20 : currentLevel < 30 ? 30 : null;
  const currentTierBaseXp = getRequiredXpForLevel(
    currentLevel >= 30 ? 30 : currentLevel >= 20 ? 20 : currentLevel >= 10 ? 10 : currentLevel >= 5 ? 5 : 1
  );
  const nextTierXp = nextTierLevel ? getRequiredXpForLevel(nextTierLevel) : exp;
  const levelBarPct = nextTierLevel
    ? Math.min(100, Math.max(6, ((exp - currentTierBaseXp) / Math.max(1, nextTierXp - currentTierBaseXp)) * 100))
    : 100;
  const nextTierTitle = nextTierLevel ? getTitleAdjectiveForLevel(nextTierLevel) : null;

  // Real summary stats (memos & hearts from storage + real observation counts)
  const { myMemoCount, receivedHeartsCount, totalObservationLogsCount } = useMemo(() => {
    let memos: CommunityMemo[] = INITIAL_COMMUNITY_MEMOS;
    try {
      const saved = localStorage.getItem(MAP_COMMUNITY_STORAGE_KEYS.MEMOS);
      if (saved) memos = JSON.parse(saved) as CommunityMemo[];
    } catch {
      // Fallback to seed memos
    }
    const ownMemos = memos.filter((m) => m.authorId === 'me');
    const hearts = ownMemos.reduce((acc, m) => acc + (m.likesCount || 0), 0);
    const obsCount = collectedList.reduce((acc, sp) => acc + (sp.observations?.length || 1), 0);
    return {
      myMemoCount: ownMemos.length,
      receivedHeartsCount: hearts,
      totalObservationLogsCount: obsCount,
    };
  }, [collectedList]);

  const dailyQuests = [
    {
      id: 'q1',
      title: '오늘의 첫 포착',
      reward: '+10 XP',
      done: collectedList.length > 0,
    },
    {
      id: 'q2',
      title: '도감 복습 · 종 상세 3개 보기',
      reward: '+10 XP',
      done: collectedList.length >= 3,
    },
    {
      id: 'q3',
      title: '연속 관찰 · 이틀 이상 탐험하기',
      reward: '+10 XP',
      done: streakDays >= 2,
    },
  ];
  const dailyDoneCount = dailyQuests.filter((q) => q.done).length;

  const activePersonaKey = userStats.persona || 'general';

  // Recent 6-Month Real Observation Counts
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const recent6MonthsSlots = useMemo(
    () =>
      Array.from({ length: 6 }, (_, idx) => {
        const offsetMonths = 5 - idx;
        const slotDate = new Date(currentYear, currentMonth - 1 - offsetMonths, 1);
        const y = slotDate.getFullYear();
        const m = slotDate.getMonth() + 1;
        const ymKey = `${y}.${String(m).padStart(2, '0')}`;
        return {
          ymKey,
          y,
          m,
          monthLabel: `${m}월`,
          isCurrent: offsetMonths === 0,
        };
      }),
    [currentYear, currentMonth]
  );

  const monthObsCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    recent6MonthsSlots.forEach((s) => {
      counts[s.ymKey] = 0;
    });
    collectedList.forEach((sp) => {
      (sp.observations || []).forEach((obs) => {
        if (!obs.date) return;
        const match = obs.date.replace(/-/g, '.').match(/(\d{4})\.(\d{1,2})/);
        if (match) {
          const ym = `${match[1]}.${match[2].padStart(2, '0')}`;
          if (counts[ym] !== undefined) {
            counts[ym] += 1;
          }
        }
      });
    });
    return counts;
  }, [collectedList, recent6MonthsSlots]);

  const recent6MonthsData = useMemo(
    () =>
      recent6MonthsSlots.map((s) => ({
        ...s,
        count: monthObsCounts[s.ymKey] || 0,
      })),
    [recent6MonthsSlots, monthObsCounts]
  );

  const maxMonthCount = Math.max(...recent6MonthsData.map((d) => d.count), 1);
  const currentMonthCount = recent6MonthsData[recent6MonthsData.length - 1]?.count || 0;
  const prevMonthCount = recent6MonthsData[recent6MonthsData.length - 2]?.count || 0;
  const monthDiff = currentMonthCount - prevMonthCount;
  const monthDiffText =
    monthDiff > 0 ? `+${monthDiff}` : monthDiff < 0 ? `${monthDiff}` : '변동 없음';

  // Dynamic Aggregation of Top Captured Keywords
  const capturedTagStats = useMemo(() => {
    const tagCountMap: Record<
      string,
      {
        tag: string;
        count: number;
        categoryType: 'trait' | 'habitat' | 'conservation' | 'behavior';
        specimens: Specimen[];
      }
    > = {};

    collectedList.forEach((sp) => {
      const eco = SPECIES_ECOLOGY_ENCYCLOPEDIA.find(
        (e) => e.koreanName === sp.koreanName || e.scientificName === sp.scientificName
      );
      const rawCandidates = [...(sp.traitChips || []), ...(eco?.tags || [])];
      if (sp.habitatType) {
        const hClean = sp.habitatType.split(/[/,]/)[0].trim();
        if (hClean.length >= 2) rawCandidates.push(hClean);
      }

      const uniqueInThisSpecimen = new Set<string>();
      const obsMultiplier = Math.max(1, sp.observations?.length || 1);

      rawCandidates.forEach((raw) => {
        if (!raw || typeof raw !== 'string') return;
        const cleaned = raw.trim().replace(/^#/, '');
        if (cleaned.length < 2 || cleaned.length > 15) return;
        if (/^\d+$/.test(cleaned)) return;
        if (['자생종', '생물', '야생', '관찰', '식물계', '동물계', '종'].includes(cleaned)) return;

        const key = cleaned.replace(/\s+/g, '');
        if (uniqueInThisSpecimen.has(key)) return;
        uniqueInThisSpecimen.add(key);

        if (!tagCountMap[key]) {
          let catType: 'trait' | 'habitat' | 'conservation' | 'behavior' = 'trait';
          if (/하천|공원|숲|산림|습지|사구|수변|정원|화단|연못|골목길|도심/.test(key)) {
            catType = 'habitat';
          } else if (/천연기념물|보호|멸종위기|1급수지표|지표종|특산|취약/.test(key)) {
            catType = 'conservation';
          } else if (/야행성|비행|사냥|포식|수분|동면|명음|울음|흡밀|잠수|호버링|텃새/.test(key)) {
            catType = 'behavior';
          }

          tagCountMap[key] = {
            tag: cleaned,
            count: 0,
            categoryType: catType,
            specimens: [],
          };
        }

        tagCountMap[key].count += obsMultiplier;
        if (!tagCountMap[key].specimens.some((s) => s.id === sp.id)) {
          tagCountMap[key].specimens.push(sp);
        }
      });
    });

    return Object.values(tagCountMap).sort((a, b) => b.count - a.count);
  }, [collectedList]);

  const safeNickname = userAccount?.isLoggedIn
    ? `@${userAccount.nickname || (userAccount.email ? userAccount.email.split('@')[0] : userAccount.name) || 'explorer'}`
    : '@moalog_explorer';

  /* ============================================================================
     SUB-VIEW: D-05 월간 리포트 상세
     ============================================================================ */
  if (selectedMonthSlot) {
    const monthObservations: { specimen: Specimen; date: string; score: number }[] = [];
    const monthSpeciesSet = new Map<string, { specimen: Specimen; count: number; maxScore: number }>();

    collectedList.forEach((sp) => {
      (sp.observations || []).forEach((obs) => {
        const m = (obs.date || '').replace(/-/g, '.').match(/(\d{4})\.(\d{1,2})/);
        if (m) {
          const ym = `${m[1]}.${m[2].padStart(2, '0')}`;
          if (ym === selectedMonthSlot.ymKey) {
            const score = obs.analysisMetadata?.imageClarityScore
              ? Math.round(obs.analysisMetadata.imageClarityScore)
              : getSpecimenScore(sp);
            monthObservations.push({ specimen: sp, date: obs.date, score });
            const existing = monthSpeciesSet.get(sp.id);
            if (existing) {
              existing.count += 1;
              existing.maxScore = Math.max(existing.maxScore, score);
            } else {
              monthSpeciesSet.set(sp.id, { specimen: sp, count: 1, maxScore: score });
            }
          }
        }
      });
    });

    const monthSpeciesList = Array.from(monthSpeciesSet.values()).map((v) => v.specimen);
    const monthSlices = buildCategorySlices(monthSpeciesList);
    const monthActiveCats = monthSlices.filter((s) => s.count > 0).length;
    const bestEntry = [...monthObservations].sort((a, b) => b.score - a.score)[0] || null;
    const mostFrequentEntry = Array.from(monthSpeciesSet.values()).sort((a, b) => b.count - a.count)[0] || null;

    return (
      <div className="space-y-6 pb-20 select-none bg-[#fbfbfb]">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setSelectedMonthSlot(null)}
            className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] flex items-center justify-center text-[#202320] cursor-pointer shadow-2xs"
            aria-label="리포트로 돌아가기"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-[17px] font-bold text-[#202320] tabular-nums">
            {selectedMonthSlot.y}년 {selectedMonthSlot.m}월
          </h2>
          <div className="w-10" />
        </div>

        {/* 3-Stat Summary */}
        <div className="bg-[#f4f5f4] rounded-[20px] grid grid-cols-3 divide-x divide-[#e6e9e5] py-4 text-center">
          <div>
            <span className="text-[18px] font-bold text-[#202320] tabular-nums block">
              {monthObservations.length}회
            </span>
            <span className="text-[11px] font-medium text-[#8c948a]">기록</span>
          </div>
          <div>
            <span className="text-[18px] font-bold text-[#202320] tabular-nums block">
              {monthSpeciesList.length}종
            </span>
            <span className="text-[11px] font-medium text-[#8c948a]">만난 생물</span>
          </div>
          <div>
            <span className="text-[18px] font-bold text-[#202320] tabular-nums block">
              {bestEntry ? `${bestEntry.score}점` : '-'}
            </span>
            <span className="text-[11px] font-medium text-[#8c948a]">최고 점수</span>
          </div>
        </div>

        {/* 이달의 분류 비중 */}
        <section className="space-y-3">
          <div>
            <h3 className="text-[18px] font-bold text-[#202320]">이달의 분류 비중</h3>
            <p className="text-xs text-[#626961] mt-0.5 tabular-nums">
              {monthActiveCats > 0 ? `${monthActiveCats}개 분류를 만났어요` : '이달에 기록된 분류가 아직 없어요'}
            </p>
          </div>
          <div className="bg-white rounded-[20px] border border-[#e6e9e5] p-5 flex items-center gap-5">
            <CategoryDonutChart
              slices={monthSlices}
              centerValue={`${monthSpeciesList.length}종`}
              centerLabel="이달"
            />
            <div className="flex-1 space-y-1.5 min-w-0">
              {monthSlices.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-2 text-[#202320] font-medium truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="font-semibold text-[#626961] tabular-nums shrink-0 ml-2">{cat.count}종</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 이달의 베스트 포착 */}
        {bestEntry && (
          <section className="space-y-2.5">
            <h3 className="text-[18px] font-bold text-[#202320]">이달의 베스트 포착</h3>
            <button
              type="button"
              onClick={() => onSelectSpecimen(bestEntry.specimen)}
              className="w-full bg-white rounded-[20px] border border-[#e6e9e5] p-3.5 flex items-center justify-between gap-3 text-left hover:border-[#d2d7d1] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-[#f4f5f4] overflow-hidden shrink-0">
                  {(bestEntry.specimen.originalImage || bestEntry.specimen.stickerImage) ? (
                    <img
                      src={bestEntry.specimen.originalImage || bestEntry.specimen.stickerImage}
                      alt={bestEntry.specimen.koreanName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-5 h-5 text-[#8c948a]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-[15px] font-bold text-[#202320] truncate">
                    {bestEntry.specimen.koreanName}
                  </h4>
                  <p className="text-xs text-[#8c948a] mt-0.5 tabular-nums">
                    {bestEntry.date} · {bestEntry.score}점 · {getScoreGrade(bestEntry.score)}등급
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8c948a] shrink-0" />
            </button>
          </section>
        )}

        {/* 가장 자주 만난 생물 */}
        {mostFrequentEntry && (
          <section className="space-y-2.5">
            <h3 className="text-[18px] font-bold text-[#202320]">가장 자주 만난 생물</h3>
            <button
              type="button"
              onClick={() => onSelectSpecimen(mostFrequentEntry.specimen)}
              className="w-full bg-white rounded-[20px] border border-[#e6e9e5] p-3.5 flex items-center justify-between gap-3 text-left hover:border-[#d2d7d1] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-[#f4f5f4] overflow-hidden shrink-0">
                  {(mostFrequentEntry.specimen.originalImage || mostFrequentEntry.specimen.stickerImage) ? (
                    <img
                      src={mostFrequentEntry.specimen.originalImage || mostFrequentEntry.specimen.stickerImage}
                      alt={mostFrequentEntry.specimen.koreanName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-4 h-4 text-[#8c948a]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-[15px] font-bold text-[#202320] truncate">
                    {mostFrequentEntry.specimen.koreanName}
                  </h4>
                  <p className="text-xs text-[#8c948a] mt-0.5 tabular-nums">
                    {getSpeciesTaxonomyCategoryLabel(mostFrequentEntry.specimen.category)} · 포착 {mostFrequentEntry.count}회
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white border border-[#e6e9e5] text-[11px] font-semibold text-[#626961] shrink-0">
                {getScoreGrade(mostFrequentEntry.maxScore)}등급
              </span>
            </button>
          </section>
        )}

        {monthObservations.length === 0 && (
          <div className="bg-white rounded-[20px] border border-[#e6e9e5] p-8 text-center text-xs text-[#8c948a]">
            {selectedMonthSlot.y}년 {selectedMonthSlot.m}월에는 아직 관찰 기록이 없어요.
          </div>
        )}
      </div>
    );
  }

  /* ============================================================================
     SUB-VIEW: D-07 키워드 상세
     ============================================================================ */
  if (selectedKeywordTag) {
    const keywordEntry = capturedTagStats.find((t) => t.tag === selectedKeywordTag);
    if (keywordEntry) {
      const matchingObsCount = keywordEntry.specimens.reduce(
        (sum, sp) => sum + Math.max(1, sp.observations?.length || 1),
        0
      );
      const locationFreq: Record<string, number> = {};
      keywordEntry.specimens.forEach((sp) => {
        const loc =
          sp.observations?.[0]?.location ||
          sp.locationCoord?.name ||
          sp.locationCoord?.city ||
          '자연 서식지';
        locationFreq[loc] = (locationFreq[loc] || 0) + 1;
      });
      const topPlace =
        Object.entries(locationFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || '주변 서식지';

      const keywordDesc =
        keywordEntry.categoryType === 'habitat'
          ? '같은 서식지 환경에서 함께 살아가는 다양한 생물들을 모아봤어요.'
          : keywordEntry.categoryType === 'behavior'
          ? '비슷한 생태 습성과 행동 특징을 지닌 생물들이 기록되었어요.'
          : keywordEntry.categoryType === 'conservation'
          ? '생태적 보전 가치가 높거나 지역 지표를 나타내는 소중한 생물들이에요.'
          : '비슷한 외형과 분류 특성을 공유하는 생물들을 모아봤어요.';

      return (
        <div className="space-y-6 pb-20 select-none bg-[#fbfbfb]">
          {/* Header */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setSelectedKeywordTag(null)}
              className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] flex items-center justify-center text-[#202320] cursor-pointer shadow-2xs"
              aria-label="뒤로"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-[17px] font-bold text-[#202320]">#{keywordEntry.tag}</h2>
            <div className="w-10" />
          </div>

          {/* Headline */}
          <div className="space-y-1.5">
            <h3 className="text-[22px] font-bold tracking-tight text-[#202320]">
              {keywordEntry.tag}를 {keywordEntry.count}번 만났어요
            </h3>
            <p className="text-[13px] text-[#626961] leading-relaxed">{keywordDesc}</p>
          </div>

          {/* 3-Stat Bar */}
          <div className="bg-[#f4f5f4] rounded-[20px] grid grid-cols-3 divide-x divide-[#e6e9e5] py-4 text-center px-2">
            <div>
              <span className="text-[18px] font-bold text-[#202320] tabular-nums block">
                {matchingObsCount}회
              </span>
              <span className="text-[11px] font-medium text-[#8c948a]">기록</span>
            </div>
            <div>
              <span className="text-[18px] font-bold text-[#202320] tabular-nums block">
                {keywordEntry.specimens.length}종
              </span>
              <span className="text-[11px] font-medium text-[#8c948a]">생물</span>
            </div>
            <div className="min-w-0 px-1">
              <span className="text-[16px] font-bold text-[#202320] truncate block">
                {topPlace}
              </span>
              <span className="text-[11px] font-medium text-[#8c948a]">자주 본 곳</span>
            </div>
          </div>

          {/* Species List */}
          <section className="space-y-3">
            <h4 className="text-[17px] font-bold text-[#202320]">이 키워드의 생물</h4>
            <div className="space-y-2.5">
              {keywordEntry.specimens.map((sp) => {
                const score = getSpecimenScore(sp);
                const grade = getScoreGrade(score);
                const thumb = sp.originalImage || sp.stickerImage || sp.observations?.[0]?.photoUrl;
                const obsCount = Math.max(1, sp.observations?.length || 1);
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => onSelectSpecimen(sp)}
                    className="w-full bg-white rounded-[20px] border border-[#e6e9e5] p-3 flex items-center justify-between gap-3 text-left hover:border-[#d2d7d1] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-[#f4f5f4] overflow-hidden shrink-0">
                        {thumb ? (
                          <img src={thumb} alt={sp.koreanName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Camera className="w-4 h-4 text-[#8c948a]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-[15px] font-bold text-[#202320] truncate">{sp.koreanName}</h5>
                        <p className="text-xs text-[#8c948a] mt-0.5 tabular-nums">
                          {getSpeciesTaxonomyCategoryLabel(sp.category)} · 포착 {obsCount}회
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white border border-[#e6e9e5] text-[11px] font-semibold text-[#626961] shrink-0">
                      {grade}등급
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      );
    }
  }

  return (
    <div className="space-y-7 pb-20 select-none bg-[#fbfbfb]" id="report-view-container">
      {localToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[260] px-4 py-2 rounded-full bg-black text-white text-xs font-semibold shadow-lg">
          {localToast}
        </div>
      )}

      {/* ========================================================
          1. NATURALIST PROFILE & LEVEL CARD (D-01)
          ======================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[22px] font-bold tracking-tight text-[#202320] truncate">
            {titleInfo.activeTitle}
          </h2>
          <button
            type="button"
            onClick={() => setIsPersonaModalOpen(true)}
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#626961] hover:text-[#202320] bg-[#f4f5f4] hover:bg-[#e6e9e5] px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <span>유형 변경</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#8c948a]" />
          </button>
        </div>

        {/* White Level Progress Card */}
        <div
          onClick={onOpenQuestModal}
          className="bg-white rounded-[20px] border border-[#e6e9e5] p-4 space-y-3 cursor-pointer hover:border-[#d2d7d1] transition-colors"
          title="클릭하여 레벨 및 전체 뱃지 보기"
        >
          <div className="flex items-center justify-between">
            <span className="text-[18px] font-bold text-[#202320] tabular-nums">
              Lv.{currentLevel}
            </span>
            <span className="text-xs font-semibold text-[#626961] tabular-nums">
              누적 {collectedList.length}종 · {streakDays}일 연속
            </span>
          </div>

          <div className="w-full h-2.5 bg-[#f4f5f4] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#c4eb43] rounded-full transition-all duration-500"
              style={{ width: `${levelBarPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#202320] tabular-nums">
              {exp} <span className="font-semibold text-[#8c948a]">/ {nextTierXp} XP</span>
            </span>
            <span className="font-semibold text-[#626961] tabular-nums">
              {nextTierTitle ? `다음 단계 ${nextTierTitle} · Lv.${nextTierLevel}` : '최고 단계 · 에코마스터'}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. TODAY'S QUESTS (D-01 오늘의 퀘스트)
          ======================================================== */}
      <section className="space-y-3">
        <div>
          <h3 className="text-[18px] font-bold text-[#202320]">오늘의 퀘스트</h3>
          <p className="text-xs text-[#626961] mt-0.5 tabular-nums">
            {dailyDoneCount} / 3 달성 · 최대 30 XP
          </p>
        </div>

        <div className="space-y-2.5">
          {dailyQuests.map((q) => (
            <div
              key={q.id}
              className="bg-[#f4f5f4] rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {q.done ? (
                  <span className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </span>
                ) : (
                  <span className="w-7 h-7 rounded-full border-2 border-dashed border-[#d2d7d1] shrink-0" />
                )}
                <span
                  className={`text-[14px] font-semibold truncate ${
                    q.done ? 'text-[#8c948a]' : 'text-[#202320]'
                  }`}
                >
                  {q.title}
                </span>
              </div>

              {q.done ? (
                <span className="px-3 py-1 rounded-full bg-[#c4eb43] text-[#202320] text-xs font-bold shrink-0 tabular-nums">
                  {q.reward} 받음
                </span>
              ) : (
                <span className="text-xs font-bold text-[#202320] shrink-0 tabular-nums">
                  {q.reward}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          3. RECENT UNLOCKED BADGES (D-01 최근 얻은 뱃지)
          ======================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-[#202320]">최근 얻은 뱃지</h3>
          <button
            type="button"
            onClick={onOpenQuestModal}
            className="text-xs font-semibold text-[#8c948a] hover:text-[#202320] flex items-center gap-0.5 cursor-pointer"
          >
            <span>전체 보기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {(unlockedBadgesList.length > 0 ? unlockedBadgesList : ALL_BADGES).slice(0, 3).map((badge) => (
            <button
              key={badge.id}
              type="button"
              onClick={() => setSelectedBadgeModal(badge)}
              className="bg-white rounded-[20px] border border-[#e6e9e5] p-3 flex flex-col items-center text-center gap-2 hover:border-[#d2d7d1] transition-colors cursor-pointer"
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 ${
                  badge.isUnlocked
                    ? 'bg-[#f4fbdd] border-[#c4eb43]'
                    : 'bg-[#f4f5f4] border-[#e6e9e5]'
                }`}
              >
                <span className={badge.isUnlocked ? '' : 'grayscale opacity-40'}>{badge.icon}</span>
              </div>
              <span className="text-xs font-bold text-[#202320] truncate w-full">{badge.title}</span>
              <span className="text-[10px] text-[#8c948a] tabular-nums">
                {badge.isUnlocked ? `획득 · ${badge.unlockedAt?.slice(5) || '최근'}` : '미획득'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ========================================================
          4. 3-STAT SUMMARY STRIP (D-01 real counts)
          ======================================================== */}
      <section className="bg-[#f4f5f4] rounded-[20px] grid grid-cols-3 divide-x divide-[#e6e9e5] py-4 text-center">
        <div>
          <span className="text-[18px] font-bold text-[#202320] tabular-nums block">
            {myMemoCount > 0 ? `${myMemoCount}개` : `${totalObservationLogsCount}회`}
          </span>
          <span className="text-[11px] font-medium text-[#8c948a]">
            {myMemoCount > 0 ? '탐험 메모' : '관찰 기록'}
          </span>
        </div>
        <div>
          <span className="text-[18px] font-bold text-[#202320] tabular-nums block">
            {receivedHeartsCount}개
          </span>
          <span className="text-[11px] font-medium text-[#8c948a]">받은 하트</span>
        </div>
        <div>
          <span className="text-[18px] font-bold text-[#202320] tabular-nums block">
            {unlockedBadgesCount} / {totalPolicyBadges}개
          </span>
          <span className="text-[11px] font-medium text-[#8c948a]">획득 뱃지</span>
        </div>
      </section>

      {/* ========================================================
          5. MONTHLY RECORDS BAR CHART (D-01 월별 기록 -> 클릭 시 D-05)
          ======================================================== */}
      <section className="space-y-3">
        <div>
          <h3 className="text-[18px] font-bold text-[#202320]">월별 기록</h3>
          <p className="text-xs text-[#626961] mt-0.5 tabular-nums">
            {currentMonth}월 {currentMonthCount}회 · 지난달보다 {monthDiffText}
          </p>
        </div>

        <div className="bg-white rounded-[20px] border border-[#e6e9e5] px-4 pt-5 pb-4">
          <div className="h-36 flex items-end justify-between gap-2.5">
            {recent6MonthsData.map((item) => {
              const heightPct = item.count > 0 ? Math.max(14, Math.round((item.count / maxMonthCount) * 100)) : 6;
              return (
                <button
                  key={item.ymKey}
                  type="button"
                  onClick={() => setSelectedMonthSlot({ ymKey: item.ymKey, y: item.y, m: item.m })}
                  className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                  title={`${item.y}년 ${item.m}월 기록 상세 보기`}
                >
                  <span
                    className={`text-[11px] mb-1.5 tabular-nums ${
                      item.isCurrent ? 'font-bold text-[#202320]' : 'font-medium text-[#8c948a]'
                    }`}
                  >
                    {item.count}
                  </span>
                  <div className="w-full max-w-[38px] flex-1 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      className={`w-full rounded-t-xl transition-colors ${
                        item.count === 0
                          ? 'bg-[#f4f5f4] group-hover:bg-[#e6e9e5]'
                          : item.isCurrent
                          ? 'bg-[#6a95d1] group-hover:bg-[#5782c0]'
                          : 'bg-[#dce7f7] group-hover:bg-[#c5d7f2]'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[11px] mt-2 tabular-nums ${
                      item.isCurrent ? 'font-bold text-[#202320]' : 'font-medium text-[#8c948a]'
                    }`}
                  >
                    {item.monthLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          6. BIODIVERSITY DONUT + 8-ROW LEGEND (D-01 분류 비중)
          ======================================================== */}
      <section className="space-y-3">
        <div>
          <h3 className="text-[18px] font-bold text-[#202320]">분류 비중</h3>
          <p className="text-xs text-[#626961] mt-0.5 tabular-nums">
            {activeCategoryCount > 0
              ? `${activeCategoryCount}개 분류를 만났어요`
              : '첫 생물을 포착하면 분류 비중이 표시돼요'}
          </p>
        </div>

        <div className="bg-white rounded-[20px] border border-[#e6e9e5] p-5 flex items-center gap-5">
          <CategoryDonutChart
            slices={biodiversitySlices}
            centerValue={`${collectedList.length}종`}
            centerLabel="도감"
          />

          <div className="flex-1 space-y-1.5 min-w-0">
            {biodiversitySlices.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 text-[#202320] font-medium truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="truncate">{cat.name}</span>
                </span>
                <span className="font-semibold text-[#626961] tabular-nums shrink-0 ml-2">
                  {cat.count}종
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          7. TOP 5 EXPLORATION KEYWORDS (D-01 -> 클릭 시 D-07)
          ======================================================== */}
      {capturedTagStats.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[18px] font-bold text-[#202320]">나의 탐험 키워드 TOP5</h3>
          <div className="flex flex-wrap gap-2">
            {capturedTagStats.slice(0, 5).map((item) => (
              <button
                key={item.tag}
                type="button"
                onClick={() => setSelectedKeywordTag(item.tag)}
                className="px-3.5 py-2 rounded-2xl bg-[#f4f5f4] hover:bg-[#e6e9e5] text-[13px] font-bold text-[#202320] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>{item.tag}</span>
                <span className="font-medium text-[#8c948a] tabular-nums">{item.count}회</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          8. RECENT SPECIMENS
          ======================================================== */}
      <section className="bg-white border border-[#e6e9e5] rounded-[20px] p-4">
        <RecentSpecimenBasket
          specimens={specimens}
          onSelectSpecimen={onSelectSpecimen}
          title="최근 포착된 주요 표본"
        />
      </section>

      {/* ================= BADGE DETAIL MODAL (47) ================= */}
      <AnimatePresence>
        {selectedBadgeModal && (
          <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/50 backdrop-blur-xs"
            onClick={() => setSelectedBadgeModal(null)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[360px] bg-white rounded-t-[28px] sm:rounded-[28px] px-5 pt-3 pb-6 shadow-2xl border border-[#e6e9e5] select-none space-y-4"
            >
              <div className="w-9 h-1 bg-[#d2d7d1] rounded-full mx-auto sm:hidden" />

              <div>
                <h3 className="text-[20px] font-bold text-[#202320]">{selectedBadgeModal.title}</h3>
                <p className="text-xs text-[#8c948a] mt-0.5">
                  {selectedBadgeModal.category} 뱃지 ·{' '}
                  {selectedBadgeModal.isUnlocked
                    ? `${selectedBadgeModal.unlockedAt || '최근'} 획득`
                    : '미획득'}
                </p>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-[22px] shrink-0 flex items-center justify-center text-4xl border bg-[#f4f5f4] border-[#e6e9e5]">
                  <span className={selectedBadgeModal.isUnlocked ? '' : 'grayscale opacity-40'}>
                    {selectedBadgeModal.icon}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#f4f5f4] text-[11px] font-semibold text-[#626961]">
                      {selectedBadgeModal.isUnlocked ? '획득' : '미획득'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#a88200] text-white text-[11px] font-bold tabular-nums">
                      {getTierBadgeLabel(selectedBadgeModal.tier)} · +{selectedBadgeModal.xpReward} XP
                    </span>
                  </div>
                  <p className="text-[13px] text-[#202320] font-medium leading-snug pt-0.5">
                    {selectedBadgeModal.desc}
                  </p>
                </div>
              </div>

              <div className="bg-[#f4f5f4] rounded-2xl p-3.5 space-y-1">
                <span className="text-[11px] font-bold text-[#8c948a] block uppercase tracking-wide">TIP</span>
                <p className="text-[13px] text-[#202320] leading-relaxed">
                  {selectedBadgeModal.isUnlocked
                    ? '얻은 뱃지는 내 프로필과 보관함에서 언제든 다시 볼 수 있어요'
                    : selectedBadgeModal.tip}
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {selectedBadgeModal.isUnlocked && showShare && (
                  <button
                    type="button"
                    onClick={() => {
                      const b = selectedBadgeModal;
                      setSelectedBadgeModal(null);
                      setShareBadgeModal(b);
                    }}
                    className="w-full h-13 bg-white hover:bg-[#f4f5f4] border border-[#e6e9e5] text-[#202320] font-bold text-[15px] rounded-2xl transition-colors cursor-pointer"
                  >
                    뱃지 자랑하기
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedBadgeModal(null)}
                  className="w-full h-13 bg-black hover:bg-[#202320] text-white font-bold text-[15px] rounded-2xl transition-colors cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= BADGE SHARE SHEET (F-13) ================= */}
      <AnimatePresence>
        {shareBadgeModal && (
          <div
            className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs"
            onClick={() => setShareBadgeModal(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] px-5 pt-3 pb-6 shadow-2xl border border-[#e6e9e5] space-y-4"
            >
              <div className="w-9 h-1 bg-[#d2d7d1] rounded-full mx-auto sm:hidden" />

              <div className="flex items-center justify-between">
                <h3 className="text-[20px] font-bold text-[#202320]">공유하기</h3>
                <button
                  type="button"
                  onClick={() => setShareBadgeModal(null)}
                  className="w-8 h-8 rounded-full bg-[#f4f5f4] flex items-center justify-center text-[#626961] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-[#f4f5f4] rounded-[24px] p-6 flex items-center justify-center">
                <div className="w-[230px] rounded-[22px] bg-gradient-to-b from-[#fafafa] via-[#f0f1ef] to-[#e4e6e3] border border-[#d9dcd7] shadow-lg p-4 text-center space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-[#626961]">
                    <span className="font-bold text-[#202320]">Moalog</span>
                    <span className="tabular-nums">{shareBadgeModal.unlockedAt || '2026.11'}</span>
                  </div>

                  <div className="w-24 h-24 mx-auto rounded-full bg-white border-4 border-[#d9b85f] shadow-md flex items-center justify-center text-5xl">
                    {shareBadgeModal.icon}
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-[16px] font-bold text-[#202320]">{shareBadgeModal.title}</h4>
                    <p className="text-[11px] text-[#626961] leading-snug">{shareBadgeModal.desc}</p>
                  </div>

                  <span className="inline-block px-3 py-1 rounded-full bg-[#e6e9e5] text-[11px] font-semibold text-[#555c54]">
                    {safeNickname}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShareBadgeModal(null);
                    triggerToast('뱃지 카드를 기기에 저장했어요');
                  }}
                  className="h-13 rounded-2xl bg-[#f4f5f4] hover:bg-[#e6e9e5] text-[#202320] text-[15px] font-bold cursor-pointer"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const text = `모아로그에서 '${shareBadgeModal.title}' 뱃지를 얻었어요!`;
                    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
                      try {
                        await navigator.share({ title: shareBadgeModal.title, text });
                      } catch {}
                    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      try {
                        await navigator.clipboard.writeText(text);
                      } catch {}
                    }
                    setShareBadgeModal(null);
                    triggerToast('뱃지 자랑하기 카드가 공유되었어요');
                  }}
                  className="h-13 rounded-2xl bg-black hover:bg-[#202320] text-white text-[15px] font-bold cursor-pointer"
                >
                  공유하기
                </button>
              </div>

              <p className="text-center text-[11px] text-[#8c948a]">
                공유 이미지에는 닉네임과 뱃지만 담겨요
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= PERSONA OVERRIDE MODAL ================= */}
      <AnimatePresence>
        {isPersonaModalOpen && (
          <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsPersonaModalOpen(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-[28px] px-5 pt-3 pb-6 shadow-xl max-h-[85vh] flex flex-col border border-[#e6e9e5] select-none overflow-hidden"
            >
              <div className="w-9 h-1 bg-[#d2d7d1] rounded-full mx-auto mb-3 sm:hidden shrink-0" />
              <div className="flex items-center justify-between pb-3 border-b border-[#e6e9e5] shrink-0">
                <div>
                  <h3 className="text-[18px] font-bold text-[#202320]">탐험가 유형 선택</h3>
                  <p className="text-xs text-[#626961] mt-0.5">원하는 주 관찰 유형을 선택할 수 있어요</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPersonaModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#f4f5f4] flex items-center justify-center text-[#626961] hover:text-[#202320] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 py-4 overflow-y-auto flex-1 scrollbar-none">
                {Object.entries(NATURALIST_PERSONAS).map(([key, p]) => {
                  const isSelected = activePersonaKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        onUpdatePersona(key as NaturalistPersona);
                        setIsPersonaModalOpen(false);
                      }}
                      className={`w-full p-4 rounded-[20px] text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'bg-white border-2 border-black'
                          : 'bg-white border border-[#e6e9e5] hover:border-[#d2d7d1]'
                      }`}
                    >
                      <PersonaBadgeIcon persona={key as NaturalistPersona} size="md" />

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[15px] font-bold text-[#202320] truncate">{p.title}</h4>
                        <p className="text-xs text-[#626961] mt-0.5 leading-relaxed">{p.description}</p>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share FAB: strictly hidden for under-14 users */}
      {showShare && (
        <div className="fixed bottom-24 right-5 z-40">
          <button
            type="button"
            onClick={onOpenReportShare}
            className="w-12 h-12 flex items-center justify-center bg-black hover:bg-[#202320] text-white rounded-full shadow-lg transition-all cursor-pointer active:scale-95"
            title="생태 리포트 카드 공유"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
