import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, User, PackagePlus, Phone, PackageCheck, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useCustomerDetail } from '@/features/customers/hooks/useCustomerDetail';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { formatMoney, formatPhone } from '@/lib/formatters';
import type { EnrichedCustomerPackage } from '@/features/customers/domain/customer-types';

interface CustomerDetailScreenProps {
  customerId: string;
  businessId?: number;
  onBack?: () => void;
  onSelectPackage?: (packageId: string) => void;
  onAddPackageForCustomer?: (customerId: string) => void;
}

export function CustomerDetailScreen({
  customerId,
  businessId: propBusinessId,
  onBack,
  onSelectPackage,
  onAddPackageForCustomer,
}: CustomerDetailScreenProps) {
  const routerNavigate = useNavigate();
  const { business } = useAuth();
  const businessId = propBusinessId ?? business?.id ?? 0;
  const handleBack = onBack ?? (() => routerNavigate({ to: '/customers' }));
  const handleSelectPackage = onSelectPackage ?? ((packageId: string) => {
    routerNavigate({ to: '/packages/$packageId', params: { packageId } });
  });
  const handleAddPackage = onAddPackageForCustomer ?? ((cId: string) => {
    routerNavigate({ to: '/packages/new', search: { customerId: cId } });
  });

  const { data, isLoading, notFound } = useCustomerDetail(businessId, customerId);

  const getStatusVariant = (status: EnrichedCustomerPackage['status']) => {
    switch (status) {
      case 'WAITING':
        return 'neutral';
      case 'COLLECTED':
        return 'success';
      case 'RETURNED':
        return 'warning';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const today = new Date();
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      if (isToday) {
        return `Today · ${timeString}`;
      }
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${timeString}`;
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-surface-page max-w-lg mx-auto">
        <header className="px-4 py-3 border-b border-border-subtle flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-32 bg-surface-subtle rounded-lg animate-pulse" />
        </header>
        <div className="p-4 flex flex-col gap-4">
          <div className="h-28 bg-surface-subtle animate-pulse rounded-2xl" />
          <div className="h-44 bg-surface-subtle animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex flex-col min-h-screen bg-surface-page max-w-lg mx-auto">
        <header className="px-4 py-3 border-b border-border-subtle flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-text-primary">Customer</h1>
        </header>
        <div className="p-8 flex flex-col items-center justify-center text-center mt-12">
          <div className="w-14 h-14 rounded-2xl bg-surface-subtle border border-border-subtle flex items-center justify-center text-text-muted mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-text-primary">Customer not found</h2>
          <p className="text-sm text-text-secondary mt-1 max-w-xs">
            This customer may not be available on this device.
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-action-primary hover:bg-action-primary/90 shadow-sm transition-all"
          >
            Back to customers
          </button>
        </div>
      </div>
    );
  }

  const { customer, waitingPackages, recentPackages, waitingCount, totalCount } = data;

  return (
    <div className="flex flex-col min-h-screen bg-surface-page max-w-lg mx-auto pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface-page/95 backdrop-blur-sm border-b border-border-subtle px-4 h-14 flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-full transition-colors cursor-pointer"
          aria-label="Back to customers"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-text-primary truncate">
          {customer.name}
        </h1>
      </header>

      <main className="p-4 flex flex-col gap-5">
        {/* Customer Identity Card */}
        <section className="bg-surface-default rounded-2xl border border-border-subtle p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-full bg-action-primary/10 text-action-primary font-bold text-lg flex items-center justify-center shrink-0">
                {customer.name ? customer.name[0].toUpperCase() : <User className="w-6 h-6" />}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-text-primary truncate">
                    {customer.name}
                  </h2>
                  {customer.sync_status === 'PENDING_CREATE' && (
                    <span className="shrink-0 text-[10px] font-semibold uppercase text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Local
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-text-secondary tabular-nums mt-0.5">
                  {formatPhone(customer.phone_display || customer.phone_normalized)}
                </p>
              </div>
            </div>

            {customer.phone_normalized && (
              <a
                href={`tel:${customer.phone_normalized}`}
                className="p-3 bg-surface-subtle text-action-primary hover:bg-action-primary/10 active:scale-95 rounded-full transition-all flex items-center justify-center cursor-pointer border border-border-subtle"
                aria-label={`Call ${customer.name}`}
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Quick Stats + Add Package CTA */}
          <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
            <div className="text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">{waitingCount}</span> waiting ·{' '}
              <span className="font-semibold text-text-primary">{totalCount}</span> total
            </div>

            <button
              type="button"
              onClick={() => handleAddPackage(customer.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-action-primary text-white text-xs font-semibold shadow-sm hover:bg-action-primary/90 active:scale-95 transition-all cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Add package</span>
            </button>
          </div>
        </section>

        {/* Waiting Packages Section (Primary Focus) */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-action-primary" />
              <span>Waiting packages ({waitingCount})</span>
            </h3>
          </div>

          {waitingPackages.length === 0 ? (
            <div className="bg-surface-default rounded-xl border border-border-subtle p-5 text-center shadow-sm">
              <p className="text-sm font-medium text-text-secondary">No packages waiting</p>
              <p className="text-xs text-text-muted mt-0.5">
                New packages for this customer will appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {waitingPackages.map(pkg => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleSelectPackage(pkg.id)}
                  className="w-full text-left bg-surface-default hover:bg-surface-subtle active:bg-surface-active/70 rounded-xl border border-border-subtle p-4 shadow-sm flex flex-col gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary"
                  aria-label={`Package ${pkg.publicPackageId}, pickup code ${pkg.pickupCode}, amount ${formatMoney(pkg.amountDueMinor)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-text-primary text-base">
                        {pkg.publicPackageId}
                      </span>
                      {pkg.syncStatus === 'PENDING_CREATE' && (
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          Local
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-text-primary text-base tabular-nums">
                      {formatMoney(pkg.amountDueMinor)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <span className="text-text-muted">Pickup code:</span>
                      <span className="font-mono font-bold text-action-primary bg-action-primary/10 px-1.5 py-0.5 rounded">
                        {pkg.pickupCode}
                      </span>
                    </div>
                    <span>{getRelativeTime(pkg.clientCreatedAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Package History Section */}
        {recentPackages.length > 0 && (
          <section className="flex flex-col gap-2 pt-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-text-muted" />
                <span>Recent history ({recentPackages.length})</span>
              </h3>
            </div>

            <div className="flex flex-col divide-y divide-border-subtle bg-surface-default rounded-xl border border-border-subtle overflow-hidden shadow-sm">
              {recentPackages.map(pkg => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleSelectPackage(pkg.id)}
                  className="w-full text-left p-3.5 hover:bg-surface-subtle active:bg-surface-active/70 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  aria-label={`Package ${pkg.publicPackageId}, ${pkg.status.toLowerCase()}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm text-text-primary">
                        {pkg.publicPackageId}
                      </span>
                      <StatusBadge variant={getStatusVariant(pkg.status)}>
                        {pkg.status.charAt(0) + pkg.status.slice(1).toLowerCase()}
                      </StatusBadge>
                    </div>
                    <span className="text-xs text-text-muted">
                      {getRelativeTime(pkg.clientCreatedAt)}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-text-secondary tabular-nums">
                    {formatMoney(pkg.amountDueMinor)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
