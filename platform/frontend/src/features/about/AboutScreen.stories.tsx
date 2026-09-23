import type { Meta, StoryObj } from '@storybook/react';
import { AboutScreen } from './AboutScreen';
import { AuthContext } from '@/features/auth/AuthContext';

const mockAuthValue = {
  state: 'authenticated' as const,
  user: { id: 1, email: 'owner@motorpark.ng', first_name: 'Babajide' },
  business: { id: 1, name: 'Mile 12 Express Hub' },
  role: 'owner' as const,
  deviceMeta: null,
  rememberedIdentity: null,
  login: async () => {},
  verifyOtp: async () => {},
  setupPin: async () => {},
  unlock: async () => {},
  logout: async () => {},
  forgetRememberedIdentity: () => {},
};

const meta: Meta<typeof AboutScreen> = {
  title: 'Features/About/AboutScreen',
  component: AboutScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <AuthContext.Provider value={mockAuthValue as any}>
        <Story />
      </AuthContext.Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AboutScreen>;

export const Default: Story = {
  args: {
    onBack: () => {},
  },
};
