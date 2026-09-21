# ParkDrop — Current State (Phase 1)

**Status: descriptive only.** This document records what the ParkDrop application
is today, as read from the code on branch `dev` on 2026-09-22. It contains no
recommendations. Rough edges, contradictions and dead ends are recorded as
findings, not fixed here. Recommendations live in `02-design-plan.md`.

Everything below was verified by reading the current source, not by recalling
earlier conversations about the product. Where a prior document in the
repository disagrees with the code, both are recorded and the disagreement is
named.

Marker convention used throughout:

- `FINDING` — something observed in the code that a designer must know about.
- `ASSUMPTION` — something not determinable from the repository; the best-
  supported reading is given, along with what would change it.

---

## 0. What ParkDrop is

ParkDrop is a mobile-first, offline-first React PWA used by people who run
parcel pickup points inside Nigerian motor parks. A dispatcher drops a package
at the park; an attendant records it in ParkDrop; ParkDrop texts the customer a
pickup code; the customer turns up, pays anything owed, and the attendant
releases the package.

The operators are the users. The customer receiving the package never touches
the app — they only ever receive one SMS.

There is a separate marketing website (`index.html`, `privacy.html` at the
repository root, plus `MARKETING_URL` pointing at `https://parkdrop.com.ng`).
That site is explicitly out of scope for the application design language, per
`.agents/skills/parkdrop-mobile-design/SKILL.md`.

---

## 1. Technical and environmental constraints a design must respect

These are decided, implemented, and not up for renegotiation by a design plan.

### 1.1 Devices and conditions

Documented in `docs/usability/add-package-test.md`:

- Target hardware: low-cost Android phones — Tecno, Infinix, itel, 2–3 GB RAM.
- Screen widths to design at, in order (`SKILL.md`): 360 → 390 → 412 → 430 →
  768 → 1024px.
- Environment: bright outdoor daylight, an open counter, arriving buses, a
  queue of customers.
- Network: flaky 3G, and frequently no network at all.

### 1.2 Offline is a normal operating state, not an error

- All reads on the operational screens come from IndexedDB via Dexie
  (`src/offline/db/`), through repositories (`PackageRepository`,
  `CustomerRepository`, `PaymentRepository`, `PackageLifecycleRepository`,
  `SmsWalletRepository`, `package-search-repository`).
- All writes go to the local database first and enqueue a mutation
  (`src/offline/mutations/mutation-queue.ts`), pushed later by
  `src/offline/sync/sync-engine.ts`.
- Mutation statuses: `PENDING`, `SYNCING`, `RETRYABLE`, `CONFLICT`, `REJECTED`.
- Record-level sync statuses: `SYNCED`, `PENDING_CREATE`, `PENDING_UPDATE`,
  `CONFLICT`.
- Server results: `APPLIED`, `REJECTED`, `RETRYABLE`, `CONFLICT`
  (`docs/offline/sync-protocol.md`).
- Conflict resolution is server-wins for terminal package transitions. The
  first valid terminal transition committed by the server wins; the loser gets
  a `CONFLICT` that the local device must show, not retry.
- A crash mid-push is recovered on startup: `SYNCING` mutations older than 45
  seconds revert to `PENDING` and replay idempotently.

**Design consequence, already honoured in some screens:** the app must never
claim a thing reached the server when it only reached the phone.

### 1.3 Things that are online-only

- Staff invitations, role changes, staff removal, business detail edits
  (Build 18 decision, `docs/PARKDROP_MASTER_CONTEXT.md`). Offline devices show
  a read-only last-known list.
- Buying SMS credits (payment provider round-trip).
- CSV export of daily reports (streamed from the canonical server database).
- Historical report dates outside local retention.
- Package photo upload to Cloudinary (the photo itself is captured and stored
  locally offline; only the upload waits).

### 1.4 Money

- All money is stored as integer minor units (kobo). No floating point
  anywhere. `amount_due_minor`, `amount_minor`, `balanceMinor`.
- Currency is Nigerian Naira. `formatMoney()` in `src/lib/formatters.ts` uses
  `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN',
  minimumFractionDigits: 0, maximumFractionDigits: 0 })` → `₦3,500`.
- Payments are append-only. A correction is a reversal event, never an edit.
  `PaymentStatus` is `COMPLETED | REVERSED`.
- Payment methods: `CASH`, `TRANSFER`, `POS`, `OTHER`.
- Reports deliberately say "Payments recorded" and "Net payment activity",
  never "Revenue", "Sales" or "Earnings" (Build 21 decision).
- ParkDrop takes no cut of package money; it only records it. This is stated in
  the Help content.

### 1.5 Phone numbers

`src/features/auth/lib/phone.ts` is the canonical handling:

- Accepts `0803 123 4567`, `8031234567`, `+234 803 123 4567`,
  `234-803-123-4567`, and pasted contact-card text.
- Always *displays* `0803 123 4567` — groups of 4, 3, 4.
- Stores canonical `234XXXXXXXXXX`; sends E.164 `+234XXXXXXXXXX` to the API.
- Validates 10 national digits matching `^[789][01]\d{8}$`.
- Nigeria is the only country code handled.

`FINDING` There are two phone formatters. `src/lib/formatters.ts` has a second,
simpler `formatPhone()` used by the customer screens. They agree on output
shape for the common cases but are separate implementations.

### 1.6 SMS

`src/lib/smsTemplate.ts` is the single source of truth, and is explicitly
documented as needing to stay in step with the backend
`ProcessOutboxCommand.php`.

Template:

```
Your package is at {pickupPoint}, {park}.
Show code {code} at pickup.
Call: {phone}
ParkDrop
```

- Hard limit 130 characters, so it never becomes two paid SMS segments.
- GSM-7 only. Accented letters and curly quotes are silently folded down
  (`Ṣèyí` → `Seyi`); anything still unsupported (emoji, non-Latin script) is
  reported so the setup screen can ask for normal letters.
- The pickup point setup screen shows the real rendered message, live, with a
  character budget (`combinedNameBudget()`).
- Placeholder/junk names are refused: `default park`, `test`, `asdf`, `n/a`,
  and the on-screen example pair `chima parcel services` + `peace park`.

SMS costs the business credits from an `SmsWallet`. Zero balance means arrival
SMS stop going out.

### 1.7 Identity and authentication

Build 1 model, still current:

- No passwords. No separate login/register. One flow: enter identifier →
  enter 6-digit code → the backend decides whether this is a returning user or
  a new one.
- Code is valid 10 minutes, 5 verification attempts, heavily rate-limited.
- `src/features/auth/config.ts` has `AUTH_IDENTIFIER`, currently `'email'`,
  switchable to `'phone'` at build time. Every screen, keyboard, placeholder,
  trust line, hint and error message already branches on it. The comment is
  explicit that email is the default only because the backend can only deliver
  a code by email today.
- A device-local 4-digit PIN unlocks the app. It is not an API credential.
- Remembered identities are cached in Dexie so an expired session becomes a
  one-tap re-confirmation, not a retyped email.
