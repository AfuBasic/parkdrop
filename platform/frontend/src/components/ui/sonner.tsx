import * as React from "react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      toastOptions={{
        unstyled: true,
        className: "w-full max-w-[calc(100vw-32px)] sm:max-w-[420px]",
        classNames: {
          toast:
            "group toast flex w-full items-start gap-3 p-4 rounded-xl border shadow-lg font-sans bg-surface-default text-text-primary border-border-default [&_[data-content]]:flex [&_[data-content]]:flex-col [&_[data-content]]:gap-1",
          error: 
            "!bg-status-danger-bg text-status-danger-text-strong !border-status-danger-border !border-l-[6px] !border-l-status-danger [&_[data-description]]:!text-status-danger-text [&_[data-icon]]:!text-status-danger",
          success:
            "!bg-status-success-bg text-status-success-text !border-status-success-border !border-l-[6px] !border-l-status-success [&_[data-description]]:!text-status-success-text [&_[data-icon]]:!text-status-success",
          warning:
            "!bg-status-warning-bg text-status-warning-text !border-status-warning-border !border-l-[6px] !border-l-status-warning [&_[data-description]]:!text-status-warning-text [&_[data-icon]]:!text-status-warning",
          info:
            "!bg-status-info-bg text-status-info-text !border-status-info-border !border-l-[6px] !border-l-status-info [&_[data-description]]:!text-status-info-text [&_[data-icon]]:!text-status-info",
          title: "font-semibold text-[15px]",
          description: "text-sm",
          actionButton:
            "bg-action-primary text-text-inverse font-medium rounded-md px-3 py-2 text-sm mt-2",
          cancelButton:
            "bg-surface-subtle text-text-primary font-medium rounded-md border border-border-default px-3 py-2 text-sm mt-2",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
