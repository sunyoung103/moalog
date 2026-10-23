import React, { useState, useMemo } from 'react';
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
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';

interface EditSpecimenModalProps {
  specimen: Specimen;
  activeObsIndex?: number;
  onClose: () => void;
  onSave: (updated: Specimen) => void;
  onDeleteSpecimen?: (specimenId: string) => void;
  onDeleteObservation?: (specimenId: string, observationIndex: number) => void;
}

export const EditSpecimenModal: React.FC<EditSpecimenModalProps> = ({
  specimen,
  activeObsIndex = 0,
  onClose,
  onSave,
  onDeleteSpecimen,
  onDeleteObservation,
}) => {
  const [activeTab, setActiveTab] = useState<'species' | 'delete'>('species');

  // Species Selection via Search
  const initialSpecies = useMemo(() => {
    return (
      SPECIES_ECOLOGY_ENCYCLOPEDIA.find(
        (e) => e.koreanName === specimen?.koreanName
      ) ||
      SPECIES_ECOLOGY_ENCYCLOPEDIA.find(
        (e) => (e.scientificName || '').toLowerCase() === (specimen?.scientificName || '').toLowerCase()
      ) ||
      SPECIES_ECOLOGY_ENCYCLOPEDIA[0]
    );
  }, [specimen?.koreanName, specimen?.scientificName]);

  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesEcologyDetail>(initialSpecies);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Deletion confirm states
  const [confirmDeleteType, setConfirmDeleteType] = useState<'none' | 'single_image' | 'entire_specimen'>('none');
  const [targetObsIndexToDelete, setTargetObsIndexToDelete] = useState<number>(activeObsIndex);

  // Filter encyclopedia species for one-touch selection
  const filteredSpeciesList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SPECIES_ECOLOGY_ENCYCLOPEDIA.filter((item) => {
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
  }, [searchQuery, selectedCategory]);

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
      traitChips: (selectedSpecies.tags && selectedSpecies.tags.length > 0) ? selectedSpecies.tags : specimen.traitChips,
    };

    onSave(updated);
    onClose();
  };

  const observations = specimen.observations && specimen.observations.length > 0
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
        className="bg-[#F6F8F6] text-stone-900 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[85vh] sm:max-h-[80vh] flex flex-col shadow-2xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-4 bg-white flex items-center justify-between shrink-0 border-b border-stone-200/60">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <span>생물 종 변경 및 도감 관리</span>
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              도감 분류 수정 또는 사진/도감 삭제를 관리합니다.
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
            <span>생물 종 변경</span>
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
                  filteredSpeciesList.map((item) => {
                    const isSelected = selectedSpecies.koreanName === item.koreanName;
                    return (
                      <button
                        key={item.koreanName}
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
                <span>종 변경 저장</span>
              </button>
            </div>
          </>
        )}

        {/* TAB 2: CLEAN ICON-FOCUSED DELETION MANAGEMENT */}
        {activeTab === 'delete' && (
          <div className="flex-1 min-h-0 flex flex-col p-4 space-y-4 overflow-y-auto scrollbar-thin">
            {/* 1. Icon-Focused Photo Deletion Grid (사진별 휴지통 아이콘 삭제) - 2장 이상일 때만 노출 */}
            {observations.length > 1 && (
              <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-stone-600" />
                    <span className="text-xs font-bold text-stone-900">개별 사진 삭제 ({observations.length}장)</span>
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
                          src={obs.photoUrl || specimen.originalImage || ''}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {isCurrent && (
                          <div className="absolute top-1 left-1 bg-amber-400 text-stone-950 text-[8px] font-black px-1 py-0.5 rounded shadow">
                            대표
                          </div>
                        )}

                        {/* Always visible Trash Icon Button for Mobile UX */}
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

            {/* 2. Clean Entire Specimen Deletion Card */}
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
