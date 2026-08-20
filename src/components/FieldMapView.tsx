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
  Compass,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  // Viewport / Camera Pan & Zoom state (Continuous coordinate plane)
  // zoom: 0.6x (world view) to 4.5x (ultra street level)
  const [zoom, setZoom] = useState<number>(1.3);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Distinguish between drag vs click
  const dragDistanceRef = useRef<number>(0);
  const mouseDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Search input state
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);

  // Map layer style
  const [mapLayer, setMapLayer] = useState<MapLayerType>('eco');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

  // Bottom Trail (발자취) horizontal drawer state (expanded vs minimized)
  const [isTrailExpanded, setIsTrailExpanded] = useState(true);
  const [activeTrailSpecimenId, setActiveTrailSpecimenId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Derive precise coordinate for each specimen in the continuous world canvas (0 - 100%)
  const specimenMapPoints = useMemo(() => {
    return collectedSpecimens.map((sp, index) => {
      let baseX = 52.0;
      let baseY = 47.0;
      let regionTag = '서울';

      const cityName = sp.locationCoord?.city || '';
      const locName = sp.locationCoord?.name || '';
      const obsLoc = sp.observations[0]?.location || '';
      const fullText = `${cityName} ${locName} ${obsLoc} ${sp.koreanName}`;

      if (fullText.includes('제주') || fullText.includes('토끼섬') || fullText.includes('곶자왈') || fullText.includes('문섬')) {
        baseX = 51.5;
        baseY = 66.5;
        regionTag = '제주';
      } else if (fullText.includes('부산') || fullText.includes('이기대') || fullText.includes('을숙도') || fullText.includes('해운대')) {
        baseX = 61.2;
        baseY = 57.8;
        regionTag = '부산';
      } else if (fullText.includes('도쿄') || fullText.includes('일본') || fullText.includes('Tokyo') || fullText.includes('신주쿠') || fullText.includes('우에노')) {
        baseX = 78.5;
        baseY = 49.2;
        regionTag = '도쿄';
      } else if (fullText.includes('파리') || fullText.includes('프랑스') || fullText.includes('Paris') || fullText.includes('센강') || fullText.includes('뤽상부르')) {
        baseX = 22.0;
        baseY = 35.0;
        regionTag = '파리';
      } else if (fullText.includes('뉴욕') || fullText.includes('미국') || fullText.includes('New York') || fullText.includes('센트럴파크')) {
        baseX = 8.0;
        baseY = 42.0;
        regionTag = '뉴욕';
      } else {
        // Seoul & Gyeonggi default area
        baseX = 52.0;
        baseY = 47.0;
        regionTag = '서울';
      }

      // If specimen has explicit lat/lng or manual x/y offsets
      const manualX = sp.locationCoord?.x;
      const manualY = sp.locationCoord?.y;

      let finalX = baseX;
      let finalY = baseY;

      if (typeof manualX === 'number' && typeof manualY === 'number') {
        finalX = manualX;
        finalY = manualY;
      } else {
        // Natural visual dispersion hash within region cluster
        const hash = (sp.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + index * 17) % 100;
        const angle = (hash / 100) * 2 * Math.PI;
        const radius = 0.8 + ((hash % 7) / 7) * 1.6;

        finalX = baseX + Math.cos(angle) * radius;
        finalY = baseY + Math.sin(angle) * radius;
      }

      return {
        specimen: sp,
        x: Math.max(2, Math.min(98, finalX)),
        y: Math.max(2, Math.min(98, finalY)),
        regionTag,
      };
    });
  }, [collectedSpecimens]);

  // Filtered specimen points by search query
  const filteredPoints = useMemo(() => {
    if (!localSearch.trim()) return specimenMapPoints;
    const q = localSearch.toLowerCase().trim();
    return specimenMapPoints.filter((pt) => {
      const sp = pt.specimen;
      return (
        sp.koreanName.toLowerCase().includes(q) ||
        sp.scientificName.toLowerCase().includes(q) ||
        sp.family.toLowerCase().includes(q) ||
        (sp.locationCoord?.name || '').toLowerCase().includes(q) ||
        (sp.locationCoord?.city || '').toLowerCase().includes(q) ||
        pt.regionTag.toLowerCase().includes(q)
      );
    });
  }, [specimenMapPoints, localSearch]);

  // Regional Clustering when zoomed out (zoom < 1.5)
  const regionClusters = useMemo(() => {
    const map = new Map<
      string,
      {
        tag: string;
        points: typeof specimenMapPoints;
        avgX: number;
        avgY: number;
        representativePhoto: string;
      }
    >();

    filteredPoints.forEach((pt) => {
      const tag = pt.regionTag;
      if (!map.has(tag)) {
        map.set(tag, {
          tag,
          points: [],
          avgX: 0,
          avgY: 0,
          representativePhoto:
            pt.specimen.stickerImage ||
            pt.specimen.originalImage ||
            pt.specimen.observations[0]?.photoUrl ||
            '',
        });
      }
      const item = map.get(tag)!;
      item.points.push(pt);
    });

    return Array.from(map.values()).map((cluster) => {
      const total = cluster.points.length;
      const sumX = cluster.points.reduce((acc, p) => acc + p.x, 0);
      const sumY = cluster.points.reduce((acc, p) => acc + p.y, 0);
      return {
        ...cluster,
        count: total,
        avgX: sumX / total,
        avgY: sumY / total,
      };
    });
  }, [filteredPoints]);

  // Neighborhood Clustering when mid-zoomed (1.5 <= zoom < 2.4)
  const neighborhoodClusters = useMemo(() => {
    const map = new Map<
      string,
      {
        tag: string;
        points: typeof specimenMapPoints;
        avgX: number;
        avgY: number;
        representativePhoto: string;
      }
    >();

    filteredPoints.forEach((pt) => {
      // Use neighborhood/location name if available, fallback to region
      const tag = pt.specimen.locationCoord?.name || pt.regionTag;
      if (!map.has(tag)) {
        map.set(tag, {
          tag,
          points: [],
          avgX: 0,
          avgY: 0,
          representativePhoto:
            pt.specimen.stickerImage ||
            pt.specimen.originalImage ||
            pt.specimen.observations[0]?.photoUrl ||
            '',
        });
      }
      const item = map.get(tag)!;
      item.points.push(pt);
    });

    return Array.from(map.values()).map((cluster) => {
      const total = cluster.points.length;
      const sumX = cluster.points.reduce((acc, p) => acc + p.x, 0);
      const sumY = cluster.points.reduce((acc, p) => acc + p.y, 0);
      return {
        ...cluster,
        count: total,
        avgX: sumX / total,
        avgY: sumY / total,
      };
    });
  }, [filteredPoints]);

  // Explored Countries Data (다녀간 국가 데이터)
  const countryStats = useMemo(() => {
    const map = new Map<
      string,
      {
        country: string;
        flag: string;
        count: number;
        specimens: Specimen[];
        avgX: number;
        avgY: number;
      }
    >();

    collectedSpecimens.forEach((sp) => {
      const country = sp.locationCoord?.country || '대한민국';
      let flag = '🇰🇷';
      let defaultX = 52.0;
      let defaultY = 48.0;

      if (country === '일본' || country === 'Japan') {
        flag = '🇯🇵';
        defaultX = 75.0;
        defaultY = 45.0;
      } else if (country === '프랑스' || country === 'France' || country === '유럽') {
        flag = '🇫🇷';
        defaultX = 22.0;
        defaultY = 35.0;
      } else if (country === '미국' || country === 'USA') {
        flag = '🇺🇸';
        defaultX = 18.0;
        defaultY = 55.0;
      }

      if (!map.has(country)) {
        map.set(country, { country, flag, count: 0, specimens: [], avgX: defaultX, avgY: defaultY });
      }
      const item = map.get(country)!;
      item.count += 1;
      item.specimens.push(sp);
    });

    return Array.from(map.values());
  }, [collectedSpecimens]);

  // Sync localSearch when searchQuery prop changes
  useEffect(() => {
    if (searchQuery !== undefined) {
      setLocalSearch(searchQuery);
    }
  }, [searchQuery]);

  // Chronological Observations Trail (Filtered by search)
  const chronologicalObservations = useMemo(() => {
    const list: {
      specimen: Specimen;
      obs: {
        id?: string;
        date: string;
        time?: string;
        location: string;
        weather?: string;
        photoUrl?: string;
        memo?: string;
      };
      date: string;
      location: string;
    }[] = [];

    // Filter using search query matching specimens
    const matchingSpecimens = filteredPoints.map((pt) => pt.specimen);

    matchingSpecimens.forEach((sp) => {
      if (sp.observations && sp.observations.length > 0) {
        sp.observations.forEach((obs) => {
          list.push({
            specimen: sp,
            obs: {
              ...obs,
              photoUrl: obs.photoUrl || sp.stickerImage || sp.originalImage || '',
            },
            date: obs.date || '2026.08.15',
            location: obs.location || sp.locationCoord?.name || '도심 생태계',
          });
        });
      } else {
        list.push({
          specimen: sp,
          obs: {
            date: '2026.08.15',
            time: '오후 2:00',
            location: sp.locationCoord?.name || '도심 생태계',
            photoUrl: sp.stickerImage || sp.originalImage || '',
            memo: '도감 수집 완료 표본',
          },
          date: '2026.08.15',
          location: sp.locationCoord?.name || '도심 생태계',
        });
      }
    });

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredPoints]);

  // Smooth camera fly-to function (Focuses pin in upper-center of screen so bottom sheet doesn't cover it)
  const flyTo = useCallback((targetXPercent: number, targetYPercent: number, targetZoom: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const canvasWidth = 2400;
    const canvasHeight = 1800;

    const targetPixelX = (targetXPercent / 100) * canvasWidth;
    const targetPixelY = (targetYPercent / 100) * canvasHeight;

    // Center horizontally (rect.width / 2) and focus upper-center vertically (rect.height * 0.3)
    const desiredPanX = rect.width / 2 - targetPixelX * targetZoom;
    const desiredPanY = rect.height * 0.3 - targetPixelY * targetZoom;

    setZoom(targetZoom);
    setPan({ x: desiredPanX, y: desiredPanY });
  }, []);

  // Recenter to main observation area (Seoul default)
  const handleRecenter = () => {
    flyTo(52.0, 47.0, 1.8);
  };

  // Center-Anchored Zoom In / Zoom Out (Google Maps style)
  const handleZoomIn = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const newZoom = Math.min(4.5, Number((zoom * 1.3).toFixed(2)));
    const scaleFactor = newZoom / zoom;

    setPan((prevPan) => ({
      x: centerX - (centerX - prevPan.x) * scaleFactor,
      y: centerY - (centerY - prevPan.y) * scaleFactor,
    }));
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const newZoom = Math.max(0.6, Number((zoom / 1.3).toFixed(2)));
    const scaleFactor = newZoom / zoom;

    setPan((prevPan) => ({
      x: centerX - (centerX - prevPan.x) * scaleFactor,
      y: centerY - (centerY - prevPan.y) * scaleFactor,
    }));
    setZoom(newZoom);
  };

  // Mouse Drag / Touch Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-map-control')) return;
    setIsDragging(true);
    dragDistanceRef.current = 0;
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - mouseDownPosRef.current.x;
    const dy = e.clientY - mouseDownPosRef.current.y;
    dragDistanceRef.current = Math.hypot(dx, dy);

    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Cursor-Anchored Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    const nextZoom = Math.max(0.6, Math.min(4.5, Number((zoom * zoomFactor).toFixed(2))));
    const scaleFactor = nextZoom / zoom;

    setPan((prevPan) => ({
      x: cursorX - (cursorX - prevPan.x) * scaleFactor,
      y: cursorY - (cursorY - prevPan.y) * scaleFactor,
    }));
    setZoom(nextZoom);
  };

  // Touch Support
  const touchStartRef = useRef<{ x: number; y: number; dist: number }>({ x: 0, y: 0, dist: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-map-control')) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragDistanceRef.current = 0;
      mouseDownPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      touchStartRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const dx = e.touches[0].clientX - mouseDownPosRef.current.x;
      const dy = e.touches[0].clientY - mouseDownPosRef.current.y;
      dragDistanceRef.current = Math.hypot(dx, dy);

      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (touchStartRef.current.dist > 0) {
        const factor = dist / touchStartRef.current.dist;
        setZoom((prev) => Math.max(0.6, Math.min(4.5, Number((prev * factor).toFixed(2)))));
      }
      touchStartRef.current.dist = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartRef.current.dist = 0;
  };

  // Initial center on mount
  useEffect(() => {
    handleRecenter();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#E5ECE5] overflow-hidden select-none cursor-grab active:cursor-grabbing font-sans"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ========================================================
          1. Continuous World Canvas (Transform Layer)
          ======================================================== */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.1, 0.9, 0.2, 1)',
          width: '2400px',
          height: '1800px',
        }}
        className={`absolute top-0 left-0 transition-colors duration-500 ${
          mapLayer === 'satellite'
            ? 'bg-[#1b2a22]'
            : mapLayer === 'dark'
            ? 'bg-[#131714]'
            : 'bg-[#EAF1E9]'
        }`}
      >
        {/* World Vector Blueprint & Stylized Regional Continents */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-90"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Coordinate Grid Pattern */}
            <pattern id="grid" width="120" height="120" patternUnits="userSpaceOnUse">
              <path
                d="M 120 0 L 0 0 0 120"
                fill="none"
                stroke={
                  mapLayer === 'dark'
                    ? 'rgba(255,255,255,0.04)'
                    : mapLayer === 'satellite'
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(50,80,50,0.06)'
                }
                strokeWidth="1"
              />
              <circle
                cx="0"
                cy="0"
                r="1.5"
                fill={mapLayer === 'dark' ? '#334155' : '#A3B899'}
                opacity="0.4"
              />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Stylized Landmasses (Asia/Korea, Japan, Europe, Americas) */}
          {/* East Asia / Korean Peninsula Main Land */}
          <path
            d="M 1120 620 Q 1200 660 1260 800 T 1280 980 T 1220 1100 Q 1160 1140 1080 1020 Z"
            fill={
              mapLayer === 'satellite'
                ? '#243b2f'
                : mapLayer === 'dark'
                ? '#1e2621'
                : '#D8E8D5'
            }
            stroke={mapLayer === 'dark' ? '#334d3d' : '#B8D4B4'}
            strokeWidth="3"
          />

          {/* Jeju Island */}
          <ellipse
            cx="1236"
            cy="1197"
            rx="32"
            ry="20"
            fill={
              mapLayer === 'satellite'
                ? '#2d4b3b'
                : mapLayer === 'dark'
                ? '#223027'
                : '#CDE4C8'
            }
            stroke={mapLayer === 'dark' ? '#3e5c4a' : '#A8CC9F'}
            strokeWidth="2"
          />

          {/* Japan (Honshu/Tokyo) */}
          <path
            d="M 1750 780 Q 1880 860 1920 950 T 1840 1060 T 1720 1090 Q 1680 1020 1710 900 Z"
            fill={
              mapLayer === 'satellite'
                ? '#22382c'
                : mapLayer === 'dark'
                ? '#1c241f'
                : '#D2E4D0'
            }
            stroke={mapLayer === 'dark' ? '#2f4437' : '#B2CDB0'}
            strokeWidth="2.5"
          />

          {/* Europe (Paris / France) */}
          <path
            d="M 440 500 Q 560 520 600 680 T 520 800 T 400 760 Q 380 620 440 500 Z"
            fill={
              mapLayer === 'satellite'
                ? '#22382c'
                : mapLayer === 'dark'
                ? '#1c241f'
                : '#D5E6D2'
            }
            stroke={mapLayer === 'dark' ? '#2f4437' : '#B2CDB0'}
            strokeWidth="2.5"
          />

          {/* North America (New York / East Coast) */}
          <path
            d="M 120 620 Q 240 660 260 840 T 180 980 T 100 880 Z"
            fill={
              mapLayer === 'satellite'
                ? '#22382c'
                : mapLayer === 'dark'
                ? '#1c241f'
                : '#D5E6D2'
            }
            stroke={mapLayer === 'dark' ? '#2f4437' : '#B2CDB0'}
            strokeWidth="2.5"
          />

          {/* River Stream & Park Outlines (Seoul Han River & Seoul Forest) */}
          <path
            d="M 1160 810 C 1210 835, 1260 845, 1310 840"
            fill="none"
            stroke={mapLayer === 'dark' ? '#1e3a5f' : '#9DC2E6'}
            strokeWidth={zoom > 2.0 ? '12' : '6'}
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>

        {/* ========================================================
            2. Map Geography & Regional Labels (Scale Dependent)
            ======================================================== */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Global Continental Labels (Visible when zoomed out) */}
          {zoom < 1.4 && (
            <>
              <div
                style={{ transform: `translate(-50%, -50%) scale(${1 / zoom})` }}
                className="absolute top-[44%] left-[51%] text-center opacity-70 origin-center whitespace-nowrap"
              >
                <span className={`text-[13px] font-black tracking-widest uppercase ${mapLayer === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                  대한민국 (KOREA)
                </span>
              </div>
              <div
                style={{ transform: `translate(-50%, -50%) scale(${1 / zoom})` }}
                className="absolute top-[46%] left-[78%] text-center opacity-70 origin-center whitespace-nowrap"
              >
                <span className={`text-[12px] font-black tracking-widest uppercase ${mapLayer === 'dark' ? 'text-stone-500' : 'text-stone-500'}`}>
                  일본 (JAPAN)
                </span>
              </div>
              <div
                style={{ transform: `translate(-50%, -50%) scale(${1 / zoom})` }}
                className="absolute top-[32%] left-[22%] text-center opacity-70 origin-center whitespace-nowrap"
              >
                <span className={`text-[12px] font-black tracking-widest uppercase ${mapLayer === 'dark' ? 'text-stone-500' : 'text-stone-500'}`}>
                  유럽 (EUROPE)
                </span>
              </div>
              <div
                style={{ transform: `translate(-50%, -50%) scale(${1 / zoom})` }}
                className="absolute top-[40%] left-[8%] text-center opacity-70 origin-center whitespace-nowrap"
              >
                <span className={`text-[12px] font-black tracking-widest uppercase ${mapLayer === 'dark' ? 'text-stone-500' : 'text-stone-500'}`}>
                  북미 (AMERICA)
                </span>
              </div>
            </>
          )}

          {/* Local Park & Hotspot Zones (Visible at High Zoom >= 1.8) */}
          {zoom >= 1.8 && (
            <>
              {/* Seoul Forest Green Zone */}
              <div
                style={{ transform: `translate(-50%, -50%) scale(${1 / zoom})` }}
                className="absolute top-[46.5%] left-[52.2%] origin-center flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/20 border border-emerald-500/30 backdrop-blur-xs whitespace-nowrap"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  서울숲 생태 보전숲
                </span>
              </div>
              {/* Namsan Park Zone */}
              <div
                style={{ transform: `translate(-50%, -50%) scale(${1 / zoom})` }}
                className="absolute top-[45.2%] left-[50.8%] origin-center flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600/20 border border-emerald-500/30 whitespace-nowrap"
              >
                <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                  남산 야외식물원
                </span>
              </div>
              {/* Jeju Gotjawal */}
              <div
                style={{ transform: `translate(-50%, -50%) scale(${1 / zoom})` }}
                className="absolute top-[66.2%] left-[51.6%] origin-center flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600/20 border border-emerald-500/30 whitespace-nowrap"
              >
                <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                  제주 곶자왈 도립공원
                </span>
              </div>
            </>
          )}
        </div>

        {/* ========================================================
            3. Dynamic Specimen Photo Markers & Clusters
            ======================================================== */}
        {/* CASE A: Ultra Zoomed-out Regional Number Clusters (zoom < 1.2) */}
        {zoom < 1.2 && (
          <div className="absolute inset-0 pointer-events-none">
            {regionClusters.map((cluster) => {
              return (
                <div
                  key={cluster.tag}
                  style={{
                    left: `${cluster.avgX}%`,
                    top: `${cluster.avgY}%`,
                    transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                  }}
                  className="interactive-map-control absolute pointer-events-auto cursor-pointer group origin-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    flyTo(cluster.avgX, cluster.avgY, 1.8);
                  }}
                >
                  <div className="relative flex flex-col items-center">
                    {/* Pulsing ring */}
                    <div className="absolute -inset-2 rounded-full bg-emerald-500/25 animate-pulse blur-xs" />

                    {/* Cluster Number Bubble */}
                    <div className="relative w-10 h-10 rounded-full bg-stone-900 shadow-xl flex items-center justify-center transition-transform transform active:scale-95">
                      <span className="text-white font-mono font-black text-xs tracking-tight shadow-xs">
                        {cluster.count >= 10 ? '10+' : cluster.count}
                      </span>
                    </div>

                    {/* Region Label Tag */}
                    <div className="mt-1 px-2.5 py-1 rounded-full bg-white text-stone-900 text-[10px] font-bold shadow-md whitespace-nowrap">
                      {cluster.tag}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CASE C: Neighborhood Clusters (1.2 <= zoom < 2.4) - Mid Zoom */}
        {zoom >= 1.2 && zoom < 2.4 && (
          <div className="absolute inset-0 pointer-events-none">
            {neighborhoodClusters.map((cluster) => {
              const fixedScale = 1 / zoom;
              return (
                <div
                  key={cluster.tag}
                  style={{
                    left: `${cluster.avgX}%`,
                    top: `${cluster.avgY}%`,
                    transform: `translate(-50%, -50%) scale(${fixedScale})`,
                  }}
                  className="interactive-map-control absolute pointer-events-auto cursor-pointer group origin-center z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    flyTo(cluster.avgX, cluster.avgY, 2.6);
                  }}
                >
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 p-1.5 bg-stone-900 text-white rounded-full shadow-lg select-none hover:bg-emerald-800 transition-colors"
                  >
                    {/* Small round photo of the specimen */}
                    {cluster.representativePhoto ? (
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-stone-800">
                        <img
                          src={cluster.representativePhoto}
                          alt={cluster.tag}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 text-xs">
                        🌿
                      </div>
                    )}
                    {/* Neighborhood Name label */}
                    <div className="flex flex-col pr-2.5 pl-0.5 leading-none">
                      <span className="text-[10px] font-black tracking-tight whitespace-nowrap">
                        {cluster.tag}
                      </span>
                      {cluster.count > 1 && (
                        <span className="text-[8px] text-amber-300 font-mono mt-0.5">
                          {cluster.count}개 발견
                        </span>
                      )}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}

        {/* CASE B: Individual Cutout Sticker Pins (zoom >= 2.4) - Max Zoom */}
        {zoom >= 2.4 && (
          <div className="absolute inset-0 pointer-events-none">
            {filteredPoints.map((pt) => {
              const sp = pt.specimen;
              const photoImg =
                sp.stickerImage ||
                sp.originalImage ||
                sp.observations[0]?.photoUrl ||
                '';

              const isSelected = activeTrailSpecimenId === sp.id;
              // Exact inverse zoom scale to lock visual screen size regardless of map zoom
              const fixedScale = 1 / zoom;

              return (
                <div
                  key={sp.id}
                  style={{
                    left: `${pt.x}%`,
                    top: `${pt.y}%`,
                    transform: `translate(-50%, -50%) scale(${fixedScale})`,
                  }}
                  className="interactive-map-control absolute pointer-events-auto cursor-pointer group z-20 origin-center"
                  title={`${sp.koreanName} (${sp.scientificName})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (dragDistanceRef.current > 6) return;
                    setActiveTrailSpecimenId(sp.id);
                    flyTo(pt.x, pt.y, 2.6);
                    onSelectSpecimen(sp);
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: isSelected ? 1.15 : 1, opacity: 1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                    className="relative flex flex-col items-center select-none"
                  >
                    {/* Active highlight glow - Subtle */}
                    {isSelected && (
                      <div className="absolute -inset-2.5 rounded-full bg-white/60 animate-pulse blur-sm" />
                    )}

                    {/* Prominent Sticker Pin Frame with robust sticker outline effect */}
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-transform">
                      {photoImg ? (
                        <img
                          src={photoImg}
                          alt={sp.koreanName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                          style={{
                            filter: isSelected 
                              ? 'drop-shadow(1.5px 1.5px 0px #1c1917) drop-shadow(-1.5px -1.5px 0px #1c1917) drop-shadow(1.5px -1.5px 0px #1c1917) drop-shadow(-1.5px 1.5px 0px #1c1917) drop-shadow(0 6px 12px rgba(0,0,0,0.3))'
                              : 'drop-shadow(1.5px 1.5px 0px #ffffff) drop-shadow(-1.5px -1.5px 0px #ffffff) drop-shadow(1.5px -1.5px 0px #ffffff) drop-shadow(-1.5px 1.5px 0px #ffffff) drop-shadow(0px 1.5px 0px #ffffff) drop-shadow(0px -1.5px 0px #ffffff) drop-shadow(1.5px 0px 0px #ffffff) drop-shadow(-1.5px 0px 0px #ffffff) drop-shadow(0 4px 8px rgba(0,0,0,0.25))',
                          }}
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${isSelected ? 'bg-stone-100 ring-2 ring-stone-900' : 'bg-stone-900'}`}>
                          <Camera className={`w-4 h-4 ${isSelected ? 'text-stone-900' : 'text-stone-300'}`} />
                        </div>
                      )}
                    </div>

                    {/* Compact, Well-Proportioned Name Tag Badge */}
                    <div className={`mt-1 px-2.5 py-1 rounded-full font-bold text-[10px] tracking-tight shadow-md whitespace-nowrap flex items-center gap-1 transition-colors ${isSelected ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 border border-stone-200'}`}>
                      <span>{sp.koreanName}</span>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================
          4. Top Floating Search & Controls Header
          ======================================================== */}
      <div className="interactive-map-control absolute top-4 left-4 right-4 z-30 flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center justify-between gap-2">
          {/* Google Maps style Search Input */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm flex items-center px-3 py-2 gap-2">
            <Search className="w-4 h-4 text-stone-400 shrink-0" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                onSearchChange?.(e.target.value);
              }}
              placeholder="생물명, 발견 장소, 도시 검색 (예: 직박구리, 서울숲, 제주)"
              className="w-full text-xs font-medium text-stone-900 bg-transparent focus:outline-none placeholder:text-stone-400"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  onSearchChange?.('');
                }}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 cursor-pointer"
                title="검색어 초기화"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Short & Clean Explored Countries Button */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
              className="px-3 py-2 rounded-2xl bg-white text-stone-800 hover:bg-stone-50 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-extrabold shadow-sm cursor-pointer"
              title="다녀간 탐사 국가 목록"
            >
              <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-mono text-xs font-black text-emerald-950">{countryStats.length}개국</span>
            </button>

            {/* Explored Countries Menu Dropdown */}
            <AnimatePresence>
              {isLayerMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-11 bg-white rounded-2xl p-2 space-y-1 min-w-[200px] z-40 shadow-xl border border-stone-100"
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 flex items-center justify-between">
                    <span>내가 다녀간 탐사 국가</span>
                    <span className="font-mono text-emerald-600 font-black">{collectedSpecimens.length}개 표본</span>
                  </div>

                  {countryStats.map((c) => (
                    <button
                      key={c.country}
                      type="button"
                      onClick={() => {
                        flyTo(c.avgX, c.avgY, 2.2);
                        setIsLayerMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-stone-800 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm">{c.flag}</span>
                        <span>{c.country}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-mono text-[10px] font-bold">
                        {c.count}건 수집
                      </span>
                    </button>
                  ))}

                  <div className="pt-1 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => {
                        flyTo(45, 42, 1.0);
                        setIsLayerMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-bold text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                    >
                      <span>🌐 전체 세계 지도 보기</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating No Search Results Banner on Map */}
        {localSearch.trim() !== '' && filteredPoints.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-stone-900/95 text-white p-2.5 rounded-2xl shadow-lg backdrop-blur-md flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-amber-400 shrink-0">🔍</span>
              <span className="truncate font-medium">
                <strong className="text-amber-300">'{localSearch}'</strong> 검색 결과가 없습니다.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange?.('');
              }}
              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shrink-0 ml-2 shadow-xs transition-colors cursor-pointer"
            >
              전체 보기
            </button>
          </motion.div>
        )}
      </div>

      {/* ========================================================
          5. Floating Zoom & Compass Controls (Right Side)
          ======================================================== */}
      <div className="interactive-map-control absolute right-4 top-20 z-30 flex flex-col gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={handleRecenter}
          className="p-3 bg-white rounded-2xl text-stone-700 hover:text-emerald-700 hover:bg-stone-50 active:scale-95 transition-all shadow-sm"
          title="관찰 중심 위치로 재정렬"
        >
          <Compass className="w-4 h-4" />
        </button>

        <div className="bg-white rounded-2xl flex flex-col overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-3 text-stone-700 hover:bg-stone-100 active:scale-95 transition-colors border-b border-stone-100"
            title="확대"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-3 text-stone-700 hover:bg-stone-100 active:scale-95 transition-colors"
            title="축소"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Current Zoom Indicator */}
        <div className="px-2 py-1 rounded-xl bg-stone-900/80 text-white font-mono text-[10px] text-center shadow-md">
          {zoom}x
        </div>
      </div>

      {/* ========================================================
          6. INLINE OBSERVATION TRAIL (발자취) AT BOTTOM OF MAP
          Clean, vertically scrollable timeline drawer above bottom navigation!
          ======================================================== */}
      <div className="interactive-map-control absolute bottom-20 left-3 right-3 sm:left-6 sm:right-6 max-w-lg mx-auto z-30 pointer-events-auto">
        <div className="bg-white rounded-3xl overflow-hidden transition-all duration-300 shadow-xl">
          {/* Tray Header Bar with Collapse/Expand */}
          <div
            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-stone-50/80 transition-colors border-b border-stone-100"
            onClick={() => setIsTrailExpanded(!isTrailExpanded)}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center font-bold text-xs shadow-2xs">
                <Footprints className="w-4 h-4 text-stone-600" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-900">
                    나의 발자취
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-stone-100 text-stone-700 font-mono">
                    {chronologicalObservations.length}건
                  </span>
                </div>
                <p className="text-[10px] text-stone-400">
                  시간 순 생태 관찰 목록
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 hover:text-stone-900 text-xs font-medium transition-colors">
              <span className="text-[11px]">
                {isTrailExpanded ? '접기' : '목록 보기'}
              </span>
              {isTrailExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </div>
          </div>

          {/* Clean, Vertically Scrollable Observation List */}
          {isTrailExpanded && (
            <div className="p-2.5 max-h-60 sm:max-h-72 overflow-y-auto space-y-2 scrollbar-thin divide-y divide-stone-100/60">
              {chronologicalObservations.length === 0 ? (
                <div className="w-full text-center py-6 text-xs text-stone-400 space-y-1">
                  <p className="font-bold text-stone-500">
                    {localSearch.trim()
                      ? `'${localSearch}' 검색 결과가 없습니다.`
                      : '아직 수집된 관찰 표본이 없습니다.'}
                  </p>
                  {localSearch.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocalSearch('');
                        onSearchChange?.('');
                      }}
                      className="text-[11px] font-bold text-emerald-600 underline hover:text-emerald-800 transition-colors cursor-pointer"
                    >
                      전체 표본 보기
                    </button>
                  )}
                </div>
              ) : (
                chronologicalObservations.map((item, idx) => {
                  const sp = item.specimen;
                  const photo =
                    item.obs.photoUrl ||
                    sp.stickerImage ||
                    sp.originalImage ||
                    '';

                  const isSelected = activeTrailSpecimenId === sp.id;

                  return (
                    <motion.div
                      key={`${sp.id}-${item.obs.id || idx}`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeTrailSpecimenId === sp.id) {
                          onSelectSpecimen(sp);
                        } else {
                          setActiveTrailSpecimenId(sp.id);
                          const pt = specimenMapPoints.find((p) => p.specimen.id === sp.id);
                          if (pt) {
                            flyTo(pt.x, pt.y, 2.6);
                          }
                        }
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-stone-50 border-stone-200 text-stone-900 shadow-sm'
                          : 'bg-white hover:bg-stone-50 border-transparent text-stone-800'
                      }`}
                    >
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Thumbnail */}
                        <div className="relative w-12 h-12 rounded-xl bg-stone-900 overflow-hidden shrink-0 shadow-2xs">
                          {photo ? (
                            <img
                              src={photo}
                              alt={sp.koreanName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera className="w-5 h-5 text-stone-400 m-auto mt-3.5" />
                          )}
                          <span className="absolute bottom-0 right-0 bg-stone-950/80 text-white font-mono font-bold text-[8px] px-1 rounded-tl-md">
                            #{chronologicalObservations.length - idx}
                          </span>
                        </div>

                        {/* Text info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold truncate text-stone-900">
                              {sp.koreanName}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-medium shrink-0 bg-stone-100 text-stone-600`}>
                              {sp.family}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[10px] flex-wrap text-stone-500">
                            <span className="flex items-center gap-0.5 font-mono truncate">
                              <Calendar className="w-3 h-3 shrink-0 text-stone-400" />
                              {item.date} {item.obs.time ? `· ${item.obs.time}` : ''}
                            </span>
                            <span className="text-stone-300">•</span>
                            <span className="flex items-center gap-0.5 truncate font-medium">
                              <MapPin className="w-3 h-3 shrink-0 text-stone-400" />
                              {item.location}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Hint: Minimal UI without explicit text */}
                      <div className={`shrink-0 ml-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-300 hover:text-stone-500'}`}
                           onClick={(e) => {
                             if(isSelected) {
                               e.stopPropagation();
                               onSelectSpecimen(sp);
                             }
                           }}>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
