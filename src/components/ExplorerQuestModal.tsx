import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { UserStats, Specimen, UserAccount } from '../types';
import {
  evaluateExplorerBadges,
  EvaluatedBadge,
  TOTAL_POLICY_BADGES_ADULT,
  TOTAL_POLICY_BADGES_UNDER14,
} from '../data/badges';
import { NATURALIST_PERSONAS } from '../data/hotspots';
import {
  getLevelFromXp,
  getRequiredXpForLevel,
  getTitleAdjectiveForLevel,
  getUnder14DesignFlags,
  NEW_SPECIES_XP_REWARD,
} from '../utils/levelPolicy';
import { getExplorerTitleInfo } from '../utils/explorerTitles';

interface ExplorerQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: UserStats;
  userAccount?: UserAccount;
  specimens?: Specimen[];
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

export const ExplorerQuestModal: React.FC<ExplorerQuestModalProps> = ({
  isOpen,
  onClose,
  userStats,
  userAccount,
  specimens = [],
}) => {
  const [selectedBadge, setSelectedBadge] = useState<EvaluatedBadge | null>(null);
  const [shareBadge, setShareBadge] = useState<EvaluatedBadge | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const titleInfo = useMemo(
    () => getExplorerTitleInfo(specimens, userStats, userAccount),
    [specimens, userStats, userAccount]
  );

  if (!isOpen) return null;

  const { under14, showShare } = getUnder14DesignFlags(userAccount);
  const badges = evaluateExplorerBadges(specimens, userStats, userAccount);
  const unlockedBadges = badges.filter((b) => b.isUnlocked);
  const unlockedCount = unlockedBadges.length;
  const totalPolicyCount = under14 ? TOTAL_POLICY_BADGES_UNDER14 : TOTAL_POLICY_BADGES_ADULT;

  const collectedCount = specimens.filter((s) => s.isCollected && !s.isPending).length;
  const exp = Math.max(userStats.exp || 0, collectedCount * NEW_SPECIES_XP_REWARD);
  const currentLevel = getLevelFromXp(exp);

  const nextTierLevel =
    currentLevel < 5 ? 5 : currentLevel < 10 ? 10 : currentLevel < 20 ? 20 : currentLevel < 30 ? 30 : null;
  const currentTierBaseXp = getRequiredXpForLevel(
    currentLevel >= 30 ? 30 : currentLevel >= 20 ? 20 : currentLevel >= 10 ? 10 : currentLevel >= 5 ? 5 : 1
  );
  const nextTierXp = nextTierLevel ? getRequiredXpForLevel(nextTierLevel) : exp;
  const expNeeded = nextTierLevel ? Math.max(0, nextTierXp - exp) : 0;

  const currentPersona = NATURALIST_PERSONAS[userStats?.persona || 'general'] || NATURALIST_PERSONAS.general;
  const nextLevelTitle = nextTierLevel
    ? `${getTitleAdjectiveForLevel(nextTierLevel)} ${currentPersona.title}`
    : null;

  const progressPct = nextTierLevel
    ? Math.min(100, Math.max(4, ((exp - currentTierBaseXp) / Math.max(1, nextTierXp - currentTierBaseXp)) * 100))
    : 100;

  const safeNickname = userAccount?.isLoggedIn
    ? `@${userAccount.nickname || (userAccount.email ? userAccount.email.split('@')[0] : userAccount.name) || 'explorer'}`
    : '@moalog_explorer';

  const triggerToast = (msg: string) => {
    setShareToast(msg);
    setTimeout(() => setShareToast(null), 2200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn select-none"
      onClick={onClose}
    >
      {shareToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[80] px-4 py-2 rounded-full bg-black text-white text-xs font-semibold shadow-lg">
          {shareToast}
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white rounded-t-[28px] sm:rounded-[28px] shadow-xl overflow-hidden border border-[#e6e9e5] flex flex-col max-h-[88vh]"
      >
        <div className="w-9 h-1 bg-[#d2d7d1] rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#e6e9e5] shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-bold text-[#202320]">탐사 레벨 &amp; 뱃지</h2>
            <span className="text-[11px] font-bold text-[#6d8911] bg-[#f4fbdd] px-2.5 py-0.5 rounded-full border border-[#c4eb43] tabular-nums">
              {unlockedCount} / {totalPolicyCount}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f5f4] flex items-center justify-center text-[#626961] hover:text-[#202320] transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 scrollbar-none bg-[#fbfbfb]">
          {/* Level & Dynamic Title Display */}
          <div className="bg-white rounded-[20px] border border-[#e6e9e5] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#f4fbdd] border border-[#c4eb43] text-[12px] font-bold text-[#6d8911] tabular-nums">
                Lv.{currentLevel}
              </span>
              <span className="text-xs font-semibold text-[#626961] tabular-nums">{exp} XP</span>
            </div>

            <div>
              <h1 className="text-[20px] font-bold tracking-tight text-[#202320]">
                {titleInfo.activeTitle}
              </h1>
              {nextLevelTitle ? (
                <p className="text-xs text-[#626961] mt-1">
                  다음 단계 <strong className="text-[#202320]">{nextLevelTitle}</strong> · Lv.{nextTierLevel}까지{' '}
                  <strong className="text-[#202320] tabular-nums">{expNeeded} XP</strong> 남음
                </p>
              ) : (
                <p className="text-xs font-semibold text-[#6d8911] mt-1">
                  최고 등급 칭호 구간(Lv.30+)에 도달했어요
                </p>
              )}
            </div>

            <div className="w-full bg-[#f4f5f4] rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#c4eb43] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Badge Gallery Grid (획득 / 미획득 2상태) */}
          <div className="bg-white p-4 rounded-[20px] border border-[#e6e9e5]">
            <div className="grid grid-cols-4 gap-3">
              {badges.map((badge) => (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => setSelectedBadge(badge)}
                  className="flex flex-col items-center text-center cursor-pointer group active:scale-95 transition-transform"
                >
                  <div
                    className={`w-13 h-13 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                      badge.isUnlocked
                        ? 'bg-[#f4fbdd] border border-[#c4eb43] text-[#202320]'
                        : 'bg-[#f4f5f4] border border-[#e6e9e5] text-[#202320]'
                    }`}
                  >
                    <span className={badge.isUnlocked ? '' : 'grayscale opacity-40'}>{badge.icon}</span>
                  </div>
                  <span className="mt-1.5 text-[11px] font-semibold whitespace-normal break-words max-w-full px-0.5 leading-tight text-[#202320]">
                    {badge.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Badge Detail Popup (47 배지 상세) */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/55 backdrop-blur-xs"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-white px-5 pt-3 pb-6 rounded-t-[28px] sm:rounded-[28px] max-w-[360px] w-full shadow-xl border border-[#e6e9e5] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 bg-[#d2d7d1] rounded-full mx-auto sm:hidden" />

            <div>
              <h3 className="text-[20px] font-bold text-[#202320]">{selectedBadge.title}</h3>
              <p className="text-xs text-[#8c948a] mt-0.5">
                {selectedBadge.category} 뱃지 ·{' '}
                {selectedBadge.isUnlocked ? `${selectedBadge.unlockedAt || '최근'} 획득` : '미획득'}
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-[22px] shrink-0 flex items-center justify-center text-4xl border border-[#e6e9e5] bg-[#f4f5f4]">
                <span className={selectedBadge.isUnlocked ? '' : 'grayscale opacity-40'}>
                  {selectedBadge.icon}
                </span>
              </div>

              <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f4f5f4] text-[11px] font-semibold text-[#626961]">
                    {selectedBadge.isUnlocked ? '획득' : '미획득'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#a88200] text-white text-[11px] font-bold tabular-nums">
                    {getTierBadgeLabel(selectedBadge.tier)} · +{selectedBadge.xpReward} XP
                  </span>
                </div>
                <p className="text-[13px] text-[#202320] font-medium leading-snug pt-0.5">
                  {selectedBadge.desc}
                </p>
              </div>
            </div>

            <div className="bg-[#f4f5f4] rounded-2xl p-3.5 space-y-1">
              <span className="text-[11px] font-bold text-[#8c948a] block uppercase tracking-wide">TIP</span>
              <p className="text-[13px] text-[#202320] leading-relaxed">
                {selectedBadge.isUnlocked
                  ? '얻은 뱃지는 내 프로필과 보관함에서 언제든 다시 볼 수 있어요'
                  : selectedBadge.tip}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {selectedBadge.isUnlocked && showShare && (
                <button
                  type="button"
                  onClick={() => {
                    const b = selectedBadge;
                    setSelectedBadge(null);
                    setShareBadge(b);
                  }}
                  className="w-full h-13 bg-white hover:bg-[#f4f5f4] border border-[#e6e9e5] text-[#202320] rounded-2xl text-[15px] font-bold transition-colors cursor-pointer"
                >
                  뱃지 자랑하기
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="w-full h-13 bg-black hover:bg-[#202320] text-white rounded-2xl text-[15px] font-bold transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Badge Share Bottom Sheet (F-13) */}
      {shareBadge && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setShareBadge(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] px-5 pt-3 pb-6 shadow-2xl border border-[#e6e9e5] space-y-4"
          >
            <div className="w-9 h-1 bg-[#d2d7d1] rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-bold text-[#202320]">공유하기</h3>
              <button
                type="button"
                onClick={() => setShareBadge(null)}
                className="w-8 h-8 rounded-full bg-[#f4f5f4] flex items-center justify-center text-[#626961] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#f4f5f4] rounded-[24px] p-6 flex items-center justify-center">
              <div className="w-[230px] rounded-[22px] bg-gradient-to-b from-[#fafafa] via-[#f0f1ef] to-[#e4e6e3] border border-[#d9dcd7] shadow-lg p-4 text-center space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[#626961]">
                  <span className="font-bold text-[#202320]">Moalog</span>
                  <span className="tabular-nums">{shareBadge.unlockedAt || '2026.11'}</span>
                </div>
                <div className="w-24 h-24 mx-auto rounded-full bg-white border-4 border-[#d9b85f] shadow-md flex items-center justify-center text-5xl">
                  {shareBadge.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="text-[16px] font-bold text-[#202320]">{shareBadge.title}</h4>
                  <p className="text-[11px] text-[#626961] leading-snug">{shareBadge.desc}</p>
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
                  setShareBadge(null);
                  triggerToast('뱃지 카드를 기기에 저장했어요');
                }}
                className="h-13 rounded-2xl bg-[#f4f5f4] hover:bg-[#e6e9e5] text-[#202320] text-[15px] font-bold cursor-pointer"
              >
                저장
              </button>
              <button
                type="button"
                onClick={async () => {
                  const text = `모아로그에서 '${shareBadge.title}' 뱃지를 얻었어요!`;
                  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
                    try {
                      await navigator.share({ title: shareBadge.title, text });
                    } catch {}
                  } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    try {
                      await navigator.clipboard.writeText(text);
                    } catch {}
                  }
                  setShareBadge(null);
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
          </div>
        </div>
      )}
    </div>
  );
};
