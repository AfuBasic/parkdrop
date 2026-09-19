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
| **Danger / Error** | `status-danger-bg` (`#FEF2F2`) | `status-danger-border` (`#FECACA`) | `#DC2626` | `status-danger-text` (`#B91C1C`) |
| **Warning** | `status-warning-bg` (`#FFFBEB`) | `status-warning-border` (`#FDE68A`) | `#D97706` | `status-warning-text` (`#92400E`) |
| **Info / Logistics** | `status-info-bg` (`#EFF6FF`) | `status-info-border` (`#BFDBFE`) | `#2563EB` | `status-info-text` (`#1D4ED8`) |

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

1. **Primitives (`src/design-system/components`)**: Basic UI elements like `Button`, `Input`, `StatusBadge`, `Dialog`.
2. **Patterns (`src/design-system/patterns`)**: Domain-specific UI combinations like `PackageListItem`, `SmsCreditBalance`, `ActivityTimeline`.
3. **App Shell (`src/design-system/shell`)**: High-level layout components like `AppShell`, `PageHeader`, `NavItem`.

## Usage

All components are exported from `src/design-system/index.ts`.

```tsx
import { Button, PackageListItem, AuthBackdrop } from "@/design-system"
```

