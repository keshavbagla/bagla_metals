import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import { getNextBillNumber } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !requireRole(session, ['ADMIN', 'STAFF'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const limit = parseInt(searchParams.get('limit') || '100');

  let where = `WHERE 1=1`;
  const params: any[] = [];

  if (search) {
    where += ` AND (b.bill_number LIKE ? OR b.customer_name LIKE ? OR b.customer_phone LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) {
    where += ` AND b.payment_status=?`;
    params.push(status);
  }

  const bills = db.prepare(`
    SELECT b.*,
      (SELECT COUNT(*) FROM bill_items WHERE bill_id=b.id) as item_count
    FROM bills b
    ${where}
    ORDER BY b.created_at DESC
    LIMIT ?
  `).all(...params, limit);

  // Totals for all bills
  const summary = db.prepare(`
    SELECT 
      COALESCE(SUM(total), 0) as total_amount,
      COALESCE(SUM(amount_paid), 0) as total_paid,
      COALESCE(SUM(balance_due), 0) as total_pending
    FROM bills
  `).get();

  return NextResponse.json({ bills, summary });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !requireRole(session, ['ADMIN', 'STAFF'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  try {
    const body = await req.json();
    const {
      customer_name, customer_phone, customer_address,
      bill_date, items = [], bag_cost = 0, discount = 0,
      payment_method = 'CASH', amount_paid = 0, notes = ''
    } = body;

    if (!customer_name) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    const billNumber = getNextBillNumber();
    const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    const total = subtotal + (Number(bag_cost) || 0) - (Number(discount) || 0);
    const paid = Number(amount_paid) || 0;
    const balance_due = Math.max(0, total - paid);

    let payment_status = 'PENDING';
    if (paid >= total && total > 0) payment_status = 'PAID';
    else if (paid > 0) payment_status = 'PARTIAL';

    const createBill = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO bills (
          bill_number, customer_name, customer_phone, customer_address,
          bill_date, subtotal, bag_cost, discount, total, amount_paid, balance_due,
          payment_status, payment_method, notes, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'FINAL', ?)
      `).run(
        billNumber, customer_name.trim(), customer_phone || null, customer_address || null,
        bill_date || new Date().toISOString().split('T')[0],
        subtotal, Number(bag_cost) || 0, Number(discount) || 0,
        total, paid, balance_due, payment_status, payment_method, notes, session.userId
      );

      const billId = result.lastInsertRowid as number;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.item_name || !item.item_name.trim()) continue;
        db.prepare(`
          INSERT INTO bill_items (bill_id, row_order, item_name, category, size, grade, brand, qty, unit, rate, labour, amount, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          billId, i, item.item_name.trim(), item.category || 'Silver Touch', item.size || null,
          item.grade || '202', item.brand || null, Number(item.qty) || 0,
          item.unit || 'kg', Number(item.rate) || 0, Number(item.labour) || 0,
          Number(item.amount) || 0, item.notes || null
        );

        // Auto learn selling price into products
        db.prepare(`
          INSERT INTO products (name, category, size, grade, brand, selling_price, unit)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(name, category, size, grade, brand, godown_name) DO UPDATE SET
            selling_price=excluded.selling_price,
            updated_at=datetime('now')
        `).run(item.item_name.trim(), item.category || 'Silver Touch', item.size || null, item.grade || '202', item.brand || null, Number(item.rate) || 0, item.unit || 'kg');
      }

      return billId;
    });

    const billId = createBill();
    return NextResponse.json({ success: true, bill_id: billId, bill_number: billNumber });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}
