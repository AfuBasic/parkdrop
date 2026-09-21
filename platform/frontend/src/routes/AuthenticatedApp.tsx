import * as React from 'react';
import { AppShell } from '@/design-system/shell/AppShell';
import { HomeScreen } from '@/features/home/HomeScreen';
import { AddPackageScreen } from '@/features/packages/add/AddPackageScreen';
import { PackageSearchScreen } from '@/features/packages/search/PackageSearchScreen';
import { PackagesScreen } from '@/features/packages/list/PackagesScreen';
import { PackageDetailScreen } from '@/features/packages/detail/PackageDetailScreen';
import { SmsCreditsScreen } from '@/features/sms-credits/screens/SmsCreditsScreen';
import { BuySmsCreditsScreen } from '@/features/sms-credits/purchase/screens/BuySmsCreditsScreen';
import { CustomersScreen } from '@/features/customers/list/CustomersScreen';
import { CustomerDetailScreen } from '@/features/customers/detail/CustomerDetailScreen';
import { StaffScreen } from '@/features/business/staff/StaffScreen';
import { BusinessDetailsScreen } from '@/features/business/details/BusinessDetailsScreen';
import { AttentionScreen } from '@/features/attention/AttentionScreen';
import { DailyOperationsScreen } from '@/features/reports/DailyOperationsScreen';
import { AccountSecurityScreen } from '@/features/account/AccountSecurityScreen';
import { HelpScreen } from '@/features/help/HelpScreen';
import { AboutScreen } from '@/features/about/AboutScreen';
import { useAttentionItems } from '@/features/attention/hooks/useAttentionItems';
import { MessageSquare, ChevronRight, Users, Building2, AlertCircle, BarChart3, Shield, HelpCircle, Info } from 'lucide-react';
import { db } from '@/offline/db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/features/auth/AuthContext';
import type { PackageStatusFilter } from '@/features/packages/list/package-list-types';

/**
 * Everything a signed-in user can reach.
 *
 * This lives in its own module so App.tsx can load it lazily. It is by far
 * the largest part of the bundle, and a signed-out user on slow data has no
 * use for any of it — they need the sign-in screen and nothing else. Keeping
 * it statically imported meant every first-time visitor paid to download the
 * entire dashboard before they could type their phone number.
 */
