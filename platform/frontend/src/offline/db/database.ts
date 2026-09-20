import Dexie, { type Table } from 'dexie';
import type { LocalMutation, LocalSyncState, LocalConflict, LocalAuthorization, LocalPackage, LocalCustomer, LocalEntityAlias } from './schema';

export class ParkDropDatabase extends Dexie {
  mutations!: Table<LocalMutation, number>;
  syncState!: Table<LocalSyncState, number>;
  conflicts!: Table<LocalConflict, number>;
  authorization!: Table<LocalAuthorization, string>;
  packages!: Table<LocalPackage, string>;
  customers!: Table<LocalCustomer, string>;
  entityAliases!: Table<LocalEntityAlias, string>;

  constructor() {
    super('ParkDropLocalDB');
    
    this.version(1).stores({
      mutations: '++id, mutation_id, status, business_id, [business_id+status]',
      syncState: 'business_id',
      conflicts: '++id, conflict_id, mutation_id, status, business_id',
      authorization: 'id',
      packages: 'id, business_id, status, created_at, collected_at, [business_id+status], [business_id+created_at]'
    });

    this.version(2).stores({
      customers: 'id, business_id, phone_normalized, [business_id+phone_normalized]',
      entityAliases: 'local_id'
    });

    this.version(3).stores({
      packages: 'id, business_id, pickup_point_id, customer_id, public_package_id, pickup_code, status, client_created_at, [business_id+status], [business_id+pickup_point_id+status], [business_id+created_at], [business_id+public_package_id], [business_id+pickup_code], [customer_id+client_created_at]'
    });
  }
}

export const db = new ParkDropDatabase();
