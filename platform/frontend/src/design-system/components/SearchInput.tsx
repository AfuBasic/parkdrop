import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, ...props }, ref) => {
    return (
      <div className="relative flex w-full items-center">
        <Search className="absolute left-3 h-5 w-5 text-text-muted" aria-hidden="true" />
        <input
          type="text"
          className={cn(
            "flex h-12 w-full rounded-[var(--radius-md)] border border-border-default bg-surface-default pl-10 pr-10 py-2 text-base md:text-sm ring-offset-surface-page placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            className
          )}
          value={value}
          onChange={onChange}
          ref={ref}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