export default function AuthenticatedApp() {
  const { user, business, role, logout, forgetRememberedIdentity } = useAuth();

  // Lightweight internal router.
  const [currentPath, setCurrentPath] = React.useState('/');
  // Which tab the Packages screen opens on, set by the Home stat strip.
  const [packagesStatus, setPackagesStatus] = React.useState<PackageStatusFilter>('WAITING');

  // Wallet balance for the settings display.
  const wallet = useLiveQuery(
    () => business?.id ? db.smsWallets.where('business_id').equals(business.id).first() : undefined,
    [business?.id]
  );

  const { unresolvedCount } = useAttentionItems({
    businessId: business?.id ?? 0,
    userRole: role,
  });

  return (
    <AppShell
      currentPath={currentPath.startsWith('/more') ? '/more' : currentPath}
      onNavigate={setCurrentPath}
      // Home paints its own blue header to the edges of the phone.
      bleed={currentPath === '/'}
    >
      {currentPath === '/' && (
        <HomeScreen
          onNavigateToSearch={() => setCurrentPath('/packages/search')}
          onNavigateToAdd={() => setCurrentPath('/add')}
          onNavigateToPackages={(status) => {
            setPackagesStatus(status ?? 'WAITING');
            setCurrentPath('/packages');
          }}
          onNavigateToSetup={() => setCurrentPath('/more/business')}
          onNavigateToAttention={() => setCurrentPath('/more/attention')}
          onSelectPackage={(id) => setCurrentPath(`/packages/${id}`)}
        />
      )}
      
      {(currentPath === '/attention' || currentPath === '/more/attention') && (
        <AttentionScreen
          onBack={() => setCurrentPath('/more')}
          onNavigateToPackage={(id) => setCurrentPath(`/packages/${id}`)}
          onNavigateToBuyCredits={() => setCurrentPath('/more/sms-credits/buy')}
          onNavigateToCredits={() => setCurrentPath('/more/sms-credits')}
        />
      )}
      
      {currentPath === '/packages' && (
        <PackagesScreen
          key={packagesStatus}
          initialStatus={packagesStatus}
          onNavigateToSearch={() => setCurrentPath('/packages/search')}
          onNavigateToAdd={() => setCurrentPath('/add')}
          onSelectPackage={(pkg) => setCurrentPath(`/packages/${pkg.id}`)}
        />
      )}
      {currentPath.startsWith('/add') && (
        <AddPackageScreen 
          initialCustomerId={new URLSearchParams(currentPath.split('?')[1] || '').get('customerId')}
          onNavigate={setCurrentPath}
          onBack={() => {
            const customerId = new URLSearchParams(currentPath.split('?')[1] || '').get('customerId');
            if (customerId) {
              setCurrentPath(`/customers/${customerId}`);
            } else {
              setCurrentPath('/');
            }
          }}
        />
      )}
      {currentPath === '/customers' && (
        <CustomersScreen
          businessId={business?.id || 0}
          onSelectCustomer={(id) => setCurrentPath(`/customers/${id}`)}
          onNavigateToAdd={() => setCurrentPath('/add')}
        />
      )}
      {currentPath.startsWith('/customers/') && (
        <CustomerDetailScreen
          customerId={currentPath.replace('/customers/', '')}
          businessId={business?.id || 0}
          onBack={() => setCurrentPath('/customers')}
          onSelectPackage={(pkgId) => setCurrentPath(`/packages/${pkgId}`)}
          onAddPackageForCustomer={(customerId) => setCurrentPath(`/add?customerId=${customerId}`)}
        />
      )}
      {currentPath === '/packages/search' && (
        <PackageSearchScreen 
          onBack={() => setCurrentPath('/')}
          onSelectPackage={(pkg) => setCurrentPath(`/packages/${pkg.packageId}`)}
        />
      )}
      {currentPath.startsWith('/packages/') && currentPath !== '/packages/search' && (
        <PackageDetailScreen
          packageId={currentPath.replace('/packages/', '')}
          businessId={business?.id || 0}
          onBack={() => setCurrentPath('/packages')}
        />
      )}
      
      {currentPath === '/more/sms-credits' && (
        <SmsCreditsScreen 
          onBack={() => setCurrentPath('/more')} 
          onNavigateToBuy={() => setCurrentPath('/more/sms-credits/buy')}
        />
      )}

      {currentPath === '/more/sms-credits/buy' && (
        <BuySmsCreditsScreen 
          onBack={() => setCurrentPath('/more/sms-credits')}
          onSuccessDone={() => setCurrentPath('/more/sms-credits')}
        />
      )}

      {currentPath === '/more/staff' && (
        <StaffScreen 
          onBack={() => setCurrentPath('/more')}
        />
      )}

      {currentPath === '/more/business' && (
        <BusinessDetailsScreen 
          onBack={() => setCurrentPath('/more')}
        />
      )}

      {currentPath === '/more/reports' && (
        <DailyOperationsScreen 
          onBack={() => setCurrentPath('/more')}
        />
      )}

      {currentPath === '/more/account' && (
        <AccountSecurityScreen 
          onBack={() => setCurrentPath('/more')}
        />
      )}

      {(currentPath === '/more/help' || currentPath === '/help' || currentPath.startsWith('/more/help?')) && (
        <HelpScreen 
          onBack={() => setCurrentPath('/more')}
          initialTopicId={new URLSearchParams(currentPath.split('?')[1] || '').get('topic')}
        />
      )}

      {currentPath === '/more/about' && (
        <AboutScreen 
          onBack={() => setCurrentPath('/more')}
        />
      )}

      {currentPath === '/more' && (
        <div className="flex flex-col h-full max-w-lg mx-auto pb-8 pt-4">
          <h2 className="text-2xl font-bold text-text-primary mb-5 tracking-tight">Settings & More</h2>
          
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
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider px-1 mb-2">
                Operations
              </h3>
              <div className="bg-surface-default rounded-[var(--radius-xl)] shadow-xs border border-border-subtle divide-y divide-border-subtle overflow-hidden">
                {/* Attention Center */}
                <button
                  type="button"
                  onClick={() => setCurrentPath('/more/attention')}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-surface-subtle transition-colors cursor-pointer text-left min-h-[52px]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      unresolvedCount > 0 
                        ? 'bg-status-danger-bg text-status-danger-text' 
                        : 'bg-blue-50 text-action-primary'
                    }`}>
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
                </button>

                {/* Daily Operations & Reports (Owner & Manager only) */}
                {(role === 'owner' || role === 'manager') && (
                  <button
                    type="button"
                    onClick={() => setCurrentPath('/more/reports')}
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
                  </button>
                )}

                {/* SMS Credits */}
                <button
                  type="button"
                  onClick={() => setCurrentPath('/more/sms-credits')}
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
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        wallet.balance === 0
                          ? 'bg-status-danger-bg text-status-danger-text'
                          : wallet.balance < 5
                          ? 'bg-status-warning-bg text-status-warning-text'
                          : 'bg-surface-page text-text-secondary border border-border-subtle'
                      }`}>
                        {wallet.balance} {wallet.balance === 1 ? 'credit' : 'credits'}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  </div>
                </button>
              </div>
            </div>

            {/* Section 2: Business & Team (Owner/Manager only) */}
            {(role === 'owner' || role === 'manager') && (
              <div>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider px-1 mb-2">
                  Business Administration
                </h3>
                <div className="bg-surface-default rounded-[var(--radius-xl)] shadow-xs border border-border-subtle divide-y divide-border-subtle overflow-hidden">
                  {/* Staff Management */}
                  <button
                    type="button"
                    onClick={() => setCurrentPath('/more/staff')}
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
                  </button>

                  {/* Business Details */}
                  <button
                    type="button"
                    onClick={() => setCurrentPath('/more/business')}
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
                  </button>
                </div>
              </div>
            )}

            {/* Section 3: Account & Device Security */}
            <div>
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider px-1 mb-2">
                Account
              </h3>
              <div className="bg-surface-default rounded-[var(--radius-xl)] shadow-xs border border-border-subtle divide-y divide-border-subtle overflow-hidden">
                <button
                  type="button"
                  onClick={() => setCurrentPath('/more/account')}
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
                </button>
              </div>
            </div>

            {/* Section 4: Support & About */}
            <div>
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider px-1 mb-2">
                Support & Guides
              </h3>
              <div className="bg-surface-default rounded-[var(--radius-xl)] shadow-xs border border-border-subtle divide-y divide-border-subtle overflow-hidden">
                {/* Help Center */}
                <button
                  type="button"
                  onClick={() => setCurrentPath('/more/help')}
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
                </button>

                {/* About ParkDrop */}
                <button
                  type="button"
                  onClick={() => setCurrentPath('/more/about')}
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
                </button>
              </div>
            </div>

            {/* Actions: Sign Out / Reset Device */}
            <div className="bg-surface-default rounded-[var(--radius-xl)] p-4 shadow-xs border border-border-subtle flex flex-col gap-2.5">
              <button 
                onClick={logout}
                className="px-5 py-2.5 w-full bg-surface-page hover:bg-surface-subtle text-text-primary border border-border-default font-semibold rounded-xl transition-colors cursor-pointer text-xs min-h-[44px]"
              >
                Sign Out
              </button>
              <button 
                onClick={forgetRememberedIdentity}
                className="px-5 py-2.5 w-full bg-status-danger-bg text-status-danger-text border border-status-danger-border font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer text-xs min-h-[44px]"
              >
                Reset Device Identity
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
