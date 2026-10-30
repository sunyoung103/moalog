// 예술 점수 산출 (포켓몬 스냅 · 젰다 5대 구도 기반 채점). LensView와 온보딩이 같은 결과를 쓰도록 공용으로 둡니다.

export const getArtScore = (preset: any, seedIndex: number) => {
  const name = preset?.name || 'specimen';

  let seed = 0;
  for (let i = 0; i < name.length; i++) {
    seed += name.charCodeAt(i);
  }
  seed += seedIndex * 23;

  // 5 criteria (each max 20) -> Total max 100
  const pose = 16 + (seed % 5); // 16 ~ 20
  const size = 16 + ((seed * 3) % 5); // 16 ~ 20
  const direction = 15 + ((seed * 7) % 6); // 15 ~ 20
  const background = 16 + ((seed * 11) % 5); // 16 ~ 20
  const clarity = 16 + ((seed * 13) % 5); // 16 ~ 20
  const total = pose + size + direction + background + clarity;

  let grade: 'S' | 'A' | 'B' | 'C' = 'B';
  let stars = 3;
  let gradeTitle = '우수 관찰작 (Good Shot)';
  let feedbackTip = '피사체가 중앙에 안정적으로 위치하며 자연스러운 생태 활동을 잘 담아냈습니다.';

  if (total >= 93) {
    grade = 'S';
    stars = 5;
    gradeTitle = '★ 전설적인 하이랄 명작 포착 (S-Rank Masterpiece)';
    feedbackTip = '황금비율과 완벽한 시선 처리! 박물관 명예의 전당 등재 수준의 완벽한 구도입니다.';
  } else if (total >= 85) {
    grade = 'A';
    stars = 4;
    gradeTitle = '★ 마스터피스 도감 사진 (A-Rank Excellent)';
    feedbackTip = '피사체의 생동감이 탁월합니다. 앵글을 살짝만 더 낮추면 S등급 100점을 달성할 수 있습니다.';
  } else if (total >= 75) {
    grade = 'B';
    stars = 3;
    gradeTitle = '표준 도감 구도 (B-Rank Standard)';
    feedbackTip = '자연광이 드는 방향에서 피사체가 중앙에 오도록 줌을 조절해 재도전해 보세요.';
  } else {
    grade = 'C';
    stars = 2;
    gradeTitle = '관찰 기록용 (C-Rank Entry)';
    feedbackTip = '배경과 피사체가 겹치지 않게 거리와 포커스를 조정해 재도전해 보세요.';
  }

  return { pose, size, direction, background, clarity, total, grade, stars, gradeTitle, feedbackTip };
};
