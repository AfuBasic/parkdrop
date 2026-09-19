import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-surface-page transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-action-primary text-white hover:bg-action-primaryHover",
        destructive: "bg-status-danger text-white hover:bg-status-danger/90",
        outline: "border border-border-default bg-surface-default hover:bg-surface-subtle text-text-primary",
        secondary: "bg-surface-subtle text-text-primary hover:bg-surface-subtle/80",
        ghost: "hover:bg-surface-subtle hover:text-text-primary",
        link: "text-action-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-4 py-2 min-h-[48px]", // Mobile-first touch target sizes
        sm: "h-9 rounded-md px-3",
        lg: "h-14 rounded-md px-8 min-h-[56px]",
        icon: "h-12 w-12 min-h-[48px] min-w-[48px]", // 48x48 icon buttons
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
