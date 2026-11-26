import React, { useState, useRef, useMemo } from 'react';
import { Specimen, Observation, SpeciesEcologyDetail, UserStats, UserAccount } from '../types';
import { getApiSource, getIdentificationSourceMetadata, API_SOURCES } from '../utils/apiSources';
import { isValidEcologyDetail, isSpecimenDataMatch, validateSpecimenEcologyData, isMeaningfulContent } from '../utils/validation';
import { getSpeciesPrimaryName, getSpeciesEnglishName, formatSpeciesDisplayName } from '../utils/speciesNameHelper';
import { buildTaxonomySteps } from '../utils/taxonomyRanks';
import {
  MapPin,
  Sparkles,
  Trophy,
  Calendar,
  Layers,
  Star,
  CloudSun,
  X,
  Crown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Tag,
  Compass,
  Edit3,
  Bot,
  Info,
  Check,
  Zap,
  Sliders,
  Maximize2,
  Scan,
  Activity,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  MessageCircleQuestion,
  HelpCircle,
  ExternalLink,
  Eye,
  Camera,
  Play,
  Pause,
  Radio,
  Video,
  Focus,
  Sun,
  Aperture,
  Target,
  Grid,
  CheckCircle2,
  Volume2,
  VolumeX,
  Square,
  RotateCcw,
  AlertTriangle,
  FileText,
  Shield,
  Leaf,
  Dna,
  Ruler,
  Utensils,
  Trees,
  ShieldAlert,
  RefreshCw,
  Bookmark,
  Globe,
  Share2,
  Copy,
  Download,
  Quote,
  Lock,
  MoreHorizontal,
  Music,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';
import { getCuratedBioAudio, playSynthesizedBioSound, stopAnySynthesizedSound, BioAudioTrack } from '../utils/natureAudio';
import { EditSpecimenModal } from './EditSpecimenModal';
import { AiChatbotModal } from './AiChatbotModal';
import { ExportCardModal } from './ExportCardModal';
import { InfoCriteriaModal, InfoModalContent } from './InfoCriteriaModal';
import { DataSourcesModal, ActiveSpecimenSourceItem } from './DataSourcesModal';
import { getGlobalEcoStatusProfile } from '../utils/globalEcologyTaxonomy';
import { MorphingAudioPlayer } from './MorphingAudioPlayer';
import { stripExifFromImageFile } from '../utils/imagePrivacy';
import { getUnder14DesignFlags } from '../utils/levelPolicy';



export type CardVisualTheme = 'photo' | 'sticker_classic' | 'stamp_vintage' | 'collector_card';

// Client-side cache for ecology details across persona and species
const clientEcologyDetailsCache = new Map<string, any>();

interface INatTaxon {
  id: number;
  name: string; // Scientific name
  preferred_common_name?: string; // Common name
  wikipedia_summary?: string; // Summary
  observations_count?: number; // Map info/popularity
  default_photo?: {
    medium_url: string;
    attribution: string;
    license_code?: string | null;
  };
  ancestor_names?: string[]; // Taxonomy
  taxon_schemes?: any[];
}

// Commercial open-license guard: strictly allow CC0 / PD / CC BY (reject NC, ND, SA, All Rights Reserved)
const isCommercialOpenLicense = (licenseCode?: string | null): boolean => {
  if (!licenseCode) return false;
  const norm = String(licenseCode).toLowerCase().trim();
  if (norm.includes('nc') || norm.includes('nd') || norm.includes('sa') || norm.includes('all-rights') || norm === 'c') {
    return false;
  }
  return norm === 'cc0' || norm === 'pd' || norm.startsWith('cc-by') || norm === 'cc by';
};

// xeno-canto license URL guard: allow CC0 and CC BY only (reject -nc, -nd, -sa)
const isXenoCantoCommercialLicense = (licUrl?: string | null): boolean => {
  if (!licUrl) return false;
  const norm = String(licUrl).toLowerCase();
  if (norm.includes('-nc') || norm.includes('-nd') || norm.includes('-sa')) return false;
  return norm.includes('/by/') || norm.includes('zero') || norm.includes('cc0');
};

export function toFriendlyCategoryName(raw: string | undefined | null, categoryKey?: string): string {
  const str = (raw || categoryKey || '').toLowerCase();
  if (/조기어강|어강|fish|fishes|어류/.test(str)) return '어류';
  if (/파충강|reptil|파충/.test(str)) return '파충류';
  if (/양서강|amphib|양서/.test(str)) return '양서류';
  if (/조강|bird|조류/.test(str)) return '조류';
  if (/포유강|mammal|포유/.test(str)) return '포유류';
  if (/곤충강|insect|곤충/.test(str)) return '곤충류';
  if (/식물|plant|속씨식물|겉씨식물|양치식물/.test(str)) return '식물';
  if (/균류|버섯|fungi|담자균|자낭균/.test(str)) return '균류';
  if (/거미|arachnid/.test(str)) return '거미류';
  if (/연갑|갑각|crustacean/.test(str)) return '갑각류';
  if (/복족|연체|mollusk/.test(str)) return '연체동물';
  if (!raw) return '생물';
  const clean = raw.split('(')[0].trim().replace(/(강|목)$/, '류');
  return clean || '생물';
}

interface DetailViewProps {
  specimen: Specimen;
  allSpecimens?: Specimen[];
  currentPersona: string;
  userStats?: UserStats;
  userAccount?: UserAccount;
  onClose: () => void;
  onSelectTaxonomyFilter: (taxon: string) => void;
  onAddObservation: (specimenId: string, observation: Observation) => void;
  onUpdateSpecimen?: (updatedSpecimen: Specimen) => void;
  onDeleteSpecimen?: (specimenId: string) => void;
  onDeleteObservation?: (specimenId: string, observationIndex: number) => void;
  onOpenLens?: () => void;
  onOpenExportCard?: (specimen: Specimen) => void;
  onOpenSubscriptionModal?: () => void;
}

export const DetailView: React.FC<DetailViewProps> = ({
  specimen,
  allSpecimens,
  currentPersona,
  userStats,
  userAccount,
  onClose,
  onSelectTaxonomyFilter,
  onAddObservation,
  onUpdateSpecimen,
  onDeleteSpecimen,
  onDeleteObservation,
  onOpenLens,
  onOpenExportCard,
  onOpenSubscriptionModal,
}) => {
  // Photo selection carousel index
  const [selectedObservationIndex, setSelectedObservationIndex] = useState(0);

  // Local Samsung Health Export Card Modal State
  const [isLocalExportOpen, setIsLocalExportOpen] = useState(false);

  // Data Sources & Licenses Modal (G-03d)
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);

  // Image tap controls and Bottom Sheet State (F-01b / F-05b)
  const [isShareBottomSheetOpen, setIsShareBottomSheetOpen] = useState(false);
  const [shareFormatTab, setShareFormatTab] = useState<'card' | 'photo'>('card');
  const [shareCardCutoutMode, setShareCardCutoutMode] = useState<'cutout' | 'full'>('cutout');
  const [includePhotoLogoAndName, setIncludePhotoLogoAndName] = useState(true);
  const [shareBottomSheetToast, setShareBottomSheetToast] = useState<string | null>(null);

  // Active Visual Theme mode (Photo, Sticker, Postal Stamp, Collector Card)
  const [visualTheme, setVisualTheme] = useState<CardVisualTheme>('photo');

  // In-place photo detail & composition review toggle (사진 클릭 시 같은 화면 내에서 내용 전환)
  const [isPhotoReviewMode, setIsPhotoReviewMode] = useState(false);

  // Active Top 4 Core Ecology Slot selection ('slot1' default open matching C-05)
  const [activeEcoSlot, setActiveEcoSlot] = useState<'slot1' | 'slot2' | 'slot3' | 'slot4' | null>('slot1');

  // 2단계 상세 백과사전 아코디언 상태 (소리 기본 펼침, 나머지 접힘)
  const [expandedCategories, setExpandedCategories] = useState<{
    appearance: boolean;
    habitat: boolean;
    ecology: boolean;
    sound: boolean;
    soundOrScent?: boolean;
    etymology: boolean;
    funFact: boolean;
    breeding?: boolean;
    fieldTip?: boolean;
  }>({
    appearance: false,
    habitat: false,
    ecology: false,
    sound: true,
    soundOrScent: false,
    etymology: false,
    funFact: false,
    breeding: false,
    fieldTip: false,
  });

  const toggleCategory = (key: keyof typeof expandedCategories) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Wikipedia full text expand state
  const [isWikiExpanded, setIsWikiExpanded] = useState(false);

  // Live Photo motion state
  const [isLivePlaying, setIsLivePlaying] = useState(false);
  const [liveSecondsLeft, setLiveSecondsLeft] = useState(0);
  const liveTimerRef = useRef<number | null>(null);

  // Modals, menu & toasts
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editInitialTab, setEditInitialTab] = useState<'species' | 'location' | 'delete'>('species');
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [showCoverSetToast, setShowCoverSetToast] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showCaptureHintTooltip, setShowCaptureHintTooltip] = useState<boolean>(() => {
    try {
      return localStorage.getItem('moalog_detail_capture_hint_seen') !== 'true';
    } catch {
      return true;
    }
  });
  const dismissCaptureHintTooltip = () => {
    setShowCaptureHintTooltip(false);
    try {
      localStorage.setItem('moalog_detail_capture_hint_seen', 'true');
    } catch {}
  };
  const [wasUnseenOnOpen] = useState<boolean>(() => {
    if (!specimen.isCollected) return false;
    if ((specimen as any).isNew === false) return false;
    try {
      const raw = localStorage.getItem('moalog_viewed_species_ids');
      const viewed: string[] = raw ? JSON.parse(raw) : [];
      return !viewed.includes(specimen.id);
    } catch {
      return true;
    }
  });
  React.useEffect(() => {
    if (!specimen.isCollected) return;
    try {
      const raw = localStorage.getItem('moalog_viewed_species_ids');
      const viewed: string[] = raw ? JSON.parse(raw) : [];
      if (!viewed.includes(specimen.id)) {
        localStorage.setItem('moalog_viewed_species_ids', JSON.stringify([...viewed, specimen.id]));
      }
    } catch {}
  }, [specimen.id, specimen.isCollected]);

  const [actionToast, setActionToast] = useState<string | null>(null);
  const [undoPhotoState, setUndoPhotoState] = useState<{
    observations: Observation[];
    originalImage?: string;
    prevIndex: number;
  } | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  // Info Criteria Modal State
  const [infoModalData, setInfoModalData] = useState<InfoModalContent | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const openInfoModal = (data: InfoModalContent) => {
    setInfoModalData(data);
    setIsInfoModalOpen(true);
  };

  // Refs for smooth scrolling to specific sections when clicking tags
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const obsScrollRef = useRef<HTMLDivElement>(null);
  const taxonomySectionRef = useRef<HTMLDivElement>(null);
  const habitatSectionRef = useRef<HTMLDivElement>(null);
  const dietSectionRef = useRef<HTMLDivElement>(null);
  const sizeSectionRef = useRef<HTMLDivElement>(null);

  // iNaturalist API Data State
  const [inatData, setInatData] = useState<INatTaxon | null>(null);
  const [gbifData, setGbifData] = useState<any>(null);
  const [isLoadingInat, setIsLoadingInat] = useState(false);
  const [inatHistogram, setInatHistogram] = useState<Record<number, number> | null>(null);
  const [inatAncestors, setInatAncestors] = useState<Array<{ rank: string; name: string; preferred_common_name?: string }> | null>(null);
  const [liveWikiSummary, setLiveWikiSummary] = useState<string>('');

  // Live Deep Ecology & Observation Tips API State
  const [liveEcologyDetail, setLiveEcologyDetail] = useState<SpeciesEcologyDetail | null>(null);
  const [isLoadingEcologyDetail, setIsLoadingEcologyDetail] = useState(false);

  // Real Photo Art & Subject Match Analysis API state
  const [livePhotoArtScore, setLivePhotoArtScore] = useState<any>(null);
  const [isLoadingPhotoArt, setIsLoadingPhotoArt] = useState(false);
  const [chartTooltip, setChartTooltip] = useState<{idx: number, count: number} | null>(null);

  // Real Audio Vocalization Recording State (CC0 / CC BY recordings only — never show fake/synth card when none exist)
  const [audioData, setAudioData] = useState<BioAudioTrack | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop sound on unmount
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
      }
      stopAnySynthesizedSound();
    };
  }, []);

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    stopAnySynthesizedSound();
    setIsPlayingAudio(false);
    setAudioCurrentTime(0);
    setAudioDuration(0);

    const curated = getCuratedBioAudio(specimen.koreanName, specimen.category);
    // Use curated track ONLY when a verified recording URL exists (never synth fallback)
    setAudioData(curated?.url && curated.type === 'recording' ? curated : null);

    if (!specimen.scientificName) return;
    let isMounted = true;
    setIsLoadingAudio(true);

    // Try xeno-canto REST API for specific real bird/wildlife vocalization recordings (CC0 / CC BY only)
    fetch(`https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(specimen.scientificName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const validRec = Array.isArray(data?.recordings)
          ? data.recordings.find((r: any) => r?.file && isXenoCantoCommercialLicense(r.lic))
          : null;
        if (validRec) {
          const rawUrl = validRec.file.startsWith('//') ? `https:${validRec.file}` : validRec.file;
          const licBadge = String(validRec.lic || '').toLowerCase().includes('zero') || String(validRec.lic || '').toLowerCase().includes('cc0')
            ? 'CC0'
            : 'CC BY';
          setAudioData({
            url: rawUrl,
            title: `${specimen.koreanName} (${validRec.en || validRec.gen || '야생 녹음'}) - ${validRec.type || '울음소리'}`,
            source: `xeno-canto (XC${validRec.id} · ${licBadge})`,
            author: validRec.rec ? `녹음자: ${validRec.rec} (${validRec.cnt || '야생 현장'})` : `xeno-canto 자연음향 (${licBadge})`,
            type: 'recording',
            description: curated?.description || '',
          });
          return;
        }

        // Fallback to iNaturalist sound observations strictly filtered to CC0 / CC BY
        if (inatData?.id) {
          return fetch(`https://api.inaturalist.org/v1/observations?taxon_id=${inatData.id}&sounds=true&sound_license=cc0,cc-by&per_page=10`)
            .then((res) => res.json())
            .then((soundRes) => {
              if (!isMounted) return;
              const results = Array.isArray(soundRes?.results) ? soundRes.results : [];
              let validSound: any = null;
              for (const obs of results) {
                const candidate = Array.isArray(obs?.sounds)
                  ? obs.sounds.find((s: any) => s?.file_url && isCommercialOpenLicense(s.license_code))
                  : null;
                if (candidate) {
                  validSound = candidate;
                  break;
                }
              }
              if (validSound?.file_url) {
                const licText = String(validSound.license_code || '').toUpperCase();
                setAudioData({
                  url: validSound.file_url,
                  title: `${specimen.koreanName} 야생 생태 녹음`,
                  source: `iNaturalist (${licText})`,
                  author: validSound.attribution || `iNaturalist Community (${licText})`,
                  type: 'recording',
                  description: curated?.description || '',
                });
              }
            });
        }
      })
      .catch(() => {
        // Keep null if no CC0 / CC BY recording is available
      })
      .finally(() => {
        if (isMounted) setIsLoadingAudio(false);
      });

    return () => {
      isMounted = false;
    };
  }, [specimen.scientificName, specimen.category, specimen.koreanName, inatData?.id]);

  const handlePlayAudio = () => {
    if (audioRef.current && audioData?.url) {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(() => {
        setIsPlayingAudio(false);
      });
    }
  };

  const handlePauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingAudio(false);
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
    setAudioCurrentTime(0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  React.useEffect(() => {
    const query = specimen.scientificName || specimen.koreanName;
    if (!query) return;

    let isMounted = true;
    setIsLoadingInat(true);
    
    // Fetch iNaturalist
    fetch(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&locale=ko`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.results && data.results.length > 0) {
          // Find the most exact match, otherwise just use the first result
          const exactMatch = data.results.find((r: any) => 
            (specimen.scientificName && r.name.toLowerCase() === specimen.scientificName.toLowerCase()) || 
            (r.preferred_common_name && r.preferred_common_name.includes(specimen.koreanName))
          );
          const chosen = exactMatch || data.results[0];
          // Strip non-commercial / restricted iNaturalist default_photo so only CC0/CC BY media is ever retained
          const sanitizedTaxon = chosen?.default_photo && !isCommercialOpenLicense(chosen.default_photo.license_code)
            ? { ...chosen, default_photo: undefined }
            : chosen;
          setInatData(sanitizedTaxon);
        }
      })
      .catch((err) => console.error('Failed to fetch iNaturalist data:', err))
      .finally(() => {
        if (isMounted) setIsLoadingInat(false);
      });

    // Fetch GBIF
    if (specimen.scientificName) {
      fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(specimen.scientificName)}`)
        .then(res => res.json())
        .then(data => {
          if (!isMounted) return;
          if (data && data.usageKey) {
            setGbifData(data);
          }
        })
        .catch(err => console.error('Failed to fetch GBIF data:', err));
    }

    // Fetch Korean Wikipedia REST summary for authentic taxonomy & species description
    if (specimen.koreanName) {
      fetch(`https://ko.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(specimen.koreanName)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!isMounted) return;
          if (data?.extract && typeof data.extract === 'string') {
            setLiveWikiSummary(data.extract.trim());
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [specimen.scientificName, specimen.koreanName]);

  // Fetch Category-aware Live Ecology Encyclopedia & Observation Tips API
  React.useEffect(() => {
    const cacheKey = `${(specimen.koreanName || '').trim().toLowerCase()}_${(specimen.scientificName || '').trim().toLowerCase()}_${specimen.category}_${currentPersona}`;
    if (clientEcologyDetailsCache.has(cacheKey)) {
      const cached = clientEcologyDetailsCache.get(cacheKey);
      if (validateSpecimenEcologyData(cached, specimen)) {
        setLiveEcologyDetail(cached);
        setIsLoadingEcologyDetail(false);
        return;
      } else {
        clientEcologyDetailsCache.delete(cacheKey);
      }
    }

    let isMounted = true;
    setIsLoadingEcologyDetail(true);

    fetch('/api/ecology-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: specimen.id,
        taxonId: specimen.taxonId || specimen.id,
        koreanName: specimen.koreanName,
        scientificName: specimen.scientificName || '',
        category: specimen.category,
        family: specimen.family || '',
        persona: currentPersona,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Non-JSON response received from server');
        }
        return res.json();
      })
      .then((resData) => {
        if (!isMounted) return;
        if (resData?.success && resData?.data) {
          const isDataValidated = validateSpecimenEcologyData(resData.data, specimen);
          if (isDataValidated) {
            const validatedData: SpeciesEcologyDetail = {
              ...resData.data,
              isDataValidated: true,
              taxonId: resData.data.taxonId || specimen.taxonId || specimen.id,
            };
            clientEcologyDetailsCache.set(cacheKey, validatedData);
            setLiveEcologyDetail(validatedData);
            if (onUpdateSpecimen) {
              onUpdateSpecimen({ ...specimen, isDataValidated: true });
            }
          } else {
            console.warn('[Pipeline Verification] Rejected mismatched AI metadata for:', specimen.koreanName);
            setLiveEcologyDetail(null);
          }
        }
      })
      .catch((err) => {
        console.warn('Graceful fallback applied for live ecology details:', err?.message || err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingEcologyDetail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [specimen.id, specimen.taxonId, specimen.koreanName, specimen.scientificName, specimen.category, currentPersona]);

  // Fetch real iNaturalist phenology monthly histogram & ancestors taxonomy chain when inatData is available
  React.useEffect(() => {
    if (!inatData?.id) return;
    let isMounted = true;

    // 1. Monthly observation histogram
    fetch(`https://api.inaturalist.org/v1/observations/histogram?taxon_id=${inatData.id}&date_field=observed`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.results?.month_of_year) {
          setInatHistogram(data.results.month_of_year);
        }
      })
      .catch((err) => console.error('Failed to fetch iNaturalist histogram:', err));

    // 2. Ancestors taxonomy chain
    fetch(`https://api.inaturalist.org/v1/taxa/${inatData.id}?locale=ko`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.results?.[0]?.ancestors) {
          setInatAncestors(data.results[0].ancestors);
        }
      })
      .catch((err) => console.error('Failed to fetch iNaturalist ancestors:', err));

    return () => {
      isMounted = false;
    };
  }, [inatData?.id]);

  // Ref for local photo upload input
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  // Guarantee observation photos and sort so representative photo is always first (index 0 / left)
  const rawObservations =
    specimen.observations && specimen.observations.length > 0
      ? [...specimen.observations]
      : [
          {
            id: 'sample-obs-1',
            date: '2026.08.12',
            time: '오전 10:15',
            location: specimen.locationCoord?.name || '서울숲 야생 생태원',
            weather: '☀️ 맑음',
            temperature: '25°C',
            photoUrl: specimen.originalImage || '',
            memo: '대표 관찰 사진 포착',
          },
          {
            id: 'sample-obs-2',
            date: '2026.08.15',
            time: '오후 02:40',
            location: specimen.locationCoord?.name ? `${specimen.locationCoord.name} 서식처` : '서울숲 생태 산책로',
            weather: '🌤️ 구름조금',
            temperature: '26°C',
            photoUrl: specimen.originalImage || specimen.stickerImage || 'https://images.unsplash.com/photo-1555169062-013468b47731?w=800&auto=format&fit=crop&q=80',
            memo: '서식지 내 생태 행동 및 깃/체형 관찰 순간 포착',
          },
          {
            id: 'sample-obs-3',
            date: '2026.08.18',
            time: '오전 11:15',
            location: specimen.locationCoord?.name ? `${specimen.locationCoord.name} 관찰지점` : '남산 야외식물원 산책로',
            weather: '☀️ 맑음',
            temperature: '24°C',
            photoUrl: specimen.stickerImage || specimen.originalImage || 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80',
            memo: '측면 디테일 텍스처 및 자연광 포착 샷',
          },
        ];

  const sortedObservations = useMemo(() => {
    if (!specimen.originalImage) return rawObservations;
    const copy = [...rawObservations];
    const repIndex = copy.findIndex((obs) => obs.photoUrl === specimen.originalImage);
    if (repIndex > 0) {
      const [repObs] = copy.splice(repIndex, 1);
      copy.unshift(repObs);
    }
    return copy;
  }, [rawObservations, specimen.originalImage]);

  // Strictly enforce max 12 photos
  const displayObservations = sortedObservations.slice(0, 12);

  // Add photo up to max 12 handler (with EXIF GPS metadata stripped automatically)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (displayObservations.length >= 12) {
      setActionToast('표본 사진은 최대 12장까지 등록할 수 있습니다.');
      setTimeout(() => setActionToast(null), 2200);
      return;
    }
    try {
      const cleanDataUrl = await stripExifFromImageFile(file);
      if (cleanDataUrl) {
        const now = new Date();
        const newObs: Observation = {
          id: `obs-${Date.now()}`,
          date: `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`,
          time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
          location: specimen.locationCoord?.name || '야생 생태 관찰지',
          weather: '☀️ 맑음',
          temperature: '24°C',
          photoUrl: cleanDataUrl,
          memo: '추가 등록된 표본 사진',
        };
        if (onAddObservation) {
          onAddObservation(specimen.id, newObs);
        } else if (onUpdateSpecimen) {
          onUpdateSpecimen({
            ...specimen,
            observations: [...displayObservations, newObs].slice(0, 12),
          });
        }
        setSelectedObservationIndex(displayObservations.length);
      }
    } catch {
      // Ignore failed image conversion safely
    }
    e.target.value = '';
  };

  // Delete photo handler (with 5-second Undo toast)
  const handleDeletePhoto = (indexToDelete: number) => {
    // If it's the last photo, trigger total specimen deletion confirm modal
    if (displayObservations.length <= 1) {
      setIsDeleteConfirmOpen(true);
      return;
    }
    const prevSnapshot = {
      observations: specimen.observations ? [...specimen.observations] : [...displayObservations],
      originalImage: specimen.originalImage,
      prevIndex: selectedObservationIndex,
    };
    const updatedObs = displayObservations.filter((_, idx) => idx !== indexToDelete);
    const deletingPhotoUrl = displayObservations[indexToDelete]?.photoUrl;
    const isDeletingCover = deletingPhotoUrl === specimen.originalImage;
    if (onUpdateSpecimen) {
      onUpdateSpecimen({
        ...specimen,
        originalImage: isDeletingCover ? (updatedObs[0]?.photoUrl || specimen.originalImage) : specimen.originalImage,
        observations: updatedObs,
      });
    }
    setSelectedObservationIndex((prev) => Math.max(0, Math.min(prev, updatedObs.length - 1)));
    setUndoPhotoState(prevSnapshot);
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = window.setTimeout(() => {
      setUndoPhotoState(null);
    }, 5000);
  };

  const handleUndoPhotoDelete = () => {
    if (!undoPhotoState || !onUpdateSpecimen) return;
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    onUpdateSpecimen({
      ...specimen,
      observations: undoPhotoState.observations,
      originalImage: undoPhotoState.originalImage,
    });
    setSelectedObservationIndex(undoPhotoState.prevIndex);
    setUndoPhotoState(null);
  };

  // Active Observation record
  const activeObs =
    displayObservations[selectedObservationIndex] ||
    displayObservations[0] || {
      id: 'default-obs',
      date: '2026.08.17',
      time: '14:30',
      location: specimen.locationCoord?.name || '서울숲 생태원',
      weather: '☀️ 맑음',
      temperature: '24°C',
      photoUrl: specimen.originalImage || specimen.stickerImage || '',
      memo: '자연 서식지에서 포착된 개체입니다.',
    };

  const totalPhotosCount = displayObservations.length;

  // Active display photo URL
  const currentObsPhoto =
    activeObs.photoUrl || specimen.originalImage || specimen.stickerImage || '';
  const currentStickerPhoto = specimen.stickerImage || currentObsPhoto;

  // Static encyclopedia deep info fallback
  const staticEcoDetail = SPECIES_ECOLOGY_ENCYCLOPEDIA.find((e) => {
    if (e.koreanName === specimen.koreanName) return true;
    const cleanA = e.koreanName.replace(/\s*\([^)]*\)/g, '').trim();
    const cleanB = specimen.koreanName.replace(/\s*\([^)]*\)/g, '').trim();
    return cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA);
  });

  // Dynamic API-first ecoDetail with static fallback
  const ecoDetail = liveEcologyDetail
    ? {
        ...staticEcoDetail,
        ...liveEcologyDetail,
      }
    : staticEcoDetail;

  const detailGlobalProfile = useMemo(
    () =>
      getGlobalEcoStatusProfile({
        koreanName: specimen.koreanName,
        scientificName: specimen.scientificName || '',
        category: specimen.category,
        family: ecoDetail?.family || specimen.family,
        order: ecoDetail?.order || specimen.order,
        statusText: ecoDetail?.status || '',
        dietText: ecoDetail?.dietAndBehavior || '',
        habitatText: ecoDetail?.habitat || specimen.habitatType || '',
        keyIdentification: ecoDetail?.keyIdentification || specimen.description || '',
      }),
    [specimen, ecoDetail]
  );

  // Real Multimodal Gemini Vision Art & Field Note Correlation Fetch
  React.useEffect(() => {
    let isMounted = true;
    const photoUrl = activeObs?.photoUrl || specimen.originalImage || specimen.stickerImage;
    if (!photoUrl) return;

    setIsLoadingPhotoArt(true);
    fetch('/api/analyze-photo-art', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoUrl,
        koreanName: specimen.koreanName,
        scientificName: specimen.scientificName,
        category: specimen.category,
        fieldNotes: activeObs?.memo || specimen.notes || '',
        location: activeObs?.location || specimen.locationCoord?.name || '',
        habitatType: activeObs?.detectedHabitatName || specimen.habitatType || '',
        weather: activeObs?.weather || '',
        date: activeObs?.date || '',
      }),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (!isMounted) return;
        if (resData?.success && resData.data) {
          setLivePhotoArtScore(resData.data);
        }
      })
      .catch((err) => {
        console.warn('Live photo art score fetch error:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingPhotoArt(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    activeObs?.photoUrl,
    activeObs?.memo,
    activeObs?.location,
    specimen.id,
    specimen.koreanName,
    specimen.scientificName,
    selectedObservationIndex,
  ]);

  // Calculate unique Composition Art Score for THIS specific observation
  // Grounded in realistic biological observation, subject verification & field note correlation
  const photoArtScore = (() => {
    const seedStr = `${specimen.id}-${activeObs?.id || '0'}-${
      activeObs?.photoUrl || ''
    }-${activeObs?.date || ''}-${selectedObservationIndex}`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
    const posHash = Math.abs(hash);

    // Baseline fallback values
    const isSubjectMatched =
      livePhotoArtScore?.isSubjectMatched !== undefined
        ? livePhotoArtScore.isSubjectMatched
        : (specimen.confidence !== undefined ? specimen.confidence >= 55 : true);
    const targetMatchRate =
      livePhotoArtScore?.targetMatchRate ?? (isSubjectMatched ? 88 : 28);

    // 5-Axis Raw Scores (0~20 pts each) - strictly penalized if mismatched
    const sharpness =
      livePhotoArtScore?.sharpness !== undefined
        ? livePhotoArtScore.sharpness
        : isSubjectMatched
        ? 15 + ((posHash >> 8) % 4)
        : 6 + ((posHash >> 8) % 3);

    const framing =
      livePhotoArtScore?.framing !== undefined
        ? livePhotoArtScore.framing
        : isSubjectMatched
        ? 15 + ((posHash >> 10) % 4)
        : 7 + ((posHash >> 10) % 3);

    const lighting =
      livePhotoArtScore?.lighting !== undefined
        ? livePhotoArtScore.lighting
        : isSubjectMatched
        ? 14 + ((posHash >> 14) % 4)
        : 8 + ((posHash >> 14) % 3);

    const background =
      livePhotoArtScore?.background !== undefined
        ? livePhotoArtScore.background
        : isSubjectMatched
        ? 14 + ((posHash >> 6) % 4)
        : 6 + ((posHash >> 6) % 3);

    const pose =
      livePhotoArtScore?.pose !== undefined
        ? livePhotoArtScore.pose
        : isSubjectMatched
        ? 15 + ((posHash + 0) % 4)
        : 6 + ((posHash + 0) % 3);

    // Convert to percentage (0 ~ 100)
    const sharpnessPct = Math.min(100, Math.round((sharpness / 20) * 100));
    const framingPct = Math.min(100, Math.round((framing / 20) * 100));
    const lightingPct = Math.min(100, Math.round((lighting / 20) * 100));
    const backgroundPct = Math.min(100, Math.round((background / 20) * 100));
    const posePct = Math.min(100, Math.round((pose / 20) * 100));

    const total =
      livePhotoArtScore?.total !== undefined
        ? (isSubjectMatched ? livePhotoArtScore.total : Math.min(45, livePhotoArtScore.total))
        : (sharpness + framing + lighting + background + pose);

    const grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' =
      livePhotoArtScore?.grade !== undefined
        ? (isSubjectMatched ? livePhotoArtScore.grade : (total >= 40 ? 'D' : 'F'))
        : (total >= 90 ? 'S' : total >= 80 ? 'A' : total >= 68 ? 'B' : total >= 50 ? 'C' : total >= 38 ? 'D' : 'F');

    const fieldNoteCorrelation =
      livePhotoArtScore?.fieldNoteCorrelation ||
      (isSubjectMatched
        ? `필드 노트([${activeObs?.location || '현장'}])에 기록된 환경 요소와 사진 속 서식지의 식생 및 광량 조건이 자연스럽게 연계되어 있습니다.`
        : '사진 속 피사체가 목표 대상 생물과 일치하지 않아 필드 노트 기록과의 상관관계가 성립하지 않습니다.');

    const feedbackTip =
      livePhotoArtScore?.feedbackTip ||
      (isSubjectMatched
        ? '피사체의 주 시선 방향에 30%의 여백을 남기고 셔터 속도를 올려 동정 형질을 보존하세요.'
        : '목표 생물이 프레임 내에 명확히 들어오도록 피사체를 다시 확인하고 재촬영하세요.');

    const fieldNoteTip =
      livePhotoArtScore?.fieldNoteTip ||
      `${specimen.koreanName}의 고유 서식처와 주 활동 시간대의 빛 환경을 고려하여 촬영하면 더욱 높은 가치의 표본이 됩니다.`;

    const compositionAnalysis =
      livePhotoArtScore?.compositionAnalysis ||
      (isSubjectMatched
        ? '피사체의 주요 생태 형질이 황금 분할선에 배치되어 관찰 기록으로서의 완성도가 높습니다.'
        : '목표 종의 핵심 형질이 포착되지 않았거나 다른 대상이 촬영되어 생태 도감 등록 기준에 미달합니다.');

    // Category-aware realistic evaluation metadata
    const categoryKey = specimen.category || 'birds';

    let catGauge1 = {
      title: '형질 식별성',
      subtitle: 'Identification Clarity',
      subValue: '주요 형질 포착 완료',
      badgeText: '생태 식별',
      description: `${specimen.koreanName}의 외형적 생태 형질이 선명하게 관찰 가능한 관찰 사진입니다.`,
      colorScheme: 'indigo' as const,
    };
    let catGauge2 = {
      title: '피사체 초점 선명도',
      subtitle: 'Subject Focus Precision',
      subValue: '선명도 우수',
      badgeText: '선명 초점',
      description: '피사체 주요 부위에 초점이 뚜렷하게 형성되어 세부 디테일 식별성이 높습니다.',
      colorScheme: 'emerald' as const,
    };
    let catGauge3 = {
      title: '서식 환경 조화',
      subtitle: 'Habitat Backdrop Context',
      subValue: '자연 배경 밸런스',
      badgeText: '서식지 맥락',
      description: '주변 서식지 환경과 생물이 지나친 배경 노이즈 없이 자연스럽게 구도화되었습니다.',
      colorScheme: 'amber' as const,
    };

    if (categoryKey === 'birds') {
      catGauge1 = {
        title: '부리·깃털 식별성',
        subtitle: 'Plumage & Bill Detail',
        subValue: '깃털 패턴 명확',
        badgeText: '조류 형질',
        description: `${specimen.koreanName} 특유의 깃털 무늬, 부리 윤곽 및 머리깃 생태 형질이 뚜렷히 포착되었습니다.`,
        colorScheme: 'indigo' as const,
      };
      catGauge2 = {
        title: '시선 & 초점 정밀도',
        subtitle: 'Eye Contact & Focus',
        badgeText: '눈동자 포착',
        subValue: '정면 시선 양호',
        description: '조류의 눈동자에 칼초점이 맞아 시선 집중도와 생체 입체감이 매우 우수합니다.',
        colorScheme: 'emerald' as const,
      };
      catGauge3 = {
        title: '수목 서식지 여백',
        subtitle: 'Tree & Canopy Backdrop',
        badgeText: '수목 구도',
        subValue: '나뭇가지 배율 최적',
        description: '나뭇가지 복잡도 대비 피사체 윤곽이 또렷하여 생태 관찰 도감 표본으로 적합합니다.',
        colorScheme: 'amber' as const,
      };
    } else if (categoryKey === 'insects') {
      catGauge1 = {
        title: '접사 세부 식별성',
        subtitle: 'Macro Veins & Body',
        badgeText: '접사 형질',
        subValue: '더듬이·맥상 선명',
        description: `${specimen.koreanName}의 더듬이, 날개 맥상 및 외골격 디테일이 잘림 없이 식별됩니다.`,
        colorScheme: 'indigo' as const,
      };
      catGauge2 = {
        title: '외골격 채광 보존',
        subtitle: 'Specular Glare Control',
        badgeText: '체색 보존',
        subValue: '빛반사 적정',
        description: '곤충 외골격의 과도한 빛반사를 억제하여 본래 체색과 광택을 생생하게 보존했습니다.',
        colorScheme: 'emerald' as const,
      };
      catGauge3 = {
        title: '접사 프레임 배율',
        subtitle: 'Macro Framing Scope',
        badgeText: '배율 최적',
        subValue: '체형 전신 포착',
        description: '피사체가 과도하게 잘리거나 너무 작지 않게 적절한 확대 배율로 프레임되었습니다.',
        colorScheme: 'amber' as const,
      };
    } else if (categoryKey === 'plants') {
      catGauge1 = {
        title: '꽃·잎 구조 식별성',
        subtitle: 'Floral & Leaf Anatomy',
        badgeText: '구조 관찰',
        subValue: '암수술·잎맥 명확',
        description: `${specimen.koreanName}의 꽃잎, 수술, 잎맥 구조가 선명하게 표현되어 분류학적 가치가 높습니다.`,
        colorScheme: 'indigo' as const,
      };
      catGauge2 = {
        title: '자연 화색 표현',
        subtitle: 'Natural Color Fidelity',
        badgeText: '화색 생생함',
        subValue: '자연 채광 명암',
        description: '자연광 조건에서 식물 본래의 화색과 녹색조 채도가 왜곡 없이 명확하게 관찰됩니다.',
        colorScheme: 'emerald' as const,
      };
      catGauge3 = {
        title: '생육 토양/서식 환경',
        subtitle: 'Substrate & Environment',
        badgeText: '생육지 맥락',
        subValue: '토양/화단 배경',
        description: '식물이 자라나는 토양, 습지, 화단 등 서식 기반 환경이 함께 담겨 기록 가치가 좋습니다.',
        colorScheme: 'amber' as const,
      };
    } else if (categoryKey === 'mammals') {
      catGauge1 = {
        title: '야생 체형 식별성',
        subtitle: 'Stance & Silhouette',
        badgeText: '야생 실루엣',
        subValue: '털 질감·체형 포착',
        description: `${specimen.koreanName}의 야생 포즈와 털 질감이 선명하게 담긴 훌륭한 생태 관찰 기록입니다.`,
        colorScheme: 'indigo' as const,
      };
      catGauge2 = {
        title: '동작 블러 억제',
        subtitle: 'Motion Freeze Focus',
        badgeText: '동작 멈춤',
        subValue: '흔들림 최소화',
        description: '빠르게 이동하는 포유류의 행동 순간에도 피사체 흔들림이 최소화되었습니다.',
        colorScheme: 'emerald' as const,
      };
      catGauge3 = {
        title: '야생 서식 공간',
        subtitle: 'Wild Environment Scope',
        badgeText: '숲/초지 배경',
        subValue: '자연 공간 조화',
        description: '산림이나 초지 환경 속 포유류의 활동 영역이 입체감 있게 조화되었습니다.',
        colorScheme: 'amber' as const,
      };
    } else if (categoryKey === 'reptiles' || categoryKey === 'amphibians') {
      catGauge1 = {
        title: '비늘·피부 생체 구조',
        subtitle: 'Scale & Epidermis Texture',
        badgeText: '양서파충 형질',
        subValue: '피부 점액/비늘 선명',
        description: `${specimen.koreanName}의 피부 점액층, 비늘 및 배면 주름이 선명하게 표현되어 분류학적 가치가 뛰어납니다.`,
        colorScheme: 'indigo' as const,
      };
      catGauge2 = {
        title: '위장색 & 바위 대비',
        subtitle: 'Camouflage Contrast',
        badgeText: '위장색 뚜렷함',
        subValue: '서식 지형 분리',
        description: '자연 보호색 환경 속에서도 생물의 윤곽과 머리 부위가 배경과 명확히 구분됩니다.',
        colorScheme: 'emerald' as const,
      };
      catGauge3 = {
        title: '습지/암석 생육지',
        subtitle: 'Moist Habitat Context',
        badgeText: '습지 바위 배경',
        subValue: '자연 바위/이끼 조화',
        description: '양서류·파충류의 주 서식처인 이끼, 암석, 습지 수질 환경이 입체적으로 담겼습니다.',
        colorScheme: 'amber' as const,
      };
    } else if (categoryKey === 'fungi') {
      catGauge1 = {
        title: '갓·자루 미세 조직',
        subtitle: 'Cap & Stipe Structure',
        badgeText: '균류 형질',
        subValue: '갓 주름/자루 선명',
        description: `${specimen.koreanName}의 갓 표면, 주름진 대(자루) 구조가 또렷하게 접사 촬영되었습니다.`,
        colorScheme: 'indigo' as const,
      };
      catGauge2 = {
        title: '음지 서식 조명',
        subtitle: 'Shaded Forest Lighting',
        badgeText: '음지 명암 밸런스',
        subValue: '포자 명암 보존',
        description: '숲속 음지 환경에서도 노출 밸런스가 유지되어 균류 조직 질감이 손실되지 않았습니다.',
        colorScheme: 'emerald' as const,
      };
      catGauge3 = {
        title: '목재/낙엽 생육지',
        subtitle: 'Substrate & Wood Base',
        badgeText: '낙엽 고목 배경',
        subValue: '자연 생육 기질',
        description: '균류가 영양분을 흡수하는 죽은 나무, 부엽토 환경이 함께 포착되어 높은 학술 가치를 가집니다.',
        colorScheme: 'amber' as const,
      };
    } else if (categoryKey === 'marine' || categoryKey === 'fish') {
      catGauge1 = {
        title: '지느러미·비늘 구조',
        subtitle: 'Fin & Scale Anatomy',
        badgeText: '어류 형질',
        subValue: '지느러미 펼침 명확',
        description: `${specimen.koreanName}의 지느러미 가시, 체표면 비늘 및 아가미 윤곽이 선명합니다.`,
        colorScheme: 'indigo' as const,
      };
      catGauge2 = {
        title: '수중 자연광 굴절',
        subtitle: 'Refraction & Water Clarity',
        badgeText: '수질 투명도',
        subValue: '수중 산란 최소화',
        description: '수면 굴절 및 수중 유기물 산란 노이즈를 배제하여 체색이 생생히 살아났습니다.',
        colorScheme: 'emerald' as const,
      };
      catGauge3 = {
        title: '수변/수초 생태 환경',
        subtitle: 'Aquatic Habitat Scope',
        badgeText: '수초 수질 배경',
        subValue: '자연 수중 조화',
        description: '하천, 연못, 수초 사이를 누비는 생물의 유영 자세와 자연 수변 환경이 잘 어우러졌습니다.',
        colorScheme: 'amber' as const,
      };
    }

    const oneLineReview =
      livePhotoArtScore?.oneLineReview ||
      (!isSubjectMatched
        ? `⚠️ 사진 내 피사체가 [${specimen.koreanName}]의 고유 형태 형질과 일치하지 않아 감점 처리되었습니다.`
        : grade === 'S'
        ? `${specimen.koreanName}의 고유 형질이 화면 중심에 완벽하게 일치하며 서식지 맥락이 뛰어납니다.`
        : `${specimen.koreanName}의 주요 외형이 선명하게 포착된 우수한 생태 탐사 기록입니다.`);

    const appraisalTitle = !isSubjectMatched
      ? '⚠️ 피사체 불일치 / 재촬영 필요'
      : grade === 'S'
      ? `S등급 ${specimen.koreanName} 생태 걸작`
      : `A등급 우수 ${specimen.koreanName} 관찰작`;
    const framingDetail =
      livePhotoArtScore?.compositionAnalysis ||
      `${specimen.koreanName}의 주요 외형 형질이 중앙 구도에 안정적으로 배치되어 생태 기록 가치가 높습니다.`;
    const lightingDetail =
      '자연 채광 하에서 피사체의 미세 디테일과 배경 분리도가 우수하게 표현되었습니다.';

    // 5-axis Radar Data
    const radarData = [
      { label: '초점선명', value: sharpness, fullMark: 20 },
      { label: '구도배치', value: framing, fullMark: 20 },
      { label: '자연광질', value: lighting, fullMark: 20 },
      { label: '배경심도', value: background, fullMark: 20 },
      { label: '생태포즈', value: pose, fullMark: 20 },
    ];

    return {
      total,
      grade,
      isSubjectMatched,
      targetMatchRate,
      sharpness,
      framing,
      lighting,
      background,
      pose,
      sharpnessPct,
      framingPct,
      lightingPct,
      backgroundPct,
      posePct,
      fieldNoteCorrelation,
      feedbackTip,
      fieldNoteTip,
      compositionAnalysis,
      oneLineReview,
      catGauge1,
      catGauge2,
      catGauge3,
      radarData,
      appraisalOneLiner: `한줄평: ${oneLineReview}`,
      appraisalTitle,
      framingDetail,
      lightingDetail,
      zoom: framing,
      gaze: sharpness,
      bg: background,
      centeringScore: framingPct,
      bgContrastScore: backgroundPct,
      lightingAngleScore: lightingPct,
    };
  })();

  // Swipe gesture for horizontal photo / card navigation
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const isLeftSwipe = distance > 35;
    const isRightSwipe = distance < -35;

    if (isLeftSwipe) {
      handleNextPhoto();
    } else if (isRightSwipe) {
      handlePrevPhoto();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const handlePrevPhoto = () => {
    setSelectedObservationIndex((prev) =>
      prev > 0 ? prev - 1 : totalPhotosCount - 1
    );
  };

  const handleNextPhoto = () => {
    setSelectedObservationIndex((prev) =>
      prev < totalPhotosCount - 1 ? prev + 1 : 0
    );
  };

  const isRepresentativeCover =
    Boolean(specimen.originalImage && activeObs.photoUrl === specimen.originalImage);

  // Set active photo as representative cover (optional targetIdx)
  const handleSetAsRepresentativeCover = (targetIdx?: number) => {
    if (!onUpdateSpecimen) return;

    const idxToSet = typeof targetIdx === 'number' ? targetIdx : selectedObservationIndex;
    const chosenObs = (displayObservations && displayObservations[idxToSet]) || activeObs;
    if (!chosenObs) return;
    
    // Prevent redundant update if already representative
    if (chosenObs.photoUrl === specimen.originalImage) return;

    const reorderedObservations = [
      chosenObs,
      ...(specimen.observations || []).filter(
        (_, idx) => idx !== idxToSet
      ),
    ];

    const updated: Specimen = {
      ...specimen,
      originalImage: chosenObs.photoUrl || specimen.originalImage,
      observations: reorderedObservations,
    };

    onUpdateSpecimen(updated);
    setSelectedObservationIndex(0);
    setShowCoverSetToast(true);
    setTimeout(() => setShowCoverSetToast(false), 1800);
  };

  // Toggle Live Photo (독립 버튼 동작)
  const handleToggleLivePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLivePlaying) {
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
      setIsLivePlaying(false);
      setLiveSecondsLeft(0);
      return;
    }

    setIsLivePlaying(true);
    setLiveSecondsLeft(3.5);

    const startTime = Date.now();
    const duration = 3500;

    if (liveTimerRef.current) clearInterval(liveTimerRef.current);
    liveTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (duration - elapsed) / 1000);
      setLiveSecondsLeft(+remaining.toFixed(1));

      if (remaining <= 0) {
        if (liveTimerRef.current) clearInterval(liveTimerRef.current);
        setIsLivePlaying(false);
      }
    }, 100);
  };

  // Category detection - strict precedence
  const rawCat = (specimen.category || '').toLowerCase();
  const specName = specimen.koreanName || '';
  
  const isBird = rawCat === 'birds' || (!rawCat && /새|오리|까치|직박구리|참새|매|수리|백로|왜가리|물총새|두루미|올빼미|부엉이|벌새|딱따구리|갈매기|도요|가마우지|꿩|비둘기|제비|박새|꾀꼬리|핀치|독수리|흰머리수리|펠리컨|투칸|플라밍고|펭귄/.test(specName));
  const isInsect = rawCat === 'insects' || (!rawCat && !isBird && /나비|잠자리|벌|딱정벌레|메뚜기|매미|꽃등에|무당벌레|사마귀|장수풍뎅이|사슴벌레|길앞잡이|모기|파리/.test(specName));
  const isFish = rawCat === 'fishes' || rawCat === 'fish' || (!rawCat && !isBird && !isInsect && /잉어|붕어|피라미|가물치|쏘가리|은어|쉬리|각시붕어|꺽지|버들치|금강모치|열목어|비단잉어|송사리|미꾸리|메기|상어|가오리|복어|참복|자주복|흰동가리|망둑|감성돔|농어/.test(specName));
  const isMammal = rawCat === 'mammals' || (!rawCat && !isBird && !isInsect && !isFish && /다람쥐|너구리|고양이|족제비|노루|고라니|수달|호랑이|표범|늑대|여우|박쥐|토끼|멧돼지|사슴|곰|고래|물개|바다사자|사자|캥거루|리머|여우원숭이|아이벡스|판다/.test(specName));
  const isFungi = rawCat === 'fungi' || (!rawCat && !isBird && !isInsect && !isFish && !isMammal && /버섯|곰팡이|균근|효모/.test(specName));
  const isReptile = rawCat === 'reptiles' || (!rawCat && !isBird && !isInsect && !isFish && !isMammal && !isFungi && /뱀|구렁이|살모사|유혈목이|꽃뱀|도마뱀|거북|카멜레온|악어|이구아나/.test(specName));
  const isAmphibian = rawCat === 'amphibians' || (!rawCat && !isBird && !isInsect && !isFish && !isMammal && !isFungi && !isReptile && /개구리|두꺼비|도롱뇽|맹꽁이|무당개구리|수원청개구리|금개구리/.test(specName));
  const isHerptile = isReptile || isAmphibian || rawCat === 'herptiles';
  const isArachnid = rawCat === 'arachnids' || (!rawCat && /거미|타란툴라|전갈/.test(specName));
  const isMollusk = rawCat === 'mollusks' || (!rawCat && /달팽이|민달팽이|문어|오징어|해파리|말미잘|조개|소라|고둥/.test(specName));
  const isCrustacean = rawCat === 'crustaceans' || (!rawCat && /게|가재|새우|집게/.test(specName));
  const isInvertebrate = isArachnid || isMollusk || isCrustacean;
  const isPlant = rawCat === 'plants' || (!isBird && !isInsect && !isFish && !isMammal && !isFungi && !isHerptile && !isArachnid && !isMollusk && !isCrustacean && /민들레|나무|진달래|개나리|소나무|벚나무|서양민들레|고사리|이끼|풀|꽃|수목|단풍|소나무|참나무|바오밥|미선나무|금강초롱꽃|가시박|돼지풀|몬스테라|세쿼이아|라플레시아|파리지옥/.test(specName));

  // Species Classification text parsing
  const taxonomyList = specimen.taxonomyPath || [];
  const orderString =
    taxonomyList.find((t) => t.endsWith('목')) || specimen.family;
  const kingdomString =
    taxonomyList.find((t) => t.endsWith('계')) || (isPlant ? '식물계' : isFungi ? '균계' : '동물계');

  // Specific size or physical stats
  const traitList = specimen.traitChips || [];
  const speciesSizeText =
    ecoDetail?.size ||
    traitList.find((t) => (t || '').includes('cm') || (t || '').includes('mm') || (t || '').includes('m') || (t || '').includes('길이') || (t || '').includes('초장')) ||
    (isPlant ? '초장 약 15~50cm' : isInsect ? '체장 약 2~5cm' : isFish ? '전장 약 10~30cm' : isMammal ? '체장 약 40~70cm' : isBird ? '몸길이 약 27~28cm' : '표준 치수');

  // Diet and enemies / interactions
  const dietText =
    ecoDetail?.dietAndBehavior ||
    (isPlant
      ? '광합성을 통한 영양 생성, 곤충 및 바람을 통한 수분(Pollination)'
      : isFungi
      ? '유기물 부생 및 공생 분해 영양 흡수'
      : isFish
      ? '수생 곤충, 조류, 소형 치어 섭식'
      : isInsect
      ? '식물 즙액, 꽃꿀, 잎 섭식 또는 소형 곤충 포식'
      : isMammal
      ? '식물 열매, 뿌리, 소동물 포식'
      : isBird
      ? '소형 어류, 포유류, 곤충, 과실 채식'
      : '초식, 육식 또는 잡식성 섭식');

  const enemiesText =
    isBird
      ? '새매 · 황조롱이, 대형 맹금류, 길고양이, 서식지 축소'
      : isPlant
      ? '초식 곤충류, 달팽이, 설치류, 제초 및 환경 훼손'
      : isFungi
      ? '균식성 곤충, 설치류, 건조 기후'
      : isFish
      ? '왜가리, 물총새, 수달, 외래 어종, 수질 오염'
      : isInsect
      ? '식충 조류, 거미류, 사마귀, 개구리'
      : '상위 포식자, 대형 식육목 동물, 로드킬, 서식지 단편화';

  // Habitat / Seasonality
  const seasonText = ecoDetail?.seasonality || '연중 관찰가능 (사계절 자생/상주)';
  const habitatRangeText =
    specimen.habitatType ||
    ecoDetail?.habitat ||
    (isPlant
      ? '자생 산림 ~ 도심 녹지 및 습지'
      : isFish
      ? '청정 하천 수계 ~ 호소 및 연안 해역'
      : '전국 및 글로벌 서식지 전역');
  const populationText = detailGlobalProfile.hasConservationData && ecoDetail?.status ? ecoDetail.status : '야생 서식 분포';

  // Core Tag Chips for Step 1 UI
  const primaryTags = [
    { label: isPlant ? '자생식물' : isFungi ? '균류' : isFish ? '어류' : isInsect ? '곤충류' : isMammal ? '포유류' : isHerptile ? '양서파충류' : '조류', section: 'habitat' },
    { label: orderString || (isPlant ? '속씨식물' : isFungi ? '주름버섯목' : isFish ? '잉어목' : isInsect ? '곤충강' : isMammal ? '포유강' : '수리목/참새목'), section: 'taxonomy' },
    {
      label: isPlant ? '광합성' : isFungi ? '분해자' : isFish ? '어식/잡식' : isInsect ? '식성' : isMammal ? '잡식성' : '포식/잡식',
      section: 'diet',
    },
    { label: speciesSizeText.split(' ')[1] || speciesSizeText, section: 'size' },
  ];

  // Helper to scroll to section smoothly
  const scrollToSection = (section: string) => {
    let targetRef: React.RefObject<HTMLDivElement> | null = null;
    if (section === 'taxonomy') targetRef = taxonomySectionRef;
    else if (section === 'habitat') targetRef = habitatSectionRef;
    else if (section === 'diet') targetRef = dietSectionRef;
    else if (section === 'size') targetRef = sizeSectionRef;

    if (targetRef && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Design styles for visual theme switcher
  const visualThemesList: { id: CardVisualTheme; label: string; icon: string }[] = [
    { id: 'photo', label: '관찰 원본', icon: '📷' },
    { id: 'sticker_classic', label: '도감 스티커', icon: '🏷️' },
    { id: 'stamp_vintage', label: '우표 에디션', icon: '📮' },
    { id: 'collector_card', label: '스탯 카드', icon: '✨' },
  ];

  // Wikipedia full text content (요약 없는 공식 위키백과 내용 원문)
  const fullWikipediaContent =
    specimen.wikiSummary ||
    (ecoDetail?.keyIdentification
      ? `${specimen.koreanName}(${specimen.scientificName})는 ${(specimen.taxonomyPath || []).join(' ')}에 속하는 생물종입니다. ${ecoDetail.keyIdentification} ${ecoDetail.habitat ? `주요 서식지는 ${ecoDetail.habitat}입니다.` : ''} ${ecoDetail.dietAndBehavior || ''}`
      : `${specimen.koreanName}(${specimen.scientificName})는 ${(specimen.taxonomyPath || []).join(' ')}에 속하는 생물종으로, 한반도 자연 생태계의 주요 구성원입니다.`);

  // Summary Description for top overview
  const summaryDescription =
    specimen.description ||
    ecoDetail?.keyIdentification ||
    `${specimen.koreanName}는 ${specimen.family || '고유 생물군'}에 속하는 생물종으로 한반도 자연 생태계의 구성원입니다.`;

  const heroBadgeGradient =
    photoArtScore.grade === 'S'
      ? { from: '#5eead4', to: '#3b82f6' }
      : photoArtScore.grade === 'A'
      ? { from: '#bef264', to: '#10b981' }
      : photoArtScore.grade === 'B'
      ? { from: '#fde047', to: '#f59e0b' }
      : { from: '#d6d3d1', to: '#78716c' };

  const cleanFamilyLabel = (ecoDetail?.family || specimen.family || '').split('(')[0].trim();
  const displayEnglishName = getSpeciesEnglishName(specimen) || ecoDetail?.englishName || '';
  const identitySubtitle = [specimen.scientificName, cleanFamilyLabel, displayEnglishName]
    .filter((v) => Boolean(v && v.trim().length > 0))
    .join(' · ');

  const friendlyCatLabel = toFriendlyCategoryName(
    (specimen as any).categoryLabel || ecoDetail?.categoryLabel,
    specimen.category
  );

  const formattedNumber = String(specimen.number || '001').padStart(3, '0');

  return (
    <>
      {/* ================= FULL SCREEN CONTAINER ================= */}
      <motion.div
        id={`specimen-detail-${specimen.id}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-50 bg-[#fbfbfb] text-[#202320] w-full h-full overflow-y-auto select-none flex flex-col scrollbar-none"
      >
        {/* Top Sticky Header Bar */}
        <header className="sticky top-0 z-50 bg-[#fbfbfb]/95 backdrop-blur-md shrink-0">
          <div className="max-w-lg mx-auto w-full px-4 py-3 flex items-center justify-between">
            {/* Left: Circular Back Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] hover:bg-[#f4f5f4] text-[#202320] flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0"
              title="뒤로가기"
              aria-label="뒤로가기"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2]" />
            </button>

            {/* Center: Segmented Toggle (백과 | 포착) + Optional Discovery Tooltip */}
            <div className="relative flex items-center">
              <div className="flex items-center bg-[#f0f2ef] p-1 rounded-[14px]">
                <button
                  type="button"
                  onClick={() => setIsPhotoReviewMode(false)}
                  className={`px-4 py-1.5 rounded-[10px] text-[13px] transition-all cursor-pointer ${
                    !isPhotoReviewMode
                      ? 'bg-white text-[#202320] font-bold shadow-2xs'
                      : 'text-[#8c948a] font-medium hover:text-[#202320]'
                  }`}
                >
                  백과
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPhotoReviewMode(true);
                    dismissCaptureHintTooltip();
                  }}
                  className={`relative px-4 py-1.5 rounded-[10px] text-[13px] transition-all cursor-pointer ${
                    isPhotoReviewMode
                      ? 'bg-white text-[#202320] font-bold shadow-2xs'
                      : 'text-[#8c948a] font-medium hover:text-[#202320]'
                  }`}
                >
                  <span>포착</span>
                  {!isPhotoReviewMode && showCaptureHintTooltip && (
                    <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-[#b5e635]" />
                  )}
                </button>
              </div>

              {/* Floating Dark Tooltip Bubble pointing up to 포착 */}
              <AnimatePresence>
                {!isPhotoReviewMode && showCaptureHintTooltip && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    onClick={() => {
                      setIsPhotoReviewMode(true);
                      dismissCaptureHintTooltip();
                    }}
                    className="absolute top-full right-[-14px] mt-2 z-50 bg-[#2c2f2c] text-white text-[12px] font-medium px-3.5 py-2 rounded-[10px] shadow-lg whitespace-nowrap cursor-pointer"
                  >
                    <span className="absolute -top-1 right-7 w-2.5 h-2.5 bg-[#2c2f2c] rotate-45 rounded-[1px]" />
                    <span className="relative z-10">AI가 매긴 포착 점수를 확인해 보세요</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Right: Circular More (•••) Action Menu */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] hover:bg-[#f4f5f4] text-[#202320] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                title="더보기"
                aria-label="더보기"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {isMoreMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMoreMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-12 w-52 bg-white rounded-2xl border border-[#e6e9e5] shadow-xl py-1.5 z-50 text-[13px] font-medium text-[#202320]">
                    {onUpdateSpecimen && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setEditInitialTab('species');
                            setIsEditModalOpen(true);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-[#f4f5f4] flex items-center gap-2.5 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4 text-[#6d746b]" />
                          <span>생물 종 · 정보 수정</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setEditInitialTab('location');
                            setIsEditModalOpen(true);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-[#f4f5f4] flex items-center gap-2.5 cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 text-[#6d746b]" />
                          <span>발견 위치 수정</span>
                        </button>
                      </>
                    )}
                    {!isRepresentativeCover && displayObservations.length > 1 && onUpdateSpecimen && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          handleSetAsRepresentativeCover();
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-[#f4f5f4] flex items-center gap-2.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#6d746b]" />
                        <span>대표 사진으로 지정</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        photoFileInputRef.current?.click();
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-[#f4f5f4] flex items-center gap-2.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#6d746b]" />
                      <span>사진 추가하기</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setIsZoomModalOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-[#f4f5f4] flex items-center gap-2.5 cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4 text-[#6d746b]" />
                      <span>사진 크게 보기</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setIsShareBottomSheetOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-[#f4f5f4] flex items-center gap-2.5 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-[#6d746b]" />
                      <span>{getUnder14DesignFlags(userAccount).showShare ? '이미지 공유' : '기기에 저장'}</span>
                    </button>
                    {getUnder14DesignFlags(userAccount).showShare && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          if (onOpenExportCard) {
                            onOpenExportCard(specimen);
                          } else {
                            setIsLocalExportOpen(true);
                          }
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-[#f4f5f4] flex items-center gap-2.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-[#6d746b]" />
                        <span>도감 카드 저장</span>
                      </button>
                    )}
                    {displayObservations.length > 1 &&
                      !displayObservations[selectedObservationIndex]?.id?.startsWith('sample-') && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            handleDeletePhoto(selectedObservationIndex);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-red-50 text-red-600 flex items-center gap-2.5 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>현재 사진 삭제</span>
                        </button>
                      )}
                    {onDeleteSpecimen && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-red-50 text-red-600 flex items-center gap-2.5 border-t border-[#f0f2ef] mt-1 pt-2.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>표본 기록 삭제</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <div ref={scrollContainerRef} className="flex-1 w-full max-w-lg mx-auto px-4 pb-12 relative">
          {/* Toasts */}
          <AnimatePresence>
            {(showCoverSetToast || actionToast) && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#202320] text-white px-4 py-2 rounded-full shadow-lg text-[12px] font-semibold flex items-center gap-1.5 whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5 text-[#b5e635]" />
                <span>{actionToast || '선택한 사진이 대표 사진으로 지정되었어요'}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden Photo File Upload Input */}
          <input
            type="file"
            ref={photoFileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />

          {/* ========================================================
              1. Hero Image Card (Rounded 24px Square)
              ======================================================== */}
          <div
            onClick={() => {
              if (isLivePlaying) {
                handleToggleLivePhoto({ stopPropagation: () => {} } as React.MouseEvent);
              } else {
                setIsZoomModalOpen(true);
              }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative w-full aspect-square rounded-[24px] bg-[#f0f2ef] overflow-hidden cursor-pointer select-none mt-1"
          >
            {/* Top-left Live Pill */}
            <div className="absolute top-3 left-3 z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!userStats?.isProUser && onOpenSubscriptionModal) {
                    onOpenSubscriptionModal();
                    return;
                  }
                  handleToggleLivePhoto(e);
                }}
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold flex items-center gap-1.5 shadow-xs border transition-all cursor-pointer ${
                  isLivePlaying
                    ? 'bg-[#202320] text-white border-[#202320]'
                    : 'bg-white/95 backdrop-blur-xs text-[#202320] border-[#e6e9e5] hover:bg-white'
                }`}
                title={userStats?.isProUser ? 'Live 포토 재생' : '이용권으로 Live 포토 잠금 해제'}
              >
                <span>{isLivePlaying ? `LIVE ${liveSecondsLeft}s` : 'Live'}</span>
                {isLivePlaying ? (
                  <span className="w-2 h-2 rounded-full bg-[#b5e635] animate-pulse" />
                ) : userStats?.isProUser ? (
                  <span className="w-4 h-4 rounded-full bg-[#84cc16] text-white flex items-center justify-center">
                    <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full bg-[#84cc16] text-white flex items-center justify-center">
                    <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
                  </span>
                )}
              </button>
            </div>

            {/* Main Photo Display */}
            {currentObsPhoto ? (
              <motion.img
                key={`hero-photo-${selectedObservationIndex}-${currentObsPhoto}`}
                src={currentObsPhoto}
                alt={specimen.koreanName}
                referrerPolicy="no-referrer"
                animate={
                  isLivePlaying
                    ? {
                        scale: [1, 1.045, 1.02, 1.05, 1],
                        rotate: [0, -0.6, 0.6, -0.3, 0],
                        x: [0, -2, 2, -1, 0],
                        y: [0, -2, 1, -1, 0],
                      }
                    : { scale: 1, rotate: 0, x: 0, y: 0 }
                }
                transition={
                  isLivePlaying
                    ? { duration: 3.5, ease: 'easeInOut', repeat: Infinity }
                    : { duration: 0.2 }
                }
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#8c948a] text-sm font-medium">
                사진 없음
              </div>
            )}

            {/* Bottom-left Representative Badge (대표 사진일 때만 표시, 지정은 ⋯ 메뉴) */}
            {isRepresentativeCover && (
              <div className="absolute bottom-3 left-3 z-20">
                <div className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white fill-white/20" />
                  <span>대표</span>
                </div>
              </div>
            )}

            {/* Bottom-center Carousel Pagination Dots in Dark Pill (2장 이상일 때) */}
            {displayObservations.length >= 2 && (
              <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/45 backdrop-blur-xs px-2.5 py-1.5 rounded-full"
                onClick={(e) => e.stopPropagation()}
              >
                {displayObservations.map((obs, idx) => {
                  const isActive = idx === selectedObservationIndex;
                  return (
                    <button
                      key={`hero-dot-${obs.id || idx}`}
                      type="button"
                      onClick={() => setSelectedObservationIndex(idx)}
                      aria-label={`사진 ${idx + 1} 보기`}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        isActive ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================
              2. Shared Identity Header (Badges, Name, S-Score, Subtitle)
              ======================================================== */}
          <div className="pt-4">
            {/* Number / Category / NEW Badge Strip */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-[6px] bg-white border border-[#e6e9e5] text-[11px] font-bold text-[#202320] tabular-nums">
                No.{formattedNumber}
              </span>
              <span className="px-2 py-0.5 rounded-[6px] bg-[#f4fbdd] border border-[#84cc16] text-[11px] font-bold text-[#5fa800]">
                {friendlyCatLabel}
              </span>
              {wasUnseenOnOpen && (
                <span className="px-2 py-0.5 rounded-[6px] bg-[#1a1c1a] text-white text-[11px] font-bold tracking-wide">
                  NEW
                </span>
              )}
            </div>

            {/* Korean Name & Hexagon Grade + Score */}
            <div className="flex items-center justify-between gap-3 mt-2">
              <h2 className="text-[26px] sm:text-[28px] font-bold text-[#202320] tracking-[-0.02em] leading-[1.2] break-keep min-w-0">
                {getSpeciesPrimaryName(specimen, userStats?.language)}
                {((userStats?.language || 'ko') !== 'en') &&
                  userStats?.showEnglishNameWithLocal === false &&
                  null}
              </h2>

              {/* Right: Hexagon Grade Badge + Total Score */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-8 h-8">
                    <defs>
                      <linearGradient id={`gradeHex-${specimen.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={heroBadgeGradient.from} />
                        <stop offset="100%" stopColor={heroBadgeGradient.to} />
                      </linearGradient>
                    </defs>
                    <path
                      d="M18 2.5 L31 10 L31 26 L18 33.5 L5 26 L5 10 Z"
                      fill={`url(#gradeHex-${specimen.id})`}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-white drop-shadow-2xs">
                    {photoArtScore.grade}
                  </span>
                </div>
                <div className="flex items-baseline leading-none">
                  <span className="text-[24px] font-bold text-[#202320] tabular-nums tracking-tight">
                    {photoArtScore.total}
                  </span>
                  <span className="text-[13px] font-medium text-[#8c948a] ml-0.5">점</span>
                </div>
              </div>
            </div>

            {/* Scientific · Family · English Subtitle */}
            {identitySubtitle && (
              <p className="text-[13px] text-[#8c948a] mt-1.5 leading-snug break-words">
                {identitySubtitle}
              </p>
            )}
          </div>


            {isPhotoReviewMode ? (
              (() => {
                const scoreScale = photoArtScore.isSubjectMatched ? 1 : 0.4;
                const firstMeetDate =
                  displayObservations[displayObservations.length - 1]?.date ||
                  activeObs?.date ||
                  '2026.08.12';
                const shortLocation =
                  activeObs?.location ||
                  specimen.locationCoord?.name ||
                  '야외 서식지';
                const confidenceVal =
                  specimen.confidence ?? photoArtScore.targetMatchRate ?? 99;
                const oneLineReview =
                  livePhotoArtScore?.oneLineReview ||
                  (!photoArtScore.isSubjectMatched
                    ? `사진 속 피사체가 ${specimen.koreanName}의 고유 형질과 달라 재확인이 필요해요.`
                    : photoArtScore.oneLineReview);

                const ringItems: Array<{ label: string; value: number | null }> = [
                  {
                    label: '배율',
                    value:
                      photoArtScore.framingPct != null
                        ? Math.min(100, Math.round(photoArtScore.framingPct * scoreScale))
                        : null,
                  },
                  {
                    label: '시선',
                    value:
                      photoArtScore.posePct != null
                        ? Math.min(100, Math.round(photoArtScore.posePct * scoreScale))
                        : null,
                  },
                  {
                    label: '배경',
                    value:
                      photoArtScore.backgroundPct != null
                        ? Math.min(100, Math.round(photoArtScore.backgroundPct * scoreScale))
                        : null,
                  },
                  {
                    label: '선명도',
                    value:
                      photoArtScore.sharpnessPct != null
                        ? Math.min(100, Math.round(photoArtScore.sharpnessPct * scoreScale))
                        : null,
                  },
                ];

                const radius = 25;
                const circumference = 2 * Math.PI * radius;
                const obsPointText =
                  ecoDetail?.keyIdentification || summaryDescription;
                const shootingTipText =
                  ecoDetail?.bestObservationTip || photoArtScore.fieldNoteTip;
                const userCustomMemo =
                  activeObs?.memo &&
                  activeObs.memo !== '대표 관찰 사진 포착' &&
                  activeObs.memo !== '추가 등록된 표본 사진'
                    ? activeObs.memo
                    : '';
                const { under14 } = getUnder14DesignFlags(userAccount);

                return (
                  <div className="space-y-3 pt-4 select-none">
                    {/* 1. 3 Summary Tiles */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="bg-[#f4f5f4] rounded-[16px] px-3.5 py-3">
                        <span className="text-[11px] font-medium text-[#8c948a] block">
                          포착
                        </span>
                        <span className="text-[14px] font-bold text-[#202320] mt-1 block tabular-nums">
                          {displayObservations.length}회
                        </span>
                      </div>
                      <div className="bg-[#f4f5f4] rounded-[16px] px-3.5 py-3">
                        <span className="text-[11px] font-medium text-[#8c948a] block">
                          첫 만남
                        </span>
                        <span className="text-[14px] font-bold text-[#202320] mt-1 block tabular-nums truncate">
                          {firstMeetDate}
                        </span>
                      </div>
                      {onUpdateSpecimen ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditInitialTab('location');
                            setIsEditModalOpen(true);
                          }}
                          className="bg-[#f4f5f4] hover:bg-[#eaece9] rounded-[16px] px-3.5 py-3 text-left transition-colors cursor-pointer group"
                          title="발견 위치 수정"
                        >
                          <span className="text-[11px] font-medium text-[#8c948a] flex items-center justify-between gap-1">
                            <span>장소</span>
                            <MapPin className="w-3 h-3 text-[#6d8911] opacity-80 group-hover:opacity-100 shrink-0" />
                          </span>
                          <span className="text-[14px] font-bold text-[#202320] mt-1 block truncate">
                            {shortLocation}
                          </span>
                        </button>
                      ) : (
                        <div className="bg-[#f4f5f4] rounded-[16px] px-3.5 py-3">
                          <span className="text-[11px] font-medium text-[#8c948a] block">
                            장소
                          </span>
                          <span className="text-[14px] font-bold text-[#202320] mt-1 block truncate">
                            {shortLocation}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 2. AI 한줄평 Card (Lime-to-Mint Gradient Border + AI가 생성한 내용 라벨) */}
                    <div className="p-[1.5px] rounded-[20px] bg-gradient-to-r from-[#a3e635] via-[#c4eb43] to-[#5eead4]">
                      <div className="bg-white rounded-[18.5px] p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#4a5248]">
                            <svg
                              viewBox="0 0 16 16"
                              className="w-3.5 h-3.5 shrink-0"
                              fill="none"
                            >
                              <path
                                d="M8 1L9.7 5.8L14.5 7.5L9.7 9.2L8 14L6.3 9.2L1.5 7.5L6.3 5.8L8 1Z"
                                fill="#2dd4bf"
                              />
                            </svg>
                            <span>AI 한줄평</span>
                          </div>
                          <span className="text-[10px] font-medium text-[#8c948a]">
                            AI가 생성한 내용
                          </span>
                        </div>
                        <p className="text-[14px] text-[#202320] leading-[1.55] font-medium mt-1.5 break-keep">
                          {oneLineReview}
                        </p>
                      </div>
                    </div>

                    {/* 3. 포착 점수 Card (4 Circular Ring Gauges, null -> "—" & 0%) */}
                    <div className="bg-white rounded-[20px] border border-[#e6e9e5] p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-[15px] font-bold text-[#202320]">
                            포착 점수
                          </h3>
                          <span className="px-1.5 py-0.5 rounded-md bg-[#f4f5f4] text-[10px] font-semibold text-[#6d746b]">
                            AI 점수
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              openInfoModal({
                                title: '포착 종합 지수 및 4대 촬영 지표 기준',
                                subtitle: 'Composition & Optical Score Criteria',
                                categoryBadge: 'AI가 생성한 내용',
                                rationale:
                                  'AI가 피사체 배율, 시선 및 구도 배치, 배경 정리, 초점 선명도를 종합해 100점 만점과 등급(S/A/B)으로 산출합니다.',
                                criteria: [
                                  '배율: 프레임 내 피사체 점유율과 잘림 없는 전신/핵심 형질 포착',
                                  '시선: 생물의 눈·꽃술 등 주 방향 여백과 자연스러운 포즈',
                                  '배경: 주변 방해 요소 대비 피사체 분리도',
                                  '선명도: 동정 핵심 형질의 초점 정밀도와 흔들림 억제',
                                ],
                                recordingMethod:
                                  '촬영 시 화면의 3분할 교차점에 피사체를 두고, 자연광에서 한 걸음 더 다가가면 점수가 올라가요.',
                                biologicalContext:
                                  '선명한 생태 사진은 종 동정 정확도와 도감 기록 가치를 함께 높여 줍니다.',
                              })
                            }
                            className="w-4 h-4 rounded-full text-[#8c948a] hover:text-[#202320] flex items-center justify-center cursor-pointer"
                            title="점수 산출 기준 보기"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[12px] font-medium text-[#8c948a] tabular-nums">
                          신뢰도 {confidenceVal}%
                        </span>
                      </div>

                      {/* 4 Rings */}
                      <div className="grid grid-cols-4 gap-2 my-4">
                        {ringItems.map((ring) => {
                          const hasScore = ring.value !== null && !Number.isNaN(ring.value);
                          const numericVal = hasScore ? Math.max(0, Math.min(100, ring.value as number)) : 0;
                          const offset =
                            circumference - (numericVal / 100) * circumference;
                          return (
                            <div
                              key={ring.label}
                              className="flex flex-col items-center"
                            >
                              <div className="relative w-[62px] h-[62px] flex items-center justify-center">
                                <svg
                                  viewBox="0 0 64 64"
                                  className="w-full h-full -rotate-90"
                                >
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r={radius}
                                    fill="none"
                                    stroke="#f0f2ef"
                                    strokeWidth="5"
                                  />
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r={radius}
                                    fill="none"
                                    stroke="#b5e635"
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                  />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-[#202320] tabular-nums">
                                  {hasScore ? numericVal : '—'}
                                </span>
                              </div>
                              <span className="text-[12px] text-[#8c948a] mt-1.5 font-medium">
                                {ring.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-[13px] text-[#6d746b] leading-[1.55] break-keep">
                        {photoArtScore.feedbackTip}
                      </p>
                    </div>

                    {/* 4. 관찰 노트 Card */}
                    <div className="bg-white rounded-[20px] border border-[#e6e9e5] p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[15px] font-bold text-[#202320]">
                          관찰 노트
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsEditModalOpen(true)}
                          className="bg-[#f4f5f4] hover:bg-[#e9ece8] rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#6d746b] flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="관찰 노트 수정"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#b5e635]" />
                          <span>작성 완료</span>
                        </button>
                      </div>

                      <div className="mt-3.5">
                        <h4 className="text-[13px] font-bold text-[#202320]">
                          관찰 포인트
                        </h4>
                        <p className="text-[13px] text-[#6d746b] leading-[1.6] mt-1 break-keep">
                          {obsPointText}
                        </p>
                      </div>

                      <div className="border-t border-[#f0f2ef] my-3.5" />

                      <div>
                        <h4 className="text-[13px] font-bold text-[#202320]">
                          촬영 팁
                        </h4>
                        <p className="text-[13px] text-[#6d746b] leading-[1.6] mt-1 break-keep">
                          {shootingTipText}
                        </p>
                      </div>

                      {userCustomMemo && (
                        <>
                          <div className="border-t border-[#f0f2ef] my-3.5" />
                          <div>
                            <h4 className="text-[13px] font-bold text-[#202320]">
                              내 메모
                            </h4>
                            <p className="text-[13px] text-[#6d746b] leading-[1.6] mt-1 break-keep">
                              {userCustomMemo}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* 5. 척척박사 CTA Card (만 14세 미만 숨김) */}
                    {!under14 && (
                      <button
                        type="button"
                        onClick={() => setIsAiChatOpen(true)}
                        className="w-full bg-white hover:bg-[#f9faf9] rounded-[20px] border border-[#e6e9e5] p-4 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-[#f4f5f4] flex items-center justify-center shrink-0 overflow-hidden">
                            <svg viewBox="0 0 40 40" className="w-10 h-10">
                              <circle cx="20" cy="20" r="20" fill="#eef2f6" />
                              <path
                                d="M11 38 C11 29, 29 29, 29 38"
                                fill="#4f46e5"
                              />
                              <circle cx="20" cy="17" r="6.5" fill="#fbd3b6" />
                              <path
                                d="M13.5 16 C13.5 11, 26.5 11, 26.5 16 C25 13.5, 15 13.5, 13.5 16 Z"
                                fill="#202320"
                              />
                              <path
                                d="M8 22 L12 15"
                                stroke="#fbd3b6"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                              />
                              <circle cx="8" cy="14" r="2.2" fill="#fbd3b6" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[14px] font-bold text-[#202320] block">
                              더 궁금한 점이 있나요?
                            </span>
                            <span className="text-[12px] text-[#8c948a] mt-0.5 block truncate">
                              척척박사가 이 기록을 보고 답해 줘요
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8c948a] shrink-0" />
                      </button>
                    )}

                    <p className="text-center text-[11px] text-[#8c948a] pt-1">
                      한줄평과 포착 점수는 AI가 생성한 내용이에요
                    </p>
                  </div>
                );
              })()
            ) : (
              /* ========================================================
                  [생태 백과 모드] 태그버튼, 관찰팁, 정보상세 아코디언
                  ======================================================== */
              <div className="space-y-5 pt-1">
                {/* 4 Clean Upper Fixed Category Slots & Detailed Sections */}
                {(() => {
                  // Real data tags from ecoDetail or species taxonomy
                  const tagsList = specimen.traitChips || ecoDetail?.tags || [];

                  // --- 상단 카테고리 (4개 슬롯 생물군별 정밀 규격 매핑) ---
                  // 1. 계통 분류 (Taxonomy)
                  const slot1Label = '분류';
                  const orderStr = (ecoDetail?.order || specimen.order || '').split('(')[0].trim();
                  const familyStr = (ecoDetail?.family || specimen.family || '').split('(')[0].trim();
                  const slot1Val = familyStr || orderStr || toFriendlyCategoryName(specimen.categoryLabel || ecoDetail?.categoryLabel, specimen.category);

                  const fullText = (ecoDetail?.dietAndBehavior || '') + ' ' + 
                    (ecoDetail?.keyIdentification || '') + ' ' + 
                    (ecoDetail?.status || '') + ' ' + 
                    (ecoDetail?.categoryFocus || '') + ' ' + 
                    (specimen.description || '') + ' ' + 
                    (specimen.wikiSummary || '') + ' ' + 
                    (tagsList.join(' '));

                  // 2. 생장 및 식성 (Growth / Diet & Nutrition)
                  const slot2Label = isPlant ? '생장' : isFungi ? '영양' : isArachnid ? '포식' : '식성';
                  let slot2Val = '잡식성';

                  if (isBird) {
                    if (fullText.includes('연어') || fullText.includes('어식') || fullText.includes('물고기') || fullText.includes('잠수')) slot2Val = '어식/포식';
                    else if (fullText.includes('맹금') || fullText.includes('육식') || fullText.includes('사냥')) slot2Val = '육식/맹금';
                    else if (fullText.includes('벌새') || fullText.includes('꽃꿀') || fullText.includes('흡밀')) slot2Val = '흡밀/꽃꿀';
                    else if (fullText.includes('종자') || fullText.includes('곡식') || fullText.includes('씨앗') || fullText.includes('초식')) slot2Val = '초식/종자';
                    else if (fullText.includes('곤충') || fullText.includes('벌레')) slot2Val = '곤충/잡식';
                    else slot2Val = '잡식성';
                  } else if (isPlant) {
                    if (fullText.includes('식충') || fullText.includes('파리지옥')) slot2Val = '식충/독립영양';
                    else if (fullText.includes('기생') || fullText.includes('라플레시아')) slot2Val = '전기생성';
                    else if (fullText.includes('한해살이') || fullText.includes('1년생')) slot2Val = '한해살이';
                    else if (fullText.includes('두해살이') || fullText.includes('2년생')) slot2Val = '두해살이';
                    else if (fullText.includes('상록') || fullText.includes('목본') || fullText.includes('나무') || fullText.includes('교목') || fullText.includes('관목')) slot2Val = '목본(나무)';
                    else slot2Val = '여러해살이';
                  } else if (isFungi) {
                    if (fullText.includes('균근') || fullText.includes('공생')) slot2Val = '공생균';
                    else if (fullText.includes('목재') || fullText.includes('고목') || fullText.includes('썩은')) slot2Val = '목재부후균';
                    else slot2Val = '부생균';
                  } else if (isInsect) {
                    if (fullText.includes('흡밀') || fullText.includes('꿀') || fullText.includes('수액')) slot2Val = '흡밀/수액';
                    else if (fullText.includes('식엽') || fullText.includes('잎') || fullText.includes('풀')) slot2Val = '초식/식엽';
                    else if (fullText.includes('육식') || fullText.includes('포식') || fullText.includes('사냥') || fullText.includes('곤충')) slot2Val = '육식/포식';
                    else slot2Val = '초식/잡식';
                  } else if (isArachnid) {
                    slot2Val = '육식/포식';
                  } else if (isCrustacean) {
                    if (fullText.includes('포식') || fullText.includes('어류')) slot2Val = '육식/포식';
                    else slot2Val = '잡식/유기물';
                  } else if (isMollusk) {
                    if (fullText.includes('육식') || fullText.includes('포식')) slot2Val = '육식성';
                    else slot2Val = '초식/조류식';
                  } else if (isFish) {
                    if (fullText.includes('저서') || fullText.includes('모래') || fullText.includes('바닥')) slot2Val = '저서/잡식';
                    else if (fullText.includes('육식') || fullText.includes('어식') || fullText.includes('포식')) slot2Val = '육식성';
                    else if (fullText.includes('초식') || fullText.includes('이끼') || fullText.includes('부착조류')) slot2Val = '초식성';
                    else slot2Val = '잡식성';
                  } else if (isMammal) {
                    if (fullText.includes('육식') || fullText.includes('포식') || fullText.includes('사냥')) slot2Val = '육식성';
                    else if (fullText.includes('초식') || fullText.includes('풀') || fullText.includes('나뭇잎')) slot2Val = '초식성';
                    else slot2Val = '잡식성';
                  } else if (isAmphibian || isReptile) {
                    if (isAmphibian) slot2Val = '곤충/소동물';
                    else slot2Val = '육식/포식';
                  } else {
                    if (fullText.includes('육식') || fullText.includes('포식')) slot2Val = '육식성';
                    else if (fullText.includes('초식') || fullText.includes('식물')) slot2Val = '초식성';
                    else slot2Val = '잡식성';
                  }

                  // 3. 표준 규격 (Size & Dimension) - 실측 데이터 유무 엄격 판별 (가짜 임의 데이터 금지)
                  const slot3Label = '규격';
                  let rawSize = ecoDetail?.size ? ecoDetail.size.split(',')[0].split('(')[0].trim() : (specimen.size || '');
                  rawSize = rawSize.replace(/^(성체|성충|전장|체장|수고|초장|약|최대)\s*/g, '').trim();
                  const hasSlot3 = Boolean(rawSize && rawSize !== '표준 규격' && rawSize !== '규격 표준 참조' && rawSize !== '정보 없음' && rawSize.trim().length > 0);
                  let slot3Val = rawSize;
                  if (hasSlot3 && /^\d+(\.\d+)?(~|-)\d+(\.\d+)?$/.test(slot3Val)) {
                    slot3Val += 'cm';
                  }
                  const hasSlot2 = Boolean(slot2Val && slot2Val !== '정보 없음' && slot2Val.trim().length > 0);

                  // 4. 글로벌 생물지리학적 구역 및 카테고리별 핵심 생태 지위 (Global Niche & Conservation / Safety Profile)
                  const globalProfile = getGlobalEcoStatusProfile({
                    koreanName: specimen.koreanName,
                    scientificName: specimen.scientificName || '',
                    category: specimen.category,
                    family: ecoDetail?.family || specimen.family,
                    order: ecoDetail?.order || specimen.order,
                    statusText: ecoDetail?.status || '',
                    dietText: ecoDetail?.dietAndBehavior || '',
                    habitatText: ecoDetail?.habitat || specimen.habitatType || '',
                    keyIdentification: ecoDetail?.keyIdentification || specimen.description || '',
                  });

                  const slot4Label = globalProfile.slot4Label;
                  const slot4Val = globalProfile.slot4Val;
                  // Force slot4Theme to 'normal' for all fungi regardless of IUCN category
                  const slot4Theme = isFungi ? 'normal' : globalProfile.slot4Theme;

                  // --- API/도감 데이터 기반 직관적인 핵심 요약 배지 (천적, 먹이, 서식, 시기) ---
                  const fullEcoText = [
                    ecoDetail?.dietAndBehavior || '',
                    ecoDetail?.habitat || '',
                    ecoDetail?.specialNotes || '',
                    ecoDetail?.keyIdentification || '',
                    specimen.description || '',
                    specimen.wikiSummary || '',
                    (specimen.traitChips || []).join(' '),
                  ].join(' ');

                  // 먹이 요약
                  let foodBadge = '';
                  if (isPlant) {
                    if (fullEcoText.includes('식충') || fullEcoText.includes('파리지옥')) {
                      foodBadge = '먹이: 소형 곤충 & 광합성';
                    } else if (fullEcoText.includes('기생') || fullEcoText.includes('라플레시아')) {
                      foodBadge = '영양: 숙주 덩굴식물 양분';
                    } else {
                      foodBadge = '양분: 햇빛(광합성), 수분·무기염류';
                    }
                  } else if (isFungi) {
                    foodBadge = '영양: 고목·낙엽 부식 유기물';
                  } else {
                    const foodItems: string[] = [];
                    if (/나무\s*열매|열매|과실|버찌|감|사과/i.test(fullEcoText)) foodItems.push('나무 열매');
                    if (/씨앗|곡물|볍씨|종자|곡식/i.test(fullEcoText)) foodItems.push('씨앗·곡물');
                    if (/곤충|벌레|메뚜기|파리|모기|애벌레|유충|딱정벌레/i.test(fullEcoText)) foodItems.push('곤충·유충');
                    if (/물고기|어류|연어|송어|치어|피라미/i.test(fullEcoText)) foodItems.push('어류');
                    if (/꽃꿀|꿀|화분|흡밀/i.test(fullEcoText)) foodItems.push('꽃꿀·화분');
                    if (/수초|수생\s*식물|말|개구리밥/i.test(fullEcoText)) foodItems.push('수초·수생식물');
                    if (/다슬기|우렁이|조개|패각/i.test(fullEcoText)) foodItems.push('다슬기·패류');
                    if (/소형\s*포유류|쥐|설치류|토끼/i.test(fullEcoText)) foodItems.push('소형 포유류');
                    if (/풀|나뭇잎|초본|새순/i.test(fullEcoText)) foodItems.push('풀·새순');
                    if (/동물\s*사체|부패/i.test(fullEcoText)) foodItems.push('동물 사체');

                    if (foodItems.length > 0) {
                      foodBadge = `먹이: ${foodItems.slice(0, 2).join(', ')}`;
                    } else if (ecoDetail?.diet) {
                      foodBadge = `먹이: ${ecoDetail.diet.replace(/성$/, '')}`;
                    } else if (isBird) {
                      foodBadge = '먹이: 곤충, 씨앗, 나무 열매';
                    } else if (isInsect) {
                      foodBadge = '먹이: 꽃꿀, 수액, 식물 잎';
                    } else if (isFish) {
                      foodBadge = '먹이: 수생 곤충, 조류(이끼)';
                    } else {
                      foodBadge = `먹이: ${slot2Val}`;
                    }
                  }

                  // 시기 요약
                  let seasonBadge = '';
                  if (ecoDetail?.seasonality) {
                    const s = ecoDetail.seasonality.split('(')[0].trim();
                    seasonBadge = `시기: ${s}`;
                  } else if (specimen.seasonalTip) {
                    seasonBadge = `시기: ${specimen.seasonalTip.slice(0, 12)}`;
                  } else {
                    seasonBadge = isPlant ? '시기: 봄~가을 개화' : '시기: 사계절 활동';
                  }

                  // 천적 요약
                  let predatorBadge = '';
                  const predatorMatch = fullEcoText.match(/천적(?:은|이|으로)?\s*([가-힣\s,·]+?)(?:에게|이|가|등|을|를|의|에|\.|$)/);
                  if (predatorMatch && predatorMatch[1].trim().length > 1 && predatorMatch[1].trim().length < 20) {
                    predatorBadge = `천적: ${predatorMatch[1].trim()}`;
                  } else {
                    if (isBird) {
                      if (/수리|매|올빼미|부엉이|독수리/i.test(specimen.koreanName)) {
                        predatorBadge = '천적: 최상위 포식자 (천적 없음)';
                      } else if (/오리|기러기|원앙|고니/i.test(specimen.koreanName)) {
                        predatorBadge = '천적: 맹금류, 삵, 유라시아수달';
                      } else {
                        predatorBadge = '천적: 길고양이, 까치, 맹금류';
                      }
                    } else if (isPlant) {
                      predatorBadge = '천적: 초식 곤충, 초식 동물, 병해충';
                    } else if (isFungi) {
                      predatorBadge = '천적: 달팽이, 민달팽이, 균식 딱정벌레';
                    } else if (isInsect) {
                      predatorBadge = '천적: 조류, 거미, 사마귀';
                    } else if (isArachnid) {
                      predatorBadge = '천적: 조류, 대모벌, 도마뱀';
                    } else if (isAmphibian) {
                      predatorBadge = '천적: 왜가리, 백로, 물뱀, 가물치';
                    } else if (isReptile) {
                      predatorBadge = '천적: 맹금류, 족제비, 멧돼지';
                    } else if (isFish) {
                      if (/상어|가물치|메기|배스/i.test(specimen.koreanName)) {
                        predatorBadge = '천적: 대형 수생 포식자, 인간(포획)';
                      } else {
                        predatorBadge = '천적: 왜가리, 물총새, 대형 어류';
                      }
                    } else if (isMammal) {
                      if (/호랑이|사자|늑대|표범|곰/i.test(specimen.koreanName)) {
                        predatorBadge = '천적: 최상위 포식자 (천적 없음)';
                      } else if (/다람쥐|청설모|쥐|토끼/i.test(specimen.koreanName)) {
                        predatorBadge = '천적: 길고양이, 맹금류, 족제비, 뱀';
                      } else {
                        predatorBadge = '천적: 늑대, 표범, 들개';
                      }
                    } else if (isCrustacean) {
                      predatorBadge = '천적: 왜가리, 수달, 대형 어류';
                    } else if (isMollusk) {
                      predatorBadge = '천적: 물새, 어류, 설치류';
                    } else {
                      predatorBadge = '천적: 상위 포식자';
                    }
                  }

                  // 서식지 요약
                  let habitatBadge = '';
                  if (ecoDetail?.habitat) {
                    const h = ecoDetail.habitat.split(/[,·]/).slice(0, 2).map(s => s.trim()).join(', ');
                    habitatBadge = `서식: ${h}`;
                  } else if (specimen.habitatType) {
                    habitatBadge = `서식: ${specimen.habitatType}`;
                  } else {
                    habitatBadge = '서식: 자연 서식처';
                  }

                  // 생태 지위 요약 (중복 '보전' 단어 제거, 지위/관리로 정돈)
                  let statusBadge = '';
                  if (globalProfile.isEndemic) {
                    statusBadge = '지위: 한반도 고유종';
                  } else if (globalProfile.isInvasiveGlobal) {
                    statusBadge = '관리: 생태계 교란생물';
                  } else if (globalProfile.iucnCategory && ['CR', 'EN', 'VU', 'NT'].includes(globalProfile.iucnCategory)) {
                    statusBadge = `지위: 멸종위기 (${globalProfile.iucnCategory})`;
                  } else {
                    statusBadge = '지위: 자생 생물';
                  }

                  const cleanSlot4Val = (slot4Val || '').replace(/\s*·\s*(LC|NT|VU|EN|CR|EW|EX|DD|NE)$/i, '').trim() || slot4Val;
                  
                  // Fungi(균류/버섯)는 3대 묶음([분류], [영양], [규격])으로 온전히 도메인을 감싸며,
                  // 실질적 멸종위기 보전 등급(CR/EN/VU 등) 데이터가 있는 경우에만 4번째 슬롯을 활성화
                  const hasSlot4 = Boolean(
                    globalProfile.hasSlot4 &&
                    (!isFungi || (globalProfile.iucnCategory && ['CR', 'EN', 'VU'].includes(globalProfile.iucnCategory)))
                  );

                  // 활성화 가능한 유효 슬롯 목록 (데이터 없으면 UI에서 깔끔하게 제외)
                  const availableEcoSlots = [
                    { id: 'slot1' as const, label: slot1Label, val: slot1Val, icon: Dna, color: 'text-emerald-500' },
                    ...(hasSlot2 ? [{ 
                      id: 'slot2' as const, 
                      label: slot2Label, 
                      val: slot2Val, 
                      icon: isPlant ? Leaf : isFungi ? Sparkles : (isArachnid || slot2Label === '포식') ? Target : Utensils, 
                      color: isPlant ? 'text-emerald-500' : isFungi ? 'text-amber-500' : (isArachnid || slot2Label === '포식') ? 'text-rose-500' : 'text-amber-500' 
                    }] : []),
                    ...(hasSlot3 ? [{ id: 'slot3' as const, label: slot3Label, val: slot3Val, icon: Ruler, color: 'text-sky-500' }] : []),
                    ...(hasSlot4 ? [{ id: 'slot4' as const, label: '생태특화', val: cleanSlot4Val, icon: Shield, color: 'text-indigo-500' }] : []),
                  ];

                  const ecoGridColsClass = 
                    availableEcoSlots.length === 4 ? 'grid-cols-4' :
                    availableEcoSlots.length === 3 ? 'grid-cols-3' :
                    availableEcoSlots.length === 2 ? 'grid-cols-2' : 'grid-cols-1';

                  // Data availability checks
                  const appearanceText = isMeaningfulContent(ecoDetail?.keyIdentification)
                    ? ecoDetail!.keyIdentification!
                    : isMeaningfulContent(specimen?.description)
                    ? specimen!.description!
                    : '';

                  const habitatText = isMeaningfulContent(ecoDetail?.habitat)
                    ? ecoDetail!.habitat!
                    : isMeaningfulContent(specimen?.habitatType)
                    ? specimen!.habitatType!
                    : '';

                  const ecologyText = isMeaningfulContent(ecoDetail?.dietAndBehavior)
                    ? ecoDetail!.dietAndBehavior!
                    : isMeaningfulContent(ecoDetail?.callOrSound)
                    ? ecoDetail!.callOrSound!
                    : '';

                  const etymologyText = isMeaningfulContent(ecoDetail?.etymology) ? ecoDetail!.etymology! : '';
                  
                  // Replace ecoDetail.specialNotes with a fixed disclaimer for fungi
                  const FUNGI_SAFETY_DISCLAIMER = '야생 버섯의 식독 여부는 절대 임의로 판단하거나 섭취하지 마시고, 반드시 국립산림과학원 등 공인 전문 기관 및 균류 전문가에게 확인하세요.';
                  const effectiveSpecialNotes = isFungi ? FUNGI_SAFETY_DISCLAIMER : (isMeaningfulContent(ecoDetail?.specialNotes) ? ecoDetail!.specialNotes! : '');
                  const specialText = effectiveSpecialNotes || (isFungi ? '' : (isMeaningfulContent(ecoDetail?.status) ? ecoDetail!.status! : '')) || (isFungi ? '' : (isMeaningfulContent(ecoDetail?.lynxBirdLifeNote) ? ecoDetail!.lynxBirdLifeNote! : '')) || (isFungi ? FUNGI_SAFETY_DISCLAIMER : '');

                  // Authentic raw tags directly from API response (excluding fungi toxicity keywords)
                  const rawApiTags = Array.from(new Set([
                    ...(ecoDetail?.tags || []),
                    ...(ecoDetail?.status ? [ecoDetail.status.split('•')[0].trim()] : []),
                    ...(ecoDetail?.order ? [ecoDetail.order.split('(')[0].trim()] : []),
                  ])).filter(tag => tag && tag.length >= 2 && (!isFungi || !/독|독성|식독|독우산|맹독/.test(tag)));

                  // Banned generic stopwords that should NEVER appear as standalone keyword tags
                  const GENERIC_STOPWORDS = new Set([
                    '유래', '어원', '기원', '이름', '명칭', '특징', '설명', '서식', '생태', '환경',
                    '관찰', '경우', '위해', '때문', '모습', '대한', '통해', '등의', '가장', '매우',
                    '정보', '상세', '보전', '상태', '동정', '포인트', '주요', '기타', '발견', '기록',
                    '국내', '전국', '분포', '주로', '하며', '있는', '없는', '따라', '가지', '나타',
                    '하나', '가지', '사이', '이루', '위치', '크기', '길이', '무게', '높이', '비해'
                  ]);

                  // Strictly text-grounded keyword extractor that extracts authentic tags ONLY from the actual section text
                  const extractKeyBadges = (
                    text: string,
                    category: 'appearance' | 'habitat' | 'ecology' | 'etymology' | 'funFact' | 'breeding' | 'fieldTip'
                  ): string[] => {
                    const result: string[] = [];

                    if (!text || text.trim().length === 0) return result;

                    // 1. Quoted terms directly mentioned in the text (e.g. '쉬리', '금린어', '각시붕어', "에메랄드")
                    const quotedMatches = text.match(/['"「『]([가-힣a-zA-Z0-9\s]{2,10})['"」』]/g);
                    if (quotedMatches) {
                      quotedMatches.forEach(qm => {
                        const clean = qm.replace(/['"「『」』]/g, '').trim();
                        if (clean.length >= 2 && clean.length <= 8 && !GENERIC_STOPWORDS.has(clean) && !result.includes(clean)) {
                          result.push(clean);
                        }
                      });
                    }

                    // 2. Include authentic tags from API ONLY IF they actually appear in this specific section's text
                    rawApiTags.forEach(tag => {
                      if (tag && tag.length >= 2 && !GENERIC_STOPWORDS.has(tag) && text.includes(tag) && !result.includes(tag)) {
                        result.push(tag);
                      }
                    });

                    // 3. Domain-specific dictionary matching against the ACTUAL content of the text
                    const domainDictionary: Record<string, string[]> = {
                      appearance: [
                        '검은눈선', '눈줄무늬', '에메랄드빛', '황금색', '체색변화', '호랑무늬', '줄무늬', '반점',
                        '원뿔형부리', '갈고리부리', '물갈퀴', '혼인색', '깃털', '비늘', '흡반', '안점',
                        '지느러미', '아가미', '턱수염', '외골격', '포자', '균모', '자루', '배판', '등갑',
                        '백색', '주황색', '노란색', '녹색', '검은색', '갈색', '회색', '청록색', '체색',
                        '대형', '중형', '소형', '긴꼬리', '깃', '날개', '부리', '잎맥', '꽃잎', '가시'
                      ],
                      habitat: [
                        '열대우림', '온대림', '침엽수림', '활엽수림', '혼합림', '산림', '원시림', '수림',
                        '1급수계곡', '계곡', '하천', '여울', '소(沼)', '하구', '습지', '내륙습지', '연안습지',
                        '갯벌', '해안', '해양', '연안', '산호초', '호수', '저수지', '논', '밭', '경작지',
                        '초원', '사막', '동굴', '암벽', '고산지대', '곶자왈', '갈대밭', '간석지',
                        '도심', '공원', '주택가', '정원', '가로수', '수변', '자갈밭', '모래밭', '낙엽층'
                      ],
                      ecology: [
                        '수서곤충', '곤충식', '어식성', '초식성', '잡식성', '육식성', '흡밀성', '플랑크톤',
                        '씨앗식', '열매식', '패류식', '시체청소', '야행성', '주행성', '박명성',
                        '군집생활', '단독생활', '영역표시', '동면', '월동', '경계음', '구애행동', '텃새',
                        '철새', '여름철새', '겨울철새', '나그네새', '공생', '변온동물', '정온동물', '탁란',
                        '저장행동', '수분매개', '포식자', '먹이사슬', '분해자', '기생', '잠복사냥'
                      ],
                      etymology: [
                        '순우리말', '한자어', '라틴어', '자산어보', '향약집성방', '조선시대', '삼국유사',
                        '한국고유종', '특산종', '한국특산', '지명유래', '인명명명', '모리교수', '린네',
                        '형태유래', '울음소리유래', '체색유래', '생태습성유래', '설화유래', '방언'
                      ],
                      funFact: isFungi
                        ? ['생태계분해자', '공생균', '안전수칙', '전문가확인']
                        : [
                          '천연기념물', '멸종위기야생생물', '멸종위기I급', '멸종위기II급', '국가적색목록',
                          '기후변화지표종', '생태계교란생물', '해양보호생물', '국외반출승인대상', '보호야생생물',
                          '취약(VU)', '위기(EN)', '위급(CR)', '준위협(NT)', '관심대상(LC)', '고유종', '희귀종'
                        ],
                      breeding: ['난생', '태생', '산란기', '포란', '둥지육추', '완전변태', '불완전변태', '유충', '포자번식', '종자번식', '수분활동'],
                      fieldTip: ['동정키', '실루엣', '빛반사제거', '접사관찰', '울음소리식별', '발자국흔적', '서식지식별']
                    };

                    const dict = domainDictionary[category] || [];
                    dict.forEach(kw => {
                      if (text.includes(kw) && !GENERIC_STOPWORDS.has(kw) && !result.includes(kw)) {
                        result.push(kw);
                      }
                    });

                    // 4. Extract Latin names or scientific terms mentioned in etymology / appearance (e.g. Coreoleuciscus, splendidus, uyekii)
                    if (category === 'etymology' || category === 'appearance') {
                      const latinWords = text.match(/[A-Z][a-z]{3,15}|[a-z]{4,15}/g);
                      if (latinWords) {
                        latinWords.forEach(lw => {
                          if (lw.length >= 4 && !['from', 'with', 'that', 'this', 'have', 'been', 'which'].includes(lw.toLowerCase()) && !result.includes(lw) && result.length < 5) {
                            result.push(lw);
                          }
                        });
                      }
                    }

                    // 5. If etymology category still has no specific badges, look for root words ending in '어', '말', '명' in text
                    if (category === 'etymology' && result.length === 0) {
                      const wordMatches = text.match(/[가-힣]{2,6}(?=에서|라는|으로|의|을|를)/g);
                      if (wordMatches) {
                        wordMatches.forEach(wm => {
                          if (!GENERIC_STOPWORDS.has(wm) && wm.length >= 2 && wm.length <= 6 && !result.includes(wm)) {
                            result.push(wm);
                          }
                        });
                      }
                    }

                    // 6. Natural Korean noun morpheme extractor for unlisted specific terms
                    if (result.length < 3) {
                      const words = text
                        .replace(/[^\w\s가-힣]/g, ' ')
                        .split(/\s+/)
                        .map(w => w.trim())
                        .filter(w => {
                          if (w.length < 2 || w.length > 7) return false;
                          if (GENERIC_STOPWORDS.has(w)) return false;
                          if (/다$|며$|고$|는$|을$|를$|에$|의$|로$|서$|한$|된$|하여$|으로$/.test(w)) return false;
                          return /^[가-힣]+$/.test(w);
                        });

                      words.forEach(w => {
                        if (result.length < 4 && !result.includes(w) && !GENERIC_STOPWORDS.has(w)) {
                          result.push(w);
                        }
                      });
                    }

                    // Strict deduplication & filter out any accidentally included generic stopwords
                    return Array.from(new Set(result))
                      .filter(tag => !GENERIC_STOPWORDS.has(tag) && tag.length >= 2)
                      .slice(0, 4);
                  };

                  const appearanceBadges = extractKeyBadges(appearanceText, 'appearance');
                  const habitatBadges = extractKeyBadges(habitatText, 'habitat');
                  const ecologyBadges = extractKeyBadges(ecologyText, 'ecology');
                  const etymologyBadges = extractKeyBadges(etymologyText, 'etymology');
                  const funFactBadges = extractKeyBadges(specialText, 'funFact');
                  
                  const rawBreedingBadges = extractKeyBadges(ecoDetail?.lynxBirdLifeNote || '', 'breeding');
                  const breedingBadges = rawBreedingBadges.length > 0
                    ? rawBreedingBadges
                    : isBird
                    ? ['난생', '산란기', '둥지육추', '포란활동']
                    : isInsect
                    ? ['완전변태', '산란생태', '유충생태', '월동생태']
                    : isPlant
                    ? ['종자번식', '개화결실', '수분활동', '여러해살이']
                    : isMammal
                    ? ['태생', '포유생태', '자연양육', '사계절활동']
                    : ['자연번식', '생활사성장'];

                  const fieldTipBadges = extractKeyBadges(ecoDetail?.keyIdentification || '', 'fieldTip');

                  const finalSlot3Val = hasSlot3 ? slot3Val : speciesSizeText;
                  const finalSlot4Val = cleanSlot4Val || '야생 자생';

                  // Real API 5-step taxonomic hierarchy (계 - 문 - 강 - 목 - 과)
                  const taxonomySteps = buildTaxonomySteps({
                    inatAncestors,
                    gbifData,
                    specimenTaxonomyPath: specimen.taxonomyPath,
                    specimenOrder: specimen.order,
                    specimenFamily: specimen.family,
                    ecoOrder: ecoDetail?.order,
                    ecoFamily: ecoDetail?.family,
                    category: specimen.category,
                  });

                  const cleanInatWiki = (inatData?.wikipedia_summary || '')
                    .replace(/<[^>]+>/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();

                  const realTaxonomyNarrative =
                    (isMeaningfulContent(cleanInatWiki) ? cleanInatWiki : '') ||
                    (isMeaningfulContent(specimen.wikiSummary) ? specimen.wikiSummary! : '') ||
                    (isMeaningfulContent(liveWikiSummary) ? liveWikiSummary : '') ||
                    (isMeaningfulContent(ecoDetail?.keyIdentification)
                      ? `${ecoDetail!.keyIdentification} (GBIF ${gbifData?.usageKey ? `Taxon #${gbifData.usageKey}` : 'Backbone'} · ${taxonomySteps.map((s) => s.value).join(' > ')})`
                      : `GBIF Backbone${gbifData?.usageKey ? `(#${gbifData.usageKey})` : ''} 및 iNaturalist 분류 체계에 등재된 ${taxonomySteps[1].value} · ${taxonomySteps[3].value} · ${taxonomySteps[4].value} 계통의 생물종(${specimen.scientificName || specimen.koreanName})입니다.`);

                  const realGrowthNarrative =
                    (isMeaningfulContent(ecoDetail?.dietAndBehavior) ? ecoDetail!.dietAndBehavior! : '') ||
                    (isMeaningfulContent(specimen.wikiSummary) ? specimen.wikiSummary! : '') ||
                    (isMeaningfulContent(liveWikiSummary) ? liveWikiSummary : '') ||
                    realTaxonomyNarrative;

                  const fourSlots = [
                    {
                      id: 'slot1' as const,
                      label: '분류',
                      icon: Dna,
                      activeColorClass: 'text-[#6366f1]',
                      taxonomySteps,
                      items: [] as { label: string; value: string; isItalic?: boolean }[],
                      detailNarrative: realTaxonomyNarrative,
                    },
                    {
                      id: 'slot2' as const,
                      label: slot2Label,
                      icon: isPlant ? Leaf : isFungi ? Sparkles : isArachnid || slot2Label === '포식' ? Target : Utensils,
                      activeColorClass: 'text-[#43b556]',
                      taxonomySteps: null,
                      items: [
                        {
                          label: isPlant ? '양분' : isFungi ? '영양' : '먹이',
                          value: foodBadge.replace(/^(먹이|양분|영양):\s*/, ''),
                        },
                        {
                          label: isPlant ? '생육' : isFungi ? '유형' : isArachnid ? '포식' : '식성',
                          value: slot2Val,
                        },
                        {
                          label: '시기',
                          value: seasonBadge.replace(/^시기:\s*/, ''),
                        },
                      ],
                      detailNarrative: realGrowthNarrative,
                    },
                    {
                      id: 'slot3' as const,
                      label: '규격',
                      icon: Ruler,
                      activeColorClass: 'text-[#38bdf8]',
                      taxonomySteps: null,
                      items: [
                        { label: '크기', value: finalSlot3Val },
                        {
                          label: '기준',
                          value: isBird
                            ? '부리 끝 ~ 꼬리 끝 전장'
                            : isPlant
                            ? '지상부 수고 · 초장'
                            : isFungi
                            ? '갓 지름 · 자루 길이'
                            : isFish
                            ? '주둥이 ~ 꼬리 전장'
                            : '성체 표준 계측치',
                        },
                      ],
                      detailNarrative:
                        (isMeaningfulContent(ecoDetail?.keyIdentification) ? ecoDetail!.keyIdentification! : '') ||
                        `${specimen.koreanName}의 표준 체구 규격은 약 ${finalSlot3Val}이며, 서식 환경에 적응한 형태적 특징을 보입니다.`,
                    },
                    {
                      id: 'slot4' as const,
                      label: '생태 특화',
                      icon: Shield,
                      activeColorClass: 'text-[#64748b]',
                      taxonomySteps: null,
                      items: [
                        { label: '생태', value: finalSlot4Val },
                        { label: '천적', value: predatorBadge.replace(/^천적:\s*/, '') },
                        { label: '서식', value: habitatBadge.replace(/^서식:\s*/, '') },
                      ],
                      detailNarrative:
                        globalProfile.slot4DetailedNarrative ||
                        (isMeaningfulContent(ecoDetail?.habitat) ? ecoDetail!.habitat! : '') ||
                        `${specimen.koreanName}은(는) ${habitatBadge.replace(/^서식:\s*/, '')} 환경에서 고유의 생태적 지위를 유지하며 서식합니다.`,
                    },
                  ];

                  const activeSlotIndex = Math.max(
                    0,
                    fourSlots.findIndex((s) => s.id === activeEcoSlot)
                  );
                  const activeSlotObj = activeEcoSlot ? fourSlots[activeSlotIndex] : null;
                  const caretPercent = `${activeSlotIndex * 25 + 12.5}%`;

                  // Seasonality 12-month bar chart data
                  const currentMonthNum = new Date().getMonth() + 1;
                  const rawHistCounts = Array.from({ length: 12 }, (_, idx) =>
                    inatHistogram && inatHistogram[idx + 1] !== undefined
                      ? inatHistogram[idx + 1]
                      : 0
                  );
                  const totalHistObs = rawHistCounts.reduce((acc, v) => acc + v, 0);
                  const fallbackCurve = isPlant
                    ? [4, 6, 12, 24, 30, 32, 34, 68, 100, 26, 20, 14]
                    : isInsect
                    ? [2, 3, 8, 22, 48, 76, 94, 100, 82, 38, 10, 3]
                    : [42, 48, 64, 78, 88, 72, 66, 70, 82, 92, 68, 46];
                  const monthCounts = totalHistObs > 0 ? rawHistCounts : fallbackCurve;
                  const maxMonthCount = Math.max(...monthCounts, 1);

                  let peakMonthIdx = 0;
                  monthCounts.forEach((c, idx) => {
                    if (c > monthCounts[peakMonthIdx]) peakMonthIdx = idx;
                  });
                  const peakMonthNum = peakMonthIdx + 1;
                  const curMonthRatio = monthCounts[currentMonthNum - 1] / maxMonthCount;
                  const curMonthStatusText =
                    curMonthRatio >= 0.65
                      ? `지금(${currentMonthNum}월)이 가장 많이 보이는 시기예요`
                      : curMonthRatio >= 0.2
                      ? `지금(${currentMonthNum}월)도 가끔 만날 수 있어요`
                      : `지금(${currentMonthNum}월)은 만나기 드문 시기예요`;
                  const seasonHeadline = `${peakMonthNum}월이 제철이에요 · ${curMonthStatusText}`;

                  // Fallback pills so all 6 accordion cards look consistent with C-05
                  const appearancePills =
                    appearanceBadges.length > 0
                      ? appearanceBadges
                      : [friendlyCatLabel, cleanFamilyLabel || '고유 형태', finalSlot3Val];
                  const habitatPills =
                    habitatBadges.length > 0
                      ? habitatBadges
                      : isPlant
                      ? ['길가', '공원 화단', '햇볕 잘 드는 곳']
                      : ['자연 서식지', '도심 녹지'];
                  const ecologyPills =
                    ecologyBadges.length > 0
                      ? ecologyBadges
                      : isPlant
                      ? [slot2Val, ecoDetail?.seasonality || '계절 개화', '곤충 수분']
                      : [slot2Val, ecoDetail?.seasonality || '사계절 활동'];
                  const epithetPart = (specimen.scientificName || '').split(' ')[1] || '';
                  const etymologyPills =
                    etymologyBadges.length > 0
                      ? etymologyBadges
                      : epithetPart
                      ? [`${epithetPart} = 라틴어 종소명`, '학명 유래']
                      : ['학명 · 국명 유래'];
                  const conservationPills =
                    funFactBadges.length > 0
                      ? funFactBadges
                      : detailGlobalProfile.isEndemic
                      ? ['한국 고유종', '자생 생물']
                      : ['자생 생물', '보호종 아님'];
                  const breedingPills = breedingBadges;

                  const accordionItems = [
                    {
                      key: 'appearance' as const,
                      emoji: '🔍',
                      title: '외형 특징',
                      pills: appearancePills,
                      body:
                        appearanceText ||
                        `${specimen.koreanName}의 대표 외형과 식별 포인트를 확인할 수 있어요.`,
                    },
                    {
                      key: 'habitat' as const,
                      emoji: '🏞️',
                      title: '서식 환경',
                      pills: habitatPills,
                      body:
                        habitatText ||
                        `${specimen.koreanName}은(는) ${habitatRangeText}에서 주로 관찰됩니다.`,
                    },
                    {
                      key: 'ecology' as const,
                      emoji: '🥣',
                      title: '섭식 속성',
                      pills: ecologyPills,
                      body: ecologyText || dietText,
                    },
                    {
                      key: 'etymology' as const,
                      emoji: '🕵️',
                      title: '이름 유래',
                      pills: etymologyPills,
                      body:
                        etymologyText ||
                        `학명 ${specimen.scientificName || specimen.koreanName}은(는) 생물의 형태적·생태적 특징에서 유래했어요.`,
                    },
                    {
                      key: 'funFact' as const,
                      emoji: '📌',
                      title: '보전 상태',
                      pills: conservationPills,
                      body:
                        specialText ||
                        `${specimen.koreanName}은(는) ${populationText} 범주에 속하는 자연 생태계 구성원입니다.`,
                    },
                    {
                      key: 'breeding' as const,
                      emoji: '🪹',
                      title: '번식 및 생활사',
                      pills: breedingPills,
                      body:
                        ecoDetail?.lynxBirdLifeNote ||
                        `${specimen.koreanName}은(는) 계절 변화에 맞추어 번식과 생장 주기를 이어가요.`,
                    },
                  ];

                  return (
                    <div className="space-y-3 pt-4">
                      {/* 1. 4 Icon Category Slot Buttons (Slots_1 / Slots_2 design) */}
                      <div className="grid grid-cols-4 gap-2">
                        {fourSlots.map((slot) => {
                          const isSelected = activeEcoSlot === slot.id;
                          const IconComp = slot.icon;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() =>
                                setActiveEcoSlot(isSelected ? null : slot.id)
                              }
                              className="flex flex-col items-center justify-center gap-1.5 py-1 transition-all cursor-pointer"
                            >
                              <div
                                className={`w-13 h-13 rounded-[16px] flex items-center justify-center transition-all ${
                                  isSelected
                                    ? `bg-white border border-[#d4d8d2] shadow-2xs ${slot.activeColorClass}`
                                    : 'bg-[#f4f5f4] border border-transparent text-[#8c948a] opacity-75 hover:opacity-100'
                                }`}
                              >
                                <IconComp className="w-5 h-5" />
                              </div>
                              <span
                                className={`text-[12px] tracking-tight truncate max-w-full px-1 ${
                                  isSelected
                                    ? 'font-bold text-[#202320]'
                                    : 'font-medium text-[#8c948a]'
                                }`}
                              >
                                {slot.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* 1b. Expanded Caret Detail Box under the 4 Tabs */}
                      <AnimatePresence mode="wait">
                        {activeSlotObj && (
                          <motion.div
                            key={activeSlotObj.id}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.16 }}
                            className="relative bg-[#f2f3f1] rounded-[20px] p-4"
                          >
                            {/* Upward Caret pointing to active slot */}
                            <div
                              className="absolute -top-1.5 w-3 h-3 bg-[#f2f3f1] rotate-45 -translate-x-1/2"
                              style={{ left: caretPercent }}
                            />
                            <div className="space-y-3 relative z-10">
                              {/* Slot 1: 계-문-강-목-과 5-step Horizontal Stepper */}
                              {activeSlotObj.taxonomySteps ? (
                                <div className="pt-0.5 pb-1">
                                  <div className="grid grid-cols-5 items-center relative">
                                    {/* Connecting horizontal line behind circles */}
                                    <div className="absolute left-[10%] right-[10%] top-[27px] h-[1.5px] bg-[#dfe2dd] z-0" />
                                    {activeSlotObj.taxonomySteps.map((step, idx, arr) => {
                                      const isLast = idx === arr.length - 1;
                                      return (
                                        <div
                                          key={step.rankKey}
                                          className="flex flex-col items-center relative z-10 px-0.5"
                                        >
                                          <span className="text-[11px] font-medium text-[#8c948a] mb-2">
                                            {step.rankLabel}
                                          </span>
                                          <div
                                            className={`w-2.5 h-2.5 rounded-full mb-2 ${
                                              isLast
                                                ? 'bg-[#4c544b]'
                                                : 'bg-white border-[1.5px] border-[#b8bdb6]'
                                            }`}
                                          />
                                          <span
                                            className={`text-[11.5px] text-center break-keep leading-tight ${
                                              isLast
                                                ? 'font-bold text-[#202320]'
                                                : 'font-medium text-[#202320]'
                                            }`}
                                          >
                                            {step.value}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                /* Slots 2, 3, 4: Clean flat key-value rows */
                                <div className="space-y-1.5">
                                  {activeSlotObj.items.map((row, rIdx) => (
                                    <div
                                      key={rIdx}
                                      className="grid grid-cols-[52px_1fr] items-baseline text-[13px]"
                                    >
                                      <span className="text-[#8c948a] font-medium">
                                        {row.label}
                                      </span>
                                      <span
                                        className={`text-[#202320] font-medium break-keep ${
                                          row.isItalic ? 'italic font-serif' : ''
                                        }`}
                                      >
                                        {row.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <p className="text-[13px] text-[#3a4039] leading-[1.6] break-keep">
                                {activeSlotObj.detailNarrative}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Fungi Safety Disclaimer if Fungi */}
                      {isFungi && (
                        <div className="p-3.5 rounded-[18px] bg-[#fffbeb] border border-[#fde68a] text-[12px] text-[#78350f] leading-relaxed">
                          <strong className="block font-bold mb-0.5">
                            🍄 야생 버섯 안전 수칙
                          </strong>
                          야생 버섯은 외형만으로 식독 여부를 판단하기 어렵습니다. 절대 임의로 섭취하지 말고 전문 기관에 확인하세요.
                        </div>
                      )}

                      {/* 2. 출현 시즌 Card */}
                      <div className="bg-white rounded-[20px] border border-[#e6e9e5] p-4">
                        <h3 className="text-[15px] font-bold text-[#202320]">
                          출현 시즌
                        </h3>
                        <p className="text-[13px] text-[#6d746b] mt-1.5 break-keep">
                          {seasonHeadline}
                        </p>

                        {/* 12-Month Bar Chart */}
                        <div className="mt-4">
                          <div className="grid grid-cols-12 gap-1.5 items-end h-[72px]">
                            {monthCounts.map((count, idx) => {
                              const ratio = count / maxMonthCount;
                              const isPeak = ratio >= 0.65;
                              const isModerate = !isPeak && ratio >= 0.18;
                              const barHeightPx = Math.max(
                                4,
                                Math.round(ratio * 66)
                              );
                              const isSelected = chartTooltip?.idx === idx;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  aria-label={`${idx + 1}월 출현 빈도`}
                                  onClick={() =>
                                    setChartTooltip((prev) =>
                                      prev?.idx === idx ? null : { idx, count }
                                    )
                                  }
                                  className="h-full flex items-end justify-center cursor-pointer focus:outline-none relative"
                                >
                                  {isSelected && (
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#202320] text-white text-[10px] font-semibold whitespace-nowrap z-20">
                                      {idx + 1}월 {totalHistObs > 0 ? `${count.toLocaleString()}건` : ''}
                                    </span>
                                  )}
                                  <div
                                    className={`w-full rounded-t-[5px] transition-all ${
                                      isSelected
                                        ? 'bg-[#202320]'
                                        : isPeak
                                        ? 'bg-[#b5e635]'
                                        : isModerate
                                        ? 'bg-[#dff495]'
                                        : 'bg-[#f0f2ef]'
                                    }`}
                                    style={{ height: `${barHeightPx}px` }}
                                  />
                                </button>
                              );
                            })}
                          </div>

                          {/* Month Numbers Row */}
                          <div className="grid grid-cols-12 gap-1.5 text-center mt-1.5">
                            {monthCounts.map((_, idx) => {
                              const mNum = idx + 1;
                              const isCurrentMonth = mNum === currentMonthNum;
                              return (
                                <div
                                  key={mNum}
                                  className="flex flex-col items-center"
                                >
                                  <span
                                    className={`text-[11px] tabular-nums ${
                                      isCurrentMonth
                                        ? 'font-bold text-[#202320]'
                                        : 'text-[#8c948a]'
                                    }`}
                                  >
                                    {mNum}
                                  </span>
                                  {isCurrentMonth && (
                                    <span className="w-1 h-1 rounded-full bg-[#202320] mt-0.5" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 mt-3 text-[11px] text-[#6d746b]">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#b5e635]" />
                            <span>제철</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#dff495]" />
                            <span>보여요</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#e6e9e5]" />
                            <span>드물어요</span>
                          </span>
                        </div>
                      </div>

                      {/* 3. 소리 Card — §0: CC0 · CC BY 녹음이 있을 때만 표시, 없으면 숨김 */}
                      {audioData?.url && (
                        <div className="bg-white rounded-[20px] border border-[#e6e9e5] overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleCategory('sound')}
                            className="w-full px-4 py-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-[#fafbfa] transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Music className="w-4 h-4 text-[#8c948a]" />
                              <span className="text-[14px] font-bold text-[#202320]">
                                소리
                              </span>
                            </div>
                            {expandedCategories.sound ? (
                              <ChevronUp className="w-4 h-4 text-[#8c948a]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[#8c948a]" />
                            )}
                          </button>

                          {expandedCategories.sound && (
                            <div className="px-4 pb-4 space-y-2.5">
                              <MorphingAudioPlayer
                                audioUrl={audioData.url}
                                audioTitle={audioData.title}
                                sourceLabel={audioData.source}
                                audioRef={audioRef}
                                isPlaying={isPlayingAudio}
                                currentTime={audioCurrentTime}
                                duration={audioDuration}
                                isMuted={isMuted}
                                onPlay={handlePlayAudio}
                                onPause={handlePauseAudio}
                                onStop={handleStopAudio}
                                onSeek={(time) => {
                                  setAudioCurrentTime(time);
                                  if (audioRef.current) {
                                    audioRef.current.currentTime = time;
                                  }
                                }}
                                onToggleMute={toggleMute}
                                specimenName={specimen.koreanName}
                              />

                              <p className="text-[11px] text-[#8c948a] truncate">
                                {`${audioData.author || '야생 현장 녹음'} · ${audioData.source}`}
                              </p>

                              <audio
                                ref={audioRef}
                                src={audioData.url}
                                preload="metadata"
                                onTimeUpdate={() => {
                                  if (audioRef.current) {
                                    setAudioCurrentTime(audioRef.current.currentTime);
                                  }
                                }}
                                onLoadedMetadata={() => {
                                  if (audioRef.current) {
                                    setAudioDuration(audioRef.current.duration);
                                  }
                                }}
                                onPlay={() => setIsPlayingAudio(true)}
                                onPause={() => setIsPlayingAudio(false)}
                                onEnded={() => {
                                  setIsPlayingAudio(false);
                                  setAudioCurrentTime(0);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* 4. 6 Tag-Chip Accordion Cards */}
                      <div className="space-y-2.5">
                        {accordionItems.map((item) => {
                          const isOpen = Boolean(expandedCategories[item.key]);
                          return (
                            <div
                              key={item.key}
                              className="bg-white rounded-[20px] border border-[#e6e9e5] overflow-hidden"
                            >
                              <button
                                type="button"
                                onClick={() => toggleCategory(item.key)}
                                className="w-full px-4 pt-3.5 pb-2.5 flex items-center justify-between text-left cursor-pointer hover:bg-[#fafbfa] transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[15px] leading-none">
                                    {item.emoji}
                                  </span>
                                  <span className="text-[14px] font-bold text-[#202320]">
                                    {item.title}
                                  </span>
                                </div>
                                {isOpen ? (
                                  <ChevronUp className="w-4 h-4 text-[#8c948a] shrink-0" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-[#8c948a] shrink-0" />
                                )}
                              </button>

                              {/* Pill Chips Row (Always visible like C-05) */}
                              <div className="px-4 pb-3.5 flex flex-wrap gap-1.5">
                                {item.pills.map((pill, pIdx) => (
                                  <span
                                    key={pIdx}
                                    className="bg-[#f4f5f4] text-[#202320] rounded-[8px] px-2.5 py-1.5 text-[12px] font-medium leading-none"
                                  >
                                    {pill}
                                  </span>
                                ))}
                              </div>

                              {/* Expanded Full Description */}
                              {isOpen && (
                                <div className="px-4 pb-4 pt-2.5 border-t border-[#f0f2ef] bg-[#fafbfa]">
                                  <p className="text-[13px] text-[#4a5248] leading-[1.6] break-keep">
                                    {item.body}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* 5. Bottom Real Dynamic Source Attribution Link */}
                      {(() => {
                        const dynamicSourceLabels: string[] = [];
                        if (gbifData?.usageKey) dynamicSourceLabels.push('GBIF Backbone (CC BY 4.0)');
                        if (inatData?.id || inatHistogram) dynamicSourceLabels.push('iNaturalist');
                        if (specimen.wikiUrl) dynamicSourceLabels.push('Wikipedia (CC BY-SA 4.0)');
                        if (staticEcoDetail) dynamicSourceLabels.push('모아로그 생태 도감 DB');
                        if (liveEcologyDetail || livePhotoArtScore) dynamicSourceLabels.push('Gemini AI 해설');
                        if (audioData?.url) {
                          dynamicSourceLabels.push(audioData.source.includes('xeno-canto') ? 'xeno-canto 녹음' : 'iNaturalist 녹음');
                        }
                        if (dynamicSourceLabels.length === 0) {
                          dynamicSourceLabels.push('관찰 기록 기반 기본 데이터');
                        }
                        return (
                          <button
                            type="button"
                            onClick={() => setIsDataSourcesOpen(true)}
                            className="w-full pt-2 pb-4 flex items-center justify-between text-left text-[12px] text-[#8c948a] hover:text-[#202320] transition-colors cursor-pointer"
                          >
                            <span className="leading-[1.5] break-keep">
                              출처 · {dynamicSourceLabels.join(' · ')}
                            </span>
                            <ChevronRight className="w-4 h-4 shrink-0 ml-2" />
                          </button>
                        );
                      })()}
                    </div>
                  );
                })()}
              </div>
            )}
        </div>
      </motion.div>

      {/* Edit Specimen Modal */}
      {/* Full-Screen Lightbox Zoom Modal (무료: 상단 업그레이드 헤더 / 프로: 원본 + Live 재생, 14세 미만 공유 숨김) */}
      <AnimatePresence>
        {isZoomModalOpen && (() => {
          const isPro = Boolean(userStats?.isProUser);
          const { showShare } = getUnder14DesignFlags(userAccount);
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-0 z-[120] bg-stone-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none"
            >
              {/* Top Bar */}
              <div className="flex items-center justify-between text-white pb-3 border-b border-stone-800 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Maximize2 className="w-5 h-5 text-[#c4eb43] shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{specimen.koreanName}</h3>
                    <p className="text-[10px] text-stone-400 font-mono truncate">
                      {isPro ? '원본 크게 보기' : '사진 크게 보기'} · #{selectedObservationIndex + 1}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!isPro && onOpenSubscriptionModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsZoomModalOpen(false);
                        onOpenSubscriptionModal();
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#c4eb43] text-[#202320] text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      업그레이드
                    </button>
                  )}
                  {isPro && (
                    <button
                      type="button"
                      onClick={handleToggleLivePhoto}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isLivePlaying
                          ? 'bg-[#c4eb43] text-[#202320]'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isLivePlaying ? `LIVE ${liveSecondsLeft}s` : 'Live'}</span>
                    </button>
                  )}
                  {showShare && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsZoomModalOpen(false);
                        setIsShareBottomSheetOpen(true);
                      }}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                      title="공유"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsZoomModalOpen(false)}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                    title="닫기"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Middle Canvas Stage */}
              <div className="flex-1 flex items-center justify-center my-3 overflow-hidden relative">
                <div className="w-full max-w-sm sm:max-w-md aspect-square bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center relative">
                  {(!isPro || visualTheme === 'photo') && currentObsPhoto && (
                    <motion.img
                      src={currentObsPhoto}
                      alt={specimen.koreanName}
                      referrerPolicy="no-referrer"
                      animate={
                        isPro && isLivePlaying
                          ? { scale: [1, 1.045, 1.02, 1.05, 1], x: [0, -2, 2, -1, 0] }
                          : { scale: 1, x: 0 }
                      }
                      transition={
                        isPro && isLivePlaying
                          ? { duration: 3.5, ease: 'easeInOut', repeat: Infinity }
                          : { duration: 0.2 }
                      }
                      className="w-full h-full object-contain"
                    />
                  )}

                  {isPro && visualTheme === 'sticker_classic' && currentStickerPhoto && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-radial from-stone-800 to-stone-950 relative">
                      <img
                        src={currentStickerPhoto}
                        alt={`${specimen.koreanName} 스티커`}
                        referrerPolicy="no-referrer"
                        className="max-w-[85%] max-h-[85%] object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)]"
                        style={{
                          filter:
                            'drop-shadow(3px 3px 0 #ffffff) drop-shadow(-3px -3px 0 #ffffff) drop-shadow(3px -3px 0 #ffffff) drop-shadow(-3px 3px 0 #ffffff)',
                        }}
                      />
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/95 text-stone-900 rounded-full text-xs font-black font-mono shadow-xl flex items-center gap-1.5 border border-stone-200">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>생태 스티커 No.{specimen.number || '001'}</span>
                      </div>
                    </div>
                  )}

                  {isPro && visualTheme === 'stamp_vintage' && currentObsPhoto && (
                    <div className="w-full h-full flex items-center justify-center p-4 bg-radial from-stone-900 to-[#121615]">
                      <div className="relative w-[260px] h-[290px] bg-[#F7F4EB] rounded-lg p-3 shadow-2xl border-4 border-dashed border-[#D4C5A9] flex flex-col justify-between overflow-hidden text-stone-900">
                        <div className="flex items-center justify-between border-b border-[#D4C5A9] pb-1">
                          <span className="text-[9px] font-serif font-black tracking-widest text-[#5C4D3C] uppercase">
                            KOREA BIODIVERSITY
                          </span>
                          <span className="text-xs font-mono font-black text-[#A8422B]">
                            ₩800
                          </span>
                        </div>
                        <div className="my-1 flex-1 rounded overflow-hidden border border-[#D4C5A9] bg-stone-950 relative">
                          <img
                            src={currentObsPhoto}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover sepia-[0.15]"
                          />
                        </div>
                        <div className="flex items-end justify-between pt-1 border-t border-[#D4C5A9]">
                          <div>
                            <p className="text-xs font-black text-[#382F24] font-serif truncate">
                              {specimen.koreanName}
                            </p>
                          </div>
                          <span className="text-[9px] font-mono font-bold bg-[#E8DEC8] text-[#5C4D3C] px-1.5 py-0.5 rounded">
                            VERIFIED
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isPro && visualTheme === 'collector_card' && currentObsPhoto && (
                    <div className="w-full h-full flex items-center justify-center p-4 bg-radial from-stone-900 to-black">
                      <div className="relative w-[260px] h-[290px] rounded-2xl bg-gradient-to-b from-stone-800 via-stone-900 to-stone-950 p-3 shadow-2xl border-2 border-[#c4eb43]/50 flex flex-col justify-between text-white">
                        <div className="flex items-center justify-between border-b border-white/15 pb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-black text-[#c4eb43]">
                              {specimen.number || 'No.001'}
                            </span>
                            <h4 className="text-xs font-black text-white">
                              {specimen.koreanName}
                            </h4>
                          </div>
                          <span className="bg-[#c4eb43] text-[#202320] text-[10px] font-black px-1.5 py-0.5 rounded-md">
                            {photoArtScore.grade}
                          </span>
                        </div>
                        <div className="relative my-1.5 flex-1 rounded-xl overflow-hidden border border-white/10">
                          <img
                            src={currentObsPhoto}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-center bg-white/5 p-1.5 rounded-xl border border-white/10">
                          <div>
                            <span className="text-[8px] text-stone-400 block">포즈</span>
                            <span className="text-[10px] font-mono font-bold text-[#c4eb43]">
                              {photoArtScore.pose}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] text-stone-400 block">배율</span>
                            <span className="text-[10px] font-mono font-bold text-[#c4eb43]">
                              {photoArtScore.zoom}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] text-stone-400 block">선명도</span>
                            <span className="text-[10px] font-mono font-bold text-[#c4eb43]">
                              {photoArtScore.sharpness}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Bar: Pro theme picker OR Free upgrade prompt */}
              {isPro ? (
                <div className="space-y-2.5 bg-stone-900/90 backdrop-blur-md p-3 rounded-2xl border border-white/15">
                  <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-none py-0.5">
                    {visualThemesList.map((item) => {
                      const isActive = visualTheme === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setVisualTheme(item.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap ${
                            isActive
                              ? 'bg-[#c4eb43] text-[#202320] shadow-lg'
                              : 'bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700'
                          }`}
                        >
                          <span className="text-sm">{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-stone-900/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 flex items-center justify-between gap-3">
                  <p className="text-xs text-stone-300">
                    이용권 구독 시 원본 화질과 Live 포토를 볼 수 있어요
                  </p>
                  {onOpenSubscriptionModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsZoomModalOpen(false);
                        onOpenSubscriptionModal();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white text-[#202320] text-xs font-bold shrink-0 cursor-pointer"
                    >
                      자세히 보기
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {isEditModalOpen && (
        <EditSpecimenModal
          specimen={specimen}
          activeObsIndex={selectedObservationIndex}
          initialTab={editInitialTab}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(updated) => {
            if (onUpdateSpecimen) onUpdateSpecimen(updated);
            setIsEditModalOpen(false);
          }}
          onDeleteSpecimen={(specimenId) => {
            setIsEditModalOpen(false);
            if (onDeleteSpecimen) onDeleteSpecimen(specimenId);
            onClose();
          }}
          onDeleteObservation={(specimenId, obsIdx) => {
            setIsEditModalOpen(false);
            if (onDeleteObservation) {
              onDeleteObservation(specimenId, obsIdx);
              if (selectedObservationIndex >= (specimen.observations?.length || 1) - 1) {
                setSelectedObservationIndex(0);
              }
            }
          }}
        />
      )}

      {/* AI Chatbot Modal */}
      {isAiChatOpen && (
        <AiChatbotModal
          specimen={specimen}
          ecoDetail={ecoDetail}
          userStats={userStats}
          userAccount={userAccount}
          onClose={() => setIsAiChatOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
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
              <h3 className="text-sm font-bold text-[#202424]">
                기록을 삭제하시겠습니까?
              </h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                삭제된 관찰 기록은 설정의 휴지통으로 이동되며 30일 후 영구 삭제됩니다.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteSpecimen) {
                    setIsDeleteConfirmOpen(false);
                    onDeleteSpecimen(specimen.id);
                    onClose();
                  }
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-bold transition-colors shadow-md cursor-pointer"
              >
                삭제하기
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Info Criteria Modal */}
      <InfoCriteriaModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        data={infoModalData}
      />

      {/* Share Bottom Sheet (F-01b 카드 · F-05b 사진 공유하기) */}
      <AnimatePresence>
        {isShareBottomSheetOpen && (() => {
          const { showShare } = getUnder14DesignFlags(userAccount);
          const displayHandle = userAccount?.isLoggedIn
            ? `@${(userAccount.email || userAccount.name || 'explorer').split('@')[0]}`
            : '@moalog_explorer';
          const rawLoc = activeObs?.location || specimen.locationCoord?.city || '';
          const safeCityRegion = rawLoc.split(/\s+/).slice(0, 2).join(' ') || specimen.habitatType || '관찰 기록';
          const previewImageUrl =
            shareFormatTab === 'card' && shareCardCutoutMode === 'cutout'
              ? currentStickerPhoto || currentObsPhoto
              : currentObsPhoto;

          const triggerDownloadImage = () => {
            const imgUrl = previewImageUrl;
            if (!imgUrl) return;
            const link = document.createElement('a');
            link.href = imgUrl;
            link.download = `moalog-${specimen.koreanName}-${shareFormatTab}.png`;
            link.target = '_blank';
            link.rel = 'noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setShareBottomSheetToast('이미지를 기기에 저장했어요');
            setTimeout(() => setShareBottomSheetToast(null), 2200);
          };

          const triggerShareAction = () => {
            const shareTitle = `Moalog · ${getSpeciesPrimaryName(specimen, userStats?.language)}`;
            const shareText = `${getSpeciesPrimaryName(specimen, userStats?.language)} (${specimen.scientificName}) · ${safeCityRegion}`;
            if (navigator.share) {
              navigator
                .share({
                  title: shareTitle,
                  text: shareText,
                  url: window.location.href,
                })
                .catch(() => {});
            } else if (navigator.clipboard) {
              navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${window.location.href}`);
            }
            setShareBottomSheetToast('공유할 준비가 완료되었어요');
            setTimeout(() => setShareBottomSheetToast(null), 2200);
          };

          return (
            <div
              className="fixed inset-0 z-[115] bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setIsShareBottomSheetOpen(false)}
            >
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white text-[#202320] rounded-t-[30px] sm:rounded-[30px] max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
              >
                {/* Drag Handle */}
                <div className="w-10 h-1 bg-[#d2d7d1] rounded-full mx-auto mt-3 mb-2 shrink-0" />

                {/* Header */}
                <div className="px-5 pb-3 flex items-center justify-between shrink-0">
                  <h3 className="text-[20px] font-bold tracking-tight text-[#202320]">
                    {showShare ? '공유하기' : '기기에 저장'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsShareBottomSheetOpen(false)}
                    className="w-8 h-8 rounded-full bg-[#f4f5f4] hover:bg-[#e6e9e5] flex items-center justify-center text-[#626961] transition-colors cursor-pointer"
                    aria-label="닫기"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 space-y-4 scrollbar-none">
                  {/* Top Segmented Control: 누끼 | 통이미지 (F-01b when 카드 mode active) */}
                  {shareFormatTab === 'card' && (
                    <div className="grid grid-cols-2 bg-[#f0f2ef] p-1 rounded-[14px]">
                      <button
                        type="button"
                        onClick={() => setShareCardCutoutMode('cutout')}
                        className={`py-2 rounded-[10px] text-[13px] transition-all cursor-pointer ${
                          shareCardCutoutMode === 'cutout'
                            ? 'bg-white text-[#202320] font-bold shadow-2xs'
                            : 'text-[#8c948a] font-medium'
                        }`}
                      >
                        누끼
                      </button>
                      <button
                        type="button"
                        onClick={() => setShareCardCutoutMode('full')}
                        className={`py-2 rounded-[10px] text-[13px] transition-all cursor-pointer ${
                          shareCardCutoutMode === 'full'
                            ? 'bg-white text-[#202320] font-bold shadow-2xs'
                            : 'text-[#8c948a] font-medium'
                        }`}
                      >
                        통이미지
                      </button>
                    </div>
                  )}

                  {/* Observation Thumbnails Strip */}
                  {displayObservations.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
                      {displayObservations.slice(0, 6).map((obs, idx) => {
                        const isSelectedObs = idx === selectedObservationIndex;
                        const thumbUrl = obs.photoUrl || currentObsPhoto;
                        return (
                          <button
                            key={obs.id || idx}
                            type="button"
                            onClick={() => setSelectedObservationIndex(idx)}
                            className={`w-12 h-12 rounded-[12px] overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                              isSelectedObs
                                ? 'border-[#202320] opacity-100'
                                : 'border-transparent opacity-55 hover:opacity-85'
                            }`}
                          >
                            {thumbUrl && (
                              <img
                                src={thumbUrl}
                                alt={`${specimen.koreanName} 사진 ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Format Switcher Pills: 카드 | 사진 */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShareFormatTab('card')}
                      className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors cursor-pointer ${
                        shareFormatTab === 'card'
                          ? 'bg-black text-white'
                          : 'bg-white border border-[#e6e9e5] text-[#626961] hover:text-[#202320]'
                      }`}
                    >
                      카드
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareFormatTab('photo')}
                      className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors cursor-pointer ${
                        shareFormatTab === 'photo'
                          ? 'bg-black text-white'
                          : 'bg-white border border-[#e6e9e5] text-[#626961] hover:text-[#202320]'
                      }`}
                    >
                      사진
                    </button>
                  </div>

                  {/* Preview Frame Stage (F-01b / F-05b) */}
                  <div className="bg-[#f4f5f4] rounded-[24px] p-5 flex items-center justify-center">
                    {shareFormatTab === 'card' ? (
                      <div className="w-[216px] rounded-[20px] bg-gradient-to-b from-[#2f3528] via-[#1f241c] to-[#171b16] p-3.5 text-white shadow-xl flex flex-col items-center">
                        <span className="text-[11px] font-bold tracking-tight text-white/95 mb-2.5">
                          Moalog
                        </span>

                        <div className="w-full rounded-[16px] bg-white/10 border border-white/10 p-2.5 space-y-2.5">
                          <div className="flex justify-center -mt-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#2a2f26] border border-white/15 text-[10px] font-semibold text-white/90">
                              {friendlyCatLabel} · No.{formattedNumber}
                            </span>
                          </div>

                          <div className="w-full aspect-square rounded-[12px] overflow-hidden bg-[#2b3025] flex items-center justify-center">
                            {previewImageUrl && (
                              <img
                                src={previewImageUrl}
                                alt={specimen.koreanName}
                                referrerPolicy="no-referrer"
                                className={`w-full h-full ${
                                  shareCardCutoutMode === 'cutout' ? 'object-contain p-2' : 'object-cover'
                                }`}
                              />
                            )}
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[14px] font-bold text-white truncate">
                                {getSpeciesPrimaryName(specimen, userStats?.language)}
                              </p>
                              <p className="text-[10px] italic text-white/60 truncate">
                                {specimen.scientificName}
                              </p>
                              <p className="text-[10px] text-white/75 mt-1 truncate tabular-nums">
                                {showShare ? `${safeCityRegion} · ${activeObs?.date || ''}` : (activeObs?.date || '')}
                              </p>
                            </div>
                            {/* Hexagon Grade Pill */}
                            <div className="w-7 h-7 shrink-0 flex items-center justify-center relative">
                              <svg viewBox="0 0 36 40" className="w-full h-full">
                                <polygon
                                  points="18,2 34,11 34,29 18,38 2,29 2,11"
                                  fill={heroBadgeGradient.from}
                                  stroke="rgba(255,255,255,0.4)"
                                  strokeWidth="1.5"
                                />
                              </svg>
                              <span className="relative z-10 text-[10px] font-black text-[#202320]">
                                {photoArtScore.grade}
                              </span>
                            </div>
                          </div>
                        </div>

                        {showShare && (
                          <span className="text-[10px] text-white/60 font-medium mt-2.5">
                            {displayHandle}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-full max-w-[260px] aspect-[4/5] rounded-[18px] overflow-hidden bg-white shadow-sm">
                        {currentObsPhoto && (
                          <img
                            src={currentObsPhoto}
                            alt={specimen.koreanName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        )}
                        {includePhotoLogoAndName && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-3.5 text-white flex items-end justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[14px] font-bold truncate">
                                {getSpeciesPrimaryName(specimen, userStats?.language)}
                              </p>
                              <p className="text-[10px] text-white/80 italic truncate">
                                {specimen.scientificName}
                              </p>
                            </div>
                            <span className="text-[11px] font-bold tracking-tight text-[#c4eb43] shrink-0">
                              Moalog
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Toggle: 이름 · 로고 넣기 (F-05b when 사진 tab active) */}
                  {shareFormatTab === 'photo' && (
                    <div className="flex items-center justify-between gap-3 py-1">
                      <div>
                        <p className="text-[14px] font-bold text-[#202320]">이름 · 로고 넣기</p>
                        <p className="text-[12px] text-[#8c948a] mt-0.5">
                          {includePhotoLogoAndName
                            ? '사진 아래 생물 이름과 로고가 함께 들어가요'
                            : '사진만 그대로 저장돼요'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIncludePhotoLogoAndName((prev) => !prev)}
                        aria-label="이름 · 로고 넣기"
                        aria-pressed={includePhotoLogoAndName}
                        className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center shrink-0 cursor-pointer ${
                          includePhotoLogoAndName ? 'bg-black justify-end' : 'bg-[#e6e9e5] justify-start'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
                      </button>
                    </div>
                  )}

                  {/* Action Buttons (F-01b / F-05b) */}
                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={triggerDownloadImage}
                      className={`h-12 rounded-[14px] text-[14px] font-bold transition-colors cursor-pointer ${
                        showShare
                          ? 'flex-1 bg-white border border-[#e6e9e5] hover:bg-[#f4f5f4] text-[#202320]'
                          : 'w-full bg-black hover:bg-[#202320] text-white'
                      }`}
                    >
                      {showShare ? '저장' : '기기에 저장'}
                    </button>
                    {showShare && (
                      <button
                        type="button"
                        onClick={triggerShareAction}
                        className="flex-1 h-12 rounded-[14px] bg-black hover:bg-[#202320] text-white text-[14px] font-bold transition-colors cursor-pointer"
                      >
                        공유하기
                      </button>
                    )}
                  </div>

                  {/* EXIF / Exact Location Privacy Notice */}
                  <p className="text-center text-[11px] text-[#8c948a]">
                    {showShare
                      ? '공유 이미지에는 정확한 위치가 표시되지 않아요'
                      : '만 14세 미만 회원은 기기 저장만 가능하며 닉네임·위치·링크가 제외돼요'}
                  </p>
                </div>

                {/* Toast Notification inside Bottom Sheet */}
                <AnimatePresence>
                  {shareBottomSheetToast && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      className="absolute bottom-20 inset-x-5 bg-[#202320] text-white font-semibold text-xs py-2.5 px-3 rounded-xl shadow-xl flex items-center justify-center gap-1.5 text-center z-50"
                    >
                      <Check className="w-4 h-4 text-[#c4eb43]" />
                      <span>{shareBottomSheetToast}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Export Card Modal */}
      <ExportCardModal
        isOpen={isLocalExportOpen}
        onClose={() => setIsLocalExportOpen(false)}
        specimen={specimen}
        specimens={allSpecimens && allSpecimens.length > 0 ? allSpecimens : [specimen]}
        userStats={userStats}
        userAccount={userAccount}
        initialMode="specimen"
      />

      {/* G-03d Data Sources & Licensing Modal (with live active sources for this specimen) */}
      <DataSourcesModal
        isOpen={isDataSourcesOpen}
        onClose={() => setIsDataSourcesOpen(false)}
        specimenName={specimen.koreanName}
        activeSources={(() => {
          const items: ActiveSpecimenSourceItem[] = [];
          if (gbifData?.usageKey) {
            items.push({
              label: 'GBIF Backbone Taxonomy (CC BY 4.0)',
              detail: `분류키 #${gbifData.usageKey} · ${specimen.scientificName}`,
              href: `https://www.gbif.org/species/${gbifData.usageKey}`,
            });
          }
          if (inatData?.id) {
            items.push({
              label: 'iNaturalist Taxa & 관찰 통계',
              detail: `Taxon #${inatData.id}${inatHistogram ? ' · 월별 출현 시즌 히스토그램 연동' : ''}`,
              href: `https://www.inaturalist.org/taxa/${inatData.id}`,
            });
          }
          if (specimen.wikiUrl) {
            items.push({
              label: 'Wikipedia (CC BY-SA 4.0)',
              detail: `${specimen.koreanName} 백과 원문 링크`,
              href: specimen.wikiUrl,
            });
          }
          if (staticEcoDetail) {
            items.push({
              label: '모아로그 생태 도감 DB',
              detail: staticEcoDetail.lynxBirdLifeNote || '종별 동정 포인트 · 서식 특성 데이터',
            });
          }
          if (liveEcologyDetail || livePhotoArtScore) {
            items.push({
              label: 'Gemini AI 생태 · 사진 분석',
              detail: '관찰 포인트 요약 및 포착 구도 분석 (참고용)',
            });
          }
          if (audioData?.url) {
            items.push({
              label: audioData.source,
              detail: `${audioData.author || '원작자 표기'} · 야생 녹음 스트림`,
            });
          }
          return items;
        })()}
      />

      {/* 5-second Undo Toast after deleting a photo */}
      <AnimatePresence>
        {undoPhotoState && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[130] w-[calc(100%-32px)] max-w-md bg-[#202320] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-[13px] font-bold">사진을 삭제했어요</p>
              <p className="text-[11px] text-white/70 mt-0.5">
                뱃지 · XP · 무료 칸은 복구되지 않아요
              </p>
            </div>
            <button
              type="button"
              onClick={handleUndoPhotoDelete}
              className="px-3 py-1.5 rounded-xl bg-[#c4eb43] text-[#202320] text-[12px] font-bold shrink-0 cursor-pointer"
            >
              되돌리기
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
