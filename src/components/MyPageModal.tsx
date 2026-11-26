import React, { useState } from 'react';
import { UserStats, NaturalistPersona, Specimen, UserAccount } from '../types';
import { NATURALIST_PERSONAS } from '../data/hotspots';
import {
  X,
  ChevronRight,
  ArrowLeft,
  Check,
  LogOut,
  UserX,
  Trash2,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SUPPORTED_LANGUAGES } from '../utils/speciesNameHelper';
import { getTitleAdjectiveForLevel, getUnder14DesignFlags } from '../utils/levelPolicy';
import { getExplorerTitleInfo } from '../utils/explorerTitles';
import { PersonaBadgeIcon } from './PersonaBadgeIcon';
import { DataSourcesModal } from './DataSourcesModal';

interface MyPageModalProps {
  userStats: UserStats;
  onUpdateStats: (newStats: Partial<UserStats>) => void;
  onClose: () => void;
  collectedCount: number;
  totalCount: number;
  onShowToast: (msg: string) => void;
  specimens: Specimen[];
  onRestoreSpecimen: (id: string) => void;
  onPermanentDeleteSpecimen: (id: string) => void;
  onEmptyTrash: () => void;
  userAccount: UserAccount;
  onUpdateAccount?: (updated: Partial<UserAccount>) => void;
  onOpenLoginModal: () => void;
  onOpenSubscriptionModal: () => void;
  onOpenMapSettings?: () => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
}

