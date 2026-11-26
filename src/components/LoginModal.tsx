import React, { useState } from 'react';
import { X, ShieldCheck, ChevronRight, Lock, ArrowLeft, Check, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthProvider, UserAccount } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (account: UserAccount) => void;
  onShowToast: (msg: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onShowToast,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  // 7장: 나이 확인(필수)은 처음엔 미선택(null), 고르기 전에는 버튼 비활성
  const [ageGroup, setAgeGroup] = useState<'adult_or_teen14' | 'under14' | null>(null);
  const [step, setStep] = useState<
    'select_provider' | 'under14_notice' | 'guardian_consent' | 'guardian_sent'
  >('select_provider');
  const [pendingProvider, setPendingProvider] = useState<AuthProvider>('google');

  // 7장 A-09c: 보호자 성명 + 보호자 이메일만 수집 (관계 등 기타 항목 미수집)
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');

  if (!isOpen) return null;

  const resetAndClose = () => {
    setStep('select_provider');
    setAgeGroup(null);
    onClose();
  };

  const finalizeLogin = (provider: AuthProvider, isUnder14: boolean) => {
    setIsProcessing(true);

    setTimeout(() => {
      let email = 'pjp1997103@gmail.com';
      let name = isUnder14 ? '어린이 탐험가' : '자연 관찰자';

      if (provider === 'apple') {
        email = 'apple_nature@icloud.com';
        name = isUnder14 ? 'Apple 어린이 탐험가' : 'Apple 탐사자';
      }

      const newAccount: UserAccount = {
        isLoggedIn: true,
        email,
        name,
        provider,
        connectedAt: new Date().toLocaleDateString('ko-KR'),
        ageGroup: isUnder14 ? 'under14' : 'adult_or_teen14',
        isUnder14,
        guardianConsent: isUnder14
          ? {
              guardianName: guardianName.trim(),
              guardianEmail: guardianEmail.trim(),
              consentedAt: new Date().toLocaleDateString('ko-KR'),
            }
          : undefined,
      };

      setIsProcessing(false);
      setStep('select_provider');
      onLoginSuccess(newAccount);
      onShowToast(
        isUnder14
          ? '보호자 동의 확인 완료! 도감·뱃지·리포트 모드로 시작합니다.'
          : provider === 'google'
          ? 'Google 계정으로 연동 및 로그인되었습니다.'
          : 'Apple 계정으로 연동 및 로그인되었습니다.'
      );
      onClose();
    }, 500);
  };

  const handleSocialLogin = (provider: AuthProvider) => {
    if (!ageGroup) return;
    if (ageGroup === 'under14') {
      setPendingProvider(provider);
      setStep('under14_notice');
      return;
    }
    finalizeLogin(provider, false);
  };

  const handleSendGuardianMail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardianName.trim() || !guardianEmail.trim()) return;
    setStep('guardian_sent');
  };

  return (
    <div
      id="login-auth-modal"
      className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
      onClick={resetAndClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-[28px] sm:rounded-[28px] max-w-sm w-full p-6 shadow-2xl space-y-5 border border-[#e6e9e5] max-h-[92vh] overflow-y-auto"
      >
        {/* Drag handle for mobile sheet */}
        <div className="w-9 h-1 rounded-full bg-[#d2d7d1] mx-auto -mt-2 sm:hidden" />

        {/* STEP 1: 연령 선택 + 소셜 로그인 */}
        {step === 'select_provider' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[20px] font-bold text-[#202320] tracking-tight">계정 로그인</h3>
                <p className="text-[13px] text-[#8c948a] mt-0.5">나이를 먼저 선택한 뒤 계정을 연결해요</p>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                className="w-9 h-9 rounded-full bg-[#f4f5f4] hover:bg-[#e6e9e5] text-[#202320] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Age Group Selector (A-09 style radio rows) */}
            <div className="space-y-2">
              <p className="text-[12px] font-semibold text-[#555c54]">
                나이 확인 <span className="text-[#ff5100]">· 필수</span>
              </p>

              <button
                type="button"
                onClick={() => setAgeGroup('adult_or_teen14')}
                className={`w-full px-4 py-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  ageGroup === 'adult_or_teen14'
                    ? 'border-2 border-black bg-white'
                    : 'border-[#e6e9e5] bg-white hover:bg-[#fbfbfb]'
                }`}
              >
                <div>
                  <div className="text-[14px] font-bold text-[#202320]">만 14세 이상이에요</div>
                  <div className="text-[12px] text-[#8c948a] mt-0.5">전체 기능 이용 가능</div>
                </div>
                <span
                  className={`w-5 h-5 rounded-full shrink-0 transition-all ${
                    ageGroup === 'adult_or_teen14'
                      ? 'border-[6px] border-black bg-white'
                      : 'border-2 border-[#d2d7d1] bg-white'
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => setAgeGroup('under14')}
                className={`w-full px-4 py-3.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  ageGroup === 'under14'
                    ? 'border-2 border-black bg-white'
                    : 'border-[#e6e9e5] bg-white hover:bg-[#fbfbfb]'
                }`}
              >
                <div>
                  <div className="text-[14px] font-bold text-[#202320]">만 14세 미만이에요</div>
                  <div className="text-[12px] text-[#8c948a] mt-0.5">보호자 동의 필요</div>
                </div>
                <span
                  className={`w-5 h-5 rounded-full shrink-0 transition-all ${
                    ageGroup === 'under14'
                      ? 'border-[6px] border-black bg-white'
                      : 'border-2 border-[#d2d7d1] bg-white'
                  }`}
                />
              </button>
            </div>

            {ageGroup === 'under14' ? (
              <div className="bg-[#f4fbdd] border border-[#c4eb43] rounded-2xl p-3.5 text-[12px] text-[#202320] space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-[#6d8911]">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>만 14세 미만 이용 안내</span>
                </p>
                <p className="text-[#555c54] leading-relaxed">
                  메모 쓰기·외부 공유·랭킹은 꺼진 상태로 시작하며, 도감·뱃지·리포트는 그대로 이용할 수 있어요.
                </p>
              </div>
            ) : (
              <div className="bg-[#f4f5f4] rounded-2xl p-3.5 text-[12px] text-[#555c54]">
                {ageGroup
                  ? '기기를 변경해도 도감과 관찰 기록이 안전하게 유지돼요.'
                  : '먼저 위에서 나이를 선택해 주세요.'}
              </div>
            )}

            {/* Login Provider Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                disabled={!ageGroup || isProcessing}
                onClick={() => handleSocialLogin('google')}
                className="w-full h-13 px-4 rounded-xl border border-[#e6e9e5] bg-white hover:bg-[#f4f5f4] disabled:bg-[#e8e8e8] disabled:text-[#a5aca4] disabled:border-transparent disabled:cursor-not-allowed text-[#202320] text-[14px] font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
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
                  <span>
                    {ageGroup === 'under14' ? 'Google 선택 후 보호자 동의 진행' : 'Google로 계속하기'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8c948a]" />
              </button>

              <button
                type="button"
                disabled={!ageGroup || isProcessing}
                onClick={() => handleSocialLogin('apple')}
                className="w-full h-13 px-4 rounded-xl bg-black hover:bg-[#202320] disabled:bg-[#e8e8e8] disabled:text-[#a5aca4] disabled:cursor-not-allowed text-white text-[14px] font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none"></span>
                  <span>
                    {ageGroup === 'under14' ? 'Apple 선택 후 보호자 동의 진행' : 'Apple로 계속하기'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <p className="text-[11px] text-[#8c948a] flex items-center justify-center gap-1 pt-1">
              <Lock className="w-3 h-3" />
              <span>OAuth 2.0 표준 규격으로 안전하게 보호됩니다</span>
            </p>
          </>
        )}

        {/* STEP 2 (A-09b): 14세 미만 이용 안내 시트 */}
        {step === 'under14_notice' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('select_provider')}
                className="w-9 h-9 rounded-full bg-[#f4f5f4] hover:bg-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                aria-label="뒤로"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-[14px] font-bold text-[#202320]">만 14세 미만 안내</span>
              <button
                type="button"
                onClick={resetAndClose}
                className="w-9 h-9 rounded-full bg-[#f4f5f4] hover:bg-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-2 py-2">
              <div className="w-16 h-16 rounded-full bg-[#f4fbdd] border border-[#c4eb43] flex items-center justify-center text-3xl mx-auto">
                👶
              </div>
              <h4 className="text-[20px] font-bold text-[#202320]">안전하게 자연을 관찰해요</h4>
              <p className="text-[13px] text-[#555c54] leading-relaxed">
                만 14세 미만 회원은 보호자 동의 후 이용할 수 있어요.
              </p>
            </div>

            <div className="p-4 rounded-[20px] bg-[#f4f5f4] space-y-2.5 text-[13px]">
              <div className="flex items-center gap-2 text-[#202320] font-semibold">
                <Check className="w-4 h-4 text-[#6d8911] shrink-0" />
                <span>그대로 이용: 도감 · 뱃지 · 리포트 · 기기 저장</span>
              </div>
              <div className="flex items-center gap-2 text-[#8c948a]">
                <Lock className="w-4 h-4 shrink-0" />
                <span>14세부터 이용: 메모 쓰기 · 외부 공유 · 랭킹 참여</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep('guardian_consent')}
              className="w-full h-14 rounded-xl bg-black hover:bg-[#202320] text-white text-[15px] font-bold cursor-pointer transition-colors"
            >
              보호자 동의 입력하기
            </button>
          </div>
        )}

        {/* STEP 3 (A-09c): 보호자 성명 + 보호자 이메일만 입력 */}
        {step === 'guardian_consent' && (
          <form onSubmit={handleSendGuardianMail} className="space-y-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('under14_notice')}
                className="w-9 h-9 rounded-full bg-[#f4f5f4] hover:bg-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                aria-label="뒤로"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-[14px] font-bold text-[#202320]">보호자 정보</span>
              <button
                type="button"
                onClick={resetAndClose}
                className="w-9 h-9 rounded-full bg-[#f4f5f4] hover:bg-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h4 className="text-[20px] font-bold text-[#202320]">보호자 정보를 알려 주세요</h4>
              <p className="text-[13px] text-[#8c948a] mt-1">
                만 14세 미만은 보호자의 동의가 필요해요
              </p>
            </div>

            <div className="space-y-5 pt-1">
              <div>
                <label className="text-[12px] font-semibold text-[#8c948a] block">보호자 성명</label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="성명"
                  required
                  className="w-full py-3 bg-transparent border-b border-[#e6e9e5] focus:border-black text-[16px] text-[#202320] placeholder:text-[#a5aca4] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#8c948a] block">보호자 이메일</label>
                <input
                  type="email"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  placeholder="guardian@email.com"
                  required
                  className="w-full py-3 bg-transparent border-b border-[#e6e9e5] focus:border-black text-[16px] text-[#202320] placeholder:text-[#a5aca4] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!guardianName.trim() || !guardianEmail.trim()}
              className="w-full h-14 rounded-xl bg-black hover:bg-[#202320] disabled:bg-[#e8e8e8] disabled:text-[#a5aca4] text-white text-[15px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>동의 메일 보내기</span>
            </button>
          </form>
        )}

        {/* STEP 4 (A-09d -> A-09e): 발송 완료 & 동의 확인 완료 */}
        {step === 'guardian_sent' && (
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-[#f4fbdd] border border-[#c4eb43] text-[#6d8911] flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-[20px] font-bold text-[#202320]">보호자 메일로 안내를 보냈어요</h4>
              <p className="text-[13px] text-[#555c54] leading-relaxed">
                <strong>{guardianName}</strong>님({guardianEmail})이 동의 링크를 누르면 바로 시작할 수 있어요.
              </p>
            </div>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => finalizeLogin(pendingProvider, true)}
              className="w-full h-14 rounded-xl bg-black hover:bg-[#202320] disabled:bg-[#e8e8e8] text-white text-[15px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{isProcessing ? '확인 중...' : '보호자 동의 확인 완료'}</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
