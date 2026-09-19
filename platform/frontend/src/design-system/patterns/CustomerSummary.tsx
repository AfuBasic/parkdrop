import * as React from "react"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomerSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  phone: string
  packagesWaiting: number
}

export function CustomerSummary({ name, phone, packagesWaiting, className, ...props }: CustomerSummaryProps) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-[var(--radius-md)] border border-border-default bg-surface-default p-4", className)} {...props}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-text-secondary">
          <User className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[var(--text-body-md)] font-semibold text-text-primary">
            {name}
          </span>
          <span className="text-[var(--text-body-sm)] text-text-secondary tabular-nums">
            {phone}
          </span>
        </div>
      </div>
      {packagesWaiting > 0 && (
        <div className="mt-2 text-[var(--text-body-sm)] font-medium text-action-primary">
          {packagesWaiting} {packagesWaiting === 1 ? 'package' : 'packages'} waiting
        </div>
      )}
    </div>
  )
}
