
export interface SpeciesEcologyDetail {
  appearance?: string;
  habitat?: string;
  ecology?: string;
  etymology?: string;
  funFact?: string;
  breeding?: string;
  fieldTip?: string;
  order?: string;
  family?: string;
  // ... other fields
}

export const isMeaningfulContent = (text?: string | null): boolean => {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 3) return false;

  // Generic placeholder strings to reject
  const placeholders = [
    '확인 중',
    '종별 상이',
    '종별 고유',
    '종별 서식지',
    '종별 식성',
    '종별 명칭',
    '종별 관찰',
    '종별 적합',
    '전문가 검증 필요',
    '데이터 업데이트 중',
    '분류군 정보',
    '형태 형질을 확인'
  ];

  return !placeholders.some(p => trimmed.includes(p));
};

export const isValidEcologyDetail = (detail: any): boolean => {
  if (!detail || typeof detail !== 'object') return false;
  
  const fieldsToCheck = [
    'keyIdentification', 'appearance', 'habitat', 'dietAndBehavior', 
    'etymology', 'specialNotes', 'bestObservationTip', 'lynxBirdLifeNote'
  ];
  
  return fieldsToCheck.some(field => isMeaningfulContent(detail[field]));
};

/**
 * Robustly verifies if the fetched ecology details strictly match the requested specimen
 * by checking scientific name and category consistency.
 */
export const isSpecimenDataMatch = (
  detail: any,
  specimen: { id: string; scientificName: string; category: string }
): boolean => {
  if (!detail || !specimen) return false;

  // Cross-validate IDs if available
  if (detail.id && detail.id !== specimen.id) return false;

  // Normalize for comparison
  const detailName = (detail.scientificName || '').toLowerCase().trim();
  const specimenName = (specimen.scientificName || '').toLowerCase().trim();
  const detailCategory = (detail.category || '').toLowerCase();
  const specimenCategory = (specimen.category || '').toLowerCase();

  // Strict check: Scientific name must match
  if (detailName !== specimenName) return false;

  // Additional safety check: Category consistency
  if (detailCategory && specimenCategory && detailCategory !== specimenCategory) return false;

  return true;
};
