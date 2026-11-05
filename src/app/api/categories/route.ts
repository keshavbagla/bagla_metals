import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET() {
  const db = getDb();
  const cats = db.prepare(`SELECT * FROM categories ORDER BY sort_order, name`).all();
  return NextResponse.json({ categories: cats });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role === 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getDb();
  const { name, name_hi } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  try {
    const r = db.prepare(`INSERT INTO categories (name, name_hi, sort_order) VALUES (?, ?, 99)`).run(name, name_hi || null);
    return NextResponse.json({ success: true, id: r.lastInsertRowid });
  } catch {
    return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
  }
}
