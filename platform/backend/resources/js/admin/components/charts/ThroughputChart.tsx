import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

interface ChartDataPoint {
  date: string;
  received: number;
  collected: number;
  revenue?: number;
}

interface ThroughputChartProps {
  data: ChartDataPoint[];
}

export function ThroughputChart({ data }: ThroughputChartProps) {
  const [metric, setMetric] = useState<'packages' | 'revenue'>('packages');

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
            7-Day Operational Throughput
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Daily inbound package registrations vs. successful customer pick-ups
          </p>
        </div>

        {/* Metric Selector Pill */}
        <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] w-fit">
          <button
            type="button"
            onClick={() => setMetric('packages')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metric === 'packages'
                ? 'bg-white text-[#2563EB] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Packages Count
          </button>
          <button
            type="button"
            onClick={() => setMetric('revenue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metric === 'revenue'
                ? 'bg-white text-[#2563EB] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Revenue (₦)
          </button>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {metric === 'packages' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: '#F8FAFC' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#0F172A] text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-bold text-[#94A3B8]">{label}</p>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[#60A5FA]">Received:</span>
                          <span className="font-bold font-mono">{payload[0]?.value}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[#34D399]">Collected:</span>
                          <span className="font-bold font-mono">{payload[1]?.value}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
              />
              <Bar
                name="Packages Received"
                dataKey="received"
                fill="#2563EB"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                name="Packages Collected"
                dataKey="collected"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                      <div className="bg-[#0F172A] text-white p-3 rounded-xl shadow-xl text-xs">
                        <p className="font-bold text-[#94A3B8] mb-1">{label}</p>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[#34D399]">Revenue:</span>
                          <span className="font-bold font-mono text-emerald-400">
                            ₦{Number(payload[0]?.value).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                name="Collected Revenue (₦)"
                dataKey="revenue"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
