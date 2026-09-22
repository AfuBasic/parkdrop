import { AlertCircle, AlertTriangle } from 'lucide-react';
import { SmsCreditsStrings } from '@/features/sms-credits/strings';

interface SmsCreditWarningProps {
  balance: number;
}

/**
 * The coloured block that says what the number means, by state.
 *
 * Amber is "you may need to do something"; red is "this needs a decision
 * now" (design plan 02 §5.2). Both carry an icon and words, never colour
 * alone. All colours come from tokens — no raw Tailwind palette.
 */
export function SmsCreditWarning({ balance }: SmsCreditWarningProps) {
  if (balance >= 5) return null;

  const isZero = balance === 0;

  if (isZero) {
    return (
      <div className="w-full rounded-[var(--pd-card-radius)] bg-[var(--pd-bad-bg)] border border-[var(--pd-bad)]/25 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle
            className="w-6 h-6 text-[var(--pd-bad)] shrink-0 mt-0.5"
            aria-hidden="true"
            strokeWidth={2.25}
          />
          <div className="flex-1 text-left">
            <h2 className="text-[18px] font-extrabold text-[var(--pd-bad)] leading-snug m-0">
              {SmsCreditsStrings.zeroTitle}
            </h2>
            <p className="text-[16px] font-semibold text-[var(--pd-bad)] mt-1.5 leading-snug m-0">
              {SmsCreditsStrings.zeroBody}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[var(--pd-card-radius)] bg-[var(--pd-warn-bg)] border border-[var(--pd-warn)]/25 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="w-6 h-6 text-[var(--pd-warn)] shrink-0 mt-0.5"
          aria-hidden="true"
          strokeWidth={2.25}
        />
        <div className="flex-1 text-left">
          <h2 className="text-[18px] font-extrabold text-[var(--pd-warn)] leading-snug m-0">
            {SmsCreditsStrings.lowTitle}
          </h2>
          <p className="text-[16px] font-semibold text-[var(--pd-warn)] mt-1.5 leading-snug m-0">
            {SmsCreditsStrings.lowBody}
          </p>
        </div>
      </div>
    </div>
  );
}