- `AUTH_FALLBACK_CHANNELS` (`whatsapp`, `voiceCall`) are both `false` — the
  code deliberately hides channels the backend cannot serve.
- Support routes: WhatsApp `2348000000000`, phone `+2348000000000`, email
  `support@parkdrop.com.ng`.

`FINDING` The support numbers are obvious placeholders (`800 0000000`). Help
that does not reach a person is worse than no help offer.

### 1.8 Roles

`owner`, `manager`, `attendant`, via `BusinessMembership`. The tenant is the
Business, not the User.

- Owner: everything, including editing the business name and managing staff.
- Manager: operations, view staff, invite attendants only, view reports.
- Attendant: operations only. Reports hidden in More and 403 at the API.

### 1.9 Time

Reports use one business-local calendar day in `Africa/Lagos` (WAT, UTC+1),
`[start_of_day, start_of_next_day)`. Future dates are blocked.

### 1.10 Accessibility work already present

- `prefers-reduced-motion` is honoured in `src/styles/tokens.css` (motion
  durations collapse to `0ms`) and in `src/index.css` (`.pd-caret`,
  `.pd-shake`, `.pd-check-pop` set to `animation: none !important`).
- Height-based media queries at `max-height: 700px` and `max-height: 460px`
  step down title size, PIN key height and header height rather than clipping —
  this is what protects the layout when a user has enlarged their system font.
- Decorative SVG is marked `aria-hidden="true"`.
- Tabular figures utility (`pd-nums`) for anything read digit by digit.
- `axe-core` is in the frontend dependency tree, so some automated checking
  exists.

`ASSUMPTION` There is no localisation setup in the frontend: no i18n library,
no message catalogue, no locale switch. All copy is English, hard-coded in
`strings.ts` files or inline in components. What would change this: a decision
to ship Hausa, Yoruba, Igbo or Pidgin, which would require extracting the
inline strings first.

---

## 2. The data model, at the level design needs

### 2.1 Business

The tenant. Owns pickup points, staff memberships, an SMS wallet, and every
package. First-time onboarding atomically creates: the User (if new), the
Business, an Owner membership, a default PickupPoint, an SmsWallet, and a
one-time welcome grant of credits.

### 2.2 Pickup point

A physical counter inside a park. Has a `name` (the business's own trading
name, e.g. "Chima Parcel Services") and sits inside a park (e.g. "Peace Park").
Both names go into the customer's SMS, which is why the setup screen polices
their length and characters. A pickup point has a status; `active` is
preferred, and the app falls back to the first one if none is active.

