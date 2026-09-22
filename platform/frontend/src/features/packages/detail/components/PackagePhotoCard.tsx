import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Camera, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/design-system';
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

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[48px] px-3 text-[15px] font-extrabold text-[var(--pd-blue)] hover:underline active:scale-95"
                >
                  {PackagesStrings.retakePhotoAction}
                </button>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="min-h-[48px] px-3 text-[15px] font-extrabold text-[var(--pd-bad)] hover:underline active:scale-95"
                >
                  {PackagesStrings.removePhotoAction}
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Tap-to-zoom modal */}
      {photoPreview && (
        <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
          <DialogContent className="max-w-lg p-2 bg-black border-none rounded-2xl overflow-hidden flex flex-col items-center">
            <div className="relative w-full max-h-[80vh] flex items-center justify-center">
              <img src={photoPreview} alt="Package full" className="max-w-full max-h-[75vh] object-contain rounded-lg" />
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
