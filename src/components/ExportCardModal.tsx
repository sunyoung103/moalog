import React, { useState, useRef } from 'react';
import { Specimen, UserStats } from '../types';
import {
  X,
  Download,
  Sparkles,
  Check,
  Share2,
  Lock,
  Crown,
  Camera,
  Layers,
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

interface ExportCardModalProps {
  specimen: Specimen;
  userStats: UserStats;
  onClose: () => void;
  onOpenMyPage: () => void;
  onShowToast: (msg: string) => void;
}

type FrameTheme =
  | 'museum'
  | 'polaroid'
  | 'minimal'
  | 'natgeo'
  | 'botanical_press'
  | 'vogue_nature';

export const ExportCardModal: React.FC<ExportCardModalProps> = ({
  specimen,
  userStats,
  onClose,
  onOpenMyPage,
  onShowToast,
}) => {
  const [theme, setTheme] = useState<FrameTheme>('museum');
  const [isCopied, setIsCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const activeObs = specimen.observations[0];
  const isPro = userStats.isProUser;

  const frameOptions: {
    id: FrameTheme;
    label: string;
    isPremium: boolean;
    tag?: string;
  }[] = [
    { id: 'museum', label: '뮤지엄 플래카드', isPremium: false },
    { id: 'polaroid', label: '폴라로이드', isPremium: false },
    { id: 'minimal', label: '모노 미니멀', isPremium: false },
    { id: 'natgeo', label: '내셔널 탐사보도', isPremium: true, tag: 'PRO' },
    { id: 'botanical_press', label: '헤르바리움 압화집', isPremium: true, tag: 'PRO' },
    { id: 'vogue_nature', label: '매거진 에디토리얼', isPremium: true, tag: 'PRO' },
  ];

  const handleSelectTheme = (selected: FrameTheme) => {
    const opt = frameOptions.find((f) => f.id === selected);
    if (opt?.isPremium && !isPro) {
      onShowToast('내셔널 탐사 & 매거진 에디토리얼 프레임은 PRO 멤버십 전용입니다.');
      onOpenMyPage();
      return;
    }
    setTheme(selected);
  };

  const handleShareOrDownload = () => {
    setIsCopied(true);
    confetti({
      particleCount: 35,
      spread: 55,
      origin: { y: 0.6 },
    });
    onShowToast('표본 카드가 클립보드 및 이미지로 저장되었습니다.');
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div
      id="export-card-modal-backdrop"
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F6F8F6] text-stone-900 rounded-t-3xl sm:rounded-3xl p-5 max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
            <Share2 className="w-4 h-4 text-stone-900" />
            <span>프리미엄 표본 아카이브 카드 생성</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Selector (Free & Pro Tiered Frames) */}
        <div className="my-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-mono">
              FRAME STYLES
            </span>
            {!isPro && (
              <button
                type="button"
                onClick={onOpenMyPage}
                className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5 hover:underline"
              >
                <Crown className="w-3 h-3 text-amber-600" />
                <span>PRO 프레임 잠금 해제</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {frameOptions.map((opt) => {
              const isSelected = theme === opt.id;
              const isLocked = opt.isPremium && !isPro;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectTheme(opt.id)}
                  className={`p-2 rounded-xl text-left text-xs font-medium transition-all relative ${
                    isSelected
                      ? 'bg-stone-900 text-white font-bold shadow-xs'
                      : isLocked
                      ? 'bg-stone-100 text-stone-500 opacity-80'
                      : 'bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="truncate text-[11px] font-semibold">{opt.label}</span>
                    {isLocked ? (
                      <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                    ) : opt.isPremium ? (
                      <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                    ) : null}
                  </div>
                  <span className="text-[9px] text-stone-400 block font-mono">
                    {opt.isPremium ? 'PRO 프리미엄' : '기본'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* The Aesthetic Printable Card Preview */}
        <div
          ref={cardRef}
          className={`relative w-full rounded-2xl overflow-hidden shadow-md transition-all ${
            theme === 'natgeo'
              ? 'bg-[#111111] text-amber-400 p-4 border-4 border-[#FFD100]'
              : theme === 'botanical_press'
              ? 'bg-[#FAF6EE] text-stone-900 p-5 border border-[#D5CBB9] shadow-inner font-serif'
              : theme === 'vogue_nature'
              ? 'bg-white text-stone-950 p-4 border border-stone-900'
              : theme === 'polaroid'
              ? 'bg-[#FCFCFA] text-stone-900 p-4 border border-stone-300 pb-6'
              : theme === 'minimal'
              ? 'bg-stone-950 text-white p-4 border border-stone-800'
              : 'bg-[#F6F8F6] text-stone-900 p-4 border border-stone-200'
          }`}
        >
          {/* Theme Specific Top Header Header */}
          {theme === 'natgeo' ? (
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-1.5">
                <span className="bg-[#FFD100] text-black font-black text-[9px] px-1.5 py-0.2 tracking-wider">
                  NATIONAL
                </span>
                <span className="text-white text-[10px] font-mono tracking-widest font-bold">
                  EXPEDITION FIELD REPORT
                </span>
              </div>
              <span className="text-[9px] text-stone-400 font-mono">{specimen.number}</span>
            </div>
          ) : theme === 'botanical_press' ? (
            <div className="flex items-center justify-between pb-2 border-b border-[#D5CBB9] text-[10px] font-mono tracking-wider">
              <span className="italic text-stone-600">HERBARIUM NATURAE</span>
              <span className="font-bold">FOLIO NO. {specimen.number}</span>
            </div>
          ) : theme === 'vogue_nature' ? (
            <div className="text-center pb-2 border-b border-stone-900">
              <span className="text-sm font-black tracking-[0.25em] uppercase font-serif">
                THE WILD CHRONICLE
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-widest pb-2 border-b border-stone-300/60">
              <span className="font-bold">MOALOG ECOLOGY</span>
              <span className="font-semibold">{specimen.number}</span>
            </div>
          )}

          {/* Photo / Sticker Viewport */}
          <div
            className={`relative w-full aspect-square rounded-xl overflow-hidden my-3 shadow-inner flex items-center justify-center ${
              theme === 'natgeo'
                ? 'bg-stone-900 border border-stone-800'
                : theme === 'botanical_press'
                ? 'bg-[#F4EFE6] border border-[#E2DAD0]'
                : 'bg-stone-100'
            }`}
          >
            {specimen.stickerImage || specimen.originalImage ? (
              <img
                src={specimen.stickerImage || specimen.originalImage}
                alt={specimen.koreanName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-stone-400">
                <span className="text-3xl">🌿</span>
                <span className="text-[10px] mt-1 font-mono">SPECIMEN ARCHIVE</span>
              </div>
            )}

            {/* Authenticity Badge */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-stone-900/85 backdrop-blur-xs text-[9px] font-mono text-white border border-white/20">
              VERIFIED {specimen.confidence || 98}%
            </div>
          </div>

          {/* Specimen Info & Metadata */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <h2
                className={`text-base font-black tracking-tight ${
                  theme === 'natgeo'
                    ? 'text-white font-sans'
                    : theme === 'botanical_press'
                    ? 'text-stone-900 font-serif'
                    : 'text-stone-900'
                }`}
              >
                {specimen.koreanName}
              </h2>
              <span className="text-[10px] font-medium opacity-60">
                {specimen.family.split(' ')[0]}
              </span>
            </div>
            <p className="text-xs italic opacity-75 font-serif">{specimen.scientificName}</p>
          </div>

          {/* Natural Color Palette Swatches */}
          {specimen.colorPalette && (
            <div className="mt-2.5 pt-2 border-t border-stone-300/40 flex items-center justify-between">
              <span className="text-[9px] font-mono opacity-60 uppercase">Ecology Swatch</span>
              <div className="flex items-center gap-1">
                {specimen.colorPalette.map((col, idx) => (
                  <span
                    key={idx}
                    className="w-3 h-3 rounded-xs border border-stone-300/50"
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Footer Metadata Stamp */}
          <div className="mt-2 pt-2 border-t border-stone-300/40 flex items-center justify-between text-[10px] font-mono opacity-75">
            <span>📍 {activeObs?.location.slice(0, 10) || '서울숲'}</span>
            <span>📅 {activeObs?.date || '2026.08.14'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareOrDownload}
            className="flex-1 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>카드 내보내기 완료!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>표본 카드 저장 / 인스타 공유</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
