import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const category = (searchParams.get('category') || '').trim();

  // 1. Search in products (catalog / learned products)
  let productSql = `
    SELECT 
      name as item_name,
      category,
      size,
      grade,
      brand,
      price_type as unit_hint,
      retail_price as last_rate,
      10 as priority
    FROM products
    WHERE 1=1
  `;
  const prodParams: any[] = [];
  if (q) {
    productSql += ` AND (name LIKE ? OR category LIKE ? OR size LIKE ?)`;
    prodParams.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (category) {
    productSql += ` AND category LIKE ?`;
    prodParams.push(`%${category}%`);
  }
  productSql += ` LIMIT 15`;

  // 2. Search in past bill_items history (most used / recently used)
  let billSql = `
    SELECT 
      item_name,
      category,
      size,
      grade,
      brand,
      unit as unit_hint,
      rate as last_rate,
      COUNT(*) as usage_count,
      20 as priority
    FROM bill_items
    WHERE 1=1
  `;
  const billParams: any[] = [];
  if (q) {
    billSql += ` AND (item_name LIKE ? OR category LIKE ? OR size LIKE ?)`;
    billParams.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (category) {
    billSql += ` AND category LIKE ?`;
    billParams.push(`%${category}%`);
  }
  billSql += ` GROUP BY item_name, size, grade, brand ORDER BY usage_count DESC LIMIT 20`;

  try {
    const fromBills = db.prepare(billSql).all(...billParams) as any[];
    const fromProducts = db.prepare(productSql).all(...prodParams) as any[];

    // Merge and deduplicate
    const map = new Map<string, any>();

    for (const item of fromBills) {
      const key = `${item.item_name}_${item.size || ''}_${item.grade || ''}_${item.brand || ''}`.toLowerCase();
      map.set(key, item);
    }
    for (const item of fromProducts) {
      const key = `${item.item_name}_${item.size || ''}_${item.grade || ''}_${item.brand || ''}`.toLowerCase();
      if (!map.has(key)) {
        map.set(key, item);
      }
    }

    const suggestions = Array.from(map.values()).slice(0, 25);
    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error('Suggest error:', err);
    return NextResponse.json({ suggestions: [] });
  }
}
