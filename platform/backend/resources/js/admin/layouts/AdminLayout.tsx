import { useState, useEffect } from 'react';
import { Outlet, usePage } from '@inertiajs/react';
import { Shield, Package, Building2, UserCircle2, MessageSquare, Banknote, FileBarChart, AlertTriangle, Settings, Menu, LogOut, UserCircle2 as UserIcon } from 'lucide-react';

export default function AdminLayout() {
  const page = usePage();
  const props = page.props as any;
  const admin = props.auth?.admin;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: Shield },
    { href: '/admin/pickup-points', label: 'Pickup Points', icon: Building2 },
    { href: '/admin/packages', label: 'Packages', icon: Package },
    { href: '/admin/users', label: 'Users', icon: UserCircle2 },
    { href: '/admin/sms-credits', label: 'SMS Credits', icon: MessageSquare },
    { href: '/admin/finance', label: 'Finance', icon: Banknote },
    { href: '/admin/reports', label: 'Reports', icon: FileBarChart },
    { href: '/admin/error-log', label: 'Error Log', icon: AlertTriangle },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-white transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-5 h-14 border-b border-[#1E293B]">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">ParkDrop</span>
          <span className="text-xs text-[#94A3B8] ml-auto hidden lg:block">Admin</span>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-56px)]">
          {nav.map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#94A3B8] hover:bg-[#1E293B] hover:text-white" activeClass="!bg-[#2563EB] !text-white">
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t border-[#1E293B]">
            <Link href="/admin/logout" method="post" as="button" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#94A3B8] hover:bg-[#1E293B] hover:text-white w-full">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Link>
          </div>
        </nav>
      </aside>
      {sidebarOpen && <button onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/50 lg:hidden" />}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-[#E2E8F0] flex items-center px-4 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 mr-2"><Menu className="w-5 h-5" /></button>
          <div className="flex-1" />
          <UserIcon className="w-5 h-5 text-[#475569]" />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
