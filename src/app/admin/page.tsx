import AdminShell from '@/components/admin/AdminShell';
import getDb from '@/lib/db';
import Link from 'next/link';
import { FileText, ShoppingCart, Package, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const db = getDb();
  const billCount = (db.prepare(`SELECT COUNT(*) as n FROM bills WHERE status != 'CANCELLED'`).get() as any)?.n || 0;
  const orderCount = (db.prepare(`SELECT COUNT(*) as n FROM orders WHERE status NOT IN ('DELIVERED','CANCELLED')`).get() as any)?.n || 0;
  const pendingBills = (db.prepare(`SELECT COUNT(*) as n FROM bills WHERE payment_status='PENDING' AND status != 'CANCELLED'`).get() as any)?.n || 0;
  const todayRevenue = (db.prepare(`SELECT COALESCE(SUM(total),0) as n FROM bills WHERE bill_date=date('now') AND status != 'CANCELLED'`).get() as any)?.n || 0;
  const recentBills = db.prepare(`SELECT * FROM bills ORDER BY created_at DESC LIMIT 6`).all() as any[];

  return (
    <AdminShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-steel-800">Dashboard</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Bills', value: billCount, icon: FileText, color: 'bg-blue-500', href: '/admin/billing' },
            { label: 'Active Orders', value: orderCount, icon: ShoppingCart, color: 'bg-orange-500', href: '/admin/orders' },
            { label: 'Pending Bills', value: pendingBills, icon: Package, color: 'bg-red-500', href: '/admin/billing?status=PENDING' },
            { label: "Today's Revenue", value: `₹${Number(todayRevenue).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'bg-green-500', href: '/admin/reports' },
          ].map(s => (
            <Link key={s.label} href={s.href} className="bg-white rounded-xl border border-steel-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`${s.color} text-white p-3 rounded-xl`}><s.icon className="w-5 h-5" /></div>
              <div>
                <div className="text-2xl font-bold text-steel-800">{s.value}</div>
                <div className="text-xs text-steel-500 font-medium">{s.label}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-steel-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-steel-100">
            <h2 className="font-semibold text-steel-800">Recent Bills</h2>
            <Link href="/admin/billing" className="text-brand-600 text-sm hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-steel-100">
            {recentBills.length === 0 && <div className="px-5 py-8 text-center text-steel-400">No bills yet.</div>}
            {recentBills.map((bill: any) => (
              <Link key={bill.id} href={`/admin/billing/${bill.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-steel-50 transition-colors">
                <div>
                  <div className="font-medium text-sm text-steel-800">{bill.customer_name}</div>
                  <div className="text-xs text-steel-500">{bill.bill_number} · {bill.bill_date}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-steel-800">₹{Number(bill.total).toLocaleString('en-IN')}</div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bill.payment_status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{bill.payment_status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
