import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Loader2, XCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { invitationsApi, type InvitationPreview } from '@/features/business/api/invitations-api';
import { InviteScreen } from './InviteScreen';

export interface InvitationGateProps {
  invitationId: string;
  token: string;
}

type Status = 'checking' | 'invalid' | 'match' | 'mismatch';

/**
 * Decides what an already-authenticated visitor to /invite/:id should see.
 *
 * Invitations are accepted automatically the moment the invited email
 * verifies a sign-in code (see AuthChallengeController) — so a signed-in
 * visitor here has either (a) just done exactly that, meaning they're
 * already the correct new member and just need sending into the app, or
 * (b) had an older, unrelated session open on this device, meaning they're
 * signed in as someone else entirely. Those need opposite responses, so
 * this fetches the invitation's target email and compares it against the
 * current session rather than assuming either case.
 */
export function InvitationGate({ invitationId, token }: InvitationGateProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = React.useState<Status>('checking');
  const [preview, setPreview] = React.useState<InvitationPreview | null>(null);
  const [signingOut, setSigningOut] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    invitationsApi
      .preview(invitationId, token)
      .then((result) => {
        if (cancelled) return;
        setPreview(result);
        const currentEmail = (user?.email || '').trim().toLowerCase();
        setStatus(currentEmail === result.email_normalized ? 'match' : 'mismatch');
      })
      .catch(() => {
        if (!cancelled) setStatus('invalid');
      });

    return () => {
      cancelled = true;
    };
  }, [invitationId, token, user?.email]);

  React.useEffect(() => {
    if (status === 'match') {
      navigate({ to: '/' });
    }
  }, [status, navigate]);

  if (status === 'checking' || status === 'match') {
    return (
      <AuthShell size="medium" showHero={false}>
        <div className="flex flex-col items-center text-center gap-3 pt-10">
          <Loader2 className="w-8 h-8 text-[var(--pd-blue)] animate-spin" strokeWidth={2.5} aria-hidden="true" />
          <p className="m-0 text-[15px] font-semibold text-[var(--pd-muted)]">
            Checking your invitation…
          </p>
        </div>
      </AuthShell>
    );
  }

  if (status === 'invalid') {
    return (
      <AuthShell size="medium" showHero={false}>
        <div className="flex flex-col items-center text-center gap-4 pt-6">
          <div className="w-16 h-16 rounded-full bg-[var(--pd-bad-bg)] flex items-center justify-center">
            <XCircle className="w-8 h-8 text-[var(--pd-bad)]" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-[22px] font-extrabold text-[var(--pd-navy)]">
              This invitation isn't valid anymore
            </h1>
            <p className="m-0 text-[15px] font-semibold leading-[1.45] text-[var(--pd-muted)] max-w-xs">
              It may have expired or already been used. Ask whoever invited you to send a new one.
            </p>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <InviteScreen
      businessName={preview?.business_name ?? undefined}
      busy={signingOut}
      onSignOutAndContinue={async () => {
        setSigningOut(true);
        await logout();
      }}
    />
  );
}
