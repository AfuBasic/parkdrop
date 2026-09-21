import { db } from '@/offline/db/database';
import type { LocalPackage, LocalPayment } from '@/offline/db/schema';
import type {
  DailyOperationsSummary,
  DailyOperationalEventItem,
  ReportCompletenessState,
  DailyPaymentMethodBreakdown,
} from '@/features/reports/report-types';

export class DailyOperationsReportRepository {
  /**
   * Derives start and end UTC ISO timestamps for a given date in Africa/Lagos (WAT, UTC+1).
   */
  static getLagosDayBounds(localDateString: string): { startUtc: string; endUtc: string } {
    // localDateString: YYYY-MM-DD
    // Start: YYYY-MM-DDT00:00:00+01:00 -> converts to previous day 23:00:00Z
    const [year, month, day] = localDateString.split('-').map(Number);
    
    // In UTC, local midnight WAT is UTC previous day 23:00
    const start = new Date(Date.UTC(year, month - 1, day, -1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month - 1, day + 1, -1, 0, 0, 0));

    return {
      startUtc: start.toISOString(),
      endUtc: end.toISOString(),
    };
  }

  /**
   * Get today's local date string (YYYY-MM-DD) in Africa/Lagos time.
   */
  static getTodayLocalString(): string {
    const now = new Date();
    // Use Intl to format in Africa/Lagos
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now); // en-CA gives YYYY-MM-DD
  }

  /**
   * Get yesterday's local date string in Africa/Lagos time.
   */
  static getYesterdayLocalString(): string {
    const today = this.getTodayLocalString();
    const [year, month, day] = today.split('-').map(Number);
    const prev = new Date(Date.UTC(year, month - 1, day - 1));
    return prev.toISOString().split('T')[0];
  }

  /**
   * Build daily operations summary directly from Dexie IndexedDB.
   */
  static async getLocalSummary(
    businessId: number,
    localDate: string,
    pickupPointScope: 'all' | number = 'all',
    isOnline = false
  ): Promise<DailyOperationsSummary> {
    const { startUtc, endUtc } = this.getLagosDayBounds(localDate);
    const todayLocal = this.getTodayLocalString();
    const isToday = localDate === todayLocal;
    const isYesterday = localDate === this.getYesterdayLocalString();

    const completeness: ReportCompletenessState = isOnline ? 'UP_TO_DATE' : 'OFFLINE_LOCAL';

    // 1. Fetch Packages for Business
    let packages = await db.packages
      .where('business_id')
      .equals(businessId)
      .toArray();

    if (pickupPointScope !== 'all') {
      packages = packages.filter(p => p.pickup_point_id === pickupPointScope);
    }

    // Metric 1: Received count
    const receivedPkgs = packages.filter(p => {
      const ts = p.client_created_at || (p as any).created_at;
      return ts >= startUtc && ts < endUtc;
    });
    const receivedCount = receivedPkgs.length;

    // Metric 2: Collected count
    const collectedPkgs = packages.filter(p => {
      if (p.status !== 'COLLECTED') return false;
      const ts = (p as any).updated_at || p.client_created_at;
      return ts >= startUtc && ts < endUtc;
    });
    const collectedCount = collectedPkgs.length;

    // Metric 3: Returned count
    const returnedPkgs = packages.filter(p => {
      if (p.status !== 'RETURNED') return false;
      const ts = p.returned_at || (p as any).updated_at || p.client_created_at;
      return ts >= startUtc && ts < endUtc;
    });
    const returnedCount = returnedPkgs.length;

    // Metric 4: Cancelled count
    const cancelledPkgs = packages.filter(p => {
      if (p.status !== 'CANCELLED') return false;
      const ts = p.cancelled_at || (p as any).updated_at || p.client_created_at;
      return ts >= startUtc && ts < endUtc;
    });
    const cancelledCount = cancelledPkgs.length;

    // Waiting Now (today only)
    const waitingNowCount = isToday
      ? packages.filter(p => p.status === 'WAITING').length
      : null;

    // 2. Fetch Payments for Business
    let payments = await db.payments
      .where('business_id')
      .equals(businessId)
      .toArray();

    // Map packages for pickup point filtering if scoped
    if (pickupPointScope !== 'all') {
      const packageIdsInPoint = new Set(packages.map(p => p.id));
      payments = payments.filter(pay => packageIdsInPoint.has(pay.package_id));
    }

    // Exclude payments rejected by server (sync_status === 'NEEDS_ATTENTION')
    const validPayments = payments.filter(pay => {
      if (pay.sync_status === 'NEEDS_ATTENTION') return false;
      const ts = pay.recorded_at || pay.client_recorded_at;
      return ts >= startUtc && ts < endUtc;
    });

    const positivePayments = validPayments.filter(p => p.amount_minor > 0 && p.status !== 'REVERSED');
    const reversalPayments = validPayments.filter(p => p.amount_minor < 0 || p.status === 'REVERSED');

    const recordedCount = positivePayments.length;
    const recordedMinor = positivePayments.reduce((acc, p) => acc + (p.amount_minor || 0), 0);

    const reversedCount = reversalPayments.length;
    const reversedMinor = reversalPayments.reduce((acc, p) => acc + Math.abs(p.amount_minor || 0), 0);

    const netMinor = recordedMinor - reversedMinor;

    const byMethod: DailyPaymentMethodBreakdown = {
      cashMinor: 0,
      transferMinor: 0,
      posMinor: 0,
      otherMinor: 0,
    };

    for (const p of positivePayments) {
      if (p.method === 'CASH') byMethod.cashMinor += p.amount_minor;
      else if (p.method === 'TRANSFER') byMethod.transferMinor += p.amount_minor;
      else if (p.method === 'POS') byMethod.posMinor += p.amount_minor;
      else if (p.method === 'OTHER') byMethod.otherMinor += p.amount_minor;
    }

    // Check offline availability flag: if offline and not today/yesterday and no records, mark historical unavailable
    let finalCompleteness = completeness;
    if (!isOnline && !isToday && !isYesterday && packages.length === 0 && payments.length === 0) {
      finalCompleteness = 'HISTORICAL_UNAVAILABLE_OFFLINE';
    }

    return {
      date: localDate,
      timezone: 'Africa/Lagos',
      scope: {
        type: pickupPointScope === 'all' ? 'all' : 'pickup_point',
        pickupPointId: pickupPointScope === 'all' ? null : pickupPointScope,
      },
      packages: {
        receivedCount,
        collectedCount,
        returnedCount,
        cancelledCount,
        waitingNowCount,
      },
      payments: {
        recordedCount,
        recordedMinor,
        reversedCount,
        reversedMinor,
        netMinor,
        byMethod,
      },
      generatedAt: new Date().toISOString(),
      completeness: finalCompleteness,
    };
  }

  /**
   * Get operational activity events from local Dexie IndexedDB.
   */
  static async getLocalEvents(
    businessId: number,
    localDate: string,
    pickupPointScope: 'all' | number = 'all'
  ): Promise<DailyOperationalEventItem[]> {
    const { startUtc, endUtc } = this.getLagosDayBounds(localDate);

    let packages = await db.packages
      .where('business_id')
      .equals(businessId)
      .toArray();

    if (pickupPointScope !== 'all') {
      packages = packages.filter(p => p.pickup_point_id === pickupPointScope);
    }

    const packageMap = new Map<string, LocalPackage>(packages.map(p => [p.id, p]));
    const customers = await db.customers.where('business_id').equals(businessId).toArray();
    const customerMap = new Map<string, string>(customers.map(c => [c.id, c.name]));

    const events: DailyOperationalEventItem[] = [];

    // 1. Packages Received
    for (const pkg of packages) {
      const ts = pkg.client_created_at || (pkg as any).created_at;
      if (ts >= startUtc && ts < endUtc) {
        events.push({
          id: `pkg_rcv_${pkg.id}`,
          type: 'PACKAGE_RECEIVED',
          eventTime: ts,
          packageId: pkg.id,
          publicPackageId: pkg.public_package_id,
          customerName: customerMap.get(pkg.customer_id) || 'Unknown Customer',
          pickupPointId: pkg.pickup_point_id,
          pickupPointName: pkg.pickup_point_name || null,
          amountMinor: null,
          paymentMethod: null,
          actorName: pkg.creator_name || 'Staff',
          details: null,
        });
      }

      // 2. Packages Collected
      if (pkg.status === 'COLLECTED') {
        const cTs = (pkg as any).updated_at || pkg.client_created_at;
        if (cTs >= startUtc && cTs < endUtc) {
          events.push({
            id: `pkg_col_${pkg.id}`,
            type: 'PACKAGE_COLLECTED',
            eventTime: cTs,
            packageId: pkg.id,
            publicPackageId: pkg.public_package_id,
            customerName: customerMap.get(pkg.customer_id) || 'Unknown Customer',
            pickupPointId: pkg.pickup_point_id,
            pickupPointName: pkg.pickup_point_name || null,
            amountMinor: null,
            paymentMethod: null,
            actorName: 'Staff',
            details: null,
          });
        }
      }

      // 3. Packages Returned
      if (pkg.status === 'RETURNED' && pkg.returned_at) {
        if (pkg.returned_at >= startUtc && pkg.returned_at < endUtc) {
          events.push({
            id: `pkg_ret_${pkg.id}`,
            type: 'PACKAGE_RETURNED',
            eventTime: pkg.returned_at,
            packageId: pkg.id,
            publicPackageId: pkg.public_package_id,
            customerName: customerMap.get(pkg.customer_id) || 'Unknown Customer',
            pickupPointId: pkg.pickup_point_id,
            pickupPointName: pkg.pickup_point_name || null,
            amountMinor: null,
            paymentMethod: null,
            actorName: pkg.terminal_actor_name || 'Staff',
            details: pkg.terminal_reason || null,
          });
        }
      }

      // 4. Packages Cancelled
      if (pkg.status === 'CANCELLED' && pkg.cancelled_at) {
        if (pkg.cancelled_at >= startUtc && pkg.cancelled_at < endUtc) {
          events.push({
            id: `pkg_can_${pkg.id}`,
            type: 'PACKAGE_CANCELLED',
            eventTime: pkg.cancelled_at,
            packageId: pkg.id,
            publicPackageId: pkg.public_package_id,
            customerName: customerMap.get(pkg.customer_id) || 'Unknown Customer',
            pickupPointId: pkg.pickup_point_id,
            pickupPointName: pkg.pickup_point_name || null,
            amountMinor: null,
            paymentMethod: null,
            actorName: pkg.terminal_actor_name || 'Staff',
            details: pkg.terminal_reason || null,
          });
        }
      }
    }

    // 5. Payments
    let payments = await db.payments.where('business_id').equals(businessId).toArray();
    if (pickupPointScope !== 'all') {
      payments = payments.filter(p => packageMap.has(p.package_id));
    }

    for (const pay of payments) {
      if (pay.sync_status === 'NEEDS_ATTENTION') continue;
      const ts = pay.recorded_at || pay.client_recorded_at;
      if (ts >= startUtc && ts < endUtc) {
        const pkg = packageMap.get(pay.package_id);
        const isReversed = pay.amount_minor < 0 || pay.status === 'REVERSED';
        events.push({
          id: `pay_${pay.id}`,
          type: isReversed ? 'PAYMENT_REVERSED' : 'PAYMENT_RECORDED',
          eventTime: ts,
          packageId: pay.package_id,
          publicPackageId: pkg?.public_package_id,
          customerName: pkg ? customerMap.get(pkg.customer_id) : undefined,
          pickupPointId: pkg?.pickup_point_id,
          pickupPointName: pkg?.pickup_point_name || null,
          amountMinor: Math.abs(pay.amount_minor),
          paymentMethod: pay.method,
          actorName: pay.recorded_by_user_name || 'Staff',
          details: pay.reversal_reason || null,
        });
      }
    }

    // Sort newest first
    return events.sort((a, b) => b.eventTime.localeCompare(a.eventTime));
  }
}
