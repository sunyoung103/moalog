import { SupportedLanguage } from '../types';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
  regionType: 'native' | 'english' | 'non_english';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'ko', label: '한국어', nativeLabel: '한국어', flag: '🇰🇷', regionType: 'non_english' },
  { code: 'en', label: '영어', nativeLabel: 'English', flag: '🇺🇸', regionType: 'english' },
  { code: 'zh', label: '중국어', nativeLabel: '简体中文', flag: '🇨🇳', regionType: 'non_english' },
  { code: 'ja', label: '일본어', nativeLabel: '日本語', flag: '🇯🇵', regionType: 'non_english' },
  { code: 'fr', label: '프랑스어', nativeLabel: 'Français', flag: '🇫🇷', regionType: 'non_english' },
  { code: 'es', label: '스페인어', nativeLabel: 'Español', flag: '🇪🇸', regionType: 'non_english' },
  { code: 'de', label: '독일어', nativeLabel: 'Deutsch', flag: '🇩🇪', regionType: 'non_english' },
];

export interface SpeciesNameTranslations {
  ko: string;
  en: string;
  zh: string;
  ja: string;
  fr: string;
  es: string;
  de: string;
}

export const SPECIES_TRANSLATION_MAP: Record<string, SpeciesNameTranslations> = {
  // 조류 (Birds)
  '서양민들레': { ko: '서양민들레', en: 'Common Dandelion', zh: '西洋蒲公英', ja: 'セイヨウタンポポ', fr: 'Pissenlit commun', es: 'Diente de león', de: 'Gewöhnlicher Löwenzahn' },
  '직박구리': { ko: '직박구리', en: 'Brown-eared Bulbul', zh: '栗耳短脚鹎', ja: 'ヒヨドリ', fr: 'Bulbul à oreilles brunes', es: 'Bulbul orejipardo', de: 'Braunohrbülbül' },
  '왕벚나무': { ko: '왕벚나무', en: 'King Cherry', zh: '染井吉野樱', ja: 'ソメイヨシノ', fr: 'Cerisier du Japon', es: 'Cerezo de flor japonés', de: 'Yoshino-Kirsche' },
  '호랑나비': { ko: '호랑나비', en: 'Asian Swallowtail', zh: '柑橘凤蝶', ja: 'ナミアゲハ', fr: 'Grand porte-queue asiatique', es: 'Mariposa cola de golondrina asiática', de: 'Asiatischer Schwalbenschwanz' },
  '다람쥐': { ko: '다람쥐', en: 'Siberian Chipmunk', zh: '花栗鼠', ja: 'シマリス', fr: 'Tamia de Sibérie', es: 'Ardilla coreana', de: 'Burunduk' },
  '참새': { ko: '참새', en: 'Eurasian Tree Sparrow', zh: '麻雀', ja: 'スズメ', fr: 'Moineau friquet', es: 'Gorrión molinero', de: 'Feldsperling' },
  '몬스테라 델리시오사': { ko: '몬스테라 델리시오사', en: 'Swiss Cheese Plant', zh: '龟背竹', ja: 'モンステラ', fr: 'Monstera délicieuse', es: 'Costilla de Adán', de: 'Köstliches Fensterblatt' },
  '유럽 울새 (로빈)': { ko: '유럽 울새 (로빈)', en: 'European Robin', zh: '欧亚鸲', ja: 'ヨーロッパコマドリ', fr: 'Rouge-gorge familier', es: 'Petirrojo europeo', de: 'Rotkehlchen' },
  '유럽 울새': { ko: '유럽 울새', en: 'European Robin', zh: '欧亚鸲', ja: 'ヨーロッパコマドリ', fr: 'Rouge-gorge familier', es: 'Petirrojo europeo', de: 'Rotkehlchen' },
  '청둥오리': { ko: '청둥오리', en: 'Mallard', zh: '绿头鸭', ja: 'マガモ', fr: 'Canard colvert', es: 'Ánade azulón', de: 'Stockente' },
  '청띠제비나비': { ko: '청띠제비나비', en: 'Common Bluebottle', zh: '青凤蝶', ja: 'アオスジアゲハ', fr: 'Voilier bleu', es: 'Mariposa azul común', de: 'Blauflaschen-Schwalbenschwanz' },
  '비단잉어': { ko: '비단잉어', en: 'Fancy Carp (Koi)', zh: '锦鲤', ja: 'ニシキゴイ', fr: 'Carpe koï', es: 'Carpa koi', de: 'Koi-Karpfen' },
  '유혈목이 (꽃뱀)': { ko: '유혈목이 (꽃뱀)', en: 'Tiger Keelback', zh: '虎斑颈槽蛇', ja: 'ヤマカガシ', fr: 'Serpent tigre', es: 'Culebra tigre japonesa', de: 'Tigernatter' },
  '유혈목이': { ko: '유혈목이', en: 'Tiger Keelback', zh: '虎斑颈槽蛇', ja: 'ヤマカガシ', fr: 'Serpent tigre', es: 'Culebra tigre japonesa', de: 'Tigernatter' },
  '청개구리': { ko: '청개구리', en: 'Japanese Tree Frog', zh: '日本雨蛙', ja: 'ニホンアマガエル', fr: 'Rainette du Japon', es: 'Ranita de San Antonio japonesa', de: 'Japanischer Laubfrosch' },
  '명주달팽이': { ko: '명주달팽이', en: 'Korean Land Snail', zh: '朝鲜巴蜗牛', ja: 'ウスカワマイマイ', fr: 'Escargot terrestre coréen', es: 'Caracol terrestre coreano', de: 'Koreanische Landschnecke' },
  '무당벌레': { ko: '무당벌레', en: 'Asian Lady Beetle', zh: '异色瓢虫', ja: 'ナミテントウ', fr: 'Coccinelle asiatique', es: 'Mariquita asiática', de: 'Asiatischer Marienkäfer' },
  '느타리버섯': { ko: '느타리버섯', en: 'Oyster Mushroom', zh: '平菇', ja: 'ヒラタケ', fr: 'Pleurote en huître', es: 'Seta de ostra', de: 'Austern-Seitling' },
  '광대버섯': { ko: '광대버섯', en: 'Fly Agaric', zh: '毒蝇伞', ja: 'ベニテングタケ', fr: 'Amanite tue-mouches', es: 'Matamoscas', de: 'Fliegenpilz' },
  '무당거미': { ko: '무당거미', en: 'Joro Spider', zh: '棒络新妇', ja: 'ジョロウグモ', fr: 'Araignée Joro', es: 'Araña Joro', de: 'Joro-Spinne' },
  '다슬기': { ko: '다슬기', en: 'Semisulcospira Snail', zh: '放逸短沟蜷', ja: 'カワニナ', fr: 'Escargot d’eau douce coréen', es: 'Caracol fluvial coreano', de: 'Süßwasserschnecke' },
  '참가재': { ko: '참가재', en: 'Korean Freshwater Crayfish', zh: '东北黑螯虾', ja: 'ニホンザリガニ', fr: 'Écrevisse de Corée', es: 'Cangrejo de río coreano', de: 'Koreanischer Flusskrebs' },
  '토끼풀': { ko: '토끼풀', en: 'White Clover', zh: '白车轴草', ja: 'シロツメクサ', fr: 'Trèfle blanc', es: 'Trébol blanco', de: 'Weiß-Klee' },
  '소나무': { ko: '소나무', en: 'Korean Red Pine', zh: '赤松', ja: 'アカマツ', fr: 'Pin rouge du Japon', es: 'Pino rojo japonés', de: 'Japanische Rotkiefer' },
  '참게': { ko: '참게', en: 'Chinese Mitten Crab', zh: '中华绒螯蟹', ja: 'モクズガニ', fr: 'Crabe chinois', es: 'Cangrejo chino', de: 'Chinesische Wollhandkrabbe' },
  '붉은사슴뿔버섯': { ko: '붉은사슴뿔버섯', en: 'Poison Fire Coral', zh: '火红毒角菌', ja: 'カエンタケ', fr: 'Corail de feu vénéneux', es: 'Coral de fuego venenoso', de: 'Feuerkoralle' },
  '독우산광대버섯': { ko: '독우산광대버섯', en: 'Destroying Angel', zh: '鳞柄白毒鹅膏', ja: 'ドクツルタケ', fr: 'Amanite vireuse', es: 'Cicuta blanca', de: 'Kegelhütiger Knollenblätterpilz' },
  '송이버섯': { ko: '송이버섯', en: 'Matsutake Mushroom', zh: '松茸', ja: 'マツタケ', fr: 'Champignon Matsutaké', es: 'Hongo Matsutake', de: 'Kiefernwald-Egerling' },
  '영지버섯': { ko: '영지버섯', en: 'Lingzhi Mushroom / Reishi', zh: '灵芝', ja: 'マンgrouped', fr: 'Reishi / Ganoderme luisant', es: 'Hongo Reishi', de: 'Glänzender Lackporling' },
  '쉬리': { ko: '쉬리', en: 'Korean Shiner', zh: '韩鲟鲴', ja: 'ヤチウグイ', fr: 'Shiner de Corée', es: 'Carpita coreana', de: 'Koreanischer Elritze' },
  '각시붕어': { ko: '각시붕어', en: 'Korean Bitterling', zh: '高体鳑鲏', ja: 'バラタナゴ', fr: 'Bouvière de Corée', es: 'Pez amargo coreano', de: 'Koreanischer Bitterling' },
  '꺽지': { ko: '꺽지', en: 'Korean Perch', zh: '短体鳜', ja: 'コウライオ야ニラミ', fr: 'Perche coréenne', es: 'Perca coreana', de: 'Koreanischer Buntbarsch' },
  '쏘가리': { ko: '쏘가리', en: 'Golden Mandarin Fish', zh: '鳜鱼', ja: 'コウライケツギョ', fr: 'Poisson mandarin léopard', es: 'Pez mandarín chino', de: 'Flussmandarinfisch' },
  '버들치': { ko: '버들치', en: 'Chinese Minnow', zh: '洛氏鱥', ja: 'アブラハヤ', fr: 'Vairon d’Asie', es: 'Piscardón asiático', de: 'Asiatische Elritze' },
  '은어': { ko: '은어', en: 'Ayu Sweetfish', zh: '香鱼', ja: 'アユ', fr: 'Ayu (Poisson doux)', es: 'Pez dulce Ayu', de: 'Ayu-Fisch' },
  '왜가리': { ko: '왜가리', en: 'Grey Heron', zh: '苍鹭', ja: 'アオサギ', fr: 'Héron cendré', es: 'Garza real', de: 'Graureiher' },
  '물총새': { ko: '물총새', en: 'Common Kingfisher', zh: '普通翠鸟', ja: 'カワセミ', fr: 'Martin-pêcheur d’Europe', es: 'Martín pescador común', de: 'Eisvogel' },
  '원앙': { ko: '원앙', en: 'Mandarin Duck', zh: '鸳鸯', ja: 'オシドリ', fr: 'Canard mandarin', es: 'Pato mandarín', de: 'Mandarinente' },
  '개나리': { ko: '개나리', en: 'Korean Goldenbell', zh: '朝鲜连翘', ja: 'チョウセンレンギョウ', fr: 'Forsythia de Corée', es: 'Campana dorada coreana', de: 'Koreanische Forsythie' },
  '문주란': { ko: '문주란', en: 'Poison Bulb', zh: '文殊兰', ja: 'ハマユウ', fr: 'Lis araignée', es: 'Lirio araña', de: 'Hakenlilie' },
  '청설모': { ko: '청설모', en: 'Eurasian Red Squirrel', zh: '欧亚红松鼠', ja: 'キタリス', fr: 'Écureuil roux', es: 'Ardilla roja', de: 'Eichhörnchen' },
  '너구리': { ko: '너구리', en: 'Raccoon Dog', zh: '貉', ja: 'タヌキ', fr: 'Chien viverrin', es: 'Tanuki / Perro mapache', de: 'Marderhund' },
  '배추흰나비': { ko: '배추흰나비', en: 'Small White', zh: '菜粉蝶', ja: 'モンシロチョウ', fr: 'Piéride du chou', es: 'Blanquita de la col', de: 'Kleiner Kohlweißling' },
  '서양꿀벌': { ko: '서양꿀벌', en: 'Western Honeybee', zh: '意大利蜜蜂', ja: 'セイヨウミツバチ', fr: 'Abeille européenne', es: 'Abeja melífera europea', de: 'Westliche Honigbiene' },
  '토코투칸 (큰부리새)': { ko: '토코투칸 (큰부리새)', en: 'Toco Toucan', zh: '巨嘴鸟', ja: 'オニオオハシ', fr: 'Toucan toco', es: 'Tucán toco', de: 'Riesentukan' },
  '토코투칸': { ko: '토코투칸', en: 'Toco Toucan', zh: '巨嘴鸟', ja: 'オニオオハシ', fr: 'Toucan toco', es: 'Tucán toco', de: 'Riesentukan' },
  '황제펭귄': { ko: '황제펭귄', en: 'Emperor Penguin', zh: '帝企鹅', ja: 'コウテイペンギン', fr: 'Manchot empereur', es: 'Pingüino emperador', de: 'Kaiserpinguin' },
  '붉은플라밍고 (카리브 홍학)': { ko: '붉은플라밍고 (카리브 홍학)', en: 'American Flamingo', zh: '美洲红鹳', ja: 'ベニイロフラミンゴ', fr: 'Flamant des Caraïbes', es: 'Flamenco americano', de: 'Kubaflamingo' },
  '흰머리수리 (미국 국조)': { ko: '흰머리수리 (미국 국조)', en: 'Bald Eagle', zh: '白头海雕', ja: 'ハクトウワシ', fr: 'Pygargue à tête blanche', es: 'Águila calva', de: 'Weißkopfseeadler' },
  '루비목벌새': { ko: '루비목벌새', en: 'Ruby-throated Hummingbird', zh: '红喉北蜂鸟', ja: 'ノドアカハチドリ', fr: 'Colibri à gorge rubis', es: 'Colibrí gorgirrubí', de: 'Rubinkehlkolibri' },
  '자이언트 판다': { ko: '자이언트 판다', en: 'Giant Panda', zh: '大熊猫', ja: 'ジャイアントパンダ', fr: 'Panda géant', es: 'Panda gigante', de: 'Großer Panda' },
  '아프리카 사자': { ko: '아프리카 사자', en: 'African Lion', zh: '非洲狮', ja: 'ライオン', fr: 'Lion d’Afrique', es: 'León africano', de: 'Afrikanischer Löwe' },
  '붉은캥거루': { ko: '붉은캥거루', en: 'Red Kangaroo', zh: '红大袋鼠', ja: 'アカカンガルー', fr: 'Kangourou roux', es: 'Canguro rojo', de: 'Rotes Riesenkänguru' },
  '호랑이꼬리여우원숭이 (링테일 리머)': { ko: '호랑이꼬리여우원숭이 (링테일 리머)', en: 'Ring-tailed Lemur', zh: '环尾狐猴', ja: 'ワオキツネザル', fr: 'Lémur catta', es: 'Lémur de cola anillada', de: 'Katta' },
  '팬서 카멜레온': { ko: '팬서 카멜레온', en: 'Panther Chameleon', zh: '豹变色龙', ja: 'パンサーカメレオン', fr: 'Caméléon panthère', es: 'Camaleón pantera', de: 'Pantherchamäleon' },
  '붉은눈나무개구리': { ko: '붉은눈나무개구리', en: 'Red-eyed Tree Frog', zh: '红眼树蛙', ja: 'アカメアマガエル', fr: 'Rainette aux yeux rouges', es: 'Rana arborícola de ojos rojos', de: 'Rotaugenlaubfrosch' },
  '흰동가리 (클라운피시)': { ko: '흰동가리 (클라운피시)', en: 'Ocellaris Clownfish', zh: '眼斑双锯鱼', ja: 'カクレクマノミ', fr: 'Poisson-clown à trois bandes', es: 'Pez payaso común', de: 'Echter Clownfisch' },
  '흰동가리': { ko: '흰동가리', en: 'Ocellaris Clownfish', zh: '眼斑双锯鱼', ja: 'カクレクマノミ', fr: 'Poisson-clown à trois bandes', es: 'Pez payaso común', de: 'Echter Clownfisch' },
  '고래상어': { ko: '고래상어', en: 'Whale Shark', zh: '鲸鲨', ja: 'ジンベエザメ', fr: 'Requin-baleine', es: 'Tiburón ballena', de: 'Walhai' },
  '대왕쥐가오리 (만타레이)': { ko: '대왕쥐가오리 (만타레이)', en: 'Giant Manta Ray', zh: '双吻前口蝠鲼', ja: 'オニイトマキエイ', fr: 'Raie manta géante', es: 'Manta gigante', de: 'Riesenmanta' },
  '블루 모르포 나비': { ko: '블루 모르포 나비', en: 'Blue Morpho Butterfly', zh: '闪蝶 (蓝摩尔福蝶)', ja: 'モルフォチョウ', fr: 'Morpho bleu', es: 'Mariposa morfo azul', de: 'Himmelsfalter' },
  '헤라클레스 장수풍뎅이': { ko: '헤라클레스 장수풍뎅이', en: 'Hercules Beetle', zh: '长戟大兜虫', ja: 'ヘラクレスオオカブト', fr: 'Dynaste Hercule', es: 'Escarabajo hércules', de: 'Herkuleskäfer' },
  '그랑디디에 바오밥나무': { ko: '그랑디디에 바오밥나무', en: 'Grandidier’s Baobab', zh: '大猴面包树', ja: 'グランディディエバオバブ', fr: 'Baobab de Grandidier', es: 'Baobab de Grandidier', de: 'Grandidier-Baobab' },
  '파리지옥': { ko: '파리지옥', en: 'Venus Flytrap', zh: '捕蝇草', ja: 'ハエトリグサ', fr: 'Dionée attrape-mouche', es: 'Atrapamoscas de Venus', de: 'Venusfliegenfalle' },
  '야자집게 (코코넛크랩)': { ko: '야자집게 (코코넛크랩)', en: 'Coconut Crab', zh: '椰子蟹', ja: 'ヤシガニ', fr: 'Crabe de cocotier', es: 'Cangrejo de los cocoteros', de: 'Palmendieb' },
  '블루드래곤 갯민숭달팽이': { ko: '블루드래곤 갯민숭달팽이', en: 'Blue Dragon / Sea Swallow', zh: '大西洋海神海蛞蝓', ja: 'アオミノウミウシ', fr: 'Glaucus atlantique / Dragon bleu', es: 'Dragón azul de mar', de: 'Blaue Ozeanschnecke' },
};

