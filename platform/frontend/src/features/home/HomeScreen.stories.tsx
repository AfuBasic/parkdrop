import type { Meta, StoryObj } from '@storybook/react';
import { HomeScreen } from './HomeScreen';
import { AuthContext } from '@/features/auth/AuthContext';
import type { LocalPackage } from '@/offline/db/schema';
import { db } from '@/offline/db/database';

const meta = {
  title: 'Features/Home/HomeScreen',
  component: HomeScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => {
      // Mock Auth Context
      return (
        <AuthContext.Provider value={{
          state: 'authenticated',
          user: { id: 1, email: 'ada@example.com', first_name: 'Ada', status: 'ACTIVE' },
          business: { id: 1, public_id: 'BUS-1234', name: 'Chima Parcel Services' },
          deviceMeta: null,
          rememberedIdentity: null,
          unlock: () => {},
          setAuthenticatedUser: async () => {},
          logout: async () => {},
          forgetRememberedIdentity: async () => {},
          refreshSession: async () => {}
        }}>
          <div className="bg-surface-page min-h-screen">
            <Story />
          </div>
        </AuthContext.Provider>
      );
    }
  ]
} satisfies Meta<typeof HomeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to populate DB for stories
const populateDB = async (packages: LocalPackage[]) => {
  await db.packages.clear();
  await db.packages.bulkAdd(packages);
};

export const EmptyNewBusiness: Story = {
  play: async () => {
    await populateDB([]);
  }
};

export const Populated: Story = {
  play: async () => {
    const now = new Date();
    await populateDB([
      {
        id: 'pkg_1',
        business_id: 1,
        pickup_point_id: 1,
        customer_name: 'Chinedu Okafor',
        customer_phone: '08031234567',
        pickup_code: '8K42Q',
        amount_due: 350000, // 3,500.00
        status: 'WAITING',
        created_at: now.toISOString(),
        collected_at: null,
        sync_status: 'SYNCED'
      },
      {
        id: 'pkg_2',
        business_id: 1,
        pickup_point_id: 1,
        customer_name: 'Ngozi Eze',
        customer_phone: '08025551234',
        pickup_code: 'P31KQ',
        amount_due: 200000,
        status: 'WAITING',
        created_at: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        collected_at: null,
        sync_status: 'SYNCED'
      },
      {
        id: 'pkg_3',
        business_id: 1,
        pickup_point_id: 1,
        customer_name: 'Boluwatife Ade',
        customer_phone: '09121112222',
        pickup_code: '99X1Z',
        amount_due: 0,
        status: 'COLLECTED',
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(),
        collected_at: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
        sync_status: 'SYNCED'
      }
    ]);
  }
};
