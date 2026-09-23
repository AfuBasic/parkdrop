import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CapabilityUnavailableProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

/**
 * Compact, inline degraded-state component for feature-level unavailability.
 * Calm text, Field Blue / semantic token styling, no alarming icons.
 */
export function CapabilityUnavailable({
  message,
  action,
  className,
  ...props
}: CapabilityUnavailableProps) {
  return (
    <div
      role="status"
      className={cn(
        'w-full rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface-elevated/70 px-3.5 py-2.5 text-xs text-text-secondary flex items-center justify-between gap-3',
        className
      )}
      {...props}
    >
      <p className="leading-relaxed flex-1">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onPress}
          className="shrink-0 font-medium text-brand-primary hover:underline focus:outline-none focus:ring-1 focus:ring-brand-primary rounded px-1.5 py-0.5"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
