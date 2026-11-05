'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Plus, Search, Sparkles, Loader2, Save, Warehouse, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Silver Touch',
  'Ring',
  'Laser',
  'Laser + Ring',
  'Silver Touch + Laser',
  'PVD Coating'
];

const GODOWNS = [
  'Godown 1 (Circular Road)',
  'Godown 2 (Mandi Gate)',
  'Godown 3 (Industrial Area)'
];

const BRANDS = ['JPS','Mango','Apple','Lavi','Kwality','Baba','Kashvi','Ritu','Mukundham','Parul','Surya','Tanishq','Raja','Marvy','D.S'];
const GRADES = ['202','304','316'];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGodown, setSelectedGodown] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  const [form, setForm] = useState({
    name: '',
    category: 'Silver Touch',
    size: '',
    grade: '202',
    brand: 'JPS',
    manufacturer_name: '',
    godown_name: 'Godown 1 (Circular Road)',
    stock_qty: '',
    unit: 'kg',
    purchase_price: '',
    selling_price: '',
    wholesale_price: ''
  });

  const loadProducts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedCat) params.set('category', selectedCat);
    if (selectedGodown) params.set('godown', selectedGodown);

    fetch(`/api/products?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        setProducts(d.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, [search, selectedCat, selectedGodown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Enter item name');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`"${form.name}" stock & prices saved across ${form.godown_name}!`);
      setForm(p => ({
        ...p,
        name: '',
        size: '',
        stock_qty: '',
        purchase_price: '',
        selling_price: ''
      }));
      loadProducts();
    } catch (err: any) {
      toast.error(err.message || 'Error saving item');
    }
    setSaving(false);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-steel-900 flex items-center gap-2">
              Manufacturer Inward, 3 Godowns & Customer Pricing Master
            </h1>
            <p className="text-xs text-steel-500">
              Track manufacturer purchase rate vs customer sell rate and manage stock distribution across all 3 Godowns.
            </p>
          </div>
          <div className="text-xs font-semibold text-steel-600 bg-white border border-steel-200 px-3 py-1.5 rounded-lg shadow-sm">
            Total Tracked Items: <span className="text-brand-600 font-bold">{products.length}</span>
          </div>
        </div>

        {/* Inward / Price Master Form */}
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-steel-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-steel-100 pb-2">
            <Warehouse className="w-4 h-4 text-brand-600" />
            <h2 className="font-bold text-steel-800 text-sm">
              Record Incoming Stock from Manufacturer & Set Customer Selling Rate
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-steel-700 block mb-1">Item Name *</label>
              <input
                className="bill-input font-medium"
                placeholder="e.g. Pawalli, Topi, Kadai…"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-steel-700 block mb-1">Category / Finish *</label>
              <select
                className="bill-input"
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-steel-700 block mb-1">Size / Number</label>
              <input
                className="bill-input"
                placeholder="e.g. 10x12, No. 1, 5 Ltr…"
                value={form.size}
                onChange={e => setForm(p => ({ ...p, size: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-steel-700 block mb-1">Brand</label>
              <select
                className="bill-input"
                value={form.brand}
                onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
              >
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Manufacturer & Godown Selection */}
            <div>
              <label className="text-xs font-semibold text-steel-700 block mb-1">Manufacturer / Supplier</label>
              <input
                className="bill-input"
                placeholder="e.g. Jindal Steel, Sumeet Works"
                value={form.manufacturer_name}
                onChange={e => setForm(p => ({ ...p, manufacturer_name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-700 block mb-1">Select Godown Location *</label>
              <select
                className="bill-input font-semibold bg-brand-50/40 text-steel-900 border-brand-200"
                value={form.godown_name}
                onChange={e => setForm(p => ({ ...p, godown_name: e.target.value }))}
              >
                {GODOWNS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-steel-700 block mb-1">Quantity Received</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  className="bill-input font-bold"
                  placeholder="0.00"
                  value={form.stock_qty}
                  onChange={e => setForm(p => ({ ...p, stock_qty: e.target.value }))}
                />
                <select
                  className="bill-input w-24 text-center font-bold text-xs"
                  value={form.unit}
                  onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                >
                  <option value="kg">KG</option>
                  <option value="pcs">PCS</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-blue-700 block mb-1">
                Manufacturer Price (Buying ₹)
              </label>
              <input
                type="number"
                step="0.01"
                className="bill-input-sm text-left font-bold text-blue-800 bg-blue-50/40"
                placeholder="Cost rate ₹"
                value={form.purchase_price}
                onChange={e => setForm(p => ({ ...p, purchase_price: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-green-700 block mb-1">
                Customer Selling Price (Billing ₹) *
              </label>
              <input
                type="number"
                step="0.01"
                className="bill-input-sm text-left font-bold text-green-800 bg-green-50/40"
                placeholder="Rate to customer ₹"
                value={form.selling_price}
                onChange={e => setForm(p => ({ ...p, selling_price: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-purple-700 block mb-1">
                Wholesale / Bulk Rate (₹)
              </label>
              <input
                type="number"
                step="0.01"
                className="bill-input-sm text-left font-bold text-purple-800 bg-purple-50/40"
                placeholder="Bulk rate ₹"
                value={form.wholesale_price}
                onChange={e => setForm(p => ({ ...p, wholesale_price: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-steel-700 block mb-1">Grade</label>
              <select
                className="bill-input"
                value={form.grade}
                onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}
              >
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-brand-600 text-white rounded-lg font-bold text-sm hover:bg-brand-700 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Inward & Update Prices
              </button>
            </div>
          </div>
        </form>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
            <input
              className="bill-input pl-9"
              placeholder="Search by item, manufacturer, size, brand…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="bill-input max-w-[220px]"
            value={selectedGodown}
            onChange={e => setSelectedGodown(e.target.value)}
          >
            <option value="">All 3 Godowns</option>
            {GODOWNS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <select
            className="bill-input max-w-[200px]"
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
          >
            <option value="">All Finishes</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Master Stock & Pricing Table */}
        <div className="bg-white rounded-xl border border-steel-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-steel-800 text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3 text-left">Item Name</th>
                <th className="p-3 text-left">Category / Finish</th>
                <th className="p-3 text-left">Size / Brand</th>
                <th className="p-3 text-left">Godown Location</th>
                <th className="p-3 text-left">Manufacturer</th>
                <th className="p-3 text-right">Available Stock</th>
                <th className="p-3 text-right text-blue-300">Buying Rate (₹)</th>
                <th className="p-3 text-right text-green-300">Selling Rate (₹)</th>
                <th className="p-3 text-right text-yellow-300">Margin (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {loading && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-steel-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                    Loading items and godown stocks…
                  </td>
                </tr>
              )}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-steel-400 italic">
                    No items found matching the selected filters.
                  </td>
                </tr>
              )}
              {!loading && products.map((p: any) => {
                const margin = (p.selling_price || 0) - (p.purchase_price || 0);
                return (
                  <tr key={p.id} className="hover:bg-steel-50 transition-colors">
                    <td className="p-3 font-bold text-steel-900">{p.name}</td>
                    <td className="p-3">
                      <span className="bg-brand-50 text-brand-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-brand-200">
                        {p.category || '—'}
                      </span>
                    </td>
                    <td className="p-3 text-steel-700">
                      {p.size || '—'} {p.brand && <span className="text-xs text-steel-500 font-medium">({p.brand})</span>}
                    </td>
                    <td className="p-3 font-semibold text-steel-800">
                      <div className="flex items-center gap-1.5">
                        <Warehouse className="w-3.5 h-3.5 text-orange-600" />
                        {p.godown_name}
                      </div>
                    </td>
                    <td className="p-3 text-steel-600 text-xs font-medium">
                      {p.manufacturer_name || '—'}
                    </td>
                    <td className="p-3 text-right font-bold text-steel-900">
                      {p.stock_qty || 0} <span className="text-xs uppercase text-steel-500">{p.unit || 'kg'}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-blue-700 bg-blue-50/20">
                      ₹{Number(p.purchase_price || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-green-700 bg-green-50/20">
                      ₹{Number(p.selling_price || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-steel-800">
                      {margin > 0 ? (
                        <span className="text-green-600">+₹{margin.toFixed(2)}</span>
                      ) : (
                        <span className="text-steel-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
