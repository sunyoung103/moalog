import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Specimen,
  UserStats,
  NaturalistPersona,
  UserAccount,
  CommunityMemo,
  ExplorerProfile,
  MapNotification,
  MemoReportReason,
  PublicSpecimenEntry,
} from '../types';
import {
  Camera,
  Crosshair,
  ChevronDown,
  ChevronRight,
  X,
  Search,
  User,
  Bookmark,
  Heart,
  PenSquare,
  Layers,
  AlertTriangle,
  Menu,
  Trophy,
  Flag,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import { NATURALIST_PERSONAS } from '../data/hotspots';
import {
  BIOBLITZ_HOTSPOTS,
  BioBlitzCenter,
  INITIAL_COMMUNITY_MEMOS,
  INITIAL_EXPLORER_PROFILES,
  INITIAL_MAP_NOTIFICATIONS,
  MAP_COMMUNITY_STORAGE_KEYS,
  detectProtectedSpecies,
} from '../data/communityMapData';
import { obfuscateCoordinates } from '../utils/imagePrivacy';
import {
  PlaceDetailModal,
  MapSearchPlacesModal,
  MemoDetailModal,
  PublicSpecimenDataModal,
  WriteMemoModal,
  ExplorerProfileModal,
  FavoritesModal,
  ManageMemosModal,
  NotificationsModal,
  ReportHistoryModal,
  ExplorerRulesModal,
  MapSettingsModal,
  ExplorerRankingModal,
  MapMenuDrawerModal,
  ClusterRecordsModal,
  ClusterAreaGroup,
  recordRecentViewedSpecies,
} from './MapCommunityModals';
import { getUnder14DesignFlags } from '../utils/levelPolicy';
import { getExplorerTitleInfo } from '../utils/explorerTitles';
import { getSpeciesTaxonomyCategoryLabel } from '../utils/speciesNameHelper';

interface FieldMapViewProps {
  specimens: Specimen[];
  userStats?: UserStats;
  userAccount?: UserAccount;
  onUpdatePersona?: (persona: NaturalistPersona) => void;
  onUpdateStats?: (patch: Partial<UserStats>) => void;
  onUpdateMapSettings?: (patch: NonNullable<UserStats['mapSettings']>) => void;
  onTogglePushDiscoveryAlerts?: () => void;
  onOpenAttendanceModal?: () => void;
  onSelectSpecimen: (specimen: Specimen) => void;
  onOpenLens?: () => void;
  onOpenExportCard?: (specimen?: Specimen, mode?: 'specimen' | 'summary') => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  isProUser?: boolean;
  onOpenPaywall?: () => void;
  onOpenLoginModal?: () => void;
  onOpenMyPage?: () => void;
  openMapSettingsNonce?: number;
  onConsumeOpenMapSettings?: () => void;
  onShowToast?: (msg: string) => void;
}

type MapLayerType = 'eco' | 'satellite' | 'terrain';
type MapCategoryFilter =
  | 'all'
  | 'plants'
  | 'insects'
  | 'birds'
  | 'mammals'
  | 'herptiles'
  | 'fishes'
  | 'fungi';

const MAP_CATEGORY_FILTERS: {
  id: MapCategoryFilter;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { id: 'all', label: '전체', emoji: '', color: '#202320' },
  { id: 'plants', label: '식물', emoji: '🌿', color: '#4d9a2a' },
  { id: 'insects', label: '곤충', emoji: '🐝', color: '#e0a800' },
  { id: 'birds', label: '조류', emoji: '🐦', color: '#5b8cc8' },
  { id: 'mammals', label: '포유류', emoji: '🐿️', color: '#b8682b' },
  { id: 'herptiles', label: '양서·파충류', emoji: '🦎', color: '#1b9e77' },
  { id: 'fishes', label: '어류', emoji: '🐟', color: '#2b5cc8' },
  { id: 'fungi', label: '균류', emoji: '🍄', color: '#8b4c39' },
];

const TILE_SERVERS: Record<MapLayerType, { url: string; maxZoom: number; label: string }> = {
  eco: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    label: '일반',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    label: '위성',
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    label: '지형',
  },
};

function matchesMapCategory(category: Specimen['category'] | undefined, filter: MapCategoryFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'herptiles') return category === 'reptiles' || category === 'amphibians';
  return category === filter;
}

function getCategoryPinStyle(category: Specimen['category'] | undefined): { emoji: string; border: string } {
  switch (category) {
    case 'plants':
      return { emoji: '🌿', border: '#4d9a2a' };
    case 'insects':
      return { emoji: '🐝', border: '#e0a800' };
    case 'birds':
      return { emoji: '🐦', border: '#5b8cc8' };
    case 'mammals':
      return { emoji: '🐿️', border: '#b8682b' };
    case 'reptiles':
    case 'amphibians':
      return { emoji: '🦎', border: '#1b9e77' };
    case 'fishes':
      return { emoji: '🐟', border: '#2b5cc8' };
    case 'fungi':
      return { emoji: '🍄', border: '#8b4c39' };
    default:
      return { emoji: '🧭', border: '#6d8911' };
  }
}

