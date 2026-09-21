import * as React from 'react';
import { 
  ChevronLeft, 
  WifiOff, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';
import { useSyncState } from '@/offline/hooks/useSyncState';
import { useAttentionItems } from '@/features/attention/hooks/useAttentionItems';
import { AttentionItemRow } from '@/features/attention/components/AttentionItemRow';
import { AttentionEmptyState } from '@/features/attention/components/AttentionEmptyState';
import { MediaUploadCoordinator } from '@/features/package-media/upload/media-upload-coordinator';
import type { AttentionItem } from '@/features/attention/attention-types';

interface AttentionScreenProps {
  onBack: () => void;
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
  const { business, user } = useAuth();
  const businessId = business?.id;
  const syncState = useSyncState(businessId);
  const isOffline = syncState.connectivity === 'UNREACHABLE' || syncState.connectivity === 'DEGRADED';

  const [isRetryingMedia, setIsRetryingMedia] = React.useState(false);

  const { items, isLoading } = useAttentionItems({
    businessId: businessId ?? 0,
    userRole: business?.role ?? 'attendant',
  });

  const handleAction = async (item: AttentionItem) => {
    switch (item.action?.type) {
      case 'VIEW_PACKAGE':
        if (item.entityId && onNavigateToPackage) {
          onNavigateToPackage(String(item.entityId));
        }
        break;

      case 'RETRY_PHOTO':
        if (isOffline) {
          toast.error('Connect to the internet to retry photo upload');
          return;
        }
        if (!businessId) return;

        try {
          setIsRetryingMedia(true);
          await MediaUploadCoordinator.syncPendingMedia(businessId);
          toast.success('Retrying photo upload...');
        } catch (err: any) {
          toast.error(err.message || 'Photo retry failed. Please try again.');
        } finally {
          setIsRetryingMedia(false);
        }
        break;

      case 'BUY_SMS_CREDITS':
        if (isOffline) {
          toast.error('Connect to the internet to buy SMS credits');
          return;
        }
        if (onNavigateToBuyCredits) {
          onNavigateToBuyCredits();
        }
        break;

      case 'VIEW_SMS_CREDITS':
        if (onNavigateToCredits) {
          onNavigateToCredits();
        }
        break;

      case 'CHECK_PURCHASE':
        if (isOffline) {
          toast.error('Connect to the internet to verify purchase status');
          return;
        }
        if (onNavigateToBuyCredits) {
          onNavigateToBuyCredits();
        }
        break;

      default:
        break;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-page w-full max-w-lg mx-auto pb-10">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-10 bg-surface-page/95 backdrop-blur-sm border-b border-border-subtle px-4 h-14 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-text-secondary hover:text-text-primary transition-colors py-2 pr-4 -ml-2 cursor-pointer min-h-[44px]"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          <span className="text-[17px] font-medium ml-0.5">Back</span>
        </button>

        <h1 className="text-[17px] font-semibold text-text-primary">
          Attention
        </h1>

        <div className="w-8 flex items-center justify-end">
          {items.length > 0 && (
            <span 
              className="text-xs font-semibold px-2 py-0.5 rounded-full bg-status-danger-bg text-status-danger-text border border-status-danger-border tabular-nums"
              aria-label={`${items.length} items need attention`}
            >
              {items.length > 99 ? '99+' : items.length}
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 pt-3 flex flex-col gap-3">
        {/* Offline Advisory Notice */}
        {isOffline && (
          <div 
            role="status"
            className="flex items-center gap-2.5 p-3 rounded-[var(--radius-lg)] bg-status-warning-bg border border-status-warning-border text-status-warning-text text-xs"
          >
            <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
            <p className="font-medium">
              Offline · Showing saved items from this device
            </p>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-3 pt-2">
            <div className="h-24 bg-surface-default rounded-[var(--radius-xl)] border border-border-subtle animate-pulse" />
            <div className="h-24 bg-surface-default rounded-[var(--radius-xl)] border border-border-subtle animate-pulse" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && items.length === 0 && (
          <AttentionEmptyState />
        )}

        {/* Unresolved Attention List */}
        {!isLoading && items.length > 0 && (
          <div 
            className="flex flex-col gap-3"
            aria-live="polite"
          >
            <p className="text-xs text-text-secondary px-0.5">
              {items.length === 1 
                ? '1 item needs a quick check' 
                : `${items.length} items need a quick check`}
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
