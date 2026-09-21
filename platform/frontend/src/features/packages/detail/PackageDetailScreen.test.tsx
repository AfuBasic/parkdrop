import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/offline/db/database';
import { PackageDetailScreen } from './PackageDetailScreen';

describe('PackageDetailScreen', () => {
  const businessId = 1;
  const packageId = 'pkg-test-detail-1';
  const customerId = 'cust-test-1';

  beforeEach(async () => {
    await db.packages.clear();
    await db.customers.clear();
    await db.payments.clear();
    await db.packageMedia.clear();

    await db.customers.add({
      id: customerId,
      business_id: businessId,
      name: 'Ngozi Eze',
      phone_display: '0802 345 6789',
      phone_normalized: '+2348023456789',
      version: 1,
      sync_status: 'SYNCED',
    });

    await db.packages.add({
      id: packageId,
      business_id: businessId,
      pickup_point_id: null,
      customer_id: customerId,
      public_package_id: 'PD-88220',
      pickup_code: '4K9M2PX',
      amount_due_minor: 350000,
      status: 'WAITING',
      client_created_at: new Date().toISOString(),
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
      creator_name: 'Bayo',
      pickup_point_name: 'Ikeja Hub',
    });
  });

  it('renders package details, customer card, grouped pickup code, and payment summary', async () => {
    render(
      <PackageDetailScreen
        packageId={packageId}
        businessId={businessId}
        onBack={() => {}}
      />
    );

    // Header & code (grouped 4 + 3)
    expect(await screen.findByText('PD-88220')).toBeDefined();
    expect(screen.getByText('4K9M 2PX')).toBeDefined();

    // Customer
    expect(screen.getByText('Ngozi Eze')).toBeDefined();
    expect(screen.getByText('0802 345 6789')).toBeDefined();

    // Payment summary initial state (Unpaid, full balance)
    expect(screen.getByText('Unpaid')).toBeDefined();
    expect(screen.getByText('Record payment')).toBeDefined();

    // Sticky Action Bar button
    expect(screen.getByText(/Collect ₦3,500 and release/i)).toBeDefined();

    // Operational info
    expect(screen.getByText('Ikeja Hub')).toBeDefined();
    expect(screen.getByText('Bayo')).toBeDefined();
  });

  it('records a payment and reactively updates summary to Part paid', async () => {
    const user = userEvent.setup();

    render(
      <PackageDetailScreen
        packageId={packageId}
        businessId={businessId}
        onBack={() => {}}
      />
    );

    // Open Record Payment bottom sheet
    const recordBtn = await screen.findByRole('button', { name: /Record payment/i });
    await user.click(recordBtn);

    // Sheet should be open
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();

    // Toggle part payment to reveal custom input
    const partPaymentToggle = screen.getByText(/Part payment/i);
    await user.click(partPaymentToggle);

    // Enter 1000
    const amountInput = await screen.findByLabelText(/Amount/i);
    await user.clear(amountInput);
    await user.type(amountInput, '1000');

    // Select submit button inside dialog
    const submitBtn = dialog.querySelector('button[type="submit"]') as HTMLButtonElement;
    await user.click(submitBtn);

    // Sheet closes and summary updates reactively
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    expect(await screen.findByText('Part paid')).toBeDefined();
    expect(screen.getByText('Payment history')).toBeDefined();
  });

  it('renders Package not found when id does not exist or foreign business', async () => {
    render(
      <PackageDetailScreen
        packageId="non-existent-id"
        businessId={businessId}
        onBack={() => {}}
      />
    );

    expect(await screen.findByText('Package not found')).toBeDefined();
  });
});
