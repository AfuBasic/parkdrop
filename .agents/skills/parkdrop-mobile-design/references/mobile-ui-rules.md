# ParkDrop Mobile UI Rules

This document defines the mandatory rules for every UI task in the ParkDrop
application. Read it before designing, building, or reviewing any screen or
component.

---

## 1. Design Order — Non-Negotiable

Every screen must be designed and verified at the following widths **in order**:

```
360px  → 390px  → 412px  → 430px  → 768px  → 1024px+
```

**Never** design for desktop first and then shrink to mobile.
Mobile is the source design. Tablet and desktop are adaptations.

---

## 2. Touch Targets

| Context | Minimum | Preferred |
|---|---|---|
| All interactive elements | 44 × 44px | 48 × 48px |
| Primary mobile buttons | 52–56px tall | full-width on mobile |
| Adjacent touch targets | ≥ 8px spacing | — |

Tappable rows, badges, nav items, and form inputs all count.
Do not allow precision-tapping requirements for common actions.

---

## 3. Navigation Architecture

**Mobile information architecture:**

```
Home  |  Packages  |  Customers  |  More
```

Bottom navigation bar rules:
- Every destination: **icon + label**
- **The bar holds places, never actions.** `Add` is not in the bar — adding a
  package happens from the Add tile on Home. See `docs/design-plan/02-design-plan.md` §3.1.
- **Do not** use a giant floating action button unless ergonomics clearly demand it
- Account for `env(safe-area-inset-bottom)` on all bottom-anchored elements

```css
padding-bottom: max(16px, env(safe-area-inset-bottom));
```

---

## 4. Forms and Keyboard

Forms are a primary ParkDrop workflow. The keyboard is part of the design.

| Field type | Input mode / type |
|---|---|
| Phone | `type="tel"` `inputMode="tel"` |
| PIN / OTP code | `inputMode="numeric"` `autoComplete="one-time-code"` |
| Amount / monetary | `inputMode="decimal"` |
| Pickup code | `inputMode="text"` monospace display |
| Search | `type="search"` with visible clear control |

**Keyboard-open requirements:**
- The active field must remain visible
- The primary CTA button must remain reachable
- Do not let content reflow break the form under keyboard

Test keyboard-open states. Do not ship untested keyboard behaviour.

---

## 5. Thumb Ergonomics

Ask: *Can an attendant complete this one-handed?*

- Primary action should be bottom-anchored or in the natural thumb zone
- Do not place the main action top-right, tiny, inside an overflow menu, or behind a gesture
- Stack primary + secondary actions vertically — primary below, secondary above

---

## 6. Offline-First Design

ParkDrop operates in parks with unreliable internet. **Offline is a normal condition.**

### Acceptable offline state copy

```
Offline · 3 changes waiting
Saved on this device
Syncing…
✓ Synced
1 item needs attention
```

### Visual offline treatment

- Use `status-warning` (calm amber) tones for offline/sync states
- Do not grey-out the entire interface
- Offline-capable actions remain fully usable
- Only online-dependent actions explain connectivity requirement

### Never expose

```
mutation queue
IndexedDB
sync cursor
Failed to fetch
NetworkError
TypeError: Cannot read properties of undefined
```

These are internal errors. Surface human-readable states only.

---

## 7. Error States

Never use giant dark/burgundy error banners.

**Error state anatomy:**

```
[icon] pale red surface
       red left border accent
       readable dark-red title
       plain-language explanation
       [ Retry ] button
```

**Acceptable copy:**

```
Could not connect
Check your internet and try again.
[Retry]
```

**Never acceptable:**

```
Failed to fetch
NetworkError when attempting to fetch resource.
500 Internal Server Error
```

---

## 8. ParkDrop Field Blue Tokens

All colors must use **ParkDrop semantic tokens**. No ad-hoc hex values.

| Surface role | Token |
|---|---|
| Page background | `bg-surface-page` |
| Card / panel | `bg-surface-default` |
| Subtle surface | `bg-surface-subtle` |
| Primary action | `bg-action-primary` |
| Primary text | `text-text-primary` |
| Secondary / label text | `text-text-secondary` |
| Muted / caption text | `text-text-muted` |
| Default border | `border-border-default` |
| Focus ring | `border-border-focus` |

