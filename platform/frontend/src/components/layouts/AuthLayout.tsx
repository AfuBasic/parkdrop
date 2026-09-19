import * as React from "react"
import { Outlet, Link, useRouterState } from "@tanstack/react-router"
import { Home, PlusSquare, PackageSearch, Settings } from "lucide-react"

export function AuthLayout() {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const navItems = [
    { name: "Home", to: "/", icon: Home },
    { name: "Add", to: "/add", icon: PlusSquare },
    { name: "Packages", to: "/packages", icon: PackageSearch },
    { name: "Settings", to: "/settings", icon: Settings },
  ]

  return (
    <div className="flex h-screen w-full flex-col bg-surface-page lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border-default bg-surface-default p-4 lg:flex">
        <div className="mb-8 flex h-12 items-center px-4">
          <span className="text-xl font-bold text-action-primary">ParkDrop</span>
        </div>
        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-surface-selected text-action-primary"
                    : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="mx-auto max-w-4xl p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border-default bg-surface-default px-2 pb-safe lg:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 p-2 ${
                isActive ? "text-action-primary" : "text-text-secondary"
              }`}
            >
              <item.icon className={`h-6 w-6 ${isActive ? "fill-action-primary/20" : ""}`} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
