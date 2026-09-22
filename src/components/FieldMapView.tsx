import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Specimen } from '../types';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';

interface FieldMapViewProps {
  specimens: Specimen[];
  onSelectSpecimen: (specimen: Specimen) => void;
  onOpenLens?: () => void;
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

// Helper: Resolve Real GPS Lat/Lng for Specimen Location
function getSpecimenGpsCoord(sp: Specimen, index: number): { lat: number; lng: number; regionTag: string } {
  // If manual lat/lng exist
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

  let baseLat = 37.5665; // Seoul
  let baseLng = 126.9780;
  let regionTag = '서울';

  if (fullText.includes('제주') || fullText.includes('토끼섬') || fullText.includes('곶자왈') || fullText.includes('문섬')) {
    baseLat = 33.3617;
    baseLng = 126.5292;
    regionTag = '제주';
  } else if (fullText.includes('부산') || fullText.includes('이기대') || fullText.includes('을숙도') || fullText.includes('해운대')) {
    baseLat = 35.1796;
    baseLng = 129.0756;
    regionTag = '부산';
  } else if (fullText.includes('강원') || fullText.includes('설악산') || fullText.includes('태백') || fullText.includes('춘천')) {
    baseLat = 37.8853;
    baseLng = 127.7298;
    regionTag = '강원';
  } else if (fullText.includes('도쿄') || fullText.includes('일본') || fullText.includes('Tokyo') || fullText.includes('신주쿠') || fullText.includes('우에노')) {
    baseLat = 35.6762;
    baseLng = 139.6503;
    regionTag = '도쿄';
  } else if (fullText.includes('파리') || fullText.includes('프랑스') || fullText.includes('Paris') || fullText.includes('센강')) {
    baseLat = 48.8566;
    baseLng = 2.3522;
    regionTag = '파리';
  } else if (fullText.includes('뉴욕') || fullText.includes('미국') || fullText.includes('New York') || fullText.includes('센트럴파크')) {
    baseLat = 40.7128;
    baseLng = -74.0060;
    regionTag = '뉴욕';
  }

  // Natural spatial dispersion so pins in the same city don't overlap 100%
  const hash = (sp.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + index * 19) % 100;
  const angle = (hash / 100) * 2 * Math.PI;
  const radius = 0.008 + ((hash % 11) / 11) * 0.025; // ~500m - 3km spread

  return {
    lat: baseLat + Math.cos(angle) * radius,
    lng: baseLng + Math.sin(angle) * radius,
    regionTag,
  };
}

export const FieldMapView: React.FC<FieldMapViewProps> = ({
  specimens,
  onSelectSpecimen,
  onOpenLens,
  searchQuery = '',
  onSearchChange,
}) => {
  // Only specimens that have been collected
  const collectedSpecimens = useMemo(() => {
    return specimens.filter((s) => s.isCollected);
  }, [specimens]);

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapLayer, setMapLayer] = useState<MapLayerType>('eco');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);
  const [isTrailExpanded, setIsTrailExpanded] = useState(true);
  const [activeTrailSpecimenId, setActiveTrailSpecimenId] = useState<string | null>(null);
  const [selectedMapSpecimen, setSelectedMapSpecimen] = useState<Specimen | null>(null);

  // Map Specimen Points with resolved real GPS coordinates
  const specimenGpsPoints = useMemo(() => {
    return collectedSpecimens.map((sp, idx) => {
      const coord = getSpecimenGpsCoord(sp, idx);
      return {
        specimen: sp,
        lat: coord.lat,
        lng: coord.lng,
        regionTag: coord.regionTag,
      };
    });
  }, [collectedSpecimens]);

  // Filtered by search query
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

  // Chronological order for bottom trail
  const chronologicalObservations = useMemo(() => {
    const list: Array<{
      specimen: Specimen;
      obs: NonNullable<Specimen['observations']>[number];
      date: string;
      location: string;
    }> = [];

    filteredPoints.forEach((pt) => {
      const sp = pt.specimen;
      if (sp.observations && sp.observations.length > 0) {
        sp.observations.forEach((obs) => {
          list.push({
            specimen: sp,
            obs,
            date: obs.date || '2026.04.12',
            location: obs.location || sp.locationCoord?.name || pt.regionTag,
          });
        });
      } else {
        list.push({
          specimen: sp,
          obs: {
            id: 'obs-main',
            date: sp.collectionDate || '2026.04.12',
            time: '14:30',
            location: sp.locationCoord?.name || pt.regionTag,
            weather: '맑음',
            temperature: '18°C',
            photoUrl: sp.originalImage || sp.stickerImage || '',
          },
          date: sp.collectionDate || '2026.04.12',
          location: sp.locationCoord?.name || pt.regionTag,
        });
      }
    });

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredPoints]);

  // Explored Countries Data
  const countryStats = useMemo(() => {
    const map = new Map<string, { tag: string; count: number }>();
    specimenGpsPoints.forEach((pt) => {
      const tag = pt.regionTag;
      const cur = map.get(tag) || { tag, count: 0 };
      map.set(tag, { tag, count: cur.count + 1 });
    });
    return Array.from(map.values());
  }, [specimenGpsPoints]);

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center on Korea default
    const map = L.map(mapContainerRef.current, {
      center: [36.2, 127.8],
      zoom: 7,
      zoomControl: false, // We'll add custom styled controls
      attributionControl: false,
    });

    const tileServer = TILE_SERVERS[mapLayer];
    const tileLayer = L.tileLayer(tileServer.url, {
      maxZoom: tileServer.maxZoom,
      attribution: tileServer.attribution,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    markersGroupRef.current = markersGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when layer style changes
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

  // Update Markers on filteredPoints change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    if (filteredPoints.length === 0) return;

    const bounds = L.latLngBounds([]);

    filteredPoints.forEach((pt) => {
      const sp = pt.specimen;
      const isSelected = activeTrailSpecimenId === sp.id || selectedMapSpecimen?.id === sp.id;
      const photo = sp.stickerImage || sp.originalImage || sp.observations?.[0]?.photoUrl || '';

      bounds.extend([pt.lat, pt.lng]);

      // Custom HTML Marker Icon
      const iconHtml = `
        <div class="relative group cursor-pointer transition-transform duration-200 transform hover:scale-110 ${isSelected ? 'scale-125 z-50' : 'z-10'}">
          <div class="relative w-11 h-11 rounded-2xl p-0.5 shadow-lg flex items-center justify-center ${
            isSelected 
              ? 'bg-emerald-500 ring-4 ring-emerald-300 ring-opacity-70 scale-105' 
              : 'bg-stone-900 hover:bg-emerald-700'
          }">
            <div class="w-full h-full rounded-xl overflow-hidden bg-stone-900 border border-white/40">
              <img src="${photo}" alt="${sp.koreanName}" referrerpolicy="no-referrer" class="w-full h-full object-cover" />
            </div>
            <span class="absolute -top-1 -right-1 bg-amber-400 text-stone-950 font-black text-[9px] px-1 rounded-full shadow-xs border border-white">
              ${sp.koreanName.substring(0, 2)}
            </span>
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-stone-900 rotate-45 border-r border-b border-white/30"></div>
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

      // Popup Content
      const popupHtml = `
        <div class="p-2 min-w-[200px] text-stone-900 font-sans">
          <div class="relative w-full h-28 rounded-xl overflow-hidden mb-2 bg-stone-900">
            <img src="${photo}" alt="${sp.koreanName}" referrerpolicy="no-referrer" class="w-full h-full object-cover" />
            <span class="absolute top-2 left-2 bg-stone-950/80 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-full border border-stone-700">
              ${pt.regionTag}
            </span>
          </div>
          <h4 class="font-black text-sm text-stone-900 tracking-tight leading-tight">${sp.koreanName}</h4>
          <p class="font-serif italic text-xs text-stone-500 mb-2">${sp.scientificName}</p>
          <button id="view-specimen-btn-${sp.id}" class="w-full py-1.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer">
            표본 상세 도감 보기 &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: true,
        className: 'custom-leaflet-popup-card',
      });

      marker.on('click', () => {
        setSelectedMapSpecimen(sp);
        setActiveTrailSpecimenId(sp.id);
        mapInstanceRef.current?.flyTo([pt.lat, pt.lng], 13, { duration: 1.2 });
      });

      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.getElementById(`view-specimen-btn-${sp.id}`);
          if (btn) {
            btn.onclick = () => onSelectSpecimen(sp);
          }
        }, 50);
      });

      markersGroup.addLayer(marker);
    });

    // Fit bounds if search query applied or initial render
    if (bounds.isValid() && localSearch.trim()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [filteredPoints, activeTrailSpecimenId, selectedMapSpecimen, onSelectSpecimen, localSearch]);

  // Recenter Map on Korea or bounds
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    if (filteredPoints.length > 0) {
      const bounds = L.latLngBounds(filteredPoints.map((pt) => [pt.lat, pt.lng]));
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
        return;
      }
    }
    mapInstanceRef.current.flyTo([36.2, 127.8], 7, { duration: 1.2 });
  };

  // Pan to specific specimen GPS
  const handleFlyToSpecimen = (sp: Specimen) => {
    const pt = specimenGpsPoints.find((p) => p.specimen.id === sp.id);
    if (pt && mapInstanceRef.current) {
      setActiveTrailSpecimenId(sp.id);
      setSelectedMapSpecimen(sp);
      mapInstanceRef.current.flyTo([pt.lat, pt.lng], 14, { duration: 1.2 });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-120px)] sm:h-[calc(100vh-130px)] bg-stone-100 overflow-hidden flex flex-col font-sans select-none">
      {/* Real OpenStreetMap / Leaflet Canvas Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pointer-events-none">
        {/* Left: Search Bar */}
        <div className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-stone-200/90 shadow-sm max-w-md w-full">
          <Search className="w-4 h-4 text-emerald-700 shrink-0 ml-1.5" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              onSearchChange?.(e.target.value);
            }}
            placeholder="수집 위치, 생물명, 학명으로 지도 검색..."
            className="w-full bg-transparent border-none outline-none text-xs font-medium text-stone-900 placeholder-stone-400"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange?.('');
              }}
              className="text-stone-500 hover:text-stone-900 text-xs font-bold px-1.5 py-0.5 rounded-lg bg-stone-100 transition-colors"
            >
              취소
            </button>
          )}
        </div>

        {/* Right: Map Layer Switcher & Lens Trigger */}
        <div className="pointer-events-auto flex items-center gap-2 self-end sm:self-auto">
          {/* Layer Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
              className="px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md text-stone-800 hover:text-stone-950 border border-stone-200/90 shadow-sm text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>
                {mapLayer === 'eco' && '🗺️ 표준 지도 (OpenStreetMap)'}
                {mapLayer === 'satellite' && '🛰️ 위성 지도 (Esri GIS)'}
                {mapLayer === 'dark' && '🌙 다크 지도 (CartoDB)'}
              </span>
            </button>

            <AnimatePresence>
              {isLayerMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-stone-200/90 shadow-lg z-30 space-y-1 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMapLayer('eco');
                      setIsLayerMenuOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                      mapLayer === 'eco' ? 'bg-emerald-800 text-white' : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>🗺️</span>
                    <span>표준 생태 지도 (OpenStreetMap)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMapLayer('satellite');
                      setIsLayerMenuOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                      mapLayer === 'satellite' ? 'bg-emerald-800 text-white' : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>🛰️</span>
                    <span>고해상도 위성 지도 (Esri Satellite)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMapLayer('dark');
                      setIsLayerMenuOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                      mapLayer === 'dark' ? 'bg-emerald-800 text-white' : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>🌙</span>
                    <span>야간 관찰 다크 지도 (CartoDB)</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick AI Lens Trigger */}
          {onOpenLens && (
            <button
              type="button"
              onClick={onOpenLens}
              className="px-3.5 py-2 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>AI 촬영 탐사</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Map Zoom Controls & Recenter Button */}
      <div className="absolute right-4 bottom-32 sm:bottom-36 z-20 flex flex-col gap-2">
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
          onClick={handleRecenter}
          className="w-10 h-10 rounded-2xl bg-white/95 hover:bg-stone-100 text-emerald-800 border border-stone-200/90 shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-90"
          title="전체 지도 보기"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Trail Drawer (관찰 발자취 타임라인) */}
      <div className="absolute bottom-3 left-4 right-4 z-20">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-stone-200/90 shadow-md overflow-hidden transition-all">
          {/* Drawer Header Bar */}
          <div
            onClick={() => setIsTrailExpanded(!isTrailExpanded)}
            className="p-3 px-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors border-b border-stone-150"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
                <Footprints className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-stone-900 flex items-center gap-2">
                  <span>생태 관찰 지도 발자취</span>
                  <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    총 {filteredPoints.length}개 위치 관찰됨
                  </span>
                </h3>
                <p className="text-[10px] text-stone-500 font-medium">
                  실시간 위치별 관찰 표본 마커 &amp; 오픈스트리트맵 기반 탐사 지도
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 hover:text-stone-900 text-xs font-bold transition-colors">
              <span>{isTrailExpanded ? '목록 접기' : '관찰 목록 열기'}</span>
              {isTrailExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Scrollable Specimen Trail Items */}
          {isTrailExpanded && (
            <div className="p-3 max-h-52 sm:max-h-60 overflow-y-auto space-y-2 scrollbar-thin">
              {chronologicalObservations.length === 0 ? (
                <div className="w-full text-center py-6 text-xs text-stone-500 space-y-1">
                  <p className="font-bold text-stone-700">
                    {localSearch.trim() ? `'${localSearch}' 검색 결과가 없습니다.` : '수집된 관찰 표본이 없습니다.'}
                  </p>
                  {localSearch.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocalSearch('');
                        onSearchChange?.('');
                      }}
                      className="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-900 transition-colors cursor-pointer"
                    >
                      전체 표본 보기
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {chronologicalObservations.map((item, idx) => {
                    const sp = item.specimen;
                    const photo = item.obs.photoUrl || sp.stickerImage || sp.originalImage || '';
                    const isSelected = activeTrailSpecimenId === sp.id;

                    return (
                      <motion.div
                        key={`${sp.id}-${item.obs.id || idx}`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSelected) {
                            onSelectSpecimen(sp);
                          } else {
                            handleFlyToSpecimen(sp);
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600 text-stone-900 shadow-sm'
                            : 'bg-stone-50 hover:bg-stone-100 border-stone-200/80 text-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="relative w-11 h-11 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                            {photo ? (
                              <img src={photo} alt={sp.koreanName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="w-4 h-4 text-stone-400 m-auto mt-3.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-black truncate text-stone-900">{sp.koreanName}</h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mt-0.5 truncate">
                              <span className="flex items-center gap-0.5 text-emerald-800 font-bold">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {item.location}
                              </span>
                              <span>·</span>
                              <span className="font-mono">{item.date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSpecimen(sp);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>상세</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
