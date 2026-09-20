import { CheckCircle2, Copy } from 'lucide-react';
import { useState } from 'react';

interface PackageSavedProps {
  customerName: string;
  pickupCode: string;
  publicPackageId: string;
  onAddAnother: () => void;
  onViewPackage?: () => void;
}

export function PackageSaved({
  customerName,
  pickupCode,
  publicPackageId,
  onAddAnother,
  onViewPackage
}: PackageSavedProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pickupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Package saved</h1>
      <p className="text-slate-600 mb-8">{customerName}</p>

      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-4">
        <p className="text-sm font-medium text-slate-500 text-center uppercase tracking-wider mb-2">
          Pickup code
        </p>
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-4xl font-bold text-slate-900 tracking-[0.1em] tabular-nums">
            {pickupCode}
          </span>
          <button
            onClick={handleCopy}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Copy pickup code"
          >
            <Copy className="h-5 w-5" />
          </button>
        </div>

        <div className="flex justify-between items-center py-3 border-t border-slate-100">
          <span className="text-sm text-slate-500">Package ID</span>
          <span className="text-sm font-medium text-slate-900">{publicPackageId}</span>
        </div>
        
        <div className="flex justify-between items-center py-3 border-t border-slate-100">
          <span className="text-sm text-slate-500">Status</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            <span className="text-sm font-medium text-slate-900">Saved on this device</span>
          </div>
        </div>
      </div>

      {copied && (
        <div className="absolute bottom-24 bg-slate-900 text-white text-sm py-2 px-4 rounded-full animate-in fade-in slide-in-from-bottom-2">
          Pickup code copied
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col gap-3 mt-4">
        <button
          onClick={onAddAnother}
          className="w-full bg-blue-600 text-white font-semibold py-4 px-4 rounded-xl active:bg-blue-700 transition-colors"
        >
          Add another package
        </button>
        {onViewPackage && (
          <button
            onClick={onViewPackage}
            className="w-full bg-slate-100 text-slate-700 font-semibold py-4 px-4 rounded-xl active:bg-slate-200 transition-colors"
          >
            View package
          </button>
        )}
      </div>
    </div>
  );
}
