import { UserAccount } from '../types';

export type SocialProvider = 'google' | 'apple';

export const GUEST_ACCOUNT: UserAccount = {
  isLoggedIn: false,
  email: '',
  name: '게스트',
  provider: 'guest',
};

/**
 * 목업 소셜 로그인.
 * 실제 OAuth(Firebase/Supabase 등) 연동 시 이 함수만 교체하면 됩니다.
 * - id 는 provider 별 고정값이라 같은 소셜로 다시 로그인하면 같은 계정(=같은 저장 데이터)으로 복원됩니다.
 */
export function mockSocialLogin(provider: SocialProvider, options?: { newAccount?: boolean }): Promise<UserAccount> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        isLoggedIn: true,
        // 온보딩 가입은 매번 새 계정(새 데이터), 일반 로그인은 기존 데모 계정
        id: options?.newAccount ? `${provider}-signup-${Date.now()}` : `${provider}-demo-user`,
        email: provider === 'google' ? 'explorer@gmail.com' : 'explorer@icloud.com',
        name: provider === 'google' ? 'Google 탐험가' : 'Apple 탐험가',
        provider,
        connectedAt: new Date().toISOString(),
      });
    }, 600);
  });
}
