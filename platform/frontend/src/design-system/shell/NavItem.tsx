import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface NavItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon: React.ReactNode
  label: string
  isActive?: boolean
  asChild?: boolean
}

/**
 * One destination in the bottom bar or the desktop sidebar.
 *
 * Icon and label, always both. An icon-only bar asks a first-time user to
 * guess, and the guess is made with a customer waiting. The label sits at
 * 15px — the floor for this app — rather than the 12px caption size, and the
 * active item is marked by a tinted pill behind the icon as well as by
 * colour, so the current tab is not carried by hue alone.
 *
 * The emphasized floating variant is gone: there is exactly one Add control
 * in the app, and it is the tile on Home.
 */
export const NavItem = React.forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ icon, label, isActive, asChild, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "a"

    return (
      <Comp
        ref={ref}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex flex-1 sm:flex-none flex-col sm:flex-row sm:justify-start items-center",
          "gap-1 sm:gap-3 min-h-[var(--pd-tap-min)] rounded-[var(--radius-md)]",
          "px-1 py-1.5 sm:px-4 sm:py-3",
          "text-[var(--pd-size-small)] font-bold sm:text-[var(--text-body-md)] sm:font-medium",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
          isActive
            ? "text-[var(--pd-blue-hover)] sm:bg-surface-selected sm:text-action-primary"
            : "text-[var(--pd-muted)] hover:text-text-primary sm:hover:bg-surface-subtle",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "flex h-7 w-11 sm:h-6 sm:w-6 items-center justify-center rounded-full sm:rounded-none",
            isActive && "bg-[var(--pd-tint-2)] sm:bg-transparent"
          )}
        >
          {icon}
        </span>
        <span className="leading-none">{label}</span>
      </Comp>
    )
  }
)
NavItem.displayName = "NavItem"
