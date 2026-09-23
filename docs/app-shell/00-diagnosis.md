# App Shell & Routing — Diagnosis

**Date:** 2026-09-21  
**Status:** Confirmed. This document must be read before any component work begins.

---

## Finding: Path B — No real router. State-driven screens only.

There is **no client-side router wired into the authenticated app**. Navigation is driven entirely by a `currentPath: string` state variable inside `AuthenticatedApp.tsx`. Every screen is shown via conditional rendering against that string. The browser URL never changes after login.

### Evidence

| File | Relevant line(s) | What it shows |
|---|---|---|
| `src/routes/AuthenticatedApp.tsx` | L39 | `const [currentPath, setCurrentPath] = React.useState('/')` — the entire navigation state |
| `src/routes/AuthenticatedApp.tsx` | L70–L202 | Every route is a conditional `{currentPath === '/...' && <Screen />}` — no router involved |
| `src/routes/AuthenticatedApp.tsx` | L62–L68 | `<AppShell onNavigate={setCurrentPath}>` — the shell calls `setCurrentPath`, never a router |
| `src/App.tsx` | L126–L135 | Path check uses `window.location.pathname` with a literal string comparison — not a router |
| `platform/frontend/package.json` | L23 | `"@tanstack/react-router": "^1.170.38"` is **installed** but **never used** |

### Confirmed Consequences

1. **URL never changes.** Pasting `/packages/PD-XXXXX` into the address bar shows the login screen, not a package.
2. **Browser back/forward are broken.** Every tap changes `currentPath` state but pushes nothing onto `window.history`, so `popstate` events never fire and the back button exits the app instead of going back one screen.
3. **No deep links.** A link to a specific package cannot be shared or bookmarked.
4. **Logo is inconsistent.** `PackageDetailScreen` renders its own `<header>` with a Back button but no logo. Because `fullScreenTask` is set to `true` for the detail route, `AppShell` hides the sidebar and its logo entirely. No other screen re-adds the logo. Any screen that opts out of the shell's standard mode is invisible to the shell's logo.
5. **No transition target.** With state-swapping there is no "outgoing" page to animate away, so correct directional transitions are impossible without first migrating to a real router.

### Router Already Installed

`@tanstack/react-router@^1.170.38` is present in `package.json` but unused. This is the correct choice for this stack (Vite + React + TypeScript, offline-first, no SSR). **We will use TanStack Router — no new install needed.**

### Staff Phone Gap

`LocalPackage` stores `creator_name` (received-by staff) and `terminal_actor_name` (collected/returned-by staff) but **no phone number for either**. The `PackageLifecycleRepository.collectPackageLocally` call passes `actorName: 'Staff'` (hardcoded). The backend `package_lifecycle_events` table likely stores the user's ID but the sync pull currently only surfaces the name string, not the phone.

**Decision:** Show name only when a phone number is not present; never invent a number. The name field is already populated from `creator_name`. A `creator_phone` / `terminal_actor_phone` field will be added to `LocalPackage` and populated from the sync pull if the backend includes it; otherwise the phone is omitted and the gap is noted in the report.

---

## Path Taken: Path B

A full migration from state-swapping to real URL-based routing via TanStack Router is required before any other work. The plan follows.

## Finding: Customers and More/Settings Headers

The `CustomersScreen` and `MoreScreen` are currently rendered inside the `AppShell` (via `mainShellRoute` in `router.tsx`), which provides the desktop sidebar and mobile bottom navigation. 

However, **`AppShell` does not provide a mobile top header**. The mobile top headers in the app are currently managed by the individual screens themselves:
- `HomeScreen` renders its own `HomeHeader` (which includes the Logo).
- `PackagesScreen` renders its own `PackagesListHeader` (which includes the Logo).

Because `AppShell` lacks a mobile top header, `CustomersScreen` and `MoreScreen` were built with their own inline HTML `<header>` blocks to provide a title. In `CustomersScreen`, this inline header includes a stray `<Logo tone="light" markOnly />` (the package-pin icon) crammed on the right side next to an "Add package" button. `MoreScreen` does the same.

There is a `Page` component (`design-system/shell/Page.tsx`) that can provide a standard top bar (with a title and back button), but **it does not include the ParkDrop Logo** and it is currently **not used** by `Home` or `Packages` (they bypass it to render their custom blue headers).

**Conclusion:** The missing shell header is because the shell (`AppShell`) was never built to provide a mobile top header. Every screen currently builds its own.
