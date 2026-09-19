# ParkDrop Mobile Screen Patterns

This document defines the canonical mobile screen patterns for the ParkDrop
application. Read it before designing or building any application screen.

It supplements `mobile-ui-rules.md` and `docs/design-system.md`.

---

## Authentication Flow

**Mobile screen order:**

```
1. Email input
2. OTP code entry
3. First name
4. Local 4-digit PIN setup
5. Pickup point setup
```

> Note: Build 1 uses email + OTP via ZeptoMail. Phone + SMS migration
> is deferred to a future build when backend is ready.

---

### Auth Screen Anatomy (Mobile)

```
┌─────────────────────────────┐  ← safe area inset top
│  [←]        ParkDrop  [  ] │  ← brand header, 48px tap zones
│                             │
│  Subtle parcel motif (SVG)  │  ← aria-hidden, pointer-events: none
│                             │
│  What's your email?         │  ← h1, 28–32px, font-bold
│  We'll send you a code.     │  ← subtitle, text-secondary, 16–18px
│                             │
│  ┌─────────────────────┐   │
│  │ your@email.com      │   │  ← full-width Input, 52px min-height
│  └─────────────────────┘   │
│                             │
│  [        Continue        ] │  ← full-width Button, 52–56px, primary
│                             │
│    Already set up? Sign in  │  ← 14–16px, text-secondary
│                             │
└─────────────────────────────┘  ← safe area inset bottom
```

**Rules:**
- Form card on `surface-page` with subtle SVG atmosphere
- No dead white space below the action
- Back button visible and tappable
- ParkDrop wordmark centred in header
- `autoFocus` on primary field
- Continue button disabled until field validates

**Desktop adaptation:** Two-column card — form left, `AuthBackdrop` illustration right.

---

### OTP Screen Anatomy (Mobile)

```
┌─────────────────────────────┐
│  [←]        ParkDrop  [  ] │
│                             │
│  Enter your code            │
│  Sent to your@email.com     │
│                             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐  │  ← 4–6 digit OTP inputs
│  │ 7 │ │ K │ │   │ │   │  │     inputMode="numeric"
│  └───┘ └───┘ └───┘ └───┘  │     autoFocus first cell
│                             │
│  [        Verify code     ] │
│                             │
│  Resend code (0:42)         │  ← countdown, then tap to resend
└─────────────────────────────┘
```

**Rules:**
- `inputMode="numeric"` `autoComplete="one-time-code"`
- Auto-advance between cells on input
- Auto-submit when all cells filled
- Resend with countdown timer
- Error state: pale red under inputs, not a banner

---

### PIN Setup Screen (Mobile)

```
┌─────────────────────────────┐
│  [←]        ParkDrop  [  ] │
│                             │
│  Create your PIN            │
│  You'll use this to unlock  │
│  the app on this device.    │
│                             │
│  ● ● ○ ○                    │  ← PIN dots, large (24px), spaced
│                             │
│  ┌─────────────────────┐   │
│  │ ● ● ● ●             │   │  ← masked input, inputMode="numeric"
│  └─────────────────────┘   │
│                             │
│  [        Continue        ] │
└─────────────────────────────┘
```

**Rules:**
- 4-digit PIN, `inputMode="numeric"`, masked display
- Visual dot indicators above the field
- PIN is device-local — not sent to server
- Confirm step: repeat PIN screen before saving

---

## Unlock Screen (Mobile)

Shown when a device session is locally locked (app backgrounded).

```
┌─────────────────────────────┐
│                             │
│  [ParkDrop icon]            │
│  ParkDrop                   │
│  Josie Adaeze               │  ← logged-in user name
│                             │
│  Enter your PIN             │
│                             │
│  ● ● ● ●                    │
│                             │
│  ┌─────────────────────┐   │
│  │                     │   │
│  └─────────────────────┘   │
│                             │
│  Sign out & reset device    │  ← danger-text, small, bottom
│                             │
└─────────────────────────────┘  ← safe area bottom
```

**Rules:**
- Full-screen — no bottom nav
- `autoFocus` on PIN field
- Auto-submit on 4 digits
- 3 failed attempts: show "Too many attempts" with countdown
- Sign out link uses `text-status-danger-text`, small size, bottom-anchored

---

## Home Screen (Mobile)

