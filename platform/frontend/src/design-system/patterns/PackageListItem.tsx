import * as React from "react"
import { StatusBadge } from "../components/StatusBadge"
import { cn } from "@/lib/utils"

export type PackageStatus = "WAITING" | "COLLECTED" | "RETURNED" | "CANCELLED"
export type PaymentStatus = "UNPAID" | "PART_PAID" | "PAID"

interface PackageListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  customerName: string
  phoneNumber: string
  pickupCode: string
  status: PackageStatus
  paymentStatus: PaymentStatus
  amount: number
  dateReceived: string
}

export function PackageListItem({ 
  customerName, 
  phoneNumber, 
  pickupCode, 
  status, 
  paymentStatus, 
  amount, 
  dateReceived,
  className,
  ...props 
}: PackageListItemProps) {
  
  const statusConfig = {
    WAITING: { label: "Waiting", variant: "warning" as const },
    COLLECTED: { label: "Collected", variant: "success" as const },
    RETURNED: { label: "Returned", variant: "neutral" as const },
    CANCELLED: { label: "Cancelled", variant: "danger" as const },
  }

  const paymentConfig = {
    UNPAID: { label: "Unpaid", variant: "warning-muted" as const },
    PART_PAID: { label: "Part paid", variant: "warning" as const },
    PAID: { label: "Paid", variant: "success" as const },
  }

  return (
    <div 
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-md)] border border-border-default bg-surface-default p-4 transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:justify-between cursor-pointer",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between sm:justify-start sm:gap-3">
          <span className="text-[var(--text-body-md)] font-semibold text-text-primary">
            {customerName}
          </span>
          <div className="flex gap-2 sm:hidden">
            <StatusBadge variant={statusConfig[status].variant}>
              {statusConfig[status].label}
            </StatusBadge>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-body-sm)] text-text-secondary">
          <span className="tabular-nums">{phoneNumber}</span>
          <span aria-hidden="true">&middot;</span>
          <span className="tabular-nums uppercase font-medium">{pickupCode}</span>
        </div>
      </div>

      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:gap-1">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex sm:gap-2">
            <StatusBadge variant={statusConfig[status].variant}>
              {statusConfig[status].label}
            </StatusBadge>
            <StatusBadge variant={paymentConfig[paymentStatus].variant}>
              {paymentConfig[paymentStatus].label}
            </StatusBadge>
          </div>
          <span className="text-[var(--text-body-md)] font-semibold text-text-primary tabular-nums">
            ₦{amount.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          <StatusBadge variant={paymentConfig[paymentStatus].variant}>
            {paymentConfig[paymentStatus].label}
          </StatusBadge>
          <span className="text-[var(--text-caption)] text-text-muted">
            {dateReceived}
          </span>
        </div>
        <span className="hidden sm:block text-[var(--text-caption)] text-text-muted">
          {dateReceived}
        </span>
      </div>
    </div>
  )
}
