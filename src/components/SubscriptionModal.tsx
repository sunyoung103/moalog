import React, { useState } from 'react';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { UserStats, UserAccount } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: UserStats;
  userAccount?: UserAccount;
  onSubscribe: (planType: 'monthly' | 'yearly' | 'lifetime' | 'free') => void;
  onShowToast: (msg: string) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  userStats,
  userAccount,
  onSubscribe,
  onShowToast,
}) => {
  const isSubscribed = Boolean(userStats.isProUser && userAccount?.isLoggedIn);
  const [currentStep, setCurrentStep] = useState<'compare' | 'select' | 'success' | 'manage'>(() => {
    return isSubscribed ? 'manage' : 'select';
  });

  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly' | 'lifetime'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  if (!isOpen) return null;

  const collectedFreeCount = Math.min(10, Math.max(0, 10 - (userStats.freeScans ?? 10)));

  const handleCheckout = () => {
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
          ? '연간 정기 구독(29,000원)이 활성화되었어요!'
          : selectedPlan === 'lifetime'
          ? '영구 이용권(58,000원)이 적용되었어요!'
          : '월간 정기 구독(3,300원)이 활성화되었어요!'
      );
    }, 600);
  };

  return (
    <div
      id="subscription-paywall-modal"
      className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#fbfbfb] rounded-t-[28px] sm:rounded-[28px] max-w-md w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden relative border border-[#e6e9e5]"
      >
        {/* Mobile sheet handle */}
        <div className="w-9 h-1 rounded-full bg-[#d2d7d1] mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* ==============================================================
            이용권 관리 (ACTIVE PRO MEMBER)
            ============================================================== */}
        {currentStep === 'manage' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                aria-label="뒤로"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-[16px] font-bold text-[#202320]">이용권 관리</h3>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-3 space-y-4 flex-1 overflow-y-auto scrollbar-none">
              <div className={`rounded-[20px] p-5 border space-y-3 ${isSubscribed ? 'bg-black text-white border-black' : 'bg-white text-[#202320] border-[#e6e9e5]'}`}>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isSubscribed ? 'bg-[#c4eb43] text-[#202320]' : 'bg-[#f4f5f4] text-[#555c54]'}`}>
                    {isSubscribed ? '이용 중' : '무료'}
                  </span>
                  <span className={`text-[12px] tabular-nums ${isSubscribed ? 'text-white/70' : 'text-[#8c948a]'}`}>
                    {isSubscribed
                      ? (userStats.planType === 'lifetime'
                        ? '평생 무제한 이용'
                        : userStats.planType === 'monthly'
                        ? '다음 결제일 2026.11.27'
                        : '다음 결제일 2027.10.25')
                      : '기본 도감 이용'}
                  </span>
                </div>

                <div>
                  <h4 className="text-[18px] font-bold">
                    {isSubscribed
                      ? (userStats.planType === 'lifetime'
                        ? '영구 이용권 (평생 소장)'
                        : userStats.planType === 'monthly'
                        ? '월간 구독'
                        : '연간 구독')
                      : '무료 도감 이용 중'}
                  </h4>
                  <p className={`text-[13px] mt-0.5 tabular-nums ${isSubscribed ? 'text-white/70' : 'text-[#555c54]'}`}>
                    {isSubscribed
                      ? (userStats.planType === 'lifetime'
                        ? '58,000원 · 1회 결제로 평생 무제한'
                        : userStats.planType === 'monthly'
                        ? '3,300원 / 월'
                        : '29,000원 / 년')
                      : '기본 기능 이용 가능 (10칸 제한)'}
                  </p>
                </div>

                <div className={`pt-3 border-t flex items-center justify-between text-[13px] ${isSubscribed ? 'border-white/15' : 'border-[#e6e9e5]'}`}>
                  <span className={isSubscribed ? 'text-white/75' : 'text-[#555c54]'}>내 도감</span>
                  <span className={`font-bold tabular-nums ${isSubscribed ? 'text-[#c4eb43]' : 'text-[#202320]'}`}>
                    {isSubscribed ? '무제한 칸 활성화됨' : '10칸 제한'}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-[20px] p-5 border border-[#e6e9e5] space-y-3">
                <h4 className="text-[14px] font-bold text-[#202320]">포함된 혜택</h4>
                <div className="space-y-2.5 text-[13px] text-[#555c54]">
                  {['도감 칸 무제한', '모든 생물 포착 점수 · 백과', '원본 · Live 포토 저장', '모은 도감 평생 안전 유지'].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#c4eb43] shrink-0" />
                      <span className="font-semibold text-[#202320]">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {userStats.planType !== 'lifetime' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlan('lifetime');
                      setCurrentStep('select');
                    }}
                    className="w-full p-4 rounded-[20px] bg-white border border-[#e6e9e5] flex items-center justify-between text-left hover:bg-[#f4f5f4] transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-[14px] font-bold text-[#202320] block">영구 이용권으로 바꾸기</span>
                      <span className="text-[12px] text-[#8c948a] mt-0.5 block">58,000원 · 한 번 결제로 평생 이용</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8c948a] shrink-0" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onShowToast('구매 내역을 확인하고 복원했습니다.')}
                  className="w-full p-4 rounded-[20px] bg-white border border-[#e6e9e5] text-left text-[13px] font-bold text-[#202320] hover:bg-[#f4f5f4] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>구매 복원</span>
                  <RotateCcw className="w-4 h-4 text-[#8c948a]" />
                </button>

                {userStats.planType !== 'lifetime' && (
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="w-full py-3 text-center text-[12px] text-[#8c948a] hover:text-[#ff5100] font-semibold transition-colors cursor-pointer"
                  >
                    구독 해지
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            G-01: 요금제 선택 (MAIN PAYWALL MATCHING G-01_요금제.png)
            ============================================================== */}
        {(currentStep === 'select' || currentStep === 'compare') && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Top Bar */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer shadow-2xs"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="text-[15px] font-bold text-[#202320]">이용권</span>
              <div className="w-10" />
            </div>

            <div className="px-4 pt-2 pb-4 space-y-5 flex-1 overflow-y-auto scrollbar-none">
              {/* Hero Title with Lime Marker Highlight */}
              <div className="space-y-2">
                <h2 className="text-[28px] font-bold text-[#202320] leading-[1.28] tracking-tight">
                  10칸을 넘어,
                  <br />
                  <span className="inline-block px-1.5 py-0.5 rounded-md bg-[#c4eb43]/55 text-[#202320]">
                    끝까지
                  </span>{' '}
                  모아 보세요
                </h2>
                <p className="text-[13px] text-[#8c948a]">
                  지금 {collectedFreeCount}칸을 모았어요. 칸 제한 없이 계속 모을 수 있어요.
                </p>
              </div>

              {/* Benefit Bullets with Lime Dots */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] font-semibold text-[#202320]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#c4eb43] shrink-0" />
                  <span>도감 칸 무제한</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#c4eb43] shrink-0" />
                  <span>척척박사 하루 30개</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <span className="w-2 h-2 rounded-full bg-[#c4eb43] shrink-0" />
                  <span>원본 사진 + Live</span>
                </div>
              </div>

              {/* 3 Radio Plan Cards matching G-01 */}
              <div className="space-y-2.5">
                {/* 1. Yearly */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('yearly')}
                  className={`w-full p-4 rounded-[20px] text-left flex items-center justify-between gap-3 transition-all cursor-pointer bg-white ${
                    selectedPlan === 'yearly'
                      ? 'border-2 border-black'
                      : 'border border-[#e6e9e5] hover:border-[#d2d7d1]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full shrink-0 ${
                        selectedPlan === 'yearly'
                          ? 'border-[6px] border-black bg-white'
                          : 'border-2 border-[#d2d7d1] bg-white'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-[#202320]">연간 구독</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#c4eb43] text-[#202320] text-[11px] font-bold whitespace-nowrap">
                          27% 할인
                        </span>
                      </div>
                      <p className="text-[12px] text-[#8c948a] mt-0.5 tabular-nums">월 2,417원꼴</p>
                    </div>
                  </div>
                  <span className="text-[15px] font-bold text-[#202320] whitespace-nowrap tabular-nums shrink-0">
                    29,000원 / 년
                  </span>
                </button>

                {/* 2. Monthly */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('monthly')}
                  className={`w-full p-4 rounded-[20px] text-left flex items-center justify-between gap-3 transition-all cursor-pointer bg-white ${
                    selectedPlan === 'monthly'
                      ? 'border-2 border-black'
                      : 'border border-[#e6e9e5] hover:border-[#d2d7d1]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full shrink-0 ${
                        selectedPlan === 'monthly'
                          ? 'border-[6px] border-black bg-white'
                          : 'border-2 border-[#d2d7d1] bg-white'
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="text-[15px] font-bold text-[#202320] block">월 구독</span>
                      <p className="text-[12px] text-[#8c948a] mt-0.5">언제든 해지할 수 있어요</p>
                    </div>
                  </div>
                  <span className="text-[15px] font-bold text-[#202320] whitespace-nowrap tabular-nums shrink-0">
                    3,300원 / 월
                  </span>
                </button>

                {/* 3. Lifetime */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('lifetime')}
                  className={`w-full p-4 rounded-[20px] text-left flex items-center justify-between gap-3 transition-all cursor-pointer bg-white ${
                    selectedPlan === 'lifetime'
                      ? 'border-2 border-black'
                      : 'border border-[#e6e9e5] hover:border-[#d2d7d1]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full shrink-0 ${
                        selectedPlan === 'lifetime'
                          ? 'border-[6px] border-black bg-white'
                          : 'border-2 border-[#d2d7d1] bg-white'
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="text-[15px] font-bold text-[#202320] block">영구 이용권</span>
                      <p className="text-[12px] text-[#8c948a] mt-0.5">출시 기념 한정 · 한 번 결제로 평생</p>
                    </div>
                  </div>
                  <span className="text-[15px] font-bold text-[#202320] whitespace-nowrap tabular-nums shrink-0">
                    58,000원
                  </span>
                </button>
              </div>
            </div>

            {/* Bottom Fixed CTA + Legal Caption */}
            <div className="px-4 pt-3 pb-5 bg-white border-t border-[#e6e9e5] space-y-3 shrink-0">
              <button
                type="button"
                id="btn-sub-checkout"
                disabled={isProcessing}
                onClick={handleCheckout}
                className="w-full h-14 bg-black hover:bg-[#202320] disabled:bg-[#e8e8e8] disabled:text-[#a5aca4] text-white rounded-xl text-[15px] font-bold transition-colors cursor-pointer flex items-center justify-center"
              >
                {isProcessing
                  ? '처리 중...'
                  : selectedPlan === 'lifetime'
                  ? '영구 이용권 구매하기'
                  : '구독 시작하기'}
              </button>

              <p className="text-[11px] text-[#8c948a] leading-relaxed text-left">
                구독은 자동으로 갱신돼요 · 스토어에서 언제든 해지 ·{' '}
                <button
                  type="button"
                  onClick={() => onShowToast('구매 내역을 확인했습니다.')}
                  className="underline hover:text-[#202320] cursor-pointer"
                >
                  구매 복원
                </button>{' '}
                · 이용약관
              </p>
            </div>
          </div>
        )}

        {/* ==============================================================
            결제 완료 (PAYMENT COMPLETE)
            ============================================================== */}
        {currentStep === 'success' && (
          <div className="flex-1 flex flex-col justify-between p-5 text-center overflow-y-auto">
            <div className="pt-2 shrink-0" />

            <div className="my-auto py-4 space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#f4fbdd] border border-[#c4eb43] text-[#6d8911] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5 px-2">
                <h3 className="text-[22px] font-bold text-[#202320] tracking-tight">
                  이제 도감 칸 제한이 없어요
                </h3>
                <p className="text-[13px] text-[#555c54] leading-relaxed">
                  지금부터 촬영하는 모든 생물은 원본 · Live 포토로 저장되고
                  <br />
                  도감 칸 제한 없이 영구적으로 소장할 수 있습니다.
                </p>
                <div className="pt-3">
                  <span className="inline-block px-3.5 py-1.5 bg-[#f4fbdd] border border-[#c4eb43] text-[#6d8911] rounded-full text-[12px] font-bold">
                    {selectedPlan === 'lifetime'
                      ? '영구 이용권 적용됨'
                      : selectedPlan === 'monthly'
                      ? '월간 구독 활성화됨'
                      : '연간 구독 활성화됨'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 pb-2 shrink-0">
              <button
                type="button"
                id="btn-sub-done-close"
                onClick={onClose}
                className="w-full h-14 bg-black hover:bg-[#202320] text-white rounded-xl text-[15px] font-bold transition-colors cursor-pointer"
              >
                도감 보러 가기
              </button>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {isCancelModalOpen && (
          <div className="absolute inset-0 z-70 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] p-6 max-w-xs w-full text-center space-y-4 border border-[#e6e9e5] shadow-2xl">
              <h4 className="text-[16px] font-bold text-[#202320]">정말 구독을 해지하시겠어요?</h4>
              <p className="text-[13px] text-[#555c54] leading-relaxed">
                구독을 해지하시면 무료 회원(10칸 제한)으로 전환됩니다. 이미 모은 도감은 평생 보존돼요.
              </p>
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCancelModalOpen(false);
                    onSubscribe('free');
                    onClose();
                    onShowToast('구독이 해지되었습니다. 무료 플랜으로 전환되었습니다.');
                  }}
                  className="w-full h-12 bg-[#ff5100] text-white font-bold text-[14px] rounded-xl cursor-pointer"
                >
                  구독 해지하기
                </button>
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="w-full h-12 bg-[#f4f5f4] text-[#202320] font-bold text-[14px] rounded-xl cursor-pointer"
                >
                  계속 이용하기
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
