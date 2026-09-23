import Dexie, { type Table } from 'dexie';
import type { LocalMutation, LocalSyncState, LocalConflict, LocalAuthorization, LocalPackage, LocalCustomer, LocalEntityAlias, LocalPackageMedia, LocalSmsWallet, LocalSmsCreditTransaction, LocalSmsCreditPurchase, LocalPayment, LocalQuarantineRecord, LocalRecoveryMeta } from './schema';

export class ParkDropDatabase extends Dexie {
  mutations!: Table<LocalMutation, number>;
  syncState!: Table<LocalSyncState, number>;
  conflicts!: Table<LocalConflict, number>;
  authorization!: Table<LocalAuthorization, string>;
  packages!: Table<LocalPackage, string>;
  customers!: Table<LocalCustomer, string>;
  entityAliases!: Table<LocalEntityAlias, string>;
  packageMedia!: Table<LocalPackageMedia, string>;
  smsWallets!: Table<LocalSmsWallet, number>;
  smsCreditTransactions!: Table<LocalSmsCreditTransaction, number>;
  smsCreditPurchases!: Table<LocalSmsCreditPurchase, string>;
  payments!: Table<LocalPayment, string>;
  quarantineRecords!: Table<LocalQuarantineRecord, string>;
  recoveryMeta!: Table<LocalRecoveryMeta, string>;

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

    this.version(4).stores({
      packageMedia: 'id, business_id, package_id, status'
    });

    this.version(5).stores({
      smsWallets: 'id, business_id',
      smsCreditTransactions: 'id, sms_wallet_id, created_at, [sms_wallet_id+created_at]'
    });

    this.version(6).stores({
      customers: 'id, business_id, name, phone_normalized, [business_id+phone_normalized], [business_id+name]'
    });

    this.version(7).stores({
      payments: 'id, business_id, package_id, status, sync_status, recorded_at, [business_id+package_id+recorded_at], [business_id+sync_status]'
    });

    this.version(8).stores({
      quarantineRecords: 'id, business_id, entity_type, quarantined_at, [business_id+entity_type]',
      recoveryMeta: 'key, updated_at'
    });

    this.version(9).stores({});

    this.version(10).stores({
      smsCreditPurchases: 'id, status'
    });
  }
}

export const db = new ParkDropDatabase();
