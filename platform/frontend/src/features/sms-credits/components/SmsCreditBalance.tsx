import { SmsCreditsStrings } from '@/features/sms-credits/strings';
import { cn } from '@/lib/utils';

interface SmsCreditBalanceProps {
  balance: number;
  className?: string;
}

/**
 * The number, enormous, with the two lines that make it mean something.
 *
 * Design plan 02 §3.3.29: 64px for the figure, 18px for "SMS left", then
 * `Each package you add uses 1 SMS.` — a balance of 47 is meaningless until
 * the reader knows it is 47 packages.
 *
 * The state itself is carried by the block below this one, never by the
 * colour of the figure alone (P3).
 */
export function SmsCreditBalance({ balance, className }: SmsCreditBalanceProps) {
  const isZero = balance === 0;
  const isLow = balance > 0 && balance < 5;

  return (
    <div className={cn('flex flex-col items-center text-center py-2', className)}>
      <span
        className={cn(
          'text-[64px] leading-none font-extrabold pd-nums',
          isZero
            ? 'text-[var(--pd-bad)]'
            : isLow
              ? 'text-[var(--pd-warn)]'
              : 'text-[var(--pd-navy)]'
        )}
      >
        {balance}
      </span>
      <span className="text-[18px] font-extrabold text-[var(--pd-navy)] mt-2">
        {SmsCreditsStrings.smsLeft}
      </span>
      <p className="text-[16px] font-semibold text-[var(--pd-muted)] mt-2 m-0">
        {SmsCreditsStrings.costLine}
      </p>
    </div>
  );
}
