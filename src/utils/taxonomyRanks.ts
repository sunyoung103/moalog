export interface TaxonomyStep {
  rankKey: 'kingdom' | 'phylum' | 'class' | 'order' | 'family';
  rankLabel: '계' | '문' | '강' | '목' | '과';
  value: string;
  scientificValue?: string;
}

const TAXONOMY_KO_MAP: Record<string, string> = {
  // Kingdoms (계)
  Plantae: '식물계',
  Animalia: '동물계',
  Fungi: '균계',
  Chromista: '유색조식물계',
  Protozoa: '원생동물계',
  Bacteria: '세균계',

  // Phyla (문)
  Tracheophyta: '관속식물문',
  Magnoliophyta: '속씨식물문',
  Bryophyta: '선태식물문',
  Pteridophyta: '양치식물문',
  Pinophyta: '구과식물문',
  Chordata: '척삭동물문',
  Arthropoda: '절지동물문',
  Mollusca: '연체동물문',
  Annelida: '환형동물문',
  Cnidaria: '자포동물문',
  Echinodermata: '극피동물문',
  Basidiomycota: '담자균문',
  Ascomycota: '자낭균문',

  // Classes (강)
  Magnoliopsida: '목련강',
  Liliopsida: '백합강',
  Pinopsida: '소나무강',
  Polypodiopsida: '고사리강',
  Aves: '조강',
  Mammalia: '포유강',
  Insecta: '곤충강',
  Arachnida: '거미강',
  Actinopterygii: '조기어강',
  Elasmobranchii: '연골어강',
  Chondrichthyes: '연골어강',
  Amphibia: '양서강',
  Reptilia: '파충강',
  Squamata: '뱀목·파충강',
  Gastropoda: '복족강',
  Bivalvia: '이매패강',
  Cephalopoda: '두족강',
  Malacostraca: '연갑강',
  Agaricomycetes: '주름버섯강',

  // Common Orders (목)
  Rosales: '장미목',
  Asterales: '국화목',
  Fabales: '콩목',
  Lamiales: '꿀풀목',
  Brassicales: '십자화목',
  Sapindales: '무환자나무목',
  Fagales: '참나무목',
  Pinales: '소나무목',
  Poales: '벼목',
  Liliales: '백합목',
  Asparagales: '비짜루목',
  Malvales: '아욱목',
  Caryophyllales: '석죽목',
  Ranunculales: '미나리아재비목',
  Apiales: '산형목',
  Solanales: '가지목',
  Gentianales: '용담목',
  Ericales: '진달래목',
  Alismatales: '택사목',
  Passeriformes: '참새목',
  Coraciiformes: '파랑새목',
  Pelecaniformes: '사다새목',
  Anseriformes: '기러기목',
  Accipitriformes: '수리목',
  Strigiformes: '올빼미목',
  Piciformes: '딱다구리목',
  Columbiformes: '비둘기목',
  Charadriiformes: '도요목',
  Sphenisciformes: '펭귄목',
  Phoenicopteriformes: '홍학목',
  Apodiformes: '칼새목',
  Lepidoptera: '나비목',
  Coleoptera: '딱정벌레목',
  Hymenoptera: '벌목',
  Odonata: '잠자리목',
  Diptera: '파리목',
  Hemiptera: '노린재목',
  Orthoptera: '메뚜기목',
  Mantodea: '사마귀목',
  Araneae: '거미목',
  Rodentia: '설치목',
  Carnivora: '식육목',
  Diprotodontia: '유대목',
  Primates: '영장목',
  Artiodactyla: '소목',
  Cetartiodactyla: '우제목',
  Anura: '개구리목',
  Caudata: '도롱뇽목',
  Testudines: '거북목',
  Cypriniformes: '잉어목',
  Perciformes: '농어목',
  Salmoniformes: '연어목',
  Orectolobiformes: '수염상어목',
  Myliobatiformes: '매가오리목',
  Decapoda: '십각목',
  Stylommatophora: '병안목',
  Agaricales: '주름버섯목',
  Polyporales: '구멍장이버섯목',

  // Common Families (과)
  Rosaceae: '장미과',
  Asteraceae: '국화과',
  Fabaceae: '콩과',
  Fagaceae: '참나무과',
  Pinaceae: '소나무과',
  Poaceae: '벼과',
  Araceae: '천남성과',
  Droseraceae: '끈끈이주걱과',
  Rafflesiaceae: '라플레시아과',
  Malvaceae: '아욱과',
  Cupressaceae: '측백나무과',
  Campanulaceae: '초롱꽃과',
  Oleaceae: '물푸레나무과',
  Ericaceae: '진달래과',
  Alcedinidae: '물총새과',
  Passeridae: '참새과',
  Ardeidae: '왜가리과',
  Anatidae: '오리과',
  Corvidae: '까마귀과',
  Pycnonotidae: '직박구리과',
  Accipitridae: '수리과',
  Ramphastidae: '왕부리새과',
  Spheniscidae: '펭귄과',
  Phoenicopteridae: '홍학과',
  Trochilidae: '벌새과',
  Papilionidae: '호랑나비과',
  Nymphalidae: '네발나비과',
  Pieridae: '흰나비과',
  Coccinellidae: '무당벌레과',
  Scarabaeidae: '소똥구리과',
  Lucanidae: '사슴벌레과',
  Apidae: '꿀벌과',
  Sciuridae: '다람쥐과',
  Ursidae: '곰과',
  Felidae: '고양이과',
  Canidae: '개과',
  Macropodidae: '캥거루과',
  Lemuridae: '여우원숭이과',
  Bovidae: '소과',
  Hylidae: '청개구리과',
  Ranidae: '개구리과',
  Dendrobatidae: '독화살개구리과',
  Chamaeleonidae: '카멜레온과',
  Iguanidae: '이구아나과',
  Colubridae: '뱀과',
  Cyprinidae: '잉어과',
  Pomacentridae: '자리돔과',
  Rhincodontidae: '고래상어과',
  Mobulidae: '쥐가오리과',
  Coenobitidae: '집게과',
  Varunidae: '참게과',
  Amanitaceae: '광대버섯과',
  Pleurotaceae: '느타리과',
  Tricholomataceae: '송이과',
  Ganodermataceae: '불로초과',
};

