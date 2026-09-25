import { useState, useEffect } from 'react';

export default function ErrorLog({ errors }: any) {
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings' | 'info'>('all');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#0D1B2A]">Error Log</h1>
        <div className="flex gap-2">
          {(['all', 'errors', 'warnings', 'info'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f ? 'bg-[#2563EB] text-white' : 'bg-white text-[#475569] border border-[#E2E8F0]'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm divide-y divide-[#E2E8F0]">
        {errors?.length > 0 ? errors.slice(0, 50).map((err: any, i: number) => (
          <div key={i} className="px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B91C1C]" />
              <span className="text-[#0D1B2A] font-medium truncate">{err.line}</span>
              <span className="text-xs text-[#94A3B8] ml-auto">{err.timestamp}</span>
            </div>
          </div>
        )) : <p className="p-8 text-center text-sm text-[#94A3B8]">No log entries match the current filter.</p>}
      </div>
    </div>
  );
}
