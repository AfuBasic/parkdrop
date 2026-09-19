import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-surface-disabled disabled:text-text-disabled disabled:border-border-disabled",
  {
    variants: {
      variant: {
        primary: "bg-action-primary text-text-inverse hover:bg-action-primary-hover active:bg-action-primary-active",
        secondary: "border border-border-default bg-surface-default hover:bg-surface-subtle text-text-primary",
        ghost: "hover:bg-surface-subtle text-text-primary",
        danger: "bg-status-danger text-text-inverse hover:opacity-90",
      },
      size: {
        default: "h-12 px-4 py-2 min-h-[48px]", // Mobile-first primary touch targets
        sm: "h-9 rounded-[var(--radius-sm)] px-3 text-sm",
        md: "h-10 px-4 py-2", // standard desktop size if needed
        lg: "h-14 px-8 min-h-[56px] text-lg",
        icon: "h-12 w-12 min-h-[48px] min-w-[48px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, leadingIcon, trailingIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!loading && leadingIcon && <span className="mr-2 inline-flex">{leadingIcon}</span>}
        {children}
        {!loading && trailingIcon && <span className="ml-2 inline-flex">{trailingIcon}</span>}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
