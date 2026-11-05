import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const order = db.prepare(`SELECT * FROM orders WHERE id=?`).get(params.id) as any;
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const items = db.prepare(`SELECT * FROM order_items WHERE order_id=?`).all(params.id);
  const history = db.prepare(`SELECT * FROM order_status_history WHERE order_id=? ORDER BY created_at`).all(params.id);
  return NextResponse.json({ order, items, history });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session || !requireRole(session, ['ADMIN', 'STAFF'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getDb();
  const { status, notes, transport_details, payment_status } = await req.json();
  db.prepare(`
    UPDATE orders SET status=COALESCE(?,status), notes=COALESCE(?,notes),
    transport_details=COALESCE(?,transport_details), payment_status=COALESCE(?,payment_status),
    updated_at=datetime('now') WHERE id=?
  `).run(status || null, notes || null, transport_details || null, payment_status || null, params.id);
  if (status) {
    db.prepare(`INSERT INTO order_status_history (order_id, status, notes, changed_by) VALUES (?, ?, ?, ?)`).run(params.id, status, notes || null, session.userId);
  }
  return NextResponse.json({ success: true });
}
