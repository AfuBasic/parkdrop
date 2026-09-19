import * as React from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "../components/Button"
import { cn } from "@/lib/utils"

interface SmsCreditBalanceProps extends React.HTMLAttributes<HTMLDivElement> {
  credits: number
  onBuyClick?: () => void
}

export function SmsCreditBalance({ credits, onBuyClick, className, ...props }: SmsCreditBalanceProps) {
  const isZero = credits === 0
  const isLow = credits > 0 && credits <= 10

  if (isZero) {
    return (
      <div className={cn("flex flex-col items-start gap-4 rounded-[var(--radius-md)] border border-border-default bg-surface-subtle p-4", className)} {...props}>
        <div className="flex items-center gap-3 text-status-warning">
          <MessageSquare className="h-6 w-6" />
          <h3 className="text-[var(--text-heading-sm)] font-semibold">No SMS credits left</h3>
        </div>
        <p className="text-[var(--text-body-sm)] text-text-secondary">
          You can still create and manage packages. Buy more credits to send SMS notifications.
        </p>
        <Button variant="secondary" onClick={onBuyClick}>
          Buy SMS credits
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center justify-between rounded-[var(--radius-md)] border border-border-default bg-surface-default p-4", className)} {...props}>
      <div className="flex flex-col">
        <span className="text-[var(--text-label)] font-semibold text-text-secondary">
          SMS credits
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn("text-[var(--text-heading-md)] font-bold tabular-nums", isLow ? "text-status-warning" : "text-text-primary")}>
            {credits}
          </span>
          <span className={cn("text-[var(--text-body-sm)]", isLow ? "text-status-warning" : "text-text-secondary")}>
            {isLow ? "left" : "remaining"}
          </span>
        </div>
      </div>
      {isLow && onBuyClick && (
        <Button variant="secondary" size="sm" onClick={onBuyClick}>
          Buy credits
        </Button>
      )}
    </div>
  )
}
