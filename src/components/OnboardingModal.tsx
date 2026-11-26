import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  ChevronRight,
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  MapPin,
  Bell,
  Mail,
  ShieldCheck,
  Lock,
  AlertCircle,
  ZapOff,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NaturalistPersona, UserAccount } from '../types';
import { NATURALIST_PERSONAS } from '../data/hotspots';
import { PersonaBadgeIcon } from './PersonaBadgeIcon';
import yellowCosmosPhoto from '../assets/specimens/unsplash_4ByFHyNdoD4.png';

export type OnboardingFlowStep =
  | 'splash'
  | 'preview' // A-02 시작 화면
  | 'preview_prompt' // A-02b 미리 해 보기
  | 'demo_camera' // A-02c 샘플 카메라 체험
  | 'demo_result' // A-02d 샘플 포착 결과
  | 'terms_age' // A-09 서비스 이용 동의 & 나이 확인
  | 'guardian_info' // A-09c 보호자 정보 입력
  | 'guardian_sent' // A-09d/e/f 보호자 메일 발송 & 결과
  | 'nickname' // A-04 닉네임 입력
  | 'locations' // A-05 장소·빈도 질문
  | 'purposes' // A-06 목적 질문
  | 'persona' // A-07 탐험가 유형 (9종)
  | 'permissions' // A-08 권한 안내
  | 'complete'; // A-12 시작 완료

export interface OnboardingCompletePayload {
  selectedPersona?: NaturalistPersona;
  targetTab?: 'archive' | 'lens';
  preferredLocations?: string[];
  visitFrequency?: string;
  purposes?: string[];
  account?: UserAccount;
  isNewSignup?: boolean;
}

export interface OnboardingModalProps {
  onComplete: (payload?: OnboardingCompletePayload) => void;
  onLoginSuccess: (account: UserAccount, options?: { isNewSignup?: boolean }) => void;
  userAccount?: UserAccount;
  initialPersona?: NaturalistPersona;
  initialStep?: OnboardingFlowStep;
}

type AuthSheetMode =
  | null
  | 'login' // A-03 기존 계정 로그인
  | 'signup_select' // A-03s 신규 가입 계정 선택
  | 'loading' // A-03d 연결 중
  | 'error' // A-03b 로그인 실패
  | 'already_registered' // A-03c 이미 가입한 계정
  | 'expired'; // A-03e 세션 만료

const RESERVED_OR_DUPLICATE_NICKNAMES = new Set([
  '하천지기',
  '모아탐험가',
  '관리자',
  '운영자',
  'admin',
  'moalog',
]);

const PLACE_OPTIONS = [
  { id: '동네 산책길', label: '동네 산책길', bg: '#F4F5F4', icon: 'walk' as const },
  { id: '공원', label: '공원', bg: '#F4F5F4', icon: 'park' as const },
  { id: '산·숲', label: '산·숲', bg: '#F4F5F4', icon: 'mountain' as const },
  { id: '바다·갯벌', label: '바다·갯벌', bg: '#F4F5F4', icon: 'sea' as const },
  { id: '강·하천', label: '강·하천', bg: '#F4F5F4', icon: 'river' as const },
  { id: '집·베란다', label: '집·베란다', bg: '#F4F5F4', icon: 'home' as const },
  { id: '여행지', label: '여행지', bg: '#F4F5F4', icon: 'travel' as const },
];

const FREQUENCY_OPTIONS = ['거의 매일', '주 2~3회', '주말에만', '가끔 여행 갈 때'];

const PURPOSE_OPTIONS = [
  { id: 'curious_name', label: '보이는 생물 이름이 궁금해요' },
  { id: 'fill_dex', label: '나만의 도감을 채우고 싶어요' },
  { id: 'walk_nature', label: '산책하며 자연을 더 관찰하고 싶어요' },
  { id: 'badge_level', label: '뱃지 모으고 레벨업 하고 싶어요' },
  { id: 'with_family', label: '아이·가족과 함께 찾아보고 싶어요' },
];

const GUARDIAN_CONSENT_CHECKLIST = [
  '법정대리인(보호자) 이메일 본인 확인 완료',
  '만 14세 미만 아동의 개인정보 수집·이용 동의',
  '안전 보호 설정 적용 (메모 쓰기·프로필 공개·랭킹 비활성)',
  '도감·뱃지·리포트·탐험맵 조회 기능 정상 이용 가능',
  '만 14세 도달 시 설정에서 일반 계정 전환 가능',
  '보호자 동의 일시 및 확인 이력 안전 보관',
];

