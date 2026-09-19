# ParkDrop Master Context

## Current Project Position

**Build 1 — Authentication + Business Onboarding: IN PROGRESS**

Next build: TBD based on priorities (likely Offline Engine).

## Core Architecture Decisions

### 1. Authentication Model (Build 1)
- **Universal Mental Model:** Enter Email → Enter OTP → ParkDrop Decides What Happens Next.
  - No separate Login and Register flows.
  - No asking the user whether they already have an account.
  - No passwords. No "Don't have an account? Sign up" patterns.
  - The user simply enters their email and continues.
- **Backend Decision Engine:**
  - `POST /api/v1/auth/code` sends a 6-digit confirmation code (expires in 15 minutes).
  - `POST /api/v1/auth/code/verify` checks the code and inspects the database:
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
