import { AuthStrings } from '../strings';
import { Button } from '@/design-system';
import { User, ArrowRight } from 'lucide-react';
import type { RememberedIdentity } from '@/lib/db';

interface RememberedReauthScreenProps {
  identity: RememberedIdentity;
  onContinue: (email: string) => void;
  onSwitchAccount: () => void;
  isLoading?: boolean;
}

export function RememberedReauthScreen({
  identity,
  onContinue,
  onSwitchAccount,
  isLoading,
}: RememberedReauthScreenProps) {
  return (
    <div className="flex flex-col h-full w-full animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="mb-5 text-left">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1 text-text-primary">
          {AuthStrings.reauthTitle(identity.name)}
        </h1>
        <p className="text-sm font-medium text-text-secondary m-0 leading-relaxed">
          Your session expired. Confirm your identity to continue.
        </p>
      </div>

      <div className="flex flex-col flex-1 gap-6">
        {/* Identity preview card */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-pd-blue-50/60 border border-pd-blue-100">
          <div className="w-12 h-12 rounded-xl bg-pd-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            {identity.name ? identity.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            {identity.name && (
              <span className="font-semibold text-text-primary text-base truncate">
                {identity.name}
              </span>
            )}
            <span className="text-text-secondary text-sm truncate">
              {identity.email}
            </span>
            {identity.business_name && (
              <span className="text-xs text-text-muted truncate mt-0.5">
                {identity.business_name}
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto pt-6 flex flex-col gap-3 items-center">
          <Button
            type="button"
            className="w-full h-12 text-base font-semibold flex items-center justify-center gap-2"
            size="lg"
            disabled={isLoading}
            loading={isLoading}
            onClick={() => onContinue(identity.email)}
          >
            <span>{AuthStrings.continue}</span>
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full h-10 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            disabled={isLoading}
            onClick={onSwitchAccount}
          >
            {AuthStrings.useDifferentEmail}
          </Button>

          <a
            href="mailto:support@parkdrop.com.ng?subject=ParkDrop%20Reauth%20Help"
            className="text-xs sm:text-sm text-text-muted hover:text-action-primary transition-colors py-1 mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary rounded"
          >
            {AuthStrings.problemLoggingIn}
          </a>
        </div>
      </div>
    </div>
  );
}
