import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSafeBack } from '@/hooks/useSafeBack';
import { WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';
import { useSyncState } from '@/offline/hooks/useSyncState';
import { useAttentionItems } from '@/features/attention/hooks/useAttentionItems';
import { AttentionItemRow } from '@/features/attention/components/AttentionItemRow';
import { AttentionEmptyState } from '@/features/attention/components/AttentionEmptyState';
import { MediaUploadCoordinator } from '@/features/package-media/upload/media-upload-coordinator';
import type { AttentionItem } from '@/features/attention/attention-types';
import { TaskHeader } from '@/design-system/shell/TaskHeader';
import { AttentionStrings } from '@/features/attention/strings';

interface AttentionScreenProps {
  onBack?: () => void;
  onNavigateToPackage?: (packageId: string) => void;
  onNavigateToBuyCredits?: () => void;
  onNavigateToCredits?: () => void;
}

export function AttentionScreen({
  onBack,
  onNavigateToPackage,
  onNavigateToBuyCredits,
  onNavigateToCredits,
}: AttentionScreenProps) {
  const routerNavigate = useNavigate();
  const safeBack = useSafeBack('/more');
  const handleBack = onBack ?? safeBack;
  const handleNavigateToPackage = onNavigateToPackage ?? ((pkgId: string) => {
    routerNavigate({ to: '/packages/$packageId', params: { packageId: pkgId } });
  });
  const handleNavigateToBuyCredits = onNavigateToBuyCredits ?? (() => {
    routerNavigate({ to: '/more/sms-credits/buy' });
  });
  const handleNavigateToCredits = onNavigateToCredits ?? (() => {
    routerNavigate({ to: '/more/sms-credits' });
  });
  const { business, role } = useAuth();
  const businessId = business?.id;
  const syncState = useSyncState(businessId);
  const isOffline = syncState.connectivity === 'UNREACHABLE' || syncState.connectivity === 'DEGRADED';

  const [, setIsRetryingMedia] = React.useState(false);

  const { items, isLoading } = useAttentionItems({
    businessId: businessId ?? 0,
    userRole: role ?? 'attendant',
  });

  const handleAction = async (item: AttentionItem) => {
    switch (item.action?.type) {
      case 'VIEW_PACKAGE':
        if (item.entityId) {
          handleNavigateToPackage(String(item.entityId));
        }
        break;

      case 'RETRY_PHOTO':
        // The card disables this action and says why when there is no
        // internet, so reaching here means something changed mid-tap.
        if (isOffline) return;
        if (!businessId) return;

        try {
          setIsRetryingMedia(true);
          await MediaUploadCoordinator.syncPendingMedia(businessId);
          toast.success('Sending the photo again…');
        } catch (err: any) {
          toast.error(err?.message || 'The photo still did not send. Try again in a moment.');
        } finally {
          setIsRetryingMedia(false);
        }
        break;

      case 'BUY_SMS_CREDITS':
        if (isOffline) return;
        handleNavigateToBuyCredits();
        break;

      case 'VIEW_SMS_CREDITS':
        handleNavigateToCredits();
        break;

      case 'CHECK_PURCHASE':
        if (isOffline) return;
        handleNavigateToBuyCredits();
        break;

      default:
        break;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--pd-page-2)] w-full max-w-lg mx-auto pb-10">
      <TaskHeader
        title={AttentionStrings.title}
        onBack={handleBack}
        screenName="Things to check"
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 pt-4 flex flex-col gap-4">
        {/* Offline Advisory Notice */}
        {isOffline && (
          <div
            role="status"
            className="flex items-center gap-3 p-4 rounded-[var(--pd-card-radius)] bg-[var(--pd-warn-bg)] border border-[var(--pd-warn)]/25 text-[var(--pd-warn)]"
          >
            <WifiOff className="w-6 h-6 shrink-0" aria-hidden="true" strokeWidth={2.25} />
            <p className="text-[16px] font-semibold m-0 leading-snug">
              {AttentionStrings.offlineStrip}
            </p>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-4 pt-1">
            <div className="h-32 bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] animate-pulse" />
            <div className="h-32 bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] animate-pulse" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && items.length === 0 && <AttentionEmptyState />}

        {/* Unresolved Attention List */}
        {!isLoading && items.length > 0 && (
          <div className="flex flex-col gap-4" aria-live="polite">
            <p className="text-[18px] font-extrabold text-[var(--pd-navy)] m-0 px-0.5">
              {AttentionStrings.countLine(items.length)}
            </p>

            {items.map((item) => (
              <AttentionItemRow
                key={item.id}
                item={item}
                isOffline={isOffline}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
