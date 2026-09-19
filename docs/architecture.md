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
*   **Endpoints:**
    *   `POST /api/v1/auth/code` — Generates and emails a 15-minute 6-digit confirmation code via ZeptoMail.
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

## Frontend Architecture (React)

*   **Vite & TypeScript:** Fast, strict foundation.
*   **TanStack Router:** Type-safe routing.
*   **TanStack Query:** Server state management and caching.
*   **Tailwind CSS v4:** Design system utility layer.
*   **Lucide React:** Iconography.

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
