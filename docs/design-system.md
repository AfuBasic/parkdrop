# ParkDrop Design System

The ParkDrop design system is the visual and interaction foundation for the entire application. It is built to be fast, calm, practical, trustworthy, modern, approachable, deliberate, and efficient.

## Architecture

- **Tailwind CSS v4**: Utility-first CSS using a comprehensive theme defined in `src/index.css`.
- **Radix UI Primitives**: Accessible, unstyled UI components for things like Dialogs, Tooltips, Switches, Checkboxes, and Tabs.
- **CVA (Class Variance Authority)**: For managing component variants (e.g. Button sizes, colors).

## Token System (`src/index.css`)

### Colors
- **Brand/Action (Blue)**: Scale from `blue-50` to `blue-950`.
- **Neutrals**: Scale from `neutral-0` to `neutral-950`.
- **Semantic Status**: Success (Green), Warning (Amber), Danger (Red), Info (Blue).

### Typography
- **Font**: Inter
- **Scales**: Display, Heading (xl, lg, md, sm), Body (lg, md, sm), Label, Caption.

### Spacing & Radius
- **Spacing**: 0 to 80px scale.
- **Radius**: xs (6px) to full (9999px).

## Layers

1. **Primitives (`src/design-system/components`)**: Basic UI elements like `Button`, `Input`, `StatusBadge`, `Dialog`.
2. **Patterns (`src/design-system/patterns`)**: Domain-specific UI combinations like `PackageListItem`, `SmsCreditBalance`, `ActivityTimeline`.
3. **App Shell (`src/design-system/shell`)**: High-level layout components like `AppShell`, `PageHeader`, `NavItem`.

## Usage

All components are exported from `src/design-system/index.ts`.

```tsx
import { Button, PackageListItem } from "@/design-system"
```
