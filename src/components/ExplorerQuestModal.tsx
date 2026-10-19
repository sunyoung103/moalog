import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { UserStats, Specimen, EXPLORER_TITLES } from '../types';
import { evaluateExplorerBadges, EvaluatedBadge } from '../data/badges';
import { NATURALIST_PERSONAS } from '../data/hotspots';

interface ExplorerQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: UserStats;
  specimens?: Specimen[];
}

export const ExplorerQuestModal: React.FC<ExplorerQuestModalProps> = ({
  isOpen,
  onClose,
  userStats,
  specimens = [],
}) => {
  const [selectedBadge, setSelectedBadge] = useState<EvaluatedBadge | null>(null);

  if (!isOpen) return null;

  const badges = evaluateExplorerBadges(specimens, userStats);
  const unlockedBadges = badges.filter((b) => b.isUnlocked);
  const unlockedCount = unlockedBadges.length;

  const levelIdx =
    unlockedCount >= 14 ? 4 :
    unlockedCount >= 10 ? 3 :
    unlockedCount >= 6 ? 2 :
    unlockedCount >= 3 ? 1 : 0;

  const lang = 'ko';
  const currentPersona = NATURALIST_PERSONAS[userStats?.persona || 'general'] || NATURALIST_PERSONAS.general;
  const currentPersonaColor = currentPersona.accentColor || '#6B9F0A';

  const persona = (userStats.persona as keyof typeof EXPLORER_TITLES.ko.personas) || 'general';
  const personaData = EXPLORER_TITLES[lang].personas[persona] || EXPLORER_TITLES[lang].personas.general;
  const levelData = EXPLORER_TITLES[lang].levels[levelIdx] || EXPLORER_TITLES[lang].levels[0];

  const nextLevelIdx = levelIdx + 1;
  const nextLevelTitle = nextLevelIdx < 5 ? `${EXPLORER_TITLES[lang].levels[nextLevelIdx].adj} ${currentPersona.title}` : null;
  const nextLevelMinBadges = nextLevelIdx < 5 ? EXPLORER_TITLES[lang].levels[nextLevelIdx].minBadges : 14;
  const badgesNeeded = Math.max(0, nextLevelMinBadges - unlockedCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-stone-900">탐사 레벨 & 훈장</h2>
            <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {unlockedCount}/14 획득
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 scrollbar-none">
          {/* Level & Dynamic Title Display */}
          <div className="text-center space-y-1">
            <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
              Lv. {levelIdx + 1}
            </span>
            <h1
              className="text-2xl font-black tracking-tight mt-1 transition-colors"
              style={{ color: currentPersonaColor }}
            >
              <span>{levelData.adj}</span>{' '}
              <span>{currentPersona.title}</span>
            </h1>
          </div>

          {/* Badge Gallery Grid - Exactly matches Explorer Badges in ReportView */}
          <div className="bg-stone-50/80 p-3.5 rounded-3xl border border-stone-100">
            <div className="grid grid-cols-4 gap-2.5">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className="flex flex-col items-center text-center cursor-pointer group active:scale-95 transition-transform"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all shadow-2xs group-hover:scale-105 ${
                      badge.isUnlocked
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                        : 'bg-stone-200/70 border border-stone-200 text-stone-400'
                    }`}
                  >
                    {badge.isUnlocked ? (
                      <span>{badge.icon}</span>
                    ) : (
                      <Lock className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                  <span className="mt-1.5 text-[10px] font-bold text-stone-800 truncate max-w-full px-0.5 leading-tight">
                    {badge.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Requirement Info Card */}
          {nextLevelTitle ? (
            <div
              className="p-4 rounded-2xl border text-center space-y-1.5 transition-colors"
              style={{
                backgroundColor: `${currentPersonaColor}12`,
                borderColor: `${currentPersonaColor}35`,
              }}
            >
              <p className="text-xs text-stone-900 leading-relaxed">
                <strong style={{ color: currentPersonaColor }}>{nextLevelTitle}</strong>로 승급하려면<br />
                뱃지 <strong className="font-black text-sm" style={{ color: currentPersonaColor }}>{badgesNeeded}개</strong>를 더 획득하세요.
              </p>
              <div className="w-full bg-stone-200/80 rounded-full h-1.5 overflow-hidden mt-1">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (unlockedCount / nextLevelMinBadges) * 100)}%`,
                    backgroundColor: currentPersonaColor,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 font-extrabold text-xs">
              👑 모든 탐사 뱃지를 수집한 전설의 에코마스터입니다!
            </div>
          )}
        </div>
      </div>

      {/* Simple Badge Detail Popup */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-white p-6 rounded-3xl max-w-xs w-full text-center shadow-2xl border border-stone-100 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-2xs ${
                selectedBadge.isUnlocked
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                  : 'bg-stone-100 border border-stone-200 text-stone-400'
              }`}
            >
              {selectedBadge.isUnlocked ? (
                <span>{selectedBadge.icon}</span>
              ) : (
                <Lock className="w-6 h-6 text-stone-400" />
              )}
            </div>

            <div>
              <h3 className="font-black text-base text-stone-900">{selectedBadge.title}</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">{selectedBadge.desc}</p>
            </div>

            <div className="pt-1">
              {selectedBadge.isUnlocked ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                  획득 완료 ✦
                </span>
              ) : (
                <span className="text-[11px] font-mono font-medium text-stone-500 bg-stone-100 px-3 py-1 rounded-full border border-stone-200 inline-block">
                  진행 중 ({selectedBadge.currentProgress}/{selectedBadge.targetProgress} {selectedBadge.progressUnit})
                </span>
              )}
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="mt-3 w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
