/// <reference types="vite/client" />
import { Specimen } from '../types';

type Category = Specimen['category'];

/**
 * 로그인(신규 가입) 시 채워 주는 예시 도감 60종.
 * - 예시 항목 중 앞 10종(무료 칸 수만큼)만 isCollected: true 로 차지하고, 나머지는 미수집입니다. (테스트 계정 전용)
 * - 사진은 src/assets/specimens 폴더의 이미지를 이름 순서대로 돌려 씁니다. (없으면 빈 칸)
 */
const CATEGORY_LABEL: Record<Category, string> = {
  plants: '식물',
  birds: '조류',
  insects: '곤충',
  mammals: '포유류',
  reptiles: '파충류',
  amphibians: '양서류',
  fishes: '어류',
  fungi: '균류',
  arachnids: '거미류',
  mollusks: '연체동물',
  crustaceans: '갑각류',
  others: '기타',
};

// [한글명, 학명, 분류, 과]
const ROWS: [string, string, Category, string][] = [
  ['참새', 'Passer montanus', 'birds', '참새과'],
  ['까치', 'Pica serica', 'birds', '까마귀과'],
  ['직박구리', 'Hypsipetes amaurotis', 'birds', '직박구리과'],
  ['청둥오리', 'Anas platyrhynchos', 'birds', '오리과'],
  ['왜가리', 'Ardea cinerea', 'birds', '왜가리과'],
  ['원앙', 'Aix galericulata', 'birds', '오리과'],
  ['쇠딱따구리', 'Dendrocopos kizuki', 'birds', '딱따구리과'],
  ['박새', 'Parus minor', 'birds', '박새과'],
  ['동고비', 'Sitta europaea', 'birds', '동고비과'],
  ['찌르레기', 'Sturnus cineraceus', 'birds', '찌르레기과'],
  ['황조롱이', 'Falco tinnunculus', 'birds', '매과'],
  ['종다리', 'Alauda arvensis', 'birds', '종다리과'],
  ['작은멋쟁이나비', 'Vanessa cardui', 'insects', '네발나비과'],
  ['청띠제비나비', 'Graphium sarpedon', 'insects', '호랑나비과'],
  ['왕잠자리', 'Anax parthenope', 'insects', '잠자리과'],
  ['무당벌레', 'Harmonia axyridis', 'insects', '무당벌레과'],
  ['사슴벌레', 'Lucanus maculifemoratus', 'insects', '사슴벌레과'],
  ['말매미', 'Cryptotympana atrata', 'insects', '매미과'],
  ['꿀벌', 'Apis mellifera', 'insects', '꿀벌과'],
  ['호랑나비', 'Papilio xuthus', 'insects', '호랑나비과'],
  ['고추잠자리', 'Crocothemis servilia', 'insects', '잠자리과'],
  ['장수풍뎅이', 'Allomyrina dichotoma', 'insects', '풍뎅이과'],
  ['일본왕개미', 'Camponotus japonicus', 'insects', '개미과'],
  ['노린재', 'Plautia stali', 'insects', '노린재과'],
  ['제비꽃', 'Viola mandshurica', 'plants', '제비꽃과'],
  ['개나리', 'Forsythia koreana', 'plants', '물푸레나무과'],
  ['왕벚나무', 'Prunus yedoensis', 'plants', '장미과'],
  ['소나무', 'Pinus densiflora', 'plants', '소나무과'],
  ['은행나무', 'Ginkgo biloba', 'plants', '은행나무과'],
  ['민들레', 'Taraxacum platycarpum', 'plants', '국화과'],
  ['질경이', 'Plantago asiatica', 'plants', '질경이과'],
  ['쑥', 'Artemisia princeps', 'plants', '국화과'],
  ['강아지풀', 'Setaria viridis', 'plants', '벼과'],
  ['토끼풀', 'Trifolium repens', 'plants', '콩과'],
  ['할미꽃', 'Pulsatilla koreana', 'plants', '미나리아재비과'],
  ['억새', 'Miscanthus sinensis', 'plants', '벼과'],
  ['붕어', 'Carassius auratus', 'fishes', '잉어과'],
  ['송사리', 'Oryzias latipes', 'fishes', '송사리과'],
  ['피라미', 'Zacco platypus', 'fishes', '잉어과'],
  ['미꾸라지', 'Misgurnus anguillicaudatus', 'fishes', '미꾸리과'],
  ['동자개', 'Pseudobagrus fulvidraco', 'fishes', '동자개과'],
  ['누치', 'Hemibarbus labeo', 'fishes', '잉어과'],
  ['두꺼비', 'Bufo gargarizans', 'amphibians', '두꺼비과'],
  ['산개구리', 'Rana uenoi', 'amphibians', '개구리과'],
  ['도롱뇽', 'Hynobius leechii', 'amphibians', '도롱뇽과'],
  ['맹꽁이', 'Kaloula borealis', 'amphibians', '맹꽁이과'],
  ['능구렁이', 'Dinodon rufozonatum', 'reptiles', '뱀과'],
  ['도마뱀', 'Eremias argus', 'reptiles', '도마뱀과'],
  ['누룩뱀', 'Elaphe rufodorsata', 'reptiles', '뱀과'],
  ['고라니', 'Hydropotes inermis', 'mammals', '사슴과'],
  ['청설모', 'Sciurus vulgaris', 'mammals', '다람쥐과'],
  ['너구리', 'Nyctereutes procyonoides', 'mammals', '개과'],
  ['멧돼지', 'Sus scrofa', 'mammals', '멧돼지과'],
  ['표고버섯', 'Lentinula edodes', 'fungi', '낙엽버섯과'],
  ['능이버섯', 'Sarcodon aspratus', 'fungi', '바클리버섯과'],
  ['송이버섯', 'Tricholoma matsutake', 'fungi', '송이과'],
  ['거미', 'Araneus ventricosus', 'arachnids', '왕거미과'],
  ['왕거미', 'Nephila clavata', 'arachnids', '무당거미과'],
  ['참달팽이', 'Camaena cicatricosa', 'mollusks', '달팽이과'],
  ['참게', 'Eriocheir sinensis', 'crustaceans', '무늬발게과'],
];

// 사진 풀: src/assets/specimens 의 이미지를 파일명 순서대로 모읍니다. (없으면 빈 배열)
const imageModules = import.meta.glob('../assets/specimens/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
}) as unknown as Record<string, string>;
const IMAGE_POOL: string[] = Object.keys(imageModules)
  .sort()
  .map((key) => imageModules[key]);

const imageAt = (index: number): string | undefined =>
  IMAGE_POOL.length > 0 ? IMAGE_POOL[index % IMAGE_POOL.length] : undefined;

export const EXAMPLE_SPECIMENS: Specimen[] = ROWS.map(([koreanName, scientificName, category, family], index) => {
  const image = imageAt(index);
  return {
    id: `ex-${String(index + 1).padStart(3, '0')}`,
    number: `No.${String(index + 1).padStart(3, '0')}`,
    koreanName,
    scientificName,
    englishName: '',
    category,
    family,
    genus: scientificName.split(' ')[0],
    isCollected: index < 10, // 무료 10칸 만 채움 (테스트)
    stickerImage: image,
    originalImage: image,
    taxonomyPath: [CATEGORY_LABEL[category], family],
    traitChips: [CATEGORY_LABEL[category]],
    habitatType: '도심 및 근교 생태계',
    observations: [],
    wikiSummary: `${koreanName}의 예시 도감 항목입니다. 실제로 포착하면 상세 정보가 채워집니다.`,
    wikiUrl: '',
  };
});
