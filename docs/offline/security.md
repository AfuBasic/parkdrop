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

## Staff Management & Membership Revocation (Build 18)
- **Online-Only Administration:** Staff invitations, role changes, and member removals are strictly online-only. The client cannot queue administrative mutations locally while offline.
- **Server Authority on Sync:** When an offline device syncs queued mutations, Laravel authoritatively verifies that the requesting user possesses an active `BusinessMembership` at the moment of synchronization.
- **Offline Revocation Limitation:** An offline device cannot learn about a membership revocation until it reconnects or its 24-hour offline authorization lease expires. ParkDrop adheres to the offline authorization lease policy rather than making false claims of instantaneous remote offline revocation.
- **Last-Owner Safeguard:** Concurrency-safe transactions with row locks ensure that a business can never be left with zero active Owners.
- **Privacy & Secrets:** Raw invitation tokens and OTPs are never stored in localStorage, never logged, and never broadcast over WebSocket channels.

## Operational Attention Center Security (Build 19)
- **Active Business Isolation:** Attention queries (`AttentionRepository.getAttentionItems`) strictly filter all underlying Dexie stores (`packageMedia`, `payments`, `conflicts`, `smsWallets`) by the authenticated user's active `business_id`. Cross-tenant items never leak.
- **PII Minimization:** Attention items reference packages by public package ID (`PD-8K42Q`) and customer name. Customer phone numbers and internal UUIDs are strictly omitted from list rows to prevent incidental PII exposure.
- **No Provider Error Leaks:** Cloud storage, payment provider, or webhook internal errors are never exposed directly to attendants. Safe user-facing error messages are derived centrally.
- **Role-Enforced Actions:** Actions such as `BUY_SMS_CREDITS` are strictly gated to `owner` and `manager` roles. Attendant roles receive read-only `VIEW_SMS_CREDITS` actions. Backend payment and purchase APIs strictly authorize the requesting user's role on submission.
- **Offline Honesty & Gating:** Online-only actions (such as buying credits, checking payment status, or uploading photos to Cloudinary) are disabled when connectivity is unreachable, instructing the attendant to connect to the internet rather than falsely queueing unsupportable administrative actions.

## Daily Operations & Reports Security (Build 21)
- **Role Gating:** Reports access is strictly restricted to `owner` and `manager` roles via `ReportPolicy`. Attendants cannot access `/more/reports` and API endpoints return 403 Forbidden.
- **Tenant & Scope Scoping:** Every query and export verifies that the requested business and pickup point belong to the authenticated user's active membership.
- **CSV Formula Injection Defense:** Cell values in exported CSVs that begin with dangerous formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) are automatically escaped with a leading single quote (`'`), neutralizing potential spreadsheet DDE injection attacks.
- **PII Minimization in Exports:** Exported CSVs contain only public package IDs (`PD-8K42Q`) and customer display names. Customer phone numbers and package pickup codes are strictly omitted by default to avoid creating portable high-risk release credentials.
- **Safe Historical Actor Retention:** Historical events preserve safe staff names for audit purposes even if the staff member is subsequently deactivated or removed from the business, preventing null-pointer crashes or broken audit records.
- **Offline Truthfulness:** Older dates outside local retention clearly inform the user that historical data is unavailable offline and require an internet connection, never displaying false zero totals.

## Account, Security & Device Management Security (Build 22)
- **Passwordless Identity Assurance:** The account email is strictly read-only after creation and verified via one-time verification codes (`email_verified_at`). No password or PIN entry fields exist in account settings.
- **IDOR Protection on Device Revocation:** Device revocation endpoints (`POST /devices/{id}/revoke`) strictly enforce that the target `UserDevice` belongs to the authenticated user (`where('user_id', $user->id)`). Revocation attempts against another user's device return a 404/422 and cannot leak or alter foreign device sessions.
- **Dual Table Sync Invalidation:** Revoking a `user_device` immediately synchronizes with the `devices` table by setting `is_revoked = true`. Subsequent mutations pushed by the revoked device are authoritatively rejected by `PushMutationsAction` with `DEVICE_REVOKED`.
- **Honest Offline Lease Communication:** Rather than showing an artificial seconds countdown that induces panic, offline authorization lease status is stated in plain, calm language ("Available until Tomorrow at 2:30 PM"). If the lease has lapsed, the user is honestly informed that reconnection is required to renew offline capabilities.
- **Multi-Business Unsynced Work Protection:** Sign-out performs an IndexedDB scan across all pending mutations (`PENDING`, `RETRYABLE`) regardless of which business is currently selected. Attendants and owners are warned if pending changes exist across multiple workplaces, offering the choice to sync now or sign out while preserving the queue safely in local storage. Local mutations are never silently dropped.
- **Multi-User Browser State Isolation:** On logout, local authorization leases and session state are cleared. If a different staff member logs in on the same shared browser, tenant-scoped Dexie filters and fresh session credentials prevent User B from viewing unauthorized data.


