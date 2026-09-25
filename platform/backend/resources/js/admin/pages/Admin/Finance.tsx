export default function Finance({ kpi, dailyRevenue, byPickupPoint }: any) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-[#0D1B2A]">Finance</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          ['Revenue Collected', '₦' + (kpi?.revenue || 0).toLocaleString()],
          ['Packages Collected', kpi?.collected],
          ['Average per Package', kpi?.average ? '₦' + Number(kpi.average).toFixed(0).toLocaleString() : '—'],
          ['Total Amount Owed', '₦' + (kpi?.owed || 0).toLocaleString()],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <p className="text-xs text-[#475569] uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-[#0D1B2A] mt-1">{value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#475569] uppercase tracking-wide mb-4">Daily Revenue</h2>
        <div className="h-64 flex items-end gap-2">
          {dailyRevenue?.map((d: any) => (
            <div key={d.date} className="flex-1 bg-[#2563EB] rounded-t-lg" style={{ height: `${Math.max(4, (d.revenue / (dailyRevenue?.[0]?.revenue || 1)) * 100)}%` }} title={`${d.date}: ₦${d.revenue}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
