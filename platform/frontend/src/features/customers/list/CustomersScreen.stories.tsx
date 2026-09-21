import type { Meta, StoryObj } from '@storybook/react';
import { CustomersScreen } from './CustomersScreen';
import { db } from '@/offline/db/database';
import type { LocalCustomer, LocalPackage } from '@/offline/db/schema';

const mockBusinessId = 1;

const meta: Meta<typeof CustomersScreen> = {
  title: 'Features/Customers/List/CustomersScreen',
  component: CustomersScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-surface-page min-h-screen">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CustomersScreen>;

async function seedCustomersDirectory() {
  await db.customers.clear();
  await db.packages.clear();
  await db.entityAliases.clear();

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
      name: 'Babajide Adeleke',
      phone_display: '0818 765 4321',
      phone_normalized: '+2348187654321',
      version: 1,
      sync_status: 'PENDING_CREATE',
    },
    {
      id: 'cust-4',
      business_id: mockBusinessId,
      name: 'Dr. Aisha Mohammed-Bello with an Extremely Long Name That Should Truncate Gracefully',
      phone_display: '0909 111 2233',
      phone_normalized: '+2349091112233',
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
      client_created_at: '2026-09-20T10:00:00Z',
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'pkg-2',
      business_id: mockBusinessId,
      pickup_point_id: 1,
      customer_id: 'cust-1',
      public_package_id: 'PD-P31KQ',
      pickup_code: '9H72KQX',
      amount_due_minor: 200000,
      status: 'WAITING',
      client_created_at: '2026-09-20T11:00:00Z',
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'pkg-3',
      business_id: mockBusinessId,
      pickup_point_id: 1,
      customer_id: 'cust-2',
      public_package_id: 'PD-71KQP',
      pickup_code: '8Y7X6WV',
      amount_due_minor: 150000,
      status: 'COLLECTED',
      client_created_at: '2026-09-18T10:00:00Z',
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    },
  ];

  await db.customers.bulkAdd(customers);
  await db.packages.bulkAdd(packages);
}

export const Default: Story = {
  render: () => {
    seedCustomersDirectory();
    return (
      <CustomersScreen
        businessId={mockBusinessId}
        onSelectCustomer={() => {}}
        onNavigateToAdd={() => {}}
      />
    );
  },
};

export const Empty: Story = {
  render: () => {
    db.customers.clear();
    db.packages.clear();
    return (
      <CustomersScreen
        businessId={mockBusinessId}
        onSelectCustomer={() => {}}
        onNavigateToAdd={() => {}}
      />
    );
  },
};

export const ManyCustomers: Story = {
  render: () => {
    (async () => {
      await db.customers.clear();
      await db.packages.clear();
      const list: LocalCustomer[] = [];
      for (let i = 1; i <= 30; i++) {
        list.push({
          id: `cust-bulk-${i}`,
          business_id: mockBusinessId,
          name: `Customer ${i} Nigerian Transport Ltd`,
          phone_display: `0803 123 ${String(i).padStart(4, '0')}`,
          phone_normalized: `+234803123${String(i).padStart(4, '0')}`,
          version: 1,
          sync_status: 'SYNCED',
        });
      }
      await db.customers.bulkAdd(list);
    })();

    return (
      <CustomersScreen
        businessId={mockBusinessId}
        onSelectCustomer={() => {}}
        onNavigateToAdd={() => {}}
      />
    );
  },
};
