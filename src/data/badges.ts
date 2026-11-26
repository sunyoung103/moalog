import { Badge, Specimen, UserStats, UserAccount } from '../types';
import { getUnder14DesignFlags } from '../utils/levelPolicy';

export interface ExplorerBadgeDefinition {
  id: string;
  title: string;
  icon: string;
  desc: string;
  category: string;
  targetProgress: number;
  progressUnit: string;
  tip: string;
  tier: 'bronze' | 'silver' | 'gold' | 'legend';
  xpReward: number;
  isCommunityOnly?: boolean;
}

export const EXPLORER_BADGES_MASTER: ExplorerBadgeDefinition[] = [
  {
    id: 'badge-01',
    title: '첫 표본 포착',
    icon: '🌟',
    desc: '첫 번째 생태 표본 등록 완료',
    category: '입문',
    targetProgress: 1,
    progressUnit: '종',
    tip: '카메라 렌즈로 첫 생태 표본을 등록해 보세요.',
    tier: 'bronze',
    xpReward: 10,
  },
  {
    id: 'badge-att-7',
    title: '7일 출석 탐험가',
    icon: '📅',
    desc: '누적 출석 7일 달성',
    category: '출석',
    targetProgress: 7,
    progressUnit: '일',
    tip: '하루 쉬어도 초기화되지 않고 누적 7일에 달성해요.',
    tier: 'bronze',
    xpReward: 10,
  },
  {
    id: 'badge-att-14',
    title: '14일 꾸준한 기록',
    icon: '🔥',
    desc: '누적 출석 14일 달성',
    category: '출석',
    targetProgress: 14,
    progressUnit: '일',
    tip: '누적 출석 14일을 채워 은 뱃지를 얻어 보세요.',
    tier: 'silver',
    xpReward: 30,
  },
  {
    id: 'badge-att-30',
    title: '30일 자연 동반자',
    icon: '🏅',
    desc: '누적 출석 30일 달성',
    category: '출석',
    targetProgress: 30,
    progressUnit: '일',
    tip: '한 달 동안 꾸준히 접속해 금 뱃지를 획득해 보세요.',
    tier: 'gold',
    xpReward: 50,
  },
  {
    id: 'badge-03',
    title: '식물 큐레이터',
    icon: '🌿',
    desc: '식물 표본 3종 이상 수집',
    category: '식물',
    targetProgress: 3,
    progressUnit: '종',
    tip: '야생화나 나뭇잎을 렌즈로 촬영해 보세요.',
    tier: 'bronze',
    xpReward: 10,
  },
  {
    id: 'badge-04',
    title: '야생 탐조가',
    icon: '🪶',
    desc: '야생 조류 표본 2종 이상 관찰',
    category: '조류',
    targetProgress: 2,
    progressUnit: '종',
    tip: '참새, 까치, 직박구리 등 주변 새를 포착하세요.',
    tier: 'bronze',
    xpReward: 10,
  },
  {
    id: 'badge-05',
    title: '곤충 탐험가',
    icon: '🐞',
    desc: '곤충 표본 2종 이상 수집',
    category: '곤충',
    targetProgress: 2,
    progressUnit: '종',
    tip: '화단이나 풀숲의 나비와 벌을 관찰해 보세요.',
    tier: 'bronze',
    xpReward: 10,
  },
  {
    id: 'badge-06',
    title: '생태 보전 기록자',
    icon: '🛡️',
    desc: '야생 생물 표본 5종 이상 등록',
    category: '보전',
    targetProgress: 5,
    progressUnit: '종',
    tip: '다양한 야생 생물을 발견하고 도감을 채우세요.',
    tier: 'silver',
    xpReward: 30,
  },
  {
    id: 'badge-07',
    title: '서식지 정복자',
    icon: '🗺️',
    desc: '서로 다른 서식지 3곳 탐사',
    category: '탐사',
    targetProgress: 3,
    progressUnit: '곳',
    tip: '공원, 하천, 산림 등 여러 서식지를 방문하세요.',
    tier: 'silver',
    xpReward: 30,
  },
  {
    id: 'badge-08',
    title: '생애주기 기록자',
    icon: '🍂',
    desc: '생태 관찰 로그 12회 작성',
    category: '주기',
    targetProgress: 12,
    progressUnit: '회',
    tip: '계절과 시기별 변화를 꾸준히 기록해 보세요.',
    tier: 'silver',
    xpReward: 30,
  },
  {
    id: 'badge-09',
    title: '생물다양성 마스터',
    icon: '🌍',
    desc: '생물 표본 10종 수집 달성',
    category: '도감',
    targetProgress: 10,
    progressUnit: '종',
    tip: '식물, 조류, 곤충 등 골고루 탐색해 보세요.',
    tier: 'gold',
    xpReward: 50,
  },
  {
    id: 'badge-10',
    title: '포유류 트래커',
    icon: '🐾',
    desc: '포유류 표본 2종 이상 등록',
    category: '포유류',
    targetProgress: 2,
    progressUnit: '종',
    tip: '청설모나 다람쥐 등 포유류의 흔적을 찾아보세요.',
    tier: 'bronze',
    xpReward: 10,
  },
  {
    id: 'badge-13',
    title: '수변 생태 전문가',
    icon: '💧',
    desc: '어류 및 수생 생물 2종 이상 관찰',
    category: '수변',
    targetProgress: 2,
    progressUnit: '종',
    tip: '하천, 호수, 습지의 수생 생물을 포착하세요.',
    tier: 'silver',
    xpReward: 30,
  },
  {
    id: 'badge-comm-memo',
    title: '첫 탐험 메모',
    icon: '📝',
    desc: '탐험맵에 첫 현장 메모 공유',
    category: '커뮤니티',
    targetProgress: 1,
    progressUnit: '회',
    tip: '탐험맵에서 주변 탐험가들과 관찰 메모를 나눠보세요.',
    tier: 'bronze',
    xpReward: 10,
    isCommunityOnly: true,
  },
  {
    id: 'badge-comm-heart',
    title: '첫 하트',
    icon: '❤️',
    desc: '탐험맵 기록에 첫 공감 남기기',
    category: '커뮤니티',
    targetProgress: 1,
    progressUnit: '회',
    tip: '다른 탐험가의 기록에 따뜻한 하트를 눌러보세요.',
    tier: 'bronze',
    xpReward: 10,
    isCommunityOnly: true,
  },
  {
    id: 'badge-14',
    title: '전설의 에코마스터',
    icon: '👑',
    desc: '모든 핵심 탐사 뱃지 수집 달성',
    category: '명예',
    targetProgress: 14,
    progressUnit: '개',
    tip: '모든 탐사 뱃지를 수집해 전설에 도달하세요.',
    tier: 'legend',
    xpReward: 100,
  },
];

