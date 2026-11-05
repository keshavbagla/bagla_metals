import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !requireRole(session, ['ADMIN', 'STAFF'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (search) {
    where += ` AND (name LIKE ? OR phone LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  const customers = db.prepare(`SELECT * FROM customers ${where} ORDER BY name LIMIT 50`).all(...params);
  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !requireRole(session, ['ADMIN', 'STAFF'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getDb();
  const { name, phone, address, city, customer_type } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const r = db.prepare(`INSERT INTO customers (name, phone, address, city, customer_type) VALUES (?, ?, ?, ?, ?)`).run(
    name, phone || null, address || null, city || null, customer_type || 'RETAIL'
  );
  return NextResponse.json({ success: true, id: r.lastInsertRowid });
}
