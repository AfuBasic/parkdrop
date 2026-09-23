import type { Meta, StoryObj } from '@storybook/react';
import { PackageDetailScreen } from './PackageDetailScreen';
import { db } from '@/offline/db/database';
import type { LocalPackage, LocalCustomer, LocalPayment } from '@/offline/db/schema';
import { useEffect } from 'react';

const meta: Meta<typeof PackageDetailScreen> = {
  title: 'Packages/PackageDetailScreen',
  component: PackageDetailScreen,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof PackageDetailScreen>;

function SeedWrapper({
  pkg,
  customer,
  payments = [],
  children,
}: {
  pkg: LocalPackage;
  customer?: LocalCustomer;
  payments?: LocalPayment[];
  children: React.ReactNode;
}) {
  useEffect(() => {
    async function seed() {
      await db.packages.put(pkg);
      if (customer) {
        await db.customers.put(customer);
      }
      for (const p of payments) {
        await db.payments.put(p);
      }
    }
    seed();
  }, [pkg, customer, payments]);

  return <div className="bg-surface-page min-h-screen">{children}</div>;
}

const mockCustomer: LocalCustomer = {
  id: 'cust-1',
  business_id: 1,
  name: 'Chinedu Okafor',
  phone_display: '0803 123 4567',
  phone_normalized: '+2348031234567',
  version: 1,
  sync_status: 'SYNCED',
};

const basePackage: LocalPackage = {
  id: 'pkg-story-1',
  business_id: 1,
  pickup_point_id: 1,
  customer_id: 'cust-1',
  public_package_id: 'PD-7X991',
  pickup_code: '4K8M1QA',
  amount_due_minor: 350000,
  status: 'WAITING',
  client_created_at: new Date().toISOString(),
  server_received_at: new Date().toISOString(),
  version: 1,
  sync_status: 'SYNCED',
  creator_name: 'Ada Obi',
  pickup_point_name: 'Victoria Island Station',
};

export const WaitingUnpaid: Story = {
  render: () => (
    <SeedWrapper pkg={basePackage} customer={mockCustomer} payments={[]}>
      <PackageDetailScreen packageId={basePackage.id} businessId={1} onBack={() => {}} />
    </SeedWrapper>
  ),
};

export const WaitingPartPaid: Story = {
  render: () => {
    const payments: LocalPayment[] = [
      {
        id: 'pay-story-1',
        business_id: 1,
        package_id: basePackage.id,
        amount_minor: 100000,
        method: 'CASH',
        recorded_by_user_id: 1,
        recorded_by_user_name: 'Ada Obi',
        recorded_at: new Date().toISOString(),
        client_recorded_at: new Date().toISOString(),
        status: 'COMPLETED',
        sync_status: 'SYNCED',
        version: 1,
      },
    ];

    return (
      <SeedWrapper pkg={basePackage} customer={mockCustomer} payments={payments}>
        <PackageDetailScreen packageId={basePackage.id} businessId={1} onBack={() => {}} />
      </SeedWrapper>
    );
  },
};

export const FullyPaid: Story = {
  render: () => {
    const payments: LocalPayment[] = [
      {
        id: 'pay-story-2',
        business_id: 1,
        package_id: basePackage.id,
        amount_minor: 350000,
        method: 'TRANSFER',
        recorded_by_user_id: 1,
        recorded_by_user_name: 'Tunde Bakare',
        recorded_at: new Date().toISOString(),
        client_recorded_at: new Date().toISOString(),
        status: 'COMPLETED',
        sync_status: 'SYNCED',
        version: 1,
      },
    ];

    return (
      <SeedWrapper pkg={basePackage} customer={mockCustomer} payments={payments}>
        <PackageDetailScreen packageId={basePackage.id} businessId={1} onBack={() => {}} />
      </SeedWrapper>
    );
  },
};

export const CollectedPackage: Story = {
  render: () => {
    const collectedPkg: LocalPackage = {
      ...basePackage,
      id: 'pkg-story-collected',
      status: 'COLLECTED',
    };

    return (
      <SeedWrapper pkg={collectedPkg} customer={mockCustomer} payments={[]}>
        <PackageDetailScreen packageId={collectedPkg.id} businessId={1} onBack={() => {}} />
      </SeedWrapper>
    );
  },
};

export const NotFound: Story = {
  render: () => (
    <PackageDetailScreen packageId="unknown-package-id" businessId={1} onBack={() => {}} />
  ),
};
