import * as React from 'react';
import { AuthShell } from '../components/AuthShell';
import { PinPad } from '../components/PinPad';
import { Notice } from '../components/Notice';
import { AuthStrings } from '../strings';
import { checkPin } from '../lib/pinRules';

export interface PinSetupScreenProps {
  onContinue: (pin: string) => void;
  onBack: () => void;
  onHelp: () => void;
  /** Used to refuse the last four digits of their own number. */
  phone?: string | null;
  step?: number;
  totalSteps?: number;
  /** Swaps the step counter for "Reset your PIN". */
  stepLabelOverride?: string;
  titleOverride?: string;
  subtitleOverride?: string;
}

type Stage = 'choose' | 'confirm';

/**
 * Screen 4. Choose a PIN, then type it again.
 *
 * There is no Continue button on either stage: four digits have exactly one
 * finishing moment, so the screen advances itself.
 */
export function PinSetupScreen({
  onContinue,
  onBack,
  onHelp,
  phone,
  step = 4,
  totalSteps = 5,
  stepLabelOverride,
  titleOverride,
  subtitleOverride,
}: PinSetupScreenProps) {
  const [stage, setStage] = React.useState<Stage>('choose');
  const [pin, setPin] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState('');

  const fail = (message: string) => {
    setError(message);
    navigator.vibrate?.(60);
  };

  const handleChosen = (value: string) => {
    if (checkPin(value, { phone })) {
      fail(AuthStrings.pinTooEasy);
      // Clear after the shake so they see which dots filled.
      window.setTimeout(() => setPin(''), 320);
      return;
    }

    setError('');
    window.setTimeout(() => setStage('confirm'), 220);
  };

  const handleConfirmed = (value: string) => {
    if (value !== pin) {
      fail(AuthStrings.pinMismatch);
      window.setTimeout(() => setConfirm(''), 320);
      return;
    }
    setError('');
    onContinue(pin);
  };

  const isChoosing = stage === 'choose';

  const back = () => {
    if (isChoosing) {
      onBack();
      return;
    }
    // Back from "type it again" returns to choosing, not out of the flow.
    setStage('choose');
    setPin('');
    setConfirm('');
    setError('');
  };

  const title = isChoosing ? (titleOverride ?? AuthStrings.pinTitle) : AuthStrings.pinConfirmTitle;
  const subtitle = isChoosing
    ? (subtitleOverride ?? AuthStrings.pinSubtitle)
    : AuthStrings.pinConfirmSubtitle;

  return (
    <AuthShell
      size="compact"
      onBack={back}
      onHelp={onHelp}
      step={step}
      totalSteps={totalSteps}
      stepLabelOverride={stepLabelOverride}
    >
      <h1 className="m-0 mb-2 text-[var(--pd-size-title)] font-extrabold leading-[1.15] tracking-[-0.025em] text-[var(--pd-navy)] text-balance">
        {title}
      </h1>
      <p className="m-0 text-[var(--pd-size-body)] font-semibold text-[var(--pd-muted)] leading-[1.45]">
        {subtitle}
      </p>

      {/* People reach for the PIN they already know. Saying this up front is
          cheaper than dealing with a reused ATM PIN later. */}
      {isChoosing && (
        <Notice tone="warning" className="mt-4">
          {AuthStrings.pinAtmWarning}
        </Notice>
      )}

      {error && (
        <Notice tone="error" className="mt-4">
          {error}
        </Notice>
      )}

      <div className="mt-7 pb-6">
        <PinPad
          key={stage}
          value={isChoosing ? pin : confirm}
          onChange={(value) => {
            if (isChoosing) setPin(value);
            else setConfirm(value);
            if (error) setError('');
          }}
          onComplete={isChoosing ? handleChosen : handleConfirmed}
          error={!!error}
          label={title}
        />
      </div>
    </AuthShell>
  );
}
