import { useEffect, useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Camera, Image as ImageIcon, Loader2, RefreshCw, X } from 'lucide-react';
import { db } from '@/offline/db/database';
import { MediaUploadCoordinator } from '@/features/package-media/upload/media-upload-coordinator';
import type { LocalPackageMedia } from '@/offline/db/schema';
import { processPackagePhoto } from '@/features/package-media/image-processing/process-package-photo';
import { PackagesStrings } from '@/features/packages/strings';
import { Section } from '@/design-system/shell/Section';

export interface PackagePhotoCardProps {
  packageId: string;
  businessId: number;
  media?: LocalPackageMedia | null;
  mediaPreviewUrl: string | null;
}

const UPLOADING_STATUSES = new Set(['PENDING_UPLOAD', 'AUTHORIZING', 'UPLOADING', 'VERIFYING']);
const FAILED_STATUSES = new Set(['FAILED_RETRYABLE', 'NEEDS_ATTENTION']);

export function PackagePhotoCard({
  packageId,
  businessId,
  mediaPreviewUrl,
}: PackagePhotoCardProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(mediaPreviewUrl);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [imageFailedToLoad, setImageFailedToLoad] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live upload status straight from IndexedDB — this card never has to
  // guess whether MediaUploadCoordinator finished, is mid-retry, or gave
  // up. It's purely informational: nothing here blocks the rest of the
  // screen, since a package can be released, paid, whatever, with its
  // photo still quietly uploading in the background.
  const liveMedia = useLiveQuery(
    () => db.packageMedia.where('package_id').equals(packageId).first(),
    [packageId]
  );
  const uploadStatus = liveMedia?.status;
  const isUploading = uploadStatus ? UPLOADING_STATUSES.has(uploadStatus) : false;
  const hasFailed = uploadStatus ? FAILED_STATUSES.has(uploadStatus) : false;

  // The prop only reflects what usePackageDetail computed at last render;
  // once the coordinator finishes (SYNCED) or the local blob is freed,
  // rebuild the preview from the live row so the card updates itself
  // without the person needing to leave and come back.
  useEffect(() => {
    if (!liveMedia) return;
    if (liveMedia.local_blob) {
      const url = URL.createObjectURL(liveMedia.local_blob);
      setPhotoPreview(url);
      setImageFailedToLoad(false);
      return () => URL.revokeObjectURL(url);
    }
    if (liveMedia.public_id && liveMedia.cloud_name) {
      setPhotoPreview(
        `https://res.cloudinary.com/${liveMedia.cloud_name}/image/upload/f_auto,q_auto,w_800/${liveMedia.public_id}`
      );
      setImageFailedToLoad(false);
    }
  }, [liveMedia]);

  const handleRetryUpload = async () => {
    setIsRetrying(true);
    try {
      await MediaUploadCoordinator.syncPendingMedia(businessId);
    } finally {
      setIsRetrying(false);
    }
  };

  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const processedBlob = await processPackagePhoto(file, {
        maxLongEdge: 1024,
        quality: 0.7,
        outputFormat: 'image/jpeg',
      });

      const url = URL.createObjectURL(processedBlob);
      setPhotoPreview(url);

      await db.packageMedia.put({
        id: crypto.randomUUID(),
        business_id: businessId,
        package_id: packageId,
        local_blob: processedBlob,
        status: 'PENDING_UPLOAD',
        attempt_count: 0,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to attach package photo:', err);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    try {
      await db.packageMedia.where('package_id').equals(packageId).delete();
    } catch (err) {
      console.error('Failed to remove photo:', err);
    }
  };

  const photoChip = !photoPreview ? undefined : hasFailed ? (
    <span className="inline-flex items-center gap-1 text-[15px] font-extrabold text-[var(--pd-bad)] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-[#FCA5A5]">
      {PackagesStrings.photoFailedStatus}
    </span>
  ) : isUploading ? (
    <span className="inline-flex items-center gap-1.5 text-[15px] font-extrabold text-[var(--pd-muted)] bg-[var(--pd-page)] px-2.5 py-0.5 rounded-full border border-[var(--pd-line)]">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      {PackagesStrings.photoUploadingStatus}
    </span>
  ) : (
    <span className="text-[15px] font-extrabold text-[#15803D] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-[#86EFAC]">
      {PackagesStrings.photoAddedStatus}
    </span>
  );

  return (
    <>
      <Section
        icon={<ImageIcon className="w-5 h-5 text-[var(--pd-blue)]" />}
        label={PackagesStrings.photoCardTitle}
        chip={photoChip}
      >
        <div className="flex flex-col gap-3">
          {/* Hidden Camera Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          {!photoPreview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full min-h-[52px] rounded-[var(--pd-field-radius)] border border-dashed border-[var(--pd-line)] bg-[var(--pd-page)] flex items-center justify-center gap-2 text-[16px] font-extrabold text-[var(--pd-blue)] hover:bg-[var(--pd-tint)] active:scale-98 transition-transform cursor-pointer"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin text-[var(--pd-blue)]" />
              ) : (
                <Camera className="w-5 h-5 text-[var(--pd-blue)]" strokeWidth={2.5} />
              )}
              <span>{PackagesStrings.addPhotoAction}</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              {imageFailedToLoad ? (
                <div className="w-full h-44 rounded-xl bg-[var(--pd-page)] border border-dashed border-[var(--pd-line)] flex flex-col items-center justify-center gap-1.5 px-4 text-center">
                  <ImageIcon className="w-6 h-6 text-[var(--pd-muted)]" />
                  <p className="text-[14px] font-semibold text-[var(--pd-muted)] m-0">
                    {PackagesStrings.photoUnavailableNotice}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="relative w-full h-44 rounded-xl overflow-hidden bg-[var(--pd-page)] border border-[var(--pd-line)] cursor-pointer group"
                >
                  <img
                    src={photoPreview}
                    alt="Package"
                    onError={() => setImageFailedToLoad(true)}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                  />
                  {isUploading && (
                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-white bg-black/60 px-2 py-1 rounded-full">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {PackagesStrings.photoUploadingStatus}
                    </span>
                  )}
                </button>
              )}

              {hasFailed && (
                <button
                  type="button"
                  onClick={handleRetryUpload}
                  disabled={isRetrying}
                  className="min-h-[48px] px-3 text-[15px] font-extrabold text-[var(--pd-bad)] active:scale-98 bg-[#FEF2F2] rounded-xl border border-[#FCA5A5] flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <RefreshCw className={isRetrying ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
                  {PackagesStrings.photoRetryUploadAction}
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[48px] px-2 text-[15px] font-extrabold text-[var(--pd-blue)] hover:underline active:scale-95 bg-[var(--pd-tint)] rounded-xl border border-[var(--pd-line-2)] truncate"
                >
                  {PackagesStrings.retakePhotoAction}
                </button>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="min-h-[48px] px-2 text-[15px] font-extrabold text-[var(--pd-bad)] hover:underline active:scale-95 bg-[#FEF2F2] rounded-xl border border-[#FCA5A5] truncate"
                >
                  {PackagesStrings.removePhotoAction}
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Tap-to-zoom full screen overlay (Mobile way, no Dialog modal) */}
      {photoPreview && isZoomOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-200 touch-none">
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all z-10 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img 
              src={photoPreview} 
              alt="Package full" 
              className="max-w-full max-h-full object-contain" 
            />
          </div>
        </div>
      )}
    </>
  );
}
