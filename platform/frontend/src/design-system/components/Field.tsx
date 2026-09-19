import * as React from "react"
import { cn } from "@/lib/utils"

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  error?: string
  helperText?: string
  htmlFor?: string
  required?: boolean
}

export function Field({ 
  label, 
  error, 
  helperText, 
  htmlFor, 
  required, 
  children, 
  className,
  ...props 
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      <label 
        htmlFor={htmlFor} 
        className="text-[var(--text-label)] font-semibold text-text-primary block"
      >
        {label}
        {required && <span className="text-status-danger ml-1" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[var(--text-caption)] text-status-danger">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-[var(--text-caption)] text-text-secondary">{helperText}</p>
      )}
    </div>
  )
}
