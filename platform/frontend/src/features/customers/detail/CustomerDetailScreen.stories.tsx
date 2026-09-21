import type { Meta, StoryObj } from '@storybook/react';
import { CustomerDetailScreen } from './CustomerDetailScreen';
import { db } from '@/offline/db/database';
import type { LocalCustomer, LocalPackage } from '@/offline/db/schema';

const mockBusinessId = 1;

const meta: Meta<typeof CustomerDetailScreen> = {
  title: 'Features/Customers/Detail/CustomerDetailScreen',
  component: CustomerDetailScreen,
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
type Story = StoryObj<typeof CustomerDetailScreen>;

async function seedCustomerDetailData(hasWaiting = true, hasHistory = true) {
  await db.customers.clear();
  await db.packages.clear();
  await db.entityAliases.clear();

  const customer: LocalCustomer = {
    id: 'cust-1',
    business_id: mockBusinessId,
    name: 'Chinedu Okafor',
    phone_display: '0803 123 4567',
    phone_normalized: '+2348031234567',
    version: 1,
    sync_status: 'SYNCED',
  };

  const packages: LocalPackage[] = [];

  if (hasWaiting) {
    packages.push(
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
      }
    );
  }

  if (hasHistory) {
    packages.push(
      {
        id: 'pkg-3',
        business_id: mockBusinessId,
        pickup_point_id: 1,
        customer_id: 'cust-1',
        public_package_id: 'PD-71KQP',
        pickup_code: '8Y7X6WV',
        amount_due_minor: 150000,
        status: 'COLLECTED',
        client_created_at: '2026-09-18T10:00:00Z',
        server_received_at: null,
        version: 1,
        sync_status: 'SYNCED',
      },
      {
        id: 'pkg-4',
        business_id: mockBusinessId,
        pickup_point_id: 1,
        customer_id: 'cust-1',
        public_package_id: 'PD-RET11',
        pickup_code: '4B5C6DE',
        amount_due_minor: 100000,
        status: 'RETURNED',
        client_created_at: '2026-09-17T09:00:00Z',
        server_received_at: null,
        version: 1,
        sync_status: 'SYNCED',
      }
    );
  }

  await db.customers.add(customer);
  if (packages.length > 0) {
    await db.packages.bulkAdd(packages);
  }
}

export const WaitingPackages: Story = {
  render: () => {
    seedCustomerDetailData(true, true);
    return (
      <CustomerDetailScreen
        customerId="cust-1"
        businessId={mockBusinessId}
        onBack={() => {}}
        onSelectPackage={() => {}}
        onAddPackageForCustomer={() => {}}
      />
    );
  },
};

export const NoWaitingPackages: Story = {
  render: () => {
    seedCustomerDetailData(false, true);
    return (
      <CustomerDetailScreen
        customerId="cust-1"
        businessId={mockBusinessId}
        onBack={() => {}}
        onSelectPackage={() => {}}
        onAddPackageForCustomer={() => {}}
      />
    );
  },
};

export const NotFound: Story = {
  render: () => {
    return (
      <CustomerDetailScreen
        customerId="non-existent"
        businessId={mockBusinessId}
        onBack={() => {}}
        onSelectPackage={() => {}}
      />
    );
  },
};
