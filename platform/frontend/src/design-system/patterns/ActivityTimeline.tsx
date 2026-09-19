import * as React from "react"
import { cn } from "@/lib/utils"

export interface TimelineEvent {
  id: string
  time: string
  title: string
  description?: string
}

interface ActivityTimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  events: TimelineEvent[]
}

export function ActivityTimeline({ events, className, ...props }: ActivityTimelineProps) {
  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {events.map((event, index) => (
        <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
          {index !== events.length - 1 && (
            <div className="absolute left-1.5 top-5 bottom-0 w-px bg-border-default" aria-hidden="true" />
          )}
          <div className="relative mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-action-primary bg-surface-default z-10" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-[var(--text-caption)] font-medium text-text-secondary tabular-nums">
              {event.time}
            </span>
            <span className="mt-0.5 text-[var(--text-body-sm)] text-text-primary">
              {event.title}
            </span>
            {event.description && (
              <span className="mt-1 text-[var(--text-body-sm)] text-text-muted">
                {event.description}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
