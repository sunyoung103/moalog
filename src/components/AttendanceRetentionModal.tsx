import React from 'react';
import { motion } from 'motion/react';
import { Check, Sparkles, X, Camera } from 'lucide-react';

interface AttendanceRetentionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLens: () => void;
}

export const AttendanceRetentionModal: React.FC<AttendanceRetentionModalProps> = ({
  isOpen,
  onClose,
  onOpenLens,
}) => {
  if (!isOpen) return null;

  const days = [
    { label: '월', isToday: true, isDone: true },
    { label: '화', isToday: false, isDone: false },
    { label: '수', isToday: false, isDone: false },
    { label: '목', isToday: false, isDone: false },
    { label: '금', isToday: false, isDone: false },
    { label: '토', isToday: false, isDone: false },
    { label: '일', isToday: false, isDone: false },
  ];

  return (
    <div
      id="attendance-retention-modal"
      className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none font-geist"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 text-center relative border border-stone-200/80"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Badge / Step indicator */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f8db] text-stone-900 text-[11px] font-bold border border-[#d4ee38]">
          <Sparkles className="w-3.5 h-3.5 text-[#6B9F0A]" />
          <span>1일 차 방문</span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h3 className="text-base font-black text-stone-900 tracking-tight">
            내일도 도감 등록하고<br />뱃지 받으세요
          </h3>
          <p className="text-xs text-stone-500">
            매일 한 종씩 관찰하면 탐험가 랭크가 빠르게 상승해요
          </p>
        </div>

        {/* 7-Day Streak Tracker */}
        <div className="flex items-center justify-between px-2 py-3.5 bg-stone-50 rounded-2xl border border-stone-200/60">
          {days.map((d, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <span className={`text-[10px] font-mono font-bold ${d.isToday ? 'text-stone-900' : 'text-stone-400'}`}>
                {d.label}
              </span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  d.isDone
                    ? 'bg-[#d4ee38] text-stone-950 font-black shadow-xs ring-2 ring-[#b6d21f]'
                    : 'bg-stone-200 text-stone-400'
                }`}
              >
                {d.isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLens();
            }}
            className="w-full py-3.5 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl text-xs font-black transition-all active:scale-98 shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#d4ee38]" />
            <span>촬영하러 가기</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
