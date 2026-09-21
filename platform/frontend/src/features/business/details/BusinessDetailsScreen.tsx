import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Building2, MapPin, Phone, Shield, Edit3, Check, X, AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { businessApi, type BusinessDetailsResponse } from '@/features/business/api/business-api';
import type { BusinessRole } from '@/features/business/permissions/business-permissions';
import { getBusinessPermissions } from '@/features/business/permissions/business-permissions';
import { validateNigerianMobile, toCanonicalPhone, formatPhoneDisplay } from '@/features/auth/lib/phone';
import { renderCustomerSms, SMS_MAX_CHARS } from '@/lib/smsTemplate';
import { SmsPreview } from '@/features/auth/components/SmsPreview';
import { verifyPin } from '@/lib/pin';
import { db } from '@/lib/db';

interface BusinessDetailsScreenProps {
  onBack: () => void;
  mockData?: BusinessDetailsResponse;
  mockRole?: BusinessRole;
}

export const BusinessDetailsScreen: React.FC<BusinessDetailsScreenProps> = ({
  onBack,
  mockData,
  mockRole,
}) => {
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
      setErrorMessage(err.message || 'Could not load business details. Check connection and try again.');
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
      setEditError('Business name must be at least 2 characters.');
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
      setSuccessMessage('Business name updated.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setEditError(err.message || 'Could not update business name. Try again.');
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
      setPhoneError(validation.error || 'Enter a valid 11-digit phone number.');
      return;
    }

    // Verify SMS character budget with this phone
    if (details?.current_pickup_point) {
      const pickupPointName = details.current_pickup_point.name;
      const parkName = details.current_pickup_point.park_name || 'Park';
      const canonicalPhone = toCanonicalPhone(phoneInput);
      const displayPhone = formatPhoneDisplay(canonicalPhone);
      const result = renderCustomerSms({
        pickupPointName,
        parkName,
        code: 'ABCDEFG',
        phone: displayPhone,
      });
      if (!result.valid || result.length > SMS_MAX_CHARS) {
        setPhoneError('This phone number makes the SMS too long. Please contact support.');
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
      setPinError('Enter your 4-digit PIN.');
      return;
    }

    try {
      setIsSavingPhone(true);

      // Verify PIN against deviceMeta
      const meta = contextDeviceMeta || (await db.deviceMeta.toCollection().first());
      if (meta?.pin_hash && meta?.pin_salt) {
        const isValid = await verifyPin(pinInput, meta.pin_hash, meta.pin_salt);
        if (!isValid) {
          setPinError('Wrong PIN. Try again.');
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
      setSuccessMessage('Shop phone number updated.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      if (err.status === 429 || err.message?.includes('3 times')) {
        setPinError('You have changed this number 3 times today. Please try again tomorrow.');
      } else {
        setPinError(err.message || 'Could not update phone number. Check connection.');
      }
    } finally {
      setIsSavingPhone(false);
    }
  };

  const roleDisplay = effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1);

  // Live SMS Preview computation
  const currentPickupName = details?.current_pickup_point?.name || 'Shop Name';
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 w-full max-w-lg mx-auto pb-12">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border-subtle px-4 h-14 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-slate-600 hover:text-slate-900 transition-colors py-2 pr-4 -ml-2 min-h-[44px] cursor-pointer"
          aria-label="Back to more menu"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-[17px] font-medium ml-0.5">Back</span>
        </button>
        <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">
          Business details
        </h1>
        <div className="w-12" />
      </header>

      {/* Content */}
      <main className="flex-1 p-4 space-y-6">
        {/* Success toast */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 animate-in fade-in duration-200">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-xs text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={loadDetails}
              className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg shrink-0 cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-border-subtle p-6 space-y-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-6 bg-slate-100 rounded w-2/3" />
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-6 bg-slate-100 rounded w-1/2" />
          </div>
        )}

        {/* Details Cards */}
        {!isLoading && details && (
          <div className="space-y-4">
            {/* Business Information */}
            <div className="bg-white rounded-2xl border border-border-subtle p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Business Name</span>
                </div>
                {permissions.canEditBusinessDetails && !isEditingName && (
                  <button
                    type="button"
                    onClick={handleStartEditName}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 p-1 cursor-pointer"
                    aria-label="Edit business name"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {!isEditingName ? (
                <div className="text-lg font-bold text-slate-900">
                  {details.business.name}
                </div>
              ) : (
                <form onSubmit={handleSaveName} className="space-y-3">
                  {editError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                      {editError}
                    </div>
                  )}
                  <input
                    type="text"
                    value={businessNameInput}
                    onChange={(e) => setBusinessNameInput(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl border border-blue-500 text-slate-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isSavingName}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 min-h-[38px] cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSavingName ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditName}
                      disabled={isSavingName}
                      className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg min-h-[38px] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Current Pickup Point Context */}
            <div className="bg-white rounded-2xl border border-border-subtle p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Current Pickup Point</span>
                </div>
              </div>

              {details.current_pickup_point ? (
                <div>
                  <div className="text-base font-bold text-slate-900">
                    {details.current_pickup_point.name}
                  </div>
                  {details.current_pickup_point.park_name && (
                    <div className="text-xs font-medium text-slate-600 mt-0.5">
                      Park: {details.current_pickup_point.park_name}
                    </div>
                  )}
                  {details.current_pickup_point.address && (
                    <div className="text-xs text-slate-500 mt-1">
                      {details.current_pickup_point.address}
                    </div>
                  )}
                  {details.current_pickup_point.landmark && (
                    <div className="text-xs text-slate-400 mt-0.5">
                      Landmark: {details.current_pickup_point.landmark}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  No pickup point registered for this Business.
                </div>
              )}
            </div>

            {/* Shop Contact Phone for Customer SMS */}
            {details.current_pickup_point && (
              <div className="bg-white rounded-2xl border border-border-subtle p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span>Customer Contact Phone</span>
                  </div>
                  {permissions.canEditBusinessDetails && !isEditingPhone && (
                    <button
                      type="button"
                      onClick={handleStartEditPhone}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 p-1 cursor-pointer"
                      aria-label="Edit contact phone"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{details.current_pickup_point.contact_phone ? 'Edit' : 'Add'}</span>
                    </button>
                  )}
                </div>

                {!isEditingPhone ? (
                  <div className="space-y-2">
                    {details.current_pickup_point.contact_phone ? (
                      <div className="text-base font-bold text-slate-900 tracking-wider">
                        {formatPhoneDisplay(details.current_pickup_point.contact_phone)}
                      </div>
                    ) : (
                      <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                        No phone number added yet. Customers receive arrival SMS without a call line.
                      </div>
                    )}
                    <p className="text-xs text-slate-500">
                      This number is printed on customer arrival SMS so customers can call your shop.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleProceedToPin} className="space-y-4">
                    {phoneError && (
                      <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                        {phoneError}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone number
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="0803 123 4567"
                        required
                        autoFocus
                        className="w-full px-3.5 py-2.5 rounded-xl border border-blue-500 text-slate-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Enter an 11-digit Nigerian mobile number.
                      </p>
                    </div>

                    {/* Live SMS Preview */}
                    <div className="pt-2 border-t border-slate-100">
                      <SmsPreview
                        message={previewSms}
                        highlight={previewPhone ? [previewPhone] : []}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg min-h-[38px] cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Continue with PIN</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditPhone}
                        className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg min-h-[38px] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Current Access Role */}
            <div className="bg-white rounded-2xl border border-border-subtle p-5 shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Your Role</span>
              </div>
              <div className="text-base font-bold text-slate-900">
                {roleDisplay}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {effectiveRole === 'owner'
                  ? 'You have full administration access over this Business.'
                  : effectiveRole === 'manager'
                  ? 'You can view staff and perform operational actions.'
                  : 'You have attendant operational access.'}
              </p>
            </div>
          </div>
        )}

        {/* PIN Verification Modal */}
        {isVerifyingPin && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pin-modal-title"
          >
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 id="pin-modal-title" className="text-base font-bold text-slate-900">
                  Enter your 4-digit PIN
                </h3>
                <p className="text-xs text-slate-500">
                  Confirm your PIN to update the shop contact phone number. (Max 3 changes per day).
                </p>
              </div>

              <form onSubmit={handleConfirmPinAndSave} className="space-y-4">
                {pinError && (
                  <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
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
                  className="w-full text-center tracking-[1em] text-2xl font-bold py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVerifyingPin(false);
                      setPinInput('');
                      setPinError(null);
                    }}
                    disabled={isSavingPhone}
                    className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl min-h-[44px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPhone || pinInput.length !== 4}
                    className="flex-1 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 min-h-[44px] cursor-pointer"
                  >
                    {isSavingPhone ? 'Verifying...' : 'Confirm & Save'}
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
