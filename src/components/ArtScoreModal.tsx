import React, { useState, useEffect, useMemo } from 'react';
import { Specimen, Observation } from '../types';
import {
  X,
  Sparkles,
  Trophy,
  Star,
  ChevronLeft,
  ChevronRight,
  Camera,
  RotateCcw,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface ArtScoreModalProps {
  specimen: Specimen;
  onClose: () => void;
  onRetakePhoto?: () => void;
}

interface ScoreBreakdown {
  pose: number; // max 25
  size: number; // max 25
  direction: number; // max 20
  background: number; // max 15
  clarity: number; // max 15
  total: number; // max 100
  grade: 'S' | 'A' | 'B' | 'C';
  stars: number; // 1 to 5
  feedbackTip: string;
  badgeLabel: string;
}

export const ArtScoreModal: React.FC<ArtScoreModalProps> = ({
  specimen,
  onClose,
  onRetakePhoto,
}) => {
  // Collect all available photos from specimen & observations
  const photoList = useMemo(() => {
    const list: { photoUrl: string; label: string; date: string; location: string }[] = [];

    if (specimen.observations && specimen.observations.length > 0) {
      specimen.observations.forEach((obs, idx) => {
        if (obs.photoUrl) {
          list.push({
            photoUrl: obs.photoUrl,
            label: `관찰 사진 #${idx + 1}`,
            date: obs.date || '2026.07.08',
            location: obs.location || specimen.locationCoord?.name || '서울숲 생태공원',
          });
        }
      });
    }

    if (list.length === 0) {
      const fallbackUrl =
        specimen.originalImage || specimen.stickerImage || 'https://images.unsplash.com/photo-1544717305-2782549b5136';
      list.push({
        photoUrl: fallbackUrl,
        label: '대표 도감 사진',
        date: '2026.07.08',
        location: specimen.locationCoord?.name || '서울숲 생태공원',
      });
    }

    return list;
  }, [specimen]);

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const currentPhoto = photoList[activePhotoIdx] || photoList[0];

  // Deterministically compute art score for a specific photo based on specimen name & index
  const scoreData: ScoreBreakdown = useMemo(() => {
    // Seed hash based on specimen ID and index
    let seed = 0;
    for (let i = 0; i < specimen.koreanName.length; i++) {
      seed += specimen.koreanName.charCodeAt(i);
    }
    seed += activePhotoIdx * 17;

    // Generate realistic high Pokémon Snap / Zelda Compendium composition scores
    const pose = 20 + (seed % 6); // 20 ~ 25
    const size = 19 + ((seed * 3) % 7); // 19 ~ 25
    const direction = 15 + ((seed * 7) % 6); // 15 ~ 20
    const background = 11 + ((seed * 11) % 5); // 11 ~ 15
    const clarity = 12 + ((seed * 13) % 4); // 12 ~ 15

    const total = pose + size + direction + background + clarity;

    let grade: 'S' | 'A' | 'B' | 'C' = 'B';
    let stars = 3;
    let badgeLabel = '우수 관찰작 (Good Shot)';
    let feedbackTip = '더 가까이서 피사체 정면을 바라볼 때 촬영하면 S등급 달성 가능!';

    if (total >= 92) {
      grade = 'S';
      stars = 5;
      badgeLabel = '전설적인 명작 포착 (Legendary Snap)';
      feedbackTip = '완벽한 시선과 황금분할 구도! 생태 박물관 명예의 전당 등재 수준입니다.';
    } else if (total >= 82) {
      grade = 'A';
      stars = 4;
      badgeLabel = '마스터피스 (Masterpiece)';
      feedbackTip = '피사체의 생동감이 탁월합니다. 앵글을 살짝만 낮추면 완벽한 S등급입니다.';
    } else if (total >= 72) {
      grade = 'B';
      stars = 3;
      badgeLabel = '표준 도감 구도 (Good Capture)';
      feedbackTip = '자연광이 드는 방향에서 피사체가 중앙에 오도록 줌을 조절해 보세요.';
    } else {
      grade = 'C';
      stars = 2;
      badgeLabel = '관찰 기록용 (Standard)';
      feedbackTip = '배경과 피사체가 겹치지 않게 거리와 포커스를 조정해 재도전해 보세요.';
    }

    return {
      pose,
      size,
      direction,
      background,
      clarity,
      total,
      grade,
      stars,
      feedbackTip,
      badgeLabel,
    };
  }, [specimen, activePhotoIdx]);

  // Trigger celebration confetti on high score
  useEffect(() => {
    if (scoreData.grade === 'S' || scoreData.grade === 'A') {
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.45 },
      });
    }
  }, [activePhotoIdx, scoreData.grade]);

  const handlePrevPhoto = () => {
    setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photoList.length - 1));
  };

  const handleNextPhoto = () => {
    setActivePhotoIdx((prev) => (prev < photoList.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      id="art-score-modal-backdrop"
      className="fixed inset-0 z-60 bg-stone-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1C1917] text-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col scrollbar-none"
      >
        {/* Top Header */}
        <div className="p-4 flex items-center justify-between shrink-0 bg-stone-900/60 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                생태 사진 예술 점수
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300">
                  구도 채점기
                </span>
              </h3>
              <p className="text-[10px] text-stone-400">생태 사진학 5대 구도 기반 평가</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Photo Carousel Area */}
        <div className="relative w-full aspect-4/3 bg-black flex items-center justify-center overflow-hidden shrink-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentPhoto.photoUrl}
              src={currentPhoto.photoUrl}
              alt={specimen.koreanName}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full object-contain"
            />
          </AnimatePresence>

          {/* Golden Rule Composition Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-b border-white/20" />
            <div className="border-r border-white/20" />
            <div className="border-r border-white/20" />
            <div />
          </div>

          {/* Carousel Arrows (if multiple photos) */}
          {photoList.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-all active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Bottom badge on photo */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-white">
              {currentPhoto.label} ({activePhotoIdx + 1}/{photoList.length})
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] text-stone-300 font-mono">
              {currentPhoto.location}
            </span>
          </div>
        </div>

        {/* Art Score Breakdown Card */}
        <div className="p-4 space-y-4">
          {/* Main Total Score Banner */}
          <div className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-3xl p-4 shadow-lg flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-2xl font-black px-3 py-1 rounded-xl shadow-md ${
                    scoreData.grade === 'S'
                      ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300'
                      : scoreData.grade === 'A'
                      ? 'bg-emerald-500 text-white'
                      : scoreData.grade === 'B'
                      ? 'bg-sky-500 text-white'
                      : 'bg-stone-600 text-white'
                  }`}
                >
                  {scoreData.grade} 등급
                </span>
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < scoreData.stars ? 'fill-current' : 'text-stone-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs font-bold text-stone-200 mt-1">{scoreData.badgeLabel}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-stone-400 font-mono block">종합 예술 점수</span>
              <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                {scoreData.total}
                <span className="text-sm font-normal text-stone-400"> / 100</span>
              </div>
            </div>
          </div>

          {/* 5 Evaluation Criteria Bars */}
          <div className="space-y-2.5 bg-stone-900/80 rounded-2xl p-3.5">
            <h4 className="text-[11px] font-bold text-stone-300 flex items-center justify-between">
              <span>5대 구도 세부 평가</span>
              <span className="text-[10px] text-stone-500 font-normal">표준 생태 사진학 기준</span>
            </h4>

            {/* 1. Pose */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-stone-300">1. 포즈 & 액션 (생동감)</span>
                <span className="font-mono text-amber-300 font-bold">{scoreData.pose}/25</span>
              </div>
              <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(scoreData.pose / 25) * 100}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-amber-400 rounded-full"
                />
              </div>
            </div>

            {/* 2. Size & Framing */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-stone-300">2. 피사체 크기 & 프레임 채움</span>
                <span className="font-mono text-amber-300 font-bold">{scoreData.size}/25</span>
              </div>
              <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(scoreData.size / 25) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                  className="h-full bg-emerald-400 rounded-full"
                />
              </div>
            </div>

            {/* 3. Direction & Gaze */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-stone-300">3. 피사체 방향 & 카메라 시선</span>
                <span className="font-mono text-amber-300 font-bold">{scoreData.direction}/20</span>
              </div>
              <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(scoreData.direction / 20) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                  className="h-full bg-sky-400 rounded-full"
                />
              </div>
            </div>

            {/* 4. Background */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-stone-300">4. 자연 배경 조화도</span>
                <span className="font-mono text-amber-300 font-bold">{scoreData.background}/15</span>
              </div>
              <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(scoreData.background / 15) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                  className="h-full bg-purple-400 rounded-full"
                />
              </div>
            </div>

            {/* 5. Clarity & Lighting */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-stone-300">5. 선명도 & 자연광 조명</span>
                <span className="font-mono text-amber-300 font-bold">{scoreData.clarity}/15</span>
              </div>
              <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(scoreData.clarity / 15) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
                  className="h-full bg-rose-400 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Feedback Tip for Retake */}
          <div className="bg-amber-950/40 rounded-2xl p-3.5 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-300">재도전 구도 팁</p>
              <p className="text-[11px] text-amber-200/90 leading-relaxed mt-0.5">
                {scoreData.feedbackTip}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {onRetakePhoto && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRetakePhoto();
                }}
                className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-98"
              >
                <Camera className="w-4 h-4" />
                <span>더 좋은 구도로 재포착</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs rounded-xl transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
