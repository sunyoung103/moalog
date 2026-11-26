import { UserAccount } from '../types';

export interface Under14DesignFlags {
  under14: boolean;
  showShare: boolean;
  showCommunity: boolean;
}

/**
 * 6장. 14세 미만 디자인 제어 변수
 * 같은 화면을 복제하지 않고 3개 변수(under14, showShare, showCommunity)로 보이기/숨김을 제어합니다.
 */
export function getUnder14DesignFlags(userAccount?: UserAccount): Under14DesignFlags {
  const under14 = Boolean(userAccount?.isUnder14 || userAccount?.ageGroup === 'under14');
  return {
    under14,
    showShare: !under14,
    showCommunity: !under14,
  };
}

/**
 * 5-1. 레벨 n에 필요한 누적 XP 공식: (n - 1) * (5 * n + 20)
 */
export function getRequiredXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * (5 * level + 20);
}

export function getLevelFromXp(xp: number): number {
  let lvl = 1;
  while (lvl < 50 && xp >= getRequiredXpForLevel(lvl + 1)) {
    lvl += 1;
  }
  return lvl;
}

export function getTitleAdjectiveForLevel(level: number): string {
  if (level >= 30) return '전설의';
  if (level >= 20) return '마스터';
  if (level >= 10) return '숙련된';
  if (level >= 5) return '관찰하는';
  return '초보';
}

export const DAILY_NEW_SPECIES_XP_CAP = 10; // 하루 최대 10종 (300 XP)
export const NEW_SPECIES_XP_REWARD = 30; // 포착 +10, 새 종 +20 = +30 XP
export const QUEST_XP_REWARD = 10; // 퀘스트 1개당 +10 XP (하루 최대 30 XP)

export function getLevelProgress(xp: number) {
  const level = getLevelFromXp(xp);
  const currentLevelMinXp = getRequiredXpForLevel(level);
  const nextLevelMinXp = getRequiredXpForLevel(level + 1);
  const currentXpInLevel = Math.max(0, xp - currentLevelMinXp);
  const xpNeededForNext = Math.max(1, nextLevelMinXp - currentLevelMinXp);
  const percentage = Math.min(100, Math.floor((currentXpInLevel / xpNeededForNext) * 100));
  const title = getTitleAdjectiveForLevel(level);

  return {
    level,
    title,
    currentXp: currentXpInLevel,
    requiredXp: xpNeededForNext,
    percentage,
  };
}
