import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { DailyOperationsReportRepository } from '@/offline/read-models/daily-operations-report-repository';

interface ReportDateNavigatorProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
}

export function ReportDateNavigator({
  currentDate,
  onDateChange,
}: ReportDateNavigatorProps) {
  const todayLocal = DailyOperationsReportRepository.getTodayLocalString();
  const isToday = currentDate === todayLocal;

  const handlePreviousDay = () => {
    const [year, month, day] = currentDate.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day - 1));
    onDateChange(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    if (isToday) return;
    const [year, month, day] = currentDate.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + 1));
    const nextStr = date.toISOString().split('T')[0];
    if (nextStr <= todayLocal) {
      onDateChange(nextStr);
    }
  };

  const handleTodayClick = () => {
    onDateChange(todayLocal);
  };

  // Format display string e.g. "Today · Sep 21" or "Mon, Sep 20"
  const formattedDisplay = (() => {
    if (isToday) {
      const d = new Date(`${currentDate}T12:00:00Z`);
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      return `Today · ${monthDay}`;
    }
    const yesterday = DailyOperationsReportRepository.getYesterdayLocalString();
    if (currentDate === yesterday) {
      const d = new Date(`${currentDate}T12:00:00Z`);
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      return `Yesterday · ${monthDay}`;
    }
    const d = new Date(`${currentDate}T12:00:00Z`);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  })();

  return (
    <div className="flex items-center justify-between bg-surface-default border border-border-subtle rounded-[var(--radius-xl)] p-2 shadow-xs">
      <button
        type="button"
        onClick={handlePreviousDay}
        className="w-11 h-11 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-subtle active:scale-95 transition-all cursor-pointer"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2">
        <label className="relative flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-md hover:bg-surface-subtle transition-colors">
          <Calendar className="w-4 h-4 text-action-primary" />
          <span className="font-semibold text-text-primary text-sm tabular-nums">
            {formattedDisplay}
          </span>
          <input
            type="date"
            max={todayLocal}
            value={currentDate}
            onChange={(e) => {
              if (e.target.value && e.target.value <= todayLocal) {
                onDateChange(e.target.value);
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            aria-label="Select report date"
          />
        </label>

        {!isToday && (
          <button
            type="button"
            onClick={handleTodayClick}
            className="text-xs font-semibold px-2 py-1 rounded-md bg-blue-50 text-action-primary hover:bg-blue-100 transition-colors cursor-pointer"
          >
            Today
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={handleNextDay}
        disabled={isToday}
        className={`w-11 h-11 flex items-center justify-center rounded-lg transition-all ${
          isToday
            ? 'text-text-muted/40 cursor-not-allowed'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle active:scale-95 cursor-pointer'
        }`}
        aria-label="Next day"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
