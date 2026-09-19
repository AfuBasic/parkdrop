import Dexie, { type Table } from 'dexie';

export interface DeviceMeta {
  id?: number;
  device_uuid: string;
  user_id: number;
  business_id: number;
  first_name: string;
  pin_hash?: string; // Stored securely
  pin_salt?: string;
  authorized: boolean;
}

export interface PendingUpload {
  id?: number;
  hash: string;
  file: Blob;
  status: 'pending' | 'uploading' | 'failed' | 'completed';
  createdAt: number;
}

export interface RememberedIdentity {
  id?: number;
  email: string;
  name?: string;
  business_name?: string;
  last_used_at: number;
}

export class ParkDropDB extends Dexie {
  deviceMeta!: Table<DeviceMeta, number>;
  pendingUploads!: Table<PendingUpload, number>;
  rememberedIdentities!: Table<RememberedIdentity, number>;

  constructor() {
    super('ParkDropDB');
    this.version(1).stores({
      deviceMeta: '++id, device_uuid, user_id, business_id',
      pendingUploads: '++id, hash, status, createdAt'
    });
    this.version(2).stores({
      deviceMeta: '++id, device_uuid, user_id, business_id',
      pendingUploads: '++id, hash, status, createdAt',
      rememberedIdentities: '++id, &email, last_used_at'
    });
  }
}

export const db = new ParkDropDB();
