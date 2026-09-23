import * as React from "react"
import { cn } from "@/lib/utils"

export interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        type="tel"
        inputMode="tel"
        placeholder="e.g. 0803 123 4567"
        className={cn(
          "flex h-12 w-full rounded-[var(--radius-md)] border bg-surface-default px-3 py-2 text-base md:text-sm ring-offset-surface-page placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors font-medium tracking-wide",
          error 
            ? "border-status-danger focus-visible:ring-status-danger" 
            : "border-border-default focus-visible:ring-border-focus",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
