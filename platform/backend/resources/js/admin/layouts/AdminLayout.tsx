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
            <img src="/parkdrop-logo-horizontal-white.svg" alt="ParkDrop" className="h-7 w-auto" />
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
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-[#64748B] hover:bg-[#F1F5F9] lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden md:flex items-center gap-1.5 text-xs text-[#64748B]">
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

            {/* Horizon-style Global Search Bar */}
            <div className="relative w-full max-w-xs ml-2 hidden sm:block">
              <input
                type="text"
                placeholder="Search parcels, pickup points..."
                className="w-full pl-9 pr-12 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0D1B2A] placeholder-[#94A3B8] focus:outline-hidden focus:border-[#2563EB] focus:bg-white transition-all shadow-2xs"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-[#64748B] bg-white border border-[#CBD5E1] rounded shadow-2xs">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Quick Header Right Controls (Rixzo + Horizon style) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live operational indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Production Live</span>
            </div>

            {/* Notification Bell with Badge */}
            <Link
              href="/admin/packages?status=overdue"
              title="Attention & Alerts"
              className="relative p-2 rounded-xl text-[#64748B] hover:text-[#0D1B2A] hover:bg-[#F1F5F9] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
            </Link>

            {/* Quick Link to Error Log */}
            <Link
              href="/admin/error-log"
              title="Error Monitor"
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0D1B2A] hover:bg-[#F1F5F9] transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
            </Link>

            {/* Divider */}
            <div className="h-6 w-px bg-[#E2E8F0] mx-0.5" />

            {/* Profile Avatar Pill */}
            <Link
              href="/admin/profile"
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#F1F5F9] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#2563EB]/20">
                {admin?.email ? admin.email.substring(0, 1).toUpperCase() : 'A'}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold text-[#0F172A] leading-none">
                  {admin?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Afutunde Staff</p>
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