function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistLabel(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round(km * 1000))}m`;
  return `${km.toFixed(1)}km`;
}

function getScoreGradeBadge(score?: number): { grade: 'S' | 'A' | 'B'; bg: string } {
  const val = typeof score === 'number' ? score : 88;
  if (val >= 90) return { grade: 'S', bg: 'bg-gradient-to-br from-[#52b8ff] to-[#2563eb] text-white' };
  if (val >= 75) return { grade: 'A', bg: 'bg-gradient-to-br from-[#f6d365] to-[#d97706] text-white' };
  return { grade: 'B', bg: 'bg-[#8c948a] text-white' };
}

function getSpecimenGpsCoord(sp: Specimen, index: number): { lat: number; lng: number; regionTag: string } {
  if (typeof sp.locationCoord?.lat === 'number' && typeof sp.locationCoord?.lng === 'number') {
    return {
      lat: sp.locationCoord.lat,
      lng: sp.locationCoord.lng,
      regionTag: sp.locationCoord.city || '지정 위치',
    };
  }

  const fullText = `${sp.locationCoord?.city || ''} ${sp.locationCoord?.name || ''} ${sp.observations?.[0]?.location || ''} ${sp.koreanName}`;
  let baseLat = 37.5445;
  let baseLng = 127.0374;
  let regionTag = '서울숲';

  if (fullText.includes('제주') || fullText.includes('토끼섬') || fullText.includes('곶자왈') || fullText.includes('문섬')) {
    baseLat = 33.2858;
    baseLng = 126.2753;
    regionTag = '제주';
  } else if (fullText.includes('남산') || fullText.includes('한남')) {
    baseLat = 37.5492;
    baseLng = 126.993;
    regionTag = '남산';
  } else if (fullText.includes('올림픽공원') || fullText.includes('몽촌') || fullText.includes('잠실')) {
    baseLat = 37.5209;
    baseLng = 127.1214;
    regionTag = '올림픽공원';
  } else if (fullText.includes('샛강') || fullText.includes('여의도')) {
    baseLat = 37.5186;
    baseLng = 126.9242;
    regionTag = '여의도';
  } else if (fullText.includes('북한산') || fullText.includes('우이령')) {
    baseLat = 37.6625;
    baseLng = 127.005;
    regionTag = '북한산';
  }

  const hash = (sp.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + index * 19) % 100;
  const angle = (hash / 100) * 2 * Math.PI;
  const radius = 0.003 + ((hash % 11) / 11) * 0.007;

  return {
    lat: baseLat + Math.cos(angle) * radius,
    lng: baseLng + Math.sin(angle) * radius,
    regionTag,
  };
}

function readStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const CLUSTER_AREA_NAME_CACHE = new Map<string, string>();

interface NominatimClusterAddress {
  country?: string;
  country_code?: string;
  state?: string;
  province?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  municipality?: string;
  city_district?: string;
  district?: string;
  borough?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  park?: string;
  natural?: string;
}

function formatGlobalClusterAreaTitle(addr?: NominatimClusterAddress): string | null {
  if (!addr) return null;
  const isKr = addr.country_code?.toLowerCase() === 'kr';
  const rawCity =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.county ||
    addr.municipality ||
    addr.state ||
    addr.province ||
    '';
  const cityShort = isKr
    ? rawCity.replace(/(특별자치시|특별자치도|특별시|광역시)$/g, '').trim()
    : rawCity.trim();
  const subArea = (
    addr.suburb ||
    addr.borough ||
    addr.city_district ||
    addr.district ||
    addr.quarter ||
    addr.neighbourhood ||
    addr.park ||
    addr.natural ||
    ''
  ).trim();

  const parts: string[] = [];
  if (!isKr && addr.country?.trim()) {
    parts.push(addr.country.trim());
  }
  if (cityShort && !parts.some((p) => p.toLowerCase() === cityShort.toLowerCase())) {
    parts.push(cityShort);
  }
  if (subArea && !parts.some((p) => p.toLowerCase() === subArea.toLowerCase())) {
    parts.push(subArea);
  }

  if (parts.length === 0) return null;
  const combined = parts.slice(0, isKr ? 2 : 3).join(' ');
  return combined.endsWith('일대') || combined.endsWith('권역') ? combined : `${combined} 일대`;
}

export const FieldMapView: React.FC<FieldMapViewProps> = ({
  specimens,
  userStats,
  userAccount,
  onUpdateStats,
  onUpdateMapSettings,
  onTogglePushDiscoveryAlerts,
  onOpenAttendanceModal,
  onSelectSpecimen,
  onOpenLens,
  searchQuery = '',
  onSearchChange,
  onOpenLoginModal,
  onOpenMyPage,
  openMapSettingsNonce = 0,
  onConsumeOpenMapSettings,
  onShowToast,
}) => {
  const collectedSpecimens = useMemo(() => {
    return specimens.filter((s) => s.isCollected && !s.isPending);
  }, [specimens]);

  // Leaflet map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const communityGroupRef = useRef<L.LayerGroup | null>(null);
  const radarGroupRef = useRef<L.LayerGroup | null>(null);

  // Map UI states
  const [mapLayer, setMapLayer] = useState<MapLayerType>('eco');
  const [isLayerSheetOpen, setIsLayerSheetOpen] = useState(false);
  const [mapZoom, setMapZoom] = useState<number>(14);
  const [selectedMapCategory, setSelectedMapCategory] = useState<MapCategoryFilter>('all');
  const [radarCenter, setRadarCenter] = useState<BioBlitzCenter>(BIOBLITZ_HOTSPOTS[0]);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Selected Map Pin Inspector States (H-02)
  const [selectedPinSpecimen, setSelectedPinSpecimen] = useState<Specimen | null>(null);
  const [selectedPinMemo, setSelectedPinMemo] = useState<CommunityMemo | null>(null);

  // Bottom Drawer State ('collapsed': H-01/03/07, 'strip': 04/H-03b carousel, 'expanded': H-03 full list)
  const [sheetMode, setSheetMode] = useState<'collapsed' | 'strip' | 'expanded'>('collapsed');
  const [onlyMyMemos, setOnlyMyMemos] = useState(false);
  const [showMySpecimenPins, setShowMySpecimenPins] = useState(true);

  // Community Modals States
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [activePlaceDetail, setActivePlaceDetail] = useState<BioBlitzCenter | null>(null);
  const [activeClusterArea, setActiveClusterArea] = useState<ClusterAreaGroup | null>(null);
  const [activeMemoDetailId, setActiveMemoDetailId] = useState<string | null>(null);
  const [activePublicSpecimen, setActivePublicSpecimen] = useState<PublicSpecimenEntry | null>(null);
  const [isWriteMemoOpen, setIsWriteMemoOpen] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<
    | 'none'
    | 'menu'
    | 'favorites'
    | 'ranking'
    | 'manage_memos'
    | 'notifications'
    | 'reports'
    | 'rules'
    | 'settings'
  >('none');
  const [favoritesInitialTab, setFavoritesInitialTab] = useState<'memo' | 'place'>('memo');

  const { under14, showCommunity } = getUnder14DesignFlags(userAccount);

  // Community Persistent States
  const [communityMemos, setCommunityMemos] = useState<CommunityMemo[]>(() =>
    readStoredJson(MAP_COMMUNITY_STORAGE_KEYS.MEMOS, INITIAL_COMMUNITY_MEMOS)
  );
  const [bookmarkedMemoIds, setBookmarkedMemoIds] = useState<string[]>(() =>
    readStoredJson(MAP_COMMUNITY_STORAGE_KEYS.BOOKMARKS, ['memo-comm-1'])
  );
  const [bookmarkedPlaceIds, setBookmarkedPlaceIds] = useState<string[]>(() =>
    readStoredJson(MAP_COMMUNITY_STORAGE_KEYS.BOOKMARKED_PLACES, ['seoul-forest'])
  );
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() =>
    readStoredJson(MAP_COMMUNITY_STORAGE_KEYS.BLOCKED_USERS, [])
  );
  const [followedUserIds, setFollowedUserIds] = useState<string[]>(() =>
    readStoredJson(MAP_COMMUNITY_STORAGE_KEYS.FOLLOWED_USERS, ['explorer-sol'])
  );
  const [hideProtectedLocations, setHideProtectedLocations] = useState<boolean>(() =>
    readStoredJson(MAP_COMMUNITY_STORAGE_KEYS.HIDE_PROTECTED, true)
  );
  const [notifications, setNotifications] = useState<MapNotification[]>(() =>
    readStoredJson(MAP_COMMUNITY_STORAGE_KEYS.NOTIFICATIONS, INITIAL_MAP_NOTIFICATIONS)
  );

  // Open 탐험맵 설정 when bridged from global 설정
  useEffect(() => {
    if (openMapSettingsNonce > 0) {
      setActiveModal('settings');
      onConsumeOpenMapSettings?.();
    }
  }, [openMapSettingsNonce, onConsumeOpenMapSettings]);

  // Check geolocation permission on mount (for 03 location permission banner)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((res) => {
          setLocationPermissionDenied(res.state === 'denied');
          res.onchange = () => setLocationPermissionDenied(res.state === 'denied');
        })
        .catch(() => {});
    }
  }, []);

  // Sync persistent state
  useEffect(() => {
    try {
      localStorage.setItem(MAP_COMMUNITY_STORAGE_KEYS.MEMOS, JSON.stringify(communityMemos));
    } catch {}
  }, [communityMemos]);

  // Keep own community memos aligned when linked specimen location/species changes
  useEffect(() => {
    setCommunityMemos((prev) => {
      let anyChanged = false;
      const next = prev.map((m) => {
        if (m.authorId !== 'me' || !m.specimenId) return m;
        const sp = specimens.find((s) => s.id === m.specimenId);
        if (!sp) return m;
        const targetPlace = sp.locationCoord?.name || m.placeName;
        const isProtected = m.isProtectedSpecies || detectProtectedSpecies(sp.koreanName);
        const hasCoord = typeof sp.locationCoord?.lat === 'number' && typeof sp.locationCoord?.lng === 'number';
        const movedFar =
          hasCoord &&
          getHaversineDistanceKm(m.lat, m.lng, sp.locationCoord!.lat!, sp.locationCoord!.lng!) > 0.35;
        const metaChanged =
          m.placeName !== targetPlace ||
          m.speciesKoreanName !== sp.koreanName ||
          m.speciesScientificName !== sp.scientificName;
        if (!movedFar && !metaChanged) return m;

        anyChanged = true;
        let nextLat = m.lat;
        let nextLng = m.lng;
        if (movedFar || m.placeName !== targetPlace) {
          if (hasCoord) {
            const masked = obfuscateCoordinates(sp.locationCoord!.lat!, sp.locationCoord!.lng!, isProtected);
            nextLat = masked.lat;
            nextLng = masked.lng;
          }
        }
        return {
          ...m,
          speciesKoreanName: sp.koreanName,
          speciesScientificName: sp.scientificName,
          category: sp.category || m.category,
          placeName: targetPlace,
          regionLabel: isProtected ? `${targetPlace.split(' ')[0]} 광역 권역` : targetPlace,
          lat: nextLat,
          lng: nextLng,
          isProtectedSpecies: isProtected,
        };
      });
      return anyChanged ? next : prev;
    });
  }, [specimens]);

  useEffect(() => {
    try {
      localStorage.setItem(MAP_COMMUNITY_STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarkedMemoIds));
    } catch {}
  }, [bookmarkedMemoIds]);

  useEffect(() => {
    try {
      localStorage.setItem(MAP_COMMUNITY_STORAGE_KEYS.BOOKMARKED_PLACES, JSON.stringify(bookmarkedPlaceIds));
    } catch {}
  }, [bookmarkedPlaceIds]);

  useEffect(() => {
    try {
      localStorage.setItem(MAP_COMMUNITY_STORAGE_KEYS.BLOCKED_USERS, JSON.stringify(blockedUserIds));
    } catch {}
  }, [blockedUserIds]);

  useEffect(() => {
    try {
      localStorage.setItem(MAP_COMMUNITY_STORAGE_KEYS.FOLLOWED_USERS, JSON.stringify(followedUserIds));
    } catch {}
  }, [followedUserIds]);

  useEffect(() => {
    try {
      localStorage.setItem(MAP_COMMUNITY_STORAGE_KEYS.HIDE_PROTECTED, JSON.stringify(hideProtectedLocations));
    } catch {}
  }, [hideProtectedLocations]);

  useEffect(() => {
    try {
      localStorage.setItem(MAP_COMMUNITY_STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  const effectiveQuery = onSearchChange ? searchQuery : localSearchQuery;
  const handleQueryChange = (q: string) => {
    setLocalSearchQuery(q);
    onSearchChange?.(q);
  };

  // Persona & Real Title
  const activePersonaKey = userStats?.persona || 'general';
  const currentPersona = NATURALIST_PERSONAS[activePersonaKey] || NATURALIST_PERSONAS.general;
  const titleInfo = useMemo(
    () => getExplorerTitleInfo(specimens, userStats, userAccount),
    [specimens, userStats, userAccount]
  );

  // Unblocked & filtered Community Memos
  const visibleMemos = useMemo(() => {
    const q = effectiveQuery.trim().toLowerCase();
    return communityMemos
      .filter((m) => !blockedUserIds.includes(m.authorId))
      .filter((m) => m.visibility !== 'private' || m.authorId === 'me')
      .filter((m) => (onlyMyMemos ? m.authorId === 'me' : true))
      .filter((m) => matchesMapCategory(m.category, selectedMapCategory))
      .filter((m) => {
        if (!q) return true;
        return (
          m.speciesKoreanName.toLowerCase().includes(q) ||
          m.speciesScientificName.toLowerCase().includes(q) ||
          m.placeName.toLowerCase().includes(q) ||
          m.memoText.toLowerCase().includes(q) ||
          m.authorName.toLowerCase().includes(q)
        );
      })
      .map((m) => ({
        ...m,
        comments: m.comments.filter((c) => !blockedUserIds.includes(c.authorId)),
      }));
  }, [communityMemos, blockedUserIds, onlyMyMemos, selectedMapCategory, effectiveQuery]);

  const allUnblockedMemos = useMemo(
    () =>
      communityMemos
        .filter((m) => !blockedUserIds.includes(m.authorId))
        .filter((m) => m.visibility !== 'private' || m.authorId === 'me'),
    [communityMemos, blockedUserIds]
  );

  const activeMemoDetail = useMemo(
    () => allUnblockedMemos.find((m) => m.id === activeMemoDetailId) || null,
    [allUnblockedMemos, activeMemoDetailId]
  );

  useEffect(() => {
    if (!activeMemoDetail) return;
    recordRecentViewedSpecies({
      id: activeMemoDetail.id,
      kind: 'memo',
      name: activeMemoDetail.speciesKoreanName,
      scientificName: activeMemoDetail.speciesScientificName,
      subtitle: `${activeMemoDetail.placeName} · ${activeMemoDetail.authorName}`,
      photoUrl: activeMemoDetail.photoUrl,
    });
  }, [activeMemoDetail]);

  useEffect(() => {
    if (!selectedPinSpecimen) return;
    const thumb =
      selectedPinSpecimen.originalImage ||
      selectedPinSpecimen.stickerImage ||
      selectedPinSpecimen.observations?.[0]?.photoUrl ||
      '';
    recordRecentViewedSpecies({
      id: selectedPinSpecimen.id,
      kind: 'specimen',
      name: selectedPinSpecimen.koreanName,
      scientificName: selectedPinSpecimen.scientificName,
      subtitle: `${selectedPinSpecimen.locationCoord?.name || selectedPinSpecimen.habitatType} · 내 도감`,
      photoUrl: thumb,
    });
  }, [selectedPinSpecimen]);

  // Own explorer profile
  const ownProfile: ExplorerProfile = useMemo(
    () => ({
      id: 'me',
      name: userAccount?.isLoggedIn ? userAccount.name : '둘러보기 탐험가',
      handle: userAccount?.isLoggedIn ? `@${(userAccount.email || 'explorer').split('@')[0]}` : '@guest_explorer',
      titleBadge: titleInfo.activeTitle || currentPersona.title || '생태 탐험가',
      bio: under14
        ? '만 14세 미만 안전 보호 모드가 적용된 탐험가입니다. 도감 기록과 뱃지를 안전하게 모아보세요.'
        : userAccount?.isLoggedIn
        ? '내 주변 자연을 기록하고 보호종 서식지를 함께 지키는 탐험가입니다.'
        : '현재 로그아웃(둘러보기) 상태입니다. 로그인하면 나만의 탐사 기록을 공유할 수 있어요.',
      avatarColor: '#fdf6dc',
      avatarEmoji: under14 ? '🌱' : '🧭',
      memoCount: communityMemos.filter((m) => m.authorId === 'me').length,
      followersCount: 0,
      speciesCount: collectedSpecimens.length,
      favoriteRegion: radarCenter.name,
      joinedAt: '2026년',
    }),
    [userAccount, under14, titleInfo.activeTitle, currentPersona, communityMemos, collectedSpecimens.length, radarCenter.name]
  );

  const activeProfile: ExplorerProfile | null = useMemo(() => {
    if (!activeProfileId) return null;
    if (activeProfileId === 'me') return ownProfile;
    return INITIAL_EXPLORER_PROFILES[activeProfileId] || null;
  }, [activeProfileId, ownProfile]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  // Specimen GPS points
  const specimenGpsPoints = useMemo(() => {
    return collectedSpecimens.map((sp, idx) => {
      const coord = getSpecimenGpsCoord(sp, idx);
      const distFromRadar = getHaversineDistanceKm(radarCenter.lat, radarCenter.lng, coord.lat, coord.lng);
      return {
        specimen: sp,
        lat: coord.lat,
        lng: coord.lng,
        regionTag: coord.regionTag,
        distanceKm: distFromRadar,
        isInsideRadar: distFromRadar <= 1.0,
      };
    });
  }, [collectedSpecimens, radarCenter]);

  const filteredPoints = useMemo(() => {
    const q = effectiveQuery.toLowerCase().trim();
    return specimenGpsPoints
      .filter((pt) => matchesMapCategory(pt.specimen.category, selectedMapCategory))
      .filter((pt) => {
        if (!q) return true;
        const sp = pt.specimen;
        return (
          (sp.koreanName || '').toLowerCase().includes(q) ||
          (sp.scientificName || '').toLowerCase().includes(q) ||
          (pt.regionTag || '').toLowerCase().includes(q)
        );
      });
  }, [specimenGpsPoints, selectedMapCategory, effectiveQuery]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [radarCenter.lat, radarCenter.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    const tileServer = TILE_SERVERS[mapLayer];
    const tileLayer = L.tileLayer(tileServer.url, {
      maxZoom: tileServer.maxZoom,
    }).addTo(map);

    const radarGroup = L.layerGroup().addTo(map);
    const communityGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    radarGroupRef.current = radarGroup;
    communityGroupRef.current = communityGroup;
    markersGroupRef.current = markersGroup;

    map.on('zoomend', () => {
      setMapZoom(map.getZoom());
    });

    map.on('click', () => {
      setSelectedPinSpecimen(null);
      setSelectedPinMemo(null);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const tileServer = TILE_SERVERS[mapLayer];
    const newTileLayer = L.tileLayer(tileServer.url, {
      maxZoom: tileServer.maxZoom,
    });
    newTileLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;
  }, [mapLayer]);

  // Render Center Blue GPS Dot & Soft Ring
  useEffect(() => {
    if (!mapInstanceRef.current || !radarGroupRef.current) return;
    const radarGroup = radarGroupRef.current;
    radarGroup.clearLayers();

    const outerCircle = L.circle([radarCenter.lat, radarCenter.lng], {
      radius: 1000,
      color: '#6d8911',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#c4eb43',
      fillOpacity: 0.06,
    });
    radarGroup.addLayer(outerCircle);

    const radarCenterIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-4 h-4 rounded-full bg-[#3b82f6] border-[2.5px] border-white shadow-md z-10"></div>
        </div>
      `,
      className: 'custom-radar-center-icon',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    const centerMarker = L.marker([radarCenter.lat, radarCenter.lng], {
      icon: radarCenterIcon,
    });
    radarGroup.addLayer(centerMarker);
  }, [radarCenter]);

  // Render Community Memo Pins + Zoom-out Clusters (07 / H-01 / 04)
  useEffect(() => {
    if (!mapInstanceRef.current || !communityGroupRef.current) return;
    const communityGroup = communityGroupRef.current;
    communityGroup.clearLayers();

    if (mapZoom < 14) {
      const gridSizeDeg = mapZoom <= 11 ? 0.05 : mapZoom <= 12 ? 0.025 : 0.012;
      const clusterBuckets = new Map<
        string,
        {
          latSum: number;
          lngSum: number;
          count: number;
          memos: CommunityMemo[];
          specimens: Specimen[];
        }
      >();

      visibleMemos.forEach((memo) => {
        const key = `${Math.round(memo.lat / gridSizeDeg)}_${Math.round(memo.lng / gridSizeDeg)}`;
        const existing = clusterBuckets.get(key);
        if (existing) {
          existing.latSum += memo.lat;
          existing.lngSum += memo.lng;
          existing.count += 1;
          existing.memos.push(memo);
        } else {
          clusterBuckets.set(key, {
            latSum: memo.lat,
            lngSum: memo.lng,
            count: 1,
            memos: [memo],
            specimens: [],
          });
        }
      });

      filteredPoints.forEach((pt) => {
        const key = `${Math.round(pt.lat / gridSizeDeg)}_${Math.round(pt.lng / gridSizeDeg)}`;
        const existing = clusterBuckets.get(key);
        if (existing) {
          existing.latSum += pt.lat;
          existing.lngSum += pt.lng;
          existing.count += 1;
          existing.specimens.push(pt.specimen);
        } else {
          clusterBuckets.set(key, {
            latSum: pt.lat,
            lngSum: pt.lng,
            count: 1,
            memos: [],
            specimens: [pt.specimen],
          });
        }
      });

      clusterBuckets.forEach((bucket, bucketKey) => {
        const centerLat = bucket.latSum / bucket.count;
        const centerLng = bucket.lngSum / bucket.count;

        const clusterIcon = L.divIcon({
          html: `
            <div class="w-10 h-10 rounded-full bg-[#202320] text-white border-2 border-white shadow-lg flex items-center justify-center text-[13px] font-bold cursor-pointer hover:scale-110 transition-transform tabular-nums">
              ${bucket.count}
            </div>
          `,
          className: 'custom-cluster-pin',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([centerLat, centerLng], { icon: clusterIcon });
        marker.on('click', () => {
          const nearbyHotspot = BIOBLITZ_HOTSPOTS.find(
            (h) => getHaversineDistanceKm(centerLat, centerLng, h.lat, h.lng) <= 2.5
          );
          const firstMemoArea =
            bucket.memos[0]?.regionLabel ||
            bucket.memos[0]?.placeName?.split(' ').slice(0, 2).join(' ');
          const spCoord = bucket.specimens[0]?.locationCoord;
          const spCountry = spCoord?.country?.trim();
          const isDomesticSp =
            !spCountry ||
            spCountry === '대한민국' ||
            spCountry === '한국' ||
            spCountry.toLowerCase() === 'south korea' ||
            spCountry.toUpperCase() === 'KR';
          const spParts = [
            !isDomesticSp ? spCountry : '',
            spCoord?.city?.trim() || '',
            spCoord?.district?.trim() || '',
          ].filter(Boolean);
          const firstSpArea =
            spParts.length > 0
              ? Array.from(new Set(spParts)).slice(0, 3).join(' ')
              : spCoord?.name?.split(' ').slice(0, 2).join(' ');

          const baseName = nearbyHotspot?.name || firstMemoArea || firstSpArea || '이 지역';
          const fallbackTitle =
            baseName.endsWith('일대') || baseName.endsWith('권역')
              ? baseName
              : `${baseName} 일대`;

          const clusterId = `cluster-${bucketKey}`;
          const cacheKey = `${centerLat.toFixed(2)},${centerLng.toFixed(2)}`;
          const cachedAreaTitle = !nearbyHotspot ? CLUSTER_AREA_NAME_CACHE.get(cacheKey) : undefined;
          const shouldResolveGlobal = !nearbyHotspot && !cachedAreaTitle;

          mapInstanceRef.current?.panTo([centerLat, centerLng], { animate: true });
          setActiveClusterArea({
            id: clusterId,
            areaTitle: cachedAreaTitle || fallbackTitle,
            isResolvingArea: shouldResolveGlobal,
            centerLat,
            centerLng,
            memos: bucket.memos,
            specimens: bucket.specimens,
          });

          if (shouldResolveGlobal) {
            fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${centerLat}&lon=${centerLng}&zoom=13&accept-language=ko`
            )
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => {
                const resolvedFromAddr = formatGlobalClusterAreaTitle(data?.address);
                const rawName = typeof data?.name === 'string' ? data.name.trim() : '';
                const resolvedTitle =
                  resolvedFromAddr ||
                  (rawName
                    ? rawName.endsWith('일대') || rawName.endsWith('권역')
                      ? rawName
                      : `${rawName} 일대`
                    : null);
                if (resolvedTitle) {
                  CLUSTER_AREA_NAME_CACHE.set(cacheKey, resolvedTitle);
                }
                setActiveClusterArea((prev) =>
                  prev && prev.id === clusterId
                    ? {
                        ...prev,
                        areaTitle: resolvedTitle || prev.areaTitle,
                        isResolvingArea: false,
                      }
                    : prev
                );
              })
              .catch(() => {
                setActiveClusterArea((prev) =>
                  prev && prev.id === clusterId ? { ...prev, isResolvingArea: false } : prev
                );
              });
          }
        });
        communityGroup.addLayer(marker);
      });
      return;
    }

    visibleMemos.forEach((memo) => {
      const isSelected = selectedPinMemo?.id === memo.id;

      if (memo.isProtectedSpecies && hideProtectedLocations) {
        const protectionZone = L.circle([memo.lat, memo.lng], {
          radius: 1500,
          color: '#6d8911',
          weight: 1.5,
          dashArray: '5, 5',
          fillColor: '#c4eb43',
          fillOpacity: isSelected ? 0.22 : 0.12,
        });
        protectionZone.on('click', () => {
          setSelectedPinSpecimen(null);
          setSelectedPinMemo(memo);
          mapInstanceRef.current?.flyTo([memo.lat, memo.lng], 14, { duration: 0.6 });
        });
        communityGroup.addLayer(protectionZone);

        const zoneBadgeIcon = L.divIcon({
          html: `
            <div class="px-2.5 py-1 rounded-full bg-[#202320] text-white text-[10px] font-bold shadow-md border border-[#c4eb43] flex items-center gap-1 whitespace-nowrap cursor-pointer ${
              isSelected ? 'ring-4 ring-[#c4eb43] scale-110' : ''
            }">
              <span>🛡️</span>
              <span>${memo.speciesKoreanName} 권역</span>
            </div>
          `,
          className: 'custom-protected-zone-badge',
          iconSize: [110, 26],
          iconAnchor: [55, 13],
        });
        const badgeMarker = L.marker([memo.lat, memo.lng], { icon: zoneBadgeIcon });
        badgeMarker.on('click', () => {
          setSelectedPinSpecimen(null);
          setSelectedPinMemo(memo);
          mapInstanceRef.current?.flyTo([memo.lat, memo.lng], 14, { duration: 0.6 });
        });
        communityGroup.addLayer(badgeMarker);
        return;
      }

      const pinStyle = getCategoryPinStyle(memo.category);
      const iconHtml = `
        <div class="relative flex flex-col items-center cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-120 z-50' : 'hover:scale-110 z-20'
        }">
          <div style="border-color: ${isSelected ? '#202320' : pinStyle.border};" class="w-10 h-10 rounded-full shadow-md flex items-center justify-center bg-white border-2">
            <span class="text-[18px] leading-none">${pinStyle.emoji}</span>
          </div>
          <div style="border-top-color: ${isSelected ? '#202320' : pinStyle.border};" class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] -mt-[1px]"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-community-memo-pin',
        iconSize: [40, 46],
        iconAnchor: [20, 46],
      });

      const marker = L.marker([memo.lat, memo.lng], { icon: customIcon });
      marker.on('click', () => {
        setSelectedPinSpecimen(null);
        setSelectedPinMemo(memo);
        mapInstanceRef.current?.flyTo([memo.lat, memo.lng], Math.max(15, mapZoom), { duration: 0.6 });
      });
      communityGroup.addLayer(marker);
    });
  }, [visibleMemos, filteredPoints, selectedPinMemo, hideProtectedLocations, mapZoom]);

  // Render My Specimen Pins on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    if (!showMySpecimenPins || mapZoom < 14 || filteredPoints.length === 0) return;

    filteredPoints.forEach((pt) => {
      const sp = pt.specimen;
      const isSelected = selectedPinSpecimen?.id === sp.id;
      const pinStyle = getCategoryPinStyle(sp.category);

      const iconHtml = `
        <div class="relative flex flex-col items-center cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-120 z-50' : 'hover:scale-110 z-10'
        }">
          <div style="border-color: ${isSelected ? '#202320' : pinStyle.border};" class="w-10 h-10 rounded-full shadow-md flex items-center justify-center bg-white border-2">
            <span class="text-[18px] leading-none">${pinStyle.emoji}</span>
          </div>
          <div style="border-top-color: ${isSelected ? '#202320' : pinStyle.border};" class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] -mt-[1px]"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-specimen-pin',
        iconSize: [40, 46],
        iconAnchor: [20, 46],
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: customIcon });
      marker.on('click', () => {
        setSelectedPinMemo(null);
        setSelectedPinSpecimen(sp);
        mapInstanceRef.current?.flyTo([pt.lat, pt.lng], Math.max(15, mapZoom), { duration: 0.6 });
      });

      markersGroup.addLayer(marker);
    });
  }, [filteredPoints, selectedPinSpecimen, mapZoom, showMySpecimenPins]);

  const handleSelectHotspot = (hotspot: BioBlitzCenter) => {
    setRadarCenter(hotspot);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([hotspot.lat, hotspot.lng], 14, { duration: 1.0 });
    }
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setLocationPermissionDenied(true);
      onShowToast?.('이 브라우저에서는 위치 정보를 사용할 수 없어요.');
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        setLocationPermissionDenied(false);
        const userLoc: BioBlitzCenter = {
          id: 'user-current-gps',
          name: '내 현재 위치',
          description: `${pos.coords.latitude.toFixed(4)}°, ${pos.coords.longitude.toFixed(4)}°`,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          habitatType: '실시간 탐사 위치',
        };
        setRadarCenter(userLoc);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([userLoc.lat, userLoc.lng], 15, { duration: 1.0 });
        }
      },
      () => {
        setIsLocatingUser(false);
        setLocationPermissionDenied(true);
        handleSelectHotspot(BIOBLITZ_HOTSPOTS[0]);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Community Actions
  const handleToggleLike = (memoId: string) => {
    setCommunityMemos((prev) =>
      prev.map((m) =>
        m.id === memoId
          ? {
              ...m,
              likedByMe: !m.likedByMe,
              likesCount: m.likedByMe ? Math.max(0, m.likesCount - 1) : m.likesCount + 1,
            }
          : m
      )
    );
    if (selectedPinMemo?.id === memoId) {
      setSelectedPinMemo((prev) =>
        prev
          ? {
              ...prev,
              likedByMe: !prev.likedByMe,
              likesCount: prev.likedByMe ? Math.max(0, prev.likesCount - 1) : prev.likesCount + 1,
            }
          : null
      );
    }
  };

  const handleToggleBookmarkMemo = (memoId: string) => {
    setBookmarkedMemoIds((prev) => {
      const exists = prev.includes(memoId);
      const next = exists ? prev.filter((id) => id !== memoId) : [memoId, ...prev];
      onShowToast?.(exists ? '메모 즐겨찾기를 해제했어요.' : '탐사 메모를 즐겨찾기에 저장했어요.');
      return next;
    });
  };

  const handleToggleBookmarkPlace = (placeId: string) => {
    setBookmarkedPlaceIds((prev) => {
      const exists = prev.includes(placeId);
      const next = exists ? prev.filter((id) => id !== placeId) : [placeId, ...prev];
      onShowToast?.(exists ? '장소 즐겨찾기를 해제했어요.' : '장소를 즐겨찾기에 추가했어요.');
      return next;
    });
  };

  const handleAddComment = (memoId: string, content: string) => {
    const newComment = {
      id: `cmt-${Date.now()}`,
      memoId,
      authorId: 'me',
      authorName: userAccount?.name || '나',
      authorEmoji: '🧭',
      content,
      createdAt: '방금 전',
    };
    setCommunityMemos((prev) =>
      prev.map((m) => (m.id === memoId ? { ...m, comments: [...m.comments, newComment] } : m))
    );
    onShowToast?.('댓글을 등록했어요.');
  };

  const handleAddMemo = (newMemo: CommunityMemo) => {
    setCommunityMemos((prev) => [newMemo, ...prev]);
    setSelectedPinMemo(newMemo);
    mapInstanceRef.current?.flyTo([newMemo.lat, newMemo.lng], 15, { duration: 0.8 });
    onShowToast?.('안전하게 EXIF를 제거하고 탐사 메모를 지도에 공유했어요.');
  };

  const handleDeleteOwnMemo = (memoId: string) => {
    setCommunityMemos((prev) => prev.filter((m) => m.id !== memoId));
    if (selectedPinMemo?.id === memoId) setSelectedPinMemo(null);
    onShowToast?.('작성한 탐사 메모를 삭제했어요.');
  };

  const handleReportMemo = (_memoId: string, reason: MemoReportReason) => {
    onShowToast?.(`"${reason}" 사유로 신고가 접수되었어요. 검토 후 안전하게 처리됩니다.`);
  };

  const handleBlockUser = (authorId: string, authorName: string) => {
    if (authorId === 'me') return;
    setBlockedUserIds((prev) => (prev.includes(authorId) ? prev : [...prev, authorId]));
    if (selectedPinMemo?.authorId === authorId) setSelectedPinMemo(null);
    onShowToast?.(`${authorName}님을 차단했어요. 해당 탐험가의 기록은 더 이상 표시되지 않습니다.`);
  };

  const handleUnblockUser = (authorId: string) => {
    setBlockedUserIds((prev) => prev.filter((id) => id !== authorId));
    onShowToast?.('차단을 해제했어요.');
  };

  const handleToggleFollow = (profileId: string) => {
    setFollowedUserIds((prev) =>
      prev.includes(profileId) ? prev.filter((id) => id !== profileId) : [...prev, profileId]
    );
  };

  const handleOpenSpecimenBySpecies = (speciesName: string, specimenId?: string) => {
    const matched = collectedSpecimens.find(
      (s) => (specimenId && s.id === specimenId) || s.koreanName === speciesName
    );
    if (matched) {
      setActiveMemoDetailId(null);
      onSelectSpecimen(matched);
    }
  };

  const getSpecimenGradeForMemo = (memo: CommunityMemo) => {
    const matched = specimens.find(
      (s) => (memo.specimenId && s.id === memo.specimenId) || s.koreanName === memo.speciesKoreanName
    );
    return getScoreGradeBadge(matched?.observations?.[0]?.photoScore);
  };

  const selectedCategoryObj = MAP_CATEGORY_FILTERS.find((c) => c.id === selectedMapCategory) || MAP_CATEGORY_FILTERS[0];
  const isClusterMode = mapZoom < 14;
  const totalVisibleRecordsCount = visibleMemos.length + filteredPoints.length;

  return (
    <div className="relative w-full h-[calc(100dvh-76px)] bg-[#f4f5f4] overflow-hidden flex flex-col select-none">
      {/* Real Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* ========================================================
          TOP FLOATING BAR (H-01 / 04 / 03)
          ======================================================== */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md pt-3 pb-2.5 px-3 border-b border-[#efefef] pointer-events-auto space-y-2.5">
          {/* Row 1: Search Pill (flex-1) + Bell (알림) + Avatar (내 프로필) + Hamburger Menu (☰) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="flex-1 min-w-0 h-11 px-3.5 rounded-full bg-white text-[#626961] border border-[#e6e9e5] shadow-2xs text-[13px] font-medium flex items-center gap-2 cursor-pointer active:scale-[0.99] text-left"
            >
              <Search className="w-4 h-4 text-[#202320] shrink-0" />
              <span className="truncate">
                {effectiveQuery ? effectiveQuery : '장소나 생물 이름으로 찾아보기'}
              </span>
            </button>



            {/* 2. 내 프로필 (46 내 탐험 프로필 모달 직행) */}
            <button
              type="button"
              onClick={() => setActiveProfileId('me')}
              className="relative w-11 h-11 rounded-full bg-[#fdf6dc] hover:ring-2 hover:ring-[#c4eb43] border border-[#e6e9e5] shadow-2xs flex items-center justify-center shrink-0 cursor-pointer text-[14px] font-bold text-[#202320] active:scale-95 transition-all overflow-hidden"
              aria-label="내 탐험 프로필"
              title="내 프로필"
            >
              {userAccount?.isLoggedIn && userAccount.name ? (
                userAccount.name.slice(0, 1)
              ) : (
                <User className="w-5 h-5 text-[#202320]" />
              )}
            </button>

            {/* 3. 햄버거 메뉴 (☰ 탐험 메뉴 드로어) */}
            <button
              type="button"
              onClick={() => setActiveModal('menu')}
              className="w-11 h-11 rounded-full bg-white hover:bg-[#f4f5f4] border border-[#e6e9e5] shadow-2xs flex items-center justify-center shrink-0 cursor-pointer text-[#202320] active:scale-95 transition-all"
              aria-label="탐험 메뉴"
              title="탐험 메뉴"
            >
              <Menu className="w-5 h-5 text-[#202320]" />
            </button>
          </div>

          {/* Row 2: Horizontal Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {MAP_CATEGORY_FILTERS.map((cat) => {
              const isActive = selectedMapCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedMapCategory(cat.id);
                    setSelectedPinMemo(null);
                    setSelectedPinSpecimen(null);
                    setSheetMode(cat.id === 'all' ? 'collapsed' : 'strip');
                  }}
                  className={`h-9 px-3.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 shrink-0 border shadow-2xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#202320] text-white border-[#202320]'
                      : 'bg-white text-[#202320] border-[#e6e9e5] hover:bg-[#f4f5f4]'
                  }`}
                >
                  {cat.emoji && <span>{cat.emoji}</span>}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 03 Location Permission Off Banner */}
        {locationPermissionDenied && (
          <div className="bg-[#efefef]/95 backdrop-blur-md border-b border-[#e2e5e1] px-4 py-2.5 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2 text-[13px] font-medium text-[#202320]">
              <AlertTriangle className="w-4 h-4 text-[#202320] fill-[#202320]/10 shrink-0" />
              <span>위치 권한이 꺼져 있어요</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal('settings')}
              className="text-[13px] font-bold text-[#202320] hover:underline shrink-0 cursor-pointer"
            >
              설정 열기
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          RIGHT FLOATING CONTROLS (Layers -> 59 Sheet, GPS, Write FAB)
          ======================================================== */}
      <div
        className={`absolute right-3 z-20 flex flex-col gap-2.5 transition-all ${
          locationPermissionDenied ? 'top-[152px]' : 'top-28'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsLayerSheetOpen(true)}
          className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-md border border-[#e6e9e5] shadow-md flex items-center justify-center text-[#202320] hover:bg-[#f4f5f4] cursor-pointer"
          title="지도 레이어"
          aria-label="지도 레이어"
        >
          <Layers className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleLocateUser}
          disabled={isLocatingUser}
          className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-md border border-[#e6e9e5] shadow-md flex items-center justify-center text-[#202320] hover:bg-[#f4f5f4] cursor-pointer"
          title="내 위치"
          aria-label="내 위치"
        >
          <Crosshair className={`w-5 h-5 ${isLocatingUser ? 'animate-spin text-[#6d8911]' : ''}`} />
        </button>
      </div>

      {/* Write Memo Floating Black Circular FAB */}
      {showCommunity && !selectedPinMemo && !selectedPinSpecimen && sheetMode !== 'expanded' && (
        <button
          type="button"
          onClick={() => {
            setIsWriteMemoOpen(true);
          }}
          className={`absolute right-3 z-20 w-13 h-13 rounded-full bg-[#202320] hover:bg-black text-white shadow-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all ${
            sheetMode === 'strip' ? 'bottom-[266px]' : 'bottom-[98px]'
          }`}
          title="메모 쓰기"
          aria-label="메모 쓰기"
        >
          <PenSquare className="w-5 h-5 text-white" />
        </button>
      )}

      {/* ========================================================
          H-02 FLOATING PIN PREVIEW CARD (Community Memo Pin)
          ======================================================== */}
      <AnimatePresence>
        {selectedPinMemo && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 440, damping: 32 }}
            className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-[376px] z-30 p-4 rounded-[24px] bg-white border border-[#e6e9e5] shadow-xl"
          >
            {(() => {
              const gradeInfo = getSpecimenGradeForMemo(selectedPinMemo);
              const distLabel = formatDistLabel(
                getHaversineDistanceKm(radarCenter.lat, radarCenter.lng, selectedPinMemo.lat, selectedPinMemo.lng)
              );
              const isMemoBookmarked = bookmarkedMemoIds.includes(selectedPinMemo.id);

              return (
                <>
                  <div className="flex items-start gap-3.5">
                    <div className="w-[78px] h-[78px] rounded-[16px] bg-[#f4f5f4] overflow-hidden shrink-0 border border-[#e6e9e5]">
                      {selectedPinMemo.photoUrl ? (
                        <img
                          src={selectedPinMemo.photoUrl}
                          alt={selectedPinMemo.speciesKoreanName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-6 h-6 text-[#8c948a]" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-[17px] font-bold text-[#202320] leading-snug">
                            {selectedPinMemo.speciesKoreanName}
                          </h4>
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-extrabold ${gradeInfo.bg}`}
                          >
                            {gradeInfo.grade}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedPinMemo(null)}
                          className="p-1 rounded-full text-[#8c948a] hover:text-[#202320] cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-[12px] text-[#8c948a] mt-0.5 truncate">
                        {getSpeciesTaxonomyCategoryLabel(selectedPinMemo.category)} · {selectedPinMemo.authorName} · {distLabel}
                      </p>

                      <p className="text-[13px] text-[#202320] line-clamp-2 mt-1.5 leading-relaxed">
                        {selectedPinMemo.memoText}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-[#f0f1f0] flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[13px] font-medium text-[#626961]">
                      {showCommunity && (
                        <button
                          type="button"
                          onClick={() => handleToggleLike(selectedPinMemo.id)}
                          className={`flex items-center gap-1 cursor-pointer ${
                            selectedPinMemo.likedByMe ? 'text-[#ff5100] font-bold' : 'hover:text-[#202320]'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${selectedPinMemo.likedByMe ? 'fill-current' : ''}`} />
                          <span className="tabular-nums">{selectedPinMemo.likesCount}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleBookmarkMemo(selectedPinMemo.id)}
                        className={`flex items-center gap-1 cursor-pointer ${
                          isMemoBookmarked ? 'text-[#6d8911] font-bold' : 'hover:text-[#202320]'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${isMemoBookmarked ? 'fill-current' : ''}`} />
                        <span>{isMemoBookmarked ? '메모 저장됨' : '메모 저장'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveMemoDetailId(selectedPinMemo.id);
                        setSelectedPinMemo(null);
                      }}
                      className="h-9 px-4 rounded-xl bg-[#202320] text-white text-[13px] font-bold hover:bg-black transition-colors cursor-pointer"
                    >
                      자세히 보기
                    </button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          H-02 FLOATING PIN PREVIEW CARD (My Specimen Pin)
          ======================================================== */}
      <AnimatePresence>
        {selectedPinSpecimen && !selectedPinMemo && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 440, damping: 32 }}
            className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-[376px] z-30 p-4 rounded-[24px] bg-white border border-[#e6e9e5] shadow-xl"
          >
            {(() => {
              const photo =
                selectedPinSpecimen.originalImage ||
                selectedPinSpecimen.stickerImage ||
                selectedPinSpecimen.observations?.[0]?.photoUrl ||
                '';
              const gradeInfo = getScoreGradeBadge(selectedPinSpecimen.observations?.[0]?.photoScore);
              return (
                <>
                  <div className="flex items-start gap-3.5">
                    <div className="w-[78px] h-[78px] rounded-[16px] bg-[#f4f5f4] overflow-hidden shrink-0 border border-[#e6e9e5]">
                      {photo ? (
                        <img
                          src={photo}
                          alt={selectedPinSpecimen.koreanName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-6 h-6 text-[#8c948a]" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-[17px] font-bold text-[#202320] leading-snug">
                            {selectedPinSpecimen.koreanName}
                          </h4>
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-extrabold ${gradeInfo.bg}`}
                          >
                            {gradeInfo.grade}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedPinSpecimen(null)}
                          className="p-1 rounded-full text-[#8c948a] hover:text-[#202320] cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-[12px] text-[#8c948a] mt-0.5 truncate">
                        {getSpeciesTaxonomyCategoryLabel(selectedPinSpecimen.category)} · 내 도감 ·{' '}
                        {selectedPinSpecimen.observations?.[0]?.date || '기록됨'}
                      </p>

                      <p className="text-[13px] text-[#202320] line-clamp-2 mt-1.5 leading-relaxed">
                        {selectedPinSpecimen.observations?.[0]?.memo || selectedPinSpecimen.keyIdentification}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-[#f0f1f0] flex items-center justify-between">
                    <span className="text-[12px] text-[#8c948a] font-medium">
                      {selectedPinSpecimen.scientificName}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectSpecimen(selectedPinSpecimen)}
                      className="h-9 px-4 rounded-xl bg-[#202320] text-white text-[13px] font-bold hover:bg-black transition-colors cursor-pointer"
                    >
                      도감 보기
                    </button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          BOTTOM SHEET (H-01 / 03 / 04 / 07 / H-03)
          ======================================================== */}
      {!selectedPinMemo && !selectedPinSpecimen && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="rounded-t-[26px] bg-white border-t border-[#e6e9e5] shadow-[0_-6px_28px_rgba(0,0,0,0.08)] overflow-hidden">
            {/* Drag Handle */}
            <div className="pt-2.5 px-4">
              <button
                type="button"
                aria-label="시트 크기 전환"
                onClick={() =>
                  setSheetMode((prev) =>
                    prev === 'expanded' ? 'collapsed' : prev === 'strip' ? 'collapsed' : 'strip'
                  )
                }
                className="w-full py-0.5 flex justify-center cursor-pointer"
              >
                <span className="w-9 h-1 rounded-full bg-[#d9ddd8] block mb-2" />
              </button>
            </div>

            {sheetMode !== 'expanded' ? (
              <div className="px-4 pb-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <button
                      type="button"
                      onClick={() => setSheetMode((prev) => (prev === 'strip' ? 'collapsed' : 'strip'))}
                      className="text-left cursor-pointer block"
                    >
                      <h3 className="text-[18px] font-bold text-[#202320] leading-tight">
                        {isClusterMode
                          ? `이 지역 탐험 기록 ${totalVisibleRecordsCount}개`
                          : selectedMapCategory === 'all'
                          ? `주변 탐험 기록 ${totalVisibleRecordsCount}개`
                          : `${selectedCategoryObj.label} 기록 ${totalVisibleRecordsCount}개`}
                      </h3>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePlaceDetail(radarCenter)}
                      className="text-[12px] text-[#8c948a] mt-0.5 flex items-center gap-1 hover:text-[#202320] cursor-pointer"
                    >
                      <span>
                        {isClusterMode
                          ? `${radarCenter.name} 일대 · 숫자를 누르면 확대돼요`
                          : '반경 1km · 최신순'}
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSheetMode('expanded')}
                    className="text-[13px] font-semibold text-[#626961] hover:text-[#202320] flex items-center gap-0.5 shrink-0 cursor-pointer"
                  >
                    <span>목록 보기</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {sheetMode === 'strip' && !isClusterMode && (
                  <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1">
                    {visibleMemos.map((memo) => {
                      const gradeInfo = getSpecimenGradeForMemo(memo);
                      const distLabel = formatDistLabel(
                        getHaversineDistanceKm(radarCenter.lat, radarCenter.lng, memo.lat, memo.lng)
                      );
                      return (
                        <button
                          key={memo.id}
                          type="button"
                          onClick={() => {
                            setSelectedPinSpecimen(null);
                            setSelectedPinMemo(memo);
                            mapInstanceRef.current?.flyTo([memo.lat, memo.lng], 15, { duration: 0.6 });
                          }}
                          className="w-[186px] sm:w-[200px] shrink-0 rounded-[18px] border border-[#e6e9e5] bg-white overflow-hidden text-left hover:border-[#cfd4ce] transition-colors cursor-pointer"
                        >
                          <div className="h-[104px] bg-[#f4f5f4] overflow-hidden flex items-center justify-center">
                            {memo.photoUrl ? (
                              <img
                                src={memo.photoUrl}
                                alt={memo.speciesKoreanName}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Camera className="w-6 h-6 text-[#8c948a]" />
                            )}
                          </div>
                          <div className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[15px] font-bold text-[#202320] truncate">
                                {memo.speciesKoreanName}
                              </span>
                              <span
                                className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-extrabold shrink-0 ${gradeInfo.bg}`}
                              >
                                {gradeInfo.grade}
                              </span>
                            </div>
                            <p className="text-[12px] text-[#8c948a] truncate mt-0.5">
                              {getSpeciesTaxonomyCategoryLabel(memo.category)} · {memo.authorName} · {distLabel}
                            </p>
                          </div>
                        </button>
                      );
                    })}

                    {filteredPoints.map((pt, idx) => {
                      const sp = pt.specimen;
                      const photo = sp.stickerImage || sp.originalImage || sp.observations?.[0]?.photoUrl || '';
                      const gradeInfo = getScoreGradeBadge(sp.observations?.[0]?.photoScore);
                      return (
                        <button
                          key={`sp-strip-${sp.id}-${idx}`}
                          type="button"
                          onClick={() => {
                            setSelectedPinMemo(null);
                            setSelectedPinSpecimen(sp);
                            mapInstanceRef.current?.flyTo([pt.lat, pt.lng], 15, { duration: 0.6 });
                          }}
                          className="w-[186px] sm:w-[200px] shrink-0 rounded-[18px] border border-[#e6e9e5] bg-white overflow-hidden text-left hover:border-[#cfd4ce] transition-colors cursor-pointer"
                        >
                          <div className="h-[104px] bg-[#f4f5f4] overflow-hidden flex items-center justify-center">
                            {photo ? (
                              <img
                                src={photo}
                                alt={sp.koreanName}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Camera className="w-6 h-6 text-[#8c948a]" />
                            )}
                          </div>
                          <div className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[15px] font-bold text-[#202320] truncate">
                                {sp.koreanName}
                              </span>
                              <span
                                className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-extrabold shrink-0 ${gradeInfo.bg}`}
                              >
                                {gradeInfo.grade}
                              </span>
                            </div>
                            <p className="text-[12px] text-[#8c948a] truncate mt-0.5">
                              {getSpeciesTaxonomyCategoryLabel(sp.category)} · 내 도감 · {formatDistLabel(pt.distanceKm)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* H-03 Expanded List Sheet (주변 탐험 기록 전체 목록) */
              <div className="flex flex-col">
                <div className="px-4 pb-3 border-b border-[#f0f1f0]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-[19px] font-bold text-[#202320] leading-tight">
                        {isClusterMode
                          ? `이 지역 탐험 기록 ${totalVisibleRecordsCount}개`
                          : selectedMapCategory === 'all'
                          ? `주변 탐험 기록 ${totalVisibleRecordsCount}개`
                          : `${selectedCategoryObj.label} 기록 ${totalVisibleRecordsCount}개`}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActivePlaceDetail(radarCenter)}
                        className="text-[12px] text-[#8c948a] mt-0.5 flex items-center gap-1 hover:text-[#202320] cursor-pointer"
                      >
                        <span>
                          {isClusterMode ? `${radarCenter.name} 일대` : '반경 1km · 최신순'}
                        </span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSheetMode('collapsed')}
                      className="p-1.5 rounded-full text-[#8c948a] hover:text-[#202320] cursor-pointer"
                      aria-label="접기"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[48vh] overflow-y-auto scrollbar-thin">
                  {totalVisibleRecordsCount === 0 ? (
                    <div className="text-center py-10 px-4 text-xs text-[#8c948a]">
                      {showCommunity
                        ? '조건에 맞는 탐험 기록이 없어요.'
                        : '표시할 탐험 기록이 없어요.'}
                    </div>
                  ) : (
                    <div className="divide-y divide-[#f0f1f0]">
                      {visibleMemos.map((memo) => {
                        const distLabel = formatDistLabel(
                          getHaversineDistanceKm(radarCenter.lat, radarCenter.lng, memo.lat, memo.lng)
                        );
                        return (
                          <button
                            key={memo.id}
                            type="button"
                            onClick={() => setActiveMemoDetailId(memo.id)}
                            className="w-full px-4 py-3.5 hover:bg-[#fafbfa] cursor-pointer flex items-center justify-between gap-3 text-left transition-colors"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-14 h-14 rounded-2xl bg-[#f4f5f4] overflow-hidden shrink-0 flex items-center justify-center">
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
                              <div className="min-w-0">
                                <span className="text-[15px] font-bold text-[#202320] truncate block">
                                  {memo.speciesKoreanName}
                                </span>
                                <p className="text-[12px] text-[#8c948a] truncate mt-0.5">
                                  {getSpeciesTaxonomyCategoryLabel(memo.category)} · {memo.authorName} · {distLabel}
                                </p>
                              </div>
                            </div>
                            <span className="text-[12px] text-[#8c948a] shrink-0 tabular-nums">
                              {memo.createdAt}
                            </span>
                          </button>
                        );
                      })}

                      {filteredPoints.map((pt, idx) => {
                        const sp = pt.specimen;
                        const photo = sp.stickerImage || sp.originalImage || sp.observations?.[0]?.photoUrl || '';
                        const dateLabel = sp.observations?.[0]?.date || '기록됨';
                        return (
                          <button
                            key={`sp-list-${sp.id}-${idx}`}
                            type="button"
                            onClick={() => {
                              setSelectedPinMemo(null);
                              setSelectedPinSpecimen(sp);
                              setSheetMode('collapsed');
                              mapInstanceRef.current?.flyTo([pt.lat, pt.lng], 15, { duration: 0.7 });
                            }}
                            className="w-full px-4 py-3.5 hover:bg-[#fafbfa] cursor-pointer flex items-center justify-between gap-3 text-left transition-colors"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-14 h-14 rounded-2xl bg-[#f4f5f4] overflow-hidden shrink-0 flex items-center justify-center">
                                {photo ? (
                                  <img
                                    src={photo}
                                    alt={sp.koreanName}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Camera className="w-5 h-5 text-[#8c948a]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-[15px] font-bold text-[#202320] truncate block">
                                  {sp.koreanName}
                                </span>
                                <p className="text-[12px] text-[#8c948a] truncate mt-0.5">
                                  {getSpeciesTaxonomyCategoryLabel(sp.category)} · 내 도감 · {formatDistLabel(pt.distanceKm)}
                                </p>
                              </div>
                            </div>
                            <span className="text-[12px] text-[#8c948a] shrink-0 tabular-nums">
                              {dateLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          59 지도 레이어 BOTTOM SHEET
          ======================================================== */}
      <AnimatePresence>
        {isLayerSheetOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 backdrop-blur-[1px]"
            onClick={() => setIsLayerSheetOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-t-[28px] px-5 pt-3 pb-7 shadow-2xl space-y-6"
            >
              <div className="w-10 h-1 rounded-full bg-[#d9ddd8] mx-auto" />

              <div>
                <h3 className="text-[22px] font-bold text-[#202320] tracking-tight">지도 레이어</h3>
                <p className="text-[13px] text-[#8c948a] mt-1">지도에 보이는 정보를 골라요.</p>
              </div>

              {/* 지도 종류 */}
              <div className="space-y-2.5">
                <h4 className="text-[13px] font-semibold text-[#626961]">지도 종류</h4>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { id: 'eco' as const, label: '일반', previewBg: 'bg-white' },
                      { id: 'satellite' as const, label: '위성', previewBg: 'bg-[#e3e5e2]' },
                      { id: 'terrain' as const, label: '지형', previewBg: 'bg-[#ebeae4]' },
                    ]
                  ).map((layerOpt) => {
                    const isSelected = mapLayer === layerOpt.id;
                    return (
                      <button
                        key={layerOpt.id}
                        type="button"
                        onClick={() => {
                          setMapLayer(layerOpt.id);
                          onShowToast?.(`${layerOpt.label} 지도로 바꿨어요.`);
                        }}
                        className="flex flex-col items-center gap-2 cursor-pointer"
                      >
                        <div
                          className={`w-full h-[68px] rounded-[18px] ${layerOpt.previewBg} transition-all flex items-center justify-center overflow-hidden ${
                            isSelected
                              ? 'border-2 border-[#202320] shadow-xs'
                              : 'border border-transparent bg-[#eeeeee]'
                          }`}
                        >
                          {layerOpt.id === 'eco' && (
                            <div className="w-full h-full opacity-35 relative">
                              <div className="absolute inset-x-0 top-5 h-1.5 bg-[#d9ddd8]" />
                              <div className="absolute inset-y-0 left-7 w-1.5 bg-[#d9ddd8]" />
                            </div>
                          )}
                          {layerOpt.id === 'satellite' && (
                            <div className="w-full h-full bg-gradient-to-br from-[#c9d3c4] via-[#d7ded3] to-[#b8c4b4] opacity-75" />
                          )}
                          {layerOpt.id === 'terrain' && (
                            <div className="w-full h-full bg-gradient-to-tr from-[#e2e7d8] via-[#edf0e4] to-[#d6dfc6]" />
                          )}
                        </div>
                        <span
                          className={`text-[13px] ${
                            isSelected ? 'font-bold text-[#202320]' : 'font-medium text-[#626961]'
                          }`}
                        >
                          {layerOpt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 표시 옵션 (즉석 지도 핀 레이어 필터) */}
              <div className="space-y-3">
                <h4 className="text-[13px] font-semibold text-[#626961]">지도 표시 레이어</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[15px] font-bold text-[#202320] block">내 도감 핀 표시</span>
                      <span className="text-[12px] text-[#8c948a] mt-0.5 block">
                        확대 시 내가 수집한 생물 핀을 지도에 띄워요
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMySpecimenPins((prev) => !prev)}
                      aria-label="내 도감 핀 표시"
                      className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center shrink-0 cursor-pointer ${
                        showMySpecimenPins ? 'bg-black justify-end' : 'bg-[#e6e9e5] justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[15px] font-bold text-[#202320] block">내 기록만 지도에 보기</span>
                      <span className="text-[12px] text-[#8c948a] mt-0.5 block">
                        다른 탐험가 핀을 잠시 가리고 내 메모만 봐요
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOnlyMyMemos((prev) => !prev)}
                      aria-label="내 기록만 지도에 보기"
                      className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center shrink-0 cursor-pointer ${
                        onlyMyMemos ? 'bg-black justify-end' : 'bg-[#e6e9e5] justify-start'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODALS (H-10, Cluster, 61, 15/62, Write, 46/42, 58/68c/H-11)
          ======================================================== */}
      {/* 구역(클러스터) 기록 모아보기 */}
      <ClusterRecordsModal
        cluster={activeClusterArea}
        onClose={() => setActiveClusterArea(null)}
        hideProtectedLocations={hideProtectedLocations}
        onSelectMemo={(memo) => setActiveMemoDetailId(memo.id)}
        onSelectSpecimen={onSelectSpecimen}
        onZoomInArea={(lat, lng) => {
          mapInstanceRef.current?.flyTo([lat, lng], Math.max(15, mapZoom + 2), { duration: 0.7 });
        }}
      />

      {/* H-10 장소 상세 */}
      <PlaceDetailModal
        place={activePlaceDetail}
        onClose={() => setActivePlaceDetail(null)}
        memos={allUnblockedMemos}
        isBookmarked={activePlaceDetail ? bookmarkedPlaceIds.includes(activePlaceDetail.id) : false}
        onToggleBookmarkPlace={handleToggleBookmarkPlace}
        userCenter={{ lat: radarCenter.lat, lng: radarCenter.lng }}
        onSelectMemo={(memo) => setActiveMemoDetailId(memo.id)}
      />

      {/* 61 검색 · 장소 */}
      <MapSearchPlacesModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        searchQuery={effectiveQuery}
        onSearchChange={handleQueryChange}
        memos={allUnblockedMemos}
        specimens={specimens}
        userCenter={{ lat: radarCenter.lat, lng: radarCenter.lng }}
        bookmarkedPlaceIds={bookmarkedPlaceIds}
        onToggleBookmarkPlace={handleToggleBookmarkPlace}
        onSelectHotspot={handleSelectHotspot}
        onOpenPlaceDetail={(place) => setActivePlaceDetail(place)}
        onSelectMemo={(memo) => {
          mapInstanceRef.current?.flyTo([memo.lat, memo.lng], 15, { duration: 0.7 });
          setActiveMemoDetailId(memo.id);
        }}
        onSelectSpecimen={onSelectSpecimen}
      />

      {/* 15 / 62 기록(메모) 상세 · 댓글 · 신고/차단 */}
      <MemoDetailModal
        memo={activeMemoDetail}
        onClose={() => setActiveMemoDetailId(null)}
        userAccount={userAccount}
        onOpenLoginModal={onOpenLoginModal}
        isBookmarked={activeMemoDetail ? bookmarkedMemoIds.includes(activeMemoDetail.id) : false}
        hideProtectedLocations={hideProtectedLocations}
        hasOwnCollectedSpecimen={
          activeMemoDetail
            ? collectedSpecimens.some(
                (s) =>
                  (activeMemoDetail.specimenId && s.id === activeMemoDetail.specimenId) ||
                  s.koreanName === activeMemoDetail.speciesKoreanName
              )
            : false
        }
        onToggleLike={handleToggleLike}
        onToggleBookmark={handleToggleBookmarkMemo}
        onAddComment={handleAddComment}
        onOpenAuthorProfile={(authorId) => {
          setActiveMemoDetailId(null);
          setActiveProfileId(authorId);
        }}
        onReportMemo={handleReportMemo}
        onBlockUser={handleBlockUser}
        onDeleteOwnMemo={handleDeleteOwnMemo}
        onOpenSpecimenBySpecies={handleOpenSpecimenBySpecies}
        onOpenPublicSpecimenData={(entry) => setActivePublicSpecimen(entry)}
        allMemos={allUnblockedMemos}
        bookmarkedPlaceIds={bookmarkedPlaceIds}
        onToggleBookmarkPlace={handleToggleBookmarkPlace}
        onOpenPlaceDetail={(place) => setActivePlaceDetail(place)}
        onShowToast={onShowToast}
      />

      {/* 메모 쓰기 */}
      <WriteMemoModal
        isOpen={isWriteMemoOpen}
        onClose={() => {
          setIsWriteMemoOpen(false);
        }}
        specimens={specimens}
        currentCenter={radarCenter}
        userAccount={userAccount}
        userStats={userStats}
        onOpenLoginModal={onOpenLoginModal}
        onSubmitMemo={handleAddMemo}
      />

      {/* 46 / 42 프로필 */}
      <ExplorerProfileModal
        profile={activeProfile}
        isOwnAccount={activeProfileId === 'me'}
        onClose={() => setActiveProfileId(null)}
        userAccount={userAccount}
        userStats={userStats}
        specimens={specimens}
        memos={allUnblockedMemos}
        isFollowing={activeProfile ? followedUserIds.includes(activeProfile.id) : false}
        onToggleFollow={handleToggleFollow}
        onBlockUser={handleBlockUser}
        onSelectMemo={(memo) => setActiveMemoDetailId(memo.id)}
        onOpenPublicSpecimenData={(entry) => setActivePublicSpecimen(entry)}
        onOpenLoginModal={onOpenLoginModal}
        onOpenMyPage={onOpenMyPage}
      />

      {/* 타인 도감 데이터 열람 전용 모달 */}
      <PublicSpecimenDataModal
        entry={activePublicSpecimen}
        onClose={() => setActivePublicSpecimen(null)}
        hasOwnCollectedSpecimen={
          activePublicSpecimen
            ? collectedSpecimens.some(
                (s) =>
                  s.koreanName === activePublicSpecimen.speciesKoreanName ||
                  s.scientificName.toLowerCase() ===
                    activePublicSpecimen.speciesScientificName.toLowerCase()
              )
            : false
        }
        onOpenOwnSpecimen={(speciesName) => {
          setActivePublicSpecimen(null);
          setActiveMemoDetailId(null);
          setActiveProfileId(null);
          handleOpenSpecimenBySpecies(speciesName);
        }}
        onOpenAuthorProfile={(authorId) => {
          setActivePublicSpecimen(null);
          setActiveMemoDetailId(null);
          setActiveProfileId(authorId);
        }}
      />

      {/* ☰ 햄버거 메인 탐험 네비게이션 드로어 */}
      <MapMenuDrawerModal
        isOpen={activeModal === 'menu'}
        onClose={() => setActiveModal('none')}
        userAccount={userAccount}
        userStats={userStats}
        collectedCount={collectedSpecimens.length}
        unreadNotificationsCount={unreadNotificationsCount}
        ownMemosCount={communityMemos.filter((m) => m.authorId === 'me').length}
        savedItemsCount={bookmarkedMemoIds.length + bookmarkedPlaceIds.length}
        onNavigate={(target) => {
          if (target === 'profile') setActiveProfileId('me');
          else if (target === 'favorites') {
            setFavoritesInitialTab('memo');
            setActiveModal('favorites');
          } else if (target === 'ranking') setActiveModal('ranking');
          else if (target === 'manage_memos') setActiveModal('manage_memos');
          else if (target === 'notifications') setActiveModal('notifications');
          else if (target === 'reports') setActiveModal('reports');
          else if (target === 'rules') setActiveModal('rules');
          else if (target === 'settings') setActiveModal('settings');
        }}
      />

      {/* 39 / 63 즐겨찾기 (메모 / 장소) */}
      <FavoritesModal
        isOpen={activeModal === 'favorites'}
        onClose={() => setActiveModal('none')}
        initialTab={favoritesInitialTab}
        memos={allUnblockedMemos}
        bookmarkedMemoIds={bookmarkedMemoIds}
        bookmarkedPlaceIds={bookmarkedPlaceIds}
        onSelectMemo={(memo) => setActiveMemoDetailId(memo.id)}
        onSelectPlace={(place) => {
          setActiveModal('none');
          mapInstanceRef.current?.flyTo([place.lat, place.lng], 15, { duration: 0.8 });
          setActivePlaceDetail(place);
        }}
        onRemoveBookmarkMemo={handleToggleBookmarkMemo}
        onRemoveBookmarkPlace={handleToggleBookmarkPlace}
        onExploreMap={() => setActiveModal('none')}
      />

      {/* H-11 탐험 랭킹 */}
      <ExplorerRankingModal
        isOpen={activeModal === 'ranking'}
        onClose={() => setActiveModal('none')}
        userAccount={userAccount}
        userStats={userStats}
        collectedCount={collectedSpecimens.length}
        ownMemosCount={communityMemos.filter((m) => m.authorId === 'me').length}
        explorerProfiles={INITIAL_EXPLORER_PROFILES}
      />

      {/* 41 내 메모 관리 (다중 선택 삭제) */}
      <ManageMemosModal
        isOpen={activeModal === 'manage_memos'}
        onClose={() => setActiveModal('none')}
        memos={communityMemos}
        onDeleteMemos={(ids) => {
          setCommunityMemos((prev) => prev.filter((m) => !ids.includes(m.id)));
          if (selectedPinMemo && ids.includes(selectedPinMemo.id)) {
            setSelectedPinMemo(null);
          }
          onShowToast?.(`${ids.length}개의 메모를 삭제했어요.`);
        }}
        onSelectMemo={(memo) => setActiveMemoDetailId(memo.id)}
      />

      {/* 67 / 68c 알림 내역 */}
      <NotificationsModal
        isOpen={activeModal === 'notifications'}
        onClose={() => setActiveModal('none')}
        notifications={notifications}
        onMarkNotificationRead={(notifId) =>
          setNotifications((prev) =>
            prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
          )
        }
        onMarkAllNotificationsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        }
        onSelectMemoById={(memoId) => {
          const matched = communityMemos.find((m) => m.id === memoId);
          if (matched) {
            setActiveModal('none');
            setActiveMemoDetailId(matched.id);
          } else {
            onShowToast?.('삭제된 항목이에요');
          }
        }}
        onOpenAttendanceModal={onOpenAttendanceModal}
        onOpenReportHistory={() => setActiveModal('reports')}
        showCommunity={showCommunity}
      />

      {/* 68 신고 내역 */}
      <ReportHistoryModal
        isOpen={activeModal === 'reports'}
        onClose={() => setActiveModal('none')}
      />

      {/* 69 탐험 수칙 */}
      <ExplorerRulesModal
        isOpen={activeModal === 'rules'}
        onClose={() => setActiveModal('none')}
      />

      {/* 58 탐험맵 설정 */}
      <MapSettingsModal
        isOpen={activeModal === 'settings'}
        onClose={() => setActiveModal('none')}
        userStats={userStats}
        onUpdateStats={onUpdateStats}
        onUpdateMapSettings={onUpdateMapSettings}
        onTogglePushDiscoveryAlerts={onTogglePushDiscoveryAlerts}
        hideProtectedLocations={hideProtectedLocations}
        onToggleHideProtected={() => {
          const next = !hideProtectedLocations;
          setHideProtectedLocations(next);
          onUpdateMapSettings?.({ hideExactLocation: next });
        }}
        blockedUserIds={blockedUserIds}
        onUnblockUser={(uid) => {
          setBlockedUserIds((prev) => prev.filter((id) => id !== uid));
          onShowToast?.('차단을 해제했어요.');
        }}
        locationPermissionDenied={locationPermissionDenied}
        onRequestLocationPermission={handleLocateUser}
        showCommunity={showCommunity}
      />
    </div>
  );
};
