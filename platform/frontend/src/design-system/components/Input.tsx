import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-[var(--radius-md)] border bg-surface-default px-3 py-2 text-base md:text-sm ring-offset-surface-page file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-surface-disabled disabled:text-text-disabled disabled:border-border-disabled transition-colors",
          error 
            ? "border-status-danger focus-visible:ring-status-danger" 
            : "border-border-strong focus-visible:ring-border-focus",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
