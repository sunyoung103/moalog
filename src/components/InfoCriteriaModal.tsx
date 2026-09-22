import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X, CheckCircle2, ShieldCheck, Target, Camera, Sparkles, BookOpen } from 'lucide-react';

export interface InfoModalContent {
  title: string;
  subtitle?: string;
  categoryBadge?: string;
  rationale: string;
  criteria: string[];
  recordingMethod: string;
  biologicalContext?: string;
}

interface InfoCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InfoModalContent | null;
}

export const InfoCriteriaModal: React.FC<InfoCriteriaModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen || !data) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    ECOLOGICAL RECORDING RATIONALE
                  </span>
                  {data.categoryBadge && (
                    <span className="text-[9px] bg-emerald-900 text-emerald-200 px-1.5 py-0.2 rounded font-bold border border-emerald-700">
                      {data.categoryBadge}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-white leading-snug mt-0.5">
                  {data.title}
                </h3>
                {data.subtitle && (
                  <p className="text-xs text-stone-300 font-medium mt-0.5">
                    {data.subtitle}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs text-stone-700 leading-relaxed">
            {/* 1. 디자인 및 기능 부여 이유 (Why this exists) */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>기능 설계 및 기록 이유 (Functional Rationale)</span>
              </div>
              <p className="text-stone-800 font-medium leading-relaxed pl-6">
                {data.rationale}
              </p>
            </div>

            {/* 2. 산출 및 심사 기준 (Evaluation Criteria) */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center gap-2 text-stone-900 font-extrabold text-xs">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>산출 및 평가 측정 기준 (Evaluation Criteria)</span>
              </div>
              <ul className="space-y-1.5 pl-6">
                {data.criteria.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-stone-800 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. 데이터 보존 및 수집 방식 (Data Recording Method) */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
              <div className="flex items-center gap-2 text-stone-900 font-extrabold text-xs">
                <Camera className="w-4 h-4 text-amber-600" />
                <span>데이터 측정 및 보존 방식 (Recording Method)</span>
              </div>
              <p className="text-stone-700 font-medium pl-6">
                {data.recordingMethod}
              </p>
            </div>

            {/* 4. 분류군별 생태학적 배경 (Biological Context) */}
            {data.biologicalContext && (
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-950 font-extrabold text-xs">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  <span>생물 분류군별 관찰 백과 배경 (Biological Context)</span>
                </div>
                <p className="text-amber-900 font-medium pl-6">
                  {data.biologicalContext}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-stone-50 border-t border-stone-200 p-3 px-5 flex items-center justify-between text-[11px] text-stone-500 font-medium shrink-0">
            <span>MOALOG Ecological Documentation Standard</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold transition-colors"
            >
              확인 완료
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
