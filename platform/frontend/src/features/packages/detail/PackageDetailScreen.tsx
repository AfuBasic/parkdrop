import { useState, useEffect } from 'react';
import { PackageX, ArrowLeft } from 'lucide-react';
import { usePackageDetail } from './hooks/usePackageDetail';
import { PackageIdentityHeader } from './components/PackageIdentityHeader';
import { PackagePickupCodeCard } from './components/PackagePickupCodeCard';
import { PackageCustomerCard } from './components/PackageCustomerCard';
import { PackagePhotoCard } from './components/PackagePhotoCard';
import { PackageInfoCard } from './components/PackageInfoCard';
import { PackageActivitySection } from './components/PackageActivitySection';
import { PackageActionSlots } from './components/PackageActionSlots';
import { PaymentSummaryCard } from '@/features/payments/components/PaymentSummaryCard';
import { PaymentHistory } from '@/features/payments/components/PaymentHistory';
import { RecordPaymentSheet } from '@/features/payments/components/RecordPaymentSheet';
import { PaymentRepository } from '@/offline/repositories/PaymentRepository';
import { connectivityManager } from '@/offline/sync/connectivity-manager';
import type { PaymentMethod } from '@/offline/db/schema';

interface PackageDetailScreenProps {
  packageId: string;
  businessId: number;
  onBack: () => void;
}

export function PackageDetailScreen({
  packageId,
  businessId,
  onBack,
}: PackageDetailScreenProps) {
  const [isOnline, setIsOnline] = useState(() => connectivityManager.getState() !== 'UNREACHABLE');
  const [isRecordSheetOpen, setIsRecordSheetOpen] = useState(false);

  useEffect(() => {
    return connectivityManager.subscribe(connState => {
      setIsOnline(connState !== 'UNREACHABLE');
    });
  }, []);

  const { data, isLoading, notFound } = usePackageDetail(packageId, businessId);

  // Loading State
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
          <div className="h-6 w-32 bg-surface-active rounded-lg animate-pulse" />
        </header>
        <div className="p-4 flex flex-col gap-4">
          <div className="h-36 bg-surface-default rounded-[var(--radius-2xl)] border border-border-subtle animate-pulse" />
          <div className="h-24 bg-surface-default rounded-[var(--radius-2xl)] border border-border-subtle animate-pulse" />
          <div className="h-44 bg-surface-default rounded-[var(--radius-2xl)] border border-border-subtle animate-pulse" />
        </div>
      </div>
    );
  }

  // Not Found or Unauthorized State
  if (notFound || !data) {
    return (
      <div className="flex flex-col min-h-screen bg-surface-page max-w-lg mx-auto p-6 items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-status-neutral-bg flex items-center justify-center text-text-muted mb-4 border border-border-subtle">
          <PackageX className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-1">Package not found</h2>
        <p className="text-sm text-text-secondary mb-6 max-w-xs">
          This parcel could not be found in your active workspace, or you do not have permission to view it.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 bg-action-primary text-white font-semibold rounded-[var(--radius-xl)] shadow-sm hover:bg-action-primary-hover active:scale-95 transition-all cursor-pointer"
        >
          Return to previous screen
        </button>
      </div>
    );
  }

  const { package: pkg, customer, media, mediaPreviewUrl, payments, paymentSummary, activityTimeline } = data;

  const handleRecordPayment = async (amountMinor: number, method: PaymentMethod) => {
    await PaymentRepository.recordPayment({
      businessId,
      pickupPointId: pkg.pickup_point_id,
      packageId: pkg.id,
      amountMinor,
      method,
    });
  };

  const canRecordPayment = pkg.status === 'WAITING';

  return (
    <div className="flex flex-col min-h-screen bg-surface-page max-w-lg mx-auto pb-12">
      {/* 1. Sticky Header */}
      <PackageIdentityHeader pkg={pkg} onBack={onBack} isOnline={isOnline} />

      {/* 2. Scrollable Body Content */}
      <main className="p-4 flex flex-col gap-4">
        {/* Pickup Code Hero */}
        <PackagePickupCodeCard pkg={pkg} />

        {/* Customer Identity */}
        <PackageCustomerCard customer={customer} />

        {/* Parcel Photo Preview */}
        <PackagePhotoCard media={media} mediaPreviewUrl={mediaPreviewUrl} />

        {/* Payment Summary */}
        <PaymentSummaryCard
          summary={paymentSummary}
          onOpenRecordPayment={() => setIsRecordSheetOpen(true)}
          canRecordPayment={canRecordPayment}
        />

        {/* Payment History */}
        <PaymentHistory payments={payments} />

        {/* Operational Package Metadata */}
        <PackageInfoCard pkg={pkg} />

        {/* Activity Timeline */}
        <PackageActivitySection timeline={activityTimeline} />

        {/* Action Slots / Release Boundary */}
        <PackageActionSlots
          pkg={pkg}
          paymentSummary={paymentSummary}
          onOpenRecordPayment={() => setIsRecordSheetOpen(true)}
        />
      </main>

      {/* Record Payment Bottom Sheet */}
      <RecordPaymentSheet
        isOpen={isRecordSheetOpen}
        onClose={() => setIsRecordSheetOpen(false)}
        remainingBalanceMinor={paymentSummary.balanceMinor}
        onRecord={handleRecordPayment}
      />
    </div>
  );
}
