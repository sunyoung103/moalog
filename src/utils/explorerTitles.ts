import { Specimen, UserAccount, UserStats, EXPLORER_TITLES } from '../types';
import { evaluateExplorerBadges } from '../data/badges';
import { getLevelFromXp, getTitleAdjectiveForLevel, NEW_SPECIES_XP_REWARD } from './levelPolicy';
import { NATURALIST_PERSONAS } from '../data/hotspots';

export interface ExplorerTitleOption {
  id: string;
  title: string;
  subtitle: string;
  isDefault?: boolean;
  isHidden?: boolean;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export function getExplorerTitleInfo(
  specimens: Specimen[],
  userStats: UserStats,
  userAccount?: UserAccount
) {
  const safeSpecimens = specimens || [];
  const collected = safeSpecimens.filter((s) => s.isCollected && !s.isPending && !s.isDeleted);
  const exp = Math.max(userStats.exp || 0, collected.length * NEW_SPECIES_XP_REWARD);
  const currentLevel = getLevelFromXp(exp);
  const titleAdj = getTitleAdjectiveForLevel(currentLevel);

  const personaKey = (userStats.persona || 'general') as keyof typeof EXPLORER_TITLES.ko.personas;
  const personaMeta = NATURALIST_PERSONAS[userStats.persona || 'general'] || NATURALIST_PERSONAS.general;
  const personaTitle = EXPLORER_TITLES.ko.personas[personaKey]?.title || personaMeta.title;
  const defaultTitle = `${titleAdj} ${personaTitle}`;

  const badges = evaluateExplorerBadges(safeSpecimens, userStats, userAccount);
  const hasNightObs = collected.some((sp) =>
    (sp.observations || []).some((obs) => {
      const hour = parseInt((obs.time || '').split(':')[0] || '', 10);
      return !Number.isNaN(hour) && (hour >= 19 || hour <= 5);
    })
  );
  const earliestDate =
    collected
      .flatMap((s) => (s.observations || []).map((o) => o.date).filter(Boolean))
      .sort()[0] || '최근';

  // Persona options (탐험가 유형별 칭호)
  const personaTitleList = [
    { key: 'general', name: '만능 탐험가' },
    { key: 'botanist', name: '식물 탐험가' },
    { key: 'birder', name: '조류 탐험가' },
    { key: 'entomologist', name: '곤충 탐험가' },
    { key: 'mammalogist', name: '포유류 탐험가' },
    { key: 'herpetologist', name: '양서·파충류 탐험가' },
    { key: 'ichthyologist', name: '어류 탐험가' },
    { key: 'mycologist', name: '균류 탐험가' },
  ];

  const personaOptions: ExplorerTitleOption[] = personaTitleList.map((p) => ({
    id: `persona-${p.key}`,
    title: `${titleAdj} ${p.name}`,
    subtitle: `탐험가 유형 칭호 · ${p.name}`,
    isUnlocked: true,
  }));

  const hiddenOptions: ExplorerTitleOption[] = [
    {
      id: 'title-night-owl',
      title: '한밤의 올빼미',
      subtitle: `숨겨진 칭호 · ${earliestDate}에 얻었어요`,
      isHidden: true,
      isUnlocked: hasNightObs || badges.filter((b) => b.isUnlocked).length >= 3,
      unlockedAt: earliestDate,
    },
    {
      id: 'title-bird-keeper',
      title: '물가의 관찰자',
      subtitle: '숨겨진 칭호 · 수변 생태계 2회 이상 기록',
      isHidden: true,
      isUnlocked:
        collected.filter((s) => s.category === 'birds' || s.category === 'fishes' || (s.habitatType || '').includes('하천') || (s.habitatType || '').includes('습지')).length >= 2,
      unlockedAt: earliestDate,
    },
    {
      id: 'title-master-collector',
      title: '숲속 백과사전',
      subtitle: '숨겨진 칭호 · 10종 이상 도감 등록',
      isHidden: true,
      isUnlocked: collected.length >= 10,
      unlockedAt: earliestDate,
    },
  ];

  const defaultOption: ExplorerTitleOption = {
    id: 'default',
    title: defaultTitle,
    subtitle: '기본 · 레벨에 따라 자동으로 바뀌어요',
    isDefault: true,
    isUnlocked: true,
  };

  const unlockedHidden = hiddenOptions.filter((o) => o.isUnlocked);
  const lockedHiddenCount = hiddenOptions.filter((o) => !o.isUnlocked).length;

  const allAvailableOptions = [defaultOption, ...personaOptions, ...unlockedHidden];
  const selectedId = userStats.selectedTitleId || 'default';
  const activeOption =
    allAvailableOptions.find((o) => o.id === selectedId) || defaultOption;

  return {
    currentLevel,
    exp,
    defaultTitle,
    activeTitle: activeOption.title,
    activeTitleId: activeOption.id,
    defaultOption,
    personaOptions,
    unlockedHidden,
    lockedHiddenCount,
  };
}
