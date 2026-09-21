import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Building2, MapPin, Shield, Edit3, Check, X, AlertCircle } from 'lucide-react';
import { useAuth } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/auth/AuthContext';
import { businessApi, type BusinessDetailsResponse } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/api/business-api';
import type { BusinessRole } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/permissions/business-permissions';
import { getBusinessPermissions } from '/Library/WebServer/Documents/projects/parkdrop/platform/frontend/src/features/business/permissions/business-permissions';

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
  const { role: contextRole } = useAuth();
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

  const loadDetails = useCallback(async () => {
    if (mockData) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await businessApi.getBusinessDetails();
      setDetails(res);
      setBusinessNameInput(res.business.name);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not load business details. Check connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [mockData]);

  useEffect(() => {
    if (mockData) {
      setBusinessNameInput(mockData.business.name);
    } else {
      loadDetails();
    }
  }, [loadDetails, mockData]);

  const handleStartEdit = () => {
    if (!details) return;
    setBusinessNameInput(details.business.name);
    setEditError(null);
    setIsEditingName(true);
  };

  const handleCancelEdit = () => {
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
    } catch (err: any) {
      setEditError(err.message || 'Could not update business name. Try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  const roleDisplay = effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1);

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
                    onClick={handleStartEdit}
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
                      onClick={handleCancelEdit}
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
            <div className="bg-white rounded-2xl border border-border-subtle p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Current Pickup Point</span>
              </div>

              {details.current_pickup_point ? (
                <div>
                  <div className="text-base font-bold text-slate-900">
                    {details.current_pickup_point.name}
                  </div>
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
      </main>
    </div>
  );
};
