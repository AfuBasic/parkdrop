import { MessageSquare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SmsCreditBalanceProps {
  balance: number;
  variant?: 'badge' | 'hero';
  className?: string;
  onClick?: () => void;
}

export function SmsCreditBalance({
  balance,
  variant = 'hero',
  className,
  onClick,
}: SmsCreditBalanceProps) {
  const isZero = balance === 0;
  const isLow = balance > 0 && balance < 5;

  if (variant === 'badge') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all cursor-pointer",
          isZero
            ? "bg-status-danger-bg border border-status-danger-border text-status-danger-text-strong hover:opacity-90"
            : isLow
            ? "bg-status-warning-bg border border-status-warning-border text-status-warning-text hover:opacity-90"
            : "bg-surface-subtle border border-border-subtle text-text-secondary hover:bg-surface-hover hover:text-text-primary",
          className
        )}
      >
        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
        <span>{balance} {balance === 1 ? 'SMS credit' : 'SMS credits'}</span>
      </button>
    );
  }

  // Hero Card variant for the SMS Credits screen
  return (
    <div
      className={cn(
        "w-full rounded-[var(--radius-xl)] p-6 transition-all border",
        isZero
          ? "bg-status-danger-bg border-status-danger-border"
          : isLow
          ? "bg-amber-50/70 border-amber-200"
          : "bg-surface-default border-border-subtle shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-action-primary" />
          Available SMS Credits
        </span>
        <span
          className={cn(
            "text-xs px-2.5 py-0.5 rounded-full font-medium",
            isZero
              ? "bg-red-100 text-red-700 font-semibold"
              : isLow
              ? "bg-amber-100 text-amber-800 font-medium"
              : "bg-emerald-50 text-emerald-700 font-medium border border-emerald-100"
          )}
        >
          {isZero ? 'Zero Balance' : isLow ? 'Running Low' : 'Active'}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={cn(
            "text-4xl sm:text-5xl font-extrabold tracking-tight",
            isZero
              ? "text-status-danger-text-strong"
              : isLow
              ? "text-amber-800"
              : "text-text-primary"
          )}
        >
          {balance}
        </span>
        <span className="text-sm sm:text-base font-medium text-text-secondary">
          {balance === 1 ? 'credit' : 'credits'}
        </span>
      </div>

      <p className="text-xs text-text-muted mt-2">
        1 credit covers 1 package arrival notification SMS to your customer.
      </p>
    </div>
  );
}