```
┌─────────────────────────────┐
│ ≡  ParkDrop      [🔔] [👤] │  ← AppBar, avatar tap → More
│                             │
│  Good morning, Josie        │  ← greeting, 20–24px
│                             │
│ ┌─────────┐ ┌─────────────┐│
│ │ Waiting │ │   Today     ││  ← stat chips, `surface-subtle`
│ │    12   │ │    ₦84,500  ││
│ └─────────┘ └─────────────┘│
│                             │
│  Quick actions              │
│ ┌──────────┐ ┌────────────┐│
│ │[+] Add   │ │[🔍] Search ││  ← 2-column grid, 52px+ tap targets
│ │ Package  │ │  Package   ││
│ └──────────┘ └────────────┘│
│                             │
│  Recent activity            │
│ ─────────────────────────── │
│  Chinedu Okafor   Waiting  │  ← compact row
│  PD-8K42Q · ₦3,500        │
│ ─────────────────────────── │
│  Amina Bello      Released │
│  PD-7J31X · ₦1,200        │
│ ─────────────────────────── │
│                             │
└─────────────────────────────┘
│ Home  Packages  [+]  Cust. More │  ← bottom nav, safe area
```

**Offline state bar (when applicable):**

```
│ 🔶 Offline · 3 changes waiting       │
```

Amber `status-warning` tone, dismissible or auto-hides on reconnect.

---

## Package List Screen (Mobile)

```
┌─────────────────────────────┐
│ [←] Packages    [🔍] [⚙️] │
│                             │
│ [All] [Waiting] [Released]  │  ← filter chips, scrollable
│                             │
│ ─────────────────────────── │
│ Chinedu Okafor     Waiting  │  ← name, status badge
│ 0803 123 4567 · PD-8K42Q   │  ← phone, code, 14px secondary
│ Today · 10:42 AM   ₦3,500  │  ← time, amount
│ ─────────────────────────── │
│ Amina Bello       Released  │
│ 0901 234 5678 · PD-7J31X   │
│ Yesterday · 4:18 PM  ₦1,200│
│ ─────────────────────────── │
│ Ibrahim Aliyu      Waiting  │
│ 0812 345 6789 · PD-3M99R   │
│ Today · 08:05 AM   ₦6,000  │
│ ─────────────────────────── │
└─────────────────────────────┘
│ Home  Packages  [+]  Cust. More │
```

**Row anatomy:**
- Row = full-width tap target (min 56px height)
- Name: `text-text-primary`, 16px, bold
- Phone + code: `text-text-secondary`, 14px
- Time: `text-text-secondary`, 14px
- Amount: `text-text-primary`, 14–16px, right-aligned
- Status badge: right-aligned pill, semantic token colours

**Filter chips:**
- Scrollable horizontal row
- Selected chip: `bg-surface-selected`, `border-action-primary`
- Unselected: `bg-surface-subtle`

**Empty state:**

```
┌─────────────────────────────┐
│                             │
│    [parcel shelf SVG]       │  ← EmptyParcelIllustration
│                             │
│    No packages yet          │  ← 18px, text-primary
│    Add a package to get     │
│    started.                 │  ← 16px, text-secondary
│                             │
│    [ Add first package ]    │  ← primary button
│                             │
└─────────────────────────────┘
```

---

## Package Creation Screen (Mobile)

```
┌─────────────────────────────┐
│ [←] Add Package             │
│                             │
│ Phone number                │
│ ┌─────────────────────┐    │
│ │ +234 0803 000 0000  │    │  ← PhoneInput, tel keyboard
│ └─────────────────────┘    │
│                             │
│ Customer name               │  ← shown if new number
│ ┌─────────────────────┐    │
│ │ Chinedu Okafor      │    │
│ └─────────────────────┘    │
│                             │
│ Amount collected (₦)        │
│ ┌─────────────────────┐    │
│ │ 3,500               │    │  ← MoneyInput, decimal keyboard
│ └─────────────────────┘    │
│                             │
│ Package photo               │
│ ┌───────────────────────┐  │
│ │  [📷] Take photo      │  │  ← camera primary
│ │  [🖼️] Choose from     │  │  ← gallery secondary
│ │      library          │  │
│ └───────────────────────┘  │
│                             │
│ ☑ Send SMS notification     │
│   to customer               │
│                             │
│ [      Save package       ] │  ← full-width, 52–56px, primary
│                             │
└─────────────────────────────┘
│ Home  Packages  [+]  Cust. More │
```

**Rules:**
- Phone field `autoFocus` on screen open
- Customer name field appears if phone number is new
- Camera is primary photo action; gallery is secondary
- SMS checkbox: checked by default (from business preference)
- Save button disabled until phone and amount are filled
- Works offline: saves locally, syncs when online

