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
} from 'lucide-react';
import { motion } from 'motion/react';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';

interface EditSpecimenModalProps {
  specimen: Specimen;
  activeObsIndex?: number;
  onClose: () => void;
  onSave: (updated: Specimen) => void;
}

export const EditSpecimenModal: React.FC<EditSpecimenModalProps> = ({
  specimen,
  activeObsIndex = 0,
  onClose,
  onSave,
}) => {
  // Species Selection via Search (No manual typing required)
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
        className="bg-[#F6F8F6] text-stone-900 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[85vh] sm:max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 bg-white flex items-center justify-between shrink-0 border-b border-stone-200/60">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <span>생물 종 변경 (도감 분류 수정)</span>
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              AI가 분류한 종이 다를 경우 도감 목록에서 올바른 종으로 변경할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 flex flex-col p-4 space-y-3.5 overflow-hidden">
          {/* Currently Selected Species Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 flex items-center justify-between shadow-2xs shrink-0">
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
              <p className="text-[11px] text-emerald-900/80 mt-0.5">
                {selectedSpecies.family} · {selectedSpecies.habitat}
              </p>
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
                placeholder="변경할 생물 검색 (예: 직박구리, 몬스테라, 까치, 참새)..."
                className="w-full bg-white rounded-xl pl-8 pr-3 py-2 text-xs text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs border border-stone-200/80"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Category filter pills */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  const el = (e.currentTarget.nextElementSibling as HTMLDivElement);
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
                  const el = (e.currentTarget.previousElementSibling as HTMLDivElement);
                  if (el) el.scrollBy({ left: 140, behavior: 'smooth' });
                }}
                className="flex items-center justify-center w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 shrink-0 cursor-pointer text-xs"
                title="오른쪽 스크롤"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search Results / Species List (Smooth Dedicated Scroll) */}
          <div className="flex-1 min-h-[200px] overflow-y-auto overscroll-contain touch-pan-y pr-1 space-y-1.5">
            <span className="text-[10px] font-bold text-stone-400 sticky top-0 bg-[#F6F8F6] py-1 block z-10">
              도감 종 목록 ({filteredSpeciesList.length}건) - 원하는 종을 터치하여 바로 변경:
            </span>
            {filteredSpeciesList.map((item) => {
              const isSelected = selectedSpecies.koreanName === item.koreanName;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSpecies(item)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-100/90 border-emerald-300 font-bold shadow-2xs'
                      : 'bg-white hover:bg-stone-50 border-stone-200/60'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-bold text-stone-900">
                        {item.koreanName}
                      </span>
                      <span className="text-[10px] text-stone-500 font-serif italic truncate">
                        {item.scientificName}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 truncate mt-0.5">
                      {item.family} · {item.categoryLabel} · {item.habitat}
                    </p>
                  </div>

                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  ) : (
                    <span className="text-[10px] text-stone-600 font-bold px-2 py-0.5 rounded bg-stone-100 shrink-0">
                      선택
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-white flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-2 py-2.5 rounded-xl bg-stone-900 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>생물 종 변경 저장</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
