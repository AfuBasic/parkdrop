import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Download, WifiOff } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { ReportDateNavigator } from '@/features/reports/components/ReportDateNavigator';
import { ReportScopeSelector } from '@/features/reports/components/ReportScopeSelector';
import { DailyPackageSummary } from '@/features/reports/components/DailyPackageSummary';
import { DailyPaymentSummary } from '@/features/reports/components/DailyPaymentSummary';
import { DailyActivityList } from '@/features/reports/components/DailyActivityList';
import { useDailyOperationsReport } from '@/features/reports/hooks/useDailyOperationsReport';
import { downloadDailyReportCsv } from '@/features/reports/api/reports-api';
import { DailyOperationsReportRepository } from '@/offline/read-models/daily-operations-report-repository';
import { TaskHeader } from '@/design-system/shell/TaskHeader';
import { ReportsStrings } from '@/features/reports/strings';

interface DailyOperationsScreenProps {
  onBack?: () => void;
}

export function DailyOperationsScreen({ onBack }: DailyOperationsScreenProps) {
  const routerNavigate = useNavigate();
  const handleBack = onBack ?? (() => routerNavigate({ to: '/more' }));
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

  if (role === 'attendant') {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--pd-page-2)] w-full max-w-lg mx-auto">
        <TaskHeader title={ReportsStrings.title} onBack={handleBack} screenName="Daily operations" />
        <div className="p-8 text-center bg-white border border-[var(--pd-line-2)] rounded-[var(--pd-card-radius)] m-4">
          <p className="text-[16px] font-semibold text-[var(--pd-muted)] m-0">{ReportsStrings.restrictedBody}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--pd-page-2)] w-full max-w-lg mx-auto pb-8">
      <TaskHeader
        title={ReportsStrings.title}
        onBack={handleBack}
        screenName="Daily operations"
        subtitle={business?.name}
      />

      <main className="flex-1 p-4 flex flex-col gap-4">
        {isOnline && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="min-h-[48px] px-3 inline-flex items-center gap-1.5 rounded-[var(--pd-field-radius)] border border-[var(--pd-line-2)] bg-white text-[15px] font-bold text-[var(--pd-navy)] cursor-pointer"
              aria-label={ReportsStrings.exportCsv}
            >
              <Download className="w-4 h-4 text-[var(--pd-blue)]" strokeWidth={2.25} aria-hidden="true" />
              <span>{isExporting ? ReportsStrings.exporting : ReportsStrings.exportCsv}</span>
            </button>
          </div>
        )}

        <ReportDateNavigator currentDate={currentDate} onDateChange={setCurrentDate} />

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <ReportScopeSelector pickupPoints={pickupPoints} currentScope={scope} onScopeChange={setScope} />

          {!isOnline && (
            <span className="flex items-center gap-1.5 text-[15px] font-bold text-[var(--pd-warn)] bg-[var(--pd-warn-bg)] px-2.5 py-1 rounded-full border border-[var(--pd-warn)]/25">
              <WifiOff className="w-4 h-4" strokeWidth={2.25} aria-hidden="true" />
              <span>{ReportsStrings.showingLocalData}</span>
            </span>
          )}
        </div>

        {isLoading && (
          <div className="p-8 text-center bg-white border border-[var(--pd-line-2)] rounded-[var(--pd-card-radius)]">
            <div className="w-6 h-6 border-2 border-[var(--pd-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-[15px] font-semibold text-[var(--pd-muted)] m-0">{ReportsStrings.loading}</p>
          </div>
        )}

        {!isLoading && summary?.completeness === 'HISTORICAL_UNAVAILABLE_OFFLINE' && (
          <div className="p-6 text-center bg-white border border-[var(--pd-line-2)] rounded-[var(--pd-card-radius)] flex flex-col items-center gap-2">
            <WifiOff className="w-6 h-6 text-[var(--pd-muted)]" strokeWidth={2.25} aria-hidden="true" />
            <p className="text-[16px] font-bold text-[var(--pd-navy)] m-0">{ReportsStrings.historicalUnavailableTitle}</p>
            <p className="text-[15px] font-semibold text-[var(--pd-muted)] max-w-xs m-0">
              {ReportsStrings.historicalUnavailableBody}
            </p>
          </div>
        )}

        {serverError && !isLoading && (
          <div className="p-4 bg-[var(--pd-bad-bg)] border border-[var(--pd-bad)]/25 rounded-[var(--pd-field-radius)] text-[15px] font-semibold text-[var(--pd-bad)]">
            {serverError}
          </div>
        )}

        {!isLoading && summary && summary.completeness !== 'HISTORICAL_UNAVAILABLE_OFFLINE' && (
          <>
            <DailyPackageSummary metrics={summary.packages} isToday={isToday} />
            <DailyPaymentSummary metrics={summary.payments} />
            <DailyActivityList events={events} showPickupPoint={isBusinessWide} />
          </>
        )}
      </main>
    </div>
  );
}
