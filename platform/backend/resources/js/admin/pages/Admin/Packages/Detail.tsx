import React from 'react';
import { Link } from '@inertiajs/react';
import {
  ArrowLeft,
  Package as PackageIcon,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Banknote,
  Camera,
  MessageSquare,
  AlertTriangle,
  User,
  ShieldCheck
} from 'lucide-react';

interface PackageDetailProps {
  package: {
    id: string;
    code: string;
    pickupCode: string;
    status: string;
    customer: {
      name: string;
      phone: string;
    } | null;
    pickupPoint: {
      id: number;
      name: string;
      park: string;
      contactPhone: string;
    };
    amountDueMinor: number;
    amountPaidMinor: number;
    createdAt: string;
    collectedAt?: string | null;
    returnedAt?: string | null;
    cancelledAt?: string | null;
    terminalReason?: string | null;
    terminalReasonNote?: string | null;
    terminalActorName?: string | null;
    receivedBy: string;
    media: {
      id: string;
      url: string | null;
      width: number;
      height: number;
    }[];
    payments: {
      id: string;
      amountMinor: number;
      method: string;
      status: string;
      createdAt: string;
    }[];
  };
}

export default function PackageDetail({ package: p }: PackageDetailProps) {
  const isPaid = p.amountPaidMinor >= p.amountDueMinor && p.amountDueMinor > 0;
  const isWaiting = p.status === 'WAITING';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button and Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/packages"
          className="p-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-mono text-[#0F172A] tracking-tight">
              {p.code}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                p.status === 'COLLECTED'
                  ? 'bg-[#F0FDF4] text-[#15803D]'
                  : p.status === 'WAITING'
                  ? 'bg-[#EFF6FF] text-[#2563EB]'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {p.status}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Pickup Code OTP: <span className="font-mono font-bold text-[#0F172A]">{p.pickupCode}</span>
          </p>
        </div>
      </div>

      {/* 1. SUMMARY CARD — Spec §6.3 */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
          Parcel Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-[#64748B] block">Recipient / Customer</span>
            <p className="text-sm font-bold text-[#0F172A] mt-0.5">
              {p.customer?.name || 'Walk-in Customer'}
            </p>
            {p.customer?.phone && (
              <a
                href={`tel:${p.customer.phone}`}
                className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:underline font-mono mt-0.5"
              >
                <Phone className="w-3 h-3" />
                <span>{p.customer.phone}</span>
              </a>
            )}
          </div>

          <div>
            <span className="text-xs text-[#64748B] block">Pickup Location</span>
            <p className="text-sm font-bold text-[#0F172A] mt-0.5">{p.pickupPoint.name}</p>
            <p className="text-xs text-[#64748B]">{p.pickupPoint.park}</p>
          </div>

          <div>
            <span className="text-xs text-[#64748B] block">Storage Fee Due</span>
            <p className="text-base font-bold font-mono text-[#0F172A] mt-0.5">
              ₦{(p.amountDueMinor / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </p>
            <span className={`text-[11px] font-semibold ${isPaid ? 'text-[#10B981]' : 'text-[#D97706]'}`}>
              {isPaid ? 'Fully settled' : isWaiting ? 'Awaiting collection payment' : 'Status closed'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. PAYMENT CARD — Spec §6.3 */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-[#10B981]" />
            <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Payment Ledger
            </h2>
          </div>
          <span className="text-xs font-mono font-semibold text-[#64748B]">
            Paid: ₦{(p.amountPaidMinor / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })} / ₦{(p.amountDueMinor / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {p.payments && p.payments.length > 0 ? (
          <div className="divide-y divide-[#F1F5F9] border rounded-xl border-[#E2E8F0] overflow-hidden">
            {p.payments.map((pm) => (
              <div key={pm.id} className="p-3 flex items-center justify-between text-xs bg-white">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <div>
                    <p className="font-semibold text-[#0F172A]">{pm.method} Payment</p>
                    <p className="text-[#94A3B8] text-[11px]">{new Date(pm.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-[#0F172A]">
                  ₦{(pm.amountMinor / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B]">
            {isWaiting
              ? `Amount due: ₦${(p.amountDueMinor / 100).toFixed(2)}, not yet collected from recipient.`
              : 'No separate payment transaction receipt logged.'}
          </div>
        )}
      </div>

      {/* 3. PHOTO CARD — Spec §6.3 */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#2563EB]" />
          <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
            Parcel Physical Media
          </h2>
        </div>

        {p.media && p.media.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {p.media.map((m) => (
              <div key={m.id} className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-[#F8FAFC]">
                {m.url ? (
                  <img
                    src={m.url}
                    alt="Package parcel verification"
                    className="w-full max-h-[300px] object-cover"
                  />
                ) : (
                  <div className="p-8 text-center text-xs text-[#94A3B8]">
                    Image file stored securely on disk.
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center text-xs text-[#94A3B8]">
            No intake photo was captured for this package.
          </div>
        )}
      </div>

      {/* 4. CUSTODY TIMELINE & EVENT AUDIT — Spec §6.3 */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
          Chain of Custody Timeline
        </h2>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0]">
          {/* Intake Event */}
          <div className="relative">
            <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#2563EB] ring-4 ring-white" />
            <p className="text-sm font-semibold text-[#0F172A]">
              Parcel Received at {p.pickupPoint.name}
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">
              Intake registered by attendant {p.receivedBy} · {new Date(p.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Collected Event if applicable */}
          {p.collectedAt && (
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#10B981] ring-4 ring-white" />
              <p className="text-sm font-semibold text-[#10B981]">
                Parcel Handed Over & Collected
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">
                Released to customer upon OTP verification · {new Date(p.collectedAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Terminal Event if returned or cancelled */}
          {(p.returnedAt || p.cancelledAt) && (
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#DC2626] ring-4 ring-white" />
              <p className="text-sm font-semibold text-[#DC2626]">
                Package {p.status}: {p.terminalReason || 'Custody terminated'}
              </p>
              {p.terminalReasonNote && (
                <p className="text-xs text-[#64748B] mt-0.5 italic">
                  Note: {p.terminalReasonNote}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
