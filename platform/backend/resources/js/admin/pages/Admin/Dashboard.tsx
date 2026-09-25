import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Building2, Package, TrendingUp, TrendingDown, MessageSquare } from 'lucide-react';

export default function Dashboard({ kpi, quickStats, recentActivity, needsAttention }: any) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-[#0D1B2A]">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpi.map((item: any) => (
          <div key={item.label} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                <item.icon className="w-5 h-5 text-[#2563EB]" />
              </div>
              <span className="text-sm text-[#475569]">{item.label}</span>
            </div>
            <div className="text-3xl font-bold text-[#0D1B2A]">{item.value}</div>
            {item.sub && <p className="text-xs text-[#94A3B8] mt-1">{item.sub}</p>}
            {item.trend && (
              <span className={`inline-flex items-center gap-1 text-xs font-medium mt-2 px-2 py-1 rounded-full ${item.trend.up ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-[#FEF2F2] text-[#B91C1C]'}`}>
                {item.trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {item.trend.value}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#475569] uppercase tracking-wide mb-3">Quick Stats</h2>
        <div className="flex flex-wrap gap-3">
          {quickStats && Object.entries(quickStats).map(([key, val]: [string, any]) => (
            <span key={key} className="text-sm text-[#475569] bg-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E2E8F0]">{val}</span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#475569] uppercase tracking-wide">Recent Activity</h2>
          <Link href="/admin/packages" className="text-sm text-[#2563EB] hover:underline">View all</Link>
        </div>
        <div className="space-y-3">
          {recentActivity?.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-3 pb-3 border-b border-[#E2E8F0] last:border-0">
              <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <div className="flex-1">
                <p className="text-sm text-[#0D1B2A]">{item.description}</p>
                <p className="text-xs text-[#94A3B8]">{item.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
