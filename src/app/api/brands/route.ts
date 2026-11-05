import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET() {
  const db = getDb();
  const brands = db.prepare(`SELECT * FROM brands ORDER BY name`).all();
  return NextResponse.json({ brands });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role === 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getDb();
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  try {
    const r = db.prepare(`INSERT INTO brands (name) VALUES (?)`).run(name);
    return NextResponse.json({ success: true, id: r.lastInsertRowid });
  } catch {
    return NextResponse.json({ error: 'Brand already exists' }, { status: 409 });
  }
}
