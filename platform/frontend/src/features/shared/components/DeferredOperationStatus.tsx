import * as React from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

export interface DeferredOperationStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  operationName: string;
  conditionDescription?: string;
}

/**
 * Indicates an operation whose local persistence is complete, but whose
 * remote dispatch/completion is deferred until conditions are met (e.g. photo upload, SMS).
 */
export function DeferredOperationStatus({
  operationName,
  conditionDescription = 'when internet connection is restored',
  className,
  ...props
}: DeferredOperationStatusProps) {
  return (
    <div
      role="status"
      className={cn(
        'w-full rounded-[var(--radius-md)] border border-status-info-border bg-status-info-bg/50 px-3 py-2 text-xs text-status-info-text flex items-center gap-2.5',
        className
      )}
      {...props}
    >
      <Clock className="h-3.5 w-3.5 shrink-0 text-status-info-text opacity-80" />
      <span className="leading-snug">
        <strong className="font-medium">{operationName}</strong> will proceed {conditionDescription}.
      </span>
    </div>
  );
}
