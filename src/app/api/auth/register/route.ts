import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import getDb from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }
    const db = getDb();
    const existing = db.prepare(`SELECT id FROM users WHERE email=?`).get(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    const hashed = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'CUSTOMER')`
    ).run(name, email, phone || null, hashed);
    const userId = result.lastInsertRowid as number;
    db.prepare(`INSERT INTO customers (user_id, name, phone) VALUES (?, ?, ?)`).run(userId, name, phone || '');
    const token = await signToken({ userId, email, role: 'CUSTOMER', name });
    const response = NextResponse.json({
      success: true,
      user: { id: userId, name, email, role: 'CUSTOMER' },
    });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
