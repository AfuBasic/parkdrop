export type AuthPurpose = 'login' | 'registration' | 'pin_reset' | 'new_device';

export interface ChallengeRequestPayload {
  email: string;
  purpose: AuthPurpose;
  device_uuid?: string;
}

export interface ChallengeVerifyPayload {
  email: string;
  code: string;
  purpose: AuthPurpose;
  device_uuid?: string;
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
  status: string;
}
