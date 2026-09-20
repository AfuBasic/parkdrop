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

### Package Search (Local-First Operational Retrieval)
```
Find a package entry
        ↓
PackageSearchScreen
        ↓
usePackageSearch(businessId, activePickupPointId, query)
        ↓
classifyQuery(query)
        ↓
PackageSearchRepository
        ↓
Dexie IndexedDB (packages & customers stores with composite indexes)
        ↓
rankAndSortResults(matches)
        ↓
PackageSearchResult[] (immediate <100ms response, reactive to sync updates)
```
When server changes occur, Reverb broadcasts a `SyncHint` to trigger the `SyncEngine` pull, which updates Dexie, reactively refreshing search results via `useLiveQuery`. Search has zero hard runtime dependency on an online `/api/search` endpoint.


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
