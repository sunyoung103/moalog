import React from 'react';
import { BookOpen, Camera, Map } from 'lucide-react';
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
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e6e9e5] select-none"
    >
      <div className="max-w-lg mx-auto h-[68px] px-10 flex items-center justify-between relative">
        {/* Tab 1: 도감 */}
        <button
          id="nav-tab-archive"
          type="button"
          onClick={() => onSelectTab('archive')}
          className={`relative flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
            currentTab === 'archive' ? 'text-[#202320]' : 'text-[#8c948a] hover:text-[#555c54]'
          }`}
        >
          <BookOpen
            className="w-5 h-5"
            strokeWidth={currentTab === 'archive' ? 2.2 : 1.75}
          />
          <span className="text-[11px] font-semibold tracking-tight leading-none whitespace-nowrap">
            도감
          </span>
          {(hasNewStickerNotice || pendingCount > 0) && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1.5 right-2.5 w-2 h-2 bg-[#ff5100] rounded-full ring-2 ring-white"
            />
          )}
        </button>

        {/* Tab 2: Center protruding black Camera CTA */}
        <button
          id="nav-tab-lens"
          type="button"
          onClick={() => onSelectTab('lens')}
          aria-label="포착 렌즈"
          className="relative -mt-7 w-14 h-14 rounded-full bg-black hover:bg-[#202320] text-white shadow-[0_6px_18px_rgba(0,0,0,0.24)] ring-4 ring-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer shrink-0"
        >
          <Camera className="w-6 h-6 stroke-[2]" />
        </button>

        {/* Tab 3: 탐험 맵 */}
        <button
          id="nav-tab-map"
          type="button"
          onClick={() => onSelectTab('map')}
          className={`relative flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
            currentTab === 'map' ? 'text-[#202320]' : 'text-[#8c948a] hover:text-[#555c54]'
          }`}
        >
          <Map
            className="w-5 h-5"
            strokeWidth={currentTab === 'map' ? 2.2 : 1.75}
          />
          <span className="text-[11px] font-semibold tracking-tight leading-none whitespace-nowrap">
            탐험 맵
          </span>
        </button>
      </div>
    </nav>
  );
};
