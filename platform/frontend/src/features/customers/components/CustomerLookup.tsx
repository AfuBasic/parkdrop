import { useState, useEffect } from 'react';
import { CheckCircle2, Search, UserPlus } from 'lucide-react';
import { normalizePhone, formatPhoneForDisplay } from '../../../offline/helpers/phoneNormalizer';
import { CustomerRepository } from '../../../offline/repositories/CustomerRepository';
import type { LocalCustomer } from '../../../offline/db/schema';

export interface CustomerSelection {
  customerId: string;
  name: string;
  phoneDisplay: string;
  phoneNormalized: string;
  syncStatus: string;
}

interface CustomerLookupProps {
  businessId: number;
  pickupPointId: number | null;
  onCustomerSelected: (customer: CustomerSelection) => void;
}

export function CustomerLookup({ businessId, pickupPointId, onCustomerSelected }: CustomerLookupProps) {
  const [phoneInput, setPhoneInput] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState<string | null>(null);
  
  const [existingCustomer, setExistingCustomer] = useState<LocalCustomer | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [invalidPhone, setInvalidPhone] = useState(false);

  const [newNameInput, setNewNameInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Debounce phone normalization & lookup
  useEffect(() => {
    // Only check if it looks like a somewhat complete Nigerian number
    // Strip non-digits
    const digits = phoneInput.replace(/[^\d+]/g, '');
    if (digits.length < 10) {
      setNormalizedPhone(null);
      setExistingCustomer(null);
      setInvalidPhone(false);
      return;
    }

    const timer = setTimeout(async () => {
      const normalized = normalizePhone(phoneInput);
      setNormalizedPhone(normalized);

      if (normalized) {
        setInvalidPhone(false);
        setIsSearching(true);
        try {
          const customer = await CustomerRepository.findByNormalizedPhone(businessId, normalized);
          setExistingCustomer(customer || null);
        } finally {
          setIsSearching(false);
        }
      } else {
        setExistingCustomer(null);
        setInvalidPhone(true);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [phoneInput, businessId]);

  const handleCreateCustomer = async () => {
    if (!normalizedPhone || !newNameInput.trim() || isCreating) return;
    
    setIsCreating(true);
    try {
      const customer = await CustomerRepository.createLocal(
        businessId,
        newNameInput.trim(),
        phoneInput,
        pickupPointId
      );
      
      onCustomerSelected({
        customerId: customer.id,
        name: customer.name,
        phoneDisplay: customer.phone_display,
        phoneNormalized: customer.phone_normalized,
        syncStatus: customer.sync_status,
      });
    } catch (e) {
      console.error('Failed to create customer', e);
      // In a real app, toast an error if appropriate
    } finally {
      setIsCreating(false);
    }
  };

  const handleUseExisting = () => {
    if (existingCustomer) {
      onCustomerSelected({
        customerId: existingCustomer.id,
        name: existingCustomer.name,
        phoneDisplay: existingCustomer.phone_display,
        phoneNormalized: existingCustomer.phone_normalized,
        syncStatus: existingCustomer.sync_status,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="customer-phone" className="text-sm font-medium text-slate-700">
          Phone number
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            id="customer-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={`block w-full pl-10 pr-3 py-3 border ${invalidPhone ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'} rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
            placeholder="0803 123 4567"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
          />
        </div>
        {invalidPhone && (
          <p className="text-sm text-red-600 mt-1">Enter a valid phone number.</p>
        )}
      </div>

      {!isSearching && normalizedPhone && existingCustomer && (
        <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Customer found</p>
              <h3 className="text-lg font-semibold text-slate-900 mt-1">{existingCustomer.name}</h3>
              <p className="text-slate-600 text-sm mt-0.5">
                {formatPhoneForDisplay(existingCustomer.phone_normalized)}
              </p>
            </div>
          </div>
          <button
            onClick={handleUseExisting}
            className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-xl active:bg-blue-700 transition-colors mt-2"
          >
            Use customer
          </button>
        </div>
      )}

      {!isSearching && normalizedPhone && !existingCustomer && !invalidPhone && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <UserPlus className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">New customer</p>
              <p className="text-sm text-slate-600 mt-0.5">Add their name to continue.</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="customer-name" className="text-sm font-medium text-slate-700">
              Customer name
            </label>
            <input
              id="customer-name"
              type="text"
              autoComplete="name"
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Chinedu Okafor"
              value={newNameInput}
              onChange={(e) => setNewNameInput(e.target.value)}
            />
          </div>

          <button
            onClick={handleCreateCustomer}
            disabled={!newNameInput.trim() || isCreating}
            className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-xl disabled:opacity-50 disabled:active:bg-blue-600 active:bg-blue-700 transition-colors mt-1"
          >
            {isCreating ? 'Saving...' : 'Use this customer'}
          </button>
        </div>
      )}
    </div>
  );
}
