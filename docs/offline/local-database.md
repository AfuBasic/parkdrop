# Local Database Schema

The local operational database is managed using Dexie (IndexedDB) in `platform/frontend/src/offline/db/database.ts`.

## Database
- **Name**: `ParkDropLocalDB`
- **Version**: 1

## Stores
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
