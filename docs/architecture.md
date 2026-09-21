# ParkDrop Architecture

## Overview
ParkDrop is split into two distinct parts within this monorepo to maintain the existing SEO equity of the marketing site while building a scalable SaaS application.

## Domains
*   **Marketing (Static HTML/CSS):** `parkdrop.com.ng` (Root directory)
*   **Frontend App (React):** `app.parkdrop.com.ng` (`/platform/frontend`)
*   **Backend API (Laravel):** `api.parkdrop.com.ng` (`/platform/backend`)
*   **Realtime Websocket (Reverb):** `ws.parkdrop.com.ng`

## Backend Architecture (Laravel)

### Multi-Tenancy
Multi-tenancy is handled explicitly through the `Business` model. 
*   Almost all entities (Packages, Customers, Users via Memberships) belong to a `Business`.
*   We rely on explicit `business_id` scoping in Eloquent Queries and Policies. We NEVER trust business IDs sent from the frontend.

### Database Principles
Data integrity is enforced at the database level, not just the application level.
*   Strict `NOT NULL` columns.
*   Foreign keys with cascading rules where appropriate.
*   Normalized email column (`email_normalized`) with case-insensitive unique index to prevent duplicate user records.
*   Money values stored as minor units (kobo).

### State Management & Events
*   **Idempotency:** Core actions (payments, SMS sending) use idempotency keys to prevent duplicate execution.
*   **Outbox Pattern:** Important domain events are saved to `outbox_events` within the same database transaction as the entity updates, ensuring reliable dispatch to the queue.

### Universal OTP Authentication & Session Lifecycle
*   **Single Unified Flow:** `Enter Email → Enter OTP → ParkDrop Decides`.
*   **OTP Security Principles:**
    *   **Layered Rate Limiting:** Cooldown (1/60s), short-window (3/15m), daily (8/24h), IP limits, and global safety caps protect the `/code` endpoint. Keys are hashed normalized emails to protect PII.
    *   **Verification Protection:** Brute-force guessing is blocked (max 5 attempts per challenge).
    *   **Challenge Storage:** Challenges store a `code_hash` rather than raw OTP to protect against database leaks.
    *   **Concurrency Safe:** Row locks and transactions guarantee single-use consumption and prevent race conditions.
    *   **Mail Queueing:** Dispatch occurs *after* commit on a high-priority `auth` queue. Payloads are encrypted at rest to avoid raw OTPs leaking in failed jobs.
*   **Endpoints:**
    *   `POST /api/v1/auth/code` — Generates and queues a 10-minute 6-digit confirmation code via ZeptoMail.
    *   `POST /api/v1/auth/code/verify` — Validates code against `auth_challenges`. Inspects database:
        *   If user exists: Logs in via Laravel Sanctum session (`Auth::login($user)`) and responds with `{ outcome: 'authenticated', user, business }`.
        *   If user does not exist: Returns `{ outcome: 'new_user', challenge_id, email }` allowing completion of name and pickup point.
    *   `GET /api/v1/auth/session` — Returns active session state (`{ authenticated: true, user, business }` or 401).
    *   `POST /api/v1/auth/logout` — Destroys server-side session and invalidates CSRF token.
*   **Client State Machine (`AuthContext`):**
    *   `booting` → initial session verification.
    *   `authenticated` → active API session.
    *   `locked` → registered workspace locked by 4-digit PIN.
    *   `remembered_expired` → session expired, offers 1-tap re-authentication without retyping email.
    *   `unknown` → first-time visitor or explicitly switched account.
*   **Offline Tolerance:** Network failure during session check does not log out an authorized offline workspace.

## Offline-First Architecture

ParkDrop is designed to operate reliably in environments with intermittent connectivity.

* **IndexedDB as Durable Working Copy**: We use Dexie to manage local data. `ParkDropLocalDB` stores `mutations`, `syncState`, `conflicts`, and a 24-hour `authorization` lease. Local data is strictly scoped by `business_id`.
* **Server as Canonical Truth**: MySQL remains the authoritative database. The client pushes pending mutations to Laravel, which validates, authorizes, and executes them idempotently, generating a receipt.
* **Mutation Queue**: Business operations (e.g. `CREATE_PACKAGE`) are locally queued with a `mutation_id` (UUID) and `device_sequence`. They are pushed in order.
* **Synchronization Protocol**: 
  * **Push**: Client sends pending operations. Server executes idempotently, records a `SyncMutationReceipt`, and returns status (`APPLIED`, `REJECTED`, `RETRYABLE`, `CONFLICT`).
  * **Pull**: Client fetches canonical `SyncChange` records using an incremental cursor.
