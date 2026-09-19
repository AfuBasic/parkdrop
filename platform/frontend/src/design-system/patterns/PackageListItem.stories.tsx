import type { Meta, StoryObj } from '@storybook/react';
import { PackageListItem } from '../patterns/PackageListItem';

const meta = {
  title: 'Patterns/PackageListItem',
  component: PackageListItem,
  tags: ['autodocs'],
} satisfies Meta<typeof PackageListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Waiting: Story = {
  args: {
    customerName: 'John Doe',
    phoneNumber: '0803 123 4567',
    pickupCode: 'JD-1234',
    status: 'WAITING',
    paymentStatus: 'UNPAID',
    amount: 1500,
    dateReceived: 'Today, 10:30 AM',
  },
};

export const Collected: Story = {
  args: {
    customerName: 'Jane Smith',
    phoneNumber: '0701 987 6543',
    pickupCode: 'JS-9876',
    status: 'COLLECTED',
    paymentStatus: 'PAID',
    amount: 2000,
    dateReceived: 'Yesterday, 2:15 PM',
  },
};
