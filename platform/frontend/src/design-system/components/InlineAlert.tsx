import * as React from "react"
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-[var(--radius-md)] p-4 flex gap-3",
  {
    variants: {
      variant: {
        info: "bg-status-info-bg text-status-info-text border border-status-info-border",
        success: "bg-status-success-bg text-status-success-text border border-status-success-border",
        warning: "bg-status-warning-bg text-status-warning-text border border-status-warning-border",
        danger: "bg-status-danger-bg text-status-danger-text border border-status-danger-border",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

export interface InlineAlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string
}

function InlineAlert({ className, variant, title, children, ...props }: InlineAlertProps) {
  const Icon = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertCircle,
  }[variant || "info"]

  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <div className="flex flex-col gap-1">
        {title && <h5 className="font-semibold leading-none tracking-tight">{title}</h5>}
        <div className="text-sm [&_p]:leading-relaxed text-text-primary opacity-90">
          {children}
        </div>
      </div>
    </div>
  )
}

export { InlineAlert }
