import * as React from "react"
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-[var(--radius-md)] p-4 flex gap-3",
  {
    variants: {
      variant: {
        info: "bg-status-info/10 text-status-info",
        success: "bg-status-success/10 text-status-success",
        warning: "bg-status-warning/10 text-status-warning",
        danger: "bg-status-danger/10 text-status-danger",
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
