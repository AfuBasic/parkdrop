import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { Check, Camera, MessageSquare, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/features/auth/components/Logo';
import { BigButton } from '@/features/auth/components/BigButton';
import { processPackagePhoto } from '@/features/package-media/image-processing/process-package-photo';
import { PackageLifecycleRepository } from '@/offline/repositories/PackageLifecycleRepository';
import { db } from '@/offline/db/database';
import { AddPackageStrings } from '@/features/packages/add/strings';
import { UNDO_WINDOW_SECONDS } from '@/features/packages/add/config';

export interface PackageSavedScreenProps {
  packageId: string;
  publicPackageId: string;
  pickupCode: string;
  customerName: string;
  customerPhone: string;
  businessId: number;
  pickupPointName?: string | null;
  onNextPackage: () => void;
  onGoHome: () => void;
  onPackageVoided?: () => void;
  initialPhotoPreview?: string | null;
}

/**
 * Success screen rendered at `/packages/new/saved/:id`.
 *
 * Blue header with white logo & check badge, large parcel-label card (PD-XXXX, code, name, phone),
 * SMS status line, Next package primary action, photo capture, WhatsApp helper,
 * and a 10s undo window.
 */
export function PackageSavedScreen({
  packageId,
  publicPackageId,
  pickupCode,
  customerName,
  customerPhone,
  businessId,
  pickupPointName,
  onNextPackage,
  onGoHome,
  onPackageVoided,
  initialPhotoPreview = null,
}: PackageSavedScreenProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhotoPreview);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 10s Undo countdown
  const [undoSeconds, setUndoSeconds] = useState(UNDO_WINDOW_SECONDS);
  const [isVoided, setIsVoided] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);

  useEffect(() => {
    if (undoSeconds <= 0 || isVoided) return;
    const timer = setInterval(() => {
      setUndoSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [undoSeconds, isVoided]);

  // Photo handling
  const handlePhotoSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      const processedBlob = await processPackagePhoto(file, {
        maxLongEdge: 1024,
        quality: 0.7,
        outputFormat: 'image/jpeg',
      });

      const url = URL.createObjectURL(processedBlob);
      setPhotoPreview(url);

      // Save to local package media store without waiting or blocking
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
      console.error('Failed to process package photo:', err);
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      console.error('Failed to remove package media:', err);
    }
  };

  // WhatsApp link generator: https://wa.me/<234...>?text=<encoded message>
  const handleOpenWhatsApp = () => {
    // Normalize phone to country code without leading zero
    const cleanDigits = customerPhone.replace(/\D/g, '');
    const intlPhone = cleanDigits.startsWith('0')
      ? `234${cleanDigits.slice(1)}`
      : cleanDigits.startsWith('234')
      ? cleanDigits
      : `234${cleanDigits}`;

    const place = pickupPointName ? ` at ${pickupPointName}` : '';
    const message = `Hi ${customerName}, your parcel ${publicPackageId} has arrived${place}. Use code ${pickupCode} to collect it. - ParkDrop`;
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Undo action
  const handleUndo = async () => {
    if (isVoiding || isVoided) return;
    setIsVoiding(true);
    try {
      await PackageLifecycleRepository.cancelPackageLocally({
        businessId,
        pickupPointId: null,
        packageId,
        reason: 'CREATED_BY_MISTAKE',
        reasonNote: 'Undo from Add Package screen',
        actorName: 'Staff',
      });
      setIsVoided(true);
      onPackageVoided?.();
    } catch (err) {
      console.error('Failed to undo package:', err);
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--pd-page-2)] flex flex-col">
      {/* Blue Header with Logo & Success Circle */}
      <header className="bg-[var(--pd-blue)] text-white px-5 pt-4 pb-12 relative flex-none">
        <div className="mx-auto w-full max-w-[480px] flex items-center justify-between">
          <Logo tone="blue" />
        </div>

        <div className="mx-auto w-full max-w-[480px] mt-6 flex items-center gap-4">
          <div className="grid place-items-center w-14 h-14 rounded-full bg-white text-[var(--pd-ok)] shadow-md flex-none pd-check-pop">
            <Check className="w-8 h-8" strokeWidth={3.5} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-[28px] font-extrabold tracking-[-0.02em] leading-tight m-0 text-white">
              {AddPackageStrings.savedTitle}
            </h1>
            <p className="text-[16px] font-semibold text-white/90 m-0 mt-0.5">
              {AddPackageStrings.writeInstruction}
            </p>
          </div>
        </div>
      </header>

      {/* Sheet Content overlapping header */}
      <main className="flex-1 bg-[var(--pd-page-2)] -mt-6 rounded-t-[var(--pd-sheet-radius)] relative z-10 px-4 pb-8">
        <div className="mx-auto w-full max-w-[480px] flex flex-col gap-5 pt-2">
          {/* Parcel Label Card with Kraft Brown border accent */}
          <div className="rounded-[var(--pd-card-radius)] border-2 border-[#E2B46E] bg-white p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-[#CF9A4D]" />

            <div className="pl-2">
              <span className="text-[13px] font-extrabold uppercase tracking-wider text-[var(--pd-muted)]">
                Package ID
              </span>
              <div className="pd-nums text-[44px] font-extrabold text-[var(--pd-navy)] tracking-tight leading-none my-1">
                {publicPackageId}
              </div>

              <div className="mt-3 pt-3 border-t border-[var(--pd-line-2)] flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[18px] font-extrabold text-[var(--pd-navy)] truncate">
                    {customerName}
                  </span>
                  <span className="pd-nums text-[16px] font-semibold text-[var(--pd-muted)] flex-none">
                    {customerPhone}
                  </span>
                </div>

                <div className="mt-2 inline-flex items-center gap-2 bg-[var(--pd-tint)] px-3 py-1.5 rounded-lg self-start">
                  <span className="text-[14px] font-bold text-[var(--pd-blue-dark)]">
                    {AddPackageStrings.pickupCodeLabel}:
                  </span>
                  <span className="pd-nums text-[18px] font-extrabold text-[var(--pd-blue)] tracking-wider">
                    {pickupCode}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SMS Status Line */}
          <div className="flex items-center gap-2 text-[15px] font-bold px-1">
            <Check className="w-5 h-5 text-[var(--pd-ok)] flex-none" strokeWidth={2.75} />
            <span className="text-[var(--pd-ok)]">
              {AddPackageStrings.smsSent(customerPhone)}
            </span>
          </div>

          {/* Primary Action: Next Package */}
          <BigButton
            type="button"
            onClick={onNextPackage}
            className="w-full min-h-[60px] text-[20px]"
          >
            {AddPackageStrings.nextPackageAction}
          </BigButton>

          {/* Secondary Actions */}
          <div className="flex flex-col gap-3">
            {/* Photo Section */}
            {!photoPreview ? (
              <button
                type="button"
                disabled={isProcessingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'w-full min-h-[52px] px-4 rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-line)] bg-white',
                  'inline-flex items-center justify-center gap-2 text-[16px] font-extrabold text-[var(--pd-navy)]',
                  'hover:bg-[var(--pd-tint)] active:scale-[0.98] transition-transform'
                )}
              >
                {isProcessingPhoto ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--pd-blue)]" />
                ) : (
                  <Camera className="w-5 h-5 text-[var(--pd-blue)]" strokeWidth={2.5} />
                )}
                <span>{AddPackageStrings.addPhotoAction}</span>
              </button>
            ) : (
              <div className="rounded-[var(--pd-card-radius)] border border-[var(--pd-line)] bg-white p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={photoPreview}
                    alt="Package"
                    className="w-14 h-14 rounded-lg object-cover border border-[var(--pd-line)]"
                  />
                  <span className="text-[14px] font-bold text-[var(--pd-ok)]">Photo added</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[48px] px-3 text-[14px] font-extrabold text-[var(--pd-blue-hover)] hover:underline"
                  >
                    {AddPackageStrings.retakePhotoAction}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="min-h-[48px] px-3 text-[14px] font-extrabold text-[var(--pd-bad)] hover:underline"
                  >
                    {AddPackageStrings.removePhotoAction}
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            {/* Tell customer on WhatsApp */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className={cn(
                'w-full min-h-[52px] px-4 rounded-[var(--pd-field-radius)] border-2 border-[#BBF7D0] bg-[var(--pd-ok-bg)]',
                'inline-flex items-center justify-center gap-2 text-[16px] font-extrabold text-[var(--pd-ok)]',
                'hover:bg-[#DCFCE7] active:scale-[0.98] transition-transform'
              )}
            >
              <MessageSquare className="w-5 h-5" strokeWidth={2.5} />
              <span>{AddPackageStrings.whatsappAction}</span>
            </button>
          </div>

          {/* Undo countdown & Home link */}
          <div className="mt-4 flex flex-col items-center gap-3 text-center">
            {undoSeconds > 0 && !isVoided && (
              <button
                type="button"
                onClick={handleUndo}
                disabled={isVoiding}
                className="min-h-[48px] px-4 text-[16px] font-extrabold text-[var(--pd-bad)] hover:underline flex items-center gap-1.5"
              >
                {isVoiding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>{AddPackageStrings.undoCountdown(undoSeconds)}</span>
              </button>
            )}

            {isVoided && (
              <p className="text-[16px] font-extrabold text-[var(--pd-bad)] m-0">
                {AddPackageStrings.packageVoided}
              </p>
            )}

            <button
              type="button"
              onClick={onGoHome}
              className="min-h-[48px] px-4 text-[16px] font-extrabold text-[var(--pd-muted)] hover:text-[var(--pd-navy)] hover:underline"
            >
              {AddPackageStrings.goHome}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
