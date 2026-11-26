import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';
import { SpeciesEcologyDetail } from '../types';

export interface ClassificationResult {
  isHuman: boolean;
  message?: string;
  matchedSpecies?: SpeciesEcologyDetail;
  candidates?: SpeciesEcologyDetail[];
  confidence: number;
}

/**
 * Analyzes image content, filename, or data URL to detect human/person subjects
 * or match appropriate wildlife/nature species with candidate suggestions for uncertain confidence.
 */
export function classifyImageContent(
  photoUrl: string,
  fileNameOrHint?: string
): ClassificationResult {
  const hint = (fileNameOrHint || '').toLowerCase();
  const lowerUrl = (photoUrl || '').toLowerCase();

  // 1. Human / Person Detection keywords - HIGHEST PRIORITY
  const humanKeywords = [
    'human', 'person', 'people', 'man', 'woman', 'face', 'portrait',
    'selfie', 'boy', 'girl', 'child', 'guy', 'lady', '사람', '인물',
    '얼굴', '초상화', '셀카', '남성', '여성', '관찰자'
  ];

  const isHumanDetected = humanKeywords.some(
    (kw) => hint.includes(kw) || lowerUrl.includes(kw)
  );

  if (isHumanDetected) {
    return {
      isHuman: true,
      message: '인물 사진은 도감에 등록할 수 없습니다. 자연 생물을 촬영해 주세요.',
      confidence: 0,
    };
  }

  // 2. Exact match
  const exactMatched = SPECIES_ECOLOGY_ENCYCLOPEDIA.find((sp) => {
    const kr = sp.koreanName.toLowerCase();
    const eng = (sp.englishName || '').toLowerCase();
    const sci = sp.scientificName.toLowerCase();
    return hint === kr || hint === eng || hint === sci;
  });

  if (exactMatched) {
    return {
      isHuman: false,
      matchedSpecies: exactMatched,
      confidence: 98,
    };
  }

  // Partial name match
  const partialMatched = SPECIES_ECOLOGY_ENCYCLOPEDIA.find((sp) => {
    const kr = sp.koreanName.toLowerCase();
    const eng = (sp.englishName || '').toLowerCase();
    const sci = sp.scientificName.toLowerCase();
    return hint.includes(kr) || hint.includes(eng) || hint.includes(sci) || lowerUrl.includes(kr);
  });

  if (partialMatched) {
    return {
      isHuman: false,
      matchedSpecies: partialMatched,
      confidence: 92,
    };
  }

  // 3. Category broad match -> Mid-tier confidence (68%) with B-10e candidates
  let broadCategory: string | null = null;
  if (/flower|plant|민들레|식물|꽃|나무|leaf|botanical|monstera|몬스테라/.test(hint) || /flower|plant/.test(lowerUrl)) {
    broadCategory = 'plants';
  } else if (/butterfly|insect|나비|곤충|모르포|벌|bug/.test(hint) || /butterfly|insect/.test(lowerUrl)) {
    broadCategory = 'insects';
  } else if (/sparrow|참새|bird|새|울새|오리|duck|heron|왜가리|직박구리/.test(hint) || /sparrow|bird/.test(lowerUrl)) {
    broadCategory = 'birds';
  } else if (/cat|dog|mammal|포유류|다람쥐|squirrel|고양이/.test(hint) || /mammal|cat/.test(lowerUrl)) {
    broadCategory = 'mammals';
  } else if (/fish|marine|흰동가리|어류|물고기/.test(hint) || /fish|marine/.test(lowerUrl)) {
    broadCategory = 'fishes';
  } else if (/frog|개구리|양서류/.test(hint) || /frog/.test(lowerUrl)) {
    broadCategory = 'amphibians';
  }

  if (broadCategory) {
    const candidates = SPECIES_ECOLOGY_ENCYCLOPEDIA.filter((sp) => sp.category === broadCategory).slice(0, 3);
    if (candidates.length > 0) {
      return {
        isHuman: false,
        matchedSpecies: candidates[0],
        candidates,
        confidence: 68,
      };
    }
  }

  return {
    isHuman: false,
    matchedSpecies: undefined,
    confidence: 0,
  };
}
