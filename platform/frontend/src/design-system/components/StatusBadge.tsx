import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[var(--text-caption)] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "bg-status-success-bg text-status-success-text border border-status-success-border",
        "success-muted": "bg-surface-subtle text-status-success-text border border-border-default",
        warning: "bg-status-warning-bg text-status-warning-text border border-status-warning-border",
        "warning-muted": "bg-surface-subtle text-status-warning-text border border-border-default",
        danger: "bg-status-danger-bg text-status-danger-text border border-status-danger-border",
        info: "bg-status-info-bg text-status-info-text border border-status-info-border",
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
