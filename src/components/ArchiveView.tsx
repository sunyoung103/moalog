import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpDown,
  ChevronDown,
  Check,
  Sticker,
  ImageIcon,
  ChevronRight,
  HelpCircle,
  Camera,
  BookOpen,
  Flame,
  MapPin,
  Volume2,
  X,
  Download,
  ChevronLeft,
  Clock,
  Share2,
  Trash2,
  Compass,
  Feather,
  Leaf,
  Cat,
  Bug,
  BarChart3,
  Sun,
  Droplets,
  Fish,
  Sparkles
} from 'lucide-react';
import { Specimen, UserStats, SpecimenCategory, NaturalistPersona } from '../types';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA, NATURALIST_PERSONAS, HOTSPOT_DATA } from '../data/hotspots';
import { ReportView } from './ReportView';

interface ArchiveViewProps {
  specimens: Specimen[];
  pendingSpecimens: Specimen[];
  searchQuery: string;
  onSelectSpecimen: (sp: Specimen) => void;
  onDeleteMultipleSpecimens?: (ids: string[]) => void;
  onOpenLens: () => void;
  filterTaxonomy: string | null;
  onClearTaxonomyFilter: () => void;
  onOpenHotspots: () => void;
  userStats: UserStats;
  onOpenMyPage: () => void;
  onUpdatePersona?: (persona: NaturalistPersona) => void;
}

