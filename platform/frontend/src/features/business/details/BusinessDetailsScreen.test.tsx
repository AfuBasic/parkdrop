import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BusinessDetailsScreen } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/details/BusinessDetailsScreen';
import { businessApi, type BusinessDetailsResponse } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/api/business-api';

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'ada@example.com', first_name: 'Ada', status: 'active' },
    role: 'owner',
  }),
}));

describe('BusinessDetailsScreen', () => {
  const mockData: BusinessDetailsResponse = {
    business: {
      id: 1,
      public_id: 'biz-uuid-1',
      name: 'ParkDrop Express Hub',
      status: 'active',
      created_at: '2026-09-01T00:00:00Z',
    },
    current_pickup_point: {
      id: 1,
      name: 'Ojota Motor Park · Counter 2',
      address: 'Ojota Motor Park, Lagos',
      landmark: 'Near Counter 2',
    },
    current_user_role: 'owner',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders business name, pickup point context, and role', () => {
    render(<BusinessDetailsScreen onBack={vi.fn()} mockData={mockData} mockRole="owner" />);

    expect(screen.getByText('ParkDrop Express Hub')).toBeDefined();
    expect(screen.getByText('Ojota Motor Park · Counter 2')).toBeDefined();
    expect(screen.getByText('Ojota Motor Park, Lagos')).toBeDefined();
    expect(screen.getByText('Owner')).toBeDefined();
    expect(screen.getByText('Edit')).toBeDefined();
  });

  it('hides edit button for attendants', () => {
    render(<BusinessDetailsScreen onBack={vi.fn()} mockData={mockData} mockRole="attendant" />);

    expect(screen.getByText('Attendant')).toBeDefined();
    expect(screen.queryByText('Edit')).toBeNull();
  });

  it('allows owner to edit and save business name', async () => {
    const updateSpy = vi.spyOn(businessApi, 'updateBusinessName').mockResolvedValue({ message: 'Success' });

    render(<BusinessDetailsScreen onBack={vi.fn()} mockData={mockData} mockRole="owner" />);

    const editBtn = screen.getByRole('button', { name: /edit business name/i });
    fireEvent.click(editBtn);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'ParkDrop Lagos Hub' } });

    const saveBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('ParkDrop Lagos Hub');
      expect(screen.getByText('ParkDrop Lagos Hub')).toBeDefined();
    });
  });
});
