import * as React from 'react';
import { AuthShell } from '../components/AuthShell';
import { TextField } from '../components/TextField';
import { BigButton } from '../components/BigButton';
import { AuthStrings } from '../strings';

export interface NameScreenProps {
  initialName?: string;
  onContinue: (name: string) => void;
  onBack: () => void;
  onHelp: () => void;
  step?: number;
  totalSteps?: number;
}

/**
 * Screen 3. First name only.
 *
 * We ask for as little as will do the job: the name is used to greet them and
 * nothing else, so a full legal name would be data we collect without needing.
 */
export function NameScreen({
  initialName = '',
  onContinue,
  onBack,
  onHelp,
  step = 3,
  totalSteps = 5,
}: NameScreenProps) {
  const [name, setName] = React.useState(initialName);
  const [error, setError] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(AuthStrings.nameEmpty);
      inputRef.current?.focus();
      navigator.vibrate?.(30);
      return;
    }
    setError('');
    onContinue(trimmed);
  };

  return (
    <AuthShell
      size="compact"
      onBack={onBack}
      onHelp={onHelp}
      step={step}
      totalSteps={totalSteps}
      foot={<BigButton onClick={submit}>{AuthStrings.continue}</BigButton>}
    >
      <h1 className="m-0 mb-2 text-[var(--pd-size-title)] font-extrabold leading-[1.15] tracking-[-0.025em] text-[var(--pd-navy)] text-balance">
        {AuthStrings.nameTitle}
      </h1>
      <p className="m-0 mb-6 text-[var(--pd-size-body)] font-semibold text-[var(--pd-muted)] leading-[1.45]">
        {AuthStrings.nameSubtitle}
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <TextField
          ref={inputRef}
          label={AuthStrings.nameLabel}
          placeholder={AuthStrings.namePlaceholder}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError('');
          }}
          error={error}
          clearable
          onClear={() => setName('')}
          // Safe to autofocus: this screen has no trust rows to hide, and the
          // keyboard is what they need next.
          autoFocus
          autoComplete="given-name"
          autoCapitalize="words"
          enterKeyHint="next"
          maxLength={40}
        />
        {/* Lets the keyboard's own Enter key submit. */}
        <button type="submit" className="sr-only" tabIndex={-1}>
          {AuthStrings.continue}
        </button>
      </form>

      <div className="h-4" />
    </AuthShell>
  );
}
