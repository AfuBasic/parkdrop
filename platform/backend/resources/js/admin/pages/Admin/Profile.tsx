import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
  UserCheck,
  Shield,
  Clock,
  Server,
  KeyRound,
  LogOut,
  Mail,
  CheckCircle2
} from 'lucide-react';
import { LogoutConfirmModal } from '@/components/ui/LogoutConfirmModal';

interface ProfileProps {
  admin: {
    id: number;
    email: string;
    emailVerifiedAt: string | null;
    lastLoginAt: string;
    lastLoginIp: string;
    createdAt: string;
  };
  system: {
    laravelVersion: string;
    phpVersion: string;
    environment: string;
    timezone: string;
  };
}

export default function Profile({ admin, system }: ProfileProps) {
  const [showLogout, setShowLogout] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Staff Account Profile</h1>
        <p className="text-xs text-[#475569] mt-0.5">
          Afutunde Solutions platform operator credentials and session diagnostics.
        </p>
      </div>

      {/* 1. OPERATOR PROFILE CARD — Spec §6.9 */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-lg uppercase shadow-xs">
            {admin?.email ? admin.email.substring(0, 1) : 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#0F172A]">{admin?.email}</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Verified Admin</span>
              </span>
            </div>
            <p className="text-xs text-[#64748B]">Platform Owner · Afutunde Solutions Staff</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#F1F5F9]">
          <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Member Since
            </span>
            <p className="text-sm font-bold text-[#0F172A] mt-1">{admin?.createdAt || 'Sep 2026'}</p>
          </div>

          <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Last Login Activity
            </span>
            <p className="text-sm font-bold text-[#0F172A] mt-1">{admin?.lastLoginAt || 'Recent'}</p>
          </div>

          <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Authorized IP
            </span>
            <p className="text-sm font-mono font-bold text-[#0F172A] mt-1">{admin?.lastLoginIp || '127.0.0.1'}</p>
          </div>
        </div>
      </div>

      {/* 2. AUTHENTICATION & SECURITY CARD — Spec §6.9 */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-[#2563EB]" />
          <h2 className="text-base font-bold text-[#0F172A]">Passwordless OTP Authentication</h2>
        </div>
        <p className="text-xs text-[#64748B]">
          Admin sign-in is guarded exclusively through 6-digit email OTP challenges with a 10-minute validity window.
          No reusable passwords or credentials exist in the system.
        </p>

        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-[#10B981]" />
            <div>
              <p className="text-xs font-semibold text-[#0F172A]">Email Verification Challenge</p>
              <p className="text-[11px] text-[#64748B]">Active on: {admin?.email}</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0FDF4] text-[#15803D]">
            Enforced
          </span>
        </div>
      </div>

      {/* 3. SYSTEM DIAGNOSTICS */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-[#64748B]" />
          <h2 className="text-base font-bold text-[#0F172A]">Runtime Environment Telemetry</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px]">Framework</span>
            <span className="font-mono font-bold text-[#0F172A] mt-0.5 block">Laravel {system?.laravelVersion}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px]">PHP Engine</span>
            <span className="font-mono font-bold text-[#0F172A] mt-0.5 block">PHP {system?.phpVersion}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px]">Environment</span>
            <span className="font-mono font-bold text-[#0F172A] mt-0.5 block uppercase">{system?.environment}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[11px]">Server Timezone</span>
            <span className="font-mono font-bold text-[#0F172A] mt-0.5 block">{system?.timezone}</span>
          </div>
        </div>
      </div>

      {/* Logout Row */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={() => setShowLogout(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#DC2626] text-white text-xs font-semibold hover:bg-[#B91C1C] transition-colors shadow-xs cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Admin Console</span>
        </button>
      </div>

      <LogoutConfirmModal
        open={showLogout}
        onOpenChange={setShowLogout}
      />
    </div>
  );
}
