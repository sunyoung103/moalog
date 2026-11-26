import React, { useState, useMemo, useEffect } from 'react';
import {
  CommunityMemo,
  ExplorerProfile,
  MapNotification,
  MemoReportReason,
  MemoVisibility,
  PublicSpecimenEntry,
  Specimen,
  UserAccount,
  UserStats,
} from '../types';
import {
  BIOBLITZ_HOTSPOTS,
  BioBlitzCenter,
  EXPLORER_LEVEL_RANKING_SEED,
  EXPLORER_PUBLIC_SPECIMENS,
  INITIAL_EXPLORER_PROFILES,
  REPORT_REASONS,
  detectProtectedSpecies,
} from '../data/communityMapData';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';
import { INITIAL_SPECIMENS } from '../data/defaultSpecimens';
import {
  evaluateExplorerBadges,
  EvaluatedBadge,
  TOTAL_POLICY_BADGES_ADULT,
  TOTAL_POLICY_BADGES_UNDER14,
} from '../data/badges';
import { obfuscateCoordinates } from '../utils/imagePrivacy';
import {
  getLevelFromXp,
  getRequiredXpForLevel,
  getTitleAdjectiveForLevel,
  getUnder14DesignFlags,
  NEW_SPECIES_XP_REWARD,
} from '../utils/levelPolicy';
import { getExplorerTitleInfo } from '../utils/explorerTitles';
import { getSpeciesTaxonomyCategoryLabel } from '../utils/speciesNameHelper';
import {
  X,
  Search,
  MapPin,
  Bookmark,
  Heart,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Flag,
  Ban,
  Send,
  Camera,
  Check,
  Bell,
  Settings,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  LogIn,
  Trophy,
  Share2,
  MoreHorizontal,
  Layers,
  Plus,
  Menu,
  Flame,
  Wifi,
  RotateCcw,
  AlertCircle,
  FileText,
  Clock,
  Download,
  Copy,
  ZoomIn,
  BookOpen,
  Compass,
  CloudSun,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanceLabel(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round(km * 1000))}m`;
  return `${km.toFixed(1)}km`;
}

export function resolveMemoPlace(memo: CommunityMemo, allMemos: CommunityMemo[] = []): BioBlitzCenter {
  const byHotspot = BIOBLITZ_HOTSPOTS.find((h) => h.name === memo.placeName);
  if (byHotspot) return byHotspot;
  const firstMatchingMemo = allMemos.find((m) => m.placeName === memo.placeName) || memo;
  return {
    id: `memo-place-${firstMatchingMemo.id}`,
    name: memo.placeName || memo.regionLabel,
    habitatType: '탐사 관찰지',
    lat: firstMatchingMemo.lat,
    lng: firstMatchingMemo.lng,
    description: '탐험가들이 함께 방문하여 생태 관찰 기록을 남기는 공개 탐사 장소입니다.',
  };
}

function getTierBadgeLabel(tier: EvaluatedBadge['tier']): string {
  switch (tier) {
    case 'bronze':
      return '동 뱃지';
    case 'silver':
      return '은 뱃지';
    case 'gold':
      return '금 뱃지';
    case 'legend':
      return '마스터 뱃지';
  }
}

/* ============================================================================
   H-10 장소 상세 모달
   ============================================================================ */
interface PlaceDetailModalProps {
  place: BioBlitzCenter | null;
  onClose: () => void;
  memos: CommunityMemo[];
  isBookmarked: boolean;
  onToggleBookmarkPlace: (placeId: string) => void;
  userCenter: { lat: number; lng: number };
  onSelectMemo: (memo: CommunityMemo) => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  place,
  onClose,
  memos,
  isBookmarked,
  onToggleBookmarkPlace,
  userCenter,
  onSelectMemo,
}) => {
  const placeMemos = useMemo(() => {
    if (!place) return [];
    const matched = memos.filter(
      (m) =>
        m.placeName.includes(place.name.split(' ')[0]) ||
        haversineKm(place.lat, place.lng, m.lat, m.lng) <= 2.5
    );
    return matched;
  }, [memos, place]);

  const uniqueExplorers = useMemo(() => {
    const ids = new Set(placeMemos.map((m) => m.authorId));
    return ids.size;
  }, [placeMemos]);

  if (!place) return null;

  const latestRecord = placeMemos[0]?.createdAt || '기록 없음';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#fbfbfb] sm:bg-black/45 sm:backdrop-blur-xs p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="w-full h-full sm:h-auto sm:max-h-[88vh] sm:max-w-lg bg-[#fbfbfb] sm:rounded-[28px] shadow-2xl sm:border sm:border-[#e6e9e5] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0 bg-[#fbfbfb]">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] flex items-center justify-center text-[#202320] cursor-pointer shadow-2xs"
              aria-label="뒤로"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-[17px] font-bold text-[#202320] truncate px-2">{place.name}</h3>
            <button
              type="button"
              onClick={() => onToggleBookmarkPlace(place.id)}
              className={`h-9 px-3 rounded-full border flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-2xs shrink-0 ${
                isBookmarked
                  ? 'bg-[#f4fbdd] border-[#c4eb43] text-[#6d8911]'
                  : 'bg-white border-[#e6e9e5] text-[#202320] hover:bg-[#f4f5f4]'
              }`}
              aria-label={isBookmarked ? '탐사지 찜 해제' : '탐사지 찜하기'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
              <span>{isBookmarked ? '찜한 탐사지' : '탐사지 찜'}</span>
            </button>
          </div>

          <div className="px-4 pt-2 pb-6 overflow-y-auto flex-1 space-y-5 scrollbar-none">
            {/* Location Mini-Card */}
            <div className="bg-white rounded-[20px] border border-[#e6e9e5] p-3 flex items-center gap-3.5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#eef5df] via-[#e2edcf] to-[#d6e6bc] border border-[#dce8c7] flex items-center justify-center relative shrink-0 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-[#3b82f6]/20 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#2563eb] border-2 border-white shadow" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[16px] font-bold text-[#202320] truncate">{place.name}</h4>
                <p className="text-xs text-[#626961] mt-1 leading-snug">{place.description}</p>
                <p className="text-[11px] text-[#8c948a] mt-1">
                  {place.habitatType} · 약 {formatDistanceLabel(haversineKm(userCenter.lat, userCenter.lng, place.lat, place.lng))}
                </p>
              </div>
            </div>

            {/* 3-Stat Bar */}
            <div className="bg-[#f4f5f4] rounded-[20px] grid grid-cols-3 divide-x divide-[#e6e9e5] py-4 text-center">
              <div>
                <span className="text-[18px] font-bold text-[#202320] tabular-nums block">
                  {placeMemos.length}개
                </span>
                <span className="text-[11px] font-medium text-[#8c948a]">기록</span>
              </div>
              <div>
                <span className="text-[18px] font-bold text-[#202320] tabular-nums block">
                  {uniqueExplorers}명
                </span>
                <span className="text-[11px] font-medium text-[#8c948a]">탐험가</span>
              </div>
              <div>
                <span className="text-[16px] font-bold text-[#202320] truncate block px-1">
                  {latestRecord}
                </span>
                <span className="text-[11px] font-medium text-[#8c948a]">마지막 기록</span>
              </div>
            </div>

            {/* Records List */}
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <h4 className="text-[18px] font-bold text-[#202320]">이 장소의 기록</h4>
                <span className="text-xs font-medium text-[#8c948a]">최신순</span>
              </div>

              {placeMemos.length === 0 ? (
                <div className="bg-white rounded-[20px] border border-[#e6e9e5] p-8 text-center text-xs text-[#8c948a]">
                  이 장소에 아직 등록된 메모가 없어요.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {placeMemos.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectMemo(m);
                      }}
                      className="w-full bg-white rounded-[20px] border border-[#e6e9e5] p-3 flex items-center justify-between gap-3 text-left hover:border-[#d2d7d1] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-[#f4f5f4] overflow-hidden shrink-0">
                          {m.photoUrl ? (
                            <img
                              src={m.photoUrl}
                              alt={m.speciesKoreanName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Camera className="w-4 h-4 text-[#8c948a]" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-[15px] font-bold text-[#202320] truncate">
                            {m.speciesKoreanName}
                          </h5>
                          <p className="text-xs text-[#8c948a] mt-0.5 truncate">
                            {getSpeciesTaxonomyCategoryLabel(m.category)} · {m.authorName} · {m.createdAt}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-[#8c948a] shrink-0">
                        {m.createdAt}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* ============================================================================
   구역(클러스터) 기록 모아보기 모달 — 정확한 위치 비노출 · 구역 단위 탐색
   ============================================================================ */
export interface ClusterAreaGroup {
  id: string;
  areaTitle: string;
  isResolvingArea?: boolean;
  centerLat: number;
  centerLng: number;
  memos: CommunityMemo[];
  specimens: Specimen[];
}

interface ClusterRecordsModalProps {
  cluster: ClusterAreaGroup | null;
  onClose: () => void;
  hideProtectedLocations: boolean;
  onSelectMemo: (memo: CommunityMemo) => void;
  onSelectSpecimen: (specimen: Specimen) => void;
  onZoomInArea: (lat: number, lng: number) => void;
}

export const ClusterRecordsModal: React.FC<ClusterRecordsModalProps> = ({
  cluster,
  onClose,
  hideProtectedLocations,
  onSelectMemo,
  onSelectSpecimen,
  onZoomInArea,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'memos' | 'specimens'>('all');

  useEffect(() => {
    if (cluster) setFilterTab('all');
  }, [cluster?.id]);

  if (!cluster) return null;

  const totalCount = cluster.memos.length + cluster.specimens.length;
  const showTabs = cluster.memos.length > 0 && cluster.specimens.length > 0;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-xs p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-h-[85vh] sm:max-w-lg bg-[#fbfbfb] rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-[#e6e9e5] overflow-hidden flex flex-col"
        >
          <div className="px-4 pt-3 pb-3 bg-white border-b border-[#e6e9e5] shrink-0 space-y-3">
            <div className="w-10 h-1 rounded-full bg-[#d9ddd8] mx-auto sm:hidden" />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#6d8911]">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>탐험 기록 모아보기</span>
                </div>
                <h3 className="text-[19px] font-bold text-[#202320] mt-0.5 truncate flex items-center gap-1.5">
                  <span>{cluster.areaTitle}</span>
                  {cluster.isResolvingArea && (
                    <span className="text-[11px] font-medium text-[#8c948a] shrink-0">확인 중...</span>
                  )}
                </h3>
                <p className="text-xs text-[#8c948a] mt-0.5 tabular-nums">
                  이 구역 탐험 기록 총 {totalCount}개
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-[#f4f5f4] hover:bg-[#e6e9e5] flex items-center justify-center text-[#202320] shrink-0 cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-3 py-2 rounded-xl bg-[#f4fbdd]/75 border border-[#dceaa8] flex items-center gap-2 text-[11px] font-medium text-[#4a5c0a]">
              <ShieldCheck className="w-4 h-4 text-[#6d8911] shrink-0" />
              <span>정확한 좌표는 숨기고 구역 단위로만 모아 보여드려요. 다른 탐험가의 도감은 비공개예요.</span>
            </div>

            {showTabs && (
              <div className="flex items-center gap-1.5 bg-[#f4f5f4] p-1 rounded-2xl">
                {[
                  { id: 'all' as const, label: `전체 ${totalCount}` },
                  { id: 'memos' as const, label: `탐험가 메모 ${cluster.memos.length}` },
                  { id: 'specimens' as const, label: `내 도감(나만 보임) ${cluster.specimens.length}` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterTab(tab.id)}
                    className={`flex-1 py-1.5 rounded-xl text-[11px] transition-colors cursor-pointer tabular-nums ${
                      filterTab === tab.id
                        ? 'bg-white text-[#202320] font-bold shadow-2xs'
                        : 'text-[#8c948a] font-semibold hover:text-[#202320]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-none">
            {(filterTab === 'all' || filterTab === 'memos') &&
              cluster.memos.map((memo) => {
                const safeArea =
                  memo.isProtectedSpecies && hideProtectedLocations
                    ? memo.regionLabel
                    : memo.regionLabel || memo.placeName;
                return (
                  <button
                    key={`cluster-m-${memo.id}`}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectMemo(memo);
                    }}
                    className="w-full p-3 rounded-[20px] bg-white border border-[#e6e9e5] hover:border-[#d2d7d1] flex items-center gap-3 text-left cursor-pointer transition-colors"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-[#f4f5f4] overflow-hidden shrink-0 flex items-center justify-center">
                      {memo.photoUrl ? (
                        <img
                          src={memo.photoUrl}
                          alt={memo.speciesKoreanName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-5 h-5 text-[#8c948a]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[15px] font-bold text-[#202320]">
                          {memo.speciesKoreanName}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#f4f5f4] text-[#626961]">
                          탐험가 메모
                        </span>
                        {memo.isProtectedSpecies && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#f4fbdd] text-[#6d8911]">
                            보호종
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#626961] truncate mt-0.5">{memo.memoText}</p>
                      <div className="text-[11px] text-[#8c948a] mt-0.5 truncate">
                        {memo.authorName} · {safeArea} · {memo.createdAt}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8c948a] shrink-0" />
                  </button>
                );
              })}

            {(filterTab === 'all' || filterTab === 'specimens') &&
              cluster.specimens.map((sp) => {
                const thumb = sp.originalImage || sp.stickerImage || sp.observations?.[0]?.photoUrl || '';
                return (
                  <button
                    key={`cluster-sp-${sp.id}`}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectSpecimen(sp);
                    }}
                    className="w-full p-3 rounded-[20px] bg-white border border-[#e6e9e5] hover:border-[#d2d7d1] flex items-center gap-3 text-left cursor-pointer transition-colors"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-[#f4f5f4] overflow-hidden shrink-0 flex items-center justify-center">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={sp.koreanName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-5 h-5 text-[#8c948a]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[15px] font-bold text-[#202320]">{sp.koreanName}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#f4fbdd] text-[#6d8911]">
                          내 도감 · 나만 보임
                        </span>
                      </div>
                      <div className="text-[11px] italic text-[#8c948a]">{sp.scientificName}</div>
                      <div className="text-[11px] text-[#8c948a] truncate mt-0.5">
                        {sp.locationCoord?.name || sp.habitatType}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8c948a] shrink-0" />
                  </button>
                );
              })}
          </div>

          <div className="p-4 bg-white border-t border-[#e6e9e5] shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onZoomInArea(cluster.centerLat, cluster.centerLng);
              }}
              className="w-full h-12 rounded-2xl bg-[#202320] hover:bg-black text-white text-[14px] font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-99 transition-all"
            >
              <ZoomIn className="w-4 h-4" />
              <span>이 구역 지도 확대해서 보기</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* ============================================================================
   61 / Ⓘ-2 검색 · 장소 모달 (최근 검색어 · 최근 본 생물 · 분할 탭 & 더보기)
   ============================================================================ */
export interface RecentViewedSpeciesItem {
  id: string;
  kind: 'memo' | 'specimen';
  name: string;
  scientificName: string;
  subtitle: string;
  photoUrl: string;
  viewedAt: number;
}

const RECENT_SEARCHES_KEY = 'moalog_map_recent_searches_v1';
const RECENT_SPECIES_KEY = 'moalog_map_recent_species_v1';

export function recordRecentViewedSpecies(item: Omit<RecentViewedSpeciesItem, 'viewedAt'>) {
  try {
    const raw = localStorage.getItem(RECENT_SPECIES_KEY);
    const list: RecentViewedSpeciesItem[] = raw ? JSON.parse(raw) : [];
    const next: RecentViewedSpeciesItem[] = [
      { ...item, viewedAt: Date.now() },
      ...list.filter((entry) => !(entry.id === item.id && entry.kind === item.kind)),
    ].slice(0, 10);
    localStorage.setItem(RECENT_SPECIES_KEY, JSON.stringify(next));
  } catch {}
}

interface MapSearchPlacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  memos: CommunityMemo[];
  specimens: Specimen[];
  userCenter: { lat: number; lng: number };
  bookmarkedPlaceIds: string[];
  onToggleBookmarkPlace: (placeId: string) => void;
  onSelectHotspot: (hotspot: BioBlitzCenter) => void;
  onOpenPlaceDetail: (hotspot: BioBlitzCenter) => void;
  onSelectMemo: (memo: CommunityMemo) => void;
  onSelectSpecimen: (specimen: Specimen) => void;
}

