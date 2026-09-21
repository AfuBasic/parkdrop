import type { Meta, StoryObj } from '@storybook/react';
import { ReturnPackageSheet } from './ReturnPackageSheet';
import { CancelPackageSheet } from './CancelPackageSheet';
import { ReleasePackageSheet } from './ReleasePackageSheet';
import type { LocalPackage, LocalCustomer } from '@/offline/db/schema';
import type { PaymentSummaryData } from '@/features/payments/domain/payment-summary';

const meta: Meta = {
  title: 'Packages/Lifecycle',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    layout: 'fullscreen',
  },
};

export default meta;

const mockCustomer: LocalCustomer = {
  id: 'cust-1',
  business_id: 1,
  name: 'Chinedu Okafor',
  phone_display: '0803 123 4567',
  phone_normalized: '+2348031234567',
  version: 1,
  sync_status: 'SYNCED',
};

const mockPackage: LocalPackage = {
  id: 'pkg-1',
  business_id: 1,
  pickup_point_id: null,
  customer_id: 'cust-1',
  public_package_id: 'PD-8K42Q',
  pickup_code: '7K4P2MX',
  amount_due_minor: 350000,
  status: 'WAITING',
  client_created_at: new Date().toISOString(),
  server_received_at: null,
  version: 1,
  sync_status: 'SYNCED',
};

const unpaidSummary: PaymentSummaryData = {
  amountDueMinor: 350000,
  paidMinor: 0,
  balanceMinor: 350000,
  paymentState: 'UNPAID',
  isFullyPaid: false,
  paymentCount: 0,
};

const paidSummary: PaymentSummaryData = {
  amountDueMinor: 350000,
  paidMinor: 350000,
  balanceMinor: 0,
  paymentState: 'PAID',
  isFullyPaid: true,
  paymentCount: 1,
};

export const ReturnDefault: StoryObj = {
  render: () => (
    <ReturnPackageSheet
      isOpen={true}
      onClose={() => {}}
      pkg={mockPackage}
      customer={mockCustomer}
      paymentSummary={unpaidSummary}
      onConfirmReturn={async () => {}}
      isOnline={true}
    />
  ),
};

export const ReturnWithPaymentWarning: StoryObj = {
  render: () => (
    <ReturnPackageSheet
      isOpen={true}
      onClose={() => {}}
      pkg={mockPackage}
      customer={mockCustomer}
      paymentSummary={paidSummary}
      onConfirmReturn={async () => {}}
      isOnline={true}
    />
  ),
};

export const ReturnOffline: StoryObj = {
  render: () => (
    <ReturnPackageSheet
      isOpen={true}
      onClose={() => {}}
      pkg={mockPackage}
      customer={mockCustomer}
      paymentSummary={unpaidSummary}
      onConfirmReturn={async () => {}}
      isOnline={false}
    />
  ),
};

export const CancelDefault: StoryObj = {
  render: () => (
    <CancelPackageSheet
      isOpen={true}
      onClose={() => {}}
      pkg={mockPackage}
      customer={mockCustomer}
      paymentSummary={unpaidSummary}
      onConfirmCancel={async () => {}}
      isOnline={true}
    />
  ),
};

export const CancelWithPaymentWarning: StoryObj = {
  render: () => (
    <CancelPackageSheet
      isOpen={true}
      onClose={() => {}}
      pkg={mockPackage}
      customer={mockCustomer}
      paymentSummary={paidSummary}
      onConfirmCancel={async () => {}}
      isOnline={true}
    />
  ),
};

export const CancelOffline: StoryObj = {
  render: () => (
    <CancelPackageSheet
      isOpen={true}
      onClose={() => {}}
      pkg={mockPackage}
      customer={mockCustomer}
      paymentSummary={unpaidSummary}
      onConfirmCancel={async () => {}}
      isOnline={false}
    />
  ),
};

export const ReleaseDefault: StoryObj = {
  render: () => (
    <ReleasePackageSheet
      isOpen={true}
      onClose={() => {}}
      pkg={mockPackage}
      customer={mockCustomer}
      paymentSummary={paidSummary}
      onConfirmRelease={async () => {}}
      isOnline={true}
    />
  ),
};

export const ReleaseWithUnpaidWarning: StoryObj = {
  render: () => (
    <ReleasePackageSheet
      isOpen={true}
      onClose={() => {}}
      pkg={mockPackage}
      customer={mockCustomer}
      paymentSummary={unpaidSummary}
      onConfirmRelease={async () => {}}
      onOpenRecordPayment={() => {}}
      isOnline={true}
    />
  ),
};
