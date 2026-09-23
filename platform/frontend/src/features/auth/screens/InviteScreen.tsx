import { Users } from 'lucide-react';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { BigButton } from '@/features/auth/components/BigButton';

export interface InviteScreenProps {
  onSignOutAndContinue: () => void;
  businessName?: string;
  busy?: boolean;
}

/**
 * Landed on from a staff invitation email while already signed in as
 * someone else on this device.
 *
 * Invitations are accepted automatically the moment the invited email
 * verifies a sign-in code (see AuthChallengeController) — there is no
 * separate "accept" action to take here. The only thing standing between
 * this visitor and their new business is the wrong account already being
 * signed in on this device, so this screen's one job is getting them signed
 * out cleanly and back to the sign-in screen to enter the invited address.
 */
export function InviteScreen({ onSignOutAndContinue, businessName, busy = false }: InviteScreenProps) {
  return (
    <AuthShell
      size="medium"
      showHero={false}
      foot={
        <BigButton onClick={onSignOutAndContinue} busy={busy} busyLabel="Signing out…">
          Sign out and continue
        </BigButton>
      }
    >
      <div className="flex flex-col items-center text-center gap-4 pt-6">
        <div className="w-16 h-16 rounded-full bg-[var(--pd-tint)] flex items-center justify-center">
          <Users className="w-8 h-8 text-[var(--pd-blue)]" strokeWidth={2.5} aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[22px] font-extrabold text-[var(--pd-navy)]">
            You're signed in with a different account
          </h1>
          <p className="m-0 text-[15px] font-semibold leading-[1.45] text-[var(--pd-muted)] max-w-xs">
            {businessName
              ? `To join ${businessName}, sign out here first, then sign in again using the email address this invitation was sent to.`
              : 'To join this business, sign out here first, then sign in again using the email address this invitation was sent to.'}
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
