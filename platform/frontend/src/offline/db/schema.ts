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

export interface LocalPackage {
  id: string; // public_package_id or uuid
  business_id: number;
  pickup_point_id: number | null;
  customer_name: string;
  customer_phone: string;
  pickup_code: string | null;
  amount_due: number; // minor units
  status: 'WAITING' | 'COLLECTED' | 'RETURNED' | 'CANCELLED';
  created_at: string;
  collected_at: string | null;
  sync_status: 'SYNCED' | 'PENDING_CREATE' | 'PENDING_UPDATE';
}

export interface LocalCustomer {
  id: string; // uuid
  business_id: number;
  name: string;
  phone_display: string;
  phone_normalized: string;
  version: number;
  sync_status: 'SYNCED' | 'PENDING_CREATE' | 'PENDING_UPDATE';
}

export interface LocalEntityAlias {
  local_id: string; // The offline-generated ID
  canonical_id: string; // The canonical server ID
  entity_type: string;
  resolved_at: string;
}
