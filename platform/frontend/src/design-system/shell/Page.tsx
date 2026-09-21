import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PageProps {
  title?: string;
  back?: () => void;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Standardized Page wrapper component for ParkDrop screens.
 *
 * Provides a consistent top bar when title or back arrow is supplied,
 * or acts as the standard padded content container:
 * px-4 pt-2 pb-6 flex flex-col gap-4 max-w-lg mx-auto w-full.
 */
export function Page({
  title,
  back,
  headerRight,
  children,
  className,
}: PageProps) {
  const hasHeader = Boolean(title || back || headerRight);

  return (
    <div className={cn('w-full max-w-lg mx-auto flex flex-col', className)}>
      {hasHeader && (
        <header className="sticky top-0 z-20 bg-surface-page/95 backdrop-blur-sm border-b border-border-subtle px-4 py-3 flex items-center justify-between min-h-[52px]">
          <div className="flex items-center gap-2">
            {back && (
              <button
                type="button"
                onClick={back}
                aria-label="Back"
                className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {title && (
              <h1 className="text-xl font-bold text-text-primary tracking-tight m-0">
                {title}
              </h1>
            )}
          </div>
          {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
        </header>
      )}
      <div className="px-4 pt-2 pb-6 flex flex-col gap-4 flex-1">
        {children}
      </div>
    </div>
  );
}
