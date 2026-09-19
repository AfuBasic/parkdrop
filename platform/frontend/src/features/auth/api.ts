import { fetchApi } from '@/lib/api';
import type { 
  ChallengeRequestPayload, 
  ChallengeVerifyPayload, 
  OnboardingPayload,
  AuthUser,
  AuthBusiness
} from './types';

export const authApi = {
  async requestChallenge(payload: ChallengeRequestPayload): Promise<{ expires_in_minutes: number }> {
    const response = await fetchApi('/api/v1/auth/challenge', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  async verifyChallenge(payload: ChallengeVerifyPayload): Promise<{ challenge_id: number }> {
    const response = await fetchApi('/api/v1/auth/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  async completeOnboarding(payload: OnboardingPayload): Promise<{ user: AuthUser, business: AuthBusiness }> {
    const response = await fetchApi('/api/v1/auth/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.json();
  },
  
  async getUser(): Promise<AuthUser> {
    const response = await fetchApi('/api/user', {
      method: 'GET',
    });
    return response.json();
  }
};
