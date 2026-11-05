import AdminShell from '@/components/admin/AdminShell';
import getDb from '@/lib/db';

export default function AdminReportsPage() {
  const db = getDb();
  const totals = db.prepare(`
    SELECT COALESCE(SUM(total), 0) as total_sales, COALESCE(SUM(amount_paid), 0) as total_collected
    FROM bills WHERE status != 'CANCELLED'
  `).get() as any;

  return (
    <AdminShell>
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Reports</h1>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border">
            <div className="text-xs text-steel-500 uppercase">Total Sales</div>
            <div className="text-2xl font-bold mt-2">₹{Number(totals.total_sales).toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-white p-5 rounded-xl border">
            <div className="text-xs text-steel-500 uppercase">Collected</div>
            <div className="text-2xl font-bold text-green-600 mt-2">₹{Number(totals.total_collected).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
