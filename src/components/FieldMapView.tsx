import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Specimen, UserStats, NaturalistPersona } from '../types';
import {
  Footprints,
  Plus,
  Minus,
  RotateCcw,
  MapPin,
  Calendar,
  Layers,
  Globe,
  Search,
  Camera,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Navigation as NavIcon,
  Radio,
  Crosshair,
  Share2,
  CheckCircle2,
  Target,
  Activity,
  Flame,
  Clock,
  Compass,
  Feather,
  Leaf,
  Bug,
  Cat,
  Sun,
  Droplets,
  Fish,
  SlidersHorizontal,
  Check,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import { HOTSPOT_DATA, SPECIES_ECOLOGY_ENCYCLOPEDIA, NATURALIST_PERSONAS } from '../data/hotspots';

interface FieldMapViewProps {
  specimens: Specimen[];
  userStats?: UserStats;
  onUpdatePersona?: (persona: NaturalistPersona) => void;
  onSelectSpecimen: (specimen: Specimen) => void;
  onOpenLens?: () => void;
  onOpenExportCard?: (specimen?: Specimen, mode?: 'specimen' | 'summary') => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  isProUser?: boolean;
  onOpenPaywall?: () => void;
}

type MapLayerType = 'eco' | 'satellite' | 'dark';

// Tile layer URL configurations (100% Free Open Data & OpenStreetMap GIS Tiles)
const TILE_SERVERS: Record<MapLayerType, { url: string; attribution: string; maxZoom: number }> = {
  eco: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
};

// BioBlitz Preset Hotspots for instant radar focusing
interface BioBlitzCenter {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  habitatType: string;
}

const BIOBLITZ_HOTSPOTS: BioBlitzCenter[] = [
  {
    id: 'seoul-forest',
    name: '서울숲 습지생태원',
    description: '성동구 뚝섬로 · 도심 수변 및 조류 서식지',
    lat: 37.5445,
    lng: 127.0374,
    habitatType: '수변 습지 & 활엽수림',
  },
  {
    id: 'namsan',
    name: '남산 한남자락 야외식물원',
    description: '용산구 이태원동 · 온대 야생화 군락',
    lat: 37.5492,
    lng: 126.993,
    habitatType: '온대 활엽수림 & 약용식물',
  },
  {
    id: 'olympic-park',
    name: '올림픽공원 몽촌호',
    description: '송파구 올림픽로 · 호수 수생태계 및 초지',
    lat: 37.5209,
    lng: 127.1214,
    habitatType: '호수 수변 & 잔디광장',
  },
  {
    id: 'yeouido-saetgang',
    name: '여의도 샛강 생태공원',
    description: '영등포구 여의동로 · 한강 지류 버드나무 군락',
    lat: 37.5186,
    lng: 126.9242,
    habitatType: '도심 하천 & 버드나무 습지',
  },
  {
    id: 'bukhansan',
    name: '북한산 우이령길',
    description: '강북구 우이동 · 국립공원 계곡 및 산림',
    lat: 37.6625,
    lng: 127.005,
    habitatType: '침엽·활엽 혼효림 & 계곡',
  },
  {
    id: 'jeju-gotjawal',
    name: '제주 곶자왈 도립공원',
    description: '서귀포시 대정읍 · 화산 암괴 천연림',
    lat: 33.2858,
    lng: 126.2753,
    habitatType: '용암지대 상록활엽수림',
  },
];

// Helper: Haversine distance in Kilometers
function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
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

// Helper: Resolve Real GPS Lat/Lng for Specimen Location
function getSpecimenGpsCoord(sp: Specimen, index: number): { lat: number; lng: number; regionTag: string } {
  if (typeof sp.locationCoord?.lat === 'number' && typeof sp.locationCoord?.lng === 'number') {
    return {
      lat: sp.locationCoord.lat,
      lng: sp.locationCoord.lng,
      regionTag: sp.locationCoord.city || '지정 위치',
    };
  }

  const cityName = sp.locationCoord?.city || '';
  const locName = sp.locationCoord?.name || '';
  const obsLoc = sp.observations?.[0]?.location || '';
  const fullText = `${cityName} ${locName} ${obsLoc} ${sp.koreanName}`;

  let baseLat = 37.5445; // Default near Seoul Forest
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
  } else if (fullText.includes('부산') || fullText.includes('이기대') || fullText.includes('을숙도')) {
    baseLat = 35.1796;
    baseLng = 129.0756;
    regionTag = '부산';
  }

  // Dispersion inside 300m - 1.2km radius so pins don't overlap 100%
  const hash = (sp.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + index * 19) % 100;
  const angle = (hash / 100) * 2 * Math.PI;
  const radius = 0.003 + ((hash % 11) / 11) * 0.007; // ~300m - 900m dispersion

  return {
    lat: baseLat + Math.cos(angle) * radius,
    lng: baseLng + Math.sin(angle) * radius,
    regionTag,
  };
}

