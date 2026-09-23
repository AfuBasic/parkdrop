import * as React from "react"
import { cn } from "@/lib/utils"

interface PaymentSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  amountDue: number
  amountPaid: number
}

export function PaymentSummary({ amountDue, amountPaid, className, ...props }: PaymentSummaryProps) {
  const balance = Math.max(0, amountDue - amountPaid)

  return (
    <div className={cn("flex flex-col gap-4 rounded-[var(--radius-md)] border border-border-default bg-surface-default p-4", className)} {...props}>
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-body-sm)] text-text-secondary">Amount due</span>
        <span className="text-[var(--text-body-md)] font-medium tabular-nums text-text-primary">
          ₦{amountDue.toLocaleString()}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-body-sm)] text-text-secondary">Paid</span>
        <span className="text-[var(--text-body-md)] font-medium tabular-nums text-text-primary">
          ₦{amountPaid.toLocaleString()}
        </span>
      </div>
      
      <div className="my-1 h-px w-full bg-border-default" aria-hidden="true" />
      
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-body-md)] font-semibold text-text-primary">Balance</span>
        <span className="text-[var(--text-heading-md)] font-bold tabular-nums text-text-primary">
          ₦{balance.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
