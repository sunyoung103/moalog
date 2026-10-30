import { KINGFISHER_PHOTO } from '../data/specimenImages';
import { getArtScore } from '../utils/artScore';
import { LensView } from './LensView';
import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  ChevronRight,
  ArrowLeft,
  Camera,
  ImageIcon,
  Search,
  BookOpen,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { NaturalistPersona, UserAccount, Specimen, LoginOptions } from '../types';
import { mockSocialLogin } from '../utils/auth';
import { INITIAL_SPECIMENS } from '../data/defaultSpecimens';
import { SPECIES_ECOLOGY_ENCYCLOPEDIA } from '../data/hotspots';
import { EXPLORER_BADGES_MASTER, EXPLORER_LEVEL_MIN_EXP } from '../data/badges';
import { RadarChart } from './RadarChart';

export interface OnboardingModalProps {
  onComplete: (selectedPersona?: NaturalistPersona, firstSpecimen?: Specimen) => void;
  onLoginSuccess: (account: UserAccount, opts?: LoginOptions) => void;
  userAccount?: UserAccount;
  initialPersona?: NaturalistPersona;
  initialStep?: OnboardingFlowStep;
}

export type OnboardingFlowStep =
  // FLOW 1-1
  | 'splash'
  | 'preview'
  // FLOW 1-2 질문
  | 'q_intro'
  | 'q_kingdom'
  | 'q_subgroup'
  | 'q_location'
  | 'q_purpose'
  | 'q_ready'
  // FLOW 1-3 첫 포착 체험
  | 'capture_method'
  | 'capture_viewfinder'
  | 'capture_gallery'
  | 'capture_analyzing'
  | 'capture_result'
  // FLOW 1-4 도감 등록 & 가입
  | 'save_card'
  | 'terms_agreement'
  | 'signup_complete'
  // FLOW 1-5 요금제
  | 'plan_compare';

