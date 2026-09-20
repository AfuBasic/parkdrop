import { useState } from 'react';
import { Switch } from '@/design-system/components/Switch';
import { PackagePhotoField } from '@/features/package-media/components/PackagePhotoField';

interface AddPackageFormProps {
  customerName: string;
  customerPhone: string;
  onChangeCustomer: () => void;
  onSave: (amountDueMinor: number, sendSms: boolean, photoBlob: Blob | null) => Promise<void>;
}

export function AddPackageForm({ customerName, customerPhone, onChangeCustomer, onSave }: AddPackageFormProps) {
  const [amountRaw, setAmountRaw] = useState<string>('');
  const [sendSms, setSendSms] = useState(true);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidAmount = amountRaw.trim() !== '' && !isNaN(Number(amountRaw)) && Number(amountRaw) >= 0;

  const handleSave = async () => {
    if (!isValidAmount || isSaving) return;
    
    setIsSaving(true);
    setError(null);
    try {
      // Convert to minor units (assuming Kobo, * 100)
      const amountDueMinor = Math.round(Number(amountRaw) * 100);
      await onSave(amountDueMinor, sendSms, photoBlob);
    } catch (err) {
      console.error(err);
      setError('Could not save package. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-8">
      
      {/* Customer Section */}
      <section className="bg-white px-4 py-5 mb-2 border-y border-slate-100 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Customer</h2>
            <p className="text-lg font-semibold text-slate-900">{customerName}</p>
            <p className="text-slate-600 mt-0.5">{customerPhone}</p>
          </div>
          <button 
            onClick={onChangeCustomer}
            className="text-blue-600 font-medium text-sm py-1 px-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors"
          >
            Change
          </button>
        </div>
      </section>

      {/* Amount Section */}
      <section className="bg-white px-4 py-5 mb-2 border-y border-slate-100 shadow-sm">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">Amount</h2>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-xl font-semibold text-slate-400">₦</span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            className="block w-full pl-10 pr-4 py-4 text-2xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder-slate-300 text-slate-900"
            placeholder="0"
            value={amountRaw}
            onChange={(e) => {
              // Only allow numbers and one decimal point
              const val = e.target.value.replace(/[^\d.]/g, '');
              if (val.split('.').length > 2) return;
              setAmountRaw(val);
            }}
          />
        </div>
        {!isValidAmount && amountRaw.length > 0 && (
          <p className="text-red-500 text-sm mt-2">Enter a valid amount.</p>
        )}
      </section>

      {/* Photo Section (Optional/Placeholder for Build 6) */}
      <section className="bg-white px-4 py-5 mb-2 border-y border-slate-100 shadow-sm">
        <PackagePhotoField onPhotoSelected={setPhotoBlob} />
      </section>

      {/* SMS Section */}
      <section className="bg-white px-4 py-5 mb-6 border-y border-slate-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex flex-col pr-4">
            <span className="text-base font-medium text-slate-900">Send arrival SMS</span>
            <span className="text-sm text-slate-500 mt-1">Customer will receive the pickup code.</span>
          </div>
          <Switch 
            checked={sendSms} 
            onCheckedChange={setSendSms} 
            aria-label="Send arrival SMS"
          />
        </div>
      </section>

      {/* Action */}
      <div className="px-4 pb-6 mt-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={!isValidAmount || isSaving}
          className="w-full bg-blue-600 text-white font-semibold py-4 px-4 rounded-xl shadow-sm disabled:opacity-50 disabled:active:bg-blue-600 active:bg-blue-700 transition-all text-lg"
        >
          {isSaving ? 'Saving...' : 'Save package'}
        </button>
      </div>
    </div>
  );
}