`FINDING` "Pickup point" carries two different meanings in the product. To the
operator it is *their shop*. In the SMS it is a *place a customer walks to*.
The onboarding copy handles this well ("Your customers see these names in their
SMS"); the settings screens do not.

### 2.3 Customer

`LocalCustomer`: `name`, `phone_display`, `phone_normalized`, a `version`, a
`sync_status`. Scoped to a business. Created silently the first time a phone
number is used — the attendant never performs a "create customer" action.

`FINDING` If the attendant skips the name, the customer's name is set to their
phone number (`AddPackageScreen`: `const finalName = name.trim() || '0'+phone`).
So a nameless customer appears everywhere as `08031234567`, including in
headings and in `Release to 08031234567?`.

### 2.4 Package

`LocalPackage`. The central entity.

| Field | Meaning |
|---|---|
| `public_package_id` | `PD-` + 5 chars, e.g. `PD-8K42Q`. Written on the parcel. |
| `pickup_code` | 7 chars. The customer's proof of ownership. Sent by SMS. |
| `amount_due_minor` | What the customer owes on collection, in kobo. May be 0. |
| `status` | `WAITING` → `COLLECTED` / `RETURNED` / `CANCELLED` |
| `client_created_at` | When the attendant recorded it. Used for sorting and ageing. |
| `creator_name` / `creator_phone` | Who received it. |
| `terminal_actor_name` / `terminal_actor_phone` | Who released/returned/cancelled it. |
| `arrival_sms_status` | `PENDING`, `SENT`, `DELIVERED`, `FAILED`, `UNDELIVERED`, `NEEDS_RECONCILIATION` |
| `sync_status` | `SYNCED`, `PENDING_CREATE`, `PENDING_UPDATE`, `CONFLICT` |

Both codes are generated from an ambiguity-safe alphabet
`23456789ABCDEFGHJKMNPQRSTUVWXYZ` — no `0`, `O`, `1`, `I`, `L` — via
`crypto.getRandomValues`. This is a good, deliberate decision for a code that
gets handwritten on a parcel in marker pen and read aloud over a phone.

Status is a one-way door. `WAITING` is the only non-terminal state. Terminal
transitions are row-locked server-side; a device that loses the race gets a
`CONFLICT` and must show the canonical outcome rather than offer a retry.

### 2.5 Payment

Append-only `LocalPayment` rows against a package. Payment *state* is derived,
never stored: `src/features/payments/domain/payment-summary.ts` sums completed
payments and subtracts reversals to produce `paidMinor`, `balanceMinor`,
`isFullyPaid`. The derived states the UI names are: **Unpaid**, **Part paid**,
**Paid**, and **Nothing to pay** (when `amount_due_minor` is 0).

A package can be `COLLECTED` while still owing money. The detail screen has an
explicit "Release without payment" path and an "Owing ₦X" banner afterwards.

### 2.6 SMS wallet and credits

`LocalSmsWallet` holds an integer `balance`. `LocalSmsCreditTransaction` rows
are `CREDIT` or `DEBIT`. Thresholds that drive the Attention centre:

- balance `0` → `ZERO_SMS_CREDITS`, severity `ERROR`
- balance `1–4` → `LOW_SMS_CREDITS`, severity `WARNING`
- never both at once.

`FINDING` The reference pattern document
(`references/parkdrop-mobile-patterns.md`) specifies a low-credit warning at
`< 10 credits`. The implemented rule is `1–4`. These disagree.

### 2.7 Attention items

Not a notifications table. A read-model projection
(`src/offline/read-models/attention-repository.ts`) over existing state: failed
photo uploads, rejected payments, sync conflicts, wallet balance, pending or
failed credit purchases. Items vanish automatically when the underlying
condition resolves. Types seen in the code: `PHOTO_UPLOAD_FAILED`,
`COLLECTION_SYNC_CONFLICT`, `PACKAGE_LIFECYCLE_CONFLICT`, `ZERO_SMS_CREDITS`,
`LOW_SMS_CREDITS`, plus purchase checks. Actions: `VIEW_PACKAGE`,
`RETRY_PHOTO`, `BUY_SMS_CREDITS`, `VIEW_SMS_CREDITS`, `CHECK_PURCHASE`.

The stated principle is strong and worth preserving verbatim: *only surface
something if the user may need to know or act; successful operations remain
completely quiet.* No bells, no unread counts, no "Clear all", no marketing.

### 2.8 Device and recovery

`LocalAuthorization` is an offline authorisation lease with an `expires_at`, so
a device that has been offline for too long stops being trusted. Device
identity lives in `src/offline/device/device-identity.ts`. A startup health
check can put the whole app into a `recovery` state before any normal screen
renders.

---

## 3. Screen and route inventory

### 3.1 How navigation actually works today

**A correction, recorded honestly.** Part-way through this audit the working
tree changed underneath it. When Phase 1 began, `src/App.tsx` carried an
uncommitted, syntactically invalid edit — two `import` statements sitting in
the middle of the `AppContent()` function body — which was the residue of the
interrupted Home redesign session, and which was mid-migration towards the
TanStack Router. That edit was reverted by someone or something else during
this session. This audit was not the cause; it writes no application code.

The state described below is the **committed state on `dev`**, re-verified
after the revert. It is the state a new reader will find.

Navigation is **not** driven by a router. `src/routes/AuthenticatedApp.tsx`
holds `const [currentPath, setCurrentPath] = React.useState('/')` and renders
every signed-in screen through conditional string comparison against that one
variable. Every navigation is a `setCurrentPath('/some/path')` call. The
browser URL never changes after sign-in.

`FINDING (structural)` `src/router.tsx` exists, is complete, defines a full
TanStack Router tree with three shell layouts (`bleedShellRoute` for Home,
`mainShellRoute` for Packages/Customers/More, `taskShellRoute` for everything
else), and is **imported by nothing**. `grep` for `@/router` across the whole
`src` tree returns no hits outside the file itself. It was committed in
`74a1d55` ("Create TanStack router configuration and route tree") and never
wired in.

`FINDING (dead screen)` Because the router is the only thing that imports it,
`src/features/more/MoreScreen.tsx` is also dead. The Settings screen the user
actually sees is a ~230-line inline copy living inside
`AuthenticatedApp.tsx`. The two are near-identical in content and copy — the
findings about More's wording and type sizes apply to both — but only the
inline one runs. Editing `MoreScreen.tsx` changes nothing the user sees.

`FINDING` `docs/app-shell/00-diagnosis.md` (dated 2026-09-21) is therefore
**still accurate**, not stale as a first read suggests. Its headline finding —
"No real router. State-driven screens only. `@tanstack/react-router` is
installed but never used" — holds today, with the single amendment that the
router *file* now exists. Its four listed consequences all still apply:

1. The URL never changes, so `/packages/PD-8K42Q` cannot be opened directly.
2. Browser and Android hardware **Back exit the app** instead of going back one
   screen. Nothing is pushed onto `window.history`, so `popstate` never fires.
3. No deep links. A package cannot be shared or bookmarked.
4. Screens that opt out of the standard shell lose the logo entirely.

Consequence 2 is the one that matters most for the audience this plan is
written for, and it is dealt with in `02-design-plan.md`.

### 3.2 Screens and the path strings that reach them

These are internal state strings, not URLs. They are listed because they are
the only map of the app's structure that exists.

| Path string | Screen | Bottom nav | Notes |
|---|---|---|---|
| `/` | Home | yes (`bleed`) | Blue header, sheet, tiles |
| `/packages` | Packages list | yes | |
| `/packages/new` | Add package | no (`fullScreenTask`) | |
| `/packages/search` | Find package | no | |
| `/packages/{id}` | Package detail | no (`fullScreenTask`) | |
| `/customers` | Customers list | yes | |
| `/customers/{id}` | Customer detail | yes | |
| `/more` | Settings & More (inline) | yes | |
| `/more/attention`, `/attention` | Attention | yes | two aliases |
| `/more/reports` | Daily operations | yes | owner/manager only |
| `/more/sms-credits` | SMS credits | yes | |
| `/more/sms-credits/buy` | Buy SMS credits | yes | online only |
| `/more/staff` | Staff | yes | owner/manager only |
| `/more/business` | Business details | yes | owner/manager only |
| `/more/account` | Account & Security | yes | |
| `/more/help`, `/help` | Help & Guides | yes | two aliases |
| `/more/about` | About ParkDrop | yes | |

Two real URLs are checked directly against `window.location.pathname` in
`App.tsx`, before the auth provider runs:

| URL | Screen | Gating |
|---|---|---|
| `/home-preview` | Home state harness | `import.meta.env.DEV` |
| `/theme` | Theme demo | **none** |

`FINDING` `/theme` is not dev-gated, unlike `/home-preview`. It is a developer
page reachable in production by anyone who types the URL.

`FINDING` Only Add package and Package detail hide the bottom navigation
(`fullScreenTask`). Every `/more/*` sub-screen keeps it, so a user sitting in
Buy SMS Credits still sees Home / Packages / Customers / More underneath —
five ways out of a payment flow. `router.tsx`, had it been wired, would have
put all of those on `taskShellRoute` and hidden the bar. The unwired file and
the live app disagree about the structure of the app.

### 3.3 Pre-router states (before any route renders)

Handled in `App.tsx` by auth state, not by URL:

| State | What renders |
|---|---|
| `booting` | `BootSplash` — pulsing app icon + spinner, `aria-label="Loading ParkDrop"` |
| `recovery` | `RecoveryScreen` — full screen, blocks everything |
| `remembered_expired` (+ remembered identity) | `RememberedReauthFlow` — one-tap re-confirm |
| `unknown` / `onboarding` | `AuthFlow` — the 7-screen first-run |
| `remembered_expired` + user chose to switch | `AuthFlow` |
| `locked` (+ device meta) | `UnlockScreen`, or `ForgotPinFlow` |
| authenticated | `RouterProvider` |

### 3.4 The sign-in / first-run flow

`AuthFlow.tsx` drives seven steps: `identifier` → `code` → `name` → `pin` →
`pickup` → `phone` → `ready`.

| Screen | Asks | Notable behaviour |
|---|---|---|
| `IdentifierScreen` | email or phone, per `AUTH_IDENTIFIER` | three trust lines: free, how the code arrives, "we never sell your email/number" |
| `CodeScreen` | 6 digits | resend with 30s cooldown, "Still no code?" channels gated off |
| `NameScreen` | first name | "Just your first name is fine." |
| `PinSetupScreen` | 4-digit PIN, then confirm | on-screen `PinPad`, explicit "Do not use your ATM PIN" |
| `PickupPointScreen` | pickup point name + park name | live SMS preview, character budget, junk-name refusal |
| `PhoneNumberScreen` | business contact number | "Check it twice. Your customers will call this number." |
| `ReadyScreen` | nothing | summary + edit links, install-to-home-screen prompt, primary "Add your first package" |

Every typed value is persisted at every step, so Android back, an app kill or a
dead battery does not lose the entry (`AuthFlow.tsx`, the effect that writes
`{ step, identifier, challengeId, firstName, pin, pickupPointName, parkName,
contactPhone }`).

Supporting states in this flow, all designed rather than left to chance:
`slowNetwork`, `tookTooLong`, `offline`, `sendingCode`, `checking`, `saving`,
`resendWait(seconds)`, `pinTooEasy`, `pinMismatch`, `pinWrong`,
`pinAttemptsUsed`, `pickupTooLong`, `pickupOddCharacters`,
`pickupPlaceholderName`.

Returning-user states: `UnlockScreen` (`Welcome back, {name}`, "Forgot PIN?",
"Not you?"), `RememberedReauthScreen`, `ForgotPinFlow` (reset PIN via a fresh
code), and a five-wrong-attempt fallback to a code rather than a lockout.

Persistent chrome across the flow: `Back`, `Need help?`, `Step N of M`
progress bars, and a privacy notice line.

`HelpSheet` opens from `Need help?` on every auth screen. It says "Talk to a
real person." / "We can see which screen you are on." and offers WhatsApp and
Call.

### 3.5 Home

`HomeScreen.tsx` plus eleven components. Structure:

1. `HomeHeader` — blue band: brand, greeting (`Good morning, George`), pickup
   point name, park name, and a `SyncChip`. Collapses when the keyboard opens.
2. A white sheet with a 28px rounded top edge.
3. `ActionTiles` — two tiles that climb 56px into the blue band: **Add
   package / A package arrived**, **Find package / A customer is here**.
4. `SetupBanner` — only when the pickup point name, park name or shop phone is
   still missing.
5. Offline banner — "No internet. You can still add and find packages."
6. `StatStrip` — Waiting / Unpaid / Today. Hidden entirely on the first day so
   there is never a row of zeros.
7. `WaitingList` with All/Unpaid filter chips and `ParcelRow` items, or
   `FirstPackageCard` on day one.
8. `SyncSheet` — opened from the sync chip.

Home states: `loading` (`HomeSkeleton`), `error` (`HomeError`, retry by
bumping a key so the live query re-runs), `ready`, `isFirstDay`, offline,
needs-setup, and a filtered-empty state ("Nothing unpaid").

Sync chip tones and words: `All saved`, `Sending…`, `No internet`,
`Needs a look`. When the tone is `attention` the chip navigates to the
Attention screen instead of opening the reassurance sheet.

`FirstPackageCard` teaches the job in three steps: "Type the customer's phone
number." / "Type the amount." / "Tap Save." then "ParkDrop texts your customer
their pickup code."

`FINDING` Home's `Unpaid` stat does not navigate to the Packages screen — it
narrows the list in place, because the Packages screen filters by status and
`Unpaid` is a payment state. The code comments this honestly. The user-visible
result is that two of three stats go somewhere and one does not.

### 3.6 Add package

`AddPackageScreen.tsx`. One screen, progressive reveal, pinned save button.

Order: phone → (suggestions as you type, from 3 digits) → matched-customer chip
*or* name field → amount → recent-amount chips → optional photo → duplicate
warning → save.

- Phone autofocuses on open.
- Existing customers surface automatically; the name field never appears for a
  known number, replaced by a chip reading e.g. "Collected 3 before" / "Has 1
  package waiting" with a "Change" escape.
- Name is explicitly optional: the label itself is "Name (you can skip this)".
- Amount helper: "Type 0 if there is nothing to pay."
- Amount chips offer the last amount used and frequent amounts.
- Photo is optional, camera-first (`capture="environment"`), downscaled to a
  1024px long edge at quality 0.7 before storage.
- A non-blocking warning appears if this customer already has waiting packages.
- Save is a 60px full-width button pinned above the keyboard.
- Leaving with typed data opens `DiscardConfirmDialog`: "Leave without saving?"
  / Stay / Leave.

Success is a full screen, `PackageSavedScreen`: "Saved", "Write this on the
package:", the pickup code, the SMS state ("SMS sent to 0803 123 4567" /
"Sending SMS…" / "SMS will send when you are online."), an undo countdown, and
"Next package" / "Go home" / "Tell customer on WhatsApp".

