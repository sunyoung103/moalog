# 모아로그 인수인계 (짧게 유지)

## 현재 상태 (2026-10-29 기준)
- tsc --noEmit 통과 / npm run build 통과
- 예시 사진 16장 적용됨: src/assets/specimens (unsplash_*.png)
- 물총새 공통 상수: src/data/specimenImages.ts (KINGFISHER_PHOTO). 현재 import는 unsplash_L-2p8fapOA8.png. 다른 사진으로 바꾸려면 이 한 줄만 수정.
- 게스트 기본 도감: 전부 예시(미수집), 무료 칸 0 사용 (src/App.tsx createDefaultSpecimens)

## 핵심 규칙
- 무료 칸 = isCollected && !isPending 인 항목만 집계 (무료 10칸)
- 예시 60종(src/data/exampleSpecimens.ts): isCollected:false, 칸 미사용
- 직접 촬영/앨범 저장: LensView가 isCollected:true로 저장, 10칸 제한 적용
- 로그인 신규 가입 시 예시 60종 자동 추가 (src/App.tsx handleLoginSuccess)

## 기획서 작업 목록 (다른 창에서 진행)
기획서 페이지: F-1 카메라/Live, F-2 탐험 맵, F-3 메모·게시, F-4 척척박사, 온보딩 1~6, 요금제 P-1~P-3
아래는 기획 기준 '구현 여부 미확인' 항목입니다. 구현 전에 코드에서 해당 기능이 있는지 먼저 확인.
- [~] F-1 Live 포토: 무료 Live 토글 시 이용권 시트, 유료 Live ON 시 리뷰 프레임 바 순환(보조 지표용, 실제 영상/프레임 저장 없음)
- [ ] F-2 탐험 맵: 핀 미리보기, 하트/응원하기/즐겨찾기, 즐겨찾는 사람 지도
- [ ] F-3 메모: 포착 단위 메모, 공개(탐험 맵) 여부, 멸종위기종 위치 자동 숨김
- [ ] F-4 척척박사: 백과 화면 하단 AI 질문 버튼, 추천 질문, 대화
- [ ] 온보딩: 스플래시 → 첫 화면 → 관심 질문 4개 → 첫 포착 체험 → 저장 시 가입 → 요금제
- [ ] 요금제 P-1~P-3: 연간/월/영구 플랜, 10칸 초과 시 안내, 원본/Live 잠금, 구독 종료 후 상태

## 주의
- git 저장소 아님. 큰 삭제 전 확인.
- 파일 편집 시 PowerShell 한글 인코딩 문제 있음 → UTF-8(BOM 없음) 명시.
- 토큰 절약: 전체 파일 읽지 말고 Select-String으로 필요한 줄만 확인.