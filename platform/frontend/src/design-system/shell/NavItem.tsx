import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface NavItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon: React.ReactNode
  label: string
  isActive?: boolean
  isEmphasized?: boolean
  asChild?: boolean
}

export const NavItem = React.forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ icon, label, isActive, isEmphasized, asChild, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "a"
    
    if (isEmphasized) {
      return (
        <Comp
          ref={ref}
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-[var(--text-caption)] font-medium transition-colors hover:text-action-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-[var(--radius-md)]",
            className
          )}
          {...props}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-action-primary text-text-inverse shadow-[var(--shadow-elevation-1)] transition-transform hover:scale-105 active:scale-95 sm:h-12 sm:w-full sm:rounded-[var(--radius-md)] sm:shadow-none sm:gap-2">
            <div className="flex items-center justify-center sm:hidden">
              {icon}
            </div>
            <div className="hidden sm:flex sm:items-center sm:justify-center sm:gap-2">
              {icon}
              <span className="text-[var(--text-body-md)] font-semibold">{label}</span>
            </div>
          </div>
          <span className="sr-only sm:hidden">{label}</span>
        </Comp>
      )
    }

    return (
      <Comp
        ref={ref}
        className={cn(
          "flex flex-col sm:flex-row sm:justify-start items-center gap-1 sm:gap-3 rounded-[var(--radius-md)] p-2 sm:px-4 sm:py-3 text-[var(--text-caption)] sm:text-[var(--text-body-md)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
          isActive 
            ? "text-action-primary sm:bg-surface-selected sm:text-action-primary" 
            : "text-text-secondary hover:text-text-primary sm:hover:bg-surface-subtle",
          className
        )}
        {...props}
      >
        <div className="flex h-6 w-6 items-center justify-center">
          {icon}
        </div>
        <span>{label}</span>
      </Comp>
    )
  }
)
NavItem.displayName = "NavItem"
