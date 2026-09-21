export type AttentionSeverity = 'INFO' | 'WARNING' | 'ERROR';

export type AttentionType =
  | 'PHOTO_UPLOAD_FAILED'
  | 'SMS_FAILED'
  | 'SMS_NOT_SENT_NO_CREDITS'
  | 'ZERO_SMS_CREDITS'
  | 'LOW_SMS_CREDITS'
  | 'PAYMENT_SYNC_REJECTED'
  | 'COLLECTION_SYNC_CONFLICT'
  | 'PACKAGE_LIFECYCLE_CONFLICT'
  | 'MUTATION_NEEDS_ATTENTION'
  | 'SMS_CREDIT_PURCHASE_PENDING'
  | 'SMS_CREDIT_PURCHASE_FAILED';

export type AttentionActionType =
  | 'VIEW_PACKAGE'
  | 'RETRY_PHOTO'
  | 'BUY_SMS_CREDITS'
  | 'VIEW_SMS_CREDITS'
  | 'CHECK_PURCHASE'
  | 'ACKNOWLEDGE_CONFLICT';

export interface AttentionAction {
  type: AttentionActionType;
  label: string;
  targetId?: string | number;
  requiresOnline?: boolean;
}

export interface AttentionItem {
  id: string; // Stable deterministic ID: e.g. photo-upload:{mediaId}, zero-credits:{businessId}
  type: AttentionType;
  severity: AttentionSeverity;
  title: string;
  message: string;
  entityType: 'package' | 'payment' | 'wallet' | 'purchase' | 'conflict';
  entityId: string | number;
  occurredAt: string; // ISO string
  action?: AttentionAction;
  metadata?: {
    publicPackageId?: string;
    customerName?: string;
    amountMinor?: number;
    credits?: number;
  };
}
