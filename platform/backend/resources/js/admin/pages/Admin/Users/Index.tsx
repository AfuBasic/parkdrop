import { Link } from '@inertiajs/react';
import { UserCircle2, Phone, Mail } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Users({ users }: any) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#0D1B2A]">Users</h1>
        <button className="bg-[#2563EB] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#1D4ED8]">Add User</button>
      </div>
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Pickup Point</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.data?.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="tabular-nums">{u.phone}</TableCell>
                <TableCell className="text-[#475569]">{u.email || '—'}</TableCell>
                <TableCell className="text-[#475569]">{u.pickupPoint}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.isActive ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-[#FEF2F2] text-[#B91C1C]'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
