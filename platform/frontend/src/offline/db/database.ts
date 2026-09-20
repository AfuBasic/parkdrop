import Dexie, { type Table } from 'dexie';
import type { LocalMutation, LocalSyncState, LocalConflict, LocalAuthorization, LocalPackage } from './schema';

export class ParkDropDatabase extends Dexie {
  mutations!: Table<LocalMutation, number>;
  syncState!: Table<LocalSyncState, number>;
  conflicts!: Table<LocalConflict, number>;
  authorization!: Table<LocalAuthorization, string>;
  packages!: Table<LocalPackage, string>;

  constructor() {
    super('ParkDropLocalDB');
    
    this.version(1).stores({
      mutations: '++id, mutation_id, status, business_id, [business_id+status]',
      syncState: 'business_id',
      conflicts: '++id, conflict_id, mutation_id, status, business_id',
      authorization: 'id',
      packages: 'id, business_id, status, created_at, collected_at, [business_id+status], [business_id+created_at]'
    });
  }
}

export const db = new ParkDropDatabase();
