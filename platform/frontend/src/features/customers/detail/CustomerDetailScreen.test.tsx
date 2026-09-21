import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerDetailScreen } from './CustomerDetailScreen';
import { db } from '@/offline/db/database';
import type { LocalCustomer, LocalPackage } from '@/offline/db/schema';

describe('CustomerDetailScreen', () => {
  const mockBusinessId = 1;

  beforeEach(async () => {
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

    const pkgWaiting: LocalPackage = {
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
    };

    const pkgCollected: LocalPackage = {
      id: 'pkg-2',
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
    };

    await db.customers.add(customer);
    await db.packages.bulkAdd([pkgWaiting, pkgCollected]);
  });

  it('renders customer identity, waiting packages first, and recent history', async () => {
    const handleSelectPackage = vi.fn();
    const handleAddPackage = vi.fn();
    const handleBack = vi.fn();

    render(
      <CustomerDetailScreen
        customerId="cust-1"
        businessId={mockBusinessId}
        onBack={handleBack}
        onSelectPackage={handleSelectPackage}
        onAddPackageForCustomer={handleAddPackage}
      />
    );

    // Customer Identity
    const nameElements = await screen.findAllByText('Chinedu Okafor');
    expect(screen.getByText('0803 123 4567')).toBeInTheDocument();
    const statsMatches = screen.getAllByText((content, element) => {
      return Boolean(element && element.children.length === 2 && /1\s*waiting\s*·\s*2\s*total/i.test(element.textContent || ''));
    });
    expect(statsMatches.length).toBeGreaterThan(0);

    // Waiting packages section (PD-8K42Q)
    expect(screen.getByText('PD-8K42Q')).toBeInTheDocument();
    expect(screen.getByText('7K4P2MX')).toBeInTheDocument();

    // History section (PD-71KQP)
    expect(screen.getByText('PD-71KQP')).toBeInTheDocument();
    expect(screen.getByText('Collected')).toBeInTheDocument();

    // Tap waiting package
    fireEvent.click(screen.getByText('PD-8K42Q'));
    expect(handleSelectPackage).toHaveBeenCalledWith('pkg-1');

    // Tap Add package CTA
    fireEvent.click(screen.getByRole('button', { name: /add package/i }));
    expect(handleAddPackage).toHaveBeenCalledWith('cust-1');

    // Tap Back
    fireEvent.click(screen.getByLabelText('Back to customers'));
    expect(handleBack).toHaveBeenCalled();
  });

  it('renders customer not found state gracefully', async () => {
    const handleBack = vi.fn();

    render(
      <CustomerDetailScreen
        customerId="non-existent-id"
        businessId={mockBusinessId}
        onBack={handleBack}
        onSelectPackage={vi.fn()}
      />
    );

    expect(await screen.findByText('Customer not found')).toBeInTheDocument();
    expect(screen.getByText('This customer may not be available on this device.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to customers/i }));
    expect(handleBack).toHaveBeenCalled();
  });
});
