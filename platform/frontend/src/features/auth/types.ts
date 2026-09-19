export type AuthPurpose = 'auth' | 'login' | 'registration' | 'pin_reset' | 'new_device';

export interface ChallengeRequestPayload {
  email: string;
  purpose?: AuthPurpose;
  device_uuid?: string;
}

export interface ChallengeVerifyPayload {
  email: string;
  code: string;
  purpose?: AuthPurpose;
  device_uuid?: string;
}

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  status: string;
}

export interface AuthBusiness {
  id: number;
  public_id: string;
  name: string;
  pickup_points?: Array<{
    id: number;
    public_id: string;
    name: string;
    park_name?: string | null;
    status: string;
  }>;
}

export interface AuthAuthenticatedResponse {
  outcome: 'authenticated';
  message: string;
  user: AuthUser;
  business: AuthBusiness | null;
  role?: string;
}

export interface AuthNewUserResponse {
  outcome: 'new_user';
  message: string;
  challenge_id: number;
  email: string;
}

export type AuthVerifyResponse = AuthAuthenticatedResponse | AuthNewUserResponse;

export interface SessionResponse {
  authenticated: boolean;
  user: AuthUser | null;
  business: AuthBusiness | null;
  role?: string;
}

export interface OnboardingPayload {
  email: string;
  first_name: string;
  pickup_point_name: string;
  park_name?: string;
  challenge_id: number;
  device_uuid: string;
  device_name?: string;
}

export interface RememberedIdentityData {
  email: string;
  name?: string;
  business_name?: string;
  last_used_at: number;
}
