import * as React from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { db } from '@/offline/db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAttentionItems } from '@/features/attention/hooks/useAttentionItems';
import { useOnline } from '@/features/auth/lib/useOnline';
import { Page } from '@/design-system/shell/Page';
import { SettingsGroup, SettingsRow } from '@/design-system/patterns/SettingsRow';
import { ForgetDeviceDialog } from './components/ForgetDeviceDialog';

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
    <Page title={MoreStrings.title} showLogo className="pb-10">
      <div className="flex flex-col gap-6">
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
            needsInternet={!isOnline}
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
      <div className="flex flex-col gap-6 mt-4">
        <button
          type="button"
          onClick={() => setConfirming('signOut')}
          className="w-full min-h-[56px] rounded-[var(--pd-field-radius)] border border-[var(--pd-line)] bg-white text-[18px] font-extrabold text-[var(--pd-navy)] hover:bg-[var(--pd-page-2)] active:scale-[0.99] transition-all cursor-pointer"
        >
          {MoreStrings.signOut}
        </button>

        {/* Separator to make the destructive action distinct */}
        <hr className="border-[var(--pd-line)] mx-4" />

        <button
          type="button"
          onClick={() => setConfirming('forget')}
          className="w-full min-h-[56px] px-4 rounded-[var(--pd-field-radius)] border border-[var(--pd-bad)]/30 bg-[var(--pd-bad-bg)] text-[18px] font-extrabold text-[var(--pd-bad)] hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
        >
          {MoreStrings.forgetMe}
        </button>
      </div>

      <ForgetDeviceDialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
        mode={confirming || 'signOut'}
        onConfirm={() => {
          const action = confirming;
          setConfirming(null);
          if (action === 'forget') void forgetRememberedIdentity();
          else void logout();
        }}
      />
      </div>
    </Page>
  );
}
