import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

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

  const effectiveDuration = duration > 0 ? duration : 12;
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

  // Keep state refs synced (avoid unused warning on props)
  useEffect(() => {
    if (isPlaying && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isPlaying, isExpanded]);

  void onStop;
  void onToggleMute;
  void isMuted;
  void specimenName;

  return (
    <div className="w-full select-none">
      <div className="w-full bg-[#f4f5f4] rounded-[18px] px-3 py-2.5 flex items-center gap-3">
        {/* Circular Black Play / Pause Button */}
        <button
          type="button"
          onClick={() => {
            if (isPlaying) {
              onPause();
            } else {
              onPlay();
            }
          }}
          className="w-10 h-10 rounded-full bg-[#1a1c1a] hover:bg-[#323632] text-white active:scale-95 flex items-center justify-center shrink-0 transition-all cursor-pointer focus:outline-none"
          aria-label={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-white text-white" strokeWidth={2} />
          ) : (
            <Play className="w-4 h-4 fill-white text-white ml-0.5" strokeWidth={2} />
          )}
        </button>

        {/* Interactive Waveform Scrubber */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative flex-1 h-8 flex items-center cursor-ew-resize touch-none"
          title="클릭하거나 드래그하여 재생 위치를 탐색하세요"
        >
          <div className="w-full flex items-center justify-between gap-[2.5px] h-7 pointer-events-none">
            {WAVEFORM_HEIGHTS.map((heightRatio, idx) => {
              const barProgress = idx / (WAVEFORM_HEIGHTS.length - 1);
              const isPlayed = barProgress <= currentProgress;
              return (
                <div
                  key={idx}
                  className={`flex-1 min-w-[2px] max-w-[3.5px] rounded-full transition-colors duration-100 ${
                    isPlayed ? 'bg-[#1a1c1a]' : 'bg-[#c5cac4]'
                  }`}
                  style={{
                    height: `${Math.max(4, Math.round(heightRatio * 24))}px`,
                    transform: isPlaying && isPlayed ? 'scaleY(1.06)' : 'scaleY(1)',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Time Display */}
        <span className="text-[12px] font-medium text-[#6d746b] tabular-nums shrink-0 pr-0.5">
          {formatTime(currentTime)} / {formatTime(effectiveDuration)}
        </span>
      </div>
    </div>
  );
};
