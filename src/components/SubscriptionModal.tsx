import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Crown,
  Check,
  CreditCard,
  Lock,
  Cloud,
  Cpu,
  BookOpen,
  Bot,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Clock,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { UserStats } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: UserStats;
  onSubscribe: (planType: 'monthly' | 'yearly') => void;
  onShowToast: (msg: string) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  userStats,
  onSubscribe,
  onShowToast,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = () => {
    setIsProcessing(true);

    // Simulate safe app store / in-app purchase flow
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      onSubscribe(selectedPlan);

      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
      });

      onShowToast(
        selectedPlan === 'yearly'
          ? '🎉 연간 정기 구독(연 39,000원)이 정상 결제되었습니다! 모든 혜택이 즉시 적용됩니다.'
          : '🎉 월간 정기 구독(월 4,900원)이 정상 결제되었습니다! 모든 혜택이 즉시 적용됩니다.'
      );

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1400);
    }, 900);
  };

  return (
    <div
      id="subscription-paywall-modal"
      className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden relative border border-stone-200/80"
      >
        {/* Top Pull Down Bar on mobile */}
        <div className="w-12 h-1.5 rounded-full bg-stone-300 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header Bar */}
        <div className="px-5 pt-3 pb-2.5 flex items-center justify-between border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
              <Crown className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="text-xs font-black text-stone-900 flex items-center gap-1">
                MOALOG PRO 멤버십
              </span>
              <span className="text-[10px] text-stone-500 block">
                자연 생태 도감 프리미엄 클라우드 구독
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Main Content */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 scrollbar-none">
          {/* Main Pitch Card with User Requested Copy */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-3xl p-5 shadow-xs">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold border border-stone-200">
                <Sparkles className="w-3 h-3 text-stone-500" />
                <span>나만의 생태 아카이브</span>
              </div>

              {/* Exact User Requested Headings */}
              <h2 className="text-base sm:text-lg font-black text-stone-900 leading-snug tracking-tight">
                생태도감 이미지를 저장하고,<br />
                AI 식별 · 분석을 통해<br />
                <span className="text-stone-600">나만의 도감을 채워드려요!</span>
              </h2>

              <p className="text-xs text-stone-500 leading-relaxed pt-0.5 font-medium">
                이미지 저장 · 분석 비용으로 인해<br />
                월 구독 서비스를 진행합니다.
              </p>
            </div>
          </div>

          {/* 🎉 Open Celebration Discount Banner */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
            <span className="text-2xl shrink-0">🎉</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-stone-900">오픈 기념 특별 할인 이벤트</span>
                <span className="px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 font-mono text-[9px] font-bold">
                  최대 34% OFF
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-tight font-medium">
                지금 신청하시면 평생 오픈 할인가로 이용하실 수 있습니다.
              </p>
            </div>
          </div>

          {/* Core Benefits Checklist (Exact User Requirements) */}
          <div className="bg-stone-50 rounded-2xl p-3.5 space-y-2.5 border border-stone-200/70">
            <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>PRO 멤버십 전용 혜택</span>
            </h4>

            {/* Benefit 1 */}
            <div className="flex items-start gap-2.5 text-xs text-stone-700">
              <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Cloud className="w-3 h-3" />
              </div>
              <div>
                <p className="font-bold text-stone-900">촬영한 사진 클라우드 저장</p>
                <p className="text-[11px] text-stone-500">기기를 바꿔도 도감이 그대로 유지돼요</p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="flex items-start gap-2.5 text-xs text-stone-700">
              <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Cpu className="w-3 h-3" />
              </div>
              <div>
                <p className="font-bold text-stone-900">무제한 AI 종 식별 &amp; 예술점수 분석</p>
                <p className="text-[11px] text-stone-500">일일 스캔 제한 없이 무제한으로 종 동정 및 구도 점수 채점</p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="flex items-start gap-2.5 text-xs text-stone-700">
              <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-3 h-3" />
              </div>
              <div>
                <p className="font-bold text-stone-900">생태 백과 · 프리미엄 관찰 가이드 열람</p>
                <p className="text-[11px] text-stone-500">사계절 관찰 팁 및 전국 핫스팟 탐사 루트 전체 공개</p>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="flex items-start gap-2.5 text-xs text-stone-700">
              <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3 h-3" />
              </div>
              <div>
                <p className="font-bold text-stone-900">AI 생태백과 챗봇 사용 가능</p>
                <p className="text-[11px] text-stone-500">궁금한 생물 특성 및 동정 질문을 24시간 실시간 질의응답</p>
              </div>
            </div>
          </div>

          {/* Pricing Plan Selector (연간 39,000원 & 월간 4,900원) */}
          <div className="space-y-2.5 pt-1">
            <h4 className="text-xs font-bold text-stone-800 flex items-center justify-between px-1">
              <span>구독 플랜 선택</span>
              <span className="text-[10px] text-stone-400 font-mono">부가세 포함</span>
            </h4>

            {/* Option 1: Yearly Plan (연 39,000원) */}
            <div
              onClick={() => setSelectedPlan('yearly')}
              className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between border relative ${
                selectedPlan === 'yearly'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-1 ring-stone-900'
                  : 'bg-stone-50 text-stone-700 border-stone-200/80 hover:bg-stone-100'
              }`}
            >
              {/* Best Value Tag */}
              <div className="absolute -top-2.5 right-4 bg-stone-900 text-white font-black text-[9px] font-mono px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 border border-stone-700">
                <span>오픈 특가 · 34% 절약</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedPlan === 'yearly'
                        ? 'border-white bg-white text-stone-900'
                        : 'border-stone-400'
                    }`}
                  >
                    {selectedPlan === 'yearly' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-black">연 구독 플랜</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${selectedPlan === 'yearly' ? 'bg-stone-800 text-stone-300' : 'bg-stone-200 text-stone-700'}`}>
                    1년 정기 결제
                  </span>
                </div>
                <p
                  className={`text-[11px] pl-6 ${
                    selectedPlan === 'yearly' ? 'text-stone-400' : 'text-stone-500'
                  }`}
                >
                  월 약 3,250원 상당 (가장 경제적인 플랜)
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <span
                    className={`text-[10px] line-through ${
                      selectedPlan === 'yearly' ? 'text-stone-500' : 'text-stone-400'
                    }`}
                  >
                    58,800원
                  </span>
                  <span className="text-base font-black">연 39,000원</span>
                </div>
                <p
                  className={`text-[9px] ${
                    selectedPlan === 'yearly' ? 'text-stone-500' : 'text-stone-400'
                  }`}
                >
                  1년 후 자동 갱신
                </p>
              </div>
            </div>

            {/* Option 2: Monthly Plan (월 4,900원) */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between border ${
                selectedPlan === 'monthly'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-1 ring-stone-900'
                  : 'bg-stone-50 text-stone-700 border-stone-200/80 hover:bg-stone-100'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedPlan === 'monthly'
                        ? 'border-white bg-white text-stone-900'
                        : 'border-stone-400'
                    }`}
                  >
                    {selectedPlan === 'monthly' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-bold">월 구독 플랜</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${selectedPlan === 'monthly' ? 'bg-stone-800 text-stone-300' : 'bg-stone-200 text-stone-700'}`}>
                    1개월 결제
                  </span>
                </div>
                <p
                  className={`text-[11px] pl-6 ${
                    selectedPlan === 'monthly' ? 'text-stone-400' : 'text-stone-500'
                  }`}
                >
                  매월 자유롭게 언제든 해지 가능
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <span
                    className={`text-[10px] line-through ${
                      selectedPlan === 'monthly' ? 'text-stone-500' : 'text-stone-400'
                    }`}
                  >
                    7,900원
                  </span>
                  <span className="text-base font-black">월 4,900원</span>
                </div>
                <p
                  className={`text-[9px] ${
                    selectedPlan === 'monthly' ? 'text-stone-500' : 'text-stone-400'
                  }`}
                >
                  매월 자동 갱신
                </p>
              </div>
            </div>
          </div>

          {/* ⚠️ User-Requested Crucial Data Notice */}
          <div className="p-3 bg-stone-100 rounded-2xl flex items-start gap-2.5 text-stone-700">
            <AlertTriangle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <p className="font-bold text-stone-900">데이터 보관 안내</p>
              <p className="text-stone-500 mt-0.5">
                구독 해지 후 1년 뒤엔 데이터가 삭제되거나 압축될 수 있습니다.
              </p>
            </div>
          </div>

          {/* Security Guarantee */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400 pt-1">
            <Lock className="w-3 h-3" />
            <span>Apple App Store 및 Google Play 안전 결제 시스템 지원</span>
          </div>
        </div>

        {/* Bottom CTA Action Bar */}
        <div className="p-4 bg-white border-t border-stone-100 flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-24 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-xs font-bold transition-colors active:scale-95"
          >
            닫기
          </button>

          <button
            type="button"
            disabled={isProcessing || isSuccess}
            onClick={handleCheckout}
            className="flex-1 py-3.5 bg-[#202424] hover:bg-stone-850 text-white rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                <span>안전 결제 처리 중...</span>
              </div>
            ) : isSuccess ? (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>구독 완료! 환영합니다!</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  {selectedPlan === 'yearly'
                    ? '연 39,000원 결제하고 시작 (월 3,250원)'
                    : '월 4,900원 결제하고 시작'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
