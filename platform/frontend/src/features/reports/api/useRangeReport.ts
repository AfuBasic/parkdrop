import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthContext';

export type ReportPreset = 'today' | 'this_week' | 'last_7_days' | 'last_30_days';

export interface RangeReportResponse {
  preset: string;
  timezone: string;
  scope: {
    type: string;
    pickup_point_id?: number | null;
  };
  metrics: {
    received_count: number;
    collected_count: number;
    revenue_collected_minor: number;
    waiting_now_count: number;
    returned_cancelled_count: number;
    avg_pickup_time_seconds: number | null;
    busiest_day?: {
      date: string;
      short_label: string;
      received_count: number;
    } | null;
  };
  daily_chart: Array<{
    date: string;
    short_label: string;
    received_count: number;
  }>;
  staff_breakdown: Array<{
    name: string;
    received: number;
    released: number;
  }>;
}

export function useRangeReport(preset: ReportPreset) {
  const { auth } = useAuth();

  return useQuery<RangeReportResponse>({
    queryKey: ['reports', 'range', auth?.business_id, preset],
    queryFn: async () => {
      const res = await fetchApi(`/api/v1/reports/range?preset=${preset}`);
      return res.json();
    },
    enabled: !!auth?.business_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
