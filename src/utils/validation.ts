
export interface SpeciesEcologyDetail {
  id?: string;
  taxonId?: string | number;
  koreanName?: string;
  scientificName?: string;
  englishName?: string;
  category?: string;
  appearance?: string;
  habitat?: string;
  ecology?: string;
  etymology?: string;
  funFact?: string;
  breeding?: string;
  fieldTip?: string;
  order?: string;
  family?: string;
  isDataValidated?: boolean;
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
    '형태 형질을 확인',
    '정보부족',
    '정보 부족',
    '자료부족',
    '자료 부족',
    '정보 없음',
    '정보미확인',
    '미지정',
    'Data Deficient'
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

export interface SpecimenTarget {
  id?: string;
  taxonId?: string | number;
  scientificName: string;
  koreanName?: string;
  category: string;
}

/**
 * Strict verification layer that cross-checks the specimen's 'taxonId' and 'scientificName'
 * against the returned AI metadata from the ecology service.
 * Returns boolean 'isDataValidated', ensuring no mismatch or cross-species contamination occurs.
 */
export const validateSpecimenEcologyData = (
  detail: any,
  specimen: SpecimenTarget
): boolean => {
  if (!detail || typeof detail !== 'object' || !specimen) {
    return false;
  }

  // 1. Quality Check: Must contain valid ecology narrative content
  if (!isValidEcologyDetail(detail)) {
    return false;
  }

  // 2. Cross-check 'taxonId' ONLY if explicit specimen.taxonId is provided
  if (specimen.taxonId && detail.taxonId) {
    const normDetailTaxonId = String(detail.taxonId).trim().toLowerCase();
    const normSpecimenTaxonId = String(specimen.taxonId).trim().toLowerCase();
    if (normDetailTaxonId && normSpecimenTaxonId && normDetailTaxonId !== normSpecimenTaxonId) {
      console.warn(`[Validation Guard] TaxonId mismatch! Specimen: ${normSpecimenTaxonId}, AI Metadata: ${normDetailTaxonId}`);
      return false;
    }
  }

  // 3. Cross-check 'scientificName' (strict matching)
  const normSpecimenSciName = (specimen.scientificName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normDetailSciName = (detail.scientificName || '').trim().toLowerCase().replace(/\s+/g, ' ');

  if (normSpecimenSciName) {
    if (!normDetailSciName) {
      console.warn('[Validation Guard] AI metadata missing scientificName for cross-check');
      return false;
    }

    const sciNameExact = normSpecimenSciName === normDetailSciName;
    const sciNameSub = normDetailSciName.includes(normSpecimenSciName) || normSpecimenSciName.includes(normDetailSciName);

    if (!sciNameExact && !sciNameSub) {
      console.warn(`[Validation Guard] ScientificName mismatch! Specimen: "${normSpecimenSciName}", AI Metadata: "${normDetailSciName}"`);
      return false;
    }
  } else if (specimen.koreanName) {
    // If no scientific name on specimen, check koreanName
    const normSpecimenKor = specimen.koreanName.trim().toLowerCase();
    const normDetailKor = (detail.koreanName || '').trim().toLowerCase();
    if (!normDetailKor || (normSpecimenKor !== normDetailKor && !normDetailKor.includes(normSpecimenKor) && !normSpecimenKor.includes(normDetailKor))) {
      console.warn(`[Validation Guard] KoreanName mismatch! Specimen: "${normSpecimenKor}", AI Metadata: "${normDetailKor}"`);
      return false;
    }
  }

  // 4. Cross-check category consistency to prevent cross-taxon contamination
  if (detail.category && specimen.category) {
    const normDetailCat = String(detail.category).trim().toLowerCase();
    const normSpecimenCat = String(specimen.category).trim().toLowerCase();
    if (normDetailCat !== normSpecimenCat) {
      console.warn(`[Validation Guard] Category mismatch! Specimen: "${normSpecimenCat}", AI Metadata: "${normDetailCat}"`);
      return false;
    }
  }

  return true;
};

/**
 * Backward-compatible alias for isSpecimenDataMatch using the strict verification layer.
 */
export const isSpecimenDataMatch = (
  detail: any,
  specimen: SpecimenTarget
): boolean => {
  return validateSpecimenEcologyData(detail, specimen);
};

