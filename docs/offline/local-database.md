# Local Database Schema & Store Classification

The local operational database is managed using Dexie (IndexedDB) in `platform/frontend/src/offline/db/database.ts`.

## Database
- **Name**: `ParkDropLocalDB`
- **Current Version**: 8

## Store Classifications & Invariants

| Store Name | Classification | Invariant & Recovery Policy |
| :--- | :--- | :--- |
| `mutations` | **OPERATIONAL / IRREPLACEABLE** | Unsent mutations to server. Never deleted during reset/rebootstrap unless confirmed synced. |
| `packages` | **OPERATIONAL / MIXED** | Synced packages (`sync_status: SYNCED`) are recreatable from server. Local packages (`PENDING_CREATE`) are irreplaceable. |
| `customers` | **OPERATIONAL / MIXED** | Synced customers are recreatable; offline-created customers are irreplaceable. |
| `payments` | **OPERATIONAL / MIXED** | Synced payments are recreatable; `PENDING_CREATE` payments are irreplaceable. |
| `packageMedia` | **OPERATIONAL / MIXED** | Cloudinary synced photos are recreatable via URL; local un-uploaded `local_blob`s are irreplaceable. |
| `conflicts` | **OPERATIONAL / IRREPLACEABLE** | Unresolved lifecycle/payment conflicts requiring staff attention. |
| `entityAliases` | **DERIVED / RECOVERY CRITICAL** | Offline ID to canonical ID mappings. Restored and preserved during rebootstrap. |
| `syncState` | **RECOVERY METADATA** | Per-business sync cursor. Can be safely reset to 0 to trigger canonical rebootstrap without deleting entities. |
| `authorization`| **SECURITY METADATA** | 24-hour offline lease snapshot. Cleared on logout or 401. |
| `smsWallets` | **CACHE / DERIVED** | Cached balance projection; refreshed on sync. |
| `smsCreditTransactions` | **CACHE / DERIVED** | Ledger history projection; refreshed on sync. |
| `quarantineRecords` | **RECOVERY / QUARANTINE** | Holds malformed rows, unresolvable mutations, or orphaned entities with safe recovery tags. |
| `recoveryMeta` | **RECOVERY METADATA** | Tracks recovery phase, recovery lock lease, health status, and diagnostic support tokens. |

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
   - Indexes: `id, business_id, name, phone_normalized, [business_id+phone_normalized], [business_id+name]`
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
11. **`payments`**: Offline and synchronized parcel payment transactions.
    - Primary key: `id` (UUID)
    - Indexes: `id, business_id, package_id, status, sync_status, recorded_at, [business_id+package_id+recorded_at], [business_id+sync_status]`
12. **`quarantineRecords`**: Quarantined corrupt or malformed local records.
    - Primary key: `id` (UUID)
    - Indexes: `id, business_id, entity_type, quarantined_at, [business_id+entity_type]`
13. **`recoveryMeta`**: Recovery lock and diagnostics metadata.
    - Primary key: `key`
    - Indexes: `key, updated_at`
