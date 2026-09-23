import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomersScreen } from './CustomersScreen';
import { db } from '@/offline/db/database';
import type { LocalCustomer, LocalPackage } from '@/offline/db/schema';

describe('CustomersScreen', () => {
  const mockBusinessId = 1;

  beforeEach(async () => {
    await db.customers.clear();
    await db.packages.clear();
    await db.entityAliases.clear();

    const customerA: LocalCustomer = {
      id: 'cust-1',
      business_id: mockBusinessId,
      name: 'Chinedu Okafor',
      phone_display: '0803 123 4567',
      phone_normalized: '+2348031234567',
      version: 1,
      sync_status: 'SYNCED',
    };

    const customerB: LocalCustomer = {
      id: 'cust-2',
      business_id: mockBusinessId,
      name: 'Ngozi Eze',
      phone_display: '0802 555 1234',
      phone_normalized: '+2348025551234',
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

    await db.customers.bulkAdd([customerA, customerB]);
    await db.packages.add(pkgWaiting);
  });

  it('renders customers and their reactive waiting package counts', async () => {
    const handleSelect = vi.fn();

    render(
      <CustomersScreen
        businessId={mockBusinessId}
        onSelectCustomer={handleSelect}
      />
    );

    // Both customers should appear
    expect(await screen.findByText('Chinedu Okafor')).toBeDefined();
    expect(screen.getByText('Ngozi Eze')).toBeDefined();

    // Chinedu has 1 package waiting
    expect(screen.getByText(/1 package waiting/i)).toBeDefined();

    // Ngozi has no packages waiting
    expect(screen.getByText(/No packages waiting/i)).toBeDefined();

    // Tap Chinedu row
    fireEvent.click(screen.getByText('Chinedu Okafor'));
    expect(handleSelect).toHaveBeenCalledWith('cust-1');
  });

  it('filters customers by search query (name or phone)', async () => {
    render(
      <CustomersScreen
        businessId={mockBusinessId}
        onSelectCustomer={vi.fn()}
      />
    );

    await screen.findByText('Chinedu Okafor');

    const searchInput = screen.getByPlaceholderText('Search name or phone');

    // Search by name
    fireEvent.change(searchInput, { target: { value: 'Ngozi' } });

    await waitFor(() => {
      expect(screen.queryByText('Chinedu Okafor')).toBeNull();
      expect(screen.getByText('Ngozi Eze')).toBeDefined();
    });

    // Search by phone
    fireEvent.change(searchInput, { target: { value: '08031234567' } });

    await waitFor(() => {
      expect(screen.getByText('Chinedu Okafor')).toBeDefined();
      expect(screen.queryByText('Ngozi Eze')).toBeNull();
    });

    // Clear search
    const clearButton = screen.getByLabelText('Clear customer search');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText('Chinedu Okafor')).toBeDefined();
      expect(screen.getByText('Ngozi Eze')).toBeDefined();
    });
  });

  it('displays empty state when search produces no results', async () => {
    render(
      <CustomersScreen
        businessId={mockBusinessId}
        onSelectCustomer={vi.fn()}
      />
    );

    await screen.findByText('Chinedu Okafor');

    const searchInput = screen.getByPlaceholderText('Search name or phone');
    fireEvent.change(searchInput, { target: { value: 'Nonexistent person' } });

    expect(await screen.findByText('No customers found')).toBeDefined();
    expect(screen.getByText('Try another name or phone number.')).toBeDefined();
  });
});