---

## Package Detail Screen (Mobile)

```
┌─────────────────────────────┐
│ [←] Package Detail  [⋯]   │  ← overflow for edit/delete
│                             │
│ ┌─────────────────────────┐│
│ │ [Package photo]         ││  ← full-width, 16:9 or 4:3
│ └─────────────────────────┘│
│                             │
│ Chinedu Okafor              │  ← name, 20px, bold
│ 0803 123 4567               │  ← phone, 16px, text-secondary
│                             │
│ Status          [ Waiting ] │  ← badge, right-aligned
│                             │
│ ─────────────────────────── │
│ Pickup Code    PD-8K42Q    │  ← monospace, large
│ Amount         ₦3,500      │
│ Received       Today 10:42 │
│ ─────────────────────────── │
│                             │
│ Payment                     │
│  Cash on pickup             │
│  [ Mark as paid ]           │
│                             │
│ SMS status                  │
│  ✓ Sent · Today 10:43 AM   │  ← status-success or status-warning
│  [ Resend SMS ]             │
│                             │
│ Activity                    │
│  10:42 AM   Package logged  │  ← ActivityTimeline
│  10:43 AM   SMS sent        │
│                             │
│ [      Release package    ] │  ← primary, full-width, 52–56px
└─────────────────────────────┘
```

**Rules:**
- Single primary terminal action: **Release package**
- Do not create 9 equal-weight buttons
- Release triggers: show confirmation bottom sheet before executing
- Photo: tap to expand to full screen

**Release confirmation bottom sheet:**

```
┌─────────────────────────────┐
│  Release to Chinedu Okafor? │
│                             │
│  Pickup code: PD-8K42Q      │
│  Amount: ₦3,500             │
│                             │
│  [ Release package ]        │  ← primary, danger-ish accent
│  [ Cancel ]                 │  ← ghost
└─────────────────────────────┘
       ← env(safe-area-inset-bottom) →
```

---

## Customer Lookup Screen (Mobile)

```
┌─────────────────────────────┐
│ [←] Customers    [🔍]      │
│                             │
│ ┌─────────────────────────┐│
│ │ 🔍 Search customers...  ││  ← search input, type="search"
│ └─────────────────────────┘│
│                             │
│ ─────────────────────────── │
│ Chinedu Okafor              │
│ 0803 123 4567               │
│ 3 packages · Last: today    │
│ ─────────────────────────── │
│ Amina Bello                 │
│ 0901 234 5678               │
│ 1 package · Last: 3 days    │
│ ─────────────────────────── │
└─────────────────────────────┘
│ Home  Packages  [+]  Cust. More │
```

---

## SMS Credit Balance (Mobile)

Used in Home stats and in the More/Settings area.

```
┌─────────────────────────────┐
│ SMS Credits                 │
│                             │
│ 47 credits remaining        │  ← large number
│                             │
│ [  Buy more credits  ]      │
└─────────────────────────────┘
```

**Low credit warning (< 10 credits):**

```
│ ⚠ 3 credits remaining       │  ← status-warning tone
│ [  Buy credits  ]           │
```

**Zero credits:**

```
│ 🔴 No SMS credits           │  ← status-danger tone
│ SMS notifications paused    │
│ [  Buy credits  ]           │
```

---

## Offline State Patterns

### Global offline banner

```
│ 🔶 Offline · 3 changes waiting        [↑] │
```

Shown in AppBar or just below. `status-warning-bg`, amber text. Tap to see pending changes.

### Sync in progress

```
│ ⟳ Syncing…                                │
```

`status-info` tone. Animated spin icon.

### Sync complete

```
│ ✓ Synced                                  │
```

`status-success` tone. Auto-dismisses after 2s.

### Screen-level offline empty state

```
┌─────────────────────────────┐
│                             │
│    [SyncIllustration SVG]   │
│                             │
│    You're offline           │
│    3 packages saved locally.│
│    They'll sync when you're │
│    connected again.         │
│                             │
└─────────────────────────────┘
```

---

## Loading States

### Screen-level skeleton

Use `Skeleton` component from design system. Match the shape of real content.

Package list skeleton:

```
│ ████████████████   ████    │  ← name + badge
│ ████████████████████████   │  ← phone + code
│ ███████         █████      │  ← time + amount
│ ─────────────────────────  │
│ (repeat 3–4 times)         │
```

### Button loading state

```
│ [ ⟳ Saving…  ]             │  ← spinner + text in button, disabled
```

