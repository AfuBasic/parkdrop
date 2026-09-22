import { describe, it, expect } from 'vitest';
import {
  calculateAgeDays,
  getAgeBand,
  formatAgeDisplay,
  evaluatePackagePayment,
  formatNaira,
  matchesFilters,
  sortPackages,
  isOverdue24h,
  formatOverdueAgeSubline,
  type PackageCardData,
} from './package-filters';
import type { LocalPackage, LocalPayment } from '@/offline/db/schema';

describe('package-filters', () => {
  const baseNow = new Date('2026-09-21T12:00:00.000Z');

  describe('isOverdue24h & formatOverdueAgeSubline', () => {
    it('accurately identifies 24h overdue threshold', () => {
      const under24h = '2026-09-20T13:00:00.000Z'; // 23h ago
      const exact24h = '2026-09-20T12:00:00.000Z'; // 24h ago
      const over24h = '2026-09-19T12:00:00.000Z'; // 48h ago

      expect(isOverdue24h(under24h, baseNow)).toBe(false);
      expect(isOverdue24h(exact24h, baseNow)).toBe(true);
      expect(isOverdue24h(over24h, baseNow)).toBe(true);
    });

    it('formats worst-case age subline in hours and days', () => {
      const hoursAgo28 = '2026-09-20T08:00:00.000Z'; // 28 hours ago
      const daysAgo3 = '2026-09-18T12:00:00.000Z'; // 3 days ago

      expect(formatOverdueAgeSubline(hoursAgo28, baseNow)).toBe('Oldest waiting 28 hours');
      expect(formatOverdueAgeSubline(daysAgo3, baseNow)).toBe('Oldest waiting 3 days');
    });
  });

  describe('calculateAgeDays & getAgeBand', () => {
    it('calculates 0 days for today', () => {
      const todayIso = '2026-09-21T08:00:00.000Z';
      expect(calculateAgeDays(todayIso, baseNow)).toBe(0);
      expect(getAgeBand(0)).toBe('TODAY_YESTERDAY');
      expect(formatAgeDisplay(todayIso, baseNow)).toBe('Today');
    });

    it('calculates 1 day for yesterday', () => {
      const yesterdayIso = '2026-09-20T12:00:00.000Z';
      expect(calculateAgeDays(yesterdayIso, baseNow)).toBe(1);
      expect(getAgeBand(1)).toBe('TODAY_YESTERDAY');
      expect(formatAgeDisplay(yesterdayIso, baseNow)).toBe('Yesterday');
    });

    it('calculates 3 days and maps to THREE_TO_SIX', () => {
      const threeDaysAgoIso = '2026-09-18T10:00:00.000Z';
      const days = calculateAgeDays(threeDaysAgoIso, baseNow);
      expect(days).toBe(3);
      expect(getAgeBand(days)).toBe('THREE_TO_SIX');
      expect(formatAgeDisplay(threeDaysAgoIso, baseNow)).toBe('3 days');
    });

    it('calculates 7+ days and maps to SEVEN_PLUS', () => {
      const eightDaysAgoIso = '2026-09-13T10:00:00.000Z';
      const days = calculateAgeDays(eightDaysAgoIso, baseNow);
      expect(days).toBe(8);
      expect(getAgeBand(days)).toBe('SEVEN_PLUS');
      expect(formatAgeDisplay(eightDaysAgoIso, baseNow)).toBe('8 days');
    });
  });

  describe('evaluatePackagePayment & formatNaira', () => {
    it('evaluates unpaid package with no payments', () => {
      const res = evaluatePackagePayment(350000, []);
      expect(res.paymentState).toBe('UNPAID');
      expect(res.balanceMinor).toBe(350000);
      expect(res.isFullyPaid).toBe(false);
      expect(res.isNothingToPay).toBe(false);
    });

    it('evaluates part paid package', () => {
      const payments: LocalPayment[] = [
        {
          id: 'p1',
          business_id: 1,
          package_id: 'pkg1',
          amount_minor: 100000,
          method: 'CASH',
          recorded_by_user_id: 1,
          recorded_at: baseNow.toISOString(),
          client_recorded_at: baseNow.toISOString(),
          status: 'COMPLETED',
          version: 1,
          sync_status: 'SYNCED',
        },
      ];
      const res = evaluatePackagePayment(350000, payments);
      expect(res.paymentState).toBe('PART_PAID');
      expect(res.balanceMinor).toBe(250000);
      expect(res.isFullyPaid).toBe(false);
    });

    it('evaluates 0 amount due as paid / nothing to pay', () => {
      const res = evaluatePackagePayment(0, []);
      expect(res.paymentState).toBe('PAID');
      expect(res.balanceMinor).toBe(0);
      expect(res.isNothingToPay).toBe(true);
    });

    it('formats naira with thousands separators and no kobo', () => {
      expect(formatNaira(350000)).toMatch(/3,500/);
      expect(formatNaira(0)).toMatch(/0/);
    });
  });

  describe('matchesFilters & sortPackages', () => {
    const mockPkg: LocalPackage = {
      id: 'pkg-1',
      business_id: 1,
      pickup_point_id: 1,
      customer_id: 'cust-1',
      public_package_id: 'PD-TEST1',
      pickup_code: '4K8M2XP',
      amount_due_minor: 350000,
      status: 'WAITING',
      client_created_at: '2026-09-13T10:00:00.000Z',
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    };

    const cardData: PackageCardData = {
      pkg: mockPkg,
      customerName: 'Chinedu Okafor',
      customerPhone: '08031234567',
      paymentState: 'UNPAID',
      amountDueMinor: 350000,
      balanceMinor: 350000,
      ageDays: 8,
      ageBand: 'SEVEN_PLUS',
      ageDisplay: '8 days',
    };

    it('matches WAITING with 7d filter', () => {
      const matched = matchesFilters(
        cardData,
        'WAITING',
        new Set(['7d']),
        new Set(),
        new Set(),
        baseNow
      );
      expect(matched).toBe(true);
    });

    it('does not match WAITING when 3d exclusive condition is not met or status differs', () => {
      const matched = matchesFilters(
        { ...cardData, ageDays: 2 },
        'WAITING',
        new Set(['3d']),
        new Set(),
        new Set(),
        baseNow
      );
      expect(matched).toBe(false);
    });

    it('sorts packages by oldest, newest, and amount', () => {
      const item1 = {
        ...cardData,
        pkg: { ...mockPkg, id: '1', client_created_at: '2026-09-10T00:00:00.000Z' },
        balanceMinor: 100000,
      };
      const item2 = {
        ...cardData,
        pkg: { ...mockPkg, id: '2', client_created_at: '2026-09-20T00:00:00.000Z' },
        balanceMinor: 500000,
      };

      const oldestSorted = sortPackages([item2, item1], 'oldest');
      expect(oldestSorted[0].pkg.id).toBe('1');

      const newestSorted = sortPackages([item1, item2], 'newest');
      expect(newestSorted[0].pkg.id).toBe('2');

      const amountSorted = sortPackages([item1, item2], 'amount');
      expect(amountSorted[0].pkg.id).toBe('2');
    });
  });
});
