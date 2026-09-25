import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function PackageDetail({ pkg }: any) {
  const p = pkg || {};
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/packages" className="p-2 rounded-lg hover:bg-white"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-3xl font-bold text-[#0D1B2A]">Package {p.code}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">Summary</h3>
          <p className="text-sm">Customer: {typeof p.customer === 'object' ? p.customer?.name : p.customer}</p>
          <p className="text-sm">Pickup: {typeof p.pickupPoint === 'object' ? p.pickupPoint?.name : ''}</p>
          <p className="text-sm">Amount: {p.amount ? '₦' + Number(p.amount).toLocaleString() : '—'}</p>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
            p.status === 'waiting' ? 'bg-[#FFFBEB] text-[#92400E]' :
            p.status === 'collected' ? 'bg-[#F0FDF4] text-[#15803D]' :
            'bg-[#FEF2F2] text-[#B91C1C]'
          }`}>{p.status}</span>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">Payment</h3>
          <p className="text-sm">Due: {p.amount ? '₦' + Number(p.amount).toLocaleString() : '—'}</p>
          <p className="text-sm">Paid: {p.amountPaid ? '₦' + Number(p.amountPaid).toLocaleString() : '—'}</p>
        </div>
      </div>
    </div>
  );
}
