export interface LocalMutation {
  id?: number; // IndexedDB auto-increment
  mutation_id: string; // UUID sent to server
  device_uuid: string;
  device_sequence: number;
  business_id: number;
  pickup_point_id: number | null;
  operation: string;
  entity_id: string | null;
  base_version: number | null;
  payload: Record<string, unknown>;
  created_at: string;
  status: 'PENDING' | 'SYNCING' | 'RETRYABLE' | 'CONFLICT' | 'REJECTED';
  attempt_count: number;
  last_attempt_at: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
}

export interface LocalSyncState {
  business_id: number;
  last_sync_cursor: number;
  last_successful_sync_at: string | null;
}

export interface LocalConflict {
  id?: number;
  conflict_id: string;
  mutation_id: string;
  business_id?: number;
  entity_type: string;
  entity_id: string;
  type: string;
  local_summary: Record<string, unknown>;
  server_summary: Record<string, unknown>;
  created_at: string;
  resolved_at: string | null;
  status: 'UNRESOLVED' | 'RESOLVED';
}

export interface LocalAuthorization {
  id: 'current';
  user_id: number;
  business_id: number;
  business_name: string;
  pickup_point_id: number | null;
  authorized_at: string;
  expires_at: string;
}

export type SyncStatus = 'SYNCED' | 'PENDING_CREATE' | 'PENDING_UPDATE' | 'CONFLICT';
export type MediaSyncStatus = 'LOCAL_ONLY' | 'PENDING_UPLOAD' | 'AUTHORIZING' | 'UPLOADING' | 'VERIFYING' | 'SYNCED' | 'FAILED_RETRYABLE' | 'NEEDS_ATTENTION' | 'REMOVED';

export interface LocalPackage {
  id: string; // uuid
  business_id: number;
  pickup_point_id: number | null;
  customer_id: string;
  public_package_id: string;
  pickup_code: string;
  amount_due_minor: number;
  status: 'WAITING' | 'COLLECTED' | 'RETURNED' | 'CANCELLED';
  client_created_at: string;
  server_received_at: string | null;
  version: number;
  sync_status: SyncStatus;
  creator_name?: string | null;
  creator_phone?: string | null;
  pickup_point_name?: string | null;
  returned_at?: string | null;
  cancelled_at?: string | null;
  /**
   * When this device released the package, captured at the moment of
   * collection. Local-only: there is no backend column for it yet, so a
   * package collected on another device (or before this field existed)
   * will not have it. The UI must fall back gracefully rather than
   * fabricate a time it does not have.
   */
  collected_at?: string | null;
  terminal_reason?: string | null;
  terminal_reason_note?: string | null;
  terminal_actor_name?: string | null;
  terminal_actor_phone?: string | null;
  /**
   * Delivery status of the arrival SMS, populated from sms_messages.status via sync pull.
   * Only present when an SMS was attempted. Never shown as "Delivered" unless Termii
   * explicitly reported DELIVERED.
   *
   * Values: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'UNDELIVERED' | 'NEEDS_RECONCILIATION'
   */
  arrival_sms_status?: string | null;
  /** ISO timestamp when the arrival SMS was last sent (sent_at from sms_messages). */
  arrival_sms_sent_at?: string | null;
}

export interface LocalCustomer {
  id: string; // uuid
  business_id: number;
  name: string;
  phone_display: string;
  phone_normalized: string;
  version: number;
  sync_status: SyncStatus;
}

export interface LocalPackageMedia {
  id: string; // uuid
  business_id: number;
  package_id: string; // fk to local package uuid
  local_blob?: Blob;
  status: MediaSyncStatus;
  attempt_count: number;
  created_at: string;
  last_attempt_at?: string;
  last_error_safe?: string;
  cloudinary_asset_id?: string;
  public_id?: string;
  // Stored at upload time from the authorize response, not guessed from a
  // build-time env var — see usePackageDetail.ts for why that guessing was
  // producing broken image URLs.
  cloud_name?: string;
}

export interface LocalEntityAlias {
  local_id: string; // The offline-generated ID
  canonical_id: string; // The canonical server ID
  entity_type: string;
  resolved_at: string;
}

export interface LocalSmsWallet {
  id: number;
  business_id: number;
  balance: number;
  updated_at: string;
}

export interface LocalSmsCreditTransaction {
  id: number;
  sms_wallet_id: number;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface LocalSmsCreditPurchase {
  id: string;
  credits: number;
  amount_minor: number;
  fee_minor: number;
  currency: string;
  provider: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';
  reference: string;
  paid_at: string | null;
  created_at: string;
}

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'POS' | 'OTHER';
export type PaymentStatus = 'COMPLETED' | 'REVERSED';
export type PaymentSyncStatus = 'SYNCED' | 'PENDING_CREATE' | 'NEEDS_ATTENTION';

export interface LocalPayment {
  id: string; // uuid
  business_id: number;
  package_id: string; // fk to package uuid
  amount_minor: number; // integer kobo
  method: PaymentMethod;
  recorded_by_user_id: number | null;
  recorded_by_user_name?: string | null;
  recorded_by_device_uuid?: string | null;
  recorded_at: string;
  client_recorded_at: string;
  status: PaymentStatus;
  reverses_payment_id?: string | null;
  reversal_reason?: string | null;
  sync_status: PaymentSyncStatus;
  sync_error?: string | null;
  version: number;
}

export interface LocalQuarantineRecord {
  id: string; // uuid
  business_id: number | null;
  entity_type: string;
  entity_id: string | null;
  raw_payload: Record<string, unknown>;
  reason: string;
  quarantined_at: string;
  resolved_at: string | null;
}

export interface LocalRecoveryMeta {
  key: string;
  value: unknown;
  updated_at: string;
}

