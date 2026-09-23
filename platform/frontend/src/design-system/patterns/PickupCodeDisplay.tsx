import * as React from "react"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface PickupCodeDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string
}

export function PickupCodeDisplay({ code, className, ...props }: PickupCodeDisplayProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("flex flex-col space-y-2", className)} {...props}>
      <span className="text-[var(--text-label)] font-semibold text-text-secondary uppercase tracking-wider">
        Pickup code
      </span>
      <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border-default bg-surface-subtle p-4">
        <span className="text-[var(--text-heading-xl)] font-bold tracking-[0.1em] text-text-primary tabular-nums">
          {code}
        </span>
        <button
          onClick={handleCopy}
          className="flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 font-medium text-action-primary transition-colors hover:bg-surface-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          aria-label="Copy pickup code"
        >
          {copied ? (
            <>
              <Check className="h-5 w-5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-5 w-5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
