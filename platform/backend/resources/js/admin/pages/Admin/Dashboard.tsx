import React from 'react';
import { Link } from '@inertiajs/react';
import {
  Building2,
  Package,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Banknote,
  ArrowRight,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Inbox
} from 'lucide-react';
import { ThroughputChart } from '@/components/charts/ThroughputChart';

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Package,
  MessageSquare,
  Banknote,
};

interface Trend {
  value: string;
  up: boolean;
}

interface KpiItem {
  value: string | number;
  label: string;
  sub?: string | null;
  icon: string;
  trend?: Trend | null;
  hasWarning?: boolean;
}

interface QuickStatItem {
  label: string;
  value: string;
  isWarning: boolean;
  link: string;
}

interface RecentActivityItem {
  type: string;
  code: string;
  parkName: string;
  customerName: string;
  amountFormatted: string;
  description: string;
  timestamp: string;
}

interface AttentionItem {
  id: string | number;
  code: string;
  created_at: string;
}

interface TopPickupPoint {
  id: number;
  name: string;
  park: string;
  today: number;
  waiting: number;
}

interface DashboardProps {
  kpi: KpiItem[];
  quickStats: Record<string, QuickStatItem>;
  chartData: any[];
  topPickupPoints: TopPickupPoint[];
  recentActivity: RecentActivityItem[];
  needsAttention: AttentionItem[];
}

export default function Dashboard({
  kpi,
  quickStats,
  chartData,
  topPickupPoints,
  recentActivity,
  needsAttention,
}: DashboardProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-[#475569] mt-0.5">
            Operational telemetry and cross-park parcel movement.
          </p>
        </div>

        {/* Live operational badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>All 4 Services Operational</span>
        </div>
      </div>

      {/* KPI Cards — Spec: 4 cards, 20px padding, 12px radius, 1px #E2E8F0 border, left accent */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpi?.map((item, idx) => {
          const Icon = IconMap[item.icon] || Package;
          // Left accent border per spec §6.1: 3px #2563EB for first card, warning if low SMS
          const borderAccent = item.hasWarning
            ? 'border-l-4 border-l-[#DC2626]'
            : idx === 0
            ? 'border-l-4 border-l-[#2563EB]'
            : idx === 1
            ? 'border-l-4 border-l-[#3B82F6]'
            : idx === 2
            ? 'border-l-4 border-l-[#10B981]'
            : 'border-l-4 border-l-[#64748B]';

          return (
            <div
              key={item.label}
              className={`bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs transition-all hover:border-[#CBD5E1] ${borderAccent}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-medium text-[#475569]">
                  {item.label}
                </span>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.hasWarning ? 'bg-red-50 text-[#DC2626]' : 'bg-[#EFF6FF] text-[#2563EB]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="text-[28px] font-extrabold text-[#0F172A] tracking-tight tabular-nums">
                {item.value}
              </div>

              {item.sub && (
                <p className="text-[12px] font-normal text-[#94A3B8] mt-1">
                  {item.sub}
                </p>
              )}

              {item.trend && (
                <div className="mt-2.5 flex items-center">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      item.trend.up
                        ? 'bg-[#F0FDF4] text-[#166534]'
                        : 'bg-[#FEF2F2] text-[#991B1B]'
                    }`}
                  >
                    {item.trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {item.trend.value}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overdue Warning Callout (if any packages >24h) */}
      {needsAttention && needsAttention.length > 0 && (
        <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#92400E] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-[#92400E]">
                Attention Required: {needsAttention.length} parcels waiting over 24 hours
              </h2>
              <p className="text-xs text-[#78350F] mt-0.5">
                Storage fee escalation will apply unless customer collects or phone follow-up occurs.
              </p>
            </div>
          </div>
          <Link
            href="/admin/packages?age=overdue"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#FDE68A] text-xs font-semibold text-[#92400E] hover:bg-[#FEF3C7] shrink-0"
          >
            <span>View overdue queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* QUICK STATS BAR — Spec §6.1: 4 small stat pills in a row, white cards, 16px padding */}
      {quickStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(quickStats).map(([key, item]) => (
            <Link
              key={key}
              href={item.link}
              className={`rounded-xl border p-4 transition-all group block ${
                item.isWarning
                  ? 'bg-[#FFFBEB] border-[#FDE68A] hover:border-[#F59E0B]'
                  : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[#475569] mb-1">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  {item.label}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#2563EB] transition-colors" />
              </div>
              <div
                className={`text-sm font-semibold truncate ${
                  item.isWarning ? 'text-[#92400E]' : 'text-[#0F172A]'
                }`}
              >
                {item.value}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CHARTS + TOP LOCATIONS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Throughput Bar Chart (spans 2 cols) */}
        <div className="lg:col-span-2">
          <ThroughputChart data={chartData || []} />
        </div>

        {/* Top Operational Locations Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                  Top Pickup Points
                </h2>
                <p className="text-xs text-[#64748B]">Volume leaders today</p>
              </div>
              <Link
                href="/admin/pickup-points"
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
              >
                View all
              </Link>
            </div>

            <div className="divide-y divide-[#F1F5F9]">
              {topPickupPoints && topPickupPoints.length > 0 ? (
                topPickupPoints.map((loc) => (
                  <Link
                    key={loc.id}
                    href={`/admin/pickup-points/${loc.id}`}
                    className="py-3 flex items-center justify-between hover:bg-[#F8FAFC] -mx-2 px-2 rounded-lg transition-colors group"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-semibold text-[#0F172A] group-hover:text-[#2563EB] truncate">
                        {loc.name}
                      </p>
                      <p className="text-xs text-[#64748B] truncate">{loc.park}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-[#0F172A] tabular-nums">
                        {loc.today}
                      </span>
                      <span className="text-[11px] text-[#94A3B8] block">
                        {loc.waiting} waiting
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-[#94A3B8]">
                  No location traffic yet today.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
            <Link
              href="/admin/pickup-points"
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Manage all pickup points</span>
            </Link>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY SECTION — Spec §6.1: Last 10 events, newest first, coloured circles */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
              Recent Activity
            </h2>
            <p className="text-xs text-[#64748B]">Real-time operational events from attendants</p>
          </div>
          <Link
            href="/admin/packages"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
          >
            <span>View all packages</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-[#F1F5F9]">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((item, idx) => (
              <div
                key={idx}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 first:pt-0 last:pb-0"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  {/* Coloured circle indicator per event type */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      item.type === 'collected'
                        ? 'bg-[#F0FDF4] text-[#15803D]'
                        : item.type === 'received'
                        ? 'bg-[#EFF6FF] text-[#2563EB]'
                        : item.type === 'returned'
                        ? 'bg-[#FEF2F2] text-[#DC2626]'
                        : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                  >
                    {item.type === 'collected' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : item.type === 'received' ? (
                      <Package className="w-4 h-4" />
                    ) : (
                      <Inbox className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0F172A]">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#94A3B8] mt-0.5">
                      <span className="font-mono font-semibold text-[#475569]">
                        {item.code}
                      </span>
                      <span>·</span>
                      <span>{item.parkName}</span>
                      <span>·</span>
                      <span className="text-[#10B981] font-semibold">{item.amountFormatted}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-[#94A3B8] shrink-0 sm:self-center pl-11 sm:pl-0">
                  <Clock className="w-3 h-3" />
                  <span>{item.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-[#94A3B8]">
              No package activity logged today yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
