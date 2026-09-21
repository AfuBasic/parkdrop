# ParkDrop Master Context

## Current Project Position

**Build 1 — Authentication + Business Onboarding: COMPLETED**
**Build 3 — Offline-First Engine: COMPLETED**
**Build 4 — Home (Mobile-First Operational Screen): COMPLETED**
**Build 7 — Package Photos + Cloudinary: COMPLETED**
**Build 8 — Arrival SMS: COMPLETED**
**Build 9 — SMS Credit Wallet: COMPLETED**
**Build 10 — Buy SMS Credits: COMPLETED**
**Build 11 — Package Search (Local-First Operational Package Retrieval): COMPLETED**
**Build 12 — Packages List (Local-First Operational Package Queue + Status Filtering): COMPLETED**
**Build 13 — Package Detail (Single Operational Package Record + Customer + Photo + SMS + Payment + Activity): COMPLETED**
**Build 14 — Payments (Append-Only Payment Recording + Offline Support + Derived Payment State + Concurrency Safety): COMPLETED**
**Build 16 — Return & Cancel Package Lifecycle (Deliberate Terminal Actions + Reasons + Offline Support + Concurrency Safety): COMPLETED**
**Build 17 — Customers Directory & Customer Detail (Local-First Customer Browse + Package History + Active Package Visibility): COMPLETED**
**Build 18 — Staff & Business Management (Memberships + Invitations + Roles + Safe Removal + Basic Business Settings): COMPLETED**
**Build 19 — Notifications & Operational Attention Center (Actionable Exceptions + Sync Conflicts + Failed Operations + Low SMS Credits): COMPLETED**
**Build 20 — Pickup Point Management & Business Switching (Multi-Location Operational Context + Multi-Business Membership + Safe Data Scoping): COMPLETED**
**Build 21 — Daily Operations & Reports (Date-Based Package Activity + Payment Summaries + Canonical CSV Exports): COMPLETED**
**Build 22 — Account, Security & Device Management (Passwordless Account Settings + Sessions + Registered Devices + Offline Authorization Leases): COMPLETED**
**Build 23 — Data Backup, Recovery & Operational Resilience (Local Database Integrity + Safe Recovery + Device Replacement + Sync Repair + Crash Hardening): COMPLETED**
**Build 24 — Production Readiness, Observability & Release Hardening (Deployment Safety + Health Checks + Provider Failure Drills + Security + Performance + Release Runbooks): COMPLETED**

ParkDrop Core Product Milestones: All Core Builds Complete (Builds 1 through 24).

## Core Architecture Decisions

### 1. Authentication Model (Build 1)
- **Universal Mental Model:** Enter Email → Enter OTP → ParkDrop Decides What Happens Next.
  - No separate Login and Register flows.
  - No asking the user whether they already have an account.
  - No passwords. No "Don't have an account? Sign up" patterns.
  - The user simply enters their email and continues.
- **Backend Decision Engine:**
  - `POST /api/v1/auth/code` sends a 10-minute 6-digit confirmation code.
    - Heavily rate-limited (cooldown, short-window, daily, IP, global).
    - Email dispatch is high-priority queued (`auth` queue) *after* DB transaction commits.
  - `POST /api/v1/auth/code/verify` checks the code and inspects the database:
    - Verifications are brute-force protected (max 5 attempts) and row-locked to prevent concurrent consumption.
    - If user exists: logs user into Sanctum session (`Auth::login($user)`) and returns `{ outcome: 'authenticated', user, business }`.
    - If user does not exist: returns `{ outcome: 'new_user', challenge_id, email }`, leading seamlessly to Name and Pickup Point setup.
- **Session & Identity Continuity:**
  - **Online API Auth:** Laravel Sanctum SPA cookie/session (`withCredentials: 'include'`). No long-lived bearer tokens stored insecurely.
  - **Remembered Identity:** Known emails and business profiles are cached locally in Dexie (`rememberedIdentities` table).
  - **Expired Session Re-auth:** When a session cookie expires, ParkDrop shows a 1-tap confirmation screen with the remembered email/profile so returning owners don't have to retype their email.
  - **Local PIN:** A 4-digit PIN is used for fast local device unlocking for authorized workspaces. It is an offline device security safeguard, not an API credential.
