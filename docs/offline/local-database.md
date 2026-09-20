# Local Database Schema

The local operational database is managed using Dexie (IndexedDB) in `platform/frontend/src/offline/db/database.ts`.

## Database
- **Name**: `ParkDropLocalDB`
- **Current Version**: 6

## Stores & Indexes
1. **`mutations`**: The offline mutation queue.
   - Primary key: `++id`
   - Indexes: `mutation_id, status, business_id, [business_id+status]`
2. **`syncState`**: Tracks synchronization metadata.
   - Primary key: `business_id`
3. **`conflicts`**: Stores unresolved sync conflicts for user intervention.
   - Primary key: `++id`
   - Indexes: `conflict_id, mutation_id, status, business_id`
4. **`authorization`**: Stores the offline 24-hour authorization lease.
   - Primary key: `id` ('current')
5. **`packages`**: Synchronized and locally created parcels.
   - Primary key: `id` (UUID)
   - Indexes: `id, business_id, pickup_point_id, customer_id, public_package_id, pickup_code, status, client_created_at, [business_id+status], [business_id+pickup_point_id+status], [business_id+created_at], [business_id+public_package_id], [business_id+pickup_code], [customer_id+client_created_at]`
6. **`customers`**: Synchronized and locally created customer records.
   - Primary key: `id` (UUID)
   - Indexes (v6): `id, business_id, name, phone_normalized, [business_id+phone_normalized], [business_id+name]`
7. **`entityAliases`**: Maps temporary offline UUIDs to canonical server IDs.
   - Primary key: `local_id`
8. **`packageMedia`**: Offline and uploaded photo records.
   - Primary key: `id` (UUID)
   - Indexes: `id, business_id, package_id, status`
9. **`smsWallets`**: Offline cached SMS credit balance.
   - Primary key: `id`
   - Indexes: `id, business_id`
10. **`smsCreditTransactions`**: Transaction ledger for SMS balance audits.
    - Primary key: `id`
    - Indexes: `id, sms_wallet_id, created_at, [sms_wallet_id+created_at]`

