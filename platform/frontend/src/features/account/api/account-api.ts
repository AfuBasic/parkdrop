import { fetchApi } from '@/lib/api';
import { getDeviceUuid } from '@/offline/device/device-identity';
import type {
  AccountProfileResponse,
  RegisteredDevicesResponse,
  UpdateProfileRequest,
  RevokeDeviceResponse,
  RevokeOtherDevicesResponse,
} from '../account-types';

export const accountApi = {
  /**
   * Fetch authenticated user's account profile and active memberships summary.
   */
  async getProfile(): Promise<AccountProfileResponse> {
    const response = await fetchApi('/api/v1/account/profile', {
      method: 'GET',
    });
    return response.json();
  },

  /**
   * Update user display name.
   */
  async updateProfile(payload: UpdateProfileRequest): Promise<{ message: string; user: { id: number; email: string; first_name: string; status: string } }> {
    const response = await fetchApi('/api/v1/account/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  /**
   * List registered devices with current device flagged via X-Device-UUID.
   */
  async getDevices(): Promise<RegisteredDevicesResponse> {
    const deviceUuid = getDeviceUuid();
    const response = await fetchApi('/api/v1/account/devices', {
      method: 'GET',
      headers: {
        'X-Device-UUID': deviceUuid,
      },
    });
    return response.json();
  },

  /**
   * Revoke access for a specific registered device.
   */
  async revokeDevice(deviceId: number): Promise<RevokeDeviceResponse> {
    const response = await fetchApi(`/api/v1/account/devices/${deviceId}/revoke`, {
      method: 'POST',
    });
    return response.json();
  },

  /**
   * Revoke all registered devices except the current device.
   */
  async revokeOtherDevices(): Promise<RevokeOtherDevicesResponse> {
    const deviceUuid = getDeviceUuid();
    const response = await fetchApi('/api/v1/account/devices/revoke-others', {
      method: 'POST',
      headers: {
        'X-Device-UUID': deviceUuid,
      },
    });
    return response.json();
  },
};
