import React, { useState, useRef } from 'react';
import { Specimen, Observation, SpeciesEcologyDetail } from '../types';
import { getApiSource, getIdentificationSourceMetadata, API_SOURCES } from '../utils/apiSources';
import { isValidEcologyDetail, isSpecimenDataMatch, isMeaningfulContent } from '../utils/validation';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';
import { getCuratedBioAudio, playSynthesizedBioSound, stopAnySynthesizedSound, BioAudioTrack } from '../utils/natureAudio';
import { EditSpecimenModal } from './EditSpecimenModal';
import { AiChatbotModal } from './AiChatbotModal';
import { RadarChart } from './RadarChart';
import { EcoDexGaugeCard } from './EcoDexGaugeCard';
import { ObservationTimelineCard } from './ObservationTimelineCard';
import { InfoCriteriaModal, InfoModalContent } from './InfoCriteriaModal';
import { getGlobalEcoStatusProfile } from '../utils/globalEcologyTaxonomy';

// Sticker design themes for swipeable collection card
export type CardVisualTheme =
  | 'photo' // 1. Real photo
  | 'sticker_classic' // 2. Die-cut Sticker with art score
  | 'stamp_vintage' // 3. Postal Stamp (우표 감성)
  | 'collector_card'; // 4. Premium Hologram Collector Card (점수/스탯 포함)

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
  };
  ancestor_names?: string[]; // Taxonomy
  taxon_schemes?: any[];
}

interface DetailViewProps {
  specimen: Specimen;
  currentPersona: string;
  onClose: () => void;
  onSelectTaxonomyFilter: (taxon: string) => void;
  onAddObservation: (specimenId: string, observation: Observation) => void;
  onUpdateSpecimen?: (updatedSpecimen: Specimen) => void;
  onDeleteSpecimen?: (specimenId: string) => void;
  onOpenLens?: () => void;
}

