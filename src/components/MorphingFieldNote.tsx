import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SpeciesEcologyDetail } from '../types';

interface MorphingFieldNoteProps {
  ecoDetail?: SpeciesEcologyDetail | null;
  specimenName: string;
  scientificName: string;
  habitatType?: string;
  isFungi?: boolean;
}

export const MorphingFieldNote: React.FC<MorphingFieldNoteProps> = ({
  ecoDetail,
  specimenName,
  scientificName,
  habitatType,
  isFungi = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse structured data items without wordy paragraphs
  const keyIdentification = ecoDetail?.keyIdentification || '현장 세부 형질 관찰 대기';
  const observationTip = ecoDetail?.bestObservationTip || '현장 탐사 시간대 관찰 권장';
  const gearTip = ecoDetail?.photoGearTip || '표준 망원 또는 접사 렌즈 권장';
  const etiquette = isFungi
    ? '야생 버섯은 임의 섭취가 금지되며 공인 연구기관 확인 필수'
    : ecoDetail?.fieldEtiquette || '자연 서식지 훼손 금지 및 안전 거리 유지';
  const seasonality = ecoDetail?.seasonality || '사계절 탐사 가능';
  const habitat = ecoDetail?.habitat || habitatType || '자연 생태 서식처';

  // Spring transition: snappy, minimal micro-overshoot
  const springConfig = {
    type: 'spring' as const,
    stiffness: 420,
    damping: 32,
    mass: 0.8,
  };

  const blurTransition = {
    duration: 0.16,
    ease: [0.16, 1, 0.3, 1] as const,
  };

  return (
    <div className="w-full select-none font-geist">
      {/* 
        Single continuous morphing element:
        Same element morphs border-radius, dimensions, and crossfades content via blur/fade.
      */}
      <motion.div
        layout
        transition={springConfig}
        onClick={() => setIsExpanded((prev) => !prev)}
        style={{
          borderRadius: isExpanded ? '28px' : '18px',
        }}
        className={`w-full overflow-hidden transition-colors cursor-pointer border ${
          isExpanded
            ? 'bg-[#0f0f11] text-white border-stone-800 shadow-xl p-5 sm:p-6'
            : 'bg-stone-50/90 text-stone-900 border-stone-200/80 shadow-2xs p-4 sm:p-4.5 active:scale-[0.99]'
        }`}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* ================= COMPACT / COLLAPSED STATE ================= */
            <motion.div
              key="fieldnote-collapsed"
              initial={{ opacity: 0, filter: 'blur(5px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(4px)' }}
              transition={blurTransition}
              className="space-y-3"
            >
              {/* Header: Pure Typography, Bold/Caps, No Emojis, No Badges */}
              <div className="flex items-baseline justify-between border-b border-stone-200/70 pb-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px] font-bold tracking-widest text-stone-500 uppercase">
                    FIELD NOTE
                  </span>
                  <span className="text-stone-300">/</span>
                  <span className="font-bold text-xs text-stone-900 uppercase tracking-tight">
                    실전 생태 관찰 규격
                  </span>
                </div>
                <span className="font-mono text-[9px] text-stone-600 uppercase tracking-wider font-semibold">
                  터치하여 세부 스펙 확장 +
                </span>
              </div>

              {/* High-Density Typographic Spec Ledger (No wordy paragraphs) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
                {/* 1. Diagnostic Key */}
                <div className="space-y-1">
                  <span className="font-mono text-[9px] font-bold text-stone-500 uppercase tracking-wider block">
                    01 · DIAGNOSTIC KEY
                  </span>
                  <p className="text-xs font-medium text-stone-800 leading-snug truncate">
                    {keyIdentification.split(/[,.]/)[0]}
                  </p>
                </div>

                {/* 2. Observation Window */}
                <div className="space-y-1">
                  <span className="font-mono text-[9px] font-bold text-stone-500 uppercase tracking-wider block">
                    02 · TEMPORAL VECTOR
                  </span>
                  <p className="text-xs font-medium text-stone-800 leading-snug truncate">
                    {seasonality.split('(')[0].trim()} · {observationTip.split(/[,.]/)[0]}
                  </p>
                </div>

                {/* 3. Optics & Habitat */}
                <div className="space-y-1">
                  <span className="font-mono text-[9px] font-bold text-stone-500 uppercase tracking-wider block">
                    03 · HABITAT & GEAR
                  </span>
                  <p className="text-xs font-medium text-stone-800 leading-snug truncate">
                    {habitat.split(/[,.]/)[0]} · {gearTip.split(/[,.]/)[0]}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ================= EXPANDED: FULL MORPHED SPECIFICATION MATRIX ================= */
            <motion.div
              key="fieldnote-expanded"
              initial={{ opacity: 0, filter: 'blur(5px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(4px)' }}
              transition={blurTransition}
              className="space-y-4 text-white"
            >
              {/* Header: High-contrast Minimal Monochrome Ledger */}
              <div className="flex items-baseline justify-between border-b border-stone-800 pb-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                      FIELD SPECIFICATION MATRIX
                    </span>
                    <span className="text-stone-600">/</span>
                    <span className="font-mono text-[10px] text-stone-400">
                      {scientificName}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white tracking-tight">
                    {specimenName} 실전 탐사 규격서
                  </h4>
                </div>

                <span className="font-mono text-[9px] text-stone-400 uppercase tracking-wider font-semibold">
                  터치하여 접기 −
                </span>
              </div>

              {/* 4-Quadrant High-Density Scientific Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-geist">
                {/* Quadrant 1: Diagnostic Identification Characters */}
                <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-stone-800/80 pb-3 md:pb-0 md:pr-4">
                  <span className="font-mono text-[10px] font-bold text-stone-400 tracking-wider uppercase block">
                    CRITERION 01 · KEY DIAGNOSTIC IDENTIFIERS
                  </span>
                  <div className="text-xs text-stone-200 font-normal leading-relaxed space-y-1">
                    <p className="text-stone-300 font-medium">
                      {keyIdentification}
                    </p>
                  </div>
                </div>

                {/* Quadrant 2: Observation Window & Seasonality */}
                <div className="space-y-1.5 border-b md:border-b-0 border-stone-800/80 pb-3 md:pb-0">
                  <span className="font-mono text-[10px] font-bold text-stone-400 tracking-wider uppercase block">
                    CRITERION 02 · TEMPORAL & FIELD PROTOCOL
                  </span>
                  <div className="space-y-1 text-xs text-stone-300">
                    <div className="flex justify-between border-b border-stone-900 pb-1">
                      <span className="text-stone-500 font-mono text-[11px]">관찰 시기</span>
                      <span className="font-medium text-white">{seasonality}</span>
                    </div>
                    <p className="text-stone-300 leading-relaxed pt-0.5">
                      {observationTip}
                    </p>
                  </div>
                </div>

                {/* Quadrant 3: Preferred Micro-Habitat & Spatial Matrix */}
                <div className="space-y-1.5 md:border-r border-stone-800/80 md:pr-4 pt-1">
                  <span className="font-mono text-[10px] font-bold text-stone-400 tracking-wider uppercase block">
                    CRITERION 03 · HABITAT & SPATIAL VECTORS
                  </span>
                  <div className="space-y-1 text-xs text-stone-300">
                    <div className="flex justify-between border-b border-stone-900 pb-1">
                      <span className="text-stone-500 font-mono text-[11px]">서식 지형</span>
                      <span className="font-medium text-white">{habitat}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-900 pb-1">
                      <span className="text-stone-500 font-mono text-[11px]">추천 장비</span>
                      <span className="font-medium text-stone-200 truncate max-w-[180px]">{gearTip}</span>
                    </div>
                  </div>
                </div>

                {/* Quadrant 4: Ethics, Safety & Protection Protocols */}
                <div className="space-y-1.5 pt-1">
                  <span className="font-mono text-[10px] font-bold text-stone-400 tracking-wider uppercase block">
                    CRITERION 04 · ETHICS & FIELD CODE
                  </span>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {etiquette}
                  </p>
                  {isFungi && (
                    <p className="text-[10px] font-mono text-amber-400 pt-0.5">
                      SAFETY PROTOCOL: 산림생태계 안전 수칙 준수 대상
                    </p>
                  )}
                </div>
              </div>

              {/* Quiet Footer Note */}
              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px] font-mono text-stone-500">
                <span>VERIFIED WILDLIFE DATA MATRIX</span>
                <span>GBIF · IUCN · KOBIS</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