`FINDING` The save-failure message `'Could not save package. Please try again.'`
is hard-coded inline in `AddPackageScreen.tsx` rather than living in
`AddPackageStrings`, and it is the only string in that file that is.

### 3.7 Packages list

`PackagesScreen.tsx`. Status tabs `Waiting` / `Collected` / `Other`, with
`Returned` and `Cancelled` as secondary chips under `Other`. Per-tab filter
chips: Waiting → `Unpaid`, `3+ days`, `7+ days`; Collected → `Today`,
`This week`, `Owing`. Sort sheet: oldest first (the Waiting default), newest
first, highest amount. Age group headers: "7 days or more", "3 to 6 days",
"Today and yesterday". Pagination at 30 rows, "Show 30 more". A live search
field spans tabs, 150ms debounce.

Empty states are per-filter: "No unpaid packages. Everyone has paid.",
"Nothing has waited 7 days or more.", "No packages here yet.". Error:
"Could not load your packages. Tap Try again."

### 3.8 Find package (search)

`PackageSearchScreen.tsx`. Autofocused single input. A classifier
(`package-search-classifier.ts`) decides whether the query is a
`PUBLIC_PACKAGE_ID`, `PICKUP_CODE`, `PHONE` or `NAME_OR_TEXT`, then queries
IndexedDB on composite indexes. Deterministic ranking: exact pickup code 1000,
exact public ID 950, exact phone 900, customer name exact/prefix/token
800–600, partial 400; tie-broken `WAITING` > `COLLECTED` > `RETURNED` >
`CANCELLED`, then newest. Unsynced local packages appear immediately with a
`Local` badge. The active pickup point gets a +20 boost and cross-point results
are labelled.

### 3.9 Package detail

`PackageDetailScreen.tsx` plus nine components: identity header, customer card
(with Call and WhatsApp), pickup code card, payment card, photo card, info
card, activity section, and a pinned `PackageStickyActionBar`.

The action bar is state-driven:

- `WAITING` with a balance → primary **"Collect ₦3,500 and release"**, plus a
  text-link secondary "Record payment only".
- `WAITING` with no balance → primary **"Release package"**.
- `COLLECTED` → green banner "Collected on {date}, {time} by {actor}", an
  "Owing ₦X" pill if money is still due, and "Undo release".
- `RETURNED` → grey banner "Returned on {date}".
- `CANCELLED` → red banner "Cancelled on {date}".

Release opens a confirmation dialog: "Release to {name}?", the pickup code
shown large for visual comparison ("Check the customer's pickup code"), the
balance if any, then "Collect ₦X and release" / "Release without payment" /
"Not yet".

Loading is a bespoke skeleton. Not-found is a dedicated screen: "Package not
found" / "This package could not be found in your active account." / Back.

`FINDING (bug, user-visible)` The collected/returned/cancelled banners pass
hard-coded literals:

```
PackagesStrings.collectedBanner('Today', '8:10 PM', pkg.terminal_actor_name || 'Staff')
PackagesStrings.returnedBanner('Today')
PackagesStrings.cancelledBanner('Today')
```

Every collected package therefore claims it was collected **today at 8:10 PM**,
and every returned or cancelled package claims **today**, regardless of the
real timestamps, which exist on the record. In a product whose entire purpose
is being the trustworthy record of what happened to someone else's parcel, the
screen states a falsehood.

