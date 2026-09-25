import { useState } from 'react';
import { useForm } from '@inertiajs/react';

export default function EditPickupPoint({ pickupPoint }: any) {
  const { data, setData, put, processing, errors } = useForm({
    name: pickupPoint?.name || '',
    park: pickupPoint?.park || '',
    contact_phone: pickupPoint?.contact_phone || '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/admin/pickup-points/${pickupPoint?.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-[#0D1B2A] mb-6">Edit Pickup Point</h1>
      <form onSubmit={submit} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input value={data.name} onChange={e => setData('name', e.target.value)} className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 min-h-[48px]" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Park</label>
          <input value={data.park} onChange={e => setData('park', e.target.value)} className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 min-h-[48px]" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contact Phone</label>
          <input value={data.contact_phone} onChange={e => setData('contact_phone', e.target.value)} className="w-full rounded-xl border border-[#CBD5E1] px-4 py-3 min-h-[48px]" />
        </div>
        <button type="submit" disabled={processing} className="bg-[#2563EB] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1D4ED8] disabled:opacity-50">Save Changes</button>
      </form>
    </div>
  );
}