export const MapSearchPlacesModal: React.FC<MapSearchPlacesModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  memos,
  specimens,
  userCenter,
  bookmarkedPlaceIds,
  onToggleBookmarkPlace,
  onOpenPlaceDetail,
  onSelectMemo,
  onSelectSpecimen,
}) => {
  const [localTab, setLocalTab] = useState<'all' | 'places' | 'creatures'>('all');
  const [placesExpanded, setPlacesExpanded] = useState(false);
  const [creaturesExpanded, setCreaturesExpanded] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [recentSpecies, setRecentSpecies] = useState<RecentViewedSpeciesItem[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_SPECIES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!isOpen) return;
    setPlacesExpanded(false);
    setCreaturesExpanded(false);
    try {
      const rawS = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (rawS) setRecentSearches(JSON.parse(rawS));
      const rawV = localStorage.getItem(RECENT_SPECIES_KEY);
      if (rawV) setRecentSpecies(JSON.parse(rawV));
    } catch {}
  }, [isOpen]);

  const q = searchQuery.trim().toLowerCase();

  useEffect(() => {
    setPlacesExpanded(false);
    setCreaturesExpanded(false);
  }, [q, localTab]);

  const saveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((t) => t !== clean)].slice(0, 8);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const removeRecentSearch = (term: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((t) => t !== term);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  const clearAllRecentSpecies = () => {
    setRecentSpecies([]);
    try {
      localStorage.removeItem(RECENT_SPECIES_KEY);
    } catch {}
  };

  const allPlaces = useMemo(() => {
    const map = new Map<string, BioBlitzCenter>();
    BIOBLITZ_HOTSPOTS.forEach((h) => {
      map.set(h.name, h);
    });
    memos.forEach((m) => {
      if (!m.placeName) return;
      if (!map.has(m.placeName)) {
        map.set(m.placeName, {
          id: `memo-place-${m.id}`,
          name: m.placeName,
          habitatType: '탐사 관찰지',
          lat: m.lat,
          lng: m.lng,
          description: '탐험가들이 함께 방문하여 생태 관찰 기록을 남기는 공개 탐사 장소입니다.',
        });
      }
    });
    return Array.from(map.values());
  }, [memos]);

  const matchingPlaces = useMemo(() => {
    const list = !q
      ? allPlaces
      : allPlaces.filter(
          (h) =>
            h.name.toLowerCase().includes(q) ||
            h.description.toLowerCase().includes(q) ||
            h.habitatType.toLowerCase().includes(q)
        );
    return list.map((place) => {
      const count = memos.filter(
        (m) =>
          m.placeName === place.name ||
          m.placeName.includes(place.name.split(' ')[0]) ||
          haversineKm(place.lat, place.lng, m.lat, m.lng) <= 1.5
      ).length;
      const distKm = haversineKm(userCenter.lat, userCenter.lng, place.lat, place.lng);
      return { place, count, distKm };
    });
  }, [q, allPlaces, memos, userCenter]);

  const matchingMemos = useMemo(() => {
    if (!q) return memos.slice(0, 12);
    return memos.filter(
      (m) =>
        m.speciesKoreanName.toLowerCase().includes(q) ||
        m.speciesScientificName.toLowerCase().includes(q) ||
        m.placeName.toLowerCase().includes(q) ||
        m.memoText.toLowerCase().includes(q) ||
        m.authorName.toLowerCase().includes(q)
    );
  }, [memos, q]);

  const matchingSpecimens = useMemo(() => {
    const collected = specimens.filter((s) => s.isCollected && !s.isPending && !s.isDeleted);
    if (!q) return collected.slice(0, 12);
    return collected.filter(
      (s) =>
        s.koreanName.toLowerCase().includes(q) ||
        s.scientificName.toLowerCase().includes(q) ||
        (s.locationCoord?.name || '').toLowerCase().includes(q)
    );
  }, [specimens, q]);

  type CreatureResult =
    | { kind: 'memo'; key: string; memo: CommunityMemo }
    | { kind: 'specimen'; key: string; specimen: Specimen };

  const combinedCreatureResults: CreatureResult[] = useMemo(() => {
    const list: CreatureResult[] = [];
    matchingMemos.forEach((memo) => list.push({ kind: 'memo', key: `m-${memo.id}`, memo }));
    matchingSpecimens.forEach((specimen) =>
      list.push({ kind: 'specimen', key: `s-${specimen.id}`, specimen })
    );
    return list;
  }, [matchingMemos, matchingSpecimens]);

  if (!isOpen) return null;

  const totalResultsCount = matchingPlaces.length + combinedCreatureResults.length;
  const visiblePlacesInAll = matchingPlaces.slice(0, 3);
  const visibleCreaturesInAll = combinedCreatureResults.slice(0, 4);
  const visiblePlacesInTab = placesExpanded ? matchingPlaces : matchingPlaces.slice(0, 6);
  const visibleCreaturesInTab = creaturesExpanded
    ? combinedCreatureResults
    : combinedCreatureResults.slice(0, 6);

  const handleOpenMemoResult = (memo: CommunityMemo) => {
    if (searchQuery.trim()) saveRecentSearch(searchQuery);
    const viewed: Omit<RecentViewedSpeciesItem, 'viewedAt'> = {
      id: memo.id,
      kind: 'memo',
      name: memo.speciesKoreanName,
      scientificName: memo.speciesScientificName,
      subtitle: `${memo.placeName} · ${memo.authorName}`,
      photoUrl: memo.photoUrl,
    };
    recordRecentViewedSpecies(viewed);
    onSelectMemo(memo);
    onClose();
  };

  const handleOpenSpecimenResult = (sp: Specimen) => {
    if (searchQuery.trim()) saveRecentSearch(searchQuery);
    const thumb = sp.originalImage || sp.stickerImage || sp.observations?.[0]?.photoUrl || '';
    recordRecentViewedSpecies({
      id: sp.id,
      kind: 'specimen',
      name: sp.koreanName,
      scientificName: sp.scientificName,
      subtitle: `${sp.locationCoord?.name || sp.habitatType} · 내 도감`,
      photoUrl: thumb,
    });
    onSelectSpecimen(sp);
    onClose();
  };

  const handleOpenRecentViewed = (item: RecentViewedSpeciesItem) => {
    if (item.kind === 'memo') {
      const matchedMemo = memos.find((m) => m.id === item.id);
      if (matchedMemo) {
        handleOpenMemoResult(matchedMemo);
        return;
      }
    } else {
      const matchedSpecimen = specimens.find((s) => s.id === item.id);
      if (matchedSpecimen) {
        handleOpenSpecimenResult(matchedSpecimen);
        return;
      }
    }
    onSearchChange(item.name);
  };

  const renderPlaceRow = ({ place, count, distKm }: { place: BioBlitzCenter; count: number; distKm: number }) => {
    const isBookmarked = bookmarkedPlaceIds.includes(place.id);
    return (
      <div
        key={place.id}
        className="w-full p-3.5 rounded-[20px] bg-white border border-[#e6e9e5] hover:border-[#d2d7d1] flex items-center justify-between gap-2 transition-colors"
      >
        <button
          type="button"
          onClick={() => {
            if (searchQuery.trim()) saveRecentSearch(searchQuery);
            onClose();
            onOpenPlaceDetail(place);
          }}
          className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-[#f4f5f4] text-[#202320] flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-bold text-[#202320] truncate">{place.name}</div>
            <div className="text-xs text-[#8c948a] mt-0.5 tabular-nums">
              기록 {count}개 · {formatDistanceLabel(distKm)}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmarkPlace(place.id);
            }}
            aria-label={isBookmarked ? '장소 즐겨찾기 해제' : '장소 즐겨찾기 추가'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isBookmarked
                ? 'bg-[#202320] text-white'
                : 'bg-[#f4f5f4] text-[#8c948a] hover:text-[#202320]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (searchQuery.trim()) saveRecentSearch(searchQuery);
              onClose();
              onOpenPlaceDetail(place);
            }}
            aria-label={`${place.name} 상세 보기`}
            className="w-7 h-9 flex items-center justify-center text-[#8c948a] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderCreatureRow = (entry: CreatureResult) => {
    if (entry.kind === 'memo') {
      const memo = entry.memo;
      return (
        <button
          key={entry.key}
          type="button"
          onClick={() => handleOpenMemoResult(memo)}
          className="w-full p-3 rounded-[20px] border border-[#e6e9e5] bg-white hover:border-[#d2d7d1] flex items-center gap-3 text-left cursor-pointer"
        >
          {memo.photoUrl ? (
            <img
              src={memo.photoUrl}
              alt={memo.speciesKoreanName}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-2xl object-cover shrink-0 bg-[#f4f5f4]"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-[#f4f5f4] flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4 text-[#8c948a]" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[15px] font-bold text-[#202320]">{memo.speciesKoreanName}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#f4f5f4] text-[#626961] shrink-0">
                탐험맵 기록
              </span>
              {memo.isProtectedSpecies && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#f4fbdd] text-[#6d8911] shrink-0">
                  보호종
                </span>
              )}
            </div>
            <p className="text-xs text-[#626961] truncate mt-0.5">{memo.memoText}</p>
            <div className="text-[11px] text-[#8c948a] mt-0.5">
              {memo.authorName} · {memo.placeName}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8c948a] shrink-0" />
        </button>
      );
    }

    const sp = entry.specimen;
    const thumb = sp.originalImage || sp.stickerImage || sp.observations?.[0]?.photoUrl;
    return (
      <button
        key={entry.key}
        type="button"
        onClick={() => handleOpenSpecimenResult(sp)}
        className="w-full p-3 rounded-[20px] border border-[#e6e9e5] bg-white hover:border-[#d2d7d1] flex items-center gap-3 text-left cursor-pointer"
      >
        {thumb ? (
          <img
            src={thumb}
            alt={sp.koreanName}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-2xl object-cover shrink-0 bg-[#f4f5f4]"
          />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-[#f4f5f4] flex items-center justify-center shrink-0">
            <Camera className="w-4 h-4 text-[#8c948a]" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold text-[#202320]">{sp.koreanName}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#f4fbdd] text-[#6d8911] shrink-0">
              내 도감
            </span>
          </div>
          <div className="text-[11px] italic text-[#8c948a]">{sp.scientificName}</div>
          <div className="text-[11px] text-[#8c948a] truncate mt-0.5">
            {sp.locationCoord?.name || sp.habitatType}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#8c948a] shrink-0" />
      </button>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#fbfbfb] sm:bg-black/45 sm:backdrop-blur-xs p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="w-full h-full sm:h-auto sm:max-h-[86vh] sm:max-w-lg bg-[#fbfbfb] sm:rounded-[28px] shadow-2xl sm:border sm:border-[#e6e9e5] overflow-hidden flex flex-col"
        >
          {/* 61 Search Top Bar */}
          <div className="px-4 pt-3 pb-3 space-y-3 bg-[#fbfbfb] border-b border-[#e6e9e5]">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] flex items-center justify-center text-[#202320] shrink-0 cursor-pointer shadow-2xs"
                aria-label="뒤로"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) saveRecentSearch(searchQuery);
                }}
                className="flex-1 relative flex items-center"
              >
                <Search className="w-4 h-4 text-[#8c948a] absolute left-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="장소나 탐험맵 생물 이름으로 찾아보기"
                  className="w-full h-11 pl-10 pr-9 rounded-2xl bg-[#f4f5f4] text-[14px] text-[#202320] placeholder:text-[#8c948a] focus:outline-none focus:ring-2 focus:ring-black/15"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 p-1 text-[#8c948a] hover:text-[#202320] cursor-pointer"
                    aria-label="검색어 지우기"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>

            {/* 검색어 입력 시에만 분할 탭 표시 */}
            {q && (
              <div className="flex items-center gap-1.5 bg-[#f4f5f4] p-1 rounded-2xl">
                {[
                  { id: 'all' as const, label: `전체 ${totalResultsCount}` },
                  { id: 'places' as const, label: `장소 ${matchingPlaces.length}` },
                  { id: 'creatures' as const, label: `생물·기록 ${combinedCreatureResults.length}` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLocalTab(tab.id)}
                    className={`flex-1 py-1.5 rounded-xl text-xs transition-colors cursor-pointer tabular-nums ${
                      localTab === tab.id
                        ? 'bg-white text-[#202320] font-bold shadow-2xs'
                        : 'text-[#8c948a] font-semibold hover:text-[#202320]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto space-y-5 flex-1 scrollbar-none">
            {!q ? (
              /* 검색어 입력 전: 최근 검색어 -> 최근 본 생물 -> 추천 탐험 장소 */
              <>
                {/* 1. 최근 검색어 */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-bold text-[#202320] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#8c948a]" />
                      <span>최근 검색어</span>
                    </h4>
                    {recentSearches.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllRecentSearches}
                        className="text-[11px] font-semibold text-[#8c948a] hover:text-[#202320] cursor-pointer"
                      >
                        전체 삭제
                      </button>
                    )}
                  </div>

                  {recentSearches.length === 0 ? (
                    <p className="text-xs text-[#8c948a] py-2">최근 검색한 키워드가 없어요.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((term) => (
                        <div
                          key={term}
                          className="inline-flex items-center gap-1 pl-3 pr-2 py-1.5 rounded-full bg-white border border-[#e6e9e5] text-xs font-medium text-[#202320]"
                        >
                          <button
                            type="button"
                            onClick={() => onSearchChange(term)}
                            className="cursor-pointer hover:underline"
                          >
                            {term}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRecentSearch(term)}
                            aria-label={`${term} 삭제`}
                            className="text-[#8c948a] hover:text-[#202320] cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. 최근 본 생물 */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-bold text-[#202320]">최근 본 생물</h4>
                    {recentSpecies.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllRecentSpecies}
                        className="text-[11px] font-semibold text-[#8c948a] hover:text-[#202320] cursor-pointer"
                      >
                        전체 삭제
                      </button>
                    )}
                  </div>

                  {recentSpecies.length === 0 ? (
                    <p className="text-xs text-[#8c948a] py-2">
                      탐험맵에서 생물 핀이나 메모를 확인하면 여기에 모아 볼 수 있어요.
                    </p>
                  ) : (
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                      {recentSpecies.map((item) => (
                        <button
                          key={`${item.kind}-${item.id}`}
                          type="button"
                          onClick={() => handleOpenRecentViewed(item)}
                          className="w-[132px] shrink-0 p-2.5 rounded-[18px] bg-white border border-[#e6e9e5] hover:border-[#d2d7d1] text-left space-y-2 cursor-pointer transition-colors"
                        >
                          <div className="w-full h-20 rounded-xl overflow-hidden bg-[#f4f5f4] flex items-center justify-center">
                            {item.photoUrl ? (
                              <img
                                src={item.photoUrl}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Camera className="w-5 h-5 text-[#8c948a]" />
                            )}
                          </div>
                          <div>
                            <div className="text-[13px] font-bold text-[#202320] truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-[#8c948a] truncate mt-0.5">
                              {item.subtitle}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. 주변/등록 탐사 장소 미리보기 */}
                <div className="space-y-2.5 pt-2 border-t border-[#efefef]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-bold text-[#202320]">탐험맵 주요 장소</h4>
                    <span className="text-[11px] text-[#8c948a] tabular-nums">
                      총 {matchingPlaces.length}곳
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(placesExpanded ? matchingPlaces : matchingPlaces.slice(0, 4)).map(renderPlaceRow)}
                  </div>
                  {!placesExpanded && matchingPlaces.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setPlacesExpanded(true)}
                      className="w-full py-2.5 rounded-xl bg-white border border-[#e6e9e5] text-xs font-bold text-[#202320] hover:bg-[#f4f5f4] cursor-pointer"
                    >
                      등록된 장소 더보기 ({matchingPlaces.length - 4}곳)
                    </button>
                  )}
                </div>
              </>
            ) : localTab === 'all' ? (
              /* 검색 결과: 전체 탭 (장소 + 생물/기록 분할 미리보기 + 더보기 버튼) */
              totalResultsCount === 0 ? (
                <p className="text-center py-12 text-xs text-[#8c948a]">
                  &lsquo;{searchQuery.trim()}&rsquo;에 해당하는 장소나 생물 기록이 없어요.
                </p>
              ) : (
                <div className="space-y-5">
                  {matchingPlaces.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#626961] tabular-nums">
                          등록된 장소 {matchingPlaces.length}
                        </h4>
                      </div>
                      <div className="space-y-2">{visiblePlacesInAll.map(renderPlaceRow)}</div>
                      {matchingPlaces.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setLocalTab('places')}
                          className="w-full py-2.5 rounded-xl bg-white border border-[#e6e9e5] text-xs font-bold text-[#202320] hover:bg-[#f4f5f4] cursor-pointer"
                        >
                          장소 결과 더보기 ({matchingPlaces.length}곳)
                        </button>
                      )}
                    </div>
                  )}

                  {combinedCreatureResults.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#626961] tabular-nums">
                          탐험맵 생물·기록 {combinedCreatureResults.length}
                        </h4>
                      </div>
                      <div className="space-y-2">{visibleCreaturesInAll.map(renderCreatureRow)}</div>
                      {combinedCreatureResults.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setLocalTab('creatures')}
                          className="w-full py-2.5 rounded-xl bg-white border border-[#e6e9e5] text-xs font-bold text-[#202320] hover:bg-[#f4f5f4] cursor-pointer"
                        >
                          생물·기록 결과 더보기 ({combinedCreatureResults.length}개)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            ) : localTab === 'places' ? (
              /* 분할 탭 1: 장소 */
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#626961] tabular-nums">
                  등록된 장소 {matchingPlaces.length}곳
                </p>
                {matchingPlaces.length === 0 ? (
                  <p className="text-center py-8 text-xs text-[#8c948a]">일치하는 탐사 장소가 없습니다.</p>
                ) : (
                  <>
                    <div className="space-y-2.5">{visiblePlacesInTab.map(renderPlaceRow)}</div>
                    {!placesExpanded && matchingPlaces.length > 6 && (
                      <button
                        type="button"
                        onClick={() => setPlacesExpanded(true)}
                        className="w-full py-3 rounded-xl bg-white border border-[#e6e9e5] text-xs font-bold text-[#202320] hover:bg-[#f4f5f4] cursor-pointer"
                      >
                        장소 더보기 (+{matchingPlaces.length - 6}곳)
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* 분할 탭 2: 탐험맵 기록 생명체 */
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#626961] tabular-nums">
                  탐험맵 생물·기록 {combinedCreatureResults.length}개
                </p>
                {combinedCreatureResults.length === 0 ? (
                  <p className="text-center py-8 text-xs text-[#8c948a]">
                    일치하는 생물 또는 탐사 기록이 없습니다.
                  </p>
                ) : (
                  <>
                    <div className="space-y-2.5">{visibleCreaturesInTab.map(renderCreatureRow)}</div>
                    {!creaturesExpanded && combinedCreatureResults.length > 6 && (
                      <button
                        type="button"
                        onClick={() => setCreaturesExpanded(true)}
                        className="w-full py-3 rounded-xl bg-white border border-[#e6e9e5] text-xs font-bold text-[#202320] hover:bg-[#f4f5f4] cursor-pointer"
                      >
                        생물·기록 더보기 (+{combinedCreatureResults.length - 6}개)
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* ============================================================================
   타인 도감 데이터 보기 모달 (열람 전용 · 생태/분류/관찰 기록)
   ============================================================================ */
export interface PublicSpecimenDataModalProps {
  entry: PublicSpecimenEntry | null;
  onClose: () => void;
  hasOwnCollectedSpecimen?: boolean;
  onOpenOwnSpecimen?: (speciesName: string) => void;
  onOpenAuthorProfile?: (authorId: string) => void;
}

export const PublicSpecimenDataModal: React.FC<PublicSpecimenDataModalProps> = ({
  entry,
  onClose,
  hasOwnCollectedSpecimen = false,
  onOpenOwnSpecimen,
  onOpenAuthorProfile,
}) => {
  const matchedCatalog = useMemo(() => {
    if (!entry) return { ecology: undefined, baseSpecimen: undefined };
    const ecology = SPECIES_ECOLOGY_ENCYCLOPEDIA.find(
      (e) =>
        e.koreanName === entry.speciesKoreanName ||
        e.scientificName.toLowerCase() === entry.speciesScientificName.toLowerCase()
    );
    const baseSpecimen = INITIAL_SPECIMENS.find(
      (s) =>
        s.koreanName === entry.speciesKoreanName ||
        s.scientificName.toLowerCase() === entry.speciesScientificName.toLowerCase()
    );
    return { ecology, baseSpecimen };
  }, [entry]);

  if (!entry) return null;

  const { ecology, baseSpecimen } = matchedCatalog;
  const taxonomyChips =
    baseSpecimen?.taxonomyPath && baseSpecimen.taxonomyPath.length > 0
      ? baseSpecimen.taxonomyPath
      : [
          getSpeciesTaxonomyCategoryLabel(entry.category),
          ecology?.order?.split('(')[0]?.trim() || '',
          entry.speciesKoreanName,
        ].filter(Boolean);
  const displayTraits =
    entry.traitChips && entry.traitChips.length > 0
      ? entry.traitChips
      : ecology?.tags || baseSpecimen?.traitChips || [];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-[#fbfbfb] sm:rounded-[28px] shadow-2xl sm:border sm:border-[#e6e9e5] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-4 pt-3 pb-3 border-b border-[#efefef] bg-white flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#f4f5f4] hover:bg-[#e6e9e5] flex items-center justify-center text-[#202320] cursor-pointer"
              aria-label="뒤로"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5">
              <h3 className="text-[16px] font-bold text-[#202320]">탐험가 도감 데이터</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#f4f5f4] text-[#626961] text-[10px] font-bold">
                열람 전용
              </span>
            </div>
            <div className="w-10" />
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-none pb-8">
            {/* Hero Photo */}
            <div className="relative h-56 bg-[#e6e9e5] overflow-hidden">
              {entry.photoUrl ? (
                <img
                  src={entry.photoUrl}
                  alt={entry.speciesKoreanName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#8c948a]">
                  <Camera className="w-10 h-10" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2 text-white">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-xs">
                      {getSpeciesTaxonomyCategoryLabel(entry.category)}
                    </span>
                    {entry.isProtectedSpecies && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#c4eb43] text-[#202320]">
                        보호종
                      </span>
                    )}
                  </div>
                  <h4 className="text-[22px] font-bold leading-tight mt-1 truncate">
                    {entry.speciesKoreanName}
                  </h4>
                  <p className="text-xs text-white/80 italic truncate">{entry.speciesScientificName}</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Author Strip */}
              <button
                type="button"
                onClick={() => {
                  if (onOpenAuthorProfile) {
                    onClose();
                    onOpenAuthorProfile(entry.authorId);
                  }
                }}
                className="w-full p-3.5 rounded-[20px] bg-white border border-[#e6e9e5] flex items-center justify-between text-left hover:bg-[#f4f5f4]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#fdf6dc] border border-[#f0e6c2] flex items-center justify-center text-lg shrink-0">
                    {entry.authorEmoji}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold text-[#202320] truncate">
                      {entry.authorName}의 도감 기록
                    </div>
                    <div className="text-xs text-[#8c948a] truncate">
                      {entry.authorTitle} · {entry.observedDate}
                    </div>
                  </div>
                </div>
                {onOpenAuthorProfile && <ChevronRight className="w-4 h-4 text-[#8c948a] shrink-0" />}
              </button>

              {/* Author's Observation Data Card */}
              <div className="bg-white rounded-[20px] border border-[#e6e9e5] p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#6d8911]">
                  <Compass className="w-3.5 h-3.5" />
                  <span>현장 관찰 데이터</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#fbfbfb] border border-[#efefef]">
                    <span className="text-[11px] text-[#8c948a] block">관찰 권역</span>
                    <span className="font-bold text-[#202320] mt-0.5 block truncate">{entry.regionLabel}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#fbfbfb] border border-[#efefef]">
                    <span className="text-[11px] text-[#8c948a] block">서식 환경</span>
                    <span className="font-bold text-[#202320] mt-0.5 block truncate">{entry.habitatType}</span>
                  </div>
                  {(entry.weather || entry.temperature) && (
                    <div className="col-span-2 p-2.5 rounded-xl bg-[#fbfbfb] border border-[#efefef] flex items-center gap-2">
                      <CloudSun className="w-3.5 h-3.5 text-[#626961] shrink-0" />
                      <span className="text-[11px] text-[#8c948a]">관찰 당시 기상</span>
                      <span className="font-bold text-[#202320] ml-auto">
                        {[entry.weather, entry.temperature].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-[#fbfbfb] border border-[#efefef]">
                  <span className="text-[11px] font-semibold text-[#8c948a] block mb-1">관찰 노트</span>
                  <p className="text-[13px] text-[#202320] leading-relaxed">{entry.fieldNote}</p>
                </div>

                {displayTraits.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {displayTraits.map((chip) => (
                      <span
                        key={chip}
                        className="px-2.5 py-1 rounded-lg bg-[#f4f5f4] text-[#454a44] text-[11px] font-semibold"
                      >
                        #{chip}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Taxonomy & Ecology Card */}
              <div className="bg-white rounded-[20px] border border-[#e6e9e5] p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#202320]">
                  <BookOpen className="w-3.5 h-3.5 text-[#6d8911]" />
                  <span>생물 분류 · 생태 백과 데이터</span>
                </div>

                <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#626961] bg-[#fbfbfb] px-3 py-2 rounded-xl border border-[#efefef]">
                  {taxonomyChips.map((step, idx) => (
                    <React.Fragment key={`${step}-${idx}`}>
                      {idx > 0 && <span className="text-[#b8beb6]">›</span>}
                      <span className={idx === taxonomyChips.length - 1 ? 'font-bold text-[#202320]' : ''}>
                        {step}
                      </span>
                    </React.Fragment>
                  ))}
                </div>

                {ecology || baseSpecimen?.wikiSummary ? (
                  <div className="space-y-2.5 text-[13px] leading-relaxed text-[#3a3f39]">
                    {ecology?.status && (
                      <div className="px-3 py-2 rounded-xl bg-[#f4fbdd] border border-[#d9f08a] text-xs font-semibold text-[#4e640a]">
                        {ecology.status}
                      </div>
                    )}
                    {baseSpecimen?.wikiSummary && <p>{baseSpecimen.wikiSummary}</p>}
                    {ecology?.keyIdentification && (
                      <div className="pt-1">
                        <span className="text-[11px] font-bold text-[#8c948a] block mb-0.5">생김새 · 식별 특징</span>
                        <p className="text-[12.5px]">{ecology.keyIdentification}</p>
                      </div>
                    )}
                    {ecology?.dietAndBehavior && (
                      <div className="pt-1">
                        <span className="text-[11px] font-bold text-[#8c948a] block mb-0.5">생태 · 행동</span>
                        <p className="text-[12.5px]">{ecology.dietAndBehavior}</p>
                      </div>
                    )}
                    {ecology?.habitat && (
                      <div className="pt-1">
                        <span className="text-[11px] font-bold text-[#8c948a] block mb-0.5">주요 서식지 · 관찰 시기</span>
                        <p className="text-[12.5px]">
                          {ecology.habitat}
                          {ecology.seasonality ? ` · ${ecology.seasonality}` : ''}
                        </p>
                      </div>
                    )}
                    {ecology?.lynxBirdLifeNote && (
                      <p className="text-[11px] text-[#8c948a] pt-1 border-t border-[#f4f5f4]">
                        {ecology.lynxBirdLifeNote}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#626961] leading-relaxed">
                    {entry.authorName}님이 현장에서 직접 관찰해 기록한 {entry.speciesKoreanName}({entry.speciesScientificName}) 도감 데이터예요.
                  </p>
                )}
              </div>

              {/* Own Collection Status Footer */}
              {hasOwnCollectedSpecimen && onOpenOwnSpecimen ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenOwnSpecimen(entry.speciesKoreanName);
                  }}
                  className="w-full h-11 rounded-2xl bg-black hover:bg-[#202320] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>내가 수집한 도감도 바로 열기</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#f4f5f4] text-center text-xs text-[#626961]">
                  아직 내 도감에는 없는 생물이에요 · 직접 촬영하면 내 도감 슬롯에 소장할 수 있어요.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* ============================================================================
   62 / Ⓘ-3 메모 상세 · 댓글 · 신고/차단 모달
   ============================================================================ */
interface MemoDetailModalProps {
  memo: CommunityMemo | null;
  allMemos?: CommunityMemo[];
  onClose: () => void;
  userAccount?: UserAccount;
  onOpenLoginModal?: () => void;
  isBookmarked: boolean;
  bookmarkedPlaceIds?: string[];
  hideProtectedLocations: boolean;
  onToggleLike: (memoId: string) => void;
  onToggleBookmark: (memoId: string) => void;
  onToggleBookmarkPlace?: (placeId: string) => void;
  onOpenPlaceDetail?: (place: BioBlitzCenter) => void;
  onAddComment: (memoId: string, content: string) => void;
  onOpenAuthorProfile: (authorId: string) => void;
  onReportMemo: (memoId: string, reason: MemoReportReason) => void;
  onBlockUser: (authorId: string, authorName: string) => void;
  onDeleteOwnMemo?: (memoId: string) => void;
  hasOwnCollectedSpecimen?: boolean;
  onOpenSpecimenBySpecies?: (speciesName: string, specimenId?: string) => void;
  onOpenPublicSpecimenData?: (entry: PublicSpecimenEntry) => void;
  onShowToast?: (msg: string) => void;
}

export const MemoDetailModal: React.FC<MemoDetailModalProps> = ({
  memo,
  allMemos = [],
  onClose,
  userAccount,
  onOpenLoginModal,
  isBookmarked,
  bookmarkedPlaceIds = [],
  hideProtectedLocations,
  onToggleLike,
  onToggleBookmark,
  onToggleBookmarkPlace,
  onOpenPlaceDetail,
  onAddComment,
  onOpenAuthorProfile,
  onReportMemo,
  onBlockUser,
  onDeleteOwnMemo,
  hasOwnCollectedSpecimen = false,
  onOpenSpecimenBySpecies,
  onOpenPublicSpecimenData,
  onShowToast,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<MemoReportReason>('스팸 · 광고');
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [isExportingShareCard, setIsExportingShareCard] = useState(false);

  useEffect(() => {
    setIsShareSheetOpen(false);
  }, [memo?.id]);

  const extractedHashtags = useMemo(() => {
    if (!memo) return [];
    const hashMatches = memo.memoText.match(/#[가-힣a-zA-Z0-9_]+/g) || [];
    const baseTags = [
      `#${getSpeciesTaxonomyCategoryLabel(memo.category)}`,
      `#${memo.placeName.split(' ')[0]}`,
      memo.isProtectedSpecies ? '#보호종안전기록' : '#야외관찰',
    ];
    return Array.from(new Set([...hashMatches, ...baseTags])).slice(0, 5);
  }, [memo]);

  if (!memo) return null;

  const { showCommunity, showShare } = getUnder14DesignFlags(userAccount);
  const isOwnMemo = memo.authorId === 'me';
  const isLoggedIn = !!userAccount?.isLoggedIn;
  const safeShareAreaLabel = memo.isProtectedSpecies
    ? memo.regionLabel
    : memo.regionLabel || `${memo.placeName.split(' ').slice(0, 2).join(' ')} 일대`;

  const visibilityText =
    memo.visibility === 'private'
      ? '나만 보기'
      : memo.visibility === 'nearby'
      ? '주변 탐험가'
      : '전체';

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCommunity) return;
    if (!isLoggedIn) {
      onOpenLoginModal?.();
      return;
    }
    const trimmed = commentText.trim();
    if (!trimmed) return;
    onAddComment(memo.id, trimmed);
    setCommentText('');
  };

  const handleShareMemoLink = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://moalog.app';
    const title = `[모아로그 탐험 메모] ${safeShareAreaLabel}에서 만난 ${memo.speciesKoreanName}`;
    const body = `${title}\n"${memo.memoText}"\n\n모아로그 탐험맵에서 우리 동네 자연 기록을 함께 확인해 보세요!\n${shareUrl}`;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: body, url: shareUrl });
        return;
      } catch {
        // User cancelled or share unsupported, fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(body);
      onShowToast?.('탐험 메모 공유 문구와 링크를 복사했어요.');
    } catch {
      onShowToast?.('탐험 메모 공유 준비가 완료되었어요.');
    }
  };

  const handleDownloadShareCard = async () => {
    setIsExportingShareCard(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 1160;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#fbfbfb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer Card Container
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e6e9e5';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(40, 40, 820, 1080, 44);
      ctx.fill();
      ctx.stroke();

      // Photo Area
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(72, 72, 756, 520, 32);
      ctx.clip();
      ctx.fillStyle = '#eef2ea';
      ctx.fillRect(72, 72, 756, 520);

      if (memo.photoUrl) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const scale = Math.max(756 / img.width, 520 / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = 72 + (756 - w) / 2;
            const y = 72 + (520 - h) / 2;
            ctx.drawImage(img, x, y, w, h);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = memo.photoUrl;
        });
      }
      ctx.restore();

      // Privacy Pill over photo
      ctx.fillStyle = 'rgba(32, 35, 32, 0.78)';
      ctx.beginPath();
      ctx.roundRect(96, 528, 320, 44, 22);
      ctx.fill();
      ctx.fillStyle = '#c4eb43';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('● 위치 보호 · EXIF 제거됨', 118, 557);

      // Area Chip
      ctx.fillStyle = '#f4fbdd';
      ctx.beginPath();
      ctx.roundRect(72, 628, Math.min(756, safeShareAreaLabel.length * 24 + 80), 46, 23);
      ctx.fill();
      ctx.fillStyle = '#536b0a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`📍 ${safeShareAreaLabel}`, 94, 659);

      // Species Title
      ctx.fillStyle = '#202320';
      ctx.font = 'bold 48px sans-serif';
      ctx.fillText(memo.speciesKoreanName, 72, 738);

      ctx.fillStyle = '#8c948a';
      ctx.font = 'italic 24px sans-serif';
      ctx.fillText(`${memo.speciesScientificName} · ${getSpeciesTaxonomyCategoryLabel(memo.category)}`, 72, 778);

      // Memo Quote Wrapping
      ctx.fillStyle = '#2c302b';
      ctx.font = '28px sans-serif';
      const words = memo.memoText.split('');
      let line = '';
      let yPos = 842;
      const maxWidth = 756;
      let lineCount = 0;
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i];
        if (ctx.measureText(testLine).width > maxWidth || words[i] === '\n') {
          ctx.fillText(line.trim(), 72, yPos);
          line = words[i] === '\n' ? '' : words[i];
          yPos += 42;
          lineCount++;
          if (lineCount >= 4) break;
        } else {
          line = testLine;
        }
      }
      if (lineCount < 4 && line.trim()) {
        ctx.fillText(line.trim(), 72, yPos);
      }

      // Footer Invite Banner
      ctx.fillStyle = '#f4f5f4';
      ctx.beginPath();
      ctx.roundRect(72, 1004, 756, 84, 24);
      ctx.fill();
      ctx.fillStyle = '#202320';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('모아로그(Moalog) 탐험맵', 100, 1044);
      ctx.fillStyle = '#626961';
      ctx.font = '20px sans-serif';
      ctx.fillText('우리 동네 자연 기록과 생물 도감을 함께 채워보세요', 100, 1074);

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `moalog-memo-${memo.speciesKoreanName}.png`;
      a.click();
      onShowToast?.('위치 보호가 적용된 탐험 메모 카드를 저장했어요.');
    } catch {
      onShowToast?.('공유 카드 이미지를 만드는 중 문제가 발생했어요.');
    } finally {
      setIsExportingShareCard(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-white sm:bg-black/50 sm:backdrop-blur-xs p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-white sm:rounded-[28px] shadow-2xl sm:border sm:border-[#e6e9e5] overflow-hidden flex flex-col relative"
        >
          {/* 15 / 62 Header */}
          <div className="px-4 pt-3 pb-2.5 flex items-center justify-between gap-2 shrink-0 bg-white relative">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-[#efefef] shadow-2xs hover:bg-[#f4f5f4] flex items-center justify-center text-[#202320] cursor-pointer"
              aria-label="뒤로"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <h3 className="text-[16px] font-bold text-[#202320]">기록</h3>

            <div className="flex items-center gap-1.5 relative">
              {showShare && (
                <button
                  type="button"
                  onClick={() => setIsShareSheetOpen(true)}
                  className="w-10 h-10 rounded-full bg-white border border-[#efefef] shadow-2xs hover:bg-[#f4f5f4] flex items-center justify-center text-[#202320] cursor-pointer"
                  aria-label="탐험 메모 공유"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-10 rounded-full bg-white border border-[#efefef] shadow-2xs hover:bg-[#f4f5f4] flex items-center justify-center text-[#202320] cursor-pointer"
                aria-label="더보기"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute right-0 top-11 z-20 w-44 bg-white rounded-2xl border border-[#e6e9e5] shadow-xl py-1.5 text-xs">
                    {!isOwnMemo ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsReportPanelOpen(true);
                          }}
                          className="w-full px-3.5 py-2.5 text-left font-semibold text-[#202320] hover:bg-[#f4f5f4] flex items-center gap-2 cursor-pointer"
                        >
                          <Flag className="w-3.5 h-3.5 text-[#ff5100]" />
                          <span>메모 신고하기</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onBlockUser(memo.authorId, memo.authorName);
                            onClose();
                          }}
                          className="w-full px-3.5 py-2.5 text-left font-semibold text-[#ff5100] hover:bg-[#fff1eb] flex items-center gap-2 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>작성자 차단</span>
                        </button>
                      </>
                    ) : (
                      onDeleteOwnMemo && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onDeleteOwnMemo(memo.id);
                            onClose();
                          }}
                          className="w-full px-3.5 py-2.5 text-left font-semibold text-[#ff5100] hover:bg-[#fff1eb] flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>내 메모 삭제</span>
                        </button>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto flex-1 scrollbar-none">
            {/* Report Drawer */}
            {isReportPanelOpen && !isOwnMemo && (
              <div className="m-4 p-4 rounded-2xl bg-[#fff4ef] border border-[#ff5100]/25 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#202320] flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-[#ff5100]" />
                    안전 신고 및 사용자 차단
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsReportPanelOpen(false)}
                    className="text-xs text-[#626961] hover:underline cursor-pointer"
                  >
                    닫기
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setSelectedReason(reason)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border text-left cursor-pointer ${
                        selectedReason === reason
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-[#202320] border-[#e6e9e5]'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onReportMemo(memo.id, selectedReason);
                      setIsReportPanelOpen(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#ff5100] text-white text-xs font-bold cursor-pointer"
                  >
                    이 메모 신고하기
                  </button>
                </div>
              </div>
            )}

            {/* 4:3 Photo */}
            <div className="relative bg-[#f4f5f4] aspect-[4/3] w-full overflow-hidden">
              {memo.photoUrl ? (
                <img
                  src={memo.photoUrl}
                  alt={memo.speciesKoreanName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-10 h-10 text-[#8c948a]" />
                </div>
              )}
              <div className="absolute bottom-3 left-3">
                <span className="px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#c4eb43]" />
                  {memo.isProtectedSpecies
                    ? '보호종 위치 보호 · 광역 권역 표시'
                    : '안전 반경 표시 · EXIF 제거됨'}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-5">
              {/* Species Title + Grade Hex */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-[22px] font-bold text-[#202320] leading-tight">
                      {memo.speciesKoreanName}
                    </h4>
                    <span className="w-6 h-6 rounded-md bg-gradient-to-br from-[#52b8ff] to-[#2563eb] text-white text-[11px] font-black flex items-center justify-center shadow-2xs shrink-0">
                      S
                    </span>
                    {memo.isProtectedSpecies && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f4fbdd] text-[#6d8911] border border-[#c4eb43]">
                        보호종
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8c948a] mt-1">
                    <span className="italic">{memo.speciesScientificName}</span> ·{' '}
                    {getSpeciesTaxonomyCategoryLabel(memo.category)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!isOwnMemo && onOpenPublicSpecimenData && (
                    <button
                      type="button"
                      onClick={() => {
                        const matchedPublic = EXPLORER_PUBLIC_SPECIMENS.find(
                          (e) =>
                            e.authorId === memo.authorId &&
                            e.speciesKoreanName === memo.speciesKoreanName
                        );
                        onOpenPublicSpecimenData(
                          matchedPublic || {
                            id: `pub-memo-${memo.id}`,
                            authorId: memo.authorId,
                            authorName: memo.authorName,
                            authorTitle: memo.authorTitle,
                            authorEmoji: memo.authorEmoji,
                            speciesKoreanName: memo.speciesKoreanName,
                            speciesScientificName: memo.speciesScientificName,
                            category: memo.category,
                            photoUrl: memo.photoUrl,
                            observedDate: memo.createdAt,
                            regionLabel: memo.isProtectedSpecies
                              ? memo.regionLabel
                              : memo.placeName || memo.regionLabel,
                            habitatType: memo.regionLabel || '자연 서식지',
                            fieldNote: memo.memoText,
                            traitChips: extractedHashtags.map((t) => t.replace(/^#/, '')),
                            isProtectedSpecies: memo.isProtectedSpecies,
                          }
                        );
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#f4fbdd] hover:bg-[#e6f7b0] border border-[#c4eb43] text-[#3f5306] text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>도감 데이터</span>
                    </button>
                  )}
                  {hasOwnCollectedSpecimen && onOpenSpecimenBySpecies && (
                    <button
                      type="button"
                      onClick={() => onOpenSpecimenBySpecies(memo.speciesKoreanName, memo.specimenId)}
                      className="px-3 py-1.5 rounded-xl bg-[#f4f5f4] hover:bg-[#e6e9e5] text-[#202320] text-xs font-bold cursor-pointer"
                    >
                      내 도감
                    </button>
                  )}
                </div>
              </div>

              {/* Author Card (62) */}
              <button
                type="button"
                onClick={() => onOpenAuthorProfile(memo.authorId)}
                className="w-full p-3.5 rounded-[20px] bg-[#fbfbfb] border border-[#e6e9e5] flex items-center justify-between text-left hover:bg-[#f4f5f4]/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#e6e9e5] flex items-center justify-center text-lg shrink-0">
                    {memo.authorEmoji}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[14px] font-bold text-[#202320] block truncate">
                      {memo.authorName}
                    </span>
                    <span className="text-xs text-[#8c948a] block truncate">
                      공개 범위 {visibilityText} · {memo.createdAt}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8c948a] shrink-0" />
              </button>

              {/* Memo Body */}
              <p className="text-[15px] leading-relaxed text-[#202320] whitespace-pre-line">
                {memo.memoText}
              </p>

              {/* Hashtag Chips */}
              <div className="flex flex-wrap gap-1.5">
                {extractedHashtags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-full bg-[#fbfbfb] border border-[#e6e9e5] text-xs font-semibold text-[#626961]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Approximate Location / Place Card with direct Place Favorite */}
              {(() => {
                const isProtectedHidden = memo.isProtectedSpecies && hideProtectedLocations;
                const resolvedPlace = resolveMemoPlace(memo, allMemos);
                const isPlaceBookmarked = bookmarkedPlaceIds.includes(resolvedPlace.id);
                return (
                  <div className="bg-[#fbfbfb] rounded-[20px] border border-[#e6e9e5] p-3 flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isProtectedHidden || !onOpenPlaceDetail}
                      onClick={() => {
                        if (!isProtectedHidden && onOpenPlaceDetail) {
                          onClose();
                          onOpenPlaceDetail(resolvedPlace);
                        }
                      }}
                      className={`flex items-center gap-3 min-w-0 flex-1 text-left ${
                        !isProtectedHidden && onOpenPlaceDetail ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#eef5df] via-[#e2edcf] to-[#d6e6bc] border border-[#dce8c7] flex items-center justify-center shrink-0">
                        <div className="w-9 h-9 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6] flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-[14px] font-bold text-[#202320] truncate">
                          {isProtectedHidden ? memo.regionLabel : memo.placeName}
                        </h5>
                        <p className="text-xs text-[#8c948a] mt-0.5 truncate">
                          {isProtectedHidden
                            ? '보호종 서식지 보호를 위해 광역 권역만 표시돼요'
                            : '탐사지 정보 보기 · 반경 300m 대략 위치'}
                        </p>
                      </div>
                    </button>
                    {!isProtectedHidden && onToggleBookmarkPlace && (
                      <button
                        type="button"
                        onClick={() => onToggleBookmarkPlace(resolvedPlace.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
                          isPlaceBookmarked
                            ? 'bg-[#f4fbdd] border-[#c4eb43] text-[#6d8911]'
                            : 'bg-white border-[#e6e9e5] text-[#202320] hover:bg-[#f4f5f4]'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isPlaceBookmarked ? 'fill-current' : ''}`} />
                        <span>{isPlaceBookmarked ? '찜됨' : '탐사지 찜'}</span>
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Comments Thread */}
              <div className="space-y-3 pt-2 border-t border-[#f4f5f4]">
                <h5 className="text-xs font-bold text-[#8c948a]">탐험가 댓글 {memo.comments.length}</h5>
                {memo.comments.length === 0 ? (
                  <p className="text-xs text-[#8c948a] py-1">
                    {showCommunity ? '첫 번째 관찰 응원 댓글을 남겨보세요.' : '아직 등록된 댓글이 없습니다.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {memo.comments.map((cmt) => (
                      <div
                        key={cmt.id}
                        className="p-3 rounded-2xl bg-[#fbfbfb] border border-[#e6e9e5] flex items-start gap-2.5"
                      >
                        <button
                          type="button"
                          onClick={() => onOpenAuthorProfile(cmt.authorId)}
                          className="w-7 h-7 rounded-full bg-white border border-[#e6e9e5] flex items-center justify-center text-sm shrink-0 cursor-pointer"
                        >
                          {cmt.authorEmoji}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenAuthorProfile(cmt.authorId)}
                              className="text-xs font-bold text-[#202320] hover:underline cursor-pointer"
                            >
                              {cmt.authorName}
                            </button>
                            <span className="text-[10px] text-[#8c948a]">{cmt.createdAt}</span>
                          </div>
                          <p className="text-xs text-[#555c54] mt-0.5 leading-relaxed">{cmt.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Footer: Comment Composer + Bottom Reaction Bar (62) */}
          <div className="border-t border-[#e6e9e5] bg-white shrink-0">
            {showCommunity && (
              <form onSubmit={handleSubmitComment} className="px-4 pt-2.5 pb-1.5">
                {isLoggedIn ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="관찰 응원 댓글 남기기 (개인정보 입력 금지)"
                      maxLength={180}
                      className="flex-1 h-9 px-3.5 rounded-full bg-[#f4f5f4] text-xs text-[#202320] placeholder:text-[#8c948a] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="w-9 h-9 rounded-full bg-black disabled:bg-[#d2d7d1] text-white flex items-center justify-center cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 py-0.5">
                    <span className="text-xs text-[#8c948a]">로그인하면 댓글을 쓸 수 있어요.</span>
                    <button
                      type="button"
                      onClick={onOpenLoginModal}
                      className="px-3 py-1 rounded-full bg-black text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <LogIn className="w-3 h-3" />
                      <span>로그인</span>
                    </button>
                  </div>
                )}
              </form>
            )}

            <div className="px-4 py-2.5 flex items-center gap-5 text-xs font-semibold text-[#626961]">
              {showCommunity && (
                <button
                  type="button"
                  onClick={() => {
                    if (!isLoggedIn) {
                      onOpenLoginModal?.();
                      return;
                    }
                    onToggleLike(memo.id);
                  }}
                  className={`flex items-center gap-1.5 cursor-pointer tabular-nums ${
                    memo.likedByMe ? 'text-[#ff5100] font-bold' : 'text-[#626961] hover:text-[#202320]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${memo.likedByMe ? 'fill-[#ff5100] text-[#ff5100]' : ''}`} />
                  <span>{memo.likesCount}</span>
                </button>
              )}

              <span className="flex items-center gap-1.5 tabular-nums">
                <MessageCircle className="w-4 h-4" />
                <span>{memo.comments.length}</span>
              </span>

              <button
                type="button"
                onClick={() => onToggleBookmark(memo.id)}
                className={`flex items-center gap-1.5 cursor-pointer ${
                  isBookmarked ? 'text-[#6d8911] font-bold' : 'text-[#626961] hover:text-[#202320]'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                <span>{isBookmarked ? '메모 저장됨' : '메모 저장'}</span>
              </button>

              {showShare && (
                <button
                  type="button"
                  onClick={() => setIsShareSheetOpen(true)}
                  className="ml-auto flex items-center gap-1.5 text-[#202320] hover:text-[#6d8911] cursor-pointer font-bold"
                >
                  <Share2 className="w-4 h-4" />
                  <span>메모 공유</span>
                </button>
              )}
            </div>
          </div>

          {/* 탐험 메모 공유 프리뷰 바텀시트 */}
          {isShareSheetOpen && (
            <div
              className="absolute inset-0 z-30 bg-black/45 backdrop-blur-xs flex items-end justify-center p-0 sm:p-4"
              onClick={() => setIsShareSheetOpen(false)}
            >
              <motion.div
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 28, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-white rounded-t-[28px] sm:rounded-[28px] p-5 space-y-4 shadow-2xl border border-[#e6e9e5]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[17px] font-bold text-[#202320]">탐험 메모 공유하기</h4>
                    <p className="text-xs text-[#8c948a] mt-0.5">
                      정확한 좌표는 빼고 대략적인 구역명만 담아 안전하게 공유해요.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsShareSheetOpen(false)}
                    className="w-8 h-8 rounded-full bg-[#f4f5f4] flex items-center justify-center text-[#202320] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 공유 카드 미리보기 */}
                <div className="rounded-[22px] border border-[#e6e9e5] bg-[#fbfbfb] overflow-hidden shadow-2xs">
                  {memo.photoUrl && (
                    <div className="relative h-40 bg-[#f4f5f4] overflow-hidden">
                      <img
                        src={memo.photoUrl}
                        alt={memo.speciesKoreanName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/65 text-white text-[10px] font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#c4eb43]" />
                        위치 보호 · EXIF 제거됨
                      </span>
                    </div>
                  )}
                  <div className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f4fbdd] text-[#5c740d] text-[11px] font-bold">
                        <MapPin className="w-3 h-3" />
                        {safeShareAreaLabel}
                      </span>
                      <span className="text-[11px] text-[#8c948a]">{memo.authorName}</span>
                    </div>
                    <div>
                      <div className="text-[16px] font-bold text-[#202320]">
                        {memo.speciesKoreanName}
                      </div>
                      <p className="text-xs text-[#555c54] line-clamp-2 mt-1 leading-relaxed">
                        {memo.memoText}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-[#efefef] flex items-center justify-between text-[11px] text-[#8c948a]">
                      <span className="font-bold text-[#202320]">모아로그(Moalog) 탐험맵</span>
                      <span>주변 자연 기록 함께 보기</span>
                    </div>
                  </div>
                </div>

                {/* 공유 버튼 */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadShareCard}
                    disabled={isExportingShareCard}
                    className="h-12 rounded-2xl bg-[#f4f5f4] hover:bg-[#e6e9e5] text-[#202320] text-[13px] font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExportingShareCard ? '생성 중...' : '카드 이미지 저장'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareMemoLink}
                    className="h-12 rounded-2xl bg-[#202320] hover:bg-black text-white text-[13px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>링크 · 문구 공유</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* ============================================================================
   15 / Ⓘ-4 메모 쓰기 모달
   ============================================================================ */
interface WriteMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  specimens: Specimen[];
  initialSpecimenId?: string | null;
  currentCenter: BioBlitzCenter;
  userAccount?: UserAccount;
  userStats?: UserStats;
  onOpenLoginModal?: () => void;
  onSubmitMemo: (newMemo: CommunityMemo) => void;
}

export const WriteMemoModal: React.FC<WriteMemoModalProps> = ({
  isOpen,
  onClose,
  specimens,
  initialSpecimenId,
  currentCenter,
  userAccount,
  userStats,
  onOpenLoginModal,
  onSubmitMemo,
}) => {
  const collectedSpecimens = useMemo(
    () => specimens.filter((s) => s.isCollected && !s.isPending && !s.isDeleted),
    [specimens]
  );

  const [selectedSpecimenId, setSelectedSpecimenId] = useState<string>(
    initialSpecimenId || collectedSpecimens[0]?.id || ''
  );
  const [memoText, setMemoText] = useState('');
  const [selectedPhotoUrls, setSelectedPhotoUrls] = useState<string[]>([]);
  const [isProtected, setIsProtected] = useState(
    userStats?.mapSettings?.hideExactLocation ?? true
  );
  const [visibility, setVisibility] = useState<MemoVisibility>(
    userStats?.mapSettings?.defaultVisibility || 'public'
  );
  const [isEditingVisibility, setIsEditingVisibility] = useState(false);

  const chosenSpecimen = useMemo(
    () => collectedSpecimens.find((s) => s.id === selectedSpecimenId) || collectedSpecimens[0],
    [collectedSpecimens, selectedSpecimenId]
  );

  const recordPhotosForChosen = useMemo(() => {
    if (!chosenSpecimen) return [];
    const urls: string[] = [];
    chosenSpecimen.observations?.forEach((obs) => {
      if (obs.photoUrl && !urls.includes(obs.photoUrl)) urls.push(obs.photoUrl);
    });
    if (chosenSpecimen.originalImage && !urls.includes(chosenSpecimen.originalImage)) {
      urls.push(chosenSpecimen.originalImage);
    }
    if (chosenSpecimen.stickerImage && !urls.includes(chosenSpecimen.stickerImage)) {
      urls.push(chosenSpecimen.stickerImage);
    }
    return urls.slice(0, 5);
  }, [chosenSpecimen]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialSpecimenId && collectedSpecimens.some((s) => s.id === initialSpecimenId)) {
      setSelectedSpecimenId(initialSpecimenId);
    } else if (!selectedSpecimenId && collectedSpecimens[0]?.id) {
      setSelectedSpecimenId(collectedSpecimens[0].id);
    }
  }, [isOpen, initialSpecimenId, selectedSpecimenId, collectedSpecimens]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPhotoUrls(recordPhotosForChosen);
  }, [isOpen, chosenSpecimen?.id, recordPhotosForChosen]);

  const activeHotspot = useMemo(() => {
    if (chosenSpecimen?.locationCoord) {
      const coord = chosenSpecimen.locationCoord;
      const matched = BIOBLITZ_HOTSPOTS.find(
        (h) => coord.name && (h.name === coord.name || h.name.includes(coord.name))
      );
      if (typeof coord.lat === 'number' && typeof coord.lng === 'number') {
        return {
          id: matched?.id || `specimen-loc-${chosenSpecimen.id}`,
          name: coord.name || matched?.name || '내 관찰 기록 장소',
          habitatType: chosenSpecimen.habitatType || matched?.habitatType || '자연 관찰지',
          lat: coord.lat,
          lng: coord.lng,
          description: `${chosenSpecimen.koreanName}을(를) 발견한 기록 장소입니다.`,
        };
      }
      if (matched) return matched;
      return {
        id: `specimen-loc-${chosenSpecimen.id}`,
        name: coord.name || '내 관찰 기록 장소',
        habitatType: chosenSpecimen.habitatType || '자연 관찰지',
        lat: currentCenter.lat,
        lng: currentCenter.lng,
        description: `${chosenSpecimen.koreanName}을(를) 발견한 기록 장소입니다.`,
      };
    }
    return {
      id: 'my-record-loc',
      name: chosenSpecimen?.habitatType || currentCenter.name,
      habitatType: chosenSpecimen?.habitatType || '자연 관찰지',
      lat: currentCenter.lat,
      lng: currentCenter.lng,
      description: '내 도감 관찰 기록 위치',
    };
  }, [chosenSpecimen, currentCenter]);

  const { showCommunity } = getUnder14DesignFlags(userAccount);
  const effectiveSpeciesName = chosenSpecimen?.koreanName || '내 도감 생물';
  const effectiveSciName = chosenSpecimen?.scientificName || 'Species observata';

  if (!isOpen) return null;

  const hasCollectedSpecimen = !!chosenSpecimen;
  const autoProtected = detectProtectedSpecies(effectiveSpeciesName);
  const finalProtected = isProtected || autoProtected;

  const visibilityLabel =
    visibility === 'public' ? '전체 공개' : visibility === 'nearby' ? '주변 탐험가만' : '나만 보기';

  const handleToggleRecordPhoto = (src: string) => {
    setSelectedPhotoUrls((prev) =>
      prev.includes(src) ? prev.filter((item) => item !== src) : [...prev, src].slice(0, 5)
    );
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCommunity || !chosenSpecimen) return;
    if (!userAccount?.isLoggedIn) {
      onOpenLoginModal?.();
      return;
    }
    if (!memoText.trim()) return;

    const masked = obfuscateCoordinates(activeHotspot.lat, activeHotspot.lng, finalProtected);
    const primaryPhoto = selectedPhotoUrls[0] || recordPhotosForChosen[0] || '';

    const newMemo: CommunityMemo = {
      id: `memo-user-${Date.now()}`,
      authorId: 'me',
      authorName: userAccount.name || '내 탐험 기록',
      authorTitle: userStats?.persona === 'birder' ? '조류 탐험가' : '생태 탐험가',
      authorEmoji: '🧭',
      speciesKoreanName: chosenSpecimen.koreanName,
      speciesScientificName: chosenSpecimen.scientificName,
      category: chosenSpecimen.category || 'others',
      specimenId: chosenSpecimen.id,
      photoUrl: primaryPhoto,
      memoText: memoText.trim(),
      placeName: activeHotspot.name,
      regionLabel: finalProtected ? `${activeHotspot.name.split(' ')[0]} 광역 권역` : activeHotspot.name,
      lat: masked.lat,
      lng: masked.lng,
      isProtectedSpecies: finalProtected,
      exifStripped: true,
      visibility,
      createdAt: '방금 전',
      likesCount: 0,
      likedByMe: false,
      comments: [],
    };

    onSubmitMemo(newMemo);
    setMemoText('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#fbfbfb] sm:bg-black/50 sm:backdrop-blur-xs p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg bg-[#fbfbfb] sm:rounded-[28px] shadow-2xl sm:border sm:border-[#e6e9e5] overflow-hidden flex flex-col"
        >
          {/* 15 Header */}
          <div className="px-4 pt-3 pb-2.5 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] flex items-center justify-center text-[#202320] cursor-pointer shadow-2xs"
              aria-label="뒤로"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-[16px] font-bold text-[#202320]">메모 쓰기</h3>
            <div className="w-10" />
          </div>

          <form onSubmit={handlePublish} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-1 pb-6 overflow-y-auto space-y-4 flex-1 scrollbar-none">
              {!userAccount?.isLoggedIn && (
                <div className="p-3.5 rounded-2xl bg-[#fff8e6] border border-[#f5d57a] flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-[#202320]">
                    로그인하면 내 탐험 이름으로 메모를 등록할 수 있어요.
                  </span>
                  <button
                    type="button"
                    onClick={onOpenLoginModal}
                    className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-bold shrink-0 cursor-pointer"
                  >
                    로그인
                  </button>
                </div>
              )}

              {/* Breadcrumb */}
              <div className="text-xs text-[#8c948a] flex items-center gap-1">
                <span>내 도감 기록</span>
                <span>›</span>
                <span className="font-bold text-[#202320]">{activeHotspot.name}</span>
              </div>

              {/* 내 도감에 수집한 생물 선택 (도감 기준) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-bold text-[#202320] truncate">
                    {hasCollectedSpecimen
                      ? `선택한 도감 · ${effectiveSpeciesName}`
                      : '내 도감 기록 선택'}
                  </span>
                  <span className="text-[11px] font-medium text-[#8c948a] shrink-0">
                    {collectedSpecimens.length}종 보유
                  </span>
                </div>

                {collectedSpecimens.length > 0 ? (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {collectedSpecimens.map((sp) => {
                      const isSelected = chosenSpecimen?.id === sp.id;
                      const thumb =
                        sp.observations?.[0]?.photoUrl || sp.originalImage || sp.stickerImage;
                      return (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => setSelectedSpecimenId(sp.id)}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-2xl border shrink-0 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#202320] text-white border-[#202320] shadow-xs'
                              : 'bg-white text-[#202320] border-[#e6e9e5] hover:bg-[#f4f5f4]'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-xl overflow-hidden bg-[#f4f5f4] shrink-0 flex items-center justify-center">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={sp.koreanName}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Camera className="w-3.5 h-3.5 text-[#8c948a]" />
                            )}
                          </div>
                          <div className="text-left pr-1">
                            <div className="text-xs font-bold leading-tight">{sp.koreanName}</div>
                            <div
                              className={`text-[10px] leading-tight ${
                                isSelected ? 'text-white/70' : 'text-[#8c948a]'
                              }`}
                            >
                              {sp.locationCoord?.name || sp.observations?.[0]?.date || '수집 완료'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#f4f5f4] text-xs text-[#626961] leading-relaxed">
                    아직 내 도감에 수집한 생물이 없어요. 하단 카메라로 생물을 먼저 포착해 도감을 채우면 그 기록과 위치를 바탕으로 탐험 메모를 남길 수 있어요.
                  </div>
                )}
              </div>

              {/* 선택한 도감 기록 사진 목록 */}
              {hasCollectedSpecimen && recordPhotosForChosen.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#8c948a]">
                    <span>내 도감 사진에서 첨부 ({selectedPhotoUrls.length}/{recordPhotosForChosen.length})</span>
                    <span>터치해 포함/제외</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {recordPhotosForChosen.map((src, idx) => {
                      const isIncluded = selectedPhotoUrls.includes(src);
                      return (
                        <button
                          key={`${src}-${idx}`}
                          type="button"
                          onClick={() => handleToggleRecordPhoto(src)}
                          className={`w-18 h-18 rounded-2xl overflow-hidden bg-[#f4f5f4] border-2 relative shrink-0 cursor-pointer transition-all ${
                            isIncluded
                              ? 'border-[#202320] opacity-100'
                              : 'border-[#e6e9e5] opacity-45 grayscale'
                          }`}
                        >
                          <img
                            src={src}
                            alt={`내 도감 기록 사진 ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div
                            className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                              isIncluded ? 'bg-[#202320] text-white' : 'bg-white/90 text-[#8c948a]'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Textarea + Counter */}
              <div className="bg-white rounded-[20px] border border-[#e6e9e5] p-3.5 space-y-2">
                <textarea
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  rows={4}
                  maxLength={500}
                  disabled={!hasCollectedSpecimen}
                  placeholder={
                    hasCollectedSpecimen
                      ? `${effectiveSpeciesName}을(를) 만났을 때의 날씨나 행동, 관찰 팁을 나눠주세요.`
                      : '도감에 생물을 먼저 포착한 뒤 메모를 작성할 수 있어요.'
                  }
                  className="w-full text-[14px] text-[#202320] placeholder:text-[#8c948a] leading-relaxed focus:outline-none resize-none bg-transparent disabled:opacity-50"
                  required
                />
                <div className="text-right text-[11px] text-[#8c948a] tabular-nums">
                  {memoText.length} / 500
                </div>
              </div>

              {/* Clean Rows: 기록 위치 고정, 공개 범위, 정확한 위치 숨기기 */}
              <div className="divide-y divide-[#f4f5f4] bg-white rounded-[20px] border border-[#e6e9e5] px-4">
                <div className="py-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[14px] font-bold text-[#202320] block">관찰 위치</span>
                    <span className="text-[11px] text-[#8c948a] mt-0.5 block">
                      선택한 도감 기록의 발견 위치로 자동 고정돼요
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#202320] shrink-0">
                    {activeHotspot.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingVisibility(!isEditingVisibility)}
                  className="w-full py-4 flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-[14px] font-bold text-[#202320]">공개 범위</span>
                  <span className="text-xs font-medium text-[#8c948a] flex items-center gap-1">
                    {visibilityLabel}
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </button>

                {isEditingVisibility && (
                  <div className="py-3 grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'public' as const, label: '전체 공개' },
                      { id: 'nearby' as const, label: '주변 탐험가만' },
                      { id: 'private' as const, label: '나만 보기' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setVisibility(opt.id);
                          setIsEditingVisibility(false);
                        }}
                        className={`py-2 rounded-xl text-xs font-bold cursor-pointer ${
                          visibility === opt.id
                            ? 'bg-black text-white'
                            : 'bg-[#f4f5f4] text-[#626961]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="py-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[14px] font-bold text-[#202320] block">정확한 위치 숨기기</span>
                    <span className="text-xs text-[#8c948a] mt-0.5 block">
                      {autoProtected
                        ? '보호종으로 감지되어 광역 권역으로 자동 보호돼요'
                        : '지도에는 반경 300m 범위로만 표시돼요'}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={autoProtected}
                    onClick={() => setIsProtected(!isProtected)}
                    aria-label="정확한 위치 숨기기"
                    className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center shrink-0 cursor-pointer ${
                      finalProtected ? 'bg-black justify-end' : 'bg-[#e6e9e5] justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#8c948a] leading-relaxed px-1">
                둥지·번식지처럼 생물에게 위험할 수 있는 곳은 정확한 위치를 숨겨 주세요. 사진의 위치 메타데이터(EXIF)는 저장 시 자동 제거됩니다.
              </p>
            </div>

            <div className="p-4 bg-[#fbfbfb] border-t border-[#e6e9e5] shrink-0">
              <button
                type="submit"
                disabled={!hasCollectedSpecimen}
                className="w-full h-14 bg-black hover:bg-[#202320] disabled:bg-[#d2d7d1] disabled:cursor-not-allowed text-white text-[15px] font-bold rounded-2xl transition-colors cursor-pointer"
              >
                {!hasCollectedSpecimen
                  ? '도감에 생물 등록 후 작성 가능'
                  : userAccount?.isLoggedIn
                  ? `${effectiveSpeciesName} 메모 등록`
                  : '로그인하고 등록'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* ============================================================================
   46 / 42 프로필 모달 (내 프로필 + 다른 탐험가 프로필)
   ============================================================================ */
interface ExplorerProfileModalProps {
  profile: ExplorerProfile | null;
  isOwnAccount: boolean;
  onClose: () => void;
  userAccount?: UserAccount;
  userStats?: UserStats;
  specimens?: Specimen[];
  memos: CommunityMemo[];
  isFollowing: boolean;
  onToggleFollow: (profileId: string) => void;
  onBlockUser: (profileId: string, name: string) => void;
  onSelectMemo: (memo: CommunityMemo) => void;
  onOpenPublicSpecimenData?: (entry: PublicSpecimenEntry) => void;
  onOpenLoginModal?: () => void;
  onOpenMyPage?: () => void;
}

export const ExplorerProfileModal: React.FC<ExplorerProfileModalProps> = ({
  profile,
  isOwnAccount,
  onClose,
  userAccount,
  userStats,
  specimens = [],
  memos,
  onBlockUser,
  onSelectMemo,
  onOpenPublicSpecimenData,
  onOpenLoginModal,
  onOpenMyPage,
}) => {
  const [activeTab, setActiveTab] = useState<'memos' | 'encyclopedia' | 'badges'>('memos');
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [dismissNotice, setDismissNotice] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedBadgeDetail, setSelectedBadgeDetail] = useState<EvaluatedBadge | null>(null);

  useEffect(() => {
    setActiveTab('memos');
    setSelectedBadgeDetail(null);
  }, [profile?.id]);

  const safeStats: UserStats = useMemo(
    () =>
      userStats || {
        freeScans: 10,
        isProUser: false,
        planType: 'free',
        streakDays: 0,
        exploredHabitats: [],
        totalScans: 0,
        soundEnabled: true,
        hapticsEnabled: true,
        highResCloudSync: true,
        pushDiscoveryAlerts: true,
        homeCity: '서울',
        taxonomyDisplayMode: 'common_first',
        photoQuality: 'original',
        unitSystem: 'metric',
        viewJournalMode: true,
        exp: 0,
        badges: [],
      },
    [userStats]
  );

  const badges = useMemo(() => {
    if (!profile) return [];
    if (isOwnAccount) {
      return evaluateExplorerBadges(specimens, safeStats, userAccount);
    }
    const otherStats: UserStats = {
      ...safeStats,
      streakDays: Math.min(30, Math.max(1, Math.floor(profile.memoCount / 2))),
      totalScans: profile.speciesCount,
      exploredHabitats: [profile.favoriteRegion || '도심 공원'],
      exp: profile.speciesCount * 30,
    };
    return evaluateExplorerBadges([], otherStats, undefined);
  }, [isOwnAccount, specimens, safeStats, userAccount, profile]);

  const publicEntries = useMemo(() => {
    if (!profile || isOwnAccount) return [];
    const curated = EXPLORER_PUBLIC_SPECIMENS.filter((e) => e.authorId === profile.id);
    const seenSpecies = new Set(curated.map((e) => e.speciesKoreanName));
    const fromMemos: PublicSpecimenEntry[] = memos
      .filter((m) => m.authorId === profile.id && !seenSpecies.has(m.speciesKoreanName))
      .map((m) => ({
        id: `pub-memo-${m.id}`,
        authorId: m.authorId,
        authorName: m.authorName,
        authorTitle: m.authorTitle,
        authorEmoji: m.authorEmoji,
        speciesKoreanName: m.speciesKoreanName,
        speciesScientificName: m.speciesScientificName,
        category: m.category,
        photoUrl: m.photoUrl,
        observedDate: m.createdAt,
        regionLabel: m.isProtectedSpecies ? m.regionLabel : m.placeName || m.regionLabel,
        habitatType: m.regionLabel || '자연 서식지',
        fieldNote: m.memoText,
        isProtectedSpecies: m.isProtectedSpecies,
      }));
    return [...curated, ...fromMemos];
  }, [profile, isOwnAccount, memos]);

  if (!profile) return null;

  const userMemos = memos.filter((m) => m.authorId === profile.id);
  const totalHeartsReceived = userMemos.reduce((sum, m) => sum + (m.likesCount || 0), 0);
  const isLoggedIn = !!userAccount?.isLoggedIn;
  const { under14 } = getUnder14DesignFlags(userAccount);
  const totalPolicyBadges = under14 ? TOTAL_POLICY_BADGES_UNDER14 : TOTAL_POLICY_BADGES_ADULT;

  const unlockedBadges = badges.filter((b) => b.isUnlocked);
  const sortedBadges = [...badges].sort((a, b) => Number(b.isUnlocked) - Number(a.isUnlocked));
  const filteredBadges = !isOwnAccount
    ? unlockedBadges
    : sortedBadges.filter((b) => {
        if (badgeFilter === 'unlocked') return b.isUnlocked;
        if (badgeFilter === 'locked') return !b.isUnlocked;
        return true;
      });

  const titleInfo = getExplorerTitleInfo(specimens, safeStats, userAccount);
  const nextTierLevel =
    titleInfo.currentLevel < 5 ? 5 : titleInfo.currentLevel < 10 ? 10 : titleInfo.currentLevel < 20 ? 20 : titleInfo.currentLevel < 30 ? 30 : null;
  const currentTierBaseXp = getRequiredXpForLevel(
    titleInfo.currentLevel >= 30 ? 30 : titleInfo.currentLevel >= 20 ? 20 : titleInfo.currentLevel >= 10 ? 10 : titleInfo.currentLevel >= 5 ? 5 : 1
  );
  const nextTierXp = nextTierLevel ? getRequiredXpForLevel(nextTierLevel) : titleInfo.exp;
  const xpLeft = nextTierLevel ? Math.max(0, nextTierXp - titleInfo.exp) : 0;
  const xpPct = nextTierLevel
    ? Math.min(100, Math.max(6, ((titleInfo.exp - currentTierBaseXp) / Math.max(1, nextTierXp - currentTierBaseXp)) * 100))
    : 100;

  const otherLevel = EXPLORER_LEVEL_RANKING_SEED[profile.id] || Math.max(3, Math.floor(profile.speciesCount / 3));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#fbfbfb] sm:bg-black/50 sm:backdrop-blur-xs p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-[#fbfbfb] sm:rounded-[28px] shadow-2xl sm:border sm:border-[#e6e9e5] overflow-hidden flex flex-col"
        >
          {/* Header (46 / 42) - 중복된 탐험맵 설정 진입 제거 */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0 relative">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] flex items-center justify-center text-[#202320] cursor-pointer shadow-2xs"
              aria-label="뒤로"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-[16px] font-bold text-[#202320]">
              {isOwnAccount ? '내 프로필' : '탐험가 프로필'}
            </h3>
            {isOwnAccount ? (
              <div className="w-10" />
            ) : (
              <div className="flex items-center gap-1.5 relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] flex items-center justify-center text-[#202320] cursor-pointer shadow-2xs"
                  aria-label="메뉴"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            )}

            {isMenuOpen && !isOwnAccount && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-4 top-14 z-20 w-44 bg-white rounded-2xl border border-[#e6e9e5] shadow-xl py-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onBlockUser(profile.id, profile.name);
                      onClose();
                    }}
                    className="w-full px-3.5 py-2.5 text-left font-semibold text-[#ff5100] hover:bg-[#fff1eb] flex items-center gap-2 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>탐험가 차단</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="px-4 pt-2 pb-6 overflow-y-auto space-y-5 flex-1 scrollbar-none">
            {/* Centered Profile Hero (46 / 42) */}
            <div className="flex flex-col items-center text-center space-y-2 pt-1">
              <div className="w-16 h-16 rounded-full bg-[#fdf6dc] border border-[#f0e6c2] flex items-center justify-center text-3xl">
                {profile.avatarEmoji}
              </div>
              <div>
                <h4 className="text-[20px] font-bold text-[#202320]">{profile.name}</h4>
                <p className="text-xs text-[#8c948a] mt-0.5">
                  {isOwnAccount
                    ? `${profile.joinedAt}부터 탐험 중`
                    : `${profile.titleBadge} · Lv.${otherLevel}`}
                </p>
              </div>

              {isOwnAccount && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (isLoggedIn) {
                      onOpenMyPage?.();
                    } else {
                      onOpenLoginModal?.();
                    }
                  }}
                  className="w-full h-11 rounded-2xl bg-[#f4f5f4] hover:bg-[#e6e9e5] text-[14px] font-bold text-[#202320] transition-colors cursor-pointer mt-2"
                >
                  {isLoggedIn ? '프로필 편집' : '로그인 / 프로필 시작하기'}
                </button>
              )}
            </div>

            {/* Other Profile Notice (42) */}
            {!isOwnAccount && !dismissNotice && (
              <div className="bg-[#f4f5f4] rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-[#626961]">
                <span>탐험가가 공개한 탐험 메모와 관찰 도감 데이터를 볼 수 있어요.</span>
                <button
                  type="button"
                  onClick={() => setDismissNotice(true)}
                  className="font-semibold text-[#8c948a] hover:text-[#202320] cursor-pointer shrink-0 ml-2"
                >
                  닫기
                </button>
              </div>
            )}

            {/* Own Profile Level Progress Card (46) */}
            {isOwnAccount && (
              <div className="bg-white rounded-[20px] border border-[#e6e9e5] p-4 space-y-2.5">
                <div className="text-[16px] font-bold text-[#202320]">
                  Lv.{titleInfo.currentLevel} {titleInfo.activeTitle}
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#f4f5f4] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#527012] to-[#c4eb43]"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#202320] tabular-nums">
                    {titleInfo.exp} <span className="text-[#8c948a] font-medium">/ {nextTierXp} XP</span>
                  </span>
                  <span className="font-semibold text-[#202320] tabular-nums">
                    {nextTierLevel ? `다음 레벨까지 ${xpLeft} XP` : '최고 등급 구간'}
                  </span>
                </div>
              </div>
            )}

            {/* 3-Stat Bar */}
            <div className="bg-[#f4f5f4] rounded-[20px] grid grid-cols-3 divide-x divide-[#e6e9e5] py-4 text-center">
              <div>
                <span className="text-[18px] font-bold text-[#202320] tabular-nums block">
                  {isOwnAccount ? userMemos.length : Math.max(profile.memoCount, userMemos.length)}개
                </span>
                <span className="text-[11px] font-medium text-[#8c948a]">탐험 메모</span>
              </div>
              <div>
                <span className="text-[18px] font-bold text-[#202320] tabular-nums block">
                  {totalHeartsReceived}개
                </span>
                <span className="text-[11px] font-medium text-[#8c948a]">받은 하트</span>
              </div>
              <div>
                <span className="text-[18px] font-bold text-[#202320] tabular-nums block">
                  {isOwnAccount
                    ? `${unlockedBadges.length} / ${totalPolicyBadges}개`
                    : `${profile.speciesCount}종`}
                </span>
                <span className="text-[11px] font-medium text-[#8c948a]">
                  {isOwnAccount ? '획득 뱃지' : '관찰 생물'}
                </span>
              </div>
            </div>

            {/* Underline Tabs: 탐험 메모 | 도감 데이터 (타인) | 획득 뱃지 */}
            <div className="flex border-b border-[#e6e9e5]">
              <button
                type="button"
                onClick={() => setActiveTab('memos')}
                className={`flex-1 py-3 text-[15px] relative cursor-pointer ${
                  activeTab === 'memos' ? 'font-bold text-[#202320]' : 'font-semibold text-[#8c948a]'
                }`}
              >
                <span>탐험 메모</span>
                {activeTab === 'memos' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#202320]" />
                )}
              </button>
              {!isOwnAccount && (
                <button
                  type="button"
                  onClick={() => setActiveTab('encyclopedia')}
                  className={`flex-1 py-3 text-[15px] relative cursor-pointer ${
                    activeTab === 'encyclopedia' ? 'font-bold text-[#202320]' : 'font-semibold text-[#8c948a]'
                  }`}
                >
                  <span>도감 데이터</span>
                  {activeTab === 'encyclopedia' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#202320]" />
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('badges')}
                className={`flex-1 py-3 text-[15px] relative cursor-pointer ${
                  activeTab === 'badges' ? 'font-bold text-[#202320]' : 'font-semibold text-[#8c948a]'
                }`}
              >
                <span>획득 뱃지</span>
                {activeTab === 'badges' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#202320]" />
                )}
              </button>
            </div>

            {/* TAB: 탐험 메모 */}
            {activeTab === 'memos' && (
              <div className="space-y-2.5">
                {userMemos.length === 0 ? (
                  <div className="p-8 rounded-[20px] bg-white border border-[#e6e9e5] text-center text-xs text-[#8c948a]">
                    아직 지도에 공유한 메모가 없어요.
                  </div>
                ) : (
                  userMemos.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectMemo(m);
                      }}
                      className="w-full p-3 rounded-[20px] bg-white border border-[#e6e9e5] hover:border-[#d2d7d1] flex items-center justify-between gap-3 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {m.photoUrl ? (
                          <img
                            src={m.photoUrl}
                            alt={m.speciesKoreanName}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-2xl object-cover shrink-0 bg-[#f4f5f4]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-[#f4f5f4] flex items-center justify-center shrink-0">
                            <Camera className="w-4 h-4 text-[#8c948a]" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-[15px] font-bold text-[#202320] truncate">
                            {m.speciesKoreanName}
                          </div>
                          <div className="text-xs text-[#8c948a] truncate mt-0.5">
                            {getSpeciesTaxonomyCategoryLabel(m.category)} · {m.placeName} · {m.createdAt}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#8c948a] shrink-0">{m.createdAt}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* TAB: 도감 데이터 (타인 도감 열람) */}
            {activeTab === 'encyclopedia' && !isOwnAccount && (
              <div className="space-y-2.5">
                {publicEntries.length === 0 ? (
                  <div className="p-8 rounded-[20px] bg-white border border-[#e6e9e5] text-center text-xs text-[#8c948a]">
                    공개된 도감 관찰 데이터가 아직 없어요.
                  </div>
                ) : (
                  publicEntries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => onOpenPublicSpecimenData?.(entry)}
                      className="w-full p-3 rounded-[20px] bg-white border border-[#e6e9e5] hover:border-[#c4eb43] flex items-center justify-between gap-3 text-left cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {entry.photoUrl ? (
                          <img
                            src={entry.photoUrl}
                            alt={entry.speciesKoreanName}
                            referrerPolicy="no-referrer"
                            className="w-13 h-13 rounded-2xl object-cover shrink-0 bg-[#f4f5f4]"
                          />
                        ) : (
                          <div className="w-13 h-13 rounded-2xl bg-[#f4f5f4] flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-[#8c948a]" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[15px] font-bold text-[#202320] truncate">
                              {entry.speciesKoreanName}
                            </span>
                            {entry.isProtectedSpecies && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f4fbdd] text-[#6d8911] shrink-0">
                                보호종
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#8c948a] italic truncate">
                            {entry.speciesScientificName}
                          </div>
                          <div className="text-xs text-[#626961] truncate mt-0.5">
                            {entry.regionLabel} · {entry.habitatType}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8c948a] shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}

            {/* TAB: 획득 뱃지 (46 / 56) */}
            {activeTab === 'badges' && (
              <div className="space-y-4">
                {isOwnAccount && (
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'all' as const, label: `전체 ${badges.length}` },
                      { id: 'unlocked' as const, label: `획득 ${unlockedBadges.length}` },
                      { id: 'locked' as const, label: `미획득 ${badges.length - unlockedBadges.length}` },
                    ].map((pill) => (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setBadgeFilter(pill.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer tabular-nums ${
                          badgeFilter === pill.id
                            ? 'bg-black text-white'
                            : 'bg-white border border-[#e6e9e5] text-[#626961]'
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                )}

                {filteredBadges.length === 0 ? (
                  <div className="p-8 rounded-[20px] bg-white border border-[#e6e9e5] text-center text-xs text-[#8c948a]">
                    아직 획득한 뱃지가 없어요.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-x-3 gap-y-4">
                    {filteredBadges.map((b) => {
                      const tierRim = !b.isUnlocked
                        ? 'border-[#e6e9e5] bg-[#f4f5f4]'
                        : b.tier === 'legend'
                        ? 'border-[#7c3aed] bg-[#f5f3ff]'
                        : b.tier === 'gold'
                        ? 'border-[#e0a800] bg-[#fffbeb]'
                        : b.tier === 'silver'
                        ? 'border-[#94a3b8] bg-[#f8fafc]'
                        : 'border-[#b46a34] bg-[#fdf4ec]';
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBadgeDetail(b)}
                          className="flex flex-col items-center text-center gap-1.5 cursor-pointer group"
                        >
                          <div className="relative pt-1 pb-1">
                            <div
                              className={`w-18 h-18 rounded-[22px] rounded-b-[32px] flex items-center justify-center text-3xl border-[3px] shadow-2xs transition-transform group-active:scale-95 ${tierRim}`}
                            >
                              <span className={!b.isUnlocked ? 'grayscale opacity-40' : ''}>{b.icon}</span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-[#202320] truncate w-full">{b.title}</span>
                          <span className="text-[10px] text-[#8c948a] tabular-nums">
                            {b.isUnlocked ? `획득 · ${b.unlockedAt?.slice(5) || '최근'}` : '미획득'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Inline Badge Detail Modal (47 / 48) */}
          {selectedBadgeDetail && (
            <div
              className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/50 backdrop-blur-xs"
              onClick={() => setSelectedBadgeDetail(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[360px] bg-white rounded-t-[28px] sm:rounded-[28px] px-5 pt-3 pb-6 shadow-2xl border border-[#e6e9e5] space-y-4"
              >
                <div className="w-9 h-1 bg-[#d2d7d1] rounded-full mx-auto sm:hidden" />
                <div>
                  <h4 className="text-[20px] font-bold text-[#202320]">{selectedBadgeDetail.title}</h4>
                  <p className="text-xs text-[#8c948a] mt-0.5">
                    {selectedBadgeDetail.category} 뱃지 ·{' '}
                    {selectedBadgeDetail.isUnlocked
                      ? `${selectedBadgeDetail.unlockedAt || '최근'} 획득`
                      : '미획득'}
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-22 h-22 rounded-[22px] bg-[#f4f5f4] border border-[#e6e9e5] flex items-center justify-center text-4xl shrink-0">
                    <span className={!selectedBadgeDetail.isUnlocked ? 'grayscale opacity-40' : ''}>
                      {selectedBadgeDetail.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#f4f5f4] text-[11px] font-semibold text-[#626961]">
                        {selectedBadgeDetail.isUnlocked ? '획득' : '미획득'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#a88200] text-white text-[11px] font-bold tabular-nums">
                        {getTierBadgeLabel(selectedBadgeDetail.tier)} · +{selectedBadgeDetail.xpReward} XP
                      </span>
                    </div>
                    <p className="text-xs text-[#202320] leading-snug">{selectedBadgeDetail.desc}</p>
                  </div>
                </div>

                <div className="bg-[#f4f5f4] rounded-2xl p-3 space-y-1">
                  <span className="text-[11px] font-bold text-[#8c948a] block">TIP</span>
                  <p className="text-xs text-[#202320]">{selectedBadgeDetail.tip}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBadgeDetail(null)}
                  className="w-full h-13 bg-black text-white rounded-2xl text-[15px] font-bold cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* ============================================================================
   신고 내역 시드 데이터 & 68c 신고 처리 상세 모달
   ============================================================================ */
export interface ReportHistoryItem {
  id: string;
  targetTitle: string;
  reason: string;
  date: string;
  status: 'pending' | 'resolved_hidden' | 'resolved_kept';
  statusLabel: '검토 중' | '조치 완료' | '문제 없음으로 판단';
  detail: string;
}

export const INITIAL_REPORT_HISTORY_ITEMS: ReportHistoryItem[] = [
  {
    id: 'rep-1',
    targetTitle: '‘물총새’ 메모 신고',
    reason: '스팸·홍보성 내용',
    date: '10.29',
    status: 'pending',
    statusLabel: '검토 중',
    detail: '신고해 주신 메모를 운영팀에서 검토하고 있어요. 검토가 완료되면 알림으로 결과를 알려 드릴게요.',
  },
  {
    id: 'rep-2',
    targetTitle: '‘왜가리’ 메모 신고',
    reason: '개인정보나 집 위치 노출',
    date: '10.21',
    status: 'resolved_hidden',
    statusLabel: '조치 완료',
    detail: '운영 정책에 따라 숨김 처리했어요. 위치 및 개인정보가 노출된 게시물은 즉시 비공개 조치되었습니다.',
  },
  {
    id: 'rep-3',
    targetTitle: '댓글 신고',
    reason: '욕설·비하·혐오 표현',
    date: '10.12',
    status: 'resolved_hidden',
    statusLabel: '조치 완료',
    detail: '커뮤니티 운영 가이드라인 위반으로 확인되어 해당 댓글이 영구 삭제되었으며 작성자에게 주의 조치되었습니다.',
  },
  {
    id: 'rep-4',
    targetTitle: '‘제주왕나비’ 메모 신고',
    reason: '사진 도용',
    date: '09.30',
    status: 'resolved_kept',
    statusLabel: '문제 없음으로 판단',
    detail: '정책에 어긋나지 않아 그대로 유지돼요. 원본 촬영 메타데이터 및 도감 대조 결과 정상 관찰 기록으로 확인되었습니다.',
  },
];

/* ============================================================================
   68c 신고 처리 결과 알림 상세 팝업
   ============================================================================ */
export const ReportOutcomeDetailModal: React.FC<{
  report: ReportHistoryItem | null;
  onClose: () => void;
}> = ({ report, onClose }) => {
  if (!report) return null;

  const isHidden = report.status === 'resolved_hidden';
  const isKept = report.status === 'resolved_kept';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm bg-white rounded-[28px] shadow-2xl border border-[#e6e9e5] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#f4f5f4] flex items-center justify-center text-[#202320]">
                <Flag className="w-4 h-4" />
              </div>
              <h3 className="text-[16px] font-bold text-[#202320]">신고 처리 결과</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#f4f5f4] flex items-center justify-center text-[#202320] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#fafbfa] border border-[#eff1ee] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#202320]">{report.targetTitle}</span>
              {isHidden ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[#ebebeb] text-[#202320] text-[11px] font-bold">
                  숨김 처리
                </span>
              ) : isKept ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[#d2f347] text-[#202320] text-[11px] font-bold">
                  유지
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-[#f4fbdd] text-[#6d8911] text-[11px] font-bold">
                  검토 중
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#202320] font-semibold">{report.detail}</p>
            <div className="text-[11px] text-[#8c948a] pt-1">
              신고 사유: {report.reason} · 접수일 {report.date}
            </div>
          </div>

          <p className="text-xs text-[#8c948a] leading-relaxed">
            모아로그는 생물과 모든 탐험가가 안전하게 자연을 관찰할 수 있도록 24시간 커뮤니티 가이드라인을 운영하고 있습니다.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-black text-white text-[14px] font-bold active:scale-[0.99] cursor-pointer"
          >
            확인
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* ============================================================================
   39 / 63 즐겨찾기 모달 (39 메모 / 63 장소 / 40 & 63b 빈 상태 / 39c & 63c 재시도)
   ============================================================================ */
export interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'memo' | 'place';
  memos: CommunityMemo[];
  bookmarkedMemoIds: string[];
  bookmarkedPlaceIds: string[];
  onSelectMemo: (memo: CommunityMemo) => void;
  onSelectPlace: (place: BioBlitzCenter) => void;
  onRemoveBookmarkMemo: (memoId: string) => void;
  onRemoveBookmarkPlace: (placeId: string) => void;
  onExploreMap: () => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'memo',
  memos,
  bookmarkedMemoIds,
  bookmarkedPlaceIds,
  onSelectMemo,
  onSelectPlace,
  onRemoveBookmarkMemo,
  onRemoveBookmarkPlace,
  onExploreMap,
}) => {
  const [activeTab, setActiveTab] = useState<'memo' | 'place'>(initialTab);
  const [isSimulatedError, setIsSimulatedError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setIsSimulatedError(false);
    }
  }, [isOpen, initialTab]);

  const allKnownPlaces = useMemo(() => {
    const map = new Map<string, BioBlitzCenter>();
    BIOBLITZ_HOTSPOTS.forEach((h) => map.set(h.id, h));
    memos.forEach((m) => {
      if (!m.placeName) return;
      const placeId = `memo-place-${m.id}`;
      if (!Array.from(map.values()).some((p) => p.name === m.placeName)) {
        map.set(placeId, {
          id: placeId,
          name: m.placeName,
          habitatType: '탐사 관찰지',
          lat: m.lat,
          lng: m.lng,
          description: '탐험가들이 함께 방문하여 생태 관찰 기록을 남기는 공개 탐사 장소입니다.',
        });
      }
    });
    return Array.from(map.values());
  }, [memos]);

  if (!isOpen) return null;

  const savedMemos = memos.filter((m) => bookmarkedMemoIds.includes(m.id));
  const savedPlaces = allKnownPlaces.filter((h) => bookmarkedPlaceIds.includes(h.id));

  const handleRetry = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSimulatedError(false);
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#fbfbfb] sm:bg-black/50 sm:backdrop-blur-xs p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-[#fbfbfb] sm:rounded-[28px] shadow-2xl sm:border sm:border-[#e6e9e5] overflow-hidden flex flex-col"
        >
          {/* Header (39 / 63) */}
          <div className="px-4 pt-3 pb-0 bg-[#fbfbfb] shrink-0 border-b border-[#efefef]">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] flex items-center justify-center text-[#202320] cursor-pointer shadow-2xs"
                aria-label="뒤로"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-[17px] font-bold text-[#202320]">즐겨찾기</h3>
              <div className="w-10" />
            </div>

            {/* Tabs: 저장한 메모 (39) vs 찜한 탐사지 (63) */}
            <div className="flex border-b border-[#e6e9e5] relative">
              <button
                type="button"
                onClick={() => setActiveTab('memo')}
                className={`flex-1 py-3 text-center text-[15px] font-bold transition-colors cursor-pointer relative ${
                  activeTab === 'memo' ? 'text-[#202320]' : 'text-[#8c948a]'
                }`}
              >
                저장한 메모
                {activeTab === 'memo' && (
                  <motion.div
                    layoutId="fav-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#202320]"
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('place')}
                className={`flex-1 py-3 text-center text-[15px] font-bold transition-colors cursor-pointer relative ${
                  activeTab === 'place' ? 'text-[#202320]' : 'text-[#8c948a]'
                }`}
              >
                찜한 탐사지
                {activeTab === 'place' && (
                  <motion.div
                    layoutId="fav-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#202320]"
                  />
                )}
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
            {isLoading ? (
              /* 39d / 63d Skeleton Loading */
              <div className="space-y-4 pt-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-12 h-12 rounded-2xl bg-[#eaede9] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#eaede9] rounded w-1/3" />
                      <div className="h-3 bg-[#eaede9] rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isSimulatedError ? (
              /* 39c / 63c Error State */
              <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center px-4 space-y-4">
                <Wifi className="w-12 h-12 text-[#8c948a] stroke-[1.5]" />
                <div>
                  <h4 className="text-[17px] font-bold text-[#202320]">즐겨찾기를 불러오지 못했어요</h4>
                  <p className="text-xs text-[#8c948a] mt-1 whitespace-pre-line leading-relaxed">
                    네트워크 연결을 확인한 뒤{'\n'}다시 시도해 주세요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-6 py-3 rounded-xl bg-black text-white text-[14px] font-bold cursor-pointer active:scale-95"
                >
                  다시 시도
                </button>
              </div>
            ) : activeTab === 'memo' ? (
              savedMemos.length === 0 ? (
                /* 40 Empty State */
                <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center px-4 space-y-4">
                  <Bookmark className="w-12 h-12 text-[#8c948a] stroke-[1.5] fill-transparent" />
                  <div>
                    <h4 className="text-[17px] font-bold text-[#202320]">아직 즐겨찾기한 메모가 없어요</h4>
                    <p className="text-xs text-[#8c948a] mt-1 whitespace-pre-line leading-relaxed">
                      마음에 드는 메모의 북마크를 눌러{'\n'}여기에 모아 보세요.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onExploreMap();
                    }}
                    className="px-6 py-3.5 rounded-xl bg-black text-white text-[14px] font-bold cursor-pointer active:scale-95"
                  >
                    탐험맵 둘러보기
                  </button>
                </div>
              ) : (
                /* 39 Memo List */
                <div className="divide-y divide-[#f4f5f4]">
                  {savedMemos.map((memo) => (
                    <div
                      key={memo.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-[#f4f5f4]/50 rounded-2xl px-2 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectMemo(memo);
                        }}
                        className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                      >
                        {memo.photoUrl ? (
                          <img
                            src={memo.photoUrl}
                            alt={memo.speciesKoreanName}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-2xl object-cover shrink-0 bg-[#f4f5f4]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-[#f4f5f4] border border-[#e6e9e5] flex items-center justify-center shrink-0">
                            <Camera className="w-5 h-5 text-[#8c948a]" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-[15px] font-bold text-[#202320] truncate">
                            {memo.speciesKoreanName}
                          </h4>
                          <p className="text-xs text-[#8c948a] truncate mt-0.5">
                            {memo.category ? getSpeciesTaxonomyCategoryLabel(memo.category) : '생물'} · {memo.authorName} · {memo.placeName}
                          </p>
                        </div>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-[#8c948a] tabular-nums">2시간 전</span>
                        <button
                          type="button"
                          onClick={() => onRemoveBookmarkMemo(memo.id)}
                          className="p-1.5 text-[#8c948a] hover:text-[#ff5100] cursor-pointer"
                          aria-label="즐겨찾기 해제"
                        >
                          <Bookmark className="w-4 h-4 fill-current text-[#202320]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : savedPlaces.length === 0 ? (
              /* 63b Empty State */
              <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center px-4 space-y-4">
                <MapPin className="w-12 h-12 text-[#8c948a] stroke-[1.5]" />
                <div>
                  <h4 className="text-[17px] font-bold text-[#202320]">아직 찜한 탐사지가 없어요</h4>
                  <p className="text-xs text-[#8c948a] mt-1 whitespace-pre-line leading-relaxed">
                    가보고 싶은 다른 탐험가의 관찰지나{'\n'}탐사 스팟을 북마크해 모아 보세요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onExploreMap();
                  }}
                  className="px-6 py-3.5 rounded-xl bg-black text-white text-[14px] font-bold cursor-pointer active:scale-95"
                >
                  탐험맵 둘러보기
                </button>
              </div>
            ) : (
              /* 63 Place List */
              <div className="space-y-2.5">
                {savedPlaces.map((place) => {
                  const placeMemosCount = memos.filter(
                    (m) =>
                      m.placeName === place.name ||
                      m.placeName.includes(place.name.split(' ')[0]) ||
                      haversineKm(place.lat, place.lng, m.lat, m.lng) <= 1.5
                  ).length;
                  return (
                    <div
                      key={place.id}
                      className="p-4 rounded-2xl bg-[#fafbfa] border border-[#eff1ee] flex items-center justify-between gap-3 hover:bg-[#f4f5f4] transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectPlace(place);
                        }}
                        className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                      >
                        <MapPin className="w-5 h-5 text-[#202320] shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-[15px] font-bold text-[#202320] truncate">{place.name}</h4>
                          <p className="text-xs text-[#8c948a] truncate mt-0.5">
                            기록 {placeMemosCount}개 · {place.habitatType}
                          </p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onRemoveBookmarkPlace(place.id)}
                          className="p-1 text-[#8c948a] hover:text-[#ff5100] cursor-pointer"
                          aria-label="장소 즐겨찾기 해제"
                        >
                          <Bookmark className="w-4 h-4 fill-current text-[#202320]" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-[#8c948a]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* ============================================================================
   41 내 메모 관리 모달 (선택 삭제 · 체크박스 · 하단 "N개 삭제하기" 블랙 버튼)
   ============================================================================ */
export interface ManageMemosModalProps {
  isOpen: boolean;
  onClose: () => void;
  memos: CommunityMemo[];
  onDeleteMemos: (memoIds: string[]) => void;
  onSelectMemo?: (memo: CommunityMemo) => void;
}

export const ManageMemosModal: React.FC<ManageMemosModalProps> = ({
  isOpen,
  onClose,
  memos,
  onDeleteMemos,
  onSelectMemo,
}) => {
  const ownMemos = useMemo(() => memos.filter((m) => m.authorId === 'me'), [memos]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) setSelectedIds(new Set());
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    onDeleteMemos(Array.from(selectedIds));
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#fbfbfb] sm:bg-black/50 sm:backdrop-blur-xs p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-[#fbfbfb] sm:rounded-[28px] shadow-2xl sm:border sm:border-[#e6e9e5] overflow-hidden flex flex-col"
        >
          {/* Header (41) */}
          <div className="px-4 pt-3 pb-3 border-b border-[#efefef] bg-[#fbfbfb] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] flex items-center justify-center text-[#202320] cursor-pointer shadow-2xs"
              aria-label="뒤로"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-[17px] font-bold text-[#202320]">내 메모 관리</h3>
            <div className="w-10" />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-none divide-y divide-[#f4f5f4]">
            {ownMemos.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-[#8c948a] text-xs">
                아직 작성한 탐사 메모가 없어요.
              </div>
            ) : (
              ownMemos.map((memo) => {
                const isSelected = selectedIds.has(memo.id);
                return (
                  <div
                    key={memo.id}
                    onClick={() => toggleSelect(memo.id)}
                    className="py-3.5 flex items-center gap-3.5 cursor-pointer select-none"
                  >
                    {/* Checkbox (41) */}
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-black text-white'
                          : 'border border-[#c4c7c3] bg-white'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-transparent stroke-[2]" />
                      )}
                    </div>

                    {/* Thumbnail */}
                    {memo.photoUrl ? (
                      <img
                        src={memo.photoUrl}
                        alt={memo.speciesKoreanName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-2xl object-cover shrink-0 bg-[#f4f5f4]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-[#f4f5f4] border border-[#e6e9e5] flex items-center justify-center shrink-0">
                        <Camera className="w-5 h-5 text-[#8c948a]" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[15px] font-bold text-[#202320] truncate">
                        {memo.speciesKoreanName}
                      </h4>
                      <p className="text-xs text-[#8c948a] truncate mt-0.5">
                        {memo.category ? getSpeciesTaxonomyCategoryLabel(memo.category) : '생물'} · {memo.placeName} · {memo.createdAt}
                      </p>
                    </div>

                    <span className="text-xs text-[#8c948a] shrink-0 tabular-nums">
                      {memo.createdAt}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Fixed Action Button (41) */}
          <div className="p-4 bg-[#fbfbfb] border-t border-[#efefef] shrink-0">
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleDeleteSelected}
              className={`w-full h-13 rounded-2xl font-bold text-[15px] flex items-center justify-center transition-all cursor-pointer ${
                selectedIds.size > 0
                  ? 'bg-black text-white active:scale-[0.99]'
                  : 'bg-[#e6e9e5] text-[#8c948a] cursor-not-allowed'
              }`}
            >
              {selectedIds.size > 0 ? `${selectedIds.size}개 삭제하기` : '삭제할 메모를 선택해 주세요'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* ============================================================================
   67 / 68c 알림 모달 (새 알림 · 이전 알림 · 모두 읽음 · 신고 처리 결과 68c 배지)
   ============================================================================ */
export interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: MapNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onSelectMemoById: (memoId: string) => void;
  onOpenAttendanceModal?: () => void;
  onOpenReportHistory?: () => void;
  showCommunity: boolean;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onSelectMemoById,
  onOpenAttendanceModal,
  onOpenReportHistory,
  showCommunity,
}) => {
  const [selectedReportOutcome, setSelectedReportOutcome] = useState<ReportHistoryItem | null>(null);

  if (!isOpen) return null;

  const unreadNotifs = notifications.filter((n) => !n.isRead);
  const readNotifs = notifications.filter((n) => n.isRead);

  const getNotifIcon = (type: MapNotification['type']) => {
    switch (type) {
      case 'comment':
        return MessageCircle;
      case 'like':
        return Heart;
      case 'nearby':
        return MapPin;
      case 'safety':
        return Flag;
      default:
        return Sparkles;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#fbfbfb] sm:bg-black/50 sm:backdrop-blur-xs p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-[#fbfbfb] sm:rounded-[28px] shadow-2xl sm:border sm:border-[#e6e9e5] overflow-hidden flex flex-col"
        >
          {/* Header (67) */}
          <div className="px-4 pt-3 pb-3 border-b border-[#efefef] bg-[#fbfbfb] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] flex items-center justify-center text-[#202320] cursor-pointer shadow-2xs"
              aria-label="뒤로"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-[17px] font-bold text-[#202320]">알림</h3>
            <div className="w-10" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none">
            {/* 새 알림 (67) */}
            {unreadNotifs.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[17px] font-bold text-[#202320]">새 알림</h4>
                  <button
                    type="button"
                    onClick={onMarkAllNotificationsRead}
                    className="text-xs font-semibold text-[#8c948a] hover:text-[#202320] cursor-pointer"
                  >
                    모두 읽음
                  </button>
                </div>

                <div className="divide-y divide-[#f4f5f4]">
                  {unreadNotifs.map((notif) => {
                    const Icon = getNotifIcon(notif.type);
                    const isReportOutcome = notif.title.includes('신고');
                    const isHidden = notif.body.includes('숨김');

                    return (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => {
                          onMarkNotificationRead(notif.id);
                          if (isReportOutcome) {
                            setSelectedReportOutcome({
                              id: notif.id,
                              targetTitle: notif.title,
                              reason: '가이드라인 검토',
                              date: notif.createdAt,
                              status: isHidden ? 'resolved_hidden' : 'resolved_kept',
                              statusLabel: isHidden ? '조치 완료' : '문제 없음으로 판단',
                              detail: notif.body,
                            });
                            return;
                          }
                          if (notif.targetMemoId) {
                            onClose();
                            onSelectMemoById(notif.targetMemoId);
                            return;
                          }
                          if (notif.title.includes('출석')) {
                            onClose();
                            onOpenAttendanceModal?.();
                          }
                        }}
                        className="w-full py-3.5 px-1 flex items-start justify-between gap-3 text-left cursor-pointer hover:bg-[#f4f5f4]/50 rounded-2xl transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[#f4f5f4] text-[#202320] flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[14px] font-bold text-[#202320]">{notif.title}</span>
                              {isReportOutcome && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isHidden
                                      ? 'bg-[#ebebeb] text-[#202320]'
                                      : 'bg-[#d2f347] text-[#202320]'
                                  }`}
                                >
                                  {isHidden ? '숨김 처리' : '유지'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#626961] mt-0.5 leading-relaxed">{notif.body}</p>
                            <span className="text-[11px] font-semibold text-[#8c948a] mt-1 block">
                              {notif.createdAt}
                            </span>
                          </div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-[#ff5100] shrink-0 mt-2" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 이전 알림 (67) */}
            <div className="space-y-3">
              <h4 className="text-[17px] font-bold text-[#202320]">이전 알림</h4>
              {readNotifs.length === 0 ? (
                <p className="text-xs text-[#8c948a] py-4">이전 알림이 없어요.</p>
              ) : (
                <div className="divide-y divide-[#f4f5f4]">
                  {readNotifs.map((notif) => {
                    const Icon = getNotifIcon(notif.type);
                    return (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => {
                          if (notif.targetMemoId) {
                            onClose();
                            onSelectMemoById(notif.targetMemoId);
                          }
                        }}
                        className="w-full py-3.5 px-1 flex items-start justify-between gap-3 text-left cursor-pointer hover:bg-[#f4f5f4]/50 rounded-2xl transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[#f4f5f4] text-[#202320] flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[14px] font-bold text-[#202320] block">{notif.title}</span>
                            <p className="text-xs text-[#626961] mt-0.5 leading-relaxed">{notif.body}</p>
                            <span className="text-[11px] font-semibold text-[#8c948a] mt-1 block">
                              {notif.createdAt}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 68c 신고 결과 팝업 */}
      <ReportOutcomeDetailModal
        report={selectedReportOutcome}
        onClose={() => setSelectedReportOutcome(null)}
      />
    </AnimatePresence>
  );
};

/* ============================================================================
   68 신고 내역 모달 (상태 배지 · 검토 중 / 조치 완료 / 문제 없음 판단)
   ============================================================================ */
export interface ReportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportHistoryModal: React.FC<ReportHistoryModalProps> = ({ isOpen, onClose }) => {
  const [selectedOutcome, setSelectedOutcome] = useState<ReportHistoryItem | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#fbfbfb] sm:bg-black/50 sm:backdrop-blur-xs p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-[#fbfbfb] sm:rounded-[28px] shadow-2xl sm:border sm:border-[#e6e9e5] overflow-hidden flex flex-col"
        >
          {/* Header (68) */}
          <div className="px-4 pt-3 pb-3 border-b border-[#efefef] bg-[#fbfbfb] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] flex items-center justify-center text-[#202320] cursor-pointer shadow-2xs"
              aria-label="뒤로"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-[17px] font-bold text-[#202320]">신고 내역</h3>
            <div className="w-10" />
          </div>

          {/* List of reports (68) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
            {INITIAL_REPORT_HISTORY_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedOutcome(item)}
                className="w-full p-4 rounded-2xl bg-[#fafbfa] border border-[#eff1ee] flex items-center justify-between gap-3 text-left hover:bg-[#f4f5f4] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Flag className="w-5 h-5 text-[#202320] shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-[15px] font-bold text-[#202320] truncate">{item.targetTitle}</h4>
                    <p className="text-xs text-[#8c948a] truncate mt-0.5">
                      {item.reason} · {item.date} · {item.statusLabel}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8c948a] shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <ReportOutcomeDetailModal
        report={selectedOutcome}
        onClose={() => setSelectedOutcome(null)}
      />
    </AnimatePresence>
  );
};

/* ============================================================================
   69 탐험 수칙 모달 (생물에게도, 다른 탐험가에게도 안전한 기록)
   ============================================================================ */
export const ExplorerRulesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const rules = [
    {
      num: 1,
      title: '가까이 가지 말고 멀리서 관찰해요',
      desc: '생물이 놀라지 않도록 거리를 두고 촬영해요.',
    },
    {
      num: 2,
      title: '둥지·번식지는 정확한 위치를 숨겨요',
      desc: '보호가 필요한 곳은 대략적 위치만 공개해요.',
    },
    {
      num: 3,
      title: '채집하거나 옮기지 않아요',
      desc: '식물과 곤충은 있던 자리에 그대로 둬요.',
    },
    {
      num: 4,
      title: '개인정보가 보이지 않게 올려요',
      desc: '얼굴, 집 주소, 차량 번호가 나온 사진은 피해요.',
    },
    {
      num: 5,
      title: '다른 사람의 기록을 존중해요',
      desc: '욕설·비하·홍보 댓글은 신고 대상이에요.',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#fbfbfb] sm:bg-black/50 sm:backdrop-blur-xs p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-[#fbfbfb] sm:rounded-[28px] shadow-2xl sm:border sm:border-[#e6e9e5] overflow-hidden flex flex-col"
        >
          {/* Header (69) */}
          <div className="px-4 pt-3 pb-3 border-b border-[#efefef] bg-[#fbfbfb] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] flex items-center justify-center text-[#202320] cursor-pointer shadow-2xs"
              aria-label="뒤로"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-[17px] font-bold text-[#202320]">탐험 수칙</h3>
            <div className="w-10" />
          </div>

          <div className="p-5 overflow-y-auto space-y-5 scrollbar-none flex-1">
            <div>
              <h2 className="text-[20px] font-bold text-[#202320] leading-tight">
                생물에게도, 다른 탐험가에게도 안전한 기록
              </h2>
              <p className="text-xs text-[#8c948a] mt-1.5">
                아래 수칙을 지키면 모두가 오래 즐길 수 있어요.
              </p>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.num}
                  className="p-4 rounded-2xl bg-[#fafbfa] border border-[#eff1ee] flex items-start gap-3.5"
                >
                  <div className="w-7 h-7 rounded-full bg-[#dcf348] text-[#202320] font-bold text-xs flex items-center justify-center shrink-0">
                    {rule.num}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#202320]">{rule.title}</h4>
                    <p className="text-xs text-[#8c948a] mt-0.5 leading-relaxed">{rule.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* ============================================================================
   58 탐험맵 설정 모달 (공개·프라이버시 / 위치 / 탐험맵 알림 통합)
   ============================================================================ */
export interface MapSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats?: UserStats;
  onUpdateStats?: (patch: Partial<UserStats>) => void;
  onUpdateMapSettings?: (patch: NonNullable<UserStats['mapSettings']>) => void;
  onTogglePushDiscoveryAlerts?: () => void;
  hideProtectedLocations: boolean;
  onToggleHideProtected: () => void;
  blockedUserIds?: string[];
  onUnblockUser?: (userId: string) => void;
  locationPermissionDenied?: boolean;
  onRequestLocationPermission?: () => void;
  showCommunity: boolean;
}

export const MapSettingsModal: React.FC<MapSettingsModalProps> = ({
  isOpen,
  onClose,
  userStats,
  onUpdateStats,
  onUpdateMapSettings,
  onTogglePushDiscoveryAlerts,
  hideProtectedLocations,
  onToggleHideProtected,
  blockedUserIds = [],
  onUnblockUser,
  locationPermissionDenied = false,
  onRequestLocationPermission,
  showCommunity,
}) => {
  const [isBlockedSubView, setIsBlockedSubView] = useState(false);

  useEffect(() => {
    if (!isOpen) setIsBlockedSubView(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const mapSettings = userStats?.mapSettings || {
    defaultVisibility: 'public',
    hideExactLocation: hideProtectedLocations,
    notifyComment: true,
    notifyLike: true,
    notifyReply: false,
    notifyNearby: false,
    notifyBadge: true,
  };
  const badgePublicOn = userStats?.badgeHistoryPublic !== false;
  const hideFromRankingOn = Boolean(userStats?.hideFromRanking);
  const masterMapAlertOn = Boolean(userStats?.pushDiscoveryAlerts);

  const renderToggle = (isOn: boolean, onClick: () => void, ariaLabel: string) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isOn}
      className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center shrink-0 cursor-pointer ${
        isOn ? 'bg-black justify-end' : 'bg-[#e6e9e5] justify-start'
      }`}
    >
      <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
    </button>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#fbfbfb] sm:bg-black/50 sm:backdrop-blur-xs p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-[#fbfbfb] sm:rounded-[28px] shadow-2xl sm:border sm:border-[#e6e9e5] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-4 pt-3 pb-3 border-b border-[#efefef] bg-[#fbfbfb] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => (isBlockedSubView ? setIsBlockedSubView(false) : onClose())}
              className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] flex items-center justify-center text-[#202320] cursor-pointer shadow-2xs"
              aria-label="뒤로"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-[17px] font-bold text-[#202320]">
              {isBlockedSubView ? '차단한 탐험가' : '탐험맵 설정'}
            </h3>
            <div className="w-10" />
          </div>

          {isBlockedSubView ? (
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 scrollbar-none">
              {blockedUserIds.length === 0 ? (
                <div className="py-16 text-center text-[13px] text-[#8c948a]">
                  차단한 탐험가가 없어요.
                </div>
              ) : (
                blockedUserIds.map((uid) => (
                  <div
                    key={uid}
                    className="p-4 rounded-[20px] bg-white border border-[#e6e9e5] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-9 h-9 rounded-full bg-[#f4f5f4] flex items-center justify-center text-sm shrink-0">
                        {INITIAL_EXPLORER_PROFILES[uid]?.avatarEmoji || '🧭'}
                      </span>
                      <span className="text-[14px] font-bold text-[#202320] truncate">
                        {INITIAL_EXPLORER_PROFILES[uid]?.name || uid}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUnblockUser?.(uid)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#f4f5f4] hover:bg-[#eaede9] text-[12px] font-bold text-[#202320] cursor-pointer shrink-0"
                    >
                      해제
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="p-4 overflow-y-auto space-y-6 flex-1 scrollbar-none">
              {/* 공개 · 프라이버시 */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#8c948a] px-1">공개 · 프라이버시</h4>
                <div className="bg-white rounded-2xl border border-[#e6e9e5] divide-y divide-[#f4f5f4]">
                  {showCommunity && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const order: ('public' | 'nearby' | 'private')[] = ['public', 'nearby', 'private'];
                          const cur = mapSettings.defaultVisibility || 'public';
                          const next = order[(order.indexOf(cur) + 1) % order.length];
                          onUpdateMapSettings?.({ ...mapSettings, defaultVisibility: next });
                        }}
                        className="w-full px-4 py-3.5 flex items-center justify-between text-left cursor-pointer"
                      >
                        <span className="text-[15px] font-semibold text-[#202320]">메모 공개 범위</span>
                        <span className="text-[13px] text-[#8c948a] flex items-center gap-1">
                          {mapSettings.defaultVisibility === 'nearby'
                            ? '주변 탐험가만'
                            : mapSettings.defaultVisibility === 'private'
                            ? '나만 보기'
                            : '전체 공개'}
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </button>

                      <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[15px] font-semibold text-[#202320] block">
                            보호종 정확한 위치 숨기기
                          </span>
                          <span className="text-xs text-[#8c948a] mt-0.5 block">
                            지도와 메모에 대략적인 반경으로만 표시돼요
                          </span>
                        </div>
                        {renderToggle(hideProtectedLocations, onToggleHideProtected, '보호종 정확한 위치 숨기기')}
                      </div>

                      <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[15px] font-semibold text-[#202320] block">뱃지 이력 공개</span>
                          <span className="text-xs text-[#8c948a] mt-0.5 block">
                            내 탐험 프로필에 획득한 뱃지를 보여 줘요
                          </span>
                        </div>
                        {renderToggle(
                          badgePublicOn,
                          () => onUpdateStats?.({ badgeHistoryPublic: !badgePublicOn }),
                          '뱃지 이력 공개'
                        )}
                      </div>

                      <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[15px] font-semibold text-[#202320] block">랭킹에서 숨기기</span>
                          <span className="text-xs text-[#8c948a] mt-0.5 block">
                            탐험 랭킹에 내 이름이 나타나지 않아요
                          </span>
                        </div>
                        {renderToggle(
                          hideFromRankingOn,
                          () => onUpdateStats?.({ hideFromRanking: !hideFromRankingOn }),
                          '랭킹에서 숨기기'
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsBlockedSubView(true)}
                        className="w-full px-4 py-3.5 flex items-center justify-between text-left cursor-pointer"
                      >
                        <span className="text-[15px] font-semibold text-[#202320]">차단한 탐험가</span>
                        <span className="text-[13px] text-[#8c948a] flex items-center gap-1 tabular-nums">
                          {blockedUserIds.length}명
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => onRequestLocationPermission?.()}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left cursor-pointer"
                  >
                    <span className="text-[15px] font-semibold text-[#202320]">위치 권한</span>
                    <span className="text-[13px] text-[#8c948a] flex items-center gap-1">
                      {locationPermissionDenied ? '꺼짐 · 다시 요청' : '허용됨'}
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </button>
                </div>
              </div>

              {/* 탐험맵 알림 (전체 스위치 + 세부 알림) */}
              <div className="space-y-2 pb-4">
                <h4 className="text-xs font-semibold text-[#8c948a] px-1">탐험맵 알림</h4>
                <div className="bg-white rounded-2xl border border-[#e6e9e5] divide-y divide-[#f4f5f4]">
                  {showCommunity && (
                    <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[15px] font-semibold text-[#202320] block">탐험맵 알림 전체</span>
                        <span className="text-xs text-[#8c948a] mt-0.5 block">
                          끄면 탐험맵 활동 알림을 받지 않아요
                        </span>
                      </div>
                      {renderToggle(
                        masterMapAlertOn,
                        () => onTogglePushDiscoveryAlerts?.(),
                        '탐험맵 알림 전체'
                      )}
                    </div>
                  )}

                  {showCommunity && (
                    <div className={`divide-y divide-[#f4f5f4] transition-opacity ${!masterMapAlertOn ? 'opacity-40 pointer-events-none' : ''}`}>
                      <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                        <span className="text-[15px] font-semibold text-[#202320]">댓글</span>
                        {renderToggle(
                          Boolean(mapSettings.notifyComment),
                          () => onUpdateMapSettings?.({ ...mapSettings, notifyComment: !mapSettings.notifyComment }),
                          '댓글 알림'
                        )}
                      </div>
                      <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                        <span className="text-[15px] font-semibold text-[#202320]">하트</span>
                        {renderToggle(
                          Boolean(mapSettings.notifyLike),
                          () => onUpdateMapSettings?.({ ...mapSettings, notifyLike: !mapSettings.notifyLike }),
                          '하트 알림'
                        )}
                      </div>
                      <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                        <span className="text-[15px] font-semibold text-[#202320]">답글</span>
                        {renderToggle(
                          Boolean(mapSettings.notifyReply),
                          () => onUpdateMapSettings?.({ ...mapSettings, notifyReply: !mapSettings.notifyReply }),
                          '답글 알림'
                        )}
                      </div>
                    </div>
                  )}

                  <div className={`px-4 py-3.5 flex items-center justify-between gap-3 transition-opacity ${showCommunity && !masterMapAlertOn ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div>
                      <span className="text-[15px] font-semibold text-[#202320] block">주변 새 기록</span>
                      <span className="text-xs text-[#8c948a] mt-0.5 block">1km 안에 새 메모가 올라오면</span>
                    </div>
                    {renderToggle(
                      Boolean(mapSettings.notifyNearby),
                      () => onUpdateMapSettings?.({ ...mapSettings, notifyNearby: !mapSettings.notifyNearby }),
                      '주변 새 기록 알림'
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* ============================================================================
   H-11 탐험 랭킹 모달
   ============================================================================ */
export interface ExplorerRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAccount?: UserAccount;
  userStats?: UserStats;
  collectedCount?: number;
  ownMemosCount: number;
  explorerProfiles: Record<string, ExplorerProfile>;
}

export const ExplorerRankingModal: React.FC<ExplorerRankingModalProps> = ({
  isOpen,
  onClose,
  userAccount,
  userStats,
  collectedCount = 0,
  ownMemosCount,
  explorerProfiles,
}) => {
  if (!isOpen) return null;

  const { under14, showCommunity } = getUnder14DesignFlags(userAccount);
  const myExp = Math.max(userStats?.exp || 0, collectedCount * NEW_SPECIES_XP_REWARD);
  const myLevel = getLevelFromXp(myExp);
  const myTitle = getTitleAdjectiveForLevel(myLevel);

  const rankingList = [
    ...(Object.values(explorerProfiles) as ExplorerProfile[]).map((p) => ({
      id: p.id,
      name: p.name,
      avatarEmoji: p.avatarEmoji,
      titleBadge: p.titleBadge,
      speciesCount: p.speciesCount,
      memoCount: p.memoCount,
      level: EXPLORER_LEVEL_RANKING_SEED[p.id] || Math.max(3, Math.floor(p.speciesCount / 3)),
      isMe: false,
    })),
    ...(showCommunity && !userStats?.hideFromRanking && userAccount?.isLoggedIn
      ? [
          {
            id: 'me',
            name: userAccount.name,
            avatarEmoji: '🧭',
            titleBadge: `${myTitle} 탐험가`,
            speciesCount: collectedCount,
            memoCount: ownMemosCount,
            level: myLevel,
            isMe: true,
          },
        ]
      : []),
  ].sort((a, b) => b.speciesCount - a.speciesCount || b.level - a.level);

  const myRankIndex = rankingList.findIndex((r) => r.isMe);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#fbfbfb] sm:bg-black/50 sm:backdrop-blur-xs p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-[#fbfbfb] sm:rounded-[28px] shadow-2xl sm:border sm:border-[#e6e9e5] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-4 pt-3 pb-3 border-b border-[#efefef] bg-[#fbfbfb] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] flex items-center justify-center text-[#202320] cursor-pointer shadow-2xs"
              aria-label="뒤로"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-[17px] font-bold text-[#202320]">탐험 랭킹</h3>
            <div className="w-10" />
          </div>

          <div className="p-4 overflow-y-auto space-y-3.5 flex-1 scrollbar-none">
            {under14 ? (
              <div className="p-4 rounded-2xl bg-[#f4fbdd] border border-[#c4eb43] text-xs text-[#202320] space-y-1">
                <div className="font-bold text-[#6d8911] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>만 14세 미만 랭킹 읽기 전용 모드</span>
                </div>
                <p className="text-[11px] text-[#555c54] leading-relaxed">
                  다른 탐험가들의 순위를 구경할 수 있으며, 내 순위는 공개 랭킹에 노출되지 않아요.
                </p>
              </div>
            ) : myRankIndex >= 0 ? (
              <div className="p-4 rounded-2xl bg-black text-white flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-white/60 font-medium">내 탐험 랭킹</div>
                  <div className="text-[15px] font-bold mt-0.5 tabular-nums">
                    전체 {myRankIndex + 1}위 · Lv.{myLevel} {myTitle} 탐험가
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[16px] font-bold text-[#c4eb43] tabular-nums">{collectedCount}종</div>
                  <div className="text-[10px] text-white/60">도감 등록</div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white border border-[#e6e9e5] text-xs text-[#626961]">
                로그인하면 내 도감 순위도 함께 집계돼요.
              </div>
            )}

            <div className="space-y-2">
              {rankingList.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    item.isMe ? 'bg-[#f4fbdd] border-[#c4eb43]' : 'bg-white border-[#e6e9e5]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 text-center text-xs font-bold tabular-nums shrink-0 ${
                        idx < 3 ? 'text-[#202320]' : 'text-[#8c948a]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-[#f4f5f4] flex items-center justify-center text-base shrink-0">
                      {item.avatarEmoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-[#202320] truncate">
                          {item.name}
                          {item.isMe ? ' (나)' : ''}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#f4f5f4] text-[#626961] tabular-nums shrink-0">
                          Lv.{item.level}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8c948a] truncate">{item.titleBadge}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-[#202320] tabular-nums">{item.speciesCount}종</div>
                    <div className="text-[10px] text-[#8c948a] tabular-nums">메모 {item.memoCount}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* ============================================================================
   MapMenuDrawerModal (상단 햄버거 ☰ 버튼 클릭 시 나타나는 메인 네비게이션 드로어)
   ============================================================================ */
export interface MapMenuDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAccount?: UserAccount;
  userStats?: UserStats;
  collectedCount?: number;
  unreadNotificationsCount?: number;
  ownMemosCount?: number;
  savedItemsCount?: number;
  onNavigate: (
    target: 'profile' | 'favorites' | 'ranking' | 'manage_memos' | 'notifications' | 'reports' | 'rules' | 'settings'
  ) => void;
}

export const MapMenuDrawerModal: React.FC<MapMenuDrawerModalProps> = ({
  isOpen,
  onClose,
  userAccount,
  userStats,
  collectedCount = 0,
  unreadNotificationsCount = 0,
  ownMemosCount = 0,
  savedItemsCount = 0,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const myExp = Math.max(userStats?.exp || 0, collectedCount * NEW_SPECIES_XP_REWARD);
  const myLevel = getLevelFromXp(myExp);
  const myTitle = getTitleAdjectiveForLevel(myLevel);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs">
        <div className="fixed inset-0" onClick={onClose} />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-xs h-full bg-[#fbfbfb] shadow-2xl flex flex-col z-10 border-l border-[#e6e9e5]"
        >
          {/* Header */}
          <div className="p-4 pt-5 pb-3 flex items-center justify-between border-b border-[#efefef] bg-white">
            <h3 className="text-[17px] font-bold text-[#202320]">탐험 메뉴</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#f4f5f4] flex items-center justify-center text-[#202320] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-none">
            {/* User Profile Card */}
            <div className="p-4 rounded-2xl bg-white border border-[#e6e9e5] shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#fdf6dc] border border-[#e6e9e5] flex items-center justify-center text-lg font-bold text-[#202320] shrink-0">
                  {userAccount?.isLoggedIn && userAccount.name ? userAccount.name.slice(0, 1) : '🧭'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-bold text-[#202320] truncate">
                      {userAccount?.name || '탐험가'}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f4fbdd] text-[#6d8911]">
                      Lv.{myLevel}
                    </span>
                  </div>
                  <p className="text-xs text-[#8c948a] truncate mt-0.5">{myTitle} 탐험가</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('profile');
                }}
                className="w-full py-2 px-3 rounded-xl bg-[#f4f5f4] hover:bg-[#eaede9] text-xs font-bold text-[#202320] flex items-center justify-between cursor-pointer"
              >
                <span>내 탐험 프로필 보기</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#8c948a]" />
              </button>
            </div>

            {/* Group 1: 주요 탐험 활동 */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#8c948a] px-1 uppercase tracking-wider">
                탐험 둘러보기
              </span>
              <div className="bg-white rounded-2xl border border-[#e6e9e5] divide-y divide-[#f4f5f4] overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('favorites');
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#fafbfa] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Bookmark className="w-4 h-4 text-[#202320]" />
                    <span className="text-[14px] font-bold text-[#202320]">즐겨찾기</span>
                  </div>
                  <span className="text-xs text-[#8c948a] flex items-center gap-1 tabular-nums">
                    {savedItemsCount}개
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('ranking');
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#fafbfa] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="w-4 h-4 text-[#202320]" />
                    <span className="text-[14px] font-bold text-[#202320]">탐험 랭킹</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8c948a]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('manage_memos');
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#fafbfa] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-[#202320]" />
                    <span className="text-[14px] font-bold text-[#202320]">내 메모 관리</span>
                  </div>
                  <span className="text-xs text-[#8c948a] flex items-center gap-1 tabular-nums">
                    {ownMemosCount}개
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </button>
              </div>
            </div>

            {/* Group 2: 소식 & 커뮤니티 보호 */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#8c948a] px-1 uppercase tracking-wider">
                소식 & 커뮤니티 보호
              </span>
              <div className="bg-white rounded-2xl border border-[#e6e9e5] divide-y divide-[#f4f5f4] overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('notifications');
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#fafbfa] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-[#202320]" />
                    <span className="text-[14px] font-bold text-[#202320]">알림 내역</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {unreadNotificationsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#ff5100] text-white text-[10px] font-bold">
                        {unreadNotificationsCount}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#8c948a]" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('reports');
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#fafbfa] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Flag className="w-4 h-4 text-[#202320]" />
                    <span className="text-[14px] font-bold text-[#202320]">신고 내역</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8c948a]" />
                </button>
              </div>
            </div>

            {/* Group 3: 안내 & 탐험맵 설정 */}
            <div className="space-y-1.5 pb-4">
              <span className="text-[11px] font-bold text-[#8c948a] px-1 uppercase tracking-wider">
                안내 & 설정
              </span>
              <div className="bg-white rounded-2xl border border-[#e6e9e5] divide-y divide-[#f4f5f4] overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('rules');
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#fafbfa] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-[#202320]" />
                    <span className="text-[14px] font-bold text-[#202320]">탐험 수칙</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8c948a]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('settings');
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#fafbfa] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-[#202320]" />
                    <span className="text-[14px] font-bold text-[#202320]">탐험맵 설정</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8c948a]" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
