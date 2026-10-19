import { Badge, Specimen, UserStats } from '../types';

export interface ExplorerBadgeDefinition {
  id: string;
  title: string;
  icon: string;
  desc: string;
  category: string;
  targetProgress: number;
  progressUnit: string;
  tip: string;
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
  },
  {
    id: 'badge-02',
    title: '5일 연속 관찰',
    icon: '🔥',
    desc: '5일 연속 생태 관찰 기록 달성',
    category: '연속',
    targetProgress: 5,
    progressUnit: '일',
    tip: '매일 1회 이상 표본을 관찰해 기록을 이어가세요.',
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
  },
  {
    id: 'badge-11',
    title: '골든아워 탐험가',
    icon: '🌅',
    desc: '일출·일몰 시간대 생물 3회 포착',
    category: '시간',
    targetProgress: 3,
    progressUnit: '회',
    tip: '이른 아침이나 해질녘 골든아워에 탐사해 보세요.',
  },
  {
    id: 'badge-12',
    title: '마이크로 접사',
    icon: '🔬',
    desc: '초정밀 매크로 접사 5회 촬영',
    category: '접사',
    targetProgress: 5,
    progressUnit: '회',
    tip: '10cm 이내 근접 촬영으로 세부를 담아보세요.',
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
  },
  {
    id: 'badge-14',
    title: '전설의 에코마스터',
    icon: '👑',
    desc: '14개 탐사 뱃지 올클리어 달성',
    category: '명예',
    targetProgress: 14,
    progressUnit: '개',
    tip: '모든 탐사 뱃지를 수집해 전설에 도달하세요.',
  },
];

export interface EvaluatedBadge extends ExplorerBadgeDefinition {
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export function evaluateExplorerBadges(specimens: Specimen[] = [], userStats: UserStats): EvaluatedBadge[] {
  const safeSpecimens = specimens || [];
  const collectedList = safeSpecimens.filter((s) => s.isCollected && !s.isPending);
  const plantCount = collectedList.filter((s) => s.category === 'plants').length;
  const insectCount = collectedList.filter((s) => s.category === 'insects').length;
  const birdCount = collectedList.filter((s) => s.category === 'birds').length;
  const mammalCount = collectedList.filter((s) => s.category === 'mammals').length;
  const streakDays = userStats?.streakDays || 5;
  const userUnlockedIds = new Set(userStats?.badges || ['badge-01', 'badge-05', 'badge-06', 'badge-08', 'badge-09', 'badge-10']);

  return EXPLORER_BADGES_MASTER.map((def) => {
    let current = 0;
    switch (def.id) {
      case 'badge-01': current = Math.min(1, collectedList.length); break;
      case 'badge-02': current = Math.min(5, streakDays); break;
      case 'badge-03': current = Math.min(3, plantCount); break;
      case 'badge-04': current = Math.min(2, birdCount); break;
      case 'badge-05': current = Math.min(2, insectCount); break;
      case 'badge-06': current = Math.min(5, collectedList.length); break;
      case 'badge-07': current = Math.min(3, userStats?.exploredHabitats?.length || 4); break;
      case 'badge-08': current = Math.min(12, 14); break;
      case 'badge-09': current = Math.min(10, collectedList.length); break;
      case 'badge-10': current = Math.min(2, mammalCount); break;
      case 'badge-11': current = 1; break;
      case 'badge-12': current = 3; break;
      case 'badge-13': current = 1; break;
      case 'badge-14': current = userUnlockedIds.size; break;
      default: current = 0;
    }

    const isUnlocked = userUnlockedIds.has(def.id) || current >= def.targetProgress;
    return {
      ...def,
      currentProgress: current,
      isUnlocked,
      unlockedAt: isUnlocked ? '2026.08.15' : undefined,
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
  isUnlocked: ['badge-01', 'badge-05', 'badge-06', 'badge-08', 'badge-09', 'badge-10'].includes(b.id),
  unlockedAt: ['badge-01', 'badge-05', 'badge-06', 'badge-08', 'badge-09', 'badge-10'].includes(b.id) ? '2026.08.14' : undefined,
  progress: ['badge-01', 'badge-05', 'badge-06', 'badge-08', 'badge-09', 'badge-10'].includes(b.id) ? b.targetProgress : 0,
  maxProgress: b.targetProgress,
}));
