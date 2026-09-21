import { useAuth } from '@/features/auth/AuthContext';
import { db } from '@/offline/db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAttentionItems } from '@/features/attention/hooks/useAttentionItems';
import { Link } from '@tanstack/react-router';
import { Logo } from '@/features/auth/components/Logo';
import {
  MessageSquare,
  ChevronRight,
  Users,
  Building2,
  AlertCircle,
  BarChart3,
  Shield,
  HelpCircle,
  Info,
} from 'lucide-react';

export function MoreScreen() {
  const { user, business, role, logout, forgetRememberedIdentity } = useAuth();

  const wallet = useLiveQuery(
    () => (business?.id ? db.smsWallets.where('business_id').equals(business.id).first() : undefined),
    [business?.id]
  );

  const { unresolvedCount } = useAttentionItems({
    businessId: business?.id ?? 0,
    userRole: role,
  });

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto pb-8 pt-4 px-4 sm:px-0">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight m-0">
          Settings & More
        </h1>
        <Logo tone="light" markOnly />
      </div>

      <div className="flex flex-col gap-5">
        {/* Account Profile Header */}
        <div className="bg-surface-default rounded-[var(--radius-xl)] p-4 shadow-xs border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Signed in as</p>
            <p className="text-text-primary font-bold text-base mt-0.5">
              {user?.first_name ? `${user.first_name}` : user?.email}
            </p>
            {user?.first_name && user?.email && (
              <p className="text-text-secondary text-xs">{user.email}</p>
            )}
            {business?.name && (
              <p className="text-action-primary text-xs font-medium mt-1">Workspace: {business.name}</p>
            )}
          </div>
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-action-primary text-xs font-bold uppercase tracking-wider">
            {role || 'Staff'}
          </span>
        </div>

        {/* Section 1: Operations */}
        <div>
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider px-1 mb-2">
            Operations
          </h2>
          <div className="bg-surface-default rounded-[var(--radius-xl)] shadow-xs border border-border-subtle divide-y divide-border-subtle overflow-hidden">
            {/* Attention Center */}
            <Link
              to="/more/attention"
              className="w-full flex items-center justify-between p-3.5 hover:bg-surface-subtle transition-colors cursor-pointer text-left min-h-[52px]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    unresolvedCount > 0
                      ? 'bg-status-danger-bg text-status-danger-text'
                      : 'bg-blue-50 text-action-primary'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-text-primary text-sm">Attention</div>
                  <div className="text-xs text-text-secondary">Operational exceptions & retries</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unresolvedCount > 0 && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full bg-status-danger-bg text-status-danger-text border border-status-danger-border tabular-nums"
                    aria-label={`${unresolvedCount} items need attention`}
                  >
                    {unresolvedCount > 99 ? '99+' : unresolvedCount}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </div>
            </Link>

            {/* Daily Operations & Reports (Owner & Manager only) */}
            {(role === 'owner' || role === 'manager') && (
              <Link
                to="/more/reports"
                className="w-full flex items-center justify-between p-3.5 hover:bg-surface-subtle transition-colors cursor-pointer text-left min-h-[52px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-action-primary flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary text-sm">Daily Reports</div>
                    <div className="text-xs text-text-secondary">Package metrics & payment activity</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </Link>
            )}

            {/* SMS Credits */}
            <Link
              to="/more/sms-credits"
              className="w-full flex items-center justify-between p-3.5 hover:bg-surface-subtle transition-colors cursor-pointer text-left min-h-[52px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-action-primary flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-text-primary text-sm">SMS Credits</div>
                  <div className="text-xs text-text-secondary">Customer notification balance</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {wallet !== undefined && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      wallet.balance === 0
                        ? 'bg-status-danger-bg text-status-danger-text'
                        : wallet.balance < 5
                        ? 'bg-status-warning-bg text-status-warning-text'
                        : 'bg-surface-page text-text-secondary border border-border-subtle'
                    }`}
                  >
                    {wallet.balance} {wallet.balance === 1 ? 'credit' : 'credits'}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </div>
            </Link>
          </div>
        </div>

        {/* Section 2: Business & Team (Owner/Manager only) */}
        {(role === 'owner' || role === 'manager') && (
          <div>
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider px-1 mb-2">
              Business Administration
            </h2>
            <div className="bg-surface-default rounded-[var(--radius-xl)] shadow-xs border border-border-subtle divide-y divide-border-subtle overflow-hidden">
              {/* Staff Management */}
              <Link
                to="/more/staff"
                className="w-full flex items-center justify-between p-3.5 hover:bg-surface-subtle transition-colors cursor-pointer text-left min-h-[52px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-action-primary flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary text-sm">Staff</div>
                    <div className="text-xs text-text-secondary">Members, roles, and invitations</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </Link>

              {/* Business Details */}
              <Link
                to="/more/business"
                className="w-full flex items-center justify-between p-3.5 hover:bg-surface-subtle transition-colors cursor-pointer text-left min-h-[52px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-action-primary flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary text-sm">Business details</div>
                    <div className="text-xs text-text-secondary">Name, pickup point, and settings</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </Link>
            </div>
          </div>
        )}

        {/* Section 3: Account & Device Security */}
        <div>
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider px-1 mb-2">
            Account
          </h2>
          <div className="bg-surface-default rounded-[var(--radius-xl)] shadow-xs border border-border-subtle divide-y divide-border-subtle overflow-hidden">
            <Link
              to="/more/account"
              className="w-full flex items-center justify-between p-3.5 hover:bg-surface-subtle transition-colors cursor-pointer text-left min-h-[52px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-action-primary flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-text-primary text-sm">Account & Security</div>
                  <div className="text-xs text-text-secondary">Devices, offline access, and sessions</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </Link>
          </div>
        </div>

        {/* Section 4: Support & About */}
        <div>
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider px-1 mb-2">
            Support & Guides
          </h2>
          <div className="bg-surface-default rounded-[var(--radius-xl)] shadow-xs border border-border-subtle divide-y divide-border-subtle overflow-hidden">
            {/* Help Center */}
            <Link
              to="/more/help"
              className="w-full flex items-center justify-between p-3.5 hover:bg-surface-subtle transition-colors cursor-pointer text-left min-h-[52px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-action-primary flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-text-primary text-sm">Help & Guides</div>
                  <div className="text-xs text-text-secondary">Offline-ready instructions & best practices</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </Link>

            {/* About ParkDrop */}
            <Link
              to="/more/about"
              className="w-full flex items-center justify-between p-3.5 hover:bg-surface-subtle transition-colors cursor-pointer text-left min-h-[52px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-action-primary flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-text-primary text-sm">About ParkDrop</div>
                  <div className="text-xs text-text-secondary">Version 1.0.0, diagnostics, and privacy</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </Link>
          </div>
        </div>

        {/* Actions: Sign Out / Reset Device */}
        <div className="bg-surface-default rounded-[var(--radius-xl)] p-4 shadow-xs border border-border-subtle flex flex-col gap-2.5">
          <button
            type="button"
            onClick={logout}
            className="px-5 py-2.5 w-full bg-surface-page hover:bg-surface-subtle text-text-primary border border-border-default font-semibold rounded-xl transition-colors cursor-pointer text-xs min-h-[44px]"
          >
            Sign Out
          </button>
          <button
            type="button"
            onClick={forgetRememberedIdentity}
            className="px-5 py-2.5 w-full bg-status-danger-bg text-status-danger-text border border-status-danger-border font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer text-xs min-h-[44px]"
          >
            Reset Device Identity
          </button>
        </div>
      </div>
    </div>
  );
}
