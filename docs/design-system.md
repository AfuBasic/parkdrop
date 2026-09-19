# ParkDrop Design System

## Core Aesthetics
ParkDrop uses a highly intentional, "blue-led" design system. It is designed to feel clean, trustworthy, simple, modern, and product-led.

## Typography
*   **Primary Font:** Inter
*   **Scale:** Follows standard Tailwind spacing, utilizing `tracking-tight` for headers.

## Colors

### Blue Scale (Action & Brand)
We utilize a unified blue scale for all primary actions.
*   `--color-blue-50` to `--color-blue-950`
*   **Primary Action:** `--color-blue-600`
*   **Primary Action Hover:** `--color-blue-700`

### Surfaces & Backgrounds
*   **Page Background:** `--color-surface-page` (`#f8fafc` - Slate 50)
*   **Card/Component Surface:** `--color-surface-default` (`#ffffff` - White)
*   **Subtle/Secondary Surface:** `--color-surface-subtle` (`#f1f5f9` - Slate 100)
*   **Selected Surface:** `--color-surface-selected` (Blue 50)

### Borders
*   **Default:** `--color-border-default` (`#e2e8f0` - Slate 200)
*   **Strong:** `--color-border-strong` (`#cbd5e1` - Slate 300)
*   **Focus:** `--color-border-focus` (Blue 400)

## Mobile First UI
*   **Touch Targets:** All interactive elements (buttons, inputs) must be at least `48px` tall (e.g. `min-h-[48px]`).
*   **Navigation:** Mobile utilizes a bottom tab navigation bar. Desktop utilizes a side rail.

## Primitives
*   **Button:** Supports `default`, `destructive`, `outline`, `secondary`, `ghost`, and `link` variants.
*   **Input:** Unified styling for text fields.
*   **Badge:** Status indicators for Packages and Subscriptions.
