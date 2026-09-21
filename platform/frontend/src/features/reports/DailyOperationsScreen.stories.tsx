import type { Meta, StoryObj } from '@storybook/react';
import { DailyOperationsScreen } from './DailyOperationsScreen';
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthContext';

function createMockAuthContext(role: 'owner' | 'manager' | 'attendant' = 'owner'): AuthContextValue {
  return {
    state: 'authenticated',
    user: { id: 1, email: 'ada@lagoscentral.ng', first_name: 'Ada', status: 'ACTIVE' },
    business: {
      id: 1001,
      public_id: 'biz-1001',
      name: 'Ojota Motor Park Central',
      pickup_points: [
        { id: 1, public_id: 'point-1', name: 'Counter 1 · Arrival Gate', status: 'active' },
        { id: 2, public_id: 'point-2', name: 'Counter 2 · Express Wing', status: 'active' },
      ],
    },
    role,
    deviceMeta: null,
    rememberedIdentity: null,
    setAuthenticatedUser: async () => {},
    unlock: () => {},
    logout: async () => {},
    forgetRememberedIdentity: async () => {},
    refreshSession: async () => {},
  };
}

const meta: Meta<typeof DailyOperationsScreen> = {
  title: 'Features/Reports/DailyOperationsScreen',
  component: DailyOperationsScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DailyOperationsScreen>;

export const OwnerToday: Story = {
  render: () => (
    <AuthContext.Provider value={createMockAuthContext('owner')}>
      <DailyOperationsScreen onBack={() => alert('Back clicked')} />
    </AuthContext.Provider>
  ),
};

export const ManagerToday: Story = {
  render: () => (
    <AuthContext.Provider value={createMockAuthContext('manager')}>
      <DailyOperationsScreen onBack={() => alert('Back clicked')} />
    </AuthContext.Provider>
  ),
};

export const AttendantDenied: Story = {
  render: () => (
    <AuthContext.Provider value={createMockAuthContext('attendant')}>
      <DailyOperationsScreen onBack={() => alert('Back clicked')} />
    </AuthContext.Provider>
  ),
};
