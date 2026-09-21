import type { Meta, StoryObj } from '@storybook/react';
import { BusinessDetailsScreen } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/details/BusinessDetailsScreen';
import type { BusinessDetailsResponse } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/api/business-api';

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
    address: 'Ojota Motor Park, Lagos State',
    landmark: 'Near Counter 2 & Departure Gate',
  },
  current_user_role: 'owner',
};

const meta: Meta<typeof BusinessDetailsScreen> = {
  title: 'Features/Business/BusinessDetailsScreen',
  component: BusinessDetailsScreen,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export default meta;
type Story = StoryObj<typeof BusinessDetailsScreen>;

export const OwnerView: Story = {
  args: {
    onBack: () => {},
    mockData,
    mockRole: 'owner',
  },
};

export const AttendantReadOnly: Story = {
  args: {
    onBack: () => {},
    mockData,
    mockRole: 'attendant',
  },
};
