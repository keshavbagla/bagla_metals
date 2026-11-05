import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session || !requireRole(session, ['ADMIN', 'STAFF'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getDb();
  const bill = db.prepare(`SELECT * FROM bills WHERE id=?`).get(params.id) as any;
  if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
  const items = db.prepare(`SELECT * FROM bill_items WHERE bill_id=? ORDER BY row_order`).all(params.id) as any[];
  return NextResponse.json({ bill, items });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session || !requireRole(session, ['ADMIN', 'STAFF'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getDb();
  const bill = db.prepare(`SELECT * FROM bills WHERE id=?`).get(params.id) as any;
  if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });

  try {
    const body = await req.json();
    const {
      customer_name, customer_phone, customer_address, bill_date,
      items = [], bag_cost = 0, discount = 0, payment_method,
      amount_paid = 0, notes
    } = body;

    const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    const total = subtotal + (Number(bag_cost) || 0) - (Number(discount) || 0);
    const paid = Number(amount_paid) || 0;
    const balance_due = Math.max(0, total - paid);

    let payment_status = 'PENDING';
    if (paid >= total && total > 0) payment_status = 'PAID';
    else if (paid > 0) payment_status = 'PARTIAL';

    const updateBill = db.transaction(() => {
      db.prepare(`
        UPDATE bills SET
          customer_name=?, customer_phone=?, customer_address=?,
          bill_date=?, subtotal=?, bag_cost=?, discount=?, total=?,
          amount_paid=?, balance_due=?, payment_status=?, payment_method=?, notes=?,
          last_saved_at=datetime('now'), updated_at=datetime('now')
        WHERE id=?
      `).run(
        customer_name || bill.customer_name, customer_phone ?? bill.customer_phone,
        customer_address ?? bill.customer_address, bill_date || bill.bill_date,
        subtotal, Number(bag_cost) || 0, Number(discount) || 0,
        total, paid, balance_due, payment_status,
        payment_method || bill.payment_method, notes ?? bill.notes,
        params.id
      );

      db.prepare(`DELETE FROM bill_items WHERE bill_id=?`).run(params.id);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.item_name || !item.item_name.trim()) continue;
        db.prepare(`
          INSERT INTO bill_items (bill_id, row_order, item_name, category, size, grade, brand, qty, unit, rate, labour, amount, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          params.id, i, item.item_name.trim(), item.category || 'Silver Touch', item.size || null,
          item.grade || '202', item.brand || null, Number(item.qty) || 0,
          item.unit || 'kg', Number(item.rate) || 0, Number(item.labour) || 0,
          Number(item.amount) || 0, item.notes || null
        );
      }
    });

    updateBill();
    return NextResponse.json({ success: true, total, balance_due, subtotal });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
  }
}
