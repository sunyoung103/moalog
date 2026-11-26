import React, { useState, useEffect } from 'react';
import { Specimen, UserStats, Observation, NaturalistPersona, UserAccount, CommunityMemo } from './types';
import { INITIAL_SPECIMENS } from './data/defaultSpecimens';
import { NATURALIST_PERSONAS } from './data/hotspots';
import { MAP_COMMUNITY_STORAGE_KEYS, detectProtectedSpecies } from './data/communityMapData';
import { obfuscateCoordinates } from './utils/imagePrivacy';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { ArchiveView } from './components/ArchiveView';
import { LensView } from './components/LensView';
import { FieldMapView } from './components/FieldMapView';
import { DetailView } from './components/DetailView';
import { MyPageModal } from './components/MyPageModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { LoginModal } from './components/LoginModal';
import { OnboardingModal, OnboardingCompletePayload } from './components/OnboardingModal';
import { HotspotGuideModal } from './components/HotspotGuideModal';
import { ExportCardModal } from './components/ExportCardModal';
import { ExplorerQuestModal } from './components/ExplorerQuestModal';
import { AttendanceRetentionModal } from './components/AttendanceRetentionModal';
import { Toast } from './components/Toast';
import { DAILY_NEW_SPECIES_XP_CAP, NEW_SPECIES_XP_REWARD } from './utils/levelPolicy';

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

const DEFAULT_USER_ACCOUNT: UserAccount = {
  isLoggedIn: false,
  email: '',
  name: '게스트',
  provider: 'guest',
};

const CURRENT_STORAGE_VERSION = 'moalog_v7';

// Clear stale cached state if storage version is outdated
if (typeof window !== 'undefined') {
  try {
    const version = localStorage.getItem('moalog_app_version');
    if (version !== CURRENT_STORAGE_VERSION) {
      localStorage.removeItem('moalog_specimens');
      localStorage.removeItem('moalog_user_stats');
      localStorage.removeItem('moalog_user_account');
      localStorage.removeItem('moalog_onboarded');
      localStorage.setItem('moalog_app_version', CURRENT_STORAGE_VERSION);
    }
  } catch {}
}