// Kingfisher (물총새) spec matching FLOW 1-3, 1-4, 1-5
const KINGFISHER_SPECIMEN: Specimen = {
  id: 'sp-kingfisher-001',
  number: 'No.001',
  koreanName: '물총새',
  scientificName: 'Alcedo atthis',
  englishName: 'Common Kingfisher',
  category: 'birds',
  family: '물총새과',
  genus: '물총새속',
  isCollected: true,
  confidence: 98,
  stickerImage: KINGFISHER_PHOTO,
  originalImage: KINGFISHER_PHOTO,
  taxonomyPath: ['동물계', '척삭동물문', '조강', '파랑새목', '물총새과', '물총새속', '물총새'],
  traitChips: ['여름철새', '하천·호수', '약 17cm', '작은 물고기'],
  habitatType: '하천/호수',
  colorPalette: ['#0284C7', '#EA580C', '#0369A1', '#C2410C', '#F8FAFC'],
  locationCoord: {
    name: '양재천 둔치 수풀',
    city: '서울',
    district: '강남구 개포동',
    country: '대한민국',
    environmentType: 'nature_wild',
    x: 52,
    y: 60,
    mapScope: 'seoul',
  },
  wikiSummary: '물총새는 파랑새목 물총새과의 대표 조류입니다. 코발트 블루의 등과 선명한 주황색 배를 지니며, 나뭇가지에 앉아 물속의 작은 물고기를 쏜살같이 낚아챕니다.',
  wikiUrl: 'https://ko.wikipedia.org/wiki/%EB%AC%BC%EC%B4%9D%EC%83%88',
  seasonalTip: '봄부터 가을까지 양재천이나 탄천 여울목 나뭇가지에 앉아 있는 모습을 관찰할 수 있습니다.',
  observations: [
    {
      id: 'obs-kf-1',
      date: '2026.10.25',
      time: '14:32',
      location: '양재천 둔치 수풀',
      weather: '☀️ 맑음',
      temperature: '21°C',
      photoUrl: KINGFISHER_PHOTO,
      seasonLabel: '성체 관찰',
      memo: '나뭇가지 끝에 앉은 순간을 포착. 등깃의 코발트 청록색이 자연광에서 선명함.',
      analysisMetadata: {
        imageClarityScore: 92,
        isTargetInFocus: true,
        featuresDetected: ['wing_pattern', 'beak_profile', 'chest_color'],
        recognitionConfidence: 98,
      },
    },
  ],
};

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onComplete,
  onLoginSuccess,
  userAccount,
  initialPersona = 'birder',
  initialStep = 'splash',
}) => {
  const [step, setStep] = useState<OnboardingFlowStep>(initialStep);

  // FLOW 1-1 Login sheet state
  const [isLoginSheetOpen, setIsLoginSheetOpen] = useState(false);
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);

  // FLOW 1-2 Question State
  const [qKingdom, setQKingdom] = useState<'plants' | 'animals' | 'both'>('animals');
  const [qSubgroups, setQSubgroups] = useState<string[]>(['조류', '곤충', '바다 생물']);
  const [showOppositeGroup, setShowOppositeGroup] = useState(false);
  const [qLocations, setQLocations] = useState<string[]>(['동네 산책길']);
  const [qFrequency, setQFrequency] = useState<string>('주말에만');
  const [qPurposes, setQPurposes] = useState<string[]>([
    '보이는 생물 이름이 궁금해요',
    '나만의 도감을 채우고 싶어요',
    '뱃지 모으고 레벨업 하고 싶어요',
  ]);
  const [assignedPersona, setAssignedPersona] = useState<NaturalistPersona>('birder');

  // FLOW 1-3 Capture & AI Result State
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number>(0);
  const [analysisProgressStep, setAnalysisProgressStep] = useState<number>(0); // 0, 1, 2, 3
  const [resultSubTab, setResultSubTab] = useState<'wiki' | 'score'>('wiki');
  const [isChooseAltModalOpen, setIsChooseAltModalOpen] = useState(false);
  const [chosenSpecimen, setChosenSpecimen] = useState<Specimen>(KINGFISHER_SPECIMEN);
  const onboardingScore = getArtScore({ name: chosenSpecimen.koreanName }, 0);
  const [searchAltQuery, setSearchAltQuery] = useState('');
  // Plan intro is shown once per account after signup (tracked per account id)
  const planIntroKey = (id?: string) => `moalog_plan_intro_${id || 'guest'}`;
  const hasSeenPlanIntro = (id?: string): boolean => {
    try { return localStorage.getItem(planIntroKey(id)) === 'true'; } catch { return false; }
  };
  const markPlanIntroSeen = (id?: string) => {
    try { localStorage.setItem(planIntroKey(id), 'true'); } catch {}
  };
  

  // FLOW 1-4 Save & Signup State
  const [isSaveAuthSheetOpen, setIsSaveAuthSheetOpen] = useState(false);
  const [agreeAll, setAgreeAll] = useState(true);
  const [agreeAge, setAgreeAge] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [agreePrivacy, setAgreePrivacy] = useState(true);
  const [agreeLocation, setAgreeLocation] = useState(true);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  // FLOW 1-5 Plan State
  const [selectedPlanTier, setSelectedPlanTier] = useState<'yearly' | 'monthly' | 'lifetime'>('yearly');

  // 9 Specimen Stickers for FLOW 1-1 Preview
  const previewStickers = useMemo(() => {
    const picks = [
      INITIAL_SPECIMENS[0],
      INITIAL_SPECIMENS[14],
      INITIAL_SPECIMENS[1],
      INITIAL_SPECIMENS[10],
      INITIAL_SPECIMENS[12],
      INITIAL_SPECIMENS[13],
      INITIAL_SPECIMENS[11],
      INITIAL_SPECIMENS[2],
      INITIAL_SPECIMENS[15],
    ].filter(Boolean);

    const angles = [-3, 2.5, -2, 3.2, 0, -2.8, 2, -3.5, 2.2];
    return picks.map((sp, idx) => ({
      sp,
      tilt: angles[idx % angles.length],
      img: sp.stickerImage || sp.originalImage,
    }));
  }, []);

  // FLOW 1-3 Gallery candidate photos
  const sampleGalleryPhotos = [
    {
      id: 'photo-1',
      title: '물총새 (양재천)',
      targetKoreanName: '물총새',
      url: KINGFISHER_PHOTO,
      category: '조류',
    },
    {
      id: 'photo-2',
      title: '작은멋쟁이나비',
      targetKoreanName: '작은멋쟁이나비',
      url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&auto=format&fit=crop&q=80',
      category: '곤충',
    },
    {
      id: 'photo-3',
      title: '비단잉어 (연못)',
      targetKoreanName: '비단잉어',
      url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
      category: '어류',
    },
    {
      id: 'photo-4',
      title: '청개구리',
      targetKoreanName: '청개구리',
      url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80',
      category: '양서류',
    },
    {
      id: 'photo-5',
      title: '서양민들레',
      targetKoreanName: '서양민들레',
      url: 'https://images.unsplash.com/photo-1558285549-2a06fdfc5547?w=800&auto=format&fit=crop&q=80',
      category: '식물',
    },
    {
      id: 'photo-6',
      title: '느타리버섯',
      targetKoreanName: '느타리버섯',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
      category: '균류',
    },
  ];

  // Auto-login transition logic on splash
  useEffect(() => {
    if (step === 'splash') {
      const isAuto = Boolean(userAccount?.isLoggedIn);
      const timer = setTimeout(() => {
        if (isAuto) {
          onComplete(assignedPersona, chosenSpecimen);
        } else {
          setStep('preview');
        }
      }, isAuto ? 1200 : 1600);

      return () => clearTimeout(timer);
    }
  }, [step, userAccount, onComplete, assignedPersona, chosenSpecimen]);

  // Analysis progress animation for FLOW 1-3 STEP 4
  useEffect(() => {
    if (step === 'capture_analyzing') {
      setAnalysisProgressStep(0);
      const t1 = setTimeout(() => setAnalysisProgressStep(1), 900);
      const t2 = setTimeout(() => setAnalysisProgressStep(2), 2000);
      const t3 = setTimeout(() => {
        setAnalysisProgressStep(3);
        setStep('capture_result');
      }, 3100);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [step]);

  // Sync Persona from questions
  useEffect(() => {
    if (qKingdom === 'plants') {
      setAssignedPersona('botanist');
    } else if (qSubgroups.includes('조류')) {
      setAssignedPersona('birder');
    } else if (qSubgroups.includes('곤충')) {
      setAssignedPersona('entomologist');
    } else {
      setAssignedPersona('general');
    }
  }, [qKingdom, qSubgroups]);

  // Social Login handler
  // 소셜 로그인: 계정 확정은 App 의 handleLoginSuccess 한 곳에서만 처리합니다.
  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    if (isProcessingLogin) return;
    setIsProcessingLogin(true);
    try {
      // 온보딩의 로그인·가입은 기존 회원 데이터와 분리된 새 계정으로 처리합니다.
      const account = await mockSocialLogin(provider, { newAccount: true });
      setIsProcessingLogin(false);
      setIsLoginSheetOpen(false);
      setIsSaveAuthSheetOpen(false);

      if (step === 'save_card') {
        // 저장 = 가입: 로그인을 먼저 확정하고, 약관 동의 단계로 이어갑니다. (온보딩은 유지)
        onLoginSuccess(account, {
          persona: assignedPersona,
          firstSpecimen: chosenSpecimen,
          closeOnboarding: false,
        });
        setStep('terms_agreement');
      } else {
        // 그 외 단계(프리뷰 등): 로그인 후 온보딩을 닫고 홈으로 이동합니다.
        onLoginSuccess(account, {
          persona: assignedPersona,
          firstSpecimen: chosenSpecimen,
          closeOnboarding: true,
        });
      }
    } catch {
      setIsProcessingLogin(false);
    }
  };

  const handleAgreeAllToggle = () => {
    const next = !agreeAll;
    setAgreeAll(next);
    setAgreeAge(next);
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgreeLocation(next);
    setAgreeMarketing(next);
  };

  // Complete entire onboarding and enter Archive Home
  const handleFinalHomeEntry = (isPro = false) => {
    onComplete(assignedPersona, chosenSpecimen);
  };

  // 온보딩 결과 공유 (LensView 공유와 동일한 방식)
  const handleResultShare = async () => {
    const title = chosenSpecimen.koreanName || '자연 생물 포착';
    const text = `[포착 생물 도감] ${title} (신뢰도 ${chosenSpecimen.confidence ?? 0}%) - 자연 생물 탐사 현장에서 포착했습니다!`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      alert('포착 정보와 링크가 클립보드에 복사되었습니다!');
    } catch {
      alert('공유 링크 복사 완료');
    }
  };

  return (
    <div
      id="onboarding-flow-container"
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden select-none font-geist bg-[#F5F5F7] text-stone-900"
    >
      <AnimatePresence mode="wait">
        {/* ==============================================================
            FLOW 1-1 STEP 1: 스플래시 (SPLASH)
            ============================================================== */}
        {step === 'splash' && (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              if (userAccount?.isLoggedIn) {
                onComplete(assignedPersona, chosenSpecimen);
              } else {
                setStep('preview');
              }
            }}
            className="w-full h-full bg-[#d4ee38] flex flex-col items-center justify-between p-8 text-center cursor-pointer"
          >
            <div className="pt-8" />

            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&auto=format&fit=crop&q=80"
                  alt="Sticker Top"
                  className="w-24 h-24 object-contain filter drop-shadow-xl absolute -top-4 -rotate-6"
                />
                <img
                  src="https://images.unsplash.com/photo-1558285549-2a06fdfc5547?w=400&auto=format&fit=crop&q=80"
                  alt="Sticker Base"
                  className="w-28 h-28 object-contain filter drop-shadow-2xl absolute -bottom-2 rotate-12"
                />
              </div>

              <div className="space-y-1">
                <h1 className="text-3xl font-black text-stone-950 tracking-tight flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-600 inline-block" />
                  <span>Moalog</span>
                </h1>
                <p className="text-sm font-semibold text-stone-900/80 tracking-normal">
                  찍으면, 도감이 된다
                </p>
              </div>
            </div>

            <div className="pb-6">
              <div className="w-36 h-1 rounded-full bg-stone-950/20 mx-auto overflow-hidden">
                <motion.div
                  className="h-full bg-stone-950"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ==============================================================
            FLOW 1-1 STEP 2: 첫 화면 (PREVIEW & START)
            ============================================================== */}
        {step === 'preview' && (
          <motion.div
            key="preview-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full max-w-md mx-auto bg-[#F5F5F7] flex flex-col justify-between p-6 overflow-hidden"
          >
            {/* Header */}
            <div className="pt-2 flex items-center justify-between">
              <h2 className="text-xl font-black text-stone-950 tracking-tight flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                <span>Moalog</span>
              </h2>
            </div>

            {/* 3x3 Die-cut Sticker Album Board */}
            <div className="my-auto py-2">
              <div className="bg-white/80 rounded-3xl p-4 shadow-sm border border-stone-200/60">
                <div className="grid grid-cols-3 gap-3">
                  {previewStickers.map((item, idx) => (
                    <motion.div
                      key={item.sp.id || idx}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.04, duration: 0.3 }}
                      style={{ transform: `rotate(${item.tilt}deg)` }}
                      className="aspect-square bg-stone-100/90 rounded-2xl p-2 flex items-center justify-center relative overflow-hidden shadow-xs hover:scale-105 transition-transform"
                    >
                      <img
                        src={item.img}
                        alt={item.sp.koreanName}
                        className="w-full h-full object-contain filter drop-shadow-md"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Tagline */}
              <div className="mt-6 text-center space-y-1.5 px-4">
                <h3 className="text-lg font-black text-stone-900 tracking-tight leading-snug">
                  찍기만 하면<br />나만의 생물 도감이 완성돼요
                </h3>
                <p className="text-xs text-stone-500">
                  AI가 종명을 인식하고, 수집 점수까지 매겨줘요
                </p>
              </div>
            </div>

            {/* Bottom Action Section */}
            <div className="pb-4 space-y-2.5">
              <button
                type="button"
                id="btn-onboarding-start"
                onClick={() => setStep('q_intro')}
                className="w-full py-4 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl text-sm font-black transition-all active:scale-98 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>시작하기</span>
              </button>

              <button
                type="button"
                id="btn-onboarding-guest-browse"
                onClick={() => onComplete(assignedPersona)}
                className="w-full py-3 bg-stone-200/90 hover:bg-stone-300 text-stone-800 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                가입 없이 둘러보기
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  id="btn-onboarding-open-login"
                  onClick={() => setIsLoginSheetOpen(true)}
                  className="text-xs text-stone-500 hover:text-stone-900 transition-colors inline-flex items-center gap-1 font-medium cursor-pointer"
                >
                  <span>이미 계정이 있나요?</span>
                  <span className="font-bold underline text-stone-800">로그인</span>
                </button>
              </div>
            </div>

            {/* STEP 3 Existing Member Login Bottom Sheet */}
            {isLoginSheetOpen && (
              <div
                className="fixed inset-0 z-60 bg-stone-950/60 backdrop-blur-xs flex items-end justify-center"
                onClick={() => setIsLoginSheetOpen(false)}
              >
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-t-3xl max-w-md w-full p-6 shadow-2xl space-y-4 pb-8"
                >
                  <div className="flex items-center justify-between pb-1">
                    <div className="space-y-0.5">
                      <h4 className="text-base font-black text-stone-900">다시 만나서 반가워요</h4>
                      <p className="text-xs text-stone-500">가입했던 계정으로 로그인해 주세요</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLoginSheetOpen(false)}
                      className="p-1 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      disabled={isProcessingLogin}
                      onClick={() => handleSocialLogin('google')}
                      className="w-full py-3.5 px-4 rounded-2xl border border-stone-200/90 bg-white hover:bg-stone-50 text-stone-900 text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Google로 계속하기</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessingLogin}
                      onClick={() => handleSocialLogin('apple')}
                      className="w-full py-3.5 px-4 rounded-2xl bg-black hover:bg-stone-900 text-white text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
                    >
                      <span className="text-base leading-none"></span>
                      <span>Apple로 계속하기</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-stone-400 text-center pt-1 font-medium">
                    로그인하면 내 도감과 모든 기록을 바로 불러와요
                  </p>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* ==============================================================
            FLOW 1-2 STEP 1: 질문 안내
            ============================================================== */}
        {step === 'q_intro' && (
          <motion.div
            key="q-intro-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full h-full max-w-md mx-auto bg-[#F5F5F7] flex flex-col justify-between p-6"
          >
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('preview')}
                className="p-1 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="my-auto space-y-6 text-center">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200/80 max-w-xs mx-auto space-y-2">
                <p className="text-sm font-black text-stone-900 leading-snug">
                  나만의 도감을 위해<br />간단한 질문 4개만 할게요!
                </p>
                <p className="text-xs text-stone-500">30초면 끝나요</p>
              </div>

              <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1558285549-2a06fdfc5547?w=400&auto=format&fit=crop&q=80"
                  alt="Plant"
                  className="w-24 h-24 object-contain filter drop-shadow-md absolute -left-2 -bottom-2 -rotate-12"
                />
                <img
                  src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&auto=format&fit=crop&q=80"
                  alt="Butterfly"
                  className="w-28 h-28 object-contain filter drop-shadow-lg absolute -right-2 -top-2 rotate-12"
                />
              </div>
            </div>

            <div className="pb-4">
              <button
                type="button"
                onClick={() => setStep('q_kingdom')}
                className="w-full py-4 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl text-sm font-black transition-all active:scale-98 shadow-md cursor-pointer"
              >
                좋아요
              </button>
            </div>
          </motion.div>
        )}

        {/* ==============================================================
            FLOW 1-2 STEP 2: 질문 1/4 (식물파? 동물파?)
            ============================================================== */}
        {step === 'q_kingdom' && (
          <motion.div
            key="q-kingdom-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full h-full max-w-md mx-auto bg-[#F5F5F7] flex flex-col justify-between p-6"
          >
            {/* Top header with progress */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('q_intro')}
                  className="p-1 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-mono font-bold text-stone-400">1/4</span>
              </div>
              <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                <div className="w-1/4 h-full bg-stone-950 rounded-full" />
              </div>
            </div>

            <div className="my-auto space-y-4">
              <div>
                <h3 className="text-xl font-black text-stone-900 tracking-tight">식물파? 동물파?</h3>
                <p className="text-xs text-stone-500 mt-1">더 끌리는 쪽을 골라 주세요</p>
              </div>

              <div className="space-y-2.5">
                {/* Option 1: Plant */}
                <button
                  type="button"
                  onClick={() => setQKingdom('plants')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    qKingdom === 'plants'
                      ? 'bg-white border-stone-950 shadow-sm'
                      : 'bg-white/80 border-stone-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center p-1.5 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1558285549-2a06fdfc5547?w=200&auto=format&fit=crop&q=80"
                        alt="식물"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">식물이 더 좋아요</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">꽃 · 나무 · 풀 · 버섯</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      qKingdom === 'plants'
                        ? 'border-stone-950 bg-stone-950 text-white'
                        : 'border-stone-300'
                    }`}
                  >
                    {qKingdom === 'plants' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>

                {/* Option 2: Animal */}
                <button
                  type="button"
                  onClick={() => setQKingdom('animals')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    qKingdom === 'animals'
                      ? 'bg-white border-stone-950 shadow-sm'
                      : 'bg-white/80 border-stone-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center p-1.5 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&auto=format&fit=crop&q=80"
                        alt="동물"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">동물이 더 좋아요</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">새 · 곤충 · 물고기 · 파충류</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      qKingdom === 'animals'
                        ? 'border-stone-950 bg-stone-950 text-white'
                        : 'border-stone-300'
                    }`}
                  >
                    {qKingdom === 'animals' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>

                {/* Option 3: Both */}
                <button
                  type="button"
                  onClick={() => setQKingdom('both')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    qKingdom === 'both'
                      ? 'bg-white border-stone-950 shadow-sm'
                      : 'bg-white/80 border-stone-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center p-1.5 overflow-hidden">
                      <img
                        src={KINGFISHER_PHOTO}
                        alt="둘 다"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">둘 다 좋아요</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">보이는 건 다 궁금해요</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      qKingdom === 'both'
                        ? 'border-stone-950 bg-stone-950 text-white'
                        : 'border-stone-300'
                    }`}
                  >
                    {qKingdom === 'both' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              </div>
            </div>

            <div className="pb-4 space-y-2.5">
              <button
                type="button"
                onClick={() => setStep('q_subgroup')}
                className="w-full py-4 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl text-sm font-black transition-all active:scale-98 shadow-md cursor-pointer"
              >
                다음
              </button>
              <button
                type="button"
                onClick={() => setStep('q_subgroup')}
                className="w-full py-1 text-center text-xs text-stone-400 hover:text-stone-700 font-medium"
              >
                건너뛰기
              </button>
            </div>
          </motion.div>
        )}

        {/* ==============================================================
            FLOW 1-2 STEP 3: 질문 2/4 (세부 분야)
            ============================================================== */}
        {step === 'q_subgroup' && (
          <motion.div
            key="q-subgroup-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full h-full max-w-md mx-auto bg-[#F5F5F7] flex flex-col justify-between p-6 overflow-hidden"
          >
            {/* Top header */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('q_kingdom')}
                  className="p-1 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-mono font-bold text-stone-400">2/4</span>
              </div>
              <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                <div className="w-2/4 h-full bg-stone-950 rounded-full" />
              </div>
            </div>

            <div className="my-auto space-y-4">
              <div>
                <h3 className="text-xl font-black text-stone-900 tracking-tight">
                  {qKingdom === 'plants' ? '특히 어떤 식물이 궁금해요?' : '특히 어떤 동물이 궁금해요?'}
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  여러 개 골라도 좋아요 · 도감 첫 화면에 먼저 보여 드려요
                </p>
              </div>

              {/* 6 Category Selection Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  {
                    id: '조류',
                    img: KINGFISHER_PHOTO,
                  },
                  {
                    id: '곤충',
                    img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&auto=format&fit=crop&q=80',
                  },
                  {
                    id: '어류',
                    img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&auto=format&fit=crop&q=80',
                  },
                  {
                    id: '파충·양서류',
                    img: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=200&auto=format&fit=crop&q=80',
                  },
                  {
                    id: '무척추동물',
                    img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80',
                  },
                  {
                    id: '바다 생물',
                    img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&auto=format&fit=crop&q=80',
                  },
                ].map((item) => {
                  const isChecked = qSubgroups.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setQSubgroups((prev) =>
                          isChecked ? prev.filter((x) => x !== item.id) : [...prev, item.id]
                        );
                      }}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between relative transition-all ${
                        isChecked
                          ? 'bg-white border-stone-950 shadow-sm'
                          : 'bg-white/80 border-stone-200'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center p-1 overflow-hidden mb-1">
                        <img
                          src={item.img}
                          alt={item.id}
                          className="w-full h-full object-contain filter drop-shadow-xs"
                        />
                      </div>
                      <span className="text-xs font-bold text-stone-900">{item.id}</span>
                      {isChecked && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-stone-950 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Opposite Group Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-stone-200/80">
                <span className="text-xs font-medium text-stone-700">
                  {qKingdom === 'plants' ? '동물도 함께 보기' : '식물도 함께 보기'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowOppositeGroup(!showOppositeGroup)}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                    showOppositeGroup ? 'bg-stone-950 justify-end' : 'bg-stone-200 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>

            <div className="pb-4 space-y-2.5">
              <button
                type="button"
                onClick={() => setStep('q_location')}
                className="w-full py-4 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl text-sm font-black transition-all active:scale-98 shadow-md cursor-pointer"
              >
                다음
              </button>
              <button
                type="button"
                onClick={() => {
                  if (step === 'q_kingdom') setStep('q_subgroup');
                  else if (step === 'q_subgroup') setStep('q_location');
                  else if (step === 'q_location') setStep('q_purpose');
                  else setStep('q_ready');
                }}
                className="w-full py-1 text-center text-xs text-stone-400 hover:text-stone-700 font-medium"
              >
                건너뛰기
              </button>
            </div>
          </motion.div>
        )}

        {/* ==============================================================
            FLOW 1-2 STEP 4: 질문 3/4 (장소 · 빈도)
            ============================================================== */}
        {step === 'q_location' && (
          <motion.div
            key="q-location-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full h-full max-w-md mx-auto bg-[#F5F5F7] flex flex-col justify-between p-6 overflow-hidden"
          >
            {/* Top header */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('q_subgroup')}
                  className="p-1 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-mono font-bold text-stone-400">3/4</span>
              </div>
              <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-stone-950 rounded-full" />
              </div>
            </div>

            <div className="my-auto space-y-4">
              <div>
                <h3 className="text-xl font-black text-stone-900 tracking-tight">주로 어디서 만나요?</h3>
                <p className="text-xs text-stone-500 mt-1">자주 가는 곳의 생물부터 추천해 드려요</p>
              </div>

              {/* Location Chips */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-stone-400">장소</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    '🏡 동네 산책길',
                    '🌳 공원',
                    '⛰️ 산 · 숲',
                    '🏖️ 바다 · 갯벌',
                    '🏞️ 강 · 하천',
                    '🪴 집 · 베란다',
                    '✈️ 여행지',
                  ].map((loc) => {
                    const isSelected = qLocations.includes(loc.replace(/^[^\s]+\s/, ''));
                    const cleanName = loc.replace(/^[^\s]+\s/, '');
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setQLocations((prev) =>
                            isSelected ? prev.filter((x) => x !== cleanName) : [...prev, cleanName]
                          );
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-stone-950 text-white shadow-xs'
                            : 'bg-white text-stone-700 border border-stone-200'
                        }`}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Frequency Section */}
              <div className="space-y-1.5 pt-2">
                <p className="text-[11px] font-bold text-stone-400">얼마나 자주 나가나요?</p>
                <div className="flex flex-wrap gap-2">
                  {['거의 매일', '주 10회 이상', '주말에만', '가끔 여행 갈 때'].map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setQFrequency(freq)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        qFrequency === freq
                          ? 'bg-stone-950 text-white shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-200'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Informative Callout Note */}
              <div className="p-3.5 rounded-2xl bg-[#f0f8db] border border-[#d4ee38] text-[11px] text-stone-800 leading-relaxed">
                <p className="font-bold flex items-center gap-1 mb-0.5">
                  <span>💡 위치는 포착한 장소 기록에만 쓰여요</span>
                </p>
                <p className="text-stone-600">탐험 맵에 내가 다녀온 곳이 예쁘게 표시돼요</p>
              </div>
            </div>

            <div className="pb-4 space-y-2.5">
              <button
                type="button"
                onClick={() => setStep('q_purpose')}
                className="w-full py-4 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl text-sm font-black transition-all active:scale-98 shadow-md cursor-pointer"
              >
                다음
              </button>
              <button
                type="button"
                onClick={() => {
                  if (step === 'q_kingdom') setStep('q_subgroup');
                  else if (step === 'q_subgroup') setStep('q_location');
                  else if (step === 'q_location') setStep('q_purpose');
                  else setStep('q_ready');
                }}
                className="w-full py-1 text-center text-xs text-stone-400 hover:text-stone-700 font-medium"
              >
                건너뛰기
              </button>
            </div>
          </motion.div>
        )}

        {/* ==============================================================
            FLOW 1-2 STEP 5: 질문 4/4 (하고 싶은 것)
            ============================================================== */}
        {step === 'q_purpose' && (
          <motion.div
            key="q-purpose-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full h-full max-w-md mx-auto bg-[#F5F5F7] flex flex-col justify-between p-6 overflow-hidden"
          >
            {/* Top header */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('q_location')}
                  className="p-1 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-mono font-bold text-stone-400">4/4</span>
              </div>
              <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                <div className="w-full h-full bg-stone-950 rounded-full" />
              </div>
            </div>

            <div className="my-auto space-y-4">
              <div>
                <h3 className="text-xl font-black text-stone-900 tracking-tight">
                  모아로그로 뭘 하고 싶어요?
                </h3>
                <p className="text-xs text-stone-500 mt-1">해당하는 걸 모두 골라 주세요</p>
              </div>

              {/* 5 Purpose Checklist Cards */}
              <div className="space-y-2">
                {[
                  { id: '보이는 생물 이름이 궁금해요', icon: '🔍' },
                  { id: '나만의 도감을 채우고 싶어요', icon: '📖' },
                  { id: '생물 사진 실력을 늘리고 싶어요', icon: '📷' },
                  { id: '아이와 자연 공부를 하고 싶어요', icon: '👦' },
                  { id: '뱃지 모으고 레벨업 하고 싶어요', icon: '🏅' },
                ].map((item) => {
                  const isChecked = qPurposes.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setQPurposes((prev) =>
                          isChecked ? prev.filter((x) => x !== item.id) : [...prev, item.id]
                        );
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-white border-stone-950 shadow-xs'
                          : 'bg-white/80 border-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{item.icon}</span>
                        <span className="text-xs font-bold text-stone-900">{item.id}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                          isChecked
                            ? 'border-stone-950 bg-stone-950 text-white'
                            : 'border-stone-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pb-4 space-y-2.5">
              <button
                type="button"
                onClick={() => setStep('q_ready')}
                className="w-full py-4 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl text-sm font-black transition-all active:scale-98 shadow-md cursor-pointer"
              >
                다음
              </button>
              <button
                type="button"
                onClick={() => setStep('q_ready')}
                className="w-full py-1 text-center text-xs text-stone-400 hover:text-stone-700 font-medium"
              >
                건너뛰기
              </button>
            </div>
          </motion.div>
        )}

        {/* ==============================================================
            FLOW 1-2 STEP 6: 준비 완료 (READY)
            ============================================================== */}
        {step === 'q_ready' && (
          <motion.div
            key="q-ready-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full max-w-md mx-auto bg-[#F5F5F7] flex flex-col justify-between p-6 overflow-hidden"
          >
            <div className="pt-2" />

            <div className="my-auto space-y-6 text-center">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200/80 max-w-xs mx-auto space-y-2">
                <p className="text-xs text-stone-500 font-medium">준비 완료! 당신은</p>
                <h3 className="text-xl font-black text-stone-950">
                  {assignedPersona === 'birder'
                    ? '초보 조류 탐험가'
                    : assignedPersona === 'botanist'
                    ? '초보 식물 탐험가'
                    : assignedPersona === 'entomologist'
                    ? '초보 곤충 탐험가'
                    : '초보 만능 탐험가'}
                </h3>
                <div className="pt-1">
                  <span className="inline-block px-3 py-1 bg-[#d4ee38] text-stone-950 rounded-full text-[11px] font-black shadow-2xs">
                    🎁 첫 포착은 가입 없이 무료
                  </span>
                </div>
              </div>

              <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                <img
                  src={KINGFISHER_PHOTO}
                  alt="Bird"
                  className="w-32 h-32 object-contain filter drop-shadow-xl"
                />
              </div>
            </div>

            <div className="pb-4">
              <button
                type="button"
                id="btn-onboarding-capture-start"
                onClick={() => setStep('capture_method')}
                className="w-full py-4 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl text-sm font-black transition-all active:scale-98 shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-[#d4ee38]" />
                <span>첫 생물 포착하기</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ==============================================================
            FLOW 1-3 STEP 1: 포착 방법 (CAPTURE METHOD)
            ============================================================== */}
        {step === 'capture_method' && (
          <motion.div
            key="capture-method-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full h-full max-w-md mx-auto bg-[#F5F5F7] flex flex-col justify-between p-6"
          >
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('q_ready')}
                className="p-1 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="my-auto space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-stone-900 tracking-tight">
                  첫 생물을 포착해 볼까요?
                </h3>
                <p className="text-xs text-stone-500">지금 찍어도, 찍어 둔 사진을 골라도 돼요</p>
              </div>

              <div className="space-y-3">
                {/* Method 1: Camera */}
                <button
                  type="button"
                  id="btn-method-live-camera"
                  onClick={() => setStep('capture_viewfinder')}
                  className="w-full p-4 rounded-3xl bg-stone-950 text-white flex items-center justify-between shadow-md active:scale-98 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-[#d4ee38]" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-black text-white">지금 촬영하기</h4>
                      <p className="text-[11px] text-stone-400 mt-0.5">지금 보이는 생물을 바로 찍어요</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-400" />
                </button>

                {/* Method 2: Gallery */}
                <button
                  type="button"
                  id="btn-method-gallery"
                  onClick={() => setStep('capture_gallery')}
                  className="w-full p-4 rounded-3xl bg-white border border-stone-200/80 text-stone-900 flex items-center justify-between shadow-xs hover:bg-stone-50 active:scale-98 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-stone-700" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-black text-stone-900">갤러리에서 고르기</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">예전에 찍어 둔 사진도 분류할 수 있어요</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              {/* Sample Photo Experience Link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    
                    setSelectedPhotoIdx(0);
                    setStep('capture_analyzing');
                  }}
                  className="text-xs font-bold text-stone-700 hover:text-stone-950 inline-flex items-center gap-1 transition-colors"
                >
                  <span>지금 주변에 생물이 없다면?</span>
                  <span className="text-blue-600 underline">예시 사진으로 체험 &gt;</span>
                </button>
              </div>
            </div>

            <div className="pb-4 text-center">
              <p className="text-[11px] text-stone-400">카메라 · 사진 권한은 조작할 때만 사용해요</p>
            </div>
          </motion.div>
        )}

        {/* ==============================================================
            FLOW 1-3 STEP 2: 촬영 (CAMERA VIEWFINDER)
            ============================================================== */}
        {(step === 'capture_viewfinder' || step === 'capture_gallery') && (
          <div className="fixed inset-0 z-40 bg-black">
            <LensView
              onboardingMode
              onOnboardingRegister={(sp, obs) => {
                void obs;
                setChosenSpecimen(sp);
                setStep('save_card');
              }}
              onCollectSpecimen={() => {}}
              existingSpecimens={[]}
              freeScansRemaining={10}
              isProUser={false}
              currentPersona={assignedPersona}
              onNavigateToArchive={() => setStep('save_card')}
              onOpenPaywall={() => {}}
            />
          </div>
        )}
        {/* ==============================================================
            FLOW 1-3 STEP 4: 분석 중 (ANALYZING)
            ============================================================== */}
        {step === 'capture_analyzing' && (
          <motion.div
            key="capture-analyzing-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full max-w-md mx-auto bg-stone-950 text-white flex flex-col justify-between p-6 relative overflow-hidden"
          >
            <div className="pt-2" />

            <div className="my-auto flex flex-col items-center text-center space-y-6">
              {/* Photo with Scanning Laser Animation */}
              <div className="relative w-64 h-64 rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
                <img
                  src={KINGFISHER_PHOTO}
                  alt="Analyzing Target"
                  className="w-full h-full object-cover"
                />
                {/* Green Laser Line Animation */}
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-[#d4ee38] shadow-[0_0_12px_#d4ee38]"
                  initial={{ top: '0%' }}
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white tracking-tight">
                  어떤 생물인지 찾는 중...
                </h3>
                <p className="text-xs text-stone-400">국내 생물 1만 2천개 종과 비교하고 있어요</p>
              </div>

              {/* 3 Steps Checklist */}
              <div className="w-full max-w-xs space-y-2 bg-white/10 backdrop-blur-md rounded-2xl p-4 text-xs font-semibold text-left border border-white/10">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      analysisProgressStep >= 1 ? 'bg-[#d4ee38] text-stone-950' : 'bg-white/20 text-white'
                    }`}
                  >
                    {analysisProgressStep >= 1 ? <Check className="w-3 h-3 stroke-[3]" /> : '1'}
                  </div>
                  <span className={analysisProgressStep >= 1 ? 'text-white' : 'text-stone-400'}>
                    생물 위치 찾기
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      analysisProgressStep >= 2 ? 'bg-[#d4ee38] text-stone-950' : 'bg-white/20 text-white'
                    }`}
                  >
                    {analysisProgressStep >= 2 ? <Check className="w-3 h-3 stroke-[3]" /> : '2'}
                  </div>
                  <span className={analysisProgressStep >= 2 ? 'text-white' : 'text-stone-400'}>
                    종 분류
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      analysisProgressStep >= 3 ? 'bg-[#d4ee38] text-stone-950' : 'bg-white/20 text-white'
                    }`}
                  >
                    {analysisProgressStep >= 3 ? <Check className="w-3 h-3 stroke-[3]" /> : '3'}
                  </div>
                  <span className={analysisProgressStep >= 3 ? 'text-white' : 'text-stone-400'}>
                    포착 점수 계산
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-stone-400">보통 3초 정도 걸려요</p>
            </div>

            <div className="pb-4" />
          </motion.div>
        )}

        {/* ==============================================================
            FLOW 1-3 STEP 5 & 6: 분류 결과 & 포착 점수
            ============================================================== */}
        {step === 'capture_result' && (
          <motion.div
            key="capture-result-screen"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full h-full max-w-md mx-auto bg-[#F5F5F7] flex flex-col justify-between overflow-hidden relative"
          >
            {/* Top Toggle Bar: 백과 / 포착 */}
            <div className="p-4 bg-white border-b border-stone-200/80 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setStep('capture_method')}
                className="p-1 rounded-full text-stone-500 hover:text-stone-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center bg-stone-100 p-1 rounded-full relative">
                <button
                  type="button"
                  onClick={() => setResultSubTab('wiki')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    resultSubTab === 'wiki'
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  백과
                </button>
                <button
                  type="button"
                  onClick={() => setResultSubTab('score')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    resultSubTab === 'score'
                      ? 'bg-stone-950 text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  포착
                </button>

                {resultSubTab === 'wiki' && (
                  <div className="absolute -bottom-7 right-0 bg-stone-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md animate-bounce whitespace-nowrap">
                    포착을 누르면 내 사진 점수가 나와요
                  </div>
                )}
              </div>

              <div className="w-5" />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Photo Card with S Rank Badge */}
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-md bg-stone-900">
                <img
                  src={chosenSpecimen.originalImage}
                  alt={chosenSpecimen.koreanName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-[#d4ee38] text-stone-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                  NEW +
                </div>
                <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-amber-400 text-stone-950 font-black flex items-center justify-center text-xs shadow-md">
                  S
                </div>
              </div>

              {/* Subtab 1: 백과 (WIKI) */}
              {resultSubTab === 'wiki' ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] font-mono font-medium text-stone-400">
                      양재천 둔치 수풀 · 오늘 14:32
                    </span>
                    <h3 className="text-xl font-black text-stone-950 mt-0.5">
                      {chosenSpecimen.koreanName}
                    </h3>
                    <p className="text-xs text-stone-500 font-mono">
                      조류 · 파랑새목 물총새과 · Alcedo atthis
                    </p>
                  </div>

                  {/* 4 Feature Badges */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {['여름철새', '하천·호수', '약 17cm', '작은 물고기'].map((tag) => (
                      <div
                        key={tag}
                        className="p-2 bg-white rounded-xl border border-stone-200/80 text-center text-[10px] font-bold text-stone-700 shadow-2xs"
                      >
                        {tag}
                      </div>
                    ))}
                  </div>

                  {/* Appearance Highlights */}
                  <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 space-y-2 shadow-2xs">
                    <h4 className="text-xs font-bold text-stone-900">외형 특징</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {['청록색 등', '주황색 배', '길고 뾰족한 부리'].map((f) => (
                        <span
                          key={f}
                          className="px-2.5 py-1 bg-stone-100 rounded-lg text-xs font-medium text-stone-800"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Subtab 2: 포착 (SCORE RADAR & TIPS) */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black text-stone-950">포착 점수</h4>
                      <p className="text-xs text-stone-500">AI 사진 평가</p>
                    </div>
                    <span className="text-2xl font-black text-stone-950">{onboardingScore.total}점</span>
                  </div>

                  {/* 5각 포착 밸런스 (레이더) + 식별 신뢰도 */}
                  <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs space-y-3">
                    <RadarChart
                      data={[
                        { label: '포즈', value: onboardingScore.pose, fullMark: 20 },
                        { label: '구도', value: onboardingScore.direction, fullMark: 20 },
                        { label: '배경', value: onboardingScore.background, fullMark: 20 },
                        { label: '난이도', value: onboardingScore.size, fullMark: 20 },
                        { label: '채광', value: onboardingScore.clarity, fullMark: 20 },
                      ]}
                      grade={onboardingScore.grade}
                      totalScore={onboardingScore.total}
                      size={220}
                    />
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 border-t border-stone-200/70 pt-2">
                      <span>식별 신뢰도</span>
                      <span className="font-mono text-stone-900">{chosenSpecimen.confidence ?? 0}%</span>
                    </div>
                  </div>

                  {/* AI Commentary Card */}
                  <div className="bg-[#f0f8db] rounded-2xl p-4 border border-[#d4ee38] space-y-1.5 text-xs text-stone-900">
                    <p className="font-bold">나뭇가지 끝에 앉은 순간을 정확히 잡았어요.</p>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      배색이 부드럽게 넘어가 깃털 색이 돋보여요.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 text-[11px] text-stone-600">
                    <span className="font-bold text-stone-900 block mb-0.5">촬영 팁</span>
                    한 단계 낮은 앵글로 찍으면 눈높이가 맞아 사진 점수가 더 올라가요!
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions: 종 변경 / 공유하기 / 도감 등록 (앱 카메라 포착 결과와 동일) */}
            <div className="p-4 bg-white border-t border-stone-200/80 flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="btn-choose-alternative-species"
                onClick={() => setIsChooseAltModalOpen(true)}
                className="flex-1 py-3.5 bg-stone-900 hover:bg-stone-800 text-stone-200 font-bold text-xs rounded-2xl shadow-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>종 변경</span>
              </button>
              <button
                type="button"
                onClick={handleResultShare}
                className="flex-1 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-2xl shadow-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-stone-600" />
                <span>공유하기</span>
              </button>
              <button
                type="button"
                id="btn-register-to-dex"
                onClick={() => setStep('save_card')}
                className="flex-[1.5] py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-2xl shadow-[0_4px_20px_rgba(251,191,36,0.3)] flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3px]" />
                <span>도감 등록</span>
              </button>
            </div>

            {/* STEP 7: 직접 고르기 Modal */}
            {isChooseAltModalOpen && (
              <div className="fixed inset-0 z-70 bg-stone-950/70 backdrop-blur-xs flex items-end justify-center">
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  className="bg-white rounded-t-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsChooseAltModalOpen(false)}
                        className="p-1 rounded-full text-stone-500"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h4 className="text-base font-black text-stone-900">직접 고르기</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsChooseAltModalOpen(false)}
                      className="p-1 rounded-full text-stone-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      placeholder="생물 이름으로 검색"
                      value={searchAltQuery}
                      onChange={(e) => setSearchAltQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-stone-100 text-xs font-medium text-stone-900 outline-none"
                    />
                  </div>

                  {/* Similar Species List */}
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    <div>
                      <p className="text-[11px] font-bold text-stone-500 mb-1.5 flex items-center gap-1">
                        <span>✦ 비슷한 추천 생물</span>
                      </p>
                      <div className="space-y-1.5">
                        {SPECIES_ECOLOGY_ENCYCLOPEDIA
                          .filter((item) => {
                            if (searchAltQuery.trim()) {
                              return item.koreanName.toLowerCase().includes(searchAltQuery.toLowerCase()) ||
                                     item.family.toLowerCase().includes(searchAltQuery.toLowerCase());
                            }
                            return item.category === chosenSpecimen.category || item.family.includes('물총새') || item.koreanName.includes('물총새');
                          })
                          .slice(0, 4)
                          .map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setChosenSpecimen((prev) => ({
                                  ...prev,
                                  koreanName: item.koreanName,
                                  scientificName: item.scientificName,
                                  category: item.category,
                                  family: item.family,
                                  habitatType: item.habitat,
                                  wikiSummary: item.keyIdentification,
                                  traitChips: item.tags || prev.traitChips,
                                }));
                                setIsChooseAltModalOpen(false);
                              }}
                              className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                                chosenSpecimen.koreanName === item.koreanName
                                  ? 'bg-[#f0f8db] border-[#d4ee38]'
                                  : 'bg-white border-stone-200'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-stone-900">{item.koreanName}</p>
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded">추천</span>
                                </div>
                                <p className="text-[10px] text-stone-500">{item.categoryLabel || item.category} · {item.family}</p>
                              </div>
                              {chosenSpecimen.koreanName === item.koreanName && (
                                <Check className="w-4 h-4 text-stone-900 stroke-[3]" />
                              )}
                            </button>
                          ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold text-stone-400 mb-1.5">전체 도감 종 목록</p>
                      <div className="space-y-1.5">
                        {SPECIES_ECOLOGY_ENCYCLOPEDIA
                          .filter((item) => {
                            if (!searchAltQuery.trim()) return true;
                            return item.koreanName.toLowerCase().includes(searchAltQuery.toLowerCase()) ||
                                   item.family.toLowerCase().includes(searchAltQuery.toLowerCase()) ||
                                   item.scientificName.toLowerCase().includes(searchAltQuery.toLowerCase());
                          })
                          .map((item) => (
                            <button
                              key={`all-${item.id}`}
                              type="button"
                              onClick={() => {
                                setChosenSpecimen((prev) => ({
                                  ...prev,
                                  koreanName: item.koreanName,
                                  scientificName: item.scientificName,
                                  category: item.category,
                                  family: item.family,
                                  habitatType: item.habitat,
                                  wikiSummary: item.keyIdentification,
                                  traitChips: item.tags || prev.traitChips,
                                }));
                                setIsChooseAltModalOpen(false);
                              }}
                              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                                chosenSpecimen.koreanName === item.koreanName
                                  ? 'bg-[#f0f8db] border-[#d4ee38]'
                                  : 'bg-white border-stone-200/80'
                              }`}
                            >
                              <div>
                                <p className="text-xs font-bold text-stone-900">{item.koreanName}</p>
                                <p className="text-[10px] text-stone-500">{item.categoryLabel || item.category} · {item.family}</p>
                              </div>
                              {chosenSpecimen.koreanName === item.koreanName && (
                                <Check className="w-4 h-4 text-stone-900 stroke-[3]" />
                              )}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsChooseAltModalOpen(false);
                      setStep('save_card');
                    }}
                    className="w-full py-4 bg-stone-950 text-white rounded-2xl text-xs font-black"
                  >
                    이 생물로 도감에 등록하기
                  </button>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* ==============================================================
            FLOW 1-4 STEP 1 & 2: 도감 등록 & 저장할 때 가입
            ============================================================== */}
        {step === 'save_card' && (
          <motion.div
            key="save-card-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full min-h-full max-w-md mx-auto bg-[#F5F5F7] flex flex-col justify-between p-5 sm:p-6 relative overflow-y-auto"
          >
            <div className="pt-2 text-center shrink-0">
              <h3 className="text-lg font-black text-stone-950">도감에 새 생물이 추가됐어요!</h3>
            </div>

            {/* Scrollable Collectible Card & Stats Area */}
            <div className="my-auto py-3 space-y-3.5 flex-1">
              <div className="bg-white rounded-3xl p-4 shadow-xl border border-stone-200/80 max-w-xs mx-auto text-center space-y-2.5">
                <div className="relative aspect-4/5 max-h-56 rounded-2xl overflow-hidden bg-stone-900 mx-auto">
                  <img
                    src={chosenSpecimen.originalImage}
                    alt={chosenSpecimen.koreanName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-amber-400 text-stone-950 font-black text-[10px] w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                    S
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-black text-stone-950">{chosenSpecimen.koreanName}</h4>
                  <p className="text-[10px] font-mono text-stone-400">NO.001</p>
                </div>
              </div>

              {/* 1 / 10 Free Slots Progress */}
              <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-stone-900">무료 도감</span>
                  <span className="text-stone-900 font-mono">1 / 10칸</span>
                </div>
                <div className="grid grid-cols-10 gap-1.5 pt-1">
                  <div className="h-2 rounded-full bg-[#d4ee38]" />
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-2 rounded-full bg-stone-200" />
                  ))}
                </div>
              </div>

              {/* Badges & EXP */}
              <div className="space-y-2">
                <div className="p-3 bg-white rounded-2xl border border-stone-200/80 flex items-center gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    🌱
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900">첫 표본 뱃지 획득 · +{EXPLORER_BADGES_MASTER[0].expReward} EXP</p>
                    <p className="text-[10px] text-stone-500">처음으로 생물을 포착했어요</p>
                  </div>
                </div>

                <div className="p-3 bg-stone-950 text-white rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-bold">Lv.1 초보 조류 탐험가</span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">Lv.2까지 {EXPLORER_LEVEL_MIN_EXP[1] - EXPLORER_BADGES_MASTER[0].expReward} EXP 남음</span>
                  </div>
                  <span className="text-xs font-bold text-[#d4ee38]">현재 {EXPLORER_BADGES_MASTER[0].expReward} EXP</span>
                </div>
              </div>
            </div>

            {/* Sticky Bottom Action Button Bar */}
            <div className="shrink-0 pt-3 pb-6 sticky bottom-0 z-20 bg-[#F5F5F7]/95 backdrop-blur-xs">
              <button
                type="button"
                id="btn-save-to-dex"
                onClick={() => setIsSaveAuthSheetOpen(true)}
                className="w-full py-4 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl text-sm font-black transition-all active:scale-98 shadow-md cursor-pointer pointer-events-auto block text-center"
              >
                도감에 저장하기
              </button>
            </div>

            {/* STEP 2: 저장 = 가입 Bottom Sheet */}
            {isSaveAuthSheetOpen && (
              <div
                className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-xs flex items-end justify-center"
                onClick={() => setIsSaveAuthSheetOpen(false)}
              >
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-t-3xl max-w-md w-full p-6 shadow-2xl space-y-4 pb-8"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={chosenSpecimen.originalImage}
                      alt="Thumb"
                      className="w-12 h-12 rounded-2xl object-cover"
                    />
                    <div>
                      <h4 className="text-sm font-black text-stone-900">
                        포착한 {chosenSpecimen.koreanName}를 내 도감에 저장할까요?
                      </h4>
                      <p className="text-xs text-stone-500">
                        가입하면 도감 · 뱃지 · 경험치가 계정에 저장돼요
                      </p>
                    </div>
                  </div>

                  <div className="bg-stone-50 rounded-2xl p-3.5 space-y-2 text-xs font-medium text-stone-700 border border-stone-200/60">
                    <p className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      <span>무료 도감 10칸 · 모을수록 레벨업</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      <span>10칸 모두 포착 점수 · 백과가 함께 저장돼요</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      <span>뱃지 · 경험치 · 탐험 맵 기록 시작</span>
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSocialLogin('google')}
                      className="w-full py-3.5 px-4 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-900 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Google로 계속하기</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialLogin('apple')}
                      className="w-full py-3.5 px-4 rounded-2xl bg-black hover:bg-stone-900 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                    >
                      <span className="text-base leading-none"></span>
                      <span>Apple로 계속하기</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSaveAuthSheetOpen(false);
                      // 등록하지 않고 홈으로만 이동 (체험 생물은 저장하지 않음)
                      onComplete(assignedPersona);
                    }}
                    className="w-full py-1 text-center text-xs text-stone-400 hover:text-stone-700 font-medium"
                  >
                    저장하지 않고 둘러보기
                  </button>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* ==============================================================
            FLOW 1-4 STEP 3: 서비스 이용 동의 (TERMS)
            ============================================================== */}
        {step === 'terms_agreement' && (
          <motion.div
            key="terms-agreement-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full min-h-full max-w-md mx-auto bg-white flex flex-col justify-between p-5 sm:p-6 overflow-y-auto"
          >
            <div className="pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setStep('save_card')}
                className="p-1 rounded-full text-stone-500 hover:text-stone-900 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="my-auto py-3 space-y-5 flex-1">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-stone-900 tracking-tight">서비스 이용 동의</h3>
                <p className="text-xs text-stone-500">도감을 저장하기 전 마지막 단계예요</p>
              </div>

              {/* All agree */}
              <div className="p-4 rounded-2xl bg-stone-100 flex items-center justify-between cursor-pointer" onClick={handleAgreeAllToggle}>
                <span className="text-sm font-black text-stone-900">약관 전체 동의</span>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    agreeAll ? 'bg-stone-950 border-stone-950 text-white' : 'border-stone-300'
                  }`}
                >
                  {agreeAll && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>

              {/* Checklist items */}
              <div className="space-y-3 px-1 text-xs">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setAgreeAge(!agreeAge)}>
                  <div className="flex items-center gap-2.5">
                    <Check className={`w-4 h-4 ${agreeAge ? 'text-stone-900' : 'text-stone-300'}`} />
                    <span className="font-semibold text-stone-800">만 14세 이상입니다.</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>

                <div className="flex items-center justify-between cursor-pointer" onClick={() => setAgreeTerms(!agreeTerms)}>
                  <div className="flex items-center gap-2.5">
                    <Check className={`w-4 h-4 ${agreeTerms ? 'text-stone-900' : 'text-stone-300'}`} />
                    <span className="font-semibold text-stone-800">[필수] 서비스 이용약관</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>

                <div className="flex items-center justify-between cursor-pointer" onClick={() => setAgreePrivacy(!agreePrivacy)}>
                  <div className="flex items-center gap-2.5">
                    <Check className={`w-4 h-4 ${agreePrivacy ? 'text-stone-900' : 'text-stone-300'}`} />
                    <span className="font-semibold text-stone-800">[필수] 개인정보 처리방침</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>

                <div className="flex items-center justify-between cursor-pointer" onClick={() => setAgreeLocation(!agreeLocation)}>
                  <div className="flex items-center gap-2.5">
                    <Check className={`w-4 h-4 ${agreeLocation ? 'text-stone-900' : 'text-stone-300'}`} />
                    <span className="font-semibold text-stone-800">[필수] 위치기반 서비스 이용약관</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>

                <div className="flex items-center justify-between cursor-pointer" onClick={() => setAgreeMarketing(!agreeMarketing)}>
                  <div className="flex items-center gap-2.5">
                    <Check className={`w-4 h-4 ${agreeMarketing ? 'text-stone-900' : 'text-stone-300'}`} />
                    <span className="font-medium text-stone-600">[선택] 마케팅 정보 수신 동의</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>
              </div>

              {/* Note */}
              <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-500 leading-relaxed border border-stone-100">
                무료 도감은 10칸, 사진은 <strong className="text-stone-800 font-bold">압축본</strong>으로 보존돼요. 원본 · Live 포토와 무제한 칸은 이용권에서 열려요.
              </div>
            </div>

            <div className="shrink-0 pt-3 pb-6 sticky bottom-0 z-20 bg-white/95 backdrop-blur-xs">
              <button
                type="button"
                id="btn-agree-complete"
                onClick={() => setStep('signup_complete')}
                className="w-full py-4 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl text-sm font-black transition-all active:scale-98 shadow-md cursor-pointer pointer-events-auto block text-center"
              >
                가입 완료
              </button>
            </div>
          </motion.div>
        )}

        {/* ==============================================================
            FLOW 1-4 STEP 4: 가입 완료 (SIGNUP COMPLETE)
            ============================================================== */}
        {step === 'signup_complete' && (
          <motion.div
            key="signup-complete-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full min-h-full max-w-md mx-auto bg-[#F5F5F7] flex flex-col justify-between p-5 sm:p-6 relative overflow-y-auto"
          >
            <div className="pt-2 text-center space-y-1 shrink-0">
              <h3 className="text-xl font-black text-stone-950">가입 완료!</h3>
              <p className="text-xs text-stone-500">
                {chosenSpecimen.koreanName}가 내 도감 No.001로 저장됐어요
              </p>
            </div>

            {/* 10-Slot Grid Board */}
            <div className="my-auto py-3 space-y-4 flex-1">
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold px-1">
                  <span className="text-stone-900">무료 도감 10칸</span>
                  <span className="text-stone-900 font-mono">1 / 10</span>
                </div>

                <div className="grid grid-cols-5 gap-2 pt-2">
                  {/* Slots 1-10: Empty Dotted Outline Cards (always empty for sample) */}
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <div
                      key={idx + 1}
                      className="aspect-3/4 rounded-xl overflow-hidden border border-dashed border-stone-300 bg-stone-50/60 flex items-center justify-center text-xs font-mono font-bold text-stone-400"
                    >
                      {idx === 0 ? (<img src={chosenSpecimen.originalImage || KINGFISHER_PHOTO} alt={chosenSpecimen.koreanName} className="w-full h-full object-cover rounded-xl" />) : idx + 1}
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-stone-500 text-center font-medium">
                이미 모은 생물을 다시 찍는 건 칸을 쓰지 않아요
              </p>
            </div>

            <div className="shrink-0 pt-3 pb-6 sticky bottom-0 z-20 bg-[#F5F5F7]/95 backdrop-blur-xs">
              <button
                type="button"
                id="btn-signup-done-next"
                onClick={() => {
                  if (hasSeenPlanIntro(userAccount?.id)) {
                    handleFinalHomeEntry(false);
                    return;
                  }
                  markPlanIntroSeen(userAccount?.id);
                  setStep('plan_compare');
                }}
                className="w-full py-4 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl text-sm font-black transition-all active:scale-98 shadow-md cursor-pointer pointer-events-auto block text-center"
              >
                다음
              </button>
            </div>
          </motion.div>
        )}

        {/* ==============================================================
            FLOW 1-5: 요금제 (비교 + 선택 + 시작, 한 화면)
            ============================================================== */}
        {step === 'plan_compare' && (
          <motion.div
            key="plan-compare-screen"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full min-h-full max-w-md mx-auto bg-[#F5F5F7] flex flex-col justify-between p-5 sm:p-6 overflow-y-auto"
          >
            <div className="pt-2 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => handleFinalHomeEntry(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-auto py-3 space-y-4 flex-1">
              <div className="text-center space-y-1">
                <h3 className="text-xl font-black text-stone-950 tracking-tight">10칸을 넘어, 끝까지 모아 보세요</h3>
                <p className="text-xs text-stone-500">어떤 요금제를 골라도 지금부터 칸 제한이 사라져요</p>
              </div>

              {/* 3 Tier Plans */}
              <div className="space-y-2.5">
                {/* 1. Yearly (Recommended) */}
                <button
                  type="button"
                  onClick={() => setSelectedPlanTier('yearly')}
                  className={`w-full p-4 rounded-3xl border text-left transition-all relative cursor-pointer ${
                    selectedPlanTier === 'yearly'
                      ? 'bg-white border-stone-950 shadow-md ring-2 ring-stone-950'
                      : 'bg-white/80 border-stone-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-stone-950 bg-[#d4ee38] px-2 py-0.5 rounded-full">
                      추천 · 가장 많이 선택
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600">월 구독보다 27% 저렴</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <div>
                      <h4 className="text-sm font-black text-stone-950">연간 구독</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">1년 · 월 2,417원 꼴</p>
                    </div>
                    <span className="text-base font-black text-stone-950">29,000원</span>
                  </div>
                </button>

                {/* 2. Monthly */}
                <button
                  type="button"
                  onClick={() => setSelectedPlanTier('monthly')}
                  className={`w-full p-4 rounded-3xl border text-left transition-all cursor-pointer ${
                    selectedPlanTier === 'monthly'
                      ? 'bg-white border-stone-950 shadow-md ring-2 ring-stone-950'
                      : 'bg-white/80 border-stone-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h4 className="text-sm font-black text-stone-950">월 구독</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">매월 자동 결제 · 언제든 해지 가능</p>
                    </div>
                    <span className="text-base font-black text-stone-950">3,300원</span>
                  </div>
                </button>

                {/* 3. Lifetime */}
                <button
                  type="button"
                  onClick={() => setSelectedPlanTier('lifetime')}
                  className={`w-full p-4 rounded-3xl border text-left transition-all cursor-pointer ${
                    selectedPlanTier === 'lifetime'
                      ? 'bg-white border-stone-950 shadow-md ring-2 ring-stone-950'
                      : 'bg-white/80 border-stone-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                      평생 소장
                    </span>
                    <span className="text-[11px] font-bold text-stone-500">연간 2년 값으로 평생</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <div>
                      <h4 className="text-sm font-black text-stone-950">영구 이용권</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">1번 결제 · 평생 제한 해제</p>
                    </div>
                    <span className="text-base font-black text-stone-950">58,000원</span>
                  </div>
                </button>
              </div>

              {/* Comparison Table */}
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-stone-200/80 text-xs">
                <div className="grid grid-cols-3 pb-2 border-b border-stone-100 font-bold text-stone-400 text-[11px]">
                  <span>항목</span>
                  <span className="text-center">무료</span>
                  <span className="text-right text-stone-900">이용권</span>
                </div>

                <div className="divide-y divide-stone-100">
                  <div className="grid grid-cols-3 py-2.5 items-center">
                    <span className="font-semibold text-stone-700">도감 칸</span>
                    <span className="text-center text-stone-500 font-mono">10칸</span>
                    <span className="text-right font-black text-emerald-600">무제한</span>
                  </div>

                  <div className="grid grid-cols-3 py-2.5 items-center">
                    <span className="font-semibold text-stone-700">포착 점수 · 백과</span>
                    <span className="text-center text-stone-500">10칸까지</span>
                    <span className="text-right font-black text-emerald-600">모든 생물</span>
                  </div>

                  <div className="grid grid-cols-3 py-2.5 items-center">
                    <span className="font-semibold text-stone-700">사진 저장</span>
                    <span className="text-center text-stone-500">압축본</span>
                    <span className="text-right font-black text-emerald-600">원본 + Live</span>
                  </div>

                  <div className="grid grid-cols-3 py-2.5 items-center">
                    <span className="font-semibold text-stone-700">뱃지 · 경험치 · 리포트</span>
                    <span className="text-center text-stone-500">✓</span>
                    <span className="text-right font-black text-emerald-600">✓</span>
                  </div>

                  <div className="grid grid-cols-3 py-2.5 items-center">
                    <span className="font-semibold text-stone-700">구독이 끝나도</span>
                    <span className="text-center text-stone-300">-</span>
                    <span className="text-right font-black text-emerald-600">모든 도감 평생</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 pt-3 pb-6 sticky bottom-0 z-20 bg-[#F5F5F7]/95 backdrop-blur-xs space-y-2">
              <button
                type="button"
                id="btn-subscribe-and-start"
                onClick={() => {
                  confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
                  handleFinalHomeEntry(true);
                }}
                className="w-full py-4 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl text-sm font-black transition-all active:scale-98 shadow-md cursor-pointer block text-center"
              >
                {selectedPlanTier === 'yearly'
                  ? '연간 29,000원으로 시작하기'
                  : selectedPlanTier === 'monthly'
                  ? '월 3,300원으로 시작하기'
                  : '58,000원으로 평생 이용하기'}
              </button>

              <button
                type="button"
                id="btn-plan-skip-free"
                onClick={() => handleFinalHomeEntry(false)}
                className="w-full py-1 text-center text-xs text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
              >
                무료 10칸으로 먼저 써 볼게요
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};