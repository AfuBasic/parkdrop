import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Building2, MapPin, Phone, Shield, Pencil, Check, X, AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { businessApi, type BusinessDetailsResponse } from '@/features/business/api/business-api';
import type { BusinessRole } from '@/features/business/permissions/business-permissions';
import { getBusinessPermissions } from '@/features/business/permissions/business-permissions';
import { validateNigerianMobile, toCanonicalPhone, formatPhoneDisplay } from '@/features/auth/lib/phone';
import { renderCustomerSms, SMS_MAX_CHARS } from '@/lib/smsTemplate';
import { SmsPreview } from '@/features/auth/components/SmsPreview';
import { verifyPin } from '@/lib/pin';
import { db } from '@/lib/db';
import { TaskHeader } from '@/design-system/shell/TaskHeader';
import { BusinessDetailsStrings } from '@/features/business/details/strings';

interface BusinessDetailsScreenProps {
  onBack?: () => void;
  mockData?: BusinessDetailsResponse;
  mockRole?: BusinessRole;
}

export const BusinessDetailsScreen: React.FC<BusinessDetailsScreenProps> = ({
  onBack,
  mockData,
  mockRole,
}) => {
  const routerNavigate = useNavigate();
  const handleBack = onBack ?? (() => routerNavigate({ to: '/more' }));
  const { role: contextRole, deviceMeta: contextDeviceMeta } = useAuth();
  const effectiveRole = (mockRole || contextRole || 'attendant') as BusinessRole;
  const permissions = getBusinessPermissions(effectiveRole);

  const [details, setDetails] = useState<BusinessDetailsResponse | null>(mockData || null);
  const [isLoading, setIsLoading] = useState(!mockData);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit business name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [businessNameInput, setBusinessNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Edit contact phone state
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (mockData) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await businessApi.getBusinessDetails();
      setDetails(res);
      setBusinessNameInput(res.business.name);
      if (res.current_pickup_point?.contact_phone) {
        setPhoneInput(formatPhoneDisplay(res.current_pickup_point.contact_phone));
      }
    } catch (err: any) {
      setErrorMessage(err.message || BusinessDetailsStrings.couldNotLoad);
    } finally {
      setIsLoading(false);
    }
  }, [mockData]);

  useEffect(() => {
    if (mockData) {
      setBusinessNameInput(mockData.business.name);
      if (mockData.current_pickup_point?.contact_phone) {
        setPhoneInput(formatPhoneDisplay(mockData.current_pickup_point.contact_phone));
      }
    } else {
      loadDetails();
    }
  }, [loadDetails, mockData]);

  const handleStartEditName = () => {
    if (!details) return;
    setBusinessNameInput(details.business.name);
    setEditError(null);
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    if (!details) return;
    setBusinessNameInput(details.business.name);
    setEditError(null);
    setIsEditingName(false);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = businessNameInput.trim();
    if (!cleanName || cleanName.length < 2) {
      setEditError(BusinessDetailsStrings.nameTooShort);
      return;
    }

    try {
      setIsSavingName(true);
      setEditError(null);
      await businessApi.updateBusinessName(cleanName);
      setDetails((prev) =>
        prev
          ? {
              ...prev,
              business: { ...prev.business, name: cleanName },
            }
          : null
      );
      setIsEditingName(false);
      setSuccessMessage(BusinessDetailsStrings.nameUpdated);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setEditError(err.message || BusinessDetailsStrings.couldNotUpdateName);
    } finally {
      setIsSavingName(false);
    }
  };

  // Start editing phone
  const handleStartEditPhone = () => {
    if (!details?.current_pickup_point) return;
    setPhoneInput(
      details.current_pickup_point.contact_phone
        ? formatPhoneDisplay(details.current_pickup_point.contact_phone)
        : ''
    );
    setPhoneError(null);
    setIsEditingPhone(true);
  };

  const handleCancelEditPhone = () => {
    setPhoneError(null);
    setIsEditingPhone(false);
    setIsVerifyingPin(false);
    setPinInput('');
    setPinError(null);
  };

  // User submits phone number form -> validate and prompt for PIN
  const handleProceedToPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);

    const validation = validateNigerianMobile(phoneInput);
    if (!validation.valid) {
      setPhoneError(validation.error || BusinessDetailsStrings.phoneInputHelp);
      return;
    }

    // Verify SMS character budget with this phone
    if (details?.current_pickup_point) {
      const pickupPointName = details.current_pickup_point.name;
      const parkName = details.current_pickup_point.park_name || 'Park';
      const canonicalPhone = toCanonicalPhone(phoneInput);
      if (!canonicalPhone) {
        setPhoneError(BusinessDetailsStrings.phoneInputHelp);
        return;
      }
      const displayPhone = formatPhoneDisplay(canonicalPhone);
      const result = renderCustomerSms({
        pickupPointName,
        parkName,
        code: 'ABCDEFG',
        phone: displayPhone,
      });
      if (!result.valid || result.length > SMS_MAX_CHARS) {
        setPhoneError(BusinessDetailsStrings.smsTooLong);
        return;
      }
    }

    // Open PIN verification dialog
    setPinInput('');
    setPinError(null);
    setIsVerifyingPin(true);
  };

  // Commit phone update after PIN verification
  const handleConfirmPinAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details?.current_pickup_point) return;
    setPinError(null);

    if (pinInput.length !== 4) {
      setPinError(BusinessDetailsStrings.pinIncomplete);
      return;
    }

    try {
      setIsSavingPhone(true);

      // Verify PIN against deviceMeta
      const meta = contextDeviceMeta || (await db.deviceMeta.toCollection().first());
      if (meta?.pin_hash && meta?.pin_salt) {
        const isValid = await verifyPin(pinInput, meta.pin_hash, meta.pin_salt);
        if (!isValid) {
          setPinError(BusinessDetailsStrings.pinWrong);
          setIsSavingPhone(false);
          return;
        }
      }

      // PIN is valid; send API update
      const canonical = toCanonicalPhone(phoneInput);
      const res = await businessApi.updatePickupPoint(details.current_pickup_point.id, {
        name: details.current_pickup_point.name,
        park_name: details.current_pickup_point.park_name,
        contact_phone: canonical,
      });

      setDetails((prev) =>
        prev
          ? {
              ...prev,
              current_pickup_point: {
                ...prev.current_pickup_point!,
                contact_phone: canonical,
                contact_phone_confirmed_at: res.pickup_point?.contact_phone_confirmed_at || new Date().toISOString(),
              },
            }
          : null
      );

      setIsVerifyingPin(false);
      setIsEditingPhone(false);
      setPinInput('');
      setSuccessMessage(BusinessDetailsStrings.phoneUpdated);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      if (err.status === 429 || err.message?.includes('3 times')) {
        setPinError(BusinessDetailsStrings.phoneChangeLimitReached);
      } else {
        setPinError(err.message || BusinessDetailsStrings.couldNotUpdatePhone);
      }
    } finally {
      setIsSavingPhone(false);
    }
  };

  // Live SMS Preview computation
  const currentPickupName = details?.current_pickup_point?.name || 'Shop name';
  const currentParkName = details?.current_pickup_point?.park_name || 'Central Park';
  const previewPhone = isEditingPhone
    ? validateNigerianMobile(phoneInput).valid
      ? formatPhoneDisplay(phoneInput)
      : null
    : details?.current_pickup_point?.contact_phone
    ? formatPhoneDisplay(details.current_pickup_point.contact_phone)
    : null;

  const previewSmsResult = renderCustomerSms({
    pickupPointName: currentPickupName,
    parkName: currentParkName,
    code: 'K7X9W2P',
    phone: previewPhone,
  });
  const previewSms = previewSmsResult.text;

  const cardClass = 'bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] p-5 shadow-sm flex flex-col gap-3';
  const labelClass = 'flex items-center gap-2 text-[15px] font-bold text-[var(--pd-muted)]';
  const editLinkClass = 'min-h-[48px] px-2 -mr-2 inline-flex items-center gap-1 text-[16px] font-extrabold text-[var(--pd-blue)] cursor-pointer';

  return (
    <div className="flex flex-col min-h-screen bg-[var(--pd-page-2)] w-full max-w-lg mx-auto pb-12">
      <TaskHeader title={BusinessDetailsStrings.title} onBack={handleBack} screenName="Business details" />

      <main className="flex-1 p-4 flex flex-col gap-4">
        {successMessage && (
          <div className="p-4 bg-[var(--pd-ok-bg)] border border-[var(--pd-ok)]/25 rounded-[var(--pd-card-radius)] flex items-center gap-2.5">
            <Check className="w-5 h-5 shrink-0 text-[var(--pd-ok)]" strokeWidth={2.25} aria-hidden="true" />
            <span className="text-[16px] font-semibold text-[var(--pd-ok)]">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-[var(--pd-bad-bg)] border border-[var(--pd-bad)]/25 rounded-[var(--pd-card-radius)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-[var(--pd-bad)]" strokeWidth={2.25} aria-hidden="true" />
              <span className="text-[15px] font-semibold text-[var(--pd-bad)]">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={loadDetails}
              className="min-h-[48px] px-3 text-[15px] font-extrabold text-[var(--pd-bad)] shrink-0 cursor-pointer"
            >
              {BusinessDetailsStrings.tryAgain}
            </button>
          </div>
        )}

        {isLoading && (
          <div className={`${cardClass} animate-pulse`}>
            <div className="h-4 bg-[var(--pd-line-2)] rounded w-1/3" />
            <div className="h-6 bg-[var(--pd-line-2)] rounded w-2/3" />
            <div className="h-4 bg-[var(--pd-line-2)] rounded w-1/4" />
            <div className="h-6 bg-[var(--pd-line-2)] rounded w-1/2" />
          </div>
        )}

        {!isLoading && details && (
          <div className="flex flex-col gap-4">
            {/* Business name */}
            <div className={cardClass}>
              <div className="flex items-center justify-between">
                <div className={labelClass}>
                  <Building2 className="w-5 h-5 text-[var(--pd-blue)]" strokeWidth={2.25} aria-hidden="true" />
                  <span>{BusinessDetailsStrings.businessName}</span>
                </div>
                {permissions.canEditBusinessDetails && !isEditingName && (
                  <button type="button" onClick={handleStartEditName} className={editLinkClass}>
                    <Pencil className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
                    <span>{BusinessDetailsStrings.edit}</span>
                  </button>
                )}
              </div>

              {!isEditingName ? (
                <div className="text-[18px] font-bold text-[var(--pd-navy)]">{details.business.name}</div>
              ) : (
                <form onSubmit={handleSaveName} className="flex flex-col gap-3">
                  {editError && (
                    <div className="text-[15px] font-semibold text-[var(--pd-bad)] bg-[var(--pd-bad-bg)] p-3 rounded-[var(--pd-field-radius)] border border-[var(--pd-bad)]/25">
                      {editError}
                    </div>
                  )}
                  <input
                    type="text"
                    value={businessNameInput}
                    onChange={(e) => setBusinessNameInput(e.target.value)}
                    required
                    autoFocus
                    className="w-full min-h-[var(--pd-field-h)] px-4 rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-blue)] text-[var(--pd-navy)] text-[18px] font-semibold focus:outline-none"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSavingName}
                      className="min-h-[48px] px-4 inline-flex items-center gap-1.5 bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] text-white text-[16px] font-extrabold rounded-[var(--pd-field-radius)] disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
                      <span>{isSavingName ? BusinessDetailsStrings.saving : BusinessDetailsStrings.save}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditName}
                      disabled={isSavingName}
                      className="min-h-[48px] px-4 inline-flex items-center gap-1.5 text-[var(--pd-muted)] text-[16px] font-extrabold cursor-pointer"
                    >
                      <X className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
                      <span>{BusinessDetailsStrings.cancel}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Pickup point */}
            <div className={cardClass}>
              <div className={labelClass}>
                <MapPin className="w-5 h-5 text-[var(--pd-ok)]" strokeWidth={2.25} aria-hidden="true" />
                <span>{BusinessDetailsStrings.pickupPoint}</span>
              </div>

              {details.current_pickup_point ? (
                <div className="flex flex-col gap-0.5">
                  <div className="text-[18px] font-bold text-[var(--pd-navy)]">
                    {details.current_pickup_point.name}
                  </div>
                  {details.current_pickup_point.park_name && (
                    <div className="text-[16px] font-semibold text-[var(--pd-muted)]">
                      {BusinessDetailsStrings.park}: {details.current_pickup_point.park_name}
                    </div>
                  )}
                  {details.current_pickup_point.address && (
                    <div className="text-[15px] text-[var(--pd-muted)] mt-0.5">
                      {details.current_pickup_point.address}
                    </div>
                  )}
                  {details.current_pickup_point.landmark && (
                    <div className="text-[15px] text-[var(--pd-muted)]">
                      {details.current_pickup_point.landmark}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[15px] font-semibold text-[var(--pd-muted)]">
                  {BusinessDetailsStrings.noPickupPoint}
                </div>
              )}
            </div>

            {/* Contact phone */}
            {details.current_pickup_point && (
              <div className={cardClass}>
                <div className="flex items-center justify-between">
                  <div className={labelClass}>
                    <Phone className="w-5 h-5 text-[var(--pd-blue)]" strokeWidth={2.25} aria-hidden="true" />
                    <span>{BusinessDetailsStrings.contactPhone}</span>
                  </div>
                  {permissions.canEditBusinessDetails && !isEditingPhone && (
                    <button type="button" onClick={handleStartEditPhone} className={editLinkClass}>
                      <Pencil className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
                      <span>
                        {details.current_pickup_point.contact_phone
                          ? BusinessDetailsStrings.edit
                          : BusinessDetailsStrings.add}
                      </span>
                    </button>
                  )}
                </div>

                {!isEditingPhone ? (
                  <div className="flex flex-col gap-2">
                    {details.current_pickup_point.contact_phone ? (
                      <div className="text-[18px] font-bold text-[var(--pd-navy)] tracking-wide">
                        {formatPhoneDisplay(details.current_pickup_point.contact_phone)}
                      </div>
                    ) : (
                      <div className="text-[15px] font-semibold text-[var(--pd-warn)] bg-[var(--pd-warn-bg)] p-3 rounded-[var(--pd-field-radius)] border border-[var(--pd-warn)]/25">
                        {BusinessDetailsStrings.noPhoneYet}
                      </div>
                    )}
                    <p className="text-[15px] text-[var(--pd-muted)] m-0">
                      {BusinessDetailsStrings.phoneHelperText}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleProceedToPin} className="flex flex-col gap-4">
                    {phoneError && (
                      <div className="text-[15px] font-semibold text-[var(--pd-bad)] bg-[var(--pd-bad-bg)] p-3 rounded-[var(--pd-field-radius)] border border-[var(--pd-bad)]/25">
                        {phoneError}
                      </div>
                    )}
                    <div>
                      <label className="block text-[16px] font-semibold text-[var(--pd-navy)] mb-1.5">
                        {BusinessDetailsStrings.phoneLabel}
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="0803 123 4567"
                        required
                        autoFocus
                        className="w-full min-h-[var(--pd-field-h)] px-4 rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-blue)] text-[var(--pd-navy)] text-[18px] font-semibold focus:outline-none"
                      />
                      <p className="text-[15px] text-[var(--pd-muted)] mt-1.5 m-0">
                        {BusinessDetailsStrings.phoneInputHelp}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[var(--pd-line-2)]">
                      <SmsPreview message={previewSms} highlight={previewPhone ? [previewPhone] : []} />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        className="min-h-[48px] px-4 inline-flex items-center gap-1.5 bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] text-white text-[16px] font-extrabold rounded-[var(--pd-field-radius)] cursor-pointer"
                      >
                        <Lock className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
                        <span>{BusinessDetailsStrings.continueWithPin}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditPhone}
                        className="min-h-[48px] px-4 inline-flex items-center gap-1.5 text-[var(--pd-muted)] text-[16px] font-extrabold cursor-pointer"
                      >
                        <X className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
                        <span>{BusinessDetailsStrings.cancel}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Role */}
            <div className={cardClass}>
              <div className={labelClass}>
                <Shield className="w-5 h-5 text-[var(--pd-blue)]" strokeWidth={2.25} aria-hidden="true" />
                <span>{BusinessDetailsStrings.yourRole}</span>
              </div>
              <p className="text-[16px] font-semibold text-[var(--pd-navy)] m-0">
                {BusinessDetailsStrings.roleBody[effectiveRole] ?? BusinessDetailsStrings.roleBody.attendant}
              </p>
            </div>
          </div>
        )}

        {isVerifyingPin && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pin-modal-title"
          >
            <div className="bg-white w-full max-w-sm rounded-[var(--pd-sheet-radius)] shadow-xl border border-[var(--pd-line-2)] p-6 flex flex-col gap-4">
              <div className="text-center flex flex-col items-center gap-1.5">
                <div className="w-11 h-11 rounded-full bg-[var(--pd-tint)] flex items-center justify-center text-[var(--pd-blue)] mb-1">
                  <Lock className="w-5 h-5" strokeWidth={2.25} aria-hidden="true" />
                </div>
                <h3 id="pin-modal-title" className="text-[18px] font-extrabold text-[var(--pd-navy)] m-0">
                  {BusinessDetailsStrings.pinTitle}
                </h3>
                <p className="text-[15px] font-semibold text-[var(--pd-muted)] m-0">
                  {BusinessDetailsStrings.pinBody}
                </p>
              </div>

              <form onSubmit={handleConfirmPinAndSave} className="flex flex-col gap-4">
                {pinError && (
                  <div className="text-[15px] font-semibold text-[var(--pd-bad)] bg-[var(--pd-bad-bg)] p-3 rounded-[var(--pd-field-radius)] border border-[var(--pd-bad)]/25">
                    {pinError}
                  </div>
                )}

                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  autoFocus
                  required
                  placeholder="••••"
                  className="w-full text-center tracking-[1em] text-[25px] font-bold py-3 rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-line)] focus:outline-none focus:border-[var(--pd-blue)]"
                />

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVerifyingPin(false);
                      setPinInput('');
                      setPinError(null);
                    }}
                    disabled={isSavingPhone}
                    className="flex-1 min-h-[56px] text-[16px] font-extrabold text-[var(--pd-navy)] bg-[var(--pd-page-2)] rounded-[var(--pd-field-radius)] cursor-pointer"
                  >
                    {BusinessDetailsStrings.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPhone || pinInput.length !== 4}
                    className="flex-1 min-h-[56px] text-[16px] font-extrabold text-white bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] rounded-[var(--pd-field-radius)] disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingPhone ? BusinessDetailsStrings.verifying : BusinessDetailsStrings.confirmAndSave}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
