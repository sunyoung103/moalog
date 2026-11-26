import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Specimen, SpecimenCategory, SpeciesEcologyDetail } from '../types';
import {
  X,
  Check,
  Search,
  BookOpen,
  Save,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Image as ImageIcon,
  MapPin,
  Crosshair,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';
import { BIOBLITZ_HOTSPOTS } from '../data/communityMapData';

interface EditSpecimenModalProps {
  specimen: Specimen;
  activeObsIndex?: number;
  initialTab?: 'species' | 'location' | 'delete';
  onClose: () => void;
  onSave: (updated: Specimen) => void;
  onDeleteSpecimen?: (specimenId: string) => void;
  onDeleteObservation?: (specimenId: string, observationIndex: number) => void;
}

interface PlaceSearchCandidate {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  city?: string;
  district?: string;
}

function resolveInitialLocation(specimen: Specimen) {
  const coord = specimen.locationCoord;
  if (typeof coord?.lat === 'number' && typeof coord?.lng === 'number') {
    return {
      name: coord.name || specimen.observations?.[0]?.location || '내 발견 위치',
      city: coord.city || '서울',
      district: coord.district || '',
      lat: coord.lat,
      lng: coord.lng,
    };
  }
  const text = `${coord?.name || ''} ${coord?.city || ''} ${specimen.observations?.[0]?.location || ''}`;
  const matched =
    BIOBLITZ_HOTSPOTS.find(
      (h) =>
        (coord?.name && (h.name.includes(coord.name) || coord.name.includes(h.name.split(' ')[0]))) ||
        text.includes(h.name.split(' ')[0])
    ) || BIOBLITZ_HOTSPOTS[0];

  return {
    name: coord?.name || specimen.observations?.[0]?.location || matched.name,
    city: coord?.city || '서울',
    district: coord?.district || '',
    lat: matched.lat,
    lng: matched.lng,
  };
}

export const EditSpecimenModal: React.FC<EditSpecimenModalProps> = ({
  specimen,
  activeObsIndex = 0,
  initialTab = 'species',
  onClose,
  onSave,
  onDeleteSpecimen,
  onDeleteObservation,
}) => {
  const [activeTab, setActiveTab] = useState<'species' | 'location' | 'delete'>(initialTab);

  // Species Selection via Search
  const initialSpecies = useMemo(() => {
    return (
      SPECIES_ECOLOGY_ENCYCLOPEDIA.find((e) => e.koreanName === specimen?.koreanName) ||
      SPECIES_ECOLOGY_ENCYCLOPEDIA.find(
        (e) => (e.scientificName || '').toLowerCase() === (specimen?.scientificName || '').toLowerCase()
      ) ||
      SPECIES_ECOLOGY_ENCYCLOPEDIA[0]
    );
  }, [specimen?.koreanName, specimen?.scientificName]);

  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesEcologyDetail>(initialSpecies);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Location Picker States
  const initialLoc = useMemo(() => resolveInitialLocation(specimen), [specimen]);
  const [locName, setLocName] = useState<string>(initialLoc.name);
  const [locCity, setLocCity] = useState<string>(initialLoc.city);
  const [locDistrict, setLocDistrict] = useState<string>(initialLoc.district);
  const [locLat, setLocLat] = useState<number>(initialLoc.lat);
  const [locLng, setLocLng] = useState<number>(initialLoc.lng);

  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState<PlaceSearchCandidate[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<L.Map | null>(null);
  const miniMarkerRef = useRef<L.Marker | null>(null);

  // Deletion confirm states
  const [confirmDeleteType, setConfirmDeleteType] = useState<'none' | 'single_image' | 'entire_specimen'>('none');
  const [targetObsIndexToDelete, setTargetObsIndexToDelete] = useState<number>(activeObsIndex);

  const reverseGeocodeCoord = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ko`
      );
      if (!res.ok) return;
      const data = await res.json();
      const addr = data?.address || {};
      const city = addr.city || addr.province || addr.state || addr.county || '';
      const district = addr.borough || addr.suburb || addr.quarter || addr.town || addr.village || '';
      const poiName =
        data?.name ||
        addr.park ||
        addr.leisure ||
        addr.natural ||
        addr.road ||
        district ||
        city;
      const readableLabel = [district, poiName && poiName !== district ? poiName : '']
        .filter(Boolean)
        .join(' ');
      if (readableLabel) setLocName(readableLabel);
      if (city) setLocCity(city.replace(/특별시|광역시|특별자치시|도$/, ''));
      if (district) setLocDistrict(district);
    } catch {
      // Keep current name if reverse geocode fails
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Initialize / teardown mini Leaflet map when 'location' tab is active
  useEffect(() => {
    if (activeTab !== 'location') {
      if (miniMapRef.current) {
        miniMapRef.current.remove();
        miniMapRef.current = null;
        miniMarkerRef.current = null;
      }
      return;
    }

    if (!miniMapContainerRef.current || miniMapRef.current) return;

    const map = L.map(miniMapContainerRef.current, {
      center: [locLat, locLng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const pinIcon = L.divIcon({
      html: `
        <div class="relative flex flex-col items-center">
          <div class="w-8 h-8 rounded-full bg-[#202320] text-white border-2 border-white shadow-lg flex items-center justify-center">
            <div class="w-2.5 h-2.5 rounded-full bg-[#c4eb43]"></div>
          </div>
          <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-[#202320] -mt-[1px]"></div>
        </div>
      `,
      className: 'edit-location-pin',
      iconSize: [32, 39],
      iconAnchor: [16, 39],
    });

    const marker = L.marker([locLat, locLng], { icon: pinIcon, draggable: true }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setLocLat(pos.lat);
      setLocLng(pos.lng);
      reverseGeocodeCoord(pos.lat, pos.lng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setLocLat(lat);
      setLocLng(lng);
      marker.setLatLng([lat, lng]);
      reverseGeocodeCoord(lat, lng);
    });

    miniMapRef.current = map;
    miniMarkerRef.current = marker;

    setTimeout(() => {
      map.invalidateSize();
    }, 120);

    return () => {
      map.remove();
      miniMapRef.current = null;
      miniMarkerRef.current = null;
    };
  }, [activeTab]);

  // Sync pin position & pan map whenever coordinates update from search/hotspot/GPS
  useEffect(() => {
    if (miniMapRef.current && miniMarkerRef.current) {
      miniMarkerRef.current.setLatLng([locLat, locLng]);
      miniMapRef.current.panTo([locLat, locLng], { animate: true });
    }
  }, [locLat, locLng]);

  const handleSearchPlaces = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = placeQuery.trim();
    if (!q) {
      setPlaceResults([]);
      return;
    }

    const localMatches: PlaceSearchCandidate[] = BIOBLITZ_HOTSPOTS.filter(
      (h) =>
        h.name.toLowerCase().includes(q.toLowerCase()) ||
        h.description.toLowerCase().includes(q.toLowerCase())
    ).map((h) => ({
      id: `hs-${h.id}`,
      name: h.name,
      subtitle: h.description,
      lat: h.lat,
      lng: h.lng,
      city: h.name.includes('제주') ? '제주' : '서울',
      district: h.description.split('·')[0].trim(),
    }));

    setPlaceResults(localMatches);
    setIsSearchingPlaces(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&accept-language=ko&limit=6&q=${encodeURIComponent(q)}`
      );
      if (!res.ok) return;
      const items = await res.json();
      if (Array.isArray(items)) {
        const remoteMatches: PlaceSearchCandidate[] = items.map((item: any, idx: number) => {
          const parts = String(item.display_name || '')
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean);
          const shortName = item.name || parts[0] || q;
          const subtitle = parts.slice(0, 3).join(' · ');
          return {
            id: `nom-${item.place_id || idx}`,
            name: shortName,
            subtitle: subtitle || `${Number(item.lat).toFixed(4)}, ${Number(item.lon).toFixed(4)}`,
            lat: Number(item.lat),
            lng: Number(item.lon),
            city: parts.find((p) => /시$|도$|특별시|광역시/.test(p)) || parts[1] || '',
            district: parts.find((p) => /구$|군$|동$|읍$|면$/.test(p)) || '',
          };
        });
        const merged = [...localMatches];
        remoteMatches.forEach((rm) => {
          if (!merged.some((m) => m.name === rm.name && Math.abs(m.lat - rm.lat) < 0.01)) {
            merged.push(rm);
          }
        });
        setPlaceResults(merged.slice(0, 7));
      }
    } catch {
      // Keep localMatches on offline/rate-limit
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const handleSelectCandidateLocation = (cand: PlaceSearchCandidate) => {
    setLocName(cand.name);
    if (cand.city) setLocCity(cand.city.replace(/특별시|광역시|특별자치시|도$/, ''));
    if (cand.district) setLocDistrict(cand.district);
    setLocLat(cand.lat);
    setLocLng(cand.lng);
    miniMapRef.current?.setView([cand.lat, cand.lng], 15, { animate: true });
    setPlaceResults([]);
    setPlaceQuery('');
  };

  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) return;
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGps(false);
        const { latitude, longitude } = pos.coords;
        setLocLat(latitude);
        setLocLng(longitude);
        miniMapRef.current?.setView([latitude, longitude], 16, { animate: true });
        reverseGeocodeCoord(latitude, longitude);
      },
      () => {
        setIsLocatingGps(false);
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  };

  // Filter encyclopedia species & pin similar/matching species to the top
  const filteredSpeciesList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = SPECIES_ECOLOGY_ENCYCLOPEDIA.filter((item) => {
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'invertebrates') {
          if (item.category !== 'arachnids' && item.category !== 'mollusks' && item.category !== 'crustaceans') return false;
        } else if (selectedCategory === 'herptiles') {
          if (item.category !== 'amphibians' && item.category !== 'reptiles') return false;
        } else if (item.category !== selectedCategory) {
          return false;
        }
      }
      if (!q) return true;

      return (
        (item.koreanName || '').toLowerCase().includes(q) ||
        (item.scientificName || '').toLowerCase().includes(q) ||
        (item.family || '').toLowerCase().includes(q) ||
        (item.keyIdentification || '').toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => (t || '').toLowerCase().includes(q)))
      );
    });

    // Pin similar / matching species to top
    return [...list].sort((a, b) => {
      const scoreA =
        (a.koreanName === specimen.koreanName ? 25 : 0) +
        (a.family && specimen.family && a.family.includes(specimen.family) ? 15 : 0) +
        (a.category === specimen.category ? 8 : 0);
      const scoreB =
        (b.koreanName === specimen.koreanName ? 25 : 0) +
        (b.family && specimen.family && b.family.includes(specimen.family) ? 15 : 0) +
        (b.category === specimen.category ? 8 : 0);
      return scoreB - scoreA;
    });
  }, [searchQuery, selectedCategory, specimen]);

  const handleSelectSpecies = (item: SpeciesEcologyDetail) => {
    setSelectedSpecies(item);
  };

  const handleSave = () => {
    const mappedCat: SpecimenCategory = selectedSpecies.category;
    const isAnimal =
      mappedCat === 'birds' || mappedCat === 'mammals' || mappedCat === 'insects';

    const updatedTaxonomy = [
      isAnimal ? '동물계' : '식물계',
      mappedCat === 'birds'
        ? '조강'
        : mappedCat === 'insects'
        ? '곤충강'
        : mappedCat === 'mammals'
        ? '포유강'
        : '속씨식물문',
      selectedSpecies.family,
      selectedSpecies.koreanName,
    ];

    const cleanLocName = locName.trim() || initialLoc.name;
    const oldLocName = specimen.locationCoord?.name;
    const updatedObservations = (specimen.observations || []).map((obs, idx) => {
      if (idx === activeObsIndex || (oldLocName && obs.location === oldLocName)) {
        return { ...obs, location: cleanLocName };
      }
      return obs;
    });

    const updated: Specimen = {
      ...specimen,
      koreanName: selectedSpecies.koreanName,
      scientificName: selectedSpecies.scientificName,
      family: selectedSpecies.family,
      genus: selectedSpecies.scientificName.split(' ')[0] || specimen.genus,
      category: mappedCat,
      taxonomyPath: updatedTaxonomy,
      isPending: false,
      wikiSummary: selectedSpecies.keyIdentification || specimen.wikiSummary,
      traitChips:
        selectedSpecies.tags && selectedSpecies.tags.length > 0
          ? selectedSpecies.tags
          : specimen.traitChips,
      observations: updatedObservations,
      locationCoord: {
        x: specimen.locationCoord?.x ?? 50,
        y: specimen.locationCoord?.y ?? 50,
        ...specimen.locationCoord,
        name: cleanLocName,
        city: locCity.trim() || specimen.locationCoord?.city || '서울',
        district: locDistrict.trim() || specimen.locationCoord?.district,
        lat: locLat,
        lng: locLng,
      },
    };

    onSave(updated);
    onClose();
  };

  const observations =
    specimen.observations && specimen.observations.length > 0
      ? specimen.observations
      : [
          {
            id: 'default-obs',
            photoUrl: specimen.originalImage || specimen.stickerImage || '',
            date: '2026.08.14',
            time: '14:20',
            location: specimen.habitatType || '야외 서식지',
          },
        ];

  const handleExecuteDeleteObservation = () => {
    if (onDeleteObservation) {
      onDeleteObservation(specimen.id, targetObsIndexToDelete);
    }
    setConfirmDeleteType('none');
    onClose();
  };

  const handleExecuteDeleteSpecimen = () => {
    if (onDeleteSpecimen) {
      onDeleteSpecimen(specimen.id);
    }
    setConfirmDeleteType('none');
    onClose();
  };

  return (
    <div
      id="edit-specimen-modal-backdrop"
      className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F6F8F6] text-stone-900 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[88vh] sm:max-h-[84vh] flex flex-col shadow-2xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-4 bg-white flex items-center justify-between shrink-0 border-b border-stone-200/60">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <span>도감 정보 · 위치 수정</span>
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              생물 종, 발견 위치 보정 또는 사진/도감 삭제를 관리합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('species')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-b-2 ${
              activeTab === 'species'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>생물 종</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-b-2 ${
              activeTab === 'location'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>발견 위치</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('delete')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-b-2 ${
              activeTab === 'delete'
                ? 'border-rose-600 text-rose-700 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>삭제 관리</span>
          </button>
        </div>

        {/* TAB 1: SPECIES CLASSIFICATION CHANGE */}
        {activeTab === 'species' && (
          <>
            <div className="flex-1 min-h-0 flex flex-col p-4 space-y-3 overflow-hidden">
              {/* Currently Selected Species Card */}
              <div className="p-3 rounded-2xl bg-emerald-50/80 flex items-center justify-between shadow-2xs shrink-0 border border-emerald-100">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 block mb-0.5">
                    현재 선택된 생물 종
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-black text-stone-900">
                      {selectedSpecies.koreanName}
                    </span>
                    <span className="text-xs font-serif italic text-stone-600">
                      {selectedSpecies.scientificName}
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
              </div>

              {/* Search Species in Encyclopedia */}
              <div className="space-y-2 shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="변경할 생물 검색 (예: 직박구리, 몬스테라)..."
                    className="w-full bg-white rounded-xl pl-8 pr-3 py-2 text-xs text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs border border-stone-200/80"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Category filter pills */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      const el = e.currentTarget.nextElementSibling as HTMLDivElement;
                      if (el) el.scrollBy({ left: -140, behavior: 'smooth' });
                    }}
                    className="flex items-center justify-center w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 shrink-0 cursor-pointer text-xs"
                    title="왼쪽 스크롤"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div
                    onWheel={(e) => {
                      if (e.deltaY !== 0) {
                        e.currentTarget.scrollLeft += e.deltaY;
                      }
                    }}
                    className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none touch-pan-x flex-1"
                  >
                    {[
                      { key: 'all', label: '전체' },
                      { key: 'plants', label: '식물' },
                      { key: 'insects', label: '곤충' },
                      { key: 'birds', label: '조류' },
                      { key: 'invertebrates', label: '거미&연체동물' },
                      { key: 'mammals', label: '포유류' },
                      { key: 'herptiles', label: '양서&파충류' },
                      { key: 'fishes', label: '어류' },
                      { key: 'fungi', label: '균류' },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setSelectedCategory(cat.key)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                          selectedCategory === cat.key
                            ? 'bg-stone-900 text-white shadow-xs'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      const el = e.currentTarget.previousElementSibling as HTMLDivElement;
                      if (el) el.scrollBy({ left: 140, behavior: 'smooth' });
                    }}
                    className="flex items-center justify-center w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 shrink-0 cursor-pointer text-xs"
                    title="오른쪽 스크롤"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Species Candidates List */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {filteredSpeciesList.length === 0 ? (
                  <div className="py-6 text-center text-stone-400 text-xs">
                    검색 결과가 없습니다.
                  </div>
                ) : (
                  filteredSpeciesList.map((item, idx) => {
                    const isSelected = selectedSpecies.koreanName === item.koreanName;
                    const isSimilarTop =
                      idx < 2 &&
                      (item.category === specimen.category || item.family === specimen.family);
                    return (
                      <div key={item.koreanName} className="space-y-1">
                        {isSimilarTop && !isSelected && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[9px] font-bold">
                            <span>✦ 비슷한 추천 생물</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSelectSpecies(item)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 shadow-2xs'
                              : 'bg-white hover:bg-stone-50 border-stone-200/80'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-baseline gap-1.5 truncate">
                              <span className="text-xs font-bold text-stone-900">
                                {item.koreanName}
                              </span>
                              <span className="text-[10px] font-serif italic text-stone-500 truncate">
                                {item.scientificName}
                              </span>
                            </div>
                          </div>

                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </div>
                          ) : (
                            <span className="text-[10px] text-stone-500 font-bold px-2 py-0.5 rounded bg-stone-100 shrink-0">
                              선택
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-3 bg-white flex items-center gap-2 shrink-0 border-t border-stone-200/60">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-2 py-2.5 rounded-xl bg-stone-900 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>변경사항 저장</span>
              </button>
            </div>
          </>
        )}

        {/* TAB 2: DISCOVERY LOCATION PICKER (MAP + PLACE SEARCH) */}
        {activeTab === 'location' && (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
              {/* Place Search Form */}
              <form onSubmit={handleSearchPlaces} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={placeQuery}
                    onChange={(e) => setPlaceQuery(e.target.value)}
                    placeholder="장소·주소 검색 (예: 서울숲, 양재천, 한강공원)"
                    className="w-full bg-white rounded-xl pl-8 pr-3 py-2.5 text-xs text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-stone-200/80 shadow-2xs"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingPlaces}
                  className="px-3.5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold shrink-0 cursor-pointer disabled:opacity-60 flex items-center gap-1"
                >
                  {isSearchingPlaces ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '검색'}
                </button>
              </form>

              {/* Place Search Dropdown Results */}
              {placeResults.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100 max-h-44 overflow-y-auto">
                  {placeResults.map((cand) => (
                    <button
                      key={cand.id}
                      type="button"
                      onClick={() => handleSelectCandidateLocation(cand)}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50/60 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-stone-900 truncate">{cand.name}</div>
                        <div className="text-[11px] text-stone-500 truncate">{cand.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Interactive Leaflet Map Picker */}
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-200 h-48 shadow-2xs">
                <div ref={miniMapContainerRef} className="w-full h-full z-0" />

                <button
                  type="button"
                  onClick={handleUseCurrentGps}
                  disabled={isLocatingGps}
                  className="absolute top-2.5 right-2.5 z-[400] px-2.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-xs border border-stone-200 shadow-sm text-[11px] font-bold text-stone-800 flex items-center gap-1 hover:bg-white cursor-pointer"
                >
                  {isLocatingGps ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                  ) : (
                    <Crosshair className="w-3.5 h-3.5 text-emerald-700" />
                  )}
                  <span>현재 위치</span>
                </button>

                <div className="absolute bottom-2 left-2.5 z-[400] px-2.5 py-1 rounded-lg bg-black/65 text-white text-[10px] font-medium pointer-events-none">
                  지도를 누르거나 핀을 끌어 위치를 조정하세요
                </div>
              </div>

              {/* Quick Hotspot Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-stone-500 block">주요 탐사지 빠른 선택</span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {BIOBLITZ_HOTSPOTS.map((spot) => {
                    const isSame = locName === spot.name;
                    return (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() =>
                          handleSelectCandidateLocation({
                            id: spot.id,
                            name: spot.name,
                            subtitle: spot.description,
                            lat: spot.lat,
                            lng: spot.lng,
                            city: spot.name.includes('제주') ? '제주' : '서울',
                            district: spot.description.split('·')[0].trim(),
                          })
                        }
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 border transition-colors cursor-pointer ${
                          isSame
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {spot.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Editable Place Name Label + Coordinate Info */}
              <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-700" htmlFor="specimen-location-label">
                    도감 표시 장소 이름
                  </label>
                  <span className="text-[10px] text-stone-400 tabular-nums">
                    {isReverseGeocoding
                      ? '주소 불러오는 중...'
                      : `${locLat.toFixed(4)}, ${locLng.toFixed(4)}`}
                  </span>
                </div>
                <input
                  id="specimen-location-label"
                  type="text"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="예: 서울숲 습지생태원"
                  maxLength={40}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  도감의 발견 위치를 수정하면 탐험맵 핀과 이 도감으로 작성한 메모의 위치도 함께 맞춰져요.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-3 bg-white flex items-center gap-2 shrink-0 border-t border-stone-200/60">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-2 py-2.5 rounded-xl bg-stone-900 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>위치 변경 저장</span>
              </button>
            </div>
          </>
        )}

        {/* TAB 3: CLEAN ICON-FOCUSED DELETION MANAGEMENT */}
        {activeTab === 'delete' && (
          <div className="flex-1 min-h-0 flex flex-col p-4 space-y-4 overflow-y-auto scrollbar-thin">
            {observations.length > 1 && (
              <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-stone-600" />
                    <span className="text-xs font-bold text-stone-900">
                      개별 사진 삭제 ({observations.length}장)
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400">사진별 🗑️ 아이콘 터치</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {observations.map((obs, idx) => {
                    const isCurrent = activeObsIndex === idx;
                    return (
                      <div
                        key={`icon-del-${obs.id || idx}`}
                        className="relative aspect-square rounded-xl overflow-hidden bg-stone-900 border border-stone-200 shadow-xs group"
                      >
                        <img
                          src={obs.photoUrl || specimen.originalImage || undefined}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {isCurrent && (
                          <div className="absolute top-1 left-1 bg-amber-400 text-stone-950 text-[8px] font-black px-1 py-0.5 rounded shadow">
                            대표
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setTargetObsIndexToDelete(idx);
                            setConfirmDeleteType('single_image');
                          }}
                          className="absolute bottom-1 right-1 p-1.5 rounded-lg bg-rose-600/90 text-white flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer"
                          title="이 사진 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3 pr-2">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">도감 전체 삭제</h4>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    '{specimen.koreanName}' 도감 및 모든 관찰 기록을 삭제합니다
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmDeleteType('entire_specimen')}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md transition-all active:scale-95 shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>전체 삭제</span>
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Modal Overlay */}
        <AnimatePresence>
          {confirmDeleteType !== 'none' && (
            <div className="absolute inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    {confirmDeleteType === 'single_image'
                      ? '사진 1장을 삭제할까요?'
                      : '도감 전체를 삭제할까요?'}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                    {confirmDeleteType === 'single_image'
                      ? `선택한 #${targetObsIndexToDelete + 1}번 관찰 사진이 삭제됩니다.`
                      : `'${specimen.koreanName}' 도감이 모아로그 휴지통으로 이동됩니다.`}
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteType('none')}
                    className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={
                      confirmDeleteType === 'single_image'
                        ? handleExecuteDeleteObservation
                        : handleExecuteDeleteSpecimen
                    }
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-md cursor-pointer"
                  >
                    삭제 확인
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
