'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Printer, Save, Download, Plus, Trash2, Loader2, Sparkles, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export interface BillItem {
  id: string;
  item_name: string;
  category: string;
  size: string;
  grade: string;
  brand: string;
  qty: string;
  unit: 'kg' | 'pcs';
  rate: string;
  labour: string;
  amount: number;
  notes: string;
}

export interface BillData {
  id?: number;
  bill_number?: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  bill_date: string;
  items: BillItem[];
  bag_cost: string;
  discount: string;
  payment_method: string;
  payment_status: string;
  amount_paid: string;
  notes: string;
}

interface Suggestion {
  item_name: string;
  category: string;
  size: string;
  grade: string;
  brand: string;
  unit_hint?: string;
  last_rate?: number;
  usage_count?: number;
}

const CATEGORIES = [
  'Silver Touch',
  'Ring',
  'Laser',
  'Laser + Ring',
  'Silver Touch + Laser',
  'PVD Coating'
];

const BRANDS = ['JPS','Mango','Apple','Lavi','Kwality','Baba','Kashvi','Ritu','Mukundham','Parul','Surya','Tanishq','Raja','Marvy','D.S'];
const GRADES = ['202','304','316'];
const UNITS = ['kg','pcs'];

const emptyItem = (): BillItem => ({
  id: Math.random().toString(36).substring(2, 9),
  item_name: '', category: 'Silver Touch', size: '', grade: '202', brand: 'JPS',
  qty: '', unit: 'kg', rate: '', labour: '', amount: 0, notes: '',
});

function calcAmount(item: BillItem): number {
  const qty = parseFloat(item.qty) || 0;
  const rate = parseFloat(item.rate) || 0;
  const labour = parseFloat(item.labour) || 0;
  return parseFloat((qty * rate + labour).toFixed(2));
}

