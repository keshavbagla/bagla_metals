import AdminShell from '@/components/admin/AdminShell';
import getDb from '@/lib/db';
import Link from 'next/link';
import { Users, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';

export default function AdminWorkersPage() {
  const db = getDb();
  const workers = db.prepare(`SELECT * FROM workers ORDER BY name`).all() as any[];

  // Pending financial overview across all customer bills
  const billStats = db.prepare(`
    SELECT 
      COUNT(*) as total_bills,
      COALESCE(SUM(total), 0) as total_sales,
      COALESCE(SUM(amount_paid), 0) as total_collected,
      COALESCE(SUM(balance_due), 0) as total_pending_due
    FROM bills
  `).get() as any;

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-steel-900">Staff & Total Business Pending Ledger</h1>
          <p className="text-xs text-steel-500">
            Monitor employees, staff attendance, and overall business cash flow including all outstanding customer bills.
          </p>
        </div>

        {/* Global Financial Status of All Bills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-steel-200 shadow-sm">
            <div className="text-xs font-semibold text-steel-500 uppercase tracking-wider">Total Sales Invoiced</div>
            <div className="text-2xl font-bold text-steel-900 mt-1">₹{Number(billStats.total_sales || 0).toLocaleString('en-IN')}</div>
            <div className="text-xs text-steel-400 mt-0.5">{billStats.total_bills} Total Bills Generated</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-steel-200 shadow-sm border-l-4 border-l-green-500">
            <div className="text-xs font-semibold text-green-700 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Total Cash Received
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">₹{Number(billStats.total_collected || 0).toLocaleString('en-IN')}</div>
            <div className="text-xs text-green-600 font-medium mt-0.5">Cleared Payments</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-steel-200 shadow-sm border-l-4 border-l-red-500 bg-red-50/15">
            <div className="text-xs font-semibold text-red-700 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> Total Amount Pending (All Bills Left Due)
            </div>
            <div className="text-2xl font-bold text-red-600 mt-1">₹{Number(billStats.total_pending_due || 0).toLocaleString('en-IN')}</div>
            <Link href="/admin/billing?status=PENDING" className="text-xs text-red-600 font-semibold hover:underline mt-0.5 block">
              View All Pending Bills →
            </Link>
          </div>
        </div>

        {/* Workers & Employees List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-steel-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" /> Registered Employees & Laborers
            </h2>
          </div>

          <div className="bg-white rounded-xl border border-steel-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-steel-50 border-b border-steel-200 text-xs uppercase text-steel-600">
                <tr>
                  <th className="p-3 text-left">Worker Name</th>
                  <th className="p-3 text-left">Contact Phone</th>
                  <th className="p-3 text-center">Employment Type</th>
                  <th className="p-3 text-right">Monthly Salary (₹)</th>
                  <th className="p-3 text-right">Bundle / Labor Rate (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steel-100">
                {workers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-steel-400 italic">
                      No workers added yet.
                    </td>
                  </tr>
                )}
                {workers.map((w: any) => (
                  <tr key={w.id} className="hover:bg-steel-50">
                    <td className="p-3 font-bold text-steel-900">{w.name}</td>
                    <td className="p-3 text-steel-600">{w.phone || '—'}</td>
                    <td className="p-3 text-center">
                      <span className="badge badge-blue">
                        {w.worker_type === 'FULL_TIME' ? 'Full Time Monthly' : 'Part Time (Per Bundle)'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium">₹{Number(w.monthly_salary || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-bold text-orange-700">₹{Number(w.bundle_rate || 0)} / bundle</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