* **Device Identity**: A `device_uuid` is generated once per browser profile. It tracks mutation origins but is **not** an authentication credential.
* **Offline Authorization**: A successful online bootstrap creates a 24-hour offline authorization lease. A true HTTP 401 instantly revokes this lease, while a network failure preserves it.
* **Realtime Sync Hints**: Reverb broadcasts lightweight `SyncHint` events on private business channels when server state changes, prompting online clients to pull changes immediately without waiting for a periodic interval.

## Frontend Architecture (React)

*   **Vite & TypeScript:** Fast, strict foundation.
*   **TanStack Router:** Type-safe routing.
*   **TanStack Query:** Server state management and caching.
*   **Tailwind CSS v4:** Design system utility layer.
*   **Lucide React:** Iconography.

### Packages Queue (Local-First Operational Status Filtering)
```
Packages bottom nav / entry
        ↓
PackagesScreen
        ↓
PackageStatusTabs (Waiting | Collected | Returned | Cancelled)
        ↓
usePackagesByStatus & usePackageStatusCounts
        ↓
PackageRepository (listByStatus & countByStatus)
        ↓
Dexie IndexedDB (packages [business_id+status] & [business_id+pickup_point_id+status])
        ↓
PackageListRow[] (deterministic recency order, reactive to local mutations and sync)
```
The operational queue defaults to `WAITING` parcels. Attendants can tap any package row to navigate toward the canonical package detail boundary. When background sync or local creation occurs, counts and list items update reactively without a full reload.

### Package Lifecycle & Terminal Transitions (Build 16)
```
Package Detail Screen
        ↓
[Return package] or [Cancel package]
        ↓
ReturnPackageSheet / CancelPackageSheet (Reason selection, note for OTHER, payment warning)
        ↓
PackageLifecycleRepository (Atomic Dexie transaction: Package.status = RETURNED/CANCELLED, enqueue mutation)
        ↓
SyncEngine Push (RETURN_PACKAGE / CANCEL_PACKAGE)
        ↓
Laravel ReturnPackageAction / CancelPackageAction (Package::lockForUpdate(), status validation, ActivityLog, SyncChange)
        ↓
Reverb SyncHint broadcast & other devices reconcile
```
**Terminal Transition Rules:**
* Valid transitions: `WAITING → RETURNED`, `WAITING → CANCELLED`.
* Invariant: First valid terminal transition committed by the server wins. Competing attempts receive structured conflict `PACKAGE_ALREADY_RETURNED` / `PACKAGE_ALREADY_CANCELLED` / `PACKAGE_ALREADY_COLLECTED`.
* Payments remain: Returning or cancelling preserves recorded payment history without automatic refunds. Ordinary new payments are forbidden on terminal packages.

### Customers Directory & Customer Detail (Build 17)
```
Customers Bottom Nav
        ↓
CustomersScreen
        ↓
CustomerDirectoryRepository (getDirectoryItems)
        ↓
Dexie Customers (business_id) + Packages aggregation + EntityAliases remap
        ↓
CustomerListItem[] (sorted by waiting packages > recent activity > name, reactive to mutations)
        ↓ tap customer
CustomerDetailScreen (/customers/:customerId)
        ↓
CustomerDirectoryRepository (getCustomerDetail)
        ↓
Waiting Packages (top priority) + Recent Package History (collected, returned, cancelled)
        ↓ tap package
PackageDetailScreen (/packages/:packageId)
```
**Architecture Rules:**
* **Operational Scope Only:** ParkDrop Customers is not a CRM. No customer notes, sales tags, marketing consent, loyalty programs, debtor accounts, or analytics graphs.
* **Deterministic Sort:** Customers with waiting packages are ordered first, followed by the most recently active customer (newest package `client_created_at`), then name alphabetically.
* **Phone & Name Search:** Reuses canonical Nigerian phone normalizer (`+234...`) across display variants and supports case-insensitive partial/token matching on names.
* **Alias Resilience:** Local duplicate customer records reconciled by the server (`db.entityAliases`) render as a single canonical customer record across directory, search, and detail.
* **Add Package Integration:** Customer Detail provides an "Add package" action which pre-populates the customer in `AddPackageScreen` without duplicate record creation.