export function translateTaxonRankName(latinOrKo?: string | null): string {
  if (!latinOrKo) return '';
  const cleaned = latinOrKo.split('(')[0].trim();
  if (!cleaned) return '';
  if (/[가-힣]/.test(cleaned)) return cleaned;
  return TAXONOMY_KO_MAP[cleaned] || cleaned;
}

export interface BuildTaxonomyStepsInput {
  inatAncestors?: Array<{ rank: string; name: string; preferred_common_name?: string }> | null;
  gbifData?: {
    kingdom?: string;
    phylum?: string;
    class?: string;
    order?: string;
    family?: string;
  } | null;
  specimenTaxonomyPath?: string[];
  specimenOrder?: string;
  specimenFamily?: string;
  ecoOrder?: string;
  ecoFamily?: string;
  category?: string;
}

export function buildTaxonomySteps(input: BuildTaxonomyStepsInput): TaxonomyStep[] {
  const {
    inatAncestors,
    gbifData,
    specimenTaxonomyPath = [],
    specimenOrder,
    specimenFamily,
    ecoOrder,
    ecoFamily,
    category,
  } = input;

  const findInatRank = (rank: string) => {
    const found = inatAncestors?.find((a) => a.rank === rank);
    if (!found) return { ko: '', sci: '' };
    const koFromInat = found.preferred_common_name ? found.preferred_common_name.split('(')[0].trim() : '';
    const mapped = translateTaxonRankName(found.name);
    return {
      ko: /[가-힣]/.test(koFromInat) ? koFromInat : mapped,
      sci: found.name,
    };
  };

  const inatKingdom = findInatRank('kingdom');
  const inatPhylum = findInatRank('phylum');
  const inatClass = findInatRank('class');
  const inatOrder = findInatRank('order');
  const inatFamily = findInatRank('family');

  const pathKingdom = specimenTaxonomyPath.find((t) => t.endsWith('계'));
  const pathPhylum = specimenTaxonomyPath.find((t) => t.endsWith('문'));
  const pathClass = specimenTaxonomyPath.find((t) => t.endsWith('강'));
  const pathOrder = specimenTaxonomyPath.find((t) => t.endsWith('목'));
  const pathFamily = specimenTaxonomyPath.find((t) => t.endsWith('과'));

  const isPlant = category === 'plants';
  const isFungi = category === 'fungi';
  const isInsect = category === 'insects';
  const isBird = category === 'birds';
  const isMammal = category === 'mammals';
  const isFish = category === 'fishes';
  const isAmphibian = category === 'amphibians';
  const isReptile = category === 'reptiles' || category === 'herptiles';

  const kingdomVal =
    inatKingdom.ko ||
    translateTaxonRankName(gbifData?.kingdom) ||
    pathKingdom ||
    (isPlant ? '식물계' : isFungi ? '균계' : '동물계');

  const phylumVal =
    inatPhylum.ko ||
    translateTaxonRankName(gbifData?.phylum) ||
    pathPhylum ||
    (isPlant ? '관속식물문' : isFungi ? '담자균문' : isInsect ? '절지동물문' : '척삭동물문');

  const classVal =
    inatClass.ko ||
    translateTaxonRankName(gbifData?.class) ||
    pathClass ||
    (isPlant
      ? '목련강'
      : isBird
      ? '조강'
      : isMammal
      ? '포유강'
      : isInsect
      ? '곤충강'
      : isFish
      ? '조기어강'
      : isAmphibian
      ? '양서강'
      : isReptile
      ? '파충강'
      : isFungi
      ? '주름버섯강'
      : '생물강');

  const orderVal =
    inatOrder.ko ||
    translateTaxonRankName(gbifData?.order) ||
    translateTaxonRankName(ecoOrder) ||
    translateTaxonRankName(specimenOrder) ||
    pathOrder ||
    '미분류목';

  const familyVal =
    inatFamily.ko ||
    translateTaxonRankName(gbifData?.family) ||
    translateTaxonRankName(ecoFamily) ||
    translateTaxonRankName(specimenFamily) ||
    pathFamily ||
    '미분류과';

  return [
    { rankKey: 'kingdom', rankLabel: '계', value: kingdomVal, scientificValue: gbifData?.kingdom || inatKingdom.sci },
    { rankKey: 'phylum', rankLabel: '문', value: phylumVal, scientificValue: gbifData?.phylum || inatPhylum.sci },
    { rankKey: 'class', rankLabel: '강', value: classVal, scientificValue: gbifData?.class || inatClass.sci },
    { rankKey: 'order', rankLabel: '목', value: orderVal, scientificValue: gbifData?.order || inatOrder.sci },
    { rankKey: 'family', rankLabel: '과', value: familyVal, scientificValue: gbifData?.family || inatFamily.sci },
  ];
}
