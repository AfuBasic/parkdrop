import { db } from '@/offline/db/database';
import type { LocalPackage, LocalCustomer, LocalPayment } from '@/offline/db/schema';

/**
 * Seeds IndexedDB with 60+ realistic packages across varied ages, statuses, payments, and names.
 * Designed for testing edge cases at 360px-425px viewports and verification under real field conditions.
 */
export async function seedRealisticPackages(businessId: number = 1): Promise<{ packageCount: number }> {
  // Clear existing package domain tables
  await db.packages.clear();
  await db.customers.clear();
  await db.payments.clear();
  await db.packageMedia.clear();

  const now = new Date();
  const subDays = (days: number, hours: number = 0) => {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - days);
    d.setHours(d.getHours() - hours);
    return d.toISOString();
  };

  // 1. Create a diverse set of customers
  const customers: LocalCustomer[] = [
    {
      id: 'cust-1',
      business_id: businessId,
      name: 'Chinedu Okafor',
      phone_display: '0803 123 4567',
      phone_normalized: '+2348031234567',
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'cust-2',
      business_id: businessId,
      name: 'Amina Bello-Garba',
      phone_display: '0812 345 6789',
      phone_normalized: '+2348123456789',
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'cust-3',
      business_id: businessId,
      name: null, // Phone-only customer
      phone_display: '0905 555 1234',
      phone_normalized: '+2349055551234',
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'cust-4',
      business_id: businessId,
      // Very long name (40 chars)
      name: 'Oluwaseun Adedamola-Ogunleye-Olatunbosun',
      phone_display: '0703 999 8888',
      phone_normalized: '+2347039998888',
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'cust-5',
      business_id: businessId,
      name: 'Emeka Nwachukwu',
      phone_display: '0808 111 2222',
      phone_normalized: '+2348081112222',
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'cust-6',
      business_id: businessId,
      name: 'Fatima Abdullahi',
      phone_display: '0901 222 3333',
      phone_normalized: '+2349012223333',
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'cust-7',
      business_id: businessId,
      name: 'Babajide Sanwo-Esho',
      phone_display: '0802 444 5555',
      phone_normalized: '+2348024445555',
      version: 1,
      sync_status: 'SYNCED',
    },
    {
      id: 'cust-8',
      business_id: businessId,
      name: null, // Phone-only
      phone_display: '0818 777 6666',
      phone_normalized: '+2348187776666',
      version: 1,
      sync_status: 'SYNCED',
    },
  ];

  await db.customers.bulkAdd(customers);

  const packages: LocalPackage[] = [];
  const payments: LocalPayment[] = [];

  // Generate 65 packages across all age groups, statuses, and payment states
  for (let i = 1; i <= 65; i++) {
    const cust = customers[(i - 1) % customers.length];
    const pkgId = `pkg-seed-${i}`;
    const pubId = `PD-${String(1000 + i)}`;
    const pickupCode = `PK${i}${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i + 3) % 26))}`;

    let status: 'WAITING' | 'COLLECTED' | 'RETURNED' | 'CANCELLED' = 'WAITING';
    let daysAgo = 0;
    let amountMinor = 350000; // ₦3,500
    let isPendingSync = false;

    // Distribute ages and statuses
    if (i <= 25) {
      // WAITING: 1-10 today/yesterday, 11-18 3-6 days, 19-25 7-30 days
      status = 'WAITING';
      if (i <= 6) daysAgo = 0;
      else if (i <= 10) daysAgo = 1;
      else if (i <= 18) daysAgo = 2 + (i % 5); // 3 to 6 days
      else daysAgo = 7 + (i % 22); // 7 to 28 days

      if (i === 1) isPendingSync = true;
    } else if (i <= 45) {
      // COLLECTED: 26-35 today/yesterday, 36-45 2 to 14 days ago
      status = 'COLLECTED';
      daysAgo = i <= 35 ? (i % 2) : 2 + (i % 12);
    } else if (i <= 55) {
      // RETURNED
      status = 'RETURNED';
      daysAgo = 5 + (i % 15);
    } else {
      // CANCELLED
      status = 'CANCELLED';
      daysAgo = 1 + (i % 10);
    }

    // Payment variation
    if (i % 5 === 0) {
      amountMinor = 0; // Nothing to pay
    } else if (i % 5 === 1) {
      amountMinor = 250000; // Unpaid
    } else if (i % 5 === 2) {
      amountMinor = 500000; // Part paid (owe ₦2,000)
      payments.push({
        id: `pay-${i}`,
        business_id: businessId,
        package_id: pkgId,
        amount_minor: 300000, // Paid ₦3,000
        method: 'CASH',
        recorded_by_user_id: 1,
        recorded_at: subDays(daysAgo, 1),
        client_recorded_at: subDays(daysAgo, 1),
        status: 'COMPLETED',
        version: 1,
        sync_status: 'SYNCED',
      });
    } else {
      amountMinor = 150000; // Paid in full
      payments.push({
        id: `pay-${i}`,
        business_id: businessId,
        package_id: pkgId,
        amount_minor: 150000,
        method: 'TRANSFER',
        recorded_by_user_id: 1,
        recorded_at: subDays(daysAgo, 1),
        client_recorded_at: subDays(daysAgo, 1),
        status: 'COMPLETED',
        version: 1,
        sync_status: 'SYNCED',
      });
    }

    packages.push({
      id: pkgId,
      business_id: businessId,
      pickup_point_id: 1,
      customer_id: cust.id,
      public_package_id: pubId,
      pickup_code: pickupCode,
      amount_due_minor: amountMinor,
      status,
      client_created_at: subDays(daysAgo, i % 12),
      server_received_at: isPendingSync ? null : subDays(daysAgo, i % 12),
      version: 1,
      sync_status: isPendingSync ? 'PENDING_CREATE' : 'SYNCED',
      creator_name: 'Chinedu',
      pickup_point_name: 'Peace Park Main Gate',
    });
  }

  await db.packages.bulkAdd(packages);
  if (payments.length > 0) {
    await db.payments.bulkAdd(payments);
  }

  return { packageCount: packages.length };
}
