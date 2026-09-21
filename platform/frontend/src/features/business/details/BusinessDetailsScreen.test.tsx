import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BusinessDetailsScreen } from './BusinessDetailsScreen';
import { businessApi, type BusinessDetailsResponse } from '../api/business-api';

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'ada@example.com', first_name: 'Ada', status: 'active' },
    role: 'owner',
    deviceMeta: {
      id: 1,
      device_uuid: 'dev-123',
      user_id: 1,
      business_id: 1,
      pin_hash: 'mockhash',
      pin_salt: 'mocksalt',
    },
  }),
}));

vi.mock('@/lib/pin', () => ({
  verifyPin: vi.fn().mockImplementation((pin: string) => Promise.resolve(pin === '1234')),
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
      park_name: 'Ojota Motor Park',
      contact_phone: '2348031234567',
      address: 'Ojota Motor Park, Lagos',
      landmark: 'Near Counter 2',
    },
    current_user_role: 'owner',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders business name, pickup point context, contact phone, and role', () => {
    render(<BusinessDetailsScreen onBack={vi.fn()} mockData={mockData} mockRole="owner" />);

    expect(screen.getByText('ParkDrop Express Hub')).toBeDefined();
    expect(screen.getByText('Ojota Motor Park · Counter 2')).toBeDefined();
    expect(screen.getByText('Ojota Motor Park, Lagos')).toBeDefined();
    expect(screen.getByText('0803 123 4567')).toBeDefined();
    expect(screen.getByText('Owner')).toBeDefined();
  });

  it('hides edit button for attendants', () => {
    render(<BusinessDetailsScreen onBack={vi.fn()} mockData={mockData} mockRole="attendant" />);

    expect(screen.getByText('Attendant')).toBeDefined();
    expect(screen.queryByRole('button', { name: /edit business name/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /edit contact phone/i })).toBeNull();
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

  it('allows owner to update contact phone with valid PIN and updates live preview', async () => {
    const updatePickupSpy = vi.spyOn(businessApi, 'updatePickupPoint').mockResolvedValue({
      message: 'Updated',
      pickup_point: { id: 1, contact_phone: '2348099887766', contact_phone_confirmed_at: '2026-09-21T23:00:00Z' },
    });

    render(<BusinessDetailsScreen onBack={vi.fn()} mockData={mockData} mockRole="owner" />);

    const editPhoneBtn = screen.getByRole('button', { name: /edit contact phone/i });
    fireEvent.click(editPhoneBtn);

    const phoneInput = screen.getByPlaceholderText('0803 123 4567');
    fireEvent.change(phoneInput, { target: { value: '0809 988 7766' } });

    const continueBtn = screen.getByRole('button', { name: /continue with pin/i });
    fireEvent.submit(continueBtn.closest('form')!);

    // PIN modal appears
    expect(screen.getByText('Enter your 4-digit PIN')).toBeDefined();

    const pinInput = screen.getByPlaceholderText('••••');
    fireEvent.change(pinInput, { target: { value: '1234' } });

    const confirmBtn = screen.getByRole('button', { name: /confirm & save/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(updatePickupSpy).toHaveBeenCalledWith(1, {
        name: 'Ojota Motor Park · Counter 2',
        park_name: 'Ojota Motor Park',
        contact_phone: '2348099887766',
      });
      expect(screen.getByText('0809 988 7766')).toBeDefined();
    });
  });
});
