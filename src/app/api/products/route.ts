import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').trim();
  const category = (searchParams.get('category') || '').trim();
  const godown = (searchParams.get('godown') || '').trim();

  let sql = `SELECT * FROM products WHERE is_active=1`;
  const params: any[] = [];

  if (search) {
    sql += ` AND (name LIKE ? OR size LIKE ? OR brand LIKE ? OR manufacturer_name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) {
    sql += ` AND category = ?`;
    params.push(category);
  }
  if (godown) {
    sql += ` AND godown_name = ?`;
    params.push(godown);
  }

  sql += ` ORDER BY updated_at DESC, name ASC LIMIT 500`;
  const products = db.prepare(sql).all(...params);
  return NextResponse.json({ products });
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
      name, category, size, grade = '202', brand,
      manufacturer_name = '', godown_name = 'Godown 1 (Circular Road)',
      stock_qty = 0, unit = 'kg',
      purchase_price = 0, selling_price = 0, wholesale_price = 0
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    const itemName = name.trim();
    const cat = category ? category.trim() : null;
    const sz = size ? size.trim() : null;
    const grd = grade ? grade.trim() : '202';
    const brnd = brand ? brand.trim() : null;

    if (cat) db.prepare(`INSERT OR IGNORE INTO categories (name) VALUES (?)`).run(cat);
    if (brnd) db.prepare(`INSERT OR IGNORE INTO brands (name) VALUES (?)`).run(brnd);

    db.prepare(`
      INSERT INTO products (
        name, category, size, grade, brand, manufacturer_name, godown_name,
        stock_qty, unit, purchase_price, selling_price, wholesale_price
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(name, category, size, grade, brand, godown_name) DO UPDATE SET
        manufacturer_name=excluded.manufacturer_name,
        stock_qty=excluded.stock_qty,
        unit=excluded.unit,
        purchase_price=excluded.purchase_price,
        selling_price=excluded.selling_price,
        wholesale_price=excluded.wholesale_price,
        updated_at=datetime('now')
    `).run(
      itemName, cat, sz, grd, brnd, manufacturer_name, godown_name,
      Number(stock_qty) || 0, unit,
      Number(purchase_price) || 0, Number(selling_price) || 0, Number(wholesale_price) || 0
    );

    return NextResponse.json({ success: true, message: 'Stock & pricing updated successfully' });
  } catch (err: any) {
    console.error('Save product error:', err);
    return NextResponse.json({ error: 'Failed to save product' }, { status: 500 });
  }
}
