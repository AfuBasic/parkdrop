import * as React from "react"
import { ChevronLeft } from "lucide-react"
import { Button } from "../components/Button"
import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  showBackButton?: boolean
  onBack?: () => void
  actions?: React.ReactNode
}

export function PageHeader({ 
  title, 
  subtitle, 
  showBackButton, 
  onBack, 
  actions, 
  className,
  ...props 
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)} {...props}>
      <div className="flex items-start gap-4">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="mt-1 h-10 w-10 shrink-0 rounded-full sm:-ml-3"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-[var(--text-heading-xl)] font-bold tracking-tight text-text-primary">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[var(--text-body-md)] text-text-secondary">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  )
}
