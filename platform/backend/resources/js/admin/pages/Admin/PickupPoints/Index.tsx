import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  Building2,
  Search,
  Plus,
  Eye,
  Pencil,
  Power,
  Phone,
  Package,
  CheckCircle2,
  XCircle,
  MessageSquare
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface PickupPoint {
  id: number;
  publicId: string;
  name: string;
  park: string;
  contactPhone: string;
  today: number;
  total: number;
  isActive: boolean;
  smsBalance: number;
  dailyStorageFee: number;
}

interface PickupPointsProps {
  pickupPoints: {
    data: PickupPoint[];
    links: any[];
    current_page: number;
    last_page: number;
    total: number;
  };
  filters: {
    search: string;
    status: string;
  };
}

export default function PickupPointsIndex({ pickupPoints, filters }: PickupPointsProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [activeTab, setActiveTab] = useState(filters.status || 'all');

  // Modal states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPark, setFormPark] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDailyFee, setFormDailyFee] = useState('0');
  const [processing, setProcessing] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/admin/pickup-points', { search: searchTerm, status: activeTab }, { preserveState: true });
  };

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    router.get('/admin/pickup-points', { search: searchTerm, status: val }, { preserveState: true });
  };

  const openCreateDialog = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormName('');
    setFormPark('');
    setFormPhone('');
    setFormDailyFee('0');
    setDialogOpen(true);
  };

  const openEditDialog = (pp: PickupPoint) => {
    setIsEditing(true);
    setEditingId(pp.id);
    setFormName(pp.name);
    setFormPark(pp.park !== '—' ? pp.park : '');
    setFormPhone(pp.contactPhone !== '—' ? pp.contactPhone : '');
    setFormDailyFee((pp.dailyStorageFee / 100).toString());
    setDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    const payload = {
      name: formName,
      park_name: formPark,
      contact_phone: formPhone,
      daily_storage_fee: parseFloat(formDailyFee) || 0,
    };

    if (isEditing && editingId) {
      router.put(`/admin/pickup-points/${editingId}`, payload, {
        onSuccess: () => {
          setDialogOpen(false);
          setProcessing(false);
        },
        onError: () => setProcessing(false),
      });
    } else {
      router.post('/admin/pickup-points', payload, {
        onSuccess: () => {
          setDialogOpen(false);
          setProcessing(false);
        },
        onError: () => setProcessing(false),
      });
    }
  };

  const handleToggle = (id: number) => {
    router.post(`/admin/pickup-points/${id}/toggle`, {}, { preserveState: true });
  };

  const tabOptions = [
    { value: 'all', label: 'All Parks', count: pickupPoints.total },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Pickup Points</h1>
          <p className="text-xs text-[#475569] mt-0.5">
            Registered motor park attendant counters and dispatch points.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Pickup Point</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <Tabs value={activeTab} onValueChange={handleTabChange} items={tabOptions} />

        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, park, or phone..."
            className="pl-9 text-xs"
          />
        </form>
      </div>

      {/* Pickup Points Table — Spec §6.2 */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-[#F8FAFC]">
            <TableRow>
              <TableHead className="font-semibold text-xs text-[#475569]">Pickup Point</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Park / Garage</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Contact Phone</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569] text-center">Today</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569] text-center">Total</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569] text-center">SMS</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Status</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pickupPoints?.data && pickupPoints.data.length > 0 ? (
              pickupPoints.data.map((pp) => (
                <TableRow key={pp.id} className="hover:bg-[#F8FAFC]">
                  <TableCell>
                    <Link
                      href={`/admin/pickup-points/${pp.id}`}
                      className="font-semibold text-sm text-[#0F172A] hover:text-[#2563EB] transition-colors"
                    >
                      {pp.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-[#475569] font-medium">
                    {pp.park}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-[#475569]">
                    {pp.contactPhone}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm tabular-nums font-semibold text-[#0F172A]">
                    {pp.today}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs tabular-nums text-[#64748B]">
                    {pp.total}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs tabular-nums">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      pp.smsBalance < 100 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {pp.smsBalance}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        pp.isActive
                          ? 'bg-[#F0FDF4] text-[#15803D]'
                          : 'bg-[#FEF2F2] text-[#B91C1C]'
                      }`}
                    >
                      {pp.isActive ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span>{pp.isActive ? 'Active' : 'Inactive'}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/pickup-points/${pp.id}`}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#2563EB] hover:bg-[#F1F5F9] transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEditDialog(pp)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                        title="Edit pickup point"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(pp.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          pp.isActive
                            ? 'text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2]'
                            : 'text-[#64748B] hover:text-[#16A34A] hover:bg-[#F0FDF4]'
                        }`}
                        title={pp.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Building2 className="w-10 h-10 text-[#CBD5E1] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#0F172A]">No pickup points found</p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Try adjusting your search criteria or register a new counter.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Horizon / Rixzo Table Pagination Footer */}
        {pickupPoints && (
          <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#64748B]">
            <div>
              Showing <span className="font-semibold text-[#0F172A]">{pickupPoints.data?.length || 0}</span> of{' '}
              <span className="font-semibold text-[#0F172A]">{pickupPoints.total || 0}</span> counters
            </div>

            <div className="flex items-center gap-1">
              {pickupPoints.links && pickupPoints.links.map((link: any, idx: number) => {
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

      {/* ADD / EDIT MODAL DIALOG — Spec §6.2 */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={isEditing ? 'Edit Pickup Point' : 'Register New Pickup Point'}
        description="Provide the official business counter and motor park location details."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">
              Pickup Point Name *
            </label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Chima Parcel Services"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">
              Motor Park / Garage *
            </label>
            <Input
              value={formPark}
              onChange={(e) => setFormPark(e.target.value)}
              placeholder="e.g. Oshodi Central Bus Park"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">
              Attendant Phone Number *
            </label>
            <Input
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="0803XXXXXXX"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">
              Daily Storage Fee (₦)
            </label>
            <Input
              type="number"
              value={formDailyFee}
              onChange={(e) => setFormDailyFee(e.target.value)}
              placeholder="e.g. 500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] disabled:opacity-50"
            >
              {processing ? 'Saving...' : isEditing ? 'Update Pickup Point' : 'Save Pickup Point'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
