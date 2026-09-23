import type { Meta, StoryObj } from '@storybook/react';
import { PackagesScreen } from './PackagesScreen';
import { AuthContext } from '@/features/auth/AuthContext';
import { db } from '@/offline/db/database';
import type { LocalPackage, LocalCustomer } from '@/offline/db/schema';

const mockBusinessId = 1;

const meta: Meta<typeof PackagesScreen> = {
  title: 'Features/Packages/List/PackagesScreen',
  component: PackagesScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => {
      return (
        <AuthContext.Provider
          value={{
            state: 'authenticated',
            user: { id: 1, email: 'attendant@peacepark.ng', first_name: 'Chinedu', status: 'ACTIVE' },
            business: { id: mockBusinessId, public_id: 'BUS-1', name: 'Peace Park Hub' },
            deviceMeta: null,
            rememberedIdentity: null,
            unlock: () => {},
            setAuthenticatedUser: async () => {},
            logout: async () => {},
            forgetRememberedIdentity: async () => {},
            refreshSession: async () => {},
          }}
        >
          <div className="bg-surface-page min-h-screen">
            <Story />
          </div>
        </AuthContext.Provider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof PackagesScreen>;

async function seedPackages() {
  await db.packages.clear();
  await db.customers.clear();

  const customers: LocalCustomer[] = [
    {
      id: 'cust-1',
      business_id: mockBusinessId,
      name: 'Chinedu Okafor',
      phone_display: '0803 123 4567',
      phone_normalized: '+2348031234567',
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'cust-2',
      business_id: mockBusinessId,
      name: 'Ngozi Eze',
      phone_display: '0802 555 1234',
      phone_normalized: '+2348025551234',
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'cust-3',
      business_id: mockBusinessId,
      name: 'Oluwafemi Babatunde Adeyemi Oladipo',
      phone_display: '0814 999 8888',
      phone_normalized: '+2348149998888',
      version: 1,
      sync_status: 'SYNCED',
    },
  ];

  const packages: LocalPackage[] = [
    {
      id: 'pkg-w1',
      business_id: mockBusinessId,
      pickup_point_id: 1,
      customer_id: 'cust-1',
      public_package_id: 'PD-8K42Q',
      pickup_code: '7K4P2MX',
      amount_due_minor: 350000,
      status: 'WAITING',
      client_created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'pkg-w2',
      business_id: mockBusinessId,
      pickup_point_id: 1,
      customer_id: 'cust-2',
      public_package_id: 'PD-7J22P',
      pickup_code: '3B8M4XY',
      amount_due_minor: 150000,
      status: 'WAITING',
      client_created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'pkg-w3-unsynced',
      business_id: mockBusinessId,
      pickup_point_id: 1,
      customer_id: 'cust-3',
      public_package_id: 'PD-LOCAL1',
      pickup_code: '5V8T3QA',
      amount_due_minor: 220000,
      status: 'WAITING',
      client_created_at: new Date().toISOString(),
      server_received_at: null,
      version: 1,
      sync_status: 'PENDING_CREATE',
    },
    {
      id: 'pkg-c1',
      business_id: mockBusinessId,
      pickup_point_id: 1,
      customer_id: 'cust-1',
      public_package_id: 'PD-X92KM',
      pickup_code: '9H72KQX',
      amount_due_minor: 250000,
      status: 'COLLECTED',
      client_created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'pkg-r1',
      business_id: mockBusinessId,
      pickup_point_id: 1,
      customer_id: 'cust-2',
      public_package_id: 'PD-P31KQ',
      pickup_code: '2H4P9MN',
      amount_due_minor: 500000,
      status: 'RETURNED',
      client_created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'pkg-x1',
      business_id: mockBusinessId,
      pickup_point_id: 1,
      customer_id: 'cust-3',
      public_package_id: 'PD-5M91Z',
      pickup_code: '6N9W2KL',
      amount_due_minor: 850000,
      status: 'CANCELLED',
      client_created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    },
  ];

  await db.customers.bulkAdd(customers);
  await db.packages.bulkAdd(packages);
}

export const Waiting: Story = {
  args: {
    initialStatus: 'WAITING',
  },
  loaders: [seedPackages],
};

export const Collected: Story = {
  args: {
    initialStatus: 'COLLECTED',
  },
  loaders: [seedPackages],
};

export const Returned: Story = {
  args: {
    initialStatus: 'OTHER',
    initialPayFilter: 'returned',
  },
  loaders: [seedPackages],
};

export const Cancelled: Story = {
  args: {
    initialStatus: 'OTHER',
    initialPayFilter: 'cancelled',
  },
  loaders: [seedPackages],
};

export const WaitingEmpty: Story = {
  args: {
    initialStatus: 'WAITING',
  },
  loaders: [
    async () => {
      await db.packages.clear();
      await db.customers.clear();
    },
  ],
};
