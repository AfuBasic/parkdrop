import type { Meta, StoryObj } from '@storybook/react';
import { StaffScreen } from './StaffScreen';
import type { StaffMember, PendingInvitation } from '../api/business-api';

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
    invited_by_name: 'Ada Nwosu',
    expires_at: '2026-09-28T00:00:00Z',
    created_at: '2026-09-21T00:00:00Z',
  },
];

const meta: Meta<typeof StaffScreen> = {
  title: 'Features/Business/StaffScreen',
  component: StaffScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StaffScreen>;

export const OwnerView: Story = {
  args: {
    onBack: () => {},
    mockMembers,
    mockInvitations,
    mockRole: 'owner',
    mockIsOnline: true,
  },
};

export const ManagerView: Story = {
  args: {
    onBack: () => {},
    mockMembers,
    mockInvitations,
    mockRole: 'manager',
    mockIsOnline: true,
  },
};

export const OfflineReadOnly: Story = {
  args: {
    onBack: () => {},
    mockMembers,
    mockInvitations,
    mockRole: 'owner',
    mockIsOnline: false,
  },
};

export const EmptyInvitations: Story = {
  args: {
    onBack: () => {},
    mockMembers,
    mockInvitations: [],
    mockRole: 'owner',
    mockIsOnline: true,
  },
};
