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
  Sparkles,
  Search,
  Lock,
  Settings,
} from 'lucide-react';
import { Specimen, UserStats, SpecimenCategory, NaturalistPersona, UserAccount } from '../types';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA, NATURALIST_PERSONAS, HOTSPOT_DATA } from '../data/hotspots';
import { ReportView } from './ReportView';
import { ExportCardModal } from './ExportCardModal';
import {
  GestureArchiveCollection,
  getCategoryDisplayLabel,
  resolveSpecimenOrder,
} from './GestureArchiveCollection';
import { formatSpeciesDisplayName, getSpeciesEnglishName, getSpeciesPrimaryName } from '../utils/speciesNameHelper';

const personaToCategory: Record<string, string> = {
  botanist: 'plants',
  plants: 'plants',
  birder: 'birds',
  birds: 'birds',
  entomologist: 'insects',
  insects: 'insects',
  mammalogist: 'mammals',
  mammals: 'mammals',
  herpetologist: 'herptiles',
  reptiles: 'herptiles',
  amphibians: 'herptiles',
  ichthyologist: 'fishes',
  fishes: 'fishes',
  mycologist: 'fungi',
  fungi: 'fungi',
};

interface ArchiveViewProps {
  specimens: Specimen[];
  pendingSpecimens: Specimen[];
  searchQuery: string;
  onSearchChange?: (q: string) => void;
  onSelectSpecimen: (sp: Specimen) => void;
  onDeleteMultipleSpecimens?: (ids: string[]) => void;
  onOpenLens: () => void;
  filterTaxonomy: string | null;
  onClearTaxonomyFilter: () => void;
  onOpenHotspots: () => void;
  userStats: UserStats;
  onOpenMyPage: () => void;
  onUpdatePersona?: (persona: NaturalistPersona) => void;
  onOpenQuestModal: () => void;
  onOpenSubscriptionModal?: () => void;
  userAccount?: UserAccount;
  onOpenLoginModal?: () => void;
  onDetailCategoryChange?: (isOpen: boolean) => void;
}

