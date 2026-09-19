# ParkDrop Master Context

## Current Project Position

**Build 1 — Authentication + Business Onboarding: IN PROGRESS**

Next build: TBD based on priorities (likely Offline Engine).

## Core Architecture Decisions

### 1. Authentication Model (Build 1)
- **Primary Auth:** Email address + OTP code sent via email. 
- **Session:** Sanctum SPA cookie/session acts as the online API authentication model. There are no long-lived bearer tokens stored in localStorage or IndexedDB.
- **Local PIN:** A 4-digit PIN is used purely as an offline device unlock mechanism for the locally authorized workspace. It is **not** an API credential.
- **Passwords:** There are no passwords. The `users` table has been simplified to rely entirely on email and OTP.
- **Email Provider:** ZeptoMail is used for sending OTP emails. This cost is platform-funded and entirely separate from business customer SMS credits.
- **Canonical Design Language:** ParkDrop Field Blue is the global design theme (see `docs/design-system.md`). All screens must consume semantic tokens from `@/design-system` and `index.css`.

### 2. Multi-Tenancy & Onboarding (Build 1)
Multi-tenancy is centered around the `Business` model.

**First-Time Owner Onboarding creates atomically:**
- The User record (if new)
- A new `Business`
- An `Owner` role `BusinessMembership` for the user
- A default `PickupPoint` associated with the business
- An `SmsWallet` for the business
- A one-time welcome grant of SMS credits in the wallet

The application relies on explicit `business_id` scoping in Eloquent Queries and Policies, never trusting frontend-provided business IDs for authorization.

### 3. Media (Cloudinary)
- **Direct Uploads:** React uploads directly to Cloudinary using signed parameters.
- **Idempotency:** Uploads are hashed (SHA-256) locally. The backend checks for duplicate hashes before generating a signature, preventing duplicate uploads and saving bandwidth.
- **Delivery:** Package photos use restricted/authenticated delivery.

### 4. Database Principles
Data integrity lives in MySQL (strict `NOT NULL`, foreign keys, money as kobo). 
Idempotency keys protect critical actions (payments, SMS).
Domain events use the outbox pattern.

### 5. Frontend Stack
React, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS v4, Lucide React, Dexie (IndexedDB) for offline storage.
