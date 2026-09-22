import * as React from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { db } from '@/offline/db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAttentionItems } from '@/features/attention/hooks/useAttentionItems';
import { useOnline } from '@/features/auth/lib/useOnline';
import { Logo } from '@/features/auth/components/Logo';
import { SettingsGroup, SettingsRow } from '@/design-system/patterns/SettingsRow';

import { MoreStrings } from '@/features/more/strings';
import {
  MessageSquare,
  Users,
  Building2,
  AlertCircle,
  BarChart3,
  Smartphone,
  HelpCircle,
  Info,
} from 'lucide-react';

const ICON = 'w-7 h-7';
const STROKE = 2.25;

function roleSentence(role: string | null | undefined): string {
  switch (role) {
    case 'owner':
      return MoreStrings.roleOwner;
    case 'manager':
      return MoreStrings.roleManager;
    case 'attendant':
      return MoreStrings.roleAttendant;
    default:
      return MoreStrings.roleUnknown;
  }
}

export function MoreScreen() {
  const { user, business, role, logout, forgetRememberedIdentity } = useAuth();
  const isOnline = useOnline();
  const [confirming, setConfirming] = React.useState<null | 'signOut' | 'forget'>(null);

  const wallet = useLiveQuery(
    () =>
      business?.id
        ? db.smsWallets.where('business_id').equals(business.id).first()
        : undefined,
    [business?.id]
  );

  const { unresolvedCount } = useAttentionItems({
    businessId: business?.id ?? 0,
    userRole: role,
  });

  // Attendants never see these rows at all. A disabled row invites a tap that
  // teaches nothing; an absent row is simply not part of their job.
  const canSeeShop = role === 'owner' || role === 'manager';

  const balance = wallet?.balance;
  const creditTone =
    balance === undefined ? 'default' : balance === 0 ? 'danger' : balance < 5 ? 'warning' : 'default';

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto px-4 pt-4 pb-10 gap-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-[30px] font-extrabold text-[var(--pd-navy)] tracking-tight m-0 leading-none">
          {MoreStrings.title}
        </h1>
        <Logo tone="light" markOnly />
      </div>

      {/* Who you are */}
      <section className="bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] shadow-xs p-4 flex flex-col gap-1">
        <p className="text-[16px] font-semibold text-[var(--pd-muted)] m-0">
          {MoreStrings.signedInAs}
        </p>
        <p className="text-[22px] font-extrabold text-[var(--pd-navy)] m-0 leading-tight">
          {user?.first_name || user?.email}
        </p>
        {user?.first_name && user?.email && (
          <p className="text-[16px] font-semibold text-[var(--pd-muted)] m-0 break-all">
            {user.email}
          </p>
        )}
        <p className="text-[16px] font-semibold text-[var(--pd-muted)] m-0 mt-1">
          {roleSentence(role)}
        </p>
        {business?.name && (
          <p className="m-0 mt-2 flex flex-col">
            <span className="text-[16px] font-semibold text-[var(--pd-muted)]">
              {MoreStrings.shopLabel}
            </span>
            <span className="text-[18px] font-extrabold text-[var(--pd-navy)] leading-snug">
              {business.name}
            </span>
          </p>
        )}
      </section>

      <SettingsGroup label={MoreStrings.groupYourDay}>
        <SettingsRow
          to="/more/attention"
          icon={<AlertCircle className={ICON} strokeWidth={STROKE} />}
          label={MoreStrings.thingsToCheck}
          subtitle={MoreStrings.thingsToCheckSub}
          badge={unresolvedCount > 0 ? MoreStrings.thingsToCheckBadge(unresolvedCount) : undefined}
          badgeTone="danger"
          badgeLabel={
            unresolvedCount > 0 ? MoreStrings.thingsToCheckBadgeLabel(unresolvedCount) : undefined
          }
        />
        {canSeeShop && (
          <SettingsRow
            to="/more/reports"
            icon={<BarChart3 className={ICON} strokeWidth={STROKE} />}
            label={MoreStrings.yourDay}
            subtitle={MoreStrings.yourDaySub}
          />
        )}
      </SettingsGroup>

      <SettingsGroup label={MoreStrings.groupMessages}>
        <SettingsRow
          to="/more/sms-credits"
          icon={<MessageSquare className={ICON} strokeWidth={STROKE} />}
          label={MoreStrings.smsCredits}
          subtitle={MoreStrings.smsCreditsSub}
          badge={balance !== undefined ? MoreStrings.smsCreditsBadge(balance) : undefined}
          badgeTone={creditTone}
          badgeLabel={balance !== undefined ? MoreStrings.smsCreditsBadgeLabel(balance) : undefined}
        />
      </SettingsGroup>

      {canSeeShop && (
        <SettingsGroup label={MoreStrings.groupYourShop}>
          <SettingsRow
            to="/more/staff"
            icon={<Users className={ICON} strokeWidth={STROKE} />}
            label={MoreStrings.yourTeam}
            subtitle={MoreStrings.yourTeamSub}
            needsInternet={!isOnline}
            needsInternetLabel={MoreStrings.needsInternet}
          />
          <SettingsRow
            to="/more/business"
            icon={<Building2 className={ICON} strokeWidth={STROKE} />}
            label={MoreStrings.shopDetails}
            subtitle={MoreStrings.shopDetailsSub}
            needsInternet={!isOnline}
            needsInternetLabel={MoreStrings.needsInternet}
          />
        </SettingsGroup>
      )}

      <SettingsGroup label={MoreStrings.groupThisPhone}>
        <SettingsRow
          to="/more/account"
          icon={<Smartphone className={ICON} strokeWidth={STROKE} />}
          label={MoreStrings.thisPhone}
          subtitle={MoreStrings.thisPhoneSub}
        />
      </SettingsGroup>

      <SettingsGroup label={MoreStrings.groupHelp}>
        <SettingsRow
          to="/more/help"
          icon={<HelpCircle className={ICON} strokeWidth={STROKE} />}
          label={MoreStrings.howToUse}
          subtitle={MoreStrings.howToUseSub}
        />
        <SettingsRow
          to="/more/about"
          icon={<Info className={ICON} strokeWidth={STROKE} />}
          label={MoreStrings.about}
          subtitle={MoreStrings.aboutSub}
        />
      </SettingsGroup>

      {/* Leaving. Separated by a gap from everything above, and from each
          other, so the safe action and the destructive one are never two
          similar buttons sitting together. */}
      <div className="flex flex-col gap-6 mt-2">
        <button
          type="button"
          onClick={() => setConfirming('signOut')}
          className="w-full min-h-[56px] rounded-[var(--pd-field-radius)] border border-[var(--pd-line)] bg-white text-[18px] font-extrabold text-[var(--pd-navy)] hover:bg-[var(--pd-page-2)] active:scale-[0.99] transition-all cursor-pointer"
        >
          {MoreStrings.signOut}
        </button>
        <button
          type="button"
          onClick={() => setConfirming('forget')}
          className="w-full min-h-[56px] px-4 rounded-[var(--pd-field-radius)] border border-[var(--pd-bad)]/30 bg-[var(--pd-bad-bg)] text-[18px] font-extrabold text-[var(--pd-bad)] hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
        >
          {MoreStrings.forgetMe}
        </button>
      </div>

      {/* Sign Out / Forget Confirmation Overlay */}
      {confirming !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setConfirming(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-[360px] bg-white rounded-[var(--pd-card-radius)] p-5 shadow-2xl border border-[var(--pd-line)] animate-in zoom-in-95 duration-150"
          >
            <h2 className="text-[22px] font-extrabold text-[var(--pd-navy)] m-0 leading-tight">
              {confirming === 'forget' ? MoreStrings.forgetTitle : MoreStrings.signOutTitle}
            </h2>
            <p className="text-[18px] font-semibold text-[var(--pd-muted)] m-0 mt-3 leading-snug">
              {confirming === 'forget' ? MoreStrings.forgetBody : MoreStrings.signOutBody}
            </p>
            <div className="flex flex-col gap-3 mt-5">
              {/* The safe choice is the primary button. */}
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="w-full min-h-[56px] px-4 rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] text-[18px] font-extrabold text-white hover:bg-[var(--pd-blue-hover)] active:scale-[0.99] transition-all cursor-pointer"
              >
                {MoreStrings.stay}
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = confirming;
                  setConfirming(null);
                  if (action === 'forget') void forgetRememberedIdentity();
                  else void logout();
                }}
                className="w-full min-h-[56px] px-4 rounded-[var(--pd-field-radius)] border border-[var(--pd-bad)]/30 bg-[var(--pd-bad-bg)] text-[18px] font-extrabold text-[var(--pd-bad)] hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
              >
                {confirming === 'forget' ? MoreStrings.forgetMe : MoreStrings.signOut}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