Use `loading` prop on `Button` component.

---

## Toast and Notification Patterns

### Toast position

- Mobile: `bottom-center` (or `bottom-right`)
- Desktop: `bottom-right`
- Safe area inset on bottom

### Toast anatomy (from `sonner.tsx` design system)

```
│ ● ✓  Package saved         │  ← success: green left border
│ ● ⚠  Offline · saving...   │  ← warning: amber left border
│ ● ✕  Could not send SMS    │  ← error: red left border
│ ● ℹ  Syncing changes       │  ← info: blue left border
```

All toasts use semantic token classnames defined in `src/components/ui/sonner.tsx`.

---

## Bottom Sheet Patterns

Used for:
- Release confirmation
- Action disambiguation
- Filters on mobile
- Quick forms that don't warrant a full screen

```
┌─────────────────────────────┐  ← drag handle (optional)
│          ────               │
│  [Title]                    │
│                             │
│  [Content / form]           │
│                             │
│  [ Primary action  ]        │
│  [ Secondary / cancel ]     │
└─────────────────────────────┘
      env(safe-area-inset-bottom)
```

**Rules:**
- Trap focus inside when open
- Dismissible by swipe down or backdrop tap
- `aria-modal="true"` `role="dialog"`
- Back button on mobile should dismiss

---

## Status Badges

Used on package rows and detail screens.

| Status | Token style | Label |
|---|---|---|
| Waiting | `status-warning-bg` + amber text | Waiting |
| Released | `status-success-bg` + green text | Released |
| Pending | `status-info-bg` + blue text | Pending |
| Overdue | `status-danger-bg` + red text | Overdue |

Use `StatusBadge` component from `@/design-system`.

---

## More / Settings Screen (Mobile)

```
┌─────────────────────────────┐
│ [←] More                    │
│                             │
│ [avatar] Josie Adaeze       │  ← logged in user
│          josie@example.com  │
│                             │
│ ─────────────────────────── │
│ Business settings      [›]  │
│ Pickup point           [›]  │
│ SMS credits            [›]  │
│ ─────────────────────────── │
│ About ParkDrop         [›]  │
│ ─────────────────────────── │
│ Sign out                    │  ← danger-text colour
│ ─────────────────────────── │
└─────────────────────────────┘
│ Home  Packages  [+]  Cust. More │
```

---

## Bottom Navigation Bar Component

```
┌──────────────────────────────────────┐
│  [🏠]     [📦]    [➕]    [👤]  [⋯] │
│  Home   Packages  Add   Customers More│
└──────────────────────────────────────┘
  ↑ env(safe-area-inset-bottom) below ↑
```

**Rules:**
- Icon: 24px
- Label: 10–12px, `text-text-secondary` inactive / `text-action-primary` active
- Active indicator: blue dot above or underline, or icon colour change
- Add tab: may use elevated circle or accent colour for emphasis
- Background: `bg-surface-default` with subtle top border
- `role="tablist"` with `aria-selected`

---

## Screen Transition Conventions

| Transition | Direction |
|---|---|
| Navigate deeper | Slide left (new screen enters from right) |
| Navigate back | Slide right (current screen exits to right) |
| Bottom sheet open | Slide up from bottom |
| Bottom sheet close | Slide down |
| Toast | Fade + slide from bottom |
| Modal/dialog | Fade in with scale |

Use `animate-in fade-in slide-in-from-bottom-4 duration-300` (Tailwind animate-in plugin) or equivalent.

---

## Accessibility Baseline

| Requirement | Standard |
|---|---|
| Colour contrast (text) | WCAG AA (4.5:1 normal, 3:1 large) |
| Focus rings | Always visible, `border-border-focus` colour |
| Screen reader labels | Every icon button has `aria-label` |
| Touch targets | ≥ 44px |
| Motion | Respect `prefers-reduced-motion` |
| Text scaling | 200% without horizontal scroll |

---

## Design Token Quick Reference

```
bg-surface-page          ← very light blue-white (#F8FAFC)
bg-surface-default       ← pure white (#FFFFFF)
bg-surface-subtle        ← light neutral (#F1F5F9)
bg-action-primary        ← ParkDrop blue (#2563EB)
text-text-primary        ← deep navy (#0F172A)
text-text-secondary      ← mid grey-blue (#475569)
text-text-muted          ← muted (#64748B)
border-border-default    ← light neutral (#E2E8F0)
border-border-focus      ← blue (#2563EB)
```
