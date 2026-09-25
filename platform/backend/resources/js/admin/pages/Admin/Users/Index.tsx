import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  Users,
  Search,
  Plus,
  Pencil,
  Power,
  Mail,
  Building2,
  CheckCircle2,
  XCircle,
  ShieldCheck
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface UserItem {
  id: number;
  firstName: string;
  email: string;
  role: string;
  pickupPoint: {
    id: number;
    name: string;
    park: string;
  } | null;
  isActive: boolean;
  createdAt: string;
}

interface UsersIndexProps {
  users: {
    data: UserItem[];
    current_page: number;
    last_page: number;
    total: number;
    links?: any[];
  };
  filters: {
    search: string;
    status: string;
    pickup_point: string;
  };
  pickupPoints: {
    id: number;
    name: string;
  }[];
}

export default function UsersIndex({ users, filters, pickupPoints }: UsersIndexProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || 'all');
  const [pickupPoint, setPickupPoint] = useState(filters.pickup_point || '');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form fields
  const [formFirstName, setFormFirstName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBusinessId, setFormBusinessId] = useState(pickupPoints[0]?.id?.toString() || '');
  const [formRole, setFormRole] = useState('staff');
  const [processing, setProcessing] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/admin/users', { search: searchTerm, status, pickup_point: pickupPoint }, { preserveState: true });
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    router.get('/admin/users', { search: searchTerm, status: val, pickup_point: pickupPoint }, { preserveState: true });
  };

  const handlePickupChange = (val: string) => {
    setPickupPoint(val);
    router.get('/admin/users', { search: searchTerm, status, pickup_point: val }, { preserveState: true });
  };

  const openCreateDialog = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormFirstName('');
    setFormEmail('');
    setFormBusinessId(pickupPoints[0]?.id?.toString() || '');
    setFormRole('staff');
    setDialogOpen(true);
  };

  const openEditDialog = (u: UserItem) => {
    setIsEditing(true);
    setEditingId(u.id);
    setFormFirstName(u.firstName);
    setFormEmail(u.email);
    setFormBusinessId(u.pickupPoint?.id?.toString() || pickupPoints[0]?.id?.toString() || '');
    setFormRole(u.role.toLowerCase());
    setDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    const payload = {
      first_name: formFirstName,
      email: formEmail,
      business_id: formBusinessId,
      role: formRole,
    };

    if (isEditing && editingId) {
      router.put(`/admin/users/${editingId}`, payload, {
        onSuccess: () => {
          setDialogOpen(false);
          setProcessing(false);
        },
        onError: () => setProcessing(false),
      });
    } else {
      router.post('/admin/users', payload, {
        onSuccess: () => {
          setDialogOpen(false);
          setProcessing(false);
        },
        onError: () => setProcessing(false),
      });
    }
  };

  const handleToggle = (id: number) => {
    router.post(`/admin/users/${id}/toggle`, {}, { preserveState: true });
  };

  const tabOptions = [
    { value: 'all', label: 'All Users', count: users.total },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Users & Attendants</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold tabular-nums">
              {users.total} registered staff
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-0.5">
            Motor park counter attendants and location personnel across all registered points.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <Tabs value={status} onValueChange={handleStatusChange} items={tabOptions} />

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Select
            value={pickupPoint}
            onChange={(e) => handlePickupChange(e.target.value)}
            className="text-xs w-full sm:w-48"
            options={[
              { value: '', label: 'All Locations' },
              ...pickupPoints.map((pp) => ({ value: pp.id.toString(), label: pp.name })),
            ]}
          />

          <form onSubmit={handleSearch} className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 text-xs"
            />
          </form>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-[#F8FAFC]">
            <TableRow>
              <TableHead className="font-semibold text-xs text-[#475569]">Staff Member</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Email</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Assigned Counter</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Role</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569]">Status</TableHead>
              <TableHead className="font-semibold text-xs text-[#475569] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.data && users.data.length > 0 ? (
              users.data.map((u) => (
                <TableRow key={u.id} className="hover:bg-[#F8FAFC]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs uppercase">
                        {u.firstName.substring(0, 1)}
                      </div>
                      <span className="font-semibold text-sm text-[#0F172A]">{u.firstName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-[#475569]">{u.email}</TableCell>
                  <TableCell>
                    {u.pickupPoint ? (
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{u.pickupPoint.name}</p>
                        <p className="text-xs text-[#94A3B8]">{u.pickupPoint.park}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-[#94A3B8] italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px]">
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        u.isActive
                          ? 'bg-[#F0FDF4] text-[#15803D]'
                          : 'bg-[#FEF2F2] text-[#B91C1C]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.isActive ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
                        }`}
                      />
                      <span>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEditDialog(u)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                        title="Edit staff details"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(u.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.isActive
                            ? 'text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2]'
                            : 'text-[#64748B] hover:text-[#16A34A] hover:bg-[#F0FDF4]'
                        }`}
                        title={u.isActive ? 'Deactivate staff' : 'Activate staff'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Users className="w-10 h-10 text-[#CBD5E1] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#0F172A]">No staff members found</p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Register personnel for park counters to operate the mobile PWA attendant app.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Horizon / Rixzo Table Pagination Footer */}
        {users && (
          <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#64748B]">
            <div>
              Showing <span className="font-semibold text-[#0F172A]">{users.data?.length || 0}</span> of{' '}
              <span className="font-semibold text-[#0F172A]">{users.total || 0}</span> staff members
            </div>

            {users.links && users.links.length > 0 && (
              <div className="flex items-center gap-1">
                {users.links.map((link: any, idx: number) => {
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
            )}
          </div>
        )}
      </div>

      {/* CREATE / EDIT DIALOG */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={isEditing ? 'Edit Attendant' : 'Add New Staff Member'}
        description="Configure attendant credentials and assigned counter."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">
              First Name *
            </label>
            <Input
              value={formFirstName}
              onChange={(e) => setFormFirstName(e.target.value)}
              placeholder="e.g. Samuel"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">
              Email Address *
            </label>
            <Input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="samuel@example.com"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">
              Assigned Pickup Counter *
            </label>
            <Select
              value={formBusinessId}
              onChange={(e) => setFormBusinessId(e.target.value)}
              options={pickupPoints.map((pp) => ({ value: pp.id.toString(), label: pp.name }))}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">
              Role *
            </label>
            <Select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              options={[
                { value: 'staff', label: 'Attendant / Staff' },
                { value: 'manager', label: 'Manager' },
                { value: 'owner', label: 'Counter Owner' },
              ]}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#475569]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
            >
              {processing ? 'Saving...' : isEditing ? 'Update Staff Member' : 'Save Staff Member'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
