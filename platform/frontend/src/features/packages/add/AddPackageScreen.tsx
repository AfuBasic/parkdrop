import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Camera, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useKeyboardOpen } from '@/features/auth/lib/useKeyboardOpen';
import { toNationalDigits, isCompletePhone, toE164 } from '@/features/auth/lib/phone';
import { BigButton } from '@/features/auth/components/BigButton';
import { TextField } from '@/features/auth/components/TextField';
import { Notice } from '@/features/auth/components/Notice';
import { PackageRepository } from '@/offline/repositories/PackageRepository';
import { CustomerRepository } from '@/offline/repositories/CustomerRepository';
import { CustomerDirectoryRepository } from '@/features/customers/services/CustomerDirectoryRepository';
import { db } from '@/offline/db/database';
import type { LocalPackage } from '@/offline/db/schema';
import { processPackagePhoto } from '@/features/package-media/image-processing/process-package-photo';
import { AddPackageHeader } from '@/features/packages/add/components/AddPackageHeader';
import { PhoneInputGroup } from '@/features/packages/add/components/PhoneInputGroup';
import { CustomerSuggestionsList } from '@/features/packages/add/components/CustomerSuggestionsList';
import { CustomerMatchChip } from '@/features/packages/add/components/CustomerMatchChip';
import { AmountInputGroup } from '@/features/packages/add/components/AmountInputGroup';
import { AmountChips } from '@/features/packages/add/components/AmountChips';
import { DiscardConfirmDialog } from '@/features/packages/add/components/DiscardConfirmDialog';
import { PackageSavedScreen } from '@/features/packages/add/components/PackageSavedScreen';
import { useCustomerLookup, type CustomerSuggestion } from '@/features/packages/add/hooks/useCustomerLookup';
import { useRecentAmounts } from '@/features/packages/add/hooks/useRecentAmounts';
import { AddPackageStrings } from '@/features/packages/add/strings';
import { REQUIRE_CUSTOMER_NAME } from '@/features/packages/add/config';

export interface AddPackageScreenProps {
  onNavigate?: (path: string) => void;
  onBack?: () => void;
  initialCustomerId?: string | null;
  initialPhone?: string | null;
}

/**
 * Re-architected Add Package flow: ONE screen with progressive reveal,
 * thumb-first layout, and instant offline save to PackageSavedScreen.
 */
