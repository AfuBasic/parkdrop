import type { Meta, StoryObj } from '@storybook/react';
import { CustomerLookup } from './CustomerLookup';
import { CustomerRepository } from '../../../offline/repositories/CustomerRepository';

const meta = {
  title: 'Features/Customers/CustomerLookup',
  component: CustomerLookup,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[360px] bg-slate-50 p-4 border border-slate-200 shadow-sm rounded-3xl min-h-[500px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CustomerLookup>;

export default meta;
type Story = StoryObj<typeof meta>;

// We mock the DB repository for stories
const mockBusinessId = 1;

export const Default: Story = {
  args: {
    businessId: mockBusinessId,
    pickupPointId: null,
    onCustomerSelected: (customer) => console.log('Selected:', customer),
  },
};

export const ExistingCustomer: Story = {
  args: {
    businessId: mockBusinessId,
    pickupPointId: null,
    onCustomerSelected: (customer) => console.log('Selected:', customer),
  },
  decorators: [
    (Story) => {
      CustomerRepository.findByNormalizedPhone = async () => ({
        id: 'mock-uuid-1',
        business_id: mockBusinessId,
        name: 'Chinedu Okafor',
        phone_display: '0803 123 4567',
        phone_normalized: '+2348031234567',
        version: 1,
        sync_status: 'SYNCED'
      });
      return <Story />;
    },
  ],
};

export const NewCustomer: Story = {
  args: {
    businessId: mockBusinessId,
    pickupPointId: null,
    onCustomerSelected: (customer) => console.log('Selected:', customer),
  },
  decorators: [
    (Story) => {
      CustomerRepository.findByNormalizedPhone = async () => undefined;
      CustomerRepository.createLocal = async (bid, name, phone) => ({
        id: 'mock-new-uuid',
        business_id: bid,
        name,
        phone_display: phone,
        phone_normalized: '+234' + phone.replace(/\D/g, '').slice(-10),
        version: 1,
        sync_status: 'PENDING_CREATE'
      });
      return <Story />;
    },
  ],
};

export const LongCustomerName: Story = {
  args: {
    businessId: mockBusinessId,
    pickupPointId: null,
    onCustomerSelected: (customer) => console.log('Selected:', customer),
  },
  decorators: [
    (Story) => {
      CustomerRepository.findByNormalizedPhone = async () => ({
        id: 'mock-uuid-2',
        business_id: mockBusinessId,
        name: 'Oluwafemi Babatunde Adeyemi Oladipo',
        phone_display: '0802 555 1234',
        phone_normalized: '+2348025551234',
        version: 1,
        sync_status: 'SYNCED'
      });
      return <Story />;
    },
  ],
};
