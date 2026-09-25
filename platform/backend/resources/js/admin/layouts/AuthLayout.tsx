import { Link } from '@inertiajs/react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4">
      <Link href="/admin/dashboard" className="flex items-center justify-center mb-8">
        <img src="/parkdrop-logo-horizontal.svg" alt="ParkDrop" className="h-8" />
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}
