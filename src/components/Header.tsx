import React, { useState } from 'react';
import { Search, Settings2, X, Crown, Sparkles } from 'lucide-react';
import { UserStats } from '../types';

interface HeaderProps {
  collectedCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMyPage: () => void;
  onOpenSubscriptionModal: () => void;
  userStats: UserStats;
}

export const Header: React.FC<HeaderProps> = ({
  collectedCount,
  searchQuery,
  onSearchChange,
  onOpenMyPage,
  onOpenSubscriptionModal,
  userStats,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header
      id="app-global-header"
      className="sticky top-0 z-30 bg-[#F6F8F6]/95 backdrop-blur-md px-4 py-2.5 transition-all border-b border-stone-200/90 select-none"
    >
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Left: Title, collector tally, and PRO / Trial Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1.5">
            <h1
              id="header-main-title"
              className="text-base font-extrabold tracking-tight text-stone-900 font-sans"
            >
              자연 도감
            </h1>
            <span className="text-[11px] font-mono text-stone-500 font-bold bg-stone-200/60 px-1.5 py-0.2 rounded-md">
              {collectedCount}종
            </span>
          </div>

          {userStats.isProUser ? (
            <button
              id="btn-header-pro-badge"
              type="button"
              onClick={onOpenSubscriptionModal}
              className="flex items-center gap-1 text-[9px] bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-2xs font-mono transition-colors cursor-pointer"
              title="PRO 이용권 및 구독 관리"
            >
              <Crown className="w-2.5 h-2.5 fill-current" />
              PRO
            </button>
          ) : (
            <button
              id="btn-header-free-trial-badge"
              type="button"
              onClick={onOpenSubscriptionModal}
              className="flex items-center gap-1 text-[9px] bg-stone-200/80 hover:bg-stone-300 text-stone-700 font-extrabold px-2 py-0.5 rounded-full shadow-2xs font-mono transition-colors cursor-pointer border border-stone-300/60"
              title="무료 체험 (결제 및 구독 페이지 열기)"
            >
              <Sparkles className="w-2.5 h-2.5 text-amber-600" />
              무료 체험
            </button>
          )}
        </div>

        {/* Right: Search Toggle & Settings/MyPage */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="btn-header-search-toggle"
            type="button"
            onClick={() => {
              if (isSearchOpen && searchQuery) {
                onSearchChange('');
              }
              setIsSearchOpen(!isSearchOpen);
            }}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              isSearchOpen || searchQuery
                ? 'bg-stone-900 text-white'
                : 'text-stone-700 hover:text-stone-950 bg-white border border-stone-200/80 hover:bg-stone-100'
            }`}
            aria-label="생물 검색"
            title="생물 검색"
          >
            {isSearchOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
          </button>

          <button
            id="btn-header-open-settings"
            type="button"
            onClick={onOpenMyPage}
            className="w-8 h-8 flex items-center justify-center rounded-full text-stone-700 hover:text-stone-950 bg-white border border-stone-200/80 hover:bg-stone-100 transition-colors"
            title="설정 및 통계"
            aria-label="설정 및 도감 설정"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {isSearchOpen && (
        <div className="max-w-lg mx-auto mt-2 animate-fadeIn">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              id="input-specimen-search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="생물명, 과, 서식지 검색..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-white rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 text-stone-900 placeholder:text-stone-400 shadow-2xs"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
