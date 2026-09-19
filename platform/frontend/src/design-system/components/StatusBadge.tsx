import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[var(--text-caption)] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "bg-status-success/10 text-status-success",
        warning: "bg-status-warning/10 text-status-warning",
        danger: "bg-status-danger/10 text-status-danger",
        info: "bg-status-info/10 text-status-info",
        neutral: "bg-surface-subtle text-text-secondary border border-border-default",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function StatusBadge({ className, variant, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { StatusBadge, badgeVariants }
