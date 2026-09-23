import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StaffScreen } from '@/features/business/staff/StaffScreen';
import { businessApi, type StaffMember, type PendingInvitation } from '@/features/business/api/business-api';

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'ada@example.com', first_name: 'Ada', status: 'active' },
    role: 'owner',
  }),
}));

describe('StaffScreen', () => {
  const mockMembers: StaffMember[] = [
    {
      id: 1,
      user_id: 1,
      name: 'Ada Nwosu',
      email: 'ada@example.com',
      role: 'owner',
      status: 'active',
      joined_at: '2026-09-01T00:00:00Z',
    },
    {
      id: 2,
      user_id: 2,
      name: 'Tunde Bello',
      email: 'tunde@example.com',
      role: 'manager',
      status: 'active',
      joined_at: '2026-09-02T00:00:00Z',
    },
    {
      id: 3,
      user_id: 3,
      name: 'Chioma Eze',
      email: 'chioma@example.com',
      role: 'attendant',
      status: 'active',
      joined_at: '2026-09-03T00:00:00Z',
    },
  ];

  const mockInvitations: PendingInvitation[] = [
    {
      id: 'inv-1',
      email: 'emeka@example.com',
      role: 'attendant',
      status: 'pending',
      invited_by_name: 'Ada',
      expires_at: '2026-09-28T00:00:00Z',
      created_at: '2026-09-21T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders active staff members with names, roles, and pending invitations', () => {
    render(
      <StaffScreen
        onBack={vi.fn()}
        mockMembers={mockMembers}
        mockInvitations={mockInvitations}
        mockRole="owner"
      />
    );

    expect(screen.getByText('Ada Nwosu')).toBeDefined();
    expect(screen.getByText('Owner')).toBeDefined();
    expect(screen.getByText('Tunde Bello')).toBeDefined();
    expect(screen.getByText('Manager')).toBeDefined();
    expect(screen.getByText('Chioma Eze')).toBeDefined();
    expect(screen.getAllByText('Attendant').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('emeka@example.com')).toBeDefined();
    expect(screen.getByText('Invitation pending')).toBeDefined();
    expect(screen.getByText('Invite staff')).toBeDefined();
  });

  it('displays offline banner and disables online actions when offline', () => {
    render(
      <StaffScreen
        onBack={vi.fn()}
        mockMembers={mockMembers}
        mockInvitations={mockInvitations}
        mockRole="owner"
        mockIsOnline={false}
      />
    );

    expect(
      screen.getByText('Connect to the internet to manage staff or send invitations.')
    ).toBeDefined();

    const inviteButton = screen.getByRole('button', { name: /invite staff/i });
    expect(inviteButton).toHaveProperty('disabled', true);
  });

  it('hides invite button for attendant role', () => {
    render(
      <StaffScreen
        onBack={vi.fn()}
        mockMembers={mockMembers}
        mockInvitations={[]}
        mockRole="attendant"
      />
    );

    expect(screen.queryByText('Invite staff')).toBeNull();
  });

  it('opens member actions sheet on row click for manageable staff', () => {
    render(
      <StaffScreen
        onBack={vi.fn()}
        mockMembers={mockMembers}
        mockInvitations={[]}
        mockRole="owner"
      />
    );

    const chiomaRow = screen.getByLabelText(/Chioma Eze/i);
    fireEvent.click(chiomaRow);

    expect(screen.getByText('Change role')).toBeDefined();
    expect(screen.getByText('Remove access')).toBeDefined();
  });

  it('calls resendInvitation API when clicking Resend', async () => {
    const resendSpy = vi.spyOn(businessApi, 'resendInvitation').mockResolvedValue({ message: 'Resent' });

    render(
      <StaffScreen
        onBack={vi.fn()}
        mockMembers={mockMembers}
        mockInvitations={mockInvitations}
        mockRole="owner"
        mockIsOnline={true}
      />
    );

    const resendButton = screen.getByLabelText(/Resend invitation to emeka@example.com/i);
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(resendSpy).toHaveBeenCalledWith('inv-1');
    });
  });
});
