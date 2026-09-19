import * as React from "react"
import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"

interface QuickActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  label: string
  asChild?: boolean
}

export const QuickAction = React.forwardRef<HTMLButtonElement, QuickActionProps>(
  ({ icon, label, asChild, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-border-default bg-surface-default p-4 text-text-primary transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
          className
        )}
        {...props}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-selected text-action-primary">
          {icon}
        </div>
        <span className="text-[var(--text-label)] font-medium">{label}</span>
      </Comp>
    )
  }
)
QuickAction.displayName = "QuickAction"
