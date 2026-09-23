import * as React from "react"
import { cn } from "@/lib/utils"

interface OperationalStatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  highlight?: boolean
}

export function OperationalStat({ label, value, highlight, className, ...props }: OperationalStatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)} {...props}>
      <span className="text-[var(--text-label)] font-semibold text-text-secondary">
        {label}
      </span>
      <span className={cn(
        "text-[var(--text-heading-lg)] font-bold tabular-nums",
        highlight ? "text-action-primary" : "text-text-primary"
      )}>
        {value}
      </span>
    </div>
  )
}
