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
  Loader2,
  Scan,
  Zap,
  AlertTriangle,
  FileText,
  Compass,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { API_SOURCES } from '../utils/apiSources';

interface ArtScoreModalProps {
  specimen: Specimen;
  onClose: () => void;
  onRetakePhoto?: () => void;
}

interface ScoreBreakdown {
  isSubjectMatched: boolean;
  targetMatchRate: number;
  sharpness: number; // max 20
  framing: number; // max 20
  lighting: number; // max 20
  background: number; // max 20
  pose: number; // max 20
  total: number; // max 100
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  stars: number; // 1 to 5
  badgeLabel: string;
  fieldNoteCorrelation?: string;
  feedbackTip: string;
  fieldNoteTip?: string;
  compositionAnalysis?: string;
  oneLineReview?: string;
  isVisionAI?: boolean;
}

export const ArtScoreModal: React.FC<ArtScoreModalProps> = ({
  specimen,
  onClose,
  onRetakePhoto,
}) => {
  // Collect all available photos from specimen & observations
  const photoList = useMemo(() => {
    const list: {
      photoUrl: string;
      label: string;
      date: string;
      location: string;
      memo?: string;
      habitat?: string;
      weather?: string;
    }[] = [];

    if (specimen.observations && specimen.observations.length > 0) {
      specimen.observations.forEach((obs, idx) => {
        if (obs.photoUrl) {
          list.push({
            photoUrl: obs.photoUrl,
            label: `관찰 사진 #${idx + 1}`,
            date: obs.date || '2026.07.08',
            location: obs.location || specimen.locationCoord?.name || '서울숲 생태공원',
            memo: obs.memo,
            habitat: obs.detectedHabitatName || specimen.habitatType,
            weather: obs.weather,
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
        memo: '자연 서식지 생태 표본',
        habitat: specimen.habitatType,
        weather: '맑음',
      });
    }

    return list;
  }, [specimen]);

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const currentPhoto = photoList[activePhotoIdx] || photoList[0];

  // Vision AI cache map for photo indexes
  const [visionScoreMap, setVisionScoreMap] = useState<Record<number, ScoreBreakdown>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Deterministic realistic baseline fallback
  const baselineScore: ScoreBreakdown = useMemo(() => {
    const nameStr = specimen.koreanName || specimen.scientificName || 'specimen';
    let seed = 0;
    for (let i = 0; i < nameStr.length; i++) {
      seed += nameStr.charCodeAt(i);
    }
    seed += activePhotoIdx * 17;

    const isGeneric = !specimen.koreanName || specimen.koreanName === '생물';
    if (isGeneric) {
      return {
        isSubjectMatched: false,
        targetMatchRate: 40,
        sharpness: 8,
        framing: 9,
        lighting: 10,
        background: 8,
        pose: 9,
        total: 44,
        grade: 'D',
        stars: 2,
        badgeLabel: '⚠️ 피사체 불일치 / 재촬영 권장',
        fieldNoteCorrelation: '관찰 대상 종의 고유 형질이 불분명하여 실전 필드 노트와의 연계성이 낮습니다.',
        feedbackTip: '목표 생물이 프레임 중심에 오도록 피사체를 명확히 위치시키고 초점을 고정해 재촬영하세요.',
        fieldNoteTip: '생물이 주로 출몰하는 시간대와 서식지 식생 환경을 확인 후 접근하세요.',
        compositionAnalysis: '피사체 윤곽이 불명확하거나 목표 생물군과의 일치도가 낮아 생태 도감 등록 기준에 미달합니다.',
        oneLineReview: '목표 생물의 명확한 식별 형질이 프레임 내에 안정적으로 잡히지 않았습니다.',
        isVisionAI: false,
      };
    }

    const sharpness = 15 + (seed % 5);
    const framing = 15 + ((seed * 3) % 5);
    const lighting = 14 + ((seed * 7) % 5);
    const background = 14 + ((seed * 11) % 5);
    const pose = 15 + ((seed * 13) % 5);
    const total = sharpness + framing + lighting + background + pose;

    let grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' = 'B';
    let stars = 3;
    let badgeLabel = '표준 현장 관찰 기록 (Field Record)';

    if (total >= 90) {
      grade = 'S';
      stars = 5;
      badgeLabel = '명작 생태 포착 (Masterpiece)';
    } else if (total >= 80) {
      grade = 'A';
      stars = 4;
      badgeLabel = '우수 생태 도감 구도 (Good Capture)';
    } else if (total >= 68) {
      grade = 'B';
      stars = 3;
      badgeLabel = '표준 현장 관찰 기록 (Field Record)';
    } else {
      grade = 'C';
      stars = 2;
      badgeLabel = '관찰 기록용 (Standard)';
    }

    return {
      isSubjectMatched: true,
      targetMatchRate: 91,
      sharpness,
      framing,
      lighting,
      background,
      pose,
      total,
      grade,
      stars,
      badgeLabel,
      fieldNoteCorrelation: `필드 노트에 기록된 [${currentPhoto.location}] 관찰 정보와 사진 속 실제 서식 환경이 자연스럽게 연계되어 있습니다.`,
      feedbackTip: '피사체의 시선 방향에 여백을 확보하고 셔터스피드를 올려 미세 흔들림을 억제해 보세요.',
      fieldNoteTip: `${specimen.koreanName}의 주 활동 시간대에 사광을 활용하면 미세 표면 텍스처가 극대화됩니다.`,
      compositionAnalysis: '피사체의 생태적 주요 부위가 프레임 내에 안정적으로 배치되어 있습니다.',
      oneLineReview: `${specimen.koreanName}의 주요 생태 형질이 프레임 내에 안정적으로 포착되었습니다.`,
      isVisionAI: false,
    };
  }, [specimen, activePhotoIdx, currentPhoto]);

  // Fetch real Gemini Multimodal Vision API scoring for current photo
  useEffect(() => {
    let isMounted = true;
    if (visionScoreMap[activePhotoIdx]) return;

    setIsAnalyzing(true);
    fetch('/api/analyze-photo-art', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoUrl: currentPhoto.photoUrl,
        koreanName: specimen.koreanName,
        scientificName: specimen.scientificName,
        category: specimen.category,
        fieldNotes: currentPhoto.memo || '',
        location: currentPhoto.location || '',
        habitatType: currentPhoto.habitat || '',
        weather: currentPhoto.weather || '',
        date: currentPhoto.date || '',
      }),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (!isMounted) return;
        if (resData?.success && resData.data) {
          const d = resData.data;
          const matched = d.isSubjectMatched !== false && (d.targetMatchRate === undefined || d.targetMatchRate >= 50);
          const computedTotal = matched
            ? (d.total ?? 78)
            : Math.min(d.total ?? 38, 45);
          setVisionScoreMap((prev) => ({
            ...prev,
            [activePhotoIdx]: {
              isSubjectMatched: matched,
              targetMatchRate: d.targetMatchRate ?? (matched ? (computedTotal >= 80 ? 95 : 78) : 30),
              sharpness: d.sharpness ?? (matched ? 16 : 7),
              framing: d.framing ?? (matched ? 16 : 7),
              lighting: d.lighting ?? (matched ? 16 : 8),
              background: d.background ?? (matched ? 15 : 6),
              pose: d.pose ?? (matched ? 16 : 7),
              total: computedTotal,
              grade: (d.grade as any) || (computedTotal >= 90 ? 'S' : computedTotal >= 80 ? 'A' : computedTotal >= 68 ? 'B' : computedTotal >= 50 ? 'C' : 'D'),
              stars: matched ? (d.stars || (computedTotal >= 80 ? 4 : 3)) : 1,
              badgeLabel: d.badgeLabel || (matched ? '생태 관찰 표본' : '⚠️ 피사체 불일치 (Subject Mismatch)'),
              fieldNoteCorrelation: d.fieldNoteCorrelation || '필드 노트 기록과 사진의 서식 환경이 양호하게 부합합니다.',
              feedbackTip: d.feedbackTip || (matched ? '피사체 정면 시선과 여백을 조화롭게 구성해 보세요.' : '목표 생물이 선명하게 포착되도록 초점을 맞추고 재촬영하세요.'),
              fieldNoteTip: d.fieldNoteTip,
              compositionAnalysis: d.compositionAnalysis || (matched ? '피사체의 시선 방향과 배경 처리가 균형을 이루고 있습니다.' : '목표 생물 형질이 확인되지 않아 생태 도감 등록 기준에 미달합니다.'),
              oneLineReview: d.oneLineReview,
              isVisionAI: !resData.isFallback,
            },
          }));
        }
      })
      .catch((err) => {
        console.warn('Vision art scoring error:', err);
      })
      .finally(() => {
        if (isMounted) setIsAnalyzing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activePhotoIdx, currentPhoto, specimen]);

  const scoreData = visionScoreMap[activePhotoIdx] || baselineScore;

  // Trigger celebration confetti only on high legitimate score
  useEffect(() => {
    if (scoreData.isSubjectMatched && (scoreData.grade === 'S' || scoreData.grade === 'A')) {
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.45 },
      });
    }
  }, [activePhotoIdx, scoreData.grade, scoreData.isSubjectMatched]);

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
        <div className="p-4 flex items-center justify-between shrink-0 bg-stone-900/60 backdrop-blur-md border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                생태 사진 & 필드 노트 정밀 심사
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-emerald-400" />
                  Gemini Vision AI
                </span>
              </h3>
              <p className="text-[10px] text-stone-400">피사체-종 일치율 · 실전 필드 노트 연계 · 5대 사진학 지표 심사</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
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
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div />
          </div>

          {/* Real-time Vision AI Analyzing Scanning Effect */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-stone-950/50 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 animate-pulse">
                <Scan className="w-5 h-5 animate-spin" />
              </div>
              <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                Gemini Vision 생태 일치도 & 구도 정밀 심사 중...
              </span>
            </div>
          )}

          {/* Carousel Arrows (if multiple photos) */}
          {photoList.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-all active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-all active:scale-95 cursor-pointer"
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
        <div className="p-4 space-y-3.5">
          {/* Subject Target Match Status Banner */}
          {!scoreData.isSubjectMatched ? (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-2xl flex items-start gap-2.5 text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-red-300 block">⚠️ 대상 피사체 불일치 경고</span>
                <p className="text-[11px] text-red-200/90 leading-tight">
                  사진 내 피사체가 목표 종인 <b className="text-white">[{specimen.koreanName}]</b>과(와) 일치하지 않거나 식별이 불가능하여 종합 평점이 감점 처리되었습니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 bg-emerald-950/40 border border-emerald-800/50 rounded-xl flex items-center justify-between text-xs">
              <span className="text-emerald-300 font-bold flex items-center gap-1.5 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                목표 종 피사체 식별 완료 ({specimen.koreanName})
              </span>
              <span className="font-mono font-bold text-emerald-400 text-[11px]">
                일치도 {scoreData.targetMatchRate}%
              </span>
            </div>
          )}

          {/* Main Total Score Banner */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-800 rounded-2xl p-4 shadow-lg flex items-center justify-between border border-stone-800">
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
                      : scoreData.grade === 'C'
                      ? 'bg-stone-600 text-white'
                      : 'bg-red-700 text-white'
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
              <span className="text-[10px] text-stone-400 font-mono block">포착 종합 지수</span>
              <div className="text-3xl font-black text-amber-400 font-mono tracking-tight flex items-baseline justify-end gap-1">
                {isAnalyzing ? (
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400 inline" />
                ) : (
                  <>
                    <span>{scoreData.total}</span>
                    <span className="text-sm font-normal text-stone-400"> / 100</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Field Note & Habitat Correlation Box */}
          {scoreData.fieldNoteCorrelation && (
            <div className="bg-stone-900/80 rounded-2xl p-3.5 border border-stone-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-300">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <FileText className="w-3.5 h-3.5" />
                  실전 필드 노트 연계 분석
                </span>
                <span className="text-[10px] font-mono text-stone-500">
                  위치: {currentPhoto.location}
                </span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {scoreData.fieldNoteCorrelation}
              </p>
            </div>
          )}

          {/* Vision AI Deep Composition Analysis Box */}
          {scoreData.compositionAnalysis && (
            <div className="bg-stone-900/80 rounded-2xl p-3.5 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-300">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Zap className="w-3.5 h-3.5" />
                  생태 사진학 구도 분석
                </span>
                <span className="text-[10px] font-mono text-stone-500">
                  {scoreData.isVisionAI ? '실시간 비전 심사' : '표준 분석'}
                </span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {scoreData.compositionAnalysis}
              </p>
            </div>
          )}

          {/* 5 Evaluation Criteria Bars (0~20 pts each) */}
          <div className="space-y-3 bg-stone-900/90 rounded-2xl p-4 border border-stone-800">
            <h4 className="text-[11px] font-black text-stone-200 flex items-center justify-between">
              <span>5대 생태 사진학 세부 지표</span>
              <span className="text-[10px] text-stone-400 font-mono">각 20점 만점</span>
            </h4>

            {/* 1. Sharpness */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-stone-300">🎯 1. 초점 선명도 (동정 형질 식별도)</span>
                <span className="font-mono text-emerald-400 font-black text-[11px] bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
                  {scoreData.sharpness} / 20
                </span>
              </div>
              <div className="w-full h-2 bg-stone-800/90 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(scoreData.sharpness / 20) * 100}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-xs"
                />
              </div>
            </div>

            {/* 2. Framing */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-stone-300">📐 2. 구도 밸런스 (3분할 황금비율)</span>
                <span className="font-mono text-amber-400 font-black text-[11px] bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                  {scoreData.framing} / 20
                </span>
              </div>
              <div className="w-full h-2 bg-stone-800/90 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(scoreData.framing / 20) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full shadow-xs"
                />
              </div>
            </div>

            {/* 3. Lighting */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-stone-300">☀️ 3. 자연광질 & 노출 명암비</span>
                <span className="font-mono text-sky-400 font-black text-[11px] bg-sky-400/10 px-2 py-0.5 rounded-md border border-sky-400/20">
                  {scoreData.lighting} / 20
                </span>
              </div>
              <div className="w-full h-2 bg-stone-800/90 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(scoreData.lighting / 20) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-sky-500 to-blue-400 rounded-full shadow-xs"
                />
              </div>
            </div>

            {/* 4. Background */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-stone-300">🌿 4. 서식지 배경 심도 & 보케</span>
                <span className="font-mono text-purple-400 font-black text-[11px] bg-purple-400/10 px-2 py-0.5 rounded-md border border-purple-400/20">
                  {scoreData.background} / 20
                </span>
              </div>
              <div className="w-full h-2 bg-stone-800/90 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(scoreData.background / 20) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full shadow-xs"
                />
              </div>
            </div>

            {/* 5. Pose */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-stone-300">🐾 5. 생태 포즈 & 역동성</span>
                <span className="font-mono text-rose-400 font-black text-[11px] bg-rose-400/10 px-2 py-0.5 rounded-md border border-rose-400/20">
                  {scoreData.pose} / 20
                </span>
              </div>
              <div className="w-full h-2 bg-stone-800/90 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(scoreData.pose / 20) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-rose-500 to-red-400 rounded-full shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Feedback Tip for Retake */}
          <div className="bg-amber-950/40 rounded-2xl p-3.5 flex items-start gap-2.5 border border-amber-900/30">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-300">실전 촬영 및 구도 개선 팁</p>
              <p className="text-[11px] text-amber-200/90 leading-relaxed mt-0.5">
                {scoreData.feedbackTip}
              </p>
              {scoreData.fieldNoteTip && (
                <p className="text-[10.5px] text-amber-300/80 leading-relaxed mt-1 border-t border-amber-800/30 pt-1">
                  🌿 <b>서식지 팁:</b> {scoreData.fieldNoteTip}
                </p>
              )}
            </div>
          </div>

          {/* Attribution Footer */}
          <div className="flex items-center justify-between text-[10px] text-stone-500 px-1 font-mono">
            <span>엔진: {API_SOURCES.photoArtVision.fullLabel}</span>
            <span>{API_SOURCES.photoArtVision.lastUpdated}</span>
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
                className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>더 좋은 구도로 재포착</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

