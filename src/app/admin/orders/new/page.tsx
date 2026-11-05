'use client';

import React, { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Plus, Trash2, Save, ArrowLeft, Truck, Package, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Silver Touch',
  'Ring',
  'Laser',
  'Laser + Ring',
  'Silver Touch + Laser',
  'PVD Coating'
];

interface OrderRow {
  id: string;
  item_name: string;
  category: string;
  size: string;
  qty: string;
  unit: 'kg' | 'pcs';
  rate: string;
  amount: number;
}

const emptyRow = (): OrderRow => ({
  id: Math.random().toString(36).substring(2, 9),
  item_name: '',
  category: 'Silver Touch',
  size: '',
  qty: '',
  unit: 'kg',
  rate: '',
  amount: 0,
});

export default function NewOfflineOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    order_date: new Date().toISOString().split('T')[0],
    order_type: 'WHOLESALE',
    transport_mode: 'OWN_VEHICLE',
    vehicle_details: '',
    notes: '',
    discount: '0',
  });

  const [items, setItems] = useState<OrderRow[]>([emptyRow()]);

  const updateItem = (id: string, field: keyof OrderRow, value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      const qty = parseFloat(updated.qty) || 0;
      const rate = parseFloat(updated.rate) || 0;
      updated.amount = parseFloat((qty * rate).toFixed(2));
      return updated;
    }));
  };

  const deleteRow = (id: string) => {
    setItems(prev => prev.length === 1 ? [emptyRow()] : prev.filter(i => i.id !== id));
  };

  const addRow = () => {
    setItems(prev => [...prev, emptyRow()]);
  };

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const discount = parseFloat(form.discount) || 0;
  const total = subtotal - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    const valid = items.filter(i => i.item_name && i.item_name.trim());
    if (valid.length === 0) {
      toast.error('Please enter at least one item');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        items: valid,
        discount,
        subtotal,
        total,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Order created: ${data.order_number}`);
      router.push('/admin/orders');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save order');
    }
    setSaving(false);
  };

  return (
    <AdminShell>
      <form onSubmit={handleSubmit} className="space-y-5 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/orders" className="p-2 bg-white border border-steel-200 rounded-lg hover:bg-steel-50">
              <ArrowLeft className="w-4 h-4 text-steel-700" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-steel-900">Note Down Offline Customer Order</h1>
              <p className="text-xs text-steel-500">Record items, quantities needed, and transport/vehicle details.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-brand-600 text-white rounded-lg font-bold text-sm hover:bg-brand-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Offline Order
          </button>
        </div>

        {/* Customer & Transport Details Card */}
        <div className="bg-white p-5 rounded-xl border border-steel-200 shadow-sm space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-steel-500 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-brand-600" /> Customer Information
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-steel-700 block mb-1">Customer Name *</label>
              <input
                className="bill-input font-medium"
                placeholder="Walk-in customer / Trader name"
                value={form.customer_name}
                onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-steel-700 block mb-1">Phone Number</label>
              <input
                className="bill-input"
                placeholder="Mobile number"
                value={form.customer_phone}
                onChange={e => setForm(p => ({ ...p, customer_phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-steel-700 block mb-1">Date</label>
              <input
                type="date"
                className="bill-input"
                value={form.order_date}
                onChange={e => setForm(p => ({ ...p, order_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Transport / Vehicle Section */}
          <div className="pt-2 border-t border-steel-100">
            <div className="text-xs font-bold uppercase tracking-wider text-steel-500 flex items-center gap-1.5 mb-2">
              <Truck className="w-4 h-4 text-orange-600" /> Transport & Vehicle Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-steel-700 block mb-1">Transport Mode</label>
                <select
                  className="bill-input font-medium"
                  value={form.transport_mode}
                  onChange={e => setForm(p => ({ ...p, transport_mode: e.target.value }))}
                >
                  <option value="OWN_VEHICLE">Customer's Own Vehicle (Tempo, Tractor, Auto)</option>
                  <option value="AGENCY_TRANSPORT">Transport Agency / Bilty / Courier</option>
                  <option value="STORE_DELIVERY">Our Store / Godown Delivery</option>
                  <option value="HAND_CARRY">Hand Carry / By Hand</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-steel-700 block mb-1">
                  Vehicle No. / Transport Name & Bilty Details
                </label>
                <input
                  className="bill-input"
                  placeholder="e.g. UP 86 T 1234, Hathras Goods Carrier, Bilty No. 450"
                  value={form.vehicle_details}
                  onChange={e => setForm(p => ({ ...p, vehicle_details: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items Needed Grid */}
        <div className="bg-white rounded-xl border border-steel-200 overflow-hidden shadow-sm">
          <div className="p-3 bg-steel-50 border-b border-steel-200 font-bold text-xs uppercase text-steel-700">
            Items Needed & Quantities
          </div>
          <table className="w-full text-sm">
            <thead className="bg-steel-800 text-white text-xs uppercase">
              <tr>
                <th className="p-2.5 text-center w-8">#</th>
                <th className="p-2.5 text-left">Item Name Needed</th>
                <th className="p-2.5 text-left">Category / Finish</th>
                <th className="p-2.5 text-left">Size / No.</th>
                <th className="p-2.5 text-right w-24">Qty Needed</th>
                <th className="p-2.5 text-center w-24">Unit</th>
                <th className="p-2.5 text-right w-28">Est. Rate (₹)</th>
                <th className="p-2.5 text-right w-28">Total Amount</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {items.map((row, idx) => (
                <tr key={row.id} className="hover:bg-steel-50">
                  <td className="p-2 text-center text-xs text-steel-400 font-mono">{idx + 1}</td>
                  <td className="p-1">
                    <input
                      className="bill-input font-medium"
                      placeholder="Item name (e.g. Pawalli, Kadai, Kaucha)…"
                      value={row.item_name}
                      onChange={e => updateItem(row.id, 'item_name', e.target.value)}
                      required
                    />
                  </td>
                  <td className="p-1">
                    <select
                      className="bill-input text-xs"
                      value={row.category}
                      onChange={e => updateItem(row.id, 'category', e.target.value)}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="p-1 w-24">
                    <input
                      className="bill-input"
                      placeholder="Size"
                      value={row.size}
                      onChange={e => updateItem(row.id, 'size', e.target.value)}
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="number"
                      step="0.01"
                      className="bill-input-sm font-bold"
                      placeholder="0"
                      value={row.qty}
                      onChange={e => updateItem(row.id, 'qty', e.target.value)}
                      required
                    />
                  </td>
                  <td className="p-1">
                    <select
                      className="bill-input text-center font-bold text-xs"
                      value={row.unit}
                      onChange={e => updateItem(row.id, 'unit', e.target.value as 'kg'|'pcs')}
                    >
                      <option value="kg">KG</option>
                      <option value="pcs">PCS</option>
                    </select>
                  </td>
                  <td className="p-1">
                    <input
                      type="number"
                      step="0.01"
                      className="bill-input-sm"
                      placeholder="0.00"
                      value={row.rate}
                      onChange={e => updateItem(row.id, 'rate', e.target.value)}
                    />
                  </td>
                  <td className="p-2 text-right font-bold text-steel-900">
                    ₹{row.amount.toFixed(2)}
                  </td>
                  <td className="p-1 text-center">
                    <button
                      type="button"
                      onClick={() => deleteRow(row.id)}
                      className="text-steel-300 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-3 bg-steel-50 flex items-center justify-between border-t border-steel-200">
            <button
              type="button"
              onClick={addRow}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Item Line
            </button>
            <div className="text-right font-bold text-steel-800 text-sm">
              Estimated Order Total: <span className="text-brand-600 text-base">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </form>
    </AdminShell>
  );
}
