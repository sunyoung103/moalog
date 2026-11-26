import React, { useState } from 'react';
import { Search, Settings, X, Crown } from 'lucide-react';
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
      className="sticky top-0 z-30 bg-[#fbfbfb]/95 backdrop-blur-xs px-4 pt-3 pb-2 transition-all select-none"
    >
      <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
        {/* Left: Clean Moalog wordmark */}
        <h1
          id="header-main-title"
          className="text-[22px] font-bold tracking-tight text-[#202320] whitespace-nowrap shrink-0 leading-none"
        >
          Moalog
        </h1>

        {/* Right: Upgrade pill + Search circle + Settings circle */}
        <div className="flex items-center gap-2 shrink-0">
          {!userStats.isProUser ? (
            <button
              id="btn-header-upgrade"
              type="button"
              onClick={onOpenSubscriptionModal}
              className="h-9 px-3.5 rounded-full bg-white hover:bg-[#f4fbdd] border border-[#c4eb43] text-[#202320] text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="이용권 업그레이드"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="text-[#202320] shrink-0"
              >
                <path
                  d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"
                  fill="currentColor"
                />
              </svg>
              <span>Upgrade</span>
            </button>
          ) : (
            <button
              id="btn-header-pro-badge"
              type="button"
              onClick={onOpenSubscriptionModal}
              className="h-9 px-3.5 rounded-full bg-black text-[#c4eb43] text-[12px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="PRO 이용 중"
            >
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span>PRO</span>
            </button>
          )}

          <button
            id="btn-header-search-toggle"
            type="button"
            onClick={() => {
              if (isSearchOpen && searchQuery) {
                onSearchChange('');
              }
              setIsSearchOpen(!isSearchOpen);
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors cursor-pointer shrink-0 ${
              isSearchOpen || searchQuery
                ? 'bg-black text-white border-black'
                : 'bg-white text-[#202320] border-[#e6e9e5] hover:bg-[#f4f5f4]'
            }`}
            aria-label="생물 검색"
            title="생물 검색"
          >
            {isSearchOpen ? <X className="w-4 h-4 stroke-[1.8]" /> : <Search className="w-4 h-4 stroke-[1.8]" />}
          </button>

          <button
            id="btn-header-open-settings"
            type="button"
            onClick={onOpenMyPage}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-[#202320] border border-[#e6e9e5] hover:bg-[#f4f5f4] transition-colors cursor-pointer shrink-0"
            title="설정"
            aria-label="설정"
          >
            <Settings className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {isSearchOpen && (
        <div className="max-w-lg mx-auto mt-2.5 animate-fadeIn">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c948a]" />
            <input
              id="input-specimen-search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="생물명, 과, 서식지 검색..."
              className="w-full h-10 pl-10 pr-9 text-[13px] bg-white rounded-xl focus:outline-none text-[#202320] placeholder:text-[#8c948a] border border-[#e6e9e5] focus:border-black transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c948a] hover:text-[#202320] cursor-pointer"
                aria-label="검색어 지우기"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