`FINDING (dead code)` `ReleasePackageSheet.tsx`, `CancelPackageSheet` aside,
`RecordPaymentSheet.tsx`, `PaymentHistory.tsx`, `PaymentSummaryCard.tsx` and
`PackageActionSlots.tsx` are not imported by any screen. `ReleasePackageSheet`
in particular implements a *different product decision*: it requires the
attendant to **type** the customer's pickup code, rejects a mismatch with
"Pickup code does not match this package", and labels the primary action
"Confirm package collected". The live flow only **shows** the code for visual
comparison. Both exist in the repository; only one runs.

`FINDING` The dead `ReleasePackageSheet` renders `Status: {pkg.status}` — i.e.
the raw enum `WAITING` — directly to the user.

### 3.10 Customers

`CustomersScreen.tsx`: title with a count pill, an "Add package" button in the
header, a search field ("Search name or phone"), a skeleton list, and two
distinct empty states — "No customers found" / "Try another name or phone
number." with Clear search, and "No customers yet" / "Customers appear here
when you record packages." with Add package. Pagination via "Load more
customers" in 50s.

`CustomerDetailScreen.tsx`: avatar initial, name, phone, a call button, a
"{n} waiting · {n} total" line, an Add package button, a "Waiting packages (n)"
section of tappable cards showing package ID, amount, pickup code and relative
time, and a "Recent history (n)" list with status badges. Not-found state:
"Customer not found" / "This customer may not be available on this device."

### 3.11 More / Settings

`MoreScreen.tsx`. Sections: an account card ("Signed in as", name, email,
"Workspace: {business}", a role pill), then **Operations** (Attention with an
unresolved count badge, Daily Reports for owner/manager, SMS Credits with a
balance pill), **Business Administration** (Staff, Business details),
**Account** (Account & Security), **Support & Guides** (Help & Guides, About
ParkDrop), and two buttons: "Sign Out" and "Reset Device Identity".

### 3.12 Attention

`AttentionScreen.tsx`. Back / "Attention" / a count badge. An offline advisory
("Offline · Showing saved items from this device"), a skeleton, an empty state
component, and a list preceded by "{n} items need a quick check". Actions are
blocked when offline with toasts: "Connect to the internet to retry photo
upload", "Connect to the internet to buy SMS credits", "Connect to the internet
to verify purchase status".

### 3.13 Daily operations report

`DailyOperationsScreen.tsx`. Date navigator, scope selector (this pickup point
vs all pickup points), package summary (Received, Collected, Returned,
Cancelled, plus "Waiting now" for today only), payment summary by method, an
activity list, and "Export CSV". Shows "Showing local data" when offline, and a
distinct `HISTORICAL_UNAVAILABLE_OFFLINE` state rather than inventing zeros.
Header line: "{business} · Africa/Lagos (WAT)".

CSV export defends against formula injection and deliberately omits customer
phone numbers, pickup codes and internal UUIDs.

### 3.14 SMS credits and purchase