export const TOTAL_POLICY_BADGES_ADULT = 45;
export const TOTAL_POLICY_BADGES_UNDER14 = 43; // 커뮤니티 뱃지 2개(첫 탐험 메모 · 첫 하트) 제외

export interface EvaluatedBadge extends ExplorerBadgeDefinition {
  isUnlocked: boolean;
  unlockedAt?: string;
}

export function evaluateExplorerBadges(
  specimens: Specimen[] = [],
  userStats: UserStats,
  userAccount?: UserAccount
): EvaluatedBadge[] {
  const { under14 } = getUnder14DesignFlags(userAccount);
  const safeSpecimens = specimens || [];
  const collectedList = safeSpecimens.filter((s) => s.isCollected && !s.isPending);
  const plantCount = collectedList.filter((s) => s.category === 'plants').length;
  const insectCount = collectedList.filter((s) => s.category === 'insects').length;
  const birdCount = collectedList.filter((s) => s.category === 'birds').length;
  const mammalCount = collectedList.filter((s) => s.category === 'mammals').length;
  const aquaticCount = collectedList.filter(
    (s) => s.category === 'fishes' || s.category === 'crustaceans' || s.category === 'mollusks'
  ).length;
  const streakDays = userStats?.streakDays || 0;
  const userUnlockedIds = new Set(userStats?.badges || []);
  const totalObsCount = collectedList.reduce(
    (acc, s) => acc + (s.observations ? s.observations.length : 0),
    0
  );

  // 14세 미만은 커뮤니티 뱃지 2개(첫 탐험 메모 · 첫 하트)를 숨긴다 (6장)
  const visibleMaster = under14
    ? EXPLORER_BADGES_MASTER.filter((b) => !b.isCommunityOnly)
    : EXPLORER_BADGES_MASTER;

  return visibleMaster.map((def) => {
    let current = 0;
    switch (def.id) {
      case 'badge-01':
        current = Math.min(1, collectedList.length);
        break;
      case 'badge-att-7':
      case 'badge-att-14':
      case 'badge-att-30':
        current = streakDays;
        break;
      case 'badge-03':
        current = plantCount;
        break;
      case 'badge-04':
        current = birdCount;
        break;
      case 'badge-05':
        current = insectCount;
        break;
      case 'badge-06':
        current = collectedList.length;
        break;
      case 'badge-07':
        current = userStats?.exploredHabitats?.length || 0;
        break;
      case 'badge-08':
        current = totalObsCount;
        break;
      case 'badge-09':
        current = collectedList.length;
        break;
      case 'badge-10':
        current = mammalCount;
        break;
      case 'badge-13':
        current = aquaticCount;
        break;
      case 'badge-14':
        current = userUnlockedIds.size;
        break;
      default:
        current = 0;
    }

    // 뱃지 상태는 획득 / 미획득 두 상태만 존재 (5-2)
    const isUnlocked =
      userUnlockedIds.has(def.id) || (def.targetProgress > 0 && current >= def.targetProgress);
    return {
      ...def,
      isUnlocked,
      unlockedAt: isUnlocked ? '2026.11.22' : undefined,
    };
  });
}

// Backward compatibility export for legacy imports
export const INITIAL_BADGES: Badge[] = EXPLORER_BADGES_MASTER.map((b) => ({
  id: b.id,
  title: b.title,
  description: b.desc,
  icon: b.icon,
  category: 'discover',
  isUnlocked: false,
  progress: 0,
  maxProgress: b.targetProgress,
}));
