import type { Meta, StoryObj } from '@storybook/react';
import { AttentionItemRow } from './components/AttentionItemRow';
import { AttentionEmptyState } from './components/AttentionEmptyState';
import { AttentionSummary } from './components/AttentionSummary';
import type { AttentionItem } from './attention-types';

const meta: Meta = {
  title: 'Features/Attention',
  parameters: {
    layout: 'centered',
  },
};

export default meta;

export const Empty: StoryObj = {
  render: () => (
    <div className="w-[390px] bg-surface-page p-4">
      <AttentionEmptyState />
    </div>
  ),
};

const photoFailedItem: AttentionItem = {
  id: 'photo-upload:1',
  type: 'PHOTO_UPLOAD_FAILED',
  severity: 'ERROR',
  title: "Package photo couldn't upload",
  message: 'Network timed out during upload to storage.',
  entityType: 'package',
  entityId: 'pkg-1',
  occurredAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  action: {
    type: 'RETRY_PHOTO',
    label: 'Retry upload',
    requiresOnline: true,
  },
  metadata: {
    publicPackageId: 'PD-8K42Q',
    customerName: 'Chinedu Okafor',
  },
};

const paymentRejectedItem: AttentionItem = {
  id: 'payment-rejected:2',
  type: 'PAYMENT_SYNC_REJECTED',
  severity: 'ERROR',
  title: 'Payment needs attention',
  message: 'This package is already fully paid, so the offline payment could not be recorded.',
  entityType: 'payment',
  entityId: 'pkg-1',
  occurredAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  action: {
    type: 'VIEW_PACKAGE',
    label: 'View package',
  },
  metadata: {
    publicPackageId: 'PD-8K42Q',
    customerName: 'Chinedu Okafor',
    amountMinor: 150000,
  },
};

const collectionConflictItem: AttentionItem = {
  id: 'sync-conflict:3',
  type: 'COLLECTION_SYNC_CONFLICT',
  severity: 'WARNING',
  title: 'Package was already collected',
  message: 'Another device collected this package first.',
  entityType: 'conflict',
  entityId: 'pkg-2',
  occurredAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  action: {
    type: 'VIEW_PACKAGE',
    label: 'View package',
  },
  metadata: {
    publicPackageId: 'PD-17XQM',
    customerName: 'Amina Bello',
  },
};

const zeroCreditsItem: AttentionItem = {
  id: 'sms-wallet-zero:101',
  type: 'ZERO_SMS_CREDITS',
  severity: 'ERROR',
  title: 'No SMS credits remaining',
  message: "Customer arrival SMS notifications won't be sent until credits are added.",
  entityType: 'wallet',
  entityId: 101,
  occurredAt: new Date().toISOString(),
  action: {
    type: 'BUY_SMS_CREDITS',
    label: 'Buy credits',
    requiresOnline: true,
  },
};

const lowCreditsItem: AttentionItem = {
  id: 'sms-wallet-low:101',
  type: 'LOW_SMS_CREDITS',
  severity: 'WARNING',
  title: 'SMS credits are running low',
  message: 'Only 3 credits remaining. Top up to keep arrival SMS active.',
  entityType: 'wallet',
  entityId: 101,
  occurredAt: new Date().toISOString(),
  action: {
    type: 'BUY_SMS_CREDITS',
    label: 'Buy credits',
    requiresOnline: true,
  },
};

const purchasePendingItem: AttentionItem = {
  id: 'purchase-pending:p1',
  type: 'SMS_CREDIT_PURCHASE_PENDING',
  severity: 'INFO',
  title: 'SMS credit payment is still being confirmed',
  message: '100 credits · ₦5,000. Please do not pay again while confirmation is in progress.',
  entityType: 'purchase',
  entityId: 'p1',
  occurredAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  action: {
    type: 'CHECK_PURCHASE',
    label: 'Check status',
    requiresOnline: true,
  },
};

export const PhotoUploadFailed: StoryObj = {
  render: () => (
    <div className="w-[390px] bg-surface-page p-4">
      <AttentionItemRow item={photoFailedItem} />
    </div>
  ),
};

export const PaymentConflict: StoryObj = {
  render: () => (
    <div className="w-[390px] bg-surface-page p-4">
      <AttentionItemRow item={paymentRejectedItem} />
    </div>
  ),
};

export const CollectionConflict: StoryObj = {
  render: () => (
    <div className="w-[390px] bg-surface-page p-4">
      <AttentionItemRow item={collectionConflictItem} />
    </div>
  ),
};

export const ZeroCredits: StoryObj = {
  render: () => (
    <div className="w-[390px] bg-surface-page p-4">
      <AttentionItemRow item={zeroCreditsItem} />
    </div>
  ),
};

export const LowCredits: StoryObj = {
  render: () => (
    <div className="w-[390px] bg-surface-page p-4">
      <AttentionItemRow item={lowCreditsItem} />
    </div>
  ),
};

export const PurchasePending: StoryObj = {
  render: () => (
    <div className="w-[390px] bg-surface-page p-4">
      <AttentionItemRow item={purchasePendingItem} />
    </div>
  ),
};

export const OfflineDisabledAction: StoryObj = {
  render: () => (
    <div className="w-[390px] bg-surface-page p-4">
      <AttentionItemRow item={photoFailedItem} isOffline={true} />
    </div>
  ),
};

export const MixedIssues: StoryObj = {
  render: () => (
    <div className="w-[390px] bg-surface-page p-4 flex flex-col gap-3">
      <AttentionItemRow item={photoFailedItem} />
      <AttentionItemRow item={paymentRejectedItem} />
      <AttentionItemRow item={collectionConflictItem} />
      <AttentionItemRow item={zeroCreditsItem} />
      <AttentionItemRow item={purchasePendingItem} />
    </div>
  ),
};

export const HomeSummaryPreview: StoryObj = {
  render: () => (
    <div className="w-[390px] bg-surface-page p-4">
      <AttentionSummary
        items={[photoFailedItem, paymentRejectedItem, collectionConflictItem]}
        onViewAll={() => console.log('View all clicked')}
      />
    </div>
  ),
};
