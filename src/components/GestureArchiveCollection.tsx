import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Specimen, UserStats, SpecimenCategory } from '../types';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';
import { formatSpeciesDisplayName } from '../utils/speciesNameHelper';

interface GestureArchiveCollectionProps {
  specimens: Specimen[];
  onSelectSpecimen: (sp: Specimen) => void;
  userStats: UserStats;
  selectedCategory: SpecimenCategory;
}

interface DockedPair {
  specimenA: Specimen;
  specimenB: Specimen;
}

type CollectionViewMode = 'gallery' | 'sticker';

interface CladeSpecimenGroup {
  id: string;
  indexStr: string; // e.g. "01", "02"
  koreanName: string; // e.g. "곤충강", "딱정벌레목"
  latinName: string; // e.g. "INSECTA", "COLEOPTERA"
  shortDesc: string; // e.g. "외골격 딱지날개 곤충", "육상 절지동물 곤충군"
  specimens: Specimen[];
}

// Major biological clades info for 'all' mode
const CATEGORY_CLADE_INFO: Record<string, { korean: string; latin: string; desc: string }> = {
  insects: { korean: '곤충강', latin: 'Insecta', desc: '육상 절지동물 곤충군' },
  plants: { korean: '식물계', latin: 'Plantae', desc: '광합성 관속식물군' },
  birds: { korean: '조강', latin: 'Aves', desc: '비행 척추동물 조류군' },
  mammals: { korean: '포유강', latin: 'Mammalia', desc: '온혈 척추동물 포유류' },
  fungi: { korean: '균계', latin: 'Fungi', desc: '포자 생식 진핵 균류' },
  amphibians: { korean: '양서강', latin: 'Amphibia', desc: '수륙양용 변온 척추동물' },
  reptiles: { korean: '파충강', latin: 'Reptilia', desc: '비늘 표피 변온 파충류' },
  herptiles: { korean: '양서·파충류', latin: 'Herpetofauna', desc: '수륙 변온 척추동물' },
  fishes: { korean: '어류', latin: 'Pisces', desc: '수생 아가미 호흡 척추동물' },
  arachnids: { korean: '거미강', latin: 'Arachnida', desc: '8족 육식 협각류' },
  mollusks: { korean: '연체동물문', latin: 'Mollusca', desc: '패각 및 연체동물' },
  crustaceans: { korean: '갑각아문', latin: 'Crustacea', desc: '수생 절지동물' },
  invertebrates: { korean: '무척추동물군', latin: 'Invertebrata', desc: '절지·연체 복합 무척추동물' },
  others: { korean: '기타 생물군', latin: 'Biota', desc: '자연 생태계 특수 표본' },
};

// Taxonomic Order (목) detailed descriptions & latin mappings
const ORDER_INFO_MAP: Record<string, { latin: string; desc: string }> = {
  // 곤충 (Insects)
  '딱정벌레목': { latin: 'Coleoptera', desc: '외골격 딱지날개 곤충' },
  '나비목': { latin: 'Lepidoptera', desc: '인분 날개와 흡관 구기' },
  '잠자리목': { latin: 'Odonata', desc: '그물맥 날개 수렵 비행' },
  '벌목': { latin: 'Hymenoptera', desc: '화분 매개 사회성 곤충' },
  '노린재목': { latin: 'Hemiptera', desc: '침형 구기 흡즙성 곤충' },
  '메뚜기목': { latin: 'Orthoptera', desc: '도약 뒷다리와 직시류' },
  '파리목': { latin: 'Diptera', desc: '평균곤 2익 기동 비행' },
  '사마귀목': { latin: 'Mantodea', desc: '포획 낫 앞다리 육식 곤충' },
  // 식물 (Plants)
  '장미목': { latin: 'Rosales', desc: '5수성 꽃과 목본 식물' },
  '국화목': { latin: 'Asterales', desc: '두상화서와 관모 씨앗' },
  '참나무목': { latin: 'Fagales', desc: '도토리 견과 활엽수림' },
  '천남성목': { latin: 'Alismatales', desc: '육수화서와 불염포 초본' },
  '꿀풀목': { latin: 'Lamiales', desc: '순형 화관과 방향 식물' },
  '백합목': { latin: 'Liliales', desc: '3수성 꽃과 비늘줄기' },
  '비비추목': { latin: 'Asparagales', desc: '다년생 구근 관상 식물' },
  '미나리아재비목': { latin: 'Ranunculales', desc: '다심피 원시성 온대 식물' },
  '소나무목': { latin: 'Pinales', desc: '구과 솔방울 침엽 상록수' },
  '구과목': { latin: 'Pinales', desc: '구과 솔방울 침엽 상록수' },
  '포도목': { latin: 'Vitales', desc: '덩굴손과 장과 열매 목본' },
  '벼목': { latin: 'Poales', desc: '영화 꽃차례 평행맥 초본' },
  // 조류 (Birds)
  '참새목': { latin: 'Passeriformes', desc: '3전 1후 명금류 텃새' },
  '기러기목': { latin: 'Anseriformes', desc: '물갈퀴 편평 부리 수조류' },
  '도요목': { latin: 'Charadriiformes', desc: '갯벌 연안 적응 섭금류' },
  '사다새목': { latin: 'Pelecaniformes', desc: '긴 목과 수변 섭금류' },
  '수리목': { latin: 'Accipitriformes', desc: '갈고리 부리 맹금류' },
  '비둘기목': { latin: 'Columbiformes', desc: '선낭 작낭유 비행 조류' },
  // 포유류 (Mammals)
  '설치목': { latin: 'Rodentia', desc: '무한 성장 앞니 소형 포유류' },
  '식육목': { latin: 'Carnivora', desc: '열육치 발달 육식 포유류' },
  '우제목': { latin: 'Artiodactyla', desc: '짝수 발굽 반추위 유제류' },
  '토끼목': { latin: 'Lagomorpha', desc: '상악 2쌍 절치 초식 포유류' },
  // 기타 (Others)
  '무미목': { latin: 'Anura', desc: '도약 뒷다리 양서류' },
  '뱀목': { latin: 'Squamata', desc: '비늘 표피 가동성 파충류' },
  '잉어목': { latin: 'Cypriniformes', desc: '인두치 부레 담수 어류' },
  '주름버섯목': { latin: 'Agaricales', desc: '방사상 주름살 담자균' },
  '구멍장이버섯목': { latin: 'Polyporales', desc: '관공 미세 구멍 목질 균류' },
  '병안목': { latin: 'Stylommatophora', desc: '자루 끝 눈 육상 달팽이' },
  '거미목': { latin: 'Araneae', desc: '방적돌기 8족 협각류' },
  '십각목': { latin: 'Decapoda', desc: '집게다리 10족 갑각류' },
};

