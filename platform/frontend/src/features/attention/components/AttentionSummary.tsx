import { AlertCircle, ChevronRight } from 'lucide-react';
import type { AttentionItem } from '@/features/attention/attention-types';

interface AttentionSummaryProps {
  items: AttentionItem[];
  onViewAll: () => void;
}

export function AttentionSummary({ items, onViewAll }: AttentionSummaryProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const count = items.length;
  const previewItems = items.slice(0, 2);

  return (
    <section 
      aria-label="Attention needed"
      className="mb-4 bg-status-warning-bg border border-status-warning-border rounded-[var(--radius-xl)] p-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-status-warning-text" aria-hidden="true" />
          <h2 className="text-sm font-bold text-status-warning-text tracking-tight">
            Needs attention ({count})
          </h2>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-action-primary hover:text-action-primary-hover flex items-center gap-0.5 cursor-pointer min-h-[44px] px-1"
        >
          <span>View all</span>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      <ul className="space-y-1.5 list-none p-0 m-0">
        {previewItems.map((item) => (
          <li
            key={item.id}
            className="text-xs text-text-primary flex items-baseline gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-status-warning-text shrink-0 self-center" />
            <span className="font-medium truncate">{item.title}</span>
            {item.metadata?.publicPackageId && (
              <span className="text-action-primary font-mono text-[11px] shrink-0">
                · {item.metadata.publicPackageId}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
