import React, { useRef, useState, useEffect } from 'react';
import { Specimen } from '../types';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Sparkles, BookOpen } from 'lucide-react';

interface RecentSpecimenBasketProps {
  specimens: Specimen[];
  onSelectSpecimen: (sp: Specimen) => void;
  title?: string;
  maxItems?: number;
}

const ROTATION_ANGLES = [-3.5, 2.5, -2.0, 3.2, -1.5, 2.8, -3.0, 1.8, -2.5, 3.0];

export const RecentSpecimenBasket: React.FC<RecentSpecimenBasketProps> = ({
  specimens,
  onSelectSpecimen,
  title = '최근 관찰 기록 일지',
  maxItems = 12,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragMoved = useRef(false);

  // Filter collected specimens sorted by date/ID descending
  const recentList = specimens
    .filter((s) => s.isCollected && !s.isPending)
    .slice(0, maxItems);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [recentList.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -220 : 220;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    dragMoved.current = false;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !scrollRef.current) return;
    
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    
    if (Math.abs(walk) > 10) {
      dragMoved.current = true;
    }
    
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  if (recentList.length === 0) return null;

  return (
    <div className="pt-2 border-t border-stone-100">
      {/* Basket Header Controls */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <span>{title}</span>
              <span className="text-[9px] font-mono font-bold text-stone-800 bg-stone-200/80 px-1.5 py-0.2 rounded-full border border-stone-300">
                {recentList.length}개 표본
              </span>
            </h3>
            <p className="text-[10px] text-stone-500 font-medium">
              바구니에 담긴 수집 사진 (좌우 슬라이드로 탐색)
            </p>
          </div>
        </div>

        {/* Navigation Slider Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            className={`wabi-glass-bubble p-1.5 rounded-full border transition-all cursor-pointer ${
              canScrollLeft
                ? 'bg-white hover:bg-stone-200/80 text-stone-800 border-stone-200 shadow-xs active:scale-90'
                : 'bg-stone-100 text-stone-300 border-stone-100 cursor-not-allowed'
            }`}
            title="이전 기록"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            className={`wabi-glass-bubble p-1.5 rounded-full border transition-all cursor-pointer ${
              canScrollRight
                ? 'bg-white hover:bg-stone-200/80 text-stone-800 border-stone-200 shadow-xs active:scale-90'
                : 'bg-stone-100 text-stone-300 border-stone-100 cursor-not-allowed'
            }`}
            title="다음 기록"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Glass Specimen Basket Slider Frame */}
      <div className="relative rounded-3xl wabi-glass-panel bg-stone-100/70 border border-stone-200/80 shadow-inner p-3.5 overflow-hidden backdrop-blur-md">
        {/* Decorative Glass Bubble Accent */}
        <div className="absolute -right-4 -bottom-4 text-stone-300/20 pointer-events-none select-none">
          <Sparkles className="w-32 h-32" />
        </div>

        {/* Scrollable Polaroid / Specimen Card Tray */}
        <div
          ref={scrollRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="flex items-center gap-4 overflow-x-auto scrollbar-none scroll-smooth py-3 px-1 select-none touch-pan-x"
        >
          {recentList.map((sp, idx) => {
            const targetImg = sp.stickerImage || sp.originalImage;
            const obs = sp.observations?.[0];
            const rotationDeg = ROTATION_ANGLES[idx % ROTATION_ANGLES.length];
            const categoryEmoji =
              sp.category === 'birds'
                ? '🐦'
                : sp.category === 'plants'
                ? '🌱'
                : sp.category === 'insects'
                ? '🐞'
                : sp.category === 'reptiles'
                ? '🦎'
                : sp.category === 'amphibians'
                ? '🐸'
                : sp.category === 'fishes'
                ? '🐟'
                : sp.category === 'mammals'
                ? '🦊'
                : sp.category === 'fungi'
                ? '🍄'
                : sp.category === 'arachnids'
                ? '🕷️'
                : sp.category === 'mollusks'
                ? '🐌'
                : sp.category === 'crustaceans'
                ? '🦀'
                : '✨';

            return (
              <div
                key={sp.id}
                onPointerUp={(e) => {
                  if (dragMoved.current) return;
                  onSelectSpecimen(sp);
                }}
                style={{
                  transform: `rotate(${rotationDeg}deg)`,
                }}
                className="w-44 shrink-0 wabi-glass-card bg-white/95 p-2.5 pt-3.5 rounded-2xl border border-white/80 shadow-md hover:shadow-xl hover:rotate-0 hover:scale-105 hover:z-20 transition-all duration-300 cursor-pointer relative group flex flex-col justify-between"
              >
                {/* Frosted Glass Top Pin */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3 bg-white/80 border border-white/90 rounded-xs backdrop-blur-md shadow-2xs rotate-[-3deg] z-10 pointer-events-none" />

                {/* Card Top / Photo Container */}
                <div>
                  <div className="w-full h-32 rounded-xl overflow-hidden bg-stone-100 border border-stone-200/60 relative shadow-inner">
                    {targetImg ? (
                      <img
                        src={targetImg}
                        alt={sp.koreanName}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {categoryEmoji}
                      </div>
                    )}

                    {/* Category Emoji Badge */}
                    <span className="absolute top-1.5 left-1.5 bg-white/90 text-xs px-1.5 py-0.5 rounded-md backdrop-blur-xs border border-stone-200/60 shadow-2xs">
                      {categoryEmoji}
                    </span>

                    {/* Confidence or Quality Badge */}
                    {sp.confidence && (
                      <span className="absolute top-1.5 right-1.5 bg-stone-900/80 text-white font-mono text-[9px] font-black px-1.5 py-0.5 rounded-full backdrop-blur-xs">
                        {sp.confidence}%
                      </span>
                    )}
                  </div>

                  {/* Card Label Info */}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-black text-stone-900 truncate">
                        {sp.koreanName}
                      </h4>
                      <span className="text-[9px] font-mono font-bold text-stone-800 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200 shrink-0">
                        {sp.number || 'No.01'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-stone-500 font-medium truncate">
                      <Calendar className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                      <span className="truncate">{obs?.date || '2026.08.15'}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[9.5px] text-stone-600 font-medium truncate">
                      <MapPin className="w-2.5 h-2.5 text-stone-500 shrink-0" />
                      <span className="truncate">
                        {obs?.locationName || sp.habitatType || '도심 생태 공원'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom View Detail CTA indicator */}
                <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[9px] font-bold text-stone-400 group-hover:text-stone-900 transition-colors pointer-events-none">
                  <span>도감 백과 열람</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
