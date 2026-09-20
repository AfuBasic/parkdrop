import type { SmsCreditBundle } from '../types';
import { formatMoney } from '@/lib/formatters';

interface SmsCreditBundleOptionProps {
  bundle: SmsCreditBundle;
  selected: boolean;
  disabled?: boolean;
  onSelect: (bundle: SmsCreditBundle) => void;
}

export function SmsCreditBundleOption({
  bundle,
  selected,
  disabled = false,
  onSelect,
}: SmsCreditBundleOptionProps) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled) onSelect(bundle);
      }}
      onKeyDown={(e) => {
        if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          onSelect(bundle);
        }
      }}
      className={`
        w-full p-4 rounded-[var(--radius-xl)] border transition-all cursor-pointer flex items-center justify-between
        min-h-[64px] select-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.99]'}
        ${
          selected
            ? 'bg-blue-50/70 border-action-primary shadow-sm ring-1 ring-action-primary'
            : 'bg-surface-default border-border-subtle hover:border-border-default hover:bg-surface-subtle/50'
        }
      `}
    >
      <div className="flex items-center gap-3.5">
        {/* Custom semantic radio indicator */}
        <div
          className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
            ${selected ? 'border-action-primary bg-action-primary' : 'border-slate-300 bg-white'}
          `}
        >
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>

        <div className="text-left">
          <div className="text-[15px] font-semibold text-text-primary leading-tight">
            {bundle.credits} SMS credits
          </div>
          {bundle.description && (
            <div className="text-xs text-text-muted mt-0.5">{bundle.description}</div>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className="text-[16px] font-bold text-text-primary">
          {formatMoney(bundle.amount_minor)}
        </span>
      </div>
    </div>
  );
}