function fmtINR(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function useSmartItemLookup(query: string, category: string) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query.trim() });
        if (category) params.set('category', category);
        const res = await fetch(`/api/items/suggest?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch {}
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer.current);
  }, [query, category]);

  return { suggestions, loading };
}

function ItemRow({
  item, index, onChange, onDelete, onAddBelow
}: {
  item: BillItem; index: number;
  onChange: (id: string, field: keyof BillItem, value: string) => void;
  onDelete: (id: string) => void;
  onAddBelow: (id: string) => void;
}) {
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const { suggestions, loading } = useSmartItemLookup(showItemSuggestions ? item.item_name : '', item.category);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowItemSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectSuggestion = (s: Suggestion) => {
    onChange(item.id, 'item_name', s.item_name);
    if (s.category) onChange(item.id, 'category', s.category);
    if (s.size) onChange(item.id, 'size', s.size);
    if (s.grade) onChange(item.id, 'grade', s.grade);
    if (s.brand) onChange(item.id, 'brand', s.brand);
    if (s.unit_hint) onChange(item.id, 'unit', s.unit_hint === 'per_piece' ? 'pcs' : (s.unit_hint as 'kg'|'pcs'));
    if (s.last_rate && Number(s.last_rate) > 0) onChange(item.id, 'rate', String(s.last_rate));
    setShowItemSuggestions(false);
  };

  return (
    <tr className="hover:bg-brand-50/25 transition-colors border-b border-steel-100">
      <td className="px-2 py-2 text-center text-steel-400 text-xs font-mono w-8 select-none">{index + 1}</td>

      {/* Item Name (Type / Autocomplete Input) */}
      <td className="px-1 py-1 relative min-w-[190px]">
        <div className="relative flex items-center">
          <input
            className="bill-input font-medium pr-5"
            placeholder="Item name (Pawalli, Topi, Kadai)…"
            value={item.item_name}
            autoComplete="off"
            onFocus={() => setShowItemSuggestions(true)}
            onChange={e => {
              onChange(item.id, 'item_name', e.target.value);
              setShowItemSuggestions(true);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') onAddBelow(item.id);
            }}
          />
          {item.item_name && (
            <Sparkles className="w-3 h-3 text-brand-400 absolute right-2 pointer-events-none" />
          )}
        </div>

        {showItemSuggestions && item.item_name.trim().length > 0 && (
          <div ref={dropdownRef} className="autocomplete-dropdown top-full left-0 mt-1 max-h-64 shadow-2xl z-50">
            {loading && (
              <div className="px-3 py-2 text-xs text-steel-400 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Searching learned items…
              </div>
            )}
            {!loading && suggestions.length === 0 && (
              <div className="px-3 py-2 text-xs text-brand-600 bg-brand-50/50">
                ✏️ New item: <strong>"{item.item_name}"</strong> will be learned and memorized!
              </div>
            )}
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="px-3 py-2 hover:bg-brand-50 cursor-pointer border-b border-steel-50 last:border-0"
                onMouseDown={() => selectSuggestion(s)}
              >
                <div className="font-semibold text-sm text-steel-900">{s.item_name}</div>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-steel-500">
                  {s.category && <span className="bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded font-medium">{s.category}</span>}
                  {s.size && <span>Size: <strong>{s.size}</strong></span>}
                  {s.grade && <span>{s.grade}</span>}
                  {s.brand && <span className="text-steel-700 font-medium">{s.brand}</span>}
                  {s.last_rate && Number(s.last_rate) > 0 && (
                    <span className="ml-auto font-bold text-steel-900">{fmtINR(Number(s.last_rate))}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </td>

      {/* Category Dropdown */}
      <td className="px-1 py-1 min-w-[140px]">
        <select
          className="bill-input font-medium text-xs"
          value={item.category}
          onChange={e => onChange(item.id, 'category', e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>

      {/* Size */}
      <td className="px-1 py-1 w-20">
        <input
          className="bill-input"
          placeholder="Size"
          value={item.size}
          onChange={e => onChange(item.id, 'size', e.target.value)}
        />
      </td>

      {/* Grade */}
      <td className="px-1 py-1 w-20">
        <select
          className="bill-input text-center font-mono text-xs"
          value={item.grade}
          onChange={e => onChange(item.id, 'grade', e.target.value)}
        >
          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </td>

      {/* Brand */}
      <td className="px-1 py-1 min-w-[110px]">
        <select
          className="bill-input font-medium text-xs"
          value={item.brand}
          onChange={e => onChange(item.id, 'brand', e.target.value)}
        >
          {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </td>

      {/* Qty */}
      <td className="px-1 py-1 w-20">
        <input
          type="number"
          step="0.01"
          className="bill-input-sm font-semibold"
          placeholder="0"
          value={item.qty}
          onChange={e => onChange(item.id, 'qty', e.target.value)}
        />
      </td>

      {/* Unit (KG / PCS toggle) */}
      <td className="px-1 py-1 w-20">
        <select
          className="bill-input text-center font-bold text-xs uppercase"
          value={item.unit}
          onChange={e => onChange(item.id, 'unit', e.target.value as 'kg'|'pcs')}
        >
          {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
        </select>
      </td>

      {/* Rate */}
      <td className="px-1 py-1 w-24">
        <input
          type="number"
          step="0.01"
          className="bill-input-sm font-semibold"
          placeholder="0.00"
          value={item.rate}
          onChange={e => onChange(item.id, 'rate', e.target.value)}
        />
      </td>

      {/* Labour (Per-row charge) */}
      <td className="px-1 py-1 w-20">
        <input
          type="number"
          step="0.5"
          className="bill-input-sm text-orange-700 font-medium"
          placeholder="0"
          value={item.labour}
          onChange={e => onChange(item.id, 'labour', e.target.value)}
          title="Row Labour Charges (₹)"
        />
      </td>

      {/* Amount */}
      <td className="px-2 py-1 text-right font-bold text-steel-900 text-sm whitespace-nowrap">
        {fmtINR(item.amount)}
      </td>

      {/* Delete / Remove item */}
      <td className="px-1 py-1 text-center w-8">
        <button
          onClick={() => onDelete(item.id)}
          className="text-steel-300 hover:text-red-500 transition-colors p-1"
          title="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function PrintBill({ bill, items }: { bill: BillData; items: BillItem[] }) {
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const totalLabour = items.reduce((s, i) => s + (parseFloat(i.labour) || 0), 0);
  const bagCost = parseFloat(bill.bag_cost) || 0;
  const discount = parseFloat(bill.discount) || 0;
  const grandTotal = subtotal + bagCost - discount;

  return (
    <div className="invoice-print print-only bg-white p-4" id="print-area">
      <div className="text-center border-b-2 border-steel-800 pb-2 mb-3">
        <h1 className="text-2xl font-bold uppercase tracking-wider">BAGLA METAL TRADERS</h1>
        <p className="text-sm font-medium">Circular Road, Hathras</p>
      </div>

      <div className="flex justify-between mb-3 text-sm">
        <div>
          <div>Customer: <strong>{bill.customer_name}</strong></div>
          {bill.customer_phone && <div>Ph: {bill.customer_phone}</div>}
          {bill.customer_address && <div className="text-steel-600 text-xs">{bill.customer_address}</div>}
        </div>
        <div className="text-right">
          <div>Bill No: <strong>{bill.bill_number || '—'}</strong></div>
          <div>Date: {bill.bill_date}</div>
        </div>
      </div>

      <table className="bill-table w-full text-sm">
        <thead>
          <tr>
            <th>#</th>
            <th style={{ textAlign: 'left' }}>Item Name</th>
            <th>Category</th>
            <th>Size</th>
            <th>Grade</th>
            <th>Brand</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Rate</th>
            <th>Labour</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.filter(i => i.item_name && i.item_name.trim()).map((item, idx) => (
            <tr key={item.id}>
              <td style={{ textAlign: 'center' }}>{idx + 1}</td>
              <td style={{ fontWeight: 600 }}>{item.item_name}</td>
              <td style={{ textAlign: 'center' }}>{item.category}</td>
              <td style={{ textAlign: 'center' }}>{item.size}</td>
              <td style={{ textAlign: 'center' }}>{item.grade}</td>
              <td style={{ textAlign: 'center' }}>{item.brand}</td>
              <td style={{ textAlign: 'center' }}>{item.qty}</td>
              <td style={{ textAlign: 'center', textTransform: 'uppercase' }}>{item.unit}</td>
              <td style={{ textAlign: 'right' }}>₹{parseFloat(item.rate || '0').toFixed(2)}</td>
              <td style={{ textAlign: 'right' }}>{parseFloat(item.labour || '0') > 0 ? `₹${parseFloat(item.labour).toFixed(2)}` : '—'}</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{item.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto" style={{ width: '250px' }}>
        <div className="flex justify-between py-1"><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
        {totalLabour > 0 && <div className="flex justify-between py-1 text-orange-700"><span>Labour:</span><span>₹{totalLabour.toFixed(2)}</span></div>}
        {bagCost > 0 && <div className="flex justify-between py-1 text-amber-700"><span>Bag / Packaging:</span><span>₹{bagCost.toFixed(2)}</span></div>}
        {discount > 0 && <div className="flex justify-between py-1 text-red-600"><span>Discount:</span><span>-₹{discount.toFixed(2)}</span></div>}
        <div className="flex justify-between py-2 border-t-2 border-black font-bold text-lg">
          <span>TOTAL:</span><span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default function BillingEditor({
  initialBill, onSaved,
}: {
  initialBill?: Partial<BillData> & { id?: number; bill_number?: string };
  onSaved?: (id: number, billNumber: string) => void;
}) {
  const [bill, setBill] = useState<BillData>({
    customer_name: '', customer_phone: '', customer_address: '',
    bill_date: new Date().toISOString().split('T')[0], items: [emptyItem()],
    bag_cost: '', discount: '', payment_method: 'CASH', payment_status: 'PENDING',
    amount_paid: '', notes: '', ...initialBill,
  });

  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | undefined>(initialBill?.id);
  const [savedBillNumber, setSavedBillNumber] = useState<string | undefined>(initialBill?.bill_number);

  const subtotal = bill.items.reduce((s, i) => s + i.amount, 0);
  const totalLabour = bill.items.reduce((s, i) => s + (parseFloat(i.labour) || 0), 0);
  const bagCost = parseFloat(bill.bag_cost) || 0;
  const discount = parseFloat(bill.discount) || 0;
  const grandTotal = subtotal + bagCost - discount;

  const updateItem = useCallback((id: string, field: keyof BillItem, value: string) => {
    setBill(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        updated.amount = calcAmount(updated);
        return updated;
      })
    }));
  }, []);

  const deleteItem = (id: string) => {
    setBill(prev => ({ ...prev, items: prev.items.length === 1 ? [emptyItem()] : prev.items.filter(i => i.id !== id) }));
  };

  const addItemBelow = (id: string) => {
    setBill(prev => {
      const idx = prev.items.findIndex(i => i.id === id);
      const newItems = [...prev.items];
      newItems.splice(idx + 1, 0, emptyItem());
      return { ...prev, items: newItems };
    });
  };

  const saveBill = async () => {
    if (!bill.customer_name.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    const validItems = bill.items.filter(i => i.item_name && i.item_name.trim());
    if (validItems.length === 0) {
      toast.error('Add at least one item before saving');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...bill,
        items: validItems,
        discount: parseFloat(bill.discount) || 0,
        bag_cost: parseFloat(bill.bag_cost) || 0,
        subtotal, total: grandTotal,
      };

      const url = savedId ? `/api/bills/${savedId}` : '/api/bills';
      const method = savedId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (!savedId) {
        setSavedId(data.bill_id);
        setSavedBillNumber(data.bill_number);
        onSaved?.(data.bill_id, data.bill_number);
      }
      toast.success(savedId ? 'Bill updated successfully!' : 'Bill created successfully!');
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    }
    setSaving(false);
  };

  const handlePrint = () => {
    if (!bill.customer_name.trim()) {
      toast.error('Enter customer name before printing');
      return;
    }
    // Triggers actual physical print dialog from printer
    window.print();
  };

  return (
    <>
      <div className="no-print">
        {/* Top Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-steel-900 flex items-center gap-2">
              {savedBillNumber ? `Editing Bill: ${savedBillNumber}` : 'New Bill Creation'}
            </h1>
            <p className="text-xs text-steel-500">
              You can modify or delete any item/price. Click "Print" to send directly to your connected printer.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Printer Trigger */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-steel-800 text-white rounded-lg text-sm font-semibold hover:bg-steel-900 transition flex items-center gap-2 shadow-sm"
              title="Send directly to printer"
            >
              <Printer className="w-4 h-4" /> Print to Printer
            </button>

            {/* Download Excel */}
            {savedId && (
              <a
                href={`/api/bills/${savedId}/download`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
                title="Download spreadsheet invoice"
              >
                <Download className="w-4 h-4" /> Download Excel (.xlsx)
              </a>
            )}

            {/* Save / Update */}
            <button
              onClick={saveBill}
              disabled={saving}
              className="px-5 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savedId ? 'Update & Save Changes' : 'Save Bill'}
            </button>
          </div>
        </div>

        {/* Customer Box */}
        <div className="bg-white p-4 rounded-xl border border-steel-200 grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 shadow-sm">
          <div>
            <label className="text-xs font-semibold text-steel-600">Customer Name *</label>
            <input
              className="bill-input text-base font-semibold"
              placeholder="Customer name…"
              value={bill.customer_name}
              onChange={e => setBill(p => ({ ...p, customer_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-steel-600">Mobile Phone</label>
            <input
              className="bill-input"
              placeholder="e.g. 9876543210"
              value={bill.customer_phone}
              onChange={e => setBill(p => ({ ...p, customer_phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-steel-600">Date</label>
            <input
              type="date"
              className="bill-input"
              value={bill.bill_date}
              onChange={e => setBill(p => ({ ...p, bill_date: e.target.value }))}
            />
          </div>
        </div>

        {/* Items Spreadsheet Table */}
        <div className="bg-white rounded-xl border border-steel-200 overflow-x-auto mb-4 shadow-sm">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-steel-800 text-white text-xs uppercase tracking-wide">
              <tr>
                <th className="px-2 py-2.5 text-center w-8">#</th>
                <th className="px-2 py-2.5 text-left">Item Name (Editable)</th>
                <th className="px-2 py-2.5 text-left">Category / Finish</th>
                <th className="px-2 py-2.5 text-left">Size / No.</th>
                <th className="px-2 py-2.5 text-center">Grade</th>
                <th className="px-2 py-2.5 text-left">Brand</th>
                <th className="px-2 py-2.5 text-right">Qty</th>
                <th className="px-2 py-2.5 text-center">Unit</th>
                <th className="px-2 py-2.5 text-right">Rate (₹)</th>
                <th className="px-2 py-2.5 text-right text-orange-300">Labour ₹</th>
                <th className="px-2 py-2.5 text-right">Amount</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, idx) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  index={idx}
                  onChange={updateItem}
                  onDelete={deleteItem}
                  onAddBelow={addItemBelow}
                />
              ))}
            </tbody>
          </table>

          <div className="p-3 bg-steel-50 border-t border-steel-100 flex items-center justify-between">
            <button
              onClick={() => setBill(p => ({ ...p, items: [...p.items, emptyItem()] }))}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-brand-50"
            >
              <Plus className="w-4 h-4" /> Add Item Line
            </button>
            <span className="text-xs text-steel-500">
              You can change rates, quantities, or click the trash can icon to remove items.
            </span>
          </div>
        </div>

        {/* Footer Summary & Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-steel-200 space-y-3 shadow-sm">
            <h3 className="font-semibold text-sm text-steel-800">Payment & Note</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-steel-500">Payment Method</label>
                <select
                  className="bill-input"
                  value={bill.payment_method}
                  onChange={e => setBill(p => ({ ...p, payment_method: e.target.value }))}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="CREDIT">Credit / Udhaar</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-steel-500">Status</label>
                <select
                  className="bill-input"
                  value={bill.payment_status}
                  onChange={e => setBill(p => ({ ...p, payment_status: e.target.value }))}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid in Full</option>
                  <option value="PARTIAL">Partial</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-steel-200 space-y-2.5 text-sm shadow-sm">
            <div className="flex justify-between font-medium">
              <span className="text-steel-600">Subtotal:</span>
              <span>{fmtINR(subtotal)}</span>
            </div>
            {totalLabour > 0 && (
              <div className="flex justify-between text-orange-700 font-medium">
                <span>Total Item Labour:</span>
                <span>{fmtINR(totalLabour)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1 border-t border-steel-100">
              <label className="text-amber-800 font-semibold">Bag / Packaging Cost (₹):</label>
              <input
                type="number"
                step="0.5"
                className="w-28 bill-input-sm text-amber-800 font-bold"
                placeholder="0.00"
                value={bill.bag_cost}
                onChange={e => setBill(p => ({ ...p, bag_cost: e.target.value }))}
              />
            </div>
            <div className="flex justify-between items-center py-1 border-t border-steel-100">
              <label className="text-red-600 font-medium">Discount (₹):</label>
              <input
                type="number"
                className="w-28 bill-input-sm text-red-600 font-bold"
                placeholder="0.00"
                value={bill.discount}
                onChange={e => setBill(p => ({ ...p, discount: e.target.value }))}
              />
            </div>
            <div className="flex justify-between p-3 bg-steel-900 text-white rounded-lg font-bold text-base mt-2">
              <span>GRAND TOTAL:</span>
              <span>{fmtINR(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      <PrintBill bill={{ ...bill, bill_number: savedBillNumber }} items={bill.items} />
    </>
  );
}
