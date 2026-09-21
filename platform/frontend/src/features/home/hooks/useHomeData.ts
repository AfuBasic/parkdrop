import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/offline/db/database';
import type { LocalPackage, LocalPayment } from '@/offline/db/schema';
import {
  calculatePaymentSummary,
  type PaymentState,
} from '@/features/payments/domain/payment-summary';
import { DailyOperationsReportRepository } from '@/offline/read-models/daily-operations-report-repository';
import { describeAge, type PackageAge } from '../lib/packageAge';

/** One line in the "Waiting for pickup" list. */
export interface HomePackageRow {
  id: string;
  customerName: string;
  customerPhone: string;
  pickupCode: string;
  /** What is still owed, in kobo. Zero when the package is paid off. */
  balanceMinor: number;
  paymentState: PaymentState;
  age: PackageAge;
  createdAt: string;
}

export interface HomeStats {
  waitingCount: number;
  /** Money still to collect across every waiting package, in kobo. */
  unpaidBalanceMinor: number;
  unpaidCount: number;
  collectedTodayCount: number;
}

export type HomeDataStatus = 'loading' | 'ready' | 'error';

export interface HomeData {
  status: HomeDataStatus;
  /** Every waiting package, oldest first. The screen shows the first five. */
  waiting: HomePackageRow[];
  stats: HomeStats;
  /** True only when this pickup point has never held a package at all. */
  isFirstDay: boolean;
}

const EMPTY_STATS: HomeStats = {
  waitingCount: 0,
  unpaidBalanceMinor: 0,
  unpaidCount: 0,
  collectedTodayCount: 0,
};

interface HomeSnapshot {
  waiting: HomePackageRow[];
  stats: HomeStats;
  isFirstDay: boolean;
}

function groupPaymentsByPackage(payments: LocalPayment[]): Map<string, LocalPayment[]> {
  const byPackage = new Map<string, LocalPayment[]>();
  for (const payment of payments) {
    const bucket = byPackage.get(payment.package_id);
    if (bucket) bucket.push(payment);
    else byPackage.set(payment.package_id, [payment]);
  }
  return byPackage;
}

/**
 * Was this package collected today?
 *
 * The local package record carries no collection timestamp — the schema has
 * `returned_at` and `cancelled_at` but nothing for collection. Rather than
 * invent a field, this uses exactly the same fallback the daily operations
 * read model already uses, so the two screens can never disagree with each
 * other. The limitation is real and is recorded with the feature: a package
 * created on an earlier day and collected today is not counted.
 */
function collectedToday(pkg: LocalPackage, startUtc: string, endUtc: string): boolean {
  if (pkg.status !== 'COLLECTED') return false;
  const ts =
    (pkg as LocalPackage & { updated_at?: string }).updated_at || pkg.client_created_at;
  return ts >= startUtc && ts < endUtc;
}

function buildSnapshot(
  packages: LocalPackage[],
  customers: Map<string, { name: string; phone: string }>,
  payments: LocalPayment[],
  now: Date
): HomeSnapshot {
  const paymentsByPackage = groupPaymentsByPackage(payments);
  const today = DailyOperationsReportRepository.getTodayLocalString();
  const { startUtc, endUtc } = DailyOperationsReportRepository.getLagosDayBounds(today);

  const waiting: HomePackageRow[] = [];
  let unpaidBalanceMinor = 0;
  let unpaidCount = 0;
  let collectedTodayCount = 0;

  for (const pkg of packages) {
    if (collectedToday(pkg, startUtc, endUtc)) collectedTodayCount += 1;
    if (pkg.status !== 'WAITING') continue;

    const summary = calculatePaymentSummary(
      pkg.amount_due_minor,
      paymentsByPackage.get(pkg.id) ?? []
    );

    if (summary.balanceMinor > 0) {
      unpaidBalanceMinor += summary.balanceMinor;
      unpaidCount += 1;
    }

    const customer = customers.get(pkg.customer_id);

    waiting.push({
      id: pkg.id,
      // A package with no local customer row is a sync gap, not a mystery
      // person — showing the pickup code is more use than the word "Unknown".
      customerName: customer?.name?.trim() || pkg.pickup_code,
      customerPhone: customer?.phone ?? '',
      pickupCode: pkg.pickup_code,
      balanceMinor: summary.balanceMinor,
      paymentState: summary.paymentState,
      age: describeAge(pkg.client_created_at, now),
      createdAt: pkg.client_created_at,
    });
  }

  // Oldest first: the package that has been sitting longest is the one that
  // needs a decision, and it is the one the attendant is asked about.
  waiting.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return {
    waiting,
    stats: {
      waitingCount: waiting.length,
      unpaidBalanceMinor,
      unpaidCount,
      collectedTodayCount,
    },
    isFirstDay: packages.length === 0,
  };
}

/**
 * Everything the Home screen shows, read from the local database.
 *
 * Read-only and offline-first by construction: it calls no API and writes
 * nothing. Money owed is derived from the payments already stored against
 * each package using the same routine the package detail screen uses, so the
 * naira figure in the stat strip can never disagree with the one on the
 * package itself.
 */
export function useHomeData(businessId: number | undefined): HomeData {
  const snapshot = useLiveQuery(
    async (): Promise<HomeSnapshot | 'error'> => {
      if (!businessId) return { waiting: [], stats: EMPTY_STATS, isFirstDay: true };

      try {
        const [packages, customerRows, payments] = await Promise.all([
          db.packages.where('business_id').equals(businessId).toArray(),
          db.customers.where('business_id').equals(businessId).toArray(),
          db.payments.where('business_id').equals(businessId).toArray(),
        ]);

        const customers = new Map(
          customerRows.map((c) => [c.id, { name: c.name, phone: c.phone_display }])
        );

        return buildSnapshot(packages, customers, payments, new Date());
      } catch (err) {
        // A corrupt or blocked IndexedDB is the one case where the screen has
        // nothing to show. Surface it as an error the user can retry rather
        // than as an empty list that quietly claims there is no work.
        if (import.meta.env.DEV) console.warn('Could not read Home data:', err);
        return 'error';
      }
    },
    [businessId]
  );

  if (snapshot === undefined) {
    return { status: 'loading', waiting: [], stats: EMPTY_STATS, isFirstDay: false };
  }

  if (snapshot === 'error') {
    return { status: 'error', waiting: [], stats: EMPTY_STATS, isFirstDay: false };
  }

  return { status: 'ready', ...snapshot };
}