/**
 * Clean helper to strip parenthesis notes like '유혈목이 (꽃뱀)' -> '유혈목이'
 */
function cleanKey(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

/**
 * Find translation record for a specimen
 */
export function findSpeciesTranslation(name: string): SpeciesNameTranslations | null {
  if (!name) return null;
  const direct = SPECIES_TRANSLATION_MAP[name];
  if (direct) return direct;
  const cleaned = cleanKey(name);
  if (SPECIES_TRANSLATION_MAP[cleaned]) return SPECIES_TRANSLATION_MAP[cleaned];

  for (const [key, val] of Object.entries(SPECIES_TRANSLATION_MAP)) {
    if (key.includes(cleaned) || cleaned.includes(key)) {
      return val;
    }
  }
  return null;
}

/**
 * Get the English common name for a specimen
 */
export function getSpeciesEnglishName(specimen: {
  koreanName?: string;
  scientificName?: string;
  englishName?: string;
}): string {
  if (specimen.englishName) return specimen.englishName;
  const tr = findSpeciesTranslation(specimen.koreanName || '');
  if (tr?.en) return tr.en;
  return specimen.scientificName || specimen.koreanName || '';
}

/**
 * Get localized primary name according to selected language
 */
export function getSpeciesPrimaryName(
  specimen: { koreanName?: string; scientificName?: string; englishName?: string },
  lang: SupportedLanguage = 'ko'
): string {
  const fallback = specimen.koreanName || specimen.scientificName || '';
  if (lang === 'ko') return fallback;

  const tr = findSpeciesTranslation(specimen.koreanName || '');
  if (tr && tr[lang]) return tr[lang];

  if (lang === 'en') {
    return specimen.englishName || tr?.en || specimen.scientificName || fallback;
  }

  // If translation for this language not found, return English or Korean name
  return tr?.en || specimen.englishName || fallback;
}

/**
 * Formatted display name taking into account user language setting and "영어이름 함께 보기" toggle
 * e.g. "서양민들레 (Common Dandelion)" or "서양민들레" or "Common Dandelion"
 */
export function formatSpeciesDisplayName(
  specimen: { koreanName?: string; scientificName?: string; englishName?: string },
  options?: {
    language?: SupportedLanguage;
    showEnglishNameWithLocal?: boolean;
    separator?: string;
  }
): string {
  const lang = options?.language || 'ko';
  const showEnglish = options?.showEnglishNameWithLocal !== false;
  const separator = options?.separator || ' ';

  const primaryName = getSpeciesPrimaryName(specimen, lang);
  const englishName = getSpeciesEnglishName(specimen);

  // If user selected English, primary name is already English
  if (lang === 'en') {
    return primaryName;
  }

  // If non-English and "영어이름 함께 보기" is ON
  if (showEnglish && englishName && englishName !== primaryName) {
    return `${primaryName}${separator}(${englishName})`;
  }

  return primaryName;
}