`SmsCreditsScreen.tsx`: balance, a refresh control, an offline line ("Showing
last synced balance. Will refresh when connected."), "Buy SMS credits", and a
transaction list.

`BuySmsCreditsScreen.tsx`: a `flowState` machine — `CHOOSING` → `INITIALIZING`
→ `CONFIRMING` → `PENDING` — with bundle options, "Continue to payment",
"Preparing payment…", and error copy ("Could not load credit packages. Please
check your connection.", "Could not start payment. Please try again.",
"Could not check payment status yet."). Disabled entirely offline.

### 3.15 Staff, Business details, Account & Security

- `StaffScreen.tsx` (300 lines): member rows, pending invitation rows, an
  invite sheet, a member actions sheet. Online-only administration.
- `BusinessDetailsScreen.tsx` (601 lines — the largest screen in the app):
  business name, pickup points, settings.
- `AccountSecurityScreen.tsx`: identity section, current device section, a
  device list, and a sign-out confirmation dialog.

### 3.16 Help, About, Recovery

`HelpScreen.tsx` holds a structured article set — id, title, category, icon,
summary, steps, tips — covering Getting Started, Recording a Package, Pickup
Codes, Collecting & Releasing, Recording Payments, Finding & Searching,
Returning or Cancelling, and more.

`AboutScreen.tsx`: logo, version 1.0.0, "Business:", "Signed in as:", a
copyable diagnostic code, "Data Protection & Privacy".

`RecoveryScreen.tsx`: "ParkDrop needs to repair data stored on this device.",
progress messages ("Checking saved work on this device...", "Restoring saved
parcels and payments...", "Restored synced data. Finishing setup..."), a
diagnostic code (`PD-RCV-8K42`), "Copy report", "Start safe recovery", and a
`SafeResetDialog` for the destructive last resort.

`FINDING` `RecoveryScreen` uses `alert()` for one failure path
(`alert(err?.message || 'Could not reset device data.')`). A raw browser alert
is the one piece of UI ParkDrop cannot style, word or make reassuring.

### 3.17 Shared cross-screen components

`src/features/shared/components/`: `CapabilityUnavailable`, `StaleDataNotice`,
`DeferredOperationStatus`. `src/resilience/`: `capability-state.ts`,
`degradation-copy.ts`, `error-classification.ts`, `retry-policy.ts` — a
deliberate, centralised approach to degraded operation.

---

## 4. The design language as it exists today

### 4.1 Two languages, side by side

There is one token file and two visual languages built on it.

**Language A — the redesign.** Solid blue header band, white sheet with a 28px
rounded top edge, very large type, 60–68px controls, kraft-brown parcel
illustration, `Manrope` at weights 600–800, `var(--pd-*)` tokens consumed
directly.

**Language B — the original.** White or pale-page background, a sticky 56px
header with a back chevron, cards at `--radius-xl`, 12–14px type,
`text-xs`/`text-sm` Tailwind utilities, `bg-surface-*`/`text-text-*` semantic
class names, Title Case headings.

Which screens are in which, verified by whether the file consumes `var(--pd-*)`:

| Language A (redesigned) | Language B (original) |
|---|---|
| All 11 auth screens + 16 auth components | About |
| Home + 11 components | Account & Security |
| Add package + 8 components | Attention |
| Package detail + 9 components | Business details |
| Packages list + 6 components | Customers list |
| Find package *(partially — see below)* | Customer detail |
| | Help |
| | More / Settings |
| | Recovery |
| | Daily operations |
| | SMS credits |
| | Buy SMS credits |

**13 of 26 signed-in screens are still in Language B.** The split is not
random: every screen an attendant touches during a transaction has been
redesigned; every screen an owner touches occasionally has not. That is a
defensible order of work. It is still a visible inconsistency, and it lands
exactly on the boundary a first-time user crosses when they go looking for
help.

`FINDING` `PackageSearchScreen` is in both at once: it uses `--pd-` tokens in
places but keeps the old white sticky header, the old back-chevron pattern, and
old `text-text-primary` classes. It is the clearest mid-migration artefact.

### 4.2 Colour

Two overlapping token systems, both live.

`src/styles/tokens.css` (`--pd-*`, plain CSS custom properties):

| Token | Value | Role |
|---|---|---|
| `--pd-blue` | `#2563eb` | brand, primary action, header band |
| `--pd-blue-hover` | `#1d4ed8` | hover |
| `--pd-blue-dark` | `#163b8c` | pressed |
| `--pd-navy` | `#0d1b2a` | primary text |
| `--pd-muted` | `#475569` | secondary text |
| `--pd-tint` / `--pd-tint-2` | `#eff6ff` / `#dbeafe` | blue surfaces |
| `--pd-line` / `--pd-line-2` | `#cbd5e1` / `#e2e8f0` | borders |
| `--pd-page` | `#e8eef7` | signed-out backdrop |
| `--pd-page-2` | `#f8fafc` | signed-in surface |
| `--pd-ok` / `--pd-ok-bg` | `#15803d` / `#f0fdf4` | success |
| `--pd-bad` / `--pd-bad-bg` | `#b91c1c` / `#fef2f2` | error |
| `--pd-warn` / `--pd-warn-bg` | `#92400e` / `#fffbeb` | warning, offline |
| `--pd-kraft-1..4` | `#e2b46e`, `#cf9a4d`, `#d9a45a`, `#f4e4bf` | illustration only |

The file states two rules in its own comments that are worth quoting as
existing policy: status colours are *"never colour alone: always icon + words"*,
and kraft is *"illustration only — never text or UI chrome"*.

`src/index.css` `@theme` (Tailwind semantic names): `action-primary`,
`text-primary/secondary/muted/disabled/inverse/link`,
`surface-page/default/subtle/raised/selected/disabled`,
`border-default/strong/focus/disabled`, and `status-{success,danger,warning,
info}-{,text,bg,border}`. These are then re-aliased back out as a *third* set
of `--pd-surface-page`-style variables in a `@layer base` block.

`FINDING` `--color-status-danger-border` is set to `var(--color-proto-bad)` =
`#B91C1C`, a fully saturated red. `docs/design-system.md` documents it as
`#FECACA`, a pale red. Every danger-bordered surface in the app is therefore
harder and louder than the design system says it is.

`FINDING` `docs/design-system.md` documents `surface-page` as `#F8FAFC`. The
code maps it to `--color-proto-page` = `#E8EEF7`. The written design system and
the implemented design system disagree on the background colour of the app.

`FINDING` The `--color-proto-*` namespace ("prototype specific colors") is the
actual source of every semantic colour. The semantic layer is an alias of a
layer named "prototype".

`FINDING (invalid classes)` Several components use Tailwind class names that
do not correspond to any defined token and therefore do nothing:

- `bg-bg-surface-page`, `bg-bg-action-hover` — `PackageSearchScreen.tsx` lines
  65 and 73. The search screen has no background colour at all.
- `bg-bg-surface-elevated` — `StaleDataNotice.tsx`, `CapabilityUnavailable.tsx`.
- `text-text-tertiary` — `StaleDataNotice.tsx`. No such token; the text takes
  an inherited colour.
- `border-border-subtle` — used across at least 8 files. Only `border-default`,
  `border-strong`, `border-focus` and `border-disabled` are defined.
- `bg-surface-active`, `bg-action-hover` — `CustomersScreen`,
  `CustomerDetailScreen`.

`FINDING (hardcoded colour)` Despite an explicit, repeated, capitalised
mandate that feature code must never invent state colours,
`PackageStickyActionBar.tsx` hard-codes `#DCFCE7`, `#86EFAC`, `#15803D`,
`#92400E`, `#FEF3C7`, `#FCD34D`, `#FCA5A5`, `#D97706`, `#FEF2F2` inline.
`HomeScreen.tsx` hard-codes `#FDE68A`. `CustomerDetailScreen.tsx` uses raw
Tailwind `bg-blue-50`, `text-blue-700`, `border-blue-200` for the "Local"
badge. `MoreScreen.tsx` uses `bg-blue-50` in eight places.

### 4.3 Type

Font: `Manrope`, loaded from Google Fonts at weights 500/600/700/800, with
`ui-sans-serif, system-ui, sans-serif` behind it.

`FINDING` `references/mobile-ui-rules.md` §9 instructs: *"Use `Inter` (from the
design system) — not browser defaults."* The app uses Manrope. The rule
document was not updated when the font changed.

`FINDING` The font is fetched over the network on first load. On a first run in
a park with no signal, the first thing a brand-new user sees renders in the
system fallback. No local font file is bundled.

The `--pd-size-*` scale in `tokens.css` names sizes after the thing they size,
which is a genuinely good decision — a row and a tile cannot silently drift
apart:

| Token | px | Used for |
|---|---|---|
| `--pd-size-title` | 30 (28 short screens) | screen question |
| `--pd-size-field` | 25 | what the user typed |
| `--pd-size-point` | 22 | pickup point name in header |
| `--pd-size-button` | 20 | primary button label |
| `--pd-size-tile` | 20 | action tile label |
| `--pd-size-body` | 18 | body |
| `--pd-size-row-name` | 18 | customer name in a row |
| `--pd-size-section` | 18 | section header |
| `--pd-size-chip` / `--pd-size-helper` / `--pd-size-meta` | 16 | chips, helper, metadata |
| `--pd-size-small` | 15 | "chips, nav labels — the floor" |
| `--pd-size-min` | 15 | "Nothing in the auth flow may go below this." |

The parallel Tailwind scale in `index.css` runs `--text-display` 40px down to
`--text-caption` **12px**.

`FINDING` Two type scales with incompatible floors. Language A declares 15px
the absolute minimum; Language B ships a 12px caption token and uses
`text-xs` (12px) and `text-[10px]`, `text-[11px]` extensively — in `MoreScreen`
for every section heading and every row subtitle, in `CustomerDetailScreen` for
the "Local" badge, in `AttentionScreen`, `ReleasePackageSheet` and
`StaleDataNotice`. The settings area of an app built for people reading slowly
in sunlight is set at 10–12px.

### 4.4 Spacing, radius, metrics

From `tokens.css`: `--pd-tap-min: 48px`, `--pd-field-h: 68px`,
`--pd-button-h: 60px`, `--pd-code-slot-h: 70px`, `--pd-pin-key-h: 64px` (50px
on short screens), `--pd-tile-h: 112px`, `--pd-row-h: 84px`, `--pd-nav-h: 64px`,
`--pd-sheet-radius: 28px`, `--pd-card-radius: 20px`, `--pd-field-radius: 16px`,
`--pd-chip-radius: 12px`, `--pd-tile-overlap: 28px`.

From `index.css`: `--radius-xs` 6 through `--radius-xl` 20 and `--radius-full`.

`FINDING` `Dialog.tsx` and `ReleasePackageSheet.tsx` reference
`--radius-2xl`, which is not defined. Those corners fall back to square.

Language B buttons are commonly `min-h-[44px]` with `text-xs` labels — the
documented floor, not the documented preference, and well under the 52–56px
primary-button rule the same documents state.

### 4.5 Iconography

`lucide-react` throughout, typically `w-4 h-4` or `w-5 h-5` in Language B and
`w-6 h-6` with `strokeWidth={2.25–2.5}` in Language A.

Icon-with-word pairing is strong in Language A and in the bottom navigation.
It is weaker in Language B: `CustomerDetailScreen` has a bare phone-icon call
button (it does carry `aria-label="Call {name}"`), `CustomersScreen` has a bare
X to clear search, and `SmsCreditsScreen` has a bare refresh icon.

### 4.6 Illustration

Four in-house SVG components (`AuthBackdrop`, `ParcelPattern`,
`EmptyParcelIllustration`, `SyncIllustration`) plus `HeroArt` and
`FirstPackageArt`. Policy, from `docs/design-system.md`: no stock vector art,
no external raster illustration, all colours drawn from tokens. The newer
kraft-brown parcel work sits in `HeroArt`/`FirstPackageArt` and uses the
`--pd-kraft-*` tokens.

`FINDING` `src/assets/hero.png`, `react.svg` and `vite.svg` are still in the
tree. The last two are Vite scaffolding.

### 4.7 Motion

`--pd-motion-fast: 120ms`, `--pd-motion-slow: 260ms`, both `0ms` under
`prefers-reduced-motion`. Named keyframes: `pd-caret-blink`, `pd-shake`,
`pd-check-pop`, and a full set of sheet slide/fade animations mapped to Radix
`[data-state]`. The router sets `defaultViewTransition: true`.
`src/lib/nav-direction.tsx` tracks direction so forward and back animate
differently.

`tokens.css` states the governing rule in a comment: *"Motion is only ever an
answer to a tap."*

### 4.8 Tone of copy

Three `strings.ts` files — `features/auth/strings.ts`,
`features/home/strings.ts`, `features/packages/strings.ts` and
`features/packages/add/strings.ts` — carry an explicit, written house style:

> Sentence case. Plain words. Around a Grade 5 reading level.
> Never "OTP", "verify", "authenticate", "credentials", "session", "token".
> Never "sync", "queue", "record", "entity", "offline-first", "local", "void".
> "Package", never "parcel", "consignment" or "item".
> Errors are blame-free, say exactly what is missing, and end with a next step.
> Never condescending. The reader is busy, not slow.
> No screen in this feature may hard-code a user-visible string.

This is the single strongest asset in the repository from a design point of
view, and the screens governed by it read very well.

`FINDING (scope)` The rule "no screen may hard-code a user-visible string"
applies only to those features. Every Language B screen hard-codes all of its
copy inline. There is no strings file for More, Customers, Attention, Reports,
SMS credits, Staff, Business details, Account, Help, About or Recovery.

`FINDING (violations)` The house style is broken wherever it is not enforced:

| Where | Words used | Rule broken |
|---|---|---|
| `MoreScreen` | "Settings & More", "Business Administration", "Support & Guides", "Sign Out" | Title Case |
| `MoreScreen` | "Workspace: {business}" | jargon |
| `MoreScreen` | "Operational exceptions & retries" | jargon ×2 |
| `MoreScreen` | "Reset Device Identity" | jargon; also unexplained and destructive-sounding |
| `MoreScreen` | "Customer notification balance" | jargon |
| `MoreScreen` | "Offline-ready instructions & best practices" | banned word "offline" compound |
| `MoreScreen` | "Version 1.0.0, diagnostics, and privacy" | jargon |
| `AttentionScreen` | "Offline · Showing saved items from this device" | Title Case mid-sentence |
| `AttentionScreen` | "Connect to the internet to verify purchase status" | "verify" |
| `HelpScreen` | "offline-first parcel holding and pickup point software" | "offline-first"; "parcel" |
| `HelpScreen` | "one-time passcode (OTP)" | banned outright |
| `HelpScreen` | "Changes sync automatically" | "sync" |
| `HelpScreen` | "Search runs locally on your device database" | "database" |
| `HelpScreen` | "authenticate the collecting customer" | "authenticate" |
| `HelpScreen` | "status permanently changes to COLLECTED" | raw enum |
| `HelpScreen` | "Intake parcels quickly" | "parcel"; "intake" |
| `ReleasePackageSheet` (dead) | "Status: WAITING", "Offline mode: ... synced when connected" | raw enum; "sync" |
| `RecoveryScreen` | "Restored synced data", "Restoring saved parcels" | "sync"; "parcel" |
| `DailyOperationsScreen` | "Showing local data" | "local" |
| `SmsCreditsScreen` | "Showing last synced balance" | "sync" |
| `AboutScreen` | "Data Protection & Privacy" | Title Case |

`FINDING (factually wrong help)` `HelpScreen` tells the user:

1. *"The pickup code is different from the public Package ID (e.g. PKG-1234)."*
   Package IDs are `PD-` + 5 characters. `PKG-1234` does not exist in this
   product.
2. *"Enter the code during collection to verify authorization"* and *"Enter the
   customer's pickup code and tap 'Confirm package collected'."* The live
   release flow does not have a code entry field. It shows the code for visual
   comparison and the button says "Collect ₦X and release" or "Yes, release".
   The Help describes the dead `ReleasePackageSheet`.
3. *"Tap 'Add package' from Home or the bottom navigation bar."* There is no
   Add item in the bottom navigation (see below).

The one place in the app that exists to explain the app to a confused person
describes a version of the app that does not exist.

### 4.9 Navigation chrome

`AppShell.tsx` renders a desktop sidebar (`sm:` and up) and a mobile bottom bar
(below `sm:`). Four destinations: **Home, Packages, Customers, More**. Icons
`Home`, `Package`, `Users`, `Menu` at `w-6 h-6`, each with a word beneath.
Bottom bar is `min-h-[var(--pd-nav-h)]` = 64px with
`padding-bottom: max(env(safe-area-inset-bottom), 6px)`.

The component's own comment records the reasoning:

> The floating "+" was the third way to add a package on a screen that also had
> a main button and an empty-state button. Adding a package now happens in one
> place — the Add tile on Home — so the bar is a set of places to go and
> nothing else.

`FINDING` This directly contradicts three prior documents that are still
presented as canonical:

- `docs/PARKDROP_MASTER_CONTEXT.md`: *"Canonical 5-item bottom navigation
  remains untouched (`Home`, `Packages`, `Add`, `Customers`, `More`)."*
- `references/mobile-ui-rules.md` §3: `Home | Packages | Add | Customers | More`.
- `references/parkdrop-mobile-patterns.md`: the same five-item bar, drawn in
  every screen diagram, with "Add tab: may use elevated circle".

The code is newer and the reasoning behind it is sound and written down. The
documents were never updated. `HomeStrings` still exports an unused
`navPackages`-adjacent set that matches the four-item reality, so the code is
internally consistent; only the docs are wrong.

`FINDING` The `Add` route is now reachable only from: the Home tile, the
Customers header button, the Customer detail button, the Packages empty state,
and a search no-results action. From the Packages list with results on screen,
there is no way to add a package without going back to Home.

### 4.10 Where the visible inconsistencies actually land

Ordered by how likely a novice user is to hit them:

1. **Home → More.** Crossing from a 30px-title, 60px-button, blue-header screen
   to a 12px-label, 44px-row, white-card screen. This is the single largest
   jump in the app and it happens on the fourth tab.
2. **Home → Find package.** The search screen keeps the old header while the
   list rows below it are new. Half-migrated in a single viewport.
3. **Packages list → Package detail.** Both redesigned, but the detail screen
   has its own blue header with a back arrow while the list has the old sticky
   header treatment.
4. **Anywhere → Help.** The most jarring, because it is where someone goes when
   already lost, and because its content is wrong.
5. **Attention badge → Attention screen.** Entered from a redesigned surface
   (Home sync chip) into an un-redesigned one.

---

## 5. Prior design and product documents in the repository

| Document | What it decides | Status against the code |
|---|---|---|
| `docs/PARKDROP_MASTER_CONTEXT.md` | Builds 1–25 all complete; auth model; multi-tenancy; roles; search and queue architecture; Attention principles; reports rules; mobile-first mandate; 5-item nav | Mostly accurate. **Nav item count is wrong.** Formatting is corrupted from line 163 onward — a block of Build 21 notes is prefixed with stray `-` characters and sits inside the Build 19 section. |
| `docs/design-system.md` | Field Blue theme; token architecture; status mapping per domain; no-hardcoded-colour mandate; email rules; illustration rules; component layers | Token *values* have drifted (`surface-page`, `status-danger-border`). The no-hardcoded-colour mandate is violated in live code. Status mapping (Waiting→Neutral, Collected→Success, Returned→Warning, Cancelled→Danger) does match `CustomerDetailScreen`. |
| `.agents/skills/parkdrop-mobile-design/SKILL.md` | Mobile-first order; 44/48px targets; 52–56px primary buttons; semantic tokens only; offline normal; keyboard-aware forms; no hover-only controls; 10 QA questions | Still the governing intent. The Language B screens fail several of its own rules. |
| `references/mobile-ui-rules.md` | Design widths; touch table; nav architecture; input modes per field type; thumb ergonomics; offline copy; error anatomy; token table; type scale; composition; illustration; list rows; 10 QA questions; commit discipline | Font instruction (`Inter`) is stale. Nav architecture is stale. 12px caption floor conflicts with the 15px floor. Otherwise sound. |
| `references/parkdrop-mobile-patterns.md` | Per-screen ASCII anatomies for auth, OTP, PIN, unlock, home, list, create, detail, lookup, SMS credits, offline, loading, toasts, sheets, badges, more, bottom nav, transitions, a11y baseline, token quick reference | **The most stale document in the repository.** Uses "Released" where the product says "Collected"; maps Waiting→Warning where the design system says Waiting→Neutral; shows an SMS checkbox on the create screen that no longer exists; specifies a low-credit threshold of `<10` against an implemented `1–4`; specifies auth order email→OTP→name→PIN→pickup, missing the business phone step; and prescribes swipe-to-dismiss bottom sheets. |
| `docs/app-shell/00-diagnosis.md` | "Confirmed" that no router exists; plan to migrate to TanStack Router; the staff-phone gap decision | **Still accurate.** The route tree was written (`router.tsx`) but never wired in, so every consequence the document lists still holds — including Back exiting the app. Its **staff-phone decision remains live and correct**: show the name only when no phone is present; never invent a number. |
| `docs/usability/add-package-test.md` | A field test protocol: 5 real attendants, budget Android, bright sunlight, flaky 3G, 5 packages each, target <12s returning / <25s new, zero "what do I do next?" moments | An excellent, live document. It is a *plan*, not results. There is no record in the repository that it was ever run. |
| `docs/offline/*`, `docs/production/*`, `docs/runbooks/*` | Sync protocol, local database, security, deployment, observability, release checklist, smoke tests, incident runbooks | Engineering constraints. Design-relevant parts are captured in §1 above. |

`FINDING` The three most design-specific documents — `design-system.md`,
`mobile-ui-rules.md`, `parkdrop-mobile-patterns.md` — all predate the
redesign and none were updated by it. A future builder following them faithfully
would rebuild Language B.

---

## 6. Summary of Phase 1 findings

Recorded here without recommendation.

### Broken or wrong

1. **Back exits the app.** No router is wired; navigation is a state string, so
   nothing is pushed onto browser history and the Android hardware Back button
   leaves ParkDrop from any screen, including mid-way through Add package.
2. Collected / Returned / Cancelled banners display hard-coded `'Today'` and
   `'8:10 PM'` instead of real timestamps.
3. `HelpScreen` describes a package ID format, a release flow and a navigation
   bar that do not exist.
4. Invalid Tailwind classes (`bg-bg-surface-page`, `text-text-tertiary`,
   `border-border-subtle`, `bg-surface-active`, `--radius-2xl`) render nothing.
5. `RecoveryScreen` falls back to a native `alert()`.
6. `/theme` is reachable in production.
7. Support contact numbers are placeholders.

### Duplicated or dead

8. `router.tsx` — a complete, correct route tree that nothing imports, and
   `MoreScreen.tsx` — the extracted Settings screen that only the dead router
   references, shadowed by a near-identical inline copy in
   `AuthenticatedApp.tsx`. Two navigation structures and two settings menus
   exist; the *newer, better-structured* one is the dead one.
9. `ReleasePackageSheet`, `RecordPaymentSheet`, `PaymentHistory`,
   `PaymentSummaryCard`, `PackageActionSlots` — unreferenced, and encoding a
   *different* release policy from the live one.
10. Three colour-token systems (`--pd-*`, Tailwind `@theme`, re-aliased
    `--pd-surface-*`) and two type scales with incompatible minimums.
11. Two phone formatters.

### Inconsistent

12. 13 of 26 signed-in screens remain in the pre-redesign visual language.
13. `PackageSearchScreen` is half-migrated within a single viewport.
14. Copy discipline is enforced by `strings.ts` in four features and absent in
    eleven.
15. Hard-coded hex colours in live components despite a repeated mandate.
16. Bottom navigation is four items; three canonical documents say five.

### Good, and worth protecting

17. The `strings.ts` house style, written down with its reasoning.
18. The ambiguity-safe code alphabet.
19. Money as integer kobo, payment state derived from an append-only log.
20. The SMS template as a single source of truth with a live, honest preview
    and a real character budget.
21. Offline treated as a normal state, with truthful copy that never claims a
    thing was sent when it was not.
22. The Attention centre as a projection with automatic resolution and no
    notification theatre.
23. Draft persistence at every step of first-run.
24. Reduced-motion and short-screen handling in `tokens.css`.
25. `AUTH_FALLBACK_CHANNELS` — the refusal to show a button that does not work.
26. Reports that refuse to invent zeros for dates the device does not hold.
27. The Home first-day treatment: no stat strip of zeros, a three-step card
    that teaches the job instead.
28. The decision to remove the floating "+", with its reasoning recorded in the
    component.

---

*End of Phase 1. Recommendations begin in `02-design-plan.md`.*
