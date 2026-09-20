# ParkDrop Design System

The ParkDrop design system is the visual and interaction foundation for the entire application. It is built to be fast, calm, practical, trustworthy, modern, approachable, deliberate, and efficient.

## ParkDrop Field Blue Theme

**Field Blue** is the canonical design theme of ParkDrop, built specifically for real-world parcel collection and dispatch logistics. It eschews generic SaaS tropes in favor of clear status communication, calm high-contrast readability, and purpose-built components.

### Architecture

- **Tailwind CSS v4**: Theme tokens defined in `src/index.css` via `@theme` block.
- **CSS Custom Properties**: Every semantic color and scale is also exposed under `--pd-*` for inline styles and SVG references.
- **Radix UI Primitives**: Accessible, unstyled primitives for Dialogs, Switches, and Checkboxes.
- **CVA (Class Variance Authority)**: Component variant and size orchestration.

---

## Token System (`src/index.css`)

### 1. Field Blue Scale
- `pd-blue-50` through `pd-blue-950`
- Primary brand accent: `pd-blue-600` (`#2563EB`)
- Hover state: `pd-blue-700` (`#1D4ED8`)
- Active/pressed state: `pd-blue-800` (`#1E40AF`)

### 2. Cool Neutral Scale
- `pd-neutral-0` (`#FFFFFF`) to `pd-neutral-950` (`#020617`)
- Surface Page: `pd-neutral-50` (`#F8FAFC`)
- Borders: `pd-neutral-200` (`#E2E8F0`), strong borders: `pd-neutral-300` (`#CBD5E1`)
- Text hierarchy: Primary (`pd-neutral-900`), Secondary (`pd-neutral-600`), Muted (`pd-neutral-500`)

### 3. Semantic Status System
Status indicators and toasts pair soft background fills, subtle border framing, and high-contrast text:

| Status | Background | Border | Left Accent | Text |
|---|---|---|---|---|
| **Success** | `status-success-bg` (`#F0FDF4`) | `status-success-border` (`#BBF7D0`) | `#16A34A` | `status-success-text` (`#166534`) |
| **Danger / Error** | `status-danger-bg` (`#FEF2F2`) | `status-danger-border` (`#FECACA`) | `#DC2626` | `status-danger-text` (`#7F1D1D`) / `status-danger-text-strong` (`#991B1B`) |
| **Warning** | `status-warning-bg` (`#FFFBEB`) | `status-warning-border` (`#FDE68A`) | `#D97706` | `status-warning-text` (`#92400E`) |
| **Info / Logistics** | `status-info-bg` (`#EFF6FF`) | `status-info-border` (`#BFDBFE`) | `#2563EB` | `status-info-text` (`#1D4ED8`) |
| **Neutral** | `surface-subtle` (`#F1F5F9`) | `border-default` (`#E2E8F0`) | `text-secondary` (`#475569`) | `text-secondary` (`#475569`) |

### 4. Component Rules
- **No Hardcoded Colors**: Feature code must not use arbitrary Tailwind colors (e.g. `bg-red-50`, `text-green-700`, `black`, `burgundy`) for states. Always map the state (Success, Warning, Danger, Info, Neutral) and use the semantic tokens defined in the design system.
- **Disabled States**: Do not implement disabled states with `opacity: 0.2` alone. Use `disabled:bg-surface-disabled`, `disabled:text-text-disabled`, and `disabled:border-border-disabled` to maintain readability.
- **Status Mapping**:
  - *Packages*: Waiting -> Neutral, Collected -> Success, Returned -> Warning, Cancelled -> Danger.
  - *Payments*: Unpaid -> Warning Muted, Part paid -> Warning, Paid -> Success.
  - *SMS*: Not sent -> Neutral, Queued/Sending -> Info, Sent -> Info/Success Muted, Delivered -> Success, Failed -> Danger.
  - *Syncing*: Saved locally -> Info, Syncing -> Info, Synced -> Success Muted, Offline/Needs attention -> Warning, Conflict -> Danger.

---

## Transactional Email

ParkDrop emails are designed to be transactional and reassuring. We do not use promotional or marketing visual styles for authentication or operations.

### Visual Rules
- **Palette**: The outer background uses `#F8FBFF`. The main surface is `#FFFFFF`.
- **OTP Panel**: The code focus area uses a soft blue surface (`#EFF6FF`) with a pale border (`#BFDBFE`) to clearly distinguish it.
- **Logo Usage**: We use the canonical ParkDrop logo (e.g. `parkdrop-logo.png`) exclusively. Do not rely on inline SVGs, text substitutions, or third-party icons.
- **Typography**: Emails must use an email-safe system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`).
- **Responsive Guidelines**: Limit main content width to roughly 560px with generous 40px internal padding on desktop, scaling down to 24px padding on mobile viewports (e.g., 375px/390px). 
- **Plain-text**: Every HTML email must have an identical plain-text counterpart.

---

## Illustrations & Visual Motifs (`src/design-system/illustrations`)

- **Rule**: No generic stock vector art or external raster illustrations.
- **Coloring**: All illustrations consume `--color-pd-blue-*` and `--color-surface-*` tokens directly via SVG variables or `currentColor`.
- **Components**:
  - `AuthBackdrop`: Isometric parcel box composition with shelf lines, security token badge, and radial glow.
  - `ParcelPattern`: Geometric repeat pattern of subtle parcel wireframes for subtle cards and header backdrops.
  - `EmptyParcelIllustration`: Calm empty shelf visual for zero-state parcel lists.
  - `SyncIllustration`: Network sync indicator with package handoff motif.

---

## Layers

1. **Primitives (`src/design-system/components`)**: Basic UI elements like `Button`, `Input`, `SearchInput`, `StatusBadge`, `Dialog`.
2. **Patterns (`src/design-system/patterns` / `src/features/packages/search`)**: Domain-specific UI combinations:
   - `PackageSearchInput`: 52–56px high mobile operational input with clear button, search icon, and accessible labels.
   - `PackageSearchResultRow`: Compact scanning row displaying customer name, status badge, mono pickup code, public package ID (`PD-XXXXX`), formatted phone, relative timestamp, and amount due.
   - `PackageListItem`: Home and list parcel row.
   - `SmsCreditBalance`: SMS credit display component.
3. **App Shell (`src/design-system/shell`)**: High-level layout components like `AppShell`, `PageHeader`, `NavItem`.

## Usage

All components are exported from `src/design-system/index.ts`.

```tsx
import { Button, PackageListItem, AuthBackdrop } from "@/design-system"
```

