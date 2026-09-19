import * as React from "react"
import { cn } from "@/lib/utils"

export interface MoneyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="relative flex w-full items-center">
        <span className="absolute left-3 text-text-secondary font-medium" aria-hidden="true">
          ₦
        </span>
        <input
          type="text"
          inputMode="numeric"
          className={cn(
            "flex h-12 w-full rounded-[var(--radius-md)] border bg-surface-default pl-8 pr-3 py-2 text-base md:text-sm ring-offset-surface-page placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors font-medium",
            error 
              ? "border-status-danger focus-visible:ring-status-danger" 
              : "border-border-default focus-visible:ring-border-focus",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
MoneyInput.displayName = "MoneyInput"

export { MoneyInput }
