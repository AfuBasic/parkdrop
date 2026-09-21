import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountSecurityScreen } from './AccountSecurityScreen';
import { AuthContext } from '@/features/auth/AuthContext';
import { accountApi } from './api/account-api';
import * as deviceIdentity from '@/offline/device/device-identity';
import { db } from '@/offline/db/database';

vi.mock('./api/account-api', () => ({
  accountApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    getDevices: vi.fn(),
    revokeDevice: vi.fn(),
    revokeOtherDevices: vi.fn(),
  },
}));

vi.mock('@/offline/device/device-identity', async () => {
  const actual = await vi.importActual<any>('@/offline/device/device-identity');
  return {
    ...actual,
    getLocalAuthorization: vi.fn(),
  };
});

describe('AccountSecurityScreen', () => {
  const mockLogout = vi.fn();

  const mockAuthContext: any = {
    state: 'authenticated',
    user: { id: 1, email: 'ada@example.com', first_name: 'Ada' },
    business: { id: 10, name: 'Lagos Logistics' },
    role: 'owner',
    deviceMeta: null,
    rememberedIdentity: null,
    setAuthenticatedUser: vi.fn(),
    unlock: vi.fn(),
    logout: mockLogout,
    forgetRememberedIdentity: vi.fn(),
    refreshSession: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await db.mutations.clear();

    vi.mocked(accountApi.getProfile).mockResolvedValue({
      user: {
        id: 1,
        email: 'ada@example.com',
        first_name: 'Ada',
        status: 'active',
        email_verified_at: '2026-09-01T12:00:00Z',
      },
      businesses: [
        { business_id: 10, business_name: 'Lagos Logistics', role: 'owner' },
      ],
    });

    vi.mocked(accountApi.getDevices).mockResolvedValue({
      devices: [
        {
          id: 1,
          device_name: 'Chrome on macOS',
          is_current: true,
          authorized_at: '2026-09-20T10:00:00Z',
          last_seen_at: '2026-09-21T11:00:00Z',
          revoked_at: null,
          is_revoked: false,
        },
        {
          id: 2,
          device_name: 'Safari on iPhone',
          is_current: false,
          authorized_at: '2026-09-15T09:00:00Z',
          last_seen_at: '2026-09-20T14:00:00Z',
          revoked_at: null,
          is_revoked: false,
        },
      ],
    });

    vi.mocked(deviceIdentity.getLocalAuthorization).mockResolvedValue({
      id: 'current',
      user_id: 1,
      business_id: 10,
      business_name: 'Lagos Logistics',
      pickup_point_id: null,
      authorized_at: '2026-09-21T08:00:00Z',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    });
  });

  it('renders read-only email and current display name', async () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <AccountSecurityScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('ada@example.com')).toBeDefined();
      expect(screen.getByText('Read-only')).toBeDefined();
      expect(screen.getByText('Ada')).toBeDefined();
      expect(screen.getByText('Lagos Logistics')).toBeDefined();
    });
  });

  it('allows editing display name and calls API', async () => {
    vi.mocked(accountApi.updateProfile).mockResolvedValue({
      message: 'Profile updated successfully.',
      user: { id: 1, email: 'ada@example.com', first_name: 'Adanna', status: 'active' },
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <AccountSecurityScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Change name')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Change name'));
    const input = screen.getByPlaceholderText('Enter your first name or display name');
    fireEvent.change(input, { target: { value: 'Adanna' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(accountApi.updateProfile).toHaveBeenCalledWith({ first_name: 'Adanna' });
      expect(screen.getByText('Display name updated successfully.')).toBeDefined();
    });
  });

  it('renders current device and allows revoking remote device', async () => {
    vi.mocked(accountApi.revokeDevice).mockResolvedValue({
      message: 'Device access revoked successfully.',
      device: { id: 2, is_revoked: true, revoked_at: new Date().toISOString() },
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <AccountSecurityScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Chrome on macOS')).toBeDefined();
      expect(screen.getByText('Safari on iPhone')).toBeDefined();
      expect(screen.getByText('Revoke')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Revoke'));

    await waitFor(() => {
      expect(accountApi.revokeDevice).toHaveBeenCalledWith(2);
      expect(screen.getByText('Revoked')).toBeDefined();
    });
  });

  it('detects pending mutations on sign out and prompts confirmation dialog', async () => {
    // Add pending mutation
    await db.mutations.add({
      mutation_id: 'mut-123',
      device_uuid: 'dev-uuid',
      device_sequence: 1,
      business_id: 10,
      pickup_point_id: null,
      operation: 'CREATE_PACKAGE',
      entity_id: 'pkg-1',
      base_version: null,
      payload: {},
      created_at: new Date().toISOString(),
      status: 'PENDING',
      attempt_count: 0,
      last_attempt_at: null,
      last_error_code: null,
      last_error_message: null,
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <AccountSecurityScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sign Out')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Sign Out'));

    await waitFor(() => {
      expect(screen.getByText('Unsynced Work on Device')).toBeDefined();
      expect(screen.getByText('1 pending change')).toBeDefined();
      expect(screen.getByText('Sign out anyway (Keep local queue)')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Sign out anyway (Keep local queue)'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });
});
