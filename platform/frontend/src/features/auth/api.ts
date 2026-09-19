import { fetchApi } from '@/lib/api';
import type { 
  ChallengeRequestPayload, 
  ChallengeVerifyPayload, 
  OnboardingPayload,
  AuthUser,
  AuthBusiness,
  AuthVerifyResponse,
  SessionResponse,
} from './types';

export const authApi = {
  /**
   * Request a 6-digit confirmation code sent to email.
   * Uses clean /api/v1/auth/code endpoint with purpose defaulting to 'auth'.
   */
  async requestCode(payload: ChallengeRequestPayload): Promise<{ message: string; expires_in_minutes: number }> {
    const response = await fetchApi('/api/v1/auth/code', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        purpose: payload.purpose || 'auth',
        device_uuid: payload.device_uuid,
      }),
    });
    return response.json();
  },

  /**
   * Verify confirmation code.
   * Returns outcome: 'authenticated' (existing user) or 'new_user' (needs name/pickup).
   */
  async verifyCode(payload: ChallengeVerifyPayload): Promise<AuthVerifyResponse> {
    const response = await fetchApi('/api/v1/auth/code/verify', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        code: payload.code,
        purpose: payload.purpose || 'auth',
        device_uuid: payload.device_uuid,
      }),
    });
    return response.json();
  },

  /**
   * Complete registration/onboarding for a new user.
   */
  async completeOnboarding(payload: OnboardingPayload): Promise<{ user: AuthUser; business: AuthBusiness }> {
    const response = await fetchApi('/api/v1/auth/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.json();
  },
  
  /**
   * Check currently active session via Sanctum.
   */
  async getSession(): Promise<SessionResponse> {
    const response = await fetchApi('/api/v1/auth/session', {
      method: 'GET',
    });
    return response.json();
  },

  /**
   * Log out of current session.
   */
  async logout(): Promise<{ message: string }> {
    const response = await fetchApi('/api/v1/auth/logout', {
      method: 'POST',
    });
    return response.json();
  },

  /**
   * Legacy method for backward compatibility
   */
  async requestChallenge(payload: ChallengeRequestPayload): Promise<{ message: string; expires_in_minutes: number }> {
    return this.requestCode(payload);
  },

  /**
   * Legacy method for backward compatibility
   */
  async verifyChallenge(payload: ChallengeVerifyPayload): Promise<any> {
    return this.verifyCode(payload);
  },

  /**
   * Legacy method for backward compatibility
   */
  async getUser(): Promise<AuthUser> {
    const session = await this.getSession();
    if (!session.user) {
      throw new Error('Not authenticated');
    }
    return session.user;
  },
};
