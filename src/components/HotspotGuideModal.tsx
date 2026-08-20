import React, { useState, useMemo } from 'react';
import { Specimen, NaturalistPersona, SpeciesEcologyDetail, HotspotEcology } from '../types';
import { NATURALIST_PERSONAS, HOTSPOT_DATA, SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';
import {
  Compass,
  Feather,
  Leaf,
  Footprints,
  Bug,
  Search,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Camera,
  BookOpen,
  Volume2,
  MapPin,
  Clock,
  ShieldCheck,
  Eye,
  Navigation,
  Layers,
  Sparkle,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HotspotGuideModalProps {
  isOpen?: boolean;
  currentPersona?: NaturalistPersona;
  onSelectPersona?: (persona: NaturalistPersona) => void;
  specimens: Specimen[];
  onSelectSpecimen: (specimen: Specimen) => void;
  onOpenLens: () => void;
  onClose: () => void;
  onFlyToMapHotspot?: (coord: { x: number; y: number }, name: string) => void;
}

export const HotspotGuideModal: React.FC<HotspotGuideModalProps> = ({
  isOpen = true,
  currentPersona = 'general',
  onSelectPersona,
  specimens,
  onSelectSpecimen,
  onOpenLens,
  onClose,
  onFlyToMapHotspot,
}) => {
  // Main view tab: 'species' (생태 종 백과) or 'hotspots' (서식지 핫스팟)
  const [mainTab, setMainTab] = useState<'species' | 'hotspots'>('species');

  // Category filter: 'all' | 'birds' | 'plants' | 'mammals' | 'insects'
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSpeciesId, setExpandedSpeciesId] = useState<string | null>(
    SPECIES_ECOLOGY_ENCYCLOPEDIA[0].id
  );
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotEcology | null>(HOTSPOT_DATA[0]);

  if (!isOpen) return null;

  // Filtered species encyclopedia
  const filteredSpecies = useMemo(() => {
    return SPECIES_ECOLOGY_ENCYCLOPEDIA.filter((item) => {
      // 1. Category Filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.koreanName.toLowerCase().includes(q);
        const matchesSci = item.scientificName.toLowerCase().includes(q);
        const matchesEng = item.englishName.toLowerCase().includes(q);
        const matchesFamily = item.family.toLowerCase().includes(q);
        const matchesIdent = item.keyIdentification.toLowerCase().includes(q);
        const matchesHabitat = item.habitat.toLowerCase().includes(q);
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));
        return (
          matchesName ||
          matchesSci ||
          matchesEng ||
          matchesFamily ||
          matchesIdent ||
          matchesHabitat ||
          matchesTags
        );
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  // Filtered hotspots
  const filteredHotspots = useMemo(() => {
    return HOTSPOT_DATA.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesLoc = item.locationName.toLowerCase().includes(q);
        const matchesSpecies = item.targetSpecies.some((s) =>
          s.koreanName.toLowerCase().includes(q)
        );
        return matchesName || matchesLoc || matchesSpecies;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div
      id="hotspot-guide-modal-backdrop"
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F8FAF8] text-stone-900 rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
      >
        {/* Top Pull Down Drag Bar */}
        <div
          className="w-full pt-1 pb-2 flex justify-center cursor-pointer sm:hidden"
          onClick={onClose}
        >
          <div className="w-10 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* Top Header - Consistent with other modals */}
        <div className="flex items-center justify-between pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">자연 생태 & 탐조 가이드</h2>
              <p className="text-[10px] text-stone-500 font-mono">
                근교 서식지 생태 정보 및 출현 가능 도감
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Main Navigation Tabs */}
        <div className="mt-3 grid grid-cols-2 gap-1.5 p-1 bg-stone-200/70 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setMainTab('species')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              mainTab === 'species'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>생태 종 백과 ({filteredSpecies.length}종)</span>
          </button>
          <button
            type="button"
            onClick={() => setMainTab('hotspots')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              mainTab === 'hotspots'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>근교 서식지 핫스팟 ({filteredHotspots.length}곳)</span>
          </button>
        </div>

        {/* 2. Category Chips & Search Bar */}
        <div className="mt-3 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="생물 이름, 학명, 식별 특징, 울음소리, 서식지 검색..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900 text-stone-900 placeholder:text-stone-400 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {[
              { id: 'all', label: '전체 생물' },
              { id: 'birds', label: '조류 (새) 🦆' },
              { id: 'plants', label: '식물 🌿' },
              { id: 'insects', label: '곤충 🐞' },
              { id: 'mammals', label: '포유류 🐿️' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-stone-900 text-white shadow-xs font-bold'
                    : 'bg-white text-stone-600 hover:bg-stone-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Main List Content */}
        {mainTab === 'species' ? (
          <div className="mt-3.5 space-y-2 flex-1 overflow-y-auto pr-0.5">
            {filteredSpecies.map((species) => {
              const isExpanded = expandedSpeciesId === species.id;
              const matchingCollected = specimens.find(
                (s) => s.koreanName === species.koreanName && s.isCollected
              );

              return (
                <div
                  key={species.id}
                  className={`bg-white rounded-2xl transition-all overflow-hidden ${
                    isExpanded
                      ? 'shadow-md bg-stone-100'
                      : 'hover:bg-stone-50 shadow-2xs'
                  }`}
                >
                  <div
                    onClick={() => setExpandedSpeciesId(isExpanded ? null : species.id)}
                    className="p-3 cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                        {matchingCollected?.stickerImage ? (
                          <img
                            src={matchingCollected.stickerImage}
                            alt={species.koreanName}
                            className="w-full h-full object-contain filter drop-shadow-2xs p-0.5"
                          />
                        ) : (
                          <span className="text-base">
                            {species.category === 'birds'
                              ? '🕊️'
                              : species.category === 'plants'
                              ? '🌱'
                              : species.category === 'insects'
                              ? '🐝'
                              : '🐾'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-stone-900 truncate">
                            {species.koreanName}
                          </span>
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-mono">
                            {species.family}
                          </span>
                          {matchingCollected && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                              수집 완료
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400 italic font-serif truncate">
                          {species.scientificName}
                        </p>
                      </div>
                    </div>

                    <ChevronDown
                      className={`w-4 h-4 text-stone-400 transition-transform ${
                        isExpanded ? 'rotate-180 text-stone-900' : ''
                      }`}
                    />
                  </div>

                  {/* Expanded Species Ecological Profile */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-3.5 pb-3.5 pt-1 space-y-2.5 text-xs text-stone-700 bg-[#F5F5F4]"
                      >
                        <div className="bg-white p-2.5 rounded-xl">
                          <span className="text-[10px] font-bold text-stone-400 block font-mono">
                            핵심 동정 포인트
                          </span>
                          <p className="mt-0.5 leading-relaxed text-stone-800">
                            {species.keyIdentification}
                          </p>
                        </div>

                        {species.callOrSound && (
                          <div className="bg-amber-50/80 p-2.5 rounded-xl text-amber-900 flex items-start gap-1.5">
                            <Volume2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700" />
                            <div>
                              <span className="text-[10px] font-bold block">울음소리 / 음향 특징</span>
                              <p className="text-[11px] mt-0.5">{species.callOrSound}</p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-white p-2 rounded-xl">
                            <span className="text-[9px] font-mono text-stone-400 block">주요 서식지</span>
                            <span className="font-semibold text-stone-800">{species.habitat}</span>
                          </div>
                          <div className="bg-white p-2 rounded-xl">
                            <span className="text-[9px] font-mono text-stone-400 block">최적 관찰 팁</span>
                            <span className="font-semibold text-stone-800">
                              {species.bestObservationTip}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-1 flex items-center gap-2">
                          {matchingCollected ? (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectSpecimen(matchingCollected);
                                onClose();
                              }}
                              className="flex-1 py-2 bg-stone-900 text-white rounded-xl font-bold text-xs shadow-xs"
                            >
                              내 도감 표본 보기 &gt;
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenLens();
                              }}
                              className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>AI 렌즈로 첫 포착하기</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-3.5 space-y-2.5 flex-1 overflow-y-auto pr-0.5">
            {filteredHotspots.map((item) => {
              const isSelected = selectedHotspot?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedHotspot(item)}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white shadow-md'
                      : 'bg-white/80 hover:bg-white shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-900 text-white shadow-xs">
                          {item.categoryLabel}
                        </span>
                        <span className="text-[10px] font-mono text-stone-500 font-semibold">
                          📍 {item.distanceKm} km 근교
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-stone-900 mt-1">{item.name}</h3>
                      <p className="text-xs text-stone-500 mt-0.5">{item.address}</p>
                    </div>

                    {onFlyToMapHotspot && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFlyToMapHotspot(item.mapCoord, item.name);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-700 text-xs font-bold flex items-center gap-1 transition-all shrink-0 shadow-xs"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>지도 이동</span>
                      </button>
                    )}
                  </div>

                  {/* Habitat Species List */}
                  <div className="mt-3 pt-2.5">
                    <div className="flex items-center justify-between text-[11px] text-stone-600 mb-1.5">
                      <span className="font-bold text-stone-900 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-stone-700" />
                        주요 서식종 및 출현 확률
                      </span>
                      <span className="text-[10px] text-stone-500">{item.bestTime}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {item.targetSpecies.map((target) => (
                        <div
                          key={target.koreanName}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMainTab('species');
                            setSearchQuery(target.koreanName);
                            const match = SPECIES_ECOLOGY_ENCYCLOPEDIA.find(
                              (s) => s.koreanName === target.koreanName
                            );
                            if (match) setExpandedSpeciesId(match.id);
                          }}
                          className="p-2 bg-stone-50 hover:bg-stone-100 rounded-xl flex items-center justify-between transition-colors"
                        >
                          <div className="min-w-0 pr-1">
                            <p className="text-xs font-bold text-stone-900 truncate">
                              {target.koreanName}
                            </p>
                            <p className="text-[9px] font-mono text-stone-500 truncate italic">
                              {target.scientificName}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded shrink-0">
                            {target.chancePercent}%
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-stone-600 mt-2 bg-stone-100/60 p-2 rounded-xl leading-relaxed">
                      🔍 <span className="font-semibold text-stone-800">탐사 가이드: </span>
                      {item.fieldTips}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};
