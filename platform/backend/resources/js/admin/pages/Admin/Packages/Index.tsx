import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function Packages({ packages }: any) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-[#0D1B2A]">Packages</h1>
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Code</th>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Pickup Point</th>
                <th className="text-right px-4 py-3 font-medium text-[#475569]">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Status</th>
                <th className="text-left px-4 py-3 font-medium text-[#475569]">Age</th>
              </tr>
            </thead>
            <tbody>
              {packages?.data?.map((p: any) => (
                <tr key={p.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 font-mono font-medium">{p.code}</td>
                  <td className="px-4 py-3">
                    <div>{typeof p.customer === 'string' ? p.customer : p.customer?.name || 'Walk-in'}</div>
                    <div className="text-xs text-[#94A3B8]">{typeof p.customer === 'object' ? p.customer?.phone : ''}</div>
                  </td>
                  <td className="px-4 py-3 text-[#475569]">
                    <div>{p.pickupPoint?.name}</div>
                    <div className="text-xs text-[#94A3B8]">{p.pickupPoint?.park}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.amount ? '₦' + Number(p.amount).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'waiting' ? 'bg-[#FFFBEB] text-[#92400E]' :
                      p.status === 'collected' ? 'bg-[#F0FDF4] text-[#15803D]' :
                      'bg-[#FEF2F2] text-[#B91C1C]'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-[#475569]">{p.age}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
