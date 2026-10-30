import { Badge, Observation, Specimen, UserStats } from '../types';

export interface ExplorerBadgeDefinition {
  id: string;
  title: string;
  icon: string;
  desc: string;
  category: string;
  targetProgress: number;
  progressUnit: string;
  tip: string;
  expReward: number;
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
    expReward: 10, // [임시 EXP]
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
    expReward: 20, // [임시 EXP]
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
    expReward: 20, // [임시 EXP]
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
    expReward: 20, // [임시 EXP]
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
    expReward: 20, // [임시 EXP]
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
    expReward: 30, // [임시 EXP]
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
    expReward: 30, // [임시 EXP]
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
    expReward: 30, // [임시 EXP]
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
    expReward: 40, // [임시 EXP]
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
    expReward: 30, // [임시 EXP]
    tip: '청설모나 다람쥐 등 포유류의 흔적을 찾아보세요.',
  },
  {
    id: 'badge-11',
    title: '골든아워 탐험가',
    icon: '🌅',
    desc: '일출·일몰 시간대 생물 10회 포착',
    category: '시간',
    targetProgress: 10,
    progressUnit: '회',
    expReward: 40, // [임시 EXP]
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
    expReward: 30, // [임시 EXP]
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
    expReward: 30, // [임시 EXP]
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
    expReward: 100, // [임시 EXP]
    tip: '모든 탐사 뱃지를 수집해 전설에 도달하세요.',
  },
];