- **Email Provider:** ZeptoMail is used for sending OTP verification emails. This operational cost is platform-funded and independent of customer SMS credit balances.
- **Canonical Design Language:** ParkDrop Field Blue is the global design theme (see `docs/design-system.md`). All auth screens strictly consume semantic tokens (`--pd-*`) and provide dedicated support links (`Problem logging in?`). 
  - **MANDATORY SEMANTIC COLORS**: Feature code must **never** invent state colors or use raw hex/Tailwind colors (e.g. `bg-red-500`, `black`, `burgundy`) for visual states. The shared design system strictly owns error, success, warning, info, and neutral styling across the entire application.

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

### 3. Staff & Business Management (Build 18)
- **Tenancy Boundary:** The tenant is `Business`, not `User`. `User` access exists strictly through `BusinessMembership` (`owner`, `manager`, `attendant`).
- **Universal Passwordless Auth Integration:** Staff invitations are sent by email with a configurable TTL (`BUSINESS_INVITATION_TTL_DAYS=7`). When the invitee opens ParkDrop and completes 6-digit email OTP verification, the matching invitation is auto-accepted into an active `BusinessMembership`. No staff passwords or temporary credentials ever exist.
- **Strict Role Permissions Matrix:**
  - `OWNER`: Full business & staff management, invite all roles, change roles, remove staff (except last owner), edit business name.
  - `MANAGER`: Operational package tasks, view staff, invite Attendants only. Cannot invite, demote, or remove Owners or Managers.
  - `ATTENDANT`: Operational package tasks only. No access to staff administration or business settings.
- **Last-Owner Invariant & Concurrency Safety:** A business must always have at least one active `owner`. Removing or demoting an owner executes inside a database transaction with row locks, recalculating active owner counts authoritatively before applying mutations.
- **Safe Staff Removal:** Removing staff sets `status = 'removed'`. It does NOT delete the `User` account or any historical Package, Payment, or Collection activity records. Once removed, online API requests for that business are immediately blocked (403), and active sessions return `needs_onboarding: true`.
- **Online-Only Administration:** Staff invitations, role changes, staff removal, and business details updates are strictly online-only. Offline devices display last-known read-only staff lists with clear internet prompts, without queuing administrative changes locally.

### 4. Media (Cloudinary)
- **Direct Uploads:** React uploads directly to Cloudinary using signed parameters.
- **Idempotency:** Uploads are hashed (SHA-256) locally. The backend checks for duplicate hashes before generating a signature, preventing duplicate uploads and saving bandwidth.
- **Delivery:** Package photos use restricted/authenticated delivery.

### 4. Database Principles
Data integrity lives in MySQL (strict `NOT NULL`, foreign keys, money as kobo). 
Idempotency keys protect critical actions (payments, SMS).
Domain events use the outbox pattern.

### 5. Frontend Stack
React, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS v4, Lucide React, Dexie (IndexedDB) for offline storage.

