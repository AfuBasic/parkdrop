import * as React from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export function EmptyState({ 
  title, 
  description, 
  action, 
  icon,
  className,
  ...props 
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-subtle p-8 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-default text-text-muted shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="text-[var(--text-heading-md)] font-semibold text-text-primary mb-2">
        {title}
      </h3>
      {description && (
        <p className="mb-6 max-w-sm text-[var(--text-body-md)] text-text-secondary">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
