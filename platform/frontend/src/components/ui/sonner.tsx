import * as React from "react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      position="top-center"
      toastOptions={{
        className: "max-w-[calc(100vw-32px)] sm:max-w-md",
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface-default group-[.toaster]:text-text-primary group-[.toaster]:border-border-default group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl font-sans",
          error: 
            "group toast group-[.toaster]:bg-status-danger-bg group-[.toaster]:text-status-danger-text group-[.toaster]:border-status-danger-border group-[.toaster]:border-l-[6px] group-[.toaster]:border-l-status-danger group-[.toaster]:shadow-lg",
          success:
            "group toast group-[.toaster]:bg-status-success-bg group-[.toaster]:text-status-success-text group-[.toaster]:border-status-success-border group-[.toaster]:border-l-[6px] group-[.toaster]:border-l-status-success group-[.toaster]:shadow-lg",
          warning:
            "group toast group-[.toaster]:bg-status-warning-bg group-[.toaster]:text-status-warning-text group-[.toaster]:border-status-warning-border group-[.toaster]:border-l-[6px] group-[.toaster]:border-l-status-warning group-[.toaster]:shadow-lg",
          info:
            "group toast group-[.toaster]:bg-status-info-bg group-[.toaster]:text-status-info-text group-[.toaster]:border-status-info-border group-[.toaster]:border-l-[6px] group-[.toaster]:border-l-status-info group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-text-secondary text-sm",
          actionButton:
            "group-[.toast]:bg-action-primary group-[.toast]:text-text-inverse font-medium rounded-md",
          cancelButton:
            "group-[.toast]:bg-surface-subtle group-[.toast]:text-text-primary font-medium rounded-md border border-border-default",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
