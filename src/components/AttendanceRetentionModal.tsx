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
      className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-[28px] sm:rounded-[28px] max-w-sm w-full px-6 pt-3 pb-7 shadow-xl space-y-5 text-center relative border border-[#e6e9e5]"
      >
        <div className="w-9 h-1 bg-[#d2d7d1] rounded-full mx-auto mb-1 sm:hidden" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f4f5f4] flex items-center justify-center text-[#626961] hover:text-[#202320] transition-colors cursor-pointer"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Badge / Step indicator */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4fbdd] text-[#202320] text-xs font-bold border border-[#c4eb43]">
          <Sparkles className="w-3.5 h-3.5 text-[#6d8911]" />
          <span>1일 차 방문</span>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h3 className="text-[20px] font-bold text-[#202320] tracking-tight leading-snug">
            내일도 도감 등록하고
            <br />
            뱃지 받으세요
          </h3>
          <p className="text-[13px] text-[#626961] leading-relaxed">
            매일 한 종씩 관찰하면 탐험가 레벨이 빠르게 올라가요
          </p>
        </div>

        {/* 7-Day Streak Tracker */}
        <div className="flex items-center justify-between px-3 py-3.5 bg-[#f4f5f4] rounded-2xl border border-[#e6e9e5]">
          {days.map((d, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <span
                className={`text-[11px] font-semibold tabular-nums ${
                  d.isToday ? 'text-[#202320]' : 'text-[#8c948a]'
                }`}
              >
                {d.label}
              </span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold tabular-nums transition-all ${
                  d.isDone
                    ? 'bg-[#c4eb43] text-[#202320] ring-2 ring-[#6d8911]/25'
                    : 'bg-white border border-[#e6e9e5] text-[#8c948a]'
                }`}
              >
                {d.isDone ? <Check className="w-4 h-4 stroke-[2.75]" /> : idx + 1}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenLens();
          }}
          className="w-full h-14 bg-black hover:bg-[#202320] text-white rounded-xl text-[15px] font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Camera className="w-4 h-4 text-[#c4eb43]" />
          <span>촬영하러 가기</span>
        </button>
      </motion.div>
    </div>
  );
};