### 6. Local-First Operational Package Search (Build 11)
- **Primary Goal:** Attendants find packages in seconds from local synchronized data without waiting for network or API roundtrips.
- **Search Architecture:**
  - Single operational input: `"Search name, phone, pickup code or package ID"`.
  - In-memory query classifier (`classifyQuery`) distinguishes `PUBLIC_PACKAGE_ID` (`PD-XXXXX`), `PICKUP_CODE` (7 characters from safe alphabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ`), `PHONE` (normalized Nigerian MSISDN via `normalizePhone`), and `NAME_OR_TEXT` (case-folded tokens).
  - Queries `PackageSearchRepository` directly against local IndexedDB (Dexie `packages` and `customers` tables) using composite indexes (`[business_id+public_package_id]`, `[business_id+pickup_code]`, `[business_id+phone_normalized]`).
  - Scoping: Strict isolation by `business_id`. Active pickup point is prioritized with +20 score boost; cross-pickup-point packages within the same business are clearly labeled.
  - Deterministic ranking: Exact pickup code (1000) > Exact public ID (950) > Exact phone (900) > Customer name exact/prefix/tokens (800-600) > Partial matches (400). Tie-breakers: `WAITING` > `COLLECTED` > `RETURNED` > `CANCELLED`, followed by newest `client_created_at` timestamp.
  - Reactive live queries: Dexie `useLiveQuery` automatically updates results when local records change without page reload.
  - Unsynced local packages (`sync_status: 'PENDING_CREATE'`) appear immediately in search with a subtle `Local` badge.
  - Truthful offline copy: Communicates device limitations gracefully when offline without falsely asserting that a package does not exist globally.

### 7. Local-First Operational Packages Queue (Build 12)
- **Primary Goal:** Provide the attendant with a live, status-filtered parcel shelf (`WAITING`, `COLLECTED`, `RETURNED`, `CANCELLED`), answering "What is physically here right now?" with zero filter setup required.
- **Default View:** Defaults immediately to `WAITING` parcels. Attendants do not have to configure or toggle anything to begin scanning.
- **Queue Architecture:**
  - Status tabs (`PackageStatusTabs`) render exact local counts for each canonical status, derived via indexed queries on `[business_id+status]` and `[business_id+pickup_point_id+status]`.
  - Incremental pagination (page size: 30) prevents unbounded DOM bloat while keeping scrolling at 60fps on mobile.
  - Deterministic sort: Newest `client_created_at` descending, with `id` tie-breaker.
  - Search entry integration: Read-only search bar navigates to `/packages/search`, sharing the Build 11 search architecture without duplication.
  - Reactive live updates: Creating a local package offline immediately increments the `Waiting` count and adds the item to the top of the queue before synchronization occurs. Status transitions reactively move records between tabs.
  - Contextual empty states: Clear, actionable empty messaging per tab (`Waiting` offers direct `"Add package"` action; `Collected`, `Returned`, and `Cancelled` give concise operational guidance).


---

## Mobile-First Design Mandate

### Canonical Repository-Level Mobile Design Skill

**Location:** `.agents/skills/parkdrop-mobile-design/`

The Skill file: `.agents/skills/parkdrop-mobile-design/SKILL.md`

This is the canonical mobile product-design Skill for the ParkDrop application.
It governs all UI/UX decisions across the ParkDrop application codebase.

References:
- `.agents/skills/parkdrop-mobile-design/references/mobile-ui-rules.md` — Touch, typography, offline, keyboard, QA checklist
- `.agents/skills/parkdrop-mobile-design/references/parkdrop-mobile-patterns.md` — Screen-by-screen mobile design patterns

### Mobile-First Rule

**ParkDrop application UI must be designed mobile-first before any tablet or desktop adaptation.**

Design and verify every screen at the following widths, in this order:

```
360px → 390px → 412px → 430px → 768px → 1024px+
```

The mobile experience is the source design.
Tablet and desktop are adaptations of the mobile design.

This rule applies to the **ParkDrop operational application**.
### 4. Operational Attention Center (Build 19)
- **Principle:** ONLY surface something if the user may need to know or act. Successful operations remain completely quiet.
- **Not a Social Feed:** No notification bells, unread markers, swipe-to-dismiss, Clear All, or marketing announcements.
- **Read-Model Projection:** Attention is a derived projection (`AttentionRepository`) over canonical local domain state (failed `packageMedia`, rejected `payments`, sync `conflicts`, `smsWallets` balance, pending/failed `SmsCreditPurchase`). There is NO duplicate mutable notifications table.
- **Automatic Resolution:** Items disappear automatically the moment the underlying domain condition resolves (e.g. photo uploads successfully, wallet balance replenished, purchase confirmed).
- **Mutually Exclusive SMS Credits Alert:** Balance = 0 yields `ZERO_SMS_CREDITS` (severity: `ERROR`); Balance between 1 and 4 yields `LOW_SMS_CREDITS` (severity: `WARNING`). Never duplicate both for the same business.
- **Role-Aware CTAs:**
  - Owner / Manager: `Buy credits` CTA deep-linking to purchase flow.
  - Attendant: `View SMS credits` CTA (read-only balance inspection).
- **Conflict Safety & Retries:**
  - For `COLLECTION_SYNC_CONFLICT` or `PACKAGE_LIFECYCLE_CONFLICT`: Never offer invalid "Retry" because canonical server state won. CTA is `View package`.
  - For `PHOTO_UPLOAD_FAILED`: CTA is `Retry upload` which calls canonical `MediaUploadCoordinator.syncPendingMedia`.
- **Tenant Isolation:** Scoped strictly to active `business_id`. Cross-tenant attention items are strictly forbidden.
- **Home & More Integration:**
  - `More`: Subtle row entry with `unresolvedCount` badge.
  - `Home`: Restrained `AttentionSummary` preview card displaying up to 2 items and a `View all` link; hidden completely when `unresolvedCount === 0`.
  - Canonical 5-item bottom navigation remains untouched (`Home`, `Packages`, `Add`, `Customers`, `More`).
-
-### 5. Daily Operations & Reports (Build 21)
-- **Core Principle:** Clear daily operational facts, not analytics theater. No charts, no profit/loss claims, no forecasting, no employee or customer leaderboards.
-- **Reporting Unit:** Exactly one Business-local calendar day in `Africa/Lagos` (WAT, UTC+1), defined cleanly as `[start_of_day, start_of_next_day)`. Future dates are blocked.
-- **Access Policy:**
-  - `OWNER` & `MANAGER`: View full daily reports, payment summaries, Pickup Point scope, Business-wide scope, and download canonical CSV exports.
-  - `ATTENDANT`: Reports section is hidden in `/more` and API endpoints return 403 Forbidden.
-- **Scoping Invariant:** Defaults to active Business + active Pickup Point. Selecting "All pickup points" (Business-wide) updates reporting scope without mutating the operational workspace context. Inactive pickup points remain selectable for historical reporting.
-- **Package Metrics:**
-  - `Received`: Intake count during the day (`client_created_at` or `created_at` within bounds).
-  - `Collected`: Transitioned to `COLLECTED` during the day (`updated_at` within bounds).
-  - `Returned`: `PackageLifecycleEvent` of type `RETURN` or `returned_at` within bounds.
-  - `Cancelled`: `PackageLifecycleEvent` of type `CANCEL` or `cancelled_at` within bounds.
-  - `Waiting now`: Secondary operational context value displayed for TODAY only.
-  - *Event Independence:* A package received and collected on the same day counts as 1 Received and 1 Collected.
-- **Payment Metrics:**
-  - Aggregates canonical package payment records in integer minor units (kobo). Zero floating-point arithmetic.
-  - Terminology: "Payments recorded", "Net payment activity". Never "Revenue", "Sales", or "Earnings".
-  - Method breakdown: Cash, Transfer, POS, Other.
-  - Reversals: Recorded payment events are immutable; reversals are counted on the date the reversal occurred and subtract from net activity.
-  - Zero SMS credit purchase contamination: SMS credit transactions are strictly excluded from package payment totals.
-- **Safe CSV Export:**
-  - Online-only streaming response from canonical server database.
-  - Formula injection defense: Prefixes cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` with `'`.
-  - PII minimization: Public package ID and customer name only; NO customer phone, NO pickup codes, NO internal database UUIDs.
-  - Currency formatting: Exact decimal conversion from minor units with explicit `Amount (NGN)` column and UTF-8 BOM.
-- **Local-First & Truthful Offline:**
-  - Derives current/recent report projections locally from Dexie IndexedDB.
-  - Shows "Offline · showing data stored on this device" when network is absent.
-  - Older dates outside local retention display: "This date isn't available on this device while offline. Connect to the internet to view this report." (Never lies with fake zeros).

It does **not** automatically apply to any separate public marketing website.

### Mobile Design Hierarchy

```
Mobile (360–430px)
       ↓
   Tablet (768px)
       ↓
  Desktop (1024px+)
```

Never design desktop first and shrink to mobile.

### Key Mobile Standards (Summary)

- Minimum touch target: **44 × 44px** (prefer 48 × 48px)
- Primary buttons: **52–56px** tall on mobile, full-width
- Bottom navigation: icon + label, safe-area-aware
- All colors: ParkDrop Field Blue semantic tokens only
- Offline is a normal operating state — never expose raw errors
- Forms must account for keyboard-open state
- No hover-dependent controls on mobile
- Run the 10 Mobile QA Questions before shipping any screen
