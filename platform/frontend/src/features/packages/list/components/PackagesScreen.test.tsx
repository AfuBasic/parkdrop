import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PackagesScreen } from '@/features/packages/list/PackagesScreen';
import { AuthContext } from '@/features/auth/AuthContext';
import { db } from '@/offline/db/database';
import type { LocalPackage, LocalCustomer } from '@/offline/db/schema';

describe('PackagesScreen', () => {
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
      public_package_id: 'PD-7J22P',
      pickup_code: '3B8M4XY',
      amount_due_minor: 120000,
      status: 'COLLECTED',
      client_created_at: '2026-09-19T10:00:00Z',
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    };

    await db.customers.add(customer);
    await db.packages.bulkAdd([pkgWaiting, pkgCollected]);
  });

  const renderScreen = (props: {
    onNavigateToSearch?: () => void;
    onNavigateToAdd?: () => void;
    onSelectPackage?: (p: any) => void;
  } = {}) => {
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
        <PackagesScreen {...props} />
      </AuthContext.Provider>
    );
  };

  it('defaults to WAITING tab, displays waiting packages, and NEVER displays pickup codes on rows', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Chinedu Okafor')).toBeDefined();
      expect(screen.getByText('PD-8K42Q')).toBeDefined();
      // Pickup code must NEVER appear in the list row
      expect(screen.queryByText('7K4P2MX')).toBeNull();
    });

    // Check tabs
    const waitingTab = screen.getByRole('tab', { name: /waiting/i });
    expect(waitingTab.getAttribute('aria-selected')).toBe('true');
  });

  it('switches to COLLECTED tab when tapped and displays collected packages without pickup code', async () => {
    renderScreen();

    const collectedTab = screen.getByRole('tab', { name: /collected/i });
    fireEvent.click(collectedTab);

    await waitFor(() => {
      expect(collectedTab.getAttribute('aria-selected')).toBe('true');
      expect(screen.getByText('PD-7J22P')).toBeDefined();
      // Never expose pickup code in collected list row
      expect(screen.queryByText('3B8M4XY')).toBeNull();
    });
  });

  it('performs live cross-tab search across all packages', async () => {
    renderScreen();

    const searchInput = screen.getByPlaceholderText(/Name, phone or code/i);
    fireEvent.change(searchInput, { target: { value: '3B8M4XY' } });

    await waitFor(() => {
      // Cross-tab search finds collected package even while waiting tab is visually active
      expect(screen.getByText('Searching all packages')).toBeDefined();
      expect(screen.getByText('PD-7J22P')).toBeDefined();
    });
  });

  it('renders positive empty state when a tab has 0 packages', async () => {
    renderScreen();

    const otherTab = screen.getByRole('tab', { name: /other/i });
    fireEvent.click(otherTab);

    await waitFor(() => {
      expect(screen.getByText(/No packages here yet/i)).toBeDefined();
    });
  });
});
