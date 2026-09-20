import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
const SheetPortal = DialogPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-xs data-[state=open]:animate-sheet-fade-in data-[state=closed]:animate-sheet-fade-out",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-surface-default p-6 shadow-elevation-2 will-change-transform",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b border-border-default data-[state=open]:animate-sheet-slide-in-top data-[state=closed]:animate-sheet-slide-out-top",
        bottom:
          "inset-x-0 bottom-0 border-t border-border-default rounded-t-3xl max-h-[92vh] overflow-y-auto data-[state=open]:animate-sheet-slide-in-bottom data-[state=closed]:animate-sheet-slide-out-bottom pb-safe",
        left: "inset-y-0 left-0 h-full w-3/4 border-r border-border-default sm:max-w-sm data-[state=open]:animate-sheet-slide-in-left data-[state=closed]:animate-sheet-slide-out-left",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l border-border-default sm:max-w-sm data-[state=open]:animate-sheet-slide-in-right data-[state=closed]:animate-sheet-slide-out-right",
      },
    },
    defaultVariants: {
      side: "bottom",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  showHandle?: boolean;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = "bottom", className, children, showHandle = true, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {side === "bottom" && showHandle && (
        <div className="mx-auto -mt-2 mb-4 h-1.5 w-12 rounded-full bg-border-strong" aria-hidden="true" />
      )}
      {children}
      <DialogPrimitive.Close className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-border-focus">
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = DialogPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-bold text-text-primary tracking-tight", className)}
    {...props}
  />
))
SheetTitle.displayName = DialogPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-text-secondary leading-relaxed", className)}
    {...props}
  />
))
SheetDescription.displayName = DialogPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
