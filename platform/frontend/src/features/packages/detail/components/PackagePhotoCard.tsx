import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Camera, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { db } from '@/offline/db/database';
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

export function PackagePhotoCard({
  packageId,
  businessId,
  mediaPreviewUrl,
}: PackagePhotoCardProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(mediaPreviewUrl);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const photoChip = photoPreview ? (
    <span className="text-[15px] font-extrabold text-[#15803D] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-[#86EFAC]">
      {PackagesStrings.photoAddedStatus}
    </span>
  ) : undefined;

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
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="relative w-full h-44 rounded-xl overflow-hidden bg-[var(--pd-page)] border border-[var(--pd-line)] cursor-pointer group"
              >
                <img
                  src={photoPreview}
                  alt="Package"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                />
              </button>

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
