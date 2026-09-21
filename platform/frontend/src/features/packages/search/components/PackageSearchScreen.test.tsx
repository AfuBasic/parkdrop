import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PackageSearchScreen } from '@/features/packages/search/PackageSearchScreen';
import { AuthContext } from '@/features/auth/AuthContext';
import { db } from '@/offline/db/database';
import type { LocalPackage, LocalCustomer } from '@/offline/db/schema';

describe('PackageSearchScreen', () => {
  const mockBusinessId = 1;

  beforeEach(async () => {
    await db.packages.clear();
    await db.customers.clear();

    const customer: LocalCustomer = {
      id: 'cust-1',
      business_id: mockBusinessId,
      name: 'Chinedu Okafor',
      phone_display: '0803 123 4567',
      phone_normalized: '+2348031234567',
      version: 1,
      sync_status: 'SYNCED',
    };

    const pkg: LocalPackage = {
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

    await db.customers.add(customer);
    await db.packages.add(pkg);
  });

  const renderScreen = (props: { onBack?: () => void; onSelectPackage?: (p: any) => void; initialQuery?: string } = {}) => {
    return render(
      <AuthContext.Provider
        value={{
          state: 'authenticated',
          user: { id: 1, email: 'test@example.com', first_name: 'Attendant', status: 'ACTIVE' },
          business: { id: mockBusinessId, public_id: 'BUS-1', name: 'Peace Express' },
          deviceMeta: null,
          rememberedIdentity: null,
          unlock: () => {},
          setAuthenticatedUser: async () => {},
          logout: async () => {},
          forgetRememberedIdentity: async () => {},
          refreshSession: async () => {},
        }}
      >
        <PackageSearchScreen {...props} />
      </AuthContext.Provider>
    );
  };

  it('renders search input with accessible label and initial empty guidance', () => {
    renderScreen();

    const input = screen.getByLabelText(/find a package/i);
    expect(input).toBeDefined();
    expect(screen.getByText(/search by customer name, phone number, pickup code or package id/i)).toBeDefined();
  });

  it('searches and displays matched package row', async () => {
    renderScreen();

    const input = screen.getByLabelText(/find a package/i);
    fireEvent.change(input, { target: { value: '7K4P2MX' } });

    await waitFor(() => {
      expect(screen.getByText('Chinedu Okafor')).toBeDefined();
      expect(screen.getByText('PD-8K42Q')).toBeDefined();
      expect(screen.getByText('7K4P2MX')).toBeDefined();
      expect(screen.getByText(/waiting/i)).toBeDefined();
    });
  });

  it('clears query when clear button is clicked', async () => {
    renderScreen();

    const input = screen.getByLabelText(/find a package/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Chinedu' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/clear package search/i)).toBeDefined();
    });

    fireEvent.click(screen.getByLabelText(/clear package search/i));
    expect(input.value).toBe('');
    expect(screen.getByText(/search by customer name, phone number, pickup code or package id/i)).toBeDefined();
  });

  it('shows truthful no-result state when query does not match', async () => {
    renderScreen();

    const input = screen.getByLabelText(/find a package/i);
    fireEvent.change(input, { target: { value: 'Nonexistent Customer' } });

    await waitFor(() => {
      expect(screen.getByText(/no packages found/i)).toBeDefined();
    });
  });

  it('calls onBack when back button is tapped', () => {
    const onBack = vi.fn();
    renderScreen({ onBack });

    const backButton = screen.getByLabelText(/back/i);
    fireEvent.click(backButton);

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
