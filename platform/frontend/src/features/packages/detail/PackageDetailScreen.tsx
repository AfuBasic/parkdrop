import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PackageX, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { usePackageDetail } from '@/features/packages/detail/hooks/usePackageDetail';
import { PackageIdentityHeader } from '@/features/packages/detail/components/PackageIdentityHeader';
import { PackageCustomerCard } from '@/features/packages/detail/components/PackageCustomerCard';
import { PackagePickupCodeCard } from '@/features/packages/detail/components/PackagePickupCodeCard';
import { PackagePaymentCard } from '@/features/packages/detail/components/PackagePaymentCard';
import { PackagePhotoCard } from '@/features/packages/detail/components/PackagePhotoCard';
import { PackageInfoCard } from '@/features/packages/detail/components/PackageInfoCard';
import { PackageActivitySection } from '@/features/packages/detail/components/PackageActivitySection';
import { PackageStickyActionBar } from '@/features/packages/detail/components/PackageStickyActionBar';
import { ReturnPackageSheet } from '@/features/packages/lifecycle/components/ReturnPackageSheet';
import { CancelPackageSheet } from '@/features/packages/lifecycle/components/CancelPackageSheet';
import { PaymentRepository } from '@/offline/repositories/PaymentRepository';
import { PackageLifecycleRepository } from '@/offline/repositories/PackageLifecycleRepository';
import type { PaymentMethod } from '@/offline/db/schema';
import type { ReturnReason, CancelReason } from '@/features/packages/lifecycle/domain/lifecycle-reasons';
import { PackagesStrings } from '@/features/packages/strings';

export interface PackageDetailScreenProps {
  packageId: string;
  businessId?: number;
  pickupPointName?: string | null;
  onBack?: () => void;
}

