import { Link } from '@inertiajs/react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4">
      <Link href="/admin/dashboard" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center">
          <Package className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-2xl text-[#0D1B2A]">ParkDrop</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}