export const FieldMapView: React.FC<FieldMapViewProps> = ({
  specimens,
  userStats,
  onUpdatePersona,
  onSelectSpecimen,
  onOpenLens,
  onOpenExportCard,
  searchQuery = '',
  onSearchChange,
}) => {
  // Only collected specimens
  const collectedSpecimens = useMemo(() => {
    return specimens.filter((s) => s.isCollected && !s.isPending);
  }, [specimens]);

  // Leaflet map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const radarGroupRef = useRef<L.LayerGroup | null>(null);

  // Map layer state
  const [mapLayer, setMapLayer] = useState<MapLayerType>('eco');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);
  const [isTrailExpanded, setIsTrailExpanded] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'radar' | 'trail'>('radar');
  const [activeTrailSpecimenId, setActiveTrailSpecimenId] = useState<string | null>(null);
  const [selectedMapSpecimen, setSelectedMapSpecimen] = useState<Specimen | null>(null);

  // BioBlitz Radar & Persona Customization State
  const [isBioBlitzActive, setIsBioBlitzActive] = useState<boolean>(true);
  const [radarCenter, setRadarCenter] = useState<BioBlitzCenter>(BIOBLITZ_HOTSPOTS[0]);
  const [isHotspotMenuOpen, setIsHotspotMenuOpen] = useState<boolean>(false);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);

  // User's active persona
  const activePersonaKey = userStats?.persona || 'general';
  const currentPersona = NATURALIST_PERSONAS[activePersonaKey] || NATURALIST_PERSONAS.general;
  const isGeneralPersona = activePersonaKey === 'general' || currentPersona.id === 'general';

  // Ensure general persona defaults to trail view
  useEffect(() => {
    if (isGeneralPersona && activeDrawerTab === 'radar') {
      setActiveDrawerTab('trail');
    }
  }, [isGeneralPersona, activeDrawerTab]);

  const getPersonaIcon = (pId: string) => {
    switch (pId) {
      case 'botanist': return Leaf;
      case 'birder': return Feather;
      case 'entomologist': return Bug;
      case 'mammalogist': return Cat;
      case 'herpetologist': return Sun;
      case 'ichthyologist': return Fish;
      case 'mycologist': return Sparkles;
      default: return Compass;
    }
  };
  const PersonaIcon = getPersonaIcon(activePersonaKey);

  // Resolved Specimen GPS Points
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
        isInsideRadar: distFromRadar <= 1.0, // within 1km
      };
    });
  }, [collectedSpecimens, radarCenter]);

  // Filtered by Search Query
  const filteredPoints = useMemo(() => {
    if (!localSearch.trim()) return specimenGpsPoints;
    const q = localSearch.toLowerCase().trim();
    return specimenGpsPoints.filter((pt) => {
      const sp = pt.specimen;
      return (
        (sp.koreanName || '').toLowerCase().includes(q) ||
        (sp.scientificName || '').toLowerCase().includes(q) ||
        (sp.family || '').toLowerCase().includes(q) ||
        (sp.locationCoord?.name || '').toLowerCase().includes(q) ||
        (sp.locationCoord?.city || '').toLowerCase().includes(q) ||
        (pt.regionTag || '').toLowerCase().includes(q)
      );
    });
  }, [specimenGpsPoints, localSearch]);

  // Specimens observed inside the 1km BioBlitz Radar
  const radarSpecimens = useMemo(() => {
    return specimenGpsPoints.filter((pt) => pt.isInsideRadar);
  }, [specimenGpsPoints]);

  // Recommended Species tailored to User's Custom Observation Persona (관찰 성향 맞춤)
  const recommendedNearbySpecies = useMemo(() => {
    const recommendedCategories = currentPersona?.recommendedCategories || ['plants', 'birds', 'insects', 'mammals'];

    // 1. Gather species from SPECIES_ECOLOGY_ENCYCLOPEDIA matching persona categories
    const matchingEncyclopediaSpecies = SPECIES_ECOLOGY_ENCYCLOPEDIA.filter((e) => {
      if (recommendedCategories.includes('all' as any)) return true;
      return recommendedCategories.includes(e.category as any);
    });

    // 2. Check hotspot data
    const currentHotspotData = HOTSPOT_DATA.find(
      (h) => h.name.includes(radarCenter.name.split(' ')[0]) || radarCenter.name.includes(h.name.split(' ')[0])
    );

    const targets: {
      koreanName: string;
      scientificName: string;
      rarity: 'common' | 'uncommon' | 'rare';
      chancePercent: number;
    }[] = [];

    // Prioritize hotspot target species that match persona
    if (currentHotspotData?.targetSpecies) {
      currentHotspotData.targetSpecies.forEach((tgt) => {
        const eco = SPECIES_ECOLOGY_ENCYCLOPEDIA.find((e) => e.koreanName === tgt.koreanName);
        if (eco && (recommendedCategories.includes('all' as any) || recommendedCategories.includes(eco.category as any))) {
          if (!targets.some((t) => t.koreanName === tgt.koreanName)) {
            targets.push(tgt);
          }
        }
      });
    }

    // Add matching encyclopedia species tailored to this persona
    matchingEncyclopediaSpecies.forEach((eco, idx) => {
      if (!targets.some((t) => t.koreanName === eco.koreanName)) {
        const rarity = idx % 5 === 4 ? 'rare' : (idx % 3 === 2 ? 'uncommon' : 'common');
        const chance = rarity === 'common' ? Math.max(75, 96 - idx * 2) : (rarity === 'uncommon' ? 55 : 35);
        targets.push({
          koreanName: eco.koreanName,
          scientificName: eco.scientificName,
          rarity,
          chancePercent: chance,
        });
      }
    });

    // Fallback if none found
    if (targets.length === 0) {
      const baseTargets = [
        { koreanName: '청둥오리', scientificName: 'Anas platyrhynchos', rarity: 'common' as const, chancePercent: 92 },
        { koreanName: '참새', scientificName: 'Passer montanus', rarity: 'common' as const, chancePercent: 96 },
        { koreanName: '왜가리', scientificName: 'Ardea cinerea', rarity: 'common' as const, chancePercent: 82 },
        { koreanName: '물총새', scientificName: 'Alcedo atthis', rarity: 'uncommon' as const, chancePercent: 48 },
        { koreanName: '직박구리', scientificName: 'Hypsipetes amaurotis', rarity: 'common' as const, chancePercent: 88 },
        { koreanName: '호랑나비', scientificName: 'Papilio xuthus', rarity: 'common' as const, chancePercent: 78 },
        { koreanName: '청개구리', scientificName: 'Dryophytes japonicus', rarity: 'common' as const, chancePercent: 70 },
        { koreanName: '은행나무', scientificName: 'Ginkgo biloba', rarity: 'common' as const, chancePercent: 98 },
      ];
      targets.push(...baseTargets);
    }

    const curatedTargets = targets.slice(0, 12);

    return curatedTargets.map((tgt) => {
      const matchingSpecimen = collectedSpecimens.find(
        (sp) => sp.koreanName === tgt.koreanName || sp.scientificName === tgt.scientificName
      );
      const encyclopedia = SPECIES_ECOLOGY_ENCYCLOPEDIA.find(
        (e) => e.koreanName === tgt.koreanName || e.scientificName === tgt.scientificName
      );

      return {
        ...tgt,
        isDiscovered: !!matchingSpecimen,
        collectedSpecimen: matchingSpecimen,
        category: encyclopedia?.category || 'birds',
        categoryLabel: encyclopedia?.categoryLabel || '생물종',
        habitatTip: encyclopedia?.habitat || '주변 도심 공원 수풀 및 수변',
        bestTime: currentHotspotData?.bestTime || '오전 07:00 ~ 11:00',
      };
    });
  }, [radarCenter, collectedSpecimens, currentPersona]);

  // All recommended targets tailored to current persona
  const filteredTargets = recommendedNearbySpecies;

  // BioBlitz Completion Rate
  const discoveredTargetsCount = recommendedNearbySpecies.filter((t) => t.isDiscovered).length;
  const targetCompletionPct = Math.round(
    (discoveredTargetsCount / (recommendedNearbySpecies.length || 1)) * 100
  );

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on default BioBlitz Radar hotspot
    const map = L.map(mapContainerRef.current, {
      center: [radarCenter.lat, radarCenter.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    const tileServer = TILE_SERVERS[mapLayer];
    const tileLayer = L.tileLayer(tileServer.url, {
      maxZoom: tileServer.maxZoom,
      attribution: tileServer.attribution,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const radarGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    markersGroupRef.current = markersGroup;
    radarGroupRef.current = radarGroup;

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
      attribution: tileServer.attribution,
    });
    newTileLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;
  }, [mapLayer]);

  // Render BioBlitz Radar Circle & Pulse Beacon
  useEffect(() => {
    if (!mapInstanceRef.current || !radarGroupRef.current) return;

    const radarGroup = radarGroupRef.current;
    radarGroup.clearLayers();

    if (!isBioBlitzActive) return;

    // 1. Outer 1km BioBlitz boundary circle (1000m)
    const outerCircle = L.circle([radarCenter.lat, radarCenter.lng], {
      radius: 1000,
      color: '#10B981',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#10B981',
      fillOpacity: 0.1,
    });
    radarGroup.addLayer(outerCircle);

    // 2. Inner 500m core zone circle (500m)
    const innerCircle = L.circle([radarCenter.lat, radarCenter.lng], {
      radius: 500,
      color: '#059669',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#059669',
      fillOpacity: 0.05,
    });
    radarGroup.addLayer(innerCircle);

    // 3. Radar Center Ping Marker with glowing sweep effect
    const radarCenterIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 rounded-full bg-emerald-500/20 animate-ping"></div>
          <div class="absolute w-8 h-8 rounded-full bg-emerald-500/30"></div>
          <div class="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center z-10">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
          <div class="absolute -top-7 whitespace-nowrap px-2 py-0.5 rounded-full bg-stone-900/90 text-white font-mono text-[9px] font-bold border border-emerald-500/50 shadow-md">
            ${radarCenter.id === 'user-current-gps' ? '📍 내 GPS 탐사 위치' : `🧭 ${radarCenter.name}`}
          </div>
        </div>
      `,
      className: 'custom-radar-center-icon',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const centerMarker = L.marker([radarCenter.lat, radarCenter.lng], {
      icon: radarCenterIcon,
    });
    radarGroup.addLayer(centerMarker);
  }, [radarCenter, isBioBlitzActive]);

  // Update Specimen Pins on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    if (filteredPoints.length === 0) return;

    filteredPoints.forEach((pt) => {
      const sp = pt.specimen;
      const isSelected = activeTrailSpecimenId === sp.id || selectedMapSpecimen?.id === sp.id;
      const photo = sp.stickerImage || sp.originalImage || sp.observations?.[0]?.photoUrl || '';
      const isInside = pt.isInsideRadar;

      // Custom HTML Marker Icon
      const iconHtml = `
        <div class="relative group cursor-pointer transition-transform duration-200 transform hover:scale-110 ${
          isSelected ? 'scale-125 z-50' : 'z-10'
        }">
          <div class="relative w-11 h-11 rounded-2xl p-0.5 shadow-lg flex items-center justify-center ${
            isSelected
              ? 'bg-emerald-500 ring-4 ring-emerald-300 ring-opacity-70 scale-105'
              : isInside && isBioBlitzActive
              ? 'bg-emerald-600 ring-2 ring-emerald-400/60'
              : 'bg-stone-900 hover:bg-emerald-700'
          }">
            <div class="w-full h-full rounded-xl overflow-hidden bg-stone-900 border border-white/40">
              <img src="${photo}" alt="${sp.koreanName}" referrerpolicy="no-referrer" class="w-full h-full object-cover" />
            </div>
            ${
              isInside && isBioBlitzActive
                ? `<span class="absolute -top-1.5 -left-1 bg-emerald-500 text-white font-black text-[8px] px-1 rounded-full shadow-xs border border-white">1km</span>`
                : ''
            }
            <span class="absolute -top-1 -right-1 bg-amber-400 text-stone-950 font-black text-[9px] px-1 rounded-full shadow-xs border border-white">
              ${sp.koreanName.substring(0, 2)}
            </span>
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 ${
            isSelected ? 'bg-emerald-500' : isInside ? 'bg-emerald-600' : 'bg-stone-900'
          } rotate-45 border-r border-b border-white/30"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-specimen-leaflet-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 44],
        popupAnchor: [0, -44],
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: customIcon });

      // Popup Content with Samsung Health Share Button
      const popupHtml = `
        <div class="p-2.5 min-w-[210px] text-stone-900 font-sans select-none">
          <div class="relative w-full h-28 rounded-xl overflow-hidden mb-2 bg-stone-900">
            <img src="${photo}" alt="${sp.koreanName}" referrerpolicy="no-referrer" class="w-full h-full object-cover" />
            <div class="absolute top-2 left-2 flex items-center gap-1">
              <span class="bg-stone-950/80 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-full border border-stone-700">
                ${pt.regionTag}
              </span>
              ${
                isInside
                  ? `<span class="bg-emerald-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-xs">반경 1km 내</span>`
                  : ''
              }
            </div>
          </div>
          <h4 class="font-black text-sm text-stone-900 tracking-tight leading-tight">${sp.koreanName}</h4>
          <p class="font-serif italic text-xs text-stone-500 mb-2.5">${sp.scientificName}</p>
          
          <div class="space-y-1.5">
            <button id="view-specimen-btn-${sp.id}" class="w-full py-1.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer">
              표본 상세 도감 보기 &rarr;
            </button>
            <button id="share-card-btn-${sp.id}" class="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer">
              📤 삼성 헬스 생태 카드 공유
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: true,
        className: 'custom-leaflet-popup-card',
      });

      marker.on('click', () => {
        setSelectedMapSpecimen(sp);
        setActiveTrailSpecimenId(sp.id);
        mapInstanceRef.current?.flyTo([pt.lat, pt.lng], 14, { duration: 1.0 });
      });

      marker.on('popupopen', () => {
        setTimeout(() => {
          const viewBtn = document.getElementById(`view-specimen-btn-${sp.id}`);
          if (viewBtn) {
            viewBtn.onclick = () => onSelectSpecimen(sp);
          }
          const shareBtn = document.getElementById(`share-card-btn-${sp.id}`);
          if (shareBtn && onOpenExportCard) {
            shareBtn.onclick = () => onOpenExportCard(sp, 'specimen');
          }
        }, 50);
      });

      markersGroup.addLayer(marker);
    });
  }, [
    filteredPoints,
    activeTrailSpecimenId,
    selectedMapSpecimen,
    isBioBlitzActive,
    onSelectSpecimen,
    onOpenExportCard,
  ]);

  // Pan to Hotspot
  const handleSelectHotspot = (hotspot: BioBlitzCenter) => {
    setRadarCenter(hotspot);
    setIsHotspotMenuOpen(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([hotspot.lat, hotspot.lng], 14, { duration: 1.2 });
    }
  };

  // Locate User Real GPS
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('사용자의 기기에서 위치 정보(GPS)를 지원하지 않습니다.');
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        const userLoc: BioBlitzCenter = {
          id: 'user-current-gps',
          name: '내 현재 GPS 위치',
          description: `위도 ${pos.coords.latitude.toFixed(4)}° · 경도 ${pos.coords.longitude.toFixed(4)}°`,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          habitatType: '현장 실시간 탐사 위치',
        };
        setRadarCenter(userLoc);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([userLoc.lat, userLoc.lng], 14, { duration: 1.2 });
        }
      },
      (err) => {
        setIsLocatingUser(false);
        console.warn('Geolocation failed:', err.message);
        // Fallback to Seoul Forest
        handleSelectHotspot(BIOBLITZ_HOTSPOTS[0]);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative w-full h-[calc(100vh-120px)] sm:h-[calc(100vh-130px)] bg-stone-100 overflow-hidden flex flex-col font-sans select-none">
      {/* Real OpenStreetMap / Leaflet Canvas Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* ========================================================
          Top Floating Control Bar (Search, BioBlitz Radar, Layer)
          ======================================================== */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-none">
        {/* Left: BioBlitz Hotspots & Location Selector */}
        <div className="pointer-events-auto flex items-center gap-1.5 flex-wrap">
          {/* Hotspot & GPS Location Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                const nextOpen = !isHotspotMenuOpen;
                setIsHotspotMenuOpen(nextOpen);
                if (nextOpen) {
                  // Mutual exclusivity: collapse bottom drawer so they never overlap!
                  setIsTrailExpanded(false);
                  setIsLayerMenuOpen(false);
                }
              }}
              className="px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md text-stone-800 hover:text-stone-950 border border-stone-200/90 shadow-sm text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span className="max-w-[120px] sm:max-w-[160px] truncate">{radarCenter.name}</span>
              <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${isHotspotMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Hotspot Dropdown with max-h and scrollbar */}
            <AnimatePresence>
              {isHotspotMenuOpen && (
                <>
                  {/* Backdrop click to dismiss */}
                  <div
                    className="fixed inset-0 z-20 pointer-events-auto"
                    onClick={() => setIsHotspotMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    className="absolute left-0 mt-2 w-72 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto scrollbar-thin bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-stone-200/90 shadow-2xl z-30 space-y-1 text-xs pointer-events-auto"
                  >
                    {/* Current GPS Locate Option */}
                    <button
                      type="button"
                      onClick={handleLocateUser}
                      disabled={isLocatingUser}
                      className={`w-full p-2.5 rounded-xl font-black flex items-center justify-between transition-colors cursor-pointer border ${
                        radarCenter.id === 'user-current-gps'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Crosshair className={`w-4 h-4 ${radarCenter.id === 'user-current-gps' ? 'text-white' : 'text-emerald-600'} ${isLocatingUser ? 'animate-spin' : ''}`} />
                        <span>내 실제 GPS 위치로 설정</span>
                      </div>
                      {isLocatingUser ? (
                        <span className="text-[10px] text-emerald-200">수신중...</span>
                      ) : radarCenter.id === 'user-current-gps' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      ) : null}
                    </button>

                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 pt-1 font-mono">
                      바이오블리츠 탐사 기점 ({BIOBLITZ_HOTSPOTS.length}곳)
                    </div>

                    {BIOBLITZ_HOTSPOTS.map((hotspot) => {
                      const isCur = radarCenter.id === hotspot.id;
                      return (
                        <button
                          key={hotspot.id}
                          type="button"
                          onClick={() => handleSelectHotspot(hotspot)}
                          className={`w-full p-2 rounded-xl text-left transition-colors cursor-pointer flex items-center justify-between ${
                            isCur
                              ? 'bg-stone-900 text-white font-bold shadow-xs'
                              : 'text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-xs truncate">{hotspot.name}</div>
                            <div
                              className={`text-[10px] truncate ${
                                isCur ? 'text-stone-300' : 'text-stone-500'
                              }`}
                            >
                              {hotspot.description}
                            </div>
                          </div>
                          {isCur && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Search, Map Layer Switcher, Lens Trigger */}
        <div className="pointer-events-auto flex items-center gap-1.5 self-end sm:self-auto">
          {/* Layer Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                const nextOpen = !isLayerMenuOpen;
                setIsLayerMenuOpen(nextOpen);
                if (nextOpen) {
                  setIsHotspotMenuOpen(false);
                  setIsTrailExpanded(false);
                }
              }}
              className="px-2.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md text-stone-800 hover:text-stone-950 border border-stone-200/90 shadow-sm text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">
                {mapLayer === 'eco' && '🗺️ 표준 지도'}
                {mapLayer === 'satellite' && '🛰️ 위성 지도'}
                {mapLayer === 'dark' && '🌙 다크 지도'}
              </span>
            </button>

            <AnimatePresence>
              {isLayerMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20 pointer-events-auto"
                    onClick={() => setIsLayerMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-stone-200/90 shadow-lg z-30 space-y-1 text-xs pointer-events-auto"
                  >
                  <button
                    type="button"
                    onClick={() => {
                      setMapLayer('eco');
                      setIsLayerMenuOpen(false);
                    }}
                    className={`w-full p-2 rounded-xl text-left font-bold flex items-center gap-2 cursor-pointer ${
                      mapLayer === 'eco' ? 'bg-emerald-800 text-white' : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>🗺️ 표준 생태 지도</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMapLayer('satellite');
                      setIsLayerMenuOpen(false);
                    }}
                    className={`w-full p-2 rounded-xl text-left font-bold flex items-center gap-2 cursor-pointer ${
                      mapLayer === 'satellite' ? 'bg-emerald-800 text-white' : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>🛰️ 고해상도 위성 지도</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMapLayer('dark');
                      setIsLayerMenuOpen(false);
                    }}
                    className={`w-full p-2 rounded-xl text-left font-bold flex items-center gap-2 cursor-pointer ${
                      mapLayer === 'dark' ? 'bg-emerald-800 text-white' : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>🌙 야간 관찰 다크 지도</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          </div>

          {/* Quick AI Lens Trigger */}
          {onOpenLens && (
            <button
              type="button"
              onClick={onOpenLens}
              className="px-3.5 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>AI 촬영 탐사</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Zoom Controls & Recenter */}
      <div className="absolute right-3 bottom-36 sm:bottom-40 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-10 h-10 rounded-2xl bg-white/95 hover:bg-stone-100 text-stone-800 border border-stone-200/90 shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-90"
          title="확대 (+)"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-10 h-10 rounded-2xl bg-white/95 hover:bg-stone-100 text-stone-800 border border-stone-200/90 shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-90"
          title="축소 (-)"
        >
          <Minus className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (mapInstanceRef.current) {
              if (radarCenter.id === 'user-current-gps') {
                mapInstanceRef.current.flyTo([radarCenter.lat, radarCenter.lng], 15, { duration: 1.2 });
              } else {
                handleLocateUser();
              }
            }
          }}
          disabled={isLocatingUser}
          className="w-10 h-10 rounded-2xl bg-white/95 hover:bg-stone-100 text-emerald-800 border border-stone-200/90 shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-90"
          title="내 GPS 위치로 이동"
        >
          <Crosshair className={`w-4 h-4 ${isLocatingUser ? 'animate-spin text-emerald-500' : 'text-emerald-700'}`} />
        </button>
      </div>

      {/* ========================================================
          Bottom BioBlitz Radar & Trail Drawer (Galaxy One UI Glass)
          ======================================================== */}
      <div className="absolute bottom-2.5 left-3 right-3 z-20">
        <div className="galaxy-glass-card rounded-[28px] overflow-hidden transition-all shadow-xl">
          {/* Drawer Top Navigation & Mode Switcher */}
          <div className="p-2.5 px-4 flex items-center justify-between border-b border-stone-200/80 bg-white/60">
            {/* Tabs: Recommended Species vs Observation Trail */}
            <div className="flex items-center gap-1">
              {!isGeneralPersona && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawerTab('radar');
                    setIsTrailExpanded(true);
                    setIsHotspotMenuOpen(false);
                    setIsLayerMenuOpen(false);
                  }}
                  className={`py-1 px-3 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeDrawerTab === 'radar'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>{currentPersona.title} 맞춤 추천</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setActiveDrawerTab('trail');
                  setIsTrailExpanded(true);
                  setIsHotspotMenuOpen(false);
                  setIsLayerMenuOpen(false);
                }}
                className={`py-1 px-3 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  isGeneralPersona || activeDrawerTab === 'trail'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>내 관찰 발자취 ({filteredPoints.length}개)</span>
              </button>
            </div>

            {/* Collapse / Expand Toggle */}
            <div className="flex items-center gap-2">
              {/* Samsung Health Quick Report Export Button */}
              {onOpenExportCard && (
                <button
                  type="button"
                  onClick={() => onOpenExportCard(undefined, 'summary')}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 text-[11px] font-bold transition-all cursor-pointer"
                  title="삼성 헬스 종합 리포트 카드 공유"
                >
                  <Share2 className="w-3 h-3 text-emerald-700" />
                  <span>생태 카드 공유</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const nextExpanded = !isTrailExpanded;
                  setIsTrailExpanded(nextExpanded);
                  if (nextExpanded) {
                    setIsHotspotMenuOpen(false);
                    setIsLayerMenuOpen(false);
                  }
                }}
                className="p-1 rounded-full text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
              >
                {isTrailExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          {isTrailExpanded && (
            <div className="p-3 max-h-56 sm:max-h-64 overflow-y-auto scrollbar-thin">
              {/* =====================================================
                  1. BIOBLITZ 1KM RADAR RECOMMENDED SPECIES TAB
                  (만능 탐험가는 미노출)
                  ===================================================== */}
              {!isGeneralPersona && activeDrawerTab === 'radar' && (
                <div className="space-y-2.5">
                  {/* Persona-Adaptive Recommended Species Header */}
                  <div className="p-2.5 px-3 rounded-2xl bg-white/90 border border-stone-200/80 shadow-2xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
                        <PersonaIcon className="w-4 h-4 stroke-[2.2px]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-stone-900 truncate">
                            {currentPersona.title} 맞춤 추천
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {recommendedNearbySpecies.length}종
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500 truncate">
                          {radarCenter.name} 주변 관찰 확률 높은 생물
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 1km Target Species Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {filteredTargets.map((tgt, idx) => {
                      const isFound = tgt.isDiscovered;
                      const sp = tgt.collectedSpecimen;

                      return (
                        <div
                          key={`${tgt.koreanName}-${idx}`}
                          className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                            isFound
                              ? 'bg-emerald-50/70 border-emerald-300 text-stone-900'
                              : 'bg-white border-stone-200/90 text-stone-800 hover:border-emerald-300'
                          }`}
                        >
                          <div>
                            {/* Card Top: Discovery Status & Chance */}
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${
                                  isFound
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-stone-100 text-stone-600 border-stone-200'
                                }`}
                              >
                                {isFound ? '✅ 관찰 완료' : '🎯 출현 유력'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-emerald-700">
                                확률 {tgt.chancePercent}%
                              </span>
                            </div>

                            {/* Korean & Scientific Name */}
                            <h4 className="text-xs font-black text-stone-900 truncate">
                              {tgt.koreanName}
                            </h4>
                            <p className="text-[10px] font-serif italic text-stone-500 truncate mb-1.5">
                              {tgt.scientificName}
                            </p>

                            {/* Habitat Tip */}
                            <p className="text-[10px] text-stone-500 line-clamp-1 mb-2">
                              🌿 {tgt.habitatTip}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-black/5">
                            {isFound && sp ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onSelectSpecimen(sp)}
                                  className="flex-1 py-1 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-[10px] transition-colors cursor-pointer text-center"
                                >
                                  도감 보기
                                </button>
                                {onOpenExportCard && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenExportCard(sp, 'specimen')}
                                    className="p-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold transition-colors cursor-pointer"
                                    title="삼성 헬스 생태 카드 공유"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={onOpenLens}
                                className="w-full py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                              >
                                <Camera className="w-3 h-3 text-white" />
                                <span>AI 카메라로 포착하기</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* =====================================================
                  2. MY OBSERVATION TRAIL CHRONOLOGICAL LIST TAB
                  ===================================================== */}
              {(isGeneralPersona || activeDrawerTab === 'trail') && (
                <div>
                  {filteredPoints.length === 0 ? (
                    <div className="w-full text-center py-6 text-xs text-stone-500 space-y-1">
                      <p className="font-bold text-stone-700">관찰 표본이 없습니다.</p>
                      {localSearch && (
                        <button
                          type="button"
                          onClick={() => setLocalSearch('')}
                          className="text-[11px] font-bold text-emerald-700 underline cursor-pointer"
                        >
                          전체 보기
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {filteredPoints.map((pt, idx) => {
                        const sp = pt.specimen;
                        const photo =
                          sp.stickerImage || sp.originalImage || sp.observations?.[0]?.photoUrl || '';
                        const isSelected = activeTrailSpecimenId === sp.id;

                        return (
                          <div
                            key={`${sp.id}-${idx}`}
                            onClick={() => {
                              setActiveTrailSpecimenId(sp.id);
                              setSelectedMapSpecimen(sp);
                              mapInstanceRef.current?.flyTo([pt.lat, pt.lng], 14, { duration: 1.0 });
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-600 text-stone-900 shadow-sm'
                                : 'bg-white hover:bg-stone-50 border-stone-200/90 text-stone-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                                {photo ? (
                                  <img
                                    src={photo}
                                    alt={sp.koreanName}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Camera className="w-4 h-4 text-stone-400 m-auto mt-3" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-black truncate text-stone-900">
                                  {sp.koreanName}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mt-0.5 truncate">
                                  <span className="flex items-center gap-0.5 text-emerald-800 font-bold">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    {pt.regionTag}
                                  </span>
                                  <span>·</span>
                                  <span className="font-mono">
                                    {pt.distanceKm.toFixed(1)}km
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-1 ml-2">
                              {onOpenExportCard && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenExportCard(sp, 'specimen');
                                  }}
                                  className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                                  title="삼성 헬스 생태 카드"
                                >
                                  <Share2 className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectSpecimen(sp);
                                }}
                                className="px-2 py-1 rounded-xl bg-stone-900 hover:bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-0.5 transition-colors cursor-pointer"
                              >
                                <span>상세</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
