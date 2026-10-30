import React, { useState, useEffect, useRef } from 'react';
import { Specimen, UserStats, Observation, NaturalistPersona, UserAccount, LoginOptions } from './types';
import { EXAMPLE_SPECIMENS } from './data/exampleSpecimens';
import { NATURALIST_PERSONAS } from './data/hotspots';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { ArchiveView } from './components/ArchiveView';
import { LensView } from './components/LensView';
import { FieldMapView } from './components/FieldMapView';
import { DetailView } from './components/DetailView';
import { DetailErrorBoundary } from './components/DetailErrorBoundary';
import { MyPageModal } from './components/MyPageModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { LoginModal } from './components/LoginModal';
import { OnboardingModal } from './components/OnboardingModal';
import { HotspotGuideModal } from './components/HotspotGuideModal';
import { ExportCardModal } from './components/ExportCardModal';
import { ExplorerQuestModal } from './components/ExplorerQuestModal';
import { AttendanceRetentionModal } from './components/AttendanceRetentionModal';
import { Toast } from './components/Toast';
import { GUEST_ACCOUNT } from './utils/auth';
import {
  loadSession,
  saveSession,
  loadOwnerData,
  saveOwnerData,
  removeOwnerData,
  ownerIdOf,
  migrateLegacyStorage,
} from './utils/storage';

const DEFAULT_USER_STATS: UserStats = {
  freeScans: 10,
  isProUser: false,
  planType: 'free',
  streakDays: 0,
  exploredHabitats: [],
  totalScans: 0,
  soundEnabled: true,
  hapticsEnabled: true,
  highResCloudSync: true,
  pushDiscoveryAlerts: true,
  homeCity: '서울',
  taxonomyDisplayMode: 'common_first',
  photoQuality: 'original',
  unitSystem: 'metric',
  viewJournalMode: true,
  language: 'ko',
  showEnglishNameWithLocal: true,
  badges: [],
  exp: 0,
};

const CURRENT_STORAGE_VERSION = 'moalog_v7';
const FREE_SLOT_LIMIT = 10; // 무료 도감 칸 (로그인 계정 기준)

// 구버전 단일 키 데이터를 계정별 키로 옮깁니다. 사용자 데이터는 지우지 않습니다.
if (typeof window !== 'undefined') {
  migrateLegacyStorage(CURRENT_STORAGE_VERSION);
}

// 앱 시작 시점의 세션과 해당 계정(또는 게스트) 데이터
const INITIAL_SESSION = loadSession();
const INITIAL_OWNER_DATA = loadOwnerData(ownerIdOf(INITIAL_SESSION));

// 게스트/초기화 상태: 도감은 비워 둡니다. 예시 60종은 로그인 시에만 채웁니다.
const createDefaultSpecimens = (): Specimen[] => [];

// 예시 항목 칸 규칙: 앞 10종만 무료 칸(집계)을 차지하고 나머지는 미수집. 로그인·새로고침 복원 모두 이 함수를 거칩니다.
const normalizeExampleSlots = (list: Specimen[]): Specimen[] =>
  list.map((s) =>
    s.id.startsWith('ex-') && !s.isDeleted
      ? { ...s, isCollected: Number(s.id.slice(3)) <= FREE_SLOT_LIMIT, isPending: false }
      : s
  );

