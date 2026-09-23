import type { Meta, StoryObj } from '@storybook/react';
import { PackageSearchScreen } from './PackageSearchScreen';
import { AuthContext } from '@/features/auth/AuthContext';
import { db } from '@/offline/db/database';
import type { LocalPackage, LocalCustomer } from '@/offline/db/schema';

const mockBusinessId = 1;

const meta: Meta<typeof PackageSearchScreen> = {
  title: 'Features/Packages/Search/PackageSearchScreen',
  component: PackageSearchScreen,
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
type Story = StoryObj<typeof PackageSearchScreen>;

// Helper to seed fixture packages and customers
async function seedFixtures() {
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
      id: 'pkg-1',
      business_id: mockBusinessId,
      pickup_point_id: 1,
      customer_id: 'cust-1',
      public_package_id: 'PD-8K42Q',
      pickup_code: '7K4P2MX',
      amount_due_minor: 350000,
      status: 'WAITING',
      client_created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'pkg-2',
      business_id: mockBusinessId,
      pickup_point_id: 1,
      customer_id: 'cust-1',
      public_package_id: 'PD-7J22P',
      pickup_code: '3B8M4XY',
      amount_due_minor: 120000,
      status: 'WAITING',
      client_created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'pkg-3',
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
      id: 'pkg-4',
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
      id: 'pkg-5',
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
    {
      id: 'pkg-unsynced',
      business_id: mockBusinessId,
      pickup_point_id: 1,
      customer_id: 'cust-2',
      public_package_id: 'PD-UNSYNC',
      pickup_code: '5V8T3QA',
      amount_due_minor: 180000,
      status: 'WAITING',
      client_created_at: new Date().toISOString(),
      server_received_at: null,
      version: 1,
      sync_status: 'PENDING_CREATE',
    },
  ];

  await db.customers.bulkAdd(customers);
  await db.packages.bulkAdd(packages);
}

export const EmptyQuery: Story = {
  args: {
    initialQuery: '',
  },
  loaders: [seedFixtures],
};

export const NameResults: Story = {
  args: {
    initialQuery: 'Chinedu',
  },
  loaders: [seedFixtures],
};

export const PhoneResults: Story = {
  args: {
    initialQuery: '0803 123 4567',
  },
  loaders: [seedFixtures],
};

export const ExactPickupCode: Story = {
  args: {
    initialQuery: '7K4P2MX',
  },
  loaders: [seedFixtures],
};

export const ExactPackageId: Story = {
  args: {
    initialQuery: 'PD-8K42Q',
  },
  loaders: [seedFixtures],
};

export const MultipleWaitingPackages: Story = {
  args: {
    initialQuery: 'Chinedu',
  },
  loaders: [seedFixtures],
};

export const MixedStatusResults: Story = {
  args: {
    initialQuery: '0803 123 4567',
  },
  loaders: [seedFixtures],
};

export const NoResults: Story = {
  args: {
    initialQuery: 'Nonexistent Parcel ID',
  },
  loaders: [seedFixtures],
};

export const UnsyncedLocalPackage: Story = {
  args: {
    initialQuery: '5V8T3QA',
  },
  loaders: [seedFixtures],
};

export const LongCustomerName: Story = {
  args: {
    initialQuery: 'Oluwafemi',
  },
  loaders: [seedFixtures],
};