export const DetailView: React.FC<DetailViewProps> = ({
  specimen,
  currentPersona,
  onClose,
  onSelectTaxonomyFilter,
  onAddObservation,
  onUpdateSpecimen,
  onDeleteSpecimen,
  onOpenLens,
}) => {
  // Photo selection carousel index
  const [selectedObservationIndex, setSelectedObservationIndex] = useState(0);

  // Active Visual Theme mode (Photo, Sticker, Postal Stamp, Collector Card)
  const [visualTheme, setVisualTheme] = useState<CardVisualTheme>('photo');

  // In-place photo detail & composition review toggle (사진 클릭 시 같은 화면 내에서 내용 전환)
  const [isPhotoSelectedMode, setIsPhotoSelectedMode] = useState(false);

  // Active Top 4 Core Ecology Slot selection ('slot1' | 'slot2' | 'slot3' | 'slot4' | null)
  const [activeEcoSlot, setActiveEcoSlot] = useState<'slot1' | 'slot2' | 'slot3' | 'slot4' | null>(null);

  // 2단계 상세 백과사전 아코디언 상태 (생김새, 서식지, 식성/습성, 울음소리/향기, 어원, 보전상태 등) - 기본값: 모두 닫힘 (false)
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
    sound: false,
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

  // Modals & toasts
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [showCoverSetToast, setShowCoverSetToast] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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

  // Live Deep Ecology & Observation Tips API State
  const [liveEcologyDetail, setLiveEcologyDetail] = useState<SpeciesEcologyDetail | null>(null);
  const [isLoadingEcologyDetail, setIsLoadingEcologyDetail] = useState(false);

  // Real Photo Art & Subject Match Analysis API state
  const [livePhotoArtScore, setLivePhotoArtScore] = useState<any>(null);
  const [isLoadingPhotoArt, setIsLoadingPhotoArt] = useState(false);

  // Real Audio Vocalization Recording State (Curated / xeno-canto / iNaturalist sound API / Web Audio Synth)
  const [audioData, setAudioData] = useState<BioAudioTrack>(() => getCuratedBioAudio(specimen.koreanName, specimen.category));
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPlayingSynth, setIsPlayingSynth] = useState(false);
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
      stopAnySynthesizedSound();
    };
  }, []);

  React.useEffect(() => {
    // Reset player state whenever specimen changes
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    stopAnySynthesizedSound();
    setIsPlayingAudio(false);
    setIsPlayingSynth(false);
    setAudioCurrentTime(0);
    setAudioDuration(0);

    const baseTrack = getCuratedBioAudio(specimen.koreanName, specimen.category);
    setAudioData(baseTrack);

    if (!specimen.scientificName) return;
    let isMounted = true;
    setIsLoadingAudio(true);

    // Try xeno-canto REST API for specific real bird/wildlife vocalization recordings
    fetch(`https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(specimen.scientificName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.recordings && data.recordings.length > 0) {
          const rec = data.recordings[0];
          const rawUrl = rec.file.startsWith('//') ? `https:${rec.file}` : rec.file;
          setAudioData({
            url: rawUrl,
            title: `${specimen.koreanName} (${rec.en || rec.gen || '야생 녹음'}) - ${rec.type || '울음소리'}`,
            source: `xeno-canto (XC${rec.id})`,
            author: rec.rec ? `녹음자: ${rec.rec} (${rec.cnt || '야생 현장'})` : 'xeno-canto 자연음향 아카이브',
            type: 'recording',
            description: baseTrack.description,
          });
          return;
        }

        // Fallback to iNaturalist sound observations if available
        if (inatData?.id) {
          return fetch(`https://api.inaturalist.org/v1/observations?taxon_id=${inatData.id}&sounds=true&per_page=1`)
            .then((res) => res.json())
            .then((soundRes) => {
              if (!isMounted) return;
              const soundObj = soundRes?.results?.[0]?.sounds?.[0];
              if (soundObj?.file_url) {
                setAudioData({
                  url: soundObj.file_url,
                  title: `${specimen.koreanName} 야생 생태 녹음`,
                  source: 'iNaturalist Sound Network',
                  author: soundObj.attribution || 'iNaturalist Community',
                  type: 'recording',
                  description: baseTrack.description,
                });
              }
            });
        }
      })
      .catch(() => {
        // Fallback already assigned in baseTrack
      })
      .finally(() => {
        if (isMounted) setIsLoadingAudio(false);
      });

    return () => {
      isMounted = false;
    };
  }, [specimen.scientificName, specimen.category, specimen.koreanName, inatData?.id]);

  const handlePlayAudio = () => {
    if (isPlayingSynth) {
      stopAnySynthesizedSound();
      setIsPlayingSynth(false);
    }
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(() => {
        // If browser or network blocks remote MP3, seamlessly play synthesized sound
        handlePlaySynth();
      });
    } else {
      handlePlaySynth();
    }
  };

  const handlePauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (isPlayingSynth) {
      stopAnySynthesizedSound();
      setIsPlayingSynth(false);
    }
    setIsPlayingAudio(false);
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (isPlayingSynth) {
      stopAnySynthesizedSound();
      setIsPlayingSynth(false);
    }
    setIsPlayingAudio(false);
    setAudioCurrentTime(0);
  };

  const handlePlaySynth = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingAudio(true);
    setIsPlayingSynth(true);
    playSynthesizedBioSound(specimen.category, () => {
      setIsPlayingAudio(false);
      setIsPlayingSynth(false);
    });
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
          setInatData(exactMatch || data.results[0]);
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

    return () => {
      isMounted = false;
    };
  }, [specimen.scientificName, specimen.koreanName]);

  // Fetch Category-aware Live Ecology Encyclopedia & Observation Tips API
  React.useEffect(() => {
    const cacheKey = `${(specimen.koreanName || '').trim().toLowerCase()}_${(specimen.scientificName || '').trim().toLowerCase()}_${specimen.category}_${currentPersona}`;
    if (clientEcologyDetailsCache.has(cacheKey)) {
      setLiveEcologyDetail(clientEcologyDetailsCache.get(cacheKey));
      setIsLoadingEcologyDetail(false);
      return;
    }

    let isMounted = true;
    setIsLoadingEcologyDetail(true);

    fetch('/api/ecology-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
        if (resData?.success && resData?.data && isValidEcologyDetail(resData.data) && isSpecimenDataMatch(resData.data, specimen)) {
          clientEcologyDetailsCache.set(cacheKey, resData.data);
          setLiveEcologyDetail(resData.data);
          if (onUpdateSpecimen) {
            onUpdateSpecimen({ ...specimen, isDataValidated: true });
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
  }, [specimen.koreanName, specimen.scientificName, specimen.category, currentPersona]);

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

  // Guarantee observation photos (max 5 photos)
  const rawObservations =
    specimen.observations && specimen.observations.length > 0
      ? specimen.observations
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

  // Strictly enforce max 5 photos
  const displayObservations = rawObservations.slice(0, 5);

  // Add photo up to max 5 handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (displayObservations.length >= 5) {
      alert('표본 사진은 최대 5장까지 등록할 수 있습니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const now = new Date();
        const newObs: Observation = {
          id: `obs-${Date.now()}`,
          date: `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`,
          time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
          location: specimen.locationCoord?.name || '야생 생태 관찰지',
          weather: '☀️ 맑음',
          temperature: '24°C',
          photoUrl: dataUrl,
          memo: '추가 등록된 표본 사진',
        };
        if (onAddObservation) {
          onAddObservation(specimen.id, newObs);
        } else if (onUpdateSpecimen) {
          onUpdateSpecimen({
            ...specimen,
            observations: [...displayObservations, newObs].slice(0, 5),
          });
        }
        setSelectedObservationIndex(displayObservations.length);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Delete photo handler
  const handleDeletePhoto = (indexToDelete: number) => {
    if (displayObservations.length <= 1) {
      alert('최소 1장의 대표 사진은 유지되어야 합니다.');
      return;
    }
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
    selectedObservationIndex === 0 ||
    activeObs.photoUrl === specimen.originalImage;

  // Set active photo as representative cover (optional targetIdx)
  const handleSetAsRepresentativeCover = (targetIdx?: number) => {
    if (!onUpdateSpecimen) return;

    const idxToSet = typeof targetIdx === 'number' ? targetIdx : selectedObservationIndex;
    const chosenObs = (displayObservations && displayObservations[idxToSet]) || activeObs;
    if (!chosenObs) return;

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
  const populationText = ecoDetail?.status || '안정적 • 관심대상(LC)';

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

  return (
    <>
      {/* ================= FULL SCREEN CONTAINER ================= */}
      <motion.div
        id={`specimen-detail-${specimen.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 bg-stone-100 text-stone-900 w-full h-full overflow-y-auto select-none flex flex-col scrollbar-none"
      >
        {/* Scrollable Body Content */}
        <div className="flex-1 w-full max-w-lg mx-auto pb-28 relative">
          {/* Toast: Cover Set Feedback */}
          <AnimatePresence>
            {showCoverSetToast && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-amber-300 px-4 py-2 rounded-full shadow-2xl border border-amber-400/50 text-xs font-black flex items-center gap-2 backdrop-blur-md"
              >
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
                <span>선택한 사진이 도감 대표 사진으로 지정되었습니다!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================
              1. Photo Stage (1:1 Aspect Ratio with Floating Circle Buttons)
              ======================================================== */}
          <div className="relative w-full bg-stone-950 overflow-hidden select-none">
            {/* Top Floating Circular Action Controls over Photo */}
            <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
              {/* Top Left: Circular Back Button + High Contrast Mode Switcher Badge */}
              <div className="pointer-events-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-stone-900/70 hover:bg-stone-900/90 text-white backdrop-blur-md shadow-lg border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                  title="뒤로가기"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPhotoSelectedMode(!isPhotoSelectedMode)}
                  className="px-3.5 py-2 rounded-full bg-stone-900/90 hover:bg-stone-950 text-white text-xs font-black backdrop-blur-md shadow-2xl border border-white/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer select-none"
                  title="클릭하여 모드 전환"
                >
                  {isPhotoSelectedMode ? (
                    <>
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>포착 점수 모드</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>생태 백과 모드</span>
                    </>
                  )}
                  <span className="text-[10px] text-stone-300 bg-white/20 px-1.5 py-0.5 rounded-md font-extrabold ml-0.5">전환 ▾</span>
                </button>
              </div>

              {/* Top Right: Representative Photo Status/Button + Explicit Edit Button */}
              <div className="pointer-events-auto flex items-center gap-2">
                {/* Clear Representative Photo Indicator / Button */}
                {isRepresentativeCover ? (
                  <div
                    className="px-3 py-2 rounded-full bg-amber-400 text-stone-950 border border-amber-300 font-black text-xs shadow-lg flex items-center gap-1.5 backdrop-blur-md"
                    title="현재 이 사진이 도감 대표 사진입니다"
                  >
                    <Crown className="w-3.5 h-3.5 fill-stone-950 stroke-none" />
                    <span>대표 사진</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetAsRepresentativeCover();
                    }}
                    className="px-3.5 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs shadow-xl border border-amber-300 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    title="현재 보고 있는 사진을 도감 대표 사진으로 지정"
                  >
                    <Crown className="w-3.5 h-3.5 fill-stone-950 stroke-none" />
                    <span>대표로 지정</span>
                  </button>
                )}

                {/* Explicit Edit Button */}
                {onUpdateSpecimen && (
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-3 py-2 rounded-full bg-stone-900/85 hover:bg-stone-900 text-white backdrop-blur-md shadow-lg border border-white/30 flex items-center gap-1.5 text-xs font-black transition-all active:scale-95 cursor-pointer"
                    title="표본 정보 수정"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                    <span>수정</span>
                  </button>
                )}
              </div>
            </div>

            {/* Score Mode Theme Switcher Bar (Overlayed on Photo) */}
            <AnimatePresence>
              {isPhotoSelectedMode && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-16 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-auto"
                >
                  {/* Edition Theme Switcher */}
                  <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-lg text-xs overflow-x-auto scrollbar-none">
                    {visualThemesList.map((item) => {
                      const isActive = visualTheme === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVisualTheme(item.id);
                          }}
                          className={`px-2.5 py-1 rounded-full font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer active:scale-95 ${
                            isActive
                              ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                              : 'text-stone-300 hover:text-white'
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span className="text-[10px]">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Zoom Original Image Button (Full-Screen Lightbox Modal) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsZoomModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-xs font-extrabold border border-white/20 shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
                    title="새 창에서 크게 보기"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>크게보기</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 1:1 Aspect Ratio Main Image Display Frame */}
            <div
              onClick={() => setIsPhotoSelectedMode(!isPhotoSelectedMode)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative w-full aspect-square bg-stone-950 flex items-center justify-center cursor-pointer overflow-hidden group"
            >
              {/* Floating LIVE MOTION Toggle Button on Photo Frame */}
              <div className="absolute top-3 left-3 z-30 pointer-events-auto">
                <button
                  type="button"
                  onClick={handleToggleLivePhoto}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black shadow-2xl backdrop-blur-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer border ${
                    isLivePlaying
                      ? 'bg-rose-600 text-white border-rose-300 ring-4 ring-rose-500/40 shadow-rose-900/60 animate-pulse'
                      : 'bg-stone-950/85 hover:bg-stone-900 text-stone-100 hover:text-amber-300 border-white/30 hover:border-amber-400/80'
                  }`}
                  title={isLivePlaying ? '생태 라이브 모션 일시정지' : '3.5초 생태 모션 라이브 재생'}
                >
                  <div className="relative flex items-center justify-center">
                    <span className={`w-2.5 h-2.5 rounded-full ${isLivePlaying ? 'bg-white animate-ping' : 'bg-rose-500'}`} />
                    <span className={`absolute w-2.5 h-2.5 rounded-full ${isLivePlaying ? 'bg-white' : 'bg-rose-500'}`} />
                  </div>
                  <span className="font-mono tracking-wider font-extrabold">{isLivePlaying ? `LIVE ${liveSecondsLeft.toFixed(1)}s` : 'LIVE MOTION'}</span>
                  {isLivePlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-white stroke-none" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-amber-300 stroke-none text-amber-300" />
                  )}
                </button>
              </div>

              {/* Active Live Motion Playing Aura Overlay */}
              {isLivePlaying && (
                <div className="absolute inset-0 pointer-events-none border-4 border-rose-500/70 shadow-[inset_0_0_30px_rgba(244,63,94,0.5)] z-20 animate-pulse" />
              )}

              <AnimatePresence mode="wait">
                {visualTheme === 'photo' && (
                  <motion.div
                    key={`main-photo-${selectedObservationIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full relative"
                  >
                    <motion.img
                      src={currentObsPhoto}
                      alt={specimen.koreanName}
                      referrerPolicy="no-referrer"
                      animate={
                        isLivePlaying
                          ? {
                              scale: [1, 1.04, 1.02, 1.05, 1],
                              rotate: [0, -0.8, 0.8, -0.4, 0],
                              x: [0, -3, 3, -1, 0],
                              y: [0, -2, 2, -1, 0],
                            }
                          : { scale: 1, rotate: 0, x: 0, y: 0 }
                      }
                      transition={
                        isLivePlaying
                          ? {
                              duration: 3.5,
                              ease: 'easeInOut',
                              repeat: Infinity,
                            }
                          : { duration: 0.25 }
                      }
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  </motion.div>
                )}

                {visualTheme === 'sticker_classic' && (
                  <motion.div
                    key={`main-sticker-${selectedObservationIndex}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex flex-col items-center justify-center p-6 bg-radial from-stone-800 to-stone-950 relative"
                  >
                    <img
                      src={currentStickerPhoto}
                      alt={`${specimen.koreanName} 스티커`}
                      referrerPolicy="no-referrer"
                      className="max-w-[80%] max-h-[80%] object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.6)]"
                      style={{
                        filter:
                          'drop-shadow(2.5px 2.5px 0 #ffffff) drop-shadow(-2.5px -2.5px 0 #ffffff) drop-shadow(2.5px -2.5px 0 #ffffff) drop-shadow(-2.5px 2.5px 0 #ffffff)',
                      }}
                    />
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/95 text-[#202424] rounded-full text-[10px] font-black font-mono shadow-xl flex items-center gap-1.5 border border-stone-200">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>생태 스티커 No.{specimen.number || '001'}</span>
                    </div>
                  </motion.div>
                )}

                {visualTheme === 'stamp_vintage' && (
                  <motion.div
                    key={`main-stamp-${selectedObservationIndex}`}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex items-center justify-center p-4 bg-radial from-stone-900 to-[#121615]"
                  >
                    <div className="relative w-[240px] h-[270px] bg-[#F7F4EB] rounded-lg p-2.5 shadow-2xl border-4 border-dashed border-[#D4C5A9] flex flex-col justify-between overflow-hidden text-stone-900">
                      <div className="flex items-center justify-between border-b border-[#D4C5A9] pb-1">
                        <span className="text-[8px] font-serif font-black tracking-widest text-[#5C4D3C] uppercase">
                          KOREA BIODIVERSITY
                        </span>
                        <span className="text-[11px] font-mono font-black text-[#A8422B]">
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
                          <p className="text-xs font-black text-[#382F24] font-serif truncate max-w-[120px]">
                            {specimen.koreanName}
                          </p>
                        </div>
                        <span className="text-[8px] font-mono font-bold bg-[#E8DEC8] text-[#5C4D3C] px-1 py-0.5 rounded">
                          VERIFIED
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {visualTheme === 'collector_card' && (
                  <motion.div
                    key={`main-card-${selectedObservationIndex}`}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex items-center justify-center p-3 bg-radial from-stone-900 to-black"
                  >
                    <div className="relative w-[240px] h-[270px] rounded-2xl bg-gradient-to-b from-stone-800 via-stone-900 to-stone-950 p-2.5 shadow-2xl border-2 border-amber-400/50 flex flex-col justify-between text-white">
                      <div className="flex items-center justify-between border-b border-amber-400/30 pb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-black text-amber-400">
                            {specimen.number || 'No.001'}
                          </span>
                          <h4 className="text-xs font-black text-white">
                            {specimen.koreanName}
                          </h4>
                        </div>
                        <span className="bg-amber-400 text-stone-950 text-[9px] font-black px-1.5 py-0.2 rounded-md">
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
                      <div className="grid grid-cols-3 gap-1 text-center bg-white/5 p-1 rounded-xl border border-white/10">
                        <div>
                          <span className="text-[7px] text-stone-400 block">포즈</span>
                          <span className="text-[9px] font-mono font-bold text-amber-300">
                            {photoArtScore.pose}
                          </span>
                        </div>
                        <div>
                          <span className="text-[7px] text-stone-400 block">배율</span>
                          <span className="text-[9px] font-mono font-bold text-amber-300">
                            {photoArtScore.zoom}
                          </span>
                        </div>
                        <div>
                          <span className="text-[7px] text-stone-400 block">선명도</span>
                          <span className="text-[9px] font-mono font-bold text-amber-300">
                            {photoArtScore.sharpness}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Left-Aligned Floating Sub Photo Thumbnails - ONLY in 포착점수모드 */}
              {isPhotoSelectedMode && displayObservations && displayObservations.length > 1 && (
                <div
                  className="absolute bottom-3 left-4 z-30 pointer-events-auto flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 shadow-2xl">
                    {displayObservations.map((obs, idx) => {
                      const isSelected = selectedObservationIndex === idx;
                      const isRepPhoto = obs.photoUrl === specimen.originalImage;
                      return (
                        <button
                          key={obs.id || idx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedObservationIndex(idx);
                          }}
                          className={`relative w-10 h-10 rounded-xl overflow-hidden shrink-0 transition-all cursor-pointer shadow-xl border ${
                            isSelected
                              ? 'ring-2 ring-emerald-400 border-white opacity-100 scale-105 shadow-2xl'
                              : 'border-white/30 bg-stone-900/40 opacity-70 hover:opacity-100'
                          }`}
                          title={`포토 #${idx + 1}`}
                        >
                          <img
                            src={obs.photoUrl || specimen.originalImage || ''}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          {/* One-touch Crown badge on thumbnail */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetAsRepresentativeCover(idx);
                            }}
                            className={`absolute top-0.5 right-0.5 p-0.5 rounded-full shadow-md transition-transform active:scale-90 cursor-pointer ${
                              isRepPhoto
                                ? 'bg-amber-400 text-stone-950 ring-1 ring-amber-300'
                                : 'bg-black/70 text-stone-300 hover:bg-amber-400 hover:text-stone-950'
                            }`}
                            title={isRepPhoto ? '대표' : '대표 지정'}
                          >
                            <Crown className={`w-2.5 h-2.5 ${isRepPhoto ? 'fill-stone-950 stroke-none' : ''}`} />
                          </div>
                        </button>
                      );
                    })}

                    {/* Explicit Representative Photo Button for active photo */}
                    {!isRepresentativeCover ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetAsRepresentativeCover();
                        }}
                        className="ml-1 px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-[11px] font-black shadow-md flex items-center gap-1 transition-all active:scale-95 cursor-pointer shrink-0"
                        title="이 사진을 대표 사진으로 지정"
                      >
                        <Crown className="w-3.5 h-3.5 fill-stone-950 stroke-none" />
                        <span>대표 지정</span>
                      </button>
                    ) : (
                      <div className="ml-1 px-2.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold flex items-center gap-1 shrink-0 backdrop-blur-md">
                        <Crown className="w-3.5 h-3.5 fill-amber-300 stroke-none" />
                        <span>대표 사진</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================
              2. Clean White Sheet Container
              Matches reference design with shared header & mode content
              ======================================================== */}
          <div className="bg-white rounded-t-[32px] -mt-5 relative z-10 shadow-2xl px-5 pt-6 pb-20 space-y-5">
            {/* Selected Photo Capture Info Badge Strip */}
            {activeObs && (
              <div className="bg-stone-50 text-stone-800 p-3 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="font-mono font-bold text-emerald-800 text-[11px]">
                    포착 #{displayObservations.length - selectedObservationIndex}
                  </span>
                  <span className="text-stone-300">|</span>
                  <div className="flex items-center gap-1.5 font-bold text-stone-900">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{activeObs.location || '야외 생태 서식지'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-stone-600">
                  <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-stone-200">
                    <Calendar className="w-3 h-3 text-stone-500" />
                    <span>{activeObs.date}</span>
                    <span className="text-stone-400 font-normal">{activeObs.time}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Top Metadata Section: Always visible across both modes */}
            <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200/90 space-y-3 shadow-2xs">
              {/* Category, Status & Database Badges Row */}
              <div className="flex items-center justify-between text-xs font-semibold flex-wrap gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-stone-700 border border-stone-200 flex items-center gap-1">
                    <span>🌐 국가생물종목록</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200">
                    {specimen.categoryLabel || ecoDetail?.categoryLabel || '생물'}
                  </span>
                  {ecoDetail?.status && (
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300">
                      {ecoDetail.status.split('(')[0].trim()}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-stone-500 font-semibold">
                  분류 고유번호 #{inatData?.id || specimen.id || '9021'}
                </span>
              </div>

              {/* Korean Name & Action Buttons / Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight break-words">
                      {specimen.koreanName}
                    </h2>
                    {onUpdateSpecimen && (
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="px-2.5 py-1 rounded-full bg-white hover:bg-stone-100 text-stone-700 text-xs font-extrabold border border-stone-200 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0"
                        title="표본 정보 수정"
                      >
                        <Edit3 className="w-3 h-3 text-stone-600" />
                        <span>정보 수정</span>
                      </button>
                    )}
                  </div>

                  {/* Scientific Name & English Name Chips */}
                  <div className="flex items-center gap-2 flex-wrap text-xs text-stone-600 font-mono">
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-stone-200/90 text-[11px] flex items-center gap-1.5 shadow-2xs" title="국제 학명">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">학명</span>
                      <span className="font-serif italic font-bold text-stone-900">{specimen.scientificName}</span>
                    </span>
                    {(specimen.englishName || inatData?.english_common_name || ecoDetail?.englishName) && (
                      <span className="bg-white px-2.5 py-1 rounded-lg border border-stone-200/90 text-[11px] flex items-center gap-1.5 shadow-2xs" title="영명">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider font-sans">영명</span>
                        <span className="font-sans font-bold text-stone-800">{specimen.englishName || inatData?.english_common_name || ecoDetail?.englishName}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Score & Capture Count Stats Group */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:self-end">
                  <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-stone-400">관측</span>
                    <span className="text-xs font-black text-emerald-700">{displayObservations.length}회</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-stone-400">품질</span>
                    <span className="text-xs font-black text-amber-600">{photoArtScore.total}점</span>
                  </div>
                  <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-amber-400 text-stone-950 shadow-2xs">
                    {photoArtScore.grade}
                  </span>
                </div>
              </div>
            </div>

            {/* Hidden Photo File Upload Input */}
            <input
              type="file"
              ref={photoFileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Specimen Photo Gallery (Max 5 Photos) */}
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-stone-700" />
                  <span className="text-xs font-black text-stone-900">
                    표본 사진 갤러리 ({displayObservations.length}/5)
                  </span>
                </div>
                {displayObservations.length < 5 ? (
                  <button
                    type="button"
                    onClick={() => photoFileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    <span>+ 사진 추가</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                    최대 5장 등록 완료
                  </span>
                )}
              </div>

              {/* Photo Thumbnails Slot Strip (Max 5 Slots) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                {displayObservations.map((obs, idx) => {
                  const isSelected = selectedObservationIndex === idx;
                  const isRepPhoto = obs.photoUrl === specimen.originalImage;
                  return (
                    <div
                      key={obs.id || idx}
                      className="relative shrink-0 group"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedObservationIndex(idx)}
                        className={`relative w-12 h-12 rounded-xl overflow-hidden block transition-all cursor-pointer border ${
                          isSelected
                            ? 'ring-2 ring-emerald-600 border-white scale-105 shadow-md'
                            : 'border-stone-200 opacity-75 hover:opacity-100 bg-stone-200'
                        }`}
                        title={`사진 #${idx + 1}`}
                      >
                        <img
                          src={obs.photoUrl || specimen.originalImage || ''}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>

                      {/* Crown badge for representative cover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetAsRepresentativeCover(idx);
                        }}
                        className={`absolute -top-1 -right-1 p-0.5 rounded-full shadow-xs transition-transform active:scale-90 cursor-pointer z-10 ${
                          isRepPhoto
                            ? 'bg-amber-400 text-stone-950 ring-1 ring-amber-300'
                            : 'bg-black/60 text-stone-300 hover:bg-amber-400 hover:text-stone-950'
                        }`}
                        title={isRepPhoto ? '현재 대표 사진' : '대표 사진으로 지정'}
                      >
                        <Crown className={`w-2.5 h-2.5 ${isRepPhoto ? 'fill-stone-950 stroke-none' : ''}`} />
                      </button>

                      {/* Delete photo button (Only when more than 1 photo exists) */}
                      {displayObservations.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(idx);
                          }}
                          className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-stone-900/80 hover:bg-rose-600 text-white shadow-xs transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
                          title="사진 삭제"
                        >
                          <X className="w-2.5 h-2.5 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Empty photo slots indication up to 5 */}
                {Array.from({ length: 5 - displayObservations.length }).map((_, emptyIdx) => (
                  <button
                    key={`empty-slot-${emptyIdx}`}
                    type="button"
                    onClick={() => photoFileInputRef.current?.click()}
                    className="w-12 h-12 rounded-xl border border-dashed border-stone-300 hover:border-stone-400 bg-white/50 hover:bg-white text-stone-400 hover:text-stone-600 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer shrink-0"
                    title="새 사진 등록"
                  >
                    <span className="text-xs font-bold leading-none">+</span>
                    <span className="text-[8px] font-mono">빈 슬롯</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Switcher Tabs: [생태 백과 도감] vs [구도 및 사진 검토 분석] */}
            <div className="flex items-center p-1 bg-stone-100 rounded-2xl border border-stone-200">
              <button
                type="button"
                onClick={() => setIsPhotoSelectedMode(false)}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !isPhotoSelectedMode
                    ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>생태 백과 도감</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPhotoSelectedMode(true)}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isPhotoSelectedMode
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <Eye className="w-3.5 h-3.5" />
                <span>구도 및 사진 검토 분석</span>
              </button>
            </div>

            {/* ========================================================
                [구도 및 사진 검토 분석] 
                도넛 차트 + 레이더 차트 + 세부 지표 + 전문가 한줄평
                ======================================================== */}
            {isPhotoSelectedMode ? (
              <div className="space-y-3.5 pt-1 select-none">
                {/* Header: Photo Capture & Composition Summary */}
                {/* Header: Photo Capture & Composition Summary with Calculation Info Icon */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-150">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2 mt-0.5">
                      <span>사진 포착 & 구도 검토</span>
                      <button
                        type="button"
                        onClick={() =>
                          openInfoModal({
                            title: '포착 종합 지수 및 5축 밸런스 산출 공식',
                            subtitle: 'Subject Ratio & 5-Axis Optical Balance Algorithm',
                            categoryBadge: '산출 근거',
                            rationale:
                              '단순히 피사체가 화면 가운데에 위치했는지를 넘어, 피사체 점유율(35~45%), 시선 및 이동 방향의 여백(Lead Room 25~35%), 그리고 배경 흐림(Bokeh 25~35%)의 황금 비율을 계산합니다. 여기에 5축 광학 지표(초점 선명도, 구도 배치, 명암 대비, 자연 채광, 생동감)의 표준편차를 측정하여 종합 점수를 산출합니다.',
                            criteria: [
                              '구도 점유율 (Composition Ratio): 피사체 40% : 여백 30% : 배경 흐림 30% 비율일 때 최고 점수 부여',
                              '5축 밸런스 균형도 (Radar Balance): 5개 축의 점수 편차가 적고 원형에 가까울수록 조화로운 구도로 평가',
                              '분류군별 특화 가중치: 조류(눈동자 반사광·시선 여백), 식물(꽃술·잎맥 해상력), 곤충(외골격 반사 억제·접사 배율), 포유류(동작 블러 억제·실루엣)',
                              '포착 종합 지수: 5축 지표 합산(100점 만점)에 구도 황금비 계수를 적용하여 S등급(88점 이상), A등급(80~87점), B등급(80점 미만) 산출',
                            ],
                            recordingMethod:
                              '현장 촬영 시 3분할 격자선을 활성화하고, 피사체의 시선이 향하는 방향으로 프레임의 1/3 여백을 비워두면 높은 밸런스 지수를 얻을 수 있습니다.',
                            biologicalContext:
                              '생태 사진학(Ecological Photography)에서 주 피사체와 서식지 배경의 명암 대비가 뚜렷할수록 생물의 종 동정 및 형태 형질 판독 가치가 극대화됩니다.',
                          })
                        }
                        className="w-5 h-5 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-500 hover:text-amber-800 flex items-center justify-center transition-colors cursor-pointer"
                        title="산출 공식 및 평가 기준 설명"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                        {photoArtScore.grade} 등급
                      </span>
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-2xl sm:text-3xl font-black text-amber-600">
                      {photoArtScore.total}<span className="text-sm font-bold text-stone-400">/100</span>
                    </span>
                    <span className="text-[10px] text-stone-400 block font-sans">포착 종합 지수</span>
                  </div>
                </div>

                {/* Main Graph Grid */}
                {(() => {
                  const pCat = (specimen.category || '').toLowerCase();
                  const pName = specimen.koreanName || '';
                  const isBird = pCat === 'birds' || (!pCat && /새|오리|까치|직박구리|참새|매|수리|백로|왜가리|물총새|두루미|올빼미|부엉이|벌새|딱따구리|갈매기|도요|가마우지|꿩|비둘기|제비|박새|꾀꼬리|핀치|독수리|흰머리수리|펠리컨|투칸|플라밍고|펭귄/.test(pName));
                  const isInsect = pCat === 'insects' || (!pCat && !isBird && /나비|잠자리|벌|딱정벌레|메뚜기|매미|꽃등에|무당벌레|사마귀|장수풍뎅이|사슴벌레|길앞잡이/.test(pName));
                  const isMammal = pCat === 'mammals' || (!pCat && !isBird && !isInsect && /다람쥐|너구리|고양이|족제비|노루|고라니|수달|호랑이|표범|늑대|여우|박쥐|토끼|멧돼지|사슴|곰|사자|판다|캥거루/.test(pName));
                  const isFungi = pCat === 'fungi' || (!pCat && !isBird && !isInsect && !isMammal && /버섯|곰팡이/.test(pName));
                  const isHerptile = pCat === 'reptiles' || pCat === 'amphibians' || pCat === 'herptiles' || (!pCat && !isBird && !isInsect && !isMammal && !isFungi && /개구리|도마뱀|뱀|거북|카멜레온|이구아나/.test(pName));
                  const isFish = pCat === 'fishes' || pCat === 'fish' || (!pCat && !isBird && !isInsect && !isMammal && !isFungi && !isHerptile && /물고기|잉어|붕어|어류|상어|가오리|복어|흰동가리/.test(pName));
                  const isPlant = pCat === 'plants' || (!isBird && !isInsect && !isMammal && !isFungi && !isHerptile && !isFish && /민들레|진달래|개나리|소나무|벚나무|바오밥|미선나무|세쿼이아|식물/.test(pName));

                  // Dynamic One-Line Review
                  const oneLineReview =
                    livePhotoArtScore?.oneLineReview ||
                    (!photoArtScore.isSubjectMatched
                      ? '사진 속 피사체가 목표 대상 생물과 일치하지 않거나 핵심 생태 형질이 불분명하여 구도 심사 기준에 미달합니다.'
                      : isBird
                      ? '피사체의 주요 생태 형질이 3분할 교차점에 안착하고 시선 방향 여백(Lead Room)이 확보된 생태 구도입니다.'
                      : isPlant
                      ? '꽃/잎의 미세 구조를 프레임 내에 안정적으로 배치하고 자연광 계조를 살린 생태 접사 구도입니다.'
                      : isInsect
                      ? '기주 식물과 피사체의 생태적 상호작용 및 미세 형질이 프레임 내에 정밀하게 포착되었습니다.'
                      : isMammal
                      ? '경계 시선 각도와 체구 전체 윤곽이 주변 은신처와 자연스러운 대비를 이루어 현장감이 살아있는 사진입니다.'
                      : '피사체의 주요 생태 형질이 프레임 내에 안정적으로 배치되고 배경과의 분리감이 뚜렷한 관찰 사진입니다.');

                  // 4 Category Metric Bars Data - dynamically reflects real scores
                  const scoreScale = photoArtScore.isSubjectMatched ? 1 : 0.4;
                  const categoryMetrics = isBird
                    ? [
                        { name: '깃털 결 선예도', val: Math.round(photoArtScore.sharpnessPct * scoreScale), note: photoArtScore.isSubjectMatched ? '초점 정밀' : '초점 미달' },
                        { name: '눈망울 캣치라이트', val: Math.round(photoArtScore.lightingPct * scoreScale), note: photoArtScore.isSubjectMatched ? '동공 반사광' : '광량 부족' },
                        { name: '체형 실루엣 포즈', val: Math.round(photoArtScore.posePct * scoreScale), note: photoArtScore.isSubjectMatched ? '자연스러운 자세' : '형질 불명확' },
                        { name: '모션 블러 억제도', val: Math.round(photoArtScore.framingPct * scoreScale), note: photoArtScore.isSubjectMatched ? '셔터 안정' : '구도 이탈' },
                      ]
                    : isPlant
                    ? [
                        { name: '화관 방사 대칭성', val: Math.round(photoArtScore.framingPct * scoreScale), note: photoArtScore.isSubjectMatched ? '기하학 균형' : '구도 불균형' },
                        { name: '배경 클러터 배제', val: Math.round(photoArtScore.backgroundPct * scoreScale), note: photoArtScore.isSubjectMatched ? '시선 분산 차단' : '배경 간섭' },
                        { name: '투광 계조 보존도', val: Math.round(photoArtScore.lightingPct * scoreScale), note: photoArtScore.isSubjectMatched ? '원색 보존' : '노출 오차' },
                        { name: '미세 조직 해상력', val: Math.round(photoArtScore.sharpnessPct * scoreScale), note: photoArtScore.isSubjectMatched ? '엽맥 핀초점' : '초점 미흡' },
                      ]
                    : isInsect
                    ? [
                        { name: '접사 매크로 해상력', val: Math.round(photoArtScore.sharpnessPct * scoreScale), note: photoArtScore.isSubjectMatched ? '미세 조직 묘사' : '초점 흐림' },
                        { name: '더듬이/시맥 선명도', val: Math.round(photoArtScore.sharpnessPct * scoreScale), note: photoArtScore.isSubjectMatched ? '디테일 유지' : '디테일 손실' },
                        { name: '기주식물 사선구도', val: Math.round(photoArtScore.framingPct * scoreScale), note: photoArtScore.isSubjectMatched ? '다이내믹 앵글' : '앵글 불안정' },
                        { name: '복안 반사광 또렷도', val: Math.round(photoArtScore.lightingPct * scoreScale), note: photoArtScore.isSubjectMatched ? '눈동자 초점' : '빛 반사 왜곡' },
                      ]
                    : [
                        { name: '야생 경계 시선각', val: Math.round(photoArtScore.posePct * scoreScale), note: photoArtScore.isSubjectMatched ? '표정 포착' : '포즈 미흡' },
                        { name: '전신 체구 비례감', val: Math.round(photoArtScore.framingPct * scoreScale), note: photoArtScore.isSubjectMatched ? '조화로운 비율' : '비례 왜곡' },
                        { name: '은신처 배경 대비', val: Math.round(photoArtScore.backgroundPct * scoreScale), note: photoArtScore.isSubjectMatched ? '입체적 분리감' : '배경 뭉개짐' },
                        { name: '체모/표면 텍스처', val: Math.round(photoArtScore.sharpnessPct * scoreScale), note: photoArtScore.isSubjectMatched ? '표면 선명' : '식별 불가' },
                      ];

                  // Calculate top metric dynamically
                  const metricsList = [
                    { name: '초점 선명도', val: photoArtScore.sharpnessPct },
                    { name: '구도 밸런스', val: photoArtScore.framingPct },
                    { name: '자연광 채광', val: photoArtScore.lightingPct },
                    { name: '배경 심도', val: photoArtScore.backgroundPct },
                    { name: '생태 포즈', val: photoArtScore.posePct },
                  ];
                  const bestMetric = metricsList.reduce((prev, curr) => (curr.val > prev.val ? curr : prev), metricsList[0]);

                  const values = [
                    photoArtScore.sharpnessPct / 100,
                    photoArtScore.framingPct / 100,
                    photoArtScore.lightingPct / 100,
                    photoArtScore.backgroundPct / 100,
                    photoArtScore.posePct / 100,
                  ];

                  return (
                    <div className="space-y-3.5">
                      {/* 1. Subject Verification Banner (If mismatched or verified) */}
                      {!photoArtScore.isSubjectMatched ? (
                        <div className="p-3 bg-red-50/90 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-900 shadow-2xs">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5 text-xs">
                            <span className="font-extrabold text-red-800 flex items-center gap-1.5">
                              <span>⚠️ 대상 피사체 불일치 판정 (오동정 / 피사체 부재)</span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-red-100 text-red-800 rounded font-mono font-bold">
                                일치율 {photoArtScore.targetMatchRate}%
                              </span>
                            </span>
                            <p className="text-[11px] text-red-700 leading-tight">
                              촬영된 사진에서 <b>[{specimen.koreanName}]</b>의 고유 형태 형질이 명확히 확인되지 않아 종합 지수가 감점되었습니다.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="px-3.5 py-2 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-bold text-stone-900">
                              🎯 대상 종 일치 확인: <b className="text-emerald-800">{specimen.koreanName}</b>
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                            형질 일치율 {photoArtScore.targetMatchRate}%
                          </span>
                        </div>
                      )}

                      {/* 2. 5각 포착 밸런스 (Full Redesigned Dynamic Quality Card) */}
                      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-150 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                              <Scan className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-black text-stone-900 tracking-tight flex items-center gap-2">
                                <span>5각 포착 밸런스</span>
                                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  구도 & 광학 정밀도
                                </span>
                              </h4>
                              <p className="text-[10px] text-stone-500 font-medium">
                                생태 촬영 5대 핵심 항목별 정밀 품질 분석
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-emerald-900 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300 flex items-center gap-1">
                            <span>{photoArtScore.grade}등급</span>
                            <span className="font-mono text-emerald-700 font-bold">({photoArtScore.total}점)</span>
                          </span>
                        </div>

                        {/* Radar Chart + 5 Intuitive Metric Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* Left: Custom Radar Chart */}
                          <div className="md:col-span-5 flex flex-col items-center justify-center bg-stone-50/80 p-3 rounded-2xl border border-stone-200/60">
                            <div className="relative w-48 h-44 flex items-center justify-center">
                              <svg className="w-full h-full overflow-visible" viewBox="0 0 180 160">
                                <defs>
                                  <radialGradient id="radarFillGradNew" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                                    <stop offset="70%" stopColor="#059669" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
                                  </radialGradient>
                                </defs>

                                {/* Background Webs */}
                                {[0.25, 0.5, 0.75, 1.0].map((scale, sIdx) => {
                                  const r = 52 * scale;
                                  const pts = [0, 1, 2, 3, 4]
                                    .map((i) => {
                                      const ang = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                                      const x = 90 + r * Math.cos(ang);
                                      const y = 80 + r * Math.sin(ang);
                                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                                    })
                                    .join(' ');
                                  return (
                                    <polygon
                                      key={sIdx}
                                      points={pts}
                                      fill={scale === 1.0 ? '#ffffff' : 'none'}
                                      stroke="#e7e5e4"
                                      strokeWidth="1"
                                      strokeDasharray={scale === 1.0 ? 'none' : '3 3'}
                                    />
                                  );
                                })}

                                {/* Axis Spokes */}
                                {[0, 1, 2, 3, 4].map((i) => {
                                  const ang = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                                  const x = 90 + 52 * Math.cos(ang);
                                  const y = 80 + 52 * Math.sin(ang);
                                  return <line key={i} x1="90" y1="80" x2={x} y2={y} stroke="#e7e5e4" strokeWidth="1.2" />;
                                })}

                                {/* Data Polygon */}
                                {(() => {
                                  const dataPts = values
                                    .map((v, i) => {
                                      const ang = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                                      const r = 52 * Math.max(0.15, Math.min(1.0, v));
                                      const x = 90 + r * Math.cos(ang);
                                      const y = 80 + r * Math.sin(ang);
                                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                                    })
                                    .join(' ');

                                  return (
                                    <>
                                      <polygon
                                        points={dataPts}
                                        fill="url(#radarFillGradNew)"
                                        stroke="#059669"
                                        strokeWidth="2.5"
                                        strokeLinejoin="round"
                                      />
                                      {values.map((v, i) => {
                                        const ang = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                                        const r = 52 * Math.max(0.15, Math.min(1.0, v));
                                        const x = 90 + r * Math.cos(ang);
                                        const y = 80 + r * Math.sin(ang);
                                        return (
                                          <g key={i}>
                                            <circle cx={x} cy={y} r="5" fill="#10b981" fillOpacity="0.25" />
                                            <circle cx={x} cy={y} r="3" fill="#ffffff" stroke="#059669" strokeWidth="2" />
                                          </g>
                                        );
                                      })}
                                    </>
                                  );
                                })()}

                                {/* Clear Axis Labels */}
                                <text x="90" y="16" textAnchor="middle" className="text-[10px] font-black fill-emerald-900">
                                  1. 초점 ({photoArtScore.sharpnessPct})
                                </text>
                                <text x="156" y="62" textAnchor="start" className="text-[9.5px] font-bold fill-stone-800">
                                  2. 구도 ({photoArtScore.framingPct})
                                </text>
                                <text x="142" y="142" textAnchor="middle" className="text-[9.5px] font-bold fill-stone-800">
                                  3. 자연광 ({photoArtScore.lightingPct})
                                </text>
                                <text x="38" y="142" textAnchor="middle" className="text-[9.5px] font-bold fill-stone-800">
                                  4. 배경 ({photoArtScore.backgroundPct})
                                </text>
                                <text x="24" y="62" textAnchor="end" className="text-[9.5px] font-bold fill-stone-800">
                                  5. 포즈 ({photoArtScore.posePct})
                                </text>
                              </svg>
                            </div>
                            <span className="text-[10px] font-bold text-stone-500 mt-1">
                              최우수 지표: <b className="text-emerald-800 font-extrabold">{bestMetric.name} ({bestMetric.val}점)</b>
                            </span>
                          </div>

                          {/* Right: 5 Clear Metric Progress Bars with Detailed Explanations */}
                          <div className="md:col-span-7 space-y-2.5">
                            {/* 1. 초점 선명도 */}
                            <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-stone-900 flex items-center gap-1.5">
                                  <span>🎯 1. 초점 선명도</span>
                                  <span className="text-[10px] font-normal text-stone-500">(주요 부위 텍스처)</span>
                                </span>
                                <span className="font-mono text-emerald-800 font-black">{photoArtScore.sharpnessPct}점</span>
                              </div>
                              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${photoArtScore.sharpnessPct}%` }} />
                              </div>
                              <p className="text-[10px] text-stone-600 font-medium leading-tight">
                                눈동자/꽃잎/더듬이 등 동정 핵심 부위가 핸드셰이크 없이 또렷하게 포착됨
                              </p>
                            </div>

                            {/* 2. 구도 밸런스 */}
                            <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-stone-900 flex items-center gap-1.5">
                                  <span>📐 2. 구도 밸런스</span>
                                  <span className="text-[10px] font-normal text-stone-500">(3분할 황금비)</span>
                                </span>
                                <span className="font-mono text-emerald-800 font-black">{photoArtScore.framingPct}점</span>
                              </div>
                              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${photoArtScore.framingPct}%` }} />
                              </div>
                              <p className="text-[10px] text-stone-600 font-medium leading-tight">
                                {photoArtScore.compositionAnalysis}
                              </p>
                            </div>

                            {/* 3. 자연광 채광 */}
                            <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-stone-900 flex items-center gap-1.5">
                                  <span>☀️ 3. 자연광 채광</span>
                                  <span className="text-[10px] font-normal text-stone-500">(과노출/암부 왜곡)</span>
                                </span>
                                <span className="font-mono text-emerald-800 font-black">{photoArtScore.lightingPct}점</span>
                              </div>
                              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${photoArtScore.lightingPct}%` }} />
                              </div>
                              <p className="text-[10px] text-stone-600 font-medium leading-tight">
                                직사광 하이라이트 뭉개짐이나 과도한 어둠 없이 자연광 색감이 보존됨
                              </p>
                            </div>

                            {/* 4. 배경 심도 */}
                            <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-stone-900 flex items-center gap-1.5">
                                  <span>🌿 4. 배경 심도</span>
                                  <span className="text-[10px] font-normal text-stone-500">(보케/시선 집중)</span>
                                </span>
                                <span className="font-mono text-emerald-800 font-black">{photoArtScore.backgroundPct}점</span>
                              </div>
                              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${photoArtScore.backgroundPct}%` }} />
                              </div>
                              <p className="text-[10px] text-stone-600 font-medium leading-tight">
                                배경 클러터가 아웃포커싱으로 정리되어 피사체가 입체적으로 부각됨
                              </p>
                            </div>

                            {/* 5. 생태 포즈 */}
                            <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-stone-900 flex items-center gap-1.5">
                                  <span>🐾 5. 생태 포즈</span>
                                  <span className="text-[10px] font-normal text-stone-500">(자연스러운 행동)</span>
                                </span>
                                <span className="font-mono text-emerald-800 font-black">{photoArtScore.posePct}점</span>
                              </div>
                              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${photoArtScore.posePct}%` }} />
                              </div>
                              <p className="text-[10px] text-stone-600 font-medium leading-tight">
                                야생의 경계감을 유발하지 않고 자연스러운 수식/휴식 행동 순간을 포착함
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. Field Note Ecological Correlation Card (실전 필드 노트 연계 분석) */}
                      <div className="p-4 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between text-amber-900 font-black text-xs">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-amber-700" />
                            <span>실전 필드 노트 & 서식지 환경 연계 분석</span>
                          </span>
                          <span className="text-[10px] text-amber-800/80 font-mono font-medium">
                            관찰지: {activeObs?.location || specimen.locationCoord?.name || '현장 기록'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 leading-relaxed">
                          {photoArtScore.fieldNoteCorrelation}
                        </p>
                        {photoArtScore.fieldNoteTip && (
                          <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-1.5">
                            <span className="font-bold shrink-0">🌿 탐사 가이드:</span>
                            <span className="text-stone-600">{photoArtScore.fieldNoteTip}</span>
                          </div>
                        )}
                      </div>

                      {/* 4. Biological Photography Expert One-Line Review (전문가 한줄평) */}
                      <div className="p-3.5 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-stone-100 rounded-2xl border border-stone-800 shadow-md space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>생태 사진 전문가 종합 한줄평</span>
                          </div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-stone-300 font-bold border border-white/10">
                            {photoArtScore.grade} GRADE · {photoArtScore.total} PTS
                          </span>
                        </div>
                        <p className="text-xs sm:text-[13px] text-stone-200 leading-relaxed font-normal pl-3 border-l-2 border-amber-400">
                          "{photoArtScore.oneLineReview}"
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* ========================================================
                  [생태 백과 모드] 태그버튼, 관찰팁, 정보상세 아코디언
                  ======================================================== */
              <div className="space-y-5 pt-1">
                {/* 4 Clean Upper Fixed Category Slots & Detailed Sections */}
                {(() => {
                  const cat = (specimen.category || ecoDetail?.category || '').toLowerCase();
                  const name = specimen.koreanName || '';

                  const isFungi = cat === 'fungi' || /버섯|균류|균계|곰팡이|균근|효모|담자균|자낭균|Fungi|Amanita|Agaric|Boletus|Ganoderma|Pleurotus|Tricholoma/i.test(name) || /버섯|균류|균계|곰팡이|균근|효모|Fungi|담자균|자낭균/i.test(cat) || /버섯과|Fungi/i.test(specimen.family || ecoDetail?.family || '');
                  const isBird = !isFungi && (cat === 'birds' || (!cat && /새|오리|까치|직박구리|참새|매|수리|백로|왜가리|물총새|두루미|올빼미|부엉이|벌새|딱따구리|갈매기|도요|가마우지|꿩|비둘기|제비|박새|꾀꼬리|핀치|독수리|흰머리수리|펠리컨|투칸|플라밍고|펭귄/.test(name)));
                  const isInsect = !isFungi && (cat === 'insects' || (!cat && !isBird && /나비|잠자리|벌|딱정벌레|메뚜기|매미|꽃등에|무당벌레|사마귀|장수풍뎅이|사슴벌레|길앞잡이/.test(name)));
                  const isFish = !isFungi && (cat === 'fishes' || cat === 'fish' || (!cat && !isBird && !isInsect && /잉어|붕어|피라미|가물치|쏘가리|은어|쉬리|각시붕어|꺽지|버들치|금강모치|열목어|비단잉어|송사리|미꾸리|메기|상어|가오리|복어|참복|자주복|흰동가리|망둑|감성돔|농어/.test(name)));
                  const isMammal = !isFungi && (cat === 'mammals' || (!cat && !isBird && !isInsect && !isFish && /다람쥐|너구리|고양이|족제비|노루|고라니|수달|호랑이|표범|늑대|여우|박쥐|토끼|멧돼지|사슴|곰|고래|물개|바다사자|사자|캥거루|리머|여우원숭이|아이벡스|판다/.test(name)));
                  const isReptile = !isFungi && (cat === 'reptiles' || (!cat && !isBird && !isInsect && !isFish && !isMammal && /뱀|구렁이|살모사|유혈목이|꽃뱀|도마뱀|거북|카멜레온|악어|이구아나/.test(name)));
                  const isAmphibian = !isFungi && (cat === 'amphibians' || (!cat && !isBird && !isInsect && !isFish && !isMammal && !isReptile && /개구리|두꺼비|도롱뇽|맹꽁이|무당개구리|수원청개구리|금개구리/.test(name)));
                  const isHerptile = isReptile || isAmphibian || cat === 'herptiles';
                  const isArachnid = !isFungi && (cat === 'arachnids' || (!cat && /거미|타란툴라|전갈/.test(name)));
                  const isMollusk = !isFungi && (cat === 'mollusks' || (!cat && /달팽이|민달팽이|문어|오징어|해파리|말미잘|조개|소라|고둥/.test(name)));
                  const isCrustacean = !isFungi && (cat === 'crustaceans' || (!cat && /게|가재|새우|집게/.test(name)));
                  const isPlant = !isFungi && (cat === 'plants' || (!isBird && !isInsect && !isFish && !isMammal && !isHerptile && !isArachnid && !isMollusk && !isCrustacean && /민들레|나무|진달래|개나리|소나무|벚나무|서양민들레|고사리|이끼|풀|꽃|수목|단풍|소나무|참나무|바오밥|미선나무|금강초롱꽃|가시박|돼지풀|몬스테라|세쿼이아|라플레시아|파리지옥/.test(name)));
                  const isOther = !isPlant && !isInsect && !isMammal && !isReptile && !isAmphibian && !isFish && !isFungi && !isArachnid && !isMollusk && !isCrustacean && !isBird;

                  // Real data tags from ecoDetail or species taxonomy
                  const tagsList = specimen.traitChips || ecoDetail?.tags || [];

                  // --- 상단 카테고리 (4개 슬롯 생물군별 정밀 규격 매핑) ---
                  // 1. 계통 분류 (Taxonomy)
                  const slot1Label = '분류';
                  const orderStr = (ecoDetail?.order || specimen.order || '').split('(')[0].trim();
                  const familyStr = (ecoDetail?.family || specimen.family || '').split('(')[0].trim();
                  const slot1Val = familyStr || orderStr || (specimen.categoryLabel || '생물군');

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

                  // 3. 표준 규격 (Size & Dimension)
                  const slot3Label = '규격';
                  let rawSize = ecoDetail?.size ? ecoDetail.size.split(',')[0].split('(')[0].trim() : (specimen.size || '');
                  rawSize = rawSize.replace(/^(성체|성충|전장|체장|수고|초장|약|최대)\s*/g, '').trim();
                  let slot3Val = rawSize;
                  if (!slot3Val || slot3Val === '표준 규격' || slot3Val === '규격 표준 참조') {
                    slot3Val = isBird ? '20~40cm' : isPlant ? '30~80cm' : isFish ? '10~20cm' : isInsect ? '2~4cm' : isArachnid ? '1~3cm' : isCrustacean ? '5~8cm' : isMollusk ? '2~4cm' : isMammal ? '15~30cm' : isHerptile ? '10~25cm' : '표준 치수';
                  } else if (/^\d+(\.\d+)?(~|-)\d+(\.\d+)?$/.test(slot3Val)) {
                    slot3Val += 'cm';
                  }

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
                          '천연기념물', '멸종위기야생생물', '멸종위기I급', '멸종위기II급', 'IUCN적색목록',
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

                  return (
                    <div className="space-y-4">
                      {/* Section Title with Verified Multi-API Source Badge */}
                      <div className="flex items-center justify-between border-b border-stone-150 pb-2">
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
                            <span>📖 생태 백과 도감</span>
                            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {API_SOURCES.general.shortTag}
                            </span>
                          </h3>
                          <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                            {API_SOURCES.general.sourceName} 기반 실시간 동정 데이터
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-lg border border-emerald-300 shrink-0">
                          {ecoDetail ? '데이터 연동 완료' : '표준 데이터'}
                        </span>
                      </div>

                      {/* 4대 핵심 생태 정보 대화형 카드 (1열 초간결 배치: slot4 미제공 시 3열 균등 분할) */}
                      <div className="space-y-2.5">
                        <div className={`grid gap-1.5 sm:gap-2 ${globalProfile.hasSlot4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                          {/* 1. 계통 분류 */}
                          <button
                            type="button"
                            onClick={() => setActiveEcoSlot(activeEcoSlot === 'slot1' ? null : 'slot1')}
                            className={`py-2 px-1.5 sm:px-2.5 rounded-xl border text-left flex flex-col justify-center min-w-0 transition-all cursor-pointer select-none active:scale-[0.98] ${
                              activeEcoSlot === 'slot1'
                                ? 'bg-stone-900 text-white border-stone-900 shadow-sm ring-2 ring-stone-600/30'
                                : 'bg-stone-50/90 border-stone-200/90 hover:bg-stone-100/90 text-stone-900 shadow-2xs'
                            }`}
                          >
                            <div className={`text-[10px] sm:text-[11px] font-bold flex items-center gap-1 leading-tight ${
                              activeEcoSlot === 'slot1' ? 'text-stone-300' : 'text-stone-500'
                            }`}>
                              <Layers className="w-3 h-3 shrink-0" />
                              <span className="truncate">{slot1Label}</span>
                            </div>
                            <div className={`font-extrabold text-[11px] sm:text-xs md:text-sm truncate mt-0.5 leading-tight ${
                              activeEcoSlot === 'slot1' ? 'text-white' : 'text-stone-900'
                            }`} title={slot1Val}>
                              {slot1Val}
                            </div>
                          </button>

                          {/* 2. 생장 및 식성 */}
                          <button
                            type="button"
                            onClick={() => setActiveEcoSlot(activeEcoSlot === 'slot2' ? null : 'slot2')}
                            className={`py-2 px-1.5 sm:px-2.5 rounded-xl border text-left flex flex-col justify-center min-w-0 transition-all cursor-pointer select-none active:scale-[0.98] ${
                              activeEcoSlot === 'slot2'
                                ? 'bg-stone-900 text-white border-stone-900 shadow-sm ring-2 ring-stone-600/30'
                                : 'bg-stone-50/90 border-stone-200/90 hover:bg-stone-100/90 text-stone-900 shadow-2xs'
                            }`}
                          >
                            <div className={`text-[10px] sm:text-[11px] font-bold flex items-center gap-1 leading-tight ${
                              activeEcoSlot === 'slot2' ? 'text-stone-300' : 'text-stone-500'
                            }`}>
                              <Leaf className="w-3 h-3 shrink-0" />
                              <span className="truncate">{slot2Label}</span>
                            </div>
                            <div className={`font-extrabold text-[11px] sm:text-xs md:text-sm truncate mt-0.5 leading-tight ${
                              activeEcoSlot === 'slot2' ? 'text-white' : 'text-stone-900'
                            }`} title={slot2Val}>
                              {slot2Val}
                            </div>
                          </button>

                          {/* 3. 표준 규격 */}
                          <button
                            type="button"
                            onClick={() => setActiveEcoSlot(activeEcoSlot === 'slot3' ? null : 'slot3')}
                            className={`py-2 px-1.5 sm:px-2.5 rounded-xl border text-left flex flex-col justify-center min-w-0 transition-all cursor-pointer select-none active:scale-[0.98] ${
                              activeEcoSlot === 'slot3'
                                ? 'bg-stone-900 text-white border-stone-900 shadow-sm ring-2 ring-stone-600/30'
                                : 'bg-stone-50/90 border-stone-200/90 hover:bg-stone-100/90 text-stone-900 shadow-2xs'
                            }`}
                          >
                            <div className={`text-[10px] sm:text-[11px] font-bold flex items-center gap-1 leading-tight ${
                              activeEcoSlot === 'slot3' ? 'text-stone-300' : 'text-stone-500'
                            }`}>
                              <Maximize2 className="w-3 h-3 shrink-0" />
                              <span className="truncate">{slot3Label}</span>
                            </div>
                            <div className={`font-extrabold text-[11px] sm:text-xs md:text-sm truncate mt-0.5 leading-tight ${
                              activeEcoSlot === 'slot3' ? 'text-white' : 'text-stone-900'
                            }`} title={slot3Val}>
                              {slot3Val}
                            </div>
                          </button>

                          {/* 4. 글로벌 생태·보전 / 특화 적응 지위 (보전/특화 데이터가 있을 때만 렌더링) */}
                          {globalProfile.hasSlot4 && (
                            <button
                              type="button"
                              onClick={() => setActiveEcoSlot(activeEcoSlot === 'slot4' ? null : 'slot4')}
                              className={`py-2 px-1.5 sm:px-2.5 rounded-xl border text-left flex flex-col justify-center min-w-0 transition-all cursor-pointer select-none active:scale-[0.98] ${
                                activeEcoSlot === 'slot4'
                                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm ring-2 ring-stone-600/30'
                                  : 'bg-stone-50/90 border-stone-200/90 hover:bg-stone-100/90 text-stone-900 shadow-2xs'
                              }`}
                            >
                              <div className={`text-[10px] sm:text-[11px] font-bold flex items-center gap-1 leading-tight ${
                                activeEcoSlot === 'slot4' ? 'text-stone-300' : 'text-stone-500'
                              }`}>
                                <Shield className="w-3 h-3 shrink-0" />
                                <span className="truncate">{slot4Label}</span>
                              </div>
                              <div className={`font-extrabold text-[11px] sm:text-xs md:text-sm truncate mt-0.5 leading-tight ${
                                activeEcoSlot === 'slot4' ? 'text-white' : 'text-stone-900'
                              }`} title={slot4Val}>
                                {slot4Val}
                              </div>
                            </button>
                          )}
                        </div>

                        {/* --- 선택된 카드의 상세 내용 확장 박스 (Expanded Detail Box) --- */}
                        <AnimatePresence>
                          {activeEcoSlot && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, y: -4 }}
                              animate={{ opacity: 1, height: 'auto', y: 0 }}
                              exit={{ opacity: 0, height: 0, y: -4 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3.5 sm:p-4 rounded-2xl bg-white text-stone-900 border border-stone-200 shadow-sm space-y-3">
                                {/* Slot 1 내용: 계통 분류 체계 */}
                                {activeEcoSlot === 'slot1' && specimen.isDataValidated && (
                                  <div className="space-y-3">
                                    {/* 계통 체인 */}
                                    <div className="flex items-center gap-1.5 flex-wrap text-xs bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 shadow-2xs">
                                        <span className="text-[10px] text-stone-400 font-bold">계</span>
                                        <span className="text-stone-800 font-bold">{isPlant ? '식물계' : isFungi ? '균계' : '동물계'}</span>
                                      </div>
                                      <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />

                                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 shadow-2xs">
                                        <span className="text-[10px] text-stone-400 font-bold">문</span>
                                        <span className="text-stone-800 font-bold">
                                          {isPlant ? '관속식물문' : isInsect || isArachnid || isCrustacean ? '절지동물문' : isMollusk ? '연체동물문' : '척삭동물문'}
                                        </span>
                                      </div>
                                      <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />

                                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 shadow-2xs">
                                        <span className="text-[10px] text-stone-400 font-bold">강</span>
                                        <span className="text-stone-800 font-bold">
                                          {isPlant ? '목련강' : isFungi ? '주름버섯강' : isBird ? '조강' : isMammal ? '포유강' : isInsect ? '곤충강' : isFish ? '조기어강' : isAmphibian ? '양서강' : isReptile ? '파충강' : isArachnid ? '거미강' : isMollusk ? '복족강' : isCrustacean ? '연갑강' : '분류강'}
                                        </span>
                                      </div>
                                      <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />

                                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 shadow-2xs">
                                        <span className="text-[10px] text-stone-400 font-bold">목</span>
                                        <span className="text-stone-800 font-bold">
                                          {(ecoDetail?.order || specimen.order || '기록목').split('(')[0].trim()}
                                        </span>
                                      </div>
                                      <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />

                                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 shadow-2xs">
                                        <span className="text-[10px] text-stone-400 font-bold">과</span>
                                        <span className="text-stone-800 font-bold">
                                          {(ecoDetail?.family || specimen.family || '기록과').split('(')[0].trim()}
                                        </span>
                                      </div>
                                      
                                    </div>

                                    {/* 상세 설명 */}
                                    <p className="text-xs sm:text-[13px] text-stone-700 leading-relaxed bg-stone-50/50 p-3 rounded-xl border border-stone-150">
                                      {isPlant
                                        ? `국제 식물분류체계(APG IV) 및 GBIF Backbone에 정식 등록된 관속식물문 계통군입니다. 엽록소를 통한 독립영양 생활사와 관속계(물관·체관) 및 종자 번식 기관의 형태적 상동성을 공유하며, ${(ecoDetail?.family || specimen.family || '해당 과').split('(')[0].trim()}에 체계적으로 귀속되어 있습니다.`
                                        : isBird
                                        ? `국제조류학회(IOC) 및 GBIF에 정식 등재된 ${(ecoDetail?.order || specimen.order || '조류목').split('(')[0].trim()} ${(ecoDetail?.family || specimen.family || '조류과').split('(')[0].trim()} 조류입니다. 경량화된 비행 골격계와 발가락 대생 구조, 깃털 배열 형질을 공유하는 단계통(Monophyletic) 진화군입니다.`
                                        : isInsect
                                        ? `절지동물문 곤충강 계통군으로 머리·가슴·배 3마디 체절과 키틴질 외골격을 갖추고 있으며, ${(ecoDetail?.order || specimen.order || '곤충목').split('(')[0].trim()}의 고유 날개 맥상과 구기 구조를 통해 단계별 계통 분류가 확정되었습니다.`
                                        : isFungi
                                        ? `균계(Kingdom Fungi) 진정균류 계통으로 키틴질 세포벽과 균사체 네트워크를 통해 영양을 흡수하며, 포자 형성 자실체 구조를 바탕으로 분류학적 위치가 지정되어 있습니다.`
                                        : `세계생물다양성정보체계(GBIF) 기준 공인 분류 체계에 따라 ${(ecoDetail?.family || specimen.family || '해당 과').split('(')[0].trim()}에 정식 배속된 야생 생물종입니다.`}
                                    </p>

                                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                                      <span className="flex items-center gap-1 font-medium">
                                        <span className="text-emerald-700 font-semibold">🏛️ 데이터 출처:</span>
                                        <span>{API_SOURCES.taxonomy.fullLabel}</span>
                                      </span>
                                      <span className="font-mono text-[10px] text-stone-400">GBIF Backbone DB</span>
                                    </div>
                                  </div>
                                )}

                                {/* Slot 2 내용: 생장/식성/영양 */}
                                {activeEcoSlot === 'slot2' && (() => {
                                  let dietCategory = (ecoDetail?.diet || specimen.diet || '잡식성').trim();
                                  if (!dietCategory.endsWith('성') && /식$/.test(dietCategory)) {
                                    dietCategory += '성';
                                  }
                                  if (!dietCategory) dietCategory = '잡식성';

                                  const rawDiet = (ecoDetail?.dietAndBehavior || '').trim();
                                  let formattedDiet = '';

                                  if (isPlant) {
                                    formattedDiet = '태양광을 흡수하여 유기물(포도당)을 합성하는 독립영양체(1차 생산자)로서 생태계 기저 에너지를 생산합니다. 뿌리를 통해 수분과 무기 양분을 흡수하고 기공 개폐로 증산작용을 조절하며, 개화기에는 곤충 매개(충매화) 또는 풍매를 통해 꽃가루받이(수분)를 수행하여 종자를 결실하는 생활사를 완성합니다.';
                                  } else if (isFungi) {
                                    formattedDiet = '체외로 고분자 분해 효소를 분비하여 리그닌과 셀룰로스를 분해한 뒤 단순 당류로 흡수하는 부생(Saprophytic) 영양 방식을 취합니다. 삼림 내 고목과 낙엽을 유기질 토양으로 환원시키는 생태계 청소부이자 핵심적인 물질 순환자입니다.';
                                  } else if (rawDiet) {
                                    const cleaned = rawDiet.replace(/^(으로|로)\s*,?\s*/, '');
                                    if (/^(잡식성|초식성|육식성|잡식|초식|육식|어식|충식|부식)(으로|로)\s*/.test(cleaned)) {
                                      formattedDiet = cleaned;
                                    } else if (/^(잡식성|초식성|육식성|잡식|초식|육식|어식|충식|부식)/.test(cleaned)) {
                                      formattedDiet = cleaned;
                                    } else {
                                      formattedDiet = `${dietCategory}으로, ${cleaned}`;
                                    }
                                  } else {
                                    formattedDiet = `${specimen.koreanName}은(는) ${dietCategory}의 섭식 특성을 지니며, 서식지 환경에서 고유한 탐색 및 채이 전술을 구사하여 먹이그물(Food Web) 내에서 생태적 균형을 유지합니다.`;
                                  }

                                  return (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
                                          {isPlant ? '☀️ 1차 생산자 (광합성 독립영양)' : isFungi ? '🪵 유기물 분해자 (부생/공생)' : `🎯 ${dietCategory}`}
                                        </span>
                                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
                                          {isPlant ? '💧 수분/양분: 뿌리 삼투 및 증산' : isBird ? '🦅 섭식 방식: 시각 탐색 및 정밀 포획' : isInsect ? '🦋 구기 특화: 흡액/저작형' : '🔄 대사: 생태계 에너지 순환'}
                                        </span>
                                      </div>

                                      <p className="text-xs sm:text-[13px] text-stone-700 leading-relaxed bg-stone-50/50 p-3 rounded-xl border border-stone-150">
                                        {formattedDiet}
                                      </p>

                                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                                        <span className="flex items-center gap-1 font-medium">
                                          <span className="text-emerald-700 font-semibold">🏛️ 데이터 출처:</span>
                                          <span>{API_SOURCES.dietAndBehavior.fullLabel}</span>
                                        </span>
                                        <span className="font-mono text-[10px] text-stone-400">GBIF · EOL DB</span>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Slot 3 내용: 표준 규격 */}
                                {activeEcoSlot === 'slot3' && (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
                                        📐 표준 규격: {slot3Val}
                                      </span>
                                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
                                        {isBird ? '🦅 측정 기준: 부리끝~꼬리끝 전장 및 날개편길이' : isPlant ? '🌿 측정 기준: 지상부 수고 및 엽신 크기' : isFish ? '🐟 측정 기준: 주둥이끝~꼬리지느러미 전장' : isCrustacean ? '🦞 측정 기준: 이마뿔(액각)~미절(꼬리끝) 두흉갑 및 전장' : '📏 측정 기준: 성체 표준 계측 치수'}
                                      </span>
                                    </div>

                                    <p className="text-xs sm:text-[13px] text-stone-700 leading-relaxed bg-stone-50/50 p-3 rounded-xl border border-stone-150">
                                      {isBird
                                        ? `조류의 체구 규격(전장 및 익장)은 비행 공기역학(Aerodynamics)과 익하중(체중 대비 날개 면적 비율)에 직접적인 영향을 미칩니다. ${specimen.koreanName}의 신체 비율은 ${habitatText.includes('도심') || habitatText.includes('숲') ? '나뭇가지와 장애물 사이를 민첩하게 선회하고 급제동하기에 최적화된 기동성' : '에너지를 절약하며 안정적인 활공과 순항 비행을 가능하게 하는 양력 효율'}을 제공하도록 진화했습니다.`
                                        : isPlant
                                        ? `지상부 수고와 엽신 크기는 태양광 수광 면적(Light Interception)을 극대화하면서도 강우와 강풍에 따른 줄기 전단 응력을 견디도록 설계된 초형 구조입니다. 줄기의 유연한 섬유질과 잎 표면의 큐티클층은 수분 손실을 억제하고 환경 스트레스에 저항합니다.`
                                        : isInsect
                                        ? `키틴질 외골격의 마디 구조와 체구 비율은 체액의 과도한 증발을 차단하고, 근육 부착 지렛대 원리를 통해 자기 체중의 수십 배에 달하는 순간 가속력과 비행 기동성을 발휘할 수 있게 합니다.`
                                        : isFish
                                        ? `유선형 체형과 지느러미 배치는 물속에서의 유체 저항(Drag)을 최소화하고 측선 감각계를 통해 수류와 먹이의 진동을 정밀하게 감지하는 수중 적응형 생체 구조입니다.`
                                        : isCrustacean
                                        ? `키틴질 두흉갑과 1쌍의 집게다리, 부채꼴 꼬리마디(Telson)는 바위 틈 은신과 저서 먹이 포획에 최적화되어 있으며, 위협 감지 시 복부를 굴곡시켜 순간적인 역추진 유영을 구사합니다.`
                                        : `${specimen.koreanName}의 표준 체구 치수는 서식지 지형에 맞춘 민첩한 이동과 에너지 항상성 유지를 위해 최적화된 형태학적 진화 결과물입니다.`}
                                    </p>

                                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                                      <span className="flex items-center gap-1 font-medium">
                                        <span className="text-emerald-700 font-semibold">🏛️ 데이터 출처:</span>
                                        <span>{API_SOURCES.appearance.fullLabel}</span>
                                      </span>
                                      <span className="font-mono text-[10px] text-stone-400">GBIF Morphometrics</span>
                                    </div>
                                  </div>
                                )}

                                {/* Slot 4 내용: 글로벌 생태 지위 및 카테고리 특화 상세 */}
                                {activeEcoSlot === 'slot4' && globalProfile.hasSlot4 && (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                                        slot4Theme === 'warning'
                                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                                          : slot4Theme === 'disturber'
                                          ? 'bg-orange-50 text-orange-900 border-orange-200'
                                          : slot4Theme === 'naturalized'
                                          ? 'bg-teal-50 text-teal-900 border-teal-200'
                                          : slot4Theme === 'endemic'
                                          ? 'bg-sky-50 text-sky-900 border-sky-200'
                                          : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                      }`}>
                                        {globalProfile.slot4BadgeText}
                                      </span>
                                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
                                        🌐 {globalProfile.realmNameKo.split('(')[0].trim()} · {globalProfile.iucnLabel.split('(')[0].trim()}
                                      </span>
                                    </div>

                                    <p className="text-xs sm:text-[13px] text-stone-700 leading-relaxed bg-stone-50/50 p-3 rounded-xl border border-stone-150">
                                      {globalProfile.slot4DetailedNarrative}
                                    </p>

                                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                                      <span className="flex items-center gap-1 font-medium">
                                        <span className="text-emerald-700 font-semibold">🏛️ 데이터 출처:</span>
                                        <span className="text-stone-700">{globalProfile.slot4DataSource}</span>
                                      </span>
                                      <span className="font-mono text-[10px] text-stone-400">
                                        {globalProfile.slot4DbCode}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* 균류(버섯) 전문 연구기관 확인 안내 배너 */}
                      {isFungi && (
                        <div className="p-3 sm:p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950 flex items-start gap-2.5 text-xs sm:text-[13px] leading-relaxed shadow-2xs">
                          <span className="text-base sm:text-lg shrink-0 select-none">🍄</span>
                          <div className="space-y-0.5">
                            <span className="font-bold text-amber-900 block text-xs sm:text-sm">야생 버섯 관찰 및 안전 수칙</span>
                            <p className="text-amber-800 text-[11px] sm:text-xs">
                              야생 버섯은 생육 단계와 환경에 따라 외형 변이가 심해 육안만으로 식독 여부를 판별하기 어렵습니다. <strong>야생 버섯의 식독 여부는 절대 임의로 판단하거나 섭취하지 마시고, 반드시 국립산림과학원 등 공인 전문 기관 및 균류 전문가에게 확인하세요.</strong>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* --- API 연동 기반 백과사전 아코디언 (Accordion Items) - 데이터가 존재하는 항목만 조건부 렌더링 --- */}
                      <div className="space-y-2.5 pt-1">
                        {/* 1. 생김새 아코디언 (appearanceText가 유효한 내용일 때만 렌더링) */}
                        {isMeaningfulContent(appearanceText) && (
                          <div className="rounded-xl border border-stone-200/80 bg-white overflow-hidden shadow-2xs transition-all">
                            <button
                              type="button"
                              onClick={() => toggleCategory('appearance')}
                              className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-stone-50/80 transition-colors cursor-pointer gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                                <span className="text-xs font-bold text-stone-900 tracking-tight flex items-center gap-1.5 shrink-0">
                                  <span>👁️</span>
                                  <span>외형 특징</span>
                                </span>
                                {appearanceBadges.slice(0, 4).map((badge, idx) => (
                                  <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/60">
                                    #{badge}
                                  </span>
                                ))}
                              </div>
                              <span className="text-stone-400 p-1 shrink-0">
                                {expandedCategories.appearance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </span>
                            </button>

                            {expandedCategories.appearance && (
                              <div className="px-3.5 pb-3.5 pt-1 border-t border-stone-100 bg-stone-50/30 space-y-2">
                                <p className="text-xs text-stone-700 font-normal leading-relaxed bg-white p-3 rounded-lg border border-stone-200/60">
                                  {appearanceText}
                                </p>
                                <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between text-[11px] text-stone-500">
                                  <span className="flex items-center gap-1 font-medium">
                                    <span className="text-emerald-700 font-semibold">🏛️ 출처:</span>
                                    <span className="text-stone-700">{API_SOURCES.appearance.fullLabel}</span>
                                  </span>
                                  <span className="text-[10px] font-mono text-stone-400 shrink-0">GBIF · iNat</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. 서식지 아코디언 (habitatText가 유효한 내용일 때만 렌더링) */}
                        {isMeaningfulContent(habitatText) && (
                          <div className="rounded-xl border border-stone-200/80 bg-white overflow-hidden shadow-2xs transition-all">
                            <button
                              type="button"
                              onClick={() => toggleCategory('habitat')}
                              className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-stone-50/80 transition-colors cursor-pointer gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                                <span className="text-xs font-bold text-stone-900 tracking-tight flex items-center gap-1.5 shrink-0">
                                  <span>🏡</span>
                                  <span>서식 환경</span>
                                </span>
                                {habitatBadges.slice(0, 4).map((badge, idx) => (
                                  <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                                    #{badge}
                                  </span>
                                ))}
                              </div>
                              <span className="text-stone-400 p-1 shrink-0">
                                {expandedCategories.habitat ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </span>
                            </button>

                            {expandedCategories.habitat && (
                              <div className="px-3.5 pb-3.5 pt-1 border-t border-stone-100 bg-stone-50/30 space-y-2">
                                <p className="text-xs text-stone-700 font-normal leading-relaxed bg-white p-3 rounded-lg border border-stone-200/60">
                                  {habitatText}
                                </p>
                                <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between text-[11px] text-stone-500">
                                  <span className="flex items-center gap-1 font-medium">
                                    <span className="text-emerald-700 font-semibold">🏛️ 출처:</span>
                                    <span className="text-stone-700">{API_SOURCES.habitat.fullLabel}</span>
                                  </span>
                                  <span className="text-[10px] font-mono text-stone-400 shrink-0">iNat Obs</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. 식성 & 먹이 습성 아코디언 (dietAndBehavior가 유효한 내용일 때만 렌더링) */}
                        {isMeaningfulContent(ecoDetail?.dietAndBehavior) && (
                          <div className="rounded-xl border border-stone-200/80 bg-white overflow-hidden shadow-2xs transition-all">
                            <button
                              type="button"
                              onClick={() => toggleCategory('ecology')}
                              className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-stone-50/80 transition-colors cursor-pointer gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                                <span className="text-xs font-bold text-stone-900 tracking-tight flex items-center gap-1.5 shrink-0">
                                  <span>🥗</span>
                                  <span>섭식 및 생태 습성</span>
                                </span>
                                {ecologyBadges.slice(0, 4).map((badge, idx) => (
                                  <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/60">
                                    #{badge}
                                  </span>
                                ))}
                              </div>
                              <span className="text-stone-400 p-1 shrink-0">
                                {expandedCategories.ecology ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </span>
                            </button>

                            {expandedCategories.ecology && (
                              <div className="px-3.5 pb-3.5 pt-1 border-t border-stone-100 bg-stone-50/30 space-y-2">
                                <p className="text-xs text-stone-700 font-normal leading-relaxed bg-white p-3 rounded-lg border border-stone-200/60">
                                  {ecoDetail.dietAndBehavior}
                                </p>
                                <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between text-[11px] text-stone-500">
                                  <span className="flex items-center gap-1 font-medium">
                                    <span className="text-emerald-700 font-semibold">🏛️ 출처:</span>
                                    <span className="text-stone-700">{API_SOURCES.dietAndBehavior.fullLabel}</span>
                                  </span>
                                  <span className="text-[10px] font-mono text-stone-400 shrink-0">GBIF · EOL</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 4. 깔끔하고 직관적인 생태 오디오 플레이어 (통합 재생/일시정지 + 정지 + 사운드바) */}
                        <div className="rounded-xl border border-stone-200/80 bg-white overflow-hidden shadow-2xs transition-all">
                          <div className="p-3.5 space-y-3">
                            {/* Player Header: Compact Title & Source */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
                                  <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-stone-900 truncate">
                                    {audioData?.title || `${specimen.koreanName} 생태 음향`}
                                  </p>
                                  <p className="text-[10px] text-stone-500 truncate">
                                    {isPlant ? '수분·환경음' : '야생 울음소리'} • {audioData?.source || 'Bio API'}
                                  </p>
                                </div>
                              </div>

                              {/* Accordion expand toggle for sound notes if available */}
                              {ecoDetail?.callOrSound && (
                                <button
                                  type="button"
                                  onClick={() => toggleCategory('sound')}
                                  className="text-[11px] font-medium text-stone-500 hover:text-stone-900 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-stone-100 transition-all cursor-pointer"
                                >
                                  <span>{expandedCategories.sound ? '설명 닫기' : '생태 설명'}</span>
                                  {expandedCategories.sound ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>

                            {/* Player Controls: Big Clear Play/Pause, Stop, Time, and Equalizer */}
                            <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-lg border border-stone-200/70">
                              {/* Integrated Play / Pause Toggle Button */}
                              <button
                                type="button"
                                onClick={isPlayingAudio ? handlePauseAudio : handlePlayAudio}
                                className="w-9 h-9 rounded-full bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform cursor-pointer"
                                title={isPlayingAudio ? "일시정지 (Pause)" : "재생 (Play)"}
                              >
                                {isPlayingAudio ? (
                                  <Pause className="w-4 h-4 fill-white" />
                                ) : (
                                  <Play className="w-4 h-4 fill-white ml-0.5" />
                                )}
                              </button>

                              {/* Stop Button (Reset to 00:00) */}
                              <button
                                type="button"
                                onClick={handleStopAudio}
                                disabled={!isPlayingAudio && audioCurrentTime === 0}
                                className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center shrink-0 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer"
                                title="정지 및 처음으로 (Stop)"
                              >
                                <Square className="w-3 h-3 fill-stone-700" />
                              </button>

                              {/* Progress Slider and Time Indicator */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
                                  <span>
                                    {Math.floor(audioCurrentTime / 60).toString().padStart(2, '0')}:
                                    {Math.floor(audioCurrentTime % 60).toString().padStart(2, '0')}
                                  </span>
                                  <span>
                                    {audioDuration > 0
                                      ? `${Math.floor(audioDuration / 60).toString().padStart(2, '0')}:${Math.floor(audioDuration % 60).toString().padStart(2, '0')}`
                                      : '00:30'}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max={audioDuration || 30}
                                  value={audioCurrentTime}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setAudioCurrentTime(val);
                                    if (audioRef.current) {
                                      audioRef.current.currentTime = val;
                                    }
                                  }}
                                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
                                />
                              </div>

                              {/* Soundwave Bars Animation */}
                              <div className="flex items-end gap-0.5 h-4 shrink-0 px-1">
                                {[0.4, 0.9, 0.6, 1.0, 0.5].map((val, i) => (
                                  <div
                                    key={i}
                                    className={`w-0.5 rounded-full bg-stone-700 transition-all duration-150 ${
                                      isPlayingAudio ? 'animate-pulse' : 'opacity-25'
                                    }`}
                                    style={{
                                      height: isPlayingAudio ? `${Math.max(25, val * 100)}%` : '25%',
                                      animationDelay: `${i * 100}ms`
                                    }}
                                  />
                                ))}
                              </div>

                              {/* Mute toggle button */}
                              <button
                                type="button"
                                onClick={toggleMute}
                                className="p-1.5 rounded-md hover:bg-stone-200/60 text-stone-600 transition-colors shrink-0"
                                title={isMuted ? '음소거 해제' : '음소거'}
                              >
                                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-stone-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {/* Supplementary WebAudio Synth option button */}
                            <div className="flex items-center justify-between pt-0.5 text-[11px] text-stone-500">
                              <span>자연 주파수 합성 모드</span>
                              <button
                                type="button"
                                onClick={handlePlaySynth}
                                className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-[11px] transition-colors cursor-pointer"
                              >
                                🎹 주파수 사운드
                              </button>
                            </div>

                            {/* Hidden HTML5 Audio Element */}
                            {audioData?.url && (
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
                                onError={() => {
                                  console.log('Audio stream failed, fallback active');
                                }}
                              />
                            )}
                          </div>

                          {/* Sound Note Expanded Body */}
                          {expandedCategories.sound && ecoDetail?.callOrSound && (
                            <div className="px-3.5 pb-3.5 pt-1 border-t border-stone-100 bg-stone-50/30">
                              <p className="text-xs text-stone-700 font-normal leading-relaxed bg-white p-3 rounded-lg border border-stone-200/60">
                                {ecoDetail.callOrSound}
                              </p>
                              <div className="mt-2 pt-2 border-t border-stone-200/70 flex items-center justify-between text-[11px] text-stone-500">
                                <span className="flex items-center gap-1 font-medium">
                                  <span className="text-emerald-700 font-semibold">🏛️ 출처:</span>
                                  <span className="text-stone-700">xeno-canto Wildlife Audio & Macaulay Library</span>
                                </span>
                                <span className="text-[10px] font-mono text-stone-400 shrink-0">Bio-Acoustics</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 5. 학명 유래 아코디언 (etymologyText가 존재할 때만 렌더링) */}
                        {etymologyText && etymologyText.trim().length > 0 && (
                          <div className="rounded-xl border border-stone-200/80 bg-white overflow-hidden shadow-2xs transition-all">
                            <button
                              type="button"
                              onClick={() => toggleCategory('etymology')}
                              className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-stone-50/80 transition-colors cursor-pointer gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                                <span className="text-xs font-bold text-stone-900 tracking-tight flex items-center gap-1.5 shrink-0">
                                  <span>📖</span>
                                  <span>이름 유래</span>
                                </span>
                                {etymologyBadges.slice(0, 4).map((badge, idx) => (
                                  <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/60">
                                    #{badge}
                                  </span>
                                ))}
                              </div>
                              <span className="text-stone-400 p-1 shrink-0">
                                {expandedCategories.etymology ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </span>
                            </button>

                            {expandedCategories.etymology && (
                              <div className="px-3.5 pb-3.5 pt-1 border-t border-stone-100 bg-stone-50/30 space-y-2">
                                <p className="text-xs text-stone-700 font-normal leading-relaxed bg-white p-3 rounded-lg border border-stone-200/60">
                                  {etymologyText}
                                </p>
                                <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between text-[11px] text-stone-500">
                                  <span className="flex items-center gap-1 font-medium">
                                    <span className="text-emerald-700 font-semibold">🏛️ 출처:</span>
                                    <span className="text-stone-700">{API_SOURCES.etymology.fullLabel}</span>
                                  </span>
                                  <span className="text-[10px] font-mono text-stone-400 shrink-0">GBIF Backbone</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 6. 보전상태 아코디언 (보전상태 상태 또는 특이사항이 실제로 존재할 때만 렌더링) */}
                        {((!isFungi && ecoDetail?.status && ecoDetail.status.trim().length > 0) || (effectiveSpecialNotes && effectiveSpecialNotes.trim().length > 0)) && (
                          <div className="rounded-xl border border-stone-200/80 bg-white overflow-hidden shadow-2xs transition-all">
                            <button
                              type="button"
                              onClick={() => toggleCategory('funFact')}
                              className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-stone-50/80 transition-colors cursor-pointer gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                                <span className="text-xs font-bold text-stone-900 tracking-tight flex items-center gap-1.5 shrink-0">
                                  <span>📌</span>
                                  <span>보전 상태</span>
                                </span>
                                {globalProfile.tierMeta && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                    globalProfile.iucnCategory === 'CR' ? 'bg-rose-50 text-rose-900 border-rose-200' :
                                    globalProfile.iucnCategory === 'EN' ? 'bg-orange-50 text-orange-900 border-orange-200' :
                                    globalProfile.iucnCategory === 'VU' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                                    globalProfile.iucnCategory === 'NT' ? 'bg-lime-50 text-lime-900 border-lime-200' :
                                    'bg-emerald-50 text-emerald-900 border-emerald-200'
                                  }`}>
                                    #{globalProfile.tierMeta.code}
                                  </span>
                                )}
                              </div>
                              <span className="text-stone-400 p-1 shrink-0">
                                {expandedCategories.funFact ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </span>
                            </button>

                            {expandedCategories.funFact && (
                              <div className="px-3.5 pb-3.5 pt-1 border-t border-stone-100 bg-stone-50/30 space-y-2">
                                {effectiveSpecialNotes && (
                                  <p className="text-xs text-stone-700 font-normal leading-relaxed bg-white p-3 rounded-lg border border-stone-200/60">
                                    {effectiveSpecialNotes}
                                  </p>
                                )}
                                <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between text-[11px] text-stone-500">
                                  <span className="flex items-center gap-1 font-medium">
                                    <span className="text-amber-700 font-semibold">🏛️ 출처:</span>
                                    <span className="text-stone-700">{isFungi ? '국립산림과학원 산림생태계 안전 가이드라인' : API_SOURCES.conservation.fullLabel}</span>
                                  </span>
                                  <span className="text-[10px] font-mono text-stone-400 shrink-0">{isFungi ? 'Forest Fungi Safe Guide' : 'IUCN Red List'}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 7. 번식 및 생활사 (데이터가 있을 때만 렌더링) */}
                        {ecoDetail?.lynxBirdLifeNote && ecoDetail.lynxBirdLifeNote.trim().length > 0 && (
                          <div className="rounded-xl border border-stone-200/80 bg-white overflow-hidden shadow-2xs transition-all">
                            <button
                              type="button"
                              onClick={() => toggleCategory('breeding')}
                              className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-stone-50/80 transition-colors cursor-pointer gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                                <span className="text-xs font-bold text-stone-900 tracking-tight flex items-center gap-1.5 shrink-0">
                                  <span>🐣</span>
                                  <span>번식 및 생활사</span>
                                </span>
                                {breedingBadges.slice(0, 4).map((badge, idx) => (
                                  <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/60">
                                    #{badge}
                                  </span>
                                ))}
                              </div>
                              <span className="text-stone-400 p-1 shrink-0">
                                {expandedCategories.breeding ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </span>
                            </button>

                            {expandedCategories.breeding && (
                              <div className="px-3.5 pb-3.5 pt-1 border-t border-stone-100 bg-stone-50/30 space-y-2">
                                <p className="text-xs text-stone-700 font-normal leading-relaxed bg-white p-3 rounded-lg border border-stone-200/60">
                                  {ecoDetail.lynxBirdLifeNote}
                                </p>
                                <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between text-[11px] text-stone-500">
                                  <span className="flex items-center gap-1 font-medium">
                                    <span className="text-emerald-700 font-semibold">🏛️ 출처:</span>
                                    <span className="text-stone-700">{API_SOURCES.taxonomy.fullLabel}</span>
                                  </span>
                                  <span className="text-[10px] font-mono text-stone-400 shrink-0">GBIF Life History</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                      </div>

                    </div>
                  );
                })()}

                {/* 관찰 필드노트 & 생태 데이터 분석 차트 통합 2열 레이아웃 */}
                {(() => {
                  const hasFieldNotes = Boolean(
                    ecoDetail?.bestObservationTip?.trim() ||
                    ecoDetail?.photoGearTip?.trim() ||
                    ecoDetail?.fieldEtiquette?.trim()
                  );

                  if (!hasFieldNotes && !ecoDetail) {
                    return null;
                  }

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                      {/* Left: 현장 탐사 필드노트 가이드 (col-span-6) - bestObservationTip, photoGearTip, fieldEtiquette 중 하나라도 있을 때만 렌더링 */}
                      {hasFieldNotes && (
                        <div className="lg:col-span-6 bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs space-y-4 flex flex-col justify-between">
                          <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-stone-150 pb-3">
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-stone-900 tracking-tight flex items-center gap-2">
                            <span>📓 실전 필드노트</span>
                          </h3>
                          <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                            현장 관찰·동정 가이드 및 항목별 공인 생태 API 연동 데이터
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300 shrink-0">
                          탐사 가이드
                        </span>
                      </div>
                      
                      {/* 1. 실전 구별 포인트 (Key Diagnostic Characters & Morphological Traits) */}
                      {ecoDetail?.keyIdentification && (
                        <div className="bg-stone-50/90 p-3.5 rounded-xl border border-stone-200/90 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center text-[10px]">🔍</span>
                              <span>실전 동정 & 구별 포인트</span>
                            </span>
                            <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              형질 동정
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm leading-relaxed text-stone-800 font-medium bg-white p-3 rounded-lg border border-stone-200/70">
                            {ecoDetail.keyIdentification}
                          </p>
                          {/* Item 1 API Source Attribution */}
                          <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10.5px] text-stone-500">
                            <span className="flex items-center gap-1 font-medium truncate mr-2">
                              <span className="text-emerald-700 font-semibold shrink-0">🏛️ 연동 API:</span>
                              <span className="text-stone-700 truncate">{API_SOURCES.keyIdentification.fullLabel}</span>
                            </span>
                            <span className="text-[9.5px] font-mono text-stone-400 shrink-0">{API_SOURCES.keyIdentification.shortTag}</span>
                          </div>
                        </div>
                      )}

                      {/* 2. 현장 관찰 및 촬영 팁 (Field Observation & Photography Guide - only rendered if bestObservationTip is provided) */}
                      {ecoDetail?.bestObservationTip && ecoDetail.bestObservationTip.trim().length > 0 && (
                        <div className="bg-stone-50/90 p-3.5 rounded-xl border border-stone-200/90 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">📍</span>
                              <span>현장 관찰 및 생태 촬영 가이드</span>
                            </span>
                            {ecoDetail?.categoryFocus && (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300">
                                {ecoDetail.categoryFocus}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm leading-relaxed text-stone-800 font-medium bg-white p-3 rounded-lg border border-stone-200/70">
                            {ecoDetail.bestObservationTip}
                          </p>
                          {/* Item 2 API Source Attribution */}
                          <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10.5px] text-stone-500">
                            <span className="flex items-center gap-1 font-medium truncate mr-2">
                              <span className="text-emerald-700 font-semibold shrink-0">🏛️ 연동 API:</span>
                              <span className="text-stone-700 truncate">{API_SOURCES.observationGuide.fullLabel}</span>
                            </span>
                            <span className="text-[9.5px] font-mono text-stone-400 shrink-0">{API_SOURCES.observationGuide.shortTag}</span>
                          </div>
                        </div>
                      )}

                      {/* 3. 월별 관찰 빈도 히스토그램 (iNaturalist Live Phenology Histogram) */}
                      <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-800 flex items-center justify-center text-[10px]">📅</span>
                            <span>월별 관찰 빈도 (iNaturalist 실시간 집계)</span>
                          </span>
                          <span className="text-[11px] font-extrabold text-emerald-800 bg-white/90 px-2.5 py-0.5 rounded-md border border-emerald-300">
                            {ecoDetail?.seasonality || '사계절 관찰 가능'}
                          </span>
                        </div>

                        {/* 12-Month Bar Chart Sparkline directly from authentic iNaturalist API */}
                        {(() => {
                          const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
                          const rawCounts: number[] = monthNames.map((_, idx) => (inatHistogram && inatHistogram[idx + 1] !== undefined ? inatHistogram[idx + 1] : 0));
                          const totalObs = rawCounts.reduce((sum, c) => sum + c, 0);
                          const maxCount = Math.max(...rawCounts, 0);
                          const hasRealHist = inatHistogram && totalObs > 0;

                          return (
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between text-[11px] text-emerald-950 font-bold">
                                <span>월별 글로벌 관찰 레코드:</span>
                                <span className="text-[10.5px] font-mono text-emerald-800">
                                  {hasRealHist ? `총 ${totalObs.toLocaleString()}건 집계` : (isLoadingInat ? '데이터 집계 중...' : '기록 대기 중')}
                                </span>
                              </div>

                              {hasRealHist ? (
                                <div className="grid grid-cols-12 gap-1 items-end h-16 px-1 bg-white/95 p-2 rounded-lg border border-emerald-200/80">
                                  {rawCounts.map((rawCount, idx) => {
                                    const percentage = maxCount > 0 ? (rawCount / maxCount) : 0;
                                    const isPeak = rawCount === maxCount && rawCount > 0;
                                    return (
                                      <div key={idx} className="flex flex-col items-center h-full justify-end group relative" title={`${monthNames[idx]}: ${rawCount.toLocaleString()}건 글로벌 관찰`}>
                                        <span className="text-[7.5px] font-mono text-stone-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-0.5 truncate max-w-full">
                                          {rawCount >= 1000 ? `${(rawCount / 1000).toFixed(1)}k` : rawCount}
                                        </span>
                                        <div
                                          className={`w-full rounded-t transition-all duration-300 ${
                                            isPeak
                                              ? 'bg-emerald-800 shadow-xs'
                                              : percentage >= 0.5
                                              ? 'bg-emerald-600'
                                              : percentage > 0.1
                                              ? 'bg-emerald-400'
                                              : rawCount > 0
                                              ? 'bg-emerald-300'
                                              : 'bg-stone-200'
                                          }`}
                                          style={{ height: `${Math.max(6, percentage * 44)}px` }}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="bg-white/80 p-3 rounded-lg border border-emerald-200 text-center text-xs text-stone-600 font-medium">
                                  {isLoadingInat ? (
                                    <span>iNaturalist 월별 관찰 히스토그램 로딩 중...</span>
                                  ) : (
                                    <span>해당 종의 iNaturalist 글로벌 월별 관찰 데이터를 동기화 중입니다. (자생 시기: {ecoDetail?.seasonality || '연중'})</span>
                                  )}
                                </div>
                              )}

                              <div className="grid grid-cols-12 gap-1 text-center font-mono text-[8.5px] text-emerald-900 font-bold pt-0.5">
                                {monthNames.map((m, idx) => {
                                  const isPeak = hasRealHist && rawCounts[idx] === maxCount && maxCount > 0;
                                  return (
                                    <span key={idx} className={isPeak ? 'text-emerald-950 font-extrabold underline' : ''}>
                                      {m}
                                    </span>
                                  );
                                })}
                              </div>

                              {/* Item 3 API Source Attribution */}
                              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[10.5px] text-emerald-900">
                                <span className="flex items-center gap-1 font-medium truncate mr-2">
                                  <span className="text-emerald-800 font-bold shrink-0">🏛️ 연동 API:</span>
                                  <span className="text-emerald-950 truncate">{API_SOURCES.phenologyHistogram.fullLabel}</span>
                                </span>
                                <span className="text-[9.5px] font-mono text-emerald-700 shrink-0">{API_SOURCES.phenologyHistogram.shortTag}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* 4 & 5. 서식 환경 & 주요 관찰 장비 및 에티켓 */}
                    {(() => {
                      const hasHabitat = !!(ecoDetail?.habitat?.trim() || specimen.habitatType?.trim());
                      const hasGear = !!(ecoDetail?.photoGearTip?.trim());
                      const hasEtiquette = !!(ecoDetail?.fieldEtiquette?.trim());
                      const hasGearOrEtiquette = hasGear || hasEtiquette;

                      if (!hasHabitat && !hasGearOrEtiquette) return null;

                      return (
                        <div className={`grid grid-cols-1 ${hasHabitat && hasGearOrEtiquette ? 'sm:grid-cols-2' : ''} gap-2.5 pt-2 border-t border-stone-100`}>
                          {/* 4. 선호 서식처 환경 */}
                          {hasHabitat && (
                            <div className="bg-stone-50/90 p-3.5 rounded-xl border border-stone-200/80 space-y-2 flex flex-col justify-between">
                              <div className="space-y-1.5">
                                <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                                  <span>🌿 선호 서식처 환경</span>
                                </span>
                                <p className="text-[11px] text-stone-700 leading-relaxed font-medium bg-white p-2.5 rounded-lg border border-stone-200/60">
                                  {ecoDetail?.habitat?.trim() || specimen.habitatType}
                                </p>
                              </div>
                              {/* Item 4 API Source Attribution */}
                              <div className="pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-500">
                                <span className="flex items-center gap-1 font-medium truncate mr-1">
                                  <span className="text-emerald-700 font-semibold shrink-0">🏛️ 출처:</span>
                                  <span className="text-stone-700 truncate">{API_SOURCES.habitatField.fullLabel}</span>
                                </span>
                                <span className="text-[9px] font-mono text-stone-400 shrink-0">{API_SOURCES.habitatField.shortTag}</span>
                              </div>
                            </div>
                          )}

                          {/* 5. 추천 탐사 장비 & 야생 에티켓 (only if either gear or etiquette exists) */}
                          {hasGearOrEtiquette && (
                            <div className="bg-stone-50/90 p-3.5 rounded-xl border border-stone-200/80 space-y-2 flex flex-col justify-between">
                              <div className="space-y-1.5">
                                <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                                  <span>🎒 추천 탐사 장비 & 야생 에티켓</span>
                                </span>
                                <div className="text-[11px] text-stone-700 leading-relaxed font-medium space-y-1 bg-white p-2.5 rounded-lg border border-stone-200/60">
                                  {hasGear && (
                                    <p><strong className="text-stone-900">장비:</strong> {ecoDetail!.photoGearTip}</p>
                                  )}
                                  {hasEtiquette && (
                                    <p><strong className="text-stone-900">에티켓:</strong> {ecoDetail!.fieldEtiquette}</p>
                                  )}
                                </div>
                              </div>
                              {/* Item 5 API Source Attribution */}
                              <div className="pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-500">
                                <span className="flex items-center gap-1 font-medium truncate mr-1">
                                  <span className="text-emerald-700 font-semibold shrink-0">🏛️ 출처:</span>
                                  <span className="text-stone-700 truncate">{API_SOURCES.fieldEtiquette.fullLabel}</span>
                                </span>
                                <span className="text-[9px] font-mono text-stone-400 shrink-0">{API_SOURCES.fieldEtiquette.shortTag}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* General Summary Footer of Field Notes Card */}
                    <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between text-[11px] text-stone-500">
                      <span className="flex items-center gap-1 font-medium">
                        <span className="text-emerald-700 font-semibold">🏛️ 필드노트 종합:</span>
                        <span className="text-stone-700">{API_SOURCES.fieldNotes.fullLabel}</span>
                      </span>
                      <span className="text-[10px] font-mono text-stone-400 shrink-0">GBIF · iNat · NIE</span>
                    </div>
                  </div>
                )}

                {/* Right: Pokédex Eco-Gauge Stat Card (포켓몬 도감 스타일 에코 게이지 카드) */}
                {ecoDetail && (
                  <div className={`${hasFieldNotes ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col justify-between`}>
                    <EcoDexGaugeCard
                      specimen={specimen}
                      ecoDetail={ecoDetail}
                      photoArtScoreDetail={photoArtScore}
                    />
                  </div>
                )}
              </div>
            );
          })()}
                
                {/* External Multi-API Biodiversity Verification Section */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-stone-900 flex items-center gap-1.5 uppercase tracking-wide">
                        <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                        <span>생물다양성 검증 데이터</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 ml-1">
                          {getIdentificationSourceMetadata('general').tag}
                        </span>
                      </h3>
                      <p className="text-[10px] text-stone-500 font-medium mt-0.5">
                        출처: {getIdentificationSourceMetadata('general').sourceName} • {getIdentificationSourceMetadata('general').lastUpdated}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-300 shrink-0">
                      공인 API 검증 완료
                    </span>
                  </div>

                  {/* Real iNaturalist Biological Taxonomy Lineage Chain */}
                  {inatAncestors && inatAncestors.length > 0 && (
                    <div className="p-3 bg-white rounded-xl border border-stone-200/90 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase flex items-center gap-1">
                          <span>🧬 iNaturalist 글로벌 표준 계통 분류 체인</span>
                        </span>
                        <span className="text-[9px] font-mono text-stone-500 font-bold">글로벌 계통분류</span>
                      </div>
                      <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-mono pb-1 pt-0.5 scrollbar-thin">
                        {inatAncestors
                          .filter(a => ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'].includes(a.rank))
                          .map((ancestor, i, arr) => {
                            const rankMap: Record<string, string> = {
                              kingdom: '계', phylum: '문', class: '강', order: '목', family: '과', genus: '속'
                            };
                            const rankKo = rankMap[ancestor.rank.toLowerCase()] || ancestor.rank;
                            return (
                              <React.Fragment key={ancestor.name || i}>
                                <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200 whitespace-nowrap text-stone-800 font-semibold" title={`계통분류: ${rankKo} (${ancestor.name})`}>
                                  <span className="text-[9px] text-stone-500 mr-1 font-bold">[{rankKo}]</span>
                                  {ancestor.preferred_common_name || ancestor.name}
                                </span>
                                {i < arr.length - 1 && (
                                  <span className="text-stone-300 font-bold shrink-0">›</span>
                                )}
                              </React.Fragment>
                            );
                          })}
                        <span className="text-stone-300 font-bold shrink-0">›</span>
                        <span className="bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded border border-emerald-300 font-bold whitespace-nowrap">
                          {specimen.koreanName}
                        </span>
                      </div>
                    </div>
                  )}

                  {inatData?.wikipedia_summary && (
                    <div className="p-3 bg-white rounded-xl border border-stone-200/90 text-xs text-stone-800 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-blue-700 block uppercase">
                        iNaturalist - 글로벌 생물다양성 데이터 요약
                      </span>
                      <p className="leading-relaxed font-medium text-stone-800 line-clamp-3">
                        {inatData.wikipedia_summary}
                      </p>
                    </div>
                  )}

                  {/* 3-Core API Data Verification Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {/* 1. iNaturalist API */}
                    {inatData ? (
                      <a 
                        href={`https://www.inaturalist.org/taxa/${inatData.id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 hover:bg-blue-100 hover:border-blue-300 transition-all block group"
                      >
                        <span className="text-[10px] text-blue-700 font-bold flex justify-between items-center mb-0.5">
                          iNaturalist API <ExternalLink className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                        <span className="font-mono font-bold text-stone-800 block truncate" title={inatData.name}>분류군 고유 ID #{inatData.id} • {inatData.name}</span>
                        <span className="text-[9.5px] text-stone-500 mt-0.5 block">
                          {inatData.observations_count ? `글로벌 ${inatData.observations_count.toLocaleString()}건 관찰 기록` : '커뮤니티 동정 완료'}
                        </span>
                      </a>
                    ) : (
                      <a
                        href={`https://www.inaturalist.org/search?q=${encodeURIComponent(specimen.scientificName || specimen.koreanName)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/60 hover:bg-blue-100/70 transition-all block group"
                      >
                        <span className="text-[10px] text-blue-700 font-bold flex justify-between items-center mb-0.5">
                          iNaturalist API <ExternalLink className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                        <span className="font-mono font-bold text-stone-800 block truncate">{specimen.scientificName}</span>
                        <span className="text-[9.5px] text-stone-500 block">글로벌 관찰 네트워크 검색</span>
                      </a>
                    )}
                    
                    {/* 2. GBIF Backbone API */}
                    {gbifData ? (
                      <a 
                        href={`https://www.gbif.org/species/${gbifData.usageKey}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300 transition-all block group"
                      >
                        <span className="text-[10px] text-emerald-800 font-bold flex justify-between items-center mb-0.5">
                          GBIF Backbone API <ExternalLink className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                        <span className="font-mono font-bold text-stone-800 block truncate" title={gbifData.scientificName}>GBIF 고유키 #{gbifData.usageKey} • {gbifData.scientificName}</span>
                        <span className="text-[9.5px] text-stone-500 mt-0.5 block">
                          분류학적 지위: {gbifData.status === 'ACCEPTED' ? '정식 승인 (ACCEPTED)' : gbifData.status || '정식 승인 (ACCEPTED)'}
                        </span>
                      </a>
                    ) : (
                      <a
                        href={`https://www.gbif.org/species/search?q=${encodeURIComponent(specimen.scientificName || specimen.koreanName)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60 hover:bg-emerald-100/70 transition-all block group"
                      >
                        <span className="text-[10px] text-emerald-800 font-bold flex justify-between items-center mb-0.5">
                          GBIF Backbone API <ExternalLink className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                        <span className="font-mono font-bold text-stone-800 block truncate">{specimen.scientificName}</span>
                        <span className="text-[9.5px] text-stone-500 block">세계생물다양성 통합 분류체계</span>
                      </a>
                    )}

                    {/* 3. IUCN Red List Global API */}
                    <a
                      href={`https://www.iucnredlist.org/search?query=${encodeURIComponent(specimen.scientificName)}`}
                      target="_blank" 
                      rel="noreferrer"
                      className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100 hover:border-amber-300 transition-all block group"
                    >
                      <span className="text-[10px] text-amber-800 font-bold flex justify-between items-center mb-0.5">
                        IUCN Red List Global <ExternalLink className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                      <span className="font-mono font-bold text-stone-800 block truncate">
                        {ecoDetail?.status || '관심대상 (Least Concern, LC)'}
                      </span>
                      <span className="text-[9.5px] text-stone-500 block truncate">
                        {API_SOURCES.conservation.fullLabel}
                      </span>
                    </a>
                  </div>

                  {/* Fungi Safety Warning Notice Footer if Fungi */}
                  {specimen.category === 'fungi' && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-[11px] text-rose-950 flex items-start gap-2">
                      <span className="text-base shrink-0">🔬</span>
                      <div>
                        <strong className="font-bold text-rose-900 block">야생 버섯 및 균류 식독 안전 주의 수칙</strong>
                        <span className="text-rose-800/90 leading-tight block mt-0.5">
                          야생 균류는 생육 단계와 환경에 따라 외형 변이가 크고 유사 독버섯과의 오동정 위험이 높습니다. 본 도감의 정보는 글로벌 생태 학습 및 사진 동정 참고용이며, 야생에서 채취한 버섯의 무단 식용은 생명을 위협할 수 있습니다.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI 생태학자 대화 배너 */}
            <div
              onClick={() => setIsAiChatOpen(true)}
              className="pt-2 text-center cursor-pointer text-stone-400 hover:text-stone-700 transition-colors"
            >
              <span className="text-xs font-medium tracking-tight">더 궁금한 내용은 AI 생태학자에게 물어보아요 💬</span>
            </div>
          </div>

          {/* Floating AI Naturalist Button */}
          <div className="fixed bottom-4 right-4 z-40">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsAiChatOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-stone-900 hover:bg-emerald-800 text-white shadow-xl border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              title="AI 생태학자에게 질문하기"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">AI 생태학자</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Edit Specimen Modal */}
      {/* Full-Screen Lightbox Zoom Modal (새창으로 크게보기 - X버튼 + 테마/우표 스티커 전환) */}
      <AnimatePresence>
        {isZoomModalOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[120] bg-stone-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none"
          >
            {/* Top Bar: Title & X Close Button */}
            <div className="flex items-center justify-between text-white pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Maximize2 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-black text-white">{specimen.koreanName}</h3>
                  <p className="text-[10px] text-stone-400 font-mono">새창 크게보기 모드 · 관찰사진 #{selectedObservationIndex + 1}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                title="닫기"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Middle Canvas Stage: Enlarged Image Frame with Theme Applied */}
            <div className="flex-1 flex items-center justify-center my-3 overflow-hidden relative">
              <div className="w-full max-w-sm sm:max-w-md aspect-square bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center relative">
                {visualTheme === 'photo' && (
                  <img
                    src={currentObsPhoto}
                    alt={specimen.koreanName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                )}

                {visualTheme === 'sticker_classic' && (
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

                {visualTheme === 'stamp_vintage' && (
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

                {visualTheme === 'collector_card' && (
                  <div className="w-full h-full flex items-center justify-center p-4 bg-radial from-stone-900 to-black">
                    <div className="relative w-[260px] h-[290px] rounded-2xl bg-gradient-to-b from-stone-800 via-stone-900 to-stone-950 p-3 shadow-2xl border-2 border-amber-400/50 flex flex-col justify-between text-white">
                      <div className="flex items-center justify-between border-b border-amber-400/30 pb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-black text-amber-400">
                            {specimen.number || 'No.001'}
                          </span>
                          <h4 className="text-xs font-black text-white">
                            {specimen.koreanName}
                          </h4>
                        </div>
                        <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-1.5 py-0.5 rounded-md">
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
                          <span className="text-[10px] font-mono font-bold text-amber-300">
                            {photoArtScore.pose}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-stone-400 block">배율</span>
                          <span className="text-[10px] font-mono font-bold text-amber-300">
                            {photoArtScore.zoom}
                          </span>
                        </div>
                        <div>
                          <span className="text-[8px] text-stone-400 block">선명도</span>
                          <span className="text-[10px] font-mono font-bold text-amber-300">
                            {photoArtScore.sharpness}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Theme Control Bar in Lightbox */}
            <div className="space-y-2.5 bg-stone-900/90 backdrop-blur-md p-3 rounded-2xl border border-white/15">
              <p className="text-[11px] text-stone-300 font-bold text-center">
                🎨 스티커 · 빈티지 우표 · 컬렉터 카드 테마 선택
              </p>
              <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-none py-0.5">
                {visualThemesList.map((item) => {
                  const isActive = visualTheme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVisualTheme(item.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap ${
                        isActive
                          ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300 shadow-lg'
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
          </motion.div>
        )}
      </AnimatePresence>

      {isEditModalOpen && onUpdateSpecimen && (
        <EditSpecimenModal
          specimen={specimen}
          activeObsIndex={selectedObservationIndex}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(updated) => {
            onUpdateSpecimen(updated);
            setIsEditModalOpen(false);
          }}
        />
      )}

      {/* AI Chatbot Modal */}
      {isAiChatOpen && (
        <AiChatbotModal
          specimen={specimen}
          ecoDetail={ecoDetail}
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
    </>
  );
};
