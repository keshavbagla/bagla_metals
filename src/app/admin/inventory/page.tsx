import AdminShell from '@/components/admin/AdminShell';
import getDb from '@/lib/db';

export default function AdminInventoryPage() {
  const db = getDb();
  const godowns = db.prepare(`SELECT * FROM godowns`).all() as any[];
  return (
    <AdminShell>
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Godowns & Inventory</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {godowns.map(g => (
            <div key={g.id} className="bg-white p-4 rounded-xl border">
              <div className="font-bold">{g.name}</div>
              <div className="text-xs text-steel-500 mt-1">{g.address}</div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