export default function App() {
  // Navigation tab state (3 tabs: 'archive' | 'lens' | 'map')
  const [currentTab, setCurrentTab] = useState<'archive' | 'lens' | 'map'>('archive');

  // Specimen collection state with local storage fallback
  const [specimens, setSpecimens] = useState<Specimen[]>(() => {
    try {
      const saved = localStorage.getItem('moalog_specimens');
      if (saved) {
        const parsed = JSON.parse(saved) as Specimen[];
        // On resumption, if Kingfisher isn't there, we don't force it if user deleted it, 
        // but for fresh guest start, only Kingfisher should be collected.
        return parsed;
      }
    } catch {}
    // DEFAULT START: Only Kingfisher is collected. Everything else is uncollected.
    return INITIAL_SPECIMENS.map(s => 
      s.id === 'sp-kingfisher-001' ? { ...s, isCollected: true } : { ...s, isCollected: false }
    );
  });

  // User profile & stats
  const [userStats, setUserStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem('moalog_user_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.badges) parsed.badges = [];
        return parsed;
      }
    } catch {}
    return DEFAULT_USER_STATS;
  });

  // User Account state (Defaults to guest mode unless saved in local storage)
  const [userAccount, setUserAccount] = useState<UserAccount>(() => {
    try {
      const saved = localStorage.getItem('moalog_user_account');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_USER_ACCOUNT;
  });

  // Modals & overlay states
  const [selectedSpecimen, setSelectedSpecimen] = useState<Specimen | null>(null);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [isArchiveDetailOpen, setIsArchiveDetailOpen] = useState(false);
  const [openMapSettingsNonce, setOpenMapSettingsNonce] = useState(0);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
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

  // Search & Taxonomy breadcrumb filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [taxonomyFilter, setTaxonomyFilter] = useState<string | null>(null);

  // Notifications & micro interactions
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasNewStickerNotice, setHasNewStickerNotice] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('moalog_specimens', JSON.stringify(specimens));
    } catch {}
  }, [specimens]);

  useEffect(() => {
    try {
      localStorage.setItem('moalog_user_stats', JSON.stringify(userStats));
    } catch {}
  }, [userStats]);

  useEffect(() => {
    try {
      localStorage.setItem('moalog_user_account', JSON.stringify(userAccount));
    } catch {}
  }, [userAccount]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Specimen Collection Handler from Lens
  const handleCollectSpecimen = (
    newSpecimen: Specimen,
    _observation?: Observation,
    options?: { suppressAttendanceModal?: boolean }
  ) => {
    const currentCollected = specimens.filter((s) => s.isCollected && !s.isPending);
    const existingIdx = specimens.findIndex((s) => s.id === newSpecimen.id || s.koreanName === newSpecimen.koreanName);

    // FREE USER 10-SLOT LIMIT CHECK
    if (!userStats.isProUser && currentCollected.length >= 10 && existingIdx < 0 && !newSpecimen.isPending) {
      if (!userAccount.isLoggedIn) {
        showToast('로그인하면 더 많은 생물을 기록할 수 있어요!');
        setIsLoginOpen(true);
        return;
      }
      showToast('무료 도감 10칸이 모두 찼습니다. 이용권을 구독해주세요.');
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
      if (!options?.suppressAttendanceModal) {
        showToast(`'${newSpecimen.koreanName}' 도감에 등록되었습니다.`);
        // Show retention modal ("내일도 도감 등록하고 뱃지 받으세요") on successful specimen registration!
        setTimeout(() => {
          setIsAttendanceModalOpen(true);
        }, 600);
      }
    } else {
      showToast(`'${newSpecimen.koreanName}' 임시 보관함에 저장되었습니다.`);
    }

    // 5-1 XP 정책: 새 종 등록 +30 XP (포착 10 + 새 종 20), 재포착 0 XP, 하루 최대 10종(300 XP)
    const isNewSpeciesDiscovery = !newSpecimen.isPending && existingIdx < 0;
    let earnedXp = 0;
    if (isNewSpeciesDiscovery) {
      const todayKey = new Date().toISOString().slice(0, 10);
      let dailyCount = 0;
      try {
        const stored = JSON.parse(localStorage.getItem('moalog_daily_new_xp') || '{}');
        if (stored.date === todayKey && typeof stored.count === 'number') {
          dailyCount = stored.count;
        }
        if (dailyCount < DAILY_NEW_SPECIES_XP_CAP) {
          earnedXp = NEW_SPECIES_XP_REWARD;
          localStorage.setItem(
            'moalog_daily_new_xp',
            JSON.stringify({ date: todayKey, count: dailyCount + 1 })
          );
        }
      } catch {
        earnedXp = NEW_SPECIES_XP_REWARD;
      }
    }

    setUserStats((prev) => ({
      ...prev,
      freeScans: !prev.isProUser ? Math.max(0, prev.freeScans - 1) : prev.freeScans,
      totalScans: prev.totalScans + 1,
      exp: (prev.exp || 0) + earnedXp,
    }));
  };

  // Update Specimen (e.g. Confirm pending, reclassify, update location/notes)
  const handleUpdateSpecimen = (updated: Specimen) => {
    setSpecimens((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setSelectedSpecimen(updated);

    // Sync any community memos created from this specimen so place & species stay aligned
    try {
      const rawMemos = localStorage.getItem(MAP_COMMUNITY_STORAGE_KEYS.MEMOS);
      if (rawMemos) {
        const parsed: CommunityMemo[] = JSON.parse(rawMemos);
        if (Array.isArray(parsed)) {
          let changed = false;
          const nextMemos = parsed.map((m) => {
            if (m.authorId !== 'me' || m.specimenId !== updated.id) return m;
            const nextPlaceName = updated.locationCoord?.name || m.placeName;
            const isProtected = m.isProtectedSpecies || detectProtectedSpecies(updated.koreanName);
            let nextLat = m.lat;
            let nextLng = m.lng;
            if (typeof updated.locationCoord?.lat === 'number' && typeof updated.locationCoord?.lng === 'number') {
              const masked = obfuscateCoordinates(
                updated.locationCoord.lat,
                updated.locationCoord.lng,
                isProtected
              );
              nextLat = masked.lat;
              nextLng = masked.lng;
            }
            changed = true;
            return {
              ...m,
              speciesKoreanName: updated.koreanName,
              speciesScientificName: updated.scientificName,
              category: updated.category || m.category,
              placeName: nextPlaceName,
              regionLabel: isProtected ? `${nextPlaceName.split(' ')[0]} 광역 권역` : nextPlaceName,
              lat: nextLat,
              lng: nextLng,
              isProtectedSpecies: isProtected,
            };
          });
          if (changed) {
            localStorage.setItem(MAP_COMMUNITY_STORAGE_KEYS.MEMOS, JSON.stringify(nextMemos));
          }
        }
      }
    } catch {}

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

  const handleCompleteOnboarding = (payload?: OnboardingCompletePayload) => {
    try {
      localStorage.setItem('moalog_onboarded', 'true');
    } catch {}

    if (payload?.account) {
      setUserAccount(payload.account);
    }

    if (payload?.isNewSignup) {
      const nextPersona = payload.selectedPersona || 'general';
      setUserStats((prev) => ({
        ...prev,
        isProUser: false,
        planType: 'free',
        freeScans: 10,
        exp: 0,
        badges: [],
        persona: nextPersona,
        preferredLocations: payload.preferredLocations,
        visitFrequency: payload.visitFrequency,
        purposes: payload.purposes,
      }));
      // 신규 가입 완료(A-12) 시 도감은 0 / 10칸 상태로 시작 (A-02d 샘플 카드는 저장하지 않음)
      setSpecimens(INITIAL_SPECIMENS.map((s) => ({ ...s, isCollected: false })));
    } else if (payload?.selectedPersona) {
      setUserStats((prev) => ({ ...prev, persona: payload.selectedPersona }));
      showToast(`'${NATURALIST_PERSONAS[payload.selectedPersona]?.title || '관찰자'}' 성향 데이터가 정상 설정되었습니다.`);
    }

    if (payload?.targetTab) {
      setCurrentTab(payload.targetTab);
    }
    setIsOnboardingOpen(false);
  };

  const handleLoginSuccess = (acc: UserAccount) => {
    setUserAccount(acc);

    // 1. Upgrade user stats & retain exp/scans
    setUserStats((prev) => ({
      ...prev,
      isProUser: true,
      planType: prev.planType === 'free' ? 'yearly' : prev.planType,
      freeScans: 9999,
      exp: Math.max(prev.exp || 0, 500),
      totalScans: Math.max(prev.totalScans || 0, INITIAL_SPECIMENS.length),
    }));

    // 2. Merge guest collected specimens + full preset example collection
    setSpecimens((guestSpecimens) => {
      const guestMap = new Map<string, Specimen>(guestSpecimens.map((s) => [s.id, s]));

      const enrichedPresets: Specimen[] = INITIAL_SPECIMENS.map((preset) => {
        const guestEntry = guestMap.get(preset.id);
        if (guestEntry) {
          return {
            ...preset,
            isCollected: true,
            observations:
              guestEntry.observations && guestEntry.observations.length > 0
                ? guestEntry.observations
                : (preset.observations && preset.observations.length > 0 ? preset.observations : []),
          };
        }
        return {
          ...preset,
          isCollected: true,
        };
      });

      const customGuestSpecimens = guestSpecimens.filter(
        (s) => !INITIAL_SPECIMENS.some((preset) => preset.id === s.id)
      );

      return [...customGuestSpecimens, ...enrichedPresets];
    });

    showToast(
      `${acc.provider === 'google' ? 'Google' : acc.provider === 'apple' ? 'Apple' : 'Kakao'} 계정 연동 완료! 게스트 기록과 전체 예시 도감이 하나로 통합되었습니다.`
    );
  };

  const handleLogout = () => {
    setUserAccount({
      isLoggedIn: false,
      email: '',
      name: '게스트',
      provider: 'guest',
    });
    setUserStats(DEFAULT_USER_STATS);
    // When logging out, we reset to the default state: only Kingfisher collected.
    setSpecimens(INITIAL_SPECIMENS.map(s => s.id === 'sp-kingfisher-001' ? { ...s, isCollected: true } : { ...s, isCollected: false }));
    try {
      localStorage.removeItem('moalog_onboarded');
      localStorage.removeItem('moalog_specimens');
      localStorage.removeItem('moalog_user_stats');
      localStorage.setItem(
        'moalog_user_account',
        JSON.stringify({
          isLoggedIn: false,
          email: '',
          name: '게스트',
          provider: 'guest',
        })
      );
    } catch {}
    setIsMyPageOpen(false);
    setOnboardingInitialStep('preview');
    setIsOnboardingOpen(true);
    showToast('안전하게 로그아웃되었습니다. 첫 화면으로 이동합니다.');
  };

  const handleDeleteAccount = () => {
    try {
      localStorage.clear();
    } catch {}
    setSpecimens(INITIAL_SPECIMENS);
    setUserStats(DEFAULT_USER_STATS);
    setUserAccount({
      isLoggedIn: false,
      email: '',
      name: '게스트',
      provider: 'guest',
    });
    setIsMyPageOpen(false);
    setIsOnboardingOpen(true);
    showToast('회원 탈퇴 및 모든 계정 데이터가 완전히 삭제되었습니다.');
  };

  const rawActiveSpecimens = specimens.filter((s) => !s.isDeleted);
  const activeSpecimens = rawActiveSpecimens;
  const collectedCount = activeSpecimens.filter((s) => s.isCollected && !s.isPending).length;
  const totalCount = activeSpecimens.length;
  const pendingCount = activeSpecimens.filter((s) => s.isPending).length;

  return (
    <div className={`relative ${currentTab === 'map' || currentTab === 'lens' ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'} bg-[#fbfbfb] text-[#202320] flex flex-col antialiased select-none`}>
      {/* Toast Notification */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      {/* Global Top Header: ONLY on 'archive' main view, hidden inside category detail view, 'lens', and 'map' */}
      {currentTab === 'archive' && !isArchiveDetailOpen && (
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
            onSearchChange={setSearchQuery}
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
            onDetailCategoryChange={setIsArchiveDetailOpen}
          />
        )}

        {currentTab === 'lens' && (
          <LensView
            onCollectSpecimen={handleCollectSpecimen}
            existingSpecimens={activeSpecimens}
            freeScansRemaining={userStats.freeScans}
            isProUser={userStats.isProUser}
            currentPersona={userStats.persona || 'general'}
            userStats={userStats}
            userAccount={userAccount}
            onSelectSpecimen={(sp) => {
              setHasNewStickerNotice(false);
              setCurrentTab('archive');
              setSelectedSpecimen(sp);
            }}
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
            userAccount={userAccount}
            onUpdatePersona={(newPersona) => setUserStats((prev) => ({ ...prev, persona: newPersona }))}
            onUpdateStats={(patch) => setUserStats((prev) => ({ ...prev, ...patch }))}
            onUpdateMapSettings={(patch) =>
              setUserStats((prev) => ({
                ...prev,
                mapSettings: { ...prev.mapSettings, ...patch },
              }))
            }
            onTogglePushDiscoveryAlerts={() =>
              setUserStats((prev) => ({
                ...prev,
                pushDiscoveryAlerts: !prev.pushDiscoveryAlerts,
              }))
            }
            onOpenAttendanceModal={() => setIsAttendanceModalOpen(true)}
            onSelectSpecimen={(sp) => setSelectedSpecimen(sp)}
            onOpenLens={() => setCurrentTab('lens')}
            onOpenExportCard={handleOpenExportCard}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isProUser={userStats.isProUser}
            onOpenPaywall={() => setIsSubscriptionOpen(true)}
            onOpenLoginModal={() => setIsLoginOpen(true)}
            onOpenMyPage={() => setIsMyPageOpen(true)}
            openMapSettingsNonce={openMapSettingsNonce}
            onConsumeOpenMapSettings={() => setOpenMapSettingsNonce(0)}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Global 3-Tab Bottom GNB */}
      {currentTab !== 'lens' && (
        <Navigation
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'archive') setHasNewStickerNotice(false);
            if (tab !== 'archive') setIsArchiveDetailOpen(false);
            setCurrentTab(tab);
          }}
          hasNewStickerNotice={hasNewStickerNotice}
          pendingCount={pendingCount}
        />
      )}

      {/* Encyclopedia Detail View Sheet Modal */}
      {selectedSpecimen && (
        <DetailView
          specimen={selectedSpecimen}
          allSpecimens={specimens}
          currentPersona={userStats.persona || 'general'}
          userStats={userStats}
          userAccount={userAccount}
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
          onUpdateAccount={(updated) => setUserAccount((prev) => ({ ...prev, ...updated }))}
          onOpenLoginModal={() => setIsLoginOpen(true)}
          onOpenSubscriptionModal={() => setIsSubscriptionOpen(true)}
          onOpenMapSettings={() => {
            setIsMyPageOpen(false);
            setCurrentTab('map');
            setOpenMapSettingsNonce((n) => n + 1);
          }}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      {/* Dedicated Subscription & In-App Purchase Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        userStats={userStats}
        userAccount={userAccount}
        onSubscribe={(planType) => {
          setUserStats((prev) => ({
            ...prev,
            isProUser: planType !== 'free',
            planType: planType,
            freeScans: planType !== 'free' ? 9999 : 10,
          }));
        }}
        onShowToast={showToast}
      />

      {/* Social Login / Auth Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(acc) => {
          handleLoginSuccess(acc);
        }}
        onShowToast={showToast}
      />

      {/* Onboarding Guide & Welcome Modal */}
      {isOnboardingOpen && (
        <OnboardingModal
          onComplete={handleCompleteOnboarding}
          onLoginSuccess={(acc, opts) => {
            if (opts?.isNewSignup) {
              setUserAccount(acc);
            } else {
              handleLoginSuccess(acc);
            }
          }}
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
        userAccount={userAccount}
        initialMode={globalExportMode}
        onShowToast={showToast}
      />

      {/* Explorer Quest & Level Modal */}
      <ExplorerQuestModal
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        userStats={userStats}
        userAccount={userAccount}
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