| Status | Background | Border | Text |
|---|---|---|---|
| Success | `bg-status-success-bg` | `border-status-success-border` | `text-status-success-text` |
| Danger/Error | `bg-status-danger-bg` | `border-status-danger-border` | `text-status-danger-text` |
| Warning/Offline | `bg-status-warning-bg` | `border-status-warning-border` | `text-status-warning-text` |
| Info/Sync | `bg-status-info-bg` | `border-status-info-border` | `text-status-info-text` |

---

## 9. Typography

The scale is named for the thing it sizes, so a row and a tile cannot silently
drift apart. See `docs/design-plan/02-design-plan.md` §5.3 for the reasoning.

| Role | Size |
|---|---|
| A pickup code being written down; an SMS balance | 48–64px |
| Screen question or title | 30px (28px on a short screen) |
| What the person has typed into a field | 25px |
| Sheet title; name at the top of a detail screen | 22px |
| Primary button label; action tile label | 20px |
| Body; customer name in a row; section heading | 18px |
| Labels, helper text, metadata, chips | 16px |
| **The floor. Nothing goes below this, anywhere.** | **15px** |

- Avoid tiny SaaS typography. **`text-xs` (12px), `text-[11px]` and `text-[10px]`
  are retired from this product** — the screen is in sunlight, the reader may be
  reading slowly, and the phone is at arm's length with a customer waiting.
- Avoid oversized headings that push the task below the fold
- Support **200% text scaling** without layout breakage
- Use `Manrope` (from the design system) — not browser defaults. Weights 600,
  700, 800.
- Tabular figures on anything read digit by digit — phone numbers, codes, PINs,
  amounts, counts, countdowns.

---

## 10. Visual Composition

Do not leave tall phone screens with:

```
Top 30% = form
Bottom 70% = dead white space
```

Use visual balance:

```
Brand signal
Task question or heading
Primary field(s)
Primary action
Support information
Subtle CSS/SVG atmosphere
```

Do not fill empty space with meaningless cards or padding.

---

## 11. Illustrations and Decoration

Use:
- CSS gradients and radial glows
- Inline SVG components (small, reusable)
- ParkDrop motif vocabulary:
  `parcel boxes · pickup tags · package labels · shelf lines · receipt slips · pickup-code shapes · park counter/canopy geometry · sync symbols`

All decorative SVG must:

```html
aria-hidden="true"
focusable="false"
```

```css
pointer-events: none;
```

Do not introduce:
- Heavy PNG/JPG app decoration
- Stock photography
- Lottie animations
- Video
- Giant SVG exports from Figma

---

## 12. Package List Rows

Prefer dense, informative rows. Not giant cards.

```
Chinedu Okafor                   Waiting
0803 123 4567 · PD-8K42Q
Today · 10:42 AM                 ₦3,500
────────────────────────────────────────
```

Use:
- Typography hierarchy (name > phone > time)
- Status badge right-aligned
- Amount right-aligned
- Dividers between rows
- Comfortable tap target on the entire row

Desktop: increase row density. Do not make rows taller on desktop.

---

## 13. The 10 Mobile QA Questions

Before declaring any screen finished:

1. Can I identify the main task immediately?
2. Can I complete it one-handed?
3. Does it work at 360px?
4. Is anything hidden behind the keyboard?
5. Are touch targets comfortable (≥ 44px)?
6. Does offline mode remain usable?
7. Are errors understandable to a non-technical user?
8. Does the design use ParkDrop semantic tokens only?
9. Does this look like an actual mobile application?
10. Does it still feel like ParkDrop without the logo?

If any answer is **No** — refine before shipping.

---

## 14. Implementation Checklist

Before creating a component:
- [ ] Check if a design-system component already exists in `src/design-system/`
- [ ] Do not duplicate primitives

Before committing:
- [ ] `git status` — stage explicit file paths only
- [ ] Never `git add .` or `git add -A`
- [ ] Descriptive imperative commit messages
- [ ] TypeScript imports verified — no missing type imports
- [ ] No hardcoded colors introduced

---

## 15. What This Skill Does Not Cover

- The ParkDrop public marketing website (separate design context)
- Backend API design
- Database schema decisions
- SMS gateway integration logic
