import React, { useState, useMemo } from 'react';
import { Specimen, SpecimenCategory, SpeciesEcologyDetail } from '../types';
import { X, Check, Search, BookOpen, CheckCircle2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';

interface ReclassifyModalProps {
  specimen: Specimen;
  onClose: () => void;
  onSave: (updated: Specimen) => void;
}

export const ReclassifyModal: React.FC<ReclassifyModalProps> = ({
  specimen,
  onClose,
  onSave,
}) => {
  // Find initial matching encyclopedia item if any
  const initialItem = useMemo(() => {
    return (
      SPECIES_ECOLOGY_ENCYCLOPEDIA.find(
        (e) => e.koreanName === specimen.koreanName
      ) || SPECIES_ECOLOGY_ENCYCLOPEDIA[0]
    );
  }, [specimen.koreanName]);

  const [selectedItem, setSelectedItem] = useState<SpeciesEcologyDetail>(initialItem);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedSearchCat, setSelectedSearchCat] = useState<string>('all');

  // Clean category label helper in pure Korean without translation jargon
  const getCleanCategoryLabel = (category: string) => {
    switch (category) {
      case 'birds':
        return '조류';
      case 'plants':
        return '식물';
      case 'insects':
        return '곤충류';
      case 'mammals':
        return '포유류';
      default:
        return '생물';
    }
  };

  // Clean family name helper (e.g. removes "(Passeridae)" or english clutter)
  const getCleanFamilyName = (family: string) => {
    return family.replace(/\s*\([^)]*\)/g, '').trim();
  };

  // Filter encyclopedia species
  const filteredSuggestions = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    return SPECIES_ECOLOGY_ENCYCLOPEDIA.filter((item) => {
      if (selectedSearchCat !== 'all' && item.category !== selectedSearchCat) {
        return false;
      }
      if (!query) return true;

      const matchKr = item.koreanName.toLowerCase().includes(query);
      const matchSci = item.scientificName.toLowerCase().includes(query);
      const matchFam = item.family.toLowerCase().includes(query);
      const matchKey = item.keyIdentification.toLowerCase().includes(query);
      const matchTag = item.tags.some((t) => t.toLowerCase().includes(query));

      return matchKr || matchSci || matchFam || matchKey || matchTag;
    });
  }, [searchFilter, selectedSearchCat]);

  // Handle confirming the selection
  const handleConfirmReclassify = () => {
    if (!selectedItem) return;

    const mappedCat: SpecimenCategory = selectedItem.category;
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
      selectedItem.family,
      selectedItem.koreanName,
    ];

    const updated: Specimen = {
      ...specimen,
      koreanName: selectedItem.koreanName,
      scientificName: selectedItem.scientificName,
      family: selectedItem.family,
      genus: selectedItem.scientificName.split(' ')[0] || specimen.genus,
      category: mappedCat,
      taxonomyPath: updatedTaxonomy,
      isPending: false, // Confirmed!
      wikiSummary: selectedItem.keyIdentification,
      traitChips: selectedItem.tags,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div
      id="reclassify-modal-backdrop"
      className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F6F8F6] text-stone-900 rounded-t-3xl sm:rounded-3xl p-5 max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 shrink-0">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              생물 동정 정보 변경
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              공인 생태 도감에서 올바른 종을 선택하면 학술 정보가 자동 적용됩니다
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

        {/* 1. Search Bar */}
        <div className="mt-3 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="생물명, 과명 검색 (예: 참새, 개망초, 직박구리, 몬스테라)..."
              className="w-full pl-9 pr-3 py-2.5 text-xs font-medium bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900 shadow-2xs text-stone-900 placeholder:text-stone-400"
            />
          </div>

          {/* Clean Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {[
              { id: 'all', label: '전체' },
              { id: 'plants', label: '식물' },
              { id: 'birds', label: '조류' },
              { id: 'insects', label: '곤충류' },
              { id: 'mammals', label: '포유류' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedSearchCat(c.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap ${
                  selectedSearchCat === c.id
                    ? 'bg-stone-900 text-white font-bold shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Species Selection List */}
        <div className="my-3 flex-1 overflow-y-auto space-y-2 pr-0.5 scrollbar-none min-h-[160px] max-h-[300px]">
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const cleanFamily = getCleanFamilyName(item.family);
              const cleanCategory = getCleanCategoryLabel(item.category);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all text-left ${
                    isSelected
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-white hover:bg-stone-50/90 text-stone-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm tracking-tight">
                          {item.koreanName}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {cleanFamily}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-white/10 text-stone-200'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {cleanCategory}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] italic font-serif mt-0.5 ${
                          isSelected ? 'text-stone-300' : 'text-stone-500'
                        }`}
                      >
                        {item.scientificName}
                      </p>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-white text-stone-900 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-stone-100" />
                      )}
                    </div>
                  </div>

                  {/* Summary / Identification tip snippet */}
                  <p
                    className={`text-[11px] mt-2 line-clamp-2 leading-relaxed ${
                      isSelected ? 'text-stone-200' : 'text-stone-600'
                    }`}
                  >
                    {item.keyIdentification}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-stone-400 bg-white rounded-2xl">
              일치하는 생물 도감이 없습니다. 다른 검색어를 입력해 보세요.
            </div>
          )}
        </div>

        {/* 3. Selected Target Preview & Confirmation Footer */}
        <div className="pt-3 shrink-0 space-y-2.5">
          {selectedItem && (
            <div className="bg-emerald-50 rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-950">
                  {selectedItem.koreanName} ({getCleanFamilyName(selectedItem.family)} · {getCleanCategoryLabel(selectedItem.category)})
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-mono">위키 표준 연동</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-stone-200/80 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirmReclassify}
              className="flex-2 py-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>'{selectedItem?.koreanName || '선택한 종'}'으로 동정 확정하기</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
