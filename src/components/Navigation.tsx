import React from 'react';
import { BookOpen, Camera, Compass } from 'lucide-react';
import { motion } from 'motion/react';

interface NavigationProps {
  currentTab: 'archive' | 'lens' | 'map';
  onSelectTab: (tab: 'archive' | 'lens' | 'map') => void;
  hasNewStickerNotice?: boolean;
  pendingCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  hasNewStickerNotice,
  pendingCount = 0,
}) => {
  return (
    <nav
      id="global-bottom-navigation"
      aria-label="하단 네비게이션"
      className="fixed bottom-3 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
    >
      <div className="pointer-events-auto flex items-center gap-1.5 bg-stone-900 text-stone-300 shadow-xl rounded-full px-2.5 py-1.5 transition-all">
        {/* Tab 1: 내 도감 (Archive) */}
        <button
          id="nav-tab-archive"
          type="button"
          onClick={() => onSelectTab('archive')}
          className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            currentTab === 'archive'
              ? 'bg-white text-stone-950 font-bold shadow-xs'
              : 'text-stone-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="tracking-tight text-[11px]">내 도감</span>
          {(hasNewStickerNotice || pendingCount > 0) && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-stone-900"
            />
          )}
        </button>

        {/* Tab 2: 렌즈 (Lens / Shutter) */}
        <button
          id="nav-tab-lens"
          type="button"
          onClick={() => onSelectTab('lens')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            currentTab === 'lens'
              ? 'bg-white text-stone-950 font-bold shadow-xs'
              : 'text-stone-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Camera className="w-4 h-4" />
            {currentTab === 'lens' && (
              <span className="absolute -inset-1 rounded-full border border-stone-950/30 animate-ping opacity-30 pointer-events-none" />
            )}
          </div>
          <span className="tracking-tight text-[11px]">포착 렌즈</span>
        </button>

        {/* Tab 3: 탐험 맵 (Map) */}
        <button
          id="nav-tab-map"
          type="button"
          onClick={() => onSelectTab('map')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
            currentTab === 'map'
              ? 'bg-white text-stone-950 font-bold shadow-xs'
              : 'text-stone-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span className="tracking-tight text-[11px]">탐험 맵</span>
        </button>
      </div>
    </nav>
  );
};

