import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SectionProps {
  icon?: React.ReactNode;
  label: string;
  chip?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Standardized Section card for ParkDrop detail and operational views.
 *
 * Provides consistent white card styling, rounded-[var(--pd-card-radius)],
 * border-[var(--pd-line-2)], 16px padding, subtle shadow, and a uniform
 * header with icon, 18px font-extrabold label, and optional status chip.
 */
export function Section({
  icon,
  label,
  chip,
  children,
  className,
}: SectionProps) {
  return (
    <section
      className={cn(
        'bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] p-4 shadow-xs flex flex-col gap-3',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-[var(--pd-muted)] flex items-center justify-center w-5 h-5 shrink-0">
              {icon}
            </span>
          )}
          <h2 className="text-[18px] font-extrabold text-[var(--pd-navy)] m-0 leading-tight">
            {label}
          </h2>
        </div>
        {chip && <div className="shrink-0">{chip}</div>}
      </div>

      <div>{children}</div>
    </section>
  );
}
