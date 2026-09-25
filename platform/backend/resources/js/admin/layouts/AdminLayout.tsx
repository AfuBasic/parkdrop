import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  LayoutDashboard,
  Building2,
  Package,
  Users,
  MessageSquare,
  Banknote,
  FileBarChart,
  AlertTriangle,
  UserCheck,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { href: '/admin/pickup-points', label: 'Pickup Points', icon: Building2 },
      { href: '/admin/packages', label: 'Packages', icon: Package },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/sms-credits', label: 'SMS Credits', icon: MessageSquare },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { href: '/admin/finance', label: 'Finance', icon: Banknote },
      { href: '/admin/reports', label: 'Reports', icon: FileBarChart },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { href: '/admin/error-log', label: 'Error Log', icon: AlertTriangle },
      { href: '/admin/profile', label: 'Profile', icon: UserCheck },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const page = usePage();
  const currentUrl = page.url || '';
  const props = page.props as any;
  const admin = props.auth?.admin;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Derive breadcrumbs from URL
  const pathParts = currentUrl.split('?')[0].split('/').filter(Boolean);
  const breadcrumbItems = pathParts.slice(1).map((part, index) => {
    const isLast = index === pathParts.slice(1).length - 1;
    const label = part
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
    return { label, isLast };
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#0D1B2A] font-sans antialiased">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setSidebarOpen(false);
          }}
          className="fixed inset-0 z-40 bg-[#0D1B2A]/50 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-[#1E293B]">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <img src="/parkdrop-logo-horizontal.svg" alt="ParkDrop" className="h-7 w-auto invert" />
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/30">
              Admin
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E293B] lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[11px] font-bold text-[#64748B] tracking-wider uppercase">
                {section.title}
              </div>
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/admin/dashboard'
                      ? currentUrl === '/admin/dashboard' || currentUrl === '/admin'
                      : currentUrl.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
                          : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-[#64748B]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Footer & Logout */}
        <div className="p-3 border-t border-[#1E293B] bg-[#0A0F1D]">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center text-xs font-bold text-[#60A5FA]">
              {admin?.email ? admin.email.substring(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">
                {admin?.email || 'Platform Admin'}
              </p>
              <p className="text-[10px] text-[#64748B] truncate">Afutunde Staff</p>
            </div>
          </div>
          <Link
            href="/admin/logout"
            method="post"
            as="button"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-[#64748B] hover:bg-[#F1F5F9] lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-[#64748B]">
              <Link href="/admin/dashboard" className="hover:text-[#0D1B2A] transition-colors">
                Admin
              </Link>
              {breadcrumbItems.map((item, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span
                    className={
                      item.isLast
                        ? 'font-semibold text-[#0D1B2A]'
                        : 'hover:text-[#0D1B2A] transition-colors'
                    }
                  >
                    {item.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Quick Header Right Info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[11px] font-medium text-[#475569]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Production Live</span>
            </div>
            <Link
              href="/admin/profile"
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F1F5F9] transition-colors text-xs font-medium text-[#475569]"
            >
              <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs">
                {admin?.email ? admin.email.substring(0, 1).toUpperCase() : 'A'}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
