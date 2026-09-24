/**
 * The bottom nav / sidebar tab order, left to right. Shared between the nav
 * bar itself (design-system/shell/AppShell.tsx) and the route-transition
 * direction logic (lib/nav-direction.tsx) — tapping a tab to the right of
 * the current one should feel like moving forward through stacked screens
 * (slide left), tapping one to the left should feel like moving back
 * (slide right), regardless of browser history push/pop order.
 */
export const TAB_ORDER = ['/', '/packages', '/customers', '/more'] as const;

export function tabIndexOf(pathname: string): number {
  return TAB_ORDER.indexOf(pathname as (typeof TAB_ORDER)[number]);
}
