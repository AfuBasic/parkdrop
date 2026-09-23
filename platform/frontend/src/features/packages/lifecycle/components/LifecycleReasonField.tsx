import { useId } from 'react';
import { cn } from '@/lib/utils';

interface ReasonOption<T extends string> {
  value: T;
  label: string;
}

interface LifecycleReasonFieldProps<T extends string> {
  legend: string;
  options: ReasonOption<T>[];
  selectedReason: T | null;
  onSelectReason: (reason: T) => void;
  note: string;
  onNoteChange: (note: string) => void;
  noteError?: string | null;
  disabled?: boolean;
}

export function LifecycleReasonField<T extends string>({
  legend,
  options,
  selectedReason,
  onSelectReason,
  note,
  onNoteChange,
  noteError,
  disabled = false,
}: LifecycleReasonFieldProps<T>) {
  const noteInputId = useId();
  const isOther = selectedReason === 'OTHER';

  return (
    <fieldset className="flex flex-col gap-3 border-none p-0 m-0" disabled={disabled}>
      <legend className="text-[15px] font-bold text-text-primary mb-1">
        {legend}
      </legend>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label={legend}>
        {options.map((option) => {
          const isSelected = selectedReason === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                'flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none text-[15px] font-medium min-h-[48px]',
                isSelected
                  ? 'bg-action-primary/5 border-action-primary text-text-primary shadow-xs'
                  : 'bg-surface-default border-border-default text-text-secondary hover:bg-surface-subtle active:bg-surface-subtle/80'
              )}
            >
              <input
                type="radio"
                name="lifecycle_reason"
                value={option.value}
                checked={isSelected}
                onChange={() => onSelectReason(option.value)}
                className="w-4 h-4 text-action-primary border-border-default focus:ring-action-primary"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>

      {isOther && (
        <div className="flex flex-col gap-1.5 mt-2 animate-in fade-in duration-200">
          <label htmlFor={noteInputId} className="text-[15px] font-semibold text-text-secondary">
            Provide details for "Other" reason <span className="text-status-danger-text">*</span>
          </label>
          <textarea
            id={noteInputId}
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Explain why this action is being taken..."
            aria-invalid={Boolean(noteError)}
            aria-describedby={noteError ? `${noteInputId}-error` : undefined}
            className={cn(
              'w-full p-3 text-[15px] rounded-xl bg-surface-default border transition-all focus:outline-none focus:ring-2 resize-none',
              noteError
                ? 'border-status-danger-border focus:ring-status-danger-border text-status-danger-text'
                : 'border-border-default focus:ring-action-primary text-text-primary'
            )}
          />
          <div className="flex items-center justify-between text-[15px] text-text-muted">
            {noteError ? (
              <span id={`${noteInputId}-error`} className="text-status-danger-text font-medium">
                {noteError}
              </span>
            ) : (
              <span />
            )}
            <span>{note.length}/300</span>
          </div>
        </div>
      )}
    </fieldset>
  );
}