export default function App() {
  // Navigation tab state (3 tabs: 'archive' | 'lens' | 'map')
  const [currentTab, setCurrentTab] = useState<'archive' | 'lens' | 'map'>('archive');

  // Specimen collection state with local storage fallback
  const [specimens, setSpecimens] = useState<Specimen[]>(() =>
    INITIAL_OWNER_DATA ? normalizeExampleSlots(INITIAL_OWNER_DATA.specimens) : createDefaultSpecimens()
  );

  // User profile & stats
  const [userStats, setUserStats] = useState<UserStats>(() =>
    INITIAL_OWNER_DATA
      ? { ...DEFAULT_USER_STATS, ...INITIAL_OWNER_DATA.userStats, badges: INITIAL_OWNER_DATA.userStats.badges || [] }
      : DEFAULT_USER_STATS
  );

  // 로그인 세션 (로그아웃·탈퇴 전까지 유지). 세션이 없으면 게스트
  const [userAccount, setUserAccount] = useState<UserAccount>(INITIAL_SESSION);

  // Modals & overlay states
  const [selectedSpecimen, setSelectedSpecimen] = useState<Specimen | null>(null);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [isSubscriptionOpen, setSubscriptionOpenRaw] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  // 게스트가 결제를 시도하면 로그인 후 결제 화면으로 이어가기 위한 플래그
  const [pendingPaywall, setPendingPaywall] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 이용권은 계정에 연결되므로 게스트는 로그인 후에만 결제 화면을 엽니다.
  const setIsSubscriptionOpen = (open: boolean) => {
    if (open && !userAccount.isLoggedIn) {
      setPendingPaywall(true);
      setIsLoginOpen(true);
      return;
    }
    setSubscriptionOpenRaw(open);
  };
  const [isHotspotsOpen, setIsHotspotsOpen] = useState(false);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [isGlobalExportCardOpen, setIsGlobalExportCardOpen] = useState(false);
  const [globalExportSpecimen, setGlobalExportSpecimen] = useState<Specimen | null>(null);
  const [globalExportMode, setGlobalExportMode] = useState<'specimen' | 'summary'>('specimen');

  const handleOpenExportCard = (sp?: Specimen, mode?: 'specimen' | 'summary') => {
    setGlobalExportSpecimen(sp || null);
    setGlobalExportMode(mode || (sp ? 'specimen' : 'summary'));
    setIsGlobalExportCardOpen(true);
  };

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    try {
      return !localStorage.getItem('moalog_onboarded');
    } catch {
      return false;
    }
  });
  const [onboardingInitialStep, setOnboardingInitialStep] = useState<'splash' | 'preview'>('splash');
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  // 1일차 팝업: 등록 시 대기 표시만 하고, 메인 복귀 시 세션당 1회 노출
  const pendingAttendanceRef = useRef(false);
  const attendanceShownRef = useRef(false);

  useEffect(() => {
    if (currentTab !== 'archive') return;
    if (!pendingAttendanceRef.current || attendanceShownRef.current) return;
    pendingAttendanceRef.current = false;
    attendanceShownRef.current = true;
    setIsAttendanceModalOpen(true);
  }, [currentTab]);

  // Search & Taxonomy breadcrumb filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [taxonomyFilter, setTaxonomyFilter] = useState<string | null>(null);

  // Notifications & micro interactions
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasNewStickerNotice, setHasNewStickerNotice] = useState(false);

  // 세션은 계정 정보만 저장하고, 도감/통계는 현재 계정(또는 게스트) 키에 저장합니다.
  useEffect(() => {
    saveSession(userAccount);
  }, [userAccount]);

  useEffect(() => {
    saveOwnerData(ownerIdOf(userAccount), { specimens, userStats });
  }, [specimens, userStats, userAccount]);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3000);
  };

  // Specimen Collection Handler from Lens
  const handleCollectSpecimen = (newSpecimen: Specimen) => {
    const currentCollected = specimens.filter((s) => s.isCollected && !s.isPending);
    const existingIdx = specimens.findIndex((s) => s.id === newSpecimen.id || s.koreanName === newSpecimen.koreanName);

    // FREE USER 10-SLOT LIMIT CHECK
    if (!userStats.isProUser && currentCollected.length >= FREE_SLOT_LIMIT && existingIdx < 0 && !newSpecimen.isPending) {
      // 칸 제한 안내는 요금제 화면에서 처리합니다 (토스트만 띄우고 끝내지 않음)
      setIsSubscriptionOpen(true);
      return;
    }

    setSpecimens((prev) => {
      const idx = prev.findIndex((s) => s.id === newSpecimen.id || s.koreanName === newSpecimen.koreanName);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newSpecimen;
        return updated;
      }
      return [newSpecimen, ...prev];
    });

    if (!newSpecimen.isPending) {
      setHasNewStickerNotice(true);
      showToast(`'${newSpecimen.koreanName}' 도감에 등록되었습니다.`);
      // 1일차 방문 팝업은 등록 직후가 아니라, 메인(도감) 탭으로 돌아올 때 세션당 1회만 띄웁니다.
      pendingAttendanceRef.current = true;
    } else {
      showToast(`'${newSpecimen.koreanName}' 임시 보관함에 저장되었습니다.`);
    }

    // Deduct scan count if not pro
    setUserStats((prev) => ({
      ...prev,
      totalScans: prev.totalScans + 1,
    }));
  };

  // Update Specimen (e.g. Confirm pending, reclassify, update notes)
  const handleUpdateSpecimen = (updated: Specimen) => {
    setSpecimens((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setSelectedSpecimen(updated);
    showToast(`'${updated.koreanName}' 정보가 업데이트되었습니다.`);
  };

  const handleDeleteSpecimen = (specimenId: string) => {
    setSpecimens((prev) => 
      prev.map((s) => s.id === specimenId ? { ...s, isDeleted: true, deletedAt: Date.now() } : s)
    );
    setSelectedSpecimen(null);
    showToast('관찰 기록이 휴지통으로 이동되었습니다. (30일 보관)');
  };

  const handleDeleteObservation = (specimenId: string, observationIndex: number) => {
    setSpecimens((prev) =>
      prev.map((s) => {
        if (s.id === specimenId) {
          const obsList = s.observations ? [...s.observations] : [];
          if (obsList.length > 0 && observationIndex >= 0 && observationIndex < obsList.length) {
            obsList.splice(observationIndex, 1);
          }
          const nextOriginal =
            obsList.length > 0
              ? obsList[0].photoUrl || s.originalImage || ''
              : s.originalImage || '';
          const updated: Specimen = {
            ...s,
            observations: obsList,
            originalImage: nextOriginal,
          };
          if (selectedSpecimen?.id === specimenId) {
            setSelectedSpecimen(updated);
          }
          return updated;
        }
        return s;
      })
    );
    showToast('관찰 사진이 삭제되었습니다.');
  };

  const handleRestoreSpecimen = (specimenId: string) => {
    setSpecimens((prev) => 
      prev.map((s) => s.id === specimenId ? { ...s, isDeleted: false, deletedAt: undefined } : s)
    );
    showToast('기록이 복구되었습니다.');
  };

  const handlePermanentDeleteSpecimen = (specimenId: string) => {
    setSpecimens((prev) => prev.filter((s) => s.id !== specimenId));
    showToast('기록이 영구적으로 삭제되었습니다.');
  };

  const handleEmptyTrash = () => {
    setSpecimens((prev) => prev.filter((s) => !s.isDeleted));
    showToast('휴지통이 비워졌습니다.');
  };

  const handleDeleteMultipleSpecimens = (specimenIds: string[]) => {
    setSpecimens((prev) => 
      prev.map((s) => specimenIds.includes(s.id) ? { ...s, isDeleted: true, deletedAt: Date.now() } : s)
    );
    showToast(`${specimenIds.length}개의 기록이 휴지통으로 이동되었습니다.`);
  };

  // Add observation log to existing specimen
  const handleAddObservation = (specimenId: string, observation: Observation) => {
    setSpecimens((prev) =>
      prev.map((s) => {
        if (s.id === specimenId) {
          return {
            ...s,
            observations: [observation, ...(s.observations || [])],
          };
        }
        return s;
      })
    );
    showToast('새로운 관찰 기록이 추가되었습니다.');
  };

  // Taxonomy breadcrumb click handler
  const handleSelectTaxonomyFilter = (taxonName: string) => {
    setSelectedSpecimen(null);
    setTaxonomyFilter(taxonName);
    setCurrentTab('archive');
  };

  const handleCompleteOnboarding = (
    selectedPersona?: NaturalistPersona,
    firstSpecimen?: Specimen
  ) => {
    try {
      localStorage.setItem('moalog_onboarded', 'true');
    } catch {}
    if (selectedPersona) {
      setUserStats((prev) => ({ ...prev, persona: selectedPersona }));
      showToast(`'${NATURALIST_PERSONAS[selectedPersona]?.title || '관찰자'}' 성향 데이터가 정상 설정되었습니다.`);
    }
    // 로그인 상태에서는 체험 생물을 기존 도감에 넣지 않습니다. (회원은 handleLoginSuccess 에서 처리)
    // 가입 없이 둔러보기는 도감 칸을 쓰지 않으므로 체험 생물을 넣지 않습니다.
    setIsOnboardingOpen(false);
  };

  // 로그인 확정 처리 (모달·온보딩 공통). 이용권(Pro)은 결제로만 부여합니다.
  const handleLoginSuccess = (acc: UserAccount, opts?: LoginOptions) => {
    const saved = loadOwnerData(ownerIdOf(acc));

    setIsLoginOpen(false);
    setUserAccount(acc);
    // 저장(가입) 중에는 약관 단계를 이어가야 하므로 온보딩을 닫지 않습니다.
    if (opts?.closeOnboarding !== false) {
      try {
        localStorage.setItem('moalog_onboarded', 'true');
      } catch {}
      setIsOnboardingOpen(false);
    }

    if (saved) {
      // 기존 회원: 저장된 도감과 통계를 그대로 불러옵니다. (게스트 체험 기록은 버립니다)
      // 저장본에 없는 예시 60종은 로그인할 때마다 채웁니다. (삭제된 예시는 isDeleted 로 남아 있어 다시 붙지 않음)
      const missingExamples = EXAMPLE_SPECIMENS.filter(
        (ex) => !saved.specimens.some((s) => s.id === ex.id || s.koreanName === ex.koreanName)
      );
      const migrated = normalizeExampleSlots(saved.specimens);
      setSpecimens([...migrated, ...missingExamples]);
      setUserStats({
        ...DEFAULT_USER_STATS,
        ...saved.userStats,
        badges: saved.userStats.badges || [],
      });
      showToast(`${acc.name}님, 다시 오신 걸 환영해요. 내 도감을 불러왔어요.`);
    } else {
      // 신규 가입: 게스트 상태를 이어받고, 체험으로 포착한 생물을 빈 칸에 등록합니다.
      const first = opts?.firstSpecimen;
      // 예시 60종을 함께 채웁니다. 앞 10종만 무료 칸을 차지하고 나머지는 미수집입니다.
      const examples = EXAMPLE_SPECIMENS.filter(
        (ex) => !specimens.some((s) => s.id === ex.id || s.koreanName === ex.koreanName)
      );
      const examplesSlots = first ? FREE_SLOT_LIMIT - 1 : FREE_SLOT_LIMIT;
      let next = [...specimens, ...examples].map((s) => (s.id.startsWith('ex-') ? { ...s, isCollected: Number(s.id.slice(3)) <= examplesSlots, isPending: false } : s));
      if (first) {
        const matches = (s: Specimen) => s.id === first.id || s.koreanName === first.koreanName;
        next = next.some(matches)
          ? next.map((s) => (matches(s) ? { ...s, ...first, isCollected: true, isPending: false } : s))
          : [{ ...first, isCollected: true, isPending: false }, ...next];
      }
      setSpecimens(next);
      setUserStats((prev) => ({
        ...prev,
        isProUser: false,
        planType: 'free',
        subscribedAt: undefined,
        freeScans: FREE_SLOT_LIMIT,
        persona: opts?.persona ?? prev.persona,
      }));
      showToast(`가입이 완료되었어요. 무료 도감 ${FREE_SLOT_LIMIT}칸이 열렸습니다.`);
    }

    if (pendingPaywall) {
      setPendingPaywall(false);
      setSubscriptionOpenRaw(true);
    }
  };

  // 게스트 세션으로 전환하면서 도감/통계도 게스트 데이터로 함께 바꿉니다.
  // (세션만 바꾸면 이전 계정의 도감이 게스트 키에 잘못 저장될 수 있어서 한 번에 처리)
  const switchToGuestState = () => {
    const guestData = loadOwnerData('guest');
    setUserAccount(GUEST_ACCOUNT);
    setSpecimens(guestData ? guestData.specimens : createDefaultSpecimens());
    setUserStats(
      guestData
        ? { ...DEFAULT_USER_STATS, ...guestData.userStats, badges: guestData.userStats.badges || [] }
        : DEFAULT_USER_STATS
    );
    setSelectedSpecimen(null);
    setIsMyPageOpen(false);
    setOnboardingInitialStep('preview');
    setIsOnboardingOpen(true);
  };

  // 로그아웃: 세션만 해제하고 계정 데이터는 보존합니다. 첫 화면(preview)으로 이동합니다.
  const handleLogout = () => {
    switchToGuestState();
    showToast('로그아웃되었어요. 기록은 이 기기에 그대로 보관돼요.');
  };

  // 탈퇴: 현재 계정 데이터만 삭제합니다. 앱 설정(카메라 등)은 유지합니다.
  const handleDeleteAccount = () => {
    if (userAccount.isLoggedIn && userAccount.id) {
      removeOwnerData(userAccount.id);
    }
    // 게스트 전환 시 옆에 남은 이전 상태가 되살아나지 않도록 게스트 저장본도 함께 지웁니다.
    removeOwnerData('guest');
    switchToGuestState();
    showToast('회원 탈퇴가 완료되었어요. 이 계정의 도감 기록이 삭제되었습니다.');
  };

  const rawActiveSpecimens = specimens.filter((s) => !s.isDeleted);
  const activeSpecimens = rawActiveSpecimens;
  const collectedCount = activeSpecimens.filter((s) => s.isCollected && !s.isPending).length;
  const totalCount = activeSpecimens.length;
  const pendingCount = activeSpecimens.filter((s) => s.isPending).length;

  return (
    <div className={`relative ${currentTab === 'map' || currentTab === 'lens' ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'} bg-[#F5F5F7] text-stone-900 flex flex-col font-sans antialiased select-none`}>
      {/* Toast Notification */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      {/* Global Top Header: ONLY on 'archive' tab, completely removed from 'lens' and 'map' */}
      {currentTab === 'archive' && (
        <Header
          collectedCount={collectedCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMyPage={() => setIsMyPageOpen(true)}
          onOpenSubscriptionModal={() => setIsSubscriptionOpen(true)}
          userStats={userStats}
        />
      )}

      {/* Main 3-Tab View Contents */}
      <main className={`flex-1 relative ${currentTab === 'map' || currentTab === 'lens' ? 'h-full w-full overflow-hidden' : ''}`}>
        {currentTab === 'archive' && (
          <ArchiveView
            specimens={activeSpecimens}
            pendingSpecimens={activeSpecimens.filter((s) => s.isPending)}
            searchQuery={searchQuery}
            onSelectSpecimen={(sp) => setSelectedSpecimen(sp)}
            onDeleteMultipleSpecimens={handleDeleteMultipleSpecimens}
            onOpenLens={() => setCurrentTab('lens')}
            filterTaxonomy={taxonomyFilter}
            onClearTaxonomyFilter={() => setTaxonomyFilter(null)}
            onOpenHotspots={() => setIsHotspotsOpen(true)}
            userStats={userStats}
            onOpenMyPage={() => setIsMyPageOpen(true)}
            onUpdatePersona={(newPersona) =>
              setUserStats((prev) => ({ ...prev, persona: newPersona }))
            }
            onOpenQuestModal={() => setIsQuestModalOpen(true)}
            onOpenSubscriptionModal={() => setIsSubscriptionOpen(true)}
            userAccount={userAccount}
            onOpenLoginModal={() => setIsLoginOpen(true)}
          />
        )}

        {currentTab === 'lens' && (
          <LensView
            onCollectSpecimen={handleCollectSpecimen}
            existingSpecimens={activeSpecimens}
            freeScansRemaining={userStats.freeScans}
            isProUser={userStats.isProUser}
            currentPersona={userStats.persona || 'general'}
            onNavigateToArchive={() => {
              setHasNewStickerNotice(false);
              setCurrentTab('archive');
            }}
            onOpenPaywall={() => setIsSubscriptionOpen(true)}
          />
        )}

        {currentTab === 'map' && (
          <FieldMapView
            specimens={activeSpecimens.filter((s) => !s.isPending)}
            userStats={userStats}
            onUpdatePersona={(newPersona) => setUserStats((prev) => ({ ...prev, persona: newPersona }))}
            onSelectSpecimen={(sp) => setSelectedSpecimen(sp)}
            onOpenLens={() => setCurrentTab('lens')}
            onOpenExportCard={handleOpenExportCard}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isProUser={userStats.isProUser}
            onOpenPaywall={() => setIsSubscriptionOpen(true)}
          />
        )}
      </main>

      {/* Global 3-Tab Bottom GNB */}
      {currentTab !== 'lens' && (
        <Navigation
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'archive') setHasNewStickerNotice(false);
            setCurrentTab(tab);
          }}
          hasNewStickerNotice={hasNewStickerNotice}
          pendingCount={pendingCount}
        />
      )}

      {/* Encyclopedia Detail View Sheet Modal */}
      {selectedSpecimen && (
        <DetailErrorBoundary onClose={() => setSelectedSpecimen(null)}>
        <DetailView
          specimen={selectedSpecimen}
          allSpecimens={specimens}
          currentPersona={userStats.persona || 'general'}
          userStats={userStats}
          onClose={() => setSelectedSpecimen(null)}
          onSelectTaxonomyFilter={handleSelectTaxonomyFilter}
          onAddObservation={handleAddObservation}
          onUpdateSpecimen={handleUpdateSpecimen}
          onDeleteSpecimen={handleDeleteSpecimen}
          onDeleteObservation={handleDeleteObservation}
          onOpenExportCard={handleOpenExportCard}
          onOpenSubscriptionModal={() => setIsSubscriptionOpen(true)}
          onOpenLens={() => {
            setSelectedSpecimen(null);
            setCurrentTab('lens');
          }}
        />
        </DetailErrorBoundary>

      )}

      {/* My Page & Settings Modal */}
      {isMyPageOpen && (
        <MyPageModal
          userStats={userStats}
          onUpdateStats={(newStats) => setUserStats((prev) => ({ ...prev, ...newStats }))}
          onClose={() => setIsMyPageOpen(false)}
          collectedCount={collectedCount}
          totalCount={totalCount}
          onShowToast={showToast}
          specimens={specimens}
          onRestoreSpecimen={handleRestoreSpecimen}
          onPermanentDeleteSpecimen={handlePermanentDeleteSpecimen}
          onEmptyTrash={handleEmptyTrash}
          userAccount={userAccount}
          onOpenLoginModal={() => setIsLoginOpen(true)}
          onOpenSubscriptionModal={() => setIsSubscriptionOpen(true)}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      {/* Dedicated Subscription & In-App Purchase Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        userStats={userStats}
        collectedCount={collectedCount}
        freeSlotLimit={FREE_SLOT_LIMIT}
        onSubscribe={(planType) => {
          setUserStats((prev) => ({
            ...prev,
            isProUser: planType !== 'free',
            planType: planType,
            subscribedAt: planType === 'monthly' || planType === 'yearly' ? new Date().toISOString() : undefined,
          }));
        }}
        onShowToast={showToast}
      />

      {/* Social Login / Auth Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => {
          setIsLoginOpen(false);
          setPendingPaywall(false);
        }}
        onLoginSuccess={(acc, opts) => handleLoginSuccess(acc, opts)}
      />

      {/* Onboarding Guide & Welcome Modal */}
      {isOnboardingOpen && (
        <OnboardingModal
          onComplete={handleCompleteOnboarding}
          onLoginSuccess={(acc, opts) => handleLoginSuccess(acc, opts)}
          userAccount={userAccount}
          initialPersona={userStats.persona || 'general'}
          initialStep={onboardingInitialStep}
        />
      )}

      {/* Hotspots & Expert Persona Guide Modal */}
      {isHotspotsOpen && (
        <HotspotGuideModal
          isOpen={isHotspotsOpen}
          onClose={() => setIsHotspotsOpen(false)}
          specimens={specimens}
          onSelectSpecimen={(sp) => setSelectedSpecimen(sp)}
          onOpenLens={() => {
            setIsHotspotsOpen(false);
            setCurrentTab('lens');
          }}
        />
      )}

      {/* Samsung Health Style Glassmorphism Eco Card Modal */}
      <ExportCardModal
        isOpen={isGlobalExportCardOpen}
        onClose={() => setIsGlobalExportCardOpen(false)}
        specimen={globalExportSpecimen}
        specimens={specimens}
        userStats={userStats}
        initialMode={globalExportMode}
        onShowToast={showToast}
      />

      {/* Explorer Quest & Level Modal */}
      <ExplorerQuestModal
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        userStats={userStats}
        specimens={specimens}
      />

      {/* FLOW 1-5 STEP 5: 1일 차 방문 (리텐션 팝업) */}
      <AttendanceRetentionModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        onOpenLens={() => {
          setIsAttendanceModalOpen(false);
          setCurrentTab('lens');
        }}
      />
    </div>
  );
}
