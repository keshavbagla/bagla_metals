'use client';

import { useState, useEffect } from 'react';
import AdminShell from '../../../components/admin/AdminShell';
import Link from 'next/link';
import { Plus, Edit3, Download, Search, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';

export default function BillingListPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total_amount: 0, total_paid: 0, total_pending: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const loadBills = () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (status) p.set('status', status);

    fetch(`/api/bills?${p.toString()}`)
      .then(r => r.json())
      .then(d => {
        setBills(d.bills || []);
        if (d.summary) setSummary(d.summary);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadBills();
  }, [search, status]);

  return (
    <AdminShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-steel-900">Billing & Outstanding Ledger</h1>
            <p className="text-xs text-steel-500">Track total bill value, amount paid, and exact balance left due for every customer.</p>
          </div>
          <Link
            href="/admin/billing/new"
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-brand-700 transition"
          >
            <Plus className="w-4 h-4" /> + Create New Bill
          </Link>
        </div>

        {/* Global Outstanding Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-steel-200 shadow-sm">
            <div className="text-xs font-semibold text-steel-500 uppercase tracking-wider">Total Invoiced (All Bills)</div>
            <div className="text-2xl font-bold text-steel-900 mt-1">₹{Number(summary.total_amount || 0).toLocaleString('en-IN')}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-steel-200 shadow-sm border-l-4 border-l-green-500">
            <div className="text-xs font-semibold text-green-700 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Total Amount Received
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">₹{Number(summary.total_paid || 0).toLocaleString('en-IN')}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-steel-200 shadow-sm border-l-4 border-l-red-500 bg-red-50/10">
            <div className="text-xs font-semibold text-red-700 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> Total Balance Pending (Left Due)
            </div>
            <div className="text-2xl font-bold text-red-600 mt-1">₹{Number(summary.total_pending || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
            <input
              className="bill-input pl-9"
              placeholder="Search by customer name, bill number, phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="bill-input max-w-[200px]"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="">All Payment Statuses</option>
            <option value="PENDING">Pending (Unpaid)</option>
            <option value="PARTIAL">Partial (Some Left)</option>
            <option value="PAID">Fully Paid</option>
          </select>
        </div>

        {/* Invoices List with Paid & Left Due Details */}
        <div className="bg-white rounded-xl border border-steel-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-steel-800 text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Bill No.</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Bill Total (₹)</th>
                <th className="px-4 py-3 text-right text-green-300">Amount Paid (₹)</th>
                <th className="px-4 py-3 text-right text-red-300">Balance Left (₹)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-100">
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-steel-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                    Loading bills…
                  </td>
                </tr>
              )}
              {!loading && bills.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-steel-400 italic">
                    No bills found. Create your first bill above!
                  </td>
                </tr>
              )}
              {!loading && bills.map((b: any) => {
                const isOverdue = (b.balance_due || 0) > 0;
                return (
                  <tr key={b.id} className="hover:bg-steel-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-brand-700">{b.bill_number}</td>
                    <td className="px-4 py-3 font-semibold text-steel-900">
                      {b.customer_name}
                      {b.customer_phone && <span className="block text-xs font-normal text-steel-500">{b.customer_phone}</span>}
                    </td>
                    <td className="px-4 py-3 text-steel-600">{b.bill_date}</td>
                    <td className="px-4 py-3 text-right font-bold text-steel-900">
                      ₹{Number(b.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-700 bg-green-50/20">
                      ₹{Number(b.amount_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-bold bg-red-50/20">
                      {isOverdue ? (
                        <span className="text-red-600 font-extrabold">
                          ₹{Number(b.balance_due).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-green-600 font-bold">₹0.00 (Cleared)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${
                        b.payment_status === 'PAID' ? 'badge-green' :
                        b.payment_status === 'PARTIAL' ? 'badge-yellow' : 'badge-red'
                      }`}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/admin/billing/${b.id}`}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200 text-xs font-semibold flex items-center gap-1"
                          title="Edit items or price on this bill"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </Link>
                        <a
                          href={`/api/bills/${b.id}/download`}
                          className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded border border-green-200 text-xs font-semibold flex items-center gap-1"
                          title="Download as Excel"
                        >
                          <Download className="w-3 h-3" /> Excel
                        </a>
                      </div>
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
