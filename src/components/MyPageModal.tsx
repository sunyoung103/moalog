import React, { useState } from 'react';
import { UserStats, NaturalistPersona, Specimen, UserAccount } from '../types';
import { NATURALIST_PERSONAS } from '../data/hotspots';
import {
  X,
  Sparkles,
  Crown,
  ChevronRight,
  ArrowLeft,
  Check,
  MapPin,
  Bell,
  Shield,
  User,
  LogOut,
  UserX,
  Info,
  CreditCard,
  Lock,
  CheckCircle2,
  Trash2,
  RefreshCw,
  LogIn,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

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
  onOpenLoginModal: () => void;
  onOpenSubscriptionModal: () => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
}

export const MyPageModal: React.FC<MyPageModalProps> = ({
  userStats,
  onUpdateStats,
  onClose,
  collectedCount,
  totalCount,
  onShowToast,
  specimens,
  onRestoreSpecimen,
  onPermanentDeleteSpecimen,
  onEmptyTrash,
  userAccount,
  onOpenLoginModal,
  onOpenSubscriptionModal,
  onLogout,
  onDeleteAccount,
}) => {
  const [isPersonaSubPageOpen, setIsPersonaSubPageOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isTrashSubPageOpen, setIsTrashSubPageOpen] = useState(false);

  // Logout & Delete Account confirm modals
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false);
  const [isConfirmDeleteAccountOpen, setIsConfirmDeleteAccountOpen] = useState(false);

  // Trash modals
  const [isConfirmEmptyTrashOpen, setIsConfirmEmptyTrashOpen] = useState(false);
  const [permanentDeleteSpecimenId, setPermanentDeleteSpecimenId] = useState<string | null>(null);

  // Multi-step subscription cancellation (구독 해지 방어 뎁스)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const currentPersonaKey = userStats.persona || 'general';
  const currentPersona = NATURALIST_PERSONAS[currentPersonaKey];

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

  return (
    <div
      id="mypage-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#F6F8F6] text-stone-900 flex flex-col p-4 sm:p-6 overflow-hidden select-none"
    >
      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ================= [SUB-PAGE] Persona Selection Depth ================= */}
          {isPersonaSubPageOpen ? (
            <motion.div
              key="persona-subpage"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full flex-1 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPersonaSubPageOpen(false)}
                  className="flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 px-2 py-1 rounded-xl hover:bg-stone-100 transition-colors -ml-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>설정으로 돌아가기</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-none">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">관찰자 성향 선택</h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    선택한 성향에 맞춰 생태 가이드의 핫스팟 및 추천 종이 자동 구성됩니다.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {(Object.values(NATURALIST_PERSONAS) as any[]).map((persona) => {
                    const isSelected = currentPersonaKey === persona.id;

                    return (
                      <button
                        key={persona.id}
                        type="button"
                        onClick={() => handleSelectPersona(persona.id as NaturalistPersona)}
                        className={`p-4 rounded-2xl text-left flex items-start justify-between transition-all ${
                          isSelected
                            ? 'bg-stone-200 font-bold shadow-sm'
                            : 'bg-white/85 hover:bg-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {persona.icon === 'Feather'
                                ? '🪶'
                                : persona.icon === 'Leaf'
                                ? '🌿'
                                : persona.icon === 'Bug'
                                ? '🐛'
                                : persona.icon === 'Footprints'
                                ? '🐾'
                                : '🧭'}
                            </span>
                            <span className="text-sm font-bold text-stone-900">
                              {persona.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 leading-relaxed">
                            {persona.description}
                          </p>
                        </div>

                        <div className="shrink-0 mt-1">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3px]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-stone-100" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : isTrashSubPageOpen ? (
            /* ================= [SUB-PAGE] Trash Bin ================= */
            <motion.div
              key="trash-subpage"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full flex-1 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTrashSubPageOpen(false)}
                  className="flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 px-2 py-1 rounded-xl hover:bg-stone-100 transition-colors -ml-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>설정으로 돌아가기</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-none">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-stone-500" />
                      휴지통
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      삭제된 기록은 30일 후 영구적으로 삭제됩니다.
                    </p>
                  </div>
                  {specimens.filter((s) => s.isDeleted).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsConfirmEmptyTrashOpen(true)}
                      className="text-[11px] font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      휴지통 비우기
                    </button>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  {specimens.filter((s) => s.isDeleted).length === 0 ? (
                    <div className="py-12 text-center text-stone-400 text-xs">
                      휴지통이 비어 있습니다.
                    </div>
                  ) : (
                    specimens
                      .filter((s) => s.isDeleted)
                      .map((sp) => {
                        const daysLeft = sp.deletedAt
                          ? Math.max(0, 30 - Math.floor((Date.now() - sp.deletedAt) / 86400000))
                          : 30;

                        return (
                          <div
                            key={sp.id}
                            className="p-3 rounded-2xl bg-white flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                                {sp.stickerImage || sp.originalImage ? (
                                  <img src={sp.stickerImage || sp.originalImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-stone-300">?</div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-stone-800 truncate">{sp.koreanName}</h4>
                                <p className="text-[10px] text-stone-500 truncate">{sp.date} · {sp.locationCoord?.name || '위치 미상'}</p>
                                <p className="text-[10px] font-semibold text-red-500 mt-0.5">{daysLeft}일 후 영구 삭제</p>
                              </div>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => onRestoreSpecimen(sp.id)}
                                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-emerald-50 text-stone-600 hover:text-emerald-600 flex items-center justify-center transition-colors"
                                title="복구"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPermanentDeleteSpecimenId(sp.id)}
                                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-500 flex items-center justify-center transition-colors"
                                title="영구 삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* ================= [MAIN PAGE] Settings & Membership ================= */
            <motion.div
              key="main-settings"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 30, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full flex-1 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 shrink-0">
                <div>
                  <h2 className="text-base font-bold text-stone-900">마이 — 이용권 구매 · 설정</h2>
                  <p className="text-[11px] text-stone-500">계정 관리 및 이용권 업그레이드</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 py-4 flex-1 overflow-y-auto pr-1 scrollbar-none">
                {/* 1. Subscription / Pro Membership */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-stone-900">이용권 구매</h3>
                    <span className="text-[10px] font-mono font-medium text-stone-500">
                      인앱 결제 · 부가세 포함
                    </span>
                  </div>

                  {!userStats.isProUser ? (
                    <div className="bg-[#202424] text-white rounded-3xl p-4 shadow-md space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5 text-amber-300">
                          <Sparkles className="w-3.5 h-3.5" />
                          무료 체험 구매하기
                        </span>
                        <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full text-stone-100 font-bold">
                          체험판 ({userStats.freeScans}회 남음)
                        </span>
                      </div>

                      <div className="bg-white/10 rounded-2xl p-3 text-[11px] text-stone-300 space-y-1">
                        <p className="font-semibold text-white">• 가입 이후 3회 무료 분석 스캔 체험 가능</p>
                        <p className="text-stone-400">• 가입 후 한달이 지나면 기존의 체험 기록은 소멸될 수 있습니다.</p>
                      </div>

                      <button
                        type="button"
                        id="btn-mypage-open-checkout"
                        onClick={onOpenSubscriptionModal}
                        className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-2xl text-xs font-black transition-all text-center shadow-md flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                        <span>이용권 구매하기 (PRO 업그레이드)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-50 text-amber-950 rounded-2xl p-4 flex flex-col justify-between space-y-3 border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-amber-400/30 flex items-center justify-center text-amber-700 shrink-0 font-bold">
                            <Crown className="w-5 h-5 fill-current" />
                          </div>
                          <div>
                            <p className="font-black text-xs text-amber-950">
                              이용 중인 플랜:{' '}
                              {userStats.planType === 'yearly'
                                ? '연간 정기 구독 (PRO)'
                                : '월간 정기 구독 (PRO)'}
                            </p>
                            <p className="text-[11px] text-amber-850 mt-0.5">
                              {userStats.planType === 'yearly'
                                ? '연 39,000원으로 모든 기능을 무제한 이용 중입니다.'
                                : '매월 4,900원으로 자동 갱신되는 구독 플랜 이용 중입니다.'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full shrink-0">
                          구독 중
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsCancelModalOpen(true)}
                        className="w-full py-2.5 bg-white hover:bg-stone-100 text-stone-700 rounded-xl text-[11px] font-bold transition-colors text-center shadow-2xs border border-stone-200"
                      >
                        무료 플랜으로 전환 (구독 해지)
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Persona Selection Row */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-stone-900 px-1">관찰자 성향 설정</h3>
                  <button
                    type="button"
                    onClick={() => setIsPersonaSubPageOpen(true)}
                    className="w-full bg-white rounded-2xl p-3.5 shadow-xs flex items-center justify-between hover:bg-stone-50/50 transition-all text-left group border border-stone-200/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-xl shrink-0">
                        {currentPersona.icon === 'Feather'
                          ? '🪶'
                          : currentPersona.icon === 'Leaf'
                          ? '🌿'
                          : currentPersona.icon === 'Bug'
                          ? '🐛'
                          : currentPersona.icon === 'Footprints'
                          ? '🐾'
                          : '🧭'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-stone-900">
                            {currentPersona.title}
                          </p>
                          <span className="text-[10px] font-medium bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded">
                            적용 중
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 truncate mt-0.5">
                          {currentPersona.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-stone-400 group-hover:text-stone-700 text-xs font-semibold shrink-0 ml-2">
                      <span>변경</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                </div>

                {/* 3. Settings Sections */}
                <div className="space-y-3">
                  {/* 계정 그룹 (현실적이고 안전한 로그인/연동 상태) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold text-stone-700">계정</h3>
                      {userAccount.isLoggedIn && (
                        <button
                          type="button"
                          onClick={onOpenLoginModal}
                          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800"
                        >
                          계정 전환
                        </button>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl p-3.5 shadow-xs space-y-3 border border-stone-200/60">
                      {userAccount.isLoggedIn ? (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                                {userAccount.name ? userAccount.name.charAt(0) : 'U'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-stone-900 truncate">
                                  {userAccount.name}
                                </p>
                                <p className="text-[10px] text-stone-500 truncate">
                                  {userAccount.email}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              연동됨
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                            <div className="flex items-center gap-2.5">
                              <Shield className="w-4 h-4 text-emerald-600" />
                              <div>
                                <p className="text-xs font-semibold text-stone-800">로그인 방식</p>
                                <p className="text-[10px] text-stone-400">
                                  {userAccount.provider === 'google' && 'Google 소셜 로그인 (OAuth 2.0)'}
                                  {userAccount.provider === 'kakao' && '카카오 간편 로그인'}
                                  {userAccount.provider === 'apple' && 'Apple ID 로그인'}
                                  {userAccount.provider === 'email' && '이메일 인증 로그인'}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              클라우드 동기화 중
                            </span>
                          </div>
                        </>
                      ) : (
                        /* Guest / Logged-out State */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center font-bold text-xs shrink-0">
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-stone-900">게스트 모드</p>
                                <p className="text-[10px] text-amber-600 font-medium">
                                  미로그인 (도감이 기기 로컬에만 보관 중)
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] bg-stone-100 text-stone-500 font-medium px-2 py-0.5 rounded-md">
                              미연동
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={onOpenLoginModal}
                            className="w-full py-2.5 bg-[#202424] hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                          >
                            <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                            <span>소셜 계정 로그인 / 연동하기</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 서비스 그룹 */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-stone-700 px-1">서비스</h3>
                    <div className="bg-white rounded-2xl p-3.5 shadow-xs space-y-3 border border-stone-200/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Bell className="w-4 h-4 text-stone-500" />
                          <div>
                            <p className="text-xs font-semibold text-stone-800">알림</p>
                            <p className="text-[10px] text-stone-400">새로운 서식지 발견 및 탐사 리마인드 푸시</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSetting('hapticsEnabled')}
                          className={`w-10 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 ${
                            userStats.hapticsEnabled
                              ? 'bg-[#202424] justify-end'
                              : 'bg-stone-200 justify-start'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-stone-100">
                        <div className="flex items-center gap-2.5">
                          <Info className="w-4 h-4 text-stone-500" />
                          <div>
                            <p className="text-xs font-semibold text-stone-800">데이터 보관 정책</p>
                            <p className="text-[10px] text-stone-400">개인정보 보호 및 탐사 저널 저장 방침</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsPolicyModalOpen(true)}
                          className="text-[11px] font-semibold text-emerald-700 hover:underline"
                        >
                          보기
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 위치 정보 이용 그룹 */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-stone-700 px-1">위치 정보 이용</h3>
                    <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-stone-200/60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          <div>
                            <p className="text-xs font-semibold text-stone-800">위치 정보 (GPS) 사용</p>
                            <p className="text-[10px] text-stone-400">실시간 탐사 맵 및 촬영 위치 자동 기록</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSetting('soundEnabled')}
                          className={`w-10 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 ${
                            userStats.soundEnabled
                              ? 'bg-[#202424] justify-end'
                              : 'bg-stone-200 justify-start'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 기타 그룹 (휴지통, 로그아웃, 회원 탈퇴, 버전 정보) */}
                  <div className="space-y-1.5 pt-1">
                    <h3 className="text-xs font-bold text-stone-700 px-1">기타</h3>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setIsTrashSubPageOpen(true)}
                        className="w-full py-3 px-4 bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-50 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs transition-colors border border-stone-200/60"
                      >
                        <span className="flex items-center gap-2">
                          <Trash2 className="w-4 h-4 text-stone-400" />
                          <span>휴지통</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-stone-300" />
                      </button>

                      {userAccount.isLoggedIn ? (
                        <button
                          type="button"
                          id="btn-mypage-logout"
                          onClick={() => setIsConfirmLogoutOpen(true)}
                          className="w-full py-3 px-4 bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-50 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs transition-colors border border-stone-200/60"
                        >
                          <span className="flex items-center gap-2">
                            <LogOut className="w-4 h-4 text-stone-400" />
                            <span>로그아웃</span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-stone-300" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          id="btn-mypage-login"
                          onClick={onOpenLoginModal}
                          className="w-full py-3 px-4 bg-white text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50/50 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs transition-colors border border-emerald-200/60"
                        >
                          <span className="flex items-center gap-2">
                            <LogIn className="w-4 h-4 text-emerald-600" />
                            <span>계정 로그인 / 연동</span>
                          </span>
                          <ChevronRight className="w-4 h-4 text-emerald-400" />
                        </button>
                      )}

                      <button
                        type="button"
                        id="btn-mypage-delete-account"
                        onClick={() => setIsConfirmDeleteAccountOpen(true)}
                        className="w-full py-3 px-4 bg-white text-red-500 hover:text-red-600 hover:bg-red-50 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs transition-colors border border-stone-200/60"
                      >
                        <span className="flex items-center gap-2">
                          <UserX className="w-4 h-4 text-red-400" />
                          <span>회원 탈퇴</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-red-200" />
                      </button>

                      <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-stone-400 font-mono">
                        <span>버전 정보</span>
                        <span>v1.0.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ================= [SUBSCRIPTION CANCELLATION RETENTION MODAL] (구독 해지 방어 뎁스) ================= */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-60 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">정말 PRO 혜택을 포기하시겠어요?</h3>
                  <p className="text-[10px] text-stone-500">구독을 해지하시면 아래 혜택이 중단됩니다</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 space-y-2 text-xs text-amber-900">
              <p className="font-bold flex items-center gap-1.5">
                <span>💡</span> 해지 시 손실되는 주요 혜택
              </p>
              <ul className="space-y-1 pl-5 list-disc text-[11px] text-stone-700">
                <li>무제한 생태 도감 스캔 및 AI 자동 분석</li>
                <li>고해상도 압화집 및 내셔널 탐사 프레임 영구 보존</li>
                <li>프리미엄 핫스팟 실시간 가이드 전체 이용권</li>
                <li>AI 생태백과 챗봇 질의응답 기능</li>
              </ul>
            </div>

            {/* ⚠️ Crucial Data Warning */}
            <div className="p-3 bg-red-50 rounded-2xl border border-red-200/80 text-red-900 text-[11px] leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-950">데이터 보관 안내</p>
                <p className="text-red-800 mt-0.5">
                  구독 해지 후 1년 뒤엔 데이터가 삭제되거나 압축될 수 있습니다.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 py-3 bg-[#202424] hover:bg-stone-800 text-white rounded-2xl text-xs font-bold transition-colors shadow-md"
              >
                혜택 유지하기
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl text-xs font-bold transition-colors"
              >
                구독 해지하기
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Policy Modal */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-stone-900">데이터 보관 및 개인정보 보호 방침</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              본 애플리케이션(MOALOG 자연 도감)은 사용자의 소중한 생태 탐사 기록과 저널 데이터를 안전하게 보호하며, 위치 정보 및 관찰 기록은 사용자 기기 및 보안 클라우드에 암호화되어 안전하게 보관됩니다. 구독 해지 후 1년 뒤에는 데이터가 삭제되거나 압축될 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => setIsPolicyModalOpen(false)}
              className="w-full py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* Empty Trash Confirmation Modal */}
      {isConfirmEmptyTrashOpen && (
        <div className="fixed inset-0 z-70 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl space-y-5 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">휴지통을 비우시겠습니까?</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                휴지통의 모든 항목이 영구적으로 삭제되며<br/>
                <span className="font-bold text-red-600">이 작업은 복구할 수 없습니다.</span>
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmEmptyTrashOpen(false)}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-xs font-bold transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  onEmptyTrash();
                  setIsConfirmEmptyTrashOpen(false);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-bold transition-colors shadow-md"
              >
                휴지통 비우기
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Permanent Single Delete Confirmation Modal */}
      {permanentDeleteSpecimenId && (
        <div className="fixed inset-0 z-70 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl space-y-5 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">영구적으로 삭제할까요?</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                선택한 관찰 기록이 완전히 삭제되며<br/>
                <span className="font-bold text-red-600">다시 복구할 수 없습니다.</span>
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPermanentDeleteSpecimenId(null)}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-xs font-bold transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (permanentDeleteSpecimenId) {
                    onPermanentDeleteSpecimen(permanentDeleteSpecimenId);
                  }
                  setPermanentDeleteSpecimenId(null);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-bold transition-colors shadow-md"
              >
                영구 삭제
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isConfirmLogoutOpen && (
        <div className="fixed inset-0 z-70 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl space-y-5 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">로그아웃 하시겠습니까?</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                로그아웃 시 현재 연동된 계정의 동기화가 해제되고 게스트 모드로 전환됩니다.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmLogoutOpen(false)}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-xs font-bold transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmLogoutOpen(false);
                  if (onLogout) onLogout();
                }}
                className="flex-1 py-3 bg-[#202424] hover:bg-stone-800 text-white rounded-2xl text-xs font-bold transition-colors shadow-md"
              >
                로그아웃
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {isConfirmDeleteAccountOpen && (
        <div className="fixed inset-0 z-70 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl space-y-5 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">정말 회원 탈퇴하시겠습니까?</h3>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                모든 수집 도감, AI 분석 데이터, 클라우드 저장본 및 계정 연동 정보가 즉시 영구 삭제되며<br/>
                <span className="font-bold text-red-600">이 작업은 복구할 수 없습니다.</span>
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteAccountOpen(false)}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-xs font-bold transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmDeleteAccountOpen(false);
                  if (onDeleteAccount) onDeleteAccount();
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-bold transition-colors shadow-md"
              >
                회원 탈퇴
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
