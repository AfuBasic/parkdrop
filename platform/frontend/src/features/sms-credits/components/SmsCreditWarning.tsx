import { AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SmsCreditWarningProps {
  balance: number;
}

export function SmsCreditWarning({ balance }: SmsCreditWarningProps) {
  if (balance >= 5) {
    return null;
  }

  const isZero = balance === 0;

  if (isZero) {
    return (
      <div className="w-full rounded-[var(--radius-xl)] bg-red-50/90 border border-red-200 p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-left">
            <h4 className="text-sm font-bold text-red-900 leading-snug">
              Out of SMS Credits
            </h4>
            <p className="text-xs text-red-800 mt-1 leading-relaxed">
              Customer arrival SMS notifications will be paused until more credits are added.
            </p>
            <div className="mt-2.5 pt-2.5 border-t border-red-200/60 flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>ParkDrop remains 100% free. You can still add and track packages normally.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Low balance (< 5)
  return (
    <div className="w-full rounded-[var(--radius-xl)] bg-amber-50/90 border border-amber-200 p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-left">
          <h4 className="text-sm font-bold text-amber-900 leading-snug">
            Low SMS Balance ({balance} {balance === 1 ? 'credit' : 'credits'} remaining)
          </h4>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            You will run out of automated customer SMS notifications soon. Top-up will be available shortly.
          </p>
        </div>
      </div>
    </div>
  );
}
