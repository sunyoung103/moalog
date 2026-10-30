import React, { useEffect, useState } from 'react';
import { X, Sparkles, Shield, ChevronRight, Lock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAccount } from '../types';
import { mockSocialLogin, SocialProvider } from '../utils/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (account: UserAccount) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [processingProvider, setProcessingProvider] = useState<SocialProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isProcessing = processingProvider !== null;

  // 열릴 때마다 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setProcessingProvider(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // ESC 로 닫기 (처리 중에는 막음)
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isProcessing, onClose]);

  const handleSocialLogin = async (provider: SocialProvider) => {
    if (isProcessing) return;
    setErrorMessage(null);
    setProcessingProvider(provider);
    try {
      const account = await mockSocialLogin(provider);
      onLoginSuccess(account); // 성공 토스트/모달 닫기는 App 의 handleLoginSuccess 가 담당
    } catch {
      setErrorMessage('로그인에 실패했어요. 잠시 후 다시 시도해 주세요.');
      setProcessingProvider(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="login-auth-modal"
          id="login-auth-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-60 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          onClick={() => {
            if (!isProcessing) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-stone-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="login-modal-title" className="text-sm font-black text-stone-900">
                    로그인 · 가입
                  </h3>
                  <p className="text-[10px] text-stone-500">내 도감과 기록을 계정에 저장해요</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                aria-label="닫기"
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-emerald-50/80 rounded-2xl p-3 text-[11px] text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>로그인하면 이런 점이 좋아요</span>
              </p>
              <p className="text-stone-600 leading-tight">
                • 무료 도감 10칸이 열리고, 모은 생물이 계정에 저장돼요.<br />
                • 로그아웃해도 이 기기에서는 기록이 보존돼요.<br />
                • 이용권은 계정에 귀속돼요.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleSocialLogin('google')}
                className="w-full py-3.5 px-4 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold flex items-center justify-between transition-all active:scale-95 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google로 계속하기</span>
                </div>
                {processingProvider === 'google' ? (
                  <Loader2 className="w-3.5 h-3.5 text-stone-500 animate-spin" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                )}
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleSocialLogin('apple')}
                className="w-full py-3.5 px-4 rounded-2xl bg-black hover:bg-stone-900 text-white text-xs font-bold flex items-center justify-between transition-all active:scale-95 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm" aria-hidden="true">{'\uF8FF'}</span>
                  <span>Apple로 계속하기</span>
                </div>
                {processingProvider === 'apple' ? (
                  <Loader2 className="w-3.5 h-3.5 text-stone-300 animate-spin" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                )}
              </button>
            </div>

            {errorMessage && (
              <p role="alert" className="text-[11px] text-rose-600 font-semibold text-center">
                {errorMessage}
              </p>
            )}

            <div className="pt-2 text-center">
              <p className="text-[10px] text-stone-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                <span>가입 시 서비스 이용약관과 개인정보 처리방침에 동의한 것으로 봅니다</span>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};