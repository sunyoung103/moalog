import { KINGFISHER_PHOTO } from '../data/specimenImages';
import React, { useState, useEffect } from 'react';
import { X, Check, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { UserStats } from '../types';

// 구독 시작 시각 기준 예상 다음 결제일(YYYY.MM.DD). 지난 주기는 건너뛰고 오늘 이후 첫 날짜를 씀. 정보가 없으면 null
const formatNextBillingDate = (planType: UserStats['planType'], subscribedAt?: string): string | null => {
  const monthsPerCycle = planType === 'monthly' ? 1 : planType === 'yearly' ? 12 : 0;
  if (!monthsPerCycle || !subscribedAt) return null;
  const start = new Date(subscribedAt);
  if (Number.isNaN(start.getTime())) return null;

  let next = new Date(start);
  for (let n = 1; ; n++) {
    next = new Date(start);
    next.setMonth(start.getMonth() + monthsPerCycle * n);
    if (next.getTime() > Date.now()) break;
  }
  const yyyy = next.getFullYear();
  const mm = String(next.getMonth() + 1).padStart(2, '0');
  const dd = String(next.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
};

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: UserStats;
  collectedCount: number; // 현재 수집(비대기) 개수. 무료 칸 사용량 표시에 사용
  freeSlotLimit?: number;
  onSubscribe: (planType: 'monthly' | 'yearly' | 'lifetime' | 'free') => void;
  onShowToast: (msg: string) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  userStats,
  collectedCount = 0,
  freeSlotLimit = 10,
  onSubscribe,
  onShowToast,
}) => {
  // Navigation steps matching FLOW P-1:
  // 'compare' (STEP 1) | 'select' (STEP 2/3) | 'success' (STEP 4) | 'manage' (STEP 5)
  const [currentStep, setCurrentStep] = useState<'compare' | 'select' | 'success' | 'manage'>(() => {
    return userStats.isProUser ? 'manage' : 'compare';
  });

  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly' | 'lifetime'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // 열 때마다 현재 이용권 상태에 맞는 단계로 초기화 (해지·재구독 후 이전 단계가 남는 문제 방지)
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(userStats.isProUser ? 'manage' : 'compare');
      setIsCancelModalOpen(false);
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 월·연 구독 중이면 같은 주기 중복 결제를 막음. 영구 이용권 전환은 허용
  const isSubscribing = userStats.isProUser && (userStats.planType === 'monthly' || userStats.planType === 'yearly');
  const isDuplicateBlocked = isSubscribing && selectedPlan !== 'lifetime';
  const nextBillingDate = formatNextBillingDate(userStats.planType, userStats.subscribedAt);
  const nextBillingText = nextBillingDate ? `다음 결제일 ${nextBillingDate}` : '결제일은 스토어에서 확인';
  const currentPlanLabel =
    userStats.planType === 'monthly'
      ? '월간 구독'
      : userStats.planType === 'yearly'
      ? '연간 구독'
      : userStats.planType === 'lifetime'
      ? '영구 이용권'
      : '무료';

  const handleCheckout = () => {
    if (isDuplicateBlocked) {
      onShowToast('이미 구독 중이에요. 구독 변경은 스토어에서 관리해요.');
      return;
    }
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep('success');
      onSubscribe(selectedPlan);

      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
      });

      onShowToast(
        selectedPlan === 'yearly'
          ? '🎉 연간 정기 구독(29,000원)이 정상 활성화되었습니다! 도감 칸 제한이 해제되었습니다.'
          : selectedPlan === 'lifetime'
          ? '🎉 영구 이용권(58,000원)이 정상 적용되었습니다! 평생 무제한 도감을 이용하세요.'
          : '🎉 월간 정기 구독(3,300원)이 정상 활성화되었습니다!'
      );
    }, 700);
  };

  return (
    <div
      id="subscription-paywall-modal"
      className="fixed inset-0 z-60 bg-stone-950/75 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 select-none font-geist"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F5F5F7] rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-y-auto relative border border-stone-200/80"
      >
        {/* Mobile pull bar */}
        <div className="w-12 h-1.5 rounded-full bg-stone-300 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* ==============================================================
            FLOW P-1 STEP 5: 이용권 관리 (ACTIVE PRO MEMBER)
            ============================================================== */}
        {currentStep === 'manage' && (
          <div className="flex-1 flex flex-col justify-between p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-full text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-base font-black text-stone-950">이용권 관리</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto py-1">
              {/* Current Active Plan Card */}
              <div className="bg-stone-950 text-white rounded-3xl p-5 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#d4ee38] text-stone-950 text-[10px] font-black">
                    이용 중
                  </span>
                  <span className="text-[11px] font-mono text-stone-400">
                    {userStats.planType === 'lifetime'
                      ? '평생 소장 무제한 이용'
                      : nextBillingText}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-black text-white">
                    {userStats.planType === 'lifetime'
                      ? '영구 이용권 (평생 소장)'
                      : userStats.planType === 'monthly'
                      ? '월간 구독 (이용 중)'
                      : '연간 구독 (이용 중)'}
                  </h4>
                  <p className="text-xs text-stone-400 font-mono mt-0.5">
                    {userStats.planType === 'lifetime'
                      ? '58,000원 · 1회 결제로 평생 무제한'
                      : userStats.planType === 'monthly'
                      ? '3,300원 / 월'
                      : '29,000원 / 년'}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
                  <span className="text-stone-300">내 도감</span>
                  <span className="font-bold text-[#d4ee38] font-mono">무제한 칸 활성화됨</span>
                </div>
              </div>

              {/* Benefits Checklist */}
              <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs space-y-3">
                <h4 className="text-xs font-black text-stone-900">혜택</h4>
                <div className="space-y-2.5 text-xs text-stone-700">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span className="font-semibold">도감 칸 무제한</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span className="font-semibold">모든 생물 포착 점수 · 백과</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span className="font-semibold">원본 · Live 포토 저장</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span className="font-semibold">모은 도감 평생 안전 유지</span>
                  </div>
                </div>
              </div>

              {/* Action Rows */}
              <div className="space-y-2">
                {/* Switch to lifetime (only shown for subscription users) */}
                {userStats.planType !== 'lifetime' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlan('lifetime');
                      setCurrentStep('select');
                    }}
                    className="w-full p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs flex items-center justify-between text-left hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-black text-stone-900 block">
                        영구 이용권으로 바꾸기
                      </span>
                      <span className="text-[11px] text-stone-500 mt-0.5 block">
                        58,000원 · 1번 결제로 평생 정기 결제 없이 소장
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
                  </button>
                )}

                {/* Restore purchase */}
                <button
                  type="button"
                  onClick={() => onShowToast('구매 복원은 준비 중이에요.')}
                  className="w-full p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-2xs text-left text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>구매 복원</span>
                  <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {/* 결제는 스토어가 관리합니다. 앱에서 직접 해지하지 않고 안내만 합니다. */}
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="w-full p-3 text-center text-[11px] text-stone-400 hover:text-stone-700 font-bold transition-colors cursor-pointer"
                >
                  {userStats.planType === 'lifetime' ? '영구 이용권 · 결제 정보 보기' : '구독 관리 (스토어에서 해지)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            FLOW P-1 STEP 1: 요금제 · 비교 (PLAN COMPARE)
            ============================================================== */}
        {currentStep === 'compare' && (
          <div className="flex-1 flex flex-col justify-between p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
              <span
                className={`px-3 py-1 text-[10px] font-bold rounded-full ${
                  collectedCount >= freeSlotLimit
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                무료 도감 {Math.min(collectedCount, freeSlotLimit)} / {freeSlotLimit}칸 사용 중
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-auto py-2 flex-1 overflow-y-auto">
              {/* Single Hero Card - Updated as per request */}
              <div className="flex items-center justify-center py-2">
                <div className="w-48 h-64 rounded-3xl overflow-hidden border-2 border-amber-400 shadow-2xl bg-white p-1.5">
                  <img
                    src={KINGFISHER_PHOTO}
                    alt="Kingfisher"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-xl font-black text-stone-950">
                  도감 칸 제한을 풀어보세요
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  평생 무료로 소장하는 프리미엄 도감
                </p>
              </div>

              {/* Comparison Table */}
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-stone-200/80 text-xs">
                <div className="grid grid-cols-3 pb-2.5 border-b border-stone-100 font-bold text-stone-400 text-[11px]">
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
                    <span className="font-semibold text-stone-700">포착 점수</span>
                    <span className="text-center text-stone-500">10칸까지</span>
                    <span className="text-right font-black text-emerald-600">모든 생물</span>
                  </div>

                  <div className="grid grid-cols-3 py-2.5 items-center">
                    <span className="font-semibold text-stone-700">사진 저장</span>
                    <span className="text-center text-stone-500">압축본</span>
                    <span className="text-right font-black text-emerald-600">원본 + Live</span>
                  </div>

                  <div className="grid grid-cols-3 py-2.5 items-center">
                    <span className="font-semibold text-stone-700">뱃지 · 리포트</span>
                    <span className="text-center text-stone-500">✓</span>
                    <span className="text-right font-black text-emerald-600">✓</span>
                  </div>

                  <div className="grid grid-cols-3 py-2.5 items-center">
                    <span className="font-semibold text-stone-700">구독이 끝나면</span>
                    <span className="text-center text-stone-500">칸 제한 적용</span>
                    <span className="text-right font-black text-emerald-600">모은 도감 그대로</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="shrink-0 pt-3 pb-6 sticky bottom-0 z-20 bg-[#F5F5F7]/95 backdrop-blur-xs">
              <button
                type="button"
                id="btn-sub-compare-next"
                onClick={() => {
                  setSelectedPlan('yearly');
                  setCurrentStep('select');
                }}
                className="w-full py-4 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl text-sm font-black transition-all active:scale-98 shadow-md cursor-pointer block text-center"
              >
                요금제 고르기
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-stone-400 hover:text-stone-700 font-bold text-xs cursor-pointer text-center"
              >
                10칸으로 먼저 써 볼게요
              </button>
            </div>
          </div>
        )}

        {/* ==============================================================
            FLOW P-1 STEP 2 & 3: 플랜 선택 (PLAN SELECT)
            ============================================================== */}
        {currentStep === 'select' && (
          <div className="flex-1 flex flex-col justify-between p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setCurrentStep('compare')}
                className="p-1 rounded-full text-stone-500 hover:text-stone-900 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-auto py-2 flex-1 overflow-y-auto">
              {/* 현재 플랜 표시 */}
              <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-2xs flex items-center justify-between text-xs">
                <span className="font-bold text-stone-700">현재 플랜</span>
                <span className="font-black text-stone-950 text-right">
                  {currentPlanLabel}
                  {isSubscribing && (
                    <span className="block text-[10px] font-mono text-stone-500 mt-0.5">{nextBillingText}</span>
                  )}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-stone-950 tracking-tight">요금제를 골라 주세요</h3>
                <p className="text-xs text-stone-500 mt-1">어떤 걸 골라도 지금부터 칸 제한이 사라져요</p>
              </div>

              {/* 3 Tier Plans */}
              <div className="space-y-2.5">
                {/* 1. Yearly */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('yearly')}
                  className={`w-full p-4 rounded-3xl border text-left transition-all relative cursor-pointer ${
                    selectedPlan === 'yearly'
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
                  onClick={() => setSelectedPlan('monthly')}
                  className={`w-full p-4 rounded-3xl border text-left transition-all cursor-pointer ${
                    selectedPlan === 'monthly'
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

                {/* 3. Lifetime (STEP 3) */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('lifetime')}
                  className={`w-full p-4 rounded-3xl border text-left transition-all cursor-pointer ${
                    selectedPlan === 'lifetime'
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

              {/* Informative Guidance */}
              <div className="bg-stone-100 rounded-2xl p-3 text-[11px] text-stone-600 space-y-1">
                <p className="font-bold text-stone-800">이용권 안내</p>
                <p>• 해지해도 구독 중에 모은 도감은 평생 남아요.</p>
                <p>• 구독이 끝나면 새 생물 등록은 무료 기준(10칸)으로 돌아가요.</p>
              </div>
            </div>

            {/* Bottom Button Bar */}
            <div className="shrink-0 pt-3 pb-6 sticky bottom-0 z-20 bg-[#F5F5F7]/95 backdrop-blur-xs space-y-2">
              <button
                type="button"
                id="btn-sub-checkout"
                disabled={isProcessing || isDuplicateBlocked}
                onClick={handleCheckout}
                className="w-full py-4 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl text-sm font-black transition-all active:scale-98 shadow-md cursor-pointer block text-center disabled:opacity-50"
              >
                {isProcessing
                  ? '처리 중...'
                  : isDuplicateBlocked
                  ? '이미 구독 중이에요'
                  : selectedPlan === 'yearly'
                  ? '연간 29,000원으로 시작하기'
                  : selectedPlan === 'monthly'
                  ? '월 3,300원으로 시작하기'
                  : '58,000원으로 평생 이용하기'}
              </button>

              <button
                type="button"
                id="btn-sub-skip"
                onClick={onClose}
                className="w-full py-1 text-center text-xs text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
              >
                10칸으로 먼저 써 볼게요 (구매 복원 · 이용약관)
              </button>
            </div>
          </div>
        )}

        {/* ==============================================================
            FLOW P-1 STEP 4: 결제 완료 (PAYMENT COMPLETE)
            ============================================================== */}
        {currentStep === 'success' && (
          <div className="flex-1 flex flex-col justify-between p-6 space-y-6 text-center">
            <div className="pt-2 shrink-0" />

            <div className="my-auto py-2 space-y-5">
              {/* Card visual */}
              <div className="bg-white rounded-3xl p-4 shadow-xl border-2 border-amber-400 max-w-xs mx-auto text-center space-y-3">
                <div className="relative aspect-4/5 rounded-2xl overflow-hidden bg-stone-900">
                  <img
                    src={KINGFISHER_PHOTO}
                    alt="물총새"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-stone-950/80 backdrop-blur-xs text-[#d4ee38] text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>원본 · Live</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-black text-stone-950">물총새</h4>
                  <p className="text-[10px] font-mono text-stone-400">NO.001</p>
                </div>
              </div>

              <div className="space-y-1.5 px-4">
                <h3 className="text-2xl font-black text-stone-950 tracking-tight">
                  이제 도감 칸 제한이 없어요
                </h3>
                <p className="text-sm text-stone-600 font-bold">
                  평생 무료 소장 혜택이 활성화되었습니다
                </p>
                <p className="text-[11px] text-stone-500 leading-relaxed mt-2">
                  지금부터 촬영하는 모든 생물은 원본 · Live 포토로 저장되고<br />
                  도감 칸 제한 없이 영구적으로 소장할 수 있습니다.
                </p>
                <div className="pt-4">
                  <span className="inline-block px-4 py-1.5 bg-stone-950 text-[#d4ee38] rounded-full text-xs font-black shadow-lg">
                    ✦ {selectedPlan === 'lifetime' ? '평생 무제한 이용권 적용됨' : selectedPlan === 'monthly' ? '월간 정기 구독 활성화됨' : '연간 정기 구독 활성화됨'}
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0 pt-3 pb-6 sticky bottom-0 z-20 bg-[#F5F5F7]/95 backdrop-blur-xs">
              <button
                type="button"
                id="btn-sub-done-close"
                onClick={onClose}
                className="w-full py-4 bg-stone-950 hover:bg-stone-900 text-white rounded-2xl text-sm font-black transition-all active:scale-98 shadow-md cursor-pointer block text-center"
              >
                도감 보러 가기
              </button>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {isCancelModalOpen && (
          <div className="absolute inset-0 z-70 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl">
              <h4 className="text-base font-black text-stone-900">구독은 스토어에서 관리해요</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                결제는 Google Play 또는 App Store에서 관리되어, 해지도 그곳에서 하셔야 정확히 반영돼요.
                해지해도 지금까지 모은 도감은 그대로 남아요.
              </p>
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCancelModalOpen(false);
                    onShowToast('스토어의 구독 관리 화면에서 해지할 수 있어요.');
                  }}
                  className="w-full py-3 bg-stone-950 text-white font-bold text-xs rounded-2xl hover:bg-stone-900 transition-colors cursor-pointer"
                >
                  스토어 구독 관리 열기
                </button>
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="w-full py-3 bg-stone-100 text-stone-700 font-bold text-xs rounded-2xl hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
