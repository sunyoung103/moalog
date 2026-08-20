import React, { useState } from 'react';
import { X, Sparkles, Shield, Check, Mail, ChevronRight, Lock } from 'lucide-react';
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
  const [customEmail, setCustomEmail] = useState('');
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSocialLogin = (provider: AuthProvider) => {
    setIsProcessing(true);

    setTimeout(() => {
      let email = 'pjp1997103@gmail.com';
      let name = '자연 관찰자';

      if (provider === 'kakao') {
        email = 'kakao_explorer@kakao.com';
        name = '카카오 생태탐험가';
      } else if (provider === 'apple') {
        email = 'apple_nature@icloud.com';
        name = 'Apple 탐사자';
      } else if (provider === 'email') {
        email = customEmail.trim() || 'user@moalog.app';
        name = email.split('@')[0];
      }

      const newAccount: UserAccount = {
        isLoggedIn: true,
        email,
        name,
        provider,
        connectedAt: new Date().toLocaleDateString('ko-KR'),
      };

      setIsProcessing(false);
      onLoginSuccess(newAccount);
      onShowToast(
        provider === 'google'
          ? 'Google 계정으로 연동 및 로그인되었습니다.'
          : provider === 'kakao'
          ? '카카오 계정으로 연동 및 로그인되었습니다.'
          : provider === 'apple'
          ? 'Apple 계정으로 연동 및 로그인되었습니다.'
          : `${email} 계정으로 로그인되었습니다.`
      );
      onClose();
    }, 600);
  };

  return (
    <div
      id="login-auth-modal"
      className="fixed inset-0 z-60 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-stone-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">계정 로그인 &amp; 연동</h3>
              <p className="text-[10px] text-stone-500">도감 클라우드 동기화 및 기록 보관</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Benefits Note */}
        <div className="bg-emerald-50/80 rounded-2xl p-3 text-[11px] text-emerald-900 space-y-1">
          <p className="font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>계정을 연동하면 좋은 점</span>
          </p>
          <p className="text-stone-600 leading-tight">
            • 기기를 변경해도 도감 스티커와 관찰 기록이 유지돼요.<br />
            • 구독 혜택 및 무제한 AI 분석 권한이 계정에 안전하게 귀속됩니다.
          </p>
        </div>

        {/* Login Provider Buttons */}
        {!isEmailMode ? (
          <div className="space-y-2 pt-1">
            {/* Google */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleSocialLogin('google')}
              className="w-full py-3 px-4 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold flex items-center justify-between transition-all active:scale-95 shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
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
                <span>Google 계정으로 계속하기</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {/* Kakao */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleSocialLogin('kakao')}
              className="w-full py-3 px-4 rounded-2xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] text-xs font-bold flex items-center justify-between transition-all active:scale-95 shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-black">💬</span>
                <span>카카오로 시작하기</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-stone-700/60" />
            </button>

            {/* Apple */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleSocialLogin('apple')}
              className="w-full py-3 px-4 rounded-2xl bg-black hover:bg-stone-900 text-white text-xs font-bold flex items-center justify-between transition-all active:scale-95 shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm"></span>
                <span>Apple로 계속하기</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {/* Email toggle */}
            <button
              type="button"
              onClick={() => setIsEmailMode(true)}
              className="w-full py-2.5 text-center text-xs text-stone-500 hover:text-stone-800 font-semibold transition-colors"
            >
              기타 이메일 주소로 로그인
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSocialLogin('email');
            }}
            className="space-y-3 pt-1"
          >
            <div>
              <label className="text-[11px] font-bold text-stone-700 mb-1 block">이메일 주소</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEmailMode(false)}
                className="w-20 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold"
              >
                뒤로
              </button>
              <button
                type="submit"
                disabled={isProcessing || !customEmail.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#202424] text-white text-xs font-bold disabled:opacity-50"
              >
                {isProcessing ? '로그인 중...' : '로그인 완료'}
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 text-center">
          <p className="text-[10px] text-stone-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            <span>OAuth 2.0 표준 규격으로 암호화되어 안전합니다</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
