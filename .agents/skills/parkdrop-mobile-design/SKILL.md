---
name: parkdrop-mobile-design
description: >
  Repository-level mobile product-design skill for ParkDrop.
  Governs all UI/UX decisions across the ParkDrop application.
  Establishes mobile-first design order, touch standards, offline-first
  composition, ParkDrop Field Blue semantic token usage, typography,
  navigation, and mobile QA requirements. Apply this skill to every
  screen design, component creation, and UI review task in this repo.
applies_to:
  - "platform/frontend/**"
  - "docs/**"
triggers:
  - mobile ui
  - mobile design
  - screen design
  - auth screen
  - package list
  - package creation
  - package detail
  - navigation
  - bottom nav
  - touch target
  - offline state
  - empty state
  - error state
  - loading state
  - toast
  - bottom sheet
  - form design
  - PWA
  - responsive
  - 360px
  - thumb reach
  - safe area
---

# ParkDrop Mobile-First Design Skill

This skill governs product-design decisions across the ParkDrop application.

ParkDrop is a **mobile-first operational application** deployed as a React PWA.
The mobile experience is the source design. Tablet and desktop are adaptations.

---

## Repository Skill Registration

**Location:** `.agents/skills/parkdrop-mobile-design/`

This is a **repository-level** skill. It supplements but does not replace:

- `docs/PARKDROP_MASTER_CONTEXT.md`
- `docs/design-system.md`

---

## References

Before executing any UI task, read:

1. `.agents/skills/parkdrop-mobile-design/references/mobile-ui-rules.md`
   — Touch standards, typography, offline design, navigation patterns, QA checklist.

2. `.agents/skills/parkdrop-mobile-design/references/parkdrop-mobile-patterns.md`
   — ParkDrop-specific screen patterns: auth, package list, package creation,
     package detail, customer lookup, SMS state, payment, offline/sync.

Also read where they exist:

- `docs/PARKDROP_MASTER_CONTEXT.md`
- `docs/design-system.md`

---

## Canonical Design Priority

```
Mobile (360–430px) → Tablet (768px) → Desktop (1024px+)
```

Every screen must be designed and verified at:

```
360px → 390px → 412px → 430px → 768px → 1024px+
```

Never design desktop then shrink it to mobile.

---

## Non-Negotiable Mobile Rules

1. Every screen must answer the 10 Mobile QA Questions (see `mobile-ui-rules.md`).
2. Minimum touch target: **44 × 44px** (prefer 48 × 48px for primary actions).
3. Primary buttons: **52–56px** tall on mobile.
4. Bottom navigation: icon + label, safe-area-aware.
5. All colors via **ParkDrop Field Blue semantic tokens** only.
6. Offline states must be calm and informative — never expose raw errors.
7. Forms must account for keyboard-open state.
8. No hover-dependent controls on mobile.
9. No desktop-dashboard layouts forced to mobile.
10. Commit strategy: explicit file paths, descriptive imperative messages.

---

## Do Not Apply This Skill To

- The public ParkDrop marketing website (if one exists separately).
  That is a different design context.

---

## Activation

This skill activates automatically for any task involving:

- Screen layout design or review
- Component creation or restyling
- Navigation changes
- Form design
- State design (loading, error, offline, empty, success)
- Any mention of mobile, PWA, responsive, or viewport widths
