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
*   Money values stored as minor units (kobo).

### State Management & Events
*   **Idempotency:** Core actions (payments, SMS sending) use idempotency keys to prevent duplicate execution.
*   **Outbox Pattern:** Important domain events are saved to `outbox_events` within the same database transaction as the entity updates, ensuring reliable dispatch to the queue.

## Frontend Architecture (React)

*   **Vite & TypeScript:** Fast, strict foundation.
*   **TanStack Router:** Type-safe routing.
*   **TanStack Query:** Server state management and caching.
*   **Tailwind CSS v4:** Design system utility layer.
*   **Lucide React:** Iconography.
