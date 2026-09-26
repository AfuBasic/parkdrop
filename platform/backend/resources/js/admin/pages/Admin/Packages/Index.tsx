import React, { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  Package as PackageIcon,
  Search,
  Filter,
  X,
  Eye,
  Clock,
  Building2,
  Calendar,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface PackageItem {
  id: string;
  code: string;
  pickupCode: string;
  customer: {
    name: string;
    phone: string;
  } | null;
  pickupPoint: {
    id: number;
    name: string;
    park: string;
  };
  amountMinor: number;
  basePriceMinor?: number;
  demurrageMinor?: number;
  extraDays?: number;
  status: string;
  createdAt: string;
  collectedAt?: string | null;
  ageHours: number;
  receivedBy: string;
}

interface PackagesIndexProps {
  packages: {
    data: PackageItem[];
    current_page: number;
    last_page: number;
    total: number;
    links: any[];
  };
  filters: {
    search: string;
    status: string;
    pickup_point: string;
    age: string;
  };
  pickupPoints: {
    id: number;
    name: string;
  }[];
}

export default function PackagesIndex({ packages, filters, pickupPoints }: PackagesIndexProps) {
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || 'all');
  const [pickupPoint, setPickupPoint] = useState(filters.pickup_point || '');
  const [age, setAge] = useState(filters.age || '');

  // Debounced search per spec §6.3
  useEffect(() => {
    const handler = setTimeout(() => {
      if (search !== (filters.search || '')) {
        applyFilters({ search, status, pickup_point: pickupPoint, age });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const applyFilters = (newFilters: Record<string, string>) => {
    router.get('/admin/packages', newFilters, { preserveState: true, preserveScroll: true });
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    applyFilters({ search, status: val, pickup_point: pickupPoint, age });
  };

  const handlePickupChange = (val: string) => {
    setPickupPoint(val);
    applyFilters({ search, status, pickup_point: val, age });
  };

  const handleAgeChange = (val: string) => {
    setAge(val);
    applyFilters({ search, status, pickup_point: pickupPoint, age: val });
  };

  const clearAllFilters = () => {
    setSearch('');
    setStatus('all');
    setPickupPoint('');
    setAge('');
    router.get('/admin/packages', {}, { preserveState: true });
  };

  const hasActiveFilters = Boolean(
    (search && search.trim() !== '') ||
    (status && status !== 'all') ||
    pickupPoint ||
    age
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Packages</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold tabular-nums">
              {packages.total} parcels
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-0.5">
            Cross-park parcel tracking, fee records, and custody oversight. Read-only audit ledger.
          </p>
        </div>
      </div>

      {/* FILTER BAR — Spec §6.3: Search + 4 dropdowns + Clear filters */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Real-time search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, customer, phone..."
              className="pl-9 text-xs"
            />
          </div>

          {/* Status filter */}
          <Select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'waiting', label: 'Waiting (On Shelf)' },
              { value: 'collected', label: 'Collected (Completed)' },
              { value: 'returned', label: 'Returned to Sender' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />

          {/* Pickup point filter */}
          <Select
            value={pickupPoint}
            onChange={(e) => handlePickupChange(e.target.value)}
            options={[
              { value: '', label: 'All Pickup Points' },
              ...pickupPoints.map((pp) => ({ value: pp.id.toString(), label: pp.name })),
            ]}
          />

          {/* Age filter */}
          <Select
            value={age}
            onChange={(e) => handleAgeChange(e.target.value)}
            options={[
              { value: '', label: 'Any Holding Time' },
              { value: 'overdue', label: 'Overdue (>24 Hours)' },
              { value: '3d', label: 'Older than 3 Days' },
              { value: '7d', label: 'Older than 7 Days' },
            ]}
          />
        </div>

        {/* ACTIVE FILTER PILLS per spec §6.3 */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F1F5F9]">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              Active Filters:
            </span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold">
                Search: "{search}"
                <button type="button" onClick={() => setSearch('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {status !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold">
                Status: {status}
                <button type="button" onClick={() => handleStatusChange('all')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {pickupPoint && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold">
                Pickup: {pickupPoints.find((p) => p.id.toString() === pickupPoint)?.name || pickupPoint}
                <button type="button" onClick={() => handlePickupChange('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {age && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFFBEB] text-[#92400E] text-xs font-semibold">
                Age: {age}
                <button type="button" onClick={() => handleAgeChange('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-[#DC2626] font-semibold hover:underline ml-auto"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* PACKAGES TABLE — Spec §6.3: Monospace codes, customer, amount, status badge, age */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-[#F8FAFC]">
            <TableRow>
              <TableHead className="font-semibold text-xs text-[#475569]">Package Code</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Customer</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Pickup Counter</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569] text-right">Fee (₦)</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Status</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Age</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Attendant</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages?.data && packages.data.length > 0 ? (
              packages.data.map((p) => {
                const isOverdue = p.status === 'WAITING' && p.ageHours > 24;
                return (
                  <TableRow key={p.id} className="hover:bg-[#F8FAFC]">
                    <TableCell>
                      <Link
                        href={`/admin/packages/${p.id}`}
                        className="font-mono font-bold text-sm text-[#0F172A] hover:text-[#2563EB] tracking-tight block"
                      >
                        {p.code}
                      </Link>
                      <span className="font-mono text-[11px] text-[#94A3B8]">
                        OTP: {p.pickupCode}
                      </span>
                    </TableCell>

                    <TableCell>
                      {p.customer ? (
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A]">{p.customer.name}</p>
                          <p className="text-xs font-mono text-[#64748B]">{p.customer.phone}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-[#94A3B8] italic">Walk-in</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <p className="text-sm font-medium text-[#0F172A]">{p.pickupPoint.name}</p>
                      <p className="text-xs text-[#94A3B8]">{p.pickupPoint.park}</p>
                    </TableCell>

                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {p.amountMinor > 0 ? (
                        <div>
                          <span className="font-bold text-[#0F172A] block">
                            ₦{(p.amountMinor / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                          </span>
                          {(p.demurrageMinor ?? 0) > 0 ? (
                            <span className="text-[10px] text-[#D97706] font-medium block">
                              Base: ₦{((p.basePriceMinor ?? (p.amountMinor - (p.demurrageMinor ?? 0))) / 100).toLocaleString('en-NG')} + Dem: ₦{((p.demurrageMinor ?? 0) / 100).toLocaleString('en-NG')}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#64748B] block">
                              Base fee only
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          p.status === 'COLLECTED'
                            ? 'bg-[#F0FDF4] text-[#15803D]'
                            : p.status === 'WAITING'
                            ? 'bg-[#EFF6FF] text-[#2563EB]'
                            : p.status === 'RETURNED'
                            ? 'bg-[#FEF2F2] text-[#DC2626]'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.status === 'COLLECTED'
                              ? 'bg-[#16A34A]'
                              : p.status === 'WAITING'
                              ? 'bg-[#2563EB]'
                              : p.status === 'RETURNED'
                              ? 'bg-[#DC2626]'
                              : 'bg-slate-500'
                          }`}
                        />
                        {p.status}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`text-xs font-mono tabular-nums ${
                          isOverdue ? 'text-[#D97706] font-bold' : 'text-[#64748B]'
                        }`}
                      >
                        {p.ageHours > 24
                          ? `${Math.floor(p.ageHours / 24)}d ${Math.floor(p.ageHours % 24)}h`
                          : `${p.ageHours}h`}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-[#64748B]">
                      {p.receivedBy}
                    </TableCell>

                    <TableCell className="text-right">
                      <Link
                        href={`/admin/packages/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <PackageIcon className="w-10 h-10 text-[#CBD5E1] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#0F172A]">No packages found</p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    No parcel records match the active search or filters.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Horizon / Rixzo Table Pagination Footer */}
        {packages && (
          <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#64748B]">
            <div>
              Showing <span className="font-semibold text-[#0F172A]">{packages.data?.length || 0}</span> of{' '}
              <span className="font-semibold text-[#0F172A]">{packages.total || 0}</span> parcels
            </div>

            <div className="flex items-center gap-1">
              {packages.links && packages.links.map((link: any, idx: number) => {
                if (!link.url) {
                  return (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-[#94A3B8] rounded-lg cursor-not-allowed select-none"
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  );
                }
                return (
                  <Link
                    key={idx}
                    href={link.url}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      link.active
                        ? 'bg-[#2563EB] text-white font-semibold shadow-2xs'
                        : 'text-[#475569] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
                    }`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