### Staff & Business Management (Build 18)
```
More Tab → Staff (/more/staff)
        ↓
StaffScreen (Online-Only Admin UI)
        ↓
businessApi.getStaffList() / inviteStaff() / changeMemberRole() / removeMember()
        ↓
Laravel BusinessStaffController & BusinessDetailsController
        ↓
Domain Actions (InviteBusinessMemberAction, ChangeBusinessMemberRoleAction, RemoveBusinessMemberAction, UpdateBusinessDetailsAction)
        ↓ DB::transaction with row locking (last-owner count invariant check)
BusinessMembership / BusinessInvitation / ActivityLog
        ↓
Queued StaffInvitationMail (passwordless OTP auth integration)
```
**Architecture Rules:**
* **Online-Only Administration:** Staff mutations are strictly server-authoritative and require active network. No offline mutation queue in Dexie is used for staff changes.
* **Universal Passwordless Auth Integration:** When an invited user signs in with email OTP, `AuthChallengeController` matches pending invitations for their normalized email and auto-accepts them into active `BusinessMembership`.
* **Last-Owner Invariant:** A business cannot demote or remove its last active Owner. Enforced atomically via `DB::transaction()` and row locking on `business_memberships`.
* **Historical Actor Identity Preserved:** Removing staff deactivates access (`status = 'removed'`) without deleting `User` records or cascading deletions to past packages, payments, or collections.

### Operational Attention Center (Build 19)
```
Canonical Local Domain State (Dexie)
├── db.packageMedia (FAILED_RETRYABLE / NEEDS_ATTENTION)
├── db.payments (sync_status === 'NEEDS_ATTENTION')
├── db.conflicts (status === 'UNRESOLVED')
├── db.smsWallets (balance === 0 or balance < 5)
└── SmsCreditPurchase (PENDING / FAILED)
        ↓
AttentionRepository.getAttentionItems({ businessId, userRole })
        ↓
AttentionItem[] (normalized, stable ID, deterministic sort)
        ↓
Attention UI Components
├── More Screen (entry + unresolvedCount badge)
├── Home Screen (AttentionSummary preview, hidden if 0)
└── AttentionScreen (/more/attention)
        ├── View package (/packages/:id)
        ├── Retry photo (MediaUploadCoordinator.syncPendingMedia)
        ├── Buy credits (/more/sms-credits/buy)
        └── View SMS credits (/more/sms-credits)
```
**Architecture Rules:**
* **Derived Read Model:** Attention is not a source of domain truth. It is a pure reactive projection over Dexie domain state. No duplicate mutable notifications table.
* **Stable IDs:** Items have deterministic stable IDs (e.g. `photo-upload:{id}`, `payment-rejected:{id}`, `sms-wallet-zero:{business_id}`) to prevent flicker and enable stable keys.
* **Automatic Resolution:** When the underlying domain issue resolves canonically (photo uploads, wallet replenished, purchase verified), the attention item disappears immediately without manual dismissal.
* **Mutually Exclusive SMS Alerts:** At balance = 0, only `ZERO_SMS_CREDITS` is shown. At 1 to 4, only `LOW_SMS_CREDITS` is shown. Never both simultaneously.
* **Role-Aware CTAs:**
  - Owner / Manager: `Buy credits` CTA deep-linking to purchase flow.
  - Attendant: `View SMS credits` CTA (read-only balance inspection).
* **Safe Retries:** Conflict rows for collected or terminal packages never offer invalid retries. Only genuinely retryable actions (photo cloud upload) offer retry affordances.
* **Tenant Isolation:** Scoped strictly by `business_id`. Cross-tenant items never leak.

## Media Architecture (Cloudinary)

Cloudinary is the ParkDrop media provider for package photos.
* **Direct Browser Uploads:** Uploads happen directly from React to Cloudinary to save backend bandwidth.
* **Signed Uploads:** Laravel securely signs uploads. The Laravel API secret never reaches React.
* **Idempotency:** The React client computes a SHA-256 hash of the image and requests a signature. Laravel checks if an asset with this hash already exists for the business. If yes, it skips upload entirely. If no, the `public_id` includes the hash.
* **Security & Delivery:** Package photos use restricted/authenticated delivery.
* **Offline-First Workflow:**
  * Offline photos are stored locally in IndexedDB as a Blob.
  * When connectivity returns, the client requests a fresh signature and uploads directly.
* **Verification:** Laravel verifies Cloudinary upload metadata before persisting to the `package_media` database.
