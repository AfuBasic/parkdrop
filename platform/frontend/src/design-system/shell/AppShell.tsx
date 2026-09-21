import * as React from "react"
import { Home, Package, Users, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { HomeStrings } from "@/features/home/strings"
import { NavItem } from "./NavItem"

interface AppShellProps {
  children: React.ReactNode
  currentPath?: string
  onNavigate?: (path: string) => void
  /**
   * Let the screen paint to the edges and supply its own padding.
   */
  bleed?: boolean
  /**
   * Dedicated full-screen modal task (e.g. /packages/new): hides bottom nav.
   */
  fullScreenTask?: boolean
}

/**
 * Four destinations, no floating button.
 *
 * The floating "+" was the third way to add a package on a screen that also
 * had a main button and an empty-state button. Adding a package now happens
 * in one place — the Add tile on Home — so the bar is a set of places to go
 * and nothing else.
 */
const navConfig = [
  { path: "/", label: HomeStrings.navHome, icon: <Home className="h-6 w-6" strokeWidth={2.25} /> },
  { path: "/packages", label: HomeStrings.navPackages, icon: <Package className="h-6 w-6" strokeWidth={2.25} /> },
  { path: "/customers", label: HomeStrings.navCustomers, icon: <Users className="h-6 w-6" strokeWidth={2.25} /> },
  { path: "/more", label: HomeStrings.navMore, icon: <Menu className="h-6 w-6" strokeWidth={2.25} /> },
]

export function AppShell({
  children,
  currentPath = "/",
  onNavigate,
  bleed = false,
  fullScreenTask = false,
}: AppShellProps) {

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate(path)
    }
  }

  return (
    <div className="flex min-h-screen flex-col sm:flex-row bg-surface-page">
      {/* Desktop Sidebar */}
      {!fullScreenTask && (
        <aside className="hidden w-64 flex-col border-r border-border-default bg-surface-default sm:flex">
          <div className="flex h-16 items-center border-b border-border-default px-6">
            <span className="text-xl font-bold tracking-tight text-action-primary">
              {HomeStrings.brand}
            </span>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {navConfig.map((item) => (
              <NavItem
                key={item.path}
                href={item.path}
                icon={item.icon}
                label={item.label}
                isActive={currentPath === item.path}
                onClick={(e) => handleNav(e, item.path)}
              />
            ))}
          </nav>
        </aside>
      )}

      {/* Main Content Area */}
      <main className={cn("flex-1 overflow-y-auto", !fullScreenTask && "pb-24 sm:pb-0")}>
        <div className={cn(!bleed && !fullScreenTask && "mx-auto max-w-5xl p-4 sm:p-6 lg:p-8")}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {!fullScreenTask && (
        <nav
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 sm:hidden",
            "flex items-stretch justify-around gap-2 px-2 pt-1.5",
            "min-h-[var(--pd-nav-h)]",
            "border-t border-[var(--pd-line-2)] bg-white"
          )}
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 6px)" }}
        >
          {navConfig.map((item) => (
            <NavItem
              key={item.path}
              href={item.path}
              icon={item.icon}
              label={item.label}
              isActive={currentPath === item.path}
              onClick={(e) => handleNav(e, item.path)}
            />
          ))}
        </nav>
      )}
    </div>
  )
}
