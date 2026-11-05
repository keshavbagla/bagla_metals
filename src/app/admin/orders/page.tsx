'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import Link from 'next/link';
import { Plus, Search, Truck, Loader2, ArrowRight } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadOrders = () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set('search', search);

    fetch(`/api/orders?${p.toString()}`)
      .then(r => r.json())
      .then(d => {
        setOrders(d.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, [search]);

  return (
    <AdminShell>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-steel-900">Offline & Advance Orders</h1>
            <p className="text-xs text-steel-500">Record customer requirements, quantities needed, and transport/vehicle details.</p>
          </div>
          <Link
            href="/admin/orders/new"
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> + Note Down New Order
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
          <input
            className="bill-input pl-9"
            placeholder="Search orders by customer, vehicle, order no…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-steel-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 border-b border-steel-200 text-xs uppercase text-steel-600">
              <tr>
                <th className="p-3 text-left">Order No</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Transport / Vehicle</th>
                <th className="p-3 text-center">Items Count</th>
                <th className="p-3 text-right">Estimated Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-steel-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                    Loading orders…
                  </td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-steel-400 italic">
                    No orders noted down yet. Click "+ Note Down New Order" when a customer walks in!
                  </td>
                </tr>
              )}
              {!loading && orders.map((o: any) => (
                <tr key={o.id} className="hover:bg-steel-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-brand-700">{o.order_number}</td>
                  <td className="p-3">
                    <div className="font-semibold text-steel-900">{o.customer_name}</div>
                    {o.customer_phone && <div className="text-xs text-steel-500">{o.customer_phone}</div>}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 text-steel-800 font-medium">
                      <Truck className="w-3.5 h-3.5 text-steel-500" />
                      {o.transport_mode === 'OWN_VEHICLE' ? "Customer's Own Vehicle" : 'Transport / Courier'}
                    </div>
                    {o.vehicle_details && (
                      <div className="text-xs text-brand-600 font-mono mt-0.5">{o.vehicle_details}</div>
                    )}
                  </td>
                  <td className="p-3 text-center font-bold">{o.item_count} items</td>
                  <td className="p-3 text-right font-bold text-steel-900">
                    ₹{Number(o.total).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-center">
                    <span className="badge badge-yellow">{o.status}</span>
                  </td>
                  <td className="p-3 text-xs text-steel-500">{o.order_date || o.created_at}</td>
                  <td className="p-3 text-center">
                    <Link
                      href={`/admin/billing/new?customer_name=${encodeURIComponent(o.customer_name)}&customer_phone=${encodeURIComponent(o.customer_phone || '')}`}
                      className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold px-2.5 py-1 rounded border border-brand-200 inline-flex items-center gap-1"
                    >
                      Convert to Bill <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
