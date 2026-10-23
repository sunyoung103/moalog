import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Volume2, VolumeX, X, RotateCcw } from 'lucide-react';

interface MorphingAudioPlayerProps {
  audioUrl?: string;
  audioTitle?: string;
  sourceLabel?: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onToggleMute: () => void;
  specimenName: string;
}

// Preset natural waveform bars representing authentic bio-acoustic frequency density
const WAVEFORM_HEIGHTS = [
  0.28, 0.45, 0.72, 0.95, 0.62, 0.82, 0.48, 0.9, 0.75, 0.55, 
  0.88, 1.0, 0.68, 0.42, 0.8, 0.92, 0.6, 0.35, 0.78, 0.85, 
  0.5, 0.65, 0.4, 0.7, 0.82, 0.52, 0.38, 0.25
];

export const MorphingAudioPlayer: React.FC<MorphingAudioPlayerProps> = ({
  audioTitle,
  sourceLabel,
  audioRef,
  isPlaying,
  currentTime,
  duration,
  isMuted,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onToggleMute,
  specimenName,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Sync expanded state with isPlaying (auto-expand when playback begins)
  useEffect(() => {
    if (isPlaying && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isPlaying, isExpanded]);

  const effectiveDuration = duration > 0 ? duration : 30;
  const currentProgress = isDragging
    ? dragProgress
    : Math.min(1, Math.max(0, currentTime / effectiveDuration));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate scrub position from pointer event
  const getProgressFromPointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    return rect.width > 0 ? x / rect.width : 0;
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    const prog = getProgressFromPointer(e);
    setDragProgress(prog);
    const targetTime = prog * effectiveDuration;
    onSeek(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    const prog = getProgressFromPointer(e);
    setDragProgress(prog);
    const targetTime = prog * effectiveDuration;
    onSeek(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      const prog = getProgressFromPointer(e);
      const targetTime = prog * effectiveDuration;
      onSeek(targetTime);
      if (audioRef.current) {
        audioRef.current.currentTime = targetTime;
      }
    }
  };

  // Spring configuration: snappy, minimal overshoot, no bouncy ease
  const springTransition = {
    type: 'spring' as const,
    stiffness: 440,
    damping: 34,
    mass: 0.8,
  };

  const contentTransition = {
    duration: 0.16,
    ease: [0.16, 1, 0.3, 1] as const,
  };

  return (
    <div className="w-full flex items-center justify-start select-none font-geist">
      {/* 
        Single continuous morphing element:
        Same element changes width, radius, and content via blur crossfade.
      */}
      <motion.div
        layout
        transition={springTransition}
        className={`relative overflow-hidden bg-black text-white border border-stone-800 shadow-sm ${
          isExpanded
            ? 'w-full h-14 rounded-2xl p-2.5 flex items-center gap-3'
            : 'h-11 rounded-full px-4 flex items-center gap-2.5 cursor-pointer hover:bg-stone-900 active:scale-[0.98]'
        }`}
        onClick={() => {
          if (!isExpanded) {
            setIsExpanded(true);
            onPlay();
          }
        }}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* ================= COLLAPSED: TACTILE PLAY BUTTON ================= */
            <motion.div
              key="collapsed-play-btn"
              initial={{ opacity: 0, filter: 'blur(5px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(4px)' }}
              transition={contentTransition}
              className="flex items-center gap-2.5 whitespace-nowrap w-full"
            >
              <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                <Play className="w-2.5 h-2.5 fill-black text-black ml-0.5" strokeWidth={2} />
              </div>
              <span className="text-xs font-semibold tracking-tight text-white font-geist">
                자연 음성 재생
              </span>
              <span className="text-[11px] font-mono font-medium text-stone-400">
                {formatTime(effectiveDuration)}
              </span>
              {/* Micro quiet soundwave lines */}
              <div className="flex items-center gap-0.5 ml-1">
                {[0.4, 0.8, 0.5].map((val, i) => (
                  <div
                    key={i}
                    className="w-[1.5px] rounded-full bg-stone-600"
                    style={{ height: `${val * 10}px` }}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            /* ================= EXPANDED: FULL CONTINUOUS SCRUBBER ================= */
            <motion.div
              key="expanded-player"
              initial={{ opacity: 0, filter: 'blur(5px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(4px)' }}
              transition={contentTransition}
              className="flex items-center gap-2.5 w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Play / Pause Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  if (isPlaying) {
                    onPause();
                  } else {
                    onPlay();
                  }
                }}
                className="w-9 h-9 rounded-full bg-white text-black hover:bg-stone-200 active:scale-95 flex items-center justify-center shrink-0 transition-transform cursor-pointer focus:outline-none"
                aria-label={isPlaying ? '일시정지' : '재생'}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-black text-black" strokeWidth={2} />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-black text-black ml-0.5" strokeWidth={2} />
                )}
              </button>

              {/* Current Time (Geist Mono) */}
              <span className="text-[11px] font-mono font-medium text-stone-300 tabular-nums shrink-0 w-8 text-right">
                {formatTime(currentTime)}
              </span>

              {/* Interactive Waveform Scrubber: Click & Drag Driven */}
              <div
                ref={trackRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="relative flex-1 h-9 flex items-center cursor-ew-resize group/track px-1 touch-none"
                title="클릭하거나 드래그하여 재생 위치를 탐색하세요"
              >
                {/* Waveform Bars */}
                <div className="w-full flex items-center justify-between gap-[2px] h-6 pointer-events-none">
                  {WAVEFORM_HEIGHTS.map((heightRatio, idx) => {
                    const barProgress = idx / (WAVEFORM_HEIGHTS.length - 1);
                    const isPlayed = barProgress <= currentProgress;
                    const isScrubbingNear = isDragging && Math.abs(barProgress - currentProgress) < 0.06;
                    return (
                      <div
                        key={idx}
                        className={`flex-1 min-w-[2px] max-w-[4px] rounded-full transition-colors duration-100 ${
                          isPlayed
                            ? 'bg-white'
                            : isScrubbingNear
                            ? 'bg-stone-500'
                            : 'bg-stone-700'
                        }`}
                        style={{
                          height: `${Math.max(4, heightRatio * 22)}px`,
                          transform: isPlaying && isPlayed ? 'scaleY(1.08)' : 'scaleY(1)',
                        }}
                      />
                    );
                  })}
                </div>

                {/* Floating Scrub Head & Tooltip when dragging */}
                <div
                  className="absolute top-0 bottom-0 pointer-events-none flex items-center justify-center transition-transform"
                  style={{ left: `${currentProgress * 100}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="w-[3px] h-7 bg-white rounded-full shadow-sm" />

                  {isDragging && (
                    <div className="absolute -top-7 px-1.5 py-0.5 rounded bg-white text-black font-mono text-[9px] font-bold shadow-md whitespace-nowrap">
                      {formatTime(currentProgress * effectiveDuration)}
                    </div>
                  )}
                </div>
              </div>

              {/* Total Duration (Geist Mono) */}
              <span className="text-[11px] font-mono font-medium text-stone-500 tabular-nums shrink-0 w-8">
                {formatTime(effectiveDuration)}
              </span>

              {/* Mute Toggle */}
              <button
                type="button"
                onClick={onToggleMute}
                className="w-7 h-7 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/80 active:scale-95 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title={isMuted ? '음소거 해제' : '음소거'}
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5" strokeWidth={1.75} />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                )}
              </button>

              {/* Reset to Start Button */}
              <button
                type="button"
                onClick={onStop}
                className="w-7 h-7 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/80 active:scale-95 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title="처음으로 되감기"
              >
                <RotateCcw className="w-3 h-3" strokeWidth={1.75} />
              </button>

              {/* Collapse to Button */}
              <button
                type="button"
                onClick={() => {
                  onPause();
                  setIsExpanded(false);
                }}
                className="w-7 h-7 rounded-lg text-stone-500 hover:text-white hover:bg-stone-800/80 active:scale-95 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title="플레이어 접기"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
