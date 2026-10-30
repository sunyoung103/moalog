import { Specimen, UserAccount, UserStats } from '../types';
import { GUEST_ACCOUNT } from './auth';

/**
 * 저장 구조
 * - moalog_user_account      : 현재 세션(게스트/로그인 계정)
 * - moalog_data_{ownerId}    : 계정별 도감/통계 (ownerId = 'guest' | account.id)
 * - moalog_onboarded         : 온보딩 완료 여부
 * - moalog_silent_camera 등  : 앱/기기 설정 (로그아웃·탈퇴와 무관하게 유지)
 */
const SESSION_KEY = 'moalog_user_account';
const DATA_PREFIX = 'moalog_data_';

export const GUEST_OWNER = 'guest';

export interface OwnerData {
  specimens: Specimen[];
  userStats: UserStats;
}

export const ownerIdOf = (account: UserAccount): string =>
  account.isLoggedIn && account.id ? account.id : GUEST_OWNER;

export function loadSession(): UserAccount {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as UserAccount;
      if (parsed.isLoggedIn) {
        // 구버전 세션(id 없음) 호환
        return { ...parsed, id: parsed.id || `${parsed.provider}-demo-user` };
      }
    }
  } catch {}
  return GUEST_ACCOUNT;
}

export function saveSession(account: UserAccount): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(account));
  } catch {}
}

export function loadOwnerData(ownerId: string): OwnerData | null {
  try {
    const saved = localStorage.getItem(DATA_PREFIX + ownerId);
    if (saved) {
      const parsed = JSON.parse(saved) as OwnerData;
      if (Array.isArray(parsed.specimens) && parsed.userStats) return parsed;
    }
  } catch {}
  return null;
}

export function saveOwnerData(ownerId: string, data: OwnerData): void {
  try {
    localStorage.setItem(DATA_PREFIX + ownerId, JSON.stringify(data));
  } catch {}
}

export function removeOwnerData(ownerId: string): void {
  try {
    localStorage.removeItem(DATA_PREFIX + ownerId);
  } catch {}
}

/**
 * 구버전(moalog_specimens / moalog_user_stats 단일 키) 데이터를 계정별 키로 1회 이전합니다.
 * 기존처럼 버전이 바뀔 때 사용자 데이터를 통째로 지우지 않습니다.
 */
export function migrateLegacyStorage(currentVersion: string): void {
  try {
    if (localStorage.getItem('moalog_app_version') === currentVersion) return;

    const legacySpecimens = localStorage.getItem('moalog_specimens');
    const legacyStats = localStorage.getItem('moalog_user_stats');
    if (legacySpecimens && legacyStats) {
      const owner = ownerIdOf(loadSession());
      if (!loadOwnerData(owner)) {
        saveOwnerData(owner, {
          specimens: JSON.parse(legacySpecimens),
          userStats: JSON.parse(legacyStats),
        });
      }
    }
    localStorage.removeItem('moalog_specimens');
    localStorage.removeItem('moalog_user_stats');
    localStorage.setItem('moalog_app_version', currentVersion);
  } catch {}
}
