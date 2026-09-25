import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function PickupPointDetail({ pickupPoint }: any) {
  const pp = pickupPoint || {};
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/pickup-points" className="p-2 rounded-lg hover:bg-white"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-3xl font-bold text-[#0D1B2A]">{pp.name}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          ['Received', pp.stats?.totalReceived],
          ['Collected', pp.stats?.totalCollected],
          ['Revenue', '₦' + (pp.stats?.totalRevenue || 0).toLocaleString()],
          ['Waiting', pp.stats?.waiting],
          ['Overdue', pp.stats?.overdue],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <p className="text-xs text-[#475569] uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-[#0D1B2A] mt-1">{value ?? '—'}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#475569] uppercase tracking-wide mb-4">Recent Packages</h2>
        {pp.recentPackages?.length > 0 ? (
          <div className="divide-y divide-[#E2E8F0]">
            {pp.recentPackages.map((p: any) => (
              <div key={p.id} className="py-2 flex items-center justify-between text-sm">
                <span className="font-medium tabular-nums">{p.code}</span>
                <span className="text-[#94A3B8]">{p.status}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-[#94A3B8]">No recent packages.</p>}
      </div>
    </div>
  );
}
