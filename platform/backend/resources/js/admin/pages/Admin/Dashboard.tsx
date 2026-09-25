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
  AlertCircle
} from 'lucide-react';

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
}

interface RecentActivityItem {
  type: string;
  description: string;
  timestamp: string;
}

interface AttentionItem {
  id: string | number;
  code: string;
  created_at: string;
}

interface DashboardProps {
  kpi: KpiItem[];
  quickStats?: Record<string, string>;
  recentActivity?: RecentActivityItem[];
  needsAttention?: AttentionItem[];
}

export default function Dashboard({ kpi, quickStats, recentActivity, needsAttention }: DashboardProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D1B2A] tracking-tight">
          System Overview
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          High-level operational health and real-time package throughput across all parks.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpi?.map((item) => {
          const Icon = IconMap[item.icon] || Package;
          return (
            <div
              key={item.label}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#64748B] tracking-wide uppercase">
                  {item.label}
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0D1B2A] tabular-nums">
                {item.value}
              </div>
              {item.sub && <p className="text-xs text-[#94A3B8] mt-1.5">{item.sub}</p>}
              {item.trend && (
                <div className="mt-2.5 flex items-center">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
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

      {/* Attention Callout if needed */}
      {needsAttention && needsAttention.length > 0 && (
        <div className="rounded-2xl border border-[#FDE68A] bg-[#FEF3C7] p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[#92400E]">
              Overdue Packages Alert ({needsAttention.length} waiting &gt;24 hours)
            </h3>
            <p className="text-xs text-[#B45309] mt-0.5">
              These parcels require phone confirmation or follow-up before storage fee escalation.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {needsAttention.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/packages/${p.id}`}
                  className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-white text-[#92400E] px-2.5 py-1 rounded-lg border border-[#FDE68A] hover:bg-[#FEF3C7]"
                >
                  <span>{p.code}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      {quickStats && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs">
          <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">
            Operational Heartbeat
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(quickStats).map(([key, val]) => (
              <div
                key={key}
                className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#334155]"
              >
                {val}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#0D1B2A]">Recent Operations Log</h2>
            <p className="text-xs text-[#64748B]">Real-time package life-cycle events</p>
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
            recentActivity.map((item, i) => (
              <div key={i} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      item.type === 'package_collected'
                        ? 'bg-[#10B981]'
                        : item.type === 'package_received'
                        ? 'bg-[#2563EB]'
                        : 'bg-[#64748B]'
                    }`}
                  />
                  <p className="text-sm font-medium text-[#0D1B2A]">{item.description}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#94A3B8] shrink-0 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>{item.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#94A3B8] py-4 text-center">No recent package activity recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
