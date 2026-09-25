import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  ArrowLeft,
  Building2,
  Phone,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Pencil,
  Power,
  MessageSquare,
  Plus
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface PickupPointDetailProps {
  pickupPoint: {
    id: number;
    publicId: string;
    name: string;
    park: string;
    contactPhone: string;
    isActive: boolean;
    dailyStorageFeeMinor: number;
    smsBalance: number;
    stats: {
      totalReceived: number;
      totalCollected: number;
      totalRevenueMinor: number;
      waiting: number;
      overdue: number;
    };
    recentPackages: {
      id: string;
      code: string;
      status: string;
      customerName: string;
      customerPhone: string;
      amountMinor: number;
      createdAt: string;
    }[];
  };
}

export default function PickupPointDetail({ pickupPoint }: PickupPointDetailProps) {
  const pp = pickupPoint;

  // SMS allocation dialog
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState('100');
  const [processing, setProcessing] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(pp.name);
  const [park, setPark] = useState(pp.park !== '—' ? pp.park : '');
  const [phone, setPhone] = useState(pp.contactPhone !== '—' ? pp.contactPhone : '');
  const [dailyFee, setDailyFee] = useState((pp.dailyStorageFeeMinor / 100).toString());

  const handleToggle = () => {
    router.post(`/admin/pickup-points/${pp.id}/toggle`, {}, { preserveState: true });
  };

  const handleAllocateSms = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    router.post('/admin/sms-credits/allocate', {
      business_id: pp.id,
      amount: parseInt(creditAmount, 10),
    }, {
      onSuccess: () => {
        setAllocateOpen(false);
        setProcessing(false);
      },
      onError: () => setProcessing(false),
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    router.put(`/admin/pickup-points/${pp.id}`, {
      name,
      park_name: park,
      contact_phone: phone,
      daily_storage_fee: parseFloat(dailyFee) || 0,
    }, {
      onSuccess: () => {
        setEditOpen(false);
        setProcessing(false);
      },
      onError: () => setProcessing(false),
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pickup-points"
            className="p-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">{pp.name}</h1>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  pp.isActive ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-[#FEF2F2] text-[#B91C1C]'
                }`}
              >
                {pp.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              {pp.park} · {pp.contactPhone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={handleToggle}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              pp.isActive
                ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{pp.isActive ? 'Deactivate' : 'Activate'}</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS GRID — Spec §6.2: 5 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Received */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs">
          <span className="text-[13px] font-medium text-[#475569]">Total Received</span>
          <div className="text-[26px] font-extrabold text-[#0F172A] tabular-nums mt-1">
            {pp.stats.totalReceived}
          </div>
          <span className="text-[11px] text-[#94A3B8] block mt-0.5">All-time packages</span>
        </div>

        {/* Total Collected */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs">
          <span className="text-[13px] font-medium text-[#475569]">Total Collected</span>
          <div className="text-[26px] font-extrabold text-[#10B981] tabular-nums mt-1">
            {pp.stats.totalCollected}
          </div>
          <span className="text-[11px] text-[#94A3B8] block mt-0.5">Successful pickups</span>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs">
          <span className="text-[13px] font-medium text-[#475569]">Total Revenue</span>
          <div className="text-[26px] font-extrabold text-[#0F172A] tabular-nums mt-1">
            ₦{(pp.stats.totalRevenueMinor / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[#94A3B8] block mt-0.5">Paid at pickup</span>
        </div>

        {/* Waiting */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs">
          <span className="text-[13px] font-medium text-[#475569]">Currently Waiting</span>
          <div className="text-[26px] font-extrabold text-[#2563EB] tabular-nums mt-1">
            {pp.stats.waiting}
          </div>
          <span className="text-[11px] text-[#94A3B8] block mt-0.5">In shelf custody</span>
        </div>

        {/* Overdue (Warning if > 0 per spec) */}
        <div className={`rounded-xl border p-5 shadow-xs ${
          pp.stats.overdue > 0 ? 'bg-[#FFFBEB] border-[#FDE68A]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-[13px] font-medium ${pp.stats.overdue > 0 ? 'text-[#92400E]' : 'text-[#475569]'}`}>
            Currently Overdue
          </span>
          <div className={`text-[26px] font-extrabold tabular-nums mt-1 ${
            pp.stats.overdue > 0 ? 'text-[#B45309]' : 'text-[#0F172A]'
          }`}>
            {pp.stats.overdue}
          </div>
          <span className="text-[11px] text-[#94A3B8] block mt-0.5">&gt;24 hours holding</span>
        </div>
      </div>

      {/* SMS CREDITS CARD — Spec §6.2 */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-base font-bold text-[#0F172A]">SMS Notification Wallet</h2>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Credit balance used to send arrival OTP SMS messages to recipients at this counter.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-extrabold text-[#0F172A] tabular-nums font-mono">
              {pp.smsBalance}
            </div>
            <span className={`text-[11px] font-semibold ${pp.smsBalance < 100 ? 'text-[#DC2626]' : 'text-[#10B981]'}`}>
              {pp.smsBalance < 100 ? 'Low Credits' : 'Healthy Balance'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setAllocateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Allocate Credits</span>
          </button>
        </div>
      </div>

      {/* RECENT PACKAGES TABLE — Spec §6.2 */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Recent Packages at this Location</h2>
            <p className="text-xs text-[#64748B]">Last 20 parcels processed at this counter</p>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-[#F8FAFC]">
            <TableRow>
              <TableHead className="font-semibold text-xs text-[#475569]">Package Code</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Customer</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Amount</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Status</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pp.recentPackages && pp.recentPackages.length > 0 ? (
              pp.recentPackages.map((p) => (
                <TableRow key={p.id} className="hover:bg-[#F8FAFC]">
                  <TableCell className="font-mono font-bold text-sm text-[#0F172A]">
                    {p.code}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-semibold text-[#0F172A]">{p.customerName}</p>
                    <p className="text-xs font-mono text-[#64748B]">{p.customerPhone}</p>
                  </TableCell>
                  <TableCell className="font-mono text-sm font-semibold text-[#0F172A]">
                    ₦{(p.amountMinor / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.status === 'COLLECTED'
                          ? 'bg-[#F0FDF4] text-[#15803D]'
                          : p.status === 'WAITING'
                          ? 'bg-[#EFF6FF] text-[#2563EB]'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/packages/${p.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-[#94A3B8]">
                  No packages processed at this pickup point yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ALLOCATE SMS DIALOG */}
      <Dialog
        open={allocateOpen}
        onOpenChange={setAllocateOpen}
        title="Allocate SMS Credits"
        description={`Grant SMS units to ${pp.name} for recipient arrival notifications.`}
      >
        <form onSubmit={handleAllocateSms} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">
              Credit Units to Grant *
            </label>
            <Input
              type="number"
              min="1"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setAllocateOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
            >
              {processing ? 'Allocating...' : 'Confirm Allocation'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* EDIT MODAL DIALOG */}
      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Pickup Point"
        description="Update counter configuration and park contact details."
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">
              Pickup Point Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">
              Motor Park / Garage *
            </label>
            <Input
              value={park}
              onChange={(e) => setPark(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">
              Contact Phone *
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">
              Daily Storage Fee (₦)
            </label>
            <Input
              type="number"
              value={dailyFee}
              onChange={(e) => setDailyFee(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
            >
              {processing ? 'Updating...' : 'Update Details'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
