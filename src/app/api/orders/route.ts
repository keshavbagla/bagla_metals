import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import { getNextOrderNumber } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').trim();
  const status = (searchParams.get('status') || '').trim();

  let sql = `
    SELECT o.*,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
    FROM orders o
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search) {
    sql += ` AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ? OR o.vehicle_details LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) {
    sql += ` AND o.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY o.created_at DESC LIMIT 100`;
  const orders = db.prepare(sql).all(...params);
  return NextResponse.json({ orders });
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
      order_type = 'RETAIL', transport_mode = 'OWN_VEHICLE',
      vehicle_details = '', order_date, items = [],
      discount = 0, notes = '', status = 'PENDING'
    } = body;

    if (!customer_name || !customer_name.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    const validItems = items.filter((i: any) => i.item_name && i.item_name.trim());
    if (validItems.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    const orderNumber = getNextOrderNumber();
    const subtotal = validItems.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    const total = subtotal - (Number(discount) || 0);

    const createOrder = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO orders (
          order_number, customer_name, customer_phone, customer_address,
          order_type, transport_mode, vehicle_details, order_date,
          status, subtotal, discount, total, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderNumber, customer_name.trim(), customer_phone || null, customer_address || null,
        order_type, transport_mode, vehicle_details || null,
        order_date || new Date().toISOString().split('T')[0],
        status, subtotal, Number(discount) || 0, total, notes || null, session.userId
      );

      const orderId = result.lastInsertRowid as number;

      for (const item of validItems) {
        db.prepare(`
          INSERT INTO order_items (order_id, item_name, category, size, grade, brand, qty, unit, rate, amount, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          orderId, item.item_name.trim(), item.category || 'Silver Touch', item.size || null,
          item.grade || '202', item.brand || null, Number(item.qty) || 0,
          item.unit || 'kg', Number(item.rate) || 0, Number(item.amount) || 0, item.notes || null
        );
      }

      return orderId;
    });

    const orderId = createOrder();
    return NextResponse.json({ success: true, order_id: orderId, order_number: orderNumber });
  } catch (err: any) {
    console.error('Create order error:', err);
    return NextResponse.json({ error: 'Failed to create offline order' }, { status: 500 });
  }
}
