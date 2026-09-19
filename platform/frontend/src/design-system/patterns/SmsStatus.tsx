import * as React from "react"
import { Check, CheckCircle2, Clock, XCircle, Send } from "lucide-react"
import { cn } from "@/lib/utils"

export type SmsDeliveryStatus = "NOT_SENT" | "QUEUED" | "SENDING" | "SENT" | "DELIVERED" | "FAILED"

interface SmsStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  status: SmsDeliveryStatus
  time?: string
}

export function SmsStatus({ status, time, className, ...props }: SmsStatusProps) {
  const config = {
    NOT_SENT: { icon: Clock, label: "Not sent", color: "text-text-secondary" },
    QUEUED: { icon: Clock, label: "SMS queued", color: "text-status-info" },
    SENDING: { icon: Send, label: "Sending SMS", color: "text-status-info" },
    SENT: { icon: Check, label: "SMS sent", color: "text-status-success" },
    DELIVERED: { icon: CheckCircle2, label: "SMS delivered", color: "text-status-success" },
    FAILED: { icon: XCircle, label: "SMS failed", color: "text-status-danger" },
  }

  const { icon: Icon, label, color } = config[status]

  return (
    <div className={cn("flex items-center gap-2", color, className)} {...props}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-[var(--text-body-sm)] font-medium">
        {label}
      </span>
      {time && (
        <>
          <span className="text-text-muted" aria-hidden="true">&middot;</span>
          <span className="text-[var(--text-caption)] text-text-secondary tabular-nums">
            {time}
          </span>
        </>
      )}
    </div>
  )
}
