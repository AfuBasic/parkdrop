import { useState } from 'react';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import type { LocalPackageMedia } from '@/offline/db/schema';

interface PackagePhotoCardProps {
  media: LocalPackageMedia | null;
  mediaPreviewUrl: string | null;
}

export function PackagePhotoCard({
  media,
  mediaPreviewUrl,
}: PackagePhotoCardProps) {
  const [isOpenModal, setIsOpenModal] = useState(false);

  if (!mediaPreviewUrl) {
    return (
      <div className="bg-surface-default rounded-[var(--radius-2xl)] border border-border-subtle p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-active flex items-center justify-center text-text-muted">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary text-sm">Parcel photo</h3>
            <p className="text-xs text-text-muted">No parcel photo attached</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface-default rounded-[var(--radius-2xl)] border border-border-subtle p-5 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-text-secondary" />
            <h3 className="font-bold text-text-primary text-sm">Parcel photo</h3>
          </div>
          {media?.status === 'SYNCED' && (
            <span className="text-[11px] font-medium text-status-success-text bg-status-success-bg px-2 py-0.5 rounded-full border border-status-success-border">
              Cloud synced
            </span>
          )}
          {media?.status === 'PENDING_UPLOAD' && (
            <span className="text-[11px] font-medium text-action-primary bg-action-primary/10 px-2 py-0.5 rounded-full border border-action-primary/20">
              Pending upload
            </span>
          )}
        </div>

        {/* Thumbnail Preview with tap to zoom */}
        <button
          type="button"
          onClick={() => setIsOpenModal(true)}
          className="relative w-full h-44 rounded-xl overflow-hidden bg-surface-active border border-border-subtle group cursor-pointer"
        >
          <img
            src={mediaPreviewUrl}
            alt="Parcel visual record"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
            Tap to view full photo
          </div>
        </button>
      </div>

      {/* Lightbox Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsOpenModal(false)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Close image preview"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={mediaPreviewUrl}
              alt="Parcel full photo"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </>
  );
}