export interface EvaluatedBadge extends ExplorerBadgeDefinition {
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

// 탐사 레벨 기준: 누적 EXP. 전체 뱃지 EXP 합계의 20/40/60/80% 지점에서 Lv.2~Lv.5 시작 (100%는 전체 달성)
// 인덱스 0 = Lv.1, 1 = Lv.2, 2 = Lv.3, 3 = Lv.4, 4 = Lv.5
// 레벨 계산은 이 파일의 getExplorerLevelIdx 한 곳에서만 합니다.
export const EXPLORER_TOTAL_EXP = EXPLORER_BADGES_MASTER.reduce((sum, d) => sum + d.expReward, 0);
export const EXPLORER_LEVEL_MIN_EXP = [0, 0.2, 0.4, 0.6, 0.8].map((ratio) => Math.round(EXPLORER_TOTAL_EXP * ratio));

export function getExplorerLevelIdx(exp: number): number {
  let idx = 0;
  EXPLORER_LEVEL_MIN_EXP.forEach((min, i) => {
    if (exp >= min) idx = i;
  });
  return idx;
}

// EXP: 획득한 뱃지의 expReward 합계 (저장값이 아니라 계산값)
export function getExplorerExp(badges: EvaluatedBadge[]): number {
  return badges.filter((b) => b.isUnlocked).reduce((sum, b) => sum + b.expReward, 0);
}

// 관찰 통계 계산용: 수집(비대기, 미삭제) 표본만 사용
// 앨범에서 가져온 사진 구분 (seasonLabel은 기존 데이터 호환용)
const ALBUM_SEASON_LABEL = '앨범 포착 기록';

function isLensObservation(obs: Observation): boolean {
  return obs.isCapturedWithLens ?? obs.seasonLabel !== ALBUM_SEASON_LABEL;
}

// EXP·뱃지 집계용: 앨범 관찰 기록을 제외. 관찰이 전부 앨범이면 표본에서 제외
function getLensStatsSpecimens(specimens: Specimen[]): Specimen[] {
  return specimens.flatMap((s) => {
    const all = s.observations || [];
    if (all.length === 0) return [s];
    const lens = all.filter(isLensObservation);
    return lens.length > 0 ? [{ ...s, observations: lens }] : [];
  });
}
function getStatsTargetSpecimens(specimens: Specimen[] = []): Specimen[] {
  return getLensStatsSpecimens((specimens || []).filter((s) => s.isCollected && !s.isPending && !s.isDeleted));
}

function toDayKey(year: number, month: number, day: number): string {
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
}

// 연속 관찰 일수 (관찰 날짜 'YYYY.MM.DD' 기준)
// 오늘 기록이 있으면 오늘부터, 없으면 어제부터 거꾸로 셉니다.
// 즉 어제까지 이어진 기록은 유지되고, 오늘 기록이 생기면 +1 됩니다.
export function calculateStreakDays(specimens: Specimen[] = [], today: Date = new Date()): number {
  const dayKeys = new Set<string>();
  getStatsTargetSpecimens(specimens).forEach((s) => {
    s.observations?.forEach((obs) => {
      const m = obs.date?.replace(/-/g, '.').match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})/);
      if (m) dayKeys.add(toDayKey(Number(m[1]), Number(m[2]), Number(m[3])));
    });
  });

  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayKey = toDayKey(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate());
  if (!dayKeys.has(todayKey)) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (dayKeys.has(toDayKey(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// 방문 서식지 수: 관찰 기록의 장소명(구 포함, 예: "서울숲 (성동구 성수동)")이 서로 다른 개수
export function countVisitedHabitats(specimens: Specimen[] = []): number {
  const places = new Set<string>();
  getStatsTargetSpecimens(specimens).forEach((s) => {
    s.observations?.forEach((obs) => {
      const place = obs.location?.trim();
      if (place) places.add(place);
    });
  });
  return places.size;
}

export function evaluateExplorerBadges(specimens: Specimen[] = [], userStats: UserStats): EvaluatedBadge[] {
  const safeSpecimens = specimens || [];
  const collectedList = getLensStatsSpecimens(safeSpecimens.filter((s) => s.isCollected && !s.isPending));
  const plantCount = collectedList.filter((s) => s.category === 'plants').length;
  const insectCount = collectedList.filter((s) => s.category === 'insects').length;
  const birdCount = collectedList.filter((s) => s.category === 'birds').length;
  const mammalCount = collectedList.filter((s) => s.category === 'mammals').length;
  const aquaticCount = collectedList.filter((s) => s.category === 'fishes' || s.category === 'crustaceans' || s.category === 'mollusks').length;
  const streakDays = calculateStreakDays(collectedList);
  const userUnlockedIds = new Set(userStats?.badges || []);
  const totalObsCount = collectedList.reduce((acc, s) => acc + (s.observations ? s.observations.length : 0), 0);

  // 뱃지별 현재 진행도 (14번 제외 13개)
  const progressById: Record<string, number> = {
    'badge-01': Math.min(1, collectedList.length),
    'badge-02': Math.min(5, streakDays),
    'badge-03': Math.min(3, plantCount),
    'badge-04': Math.min(2, birdCount),
    'badge-05': Math.min(2, insectCount),
    'badge-06': Math.min(5, collectedList.length),
    'badge-07': Math.min(3, countVisitedHabitats(collectedList)),
    'badge-08': Math.min(12, totalObsCount),
    'badge-09': Math.min(10, collectedList.length),
    'badge-10': Math.min(2, mammalCount),
    'badge-11': Math.min(10, totalObsCount > 0 ? 1 : 0),
    'badge-12': Math.min(5, totalObsCount > 0 ? 1 : 0),
    'badge-13': Math.min(2, aquaticCount),
  };

  // 14번(전설의 에코마스터): 나머지 13개가 모두 달성됐을 때만 해금 (자기 자신은 세지 않음)
  const achievedCount = EXPLORER_BADGES_MASTER.filter((d) => d.id !== 'badge-14').filter((d) => {
    const done = userUnlockedIds.has(d.id) || (progressById[d.id] ?? 0) >= d.targetProgress;
    return done;
  }).length;
  progressById['badge-14'] = achievedCount;

  return EXPLORER_BADGES_MASTER.map((def) => {
    const current = progressById[def.id] ?? 0;
    const isUnlocked = userUnlockedIds.has(def.id) || (def.targetProgress > 0 && current >= def.targetProgress);
    return {
      ...def,
      currentProgress: current,
      isUnlocked,
      unlockedAt: isUnlocked ? '2026.10.27' : undefined,
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
