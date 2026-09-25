import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Building2, Eye, Pencil, Power } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PickupPoints({ pickupPoints }: any) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#0D1B2A]">Pickup Points</h1>
        <button className="bg-[#2563EB] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#1D4ED8]">Add Pickup Point</button>
      </div>
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Park</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-center">Today</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pickupPoints?.data?.map((pp: any) => (
              <TableRow key={pp.id}>
                <TableCell className="font-medium">{pp.name}</TableCell>
                <TableCell className="text-[#475569]">{pp.park}</TableCell>
                <TableCell className="tabular-nums">{pp.contactPhone || '—'}</TableCell>
                <TableCell className="text-center tabular-nums">{pp.today}</TableCell>
                <TableCell className="text-center tabular-nums">{pp.total}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${pp.isActive ? 'bg-[#F0FDF4] text-[#15803D]' : 'bg-[#FEF2F2] text-[#B91C1C]'}`}>
                    {pp.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-[#F1F5F9]"><Eye className="w-4 h-4" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-[#F1F5F9]"><Pencil className="w-4 h-4" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-[#F1F5F9]"><Power className="w-4 h-4" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
