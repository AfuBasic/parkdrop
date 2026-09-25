import React from 'react';
import { router } from '@inertiajs/react';
import {
  Banknote,
  Package,
  TrendingUp,
  AlertCircle,
  Building2,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { ToggleGroup } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface FinanceProps {
  period: string;
  kpi: {
    revenueMinor: number;
    revenueFormatted: string;
    collected: number;
    averageFormatted: string;
    owedFormatted: string;
  };
  dailyRevenue: {
    date: string;
    revenue: number;
    count: number;
  }[];
  byPickupPoint: {
    id: number;
    name: string;
    park: string;
    revenueMinor: number;
    revenueFormatted: string;
    packagesCount: number;
  }[];
}

export default function Finance({ period, kpi, dailyRevenue, byPickupPoint }: FinanceProps) {
  const handlePeriodChange = (newPeriod: string) => {
    router.get('/admin/finance', { period: newPeriod }, { preserveState: true, preserveScroll: true });
  };

  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header and Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Finance</h1>
          <p className="text-xs text-[#475569] mt-0.5">
            Verified storage fee collections from customers upon parcel release.
          </p>
        </div>

        <ToggleGroup
          value={period}
          onValueChange={handlePeriodChange}
          options={periodOptions}
        />
      </div>

      {/* KPI Cards — Spec: 4 columns, Green accent on revenue, warning accent on owed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue Collected */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs border-l-4 border-l-[#10B981]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[#475569]">Revenue Collected</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[28px] font-extrabold text-[#0F172A] tabular-nums tracking-tight">
            {kpi?.revenueFormatted || '₦0.00'}
          </div>
          <p className="text-[11px] text-[#10B981] font-semibold mt-1">Paid & verified in cash/transfer</p>
        </div>

        {/* Card 2: Packages Collected */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs border-l-4 border-l-[#2563EB]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[#475569]">Packages Collected</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[28px] font-extrabold text-[#0F172A] tabular-nums tracking-tight">
            {kpi?.collected || 0}
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1">Completed pickups in period</p>
        </div>

        {/* Card 3: Average per Package */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs border-l-4 border-l-[#64748B]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[#475569]">Average per Package</span>
            <div className="w-8 h-8 rounded-full bg-slate-50 text-[#64748B] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[28px] font-extrabold text-[#0F172A] tabular-nums tracking-tight">
            {kpi?.averageFormatted || '₦0.00'}
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1">Average storage fee charged</p>
        </div>

        {/* Card 4: Total Amount Owed (Warning accent per spec) */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs border-l-4 border-l-[#F59E0B]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-[#475569]">Total Amount Owed</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-[#D97706] flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[28px] font-extrabold text-[#92400E] tabular-nums tracking-tight">
            {kpi?.owedFormatted || '₦0.00'}
          </div>
          <p className="text-[11px] text-[#B45309] font-medium mt-1">Pending collection on waiting packages</p>
        </div>
      </div>

      {/* REVENUE BAR CHART — Spec §6.6: One bar per day, #2563EB fill, rounded top, hover tooltip */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">Daily Revenue Trend</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Cash intake per calendar day for {periodOptions.find(p => p.value === period)?.label.toLowerCase()}
            </p>
          </div>
        </div>

        <div className="h-[280px] w-full">
          {dailyRevenue && dailyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  tickFormatter={(val) => `₦${val}`}
                />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0F172A] text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-[#94A3B8]">{label}</p>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[#34D399]">Revenue:</span>
                            <span className="font-bold font-mono">
                              ₦{Number(payload[0]?.value).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[#60A5FA]">Packages:</span>
                            <span className="font-mono">{payload[0]?.payload?.count}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue (₦)"
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[#94A3B8]">
              No revenue transactions recorded in this period.
            </div>
          )}
        </div>
      </div>

      {/* REVENUE BY PICKUP POINT TABLE — Spec §6.6 */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-base font-bold text-[#0F172A] tracking-tight">Revenue by Pickup Point</h2>
          <p className="text-xs text-[#64748B]">Ranked by total revenue collected in this timeframe</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
          <Table>
            <TableHeader className="bg-[#F8FAFC]">
              <TableRow>
                <TableHead className="font-semibold text-xs text-[#475569]">Pickup Point</TableHead>
                <TableHead className="font-semibold text-xs text-[#475569]">Park</TableHead>
                <TableHead className="font-semibold text-xs text-[#475569] text-center">Packages Collected</TableHead>
                <TableHead className="font-semibold text-xs text-[#475569] text-right">Revenue (₦)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byPickupPoint && byPickupPoint.length > 0 ? (
                byPickupPoint.map((biz) => (
                  <TableRow key={biz.id} className="hover:bg-[#F8FAFC]">
                    <TableCell className="font-semibold text-sm text-[#0F172A]">
                      {biz.name}
                    </TableCell>
                    <TableCell className="text-xs text-[#64748B]">
                      {biz.park}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm tabular-nums">
                      {biz.packagesCount}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm text-emerald-700 tabular-nums">
                      {biz.revenueFormatted}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-xs text-[#94A3B8]">
                    No revenue recorded in this period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
