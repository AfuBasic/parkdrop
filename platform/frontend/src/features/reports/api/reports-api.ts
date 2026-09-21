import type { DailyOperationsSummary, DailyOperationalEventItem } from '@/features/reports/report-types';

export interface DailyOperationsEventsResponse {
  events: DailyOperationalEventItem[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export async function fetchServerDailySummary(
  businessId: number,
  date: string,
  scope: 'all' | number = 'all'
): Promise<DailyOperationsSummary> {
  const scopeParam = scope === 'all' ? 'all' : scope.toString();
  const url = `/api/v1/reports/daily-operations?business_id=${businessId}&date=${date}&scope=${scopeParam}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error('FAILED_TO_LOAD_REPORT');
  }

  const data = await response.json();

  return {
    date: data.date,
    timezone: data.timezone,
    scope: {
      type: data.scope.type,
      pickupPointId: data.scope.pickup_point_id,
      pickupPointName: data.scope.pickup_point_name,
    },
    packages: {
      receivedCount: data.packages.received_count,
      collectedCount: data.packages.collected_count,
      returnedCount: data.packages.returned_count,
      cancelledCount: data.packages.cancelled_count,
      waitingNowCount: data.packages.waiting_now_count,
    },
    payments: {
      recordedCount: data.payments.recorded_count,
      recordedMinor: data.payments.recorded_minor,
      reversedCount: data.payments.reversed_count,
      reversedMinor: data.payments.reversed_minor,
      netMinor: data.payments.net_minor,
      byMethod: {
        cashMinor: data.payments.by_method.cash_minor,
        transferMinor: data.payments.by_method.transfer_minor,
        posMinor: data.payments.by_method.pos_minor,
        otherMinor: data.payments.by_method.other_minor,
      },
    },
    generatedAt: data.generated_at,
    completeness: 'HISTORICAL_SERVER',
  };
}

export async function fetchServerDailyEvents(
  businessId: number,
  date: string,
  scope: 'all' | number = 'all',
  limit = 30,
  offset = 0
): Promise<DailyOperationsEventsResponse> {
  const scopeParam = scope === 'all' ? 'all' : scope.toString();
  const url = `/api/v1/reports/daily-operations/events?business_id=${businessId}&date=${date}&scope=${scopeParam}&limit=${limit}&offset=${offset}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error('FAILED_TO_LOAD_EVENTS');
  }

  const data = await response.json();

  return {
    events: data.events.map((e: any) => ({
      id: e.id,
      type: e.type,
      eventTime: e.event_time,
      packageId: e.package_id,
      publicPackageId: e.public_package_id,
      customerName: e.customer_name,
      pickupPointId: e.pickup_point_id,
      pickupPointName: e.pickup_point_name,
      amountMinor: e.amount_minor,
      paymentMethod: e.payment_method,
      actorName: e.actor_name,
      details: e.details,
    })),
    total: data.total,
    limit: data.limit,
    offset: data.offset,
    has_more: data.has_more,
  };
}

export function downloadDailyReportCsv(
  businessId: number,
  date: string,
  scope: 'all' | number = 'all'
): void {
  const scopeParam = scope === 'all' ? 'all' : scope.toString();
  const url = `/api/v1/reports/daily-operations/export?business_id=${businessId}&date=${date}&scope=${scopeParam}`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', '');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
