import * as React from 'react';
import { AuthShell } from '../components/AuthShell';
import { TextField } from '../components/TextField';
import { BigButton } from '../components/BigButton';
import { Notice } from '../components/Notice';
import { SmsPreview } from '../components/SmsPreview';
import { AuthStrings } from '../strings';
import { checkSmsFit, normaliseForSms, isPlaceholderName, isExamplePair } from '@/lib/smsTemplate';

export interface PickupPointScreenProps {
  onContinue: (pickupPointName: string, parkName: string) => void;
  onBack: () => void;
  onHelp: () => void;
  initialPickupName?: string;
  initialParkName?: string;
  busy?: boolean;
  requestError?: string;
  slowNetwork?: boolean;
  timedOut?: boolean;
  step?: number;
  totalSteps?: number;
}

/**
 * Screen 5. The two names the owner's customers will read in an SMS.
 *
 * The preview is the whole point of the screen. Asking someone to name their
 * business in the abstract gets vague answers; showing them the exact text
 * message their customer will receive gets the name their customer actually
 * knows them by.
 *
 * The length limit is not arbitrary: each SMS segment is separately billed,
 * and these names are in every single arrival message this business ever
 * sends. Two long names quietly double their running cost forever.
 */
export function PickupPointScreen({
  onContinue,
  onBack,
  onHelp,
  initialPickupName = '',
  initialParkName = '',
  busy,
  requestError,
  slowNetwork,
  timedOut,
  step = 5,
  totalSteps = 6,
}: PickupPointScreenProps) {
  const [pickupName, setPickupName] = React.useState(initialPickupName);
  const [parkName, setParkName] = React.useState(initialParkName);
  const [errors, setErrors] = React.useState<{ pickup?: string; park?: string; form?: string }>({});
  const pickupRef = React.useRef<HTMLInputElement>(null);
  const parkRef = React.useRef<HTMLInputElement>(null);

  const fit = React.useMemo(
    () => checkSmsFit({ pickupPointName: pickupName, parkName }),
    [pickupName, parkName]
  );

  const submit = () => {
    if (busy) return;

    const pickup = normaliseForSms(pickupName).trim().replace(/\s+/g, ' ');
    const park = normaliseForSms(parkName).trim().replace(/\s+/g, ' ');
    const next: typeof errors = {};

    if (!pickup) next.pickup = AuthStrings.pickupNameEmpty;
    else if (isPlaceholderName(pickup)) next.pickup = AuthStrings.pickupPlaceholderName;

    if (!park) next.park = AuthStrings.parkNameEmpty;
    else if (isPlaceholderName(park)) next.park = AuthStrings.pickupPlaceholderName;

    if (!next.pickup && !next.park) {
      // Both fields left as the on-screen examples: they have not filled
      // this in, they have just tapped past it.
      if (isExamplePair(pickup, park)) next.form = AuthStrings.pickupPlaceholderName;
      else if (fit.unsupportedCharacters.length > 0) next.form = AuthStrings.pickupOddCharacters;
      else if (!fit.fitsOneSms) next.form = AuthStrings.pickupTooLong;
    }

    if (next.pickup || next.park || next.form) {
      setErrors(next);
      navigator.vibrate?.(30);
      (next.pickup ? pickupRef : next.park ? parkRef : pickupRef).current?.focus();
      return;
    }

    setErrors({});
    onContinue(pickup, park);
  };

  const showPreview = pickupName.trim().length > 0;
  const counter = `${fit.used} / ${fit.budget}`;

  return (
    <AuthShell
      size="compact"
      onBack={onBack}
      onHelp={onHelp}
      step={step}
      totalSteps={totalSteps}
      foot={
        <BigButton onClick={submit} busy={busy} busyLabel={AuthStrings.saving}>
          {AuthStrings.pickupSave}
        </BigButton>
      }
    >
      <h1 className="m-0 mb-2 text-[var(--pd-size-title)] font-extrabold leading-[1.15] tracking-[-0.025em] text-[var(--pd-navy)]">
        {AuthStrings.pickupTitle}
      </h1>
      <p className="m-0 mb-6 text-[var(--pd-size-body)] font-semibold text-[var(--pd-muted)] leading-[1.45]">
        {AuthStrings.pickupSubtitle}
      </p>

      <div className="flex flex-col gap-5">
        <TextField
          ref={pickupRef}
          label={AuthStrings.pickupNameLabel}
          placeholder={AuthStrings.pickupNamePlaceholder}
          value={pickupName}
          onChange={(event) => {
            setPickupName(event.target.value);
            setErrors((current) => ({ ...current, pickup: undefined, form: undefined }));
          }}
          error={errors.pickup}
          clearable
          onClear={() => setPickupName('')}
          autoFocus
          autoCapitalize="words"
          enterKeyHint="next"
          counter={counter}
          counterOver={!fit.fitsOneSms}
          maxLength={60}
        />

        <TextField
          ref={parkRef}
          label={AuthStrings.parkNameLabel}
          placeholder={AuthStrings.parkNamePlaceholder}
          value={parkName}
          onChange={(event) => {
            setParkName(event.target.value);
            setErrors((current) => ({ ...current, park: undefined, form: undefined }));
          }}
          error={errors.park}
          clearable
          onClear={() => setParkName('')}
          autoCapitalize="words"
          enterKeyHint="done"
          maxLength={60}
        />
      </div>

      {showPreview && (
        <SmsPreview
          className="mt-6"
          message={fit.message}
          highlight={[normaliseForSms(pickupName).trim(), normaliseForSms(parkName).trim()]}
          overBudget={!fit.fitsOneSms}
        />
      )}

      {errors.form && (
        <Notice tone="warning" className="mt-4">
          {errors.form}
        </Notice>
      )}

      {requestError && !timedOut && (
        <Notice tone="error" className="mt-4">
          {requestError}
        </Notice>
      )}

      {slowNetwork && !timedOut && (
        <Notice tone="info" className="mt-4">
          {AuthStrings.slowNetwork}
        </Notice>
      )}

      {timedOut && (
        <Notice tone="error" className="mt-4">
          {AuthStrings.tookTooLong}
        </Notice>
      )}

      <div className="h-4" />
    </AuthShell>
  );
}
