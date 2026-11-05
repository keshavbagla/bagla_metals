'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FileText, ShoppingCart, Package, Users,
  BarChart2, Menu, LogOut, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const NAV = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/billing', icon: FileText, label: 'Billing' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/inventory', icon: Package, label: 'Inventory' },
  { href: '/admin/workers', icon: Users, label: 'Workers' },
  { href: '/admin/reports', icon: BarChart2, label: 'Reports' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    toast.success('Logged out');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 bg-steel-900 text-white flex flex-col
        transform transition-transform duration-200
        md:relative md:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="px-5 py-4 border-b border-steel-700">
          <div className="text-lg font-bold text-white leading-tight">Bagla Metal</div>
          <div className="text-xs text-steel-400">Admin Panel · Hathras</div>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-brand-600 text-white' : 'text-steel-300 hover:bg-steel-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-steel-700">
          <button onClick={logout} className="flex items-center gap-2 text-steel-400 hover:text-red-400 text-sm w-full">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-steel-200 px-4 py-3 flex items-center gap-3 flex-shrink-0 no-print">
          <button onClick={() => setOpen(!open)} className="md:hidden text-steel-600 hover:text-steel-800">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-steel-800 text-sm hidden sm:block">Bagla Metal Traders</span>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/billing/new" className="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors">
              + New Bill
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}
