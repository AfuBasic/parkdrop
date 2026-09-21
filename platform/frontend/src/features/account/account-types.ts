export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  status: string;
  email_verified_at: string | null;
}

export interface BusinessMembershipSummary {
  business_id: number;
  business_name: string | null;
  role: string;
}

export interface AccountProfileResponse {
  user: UserProfile;
  businesses: BusinessMembershipSummary[];
}

export interface RegisteredDevice {
  id: number;
  device_name: string;
  is_current: boolean;
  authorized_at: string | null;
  last_seen_at: string | null;
  revoked_at: string | null;
  is_revoked: boolean;
}

export interface RegisteredDevicesResponse {
  devices: RegisteredDevice[];
}

export interface UpdateProfileRequest {
  first_name: string;
}

export interface RevokeDeviceResponse {
  message: string;
  device: {
    id: number;
    is_revoked: boolean;
    revoked_at: string | null;
  };
}

export interface RevokeOtherDevicesResponse {
  message: string;
  revoked_count: number;
}