export const GestureArchiveCollection: React.FC<GestureArchiveCollectionProps> = ({
  specimens,
  onSelectSpecimen,
  userStats,
  selectedCategory,
}) => {
  // -------------------------------------------------------------
  // PRIMARY VIEW MODE: Gallery Card View vs Sticker Album View
  // Dribbble-tier morphing segmented pill switcher
  // -------------------------------------------------------------
  const [viewMode, setViewMode] = useState<CollectionViewMode>('gallery');

  // -------------------------------------------------------------
  // GALLERY DENSITY PINCH (0 = Compact, 1 = Expanded Spacious)
  // -------------------------------------------------------------
  const [viewMorphProgress, setViewMorphProgress] = useState<number>(0.8);
  const [isPinching, setIsPinching] = useState(false);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartProgress = useRef<number>(0.8);

  // -------------------------------------------------------------
  // LONG PRESS & SCRUB GESTURE
  // Holding and scrubbing reveals organic data spec layers with blur
  // -------------------------------------------------------------
  const [activeScrubId, setActiveScrubId] = useState<string | null>(null);
  const [scrubLevel, setScrubLevel] = useState<number>(0); // 0 (Visual), 1 (Taxonomy), 2 (Bio), 3 (Geospatial)
  const longPressTimer = useRef<any>(null);
  const touchStartY = useRef<number>(0);
  const isDraggingSpecimen = useRef(false);

  // -------------------------------------------------------------
  // DRAG & DOCK (Magnetic Snapping into Split Comparison Card)
  // -------------------------------------------------------------
  const [draggedSpecimenId, setDraggedSpecimenId] = useState<string | null>(null);
  const [hoveredDropTargetId, setHoveredDropTargetId] = useState<string | null>(null);
  const [dockedPair, setDockedPair] = useState<DockedPair | null>(null);

  // Filter specimens based on selectedCategory
  const filteredList = specimens.filter((sp) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'invertebrates') {
      return sp.category === 'arachnids' || sp.category === 'mollusks' || sp.category === 'crustaceans';
    }
    if (selectedCategory === 'herptiles') {
      return sp.category === 'amphibians' || sp.category === 'reptiles';
    }
    return sp.category === selectedCategory;
  });

  // Helper for encyclopedia details
  const getEcoDetail = (name: string) => {
    return SPECIES_ECOLOGY_ENCYCLOPEDIA.find(
      (e) => e.koreanName === name || name.includes(e.koreanName)
    );
  };

  // Helper to resolve the taxonomic Order (목) of a specimen
  const getSpecimenOrderKey = (sp: Specimen): { orderName: string; latin: string; desc: string } => {
    // 1. Check Encyclopedia order field
    const eco = getEcoDetail(sp.koreanName);
    if (eco?.order) {
      const match = eco.order.match(/^([가-힣]+목)/);
      if (match) {
        const name = match[1];
        const info = ORDER_INFO_MAP[name];
        return {
          orderName: name,
          latin: info?.latin || '',
          desc: info?.desc || '고유 생태 계통군',
        };
      }
    }

    // 2. Check taxonomyPath for element ending with '목'
    if (sp.taxonomyPath && Array.isArray(sp.taxonomyPath)) {
      const match = sp.taxonomyPath.find(
        (t) => t.endsWith('목') && !t.endsWith('과') && !t.endsWith('강') && !t.endsWith('문') && !t.endsWith('계')
      );
      if (match) {
        const info = ORDER_INFO_MAP[match];
        return {
          orderName: match,
          latin: info?.latin || '',
          desc: info?.desc || '고유 생태 계통군',
        };
      }
    }

    // 3. Fallbacks by family or name hints
    if (sp.category === 'insects') {
      if (sp.koreanName.includes('나비') || sp.koreanName.includes('나방')) {
        return { orderName: '나비목', latin: 'Lepidoptera', desc: ORDER_INFO_MAP['나비목'].desc };
      }
      if (sp.koreanName.includes('벌레') || sp.koreanName.includes('풍뎅이') || sp.koreanName.includes('사슴벌레')) {
        return { orderName: '딱정벌레목', latin: 'Coleoptera', desc: ORDER_INFO_MAP['딱정벌레목'].desc };
      }
      if (sp.koreanName.includes('잠자리')) {
        return { orderName: '잠자리목', latin: 'Odonata', desc: ORDER_INFO_MAP['잠자리목'].desc };
      }
      if (sp.koreanName.includes('벌') || sp.koreanName.includes('개미')) {
        return { orderName: '벌목', latin: 'Hymenoptera', desc: ORDER_INFO_MAP['벌목'].desc };
      }
      if (sp.koreanName.includes('매미') || sp.koreanName.includes('노린재')) {
        return { orderName: '노린재목', latin: 'Hemiptera', desc: ORDER_INFO_MAP['노린재목'].desc };
      }
      return { orderName: '곤충 계통군', latin: 'Insect Clade', desc: '다양한 곤충강 계통 표본' };
    }

    if (sp.category === 'plants') {
      if (sp.family?.includes('국화')) return { orderName: '국화목', latin: 'Asterales', desc: ORDER_INFO_MAP['국화목'].desc };
      if (sp.family?.includes('장미')) return { orderName: '장미목', latin: 'Rosales', desc: ORDER_INFO_MAP['장미목'].desc };
      if (sp.family?.includes('참나무')) return { orderName: '참나무목', latin: 'Fagales', desc: ORDER_INFO_MAP['참나무목'].desc };
      if (sp.family?.includes('천남성')) return { orderName: '천남성목', latin: 'Alismatales', desc: ORDER_INFO_MAP['천남성목'].desc };
      return { orderName: sp.family ? `${sp.family} 계통` : '식물 계통군', latin: 'Plantae Clade', desc: '초본 및 목본 관속식물' };
    }

    if (sp.category === 'birds') {
      if (sp.koreanName.includes('오리') || sp.koreanName.includes('기러기') || sp.koreanName.includes('원앙')) {
        return { orderName: '기러기목', latin: 'Anseriformes', desc: ORDER_INFO_MAP['기러기목'].desc };
      }
      return { orderName: '참새목', latin: 'Passeriformes', desc: ORDER_INFO_MAP['참새목'].desc };
    }

    const cleanFamily = sp.family ? sp.family.split(' ')[0] : '표본 계통군';
    return { orderName: cleanFamily, latin: '', desc: '자연 생태 표본 계통' };
  };

  // -------------------------------------------------------------
  // DYNAMIC GROUPING
  // 1. When selectedCategory === 'all':
  //    Group by Major Clade / Class (곤충강, 식물계, 조강 등)
  // 2. When selectedCategory !== 'all':
  //    Group by Taxonomic Order (목: 딱정벌레목, 나비목 등)
  // -------------------------------------------------------------
  const specimenGroups: CladeSpecimenGroup[] = useMemo(() => {
    if (filteredList.length === 0) return [];

    if (selectedCategory === 'all') {
      const categoryOrder: string[] = [
        'plants',
        'insects',
        'birds',
        'mammals',
        'herptiles',
        'fishes',
        'fungi',
        'invertebrates',
        'others',
      ];

      const groupedMap = new Map<string, Specimen[]>();
      for (const sp of filteredList) {
        let cat: string = sp.category || 'others';
        if (cat === 'amphibians' || cat === 'reptiles') cat = 'herptiles';
        if (cat === 'arachnids' || cat === 'mollusks' || cat === 'crustaceans') cat = 'invertebrates';
        if (!groupedMap.has(cat)) groupedMap.set(cat, []);
        groupedMap.get(cat)!.push(sp);
      }

      const groups: CladeSpecimenGroup[] = [];
      let index = 1;

      for (const catKey of categoryOrder) {
        const list = groupedMap.get(catKey);
        if (list && list.length > 0) {
          const info = CATEGORY_CLADE_INFO[catKey] || {
            korean: catKey,
            latin: 'Biota',
            desc: '자연 생태계 표본군',
          };
          groups.push({
            id: `clade-${catKey}`,
            indexStr: index.toString().padStart(2, '0'),
            koreanName: info.korean,
            latinName: info.latin.toUpperCase(),
            shortDesc: info.desc,
            specimens: list,
          });
          index++;
        }
      }

      for (const [catKey, list] of groupedMap.entries()) {
        if (!groups.some((g) => g.id === `clade-${catKey}`) && list.length > 0) {
          const info = CATEGORY_CLADE_INFO[catKey] || {
            korean: catKey,
            latin: 'Taxa',
            desc: '생태 표본군',
          };
          groups.push({
            id: `clade-${catKey}`,
            indexStr: index.toString().padStart(2, '0'),
            koreanName: info.korean,
            latinName: info.latin.toUpperCase(),
            shortDesc: info.desc,
            specimens: list,
          });
          index++;
        }
      }

      return groups;
    } else {
      const orderMap = new Map<string, { orderName: string; latin: string; desc: string; list: Specimen[] }>();

      for (const sp of filteredList) {
        const orderKeyInfo = getSpecimenOrderKey(sp);
        const key = orderKeyInfo.orderName;

        if (!orderMap.has(key)) {
          orderMap.set(key, {
            orderName: orderKeyInfo.orderName,
            latin: orderKeyInfo.latin,
            desc: orderKeyInfo.desc,
            list: [],
          });
        }
        orderMap.get(key)!.list.push(sp);
      }

      const groups: CladeSpecimenGroup[] = [];
      let index = 1;

      for (const [key, val] of orderMap.entries()) {
        groups.push({
          id: `order-${key}`,
          indexStr: index.toString().padStart(2, '0'),
          koreanName: val.orderName,
          latinName: val.latin ? val.latin.toUpperCase() : '',
          shortDesc: val.desc,
          specimens: val.list,
        });
        index++;
      }

      return groups;
    }
  }, [filteredList, selectedCategory]);

  // Deterministic micro-tilt angle for tactile sticker realism (-2.4deg to +2.4deg)
  const getStickerTilt = (id: string, index: number): number => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const angles = [-2.4, 1.8, -1.2, 2.2, -1.8, 1.5, -2.1, 2.0];
    const pick = Math.abs(hash + index) % angles.length;
    return angles[pick];
  };

  // -------------------------------------------------------------
  // TWO-FINGER PINCH LISTENER
  // -------------------------------------------------------------
  const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && viewMode === 'gallery') {
      setIsPinching(true);
      pinchStartDist.current = getTouchDistance(e.touches[0], e.touches[1]);
      pinchStartProgress.current = viewMorphProgress;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current !== null && viewMode === 'gallery') {
      const currentDist = getTouchDistance(e.touches[0], e.touches[1]);
      const delta = (currentDist - pinchStartDist.current) / 240;
      const newProgress = Math.max(0, Math.min(1, pinchStartProgress.current + delta));
      setViewMorphProgress(newProgress);
    }
  };

  const handleTouchEnd = () => {
    if (isPinching) {
      setIsPinching(false);
      pinchStartDist.current = null;
    }
  };

  // -------------------------------------------------------------
  // LONG PRESS & SCRUB LOGIC (GALLERY MODE)
  // -------------------------------------------------------------
  const handlePointerDownCard = (sp: Specimen, e: React.PointerEvent) => {
    touchStartY.current = e.clientY;
    isDraggingSpecimen.current = false;

    longPressTimer.current = setTimeout(() => {
      setActiveScrubId(sp.id);
      setScrubLevel(1);
    }, 220);
  };

  const handlePointerMoveCard = (e: React.PointerEvent) => {
    if (!activeScrubId) return;
    const deltaY = touchStartY.current - e.clientY;
    if (deltaY < -40) {
      setScrubLevel(0); // Master visual
    } else if (deltaY < 30) {
      setScrubLevel(1); // Taxonomy
    } else if (deltaY < 90) {
      setScrubLevel(2); // Bio & IUCN
    } else {
      setScrubLevel(3); // Geospatial & Field Vector
    }
  };

  const handlePointerUpCard = (sp: Specimen) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    if (activeScrubId) {
      setActiveScrubId(null);
      setScrubLevel(0);
    } else if (!isDraggingSpecimen.current) {
      onSelectSpecimen(sp);
    }
  };

  // -------------------------------------------------------------
  // DRAG & DOCK PROXIMITY CHECK
  // -------------------------------------------------------------
  const handleDragStart = (id: string) => {
    isDraggingSpecimen.current = true;
    setDraggedSpecimenId(id);
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleDrag = (_: any, info: any) => {
    const draggedEl = document.getElementById(`card-${draggedSpecimenId}`);
    if (!draggedEl) return;
    const draggedRect = draggedEl.getBoundingClientRect();
    const centerX = draggedRect.left + draggedRect.width / 2 + info.offset.x;
    const centerY = draggedRect.top + draggedRect.height / 2 + info.offset.y;

    let closestId: string | null = null;
    let minDistance = 90; // Snap threshold in px

    for (const other of filteredList) {
      if (other.id === draggedSpecimenId) continue;
      const otherEl = document.getElementById(`card-${other.id}`);
      if (!otherEl) continue;
      const r = otherEl.getBoundingClientRect();
      const ox = r.left + r.width / 2;
      const oy = r.top + r.height / 2;
      const dist = Math.sqrt((centerX - ox) ** 2 + (centerY - oy) ** 2);
      if (dist < minDistance) {
        minDistance = dist;
        closestId = other.id;
      }
    }
    setHoveredDropTargetId(closestId);
  };

  const handleDragEnd = () => {
    if (draggedSpecimenId && hoveredDropTargetId) {
      const spA = specimens.find((s) => s.id === draggedSpecimenId);
      const spB = specimens.find((s) => s.id === hoveredDropTargetId);
      if (spA && spB) {
        setDockedPair({ specimenA: spA, specimenB: spB });
      }
    }
    setDraggedSpecimenId(null);
    setHoveredDropTargetId(null);
    setTimeout(() => {
      isDraggingSpecimen.current = false;
    }, 100);
  };

  const cardRadius = Math.round(12 + viewMorphProgress * 14);
  const isSpaciousGallery = viewMorphProgress > 0.45;

  // Render individual Gallery Card
  const renderGalleryCard = (sp: Specimen) => {
    const isScrubbingThis = activeScrubId === sp.id;
    const isHoveredTarget = hoveredDropTargetId === sp.id;
    const isCurrentDrag = draggedSpecimenId === sp.id;
    const eco = getEcoDetail(sp.koreanName);

    return (
      <motion.div
        id={`card-${sp.id}`}
        key={sp.id}
        layout
        drag
        dragSnapToOrigin
        onDragStart={() => handleDragStart(sp.id)}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.05, zIndex: 50, shadow: '0 20px 30px rgba(0,0,0,0.2)' }}
        onPointerDown={(e) => handlePointerDownCard(sp, e)}
        onPointerMove={handlePointerMoveCard}
        onPointerUp={() => handlePointerUpCard(sp)}
        transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
        style={{
          borderRadius: `${cardRadius}px`,
        }}
        className={`relative overflow-hidden bg-white text-stone-900 border transition-colors select-none ${
          isHoveredTarget
            ? 'border-stone-900 ring-2 ring-stone-900 shadow-xl'
            : 'border-stone-200/90 shadow-2xs'
        } ${isCurrentDrag ? 'opacity-80' : 'opacity-100'}`}
      >
        {/* ORGANIC SCRUB OVERLAY */}
        <AnimatePresence>
          {isScrubbingThis && (
            <motion.div
              initial={{ opacity: 0, filter: 'blur(6px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(6px)' }}
              transition={{ duration: 0.16 }}
              className="absolute inset-0 z-30 bg-stone-950/95 text-white p-3.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 border-b border-stone-800 pb-2">
                <span className="font-bold text-white uppercase tracking-wider">
                  {scrubLevel === 0 && 'LAYER 0: MASTER VISUAL'}
                  {scrubLevel === 1 && 'LAYER 1: TAXONOMY'}
                  {scrubLevel === 2 && 'LAYER 2: BIOMETRICS'}
                  {scrubLevel === 3 && 'LAYER 3: GEOSPATIAL'}
                </span>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3].map((lvl) => (
                    <span
                      key={lvl}
                      className={`w-1.5 h-1.5 rounded-full ${
                        scrubLevel === lvl ? 'bg-white' : 'bg-stone-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="py-2 flex-1 flex flex-col justify-center">
                {scrubLevel === 1 && (
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between border-b border-stone-900 pb-1">
                      <span className="text-stone-500">KINGDOM:</span>
                      <span>{sp.category === 'plants' ? 'PLANTAE' : 'ANIMALIA'}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-900 pb-1">
                      <span className="text-stone-500">ORDER:</span>
                      <span className="truncate max-w-[130px] uppercase">{eco?.order || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-900 pb-1">
                      <span className="text-stone-500">BINOMIAL:</span>
                      <span className="italic text-emerald-400 truncate max-w-[130px]">
                        {sp.scientificName}
                      </span>
                    </div>
                  </div>
                )}

                {scrubLevel === 2 && (
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between border-b border-stone-900 pb-1">
                      <span className="text-stone-500">SCALE:</span>
                      <span className="truncate max-w-[130px]">{eco?.size || '중형 표본'}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-900 pb-1">
                      <span className="text-stone-500">IUCN:</span>
                      <span className="text-amber-400">{eco?.status?.split('•')[0] || 'LC'}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-900 pb-1">
                      <span className="text-stone-500">SEASON:</span>
                      <span className="truncate max-w-[130px]">{eco?.seasonality || '사계절'}</span>
                    </div>
                  </div>
                )}

                {scrubLevel === 3 && (
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between border-b border-stone-900 pb-1">
                      <span className="text-stone-500">LOCATION:</span>
                      <span className="truncate max-w-[130px]">{sp.locationCoord?.name || sp.habitatType || '야외'}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-900 pb-1">
                      <span className="text-stone-500">HABITAT:</span>
                      <span className="truncate max-w-[130px]">{sp.habitatType || '자연 환경'}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-900 pb-1">
                      <span className="text-stone-500">DATE:</span>
                      <span>{sp.observations?.[0]?.date || '2026.08'}</span>
                    </div>
                  </div>
                )}

                {scrubLevel === 0 && (
                  <div className="text-center font-mono text-[11px] text-stone-400 py-3">
                    손가락을 위/아래로 스크럽하여 내부 심층 데이터를 탐색하세요
                  </div>
                )}
              </div>

              <div className="text-[9px] font-mono text-stone-600 text-center uppercase tracking-wider">
                RELEASE TO CLOSE
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CARD BODY */}
        {isSpaciousGallery ? (
          <div className="p-3 flex flex-col justify-between h-full">
            <div
              className="aspect-square w-full bg-stone-100 overflow-hidden mb-2.5 relative"
              style={{ borderRadius: `${Math.max(6, cardRadius - 8)}px` }}
            >
              <img
                src={sp.originalImage || sp.stickerImage}
                alt={sp.koreanName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/85 text-white font-mono text-[9px] font-bold">
                {sp.number || '#001'}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-stone-900 truncate">
                {formatSpeciesDisplayName(sp, {
                  language: userStats?.language,
                  showEnglishNameWithLocal: userStats?.showEnglishNameWithLocal,
                })}
              </h4>
              <p className="text-[10px] font-mono text-stone-500 italic truncate mt-0.5">
                {sp.scientificName}
              </p>
              <div className="mt-1.5 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[9px] font-mono text-stone-400 uppercase">
                <span>{sp.category}</span>
                <span>{sp.observations?.length || 1} OBS</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden shrink-0">
              <img
                src={sp.originalImage || sp.stickerImage}
                alt={sp.koreanName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-xs font-bold text-stone-900 truncate">
                  {sp.koreanName}
                </span>
                <span className="text-[9px] font-mono text-stone-400 shrink-0">
                  {sp.number || '#001'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500 truncate mt-0.5">
                <span className="italic truncate">{sp.scientificName}</span>
                <span>·</span>
                <span className="shrink-0 uppercase">{sp.category}</span>
              </div>
            </div>

            <div className="text-right font-mono text-[9px] text-stone-400 shrink-0">
              <span>{sp.observations?.[0]?.date?.slice(5) || '10.21'}</span>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Render individual Sticker Item
  const renderStickerItem = (sp: Specimen, idx: number) => {
    const tilt = getStickerTilt(sp.id, idx);
    const hasStickerAsset = Boolean(sp.stickerImage);
    const imgSrc = sp.stickerImage || sp.originalImage;

    return (
      <motion.div
        key={sp.id}
        layout
        whileTap={{ scale: 1.06, rotate: 0, y: -4 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28, mass: 0.7 }}
        onClick={() => onSelectSpecimen(sp)}
        className="group relative flex flex-col items-center justify-between cursor-pointer"
      >
        <div className="relative w-full aspect-square flex items-center justify-center p-1.5">
          <motion.div
            initial={{ rotate: tilt }}
            animate={{ rotate: tilt }}
            whileHover={{ rotate: 0, scale: 1.05 }}
            className="relative w-full h-full flex items-center justify-center"
          >
            {hasStickerAsset ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={imgSrc}
                  alt={sp.koreanName}
                  referrerPolicy="no-referrer"
                  className="max-w-[94%] max-h-[94%] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.14)] drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)] transition-transform duration-200"
                  style={{
                    filter: 'drop-shadow(0 0 1.5px rgba(255,255,255,0.95)) drop-shadow(0 0 3px rgba(255,255,255,0.85)) drop-shadow(0 4px 8px rgba(0,0,0,0.16))',
                  }}
                />
              </div>
            ) : (
              <div className="w-[88%] h-[88%] rounded-[20px] bg-white p-1 shadow-[0_4px_12px_rgba(0,0,0,0.12)] border-2 border-white overflow-hidden transition-transform duration-200">
                <img
                  src={imgSrc}
                  alt={sp.koreanName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-[16px]"
                />
              </div>
            )}
          </motion.div>
        </div>

        <div className="w-full text-center mt-1 px-0.5">
          <div className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-tight truncate">
            {sp.number || `NO.${(idx + 1).toString().padStart(3, '0')}`}
          </div>
          <div className="text-[11px] font-bold text-stone-900 truncate leading-tight mt-0.5">
            {sp.koreanName}
          </div>
          <div className="text-[9px] font-mono text-stone-500 italic truncate opacity-80 mt-0.5">
            {sp.scientificName}
          </div>
        </div>
      </motion.div>
    );
  };

  const isAllCategory = selectedCategory === 'all';

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full min-h-screen bg-[#f4f2ee] text-stone-900 select-none font-geist pb-28 pt-1"
    >
      {/* ==============================================================
          DRIBBLE-TIER VIEW MODE SWITCHER
          Single continuous capsule container with sliding black indicator
          ============================================================== */}
      <div className="px-4 mb-4 flex items-center justify-between">
        <div className="relative inline-flex p-1 rounded-full bg-stone-200/90 backdrop-blur-md shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode('gallery')}
            className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-tight transition-colors duration-200 cursor-pointer ${
              viewMode === 'gallery' ? 'text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {viewMode === 'gallery' && (
              <motion.div
                layoutId="activeCollectionModePill"
                className="absolute inset-0 bg-stone-900 rounded-full shadow-sm"
                transition={{ type: 'spring', stiffness: 450, damping: 34, mass: 0.8 }}
              />
            )}
            <span className="relative z-20 flex items-center gap-1.5">
              <span>갤러리 뷰</span>
              <span className="text-[10px] opacity-70">CARD</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('sticker')}
            className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-tight transition-colors duration-200 cursor-pointer ${
              viewMode === 'sticker' ? 'text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {viewMode === 'sticker' && (
              <motion.div
                layoutId="activeCollectionModePill"
                className="absolute inset-0 bg-stone-900 rounded-full shadow-sm"
                transition={{ type: 'spring', stiffness: 450, damping: 34, mass: 0.8 }}
              />
            )}
            <span className="relative z-20 flex items-center gap-1.5">
              <span>스티커 형식</span>
              <span className="text-[10px] opacity-70">ALBUM</span>
            </span>
          </button>
        </div>

        {/* Dynamic Clade or Order Mode Meta Indicator */}
        <div className="text-[11px] font-mono text-stone-500 font-bold uppercase tracking-wider">
          {isAllCategory ? `CLADES (${specimenGroups.length})` : `ORDERS (${specimenGroups.length})`}
        </div>
      </div>

      {/* ==============================================================
          GALLERY PINCH DENSITY BAR (Only shown in Gallery Mode)
          ============================================================== */}
      {viewMode === 'gallery' && (
        <div className="px-4 py-1 mb-3">
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 mb-1">
            <span className={viewMorphProgress < 0.4 ? 'text-stone-900 font-bold' : ''}>
              COMPACT
            </span>
            <span className="text-[9px] text-stone-400 font-mono">
              스크랩 밀도 제어
            </span>
            <span className={viewMorphProgress >= 0.4 ? 'text-stone-900 font-bold' : ''}>
              EXPANDED
            </span>
          </div>

          <div className="relative w-full h-1.5 bg-stone-200/90 rounded-full overflow-hidden flex items-center">
            <motion.div
              className="absolute left-0 top-0 bottom-0 bg-stone-900 rounded-full"
              style={{ width: `${viewMorphProgress * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={viewMorphProgress}
              onChange={(e) => setViewMorphProgress(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize touch-none"
              title="밀도 조절"
            />
          </div>
        </div>
      )}

      {/* ==============================================================
          SPLIT COMPARISON DOCKED MODAL / SNAP MATRIX
          ============================================================== */}
      <AnimatePresence>
        {dockedPair && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
            className="mx-4 mb-5 p-4 rounded-[26px] bg-stone-950 text-white shadow-2xl border border-stone-800"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-[10px] font-mono tracking-wider">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white uppercase">흡착 분할 비교 모드 (DOCKED MATRIX)</span>
              </div>
              <button
                type="button"
                onClick={() => setDockedPair(null)}
                className="px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-[9px] cursor-pointer"
              >
                UNSNAP
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              {/* Specimen A */}
              {(() => {
                const sp = dockedPair.specimenA;
                const eco = getEcoDetail(sp.koreanName);
                return (
                  <div className="space-y-2">
                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-stone-900 border border-stone-800">
                      <img
                        src={sp.originalImage || sp.stickerImage}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-stone-500 block">
                        {sp.number || '#001'}
                      </span>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {sp.koreanName}
                      </h4>
                      <p className="text-[10px] font-mono text-stone-400 italic truncate">
                        {sp.scientificName}
                      </p>
                    </div>
                    <div className="text-[10px] font-mono space-y-1 pt-1 border-t border-stone-800 text-stone-300">
                      <div className="flex justify-between">
                        <span className="text-stone-500">CATEGORY:</span>
                        <span className="uppercase">{sp.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">HABITAT:</span>
                        <span className="truncate max-w-[80px]">{sp.habitatType || '야외'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">SCALE:</span>
                        <span className="truncate max-w-[80px]">{eco?.size || '표준 크기'}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Specimen B */}
              {(() => {
                const sp = dockedPair.specimenB;
                const eco = getEcoDetail(sp.koreanName);
                return (
                  <div className="space-y-2 border-l border-stone-800 pl-3">
                    <div className="aspect-square w-full rounded-2xl overflow-hidden bg-stone-900 border border-stone-800">
                      <img
                        src={sp.originalImage || sp.stickerImage}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-stone-500 block">
                        {sp.number || '#002'}
                      </span>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {sp.koreanName}
                      </h4>
                      <p className="text-[10px] font-mono text-stone-400 italic truncate">
                        {sp.scientificName}
                      </p>
                    </div>
                    <div className="text-[10px] font-mono space-y-1 pt-1 border-t border-stone-800 text-stone-300">
                      <div className="flex justify-between">
                        <span className="text-stone-500">CATEGORY:</span>
                        <span className="uppercase">{sp.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">HABITAT:</span>
                        <span className="truncate max-w-[80px]">{sp.habitatType || '야외'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">SCALE:</span>
                        <span className="truncate max-w-[80px]">{eco?.size || '표준 크기'}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==============================================================
          UNIFIED MORPHING BUNDLE LIST
          - 1-Line Clean Header OUTSIDE and ABOVE the container
          - Gallery View and Sticker View share the exact same container size, margins, and position
          - Fluid spring layout motion when toggling views or categories
          ============================================================== */}
      <motion.div
        key={`collection-container-${selectedCategory}`}
        initial={{ opacity: 0, filter: 'blur(4px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, filter: 'blur(4px)' }}
        transition={{ duration: 0.16 }}
        className="px-4 space-y-6"
      >
        {specimenGroups.map((group) => {
          return (
            <motion.div
              key={group.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
              className="w-full"
            >
              {/* 1-Line Group Header (Placed OUTSIDE and ABOVE the container) */}
              <div className="flex items-baseline justify-between mb-2 px-1 text-stone-900 select-none">
                <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 overflow-hidden pr-2">
                  {/* Number: Smaller font for '목' (Order) as requested */}
                  <span
                    className={`font-mono text-stone-400 font-bold shrink-0 ${
                      isAllCategory ? 'text-xs' : 'text-[10px]'
                    }`}
                  >
                    {group.indexStr}
                  </span>

                  {/* Category / Order Korean Name */}
                  <span className="text-xs sm:text-sm font-bold text-stone-900 shrink-0">
                    {group.koreanName}
                  </span>

                  {/* Latin Binomial / Taxon Label */}
                  {group.latinName && (
                    <span className="font-mono text-[10px] text-stone-400 font-normal uppercase shrink-0">
                      {group.latinName}
                    </span>
                  )}

                  {/* Short 1-line description */}
                  {group.shortDesc && (
                    <span className="text-[11px] font-mono text-stone-500 truncate min-w-0">
                      · {group.shortDesc}
                    </span>
                  )}
                </div>

                {/* Specimen / Sticker Count in the same single line */}
                <span className="font-mono text-[10px] text-stone-400 shrink-0 font-medium">
                  {group.specimens.length} {viewMode === 'sticker' ? 'STICKERS' : 'SPECIMENS'}
                </span>
              </div>

              {/* Simple Bundle Container - Identical size and position for both Gallery and Sticker */}
              <div
                className={`w-full rounded-[26px] p-3.5 sm:p-4 border shadow-2xs transition-colors duration-200 ${
                  viewMode === 'gallery'
                    ? 'bg-white border-stone-200/90'
                    : 'bg-[#efece6] border-stone-300/70'
                }`}
              >
                {viewMode === 'gallery' ? (
                  /* Gallery View: High-Fidelity Cards Grid */
                  <div
                    className={`transition-all duration-200 ${
                      isSpaciousGallery ? 'grid grid-cols-2 gap-3.5' : 'space-y-2'
                    }`}
                  >
                    {group.specimens.map((sp) => renderGalleryCard(sp))}
                  </div>
                ) : (
                  /* Sticker Album View: Die-Cut Vinyl Stickers on Archival Sheet */
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 py-1">
                    {group.specimens.map((sp, idx) => renderStickerItem(sp, idx))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Empty State */}
      {filteredList.length === 0 && (
        <div className="text-center py-20 px-4 text-stone-400 font-mono text-xs">
          등록된 도감 표본이 없습니다
        </div>
      )}
    </div>
  );
};
