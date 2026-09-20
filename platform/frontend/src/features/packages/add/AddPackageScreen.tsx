import { useState, useCallback } from 'react';
import { CustomerLookup, type CustomerSelection } from '@/features/customers/components/CustomerLookup';
import { AddPackageForm } from './components/AddPackageForm';
import { PackageSaved } from './components/PackageSaved';
import { PackageRepository } from '@/offline/repositories/PackageRepository';
import { useAuth } from '@/features/auth/AuthContext';
import { ChevronLeft } from 'lucide-react';
import type { LocalPackage } from '@/offline/db/schema';

interface AddPackageScreenProps {
  onNavigate?: (path: string) => void;
  onBack?: () => void;
}

export function AddPackageScreen({ onNavigate, onBack }: AddPackageScreenProps) {
  const { business } = useAuth();

  const [customer, setCustomer] = useState<CustomerSelection | null>(null);
  const [savedPackage, setSavedPackage] = useState<LocalPackage | null>(null);

  // Use the active business ID, or 0 if somehow unauthenticated (guarded by router normally)
  const businessId = business?.id || 0;
  // Pickup points aren't fully implemented yet, use null for now
  const pickupPointId = null;

  const handleSave = async (amountDueMinor: number, sendSms: boolean, photoBlob: Blob | null) => {
    if (!customer || !businessId) return;

    const result = await PackageRepository.createLocal(
      businessId,
      pickupPointId,
      customer.customerId,
      amountDueMinor,
      sendSms,
      photoBlob
    );
    setSavedPackage(result.package);
  };

  const resetForm = useCallback(() => {
    setCustomer(null);
    setSavedPackage(null);
  }, []);

  const handleBack = () => {
    if (customer && !savedPackage) {
      if (confirm('Discard this package? Your entered details haven\'t been saved.')) {
        if (onBack) onBack();
        else if (onNavigate) onNavigate('/');
      }
    } else {
      if (onBack) onBack();
      else if (onNavigate) onNavigate('/');
    }
  };

  if (savedPackage && customer) {
    return (
      <div className="flex flex-col min-h-screen bg-surface-page w-full max-w-md mx-auto">
        <PackageSaved 
          customerName={customer.name}
          pickupCode={savedPackage.pickup_code}
          publicPackageId={savedPackage.public_package_id}
          onAddAnother={resetForm}
          onViewPackage={() => {
            if (onNavigate) onNavigate('/packages');
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-page w-full max-w-md mx-auto relative">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface-page/90 backdrop-blur-sm border-b border-border-subtle px-4 h-14 flex items-center shrink-0">
        <button 
          onClick={handleBack}
          className="flex items-center text-text-secondary hover:text-text-primary transition-colors py-2 pr-4 -ml-2"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="text-[17px] font-medium ml-0.5">Back</span>
        </button>
        <h1 className="text-[17px] font-semibold text-text-primary ml-auto absolute left-1/2 -translate-x-1/2">
          Add package
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center">
        {!customer ? (
          <div className="w-full px-4 py-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Who is it for?</h2>
            <CustomerLookup 
              businessId={businessId}
              pickupPointId={pickupPointId}
              onCustomerSelected={setCustomer}
            />
          </div>
        ) : (
          <AddPackageForm 
            customerName={customer.name}
            customerPhone={customer.phoneDisplay}
            onChangeCustomer={() => setCustomer(null)}
            onSave={handleSave}
          />
        )}
      </main>
    </div>
  );
}
