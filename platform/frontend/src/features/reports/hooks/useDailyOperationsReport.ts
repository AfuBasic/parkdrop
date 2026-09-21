import * as React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { DailyOperationsReportRepository } from '@/offline/read-models/daily-operations-report-repository';
import { fetchServerDailySummary, fetchServerDailyEvents } from '@/features/reports/api/reports-api';
import type { DailyOperationsSummary, DailyOperationalEventItem } from '@/features/reports/report-types';

interface UseDailyOperationsReportOptions {
  businessId: number;
  date: string;
  scope: 'all' | number;
  isOnline: boolean;
}

export function useDailyOperationsReport({
  businessId,
  date,
  scope,
  isOnline,
}: UseDailyOperationsReportOptions) {
  const [serverSummary, setServerSummary] = React.useState<DailyOperationsSummary | null>(null);
  const [serverEvents, setServerEvents] = React.useState<DailyOperationalEventItem[] | null>(null);
  const [isLoadingServer, setIsLoadingServer] = React.useState<boolean>(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  // Local live queries for Dexie
  const localSummary = useLiveQuery(
    () => {
      if (!businessId) return null;
      return DailyOperationsReportRepository.getLocalSummary(businessId, date, scope, isOnline);
    },
    [businessId, date, scope, isOnline]
  );

  const localEvents = useLiveQuery(
    () => {
      if (!businessId) return [];
      return DailyOperationsReportRepository.getLocalEvents(businessId, date, scope);
    },
    [businessId, date, scope]
  );

  // Determine if date is today or yesterday in local time
  const todayLocal = DailyOperationsReportRepository.getTodayLocalString();
  const isRecentDate = date === todayLocal || date === DailyOperationsReportRepository.getYesterdayLocalString();

  // Load from server when online or for older historical dates
  React.useEffect(() => {
    let isCancelled = false;

    if (!businessId || !isOnline) {
      setServerSummary(null);
      setServerEvents(null);
      setIsLoadingServer(false);
      return;
    }

    async function loadServerData() {
      setIsLoadingServer(true);
      setServerError(null);

      try {
        const [summaryRes, eventsRes] = await Promise.all([
          fetchServerDailySummary(businessId, date, scope),
          fetchServerDailyEvents(businessId, date, scope, 50, 0),
        ]);

        if (!isCancelled) {
          setServerSummary(summaryRes);
          setServerEvents(eventsRes.events);
          setIsLoadingServer(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setServerError(err.message === 'UNAUTHORIZED' ? 'Unauthorized to view operational reports.' : 'Could not load report from server.');
          setIsLoadingServer(false);
        }
      }
    }

    loadServerData();

    return () => {
      isCancelled = true;
    };
  }, [businessId, date, scope, isOnline]);

  // If online and serverSummary is ready, use it for deep historical, otherwise fallback to local Dexie
  const summary: DailyOperationsSummary | null = (isOnline && serverSummary)
    ? serverSummary
    : localSummary ?? null;

  const events: DailyOperationalEventItem[] = (isOnline && serverEvents)
    ? serverEvents
    : localEvents ?? [];

  return {
    summary,
    events,
    isLoading: !summary && isLoadingServer,
    isOnline,
    isRecentDate,
    serverError,
  };
}
