import * as React from "react"
import { CheckCircle2 } from "lucide-react"
import { Button } from "../components/Button"
import { cn } from "@/lib/utils"

interface CustomerLookupResultProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  phone: string
  onUseCustomer?: () => void
}

export function CustomerLookupResult({ name, phone, onUseCustomer, className, ...props }: CustomerLookupResultProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[var(--radius-md)] border border-status-success/30 bg-status-success/5 p-4", className)} {...props}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-success/10 text-status-success">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[var(--text-label)] font-semibold text-text-primary">
            {name} found
          </span>
          <span className="text-[var(--text-body-sm)] text-text-secondary tabular-nums">
            {phone}
          </span>
        </div>
      </div>
      {onUseCustomer && (
        <Button variant="secondary" onClick={onUseCustomer} className="w-full sm:w-auto border-status-success/20 hover:bg-status-success/10">
          Use customer
        </Button>
      )}
    </div>
  )
}
