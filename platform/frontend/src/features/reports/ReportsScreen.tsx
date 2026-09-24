import { useState, useMemo } from 'react';
import { useOnline } from '@/features/auth/lib/useOnline';
import { useAuth } from '@/features/auth/AuthContext';
import { useRangeReport, type ReportPreset } from './api/useRangeReport';
import { ReportsStrings } from './strings';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/offline/db/database';
import { type LocalPackage } from '@/offline/db/schema';
import { isOverdue24h } from '@/features/packages/domain/package-filters';
import { ChevronLeft, Share2, AlertCircle, BarChart3, Clock, DollarSign, Package, UserCheck, Inbox } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function ReportsScreen() {
  const isOnline = useOnline();
  const { business } = useAuth();
  const businessId = business?.id;
  const [preset, setPreset] = useState<ReportPreset>('today');
  const { data: report, isLoading, isError, refetch } = useRangeReport(preset);

  // Still compute overdue from Dexie directly because the logic expects the
  // raw packages. Missing the business_id filter here meant this counted
  // WAITING packages across every business ever synced to this device's
  // local database, not just the current one — which is how "Currently
  // overdue" could show a larger number than the report's own (correctly
  // business-scoped) "Still waiting" count.
  const waitingPackages = useLiveQuery(
    () =>
      businessId
        ? db.packages.where({ business_id: businessId, status: 'WAITING' }).toArray()
        : [],
    [businessId]
  );

  const currentlyOverdueCount = useMemo(() => {
    if (!waitingPackages) return 0;
    const now = new Date();
    return waitingPackages.filter((pkg: LocalPackage) => isOverdue24h(pkg.client_created_at, now)).length;
  }, [waitingPackages]);

  const handleShare = () => {
    if (!report) return;
    const m = report.metrics;
    let text = `*ParkDrop Report: ${presetToTitle(preset)}*\n\n`;
    text += `📦 Received: ${m.received_count}\n`;
    text += `✅ Collected: ${m.collected_count}\n`;
    text += `💰 Revenue: ₦${(m.revenue_collected_minor / 100).toLocaleString()}\n`;
    text += `⏳ Still waiting: ${m.waiting_now_count} (Overdue: ${currentlyOverdueCount})\n`;
    if (m.avg_pickup_time_seconds) {
      text += `⏱️ Avg pickup time: ${formatDuration(m.avg_pickup_time_seconds)}\n`;
    }
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const presetToTitle = (p: ReportPreset) => {
    switch (p) {
      case 'today': return ReportsStrings.tabToday;
      case 'this_week': return ReportsStrings.tabThisWeek;
      case 'last_7_days': return ReportsStrings.tabLast7Days;
      case 'last_30_days': return ReportsStrings.tabLast30Days;
    }
  };

  const maxChartVal = useMemo(() => {
    if (!report?.daily_chart?.length) return 0;
    return Math.max(...report.daily_chart.map((d) => d.received_count));
  }, [report?.daily_chart]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--pd-page)] max-w-lg mx-auto pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[var(--pd-line)] px-4 h-[64px] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to="/more"
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[var(--pd-navy)] hover:bg-[var(--pd-bg-hover)] active:bg-[var(--pd-bg-active)] transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-[20px] font-extrabold text-[var(--pd-navy)] m-0 leading-none">
            {ReportsStrings.title}
          </h1>
        </div>
        <button
          onClick={handleShare}
          disabled={!report}
          className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-[var(--pd-blue)] hover:bg-[var(--pd-bg-hover)] active:bg-[var(--pd-bg-active)] transition-colors disabled:opacity-50"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      {/* Tabs */}
      <div className="px-4 py-3 bg-white border-b border-[var(--pd-line)]">
        <div className="flex p-1 bg-[var(--pd-line-2)] rounded-[var(--pd-field-radius)]">
          {(['today', 'this_week', 'last_7_days', 'last_30_days'] as ReportPreset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`flex-1 py-1.5 text-[14px] font-extrabold rounded-[calc(var(--pd-field-radius)-4px)] transition-all ${
                preset === p
                  ? 'bg-white text-[var(--pd-navy)] shadow-xs'
                  : 'text-[var(--pd-muted)] hover:text-[var(--pd-navy)]'
              }`}
            >
              {presetToTitle(p)}
            </button>
          ))}
        </div>
      </div>

      {!isOnline && (
        <div className="p-4 bg-[var(--pd-warn-bg)] border-b border-[var(--pd-warn)]/30 flex items-center gap-2 text-[var(--pd-warn)]">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-[14px] font-bold">{ReportsStrings.requiresInternet}</span>
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col gap-4">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-[var(--pd-muted)] gap-2">
            <div className="w-6 h-6 border-2 border-[var(--pd-blue)] border-t-transparent rounded-full animate-spin" />
            <span className="text-[15px] font-bold">{ReportsStrings.loading}</span>
          </div>
        ) : isError ? (
          <div className="py-10 text-center flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-[var(--pd-bad)]" />
            <span className="text-[15px] font-bold text-[var(--pd-muted)]">{ReportsStrings.error}</span>
            <button onClick={() => refetch()} className="text-[var(--pd-blue)] font-extrabold px-4 py-2">
              {ReportsStrings.retry}
            </button>
          </div>
        ) : report ? (
          <>
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={<Inbox className="w-4.5 h-4.5 text-blue-600" />}
                iconBg="bg-blue-50"
                label={ReportsStrings.received}
                value={report.metrics.received_count}
              />
              <MetricCard
                icon={<Package className="w-4.5 h-4.5 text-green-600" />}
                iconBg="bg-green-50"
                label={ReportsStrings.collected}
                value={report.metrics.collected_count}
              />
              <MetricCard
                icon={<DollarSign className="w-4.5 h-4.5 text-emerald-600" />}
                iconBg="bg-emerald-50"
                label={ReportsStrings.revenue}
                value={`₦${(report.metrics.revenue_collected_minor / 100).toLocaleString()}`}
              />
              <MetricCard
                icon={<Clock className="w-4.5 h-4.5 text-amber-600" />}
                iconBg="bg-amber-50"
                label={ReportsStrings.waitingNow}
                value={report.metrics.waiting_now_count}
              />
            </div>

            {/* Highlights List */}
            <div className="bg-white border border-[var(--pd-line)] rounded-[var(--pd-card-radius)] overflow-hidden">
              <HighlightRow label={ReportsStrings.overdue} value={currentlyOverdueCount.toString()} isBad={currentlyOverdueCount > 0} />
              {report.metrics.avg_pickup_time_seconds !== null && (
                <HighlightRow label={ReportsStrings.avgPickupTime} value={formatDuration(report.metrics.avg_pickup_time_seconds)} />
              )}
              {report.metrics.returned_cancelled_count > 0 && (
                <HighlightRow label={ReportsStrings.returnedCancelled} value={report.metrics.returned_cancelled_count.toString()} isNeutral />
              )}
              {report.metrics.busiest_day && (
                <HighlightRow 
                  label={ReportsStrings.busiestDay} 
                  value={`${report.metrics.busiest_day.short_label} (${report.metrics.busiest_day.received_count})`} 
                />
              )}
            </div>

            {/* Bar Chart */}
            {report.daily_chart && report.daily_chart.length > 1 && (
              <div className="bg-white border border-[var(--pd-line)] rounded-[var(--pd-card-radius)] p-4 flex flex-col gap-4">
                <h3 className="text-[16px] font-extrabold text-[var(--pd-navy)] m-0 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[var(--pd-muted)]" />
                  {ReportsStrings.chartTitle}
                </h3>
                
                <div className="h-32 flex items-end gap-1 w-full mt-2">
                  {report.daily_chart.map((day, idx) => {
                    const hPercent = maxChartVal > 0 ? (day.received_count / maxChartVal) * 100 : 0;
                    // Only label min/max for 30 days, or all for 7 days
                    const showLabel = report.daily_chart.length <= 7 || idx === 0 || idx === report.daily_chart.length - 1 || day.received_count === maxChartVal;
                    // 30 narrow columns leaves no room for a number over
                    // every bar — the "0" labels ran into each other. Most
                    // days in that view are 0 anyway, so only label the
                    // ones with something to say.
                    const showValueLabel = report.daily_chart.length <= 7 || day.received_count > 0;

                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center justify-end gap-1 h-full group">
                        <span className="text-[11px] font-bold text-[var(--pd-navy)] tabular-nums h-3.5">
                          {showValueLabel && day.received_count}
                        </span>
                        <div
                          className="w-full bg-[var(--pd-blue)] rounded-t-sm opacity-90 group-hover:opacity-100 transition-opacity min-h-[4px]"
                          style={{ height: `${hPercent}%` }}
                        />
                        <div className="h-4 flex items-center justify-center">
                          {showLabel && (
                            <span className="text-[10px] font-bold text-[var(--pd-muted)] -rotate-45 block mt-2">
                              {day.short_label}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Staff Breakdown */}
            {report.staff_breakdown && report.staff_breakdown.length > 0 && (
              <div className="bg-white border border-[var(--pd-line)] rounded-[var(--pd-card-radius)] p-4 flex flex-col gap-3">
                <h3 className="text-[16px] font-extrabold text-[var(--pd-navy)] m-0 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[var(--pd-muted)]" />
                  {ReportsStrings.staffTitle}
                </h3>
                <div className="flex flex-col gap-2">
                  {report.staff_breakdown.map((staff) => (
                    <div key={staff.name} className="flex items-center justify-between py-2 border-b border-[var(--pd-line-2)] last:border-0 last:pb-0">
                      <span className="font-extrabold text-[15px] text-[var(--pd-navy)]">{staff.name}</span>
                      <div className="flex flex-col items-end text-[13px] font-bold text-[var(--pd-muted)]">
                        <span>{staff.received} {ReportsStrings.logged}</span>
                        <span>{staff.released} {ReportsStrings.released}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  iconBg,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white border border-[var(--pd-line)] rounded-[var(--pd-card-radius)] p-3.5 flex flex-col gap-3 shadow-xs">
      <div className="flex items-center gap-2">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </span>
        <span className="text-[13px] font-bold text-[var(--pd-muted)] leading-tight">{label}</span>
      </div>
      <span className="text-[26px] font-black text-[var(--pd-navy)] tabular-nums leading-none">{value}</span>
    </div>
  );
}

function HighlightRow({ label, value, isBad, isNeutral }: { label: string; value: string; isBad?: boolean; isNeutral?: boolean }) {
  const color = isBad ? 'text-[var(--pd-bad)]' : (isNeutral ? 'text-[var(--pd-muted)]' : 'text-[var(--pd-navy)]');
  return (
    <div className="flex items-center justify-between p-4 border-b border-[var(--pd-line-2)] last:border-0">
      <span className="text-[15px] font-extrabold text-[var(--pd-muted)]">{label}</span>
      <span className={`text-[15px] font-black tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const d = Math.floor(h / 24);
  if (d > 0) return `about ${d} ${d === 1 ? 'day' : 'days'}`;
  if (h > 0) return `about ${h} ${h === 1 ? 'hour' : 'hours'}`;
  return 'under an hour';
}
