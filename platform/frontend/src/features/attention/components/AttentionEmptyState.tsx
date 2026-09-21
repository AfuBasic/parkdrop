import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';

export function AttentionEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-status-success-bg border border-status-success-border flex items-center justify-center text-status-success-text mb-4">
        <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-text-primary">
        You're all caught up
      </h3>
      <p className="text-sm text-text-secondary mt-1 max-w-xs">
        No items need attention right now. Successful operations remain quiet.
      </p>
    </div>
  );
}
