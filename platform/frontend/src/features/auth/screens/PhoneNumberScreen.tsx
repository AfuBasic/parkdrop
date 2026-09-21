import * as React from 'react';
import { AuthShell } from '../components/AuthShell';
import { IdentifierField } from '../components/IdentifierField';
import { BigButton } from '../components/BigButton';
import { Notice } from '../components/Notice';
import { SmsPreview } from '../components/SmsPreview';
import { AuthStrings } from '../strings';
import { renderCustomerSms, countSeptets, SMS_MAX_CHARS } from '@/lib/smsTemplate';
import { validateNigerianMobile, toCanonicalPhone, formatPhoneDisplay } from '../lib/phone';

export interface PhoneNumberScreenProps {
  onContinue: (canonicalPhone: string) => void;
  onBack: () => void;
  onHelp: () => void;
  initialPhone?: string;
  pickupPointName: string;
  parkName: string;
  busy?: boolean;
  requestError?: string;
  slowNetwork?: boolean;
  timedOut?: boolean;
  step?: number;
  totalSteps?: number;
}

/**
 * Screen 6 of 6. Business contact phone number.
 *
 * This phone number goes into the customer arrival SMS so customers know
 * who to call when collecting their parcels.
 *
 * Safety net:
 * We show a live SMS preview highlighting the phone number in the bubble
 * along with a "Check it twice" notice.
 */
export function PhoneNumberScreen({
  onContinue,
  onBack,
  onHelp,
  initialPhone = '',
  pickupPointName,
  parkName,
  busy,
  requestError,
  slowNetwork,
  timedOut,
  step = 6,
  totalSteps = 6,
}: PhoneNumberScreenProps) {
  const [phone, setPhone] = React.useState(initialPhone);
  const [error, setError] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Live rendered SMS preview
  const preview = React.useMemo(() => {
    return renderCustomerSms({
      pickupPointName,
      parkName,
      phone: phone || '08031234567',
      code: '4821',
    });
  }, [pickupPointName, parkName, phone]);

  const submit = () => {
    if (busy) return;

    const validation = validateNigerianMobile(phone);
    if (!validation.valid) {
      setError(validation.error || AuthStrings.phoneInvalid);
      navigator.vibrate?.(30);
      inputRef.current?.focus();
      return;
    }

    const canonical = toCanonicalPhone(phone);
    if (!canonical) {
      setError(AuthStrings.phoneInvalid);
      return;
    }

    // Double check that full message does not exceed 130 characters
    if (countSeptets(preview.text) > SMS_MAX_CHARS) {
      setError(AuthStrings.pickupTooLong);
      return;
    }

    setError('');
    onContinue(canonical);
  };

  const highlightNumber = formatPhoneDisplay(phone) || '0803 123 4567';

  return (
    <AuthShell
      size="compact"
      onBack={onBack}
      onHelp={onHelp}
      step={step}
      totalSteps={totalSteps}
      foot={
        <BigButton onClick={submit} busy={busy} busyLabel={AuthStrings.saving}>
          {AuthStrings.phoneSave}
        </BigButton>
      }
    >
      <h1 className="m-0 mb-2 text-[var(--pd-size-title)] font-extrabold leading-[1.15] tracking-[-0.025em] text-[var(--pd-navy)]">
        {AuthStrings.phoneTitle}
      </h1>
      <p className="m-0 mb-6 text-[var(--pd-size-body)] font-semibold text-[var(--pd-muted)] leading-[1.45]">
        {AuthStrings.phoneSubtitle}
      </p>

      <div className="flex flex-col gap-4">
        <IdentifierField
          mode="phone"
          value={phone}
          onChange={(val) => {
            setPhone(val);
            if (error) setError('');
          }}
          error={error}
          onSubmitRequested={submit}
          inputRef={inputRef}
        />

        <p className="m-0 text-[var(--pd-size-helper)] font-semibold text-[var(--pd-muted)] leading-[1.4]">
          {AuthStrings.phoneCheckTwice}
        </p>

        <SmsPreview
          className="mt-2"
          message={preview.text}
          highlight={[highlightNumber.replace(/\s+/g, ''), highlightNumber]}
          overBudget={!preview.valid || preview.length > SMS_MAX_CHARS}
        />
      </div>

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
