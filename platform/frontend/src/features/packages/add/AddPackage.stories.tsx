import type { Meta, StoryObj } from '@storybook/react';
import { AddPackageScreen } from './AddPackageScreen';
import { AuthContext } from '@/features/auth/AuthContext';
import { db } from '@/offline/db/database';

const BUSINESS_MOCK = {
  id: 1,
  public_id: 'BUS-1234',
  name: 'Chima Parcel Services',
  pickup_points: [
    {
      id: 1,
      public_id: 'PP-1',
      name: 'Chima Parcel Services',
      park_name: 'Peace Park',
      status: 'active',
    },
  ],
};

const meta = {
  title: 'Features/Packages/AddPackageScreen',
  component: AddPackageScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <AuthContext.Provider
        value={{
          state: 'authenticated',
          user: { id: 1, email: 'ada@example.com', first_name: 'Ada', status: 'ACTIVE' },
          business: BUSINESS_MOCK,
          role: 'owner',
          deviceMeta: null,
          rememberedIdentity: null,
          unlock: () => {},
          setAuthenticatedUser: async () => {},
          logout: async () => {},
          forgetRememberedIdentity: async () => {},
          refreshSession: async () => {},
        }}
      >
        <Story />
      </AuthContext.Provider>
    ),
  ],
} satisfies Meta<typeof AddPackageScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const clearDB = async () => {
  await db.packages.clear();
  await db.customers.clear();
};

export const Default: Story = {
  play: async () => {
    await clearDB();
    await db.customers.put({
      id: 'cust_mock_1',
      business_id: 1,
      name: 'Chinedu Okafor',
      phone_display: '0803 123 4567',
      phone_normalized: '+2348031234567',
      version: 1,
      sync_status: 'SYNCED',
    });
  },
};

export const ReturningCustomer: Story = {
  play: async () => {
    await clearDB();
    const custId = 'cust_mock_returning';
    await db.customers.put({
      id: custId,
      business_id: 1,
      name: 'Chinedu Okafor',
      phone_display: '0803 123 4567',
      phone_normalized: '+2348031234567',
      version: 1,
      sync_status: 'SYNCED',
    });
    // Add 3 past collected packages
    for (let i = 1; i <= 3; i++) {
      await db.packages.put({
        id: `pkg_past_${i}`,
        business_id: 1,
        pickup_point_id: 1,
        customer_id: custId,
        public_package_id: `PD-200${i}`,
        pickup_code: `CODE${i}`,
        amount_due_minor: 100000,
        status: 'COLLECTED',
        client_created_at: new Date().toISOString(),
        server_received_at: null,
        version: 1,
        sync_status: 'SYNCED',
      });
    }
  },
};

export const DuplicateWaitingNotice: Story = {
  play: async () => {
    await clearDB();
    const custId = 'cust_mock_waiting';
    await db.customers.put({
      id: custId,
      business_id: 1,
      name: 'Ngozi Eze',
      phone_display: '0802 987 6543',
      phone_normalized: '+2348029876543',
      version: 1,
      sync_status: 'SYNCED',
    });
    // Add 1 currently waiting package
    await db.packages.put({
      id: 'pkg_waiting_1',
      business_id: 1,
      pickup_point_id: 1,
      customer_id: custId,
      public_package_id: 'PD-4412',
      pickup_code: '9421',
      amount_due_minor: 250000,
      status: 'WAITING',
      client_created_at: new Date().toISOString(),
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    });
  },
};
