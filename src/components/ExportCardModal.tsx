import React, { useState, useEffect, useMemo } from 'react';
import { Specimen, UserStats, EXPLORER_TITLES } from '../types';
import {
  X,
  Download,
  Share2,
  Activity,
  MapPin,
  Shield,
  Award,
  Sparkles,
  Check,
  Copy,
  Compass,
  BookOpen,
  Camera,
  Quote,
  MessageSquare,
  Flame,
  Star,
  Layers,
} from 'lucide-react';
import { motion } from 'motion/react';
import { evaluateExplorerBadges } from '../data/badges';
import { NATURALIST_PERSONAS } from '../data/hotspots';
import { formatSpeciesDisplayName } from '../utils/speciesNameHelper';

export interface ExportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  specimen?: Specimen | null;
  specimens: Specimen[];
  userStats: UserStats;
  initialMode?: 'specimen' | 'summary';
  onShowToast?: (msg: string) => void;
}

export const ExportCardModal: React.FC<ExportCardModalProps> = ({
  isOpen,
  onClose,
  specimen,
  specimens = [],
  userStats,
  initialMode = 'specimen',
  onShowToast,
}) => {
  const [designStyle, setDesignStyle] = useState<'info_card' | 'base_image' | 'card_style'>('info_card');
  const [reportCardFormat, setReportCardFormat] = useState<'quad' | 'single'>('quad');
  const [selectedRecentIndex, setSelectedRecentIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Compute 4 recent collected specimens with valid photos
  const recentSpecimens = useMemo(() => {
    const collected = specimens.filter(
      (s) => s.isCollected && !s.isDeleted && (s.originalImage || s.stickerImage || s.observations?.[0]?.photoUrl)
    );
    const sorted = [...collected].sort((a, b) => {
      const dateA = a.observations?.[0]?.date || '';
      const dateB = b.observations?.[0]?.date || '';
      return dateB.localeCompare(dateA);
    });
    const list = [...sorted];
    if (list.length < 4) {
      for (const sp of specimens) {
        if (!list.some((item) => item.id === sp.id) && (sp.originalImage || sp.stickerImage)) {
          list.push(sp);
          if (list.length >= 4) break;
        }
      }
    }
    return list.slice(0, 4);
  }, [specimens]);

  // One-line review (한줄평) state for detail share
  const initialReview = useMemo(() => {
    if (!specimen) return '도심 생태계에서 고유한 생태 형질이 생생하게 관찰된 우수 표본입니다.';
    return (
      specimen.observations?.[0]?.memo ||
      specimen.seasonalTip ||
      `${specimen.koreanName}의 고유 형태 형질과 생태적 특징이 기록된 소중한 관찰 표본입니다.`
    );
  }, [specimen]);

  const [oneLineReview, setOneLineReview] = useState(initialReview);

  useEffect(() => {
    setOneLineReview(initialReview);
  }, [initialReview]);

  if (!isOpen) return null;

  const activeMode = initialMode;
  const activePersona = NATURALIST_PERSONAS[userStats.persona || 'general'] || NATURALIST_PERSONAS['general'];
  const badges = evaluateExplorerBadges(specimens, userStats);
  const unlockedBadges = badges.filter((b) => b.isUnlocked);
  const unlockedBadgesCount = unlockedBadges.length;
  const collectedCount = specimens.filter((s) => s.isCollected && !s.isPending && !s.isDeleted).length;

  // Level computation
  const levelIdx =
    unlockedBadgesCount >= 14 ? 4 :
    unlockedBadgesCount >= 10 ? 3 :
    unlockedBadgesCount >= 6 ? 2 :
    unlockedBadgesCount >= 3 ? 1 : 0;
  const levelNumber = levelIdx + 1;
  const levelData = EXPLORER_TITLES.ko.levels[levelIdx] || EXPLORER_TITLES.ko.levels[0];
  const personaKey = (userStats.persona as keyof typeof EXPLORER_TITLES.ko.personas) || 'general';
  const personaData = EXPLORER_TITLES.ko.personas[personaKey] || EXPLORER_TITLES.ko.personas.general;
  const levelFullTitle = `${levelData.adj} ${personaData.title}`;

  const thresholds = [3, 6, 10, 14, 20];
  const prevThresholds = [0, 3, 6, 10, 14];
  const nextGoal = thresholds[levelIdx];
  const prevGoal = prevThresholds[levelIdx];
  const levelPercent = Math.min(
    100,
    Math.max(12, Math.round(((unlockedBadgesCount - prevGoal) / (nextGoal - prevGoal)) * 100))
  );

  const specimenImg =
    specimen?.originalImage ||
    specimen?.stickerImage ||
    (specimen as any)?.default_photo?.medium_url ||
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';

  const displayName = specimen
    ? formatSpeciesDisplayName(specimen, {
        language: userStats.language,
        showEnglishNameWithLocal: userStats.showEnglishNameWithLocal,
      })
    : '미확인 생물';

  const selectedRecent = recentSpecimens[selectedRecentIndex] || recentSpecimens[0];
  const selectedRecentImg =
    selectedRecent?.originalImage ||
    selectedRecent?.stickerImage ||
    selectedRecent?.observations?.[0]?.photoUrl ||
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';
  const selectedRecentName = selectedRecent
    ? formatSpeciesDisplayName(selectedRecent, {
        language: userStats.language,
        showEnglishNameWithLocal: userStats.showEnglishNameWithLocal,
      })
    : '대표 표본';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (onShowToast) onShowToast('클립보드에 복사되었습니다!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-stone-900 text-stone-100 rounded-[32px] max-w-md w-full shadow-2xl p-5 sm:p-6 border border-white/10 overflow-y-auto max-h-[92vh] relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              {activeMode === 'summary' ? <Sparkles className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-black text-white text-base">
                {activeMode === 'summary' ? '종합 생태 리포트 카드 공유' : '생태 표본 카드 공유'}
              </h3>
              <p className="text-[11px] text-stone-400">
                {activeMode === 'summary'
                  ? '최근 관찰 4종 이미지와 관찰 레벨 요약'
                  : '고품질 표본 카드와 관찰자 한줄평'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= [MODE 1] SUMMARY / REPORT SHARE ================= */}
        {activeMode === 'summary' && (
          <div className="space-y-3.5 relative z-10">
            {/* Recent 4 Captured Images Selector */}
            <div className="bg-stone-950/60 p-3 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>최근 찍은 이미지 4종 (공유 선택)</span>
                </span>
                <div className="flex items-center gap-1 bg-stone-900 p-0.5 rounded-lg border border-white/10 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setReportCardFormat('quad')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      reportCardFormat === 'quad'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    4종 모아보기
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportCardFormat('single')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      reportCardFormat === 'single'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    선택 대표 사진
                  </button>
                </div>
              </div>

              {/* 4 Thumbnails Selector */}
              <div className="grid grid-cols-4 gap-2 pt-0.5">
                {recentSpecimens.map((sp, idx) => {
                  const isSelected = selectedRecentIndex === idx;
                  const thumbImg =
                    sp.originalImage || sp.stickerImage || sp.observations?.[0]?.photoUrl;
                  return (
                    <button
                      key={sp.id || idx}
                      type="button"
                      onClick={() => setSelectedRecentIndex(idx)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all p-0.5 text-left group cursor-pointer ${
                        isSelected
                          ? 'border-emerald-400 shadow-md scale-102 ring-2 ring-emerald-500/30'
                          : 'border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-stone-950 relative">
                        <img
                          src={thumbImg}
                          alt={sp.koreanName}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black shadow-md">
                            ✓
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 to-transparent p-1">
                          <p className="text-[9px] font-bold text-white truncate text-center leading-tight">
                            {sp.koreanName}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* REPORT SHARE CARD PREVIEW */}
            <div className="w-full bg-gradient-to-br from-stone-950 via-stone-900 to-emerald-950 rounded-2xl p-4 text-white shadow-2xl border border-emerald-500/30 relative overflow-hidden space-y-3">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold block">
                    MOALOG NATURE REPORT
                  </span>
                  <h4 className="text-sm font-black text-white">대한민국 생태 관찰 리포트</h4>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                  {userStats.homeCity || '서울'} 생태계
                </span>
              </div>

              {/* 4 Images Section (Quad Grid or Selected Single Focus) */}
              {reportCardFormat === 'quad' ? (
                <div className="grid grid-cols-2 gap-2">
                  {recentSpecimens.map((sp, idx) => {
                    const cardImg =
                      sp.originalImage || sp.stickerImage || sp.observations?.[0]?.photoUrl;
                    const cardName = formatSpeciesDisplayName(sp, {
                      language: userStats.language,
                      showEnglishNameWithLocal: userStats.showEnglishNameWithLocal,
                    });
                    const isFocus = selectedRecentIndex === idx;
                    return (
                      <div
                        key={sp.id || idx}
                        className={`relative aspect-[4/3] rounded-xl overflow-hidden border transition-all ${
                          isFocus ? 'border-emerald-400 ring-2 ring-emerald-500/40' : 'border-white/10'
                        }`}
                      >
                        <img src={cardImg} alt={cardName} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                          <p className="text-[10px] font-black text-white truncate">{cardName}</p>
                          <span className="text-[8px] text-stone-300 truncate">
                            {sp.observations?.[0]?.date || '최근 관찰'}
                          </span>
                        </div>
                        {isFocus && (
                          <span className="absolute top-1.5 left-1.5 bg-emerald-500 text-stone-950 text-[8px] font-black px-1.5 py-0.2 rounded shadow">
                            대표
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-white/15">
                  <img
                    src={selectedRecentImg}
                    alt={selectedRecentName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-3">
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                      FEATURED RECENT SPECIMEN
                    </span>
                    <h4 className="text-sm font-black text-white truncate">{selectedRecentName}</h4>
                    <p className="text-[10px] text-stone-300 mt-0.5">
                      {selectedRecent?.habitatType || selectedRecent?.locationCoord?.name || '자연 서식지'} ·{' '}
                      {selectedRecent?.observations?.[0]?.date || '2026. 08. 14'}
                    </p>
                  </div>
                </div>
              )}

              {/* 4종 이미지 하단: 표본 관찰 레벨 간략하게 나오는 그래픽/이미지 바 */}
              <div className="bg-gradient-to-r from-emerald-950/80 via-stone-900 to-stone-950 rounded-xl p-3 border border-emerald-500/30 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center font-black text-xs shadow-md shrink-0">
                      Lv.{levelNumber}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                          표본 관찰 레벨
                        </span>
                        <span className="text-[8px] font-extrabold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                          {activePersona.title}
                        </span>
                      </div>
                      <h5 className="text-xs font-black text-white truncate">{levelFullTitle}</h5>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-amber-300 font-black">
                      {unlockedBadgesCount} / {nextGoal} 뱃지
                    </span>
                  </div>
                </div>

                {/* Level Graphic XP Progress Bar */}
                <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                    style={{ width: `${levelPercent}%` }}
                  />
                </div>

                {/* Compact Level Summary Indicators */}
                <div className="flex items-center justify-between text-[9px] text-stone-300 pt-0.5 border-t border-white/5 font-mono">
                  <span className="flex items-center gap-1">
                    <span className="text-emerald-400">●</span> 관찰 {collectedCount}종
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-amber-400">🔥</span> 연속 {userStats.streakDays || 5}일
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-cyan-400">🛡️</span> {unlockedBadgesCount}개 달성
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= [MODE 2] SPECIMEN DETAIL SHARE ================= */}
        {activeMode === 'specimen' && (
          <div className="space-y-3.5 relative z-10">
            {/* Style Selector */}
            <div className="grid grid-cols-3 gap-2 bg-stone-950/60 p-1.5 rounded-2xl border border-white/5">
              {[
                { id: 'info_card', label: '📊 정보형 카드' },
                { id: 'base_image', label: '📸 대표 사진' },
                { id: 'card_style', label: '📇 수집 우표형' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setDesignStyle(s.id as any)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    designStyle === s.id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Specimen Design Card Preview */}
            <div className="w-full bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 rounded-2xl p-4 flex flex-col justify-between text-stone-100 shadow-2xl overflow-hidden border border-white/10 relative">
              {/* STYLE 1: INFO CARD */}
              {designStyle === 'info_card' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-5 aspect-square relative rounded-xl overflow-hidden shadow-lg border border-white/10">
                      <img src={specimenImg} className="w-full h-full object-cover" alt="표본 이미지" />
                      <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-400 border border-white/10">
                        {specimen?.category || '생태 표본'}
                      </div>
                    </div>
                    <div className="col-span-7 flex flex-col justify-center space-y-1.5 min-w-0">
                      <div>
                        <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">
                          MOALOG SPECIMEN
                        </span>
                        <h4 className="font-black text-white text-sm sm:text-base truncate">{displayName}</h4>
                        <p className="text-[10px] italic text-stone-400 truncate">
                          {specimen?.scientificName || 'Scientific name'}
                        </p>
                      </div>
                      <div className="space-y-1 text-[10px] text-stone-300 bg-white/5 p-2 rounded-xl border border-white/5 font-mono">
                        <div className="flex justify-between">
                          <span className="text-stone-400">서식지</span>
                          <span className="font-bold truncate max-w-[100px]">
                            {specimen?.habitatType || specimen?.locationCoord?.name || '자연 생태계'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">관찰일</span>
                          <span className="font-bold">
                            {specimen?.observations?.[0]?.date || '2026. 08. 14'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">포착품질</span>
                          <span className="font-bold text-amber-400">S급 우수 표본</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 상세 이미지 하단 한줄평 (Info Card) */}
                  <div className="p-2.5 bg-white/10 rounded-xl border border-white/15 flex items-start gap-2 shadow-xs">
                    <Quote className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block">
                        생태 관찰 한줄평
                      </span>
                      <p className="text-[11px] text-stone-100 font-medium italic leading-relaxed break-words">
                        "{oneLineReview}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STYLE 2: BASE IMAGE CARD */}
              {designStyle === 'base_image' && (
                <div className="w-full relative rounded-xl overflow-hidden shadow-lg border border-white/10 flex flex-col justify-end aspect-[4/3]">
                  <img
                    src={specimenImg}
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="대표 이미지"
                  />
                  <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3.5 flex flex-col justify-end">
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                      MOALOG NATURE CAPTURE
                    </span>
                    <h4 className="font-black text-white text-base truncate">{displayName}</h4>

                    {/* 상세 이미지 하단 한줄평 (Base Image) */}
                    <div className="mt-2 pt-2 border-t border-white/20 flex items-start gap-1.5">
                      <span className="text-[10px] font-black text-amber-300 shrink-0 mt-0.5">
                        한줄평:
                      </span>
                      <p className="text-[11px] text-stone-100 italic font-medium leading-tight">
                        "{oneLineReview}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STYLE 3: STAMP / COLLECTOR CARD */}
              {designStyle === 'card_style' && (
                <div className="w-full bg-stone-900 border-2 border-emerald-500/40 rounded-xl flex flex-col p-3 shadow-2xl relative">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold uppercase">
                        OFFICIAL STAMP
                      </span>
                      <h4 className="font-black text-white text-sm truncate">{displayName}</h4>
                    </div>
                    <span className="text-xs">🌿</span>
                  </div>
                  <div className="aspect-[16/10] rounded-lg overflow-hidden relative border border-white/10 mb-2">
                    <img
                      src={specimenImg}
                      className="w-full h-full object-cover"
                      alt="우표 카드 이미지"
                    />
                  </div>

                  {/* 상세 이미지 하단 한줄평 (Stamp Card) */}
                  <div className="px-2.5 py-1.5 bg-black/50 rounded-lg border border-white/10 flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider shrink-0">
                      한줄평
                    </span>
                    <span className="text-stone-200 text-[10px] italic truncate font-medium">
                      "{oneLineReview}"
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-stone-400 pt-1 border-t border-white/5 font-mono">
                    <span>관찰자: 자연 관찰자</span>
                    <span className="text-emerald-400 font-bold">MOALOG ARCHIVE</span>
                  </div>
                </div>
              )}
            </div>

            {/* Editable One-Line Review Input Field */}
            <div className="bg-stone-950/70 p-2.5 rounded-2xl border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-bold text-stone-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>한줄평 편집</span>
                </label>
                <span className="text-[10px] text-stone-500 font-mono">{oneLineReview.length}/70</span>
              </div>
              <input
                type="text"
                value={oneLineReview}
                onChange={(e) => setOneLineReview(e.target.value)}
                maxLength={70}
                placeholder="표본에 대한 감상 한줄평을 남겨보세요"
                className="w-full bg-stone-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2.5 mt-4 relative z-10">
          <button
            onClick={() => handleCopy(window.location.href)}
            className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 border border-white/5 active:scale-95 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? '복사됨!' : '링크 복사'}
          </button>
          <button
            onClick={() => {
              if (onShowToast) onShowToast('카드가 성공적으로 저장되었습니다!');
              onClose();
            }}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            이미지 저장 & 공유
          </button>
        </div>
      </motion.div>
    </div>
  );
};
