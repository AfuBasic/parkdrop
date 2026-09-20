# Offline Security Model

## Device Identity
The `device_uuid` is generated once and stored in `localStorage` (`pd_device_uuid`). 
It acts as a tracking and ordering mechanism for mutations, but it is **NOT** an authentication token.
A malicious user cannot spoof a `device_uuid` to gain unauthorized access because the server still relies on the Sanctum session cookie for authorization.

## Offline Authorization Lease
When the network is unreachable, ParkDrop falls back to a **Local Authorization Snapshot** stored in Dexie (`authorization` table).
- This lease grants offline operation capabilities for **24 hours** by default.
- It does not contain session secrets.
- An HTTP 401 response (Session Expired) immediately clears this lease.
- Explicit logout clears this lease.
- If the lease expires while offline, the user is prompted to reconnect to verify their session.

## Data Isolation
IndexedDB contains operational business data.
We scope all `sync_changes` and `mutations` strictly to the `business_id`. The server absolutely prevents cross-tenant data leakage by enforcing that a user only syncs data for businesses they are an active member of.

## Note on Encryption
IndexedDB is not application-level encrypted. We rely on device-level and OS-level security to protect the data at rest. Session secrets are not stored in IndexedDB.
