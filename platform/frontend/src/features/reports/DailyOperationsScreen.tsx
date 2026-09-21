import * as React from 'react';
import { ArrowLeft, Download, WifiOff } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { ReportDateNavigator } from '@/features/reports/components/ReportDateNavigator';
import { ReportScopeSelector } from '@/features/reports/components/ReportScopeSelector';
import { DailyPackageSummary } from '@/features/reports/components/DailyPackageSummary';
import { DailyPaymentSummary } from '@/features/reports/components/DailyPaymentSummary';
import { DailyActivityList } from '@/features/reports/components/DailyActivityList';
import { useDailyOperationsReport } from '@/features/reports/hooks/useDailyOperationsReport';
import { downloadDailyReportCsv } from '@/features/reports/api/reports-api';
import { DailyOperationsReportRepository } from '@/offline/read-models/daily-operations-report-repository';

interface DailyOperationsScreenProps {
  onBack: () => void;
}

export function DailyOperationsScreen({ onBack }: DailyOperationsScreenProps) {
  const { business, role } = useAuth();
  const [currentDate, setCurrentDate] = React.useState<string>(() =>
    DailyOperationsReportRepository.getTodayLocalString()
  );
  const [scope, setScope] = React.useState<'all' | number>('all');
  const [isExporting, setIsExporting] = React.useState(false);

  const isOnline = navigator.onLine;

  const { summary, events, isLoading, serverError } = useDailyOperationsReport({
    businessId: business?.id ?? 0,
    date: currentDate,
    scope,
    isOnline,
  });

  const pickupPoints = (business?.pickup_points || []).map((p: any) => ({
    id: p.id,
    name: p.name,
  }));

  const isToday = currentDate === DailyOperationsReportRepository.getTodayLocalString();
  const isBusinessWide = scope === 'all';

  const handleExport = () => {
    if (!business?.id || !isOnline) return;
    setIsExporting(true);
    try {
      downloadDailyReportCsv(business.id, currentDate, scope);
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  // If user is attendant, show unauthorized message
  if (role === 'attendant') {
    return (
      <div className="flex flex-col h-full max-w-lg mx-auto p-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm font-semibold mb-4 min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Settings</span>
        </button>
        <div className="p-8 text-center bg-surface-default border border-border-subtle rounded-[var(--radius-xl)] mt-4">
          <p className="text-text-secondary text-sm font-medium">
            Operational reports are restricted to Business Owners and Managers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto pb-8 pt-2 px-4 gap-4">
      {/* Screen Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm font-semibold min-h-[44px] cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Settings</span>
        </button>

        {isOnline && (
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-default hover:bg-surface-subtle text-xs font-semibold text-text-primary transition-colors cursor-pointer min-h-[44px]"
            aria-label="Export daily report as CSV"
          >
            <Download className="w-3.5 h-3.5 text-action-primary" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Daily operations</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          {business?.name || 'Business'} · Africa/Lagos (WAT)
        </p>
      </div>

      {/* Date Navigator */}
      <ReportDateNavigator currentDate={currentDate} onDateChange={setCurrentDate} />

      {/* Location Scope Selector */}
      <div className="flex items-center justify-between">
        <ReportScopeSelector
          pickupPoints={pickupPoints}
          currentScope={scope}
          onScopeChange={setScope}
        />

        {/* Offline Truthfulness Badge */}
        {!isOnline && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-status-warning-text bg-status-warning-bg px-2 py-0.5 rounded-full border border-status-warning-border">
            <WifiOff className="w-3 h-3" />
            <span>Showing local data</span>
          </span>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center bg-surface-default border border-border-subtle rounded-[var(--radius-xl)]">
          <div className="w-6 h-6 border-2 border-action-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-text-muted">Loading daily report...</p>
        </div>
      )}

      {/* Offline Historical Unavailable State */}
      {!isLoading && summary?.completeness === 'HISTORICAL_UNAVAILABLE_OFFLINE' && (
        <div className="p-6 text-center bg-surface-default border border-border-subtle rounded-[var(--radius-xl)] flex flex-col items-center gap-2">
          <WifiOff className="w-6 h-6 text-text-muted" />
          <p className="text-sm font-semibold text-text-primary">Historical report unavailable offline</p>
          <p className="text-xs text-text-secondary max-w-xs">
            This date is not saved on this device. Connect to the internet to view this report.
          </p>
        </div>
      )}

      {/* Server Error State */}
      {serverError && !isLoading && (
        <div className="p-4 bg-status-danger-bg border border-status-danger-border rounded-[var(--radius-lg)] text-xs text-status-danger-text">
          {serverError}
        </div>
      )}

      {/* Operational Metrics Summaries */}
      {!isLoading && summary && summary.completeness !== 'HISTORICAL_UNAVAILABLE_OFFLINE' && (
        <>
          <DailyPackageSummary metrics={summary.packages} isToday={isToday} />
          <DailyPaymentSummary metrics={summary.payments} />
          <DailyActivityList events={events} showPickupPoint={isBusinessWide} />
        </>
      )}
    </div>
  );
}