export function PackageDetailScreen({
  packageId,
  businessId: propBusinessId,
  pickupPointName,
  onBack,
}: PackageDetailScreenProps) {
  const routerNavigate = useNavigate();
  const handleBack = onBack ?? (() => routerNavigate({ to: '/packages' }));
  const { user, business } = useAuth();
  const businessId = propBusinessId ?? business?.id ?? 0;
  const staffName = user?.first_name ? user.first_name : user?.email || 'Staff';
  const [isReturnSheetOpen, setIsReturnSheetOpen] = useState(false);
  const [isCancelSheetOpen, setIsCancelSheetOpen] = useState(false);

  const { data, isLoading, notFound } = usePackageDetail(packageId, businessId);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--pd-page)] max-w-lg mx-auto">
        <header className="bg-[var(--pd-blue)] px-4 py-3 flex items-center gap-3 text-white">
          <button type="button" onClick={handleBack} className="p-2 -ml-2 text-white/80">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-32 bg-white/30 rounded-lg animate-pulse" />
        </header>
        <div className="p-4 flex flex-col gap-4">
          <div className="h-36 bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] animate-pulse" />
          <div className="h-28 bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] animate-pulse" />
          <div className="h-44 bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] animate-pulse" />
        </div>
      </div>
    );
  }

  // Not Found State
  if (notFound || !data) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--pd-page)] max-w-lg mx-auto p-6 items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--pd-page)] flex items-center justify-center text-[var(--pd-muted)] mb-4 border border-[var(--pd-line)]">
          <PackageX className="w-8 h-8" />
        </div>
        <h2 className="text-[20px] font-extrabold text-[var(--pd-navy)] mb-1">Package not found</h2>
        <p className="text-[15px] font-bold text-[var(--pd-muted)] mb-6 max-w-xs">
          This package could not be found in your active account.
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="min-h-[48px] px-6 py-2.5 bg-[var(--pd-blue)] text-white font-extrabold rounded-[var(--pd-field-radius)] shadow-xs hover:bg-[var(--pd-blue-hover)] active:scale-95 transition-all cursor-pointer"
        >
          {PackagesStrings.backAction}
        </button>
      </div>
    );
  }

  const { package: pkg, customer, media, mediaPreviewUrl, payments, paymentSummary, activityTimeline } = data;

  // 1. Payment Recording Handler
  const handleRecordPayment = async (amountMinor: number, method: PaymentMethod) => {
    await PaymentRepository.recordPayment({
      businessId,
      pickupPointId: pkg.pickup_point_id,
      packageId: pkg.id,
      amountMinor,
      method,
    });
  };

  // 2. Release with Payment Collection Handler
  const handleConfirmCollectAndRelease = async (pickupCode: string) => {
    if (paymentSummary.balanceMinor > 0) {
      await PaymentRepository.recordPayment({
        businessId,
        pickupPointId: pkg.pickup_point_id,
        packageId: pkg.id,
        amountMinor: paymentSummary.balanceMinor,
        method: 'CASH',
      });
    }

    await PackageLifecycleRepository.collectPackageLocally({
      businessId,
      pickupPointId: pkg.pickup_point_id,
      packageId: pkg.id,
      pickupCode,
      notes: null,
      actorName: staffName,
    });

    handleBack();
  };

  // 3. Release Without Payment Handler
  const handleConfirmReleaseWithoutPayment = async (pickupCode: string) => {
    await PackageLifecycleRepository.collectPackageLocally({
      businessId,
      pickupPointId: pkg.pickup_point_id,
      packageId: pkg.id,
      pickupCode,
      notes: 'Released without payment',
      actorName: staffName,
    });

    handleBack();
  };

  // 4. Release Already Paid Handler
  const handleConfirmReleasePaid = async (pickupCode: string) => {
    await PackageLifecycleRepository.collectPackageLocally({
      businessId,
      pickupPointId: pkg.pickup_point_id,
      packageId: pkg.id,
      pickupCode,
      notes: null,
      actorName: staffName,
    });

    handleBack();
  };

  // 5. Lifecycle Action Handlers (Return & Cancel)
  const handleConfirmReturn = async (reason: ReturnReason, note?: string | null) => {
    await PackageLifecycleRepository.returnPackageLocally({
      businessId,
      pickupPointId: pkg.pickup_point_id,
      packageId: pkg.id,
      reason,
      reasonNote: note,
    });
    setIsReturnSheetOpen(false);
  };

  const handleConfirmCancel = async (reason: CancelReason, note?: string | null) => {
    await PackageLifecycleRepository.cancelPackageLocally({
      businessId,
      pickupPointId: pkg.pickup_point_id,
      packageId: pkg.id,
      reason,
      reasonNote: note,
    });
    setIsCancelSheetOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--pd-page)] max-w-lg mx-auto pb-28">
      {/* 1. Compact Blue Header with More Sheet */}
      <PackageIdentityHeader
        pkg={pkg}
        onBack={handleBack}
        onMarkReturned={() => setIsReturnSheetOpen(true)}
        onCancelPackage={() => setIsCancelSheetOpen(true)}
      />

      {/* 2. Scrollable Body Content */}
      <main className="px-4 pt-2 pb-6 flex flex-col gap-4">
        {/* Customer Summary Card (overlaps header) */}
        <PackageCustomerCard
          customer={customer}
          pkg={pkg}
          paymentSummary={paymentSummary}
        />

        {/* Large Grouped Monospace Pickup Code Card */}
        <PackagePickupCodeCard pkg={pkg} />

        {/* Payment Card with Quick Modal */}
        <PackagePaymentCard
          paymentSummary={paymentSummary}
          payments={payments}
          canRecordPayment={pkg.status === 'WAITING'}
          onRecordPayment={handleRecordPayment}
        />

        {/* Photo Card with Direct Camera Capture */}
        <PackagePhotoCard
          packageId={pkg.id}
          businessId={businessId}
          media={media}
          mediaPreviewUrl={mediaPreviewUrl}
        />

        {/* Activity Timeline */}
        <PackageActivitySection timeline={activityTimeline} />

        {/* Operational Package Metadata with Real Location Name */}
        <PackageInfoCard
          pkg={pkg}
          pickupPointName={pickupPointName}
        />
      </main>

      {/* 3. Sticky 84px Action Bar replacing bottom nav */}
      <PackageStickyActionBar
        pkg={pkg}
        customer={customer}
        paymentSummary={paymentSummary}
        onOpenRecordPaymentOnly={() => {
          // Trigger payment sheet by proxy
          const btn = document.querySelector('button[aria-label="Record payment"]') as HTMLButtonElement | null;
          btn?.click();
        }}
        onConfirmCollectAndRelease={handleConfirmCollectAndRelease}
        onConfirmReleaseWithoutPayment={handleConfirmReleaseWithoutPayment}
        onConfirmReleasePaid={handleConfirmReleasePaid}
      />

      {/* Lifecycle Action Sheets */}
      <ReturnPackageSheet
        isOpen={isReturnSheetOpen}
        onClose={() => setIsReturnSheetOpen(false)}
        pkg={pkg}
        customer={customer}
        paymentSummary={paymentSummary}
        onConfirmReturn={handleConfirmReturn}
      />

      <CancelPackageSheet
        isOpen={isCancelSheetOpen}
        onClose={() => setIsCancelSheetOpen(false)}
        pkg={pkg}
        customer={customer}
        paymentSummary={paymentSummary}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  );
}