export function ArchiveView({
  specimens,
  pendingSpecimens,
  searchQuery,
  onSearchChange,
  onSelectSpecimen,
  onDeleteMultipleSpecimens,
  onOpenLens,
  filterTaxonomy,
  onClearTaxonomyFilter,
  onOpenHotspots,
  userStats,
  onOpenMyPage,
  onUpdatePersona,
  onOpenQuestModal,
  onOpenSubscriptionModal,
  userAccount,
  onOpenLoginModal,
  onDetailCategoryChange,
}: ArchiveViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'collection' | 'report'>('collection');
  const [selectedCategory, setSelectedCategory] = useState<SpecimenCategory>(() => {
    const currentPersonaId = userStats?.persona || 'general';
    const primary = personaToCategory[currentPersonaId];
    return (primary as SpecimenCategory) || 'all';
  });

  useEffect(() => {
    const currentPersonaId = userStats?.persona || 'general';
    const primary = personaToCategory[currentPersonaId];
    if (primary) {
      setSelectedCategory(primary as SpecimenCategory);
    } else {
      setSelectedCategory('all');
    }
  }, [userStats?.persona]);
  const [sortMode, setSortMode] = useState<'dex_number' | 'latest' | 'oldest' | 'korean_alpha' | 'distance' | 'taxonomy'>('dex_number');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<'gallery' | 'sticker'>('gallery');
  const [detailCategory, setDetailCategory] = useState<SpecimenCategory | null>(null);
  const [detailOrderTab, setDetailOrderTab] = useState<string>('all');
  const [isDetailSearchOpen, setIsDetailSearchOpen] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiDeleteConfirmOpen, setIsMultiDeleteConfirmOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportCardModalOpen, setIsExportCardModalOpen] = useState(false);
  const [exportTargetSpecimen, setExportTargetSpecimen] = useState<Specimen | null>(null);
  const [exportCardInitialMode, setExportCardInitialMode] = useState<'specimen' | 'summary'>('specimen');
  const [currentShareCardIndex, setCurrentShareCardIndex] = useState(0);
  const [shareCopyToast, setShareCopyToast] = useState<string | null>(null);
  const [expandedSpeciesId, setExpandedSpeciesId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  useEffect(() => {
    onDetailCategoryChange?.(detailCategory !== null);
  }, [detailCategory, onDetailCategoryChange]);

  useEffect(() => {
    if (activeSubTab !== 'collection' && detailCategory !== null) {
      setDetailCategory(null);
    }
  }, [activeSubTab, detailCategory]);

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



  const currentPersonaId = userStats?.persona || 'general';
  const primaryCatId = personaToCategory[currentPersonaId] || null;

  const baseCategories = [
    { id: 'plants', label: '식물', icon: Leaf },
    { id: 'insects', label: '곤충', icon: Bug },
    { id: 'birds', label: '조류', icon: Feather },
    { id: 'invertebrates', label: '거미&연체', icon: Sparkles },
    { id: 'mammals', label: '포유류', icon: Cat },
    { id: 'herptiles', label: '양서&파충류', icon: Droplets },
    { id: 'fishes', label: '어류', icon: Fish },
    { id: 'fungi', label: '균류', icon: Sparkles },
  ];

  let orderedCats = [...baseCategories];
  if (primaryCatId) {
    const idx = orderedCats.findIndex(c => c.id === primaryCatId);
    if (idx > -1) {
      const [matched] = orderedCats.splice(idx, 1);
      orderedCats.unshift(matched);
    }
  }

  const availableCategories = [
    { id: 'all', label: '전체', icon: Compass },
    ...orderedCats,
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
      if (!AudioCtx) throw new Error('Web Audio not supported');
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
      if (typeof window !== 'undefined' && 'SpeechSynthesisUtterance' in window && window.speechSynthesis) {
        try {
          const UtteranceClass = (window as any).SpeechSynthesisUtterance;
          if (UtteranceClass) {
            const utterance = new UtteranceClass(description);
            utterance.lang = 'ko-KR';
            utterance.rate = 1.2;
            utterance.onend = () => setPlayingAudioId(null);
            window.speechSynthesis.speak(utterance);
          }
        } catch {
          setPlayingAudioId(null);
        }
      } else {
        setPlayingAudioId(null);
      }
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

  const activeCategoryScope = detailCategory ?? selectedCategory;

  const filteredCollectedList = safeSpecimens.filter((sp) => {
    if (!sp.isCollected || sp.isPending) return false;

    if (filterTaxonomy && !sp.taxonomyPath?.includes(filterTaxonomy) && sp.family !== filterTaxonomy) {
      return false;
    }

    if (activeCategoryScope !== 'all') {
      if (activeCategoryScope === 'invertebrates') {
        if (sp.category !== 'arachnids' && sp.category !== 'mollusks' && sp.category !== 'crustaceans') return false;
      } else if (activeCategoryScope === 'herptiles') {
        if (sp.category !== 'amphibians' && sp.category !== 'reptiles') return false;
      } else if (sp.category !== activeCategoryScope) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const eng = getSpeciesEnglishName(sp).toLowerCase();
      const localized = getSpeciesPrimaryName(sp, userStats?.language).toLowerCase();
      return (
        (sp.koreanName || '').toLowerCase().includes(q) ||
        localized.includes(q) ||
        eng.includes(q) ||
        (sp.scientificName || '').toLowerCase().includes(q) ||
        ((sp.family || '').toLowerCase().includes(q)) ||
        (sp.traitChips && sp.traitChips.some((t) => (t || '').toLowerCase().includes(q)))
      );
    }

    return true;
  });

  const detailOrderTabs = detailCategory
    ? Array.from(
        new Set(
          filteredCollectedList.map((sp) => resolveSpecimenOrder(sp).orderName)
        )
      )
    : [];

  const currentPersona = NATURALIST_PERSONAS[userStats?.persona || 'general'] || NATURALIST_PERSONAS.general;
  const personaRecommendedCats = currentPersona?.recommendedCategories || [];

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
      const countDiff = (b.observations?.length || 1) - (a.observations?.length || 1);
      if (countDiff !== 0) return countDiff;
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

  Object.keys(groupedByFamily).forEach((family) => {
    groupedByFamily[family].sort((a, b) => {
      if (sortMode === 'dex_number') {
        const numA = parseInt((a.number || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.number || '').replace(/\D/g, ''), 10) || 0;
        if (numA !== numB) return numA - numB;
      }
      return a.koreanName.localeCompare(b.koreanName, 'ko-KR');
    });
  });

  const sortedFamilyEntries = Object.entries(groupedByFamily).sort(([a], [b]) => a.localeCompare(b, 'ko-KR'));

  const filteredHotspots = HOTSPOT_DATA.filter((spot) => {
    const recommended = personaRecommendedCats;

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
    <div className="bg-[#fbfbfb] pb-24" id="archive-view-container">
      {detailCategory ? (
        /* ================= [DETAIL SUB-VIEW] 자세히 > 카테고리 세부 분류 화면 ================= */
        <div className="max-w-lg mx-auto">
          {/* Top Header: <  |  카테고리명  |  Search + Settings */}
          <header className="sticky top-0 z-30 bg-[#fbfbfb]/95 backdrop-blur-xs px-4 pt-3 pb-2">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setDetailCategory(null);
                  setDetailOrderTab('all');
                  setIsDetailSearchOpen(false);
                }}
                className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center hover:bg-[#f4f5f4] transition-colors cursor-pointer shrink-0 shadow-2xs"
                aria-label="뒤로"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h2 className="text-[17px] font-bold text-[#202320] truncate">
                {getCategoryDisplayLabel(detailCategory)}
              </h2>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (isDetailSearchOpen && searchQuery) onSearchChange?.('');
                    setIsDetailSearchOpen((v) => !v);
                  }}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                    isDetailSearchOpen || searchQuery
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-[#202320] border-[#e6e9e5] hover:bg-[#f4f5f4]'
                  }`}
                  aria-label="카테고리 내 검색"
                >
                  {isDetailSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={onOpenMyPage}
                  className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center hover:bg-[#f4f5f4] transition-colors cursor-pointer"
                  aria-label="설정"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isDetailSearchOpen && (
              <div className="mt-2.5">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c948a]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    placeholder={`${getCategoryDisplayLabel(detailCategory)} 내 생물 검색...`}
                    className="w-full h-10 pl-10 pr-9 text-[13px] bg-white rounded-xl focus:outline-none text-[#202320] placeholder:text-[#8c948a] border border-[#e6e9e5] focus:border-black transition-colors"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => onSearchChange?.('')}
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

          {/* Sub-Order Text Tabs: 전체 | 우제목 | 식육목 | 설치목 ... */}
          <div className="px-4 pt-2 pb-1 flex items-center gap-5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setDetailOrderTab('all')}
              className={`text-[15px] whitespace-nowrap transition-colors cursor-pointer py-1 ${
                detailOrderTab === 'all'
                  ? 'text-[#202320] font-bold'
                  : 'text-[#8c948a] font-semibold hover:text-[#555c54]'
              }`}
            >
              전체
            </button>
            {detailOrderTabs.map((orderName) => {
              const isActive = detailOrderTab === orderName;
              return (
                <button
                  key={orderName}
                  type="button"
                  onClick={() => setDetailOrderTab(orderName)}
                  className={`text-[15px] whitespace-nowrap transition-colors cursor-pointer py-1 ${
                    isActive
                      ? 'text-[#202320] font-bold'
                      : 'text-[#8c948a] font-semibold hover:text-[#555c54]'
                  }`}
                >
                  {orderName}
                </button>
              );
            })}
          </div>

          <div className="px-4 pt-2.5 space-y-4">
            {/* Sort Dropdown Left + 카드 | 스티커 Toggle Right */}
            <div className="flex items-center justify-between relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f4f5f4] hover:bg-[#e6e9e5] text-[13px] font-semibold text-[#202320] transition-colors cursor-pointer"
                >
                  <span>
                    {sortMode === 'dex_number' && '번호순'}
                    {sortMode === 'latest' && '포착횟수'}
                    {sortMode === 'korean_alpha' && '가나다순'}
                    {sortMode === 'distance' && '거리순'}
                    {sortMode === 'taxonomy' && '분류별'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#626961] transition-transform ${
                      isSortMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isSortMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsSortMenuOpen(false)} />
                    <div className="absolute left-0 top-full mt-1.5 w-52 bg-white rounded-2xl shadow-lg py-1.5 z-40 border border-[#e6e9e5]">
                      <div className="px-3 py-1.5 border-b border-[#e6e9e5] text-[11px] text-[#8c948a] font-semibold">
                        도감 정렬 순서
                      </div>
                      {[
                        { id: 'dex_number', label: '번호순', desc: '고유 도감 번호순' },
                        { id: 'latest', label: '포착횟수', desc: '가장 많이 포착한 순서' },
                        { id: 'korean_alpha', label: '가나다순', desc: '국문명 오름차순' },
                        { id: 'taxonomy', label: '분류별', desc: '계통(과/문)별 정렬' },
                        { id: 'distance', label: '거리순', desc: '내 관찰 위치 기준' },
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
                            className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-[#f4f5f4] cursor-pointer ${
                              isSelected ? 'text-[#202320] font-bold' : 'text-[#626961]'
                            }`}
                          >
                            <div>
                              <p className="leading-tight">{item.label}</p>
                              <p className="text-[10px] text-[#8c948a] mt-0.5">{item.desc}</p>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#202320] shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div className="inline-flex bg-[#f4f5f4] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDisplayMode('gallery')}
                  className={`px-3 py-1 rounded-lg text-[13px] transition-all cursor-pointer ${
                    displayMode === 'gallery'
                      ? 'bg-white text-[#202320] font-bold shadow-2xs'
                      : 'text-[#8c948a] font-semibold'
                  }`}
                >
                  카드
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('sticker')}
                  className={`px-3 py-1 rounded-lg text-[13px] transition-all cursor-pointer ${
                    displayMode === 'sticker'
                      ? 'bg-white text-[#202320] font-bold shadow-2xs'
                      : 'text-[#8c948a] font-semibold'
                  }`}
                >
                  스티커
                </button>
              </div>
            </div>

            <GestureArchiveCollection
              specimens={sortedList}
              onSelectSpecimen={onSelectSpecimen}
              userStats={userStats}
              selectedCategory={detailCategory}
              onOpenSubscriptionModal={onOpenSubscriptionModal}
              viewMode={displayMode}
              onViewModeChange={setDisplayMode}
              groupingMode="order"
              selectedOrderFilter={detailOrderTab}
            />
          </div>
        </div>
      ) : (
        <>
          {/* C-01 Underline Sub-tabs: 나의 도감 | 리포트 */}
          <div className="flex border-b border-[#e6e9e5] bg-white px-4">
            <button
              type="button"
              onClick={() => setActiveSubTab('collection')}
              className={`flex-1 py-3 text-[15px] transition-colors relative cursor-pointer ${
                activeSubTab === 'collection'
                  ? 'text-[#202320] font-bold'
                  : 'text-[#8c948a] font-semibold hover:text-[#626961]'
              }`}
            >
              <span>나의 도감</span>
              {activeSubTab === 'collection' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#202320] rounded-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('report')}
              className={`flex-1 py-3 text-[15px] transition-colors relative cursor-pointer ${
                activeSubTab === 'report'
                  ? 'text-[#202320] font-bold'
                  : 'text-[#8c948a] font-semibold hover:text-[#626961]'
              }`}
            >
              <span>리포트</span>
              {activeSubTab === 'report' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#202320] rounded-full" />
              )}
            </button>
          </div>

          <div className="px-4 pt-3.5">
        {activeSubTab === 'collection' ? (
          <div className="space-y-4">
            {/* FLOW P-3 STEP 1 / STEP 3 Banners */}
            {!userStats.isProUser && userCollectedList.length > 10 ? (
              <div className="bg-[#fff4ef] rounded-[20px] p-4 border border-[#ff5100]/25 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5100] shrink-0" />
                  <h4 className="text-[13px] font-bold text-[#202320]">
                    구독이 끝났어요 · 모은 {userCollectedList.length}종은 평생 그대로
                  </h4>
                </div>
                <p className="text-xs text-[#626961] leading-relaxed">
                  새 생물 등록은 무료 기준(10칸)이라 지금은 잠겨 있어요. 이미 모은 생물 다시 찍기는 계속 가능해요.
                </p>
              </div>
            ) : !userStats.isProUser && userCollectedList.length >= 7 && userCollectedList.length <= 10 ? (
              <div className="bg-white rounded-[20px] p-4 border border-[#e6e9e5] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#202320]">무료 도감</span>
                    <span className="text-[13px] font-bold text-[#6d8911] tabular-nums">
                      {userCollectedList.length} / 10칸
                    </span>
                  </div>
                  {onOpenSubscriptionModal && (
                    <button
                      type="button"
                      id="btn-archive-banner-upgrade"
                      onClick={onOpenSubscriptionModal}
                      className="px-3 py-1 bg-[#c4eb43] hover:bg-[#b5df32] text-[#202320] font-bold text-[11px] rounded-full transition-colors cursor-pointer"
                    >
                      이용권
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 rounded-full transition-all ${
                        i < userCollectedList.length ? 'bg-[#c4eb43]' : 'bg-[#f4f5f4]'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#8c948a] font-medium">
                  <span>{Math.max(0, 10 - userCollectedList.length)}칸 남음</span>
                  {userCollectedList.length >= 10 && (
                    <span className="text-[#ff5100] font-bold">칸이 가득 찼어요</span>
                  )}
                </div>
              </div>
            ) : null}

            {userCollectedList.length === 0 && (!pendingSpecimens || pendingSpecimens.length === 0) ? (
              <div className="py-16 flex flex-col items-center justify-center text-center px-6 bg-white rounded-[20px] border border-[#e6e9e5]">
                <div className="w-14 h-14 rounded-2xl bg-[#f4fbdd] border border-[#c4eb43] text-[#6d8911] flex items-center justify-center mb-4 text-xl font-bold">
                  ✦
                </div>
                <h3 className="text-[17px] font-bold text-[#202320] mb-1.5">아직 기록된 자연 도감이 없습니다</h3>
                <p className="text-[13px] text-[#626961] mb-6 leading-relaxed max-w-[240px]">
                  {!userAccount?.isLoggedIn
                    ? '계정에 로그인하면 무료 도감 10칸이 바로 생성돼요'
                    : '카메라로 주변의 생물을 포착하고 나만의 도감을 채워 보세요'}
                </p>
                {!userAccount?.isLoggedIn ? (
                  <button
                    onClick={onOpenLoginModal}
                    className="h-12 px-6 bg-black hover:bg-[#202320] text-white text-sm font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>로그인하고 10칸 받기</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenLens}
                    className="h-12 px-6 bg-black hover:bg-[#202320] text-white text-sm font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-[#c4eb43]" />
                    <span>렌즈로 첫 생물 포착하기</span>
                  </button>
                )}
              </div>
            ) : null}

            {filterTaxonomy ? (
              <div className="bg-white p-3.5 rounded-2xl flex items-center justify-between border border-[#e6e9e5]">
                <div className="flex items-center gap-1.5 text-xs text-[#626961]">
                  <span className="font-bold text-[#202320]">{filterTaxonomy}</span>
                  <span>필터링 중</span>
                </div>
                <button
                  onClick={onClearTaxonomyFilter}
                  className="text-xs text-[#202320] font-bold bg-[#f4f5f4] hover:bg-[#e6e9e5] px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  필터 해제
                </button>
              </div>
            ) : null}

            {/* C-01 Top Controls Row: Sort Dropdown Left + 카드|스티커 Toggle Right */}
            {isMultiSelectMode ? (
              <div className="flex items-center justify-between px-3 py-2.5 bg-black text-white rounded-2xl">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsMultiSelectMode(false);
                      setSelectedIds([]);
                    }}
                    className="text-xs font-bold text-[#a5aca4] hover:text-white bg-white/10 px-2.5 py-1.5 rounded-xl cursor-pointer"
                  >
                    취소
                  </button>
                  <span className="text-xs font-bold tabular-nums">{selectedIds.length}개 선택됨</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (selectedIds.length === filteredCollectedList.length) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(filteredCollectedList.map((s) => s.id));
                      }
                    }}
                    className="text-xs font-bold text-white bg-white/10 px-2.5 py-1.5 rounded-xl cursor-pointer"
                  >
                    {selectedIds.length === filteredCollectedList.length && filteredCollectedList.length > 0
                      ? '해제'
                      : '전체'}
                  </button>
                  <button
                    onClick={() => {
                      if (selectedIds.length > 0) setIsMultiDeleteConfirmOpen(true);
                    }}
                    disabled={selectedIds.length === 0}
                    className="p-1.5 rounded-xl text-white bg-[#ff5100] disabled:opacity-40 cursor-pointer flex items-center justify-center"
                    title="선택 기록 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between relative">
                {/* Left: Sort Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f4f5f4] hover:bg-[#e6e9e5] text-[13px] font-semibold text-[#202320] transition-colors cursor-pointer"
                  >
                    <span>
                      {sortMode === 'dex_number' && '번호순'}
                      {sortMode === 'latest' && '포착횟수'}
                      {sortMode === 'korean_alpha' && '가나다순'}
                      {sortMode === 'distance' && '거리순'}
                      {sortMode === 'taxonomy' && '분류별'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#626961] transition-transform ${
                        isSortMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isSortMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsSortMenuOpen(false)} />
                      <div className="absolute left-0 top-full mt-1.5 w-52 bg-white rounded-2xl shadow-lg py-1.5 z-40 border border-[#e6e9e5]">
                        <div className="px-3 py-1.5 border-b border-[#e6e9e5] text-[11px] text-[#8c948a] font-semibold">
                          도감 정렬 순서
                        </div>
                        {[
                          { id: 'dex_number', label: '번호순', desc: '고유 도감 번호순' },
                          { id: 'latest', label: '포착횟수 · 최신', desc: '최근 관찰 순서' },
                          { id: 'korean_alpha', label: '가나다순', desc: '국문명 오름차순' },
                          { id: 'taxonomy', label: '분류별', desc: '계통(과/문)별 정렬' },
                          { id: 'distance', label: '거리순', desc: '내 관찰 위치 기준' },
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
                              className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-[#f4f5f4] cursor-pointer ${
                                isSelected ? 'text-[#202320] font-bold' : 'text-[#626961]'
                              }`}
                            >
                              <div>
                                <p className="leading-tight">{item.label}</p>
                                <p className="text-[10px] text-[#8c948a] mt-0.5">{item.desc}</p>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#202320] shrink-0 ml-1" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Right: 카드 | 스티커 Segmented Toggle */}
                <div className="inline-flex bg-[#f4f5f4] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('gallery')}
                    className={`px-3 py-1 rounded-lg text-[13px] transition-all cursor-pointer ${
                      displayMode === 'gallery'
                        ? 'bg-white text-[#202320] font-bold shadow-2xs'
                        : 'text-[#8c948a] font-semibold'
                    }`}
                  >
                    카드
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('sticker')}
                    className={`px-3 py-1 rounded-lg text-[13px] transition-all cursor-pointer ${
                      displayMode === 'sticker'
                        ? 'bg-white text-[#202320] font-bold shadow-2xs'
                        : 'text-[#8c948a] font-semibold'
                    }`}
                  >
                    스티커
                  </button>
                </div>
              </div>
            )}

            {/* C-01 Category Filter Pills */}
            {showCategoryTabs && (
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
                className="flex gap-2 overflow-x-auto scrollbar-none items-center touch-pan-x py-0.5 select-none -mx-4 px-4"
              >
                {availableCategories.map((cat) => {
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
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-black text-white font-bold'
                          : 'bg-white text-[#202320] font-semibold border border-[#e6e9e5] hover:border-[#d2d7d1]'
                      }`}
                    >
                      {cat.id !== 'all' && <span>{getCategoryIcon(cat.id)}</span>}
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {pendingSpecimens && pendingSpecimens.length > 0 && (
              <div className="mb-3 bg-amber-50 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span className="text-xs font-bold text-amber-950">
                      분류 확정 대기 {pendingSpecimens.length}건
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

            {/* Specimen Grid / Gesture Collection (Always category-level grouping in main view; tapping 자세히 opens detail view) */}
            {sortedList && sortedList.length > 0 ? (
              <GestureArchiveCollection
                specimens={sortedList}
                onSelectSpecimen={onSelectSpecimen}
                userStats={userStats}
                selectedCategory={selectedCategory}
                onOpenSubscriptionModal={onOpenSubscriptionModal}
                viewMode={displayMode}
                onViewModeChange={setDisplayMode}
                onSelectCategory={setSelectedCategory}
                groupingMode="category"
                onOpenCategoryDetail={(cat) => {
                  setDetailOrderTab('all');
                  setDetailCategory(cat);
                }}
              />
            ) : (
              <div className="rounded-[20px] p-6 mt-4 text-center border border-[#e6e9e5] bg-white">
                <div className="w-12 h-12 rounded-2xl bg-[#f4f5f4] flex items-center justify-center mx-auto mb-3 text-[#626961]">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="text-[15px] font-bold text-[#202320] mb-1">
                  {searchQuery ? `'${searchQuery}' 검색 결과` : '새로운 생태 기록 탐사'}
                </h4>
                <p className="text-xs text-[#626961] mb-4 max-w-xs mx-auto">
                  {searchQuery
                    ? '일치하는 표본이 없어요. 아래 추천 생물이나 전체 도감에서 찾아보세요.'
                    : '다양한 생물을 탐사하고 렌즈로 포착해 도감을 채워 보세요.'}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-1.5 mb-5 max-w-md mx-auto">
                  {['느타리버섯', '무당거미', '명주달팽이', '참가재', '왕벚나무', '소나무', '무당벌레'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setSelectedCategory('all');
                        const matched = safeSpecimens.find((s) => s.koreanName.includes(sample));
                        if (matched) onSelectSpecimen(matched);
                      }}
                      className="text-xs font-semibold px-3 py-1 rounded-full bg-[#f4f5f4] hover:bg-[#e6e9e5] text-[#202320] transition-colors cursor-pointer"
                    >
                      {sample}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="h-11 px-4 rounded-xl text-xs font-bold bg-black text-white hover:bg-[#202320] transition-colors cursor-pointer"
                  >
                    전체 도감 보기
                  </button>
                  <button
                    type="button"
                    onClick={onOpenLens}
                    className="h-11 px-4 rounded-xl text-xs font-bold bg-white text-[#202320] border border-[#e6e9e5] hover:bg-[#f4f5f4] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#626961]" />
                    <span>생태 렌즈 촬영</span>
                  </button>
                </div>
              </div>
            )}

            {/* Naturalist Status Summary Journal */}
            <div className="mt-6 bg-white border border-[#e6e9e5] rounded-[20px] p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#202320]" />
                  <h3 className="text-sm font-bold text-[#202320]">생태 관찰 요약</h3>
                </div>
                <span className="text-xs font-semibold text-[#626961] tabular-nums">
                  {collectionPercentage}% ({userCollectedList.length}/{totalPossibleSpecies}종)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-[#f4f5f4] p-2.5 rounded-xl text-center">
                  <span className="block text-[11px] text-[#626961] font-medium">총 포착</span>
                  <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                    <span className="text-base font-bold text-[#202320] tabular-nums leading-none">
                      {userCollectedList.length}
                    </span>
                    <span className="text-[11px] text-[#626961]">종</span>
                  </div>
                </div>

                <div className="bg-[#f4f5f4] p-2.5 rounded-xl text-center">
                  <span className="block text-[11px] text-[#626961] font-medium">방문 서식지</span>
                  <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                    <span className="text-base font-bold text-[#202320] tabular-nums leading-none">
                      {userStats.exploredHabitats?.length || 0}
                    </span>
                    <span className="text-[11px] text-[#626961]">곳</span>
                  </div>
                </div>

                <div className="bg-[#f4f5f4] p-2.5 rounded-xl text-center">
                  <span className="block text-[11px] text-[#626961] font-medium">연속 관찰</span>
                  <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                    <span className="text-base font-bold text-[#202320] tabular-nums leading-none">
                      {userStats.streakDays}
                    </span>
                    <span className="text-[11px] text-[#626961]">일</span>
                  </div>
                </div>
              </div>

              <div className="w-full bg-[#f4f5f4] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#c4eb43] h-full rounded-full transition-all duration-500"
                  style={{ width: `${collectionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* ================= [TAB 2] REPORT VIEW ================= */
          <ReportView
            specimens={specimens}
            userStats={userStats}
            userAccount={userAccount}
            onUpdatePersona={onUpdatePersona || (() => {})}
            onSelectSpecimen={onSelectSpecimen}
            onOpenLens={onOpenLens}
            onOpenHotspots={onOpenHotspots}
            onOpenQuestModal={onOpenQuestModal}
            onOpenReportShare={() => {
              setExportCardInitialMode('summary');
              setExportTargetSpecimen(null);
              setIsExportCardModalOpen(true);
            }}
          />
        )}
          </div>
        </>
      )}

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
                                {formatSpeciesDisplayName(sp, { language: userStats?.language, showEnglishNameWithLocal: userStats?.showEnglishNameWithLocal })}
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

      {/* Samsung Health Style Glassmorphism Eco Card Modal */}
      <ExportCardModal
        isOpen={isExportCardModalOpen}
        onClose={() => setIsExportCardModalOpen(false)}
        specimen={exportTargetSpecimen}
        specimens={specimens}
        userStats={userStats}
        userAccount={userAccount}
        initialMode={exportCardInitialMode}
      />

      {/* FLOW P-3 STEP 3: Fixed lock bar when 10-slot limit is reached in free mode */}
      {!userStats.isProUser && userCollectedList.length >= 10 && (
        <div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto bg-black text-white rounded-[20px] p-3.5 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#c4eb43] shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-white flex items-center gap-1.5">
                <span>새 생물 등록 잠김</span>
                <span className="text-[11px] text-[#a5aca4] tabular-nums">· {userCollectedList.length} / 10칸</span>
              </div>
              <p className="text-[11px] text-[#a5aca4]">다시 구독하면 바로 풀려요</p>
            </div>
          </div>
          {onOpenSubscriptionModal && (
            <button
              type="button"
              onClick={onOpenSubscriptionModal}
              className="px-3.5 py-2 bg-[#c4eb43] hover:bg-[#b5df32] text-[#202320] font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
            >
              다시 구독
            </button>
          )}
        </div>
      )}
    </div>
  );
}
