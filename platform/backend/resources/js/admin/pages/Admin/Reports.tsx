export default function Reports({ metrics }: any) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-[#0D1B2A]">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics && Object.entries(metrics).map(([key, value]: [string, any]) => (
          <div key={key} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <p className="text-xs text-[#475569] uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1')}</p>
            <p className="text-2xl font-bold text-[#0D1B2A] mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