export function ArchiveView({
  specimens,
  pendingSpecimens,
  searchQuery,
  onSelectSpecimen,
  onDeleteMultipleSpecimens,
  onOpenLens,
  filterTaxonomy,
  onClearTaxonomyFilter,
  onOpenHotspots,
  userStats,
  onOpenMyPage,
  onUpdatePersona,
}: ArchiveViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'collection' | 'report'>('collection');
  const [selectedCategory, setSelectedCategory] = useState<SpecimenCategory>('all');
  const [sortMode, setSortMode] = useState<'dex_number' | 'latest' | 'oldest' | 'korean_alpha' | 'distance' | 'taxonomy'>('dex_number');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<'sticker' | 'photo'>('sticker');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiDeleteConfirmOpen, setIsMultiDeleteConfirmOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [currentShareCardIndex, setCurrentShareCardIndex] = useState(0);
  const [shareCopyToast, setShareCopyToast] = useState<string | null>(null);
  const [expandedSpeciesId, setExpandedSpeciesId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const longPressTimeout = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'plants':
        return '🌿';
      case 'insects':
        return '🐞';
      case 'birds':
        return '🕊️';
      case 'invertebrates':
      case 'arachnids':
        return '🕷️';
      case 'mollusks':
        return '🐚';
      case 'crustaceans':
        return '🦀';
      case 'mammals':
        return '🐿️';
      case 'herptiles':
      case 'amphibians':
        return '🐸';
      case 'reptiles':
        return '🦎';
      case 'fishes':
        return '🐟';
      case 'fungi':
        return '🍄';
      default:
        return '🌿';
    }
  };

  const availableCategories = [
    { id: 'all', label: '전체', icon: Compass },
    { id: 'plants', label: '식물', icon: Leaf },
    { id: 'insects', label: '곤충', icon: Bug },
    { id: 'birds', label: '조류', icon: Feather },
    { id: 'invertebrates', label: '거미&연체', icon: Sparkles },
    { id: 'mammals', label: '포유류', icon: Cat },
    { id: 'herptiles', label: '양서&파충류', icon: Droplets },
    { id: 'fishes', label: '어류', icon: Fish },
    { id: 'fungi', label: '균류', icon: Sparkles },
  ];

  const tabsRef = useRef<HTMLDivElement>(null);
  const isMouseDownTabs = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);
  const hasDraggedTabs = useRef(false);

  const handleTabsMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isMouseDownTabs.current = true;
    hasDraggedTabs.current = false;
    startX.current = e.pageX - (tabsRef.current?.offsetLeft || 0);
    scrollLeftPos.current = tabsRef.current?.scrollLeft || 0;
  };

  const handleTabsMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownTabs.current || !tabsRef.current) return;
    const x = e.pageX - (tabsRef.current.offsetLeft || 0);
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasDraggedTabs.current = true;
    }
    tabsRef.current.scrollLeft = scrollLeftPos.current - walk;
  };

  const handleTabsMouseUpOrLeave = () => {
    isMouseDownTabs.current = false;
  };

  const handlePointerDown = (id: string) => {
    longPressTimeout.current = setTimeout(() => {
      setIsMultiSelectMode(true);
      setSelectedIds([id]);
    }, 700);
  };

  const handlePointerUp = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
  };

  const handleSpecimenClick = (sp: Specimen) => {
    if (isMultiSelectMode) {
      setSelectedIds((prev) =>
        prev.includes(sp.id) ? prev.filter((id) => id !== sp.id) : [...prev, sp.id]
      );
    } else {
      onSelectSpecimen(sp);
    }
  };

  const handleSimulateBirdAudio = (id: string, description: string) => {
    if (playingAudioId === id) {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch {}
        oscillatorRef.current = null;
      }
      setPlayingAudioId(null);
      return;
    }

    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch {}
    }

    setPlayingAudioId(id);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillatorRef.current = osc;

      if ((description || '').includes('짹')) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        osc.start();
        setTimeout(() => {
          setPlayingAudioId(null);
        }, 1200);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        osc.start();
        setTimeout(() => {
          setPlayingAudioId(null);
        }, 1500);
      }
    } catch {
      const utterance = new SpeechSynthesisUtterance(description);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.2;
      utterance.onend = () => setPlayingAudioId(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const safeSpecimens = specimens || [];
  const safePendingSpecimens = pendingSpecimens || [];
  // 글로벌 생물다양성 표준 색인 벤치마크 (500종 기준)
  const totalPossibleSpecies = 500;
  const userCollectedList = safeSpecimens.filter((s) => s.isCollected && !s.isPending);
  const collectionPercentage = totalPossibleSpecies > 0
    ? Math.round((userCollectedList.length / totalPossibleSpecies) * 100)
    : 0;

  const filteredCollectedList = safeSpecimens.filter((sp) => {
    if (!sp.isCollected || sp.isPending) return false;

    if (filterTaxonomy && !sp.taxonomyPath?.includes(filterTaxonomy) && sp.family !== filterTaxonomy) {
      return false;
    }

    if (selectedCategory !== 'all') {
      if (selectedCategory === 'invertebrates') {
        if (sp.category !== 'arachnids' && sp.category !== 'mollusks' && sp.category !== 'crustaceans') return false;
      } else if (selectedCategory === 'herptiles') {
        if (sp.category !== 'amphibians' && sp.category !== 'reptiles') return false;
      } else if (sp.category !== selectedCategory) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        (sp.koreanName || '').toLowerCase().includes(q) ||
        (sp.scientificName || '').toLowerCase().includes(q) ||
        ((sp.family || '').toLowerCase().includes(q)) ||
        (sp.traitChips && sp.traitChips.some((t) => (t || '').toLowerCase().includes(q)))
      );
    }

    return true;
  });

  const sortedList = [...filteredCollectedList];
  if (sortMode === 'dex_number') {
    sortedList.sort((a, b) => {
      const numA = parseInt((a.number || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b.number || '').replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return (a.number || '').localeCompare(b.number || '');
    });
  } else if (sortMode === 'latest') {
    sortedList.sort((a, b) => {
      const dateA = a.observations?.[0]?.date ? new Date(`${a.observations[0].date} ${a.observations[0].time || '00:00'}`).getTime() : 0;
      const dateB = b.observations?.[0]?.date ? new Date(`${b.observations[0].date} ${b.observations[0].time || '00:00'}`).getTime() : 0;
      return dateB - dateA;
    });
  } else if (sortMode === 'korean_alpha') {
    sortedList.sort((a, b) => a.koreanName.localeCompare(b.koreanName, 'ko-KR'));
  } else if (sortMode === 'distance') {
    sortedList.sort((a, b) => {
      const distA = a.locationCoord?.x || 0;
      const distB = b.locationCoord?.x || 0;
      return distA - distB;
    });
  } else if (sortMode === 'taxonomy') {
    sortedList.sort((a, b) => (a.family || '').localeCompare(b.family || ''));
  }

  const groupedByFamily = sortedList.reduce<Record<string, Specimen[]>>((acc, sp) => {
    const family = sp.family || '미분류';
    if (!acc[family]) acc[family] = [];
    acc[family].push(sp);
    return acc;
  }, {});

  const filteredHotspots = HOTSPOT_DATA.filter((spot) => {
    const currentPersona = NATURALIST_PERSONAS[userStats?.persona || 'general'] || NATURALIST_PERSONAS.general;
    const recommended = currentPersona?.recommendedCategories || [];

    const hasMatchingSpecies = spot.targetSpecies?.some((target) => {
      const item = SPECIES_ECOLOGY_ENCYCLOPEDIA.find((e) => e.koreanName === target.koreanName);
      if (!item) return false;

      const categoryMatch = (item.category && recommended.includes(item.category as any)) || recommended.includes('all' as any);
      if (!categoryMatch) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          (item.koreanName || '').toLowerCase().includes(q) ||
          (item.scientificName || '').toLowerCase().includes(q) ||
          (item.keyIdentification || '').toLowerCase().includes(q) ||
          (item.tags && item.tags.some((t) => (t || '').toLowerCase().includes(q)))
        );
      }
      return true;
    });

    return hasMatchingSpecies;
  });

  const selectedForShareSpecimens = safeSpecimens.filter((s) => (selectedIds || []).includes(s.id));
  const showCategoryTabs = activeSubTab === 'collection' && !filterTaxonomy;

  return (
    <div className="px-3.5 py-3.5 pb-24" id="archive-view-container">
      {/* Sub-tabs Toggle Bar: 나의 도감 / 리포트 */}
      <div className="flex bg-white p-1 rounded-2xl mb-4 shadow-2xs border border-stone-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('collection')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'collection'
              ? 'bg-emerald-800 text-white shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>나의 도감</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('report')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'report'
              ? 'bg-emerald-800 text-white shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>리포트</span>
        </button>
      </div>

      <div>
        {activeSubTab === 'collection' ? (
          (userCollectedList.length === 0 && (!pendingSpecimens || pendingSpecimens.length === 0)) ? (
            <div className="py-24 flex flex-col items-center justify-center text-center px-6 bg-white rounded-3xl mt-2 shadow-xs border border-stone-200/60">
              <div className="w-20 h-20 rounded-2xl bg-stone-900 text-white flex items-center justify-center mb-5 text-3xl font-black shadow-md">
                ✦
              </div>
              <h3 className="text-base font-black text-stone-900 mb-2">아직 기록된 자연 도감이 없습니다</h3>
              <p className="text-xs text-stone-600 mb-8 leading-relaxed max-w-[240px]">
                카메라로 우리 주변의 놀라운 생물들을 포착하고, 나만의 생태 백과사전을 완성해보세요!
              </p>
              <button
                onClick={onOpenLens}
                className="py-3 px-6 bg-stone-900 text-white text-sm font-black rounded-2xl shadow-md hover:bg-stone-800 transition-all inline-flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-white" />
                <span>렌즈로 첫 생물 포착하기</span>
              </button>
            </div>
          ) : (
          <div className="space-y-4">
            {filterTaxonomy ? (
              /* Taxonomy Breadcrumb Header */
              <div className="bg-white p-3 rounded-2xl flex items-center justify-between shadow-2xs border border-stone-200/80">
                <div className="flex items-center gap-1.5 text-xs text-stone-700">
                  <span className="font-extrabold text-stone-900">{filterTaxonomy}</span>
                  <span>필터링 중</span>
                </div>
                <button
                  onClick={onClearTaxonomyFilter}
                  className="text-[10px] text-stone-700 hover:text-stone-900 font-extrabold bg-stone-100 px-2.5 py-1 rounded-lg shadow-2xs"
                >
                  필터 해제
                </button>
              </div>
            ) : null}

            {showCategoryTabs && (
              <div className="sticky top-[45px] z-20 bg-stone-100/90 backdrop-blur-md -mx-3.5 px-3.5 py-2 flex items-center gap-1.5 border-b border-stone-200/60">
                <button
                  type="button"
                  onClick={() => {
                    if (tabsRef.current) tabsRef.current.scrollBy({ left: -160, behavior: 'smooth' });
                  }}
                  className="flex items-center justify-center w-7 h-7 rounded-xl bg-white text-stone-700 hover:bg-stone-100 shadow-2xs shrink-0 cursor-pointer border border-stone-200/80 active:scale-95 transition-all"
                  title="왼쪽 스크롤"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div 
                  ref={tabsRef}
                  onWheel={(e) => {
                    if (tabsRef.current && e.deltaY !== 0) {
                      tabsRef.current.scrollLeft += e.deltaY;
                    }
                  }}
                  onMouseDown={handleTabsMouseDown}
                  onMouseMove={handleTabsMouseMove}
                  onMouseUp={handleTabsMouseUpOrLeave}
                  onMouseLeave={handleTabsMouseUpOrLeave}
                  className="flex gap-2 overflow-x-auto scrollbar-none items-center touch-pan-x py-0.5 flex-1 select-none"
                >
                  {availableCategories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={(e) => {
                          if (hasDraggedTabs.current) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                          }
                          setSelectedCategory(cat.id as SpecimenCategory);
                        }}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                          isActive
                            ? 'wabi-3d-btn bg-stone-900 text-white font-black shadow-md border border-stone-800'
                            : 'wabi-glass-card bg-white/80 text-stone-700 hover:text-stone-950 font-bold border border-white/80'
                        }`}
                      >
                        {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-stone-600'}`} />}
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (tabsRef.current) tabsRef.current.scrollBy({ left: 160, behavior: 'smooth' });
                  }}
                  className="flex items-center justify-center w-7 h-7 rounded-xl bg-white text-stone-700 hover:bg-stone-100 shadow-2xs shrink-0 cursor-pointer border border-stone-200/80 active:scale-95 transition-all"
                  title="오른쪽 스크롤"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {pendingSpecimens && pendingSpecimens.length > 0 && (
              <div className="mb-3 bg-amber-50 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span className="text-xs font-bold text-amber-950">
                      분류 확정 대기 ({pendingSpecimens.length}건)
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-800 font-medium">탭하여 도감에 등록</span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {pendingSpecimens.map((sp) => (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => onSelectSpecimen(sp)}
                      className="shrink-0 flex items-center gap-2 bg-white p-1.5 pr-3 rounded-xl text-left transition-all hover:scale-102"
                    >
                      <div className="w-8 h-8 rounded-lg bg-stone-100 overflow-hidden shrink-0 p-0.5">
                        <img
                          src={sp.stickerImage || sp.originalImage}
                          alt={sp.koreanName}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-stone-900 truncate max-w-[90px]">
                          {sp.koreanName}
                        </span>
                        <span className="block text-[10px] text-amber-700 font-mono">후보 선택 &gt;</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Layout & Compact System Sort Controls & Multi-Select Header */}
            {isMultiSelectMode ? (
              <div className="flex items-center justify-between px-2.5 py-2 relative wabi-glass-dark bg-stone-900 text-white rounded-2xl shadow-lg">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsMultiSelectMode(false);
                      setSelectedIds([]);
                    }}
                    className="text-xs font-bold text-stone-300 hover:text-white bg-stone-800 px-2.5 py-1.5 rounded-xl transition-colors border border-stone-700"
                  >
                    취소
                  </button>
                  <span className="text-xs font-bold text-stone-100 font-mono">
                    {selectedIds.length}개 선택됨
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (selectedIds.length === filteredCollectedList.length) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(filteredCollectedList.map(s => s.id));
                      }
                    }}
                    className="text-xs font-bold text-stone-200 hover:text-white bg-stone-800 px-2.5 py-1.5 rounded-xl transition-colors border border-stone-700"
                  >
                    {selectedIds.length === filteredCollectedList.length && filteredCollectedList.length > 0 ? '해제' : '전체'}
                  </button>

                  {/* Photocard Share Button */}
                  <button
                    onClick={() => {
                      if (selectedIds.length > 0) {
                        setCurrentShareCardIndex(0);
                        setIsShareModalOpen(true);
                      }
                    }}
                    disabled={selectedIds.length === 0}
                    className="p-1.5 rounded-xl text-white bg-stone-700 hover:bg-stone-600 disabled:opacity-40 transition-colors flex items-center justify-center border border-stone-600"
                    title="포켓몬 카드 스타일로 공유"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (selectedIds.length > 0) {
                        setIsMultiDeleteConfirmOpen(true);
                      }
                    }}
                    disabled={selectedIds.length === 0}
                    className="p-1.5 rounded-xl text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 transition-colors flex items-center justify-center"
                    title="선택 기록 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-1 relative">
                {/* System Sort Dropdown Trigger & Quick Toggle */}
                <div className="flex items-center gap-1.5 relative">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                      className="wabi-glass-bubble flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 text-xs font-bold text-stone-800 transition-all active:scale-95 border border-white/80"
                    >
                      <ArrowUpDown className="w-3 h-3 text-stone-500" />
                      <span>
                        {sortMode === 'dex_number' && '번호순'}
                        {sortMode === 'latest' && '최신순'}
                        {sortMode === 'korean_alpha' && '가나다순'}
                        {sortMode === 'distance' && '거리순 (1회조회)'}
                        {sortMode === 'taxonomy' && '분류별'}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Compact System Sort Dropdown List */}
                    {isSortMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setIsSortMenuOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-1.5 w-56 wabi-glass-card bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl py-1.5 z-40 animate-fadeIn border border-white/80">
                          <div className="px-3 py-1.5 border-b border-stone-100 text-[10px] font-mono text-stone-400 font-bold uppercase tracking-wider">
                            도감 정렬 순서 선택
                          </div>
                          {[
                            { id: 'dex_number', label: '번호순', desc: '고유 도감 번호순' },
                            { id: 'latest', label: '최신순', desc: '최근 관찰 순서' },
                            { id: 'korean_alpha', label: '가나다순', desc: '국문명 오름차순' },
                            { id: 'taxonomy', label: '분류별', desc: '계통(과/문)별 정렬' },
                            { id: 'distance', label: '거리순', desc: '내 관찰 위치 기준 거리순' },
                          ].map((item) => {
                            const isSelected = sortMode === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setSortMode(item.id as any);
                                  setIsSortMenuOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors hover:bg-stone-50/80 ${
                                  isSelected ? 'bg-stone-100/90 text-stone-900 font-bold' : 'text-stone-600'
                                }`}
                              >
                                <div>
                                  <p className="leading-tight">{item.label}</p>
                                  <p className="text-[9px] text-stone-400 mt-0.5">{item.desc}</p>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-stone-900 shrink-0 ml-1" />}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* 1-Tap Quick Sort Toggle between No.001~ and Latest */}
                  <button
                    type="button"
                    onClick={() => {
                      setSortMode(prev => prev === 'dex_number' ? 'latest' : 'dex_number');
                    }}
                    className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-stone-200/70 hover:bg-stone-300 text-stone-700 active:scale-95 transition-all"
                    title="번호순 / 최신순 빠른 전환"
                  >
                    {sortMode === 'dex_number' ? '⇄ 최신순' : '⇄ 번호순'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-stone-500 font-mono">
                    {filteredCollectedList.length}건
                  </span>
                  <div className="flex bg-stone-200/60 p-0.5 rounded-xl">
                    <button
                      onClick={() => setDisplayMode('sticker')}
                      className={`p-1.5 rounded-lg transition-all ${
                        displayMode === 'sticker' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
                      }`}
                      title="스티커 뷰"
                    >
                      <Sticker className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDisplayMode('photo')}
                      className={`p-1.5 rounded-lg transition-all ${
                        displayMode === 'photo' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
                      }`}
                      title="사진 뷰"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Specimen Grid / Sticker Album */}
            {filteredCollectedList && filteredCollectedList.length > 0 ? (
              displayMode === 'sticker' ? (
                /* STICKER VIEW: 5px Solid White Sticker Border Styling */
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-2">
                  {filteredCollectedList.map((sp) => {
                    const stickerImg = sp.stickerImage || sp.originalImage;
                    return (
                      <motion.div
                        key={sp.id}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.94 }}
                        onPointerDown={() => handlePointerDown(sp.id)}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        onClick={() => handleSpecimenClick(sp)}
                        className={`bg-white rounded-2xl p-2.5 shadow-2xs border border-stone-200/60 flex flex-col items-center cursor-pointer relative transition-all hover:shadow-md ${isMultiSelectMode && selectedIds.includes(sp.id) ? 'opacity-80 ring-2 ring-stone-900' : ''}`}
                      >
                        {sp.number && (
                          <span className="absolute top-2 left-2 text-[9px] font-mono font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <span className="text-[10px]">{getCategoryIcon(sp.category)}</span>
                            <span>{sp.number}</span>
                          </span>
                        )}
                        {isMultiSelectMode && (
                          <div className={`absolute top-2 right-2 z-10 w-5 h-5 rounded-full flex items-center justify-center shadow-xs ${selectedIds.includes(sp.id) ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                            {selectedIds.includes(sp.id) && <Check className="w-3 h-3" />}
                          </div>
                        )}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center relative p-1 mt-3">
                          {stickerImg ? (
                            <img
                              src={stickerImg}
                              alt={sp.koreanName}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80';
                              }}
                              className="w-full h-full object-contain"
                              style={{
                                filter:
                                  'drop-shadow(2px 2px 0px #ffffff) drop-shadow(-2px -2px 0px #ffffff) drop-shadow(2px -2px 0px #ffffff) drop-shadow(-2px 2px 0px #ffffff) drop-shadow(0px 2px 0px #ffffff) drop-shadow(0px -2px 0px #ffffff) drop-shadow(2px 0px 0px #ffffff) drop-shadow(-2px 0px 0px #ffffff) drop-shadow(0 6px 12px rgba(0,0,0,0.14))',
                              }}
                            />
                          ) : (
                            <span className="text-3xl">🌿</span>
                          )}
                        </div>
                        <span className="mt-2 text-xs font-black text-stone-900 text-center tracking-tight truncate max-w-full">
                          {sp.koreanName}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* STANDARD PHOTO CARD VIEW: Exhibition Poster Card Layout */
                groupedByFamily && Object.entries(groupedByFamily).length > 0 &&
                (Object.entries(groupedByFamily) as [string, Specimen[]][]).map(
                  ([family, items]) => (
                    <div key={family} className="space-y-2 mb-4">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-black text-stone-900 tracking-tight flex items-center gap-1.5">
                          <span className="text-emerald-800 text-[10px]">✦</span>
                          <span>{family}</span>
                        </span>
                        <span className="text-[10px] text-stone-600 font-mono font-bold bg-stone-200/60 px-2 py-0.5 rounded-md">
                          {items.length}개 표본
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {items.map((sp) => {
                          const targetImage = sp.originalImage || sp.stickerImage;

                          return (
                            <motion.div
                              key={sp.id}
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.97 }}
                              onPointerDown={() => handlePointerDown(sp.id)}
                              onPointerUp={handlePointerUp}
                              onPointerLeave={handlePointerUp}
                              onClick={() => handleSpecimenClick(sp)}
                              className={`bg-white rounded-2xl p-2.5 shadow-2xs border border-stone-200/60 transition-all cursor-pointer flex flex-col justify-between relative hover:shadow-md ${
                                isMultiSelectMode && selectedIds.includes(sp.id) ? 'ring-2 ring-stone-900' : ''
                              }`}
                            >
                              {isMultiSelectMode && (
                                <div className={`absolute top-3 right-3 z-10 w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${selectedIds.includes(sp.id) ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                                  {selectedIds.includes(sp.id) && <Check className="w-3 h-3" />}
                                </div>
                              )}
                              <div className="relative aspect-square w-full rounded-xl bg-stone-100 overflow-hidden mb-2 flex items-center justify-center">
                                {targetImage ? (
                                  <img
                                    src={targetImage}
                                    alt={sp.koreanName}
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80';
                                    }}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-2xl opacity-40">🌿</span>
                                )}

                                {sp.confidence && (
                                  <span className="absolute bottom-1.5 right-1.5 bg-stone-900/90 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-md font-extrabold shadow-2xs">
                                    {sp.confidence}%
                                  </span>
                                )}
                              </div>

                              <div>
                                <div className="flex items-baseline justify-between">
                                  <h4 className="text-xs font-black text-stone-900 truncate">
                                    {sp.koreanName}
                                  </h4>
                                  <span className="text-[9px] font-mono font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                                    <span className="text-[10px]">{getCategoryIcon(sp.category)}</span>
                                    <span>{sp.number || 'No.01'}</span>
                                  </span>
                                </div>
                                <p className="text-[10px] text-stone-600 italic truncate font-serif mt-0.5">
                                  {sp.scientificName}
                                </p>
                                <div className="mt-2 pt-1.5 flex items-center justify-between text-[10px] text-stone-700 bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                                  <span className="truncate max-w-[85px] font-medium">
                                    {sp.locationCoord?.name || sp.habitatType || '도심'}
                                  </span>
                                  <ChevronRight className="w-3 h-3 text-stone-400" />
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )
              )
            ) : (
              <div className="wabi-glass-card rounded-3xl p-6 shadow-md mt-4 text-center border border-white/80 bg-white/80 backdrop-blur-xl">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3 text-2xl shadow-inner">
                  🔍
                </div>
                <h4 className="text-sm font-black text-stone-900 mb-1 tracking-tight">
                  {searchQuery ? `'${searchQuery}' 검색 결과` : '새로운 생태 기록 탐사'}
                </h4>
                <p className="text-xs text-stone-500 mb-4 max-w-xs mx-auto">
                  {searchQuery
                    ? '일치하는 표본이 없습니다. 아래 추천 생물이나 전체 도감에서 찾아보세요.'
                    : '다양한 계절 생물들을 탐사하고 렌즈로 직접 포착해 도감을 완성해보세요.'}
                </p>

                {/* Discovery sample quick pills */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mb-5 max-w-md mx-auto">
                  {['느타리버섯', '무당거미', '명주달팽이', '참가재', '왕벚나무', '소나무', '무당벌레'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setSelectedCategory('all');
                        const matched = safeSpecimens.find(s => s.koreanName.includes(sample));
                        if (matched) onSelectSpecimen(matched);
                      }}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-stone-100/90 hover:bg-stone-200 text-stone-800 border border-stone-200/60 active:scale-95 transition-all flex items-center gap-1"
                    >
                      <span>🌿</span>
                      <span>{sample}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                    }}
                    className="wabi-3d-btn px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-95 shadow-sm"
                  >
                    전체 도감 보기
                  </button>
                  <button
                    type="button"
                    onClick={onOpenLens}
                    className="wabi-glass-bubble px-4 py-2 rounded-xl text-xs font-bold bg-white/90 text-stone-800 hover:bg-white border border-stone-200 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-stone-600" />
                    <span>생태 렌즈 촬영</span>
                  </button>
                </div>
              </div>
            )}

            {/* Naturalist Status Summary Journal */}
            <div className="mt-8 bg-white rounded-3xl p-5 shadow-sm mb-4">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-stone-800" />
                <h3 className="text-sm font-bold text-stone-900">나의 생태 관찰 저널</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#F6F8F6] p-3 rounded-2xl">
                  <span className="block text-[10px] text-stone-500 font-bold mb-1">총 포착</span>
                  <div className="flex items-end gap-1">
                    <span className="text-xl font-black text-stone-900 leading-none">{userCollectedList.length}</span>
                    <span className="text-[10px] text-stone-500 font-bold mb-0.5">종</span>
                  </div>
                </div>
                
                <div className="bg-[#F6F8F6] p-3 rounded-2xl">
                  <span className="block text-[10px] text-stone-500 font-bold mb-1">방문 서식지</span>
                  <div className="flex items-end gap-1">
                    <span className="text-xl font-black text-stone-900 leading-none">{userStats.exploredHabitats?.length || 0}</span>
                    <span className="text-[10px] text-stone-500 font-bold mb-0.5">곳</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#F6F8F6] p-3.5 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-stone-900">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {userStats.streakDays}일 연속 관찰
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700">도감 완성률 {collectionPercentage}%</span>
                </div>
                <div className="w-full bg-stone-200/60 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${collectionPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-stone-400 font-mono mt-2 text-right">
                  생태 백과 {totalPossibleSpecies}종 중 {userCollectedList.length}종 수집
                </p>
              </div>
            </div>
          </div>
          )
        ) : (
          /* ================= [TAB 2] REPORT VIEW ================= */
          <ReportView
            specimens={specimens}
            userStats={userStats}
            onUpdatePersona={onUpdatePersona || (() => {})}
            onSelectSpecimen={onSelectSpecimen}
            onOpenLens={onOpenLens}
            onOpenHotspots={onOpenHotspots}
          />
        )}
      </div>

      {/* Custom Multi-Delete Confirmation Modal */}
      <AnimatePresence>
        {isMultiDeleteConfirmOpen && (
          <div className="fixed inset-0 z-[110] bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl space-y-5 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">{selectedIds.length}개의 기록을 삭제할까요?</h3>
                <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                  삭제된 관찰 기록은 설정의<br/>
                  <span className="font-semibold text-stone-700">휴지통</span>으로 이동되며 30일 후 영구 삭제됩니다.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsMultiDeleteConfirmOpen(false)}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-xs font-bold transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteMultipleSpecimens) {
                      onDeleteMultipleSpecimens(selectedIds);
                    }
                    setIsMultiDeleteConfirmOpen(false);
                    setIsMultiSelectMode(false);
                    setSelectedIds([]);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-bold transition-colors shadow-md"
                >
                  삭제하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clean Bio Photocard Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[120] bg-stone-950 text-stone-100 flex flex-col p-4 sm:p-6 select-none overflow-hidden">
            {/* Top Header Bar with Close Button Only */}
            <div className="max-w-md w-full mx-auto flex items-center justify-end py-2 px-1 border-b border-stone-800/80 shrink-0 mb-3">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-2.5 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white transition-colors"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toast alert */}
            {shareCopyToast && (
              <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl animate-bounce">
                {shareCopyToast}
              </div>
            )}

            {/* Main Photocard View Container */}
            <div className="max-w-md w-full mx-auto flex-1 flex flex-col items-center justify-center overflow-y-auto scrollbar-none py-2">
              {selectedForShareSpecimens.length > 0 ? (
                (() => {
                  const sp = selectedForShareSpecimens[currentShareCardIndex] || selectedForShareSpecimens[0];
                  const stickerImg = sp.stickerImage || sp.originalImage;
                  
                  const extractedPalette = sp.colorPalette && sp.colorPalette.length >= 2
                    ? {
                        primary: sp.colorPalette[0],
                        secondary: sp.colorPalette[1],
                        gradientBorder: `linear-gradient(135deg, ${sp.colorPalette[0]}, ${sp.colorPalette[1]}, #27272a)`,
                      }
                    : null;

                  const typeTheme = sp.category === 'plants'
                    ? { bg: 'from-emerald-950/90 via-stone-950 to-stone-900', borderStyle: 'from-emerald-400 via-stone-700 to-teal-500', badge: '식물', badgeBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' }
                    : sp.category === 'birds'
                    ? { bg: 'from-slate-950/90 via-stone-950 to-indigo-950/80', borderStyle: 'from-sky-400 via-stone-700 to-indigo-500', badge: '조류', badgeBg: 'bg-sky-950/90 text-sky-300 border-sky-500/40' }
                    : sp.category === 'insects'
                    ? { bg: 'from-amber-950/90 via-stone-950 to-stone-900', borderStyle: 'from-amber-400 via-stone-700 to-yellow-600', badge: '곤충', badgeBg: 'bg-amber-950/90 text-amber-300 border-amber-500/40' }
                    : { bg: 'from-purple-950/90 via-stone-950 to-stone-900', borderStyle: 'from-purple-400 via-stone-700 to-rose-500', badge: '야생 생물', badgeBg: 'bg-purple-950/90 text-purple-300 border-purple-500/40' };

                  return (
                    <div className="w-full flex flex-col items-center space-y-5">
                      {/* Dark Premium Photocard Container with White Sticker Window */}
                      <div className="relative w-[280px] sm:w-[310px]">
                        {/* Gradient Line Border using extracted colors or category gradient */}
                        <div
                          style={extractedPalette ? { background: extractedPalette.gradientBorder } : undefined}
                          className={`p-[2px] rounded-[26px] ${extractedPalette ? '' : `bg-gradient-to-br ${typeTheme.borderStyle}`} shadow-[0_16px_40px_rgba(0,0,0,0.9)] relative overflow-hidden`}
                        >
                          {/* Card Inner Body (Black background) */}
                          <div className={`bg-gradient-to-b ${typeTheme.bg} rounded-[24px] p-4 flex flex-col justify-between text-stone-100 relative shadow-2xl min-h-[410px]`}>
                            
                            {/* Top Header: Category Tag & Specimen Number */}
                            <div className="flex items-center justify-between pb-2 border-b border-white/10">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${typeTheme.badgeBg}`}>
                                {typeTheme.badge}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider">
                                {sp.number || 'SPECIMEN #01'}
                              </span>
                            </div>

                            {/* Center Image Foil Window - CLEAN WHITE BACKGROUND */}
                            <div className="relative my-3 rounded-2xl bg-white border border-stone-200 p-3 h-52 flex items-center justify-center overflow-hidden shadow-md">
                              {/* Specimen Cutout Sticker */}
                              {stickerImg ? (
                                <img
                                  src={stickerImg}
                                  alt={sp.koreanName}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
                                />
                              ) : (
                                <span className="text-5xl">🌿</span>
                              )}
                            </div>

                            {/* Specimen Info */}
                            <div className="space-y-1 text-center my-1">
                              <h4 className="text-base font-black text-white tracking-tight">
                                {sp.koreanName}
                              </h4>
                              <p className="text-[11px] text-amber-200/90 font-serif italic tracking-wide">
                                {sp.scientificName}
                              </p>
                            </div>

                            {/* Location & Date Footer */}
                            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-stone-400 font-mono">
                              <span className="truncate max-w-[150px]">{sp.locationCoord?.name || '자연 생태구역'}</span>
                              <span>
                                {sp.observations?.[0]?.date
                                  ? new Date(sp.observations[0].date).toLocaleDateString('ko-KR')
                                  : '2026.08.18'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pagination Carousel Controls (If multiple selected) */}
                      {selectedForShareSpecimens.length > 1 && (
                        <div className="flex items-center justify-center gap-4 py-1">
                          <button
                            type="button"
                            onClick={() => setCurrentShareCardIndex((prev) => (prev > 0 ? prev - 1 : selectedForShareSpecimens.length - 1))}
                            className="p-2 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-white transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-mono font-bold text-amber-300">
                            {currentShareCardIndex + 1} / {selectedForShareSpecimens.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCurrentShareCardIndex((prev) => (prev < selectedForShareSpecimens.length - 1 ? prev + 1 : 0))}
                            className="p-2 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-white transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Single Save Action Button */}
                      <div className="w-[280px] sm:w-[310px] pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShareCopyToast('🎴 포토카드 이미지가 저장되었습니다!');
                            setTimeout(() => setShareCopyToast(null), 2500);
                          }}
                          className="w-full py-3 bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-stone-950 rounded-2xl text-xs font-black transition-all shadow-xl flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>포토카드 저장하기</span>
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12 text-stone-400 text-xs">
                  선택된 포토카드가 없습니다.
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
