import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';
import { SpeciesEcologyDetail } from '../types';

export interface ClassificationResult {
  isHuman: boolean;
  message?: string;
  matchedSpecies?: SpeciesEcologyDetail;
  confidence: number;
}

/**
 * Analyzes image content, filename, or data URL to detect human/person subjects
 * or match appropriate wildlife/nature species.
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

  // 2. Dynamic species matching for non-human images
  // If hint is a direct match for a species name, use it.
  let matched = SPECIES_ECOLOGY_ENCYCLOPEDIA.find((sp) => {
    const kr = sp.koreanName.toLowerCase();
    const eng = (sp.englishName || '').toLowerCase();
    return hint === kr || hint === eng;
  });

  if (!matched) {
    matched = SPECIES_ECOLOGY_ENCYCLOPEDIA.find((sp) => {
      const kr = sp.koreanName.toLowerCase();
      const eng = (sp.englishName || '').toLowerCase();
      const sci = sp.scientificName.toLowerCase();
      return hint.includes(kr) || hint.includes(eng) || hint.includes(sci) || lowerUrl.includes(kr);
    });
  }

  // Category specific matching fallback
  if (!matched) {
    if (/flower|plant|민들레|식물|꽃|나무|leaf|botanical|monstera|몬스테라/.test(hint) || /flower|plant/.test(lowerUrl)) {
      matched = SPECIES_ECOLOGY_ENCYCLOPEDIA.find((sp) => sp.category === 'plants') || SPECIES_ECOLOGY_ENCYCLOPEDIA[1];
    } else if (/butterfly|insect|나비|곤충|모르포|벌|bug/.test(hint) || /butterfly|insect/.test(lowerUrl)) {
      matched = SPECIES_ECOLOGY_ENCYCLOPEDIA.find((sp) => sp.category === 'insects') || SPECIES_ECOLOGY_ENCYCLOPEDIA[8];
    } else if (/sparrow|참새|bird|새|울새|오리|duck|heron|왜가리|직박구리/.test(hint) || /sparrow|bird/.test(lowerUrl)) {
      matched = SPECIES_ECOLOGY_ENCYCLOPEDIA.find((sp) => sp.koreanName === '참새') || SPECIES_ECOLOGY_ENCYCLOPEDIA[1];
    } else if (/cat|dog|mammal|포유류|다람쥐|squirrel|고양이/.test(hint) || /mammal|cat/.test(lowerUrl)) {
      matched = SPECIES_ECOLOGY_ENCYCLOPEDIA.find((sp) => sp.category === 'mammals') || SPECIES_ECOLOGY_ENCYCLOPEDIA[0];
    } else if (/fish|marine|흰동가리|어류|물고기/.test(hint) || /fish|marine/.test(lowerUrl)) {
      matched = SPECIES_ECOLOGY_ENCYCLOPEDIA.find((sp) => sp.category === 'fishes') || SPECIES_ECOLOGY_ENCYCLOPEDIA[9];
    } else if (/frog|개구리|양서류/.test(hint) || /frog/.test(lowerUrl)) {
      matched = SPECIES_ECOLOGY_ENCYCLOPEDIA.find((sp) => sp.category === 'amphibians') || SPECIES_ECOLOGY_ENCYCLOPEDIA[7];
    }
  }

  // Default fallback if no match found - REMOVED Kingfisher default to allow manual selection
  return {
    isHuman: false,
    matchedSpecies: matched,
    confidence: matched ? 98 : 0,
  };
}
