import type { Meta, StoryObj } from '@storybook/react';
import { AccountSecurityScreen } from './AccountSecurityScreen';
import { AuthContext } from '@/features/auth/AuthContext';

const mockUser = {
  id: 1,
  email: 'ada@example.com',
  first_name: 'Ada',
  status: 'active',
  email_verified_at: '2026-09-01T10:00:00Z',
};

const mockBusiness = {
  id: 101,
  name: 'Lagos Central Logistics',
  public_id: 'biz-101-uuid',
};

const mockAuthContextValue: any = {
  state: 'authenticated',
  user: mockUser,
  business: mockBusiness,
  role: 'owner',
  deviceMeta: null,
  rememberedIdentity: {
    email: 'ada@example.com',
    name: 'Ada',
    business_name: 'Lagos Central Logistics',
  },
  setAuthenticatedUser: async () => {},
  unlock: () => {},
  logout: async () => {},
  forgetRememberedIdentity: async () => {},
  refreshSession: async () => {},
};

const meta: Meta<typeof AccountSecurityScreen> = {
  title: 'Features/Account/AccountSecurityScreen',
  component: AccountSecurityScreen,
  decorators: [
    (Story) => (
      <AuthContext.Provider value={mockAuthContextValue}>
        <Story />
      </AuthContext.Provider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof AccountSecurityScreen>;

export const Default: Story = {
  args: {
    onBack: () => alert('Back pressed'),
  },
};
