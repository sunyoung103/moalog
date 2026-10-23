import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Specimen, UserStats, NaturalistPersona } from '../types';
import {
  MapPin,
  Compass,
  Globe,
  Moon,
  Camera,
  Plus,
  Minus,
  Crosshair,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  X,
  Footprints,
  Radio,
  Search,
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

// Free Tile Server URLs
const TILE_SERVERS: Record<MapLayerType, { url: string; maxZoom: number }> = {
  eco: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    maxZoom: 19,
  },
};

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
    name: '남산 야외식물원',
    description: '용산구 이태원동 · 온대 야생화 군락',
    lat: 37.5492,
    lng: 126.993,
    habitatType: '온대 활엽수림',
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
    habitatType: '침엽·활엽 혼효림',
  },
  {
    id: 'jeju-gotjawal',
    name: '제주 곶자왈 도립공원',
    description: '서귀포시 대정읍 · 화산 천연림',
    lat: 33.2858,
    lng: 126.2753,
    habitatType: '상록활엽수림',
  },
];

// Haversine distance in km
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

// GPS coordinate resolution helper
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

export const FieldMapView: React.FC<FieldMapViewProps> = ({
  specimens,
  userStats,
  onSelectSpecimen,
  onOpenLens,
  searchQuery = '',
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

  // States
  const [mapLayer, setMapLayer] = useState<MapLayerType>('eco');
  const [isHotspotMenuOpen, setIsHotspotMenuOpen] = useState(false);
  const [radarCenter, setRadarCenter] = useState<BioBlitzCenter>(BIOBLITZ_HOTSPOTS[0]);
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  // Selected Pin for Floating Inspection Card
  const [selectedPinSpecimen, setSelectedPinSpecimen] = useState<Specimen | null>(null);

  // Bottom Drawer State
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'radar' | 'trail'>('radar');

  // User persona
  const activePersonaKey = userStats?.persona || 'general';
  const currentPersona = NATURALIST_PERSONAS[activePersonaKey] || NATURALIST_PERSONAS.general;

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

  // Filtered by Search Query
  const filteredPoints = useMemo(() => {
    if (!searchQuery.trim()) return specimenGpsPoints;
    const q = searchQuery.toLowerCase().trim();
    return specimenGpsPoints.filter((pt) => {
      const sp = pt.specimen;
      return (
        (sp.koreanName || '').toLowerCase().includes(q) ||
        (sp.scientificName || '').toLowerCase().includes(q) ||
        (pt.regionTag || '').toLowerCase().includes(q)
      );
    });
  }, [specimenGpsPoints, searchQuery]);

  // Recommended Nearby Targets
  const recommendedNearbySpecies = useMemo(() => {
    const recommendedCategories = currentPersona?.recommendedCategories || ['plants', 'birds', 'insects', 'mammals'];

    const matchingEncyclopediaSpecies = SPECIES_ECOLOGY_ENCYCLOPEDIA.filter((e) => {
      if (recommendedCategories.includes('all' as any)) return true;
      return recommendedCategories.includes(e.category as any);
    });

    const currentHotspotData = HOTSPOT_DATA.find(
      (h) => h.name.includes(radarCenter.name.split(' ')[0]) || radarCenter.name.includes(h.name.split(' ')[0])
    );

    const targets: {
      koreanName: string;
      scientificName: string;
      rarity: 'common' | 'uncommon' | 'rare';
      chancePercent: number;
    }[] = [];

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

    matchingEncyclopediaSpecies.forEach((eco, idx) => {
      if (!targets.some((t) => t.koreanName === eco.koreanName)) {
        const rarity = idx % 5 === 4 ? 'rare' : idx % 3 === 2 ? 'uncommon' : 'common';
        const chance = rarity === 'common' ? Math.max(75, 96 - idx * 2) : rarity === 'uncommon' ? 55 : 35;
        targets.push({
          koreanName: eco.koreanName,
          scientificName: eco.scientificName,
          rarity,
          chancePercent: chance,
        });
      }
    });

    return targets.slice(0, 10).map((tgt) => {
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
        habitatTip: encyclopedia?.habitat || '주변 도심 공원 수풀 및 수변',
      };
    });
  }, [radarCenter, collectedSpecimens, currentPersona]);

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

    const markersGroup = L.layerGroup().addTo(map);
    const radarGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    markersGroupRef.current = markersGroup;
    radarGroupRef.current = radarGroup;

    // Click on blank map closes inspector card
    map.on('click', () => {
      setSelectedPinSpecimen(null);
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

  // Render BioBlitz Radar Circles (1km subtle ring)
  useEffect(() => {
    if (!mapInstanceRef.current || !radarGroupRef.current) return;

    const radarGroup = radarGroupRef.current;
    radarGroup.clearLayers();

    // 1km radar perimeter
    const outerCircle = L.circle([radarCenter.lat, radarCenter.lng], {
      radius: 1000,
      color: '#10B981',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#10B981',
      fillOpacity: 0.05,
    });
    radarGroup.addLayer(outerCircle);

    // Center pulse beacon
    const radarCenterIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-emerald-500/20 animate-ping"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white shadow-md z-10"></div>
        </div>
      `,
      className: 'custom-radar-center-icon',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const centerMarker = L.marker([radarCenter.lat, radarCenter.lng], {
      icon: radarCenterIcon,
    });
    radarGroup.addLayer(centerMarker);
  }, [radarCenter]);

  // Render Specimen Pins on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    if (filteredPoints.length === 0) return;

    filteredPoints.forEach((pt) => {
      const sp = pt.specimen;
      const isSelected = selectedPinSpecimen?.id === sp.id;
      const photo = sp.stickerImage || sp.originalImage || sp.observations?.[0]?.photoUrl || '';

      const iconHtml = `
        <div class="relative cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-10'
        }">
          <div class="w-9 h-9 rounded-full p-0.5 shadow-md flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-stone-900 ring-4 ring-emerald-400 ring-offset-1'
              : 'bg-white border-2 border-white'
          }">
            <div class="w-full h-full rounded-full overflow-hidden bg-stone-100">
              <img src="${photo}" alt="${sp.koreanName}" referrerpolicy="no-referrer" class="w-full h-full object-cover" />
            </div>
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 ${
            isSelected ? 'bg-stone-900' : 'bg-white'
          } rotate-45 shadow-2xs"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-specimen-pin',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedPinSpecimen(sp);
        mapInstanceRef.current?.flyTo([pt.lat, pt.lng], 15, { duration: 0.8 });
      });

      markersGroup.addLayer(marker);
    });
  }, [filteredPoints, selectedPinSpecimen]);

  // Pan to Hotspot
  const handleSelectHotspot = (hotspot: BioBlitzCenter) => {
    setRadarCenter(hotspot);
    setIsHotspotMenuOpen(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([hotspot.lat, hotspot.lng], 14, { duration: 1.0 });
    }
  };

  // Locate User Real GPS
  const handleLocateUser = () => {
    if (!navigator.geolocation) return;
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        const userLoc: BioBlitzCenter = {
          id: 'user-current-gps',
          name: '내 현재 GPS 위치',
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
        handleSelectHotspot(BIOBLITZ_HOTSPOTS[0]);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative w-full h-[calc(100vh-120px)] sm:h-[calc(100vh-130px)] bg-[#f4f2ee] overflow-hidden flex flex-col font-geist select-none">
      {/* Real Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* ========================================================
          TOP FLOATING CONTROL BAR (Disciplined Dribbble Bar)
          ======================================================== */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
        {/* Left: Location Dropdown Pill */}
        <div className="pointer-events-auto relative">
          <button
            type="button"
            onClick={() => setIsHotspotMenuOpen(!isHotspotMenuOpen)}
            className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-stone-900 border border-stone-200/90 shadow-2xs text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <MapPin className="w-3.5 h-3.5 text-stone-700 stroke-[2]" />
            <span className="max-w-[130px] sm:max-w-[180px] truncate">{radarCenter.name}</span>
            <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${isHotspotMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Hotspot Dropdown Menu */}
          <AnimatePresence>
            {isHotspotMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20 pointer-events-auto"
                  onClick={() => setIsHotspotMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.14 }}
                  className="absolute left-0 mt-2 w-72 max-h-[50vh] overflow-y-auto scrollbar-thin bg-white/98 backdrop-blur-xl p-1.5 rounded-2xl border border-stone-200/90 shadow-xl z-30 space-y-1 text-xs pointer-events-auto"
                >
                  {/* Current GPS option */}
                  <button
                    type="button"
                    onClick={handleLocateUser}
                    disabled={isLocatingUser}
                    className={`w-full p-2.5 rounded-xl font-mono text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer border ${
                      radarCenter.id === 'user-current-gps'
                        ? 'bg-stone-900 text-white border-stone-800'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Crosshair className={`w-3.5 h-3.5 ${isLocatingUser ? 'animate-spin' : ''}`} />
                      <span>내 현재 GPS 위치로 이동</span>
                    </div>
                    {radarCenter.id === 'user-current-gps' && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>

                  <div className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-wider px-2 pt-1.5">
                    생태 탐사 기점
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
                            ? 'bg-stone-900 text-white font-bold'
                            : 'text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-xs truncate">{hotspot.name}</div>
                          <div className={`text-[10px] font-mono truncate ${isCur ? 'text-stone-400' : 'text-stone-400'}`}>
                            {hotspot.description}
                          </div>
                        </div>
                        {isCur && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Map Layer Segmented Control & AI Lens Action */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          {/* Minimal 3-State Map Layer Toggle */}
          <div className="inline-flex p-0.5 rounded-full bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-2xs">
            <button
              type="button"
              onClick={() => setMapLayer('eco')}
              className={`relative px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                mapLayer === 'eco' ? 'text-white' : 'text-stone-500 hover:text-stone-900'
              }`}
              title="표준 지도"
            >
              {mapLayer === 'eco' && (
                <motion.div
                  layoutId="mapLayerPill"
                  className="absolute inset-0 bg-stone-900 rounded-full"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <Compass className="w-3 h-3" />
                <span className="hidden sm:inline">STD</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMapLayer('satellite')}
              className={`relative px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                mapLayer === 'satellite' ? 'text-white' : 'text-stone-500 hover:text-stone-900'
              }`}
              title="위성 지도"
            >
              {mapLayer === 'satellite' && (
                <motion.div
                  layoutId="mapLayerPill"
                  className="absolute inset-0 bg-stone-900 rounded-full"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span className="hidden sm:inline">SAT</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMapLayer('dark')}
              className={`relative px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                mapLayer === 'dark' ? 'text-white' : 'text-stone-500 hover:text-stone-900'
              }`}
              title="다크 야간 지도"
            >
              {mapLayer === 'dark' && (
                <motion.div
                  layoutId="mapLayerPill"
                  className="absolute inset-0 bg-stone-900 rounded-full"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <Moon className="w-3 h-3" />
                <span className="hidden sm:inline">DARK</span>
              </span>
            </button>
          </div>

          {/* Quick AI Lens Pill */}
          {onOpenLens && (
            <button
              type="button"
              onClick={onOpenLens}
              className="px-3 py-1.5 rounded-full bg-stone-900 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
              <span>LENS</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Zoom & Recenter Controls (Right Side) */}
      <div className="absolute right-3 bottom-36 sm:bottom-40 z-20 flex flex-col rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-9 h-9 flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer border-b border-stone-100"
          title="확대"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-9 h-9 flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer border-b border-stone-100"
          title="축소"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleLocateUser}
          disabled={isLocatingUser}
          className="w-9 h-9 flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          title="내 위치"
        >
          <Crosshair className={`w-3.5 h-3.5 ${isLocatingUser ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {/* ========================================================
          FLOATING SPECIMEN INSPECTOR CARD (When a Map Pin is Tapped)
          ======================================================== */}
      <AnimatePresence>
        {selectedPinSpecimen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32, mass: 0.8 }}
            className="absolute bottom-36 sm:bottom-40 left-4 right-4 sm:left-auto sm:right-16 sm:w-80 z-30 p-3 rounded-[24px] bg-white/98 backdrop-blur-xl border border-stone-200/90 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-[18px] bg-stone-100 overflow-hidden shrink-0 border border-stone-100">
                <img
                  src={selectedPinSpecimen.originalImage || selectedPinSpecimen.stickerImage}
                  alt={selectedPinSpecimen.koreanName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-stone-400 font-bold uppercase">
                    {selectedPinSpecimen.number || '#001'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPinSpecimen(null)}
                    className="p-1 rounded-full text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="text-sm font-bold text-stone-900 truncate">
                  {selectedPinSpecimen.koreanName}
                </h4>
                <p className="text-[10px] font-mono text-stone-500 italic truncate">
                  {selectedPinSpecimen.scientificName}
                </p>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
              <div className="text-[10px] font-mono text-stone-500">
                <span>{selectedPinSpecimen.category}</span>
                <span className="mx-1">·</span>
                <span>{selectedPinSpecimen.observations?.[0]?.date || '2026.08'}</span>
              </div>
              <button
                type="button"
                onClick={() => onSelectSpecimen(selectedPinSpecimen)}
                className="px-3 py-1 rounded-full bg-stone-900 text-white font-mono text-[10px] font-bold flex items-center gap-1 hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <span>도감 보기</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          BOTTOM DRAWER: Restrained Information Density
          - Drag Handle Pill
          - Concise Segmented Switcher [ RADAR | TRAIL ]
          - Scannable Species Grid or Timeline
          ======================================================== */}
      <div className="absolute bottom-2 left-3 right-3 z-20">
        <div className="rounded-[26px] bg-white/95 backdrop-blur-xl border border-stone-200/90 shadow-xl overflow-hidden transition-all duration-200">
          {/* Drag Handle & Top Bar */}
          <div className="pt-2 pb-1.5 px-4 flex flex-col border-b border-stone-100">
            {/* Subtle Pill Handle */}
            <div className="w-8 h-1 rounded-full bg-stone-300 mx-auto mb-1.5 cursor-pointer" />

            <div className="flex items-center justify-between">
              {/* Segmented Mode Capsule */}
              <div className="inline-flex p-0.5 rounded-full bg-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawerTab('radar');
                    setIsDrawerExpanded(true);
                  }}
                  className={`relative px-3 py-1 rounded-full text-xs font-mono font-bold tracking-tight transition-colors cursor-pointer ${
                    activeDrawerTab === 'radar' ? 'text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {activeDrawerTab === 'radar' && (
                    <motion.div
                      layoutId="mapDrawerTabIndicator"
                      className="absolute inset-0 bg-stone-900 rounded-full"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Radio className="w-3 h-3" />
                    <span>레이더 탐사</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawerTab('trail');
                    setIsDrawerExpanded(true);
                  }}
                  className={`relative px-3 py-1 rounded-full text-xs font-mono font-bold tracking-tight transition-colors cursor-pointer ${
                    activeDrawerTab === 'trail' ? 'text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {activeDrawerTab === 'trail' && (
                    <motion.div
                      layoutId="mapDrawerTabIndicator"
                      className="absolute inset-0 bg-stone-900 rounded-full"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Footprints className="w-3 h-3" />
                    <span>내 발자취</span>
                  </span>
                </button>
              </div>

              {/* Right: Meta Count & Drawer Toggle */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-stone-400 font-bold uppercase">
                  {activeDrawerTab === 'radar'
                    ? `${recommendedNearbySpecies.length} TARGETS`
                    : `${filteredPoints.length} TRAILS`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                  title={isDrawerExpanded ? '접기' : '펼치기'}
                >
                  {isDrawerExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Drawer Content */}
          {isDrawerExpanded && (
            <div className="p-3 max-h-52 sm:max-h-60 overflow-y-auto scrollbar-thin">
              {/* TAB 1: RADAR TARGETS */}
              {activeDrawerTab === 'radar' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                  {recommendedNearbySpecies.map((tgt, idx) => {
                    const isFound = tgt.isDiscovered;
                    const sp = tgt.collectedSpecimen;

                    return (
                      <div
                        key={`${tgt.koreanName}-${idx}`}
                        className={`p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                          isFound
                            ? 'bg-stone-50/80 border-stone-200/90 text-stone-900'
                            : 'bg-white border-stone-200/70 text-stone-800'
                        }`}
                      >
                        <div>
                          {/* Card Top: Status & Chance */}
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full uppercase ${
                                isFound
                                  ? 'bg-stone-900 text-white'
                                  : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {isFound ? 'COLLECTED' : 'SEARCH'}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-700 font-bold">
                              {tgt.chancePercent}%
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-stone-900 truncate">
                            {tgt.koreanName}
                          </h4>
                          <p className="text-[10px] font-mono text-stone-400 italic truncate">
                            {tgt.scientificName}
                          </p>
                        </div>

                        {/* Action: View Specimen or Lens */}
                        <div className="mt-2 pt-1.5 border-t border-stone-100">
                          {isFound && sp ? (
                            <button
                              type="button"
                              onClick={() => onSelectSpecimen(sp)}
                              className="w-full py-1 rounded-xl bg-stone-900 text-white font-mono text-[10px] font-bold text-center hover:bg-stone-800 transition-colors cursor-pointer"
                            >
                              도감 보기
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={onOpenLens}
                              className="w-full py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <Camera className="w-3 h-3 text-white" />
                              <span>촬영</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: OBSERVATION TRAIL */}
              {activeDrawerTab === 'trail' && (
                <div>
                  {filteredPoints.length === 0 ? (
                    <div className="text-center py-6 text-xs text-stone-400 font-mono">
                      관찰된 표본 기록이 없습니다
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {filteredPoints.map((pt, idx) => {
                        const sp = pt.specimen;
                        const photo =
                          sp.stickerImage || sp.originalImage || sp.observations?.[0]?.photoUrl || '';
                        const isSelected = selectedPinSpecimen?.id === sp.id;

                        return (
                          <div
                            key={`${sp.id}-${idx}`}
                            onClick={() => {
                              setSelectedPinSpecimen(sp);
                              mapInstanceRef.current?.flyTo([pt.lat, pt.lng], 15, { duration: 0.8 });
                            }}
                            className={`flex items-center justify-between p-2 rounded-2xl transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-stone-50 border-stone-900 shadow-2xs'
                                : 'bg-white hover:bg-stone-50 border-stone-200/80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-9 h-9 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-100">
                                {photo && (
                                  <img
                                    src={photo}
                                    alt={sp.koreanName}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold truncate text-stone-900">
                                  {sp.koreanName}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[10px] font-mono text-stone-400 truncate mt-0.5">
                                  <span>{pt.regionTag}</span>
                                  <span>·</span>
                                  <span>{pt.distanceKm.toFixed(1)}km</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectSpecimen(sp);
                              }}
                              className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-mono text-[10px] font-bold shrink-0 ml-2 cursor-pointer transition-colors"
                            >
                              보기
                            </button>
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
