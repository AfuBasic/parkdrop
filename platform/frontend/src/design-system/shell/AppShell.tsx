import * as React from "react"
import { Home, Package, Plus, Users, Menu } from "lucide-react"
import { NavItem } from "./NavItem"

interface AppShellProps {
  children: React.ReactNode
  currentPath?: string
  onNavigate?: (path: string) => void
}

const navConfig = [
  { path: "/", label: "Home", icon: <Home className="h-5 w-5" /> },
  { path: "/packages", label: "Packages", icon: <Package className="h-5 w-5" /> },
  { path: "/add", label: "Add", icon: <Plus className="h-6 w-6 sm:h-5 sm:w-5" />, emphasized: true },
  { path: "/customers", label: "Customers", icon: <Users className="h-5 w-5" /> },
  { path: "/more", label: "More", icon: <Menu className="h-5 w-5" /> },
]

export function AppShell({ children, currentPath = "/", onNavigate }: AppShellProps) {
  
  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate(path)
    }
  }

  return (
    <div className="flex min-h-screen flex-col sm:flex-row bg-surface-page">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border-default bg-surface-default sm:flex">
        <div className="flex h-16 items-center border-b border-border-default px-6">
          <span className="text-xl font-bold tracking-tight text-action-primary">
            ParkDrop
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navConfig.map((item) => (
            <NavItem
              key={item.path}
              href={item.path}
              icon={item.icon}
              label={item.label}
              isActive={currentPath === item.path && !item.emphasized}
              isEmphasized={item.emphasized}
              onClick={(e) => handleNav(e, item.path)}
              className={item.emphasized ? "mt-4 mb-4" : ""}
            />
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 sm:pb-0">
        <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[88px] items-start justify-around border-t border-border-default bg-surface-default px-2 pt-2 pb-safe sm:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navConfig.map((item) => (
          <NavItem
            key={item.path}
            href={item.path}
            icon={item.icon}
            label={item.label}
            isActive={currentPath === item.path && !item.emphasized}
            isEmphasized={item.emphasized}
            onClick={(e) => handleNav(e, item.path)}
            className={item.emphasized ? "-mt-6" : ""}
          />
        ))}
      </nav>
    </div>
  )
}
