import * as React from 'react';
import { cn } from '@/lib/utils';
import { Database } from 'lucide-react';

export interface StaleDataNoticeProps extends React.HTMLAttributes<HTMLDivElement> {
  lastUpdatedText?: string;
  sourceDescription?: string;
}

/**
 * Compact inline notice indicating data shown is from local device storage,
 * and may not reflect remote changes until connected.
 */
export function StaleDataNotice({
  lastUpdatedText,
  sourceDescription = 'locally saved data',
  className,
  ...props
}: StaleDataNoticeProps) {
  return (
    <div
      role="note"
      className={cn(
        'w-full rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface-elevated/40 px-3 py-1.5 text-[11px] text-text-tertiary flex items-center justify-between gap-2',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-1.5 truncate">
        <Database className="h-3 w-3 shrink-0 opacity-70" />
        <span className="truncate">Showing {sourceDescription}</span>
      </div>
      {lastUpdatedText && (
        <span className="shrink-0 text-text-muted">Updated {lastUpdatedText}</span>
      )}
    </div>
  );
}