function renderPlaceVector(icon: typeof PLACE_OPTIONS[number]['icon']) {
  switch (icon) {
    case 'walk':
      return (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <circle cx="21" cy="11" r="3" fill="#E8B98A" />
          <path d="M18 16L22 16L21 24L17 24L18 16Z" fill="#7D96D8" />
          <path d="M17 24L14 31M21 24L25 31" stroke="#6B79A8" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M18 18L14 21M22 18L26 20" stroke="#E8B98A" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'park':
      return (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <rect x="18.5" y="23" width="3" height="9" rx="1.5" fill="#B5937A" />
          <circle cx="20" cy="17" r="8" fill="#9ED7BD" />
        </svg>
      );
    case 'mountain':
      return (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <path d="M7 28L16 13L25 28H7Z" fill="#8CD2B3" />
          <path d="M16 28L23 16L32 28H16Z" fill="#A8DFC6" />
        </svg>
      );
    case 'sea':
      return (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <path
            d="M8 29C10 23 14 14 21 14C25 14 27 17 25 20C23 22 25 26 32 29H8Z"
            fill="#8DB9F8"
          />
          <path d="M18 14.5C21.5 14 24.5 15.5 25.5 17.5" stroke="#EAF3FF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'river':
      return (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <rect x="8" y="10" width="24" height="20" rx="4" fill="#E3F2FA" />
          <path d="M10 24L16 16L22 24H10Z" fill="#9FD6B9" />
          <path d="M18 24L24 14L30 24H18Z" fill="#B7E2CA" />
          <path d="M12 28C16 25 22 27 28 24" stroke="#85B8F2" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'home':
      return (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <path d="M9 19L20 10L31 19V30H9V19Z" fill="#EFF3F6" />
          <path d="M8 20L20 10L32 20" stroke="#9AC2F5" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="17.5" y="23" width="5" height="7" rx="1" fill="#C4C9CE" />
        </svg>
      );
    case 'travel':
    default:
      return (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <path d="M16 13V10.5C16 9.67 16.67 9 17.5 9H22.5C23.33 9 24 9.67 24 10.5V13" stroke="#9D9692" strokeWidth="2" />
          <rect x="10" y="13" width="20" height="16" rx="3" fill="#CFC1BB" />
        </svg>
      );
  }
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onComplete,
  onLoginSuccess,
  userAccount,
  initialPersona,
  initialStep = 'splash',
}) => {
  const [step, setStep] = useState<OnboardingFlowStep>(initialStep);
  const [enteredViaDemo, setEnteredViaDemo] = useState(false);

  // Demo camera state (A-02c / A-02d) - pure sample, zero OS permission, zero slot deduction
  const [demoZoom, setDemoZoom] = useState<'0.5x' | '1x' | '3x' | '5x'>('1x');
  const [isDemoScanning, setIsDemoScanning] = useState(false);

  // Auth sheet state (A-03 / A-03s / A-03b / A-03c / A-03d / A-03e)
  const [authSheetMode, setAuthSheetMode] = useState<AuthSheetMode>(null);
  const [authLoadingText, setAuthLoadingText] = useState('로그인하고 있어요');
  const [pendingAccount, setPendingAccount] = useState<UserAccount | null>(null);
  const [lastTriedProvider, setLastTriedProvider] = useState<'google' | 'apple'>('google');

  // Terms & Age (A-09 / A-09b / A-10 / A-11) — ALL initially unselected / unchecked
  const [signupAgeGroup, setSignupAgeGroup] = useState<'adult_or_teen14' | 'under14' | null>(null);
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeLocation, setAgreeLocation] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);
  const [isUnder14SheetOpen, setIsUnder14SheetOpen] = useState(false);

  // Guardian consent (A-09c / A-09d / A-09e / A-09f)
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianEmailError, setGuardianEmailError] = useState('');
  const [guardianStatus, setGuardianStatus] = useState<'sent' | 'confirmed' | 'failed'>('sent');
  const [guardianResendNotice, setGuardianResendNotice] = useState(false);

  // Post-signup onboarding questions (A-04 ~ A-08)
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedFrequency, setSelectedFrequency] = useState<string>('');
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<NaturalistPersona | null>(
    initialPersona && initialStep !== 'splash' ? null : null
  );

  // Splash auto-advance (A-01)
  useEffect(() => {
    if (step !== 'splash') return;
    const timer = setTimeout(() => {
      if (userAccount?.isLoggedIn) {
        if (userAccount.guardianConsentPending) {
          setPendingAccount(userAccount);
          setGuardianName(userAccount.guardianConsent?.guardianName || '');
          setGuardianEmail(userAccount.guardianConsent?.guardianEmail || '');
          setGuardianStatus('sent');
          setStep('guardian_sent');
        } else {
          onComplete({ selectedPersona: initialPersona || 'general', targetTab: 'archive' });
        }
      } else {
        setStep('preview');
      }
    }, 1250);
    return () => clearTimeout(timer);
  }, [step, userAccount, initialPersona, onComplete]);

  // Keep agreeAll synced when individual items toggle
  useEffect(() => {
    const marketingDone = signupAgeGroup === 'under14' ? true : agreeMarketing;
    setAgreeAll(agreeTerms && agreePrivacy && agreeLocation && marketingDone);
  }, [agreeTerms, agreePrivacy, agreeLocation, agreeMarketing, signupAgeGroup]);

  // Clear marketing consent automatically if user switches to under14
  useEffect(() => {
    if (signupAgeGroup === 'under14') {
      setAgreeMarketing(false);
    }
  }, [signupAgeGroup]);

  const handleToggleAgreeAll = () => {
    const next = !agreeAll;
    setAgreeAll(next);
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgreeLocation(next);
    setAgreeMarketing(signupAgeGroup === 'under14' ? false : next);
  };

  // Demo camera shutter -> scan -> A-02d result
  const handleDemoShutter = () => {
    if (isDemoScanning) return;
    setIsDemoScanning(true);
    setTimeout(() => {
      setIsDemoScanning(false);
      setStep('demo_result');
    }, 1150);
  };

  // Social Auth handler for both A-03 (existing login) & A-03s (new signup)
  const handleSelectAuthProvider = (
    provider: 'google' | 'apple',
    context: 'login' | 'signup_select'
  ) => {
    setLastTriedProvider(provider);
    setAuthLoadingText(context === 'login' ? '로그인하고 있어요' : '계정을 연결하고 있어요');
    setAuthSheetMode('loading');

    setTimeout(() => {
      const email =
        provider === 'google' ? 'explorer@gmail.com' : 'explorer@icloud.com';
      const isUnder14 = signupAgeGroup === 'under14';

      if (context === 'login') {
        const returningAccount: UserAccount = {
          isLoggedIn: true,
          id: `${provider}_returning`,
          email,
          name: provider === 'google' ? '자연 관찰자' : 'Apple 탐험가',
          nickname: '자연관찰자',
          provider,
          connectedAt: new Date().toLocaleDateString('ko-KR'),
          ageGroup: 'adult_or_teen14',
          isUnder14: false,
        };
        setAuthSheetMode(null);
        onLoginSuccess(returningAccount, { isNewSignup: false });
        onComplete({
          account: returningAccount,
          targetTab: 'archive',
          isNewSignup: false,
        });
        return;
      }

      // New signup account creation (A-03s -> A-03d)
      // 갈래 C: Under-14 creates account in "동의 대기" state BEFORE guardian email (A-09c)
      const createdAccount: UserAccount = {
        isLoggedIn: true,
        id: `${provider}_${Date.now()}`,
        email,
        name: isUnder14 ? '어린이 탐험가' : '새 탐험가',
        provider,
        connectedAt: new Date().toLocaleDateString('ko-KR'),
        ageGroup: isUnder14 ? 'under14' : 'adult_or_teen14',
        isUnder14,
        guardianConsentPending: isUnder14,
      };

      setPendingAccount(createdAccount);
      setAuthSheetMode(null);

      if (isUnder14) {
        setStep('guardian_info');
      } else {
        setStep('nickname');
      }
    }, 650);
  };

  // A-09 CTA click
  const handleTermsContinue = () => {
    if (!signupAgeGroup || !agreeTerms || !agreePrivacy) return;
    if (signupAgeGroup === 'under14') {
      // A-09b sheet opens OVER A-09
      setIsUnder14SheetOpen(true);
    } else {
      // Adult >= 14: A-03s account selection sheet -> A-03d -> A-04
      setAuthSheetMode('signup_select');
    }
  };

  // A-09b CTA ("확인하고 시작하기") -> A-03s FIRST (account created in "동의 대기") -> A-09c
  const handleConfirmUnder14Notice = () => {
    setIsUnder14SheetOpen(false);
    setAuthSheetMode('signup_select');
  };

  // A-09c guardian submit
  const handleSubmitGuardianInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = guardianName.trim();
    const trimmedEmail = guardianEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName) return;
    if (!emailRegex.test(trimmedEmail)) {
      setGuardianEmailError('올바른 이메일 주소를 입력해 주세요');
      return;
    }

    setGuardianEmailError('');
    setGuardianStatus('sent');
    setGuardianResendNotice(false);
    setPendingAccount((prev) =>
      prev
        ? {
            ...prev,
            guardianConsentPending: true,
            guardianConsent: {
              guardianName: trimmedName,
              guardianEmail: trimmedEmail,
              consentedAt: '',
            },
          }
        : prev
    );
    setStep('guardian_sent');
  };

  const handleConfirmGuardianConsent = () => {
    const consentedAt = new Date().toLocaleDateString('ko-KR');
    setPendingAccount((prev) =>
      prev
        ? {
            ...prev,
            guardianConsentPending: false,
            guardianConsent: {
              guardianName: guardianName.trim(),
              guardianEmail: guardianEmail.trim(),
              consentedAt,
            },
          }
        : prev
    );
    setStep('nickname');
  };

  const handleCancelUnder14Signup = () => {
    setPendingAccount(null);
    setGuardianName('');
    setGuardianEmail('');
    setGuardianStatus('sent');
    setSignupAgeGroup(null);
    setStep('preview');
  };

  // A-04 nickname validation & submit (mandatory, no skip)
  const validateNickname = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '닉네임을 입력해 주세요';
    if (trimmed.length < 2) return '2자 이상 입력해 주세요';
    if (trimmed.length > 12) return '12자 이하로 입력해 주세요';
    if (!/^[가-힣a-zA-Z0-9_]+$/.test(trimmed)) {
      return '한글, 영문, 숫자, 밑줄(_)만 사용할 수 있어요';
    }
    if (RESERVED_OR_DUPLICATE_NICKNAMES.has(trimmed.toLowerCase())) {
      return '이미 사용 중이거나 사용할 수 없는 닉네임이에요';
    }
    return '';
  };

  const handleNicknameSubmit = () => {
    const err = validateNickname(nickname);
    if (err) {
      setNicknameError(err);
      return;
    }
    const cleanNick = nickname.trim();
    setNicknameError('');
    setPendingAccount((prev) =>
      prev
        ? {
            ...prev,
            name: cleanNick,
            nickname: cleanNick,
            nicknameUpdatedAt: new Date().toISOString(),
          }
        : {
            isLoggedIn: true,
            email: 'explorer@gmail.com',
            name: cleanNick,
            nickname: cleanNick,
            nicknameUpdatedAt: new Date().toISOString(),
            provider: lastTriedProvider,
            ageGroup: signupAgeGroup || 'adult_or_teen14',
            isUnder14: signupAgeGroup === 'under14',
          }
    );
    setStep('locations');
  };

  // A-12 final entry
  const handleFinishOnboarding = (targetTab: 'archive' | 'lens') => {
    const chosenPersona: NaturalistPersona = selectedPersona || 'general';
    const cleanNick = nickname.trim() || pendingAccount?.nickname || '탐험가';
    const finalAccount: UserAccount = pendingAccount
      ? {
          ...pendingAccount,
          name: cleanNick,
          nickname: cleanNick,
          guardianConsentPending: false,
        }
      : {
          isLoggedIn: true,
          email: 'explorer@gmail.com',
          name: cleanNick,
          nickname: cleanNick,
          provider: lastTriedProvider,
          connectedAt: new Date().toLocaleDateString('ko-KR'),
          ageGroup: signupAgeGroup || 'adult_or_teen14',
          isUnder14: signupAgeGroup === 'under14',
          guardianConsentPending: false,
        };

    onLoginSuccess(finalAccount, { isNewSignup: true });
    onComplete({
      selectedPersona: chosenPersona,
      targetTab,
      preferredLocations: selectedLocations,
      visitFrequency: selectedFrequency || undefined,
      purposes: selectedPurposes,
      account: finalAccount,
      isNewSignup: true,
    });
  };

  const activePersonaProfile = NATURALIST_PERSONAS[selectedPersona || 'general'];

  const renderProgressHeader = (stepIndex: number, onBack: () => void) => (
    <div className="shrink-0 bg-[#fbfbfb]">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 -ml-2 rounded-full text-[#202320] hover:bg-[#f4f5f4] flex items-center justify-center cursor-pointer transition-colors"
          aria-label="뒤로"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10" />
      </div>
      <div className="w-full h-[2px] bg-[#e6e9e5]">
        <div
          className="h-full bg-black transition-all duration-300"
          style={{ width: `${(stepIndex / 5) * 100}%` }}
        />
      </div>
    </div>
  );

  // Sample card used in A-02 & A-02b matching reference screenshots
  const renderSampleCosmosCard = () => (
    <div className="w-[216px] rounded-[18px] p-[6px] bg-gradient-to-b from-[#9bd64c] via-[#7bbd2a] to-[#91cf42] shadow-[0_8px_24px_rgba(32,35,32,0.08)]">
      <div className="rounded-[13px] overflow-hidden bg-white">
        <div className="relative aspect-[4/4.1] bg-[#2d3826] overflow-hidden">
          <img
            src={yellowCosmosPhoto}
            alt="노랑코스모스"
            className="w-full h-full object-cover object-[50%_78%]"
          />
          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-black text-white text-[11px] font-bold tracking-wider">
            NEW
          </span>
        </div>
        <div className="bg-gradient-to-b from-[#e8eae7] via-[#f4f5f4] to-[#d9dcd7] py-3 px-2 text-center border-t border-[#e6e9e5]">
          <p className="text-[15px] font-bold text-[#202320] tracking-[-0.01em]">노랑코스모스</p>
          <p className="text-[11px] font-semibold text-[#8c948a] mt-0.5 tabular-nums">NO.001</p>
        </div>
      </div>
    </div>
  );

  return (
    <div
      id="onboarding-flow-container"
      className="fixed inset-0 z-50 bg-[#fbfbfb] text-[#202320] flex flex-col overflow-hidden select-none"
    >
      <AnimatePresence mode="wait">
        {/* ================= A-01: 스플래시 ================= */}
        {step === 'splash' && (
          <motion.div
            key="a01-splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!userAccount?.isLoggedIn) setStep('preview');
            }}
            className="w-full h-full flex flex-col items-center justify-between px-6 py-12 cursor-pointer bg-[#fbfbfb]"
          >
            <div />
            <div className="flex flex-col items-center space-y-5 text-center">
              <div className="w-20 h-20 rounded-[24px] bg-[#f4fbdd] border border-[#c4eb43] flex items-center justify-center shadow-2xs">
                <span className="text-[32px] font-bold text-[#202320] tracking-tight">M</span>
              </div>
              <div className="space-y-1.5">
                <h1 className="text-[32px] font-bold text-[#202320] tracking-[-0.02em]">Moalog</h1>
                <p className="text-[14px] text-[#626961]">찍으면, 도감이 된다</p>
              </div>
            </div>
            <div className="w-32 h-1 rounded-full bg-[#e6e9e5] overflow-hidden">
              <motion.div
                className="h-full bg-black"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        )}

        {/* ================= A-02: 시작 화면 ================= */}
        {step === 'preview' && (
          <motion.div
            key="a02-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full max-w-md mx-auto flex flex-col justify-between px-4 py-6 overflow-y-auto"
          >
            <div className="my-auto pt-4 pb-6 flex flex-col items-center">
              {renderSampleCosmosCard()}
            </div>

            <div className="space-y-6 pb-2">
              <div className="space-y-2 px-1 text-left">
                <p className="text-[14px] font-semibold text-[#8c948a]">반가워요</p>
                <h2 className="text-[28px] font-bold text-[#202320] tracking-[-0.02em] leading-[1.28]">
                  만난 생명을<br />찍고 알아보고 모아요
                </h2>
                <p className="text-[14px] text-[#626961] leading-[1.55]">
                  길에서 만난 꽃, 새, 곤충 등을 찍어 보세요<br />
                  이름과 특징을 바로 알려 드려요
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  id="btn-onboarding-start"
                  onClick={() => setStep('preview_prompt')}
                  className="w-full h-14 bg-black hover:bg-[#202320] text-white rounded-xl text-[15px] font-bold transition-all active:scale-[0.99] cursor-pointer"
                >
                  시작하기
                </button>
                <button
                  type="button"
                  id="btn-onboarding-open-login"
                  onClick={() => setAuthSheetMode('login')}
                  className="w-full h-14 bg-white hover:bg-[#f4f5f4] text-[#202320] border border-[#e6e9e5] rounded-xl text-[15px] font-bold transition-all active:scale-[0.99] cursor-pointer"
                >
                  로그인
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= A-02b: 미리 해 보기 ================= */}
        {step === 'preview_prompt' && (
          <motion.div
            key="a02b-preview-prompt"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="w-full h-full max-w-md mx-auto flex flex-col justify-between px-4 py-6 overflow-y-auto"
          >
            <div className="my-auto pt-4 pb-6 flex flex-col items-center">
              {renderSampleCosmosCard()}
            </div>

            <div className="space-y-6 pb-2">
              <div className="space-y-2 px-1 text-left">
                <p className="text-[14px] font-semibold text-[#8c948a]">미리 해 보기</p>
                <h2 className="text-[28px] font-bold text-[#202320] tracking-[-0.02em] leading-[1.28]">
                  한번 찍어 볼까요?
                </h2>
                <p className="text-[14px] text-[#626961] leading-[1.55]">
                  샘플 사진으로 모아로그가 이름을 알아내는 과정까지<br />
                  빠르게 체험해 볼 수 있어요
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEnteredViaDemo(true);
                    setStep('demo_camera');
                  }}
                  className="w-full h-14 bg-black hover:bg-[#202320] text-white rounded-xl text-[15px] font-bold transition-all active:scale-[0.99] cursor-pointer"
                >
                  체험해 보기
                </button>
                <button
                  type="button"
                  onClick={() => setAuthSheetMode('login')}
                  className="w-full py-2.5 text-center text-[14px] text-[#8c948a] hover:text-[#202320] font-semibold cursor-pointer"
                >
                  건너뛰기
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= A-02c: 샘플 카메라 체험 (권한 요청 없음, 칸 차감 없음) ================= */}
        {step === 'demo_camera' && (
          <motion.div
            key="a02c-demo-camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full max-w-md mx-auto bg-black text-white flex flex-col justify-between"
          >
            {/* Top Bar matching B-01 */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setStep('preview_prompt')}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[12px] font-semibold text-white/70 bg-white/10 px-3 py-1 rounded-full">
                샘플 체험 카메라
              </span>
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-full bg-white/10 text-white/80 flex items-center justify-center text-[12px] font-bold">
                  A
                </span>
                <span className="w-9 h-9 rounded-full bg-white/10 text-white/80 flex items-center justify-center">
                  <ZapOff className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Sample Viewfinder */}
            <div className="relative flex-1 overflow-hidden bg-[#151815] flex items-center justify-center">
              <img
                src={yellowCosmosPhoto}
                alt="노랑코스모스 샘플 화면"
                className={`w-full h-full object-cover object-[50%_75%] transition-transform duration-300 ${
                  demoZoom === '0.5x'
                    ? 'scale-90'
                    : demoZoom === '3x'
                    ? 'scale-125'
                    : demoZoom === '5x'
                    ? 'scale-150'
                    : 'scale-105'
                }`}
              />
              {/* Subtle corner framing brackets */}
              <div className="absolute inset-8 pointer-events-none">
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white/80 rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white/80 rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white/80 rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white/80 rounded-br-sm" />
              </div>

              {isDemoScanning && (
                <div className="absolute inset-0 bg-black/55 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full border-3 border-[#c4eb43] border-t-transparent animate-spin" />
                  <p className="text-[14px] font-bold text-white">이름을 알아보는 중...</p>
                </div>
              )}
            </div>

            {/* Bottom Zoom & Shutter Bar matching B-01 */}
            <div className="px-6 pt-3 pb-8 bg-black space-y-5 shrink-0">
              <div className="flex items-center justify-center gap-3">
                {(['0.5x', '1x', '3x', '5x'] as const).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setDemoZoom(z)}
                    className={`px-3 py-1 rounded-full text-[12px] font-bold tabular-nums transition-colors cursor-pointer ${
                      demoZoom === z ? 'bg-white text-black' : 'text-white/75 hover:text-white'
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white/60">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={handleDemoShutter}
                  disabled={isDemoScanning}
                  className="w-[72px] h-[72px] rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                  aria-label="샘플 촬영"
                >
                  <div className="w-full h-full rounded-full bg-white" />
                </button>
                <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/25 bg-white/10">
                  <img
                    src={yellowCosmosPhoto}
                    alt="샘플 미리보기"
                    className="w-full h-full object-cover object-bottom"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= A-02d: 샘플 포착 결과 (저장 안 됨) ================= */}
        {step === 'demo_result' && (
          <motion.div
            key="a02d-demo-result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full h-full max-w-md mx-auto bg-[#fbfbfb] flex flex-col justify-between px-4 py-4 overflow-y-auto"
          >
            <div className="flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setStep('demo_camera')}
                className="w-10 h-10 rounded-full bg-[#f4f5f4] text-[#202320] flex items-center justify-center cursor-pointer"
                aria-label="뒤로"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-[14px] font-bold text-[#202320]">체험 결과</span>
              <div className="w-10" />
            </div>

            <div className="my-auto py-4 space-y-4 text-center">
              <div>
                <h2 className="text-[24px] font-bold text-[#202320] tracking-[-0.02em]">
                  노랑코스모스
                </h2>
                <p className="text-[13px] text-[#626961] mt-0.5">
                  식물 · 국화과 · Cosmos sulphureus
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#e6e9e5]">
                <span className="w-5 h-5 rounded-md bg-[#2f9ad6] text-white text-[11px] font-bold flex items-center justify-center">
                  S
                </span>
                <span className="text-[15px] font-bold text-[#202320] tabular-nums">93점</span>
              </div>

              {/* Green Framed Card matching B-10 */}
              <div className="bg-[#f4f5f4] rounded-[24px] p-5 flex justify-center">
                <div className="w-[186px] rounded-[16px] bg-gradient-to-b from-[#6ab816] to-[#56a208] p-3 text-left shadow-md">
                  <p className="text-center text-[11px] font-bold text-[#142006] mb-2">Moalog</p>
                  <div className="rounded-[12px] bg-[#1e211e] text-white p-2.5 space-y-2.5">
                    <div className="text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/80 font-semibold">
                        식물 · No.001
                      </span>
                    </div>
                    <div className="aspect-square rounded-lg overflow-hidden bg-[#2b302b]">
                      <img
                        src={yellowCosmosPhoto}
                        alt="노랑코스모스"
                        className="w-full h-full object-cover object-[50%_80%]"
                      />
                    </div>
                    <div className="flex items-end justify-between gap-2 pt-0.5">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-white leading-snug">노랑코스모스</p>
                        <p className="text-[9px] text-white/60 italic leading-tight">
                          Cosmos sulphureus
                        </p>
                        <p className="text-[9px] text-white/60 mt-1">망원동 · 2026.11.15</p>
                      </div>
                      <span className="w-5 h-5 rounded-md bg-[#2f9ad6] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        S
                      </span>
                    </div>
                  </div>
                  <p className="text-center text-[10px] font-semibold text-[#142006] mt-2">
                    @moa_explorer
                  </p>
                </div>
              </div>

              <p className="text-[13px] text-[#626961]">
                가입하면 내 도감이 시작돼요
              </p>
            </div>

            <div className="pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setStep('terms_age')}
                className="w-full h-14 bg-black hover:bg-[#202320] text-white rounded-xl text-[15px] font-bold transition-all active:scale-[0.99] cursor-pointer"
              >
                가입하고 계속하기
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= A-09: 서비스 이용 동의 & 나이 확인 ================= */}
        {step === 'terms_age' && (
          <motion.div
            key="a09-terms-age"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="w-full h-full max-w-md mx-auto flex flex-col justify-between overflow-hidden"
          >
            <div className="px-4 pt-3 pb-1 shrink-0">
              <button
                type="button"
                onClick={() => setStep(enteredViaDemo ? 'demo_result' : 'preview_prompt')}
                className="w-10 h-10 -ml-2 rounded-full text-[#202320] hover:bg-[#f4f5f4] flex items-center justify-center cursor-pointer"
                aria-label="뒤로"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6 space-y-5">
              <div>
                <h2 className="text-[26px] font-bold text-[#202320] tracking-[-0.02em]">
                  서비스 이용 동의
                </h2>
                <p className="text-[14px] text-[#626961] mt-1">
                  시작하기 전에 동의가 필요해요
                </p>
              </div>

              {/* Age Check Radios — both initially unselected */}
              <div className="space-y-3 pt-1">
                <p className="text-[13px] font-semibold text-[#626961]">나이 확인 · 필수</p>

                <button
                  type="button"
                  onClick={() => setSignupAgeGroup('adult_or_teen14')}
                  className="w-full py-2 flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-[16px] font-bold text-[#202320]">만 14세 이상이에요</span>
                  <span
                    className={`w-6 h-6 rounded-full transition-all shrink-0 ${
                      signupAgeGroup === 'adult_or_teen14'
                        ? 'border-[7px] border-black bg-white'
                        : 'border-2 border-[#a5aca4] bg-white'
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setSignupAgeGroup('under14')}
                  className="w-full py-2 flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-[16px] font-bold text-[#202320]">만 14세 미만이에요</span>
                  <span
                    className={`w-6 h-6 rounded-full transition-all shrink-0 ${
                      signupAgeGroup === 'under14'
                        ? 'border-[7px] border-black bg-white'
                        : 'border-2 border-[#a5aca4] bg-white'
                    }`}
                  />
                </button>
              </div>

              {/* Agree All Box — initially unchecked */}
              <button
                type="button"
                onClick={handleToggleAgreeAll}
                className="w-full p-4 rounded-2xl bg-[#f4f5f4] flex items-center gap-3 text-left cursor-pointer"
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                    agreeAll ? 'bg-black text-white' : 'bg-[#b7bdb5] text-white'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
                <span className="text-[16px] font-bold text-[#202320]">약관 모두 동의하기</span>
              </button>

              {/* Individual Terms — all initially unchecked */}
              <div className="space-y-3.5 px-1">
                {/* 1. 필수 회원 이용약관 (opens A-10) */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setAgreeTerms(!agreeTerms)}
                    className="flex items-center gap-3 text-left cursor-pointer flex-1 py-1"
                  >
                    <Check
                      className={`w-4 h-4 stroke-[2.6] shrink-0 transition-colors ${
                        agreeTerms ? 'text-black' : 'text-[#d2d7d1]'
                      }`}
                    />
                    <span className="text-[13px] font-semibold text-[#8c948a]">필수</span>
                    <span className="text-[15px] text-[#202320]">회원 이용약관</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLegalModal('terms')}
                    className="p-1.5 text-[#202320] hover:bg-[#f4f5f4] rounded-lg cursor-pointer"
                    aria-label="회원 이용약관 전문 보기"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 2. 필수 개인정보 수집/이용 (opens A-11) */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setAgreePrivacy(!agreePrivacy)}
                    className="flex items-center gap-3 text-left cursor-pointer flex-1 py-1"
                  >
                    <Check
                      className={`w-4 h-4 stroke-[2.6] shrink-0 transition-colors ${
                        agreePrivacy ? 'text-black' : 'text-[#d2d7d1]'
                      }`}
                    />
                    <span className="text-[13px] font-semibold text-[#8c948a]">필수</span>
                    <span className="text-[15px] text-[#202320]">개인정보 수집/이용</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLegalModal('privacy')}
                    className="p-1.5 text-[#202320] hover:bg-[#f4f5f4] rounded-lg cursor-pointer"
                    aria-label="개인정보 수집/이용 전문 보기"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 3. 선택 위치기반 서비스 이용약관 */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setAgreeLocation(!agreeLocation)}
                    className="flex items-center gap-3 text-left cursor-pointer flex-1 py-1"
                  >
                    <Check
                      className={`w-4 h-4 stroke-[2.6] shrink-0 transition-colors ${
                        agreeLocation ? 'text-black' : 'text-[#d2d7d1]'
                      }`}
                    />
                    <span className="text-[13px] font-semibold text-[#8c948a]">선택</span>
                    <span className="text-[15px] text-[#202320]">위치기반 서비스 이용약관</span>
                  </button>
                </div>

                {/* 4. 선택 마케팅 정보 수신 동의 — hidden for under14 */}
                {signupAgeGroup !== 'under14' && (
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setAgreeMarketing(!agreeMarketing)}
                      className="flex items-center gap-3 text-left cursor-pointer flex-1 py-1"
                    >
                      <Check
                        className={`w-4 h-4 stroke-[2.6] shrink-0 transition-colors ${
                          agreeMarketing ? 'text-black' : 'text-[#d2d7d1]'
                        }`}
                      />
                      <span className="text-[13px] font-semibold text-[#8c948a]">선택</span>
                      <span className="text-[15px] text-[#202320]">마케팅 정보 수신 동의</span>
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[12px] text-[#8c948a] leading-relaxed pt-1">
                선택 항목에 동의하지 않아도 기본 서비스는 이용할 수 있어요. 만 14세 미만이면 메모 쓰기·프로필 공개·랭킹 노출이 꺼진 상태로 시작해요
              </p>
            </div>

            <div className="px-4 pb-6 pt-2 bg-[#fbfbfb] shrink-0">
              <button
                type="button"
                disabled={!signupAgeGroup || !agreeTerms || !agreePrivacy}
                onClick={handleTermsContinue}
                className="w-full h-14 rounded-xl bg-black hover:bg-[#202320] disabled:bg-[#e8e8e8] disabled:text-[#a5aca4] text-white text-[15px] font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                동의하고 계속하기
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= A-09c: 보호자 정보 입력 ================= */}
        {step === 'guardian_info' && (
          <motion.form
            key="a09c-guardian-info"
            onSubmit={handleSubmitGuardianInfo}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="w-full h-full max-w-md mx-auto flex flex-col justify-between overflow-hidden"
          >
            <div className="px-4 pt-3 pb-1 shrink-0">
              <button
                type="button"
                onClick={() => setStep('terms_age')}
                className="w-10 h-10 -ml-2 rounded-full text-[#202320] hover:bg-[#f4f5f4] flex items-center justify-center cursor-pointer"
                aria-label="뒤로"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6 space-y-7">
              <div>
                <h2 className="text-[24px] font-bold text-[#202320] tracking-[-0.02em]">
                  보호자 정보를 알려 주세요
                </h2>
                <p className="text-[13px] text-[#626961] mt-1">
                  만 14세 미만은 보호자의 동의가 필요해요
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[13px] font-semibold text-[#8c948a] block mb-1">
                    보호자 성명
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="성명"
                    className="w-full py-2.5 bg-transparent border-b border-[#e6e9e5] focus:border-black text-[18px] font-bold text-[#202320] placeholder:text-[#a5aca4] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-[#8c948a] block mb-1">
                    보호자 이메일
                  </label>
                  <input
                    type="email"
                    value={guardianEmail}
                    onChange={(e) => {
                      setGuardianEmail(e.target.value);
                      if (guardianEmailError) setGuardianEmailError('');
                    }}
                    placeholder="guardian@email.com"
                    className={`w-full py-2.5 bg-transparent border-b text-[18px] font-bold text-[#202320] placeholder:text-[#a5aca4] focus:outline-none transition-colors ${
                      guardianEmailError ? 'border-[#ff5100]' : 'border-[#e6e9e5] focus:border-black'
                    }`}
                  />
                  {guardianEmailError && (
                    <p className="text-[12px] text-[#ff5100] font-semibold mt-1.5">
                      {guardianEmailError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 pb-6 pt-2 bg-[#fbfbfb] shrink-0">
              <button
                type="submit"
                disabled={!guardianName.trim() || !guardianEmail.trim()}
                className="w-full h-14 rounded-xl bg-black hover:bg-[#202320] disabled:bg-[#e8e8e8] disabled:text-[#a5aca4] text-white text-[15px] font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                동의 메일 보내기
              </button>
            </div>
          </motion.form>
        )}

        {/* ================= A-09d / A-09e / A-09f: 보호자 동의 확인 ================= */}
        {step === 'guardian_sent' && (
          <motion.div
            key="a09d-guardian-sent"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="w-full h-full max-w-md mx-auto flex flex-col justify-between overflow-hidden"
          >
            <div className="px-4 pt-3 pb-1 shrink-0">
              <button
                type="button"
                onClick={() => setStep('guardian_info')}
                className="w-10 h-10 -ml-2 rounded-full text-[#202320] hover:bg-[#f4f5f4] flex items-center justify-center cursor-pointer"
                aria-label="뒤로"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {guardianStatus === 'sent' && (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col items-center justify-center text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-[#f4fbdd] border border-[#c4eb43] text-[#6d8911] flex items-center justify-center">
                    <Mail className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#f4f5f4] text-[12px] font-bold text-[#626961]">
                      동의 대기 중
                    </span>
                    <h2 className="text-[24px] font-bold text-[#202320] tracking-[-0.02em]">
                      동의 메일을 보냈어요
                    </h2>
                    <p className="text-[14px] text-[#626961] leading-relaxed">
                      <strong className="text-[#202320]">{guardianEmail}</strong>으로 보낸 메일에서<br />
                      {guardianName}님의 동의 확인을 완료해 주세요
                    </p>
                  </div>

                  {guardianResendNotice && (
                    <div className="px-3.5 py-2 rounded-xl bg-[#f4fbdd] border border-[#c4eb43] text-[12px] font-semibold text-[#6d8911]">
                      동의 메일을 다시 보냈어요
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-4 pt-1">
                    <button
                      type="button"
                      onClick={() => setGuardianResendNotice(true)}
                      className="text-[13px] font-bold text-[#202320] underline cursor-pointer"
                    >
                      메일 다시 보내기
                    </button>
                    <span className="text-[#d2d7d1]">|</span>
                    <button
                      type="button"
                      onClick={() => setStep('guardian_info')}
                      className="text-[13px] font-semibold text-[#626961] hover:text-[#202320] cursor-pointer"
                    >
                      이메일 바꾸기
                    </button>
                  </div>
                </div>

                <div className="px-4 pb-6 pt-2 space-y-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setGuardianStatus('confirmed')}
                    className="w-full h-14 rounded-xl bg-black hover:bg-[#202320] text-white text-[15px] font-bold cursor-pointer"
                  >
                    보호자 동의 완료 확인
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuardianStatus('failed')}
                    className="w-full py-2 text-center text-[13px] text-[#8c948a] hover:text-[#202320] font-semibold cursor-pointer"
                  >
                    동의 거절 · 만료 시 안내 보기
                  </button>
                </div>
              </>
            )}

            {guardianStatus === 'confirmed' && (
              <>
                <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#f4fbdd] border border-[#c4eb43] text-[#6d8911] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-[22px] font-bold text-[#202320] tracking-[-0.02em]">
                        보호자 동의가 완료되었어요
                      </h2>
                      <p className="text-[13px] text-[#626961]">
                        {guardianName}님({guardianEmail}) 확인 완료
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-[20px] border border-[#e6e9e5] p-4 space-y-3">
                    {GUARDIAN_CONSENT_CHECKLIST.map((item) => (
                      <div key={item} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#f4fbdd] text-[#6d8911] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                        <span className="text-[13px] text-[#202320] leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-4 pb-6 pt-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleConfirmGuardianConsent}
                    className="w-full h-14 rounded-xl bg-black hover:bg-[#202320] text-white text-[15px] font-bold cursor-pointer"
                  >
                    계속하기
                  </button>
                </div>
              </>
            )}

            {guardianStatus === 'failed' && (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#fff1eb] text-[#ff5100] flex items-center justify-center">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-[22px] font-bold text-[#202320]">
                      보호자 동의를 받지 못했어요
                    </h2>
                    <p className="text-[14px] text-[#626961] leading-relaxed">
                      동의 링크가 만료되었거나 거절되었어요.<br />
                      이메일을 다시 확인하거나 가입을 취소할 수 있어요.
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-6 pt-2 space-y-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setGuardianStatus('sent');
                      setStep('guardian_info');
                    }}
                    className="w-full h-14 rounded-xl bg-black hover:bg-[#202320] text-white text-[15px] font-bold cursor-pointer"
                  >
                    보호자 정보 다시 입력하기
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelUnder14Signup}
                    className="w-full h-12 rounded-xl bg-white border border-[#e6e9e5] text-[#ff5100] text-[14px] font-bold cursor-pointer"
                  >
                    가입 취소하기
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ================= A-04: 닉네임 입력 (필수, 건너뛰기 없음) ================= */}
        {step === 'nickname' && (
          <motion.div
            key="a04-nickname"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="w-full h-full max-w-md mx-auto flex flex-col justify-between overflow-hidden"
          >
            {renderProgressHeader(1, () =>
              setStep(signupAgeGroup === 'under14' ? 'guardian_sent' : 'terms_age')
            )}

            <div className="flex-1 overflow-y-auto px-4 pt-6 pb-6 space-y-7">
              <div>
                <h2 className="text-[24px] font-bold text-[#202320] tracking-[-0.02em]">
                  닉네임을 적어주세요
                </h2>
                <p className="text-[13px] text-[#626961] mt-1">
                  탐험 맵과 댓글에 표시돼요
                </p>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-[#8c948a] block mb-1">
                  닉네임
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={nickname}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNickname(v);
                    if (nicknameError) setNicknameError(validateNickname(v));
                  }}
                  placeholder="모아로그 닉네임"
                  autoFocus
                  className={`w-full py-3 bg-transparent border-b text-[20px] font-bold text-[#202320] placeholder:text-[#a5aca4] focus:outline-none transition-colors ${
                    nicknameError ? 'border-[#ff5100]' : 'border-[#e6e9e5] focus:border-black'
                  }`}
                />
                {nicknameError && (
                  <p className="text-[12px] font-semibold text-[#ff5100] mt-2">
                    {nicknameError}
                  </p>
                )}
              </div>
            </div>

            <div className="px-4 pb-6 pt-2 bg-[#fbfbfb] shrink-0">
              <button
                type="button"
                disabled={!nickname.trim()}
                onClick={handleNicknameSubmit}
                className="w-full h-14 rounded-xl bg-black hover:bg-[#202320] disabled:bg-[#e8e8e8] disabled:text-[#a5aca4] text-white text-[15px] font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                계속하기
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= A-05: 장소 · 방문 빈도 질문 ================= */}
        {step === 'locations' && (
          <motion.div
            key="a05-locations"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="w-full h-full max-w-md mx-auto flex flex-col justify-between overflow-hidden"
          >
            {renderProgressHeader(2, () => setStep('nickname'))}

            <div className="flex-1 overflow-y-auto px-4 pt-6 pb-6 space-y-6">
              <div>
                <h2 className="text-[24px] font-bold text-[#202320] tracking-[-0.02em]">
                  주로 어디서 만나요?
                </h2>
                <p className="text-[13px] text-[#626961] mt-1">
                  자주 가는 곳의 생물부터 추천해 드려요
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-[#202320]">장소</span>
                  <span className="text-[12px] text-[#8c948a]">중복 선택</span>
                </div>

                <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                  {PLACE_OPTIONS.map((place) => {
                    const isSelected = selectedLocations.includes(place.id);
                    return (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() =>
                          setSelectedLocations((prev) =>
                            isSelected ? prev.filter((x) => x !== place.id) : [...prev, place.id]
                          )
                        }
                        className="flex flex-col items-center gap-1.5 cursor-pointer"
                      >
                        <div
                          className={`w-[62px] h-[62px] rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-[#f4fbdd] border-2 border-black'
                              : 'bg-[#f4f5f4] border border-transparent hover:border-[#d2d7d1]'
                          }`}
                        >
                          {renderPlaceVector(place.icon)}
                        </div>
                        <span
                          className={`text-[12px] text-center leading-tight ${
                            isSelected ? 'font-bold text-[#202320]' : 'font-normal text-[#626961]'
                          }`}
                        >
                          {place.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-[#202320]">얼마나 자주 가나요?</span>
                  <span className="text-[12px] text-[#8c948a]">단일 선택</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {FREQUENCY_OPTIONS.map((freq) => {
                    const isSelected = selectedFrequency === freq;
                    return (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setSelectedFrequency(isSelected ? '' : freq)}
                        className={`px-4 py-2.5 rounded-full text-[13px] transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-black text-white font-bold border border-black'
                            : 'bg-white text-[#202320] font-semibold border border-[#e6e9e5] shadow-2xs'
                        }`}
                      >
                        {freq}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-4 pb-6 pt-2 space-y-2.5 bg-[#fbfbfb] shrink-0">
              <button
                type="button"
                disabled={selectedLocations.length === 0 && !selectedFrequency}
                onClick={() => setStep('purposes')}
                className="w-full h-14 rounded-xl bg-black hover:bg-[#202320] disabled:bg-[#e8e8e8] disabled:text-[#a5aca4] text-white text-[15px] font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                계속하기
              </button>
              <button
                type="button"
                onClick={() => setStep('purposes')}
                className="w-full py-2 text-center text-[14px] text-[#8c948a] hover:text-[#202320] font-semibold cursor-pointer"
              >
                건너뛰기
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= A-06: 목적 질문 ================= */}
        {step === 'purposes' && (
          <motion.div
            key="a06-purposes"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="w-full h-full max-w-md mx-auto flex flex-col justify-between overflow-hidden"
          >
            {renderProgressHeader(3, () => setStep('locations'))}

            <div className="flex-1 overflow-y-auto px-4 pt-6 pb-6 space-y-5">
              <div>
                <h2 className="text-[24px] font-bold text-[#202320] tracking-[-0.02em]">
                  어떤 기록을 남기고 싶나요?
                </h2>
                <p className="text-[13px] text-[#626961] mt-1">여러 개 골라도 좋아요</p>
              </div>

              <div className="space-y-2.5">
                {PURPOSE_OPTIONS.map((opt) => {
                  const isChecked = selectedPurposes.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setSelectedPurposes((prev) =>
                          isChecked ? prev.filter((x) => x !== opt.id) : [...prev, opt.id]
                        )
                      }
                      className={`w-full px-4 py-4 rounded-[20px] bg-white text-left flex items-center justify-between transition-all cursor-pointer ${
                        isChecked ? 'border-2 border-black' : 'border border-[#e6e9e5]'
                      }`}
                    >
                      <span className="text-[15px] font-semibold text-[#202320] pr-3">
                        {opt.label}
                      </span>
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-black text-white' : 'border border-[#d2d7d1]'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-4 pb-6 pt-2 space-y-2.5 bg-[#fbfbfb] shrink-0">
              <button
                type="button"
                disabled={selectedPurposes.length === 0}
                onClick={() => setStep('persona')}
                className="w-full h-14 rounded-xl bg-black hover:bg-[#202320] disabled:bg-[#e8e8e8] disabled:text-[#a5aca4] text-white text-[15px] font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                계속하기
              </button>
              <button
                type="button"
                onClick={() => setStep('persona')}
                className="w-full py-2 text-center text-[14px] text-[#8c948a] hover:text-[#202320] font-semibold cursor-pointer"
              >
                건너뛰기
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= A-07: 탐험가 유형 (9종, 초기 미선택, 건너뛰기=만능) ================= */}
        {step === 'persona' && (
          <motion.div
            key="a07-persona"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="w-full h-full max-w-md mx-auto flex flex-col justify-between overflow-hidden"
          >
            {renderProgressHeader(4, () => setStep('purposes'))}

            <div className="px-4 pt-6 pb-3 shrink-0">
              <h2 className="text-[24px] font-bold text-[#202320] tracking-[-0.02em]">
                당신의 탐험가 유형은 무엇인가요
              </h2>
              <p className="text-[13px] text-[#626961] mt-1">리포트에서 수정 가능해요</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
              {Object.values(NATURALIST_PERSONAS).map((p) => {
                const isSelected = selectedPersona === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPersona(p.id)}
                    className={`w-full px-4 py-3.5 rounded-[20px] bg-white text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                      isSelected ? 'border-2 border-black' : 'border border-[#e6e9e5] hover:border-[#d2d7d1]'
                    }`}
                  >
                    <PersonaBadgeIcon persona={p.id} size="md" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold text-[#202320]">{p.title}</h3>
                      <p className="text-[12px] text-[#8c948a] mt-0.5 truncate">{p.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-4 pb-6 pt-2 space-y-2.5 bg-[#fbfbfb] shrink-0 border-t border-[#f4f5f4]">
              <button
                type="button"
                disabled={!selectedPersona}
                onClick={() => setStep('permissions')}
                className="w-full h-14 rounded-xl bg-black hover:bg-[#202320] disabled:bg-[#e8e8e8] disabled:text-[#a5aca4] text-white text-[15px] font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                계속하기
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPersona('general');
                  setStep('permissions');
                }}
                className="w-full py-2 text-center text-[14px] text-[#8c948a] hover:text-[#202320] font-semibold cursor-pointer"
              >
                건너뛰기
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= A-08: 권한 안내 (OS 팝업 미호출) ================= */}
        {step === 'permissions' && (
          <motion.div
            key="a08-permissions"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="w-full h-full max-w-md mx-auto flex flex-col justify-between overflow-hidden"
          >
            <div className="px-4 pt-3 pb-1 shrink-0">
              <button
                type="button"
                onClick={() => setStep('persona')}
                className="w-10 h-10 -ml-2 rounded-full text-[#202320] hover:bg-[#f4f5f4] flex items-center justify-center cursor-pointer"
                aria-label="뒤로"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6 space-y-7">
              <div>
                <h2 className="text-[26px] font-bold text-[#202320] tracking-[-0.02em] leading-[1.3]">
                  필요할 때 하나씩<br />물어볼게요
                </h2>
                <p className="text-[13px] text-[#626961] mt-2 leading-relaxed">
                  권한은 기능을 처음 쓸 때 요청해요. 거부해도 기본 기능은 쓸 수 있어요
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-[52px] h-[52px] rounded-full bg-[#f4f5f4] flex items-center justify-center shrink-0 text-[#48525d]">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-[#202320]">
                      카메라 <span className="text-[#ff5100]">(필수)</span>
                    </p>
                    <p className="text-[13px] text-[#8c948a] mt-0.5">
                      촬영하면 생물 이름을 바로 알려드려요
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-[52px] h-[52px] rounded-full bg-[#f4f5f4] flex items-center justify-center shrink-0 text-[#5fa800]">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-[#202320]">사진 (선택)</p>
                    <p className="text-[13px] text-[#8c948a] mt-0.5">
                      앨범의 사진으로도 이름을 알아낼 수 있어요
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-[52px] h-[52px] rounded-full bg-[#f4f5f4] flex items-center justify-center shrink-0 text-[#ef4452]">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-[#202320]">위치 정보 (선택)</p>
                    <p className="text-[13px] text-[#8c948a] mt-0.5">
                      관찰 장소를 기록하고 탐험맵을 보여드려요
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-[52px] h-[52px] rounded-full bg-[#f4f5f4] flex items-center justify-center shrink-0 text-[#f2b705]">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-[#202320]">알림 (선택)</p>
                    <p className="text-[13px] text-[#8c948a] mt-0.5">
                      뱃지·출석·댓글 소식을 알려드려요
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 pb-6 pt-2 bg-[#fbfbfb] shrink-0">
              <button
                type="button"
                onClick={() => setStep('complete')}
                className="w-full h-14 rounded-xl bg-black hover:bg-[#202320] text-white text-[15px] font-bold transition-colors cursor-pointer"
              >
                확인했어요
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= A-12: 시작 완료 (0 / 10칸) ================= */}
        {step === 'complete' && (
          <motion.div
            key="a12-complete"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full max-w-md mx-auto flex flex-col justify-between px-4 py-4 overflow-y-auto"
          >
            <div className="shrink-0 pt-1">
              <button
                type="button"
                onClick={() => setStep('permissions')}
                className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] shadow-2xs text-[#202320] flex items-center justify-center cursor-pointer"
                aria-label="뒤로"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="my-auto py-6 flex flex-col items-center text-center space-y-5">
              {/* Speech bubble */}
              <div className="relative bg-white px-4 py-2 rounded-2xl border border-[#e6e9e5] shadow-2xs">
                <span className="text-[14px] font-bold text-[#202320]">준비가 완료되었어요!</span>
                <span className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-[#e6e9e5] rotate-45" />
              </div>

              <PersonaBadgeIcon persona={selectedPersona || 'general'} size="lg" />

              <div className="pt-1">
                <span className="relative inline-block px-1">
                  <span
                    className="absolute left-0 right-0 bottom-0.5 h-2.5 rounded-xs"
                    style={{
                      backgroundColor:
                        selectedPersona === 'invertebrates'
                          ? '#f7cfc1'
                          : `${activePersonaProfile.accentColor}30`,
                    }}
                  />
                  <span className="relative text-[24px] font-bold text-[#202320] tracking-[-0.02em]">
                    초보 {activePersonaProfile.title}
                  </span>
                </span>
              </div>
            </div>

            <div className="space-y-4 pb-2 shrink-0">
              {/* Empty 0 / 10칸 Gauge Card */}
              <div className="bg-white rounded-[20px] border border-[#e6e9e5] p-4 space-y-3">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="font-bold text-[#202320]">무료 도감</span>
                  <span className="tabular-nums text-[#8c948a]">
                    <strong className="text-[#202320]">0</strong> / 10칸
                  </span>
                </div>
                <div className="grid grid-cols-10 gap-1.5">
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <div key={idx} className="h-1.5 rounded-full bg-[#f4f5f4]" />
                  ))}
                </div>
              </div>

              <p className="text-[13px] text-[#626961] text-center">
                10칸을 넘어 끝까지 모아 보세요
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleFinishOnboarding('lens')}
                  className="w-full h-14 rounded-xl bg-black hover:bg-[#202320] text-white text-[15px] font-bold transition-colors cursor-pointer"
                >
                  첫 생물 포착하기
                </button>
                <button
                  type="button"
                  onClick={() => handleFinishOnboarding('archive')}
                  className="w-full py-2 text-center text-[13px] font-semibold text-[#8c948a] hover:text-[#202320] cursor-pointer"
                >
                  확인
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= A-09b: 만 14세 미만 보호 안내 시트 (A-09 위에 오버레이) ================= */}
      <AnimatePresence>
        {isUnder14SheetOpen && (
          <div
            className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-end justify-center"
            onClick={() => setIsUnder14SheetOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[28px] max-w-md w-full p-6 shadow-2xl space-y-5 pb-8 border-t border-[#e6e9e5]"
            >
              <div className="w-9 h-1 rounded-full bg-[#d2d7d1] mx-auto -mt-2" />
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="text-[20px] font-bold text-[#202320]">만 14세 미만 이용 안내</h3>
                  <p className="text-[13px] text-[#626961]">
                    안전한 탐험을 위해 일부 커뮤니티 기능이 제한돼요
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUnder14SheetOpen(false)}
                  className="w-9 h-9 rounded-full bg-[#f4f5f4] text-[#626961] flex items-center justify-center shrink-0 cursor-pointer"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-[20px] bg-[#f4f5f4] space-y-2.5 text-[13px]">
                <div className="flex items-center gap-2 text-[#202320] font-semibold">
                  <Check className="w-4 h-4 text-[#6d8911] shrink-0" />
                  <span>그대로 이용: 도감 · 뱃지 · 리포트 · 기기 저장</span>
                </div>
                <div className="flex items-center gap-2 text-[#8c948a]">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>14세부터 이용: 메모 쓰기 · 프로필 공개 · 랭킹 노출</span>
                </div>
              </div>

              <p className="text-[12px] text-[#626961] leading-relaxed">
                계정을 만든 뒤 보호자 이메일로 동의를 받으면 바로 시작할 수 있어요.
              </p>

              <button
                type="button"
                onClick={handleConfirmUnder14Notice}
                className="w-full h-14 rounded-xl bg-black hover:bg-[#202320] text-white text-[15px] font-bold cursor-pointer"
              >
                확인하고 시작하기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= A-03 / A-03s / A-03b / A-03c / A-03d / A-03e Auth Sheet ================= */}
      <AnimatePresence>
        {authSheetMode && (
          <div
            className="fixed inset-0 z-70 bg-black/55 backdrop-blur-xs flex items-end justify-center"
            onClick={() => {
              if (authSheetMode !== 'loading') setAuthSheetMode(null);
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[28px] max-w-md w-full p-6 shadow-2xl space-y-5 pb-8 border-t border-[#e6e9e5]"
            >
              <div className="w-9 h-1 rounded-full bg-[#d2d7d1] mx-auto -mt-2" />

              {(authSheetMode === 'login' || authSheetMode === 'signup_select') && (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h4 className="text-[20px] font-bold text-[#202320]">
                        {authSheetMode === 'login'
                          ? '다시 만나서 반가워요'
                          : '어떤 계정으로 시작할까요?'}
                      </h4>
                      <p className="text-[13px] text-[#626961]">
                        {authSheetMode === 'login'
                          ? '가입했던 계정으로 로그인해 주세요'
                          : '계정을 연결하면 도감과 기록이 안전하게 보관돼요'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAuthSheetMode(null)}
                      className="w-9 h-9 rounded-full bg-[#f4f5f4] text-[#626961] hover:text-[#202320] flex items-center justify-center shrink-0 cursor-pointer"
                      aria-label="닫기"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSelectAuthProvider('google', authSheetMode)}
                      className="w-full h-14 px-4 rounded-xl border border-[#e6e9e5] bg-white hover:bg-[#f4f5f4] text-[#202320] text-[15px] font-bold flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                      onClick={() => handleSelectAuthProvider('apple', authSheetMode)}
                      className="w-full h-14 px-4 rounded-xl bg-black hover:bg-[#202320] text-white text-[15px] font-bold flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span className="text-base leading-none"></span>
                      <span>Apple로 계속하기</span>
                    </button>
                  </div>

                  <p className="text-[12px] text-[#8c948a] text-center">
                    {authSheetMode === 'login'
                      ? '로그인하면 내 도감과 모든 기록을 바로 불러와요'
                      : '선택한 계정으로 보호자 확인 및 도감 저장을 진행해요'}
                  </p>
                </>
              )}

              {authSheetMode === 'loading' && (
                <div className="py-10 flex flex-col items-center text-center space-y-3">
                  <div className="w-10 h-10 rounded-full border-3 border-black border-t-transparent animate-spin" />
                  <p className="text-[18px] font-bold text-[#202320]">{authLoadingText}</p>
                  <p className="text-[13px] text-[#8c948a]">잠시만 기다려 주세요</p>
                </div>
              )}

              {authSheetMode === 'error' && (
                <div className="py-4 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#fff1eb] text-[#ff5100] flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[18px] font-bold text-[#202320]">로그인하지 못했어요</h4>
                    <p className="text-[13px] text-[#626961]">다시 시도해 주세요</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthSheetMode('login')}
                    className="w-full h-13 rounded-xl bg-black text-white text-[14px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>다시 시도</span>
                  </button>
                </div>
              )}

              {authSheetMode === 'already_registered' && (
                <div className="py-4 text-center space-y-4">
                  <h4 className="text-[18px] font-bold text-[#202320]">이미 가입한 계정이에요</h4>
                  <p className="text-[13px] text-[#626961]">
                    기존 도감과 기록으로 바로 들어갈까요?
                  </p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAuthProvider(lastTriedProvider, 'login')}
                      className="w-full h-13 rounded-xl bg-black text-white text-[14px] font-bold cursor-pointer"
                    >
                      기존 계정으로 로그인
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthSheetMode('signup_select')}
                      className="w-full py-2 text-[13px] text-[#8c948a] font-semibold cursor-pointer"
                    >
                      다른 계정 고르기
                    </button>
                  </div>
                </div>
              )}

              {authSheetMode === 'expired' && (
                <div className="py-4 text-center space-y-4">
                  <h4 className="text-[18px] font-bold text-[#202320]">로그인이 만료되었어요</h4>
                  <p className="text-[13px] text-[#626961]">보안을 위해 다시 로그인해 주세요</p>
                  <button
                    type="button"
                    onClick={() => setAuthSheetMode('login')}
                    className="w-full h-13 rounded-xl bg-black text-white text-[14px] font-bold cursor-pointer"
                  >
                    다시 로그인하기
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= A-10 & A-11: 약관 / 개인정보 전문 모달 ================= */}
      <AnimatePresence>
        {legalModal && (
          <div
            className="fixed inset-0 z-80 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setLegalModal(null)}
          >
            <motion.div
              initial={{ y: 32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 32, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-[28px] sm:rounded-[28px] max-w-md w-full max-h-[82vh] flex flex-col overflow-hidden border border-[#e6e9e5]"
            >
              <div className="px-5 py-4 border-b border-[#e6e9e5] flex items-center justify-between shrink-0">
                <h3 className="text-[17px] font-bold text-[#202320]">
                  {legalModal === 'terms' ? '회원 이용약관' : '개인정보 수집 및 이용 동의'}
                </h3>
                <button
                  type="button"
                  onClick={() => setLegalModal(null)}
                  className="w-9 h-9 rounded-full bg-[#f4f5f4] text-[#626961] flex items-center justify-center cursor-pointer"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-[13px] text-[#555c54] leading-relaxed">
                {legalModal === 'terms' ? (
                  <>
                    <p className="font-bold text-[#202320]">제1조 (목적)</p>
                    <p>
                      본 약관은 모아로그(Moalog)가 제공하는 야생 생물 촬영 식별, 개인 도감 저장, 생태 리포트 및 탐험맵 서비스의 이용 조건과 절차를 규정합니다.
                    </p>
                    <p className="font-bold text-[#202320]">제2조 (안전한 생태 관찰)</p>
                    <p>
                      회원은 관찰 및 촬영 시 야생 생물의 서식지를 훼손하지 않으며, 법정보호종 및 멸종위기종의 상세 위치 노출 제한 정책을 준수합니다.
                    </p>
                    <p className="font-bold text-[#202320]">제3조 (만 14세 미만 회원 보호)</p>
                    <p>
                      만 14세 미만 회원은 법정대리인 동의를 거쳐 가입하며, 공개 메모 작성·프로필 공개·랭킹 노출 기능이 자동으로 비활성화됩니다.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-[#202320]">1. 수집하는 개인정보 항목</p>
                    <p>
                      소셜 로그인 식별자, 이메일, 닉네임, 탐험가 유형, 연령 확인 정보(만 14세 이상/미만) 및 만 14세 미만의 경우 법정대리인 성명과 이메일을 수집합니다.
                    </p>
                    <p className="font-bold text-[#202320]">2. 수집 및 이용 목적</p>
                    <p>
                      회원 식별 및 도감 데이터 동기화, 만 14세 미만 법정대리인 동의 확인, 기기 변경 시 기록 복원에 사용합니다.
                    </p>
                    <p className="font-bold text-[#202320]">3. 사진 메타데이터 보호</p>
                    <p>
                      커뮤니티 공개 시 업로드 이미지의 EXIF GPS 좌표 등 민감 메타데이터는 자동 제거되어 안전하게 처리됩니다.
                    </p>
                  </>
                )}
              </div>

              <div className="px-5 py-4 border-t border-[#e6e9e5] shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (legalModal === 'terms') setAgreeTerms(true);
                    else setAgreePrivacy(true);
                    setLegalModal(null);
                  }}
                  className="w-full h-13 rounded-xl bg-black text-white text-[14px] font-bold cursor-pointer"
                >
                  동의하고 닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
