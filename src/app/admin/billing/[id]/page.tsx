'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';
import BillingEditor, { BillItem } from '../../../../components/admin/BillingEditor';
import { Loader2 } from 'lucide-react';

export default function EditBillPage() {
  const params = useParams();
  const id = params?.id as string;
  const [bill, setBill] = useState<any>(null);
  const [items, setItems] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/bills/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.bill) {
          setBill(d.bill);
          setItems((d.items || []).map((i: any) => ({
            id: String(i.id || Math.random()),
            item_name: i.item_name || '',
            category: i.category || '',
            size: i.size || '',
            grade: i.grade || '',
            brand: i.brand || '',
            qty: String(i.qty || ''),
            unit: (i.unit as 'kg' | 'pcs') || 'kg',
            rate: String(i.rate || ''),
            labour: String(i.labour || '0'),
            amount: Number(i.amount) || 0,
            notes: i.notes || '',
          })));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <AdminShell>
      <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
    </AdminShell>
  );

  return (
    <AdminShell>
      <BillingEditor
        initialBill={{
          id: bill?.id,
          bill_number: bill?.bill_number,
          customer_name: bill?.customer_name || '',
          customer_phone: bill?.customer_phone || '',
          customer_address: bill?.customer_address || '',
          bill_date: bill?.bill_date || new Date().toISOString().split('T')[0],
          items: items.length > 0 ? items : undefined,
          bag_cost: String(bill?.bag_cost || ''),
          discount: String(bill?.discount || ''),
          payment_method: bill?.payment_method || 'CASH',
          payment_status: bill?.payment_status || 'PENDING',
          amount_paid: String(bill?.amount_paid || ''),
          notes: bill?.notes || '',
        }}
      />
    </AdminShell>
  );
}
