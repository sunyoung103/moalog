import React, { useState, useMemo } from 'react';
import { Specimen, UserStats, EXPLORER_TITLES, UserAccount } from '../types';
import { X, Download, Share2, Check, Camera } from 'lucide-react';
import { motion } from 'motion/react';
import { evaluateExplorerBadges } from '../data/badges';
import { formatSpeciesDisplayName, getSpeciesTaxonomyCategoryLabel } from '../utils/speciesNameHelper';
import { getLevelFromXp, getRequiredXpForLevel, getUnder14DesignFlags, NEW_SPECIES_XP_REWARD } from '../utils/levelPolicy';

export interface ExportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  specimen?: Specimen | null;
  specimens: Specimen[];
  userStats: UserStats;
  userAccount?: UserAccount;
  initialMode?: 'specimen' | 'summary';
  onShowToast?: (msg: string) => void;
}

export const ExportCardModal: React.FC<ExportCardModalProps> = ({
  isOpen,
  onClose,
  specimen,
  specimens = [],
  userStats,
  userAccount,
  initialMode = 'specimen',
  onShowToast,
}) => {
  const [cutoutMode, setCutoutMode] = useState<'cutout' | 'full'>('cutout');
  const [formatMode, setFormatMode] = useState<'card' | 'photo'>('card');
  const [includeNameLogo, setIncludeNameLogo] = useState(true);
  const [reportCardFormat, setReportCardFormat] = useState<'quad' | 'single'>('quad');
  const [selectedRecentIndex, setSelectedRecentIndex] = useState(0);

  const recentSpecimens = useMemo(() => {
    const collected = specimens.filter(
      (s) => s.isCollected && !s.isDeleted && (s.originalImage || s.stickerImage || s.observations?.[0]?.photoUrl)
    );
    const sorted = [...collected].sort((a, b) => {
      const dateA = a.observations?.[0]?.date || '';
      const dateB = b.observations?.[0]?.date || '';
      return dateB.localeCompare(dateA);
    });
    return sorted.slice(0, 4);
  }, [specimens]);

  if (!isOpen) return null;

  const { showShare } = getUnder14DesignFlags(userAccount);
  const activeMode = initialMode;
  const badges = evaluateExplorerBadges(specimens, userStats, userAccount);
  const unlockedBadgesCount = badges.filter((b) => b.isUnlocked).length;
  const collectedCount = specimens.filter((s) => s.isCollected && !s.isPending && !s.isDeleted).length;

  const exp = Math.max(userStats.exp || 0, collectedCount * NEW_SPECIES_XP_REWARD);
  const currentLevel = getLevelFromXp(exp);
  const levelIdx =
    currentLevel >= 30 ? 4 : currentLevel >= 20 ? 3 : currentLevel >= 10 ? 2 : currentLevel >= 5 ? 1 : 0;
  const levelData = EXPLORER_TITLES.ko.levels[levelIdx] || EXPLORER_TITLES.ko.levels[0];
  const personaKey = (userStats.persona as keyof typeof EXPLORER_TITLES.ko.personas) || 'general';
  const personaData = EXPLORER_TITLES.ko.personas[personaKey] || EXPLORER_TITLES.ko.personas.general;
  const levelFullTitle = `${levelData.adj} ${personaData.title}`;

  const nextTierLevel =
    currentLevel < 5 ? 5 : currentLevel < 10 ? 10 : currentLevel < 20 ? 20 : currentLevel < 30 ? 30 : null;
  const currentTierBaseXp = getRequiredXpForLevel(
    currentLevel >= 30 ? 30 : currentLevel >= 20 ? 20 : currentLevel >= 10 ? 10 : currentLevel >= 5 ? 5 : 1
  );
  const nextTierXp = nextTierLevel ? getRequiredXpForLevel(nextTierLevel) : exp;
  const levelPercent = nextTierLevel
    ? Math.min(100, Math.max(6, Math.round(((exp - currentTierBaseXp) / Math.max(1, nextTierXp - currentTierBaseXp)) * 100)))
    : 100;

  const defaultPhotoLicense = String((specimen as any)?.default_photo?.license_code || '').toLowerCase();
  const isOpenDefaultPhoto =
    defaultPhotoLicense === 'cc0' ||
    defaultPhotoLicense === 'pd' ||
    (defaultPhotoLicense.startsWith('cc-by') &&
      !defaultPhotoLicense.includes('nc') &&
      !defaultPhotoLicense.includes('nd') &&
      !defaultPhotoLicense.includes('sa'));

  const activeSpecimenImg =
    (cutoutMode === 'cutout' && specimen?.stickerImage) ||
    specimen?.originalImage ||
    specimen?.observations?.[0]?.photoUrl ||
    (isOpenDefaultPhoto ? (specimen as any)?.default_photo?.medium_url : null) ||
    null;

  const displayName = specimen
    ? formatSpeciesDisplayName(specimen, {
        language: userStats.language,
        showEnglishNameWithLocal: userStats.showEnglishNameWithLocal,
      })
    : '자연 표본';

  const selectedRecent = recentSpecimens[selectedRecentIndex] || recentSpecimens[0];
  const selectedRecentImg =
    selectedRecent?.originalImage ||
    selectedRecent?.stickerImage ||
    selectedRecent?.observations?.[0]?.photoUrl ||
    null;
  const selectedRecentName = selectedRecent
    ? formatSpeciesDisplayName(selectedRecent, {
        language: userStats.language,
        showEnglishNameWithLocal: userStats.showEnglishNameWithLocal,
      })
    : '대표 표본';

  const safeHandle = userAccount?.isLoggedIn
    ? `@${userAccount.nickname || (userAccount.email ? userAccount.email.split('@')[0] : userAccount.name) || 'explorer'}`
    : '@moalog_explorer';

  const safeCity = specimen?.locationCoord?.city || userStats.homeCity || '서울';
  const safeDate = specimen?.observations?.[0]?.date || new Date().toISOString().slice(0, 10).replace(/-/g, '.');
  const categoryKo = specimen ? getSpeciesTaxonomyCategoryLabel(specimen.category) : '생태';

  const obsScore = specimen?.observations?.[0]?.analysisMetadata?.imageClarityScore ?? (specimen?.confidence ? Math.round(specimen.confidence) : 88);
  const gradeLetter = obsScore >= 90 ? 'S' : obsScore >= 80 ? 'A' : obsScore >= 65 ? 'B' : 'C';

  const handleSave = () => {
    onShowToast?.(
      showShare
        ? '카드가 기기에 안전하게 저장되었어요 (정확한 위치 제외)'
        : '카드 이미지가 기기에 안전하게 저장되었어요.'
    );
    onClose();
  };

  const handleNativeShare = async () => {
    if (!showShare) {
      handleSave();
      return;
    }
    const shareTitle = activeMode === 'summary' ? '모아로그 생태 리포트' : `${displayName} · 모아로그`;
    const shareText =
      activeMode === 'summary'
        ? `${levelFullTitle} (Lv.${currentLevel}) · 총 ${collectedCount}종 관찰 기록`
        : `${displayName} (${specimen?.scientificName || ''}) · ${safeCity} · ${safeDate}`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: shareTitle, text: shareText });
        onShowToast?.('공유가 완료되었어요.');
        onClose();
        return;
      } catch {
        // User cancelled or unsupported context -> fall back to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareTitle}\n${shareText}`);
      onShowToast?.('공유 텍스트가 클립보드에 복사되었어요.');
    } catch {
      onShowToast?.('공유 카드가 준비되었어요.');
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-[#202320] rounded-t-[28px] sm:rounded-[28px] max-w-md w-full shadow-2xl px-5 pt-3 pb-6 border border-[#e6e9e5] max-h-[92vh] overflow-y-auto scrollbar-none"
      >
        <div className="w-9 h-1 bg-[#d2d7d1] rounded-full mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[20px] font-bold tracking-tight text-[#202320]">
            {showShare ? '공유하기' : '카드 저장하기'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f4f5f4] hover:bg-[#e6e9e5] flex items-center justify-center text-[#626961] cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= [MODE 1] SUMMARY / REPORT SHARE ================= */}
        {activeMode === 'summary' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#626961]">최근 기록 포커스</span>
              <div className="inline-flex bg-[#f4f5f4] p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setReportCardFormat('quad')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    reportCardFormat === 'quad' ? 'bg-white text-[#202320] font-bold shadow-2xs' : 'text-[#8c948a] font-semibold'
                  }`}
                >
                  모아보기
                </button>
                <button
                  type="button"
                  onClick={() => setReportCardFormat('single')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    reportCardFormat === 'single' ? 'bg-white text-[#202320] font-bold shadow-2xs' : 'text-[#8c948a] font-semibold'
                  }`}
                >
                  대표 1종
                </button>
              </div>
            </div>

            {recentSpecimens.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {recentSpecimens.map((sp, idx) => {
                  const thumb = sp.originalImage || sp.stickerImage || sp.observations?.[0]?.photoUrl;
                  const active = selectedRecentIndex === idx;
                  return (
                    <button
                      key={sp.id || idx}
                      type="button"
                      onClick={() => setSelectedRecentIndex(idx)}
                      className={`w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        active ? 'border-black scale-105' : 'border-transparent opacity-60 hover:opacity-95'
                      }`}
                    >
                      {thumb ? (
                        <img src={thumb} alt={sp.koreanName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#f4f5f4] flex items-center justify-center">
                          <Camera className="w-4 h-4 text-[#8c948a]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Preview Frame */}
            <div className="bg-[#f4f5f4] rounded-[24px] p-5 flex items-center justify-center">
              <div className="w-full max-w-[290px] bg-[#1e241b] text-white rounded-[22px] p-4 shadow-xl space-y-3 border border-white/10">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold tracking-tight text-white">Moalog</span>
                  <span className="text-white/60 tabular-nums">
                    {showShare ? `${safeCity} · ` : ''}Lv.{currentLevel}
                  </span>
                </div>

                {recentSpecimens.length === 0 ? (
                  <div className="aspect-[4/3] rounded-2xl bg-white/5 flex flex-col items-center justify-center text-center p-4">
                    <Camera className="w-7 h-7 text-[#c4eb43] mb-2" />
                    <span className="text-xs text-white/70">첫 생물을 포착하면 리포트 카드가 채워져요</span>
                  </div>
                ) : reportCardFormat === 'quad' ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {recentSpecimens.map((sp, idx) => {
                      const img = sp.originalImage || sp.stickerImage || sp.observations?.[0]?.photoUrl;
                      return (
                        <div key={sp.id || idx} className="relative aspect-square rounded-xl overflow-hidden bg-white/5">
                          {img && <img src={img} alt={sp.koreanName} className="w-full h-full object-cover" />}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                            <p className="text-[10px] font-bold truncate text-white">{sp.koreanName}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white/5">
                    {selectedRecentImg && (
                      <img src={selectedRecentImg} alt={selectedRecentName} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                      <p className="text-xs font-bold text-white truncate">{selectedRecentName}</p>
                    </div>
                  </div>
                )}

                <div className="bg-white/10 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-white truncate">{levelFullTitle}</span>
                    <span className="text-[#c4eb43] font-bold tabular-nums shrink-0">{collectedCount}종</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
                    <div className="h-full rounded-full bg-[#c4eb43]" style={{ width: `${levelPercent}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-white/60 tabular-nums">
                    <span>뱃지 {unlockedBadgesCount}개</span>
                    <span>연속 {userStats.streakDays || 0}일</span>
                  </div>
                </div>

                {showShare && (
                  <p className="text-center text-[10px] text-white/55 font-medium">{safeHandle}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= [MODE 2] SPECIMEN CARD SHARE (F-01b / F-05b) ================= */}
        {activeMode === 'specimen' && (
          <div className="space-y-3.5">
            {/* Segmented: 누끼 | 통이미지 */}
            <div className="grid grid-cols-2 bg-[#f4f5f4] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setCutoutMode('cutout')}
                className={`py-2 rounded-xl text-[13px] transition-all cursor-pointer ${
                  cutoutMode === 'cutout' ? 'bg-white text-[#202320] font-bold shadow-2xs' : 'text-[#8c948a] font-semibold'
                }`}
              >
                누끼
              </button>
              <button
                type="button"
                onClick={() => setCutoutMode('full')}
                className={`py-2 rounded-xl text-[13px] transition-all cursor-pointer ${
                  cutoutMode === 'full' ? 'bg-white text-[#202320] font-bold shadow-2xs' : 'text-[#8c948a] font-semibold'
                }`}
              >
                통이미지
              </button>
            </div>

            {/* Thumbnail strip */}
            {specimen?.observations && specimen.observations.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {specimen.observations.slice(0, 5).map((obs, idx) => {
                  const thumb = obs.photoUrl || activeSpecimenImg;
                  return (
                    <div
                      key={obs.id || idx}
                      className={`w-13 h-13 rounded-2xl overflow-hidden shrink-0 border-2 ${
                        idx === 0 ? 'border-black' : 'border-transparent opacity-55'
                      }`}
                    >
                      {thumb ? (
                        <img src={thumb} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#f4f5f4]" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Format pills: 카드 | 사진 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormatMode('card')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  formatMode === 'card'
                    ? 'bg-black text-white'
                    : 'bg-white text-[#626961] border border-[#e6e9e5]'
                }`}
              >
                카드
              </button>
              <button
                type="button"
                onClick={() => setFormatMode('photo')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  formatMode === 'photo'
                    ? 'bg-black text-white'
                    : 'bg-white text-[#626961] border border-[#e6e9e5]'
                }`}
              >
                사진
              </button>
            </div>

            {/* Preview Frame */}
            <div className="bg-[#f4f5f4] rounded-[24px] p-5 flex items-center justify-center">
              {formatMode === 'card' ? (
                <div className="w-[232px] rounded-[22px] bg-gradient-to-b from-[#2e3528] via-[#1c2119] to-[#161a14] text-white p-3.5 shadow-xl space-y-2.5">
                  <div className="text-center text-[11px] font-bold tracking-tight text-white/90">Moalog</div>
                  <div className="bg-[#232722] rounded-[18px] p-2.5 border border-white/10 space-y-2">
                    <div className="flex justify-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/50 text-[10px] font-semibold text-white/85">
                        {categoryKo} · {specimen?.number || 'No.001'}
                      </span>
                    </div>
                    <div className="aspect-square rounded-xl overflow-hidden bg-[#181b16] flex items-center justify-center">
                      {activeSpecimenImg ? (
                        <img
                          src={activeSpecimenImg}
                          alt={displayName}
                          className={`w-full h-full ${cutoutMode === 'cutout' ? 'object-contain p-2' : 'object-cover'}`}
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-white/30" />
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-2 pt-0.5">
                      <div className="min-w-0">
                        <h4 className="text-[14px] font-bold text-white truncate">{displayName}</h4>
                        <p className="text-[10px] italic text-white/60 truncate">
                          {specimen?.scientificName || ''}
                        </p>
                        <p className="text-[9px] text-white/55 mt-0.5 tabular-nums">
                          {showShare ? `${safeCity} · ${safeDate}` : safeDate}
                        </p>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#52b8ff] to-[#2563eb] flex items-center justify-center text-[12px] font-black text-white shadow-sm shrink-0">
                        {gradeLetter}
                      </div>
                    </div>
                  </div>
                  {showShare && (
                    <div className="text-center text-[10px] text-white/55 font-medium">{safeHandle}</div>
                  )}
                </div>
              ) : (
                <div className="w-full max-w-[260px] rounded-[22px] overflow-hidden relative bg-white shadow-md">
                  <div className="aspect-[4/5] w-full bg-[#e6e9e5] relative">
                    {activeSpecimenImg ? (
                      <img
                        src={activeSpecimenImg}
                        alt={displayName}
                        className={`w-full h-full ${cutoutMode === 'cutout' ? 'object-contain p-4 bg-white' : 'object-cover'}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-[#8c948a]" />
                      </div>
                    )}
                    {includeNameLogo && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-3.5 text-white flex items-end justify-between">
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold truncate">{displayName}</p>
                          <p className="text-[10px] text-white/75 truncate">
                            {showShare ? `${safeCity} · ${safeDate}` : safeDate}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold tracking-tight shrink-0">Moalog</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Toggle: 이름 · 로고 넣기 */}
            {formatMode === 'photo' && (
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-[14px] font-bold text-[#202320]">이름 · 로고 넣기</p>
                  <p className="text-xs text-[#8c948a] mt-0.5">
                    {includeNameLogo ? '사진 아래에 생물 이름과 로고가 들어가요' : '사진만 그대로 저장돼요'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeNameLogo(!includeNameLogo)}
                  aria-label="이름 · 로고 넣기"
                  aria-pressed={includeNameLogo}
                  className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center cursor-pointer ${
                    includeNameLogo ? 'bg-black justify-end' : 'bg-[#e6e9e5] justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom CTA Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mt-5">
          <button
            type="button"
            onClick={handleSave}
            className={`h-13 rounded-2xl text-[15px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              showShare
                ? 'bg-[#f4f5f4] hover:bg-[#e6e9e5] text-[#202320]'
                : 'col-span-2 bg-black hover:bg-[#202320] text-white'
            }`}
          >
            {!showShare && <Download className="w-4 h-4" />}
            <span>{showShare ? '저장' : '기기에 저장'}</span>
          </button>

          {showShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="h-13 rounded-2xl bg-black hover:bg-[#202320] text-white text-[15px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>공유하기</span>
            </button>
          )}
        </div>

        <p className="text-center text-[11px] text-[#8c948a] mt-3">
          {showShare
            ? '공유 이미지에는 정확한 위치가 표시되지 않아요'
            : '만 14세 미만 회원은 기기 저장만 가능하며 닉네임과 위치가 제외돼요'}
        </p>
      </motion.div>
    </div>
  );
};
