import { db } from '@/offline/db/database';
import type { LocalCustomer, LocalPackage, LocalPayment } from '@/offline/db/schema';

/**
 * Test data for the Home screen, for development and Storybook only.
 *
 * This writes straight to the local database so the screen can be seen in
 * every state it will actually meet — first day, one package, a full list,
 * a week of neglect, names longer than the column — without a server, a
 * network, or an account.
 *
 * It cannot run in a production build: the guard below throws before a
 * single row is written. Nothing in the shipped app imports this module, so
 * it is also dropped from the bundle entirely.
 */

export type HomeScenario =
  | 'empty'
  | 'one'
  | 'five'
  | 'twentyFive'
  | 'overdueMix'
  | 'longNames';

const BUSINESS_ID = 1;
const PICKUP_POINT_ID = 1;

function assertDevOnly(): void {
  if (import.meta.env.PROD) {
    throw new Error(
      'seedHomeData is a development helper and must never run in a production build.'
    );
  }
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const FIRST_NAMES = [
  'Chinedu',
  'Ngozi',
  'Boluwatife',
  'Amarachi',
  'Ifeoluwa',
  'Oluwaseun',
  'Chidinma',
  'Emeka',
  'Folasade',
  'Yusuf',
];

const LAST_NAMES = [
  'Okafor',
  'Eze',
  'Adeyemi',
  'Balogun',
  'Nwachukwu',
  'Obi',
  'Adebayo',
  'Musa',
  'Okonkwo',
  'Ibrahim',
];

function makeCustomer(index: number, name?: string): LocalCustomer {
  // A plausible Nigerian mobile number: 080 plus eight digits that differ
  // between customers, so the rows do not all read 0803 000 0000.
  const subscriber = String(31_240_517 + index * 91_733).slice(-8);
  return {
    id: `dev_cust_${index}`,
    business_id: BUSINESS_ID,
    name: name ?? `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[index % LAST_NAMES.length]}`,
    phone_display: `080${subscriber}`,
    phone_normalized: `+23480${subscriber}`,
    version: 1,
    sync_status: 'SYNCED',
  };
}

interface PackageSpec {
  index: number;
  ageDays: number;
  amountMinor: number;
  /** How much of the amount has been paid, in kobo. */
  paidMinor?: number;
  status?: LocalPackage['status'];
  customerName?: string;
}

function makePackage(spec: PackageSpec): LocalPackage {
  return {
    id: `dev_pkg_${spec.index}`,
    business_id: BUSINESS_ID,
    pickup_point_id: PICKUP_POINT_ID,
    customer_id: `dev_cust_${spec.index}`,
    public_package_id: `PD-${String(1000 + spec.index)}`,
    pickup_code: `PD${String(1000 + spec.index)}`,
    amount_due_minor: spec.amountMinor,
    status: spec.status ?? 'WAITING',
    client_created_at: daysAgo(spec.ageDays),
    server_received_at: null,
    version: 1,
    sync_status: 'SYNCED',
  };
}

function makePayment(spec: PackageSpec): LocalPayment | null {
  if (!spec.paidMinor) return null;
  return {
    id: `dev_pay_${spec.index}`,
    business_id: BUSINESS_ID,
    package_id: `dev_pkg_${spec.index}`,
    amount_minor: spec.paidMinor,
    method: 'CASH',
    recorded_by_user_id: 1,
    recorded_at: daysAgo(spec.ageDays),
    client_recorded_at: daysAgo(spec.ageDays),
    status: 'COMPLETED',
    sync_status: 'SYNCED',
    version: 1,
  };
}

/** A 30-character name with accents, and a package that has sat for a week. */
const LONG_CUSTOMER_NAME = 'Oluwadamilàre Chukwuemékà-Ajà';

function specsFor(scenario: HomeScenario): PackageSpec[] {
  switch (scenario) {
    case 'empty':
      return [];

    case 'one':
      return [{ index: 0, ageDays: 0, amountMinor: 350000 }];

    case 'five':
      return [
        { index: 0, ageDays: 0, amountMinor: 350000 },
        { index: 1, ageDays: 1, amountMinor: 200000, paidMinor: 100000 },
        { index: 2, ageDays: 2, amountMinor: 150000, paidMinor: 150000 },
        { index: 3, ageDays: 4, amountMinor: 900000 },
        { index: 4, ageDays: 0, amountMinor: 120000, status: 'COLLECTED' },
      ];

    case 'twentyFive':
      return Array.from({ length: 25 }, (_, i) => ({
        index: i,
        ageDays: i % 11,
        amountMinor: 50000 + i * 37500,
        paidMinor: i % 4 === 0 ? 25000 : i % 5 === 0 ? 50000 + i * 37500 : undefined,
      }));

    case 'overdueMix':
      return [
        { index: 0, ageDays: 0, amountMinor: 250000 },
        { index: 1, ageDays: 1, amountMinor: 180000 },
        { index: 2, ageDays: 3, amountMinor: 400000 },
        { index: 3, ageDays: 6, amountMinor: 75000, paidMinor: 40000 },
        { index: 4, ageDays: 9, amountMinor: 1250000 },
        { index: 5, ageDays: 21, amountMinor: 60000 },
      ];

    case 'longNames':
      return [
        { index: 0, ageDays: 7, amountMinor: 1875000, customerName: LONG_CUSTOMER_NAME },
        {
          index: 1,
          ageDays: 3,
          amountMinor: 250000,
          customerName: 'Maríam Olúwabùnmi Adéwálé-Ogunyemi',
        },
      ];
  }
}

/**
 * Wipe the local packages, customers and payments and write one scenario.
 *
 * Destructive on purpose — a half-replaced data set produces states that
 * cannot happen in the real app, which is the opposite of what this is for.
 */
export async function seedHomeData(scenario: HomeScenario): Promise<void> {
  assertDevOnly();

  const specs = specsFor(scenario);

  const customers = specs.map((s) => makeCustomer(s.index, s.customerName));
  const packages = specs.map(makePackage);
  const payments = specs.map(makePayment).filter((p): p is LocalPayment => p !== null);

  await db.transaction('rw', db.packages, db.customers, db.payments, async () => {
    await db.packages.where('business_id').equals(BUSINESS_ID).delete();
    await db.customers.where('business_id').equals(BUSINESS_ID).delete();
    await db.payments.where('business_id').equals(BUSINESS_ID).delete();

    if (customers.length) await db.customers.bulkAdd(customers);
    if (packages.length) await db.packages.bulkAdd(packages);
    if (payments.length) await db.payments.bulkAdd(payments);
  });
}

/**
 * Reach the seeder from the browser console in development:
 *   await window.pdSeedHome('overdueMix')
 */
export function exposeHomeSeeder(): void {
  assertDevOnly();
  (window as unknown as Record<string, unknown>).pdSeedHome = seedHomeData;
}
