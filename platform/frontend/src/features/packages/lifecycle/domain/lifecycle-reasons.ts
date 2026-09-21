export type ReturnReason =
  | 'CUSTOMER_DID_NOT_COLLECT'
  | 'RETURNED_TO_SENDER'
  | 'WRONG_DESTINATION'
  | 'DAMAGED'
  | 'OTHER';

export type CancelReason =
  | 'DUPLICATE_RECORD'
  | 'CREATED_BY_MISTAKE'
  | 'PACKAGE_NOT_RECEIVED'
  | 'WRONG_CUSTOMER'
  | 'OTHER';

export const RETURN_REASONS: Array<{ value: ReturnReason; label: string }> = [
  { value: 'CUSTOMER_DID_NOT_COLLECT', label: 'Customer did not collect' },
  { value: 'RETURNED_TO_SENDER', label: 'Returned to sender' },
  { value: 'WRONG_DESTINATION', label: 'Wrong destination' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'OTHER', label: 'Other' },
];

export const CANCEL_REASONS: Array<{ value: CancelReason; label: string }> = [
  { value: 'DUPLICATE_RECORD', label: 'Duplicate record' },
  { value: 'CREATED_BY_MISTAKE', label: 'Created by mistake' },
  { value: 'PACKAGE_NOT_RECEIVED', label: 'Package not received' },
  { value: 'WRONG_CUSTOMER', label: 'Wrong customer' },
  { value: 'OTHER', label: 'Other' },
];

export function getReturnReasonLabel(reason?: string | null): string {
  if (!reason) return '';
  const match = RETURN_REASONS.find(r => r.value === reason);
  return match ? match.label : reason;
}

export function getCancelReasonLabel(reason?: string | null): string {
  if (!reason) return '';
  const match = CANCEL_REASONS.find(r => r.value === reason);
  return match ? match.label : reason;
}
