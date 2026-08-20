import React, { useState, useEffect } from 'react';
import { Specimen, UserStats, Observation, NaturalistPersona, UserAccount } from './types';
import { INITIAL_SPECIMENS } from './data/defaultSpecimens';
import { NATURALIST_PERSONAS } from './data/hotspots';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { ArchiveView } from './components/ArchiveView';
import { LensView } from './components/LensView';
import { FieldMapView } from './components/FieldMapView';
import { DetailView } from './components/DetailView';
import { MyPageModal } from './components/MyPageModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { LoginModal } from './components/LoginModal';
import { OnboardingModal } from './components/OnboardingModal';
import { HotspotGuideModal } from './components/HotspotGuideModal';
import { Toast } from './components/Toast';

const DEFAULT_USER_STATS: UserStats = {
  freeScans: 10,
  isProUser: false,
  planType: 'free',
  streakDays: 5,
  exploredHabitats: ['서울숲', '남산', '올림픽공원', '북한산'],
  totalScans: 8,
  soundEnabled: true,
  hapticsEnabled: true,
  highResCloudSync: true,
  pushDiscoveryAlerts: true,
  homeCity: '서울',
  taxonomyDisplayMode: 'common_first',
  photoQuality: 'original',
  unitSystem: 'metric',
  viewJournalMode: true,
  badges: ['badge-01', 'badge-05', 'badge-06', 'badge-08', 'badge-09', 'badge-10'],
};

const DEFAULT_USER_ACCOUNT: UserAccount = {
  isLoggedIn: true,
  email: 'pjp1997103@gmail.com',
  name: '자연 관찰자',
  provider: 'google',
  connectedAt: '2025. 01. 15',
};

export default function App() {
  // Navigation tab state (3 tabs: 'archive' | 'lens' | 'map')
  const [currentTab, setCurrentTab] = useState<'archive' | 'lens' | 'map'>('archive');

  // Specimen collection state with local storage fallback
  const [specimens, setSpecimens] = useState<Specimen[]>(() => {
    try {
      const saved = localStorage.getItem('moalog_specimens');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SPECIMENS;
  });

  // User profile & stats
  const [userStats, setUserStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem('moalog_user_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.badges) parsed.badges = ['badge-01', 'badge-05', 'badge-06', 'badge-08', 'badge-09', 'badge-10'];
        return parsed;
      }
    } catch {}
    return DEFAULT_USER_STATS;
  });

  // User Account state
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
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isHotspotsOpen, setIsHotspotsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    try {
      return !localStorage.getItem('moalog_onboarded');
    } catch {
      return false;
    }
  });

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
  const handleCollectSpecimen = (newSpecimen: Specimen) => {
    setSpecimens((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === newSpecimen.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = newSpecimen;
        return updated;
      }
      return [newSpecimen, ...prev];
    });

    if (!newSpecimen.isPending) {
      setHasNewStickerNotice(true);
      showToast(`'${newSpecimen.koreanName}' 도감에 등록되었습니다.`);
    } else {
      showToast(`'${newSpecimen.koreanName}' 임시 보관함에 저장되었습니다.`);
    }

    // Deduct scan count if not pro
    if (!userStats.isProUser) {
      setUserStats((prev) => ({
        ...prev,
        freeScans: Math.max(0, prev.freeScans - 1),
        totalScans: prev.totalScans + 1,
      }));
    } else {
      setUserStats((prev) => ({
        ...prev,
        totalScans: prev.totalScans + 1,
      }));
    }
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
            observations: [observation, ...s.observations],
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

  const handleCompleteOnboarding = (selectedPersona?: NaturalistPersona) => {
    try {
      localStorage.setItem('moalog_onboarded', 'true');
    } catch {}
    if (selectedPersona) {
      setUserStats((prev) => ({ ...prev, persona: selectedPersona }));
      showToast(`'${NATURALIST_PERSONAS[selectedPersona]?.title || '관찰자'}' 성향 데이터가 정상 설정되었습니다.`);
    }
    setIsOnboardingOpen(false);
  };

  const handleLogout = () => {
    setUserAccount({
      isLoggedIn: false,
      email: '',
      name: '',
      provider: 'none',
    });
    showToast('로그아웃 되었습니다. 게스트 모드로 전환되었습니다.');
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
      name: '',
      provider: 'none',
    });
    setIsMyPageOpen(false);
    setIsOnboardingOpen(true);
    showToast('회원 탈퇴 및 모든 계정 데이터가 완전히 삭제되었습니다.');
  };

  const activeSpecimens = specimens.filter((s) => !s.isDeleted);
  const collectedCount = activeSpecimens.filter((s) => s.isCollected && !s.isPending).length;
  const totalCount = activeSpecimens.length;
  const pendingCount = activeSpecimens.filter((s) => s.isPending).length;

  return (
    <div className={`relative ${currentTab === 'map' || currentTab === 'lens' ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'} bg-[#F6F8F6] text-stone-900 flex flex-col font-sans antialiased select-none`}>
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
            onSelectSpecimen={(sp) => setSelectedSpecimen(sp)}
            onOpenLens={() => setCurrentTab('lens')}
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
        <DetailView
          specimen={selectedSpecimen}
          currentPersona={userStats.persona || 'general'}
          onClose={() => setSelectedSpecimen(null)}
          onSelectTaxonomyFilter={handleSelectTaxonomyFilter}
          onAddObservation={handleAddObservation}
          onUpdateSpecimen={handleUpdateSpecimen}
          onDeleteSpecimen={handleDeleteSpecimen}
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
        onSubscribe={(planType) => {
          setUserStats((prev) => ({
            ...prev,
            isProUser: true,
            planType: planType,
            freeScans: 9999,
          }));
        }}
        onShowToast={showToast}
      />

      {/* Social Login / Auth Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(acc) => {
          setUserAccount(acc);
        }}
        onShowToast={showToast}
      />

      {/* Onboarding Guide & Welcome Modal */}
      {isOnboardingOpen && (
        <OnboardingModal
          onComplete={handleCompleteOnboarding}
          initialPersona={userStats.persona || 'general'}
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
    </div>
  );
}
