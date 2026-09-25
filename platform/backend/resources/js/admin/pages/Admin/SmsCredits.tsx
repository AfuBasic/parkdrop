import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  MessageSquare,
  Plus,
  AlertTriangle,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface SmsCreditsProps {
  overview: {
    totalBalance: number;
    totalAllocated: number;
    totalUsed: number;
    lowCount: number;
  };
  pickupPoints: {
    id: number;
    name: string;
    park: string;
    contactPhone: string;
    balance: number;
    allocated: number;
    used: number;
    status: 'ok' | 'low' | 'depleted';
  }[];
  recentTransactions: {
    id: number;
    pickupPoint: {
      name: string;
      park: string;
    };
    amount: number;
    type: string;
    referenceType: string;
    createdAt: string;
  }[];
}

export default function SmsCredits({ overview, pickupPoints, recentTransactions }: SmsCreditsProps) {
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [selectedPointId, setSelectedPointId] = useState(pickupPoints[0]?.id?.toString() || '');
  const [amount, setAmount] = useState('100');
  const [reason, setReason] = useState('Top-up grant');
  const [processing, setProcessing] = useState(false);

  const openAllocateFor = (id: number) => {
    setSelectedPointId(id.toString());
    setAllocateOpen(true);
  };

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    router.post('/admin/sms-credits/allocate', {
      business_id: selectedPointId,
      amount: parseInt(amount, 10),
      reason,
    }, {
      onSuccess: () => {
        setAllocateOpen(false);
        setProcessing(false);
      },
      onError: () => setProcessing(false),
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">SMS Credits Management</h1>
          <p className="text-xs text-[#475569] mt-0.5">
            Wallet allocations and Termii SMS consumption for customer pickup OTPs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAllocateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Allocate Credits</span>
        </button>
      </div>

      {/* OVERVIEW CARDS — Spec §6.4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Available Balance */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs border-l-4 border-l-[#2563EB]">
          <span className="text-[13px] font-medium text-[#475569]">Total Live Balance</span>
          <div className="text-[28px] font-extrabold text-[#0F172A] tabular-nums tracking-tight mt-1">
            {overview?.totalBalance?.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1">Units available for SMS delivery</p>
        </div>

        {/* Total Allocated */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs border-l-4 border-l-[#10B981]">
          <span className="text-[13px] font-medium text-[#475569]">Total Lifetime Granted</span>
          <div className="text-[28px] font-extrabold text-[#0F172A] tabular-nums tracking-tight mt-1">
            {overview?.totalAllocated?.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1">Total units assigned by admin</p>
        </div>

        {/* Total Used */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs border-l-4 border-l-[#64748B]">
          <span className="text-[13px] font-medium text-[#475569]">Total Consumed</span>
          <div className="text-[28px] font-extrabold text-[#0F172A] tabular-nums tracking-tight mt-1">
            {overview?.totalUsed?.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1">Arrival OTP dispatches</p>
        </div>

        {/* Low Credit Counters (Warning border if > 0) */}
        <div className={`rounded-xl border p-5 shadow-xs border-l-4 ${
          overview?.lowCount > 0 ? 'bg-[#FFFBEB] border-[#FDE68A] border-l-[#D97706]' : 'bg-white border-[#E2E8F0] border-l-[#10B981]'
        }`}>
          <span className={`text-[13px] font-medium ${overview?.lowCount > 0 ? 'text-[#92400E]' : 'text-[#475569]'}`}>
            Low / Depleted Parks
          </span>
          <div className={`text-[28px] font-extrabold tabular-nums tracking-tight mt-1 ${
            overview?.lowCount > 0 ? 'text-[#B45309]' : 'text-[#0F172A]'
          }`}>
            {overview?.lowCount || 0}
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1">Counters below 100 units</p>
        </div>
      </div>

      {/* WALLET BREAKDOWN TABLE */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0]">
          <h2 className="text-base font-bold text-[#0F172A] tracking-tight">Pickup Point Wallets</h2>
          <p className="text-xs text-[#64748B]">Per-counter credit balance and exhaustion alerts</p>
        </div>

        <Table>
          <TableHeader className="bg-[#F8FAFC]">
            <TableRow>
              <TableHead className="font-semibold text-xs text-[#475569]">Pickup Point</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Park / Garage</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569] text-center">Remaining Balance</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569] text-center">Allocated</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569] text-center">Consumed</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Status</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pickupPoints && pickupPoints.length > 0 ? (
              pickupPoints.map((pp) => (
                <TableRow
                  key={pp.id}
                  className={`hover:bg-[#F8FAFC] ${
                    pp.status === 'depleted'
                      ? 'border-l-4 border-l-[#DC2626]'
                      : pp.status === 'low'
                      ? 'border-l-4 border-l-[#F59E0B]'
                      : ''
                  }`}
                >
                  <TableCell className="font-semibold text-sm text-[#0F172A]">
                    {pp.name}
                  </TableCell>
                  <TableCell className="text-xs text-[#64748B]">{pp.park}</TableCell>
                  <TableCell className="text-center font-mono font-bold text-sm tabular-nums">
                    <span className={pp.status !== 'ok' ? 'text-[#DC2626]' : 'text-[#0F172A]'}>
                      {pp.balance}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-[#64748B] tabular-nums">
                    {pp.allocated}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-[#64748B] tabular-nums">
                    {pp.used}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        pp.status === 'ok'
                          ? 'bg-[#F0FDF4] text-[#15803D]'
                          : pp.status === 'low'
                          ? 'bg-[#FFFBEB] text-[#92400E]'
                          : 'bg-[#FEF2F2] text-[#DC2626]'
                      }`}
                    >
                      {pp.status === 'ok' ? 'Adequate' : pp.status === 'low' ? 'Low Credits' : 'Depleted'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => openAllocateFor(pp.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                    >
                      <span>Grant</span>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-[#94A3B8]">
                  No pickup points found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ALLOCATE MODAL DIALOG */}
      <Dialog
        open={allocateOpen}
        onOpenChange={setAllocateOpen}
        title="Allocate SMS Units"
        description="Select counter and units to grant."
      >
        <form onSubmit={handleAllocate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">
              Select Counter *
            </label>
            <Select
              value={selectedPointId}
              onChange={(e) => setSelectedPointId(e.target.value)}
              options={pickupPoints.map((pp) => ({ value: pp.id.toString(), label: `${pp.name} (${pp.park})` }))}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">
              Units to Grant *
            </label>
            <Input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">
              Audit Note
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Monthly allocation or urgent top-up"
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
              {processing ? 'Allocating...' : 'Confirm Grant'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
