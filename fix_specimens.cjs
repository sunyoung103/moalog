const fs = require('fs');
let code = fs.readFileSync('src/data/defaultSpecimens.ts', 'utf-8');

// Replace sp-011 다람쥐 -> 비단잉어 (fishes)
code = code.replace(
  /id: 'sp-011'[\s\S]*?id: 'obs-011-1'[\s\S]*?\},/g,
  `id: 'sp-011',
    number: 'No.011',
    koreanName: '비단잉어',
    scientificName: 'Cyprinus rubrofuscus',
    category: 'fishes',
    family: '잉어과 (Cyprinidae)',
    genus: '잉어속 (Cyprinus)',
    isCollected: true,
    confidence: 97,
    stickerImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
    originalImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
    taxonomyPath: ['동물계', '척삭동물문', '조기어강', '잉어목', '잉어과', '잉어속', '비단잉어'],
    traitChips: ['어류', '화려한 색상', '관상용', '민물고기', '잡식성'],
    habitatType: '하천/호수',
    colorPalette: ['#F97316', '#DC2626', '#FEF08A', '#F8FAFC', '#020617'],
    locationCoord: {
      name: '여의도 샛강 생태공원',
      city: '서울',
      district: '영등포구',
      country: '대한민국',
      environmentType: 'water',
      x: 35,
      y: 45,
      mapScope: 'seoul',
    },
    wikiSummary: '비단잉어는 잉어과 잉어속에 속하는 관상용 민물고기로, 붉은색, 흰색, 노란색 등 다양한 색상 변이가 있습니다.',
    wikiUrl: 'https://ko.wikipedia.org/wiki/%EB%B9%84%EB%8B%A8%EC%9E%89%EC%96%B4',
    seasonalTip: '여름철 활동이 가장 활발하며 무리를 지어 다닙니다.',
    observations: [
      {
        id: 'obs-011-1',
        date: '2026.08.15',
        time: '오후 2:30',
        location: '샛강 생태공원 연못',
        weather: '☀️ 맑음',
        temperature: '28°C',
        photoUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
        seasonLabel: '여름 연못',
        memo: '연못 한가운데를 유유히 헤엄치는 비단잉어 무리.',
      },`
);

// Replace sp-014 호랑나비 -> 붉은사슴뿔버섯 or 달팽이 (others)
code = code.replace(
  /id: 'sp-014'[\s\S]*?id: 'obs-014-1'[\s\S]*?\},/g,
  `id: 'sp-014',
    number: 'No.014',
    koreanName: '명주달팽이',
    scientificName: 'Acusta despecta',
    category: 'others',
    family: '명주달팽이과 (Bradybaenidae)',
    genus: '명주달팽이속 (Acusta)',
    isCollected: true,
    confidence: 94,
    stickerImage: 'https://images.unsplash.com/photo-1533036421045-31f0db43d4bd?w=600&auto=format&fit=crop&q=80',
    originalImage: 'https://images.unsplash.com/photo-1533036421045-31f0db43d4bd?w=1200&auto=format&fit=crop&q=80',
    taxonomyPath: ['동물계', '연체동물문', '복족강', '병안목', '명주달팽이과', '명주달팽이속', '명주달팽이'],
    traitChips: ['연체동물', '나선형 껍질', '습지 서식', '야행성', '초식성'],
    habitatType: '도심/골목길',
    colorPalette: ['#D6D3D1', '#A8A29E', '#78716C', '#44403C', '#292524'],
    locationCoord: {
      name: '동네 텃밭',
      city: '서울',
      district: '강동구',
      country: '대한민국',
      environmentType: 'urban',
      x: 75,
      y: 45,
      mapScope: 'seoul',
    },
    wikiSummary: '명주달팽이는 비가 오는 날이나 습한 밤에 주로 활동하는 대표적인 육상 달팽이입니다.',
    wikiUrl: 'https://ko.wikipedia.org/wiki/%EB%8B%AC%ED%8C%BD%EC%9D%B4',
    seasonalTip: '장마철이나 비 온 뒤 축축한 흙이나 식물 잎에서 흔히 보입니다.',
    observations: [
      {
        id: 'obs-014-1',
        date: '2026.07.12',
        time: '오후 7:00',
        location: '비 온 뒤 동네 화단',
        weather: '🌧️ 비',
        temperature: '24°C',
        photoUrl: 'https://images.unsplash.com/photo-1533036421045-31f0db43d4bd?w=600&auto=format&fit=crop&q=80',
        seasonLabel: '여름 장마철',
        memo: '비가 온 뒤 잎사귀 위로 기어가는 달팽이 발견.',
      },`
);

fs.writeFileSync('src/data/defaultSpecimens.ts', code);
