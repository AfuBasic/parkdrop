export default function SmsCredits({ overview, pickupPoints }: any) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-[#0D1B2A]">SMS Credits</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          ['Total Allocated', overview?.totalAllocated],
          ['Total Used', overview?.totalUsed],
          ['Total Remaining', overview?.totalRemaining],
          ['Low Credit Parks', overview?.lowCount],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <p className="text-xs text-[#475569] uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-[#0D1B2A] mt-1">{value ?? '—'}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#475569] uppercase tracking-wide mb-4">By Pickup Point</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="text-left px-4 py-3">Pickup Point</th>
                <th className="text-left px-4 py-3">Allocated</th>
                <th className="text-left px-4 py-3">Used</th>
                <th className="text-left px-4 py-3">Remaining</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {pickupPoints?.map((pp: any) => (
                <tr key={pp.id} className="border-b border-[#E2E8F0]">
                  <td className="px-4 py-3 font-medium">{pp.name}</td>
                  <td className="px-4 py-3 tabular-nums">{pp.allocated}</td>
                  <td className="px-4 py-3 tabular-nums">{pp.used}</td>
                  <td className="px-4 py-3 tabular-nums">{pp.remaining}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${pp.status === 'ok' ? 'bg-[#F0FDF4] text-[#15803D]' : pp.status === 'low' ? 'bg-[#FFFBEB] text-[#92400E]' : 'bg-[#FEF2F2] text-[#B91C1C]'}`}>{pp.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