export function AddPackageScreen({
  onNavigate,
  onBack,
  initialCustomerId,
  initialPhone,
}: AddPackageScreenProps) {
  const routerNavigate = useNavigate();
  const handleNavigate = onNavigate ?? ((path: string) => routerNavigate({ to: path as any }));
  const handleBack = onBack ?? (() => {
    if (initialCustomerId) {
      routerNavigate({ to: '/customers/$customerId', params: { customerId: initialCustomerId } });
    } else {
      routerNavigate({ to: '/' });
    }
  });

  const { business } = useAuth();
  const businessId = business?.id || 0;
  const activePoint = business?.pickup_points?.find((p) => p.status === 'active')
    ?? business?.pickup_points?.[0];
  const pickupPointId = activePoint?.id ?? null;
  const pickupPointName = activePoint?.name ?? business?.name ?? null;

  const keyboardOpen = useKeyboardOpen();

  // Form State
  const [phone, setPhone] = React.useState('');
  const [name, setName] = React.useState('');
  const [amountRaw, setAmountRaw] = React.useState('');
  const [matchedCustomer, setMatchedCustomer] = React.useState<CustomerSuggestion | null>(null);
  const [userChangedCustomer, setUserChangedCustomer] = React.useState(false);

  // Errors & UI state
  const [phoneError, setPhoneError] = React.useState<string | null>(null);
  const [amountError, setAmountError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);

  // Optional Photo State
  const [photoBlob, setPhotoBlob] = React.useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Success state
  const [savedPackage, setSavedPackage] = React.useState<LocalPackage | null>(null);

  // Input refs for focus transitions
  const phoneRef = React.useRef<HTMLInputElement>(null);
  const nameRef = React.useRef<HTMLInputElement>(null);
  const amountRef = React.useRef<HTMLInputElement>(null);

  // Lookup customer suggestions and exact matches
  const lookup = useCustomerLookup(businessId, phone);
  // Quick amount chips
  const recentAmounts = useRecentAmounts(businessId, pickupPointId);

  // Auto-focus phone input on initial mount
  React.useEffect(() => {
    phoneRef.current?.focus();
  }, []);

  // Pre-load if initialPhone is provided
  React.useEffect(() => {
    if (initialPhone) {
      setPhone(toNationalDigits(initialPhone));
    }
  }, [initialPhone]);

  // Pre-load if initialCustomerId is provided
  React.useEffect(() => {
    if (!initialCustomerId || !businessId) return;
    let cancelled = false;

    async function loadPreselected() {
      try {
        const canonicalId = await CustomerDirectoryRepository.resolveCanonicalCustomerId(initialCustomerId!);
        const found = await db.customers.get(canonicalId);
        if (found && found.business_id === businessId && !cancelled) {
          setPhone(toNationalDigits(found.phone_display));
          setName(found.name);
          setMatchedCustomer({
            customer: found,
            collectedCount: 0,
            waitingCount: 0,
          });
        }
      } catch (err) {
        console.error('Failed to preselect customer:', err);
      }
    }

    loadPreselected();
    return () => {
      cancelled = true;
    };
  }, [initialCustomerId, businessId]);

  // Handle exact match updates from lookup
  React.useEffect(() => {
    if (!userChangedCustomer && lookup.exactMatch) {
      setMatchedCustomer(lookup.exactMatch);
      setName(lookup.exactMatch.customer.name);
    } else if (!lookup.exactMatch && !userChangedCustomer && isCompletePhone(phone)) {
      setMatchedCustomer(null);
    }
  }, [lookup.exactMatch, userChangedCustomer, phone]);

  // Handle phone changes
  const handlePhoneChange = (digits: string) => {
    setPhone(digits);
    setPhoneError(null);
    setUserChangedCustomer(false);
    if (digits.length !== 10) {
      setMatchedCustomer(null);
    }
  };

  // Suggestion tap handler
  const handleSelectSuggestion = (suggestion: CustomerSuggestion) => {
    setPhone(toNationalDigits(suggestion.customer.phone_display));
    setName(suggestion.customer.name);
    setMatchedCustomer(suggestion);
    setUserChangedCustomer(false);
    // Jump focus to amount
    setTimeout(() => amountRef.current?.focus(), 50);
  };

  // Change matched customer handler
  const handleChangeCustomer = () => {
    setUserChangedCustomer(true);
    setMatchedCustomer(null);
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  // Amount chip tap handler
  const handleSelectAmountChip = (minor: number) => {
    const naira = Math.round(minor / 100);
    setAmountRaw(String(naira));
    setAmountError(null);
  };

  // Optional Photo Handlers
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      const processedBlob = await processPackagePhoto(file, {
        maxLongEdge: 1024,
        quality: 0.7,
        outputFormat: 'image/jpeg',
      });
      setPhotoBlob(processedBlob);
      const url = URL.createObjectURL(processedBlob);
      setPhotoPreview(url);
    } catch (err) {
      console.error('Failed to process package photo:', err);
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    setPhotoBlob(null);
  };

  // Save action
  const handleSavePackage = async () => {
    // 1. Phone validation
    if (!isCompletePhone(phone)) {
      setPhoneError(AddPackageStrings.phoneErrorMissing);
      phoneRef.current?.focus();
      return;
    }

    // 2. Amount validation
    if (amountRaw.trim() === '') {
      setAmountError(AddPackageStrings.amountErrorMissing);
      amountRef.current?.focus();
      return;
    }

    const amountNumber = Number(amountRaw);
    if (isNaN(amountNumber) || amountNumber < 0) {
      setAmountError(AddPackageStrings.amountErrorMissing);
      amountRef.current?.focus();
      return;
    }

    // 3. Name check (if required by config)
    if (REQUIRE_CUSTOMER_NAME && !name.trim()) {
      nameRef.current?.focus();
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Find or create customer silently
      const e164 = toE164(phone) || `+234${phone}`;
      let customerId = matchedCustomer?.customer.id;

      if (!customerId) {
        const existing = await CustomerRepository.findByNormalizedPhone(businessId, e164);
        if (existing) {
          customerId = existing.id;
        } else {
          const finalName = name.trim() || `0${phone}`;
          const newCust = await CustomerRepository.createLocal(
            businessId,
            finalName,
            `0${phone}`,
            pickupPointId
          );
          customerId = newCust.id;
        }
      }

      // Convert amount to minor units (Kobo)
      const amountDueMinor = Math.round(amountNumber * 100);

      // Save package locally and queue mutation immediately (includes optional photoBlob if taken)
      const result = await PackageRepository.createLocal(
        businessId,
        pickupPointId,
        customerId,
        amountDueMinor,
        true, // sendSms
        photoBlob
      );

      setSavedPackage(result.package);
    } catch (err) {
      console.error('Failed to save package locally:', err);
      setSaveError('Could not save package. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form for "Next package"
  const handleNextPackage = () => {
    setSavedPackage(null);
    setPhone('');
    setName('');
    setAmountRaw('');
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    setPhotoBlob(null);
    setMatchedCustomer(null);
    setUserChangedCustomer(false);
    setPhoneError(null);
    setAmountError(null);
    setSaveError(null);
    setTimeout(() => {
      phoneRef.current?.focus();
    }, 50);
  };

  // Close attempt with unsaved data check
  const handleClose = () => {
    const hasTypedData = phone.length > 0 || name.length > 0 || amountRaw.length > 0 || photoBlob !== null;
    if (hasTypedData && !savedPackage) {
      setShowDiscardConfirm(true);
    } else {
      handleBack();
    }
  };

  const handleConfirmLeave = () => {
    setShowDiscardConfirm(false);
    handleBack();
  };

  // If saved, render full Success screen
  if (savedPackage) {
    return (
      <PackageSavedScreen
        packageId={savedPackage.id}
        publicPackageId={savedPackage.public_package_id}
        pickupCode={savedPackage.pickup_code}
        customerName={name.trim() || `0${phone}`}
        customerPhone={`0${phone}`}
        businessId={businessId}
        pickupPointName={pickupPointName}
        onNextPackage={handleNextPackage}
        onGoHome={() => handleNavigate('/')}
        onPackageVoided={() => handleNavigate('/')}
        initialPhotoPreview={photoPreview}
      />
    );
  }

  const digitsCount = phone.length;
  const isComplete = isCompletePhone(phone);
  const showSuggestions = !isComplete && digitsCount >= 3 && lookup.suggestions.length > 0;
  const showWhoSection = isComplete || matchedCustomer !== null;

  // Amount parsing for chips selection indicator
  const currentMinor = amountRaw.trim() !== '' ? Math.round(Number(amountRaw) * 100) : null;

  return (
    <div className="h-[100dvh] overflow-hidden bg-[var(--pd-page)] flex flex-col">
      <div className="relative w-full h-full min-h-0 flex flex-col bg-[var(--pd-blue)] overflow-hidden">
        {/* Blue Header */}
        <AddPackageHeader onClose={handleClose} collapsed={keyboardOpen} />

        {/* White Sheet with 28px rounded top corners */}
        <div className="relative flex-1 bg-[var(--pd-page-2)] rounded-t-[var(--pd-sheet-radius)] overflow-hidden flex flex-col -mt-4 shadow-sm">
          {/* Scrollable Form Content */}
          <main className="flex-1 overflow-y-auto px-4 pt-5 pb-6">
            <div className="mx-auto w-full max-w-[480px] flex flex-col gap-4">
              {/* 1. Phone Input */}
              <PhoneInputGroup
                inputRef={phoneRef}
                value={phone}
                onChange={handlePhoneChange}
                onClear={() => handlePhoneChange('')}
                error={phoneError || undefined}
                onSubmitRequested={() => {
                  if (isComplete) {
                    if (matchedCustomer) amountRef.current?.focus();
                    else nameRef.current?.focus();
                  }
                }}
              />

              {/* Suggestions List (3 <= digits < 11) */}
              {showSuggestions && (
                <CustomerSuggestionsList
                  suggestions={lookup.suggestions}
                  onSelect={handleSelectSuggestion}
                  className="-mt-2"
                />
              )}

              {/* 2. Who Section (Match Chip or Name Field) */}
              {showWhoSection && (
                <>
                  {matchedCustomer ? (
                    <CustomerMatchChip
                      match={matchedCustomer}
                      onChangeRequested={handleChangeCustomer}
                    />
                  ) : (
                    <TextField
                      ref={nameRef}
                      label={AddPackageStrings.nameLabel}
                      placeholder={AddPackageStrings.namePlaceholder}
                      value={name}
                      autoComplete="off"
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          amountRef.current?.focus();
                        }
                      }}
                      clearable
                      onClear={() => setName('')}
                    />
                  )}
                </>
              )}

              {/* 3. Amount Section & Quick Chips */}
              <div className="flex flex-col gap-3">
                <AmountInputGroup
                  inputRef={amountRef}
                  value={amountRaw}
                  onChange={(val) => {
                    setAmountRaw(val);
                    setAmountError(null);
                  }}
                  error={amountError || undefined}
                  onSubmitRequested={handleSavePackage}
                />

                <AmountChips
                  lastAmountMinor={recentAmounts.lastAmountMinor}
                  frequentAmountsMinor={recentAmounts.frequentAmountsMinor}
                  selectedAmountMinor={currentMinor}
                  onSelectAmount={handleSelectAmountChip}
                />
              </div>

              {/* 4. Optional Package Photo */}
              <div className="flex flex-col gap-1.5">
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
                    disabled={isProcessingPhoto}
                    className="w-full min-h-[48px] px-3 py-2 rounded-[var(--pd-field-radius)] border border-dashed border-[var(--pd-line)] bg-[var(--pd-page)] inline-flex items-center justify-center gap-2 text-[15px] font-bold text-[var(--pd-blue)] hover:bg-[var(--pd-tint)] active:scale-[0.98] transition-transform"
                  >
                    {isProcessingPhoto ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--pd-blue)]" />
                    ) : (
                      <Camera className="w-4 h-4 text-[var(--pd-blue)]" strokeWidth={2.5} />
                    )}
                    <span>{AddPackageStrings.photoLabel}</span>
                  </button>
                ) : (
                  <div className="rounded-[var(--pd-field-radius)] border border-[var(--pd-line)] bg-white p-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={photoPreview}
                        alt="Package preview"
                        className="w-12 h-12 rounded-lg object-cover border border-[var(--pd-line)]"
                      />
                      <span className="text-[14px] font-bold text-[var(--pd-ok)]">Photo added</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[48px] px-2 text-[14px] font-extrabold text-[var(--pd-blue-hover)] hover:underline"
                      >
                        {AddPackageStrings.retakePhotoFormAction}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="min-h-[48px] px-2 text-[14px] font-extrabold text-[var(--pd-bad)] hover:underline"
                      >
                        {AddPackageStrings.removePhotoFormAction}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Non-blocking Duplicate Waiting Notice */}
              {lookup.waitingPackagesCount > 0 && (
                <Notice tone="warning">
                  {AddPackageStrings.duplicateWaitingWarning(
                    matchedCustomer?.customer.name || name.trim() || 'This customer',
                    lookup.waitingPackagesCount
                  )}
                </Notice>
              )}

              {/* Save Error Notice */}
              {saveError && (
                <Notice tone="error" live>
                  {saveError}
                </Notice>
              )}
            </div>
          </main>

          {/* Pinned Save Button Foot above Keyboard */}
          <footer className="flex-none p-4 bg-white border-t border-[var(--pd-line-2)] z-20">
            <div className="mx-auto w-full max-w-[480px]">
              <BigButton
                type="button"
                onClick={handleSavePackage}
                busy={isSaving}
                busyLabel={AddPackageStrings.savingAction}
                className="w-full min-h-[60px] text-[20px]"
              >
                {AddPackageStrings.saveAction}
              </BigButton>
            </div>
          </footer>
        </div>
      </div>

      {/* Discard Confirmation Dialog */}
      <DiscardConfirmDialog
        open={showDiscardConfirm}
        onStay={() => setShowDiscardConfirm(false)}
        onLeave={handleConfirmLeave}
      />
    </div>
  );
}