export const MyPageModal: React.FC<MyPageModalProps> = ({
  userStats,
  onUpdateStats,
  onClose,
  collectedCount,
  onShowToast,
  specimens,
  onRestoreSpecimen,
  onPermanentDeleteSpecimen,
  onEmptyTrash,
  userAccount,
  onUpdateAccount,
  onOpenLoginModal,
  onOpenSubscriptionModal,
  onOpenMapSettings,
  onLogout,
  onDeleteAccount,
}) => {
  const [isPersonaSubPageOpen, setIsPersonaSubPageOpen] = useState(false);
  const [isTitleSubPageOpen, setIsTitleSubPageOpen] = useState(false);
  const [pendingTitleId, setPendingTitleId] = useState<string>(userStats.selectedTitleId || 'default');
  const [isLanguageSubPageOpen, setIsLanguageSubPageOpen] = useState(false);
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);
  const [isConfirmAdultTransitionOpen, setIsConfirmAdultTransitionOpen] = useState(false);
  const [adultTransitionStep, setAdultTransitionStep] = useState<'confirm' | 'reconsent'>('confirm');
  const [reconsentTerms, setReconsentTerms] = useState(false);
  const [reconsentPrivacy, setReconsentPrivacy] = useState(false);
  const [reconsentCommunity, setReconsentCommunity] = useState(false);
  const [isTrashSubPageOpen, setIsTrashSubPageOpen] = useState(false);
  const [isSubManagementSubPageOpen, setIsSubManagementSubPageOpen] = useState(false);
  const [isAccountSubPageOpen, setIsAccountSubPageOpen] = useState(false);
  const [legalDocType, setLegalDocType] = useState<'terms' | 'privacy' | null>(null);

  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false);
  const [isConfirmDeleteAccountOpen, setIsConfirmDeleteAccountOpen] = useState(false);
  const [isConfirmEmptyTrashOpen, setIsConfirmEmptyTrashOpen] = useState(false);
  const [permanentDeleteSpecimenId, setPermanentDeleteSpecimenId] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const currentPersonaKey = userStats.persona || 'general';
  const currentPersona = NATURALIST_PERSONAS[currentPersonaKey];
  const titleInfo = getExplorerTitleInfo(specimens, userStats, userAccount);
  const nextTierLevel =
    titleInfo.currentLevel < 5 ? 5 : titleInfo.currentLevel < 10 ? 10 : titleInfo.currentLevel < 20 ? 20 : titleInfo.currentLevel < 30 ? 30 : null;
  const nextTierAdj = nextTierLevel ? getTitleAdjectiveForLevel(nextTierLevel) : null;
  const { under14: isUnder14 } = getUnder14DesignFlags(userAccount);
  const questAlertOn = Boolean(userStats.questAlertsEnabled);

  const handleConfirmCancellation = () => {
    onUpdateStats({ isProUser: false, planType: 'free' });
    setIsCancelModalOpen(false);
    onShowToast('구독이 해지되었습니다. 무료 플랜으로 전환되었습니다.');
  };

  const handleToggleSetting = (key: keyof UserStats) => {
    const newVal = !userStats[key];
    onUpdateStats({ [key]: newVal });
    onShowToast('설정이 저장되었습니다');
  };

  const handleSelectPersona = (p: NaturalistPersona) => {
    onUpdateStats({ persona: p });
    onShowToast('설정이 저장되었습니다');
    setIsPersonaSubPageOpen(false);
  };

  const renderToggle = (isOn: boolean, onClick: () => void, ariaLabel: string) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isOn}
      className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center shrink-0 cursor-pointer ${
        isOn ? 'bg-black justify-end' : 'bg-[#e6e9e5] justify-start'
      }`}
    >
      <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
    </button>
  );

  return (
    <div
      id="mypage-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#fbfbfb] text-[#202320] flex flex-col overflow-hidden select-none"
    >
      <div className="max-w-lg w-full mx-auto flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ================= [SUB-PAGE] Persona Selection ================= */}
          {isPersonaSubPageOpen ? (
            <motion.div
              key="persona-subpage"
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col h-full flex-1 overflow-hidden px-4 pt-3 pb-6"
            >
              <div className="flex items-center justify-between pb-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPersonaSubPageOpen(false)}
                  className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-[16px] font-bold text-[#202320]">탐험가 유형 선택</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2 space-y-2.5 flex-1 overflow-y-auto scrollbar-none">
                <p className="text-[13px] text-[#8c948a] px-1">
                  선택한 유형에 맞춰 도감 및 탐험 맵 추천 종이 구성됩니다.
                </p>

                {(Object.values(NATURALIST_PERSONAS) as any[]).map((persona) => {
                  const isSelected = currentPersonaKey === persona.id;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => handleSelectPersona(persona.id as NaturalistPersona)}
                      className={`w-full p-4 rounded-[20px] text-left flex items-center justify-between transition-all cursor-pointer bg-white ${
                        isSelected ? 'border-2 border-black' : 'border border-[#e6e9e5]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <PersonaBadgeIcon persona={persona.id as NaturalistPersona} size="md" />
                        <div className="min-w-0">
                          <span className="text-[15px] font-bold text-[#202320] block">{persona.title}</span>
                          <p className="text-[12px] text-[#8c948a] mt-0.5 line-clamp-1">{persona.description}</p>
                        </div>
                      </div>
                      <span
                        className={`w-5 h-5 rounded-full shrink-0 ${
                          isSelected ? 'border-[6px] border-black bg-white' : 'border-2 border-[#d2d7d1]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : isTitleSubPageOpen ? (
            /* ================= [SUB-PAGE] G-06 내 칭호 ================= */
            <motion.div
              key="title-subpage"
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col h-full flex-1 overflow-hidden px-4 pt-3 pb-6"
            >
              <div className="flex items-center justify-between pb-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTitleSubPageOpen(false)}
                  className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer shadow-2xs"
                  aria-label="뒤로"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-[16px] font-bold text-[#202320]">내 칭호</span>
                <div className="w-10" />
              </div>

              <div className="py-2 space-y-6 flex-1 overflow-y-auto scrollbar-none">
                {/* Current Title Card (tap to change persona type) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsTitleSubPageOpen(false);
                    setIsPersonaSubPageOpen(true);
                  }}
                  className="w-full bg-white rounded-[20px] border border-[#e6e9e5] p-4 flex items-center justify-between text-left hover:bg-[#fbfbfb] transition-colors cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[16px] font-bold text-[#202320] truncate">
                        {titleInfo.activeTitle}
                      </span>
                      <span className="px-2 py-0.5 rounded-full border border-[#c4eb43] bg-[#f4fbdd] text-[#6d8911] text-[11px] font-bold tabular-nums shrink-0">
                        Lv.{titleInfo.currentLevel}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#8c948a] mt-1">
                      {nextTierAdj && nextTierLevel
                        ? `다음 칭호 · ${nextTierAdj} ${currentPersona.title} (Lv.${nextTierLevel})`
                        : '최고 등급 칭호 구간에 도달했어요'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8c948a] shrink-0" />
                </button>

                {/* 표시할 칭호 List */}
                <div className="space-y-2.5">
                  <h3 className="text-[18px] font-bold text-[#202320]">표시할 칭호</h3>
                  <div className="bg-white rounded-[22px] border border-[#e6e9e5] divide-y divide-[#f4f5f4] overflow-hidden">
                    {[titleInfo.defaultOption, ...(titleInfo.personaOptions || []), ...titleInfo.unlockedHidden].map((opt) => {
                      const isSelected = pendingTitleId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPendingTitleId(opt.id)}
                          className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-[#fbfbfb] transition-colors cursor-pointer"
                        >
                          <div className="min-w-0 pr-3">
                            <span className="text-[15px] font-bold text-[#202320] block truncate">
                              {opt.title}
                            </span>
                            <span className="text-[12px] text-[#8c948a] mt-0.5 block">
                              {opt.subtitle}
                            </span>
                          </div>
                          <span
                            className={`w-5 h-5 rounded-full shrink-0 ${
                              isSelected ? 'border-[6px] border-black bg-white' : 'border-2 border-[#d2d7d1]'
                            }`}
                          />
                        </button>
                      );
                    })}

                    {titleInfo.lockedHiddenCount > 0 && (
                      <div className="w-full px-4 py-4 flex items-center justify-between text-left opacity-55">
                        <div className="min-w-0 pr-3">
                          <span className="text-[15px] font-bold text-[#8c948a] block tabular-nums">
                            숨겨진 칭호 {titleInfo.lockedHiddenCount}개
                          </span>
                          <span className="text-[12px] text-[#8c948a] mt-0.5 block">
                            조건은 달성할 때까지 비밀이에요
                          </span>
                        </div>
                        <span className="w-5 h-5 rounded-full border-2 border-[#e6e9e5] shrink-0" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStats({ selectedTitleId: pendingTitleId });
                    onShowToast('표시할 칭호가 변경되었어요');
                    setIsTitleSubPageOpen(false);
                  }}
                  className="w-full h-14 bg-black hover:bg-[#202320] text-white font-bold text-[15px] rounded-2xl transition-colors cursor-pointer"
                >
                  이 칭호로 표시하기
                </button>
              </div>
            </motion.div>
          ) : isLanguageSubPageOpen ? (
            /* ================= [SUB-PAGE] Language Selection ================= */
            <motion.div
              key="language-subpage"
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col h-full flex-1 overflow-hidden px-4 pt-3 pb-6"
            >
              <div className="flex items-center justify-between pb-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsLanguageSubPageOpen(false)}
                  className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-[16px] font-bold text-[#202320]">언어 설정</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2 space-y-4 flex-1 overflow-y-auto scrollbar-none">
                <div className="grid grid-cols-2 gap-2.5">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = (userStats.language || 'ko') === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          onUpdateStats({ language: lang.code });
                          onShowToast(`언어가 ${lang.label}(으)로 변경되었습니다`);
                        }}
                        className={`p-3.5 rounded-[20px] text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-black text-white border-2 border-black'
                            : 'bg-white text-[#202320] border border-[#e6e9e5]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{lang.flag}</span>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold truncate leading-tight">{lang.nativeLabel}</p>
                            <p className={`text-[11px] truncate ${isSelected ? 'text-white/70' : 'text-[#8c948a]'}`}>
                              {lang.label}
                            </p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#c4eb43] shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                {(userStats.language || 'ko') !== 'en' && (
                  <div className="bg-white rounded-[20px] p-4 border border-[#e6e9e5] flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-bold text-[#202320]">영어이름 함께 보기</p>
                      <p className="text-[12px] text-[#8c948a] mt-0.5">
                        현지어명 옆에 영문 통칭을 함께 표시해요
                      </p>
                    </div>
                    {renderToggle(
                      userStats.showEnglishNameWithLocal !== false,
                      () => {
                        const currentVal = userStats.showEnglishNameWithLocal !== false;
                        onUpdateStats({ showEnglishNameWithLocal: !currentVal });
                        onShowToast(!currentVal ? '영어이름 함께 보기가 켜졌습니다' : '영어이름 함께 보기가 꺼졌습니다');
                      },
                      '영어이름 함께 보기'
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : isAccountSubPageOpen ? (
            /* ================= [SUB-PAGE] Connected Account Info ================= */
            <motion.div
              key="account-info-subpage"
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col h-full flex-1 overflow-hidden px-4 pt-3 pb-6"
            >
              <div className="flex items-center justify-between pb-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAccountSubPageOpen(false)}
                  className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-[16px] font-bold text-[#202320]">연동된 계정 정보</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2 space-y-4 flex-1 overflow-y-auto scrollbar-none">
                <div className="bg-white rounded-[20px] p-5 border border-[#e6e9e5] space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#f4fbdd] border border-[#c4eb43] text-[#6d8911] text-2xl font-bold flex items-center justify-center mx-auto shadow-xs">
                    {userAccount.name ? userAccount.name[0] : '👤'}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[18px] font-bold text-[#202320]">{userAccount.name || '탐험가'}</h3>
                    <p className="text-[13px] text-[#8c948a]">{userAccount.email || '연동된 이메일 없음'}</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f5f4] text-[#202320] text-[12px] font-bold">
                    <span>{userAccount.provider === 'apple' ? ' Apple 계정 연동됨' : 'Google 계정 연동됨'}</span>
                  </div>
                </div>

                <div className="bg-white rounded-[20px] p-4 border border-[#e6e9e5] space-y-3 text-[13px]">
                  <div className="flex justify-between pb-2.5 border-b border-[#f4f5f4]">
                    <span className="text-[#8c948a]">연동일</span>
                    <span className="font-semibold text-[#202320] tabular-nums">{userAccount.connectedAt || '최근'}</span>
                  </div>
                  <div className="flex justify-between pb-2.5 border-b border-[#f4f5f4]">
                    <span className="text-[#8c948a]">계정 유형</span>
                    <span className="font-semibold text-[#202320]">
                      {userAccount.isUnder14 ? '만 14세 미만 (보호자 동의)' : '일반 계정'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8c948a]">상태</span>
                    <span className="font-bold text-[#6d8911] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 정상 연동 중
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountSubPageOpen(false);
                        setIsConfirmLogoutOpen(true);
                      }}
                      className="w-full h-13 rounded-xl bg-white border border-[#e6e9e5] text-[#202320] font-bold text-[14px] cursor-pointer"
                    >
                      로그아웃
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountSubPageOpen(false);
                      setIsConfirmDeleteAccountOpen(true);
                    }}
                    className="w-full h-13 rounded-xl bg-white border border-[#fee2e2] text-[#ff5100] font-bold text-[14px] cursor-pointer"
                  >
                    계정 삭제
                  </button>
                </div>
              </div>
            </motion.div>
          ) : isSubManagementSubPageOpen ? (
            /* ================= [SUB-PAGE] Subscription Contract Management ================= */
            <motion.div
              key="sub-management-subpage"
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col h-full flex-1 overflow-hidden px-4 pt-3 pb-6"
            >
              <div className="flex items-center justify-between pb-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSubManagementSubPageOpen(false)}
                  className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-[16px] font-bold text-[#202320]">이용권 관리</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2 space-y-4 flex-1 overflow-y-auto scrollbar-none">
                <div className="bg-white rounded-[20px] p-4 border border-[#e6e9e5] space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-[#f4f5f4]">
                    <span className="text-[13px] font-bold text-[#555c54]">이용 중인 플랜</span>
                    <span className="text-[12px] font-bold text-[#6d8911] bg-[#f4fbdd] px-2.5 py-0.5 rounded-full border border-[#c4eb43]">
                      {userStats.planType === 'yearly'
                        ? 'MOALOG PRO (연간)'
                        : userStats.planType === 'lifetime'
                        ? '영구 이용권'
                        : 'MOALOG PRO (월간)'}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-[#8c948a]">결제 수단</span>
                      <span className="font-semibold text-[#202320]">App Store / Google Play</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8c948a]">결제 금액</span>
                      <span className="font-bold text-[#202320] tabular-nums">
                        {userStats.planType === 'yearly'
                          ? '연 29,000원'
                          : userStats.planType === 'lifetime'
                          ? '58,000원'
                          : '월 3,300원'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8c948a]">서비스 상태</span>
                      <span className="font-bold text-[#6d8911] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 무제한 혜택 적용 중
                      </span>
                    </div>
                  </div>
                </div>

                {userStats.isProUser && (
                  <div className="pt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setIsCancelModalOpen(true)}
                      className="text-[12px] font-semibold text-[#8c948a] hover:text-[#ff5100] underline py-2 px-4 cursor-pointer"
                    >
                      구독 서비스 해지 신청
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : isTrashSubPageOpen ? (
            /* ================= [SUB-PAGE] Trash Bin ================= */
            <motion.div
              key="trash-subpage"
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col h-full flex-1 overflow-hidden px-4 pt-3 pb-6"
            >
              <div className="flex items-center justify-between pb-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTrashSubPageOpen(false)}
                  className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-[16px] font-bold text-[#202320]">휴지통</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2 space-y-3 flex-1 overflow-y-auto scrollbar-none">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[12px] text-[#8c948a]">삭제된 기록은 30일 후 영구 삭제돼요</p>
                  {(specimens || []).some((s) => s.isDeleted) && (
                    <button
                      type="button"
                      onClick={() => setIsConfirmEmptyTrashOpen(true)}
                      className="text-[12px] font-bold text-[#ff5100] cursor-pointer"
                    >
                      비우기
                    </button>
                  )}
                </div>

                {(() => {
                  const deletedSpecimens = (specimens || []).filter((s) => s.isDeleted);
                  if (deletedSpecimens.length === 0) {
                    return (
                      <div className="py-16 text-center text-[#8c948a] text-[13px]">
                        휴지통이 비어 있습니다.
                      </div>
                    );
                  }
                  return deletedSpecimens.map((sp) => {
                    const daysLeft = sp.deletedAt
                      ? Math.max(0, 30 - Math.floor((Date.now() - sp.deletedAt) / 86400000))
                      : 30;

                    return (
                      <div
                        key={sp.id}
                        className="p-3.5 rounded-[20px] bg-white border border-[#e6e9e5] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-[#f4f5f4] overflow-hidden shrink-0">
                            {sp.stickerImage || sp.originalImage ? (
                              <img src={sp.stickerImage || sp.originalImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#8c948a]">?</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[14px] font-bold text-[#202320] truncate">{sp.koreanName}</h4>
                            <p className="text-[11px] text-[#8c948a] truncate">
                              {sp.date} · {daysLeft}일 남음
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onRestoreSpecimen(sp.id)}
                            className="w-9 h-9 rounded-full bg-[#f4f5f4] hover:bg-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer"
                            title="복구"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPermanentDeleteSpecimenId(sp.id)}
                            className="w-9 h-9 rounded-full bg-[#f4f5f4] hover:bg-[#fee2e2] text-[#ff5100] flex items-center justify-center cursor-pointer"
                            title="영구 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          ) : (
            /* ================= [MAIN PAGE] G-03 설정 ================= */
            <motion.div
              key="main-settings"
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col h-full flex-1 overflow-hidden"
            >
              {/* Top Bar matching G-03_설정.png */}
              <div className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white border border-[#e6e9e5] text-[#202320] flex items-center justify-center cursor-pointer shadow-2xs"
                  aria-label="뒤로"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-[16px] font-bold text-[#202320]">설정</h2>
                <div className="w-10" />
              </div>

              <div className="px-4 pt-2 pb-10 space-y-5 flex-1 overflow-y-auto scrollbar-none">
                {/* 1. Explorer Title & Level Card (G-03 top card) */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingTitleId(userStats.selectedTitleId || 'default');
                      setIsTitleSubPageOpen(true);
                    }}
                    className="w-full bg-white rounded-[20px] border border-[#e6e9e5] p-4 flex items-center justify-between text-left hover:bg-[#fbfbfb] transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-[#202320]">
                          {titleInfo.activeTitle}
                        </span>
                        <span className="px-2 py-0.5 rounded-full border border-[#c4eb43] bg-[#f4fbdd] text-[#6d8911] text-[11px] font-bold tabular-nums">
                          Lv.{titleInfo.currentLevel}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#8c948a] mt-1">
                        표시 중인 칭호 · {titleInfo.activeTitleId === 'default' ? '기본' : '숨겨진 칭호'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8c948a] shrink-0" />
                  </button>

                  {/* 2. Slot / Plan Card (G-03 second card) */}
                  <button
                    type="button"
                    id="btn-mypage-open-checkout"
                    onClick={() =>
                      userStats.isProUser ? setIsSubManagementSubPageOpen(true) : onOpenSubscriptionModal()
                    }
                    className="w-full bg-white rounded-[20px] border border-[#e6e9e5] px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#fbfbfb] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#c4eb43] text-[#202320] text-[11px] font-bold shrink-0">
                        {userStats.isProUser ? 'PRO' : '무료'}
                      </span>
                      <span className="text-[14px] font-bold text-[#202320] truncate tabular-nums">
                        {userStats.isProUser ? '무제한 도감 이용 중' : `무료 도감 ${collectedCount} / 10칸`}
                      </span>
                    </div>
                    <span className="text-[13px] text-[#8c948a] font-medium flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                      {userStats.isProUser ? '이용권 관리' : '이용권 보기'} <ChevronRight className="w-4 h-4" />
                    </span>
                  </button>
                </div>

                {/* 3. 도감 · 앱 알림 Section (G-03) */}
                <div className="space-y-2">
                  <h3 className="text-[13px] font-semibold text-[#8c948a] px-1">도감 · 앱 알림</h3>
                  <div className="bg-white rounded-[20px] border border-[#e6e9e5] divide-y divide-[#f4f5f4]">
                    <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                      <span className="text-[15px] font-semibold text-[#202320]">포착 · 뱃지 알림</span>
                      {renderToggle(
                        userStats.hapticsEnabled,
                        () => handleToggleSetting('hapticsEnabled'),
                        '포착 · 뱃지 알림'
                      )}
                    </div>

                    <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                      <span className="text-[15px] font-semibold text-[#202320]">출석 · 퀘스트 알림</span>
                      {renderToggle(
                        questAlertOn,
                        () => {
                          onUpdateStats({ questAlertsEnabled: !questAlertOn });
                          onShowToast('설정이 저장되었습니다');
                        },
                        '출석 · 퀘스트 알림'
                      )}
                    </div>
                  </div>
                </div>

                {/* G-03b 나이 그룹 (만 14세 미만 전용) */}
                {isUnder14 && (
                  <div className="space-y-2">
                    <h3 className="text-[13px] font-semibold text-[#8c948a] px-1">나이</h3>
                    <div className="bg-white rounded-[20px] border border-[#e6e9e5] divide-y divide-[#f4f5f4]">
                      <div className="px-4 py-3.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[15px] font-semibold text-[#202320]">현재 계정 연령</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#f4fbdd] border border-[#c4eb43] text-[#6d8911] text-[11px] font-bold">
                            만 14세 미만
                          </span>
                        </div>
                        <p className="text-[12px] text-[#8c948a] leading-relaxed">
                          외부 공유 · 탐험맵 메모/댓글/하트 · 친구 초대 · 랭킹 공개는 만 14세 미만 보호 정책에 따라 제한돼요.
                        </p>
                      </div>
                      {userAccount.isLoggedIn && onUpdateAccount && (
                        <button
                          type="button"
                          onClick={() => {
                            setAdultTransitionStep('confirm');
                            setReconsentTerms(false);
                            setReconsentPrivacy(false);
                            setReconsentCommunity(false);
                            setIsConfirmAdultTransitionOpen(true);
                          }}
                          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#fbfbfb] transition-colors cursor-pointer"
                        >
                          <span className="text-[15px] font-semibold text-[#6d8911]">만 14세가 되었어요 · 제한 해제</span>
                          <ChevronRight className="w-4 h-4 text-[#8c948a]" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. 일반 Section (G-03) */}
                <div className="space-y-2">
                  <h3 className="text-[13px] font-semibold text-[#8c948a] px-1">일반</h3>
                  <div className="bg-white rounded-[20px] border border-[#e6e9e5] divide-y divide-[#f4f5f4]">
                    <button
                      type="button"
                      onClick={() => setIsLanguageSubPageOpen(true)}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#fbfbfb] transition-colors cursor-pointer"
                    >
                      <span className="text-[15px] font-semibold text-[#202320]">언어</span>
                      <span className="text-[13px] text-[#8c948a] flex items-center gap-1">
                        {SUPPORTED_LANGUAGES.find((l) => l.code === (userStats.language || 'ko'))?.nativeLabel || '시스템 기본'}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </button>

                    <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                      <span className="text-[15px] font-semibold text-[#202320]">내 기기 앨범에도 저장</span>
                      {renderToggle(
                        userStats.soundEnabled,
                        () => handleToggleSetting('soundEnabled'),
                        '내 기기 앨범에도 저장'
                      )}
                    </div>

                    {!isUnder14 && (
                      <button
                        type="button"
                        onClick={() => onShowToast('초대 링크가 복사되었어요.')}
                        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#fbfbfb] transition-colors cursor-pointer"
                      >
                        <span className="text-[15px] font-semibold text-[#202320]">친구 초대</span>
                        <ChevronRight className="w-4 h-4 text-[#8c948a]" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 5. 탐험맵 설정 바로가기 (탐험맵 전용 설정으로 분리 연결) */}
                {onOpenMapSettings && (
                  <div className="space-y-2">
                    <h3 className="text-[13px] font-semibold text-[#8c948a] px-1">탐험맵</h3>
                    <div className="bg-white rounded-[20px] border border-[#e6e9e5] overflow-hidden">
                      <button
                        type="button"
                        onClick={onOpenMapSettings}
                        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#fbfbfb] transition-colors cursor-pointer"
                      >
                        <div className="min-w-0 pr-3">
                          <span className="text-[15px] font-semibold text-[#202320] block">탐험맵 설정</span>
                          <span className="text-[12px] text-[#8c948a] mt-0.5 block">
                            {isUnder14
                              ? '위치 권한 · 주변 새 기록 알림'
                              : '메모 공개 · 보호종 위치 · 랭킹 · 탐험맵 알림 · 차단 관리'}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8c948a] shrink-0" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. 정보 Section (G-03) */}
                <div className="space-y-2">
                  <h3 className="text-[13px] font-semibold text-[#8c948a] px-1">정보</h3>
                  <div className="bg-white rounded-[20px] border border-[#e6e9e5] divide-y divide-[#f4f5f4]">
                    <button
                      type="button"
                      onClick={() => setLegalDocType('terms')}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#fbfbfb] transition-colors cursor-pointer"
                    >
                      <span className="text-[15px] font-semibold text-[#202320]">서비스 이용약관</span>
                      <ChevronRight className="w-4 h-4 text-[#8c948a]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setLegalDocType('privacy')}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#fbfbfb] transition-colors cursor-pointer"
                    >
                      <span className="text-[15px] font-semibold text-[#202320]">개인정보 처리방침</span>
                      <ChevronRight className="w-4 h-4 text-[#8c948a]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsDataSourcesOpen(true)}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#fbfbfb] transition-colors cursor-pointer"
                    >
                      <span className="text-[15px] font-semibold text-[#202320]">데이터 출처 · 라이선스</span>
                      <ChevronRight className="w-4 h-4 text-[#8c948a]" />
                    </button>

                    <div className="w-full px-4 py-3.5 flex items-center justify-between">
                      <span className="text-[15px] font-semibold text-[#202320]">앱 버전</span>
                      <span className="text-[13px] text-[#8c948a] tabular-nums">1.0.0</span>
                    </div>
                  </div>
                </div>

                {/* 7. 계정 Section (G-03) */}
                <div className="space-y-2">
                  <h3 className="text-[13px] font-semibold text-[#8c948a] px-1">계정</h3>
                  <div className="bg-white rounded-[20px] border border-[#e6e9e5] divide-y divide-[#f4f5f4]">
                    <button
                      type="button"
                      onClick={() => {
                        if (userAccount.isLoggedIn) {
                          setIsAccountSubPageOpen(true);
                        } else {
                          onOpenLoginModal();
                        }
                      }}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#fbfbfb] transition-colors cursor-pointer"
                    >
                      <span className="text-[15px] font-semibold text-[#202320]">연동된 계정</span>
                      <span className="text-[13px] text-[#8c948a] flex items-center gap-1">
                        {userAccount.isLoggedIn ? userAccount.name : '로그인 필요'}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsTrashSubPageOpen(true)}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#fbfbfb] transition-colors cursor-pointer"
                    >
                      <span className="text-[15px] font-semibold text-[#202320]">휴지통</span>
                      <ChevronRight className="w-4 h-4 text-[#8c948a]" />
                    </button>

                    {userAccount.isLoggedIn && (
                      <button
                        type="button"
                        id="btn-mypage-logout"
                        onClick={() => setIsConfirmLogoutOpen(true)}
                        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#fbfbfb] transition-colors cursor-pointer"
                      >
                        <span className="text-[15px] font-semibold text-[#202320]">로그아웃</span>
                      </button>
                    )}

                    <button
                      type="button"
                      id="btn-mypage-delete-account"
                      onClick={() => setIsConfirmDeleteAccountOpen(true)}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#fbfbfb] transition-colors cursor-pointer"
                    >
                      <span className="text-[15px] font-semibold text-[#202320]">계정 삭제</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ================= Confirmation Modals ================= */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-sm w-full p-6 border border-[#e6e9e5] shadow-2xl space-y-4">
            <h3 className="text-[17px] font-bold text-[#202320]">정말 구독을 해지하시겠어요?</h3>
            <p className="text-[13px] text-[#555c54] leading-relaxed">
              해지하셔도 이미 모은 도감은 평생 안전하게 보존되며, 새 생물 등록만 무료 10칸 기준으로 전환됩니다.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 h-12 bg-black text-white rounded-xl text-[14px] font-bold cursor-pointer"
              >
                혜택 유지하기
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                className="flex-1 h-12 bg-[#f4f5f4] text-[#555c54] rounded-xl text-[14px] font-bold cursor-pointer"
              >
                해지하기
              </button>
            </div>
          </div>
        </div>
      )}


      {isConfirmEmptyTrashOpen && (
        <div className="fixed inset-0 z-70 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-xs w-full p-6 border border-[#e6e9e5] shadow-2xl space-y-4 text-center">
            <h3 className="text-[16px] font-bold text-[#202320]">휴지통을 비우시겠습니까?</h3>
            <p className="text-[13px] text-[#555c54] leading-relaxed">
              모든 항목이 영구 삭제되며 복구할 수 없습니다.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmEmptyTrashOpen(false)}
                className="flex-1 h-12 bg-[#f4f5f4] text-[#202320] rounded-xl text-[14px] font-bold cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  onEmptyTrash();
                  setIsConfirmEmptyTrashOpen(false);
                }}
                className="flex-1 h-12 bg-[#ff5100] text-white rounded-xl text-[14px] font-bold cursor-pointer"
              >
                비우기
              </button>
            </div>
          </div>
        </div>
      )}

      {permanentDeleteSpecimenId && (
        <div className="fixed inset-0 z-70 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-xs w-full p-6 border border-[#e6e9e5] shadow-2xl space-y-4 text-center">
            <h3 className="text-[16px] font-bold text-[#202320]">영구적으로 삭제할까요?</h3>
            <p className="text-[13px] text-[#555c54]">선택한 기록이 완전히 삭제되며 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPermanentDeleteSpecimenId(null)}
                className="flex-1 h-12 bg-[#f4f5f4] text-[#202320] rounded-xl text-[14px] font-bold cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (permanentDeleteSpecimenId) onPermanentDeleteSpecimen(permanentDeleteSpecimenId);
                  setPermanentDeleteSpecimenId(null);
                }}
                className="flex-1 h-12 bg-[#ff5100] text-white rounded-xl text-[14px] font-bold cursor-pointer"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmLogoutOpen && (
        <div className="fixed inset-0 z-70 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-xs w-full p-6 border border-[#e6e9e5] shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f4f5f4] text-[#202320] flex items-center justify-center mx-auto">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#202320]">로그아웃 하시겠습니까?</h3>
              <p className="text-[12px] text-[#555c54] mt-1.5 leading-relaxed">
                기존 관찰 기록은 기기에 안전하게 보존됩니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmLogoutOpen(false)}
                className="flex-1 h-12 bg-[#f4f5f4] text-[#202320] rounded-xl text-[14px] font-bold cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmLogoutOpen(false);
                  if (onLogout) onLogout();
                }}
                className="flex-1 h-12 bg-black text-white rounded-xl text-[14px] font-bold cursor-pointer"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmDeleteAccountOpen && (
        <div className="fixed inset-0 z-70 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-xs w-full p-6 border border-[#e6e9e5] shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#fff1eb] text-[#ff5100] flex items-center justify-center mx-auto">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#202320]">정말 회원 탈퇴하시겠습니까?</h3>
              <p className="text-[12px] text-[#555c54] mt-1.5 leading-relaxed">
                모든 도감 및 계정 정보가 영구 삭제되며 복구할 수 없습니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteAccountOpen(false)}
                className="flex-1 h-12 bg-[#f4f5f4] text-[#202320] rounded-xl text-[14px] font-bold cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmDeleteAccountOpen(false);
                  if (onDeleteAccount) onDeleteAccount();
                }}
                className="flex-1 h-12 bg-[#ff5100] text-white rounded-xl text-[14px] font-bold cursor-pointer"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}
      {isConfirmAdultTransitionOpen && (
        <div className="fixed inset-0 z-70 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[28px] sm:rounded-[24px] max-w-sm w-full p-6 border border-[#e6e9e5] shadow-2xl space-y-4">
            {adultTransitionStep === 'confirm' ? (
              <>
                <div className="w-12 h-12 rounded-full bg-[#f4fbdd] border border-[#c4eb43] text-[#6d8911] flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-center space-y-1.5">
                  <h3 className="text-[17px] font-bold text-[#202320]">만 14세가 되었나요?</h3>
                  <p className="text-[13px] text-[#555c54] leading-relaxed">
                    약관에 다시 동의하면 외부 공유, 탐험맵 메모·댓글·하트, 친구 초대, 랭킹 공개 기능이 열려요.
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsConfirmAdultTransitionOpen(false)}
                    className="flex-1 h-12 bg-[#f4f5f4] text-[#202320] rounded-xl text-[14px] font-bold cursor-pointer"
                  >
                    나중에
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdultTransitionStep('reconsent')}
                    className="flex-1 h-12 bg-black text-white rounded-xl text-[14px] font-bold cursor-pointer"
                  >
                    약관 동의하기
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <h3 className="text-[17px] font-bold text-[#202320]">만 14세 이상 약관 재동의</h3>
                  <p className="text-[12px] text-[#8c948a]">
                    일반 계정 전환을 위해 아래 필수 약관에 동의해 주세요.
                  </p>
                </div>

                <div className="bg-[#fbfbfb] rounded-2xl border border-[#e6e9e5] divide-y divide-[#f4f5f4]">
                  {[
                    {
                      checked: reconsentTerms,
                      onChange: () => setReconsentTerms((v) => !v),
                      label: '[필수] 서비스 이용약관 동의',
                    },
                    {
                      checked: reconsentPrivacy,
                      onChange: () => setReconsentPrivacy((v) => !v),
                      label: '[필수] 개인정보 처리방침 동의',
                    },
                    {
                      checked: reconsentCommunity,
                      onChange: () => setReconsentCommunity((v) => !v),
                      label: '[필수] 커뮤니티 · 공유 이용 기준 동의',
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onChange}
                      className="w-full px-3.5 py-3 flex items-center gap-3 text-left cursor-pointer"
                    >
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          item.checked ? 'bg-black text-white' : 'border border-[#d2d7d1] bg-white'
                        }`}
                      >
                        {item.checked && <Check className="w-3.5 h-3.5" />}
                      </span>
                      <span className="text-[13px] font-semibold text-[#202320]">{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAdultTransitionStep('confirm')}
                    className="flex-1 h-12 bg-[#f4f5f4] text-[#202320] rounded-xl text-[14px] font-bold cursor-pointer"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    disabled={!(reconsentTerms && reconsentPrivacy && reconsentCommunity)}
                    onClick={() => {
                      if (onUpdateAccount) {
                        onUpdateAccount({
                          isUnder14: false,
                          ageGroup: 'adult_or_teen14',
                          guardianConsentPending: false,
                        });
                      }
                      setIsConfirmAdultTransitionOpen(false);
                      onShowToast('일반 계정(만 14세 이상)으로 전환되었습니다.');
                    }}
                    className="flex-1 h-12 bg-black disabled:bg-[#d2d7d1] text-white rounded-xl text-[14px] font-bold cursor-pointer transition-colors"
                  >
                    동의하고 제한 해제
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {legalDocType && (
        <div className="fixed inset-0 z-70 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-sm w-full p-6 border border-[#e6e9e5] shadow-2xl space-y-4">
            <h3 className="text-[16px] font-bold text-[#202320]">
              {legalDocType === 'terms' ? '서비스 이용약관' : '개인정보 처리방침'}
            </h3>
            <p className="text-[13px] text-[#555c54] leading-relaxed">
              {legalDocType === 'terms'
                ? '모아로그는 자연 관찰과 생태 기록 공유를 위한 도감 서비스이며, 보호종 및 서식지 안전 수칙을 준수합니다.'
                : '업로드된 현장 사진의 위치 메타데이터(EXIF)는 저장 전 자동 제거되며, 보호종 위치는 광역 권역으로 보호됩니다.'}
            </p>
            <button
              type="button"
              onClick={() => setLegalDocType(null)}
              className="w-full h-12 bg-black text-white rounded-xl text-[14px] font-bold cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <DataSourcesModal
        isOpen={isDataSourcesOpen}
        onClose={() => setIsDataSourcesOpen(false)}
      />
    </div>
  );
};
