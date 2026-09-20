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
  await db.customers.clear();
  
  await db.customers.bulkAdd([
    {
      id: 'cust_1',
      business_id: 1,
      name: 'Chinedu Okafor',
      phone_display: '0803 123 4567',
      phone_normalized: '+2348031234567',
      version: 1,
      sync_status: 'SYNCED'
    },
    {
      id: 'cust_2',
      business_id: 1,
      name: 'Ngozi Eze',
      phone_display: '0802 555 1234',
      phone_normalized: '+2348025551234',
      version: 1,
      sync_status: 'SYNCED'
    },
    {
      id: 'cust_3',
      business_id: 1,
      name: 'Boluwatife Ade',
      phone_display: '0912 111 2222',
      phone_normalized: '+2349121112222',
      version: 1,
      sync_status: 'SYNCED'
    }
  ]);

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
        customer_id: 'cust_1',
        public_package_id: 'PD-8K42Q',
        pickup_code: '8K42QXX',
        amount_due_minor: 350000, // 3,500.00
        status: 'WAITING',
        client_created_at: now.toISOString(),
        server_received_at: null,
        version: 1,
        sync_status: 'SYNCED'
      },
      {
        id: 'pkg_2',
        business_id: 1,
        pickup_point_id: 1,
        customer_id: 'cust_2',
        public_package_id: 'PD-P31KQ',
        pickup_code: 'P31KQXX',
        amount_due_minor: 200000,
        status: 'WAITING',
        client_created_at: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        server_received_at: null,
        version: 1,
        sync_status: 'SYNCED'
      },
      {
        id: 'pkg_3',
        business_id: 1,
        pickup_point_id: 1,
        customer_id: 'cust_3',
        public_package_id: 'PD-99X1Z',
        pickup_code: '99X1ZXX',
        amount_due_minor: 0,
        status: 'COLLECTED',
        client_created_at: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(),
        server_received_at: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
        version: 1,
        sync_status: 'SYNCED'
      }
    ]);
  }
};
